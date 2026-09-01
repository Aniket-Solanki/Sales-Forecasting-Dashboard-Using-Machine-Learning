from app.worker.tasks import train_model_task, generate_forecast_task

print("Queueing ML tasks...")
train_model_task.delay()
generate_forecast_task.delay()
print("Tasks queued successfully!")
