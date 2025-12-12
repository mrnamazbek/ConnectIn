FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML script
COPY *.py ./

# Run ML service (can be triggered by cron or run once)
CMD ["python", "connectin_ml_updated_version.py"]