# ------------------------------
# Builder Stage: golang:1.25-alpine
# ------------------------------
FROM golang:1.25-alpine AS builder

WORKDIR /app

# 1. Dependency Layer: Copy only go.mod
COPY go.mod ./

# 2. Fix missing go.sum and download modules
RUN if [ ! -f go.sum ]; then echo "go.sum missing, creating placeholder."; touch go.sum; fi \
    && go mod download

# 3. Copy the rest of the project source code
COPY . .

# 4. Finalize the build
# CGO_ENABLED=0 is essential for Alpine base image compatibility
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /bin/api-gateway ./cmd/server

# ------------------------------
# Minimal Runtime Stage
# ------------------------------
FROM alpine:latest
WORKDIR /app

COPY --from=builder /bin/api-gateway /app/api-gateway
EXPOSE 8080
CMD ["./api-gateway"]