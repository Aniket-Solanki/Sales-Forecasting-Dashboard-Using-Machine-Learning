from app.worker.tasks import train_model_task, generate_forecast_task

print("Training model synchronously...")
train_model_task()
print("Generating forecast synchronously...")
generate_forecast_task()
print("Done!")
