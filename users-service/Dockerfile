FROM golang:1.24-alpine AS builder
WORKDIR /app

# Kopiramo shared-utils
COPY shared-utils /shared-utils

# Kopiramo go mod fajlove
COPY users-service/go.mod users-service/go.sum ./

# Replace za shared-utils
RUN go mod edit -replace shared-utils=/shared-utils

RUN go mod download

# Kopiramo ostatak users-service koda
COPY users-service/. .

RUN CGO_ENABLED=0 GOOS=linux go build -o users-service

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/users-service .
EXPOSE 8001
CMD ["./users-service"]
