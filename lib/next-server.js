const shimmer = require("shimmer");
const { client } = require('./prom.js');

const prefix = process.env.NEXTJS_PROMETHEUS_PREFIX + "_" ?? "";

const httpRequestDurationSeconds = new client.Histogram({
  name: `${prefix}http_request_duration_seconds`,
  help: 'Duration of HTTP requests to API routes in seconds',
  labelNames: ['route'],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.9, 1],
});

const httpRequestsTotal = new client.Counter({
  name: `${prefix}http_requests_total`,
  help: 'Total number of HTTP requests to API routes',
  labelNames: ['route'],
});

const httpErrorsTotal = new client.Counter({
  name: `${prefix}http_errors_total`,
  help: 'Total number of HTTP errors in API routes',
  labelNames: ['route'],
});

module.exports = function initialize(nextServer) {
  const Server = nextServer.default;
  shimmer.wrap(Server.prototype, "runApi", function (originalFn) {
    return async function wrappedRunApi() {
      const [, , query, params, page] = arguments;
      let hasError = false
      let response;
      const startTime = performance.now();
      
      try {
        response = await originalFn.apply(this, arguments);
      } catch (error) {
        hasError = true;
      } finally {
        const endTime = performance.now();
        const durationInSeconds = (endTime - startTime) / 1000;
        httpRequestsTotal.labels(page).inc();
        httpRequestDurationSeconds.labels(page).observe(durationInSeconds);

        if (hasError) {
          httpErrorsTotal.labels(page).inc();
          return 
        }
      }

      return response
    };
  });
};
