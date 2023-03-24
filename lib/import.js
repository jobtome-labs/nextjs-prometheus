const path = require("path");

module.exports = function instrumentWebFramework(
  moduleName,
  instrumentFunction
) {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const modulePath = require.resolve(moduleName, {
    paths: [nodeModulesPath],
  });

  const module = require(modulePath)
  instrumentFunction(module);
};
