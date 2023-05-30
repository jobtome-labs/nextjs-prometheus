const client = require("prom-client");

// client.collectDefaultMetrics({
//     prefix: process.env.NEXTJS_PROMETHEUS_PREFIX + "_" ?? ""
// });

module.exports = {
  client,
};
