# ------------------------------
# Builder Stage: golang:1.25-alpine
# ------------------------------
FROM golang:1.25-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# 1. Dependency Layer: Copy only go.mod (guaranteed to exist)
COPY go.mod ./

# 2. Fix the missing go.sum and download modules
# The "touch go.sum" creates the file if it's missing from the build context.
# The 'go mod download' command populates go.sum and fetches dependencies.
RUN if [ ! -f go.sum ]; then touch go.sum; fi \
    && go mod download

# 3. Copy the rest of the project source code
# This step is cheap and runs only if the source code (the rest of the files) changes.
COPY . .

# 4. Finalize the build
# CGO_ENABLED=0 creates a static binary suitable for minimal images like Alpine.
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /bin/api-gateway ./cmd/server

# ------------------------------
# Minimal Runtime Stage
# ------------------------------
FROM alpine:latest
WORKDIR /app

# Copy binary from builder
COPY --from=builder /bin/api-gateway /app/api-gateway

# Expose the port your API runs on
EXPOSE 8080

# Run the binary
CMD ["./api-gateway"]
