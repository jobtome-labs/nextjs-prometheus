# Prometheus NextJS instrumentation

This module provides prometheus instrumentation for server-side rendering via [getServerSideProps](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props), [middleware](https://nextjs.org/docs/middleware), [api](https://nextjs.org/docs/api-routes/introduction)


**Note**: Due to his nature the minimum supported Next.js version is [12.0.9](https://github.com/vercel/next.js/releases/tag/v12.0.9).  If you are using Next.js middleware the minimum supported version is [12.2.0](https://github.com/vercel/next.js/releases/tag/v12.2.0). Currently is **not** supporting the new [App Route](https://beta.nextjs.org/docs/routing/fundamentals). Open a new [issue](https://github.com/jobtome-labs/nextjs-prometheus/issues/new) if you need such support.

## What is all about
nextjs-prometheus is instrumenting prometheus by monkey-patching the nextJS modules responsibile for SSR operations. It is currently wrapping:

* [next-server](https://github.com/jobtome-labs/nextjs-prometheus/blob/main/lib/next-server.js)
* [renderToHTML](https://github.com/jobtome-labs/nextjs-prometheus/blob/main/lib/render.js)
* [middlewares](https://github.com/jobtome-labs/nextjs-prometheus/blob/main/lib/next-server.js)

It is also collecting the child process metrics using _collectDefaultMetrics_ from <code>prom-client</code>

## Why Monkeypatching

**Disclaimer** monkey-patching relies on the internal implementation of a module, which may change over time, leading to compatibility and maintenance issues.

Monkey-patching for Application Performance Monitoring (APM) provides a powerful and flexible approach, enabling seamless integration and deep insights into your application's inner workings without disrupting its original structure, ultimately enhancing observability and optimizing performance.


### How to use it
To use this library you can add the following script to your _package.json_

```json
 "start": "NODE_OPTIONS='--require nextjs-prometheus' next start",
```

### Other alternatives

Another aproach would be to wrap the method you wanna track in a HOF. Here I leave an example for getServerSideProps.


```javascript
// withPrometheusMetrics.js
function withPrometheusMetrics(getServerSidePropsFunction) {
  return async function (context) {
    const start = process.hrtime();

    // Call the original getServerSideProps function
    const result = await getServerSidePropsFunction(context);

    // Calculate the duration of the call
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    // Update Prometheus metrics
    getServerSidePropsCounter.inc();
    getServerSidePropsHistogram.observe(duration);

    return result;
  };
}

module.exports = withPrometheusMetrics;
```

You can then use the HOF inside your pages.


```javascript
// pages/yourPage.js
import withPrometheusMetrics from '../withPrometheusMetrics';

export async function getServerSideProps(context) {
  // Your original getServerSideProps logic
}

export default withPrometheusMetrics(getServerSideProps);
```