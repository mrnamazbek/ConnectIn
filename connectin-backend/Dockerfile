# Use Alpine for a significantly smaller base image
FROM python:3.11-alpine AS builder

# Set build arguments for potential customization
ARG APP_ENV=production
ARG APP_DIR=/app

# Set work directory
WORKDIR ${APP_DIR}

# Install only the necessary build dependencies
# Use --no-cache to avoid storing the package index
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    jpeg-dev

# Copy and install requirements first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a second stage with minimal runtime dependencies
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_DIR=/app

WORKDIR ${APP_DIR}

# Install only runtime dependencies
RUN apk add --no-cache \
    pango \
    harfbuzz \
    jpeg \
    fontconfig \
    ttf-liberation \
    freetype \
    libpng \
    cairo

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x start.sh

# Set correct ownership
RUN chown -R appuser:appgroup ${APP_DIR}

# Switch to non-root user
USER appuser

# Run the application
CMD ["./start.sh"]