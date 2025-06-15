import { checkHandler } from './app/handlers/checkHandler.js';
import { sampleHandler } from './app/handlers/sampleHandler.js';
import { tokenHandler } from './app/handlers/tokenHandler.js';
import { userHandler } from './app/handlers/userHandler.js';

// route definitions
const routes = {
  sample: sampleHandler,
  user: userHandler,
  token: tokenHandler,
  check: checkHandler,
};

// export routes
export default routes;
