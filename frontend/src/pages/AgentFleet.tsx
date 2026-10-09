import React, { useState } from 'react';

export function AgentFleet() {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12 relative">
      
      {/* Primeira Linha: Título e Botões de Ação */}
      <div className="flex justify-between items-start mb-8">
        
        {/* Título e Subtítulo */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[#111827] text-[30px] font-medium font-inter">
            Gestão da Frota de Agentes
          </h1>
          <span className="text-[#777D85] text-[13px] font-normal">
            Gerencie orçamentos, políticas e segurança para sua força de trabalho de IA autônoma
          </span>
        </div>

        {/* Botões na Coluna da Direita */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDeployModalOpen(true)}
            className="bg-[#B6F03F] text-[#111827] px-5 py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Deploy New Agent
          </button>
          
          <button className="bg-[#F04448] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Emergência: Congelar Todos
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-[22px] p-4 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 border border-[#E8EAEC] rounded-[10px] px-3 h-[40px] w-full sm:w-[320px]">
          <svg className="w-4 h-4 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search agents by name or ID..." className="bg-transparent border-none outline-none text-[13px] text-[#111827] placeholder-[#777D85] w-full" />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-between gap-2 border border-[#E8EAEC] rounded-[10px] px-4 h-[40px] hover:bg-gray-50 transition-colors cursor-pointer w-full sm:w-auto">
            <span className="text-[#111827] text-[13px] font-medium">Status: All</span>
            <svg className="w-4 h-4 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button className="flex items-center justify-between gap-2 border border-[#E8EAEC] rounded-[10px] px-4 h-[40px] hover:bg-gray-50 transition-colors cursor-pointer w-full sm:w-auto">
            <span className="text-[#111827] text-[13px] font-medium">Sort by: Spending</span>
            <svg className="w-4 h-4 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      </div>

      {/* Grade de Agentes */}
      <div>
        {/* Cabeçalho da Lista */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#111827] text-white px-2.5 py-0.5 rounded-md text-[13px] font-semibold">6</div>
          <h2 className="text-[#111827] text-[16px] font-medium">Agentes em Operação</h2>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Research Agent */}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col hover:border-gray-300 transition-colors cursor-default">
            {/* Top: Avatar & Status */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 bg-[#E6F8F0] px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#24865E] rounded-full"></div>
                <span className="text-[#24865E] text-[11px] font-semibold">Active</span>
              </div>
            </div>

            {/* Identity */}
            <div className="mb-5">
              <h3 className="text-[#111827] text-[16px] font-semibold mb-1">Research Agent</h3>
              <p className="text-[#777D85] text-[12px] mb-3 leading-relaxed">Collects and analyzes web3 market data automatically.</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#111827] bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 w-fit">
                <svg className="w-3.5 h-3.5 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-mono">8x9T...K2pM</span>
              </div>
            </div>

            {/* Budget Limits */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="flex-1">
                <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">Limite Diário</span>
                <span className="text-[#111827] text-[14px] font-semibold">$50.00</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex-1">
                <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">TX Limit</span>
                <span className="text-[#111827] text-[14px] font-semibold">$10.00</span>
              </div>
            </div>

            {/* Whitelist */}
            <div className="mb-5">
              <span className="block text-[#111827] text-[12px] font-medium mb-2.5">Serviços Permitidos</span>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#F6F7F7] border border-[#E8EAEC] text-[#777D85] px-2.5 py-1 rounded-[6px] text-[11px] font-medium">OpenAI API</span>
                <span className="bg-[#F6F7F7] border border-[#E8EAEC] text-[#777D85] px-2.5 py-1 rounded-[6px] text-[11px] font-medium">Brave Search</span>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="mb-6 mt-auto">
              <div className="flex justify-between items-center text-[12px] mb-2">
                <span className="text-[#111827] font-semibold">$42.00 used</span>
                <span className="text-[#777D85]">$50.00 max</span>
              </div>
              <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                <div className="bg-[#064E3B] h-full rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 border border-[#E8EAEC] text-[#111827] py-2.5 rounded-full text-[12px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
                Edit Limits
              </button>
              <button className="flex-1 border border-[#E8EAEC] text-[#F04448] py-2.5 rounded-full text-[12px] font-semibold hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer">
                Pause
              </button>
            </div>
          </div>

          {/* Card 2: Operations Agent */}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col hover:border-gray-300 transition-colors cursor-default">
            {/* Top: Avatar & Status */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 bg-[#E6F8F0] px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-[#24865E] rounded-full"></div>
                <span className="text-[#24865E] text-[11px] font-semibold">Active</span>
              </div>
            </div>

            {/* Identity */}
            <div className="mb-5">
              <h3 className="text-[#111827] text-[16px] font-semibold mb-1">Operations Agent</h3>
              <p className="text-[#777D85] text-[12px] mb-3 leading-relaxed">Manages database and cloud infrastructure.</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#111827] bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 w-fit">
                <svg className="w-3.5 h-3.5 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="font-mono">2b4F...Z9Q1</span>
              </div>
            </div>

            {/* Budget Limits */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="flex-1">
                <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">Limite Diário</span>
                <span className="text-[#111827] text-[14px] font-semibold">$100.00</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex-1">
                <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">TX Limit</span>
                <span className="text-[#111827] text-[14px] font-semibold">$20.00</span>
              </div>
            </div>

            {/* Whitelist */}
            <div className="mb-5">
              <span className="block text-[#111827] text-[12px] font-medium mb-2.5">Serviços Permitidos</span>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#F6F7F7] border border-[#E8EAEC] text-[#777D85] px-2.5 py-1 rounded-[6px] text-[11px] font-medium">AWS RDS</span>
                <span className="bg-[#F6F7F7] border border-[#E8EAEC] text-[#777D85] px-2.5 py-1 rounded-[6px] text-[11px] font-medium">Stripe</span>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="mb-6 mt-auto">
              <div className="flex justify-between items-center text-[12px] mb-2">
                <span className="text-[#111827] font-semibold">$12.00 used</span>
                <span className="text-[#777D85]">$100.00 max</span>
              </div>
              <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                <div className="bg-[#B6F03F] h-full rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 border border-[#E8EAEC] text-[#111827] py-2.5 rounded-full text-[12px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
                Edit Limits
              </button>
              <button className="flex-1 border border-[#E8EAEC] text-[#F04448] py-2.5 rounded-full text-[12px] font-semibold hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer">
                Pause
              </button>
            </div>
          </div>

          {/* Card 3: Adicionar Novo Agente (Placeholder) */}
          <div className="bg-transparent rounded-[22px] p-6 border-2 border-dashed border-[#E8EAEC] flex flex-col items-center justify-center text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer min-h-[420px]">
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-6 h-6 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-[#111827] text-[16px] font-semibold mb-1">Deploy Agent</h3>
            <p className="text-[#777D85] text-[12px] max-w-[200px]">Crie um novo agente autônomo e configure suas políticas de segurança.</p>
          </div>

        </div>
      </div>

      {/* Rodapé de Confiança */}
      <div className="mt-16 flex items-center justify-center gap-2 text-[#777D85]">
        <svg className="w-4 h-4 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[12px] font-medium tracking-wide uppercase">Cada agente. Cada transação. Protegidos.</span>
      </div>

      {/* Modal: Deploy New Agent */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[600px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
              <h2 className="text-[#111827] text-[20px] font-semibold">Deploy New Agent</h2>
              <button onClick={() => setIsDeployModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-8">
              
              {/* Seção 1: Agent Identity */}
              <div>
                <h3 className="text-[#111827] text-[15px] font-semibold mb-4">Agent Identity</h3>
                
                <div className="flex flex-col gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">Agent Name</label>
                    <input type="text" placeholder="Ex: Trading Bot" className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 text-[14px] text-[#111827] placeholder-[#777D85] outline-none focus:border-[#064E3B] transition-colors" />
                  </div>

                  {/* Propósito */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">Função / Propósito</label>
                    <input type="text" placeholder="Ex: Market research & data API scraping" className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 text-[14px] text-[#111827] placeholder-[#777D85] outline-none focus:border-[#064E3B] transition-colors" />
                  </div>

                  {/* Chave Pública */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">Chave Pública Solana (Wallet)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                      <input type="text" placeholder="Cole o endereço da carteira do agente..." className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] font-mono text-[#111827] placeholder-[#777D85] outline-none focus:border-[#064E3B] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Políticas de Segurança */}
              <div className="bg-[#F6F7F7] rounded-[16px] p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E8EAEC] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h3 className="text-[#111827] text-[15px] font-semibold">Políticas de Segurança</h3>
                  <div className="flex items-center gap-1.5 bg-[#E6F8F0] px-2.5 py-1 rounded-full ml-auto">
                    <div className="w-1.5 h-1.5 bg-[#24865E] rounded-full"></div>
                    <span className="text-[#24865E] text-[11px] font-semibold">Hard caps</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cap Diário */}
                  <div>
                    <label className="block text-[#111827] text-[12px] font-medium mb-1.5">Limite Diário (USD)</label>
                    <div className="flex items-center bg-white border border-[#E8EAEC] rounded-[10px] overflow-hidden">
                      <span className="pl-3 text-[#777D85] text-[14px] font-medium">$</span>
                      <input type="text" defaultValue="50.00" className="w-full bg-transparent px-2 py-2.5 text-[14px] text-[#111827] font-semibold outline-none" />
                      <div className="flex flex-col border-l border-[#E8EAEC]">
                        <button className="px-2 py-1 hover:bg-gray-50 border-b border-[#E8EAEC]"><svg className="w-3 h-3 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                        <button className="px-2 py-1 hover:bg-gray-50"><svg className="w-3 h-3 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" transform="rotate(180 12 12)" /></svg></button>
                      </div>
                    </div>
                  </div>

                  {/* Cap por TX */}
                  <div>
                    <label className="block text-[#111827] text-[12px] font-medium mb-1.5">Limite por Transação (USD)</label>
                    <div className="flex items-center bg-white border border-[#E8EAEC] rounded-[10px] overflow-hidden">
                      <span className="pl-3 text-[#777D85] text-[14px] font-medium">$</span>
                      <input type="text" defaultValue="5.00" className="w-full bg-transparent px-2 py-2.5 text-[14px] text-[#111827] font-semibold outline-none" />
                      <div className="flex flex-col border-l border-[#E8EAEC]">
                        <button className="px-2 py-1 hover:bg-gray-50 border-b border-[#E8EAEC]"><svg className="w-3 h-3 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                        <button className="px-2 py-1 hover:bg-gray-50"><svg className="w-3 h-3 text-[#777D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" transform="rotate(180 12 12)" /></svg></button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer com Botão */}
            <div className="p-6 pt-4 border-t border-gray-100 mt-auto flex justify-end">
              <button 
                onClick={() => setIsDeployModalOpen(false)}
                className="bg-[#B6F03F] text-[#111827] w-full sm:w-auto px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Deploy Agent
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

