FROM golang:1.25-alpine AS builder
WORKDIR /app

# kopiramo go.mod/go.sum za oba modula da bi go mod download radio
COPY content-service/go.mod content-service/go.sum ./content-service/
COPY shared-utils/go.mod shared-utils/go.sum ./shared-utils/

# go mod download mora da se izvrši iz content-service modula
WORKDIR /app/content-service
RUN go mod download

# sad kopiramo ceo kod
WORKDIR /app
COPY content-service ./content-service
COPY shared-utils ./shared-utils

WORKDIR /app/content-service
RUN go build -o /out/content-service .

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /out/content-service /app/content-service
EXPOSE 8002
CMD ["/app/content-service"]
