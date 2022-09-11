FROM python:3.10.7-slim


WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY main.py /app/

COPY logic/ /app/logic

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]