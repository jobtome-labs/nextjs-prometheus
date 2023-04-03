const instrumentWebFramework = require("./lib/import.js");
const express = require('express');
const { client } = require('./lib/prom.js')

instrumentWebFramework(
  "next/dist/server/next-server",
  require("./lib/next-server")
);
instrumentWebFramework("next/dist/server/render", require("./lib/render"));
instrumentWebFramework("next/dist/server/next-server", require("./lib/middleware"));


const app = express();
const port = process.env.METRICS_PORT || 9091;

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

app.listen(port, () => {
  console.log(`Metrics server is listening on port ${port}`);
});