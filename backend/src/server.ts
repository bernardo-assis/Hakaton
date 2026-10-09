import app from './app';
import { config } from './config/unifiedConfig';
import './db/database'; // Ensures DB connects on startup

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Running at http://localhost:${PORT}`);
});
