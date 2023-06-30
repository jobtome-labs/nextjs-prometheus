var shimmer = require("shimmer");
const { performance } = require("perf_hooks");
const { client } = require("./prom.js");

const prefix = process.env.NEXTJS_PROMETHEUS_PREFIX ? process.env.NEXTJS_PROMETHEUS_PREFIX + "_" : "";

const httpRequestDurationSeconds = new client.Histogram({
  name: `${prefix}gssp_duration_seconds`,
  help: "Duration of getServerSideProps in seconds",
  labelNames: ["route"],
  buckets: [0.01, 0.03, 0.05, 0.1, 0.9, 1],
});

const httpRequestsTotal = new client.Counter({
  name: `${prefix}gssp_requests_total`,
  help: "Total number of getServerSideProps requests",
  labelNames: ["route"],
});

const httpErrorsTotal = new client.Counter({
  name: `${prefix}gssp_errors_total`,
  help: "Total number of getServerSideProps errors",
  labelNames: ["route"],
});

const fnApply = Function.prototype.apply;
function isFunction(obj) {
  return typeof obj === "function";
}

function record(nodule, properties, recordNamer) {
  if (isFunction(properties)) {
    recordNamer = properties;
    properties = null;
  }

  return shimmer.wrap(nodule, properties, function makeWrapper(fn, name) {
    return async function wrapper() {
      const startTime = performance.now();
      let gssp;
      let hasError = false;

      try {
        gssp = await fnApply.call(fn, this, arguments);
      } catch (error) {
        hasError = true;
        throw error;
      } finally {
        const endTime = performance.now();

        const { page: routeName } = await recordNamer.call(this, fn, name, arguments);

        const durationInSeconds = (endTime - startTime) / 1000;
        httpRequestsTotal.labels(routeName).inc();
        httpRequestDurationSeconds.labels(routeName).observe(durationInSeconds);

        if (hasError) {
          httpErrorsTotal.labels(routeName).inc();
        }
      }

      return gssp;
    };
  });
}

module.exports = function initialize(render) {
  try {
    record(render, "renderToHTML", async function renderToHTMLRecorder(renderToHTML, name, [req, , page, , ctx]) {
      // Check if the request URL includes a utm_source query parameter
      if (req.url.includes("utm_source")) {
        // utmSourceCounter.inc();
      }
      const isDynamicPath = page.includes("[");

      return {
        page: isDynamicPath ? ctx.resolvedUrl.split("?")[0] : page,
      };
    });
  } catch (error) {
    throw error;
  }
};
