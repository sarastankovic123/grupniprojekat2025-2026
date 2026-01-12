FROM golang:1.25.5-alpine AS builder
WORKDIR /app

COPY shared-utils /shared-utils

COPY notification-service/go.mod notification-service/go.sum ./
RUN go mod edit -replace shared-utils=/shared-utils

RUN go mod download

COPY notification-service/. .

RUN CGO_ENABLED=0 GOOS=linux go build -o notification-service

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/notification-service .
EXPOSE 8003
CMD ["./notification-service"]
