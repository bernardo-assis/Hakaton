import app from './app';
import { config } from './config/unifiedConfig';
import './db/database'; // Ensures DB connects on startup
import { PaymentService } from './services/paymentService';

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 [Server] Running at http://localhost:${PORT}`);
});
// Recovery follows durable signed bytes. It never creates/signs a replacement.
if (config.payments.enabled) {
  const service=new PaymentService();
  let running=false;
  const reconcile=async()=>{if(running)return;running=true;try{await service.reconcile();}catch(error){console.error('[payments] Recovery unavailable',{code:(error as any).code??'RPC_OR_CONFIG'});}finally{running=false;}};
  void reconcile();
  setInterval(()=>void reconcile(),15000).unref();
}
