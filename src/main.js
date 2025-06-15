import { init as startServer } from './app/lib/server.js';
import { init as startWorkers } from './app/lib/worker.js';

// app object - module scaffolding
const app = {
  init() {
    // Start the server
    startServer();

    // Start the workers
    startWorkers();
  },
};

// Initialize the app
app.init();

// Export the app
export default app;
