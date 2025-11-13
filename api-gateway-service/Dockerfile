# ==============================
# Builder stage
# ==============================
FROM golang:1.21-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy Go module files first (if go.sum missing, go mod tidy will generate it)
COPY go.mod ./
RUN if [ -f go.sum ]; then echo "go.sum exists"; else touch go.sum; fi
RUN go mod tidy

# Copy the rest of the project
COPY . .

# Build the binary
RUN go build -o /bin/api-gateway ./cmd/server

# ==============================
# Minimal runtime stage
# ==============================
FROM alpine:latest
WORKDIR /app

# Copy binary from builder
COPY --from=builder /bin/api-gateway /app/api-gateway

# Expose the port your API runs on
EXPOSE 8080

# Run the binary
CMD ["./api-gateway"]
