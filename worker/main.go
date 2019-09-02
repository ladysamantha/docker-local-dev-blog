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
	log.Println("starting worker...")
	natsHost := os.Getenv("NATS_HOST")
	nc, err := nats.Connect(natsHost, nats.Name("Invoices Worker"))
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
		time.Sleep(2 * time.Second)
		if inv.Amount > 500.00 {
			log.Printf("rejecting invoice! id=%d amount=%f\n", inv.ID, inv.Amount)
			ec.Publish("invoices.rejected", inv)
			return
		}
		ec.Publish("invoices.approved", inv)
	})

	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)

	<-c
	log.Println("signal caught, draining connection")
	nc.Drain()
}
