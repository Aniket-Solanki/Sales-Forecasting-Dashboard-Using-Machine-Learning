from typing import Any

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_active_user
from app.worker.tasks import train_model_task, generate_forecast_task

router = APIRouter()


@router.post("/train", status_code=status.HTTP_202_ACCEPTED)
async def trigger_training(
    current_user: Any = Depends(get_current_active_user),
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
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """Trigger background Celery task to generate 30-day forecast predictions."""
    task = generate_forecast_task.delay()
    return {
        "status": "Accepted",
        "task_id": task.id,
        "detail": "Future 30-day forecasting task successfully queued in Celery worker."
    }
