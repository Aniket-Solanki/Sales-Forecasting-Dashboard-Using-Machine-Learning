from typing import Any

from fastapi import APIRouter, Depends, status

from app.api.deps import check_admin_role
from app.worker.tasks import train_model_task, generate_forecast_task

router = APIRouter()


@router.post("/train", status_code=status.HTTP_202_ACCEPTED)
async def trigger_training(
    admin_user: Any = Depends(check_admin_role),
) -> Any:
    """Trigger background Celery task to retrain the forecasting model."""
    task = train_model_task.delay()
    return {
        "status": "Accepted",
        "task_id": task.id,
        "detail": "Model retraining task successfully queued in Celery worker."
    }


@router.post("/predict", status_code=status.HTTP_202_ACCEPTED)
async def trigger_forecasting(
    admin_user: Any = Depends(check_admin_role),
) -> Any:
    """Trigger background Celery task to generate 30-day forecast predictions."""
    task = generate_forecast_task.delay()
    return {
        "status": "Accepted",
        "task_id": task.id,
        "detail": "Future 30-day forecasting task successfully queued in Celery worker."
    }
