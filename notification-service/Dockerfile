FROM golang:1.25.5-alpine AS builder
WORKDIR /app

# 1) Samo go.mod i go.sum (da cache ostane kad menjas kod)
COPY notification-service/go.mod notification-service/go.sum ./

# 2) shared-utils kao poseban layer
COPY shared-utils /shared-utils

# 3) Replace
RUN go mod edit -replace shared-utils=/shared-utils

# 4) Download deps (cached)
RUN go mod download

# 5) Tek sada ostatak koda
COPY notification-service/. .

# 6) Build
RUN CGO_ENABLED=0 GOOS=linux go build -o notification-service

# Runtime stage
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/notification-service .
EXPOSE 8003
CMD ["./notification-service"]
