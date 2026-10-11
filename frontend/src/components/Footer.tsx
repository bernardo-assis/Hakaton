export function Footer() {
  return (
    <footer className="relative w-full text-[#FAFCFA] z-10 bg-[#060D0C] border-t border-white/10 overflow-hidden font-sans">
      {/* Luz ambiente sutil de fundo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#B6F03F]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-20 pt-20 pb-12 relative z-10">
        
        {/* Pre-Footer CTA Banner */}
        <div className="bg-[#0C1411] border border-white/10 rounded-[24px] p-8 md:p-12 mb-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-2xl">
            <span className="text-[#B6F03F] text-[13px] md:text-[14px] font-normal tracking-[0.2em] uppercase mb-2 block">
              Autonomous Safety
            </span>
            <h3 className="text-[28px] md:text-[36px] font-normal tracking-tight leading-[1.15] text-[#FAFCFA]">
              Ready to safeguard your AI agent fleet?
            </h3>
            <p className="text-[15px] md:text-[16px] text-[#FAFCFA]/70 mt-2 leading-relaxed">
              Deploy your first policy vault on Solana Devnet with zero private-key exposure.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <a
              href="#pricing"
              className="bg-[#B6F03F] text-[#0C160B] text-[16px] font-normal rounded-[11px] px-8 py-3.5 hover:bg-[#a3d938] transition-colors text-center whitespace-nowrap"
            >
              Get Started &gt;
            </a>
            <a
              href="#features"
              className="bg-[#202A29]/60 hover:bg-[#202A29] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] px-8 py-3.5 transition-colors text-center whitespace-nowrap"
            >
              Explore Docs
            </a>
          </div>
        </div>

        {/* Grid de Navegação & Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/10">
          
          {/* Coluna 1 & 2: Branding e Visão */}
          <div className="lg:col-span-2 flex flex-col items-start pr-0 lg:pr-8">
            <div className="text-[24px] text-white font-normal tracking-tight mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B6F03F] inline-block shadow-[0_0_10px_#B6F03F]" />
              AgentSafe
            </div>
            <p className="text-[#FAFCFA]/70 text-[15px] font-normal leading-relaxed max-w-sm mb-6">
              The military-grade treasury firewall and policy vault protocol designed for autonomous agents operating across Web3 and Solana.
            </p>

            {/* Status da Rede / Operational Pill */}
            <div className="flex items-center gap-2.5 bg-[#0C1411] border border-white/10 px-3.5 py-1.5 rounded-full text-[12px] text-[#FAFCFA]/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B6F03F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B6F03F]" />
              </span>
              <span>Solana Devnet: Operational</span>
            </div>
          </div>

          {/* Coluna 3: Protocol */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-medium text-[#FAFCFA] tracking-wide uppercase mb-1">
              Protocol
            </h4>
            <a href="#features" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Features
            </a>
            <a href="#solutions" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Solutions
            </a>
            <a href="#testimonials" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Pricing Plans
            </a>
          </div>

          {/* Coluna 4: Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-medium text-[#FAFCFA] tracking-wide uppercase mb-1">
              Resources
            </h4>
            <a href="#" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Smart Contracts
            </a>
            <a href="#" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Policy Architecture
            </a>
            <a href="#" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Security Audit
            </a>
            <a href="#" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors">
              Solana Faucet
            </a>
          </div>

          {/* Coluna 5: Community & Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[14px] font-medium text-[#FAFCFA] tracking-wide uppercase mb-1">
              Connect
            </h4>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors flex items-center gap-2">
              <span>GitHub</span>
              <span className="text-xs">&rarr;</span>
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors flex items-center gap-2">
              <span>X (Twitter)</span>
              <span className="text-xs">&rarr;</span>
            </a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors flex items-center gap-2">
              <span>Discord</span>
              <span className="text-xs">&rarr;</span>
            </a>
            <a href="https://phantom.com" target="_blank" rel="noreferrer" className="text-[15px] text-[#FAFCFA]/60 hover:text-[#B6F03F] transition-colors flex items-center gap-2">
              <span>Phantom Wallet</span>
              <span className="text-xs">&rarr;</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#FAFCFA]/50">
          <div>
            &copy; {new Date().getFullYear()} AgentSafe. Built for the Solana Hackathon.
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#FAFCFA] transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[#FAFCFA] transition-colors">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[#FAFCFA] transition-colors">
              Security Disclosures
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
