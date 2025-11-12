# Usage
1. Start with docker-compose:
```sh
docker compose -f docker-compose.example.yml up --build
```
2. Send a request:
```sh
curl -X POST http://localhost:8080/v1/notifications/send \
-H "Content-Type: application/json" \
-d '{"type":"email","template_id":"welcome_v1","recipient":{"email":"you@example.com"},"variables":{"name":"Shedrack"}}'
```