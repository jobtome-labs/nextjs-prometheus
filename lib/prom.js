const client = require('prom-client');

client.collectDefaultMetrics();

module.exports = {
    client
}