// Real Solana serialization/signatures, injected RPC: never sends to a network.
const assert=require('node:assert/strict');
const {Keypair,Transaction}=require('@solana/web3.js');
const {DevnetPaymentNetwork}=require('../dist/services/paymentNetwork');
const {config}=require('../dist/config/unifiedConfig');
config.payments.enabled=true;
(async()=>{
 const signer=Keypair.generate(),recipient=Keypair.generate(),network=new DevnetPaymentNetwork();let prepared;
 const rpc={getGenesisHash:async()=> 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',getLatestBlockhash:async()=>({blockhash:Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:100}),getFeeForMessage:async()=>({value:5000}),getSignatureStatuses:async()=>({value:[{confirmationStatus:'finalized',err:null,slot:5}]}),getTransaction:async()=>({transaction:{message:Transaction.from(Buffer.from(prepared.bytes,'base64')).compileMessage(),signatures:[prepared.signature]},meta:{err:null,fee:5000}})};
 network.connection=rpc;await network.guard();
 prepared=await network.prepare(Buffer.from(signer.secretKey),recipient.publicKey.toBase58(),10000n);
 const tx=Transaction.from(Buffer.from(prepared.bytes,'base64'));assert.equal(tx.verifySignatures(),true);assert.equal(tx.feePayer.toBase58(),signer.publicKey.toBase58());
 assert.equal((await network.status(prepared.signature,prepared.bytes)).state,'CONFIRMED');
 const other=await network.prepare(Buffer.from(signer.secretKey),recipient.publicKey.toBase58(),10001n);
 await assert.rejects(()=>network.status(prepared.signature,other.bytes),/mismatch/i);
 rpc.getGenesisHash=async()=> 'mainnet';await assert.rejects(()=>network.guard(),/Devnet/);
 console.log('PASS real Solana signatures, expected-message validation, Devnet guard');
})().catch(e=>{console.error(e);process.exitCode=1;});
