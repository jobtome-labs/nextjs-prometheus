const shimmer = require("shimmer");
const { client } = require("./prom.js");

const prefix = process.env.NEXTJS_PROMETHEUS_PREFIX + "_" ?? "";

const httpRequestDurationSeconds = new client.Histogram({
  name: `${prefix}middleware_http_request_duration_seconds`,
  help: "Duration of HTTP requests to middleware in seconds",
  labelNames: ["mw"],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.9, 1],
});

const httpRequestsTotal = new client.Counter({
  name: `${prefix}middleware_http_requests_total`,
  help: "Total number of HTTP requests to middleware",
  labelNames: ["mw"],
});

const httpErrorsTotal = new client.Counter({
  name: `${prefix}middleware_http_errors_total`,
  help: "Total number of HTTP errors in middleware",
  labelNames: ["mw"],
});

module.exports = function initialize(nextServer) {
  const Server = nextServer.default;
  shimmer.wrap(Server.prototype, "runMiddleware", function middlewareRecorder(originalMiddleware) {
    return async function wrappedMiddleware(...args) {
      const startTime = performance.now();
      const middlewarePath = args[0].parsed.path.split("?")[0];
      let hasError = false;
      let result;

      try {
        result = await originalMiddleware.apply(this, args);
      } catch (error) {
        hasError = true;
      } finally {
        const endTime = performance.now();
        const durationInSeconds = (endTime - startTime) / 1000;
        httpRequestsTotal.labels(middlewarePath).inc();
        // httpRequestDurationSeconds.labels(middlewarePath).observe(durationInSeconds);

        if (hasError) {
          httpErrorsTotal.labels(middlewarePath).inc();
          return;
        }
      }

      return result;
    };
  });
};
