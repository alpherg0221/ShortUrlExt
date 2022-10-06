# FROM golang:1.19.2-bullseye

# COPY ./ /app
# WORKDIR /app

# RUN go mod tidy
# RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM debian:bullseye

WORKDIR /app

RUN apt update && apt-get install -y \
    supervisor

COPY ./backend /app/app

# COPY --from=0 /app/app /app/app

# # --- supervisorに関する設定

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord"]
