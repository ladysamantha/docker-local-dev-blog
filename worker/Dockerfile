FROM golang:1.12.9

ARG CGO_ENABLED=0
ARG GOOS=linux
ARG GOARCH=amd64

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=${CGO_ENABLED} GOOS=${GOOS} GOARCH=${GOARCH} go build -a -installsuffix cgo -o worker .

FROM alpine:latest
WORKDIR /app
COPY --from=0 /app/worker .
ENTRYPOINT [ "/app/worker" ]
