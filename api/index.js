if (!process.env.NATS_HOST || process.env.NATS_HOST === '') {
  throw new Error('NATS_HOST not provided')
}

if (!process.env.REDIS_HOST || process.env.REDIS_HOST === '') {
  throw new Error('REDIS_HOST not provided')
}

const express = require('express')
const nats = require('nats')
const ioredis = require('ioredis')

const natsConnection = nats.connect(process.env.NATS_HOST, { json: true })
const redis = new ioredis({ host: process.env.REDIS_HOST })

const port = Number.parseInt(process.env.PORT) || 3000

const approvedSubID = natsConnection.subscribe('invoices.approved', async msg => {
  const invoice = {
    ...msg,
    status: 'approved',
  }
  await redis.hset('invoices', msg.id, JSON.stringify(invoice))
})

const rejectedSubID = natsConnection.subscribe('invoices.rejected', async msg => {
  const invoice = {
    ...msg,
    status: 'rejected',
  }
  await redis.hset('invoices', msg.id, JSON.stringify(invoice))
})

const app = express()

app.use(express.json())

app.get('/invoice', async (req, res) => {
  const invoices = await redis.hgetall('invoices')
  Object.keys(invoices)
    .forEach(key => {
      const invoiceBody = invoices[key]
      invoices[key] = JSON.parse(invoiceBody)
    })
  return res.json(invoices)
})

app.get('/invoice/:id', async (req, res) => {
  const invoiceBody = await redis.hget('invoices', req.params.id)
  const invoice = JSON.parse(invoiceBody)

  return res.json(invoice)
})

app.post('/invoice', async (req, res) => {
  const invoice = {
    ...req.body,
    status: 'requested',
  }
  await redis.hset('invoices', invoice.id, JSON.stringify(invoice))
  natsConnection.publish('invoices.requested', invoice)
  return res.status(201).end()
})

if (require.main === module) {
  const server = app.listen(port, () => console.log(`server listening on port ${port}`))

  const shutdown = () => {
    console.log('gracefully shutting down server')
    nats.unsubscribe(approvedSubID)
    nats.unsubscribe(rejectedSubID)
    nats.close()
    server.close()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
