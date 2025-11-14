# ------------------------------
# Builder Stage: golang:1.25-alpine
# This stage compiles the Go application.
# ------------------------------
FROM golang:1.25-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# 1. Dependency Layer: Copy only go.mod (guaranteed to exist)
#    This step uses caching for dependencies, which is fast.
COPY go.mod ./

# 2. Handle go.sum creation and download dependencies
#    If go.sum is missing from the local context, we create it using 'touch'.
#    We then use 'go mod download' to fetch dependencies based on go.mod.
RUN if [ ! -f go.sum ]; then echo "go.sum missing, creating placeholder."; touch go.sum; fi \
    && go mod download

# 3. Copy the rest of the source code
#    This invalidates the cache only when source code changes.
COPY . .

# 4. Finalize the build
#    'go mod tidy' removes unused dependencies added by 'go mod download'
#    'go build' compiles the application into a static binary.
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /bin/api-gateway ./cmd/server

# ------------------------------
# Minimal Runtime Stage: alpine:latest
# This stage runs the compiled binary in a tiny, secure image.
# ------------------------------
FROM alpine:latest
WORKDIR /app

# Copy the static binary from the builder stage
COPY --from=builder /bin/api-gateway /app/api-gateway

# Expose the port your API runs on
EXPOSE 8080

# Command to run the application
CMD ["./api-gateway"]
