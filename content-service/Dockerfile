FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY shared-utils /shared-utils

COPY content-service/go.mod content-service/go.sum ./
RUN go mod edit -replace shared-utils=/shared-utils

RUN go mod download

COPY content-service/. .

RUN CGO_ENABLED=0 GOOS=linux go build -o content-service

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/content-service .
EXPOSE 8002
CMD ["./content-service"]
