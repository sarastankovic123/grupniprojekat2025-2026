FROM golang:1.25-alpine AS builder
WORKDIR /app

# kopiramo go.mod/go.sum za oba modula da bi go mod download radio
COPY users-service/go.mod users-service/go.sum ./users-service/
COPY shared-utils/go.mod shared-utils/go.sum ./shared-utils/

# go mod download mora da se izvrši iz users-service modula
WORKDIR /app/users-service
RUN go mod download

# sad kopiramo ceo kod
WORKDIR /app
COPY users-service ./users-service
COPY shared-utils ./shared-utils

WORKDIR /app/users-service
RUN go build -o /out/users-service .

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /out/users-service /app/users-service
EXPOSE 8001
CMD ["/app/users-service"]
