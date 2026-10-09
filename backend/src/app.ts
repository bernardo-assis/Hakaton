import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import vaultRoutes from './routes/vaultRoutes';
import agentRoutes from './routes/agentRoutes';
import transactionRoutes from './routes/transactionRoutes';

import rateLimit from 'express-rate-limit';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' }
});

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use(cors());
app.use(express.json());
app.use(limiter);

app.use('/api/users', userRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/transactions', transactionRoutes);

export default app;
