export function Header() {
  return (
    <header className="flex items-center justify-between w-full p-4 h-[76px]">
      {/* Logo Section */}
      <div className="flex items-center gap-[7px] bg-white rounded-full p-[7px] pr-4 h-11">
        <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-dark-text text-[13px] font-medium font-inter">AgentSafe</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center bg-[#111827] rounded-full p-1.5 h-11">
        <a href="#" className="bg-white text-gray-text px-[13px] py-2 rounded-full text-[12px] font-medium">Visão Geral</a>
        <a href="#" className="text-gray-text hover:text-white px-[13px] py-2 rounded-full text-[12px] font-medium transition-colors">Atividade</a>
        <a href="#" className="text-gray-text hover:text-white px-[13px] py-2 rounded-full text-[12px] font-medium transition-colors">Agentes</a>
        <a href="#" className="text-gray-text hover:text-white px-[13px] py-2 rounded-full text-[12px] font-medium transition-colors">Orçamentos</a>
        <a href="#" className="text-gray-text hover:text-white px-[13px] py-2 rounded-full text-[12px] font-medium transition-colors">Cofre</a>
        <a href="#" className="text-gray-text hover:text-white px-[13px] py-2 rounded-full text-[12px] font-medium transition-colors">Relatórios</a>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-[18px] bg-white rounded-full px-[14px] h-11">
        <button className="text-gray-400 hover:text-gray-600 transition-colors w-[18px] h-[18px] flex items-center justify-center">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button className="flex items-center gap-2 bg-brand-lime text-dark-text px-[18px] h-10 rounded-full text-[12px] font-medium hover:opacity-90 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Conectar Phantom Wallet
        </button>
      </div>
    </header>
  );
}
