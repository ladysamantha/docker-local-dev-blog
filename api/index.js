const express = require('express')

const port = Number.parseInt(process.env.PORT) || 3000

const app = express()

const shutdown = () => {
  console.log('gracefully shutting down server')
  app.close()
}

app.use('*', (req, res) => res.send('OK'))

if (require.main === module) {
  app.listen(port, () => console.log(`server listening on port ${port}`))

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
