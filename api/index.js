const express = require('express')

const port = Number.parseInt(process.env.PORT) || 3000

const app = express()

app.use('*', (req, res) => res.send('OK'))

if (require.main === module) {
  const server = app.listen(port, () => console.log(`server listening on port ${port}`))

  const shutdown = () => {
    console.log('gracefully shutting down server')
    server.close()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
