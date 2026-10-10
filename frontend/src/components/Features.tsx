import React from 'react';

export function Features() {
  return (
    <section className="relative w-full px-6 lg:px-12 xl:px-20 py-24 text-[#FAFCFA] z-10">
      
      {/* Header da Seção */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Features
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-6">
          Built for autonomous resilience.
        </h2>
        <p className="text-[18px] text-[#FAFCFA]/80">
          A full-stack ecosystem designed to keep your AI agents secure, compliant, and within budget across every transaction.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Box 1 (Grande - Ocupa 2 colunas) */}
        <div className="md:col-span-2 bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 md:p-10 flex flex-col justify-end min-h-[320px] hover:bg-[#0C1411]/80 transition-colors group overflow-hidden relative">
          {/* Efeito de brilho de fundo no hover */}
          <div className="absolute -inset-20 bg-gradient-to-tr from-[#B6F03F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 mt-auto">
            <h3 className="text-[28px] font-medium mb-3">Agent Fleet Security</h3>
            <p className="text-[16px] text-[#FAFCFA]/70 leading-relaxed max-w-md">
              Monitor your entire ecosystem of AI agents in real-time. Track active processes, trace transaction origins, and instantly freeze compromised agents before they breach your infrastructure.
            </p>
          </div>
        </div>

        {/* Box 2 (Pequena - 1 coluna) */}
        <div className="bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 flex flex-col min-h-[320px] hover:bg-[#0C1411]/80 transition-colors group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-[#B6F03F]/40 group-hover:text-[#B6F03F] transition-colors">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
             </svg>
           </div>
          <div className="mt-auto relative z-10">
            <h3 className="text-[24px] font-medium mb-3">Policy Vaults</h3>
            <p className="text-[16px] text-[#FAFCFA]/70 leading-relaxed">
              Enforce hard caps and daily spending limits for every autonomous action. No agent can spend beyond the pre-approved budget.
            </p>
          </div>
        </div>

        {/* Box 3 (Pequena - 1 coluna) */}
        <div className="bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 flex flex-col min-h-[320px] hover:bg-[#0C1411]/80 transition-colors group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-[#B6F03F]/40 group-hover:text-[#B6F03F] transition-colors">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
             </svg>
           </div>
          <div className="mt-auto relative z-10">
            <h3 className="text-[24px] font-medium mb-3">AI Simulator</h3>
            <p className="text-[16px] text-[#FAFCFA]/70 leading-relaxed">
              Run threat simulations and stress-test your autonomous protocols in a safe environment before deploying to mainnet.
            </p>
          </div>
        </div>

        {/* Box 4 (Grande - Ocupa 2 colunas) */}
        <div className="md:col-span-2 bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 md:p-10 flex flex-col justify-end min-h-[320px] hover:bg-[#0C1411]/80 transition-colors group overflow-hidden relative">
          <div className="absolute -inset-20 bg-gradient-to-br from-[#B6F03F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 mt-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-[28px] font-medium mb-3">Real-time Tx Blocking</h3>
              <p className="text-[16px] text-[#FAFCFA]/70 leading-relaxed">
                Our core engine analyzes intent instantly. Unauthorized requests, hallucinations, or over-budget attempts are blocked mathematically at the transaction layer.
              </p>
            </div>
            
            {/* Elemento visual decorativo */}
            <div className="flex items-center gap-2 bg-[#FAFCFA]/5 px-4 py-2 rounded-full border border-white/10 text-sm text-[#B6F03F]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B6F03F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B6F03F]"></span>
              </span>
              100% Coverage
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
