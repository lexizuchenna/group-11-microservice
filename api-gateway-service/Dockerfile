# Use official Golang image
FROM golang:1.21-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy Go module files first
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the project
COPY . .

# Build the Go binary
RUN go build -o /bin/api-gateway ./cmd/server

# Use a minimal image for runtime
FROM alpine:latest
WORKDIR /app

# Copy binary from builder
COPY --from=builder /bin/api-gateway /app/api-gateway

# Expose the port your service listens on
EXPOSE 8080

# Start the app
CMD ["./api-gateway"]
