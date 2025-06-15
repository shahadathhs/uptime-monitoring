import http from 'http';
import reqResHandler from '../handlers/reqResHandler';

// Server configuration
const config = {
  port: 3000,
};

// Create and start HTTP server
const createServer = () => {
  const server = http.createServer(reqResHandler.handler);
  server.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);
  });
};

// Server module object
const serverApp = {
  init() {
    createServer();
  },
};

export default serverApp;
