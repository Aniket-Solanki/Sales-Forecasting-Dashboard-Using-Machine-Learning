from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Upstash Redis native TLS configurations
    broker_use_ssl={"ssl_cert_reqs": "NONE"} if "rediss://" in settings.REDIS_URL else None,
    redis_backend_use_ssl={"ssl_cert_reqs": "NONE"} if "rediss://" in settings.REDIS_URL else None,
)

# Auto-discover tasks from worker folder
celery_app.autodiscover_tasks(["app.worker"])
