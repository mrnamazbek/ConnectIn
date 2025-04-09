# Stage 1: Build dependencies
FROM python:3.10-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libffi-dev \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libjpeg-dev \
    libopenjp2-7-dev \
    shared-mime-info
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final image
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libffi-dev \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libjpeg-dev \
    libopenjp2-7-dev \
    shared-mime-info
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT