# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    pango1.0-tools \
    libpango1.0-dev \
    libharfbuzz-dev \
    libpangoft2-1.0-0

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy and make the start script executable
COPY start.sh .
RUN chmod +x start.sh

# Run the application
CMD ["./start.sh"]