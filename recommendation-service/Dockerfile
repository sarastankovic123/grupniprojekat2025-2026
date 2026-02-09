FROM golang:1.24-alpine AS builder
WORKDIR /app

# 1) Samo go.mod i go.sum (da se cache ne puca kad menjas kod)
COPY recommendation-service/go.mod recommendation-service/go.sum* ./

# 2) shared-utils kao poseban layer
COPY shared-utils /shared-utils

# 3) Replace
RUN go mod edit -replace shared-utils=/shared-utils

# 4) Download deps (cached)
RUN go mod download

# 5) Tek sada ostatak koda
COPY recommendation-service/. .

# 6) Build
RUN CGO_ENABLED=0 GOOS=linux go build -o recommendation-service

# Runtime
FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/recommendation-service .
EXPOSE 8004
CMD ["./recommendation-service"]
