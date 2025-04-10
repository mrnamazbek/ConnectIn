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
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libharfbuzz-gobject0 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev

# Install fonts
RUN fc-cache -f -v

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