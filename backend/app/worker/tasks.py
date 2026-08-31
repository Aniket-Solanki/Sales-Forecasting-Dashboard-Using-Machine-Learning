import io
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sqlalchemy import delete, and_
from sqlalchemy.future import select

from app.db.session import sync_session_factory
from app.models.forecast import Forecast
from app.models.ml_model import MLModel
from app.models.product import Product
from app.models.sales_history import SalesHistory
from app.worker.celery_app import celery_app


@celery_app.task(name="app.worker.tasks.train_model_task")
def train_model_task() -> dict:
    """Train the forecasting model using live sales history and store it in PostgreSQL."""
    print("Celery Worker: Starting model training...")
    session = sync_session_factory()
    try:
        # 1. Fetch raw data from database
        products = session.scalars(select(Product)).all()
        sales_records = session.scalars(select(SalesHistory)).all()

        if not products or not sales_records:
            return {"status": "failed", "detail": "Insufficient products or sales data to train."}

        # Convert to Pandas
        df_sales = pd.DataFrame([
            {
                "id": s.id,
                "product_id": str(s.product_id),
                "date": pd.to_datetime(s.date),
                "units_sold": s.units_sold,
                "revenue": float(s.revenue)
            } for s in sales_records
        ])

        # 2. Run Imputation
        imputed_dfs = []
        min_date = df_sales['date'].min()
        max_date = df_sales['date'].max()
        full_date_range = pd.date_range(start=min_date, end=max_date, freq='D')

        for product_id in df_sales['product_id'].unique():
            product_full = pd.DataFrame({
                'date': full_date_range,
                'product_id': product_id
            })
            prod_sales = df_sales[df_sales['product_id'] == product_id]
            merged = pd.merge(product_full, prod_sales, on=['product_id', 'date'], how='left')
            merged['units_sold'] = merged['units_sold'].fillna(0).astype(int)
            merged['revenue'] = merged['revenue'].fillna(0.0).astype(float)
            imputed_dfs.append(merged)

        df_clean = pd.concat(imputed_dfs, ignore_index=True)
        df_clean = df_clean.sort_values(by=['product_id', 'date']).reset_index(drop=True)

        # 3. Feature Engineering
        df_clean['sales_lag_1'] = df_clean.groupby('product_id')['units_sold'].shift(1)
        df_clean['sales_lag_7'] = df_clean.groupby('product_id')['units_sold'].shift(7)
        df_clean['sales_lag_30'] = df_clean.groupby('product_id')['units_sold'].shift(30)

        df_clean['sales_roll_mean_7'] = df_clean.groupby('product_id')['units_sold'].transform(
            lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
        )
        df_clean['sales_roll_std_30'] = df_clean.groupby('product_id')['units_sold'].transform(
            lambda x: x.shift(1).rolling(window=30, min_periods=1).std()
        )

        df_clean['day_of_week'] = df_clean['date'].dt.dayofweek
        df_clean['is_weekend'] = df_clean['day_of_week'].isin([5, 6]).astype(int)
        df_clean['month'] = df_clean['date'].dt.month
        df_clean['is_holiday'] = ((df_clean['month'] == 11) & (df_clean['date'].dt.day >= 20) | 
                                  (df_clean['month'] == 12)).astype(int)

        df_features = df_clean.dropna().reset_index(drop=True)

        # 4. Train/Test Split
        split_date = df_features['date'].max() - timedelta(days=30)
        train_df = df_features[df_features['date'] <= split_date]
        test_df = df_features[df_features['date'] > split_date]

        features = [
            'sales_lag_1', 'sales_lag_7', 'sales_lag_30', 
            'sales_roll_mean_7', 'sales_roll_std_30',
            'day_of_week', 'is_weekend', 'month', 'is_holiday'
        ]
        target = 'units_sold'

        X_train, y_train = train_df[features], train_df[target]
        X_test, y_test = test_df[features], test_df[target]

        # 5. Train Model
        model = xgb.XGBRegressor(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        model.fit(X_train, y_train)

        # 6. Evaluate
        preds = np.clip(model.predict(X_test), 0, None)
        actuals = y_test.values
        mask = actuals > 0
        mape = float(np.mean(np.abs((actuals[mask] - preds[mask]) / actuals[mask])) * 100) if any(mask) else 0.0

        # 7. Serialize and Save directly to Neon Database (Model Registry)
        buffer = io.BytesIO()
        joblib.dump(model, buffer)
        model_bytes = buffer.getvalue()

        # Save to database
        model_version = f"xgb_model_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        new_registry_entry = MLModel(
            model_version=model_version,
            model_binary=model_bytes,
            mape=mape
        )
        session.add(new_registry_entry)
        session.commit()

        print(f"Celery Worker: Model {model_version} successfully saved to DB. MAPE: {mape:.2f}%")
        return {"status": "success", "model_version": model_version, "mape": mape}
    except Exception as e:
        session.rollback()
        print(f"Celery Worker Exception during training: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        session.close()


@celery_app.task(name="app.worker.tasks.generate_forecast_task")
def generate_forecast_task() -> dict:
    """Generate 30-day sales forecast predictions using the latest model registry entry."""
    print("Celery Worker: Starting forecasting...")
    session = sync_session_factory()
    try:
        # 1. Fetch latest model from database
        model_entry = session.scalars(
            select(MLModel).order_by(MLModel.created_at.desc()).limit(1)
        ).first()

        if not model_entry:
            return {"status": "failed", "detail": "No trained model found in the database. Run training first."}

        # Deserialize XGBoost Model
        buffer = io.BytesIO(model_entry.model_binary)
        model = joblib.load(buffer)

        # 2. Get Products and actual sales to construct forecasting lags
        products = session.scalars(select(Product)).all()
        forecasts_created = 0

        for product in products:
            # Delete any existing forecast predictions for this product
            session.execute(delete(Forecast).where(Forecast.product_id == product.id))

            # Fetch last 30 days of actual sales to calculate lag features
            recent_sales = session.scalars(
                select(SalesHistory)
                .where(SalesHistory.product_id == product.id)
                .order_by(SalesHistory.date.desc())
                .limit(30)
            ).all()

            if not recent_sales:
                continue

            # Convert to Dataframe to construct lags
            df_recent = pd.DataFrame([
                {"date": pd.to_datetime(s.date), "units_sold": s.units_sold} for s in recent_sales
            ]).sort_values("date").reset_index(drop=True)

            # Generate 30 days into the future
            start_forecast_date = date.today()
            records = []

            for offset in range(30):
                forecast_date = start_forecast_date + timedelta(days=offset)
                forecast_dt = pd.to_datetime(forecast_date)

                # Extract lag values from our historical dataframe
                sales_lag_1 = float(df_recent.iloc[-1]["units_sold"]) if len(df_recent) >= 1 else 0.0
                sales_lag_7 = float(df_recent.iloc[-7]["units_sold"]) if len(df_recent) >= 7 else 0.0
                sales_lag_30 = float(df_recent.iloc[-30]["units_sold"]) if len(df_recent) >= 30 else 0.0

                # Compute rolling averages
                sales_roll_mean_7 = float(df_recent.iloc[-7:]["units_sold"].mean()) if len(df_recent) >= 7 else 0.0
                sales_roll_std_30 = float(df_recent.iloc[-30:]["units_sold"].std()) if len(df_recent) >= 30 else 0.0
                if np.isnan(sales_roll_std_30):
                    sales_roll_std_30 = 0.0

                day_of_week = forecast_dt.dayofweek
                is_weekend = 1 if day_of_week in (5, 6) else 0
                month = forecast_dt.month
                is_holiday = 1 if (month == 11 and forecast_dt.day >= 20) or month == 12 else 0

                # Build feature vector matching model features exactly
                X_pred = pd.DataFrame([{
                    'sales_lag_1': sales_lag_1,
                    'sales_lag_7': sales_lag_7,
                    'sales_lag_30': sales_lag_30,
                    'sales_roll_mean_7': sales_roll_mean_7,
                    'sales_roll_std_30': sales_roll_std_30,
                    'day_of_week': day_of_week,
                    'is_weekend': is_weekend,
                    'month': month,
                    'is_holiday': is_holiday
                }])

                # Predict next step
                pred_units = float(np.clip(model.predict(X_pred)[0], 0, None))

                # Simple confidence interval bounds computation (e.g. +/- 1.96 * rolling standard deviation)
                margin = 1.96 * sales_roll_std_30 if sales_roll_std_30 > 0 else 2.0
                lower_bound = float(np.clip(pred_units - margin, 0, None))
                upper_bound = float(pred_units + margin)

                # Store forecast record in DB
                forecast_record = Forecast(
                    product_id=product.id,
                    forecast_date=forecast_date,
                    predicted_units=pred_units,
                    lower_bound=lower_bound,
                    upper_bound=upper_bound,
                    model_version=model_entry.model_version
                )
                session.add(forecast_record)
                records.append(forecast_record)

                # Feed predicted sales back into df_recent so we can recursively predict subsequent days
                new_row = pd.DataFrame([{"date": forecast_dt, "units_sold": int(pred_units)}])
                df_recent = pd.concat([df_recent, new_row], ignore_index=True)

            forecasts_created += len(records)

        session.commit()
        print(f"Celery Worker: Generated {forecasts_created} predictions for future 30-day timeline.")
        return {"status": "success", "predictions_count": forecasts_created}
    except Exception as e:
        session.rollback()
        print(f"Celery Worker Exception during forecasting: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        session.close()
