package main

import (
	"github.com/nats-io/nats.go"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type invoice struct {
	ID        int     `json:"id"`
	Amount    float64 `json:"amount"`
	Requestor string  `json:"requestor"`
}

func main() {
	nc, err := nats.Connect("nats", nats.Name("Invoices Worker"))
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	ec, err := nats.NewEncodedConn(nc, nats.JSON_ENCODER)
	if err != nil {
		log.Fatal(err)
	}
	defer ec.Close()

	log.Println("connected to nats!")
	ec.Subscribe("invoices.requested", func(inv *invoice) {
		log.Printf("received invoice approval request for invoice %d\n", inv.ID)
		time.Sleep(1 * time.Second)
		ec.Publish("invoices.approved", inv)
	})

	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)

	<-c
	log.Println("signal caught, draining connection")
	nc.Drain()
}
