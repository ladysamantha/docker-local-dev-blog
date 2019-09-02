FROM golang:1.12.9 AS dev

ARG CGO_ENABLED=0
ARG GOOS=linux
ARG GOARCH=amd64

WORKDIR /app
RUN go get github.com/zephinzer/godev
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=${CGO_ENABLED} GOOS=${GOOS} GOARCH=${GOARCH} go build -a -installsuffix cgo -o worker .

FROM alpine:latest AS final
WORKDIR /app
COPY --from=dev /app/worker .
ENTRYPOINT [ "/app/worker" ]
