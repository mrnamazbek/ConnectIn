# connectin-ml_service/Dockerfile

# 1. Базовый образ (оставляем)
ARG PYTHON_VERSION=3.11
FROM public.ecr.aws/lambda/python:3.11

# 2. Системные переменные (оставляем)
ENV PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    PYTHONUNBUFFERED=1
    # PYTHONPATH="${PYTHONPATH}:/opt/python" # Можно оставить или убрать

# 3. Устанавливаем системные зависимости через YUM <--- ИЗМЕНЕНО
RUN yum update -y && \
    yum install -y \
        gcc \
        gcc-c++ \
        make \
        postgresql-devel \
        curl \
    && yum clean all && \
    rm -rf /var/cache/yum

# 4. Установка Lambda RIC - НЕ НУЖНА (удалена или закомментирована)
# RUN pip install --no-cache-dir awslambdaric

# 5. Копируем и устанавливаем Python зависимости (оставляем)
# WORKDIR /var/task # Можно убрать
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Копируем код скрипта (оставляем)
COPY connectin_ml_updated_version.py .

# 7. Указываем обработчик (оставляем)
CMD ["connectin_ml_updated_version.lambda_handler"]