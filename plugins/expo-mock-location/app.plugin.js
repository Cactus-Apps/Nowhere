const { withMockLocation } = require('./plugin/index');

module.exports = function (config) {
  return withMockLocation(config);
};
