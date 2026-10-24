FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN useradd -m -u 1001 dinar && \
    chown -R dinar:dinar /app

USER dinar

EXPOSE 3002

CMD ["python", "server.py"]
