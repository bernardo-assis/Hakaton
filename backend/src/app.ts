import express from "express";
import cors from "cors";
import vaultRoutes from "./routes/vaultRoutes";
import agentRoutes from "./routes/agentRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

import rateLimit from "express-rate-limit";

import { UiController } from "./controllers/UiController";
import { asyncErrorWrapper } from "./utils/asyncErrorWrapper";
import authRoutes from "./routes/authRoutes";
import { originGuard, requireWallet } from "./middleware/walletAuth";
import { config } from "./config/unifiedConfig";
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

app.use(cors({ origin: config.auth.allowedOrigins, credentials: true }));
app.use(originGuard);
app.use(express.json());
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api", requireWallet);
app.use("/api/users", (_req, res) =>
  res.status(501).json({ success: false, error: "Use wallet authentication" }),
);
app.use("/api/vaults", vaultRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

const ui = new UiController();
app.get(
  "/api/notifications",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "events")),
);
app.get(
  "/api/simulator/history",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "simulations")),
);
app.post(
  "/api/simulator/evaluate",
  asyncErrorWrapper((req, res) => ui.execute(req, res, "simulate")),
);
export default app;
