# ------------------------------
# Builder Stage: golang:1.25-alpine
# This stage compiles the Go application.
# ------------------------------
FROM golang:1.25-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# 1. Dependency Layer: Copy only go.mod
COPY go.mod ./

# 2. Fix missing go.sum, download modules, and run tidy
# The line below is fixed: all spaces are standard ASCII spaces.
# It creates go.sum if missing, then populates it with dependencies.
RUN if [ ! -f go.sum ]; then echo "Creating go.sum placeholder."; touch go.sum; fi \
    && go mod download \
    && go mod tidy

# 3. Copy the rest of the project source code
COPY . .

# 4. Finalize the build
# CGO_ENABLED=0 is essential for creating a static binary compatible with Alpine.
RUN CGO_ENABLED=0 go build -o /bin/api-gateway ./cmd/server

# ------------------------------
# Minimal Runtime Stage
# This stage runs the compiled binary in a tiny, secure image.
# ------------------------------
FROM alpine:latest
WORKDIR /app

# Copy the static binary from the builder stage
COPY --from=builder /bin/api-gateway /app/api-gateway

# Expose the port your API runs on (must match the Go application listener)
EXPOSE 8080

# Command to run the application when the container starts
CMD ["./api-gateway"]