FROM python:3.10.7-slim

# 重いのでまっさきにインストールしておく
RUN apt-get update && apt-get install -y \
    libopencv-dev 

# --- ここから上はできるだけ編集しないこと推奨(RUNが複数に別れてしまうが...)

# --- Pythonの環境に関する設定

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# --- その他の動作に関係するバイナリのインストール

RUN apt-get install -y \
    curl \
    supervisor

RUN curl -LJ "https://github.com/suyashkumar/ssl-proxy/releases/download/v0.2.7/ssl-proxy-linux-amd64.tar.gz" | tar xvz
RUN mv ssl-proxy-linux-amd64 ssl-proxy

# --- メインのアプリケーションのインストール

COPY main.py /app/

COPY logic/ /app/logic
COPY task/ /app/task

# --- supervisorに関する設定

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# CMD ["/usr/bin/supervisord"]


ENV GOOGLE_APPLICATION_CREDENTIALS /app/task/mws2022-cred.json

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]