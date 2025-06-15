// dependencies
const { sampleHandler } = require('./app/handlers/sampleHandler');
const { userHandler } = require('./app/handlers/userHandler');
const { tokenHandler } = require('./app/handlers/tokenHandler');
const { checkHandler } = require('./app/handlers/checkHandler');

const routes = {
  sample: sampleHandler,
  user: userHandler,
  token: tokenHandler,
  check: checkHandler,
};

module.exports = routes;
