import React from 'react';

export function VaultBudgets() {
  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12">
      
      {/* Cabealho */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[#111827] text-[30px] font-medium font-inter">
            Oramentos do Vault
          </h1>
          <span className="text-[#777D85] text-[13px] font-normal">
            Allocate capital, manage liquidity, and set global spending rules for the fleet.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#E8EAEC] text-[#111827] px-4 py-2.5 rounded-full text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            New Global Policy
          </button>
          <button className="bg-[#064E3B] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-[#054030] transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Optimize Liquidity (AI)
          </button>
        </div>
      </div>

      {/* Grid de Mtricas do Vault */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Saldo Total */}
        <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#777D85] text-[13px] font-medium">Liquidez Disponvel</span>
            <div className="w-8 h-8 rounded-full bg-[#E6F8F0] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#24865E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-[#111827] text-[32px] font-semibold tracking-tight">$49,658.00</h2>
            <p className="text-[#24865E] text-[12px] font-medium mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              Pronto para alocao
            </p>
          </div>
        </div>

        {/* Capital Travado */}
        <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#777D85] text-[13px] font-medium">Reserved for Agents</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-[#111827] text-[32px] font-semibold tracking-tight">$342.00</h2>
            <p className="text-[#777D85] text-[12px] font-medium mt-1">
              Soma dos limites dirios atuais
            </p>
          </div>
        </div>

        {/* Consumo Hoje */}
        <div className="bg-[#064E3B] rounded-[22px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#A5C0B4] text-[13px] font-medium">Fleet Spending (24h)</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-white text-[32px] font-semibold tracking-tight">$42.00</h2>
            <div className="w-full bg-[#054030] rounded-full h-[6px] mt-3 overflow-hidden">
              <div className="bg-[#B6F03F] h-full rounded-full" style={{ width: '12%' }}></div>
            </div>
            <p className="text-[#A5C0B4] text-[11px] font-medium mt-2">
              12% of reserved capital consumed
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda: Alocao por Agente */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-[#111827] text-[16px] font-semibold mb-6">Distribuio de Oramento por Agente</h3>
            
            <div className="flex flex-col gap-6">
              {/* Agent 1 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[#111827] text-[13px] font-medium">Research Agent</span>
                    <span className="text-[#111827] text-[13px] font-semibold">$42.00 <span className="text-[#777D85] font-normal">/ $50.00</span></span>
                  </div>
                  <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                    <div className="bg-[#F04448] h-full rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>
                <button className="text-[12px] font-medium text-[#111827] border border-[#E8EAEC] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Adjust</button>
              </div>

              {/* Agent 2 */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[#111827] text-[13px] font-medium">Operations Agent</span>
                    <span className="text-[#111827] text-[13px] font-semibold">$12.00 <span className="text-[#777D85] font-normal">/ $100.00</span></span>
                  </div>
                  <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                    <div className="bg-[#B6F03F] h-full rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
                <button className="text-[12px] font-medium text-[#111827] border border-[#E8EAEC] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Adjust</button>
              </div>

            </div>
          </div>
        </div>

        {/* Coluna da Direita: Polticas Globais */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-[#24865E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <h3 className="text-[#111827] text-[16px] font-semibold">Polticas Globais (Vault)</h3>
            </div>
            
            <div className="flex flex-col gap-5">
              {/* Toggle 1 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">Pause fleet on low balance</h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">Freezes all agents if vault falls below $5,000.</p>
                </div>
                <div className="w-10 h-6 bg-[#064E3B] rounded-full flex items-center p-1 cursor-pointer shrink-0">
                  <div className="w-4 h-4 bg-[#B6F03F] rounded-full translate-x-4 transition-transform"></div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Toggle 2 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">Exigir Aprovao Humana (2FA)</h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">Para qualquer transao nica que exceda $1,000.</p>
                </div>
                <div className="w-10 h-6 bg-[#064E3B] rounded-full flex items-center p-1 cursor-pointer shrink-0">
                  <div className="w-4 h-4 bg-[#B6F03F] rounded-full translate-x-4 transition-transform"></div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Toggle 3 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">Block New Contracts</h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">Prevent agents from interacting with non-whitelisted contracts.</p>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded-full flex items-center p-1 cursor-pointer shrink-0">
                  <div className="w-4 h-4 bg-white rounded-full transition-transform"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

