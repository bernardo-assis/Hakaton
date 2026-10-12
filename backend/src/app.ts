import express from "express";
import cors from "cors";
import vaultRoutes from "./routes/vaultRoutes";
import agentRoutes from "./routes/agentRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import paymentRoutes, { agentPaymentRoutes } from './routes/paymentRoutes';

import rateLimit from "express-rate-limit";

import { UiController } from "./controllers/UiController";
import { asyncErrorWrapper } from "./utils/asyncErrorWrapper";
import authRoutes from "./routes/authRoutes";
import { originGuard, requireWallet } from "./middleware/walletAuth";
import { config } from "./config/unifiedConfig";
import pool from './db/database';
const app = express();
// One known terminating proxy only; never trust every forwarded hop.
app.set('trust proxy',config.server.trustProxyHops);
app.get('/healthz',(_req,res)=>{res.set('Cache-Control','no-store');res.json({status:'ok'});});
app.get('/readyz',async(_req,res)=>{
  res.set('Cache-Control','no-store');
  try{await pool.query('SELECT 1');res.json({status:'ready'});}catch{res.status(503).json({status:'unavailable'});}
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  skip: req=>!['GET','HEAD'].includes(req.method),
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});
const mutationLimiter=rateLimit({windowMs:60*1000,max:100,skip:req=>['GET','HEAD','OPTIONS'].includes(req.method),message:{success:false,error:'Too many mutation requests, please try again later.'}});
const authLimiter=rateLimit({windowMs:60*1000,max:60,skip:req=>['GET','HEAD','OPTIONS'].includes(req.method),message:{success:false,error:'Too many authentication attempts, please try again later.'}});

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  skip: req=>['GET','HEAD','OPTIONS'].includes(req.method),
  message: {
    success: false,
    error: "Too many transaction requests, please wait a moment.",
  },
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (config.auth.production) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  next();
});

app.use(cors({ origin: config.auth.allowedOrigins, credentials: true }));
// Machine tokens never use browser cookies. Browser requests retain Origin/CSRF checks.
app.use((req,res,next)=>req.path==='/api/agent-payments'&&!req.get('Origin')&&!req.get('Cookie')?next():originGuard(req,res,next));
app.use(express.json());
app.use(readLimiter);
app.use(mutationLimiter);
app.use(['/api/payments','/api/agent-payments'],transactionLimiter);

app.use("/api/auth", authLimiter,authRoutes);
app.use('/api/agent-payments',agentPaymentRoutes);
app.use("/api", requireWallet);
app.use('/api',paymentRoutes);
app.use("/api/users", (_req, res) =>
  res.status(501).json({ success: false, error: "Use wallet authentication" }),
);
app.use("/api/vaults", vaultRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/transactions", transactionLimiter, transactionRoutes);
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
