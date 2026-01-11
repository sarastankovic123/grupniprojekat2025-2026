FROM golang:1.25-alpine AS builder
WORKDIR /app

# 1) Kopiraj module (go.mod/go.sum) iz podfoldera
COPY notification-service/go.mod notification-service/go.sum ./notification-service/

# Ako notification-service koristi shared-utils (u go.mod ima replace ../shared-utils), otkomentariši ova 2 reda:
COPY shared-utils/go.mod shared-utils/go.sum ./shared-utils/

# 2) Download dependencies iz notification-service modula
WORKDIR /app/notification-service
RUN go mod download

# 3) Kopiraj kod
WORKDIR /app
COPY notification-service ./notification-service

# Ako koristi shared-utils, kopiraj i njega:
COPY shared-utils ./shared-utils

# 4) Build
WORKDIR /app/notification-service
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/notification-service .

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /out/notification-service ./notification-service
EXPOSE 8003
CMD ["./notification-service"]
