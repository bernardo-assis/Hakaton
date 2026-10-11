import { useState, useEffect } from "react";

interface HeroProps {
  onLaunchApp?: () => void;
  onOpenDocs?: () => void;
}

export function Hero({ onLaunchApp, onOpenDocs }: HeroProps = {}) {
  const fullText = "The future of autonomous security.";
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    // Pequeno delay inicial de 200ms antes de começar a digitar
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        index++;
        if (index <= fullText.length) {
          setDisplayText(fullText.slice(0, index));
        } else {
          clearInterval(interval);
        }
      }, 85); // Cadência mais lenta e deliberada (85ms por caractere)
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative min-h-screen w-full text-[#FAFCFA] font-sans overflow-hidden">
      
      {/* Figma Gradient Scrim for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060D0C]/80 z-0 pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative z-10 pt-6 px-6 lg:px-12 xl:px-20 flex items-center justify-between">
        <div 
          onClick={onLaunchApp}
          className="text-[24px] text-white font-normal tracking-tight drop-shadow-md flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#B6F03F] inline-block shadow-[0_0_8px_#B6F03F]" />
          AgentSafe
        </div>
        
        {/* Glass Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 rounded-[15px] pl-8 pr-2 py-1.5">
          <a href="#solutions" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Solutions</a>
          <a href="#features" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Features</a>
          <a href="#testimonials" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Testimonials</a>
          <a href="#pricing" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Pricing</a>
          <button 
            onClick={onOpenDocs}
            className="text-[16px] font-normal text-[#FAFCFA] hover:text-[#B6F03F] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Docs
          </button>
          
          <button 
            onClick={onLaunchApp}
            className="bg-[#B6F03F] text-[#0C160B] text-[16px] font-medium rounded-[11px] px-6 py-2.5 ml-4 hover:bg-[#a3d938] transition-colors inline-block cursor-pointer active:scale-95"
          >
            Launch App &gt;
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-100px)] px-6 lg:px-12 xl:px-20 pb-16 items-end justify-between">
        
        {/* Left Side: Headline com Efeito Typewriter & Ícone de Click Piscante */}
        <div className="flex flex-col max-w-3xl mb-10 lg:mb-0">
          <h1 className="text-[42px] md:text-[60px] lg:text-[72px] font-normal leading-[1.05] tracking-tight mb-6">
            <span className="text-[#FAFCFA]">{displayText}</span>

            {/* Cursor piscante de click / terminal neon */}
            <span className="w-[3px] md:w-[4px] lg:w-[5px] h-[32px] md:h-[46px] lg:h-[56px] bg-[#B6F03F] inline-block animate-pulse shadow-[0_0_14px_#B6F03F] rounded-full ml-1.5 align-baseline translate-y-[2px]" />

            {/* Texto fantasma invisível para travar layout e evitar CLS */}
            <span className="opacity-0 select-none pointer-events-none">
              {fullText.slice(displayText.length)}
            </span>
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-2">
            <p className="text-[18px] md:text-[20px] font-normal text-[#FAFCFA]/90">
              Treasury firewall and zero-trust policies for autonomous AI agents.
            </p>
            
            {/* Overlapping Avatars */}
            <div className="flex -space-x-3 ml-0 sm:ml-2">
              <img src="/images/avatar-1.png" alt="User 1" className="w-[36px] h-[36px] rounded-full border-2 border-[#0C1411] object-cover" />
              <img src="/images/avatar-2.png" alt="User 2" className="w-[36px] h-[36px] rounded-full border-2 border-[#0C1411] object-cover" />
              <img src="/images/avatar-3.png" alt="User 3" className="w-[36px] h-[36px] rounded-full border-2 border-[#0C1411] object-cover" />
              <img src="/images/avatar-4.png" alt="User 4" className="w-[36px] h-[36px] rounded-full border-2 border-[#0C1411] object-cover" />
            </div>
          </div>
        </div>

        {/* Right Side: Action Area & Secondary Text */}
        <div className="flex flex-col items-start lg:items-end max-w-[480px] gap-8">
          <p className="text-[18px] font-normal leading-[1.4] text-left lg:text-right text-[#FAFCFA]/80">
            We specialize in providing cryptographic vaults and programmable spending guardrails on Solana to protect enterprise treasuries from prompt injections and hallucinations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={onLaunchApp}
              className="bg-[#B6F03F] text-[#0C160B] text-[16px] font-medium rounded-[11px] px-6 py-3.5 flex-1 sm:flex-none whitespace-nowrap hover:bg-[#a3d938] transition-colors text-center cursor-pointer active:scale-95 shadow-md"
            >
              Launch Dashboard -&gt;
            </button>
            <button 
              onClick={onOpenDocs}
              className="bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] px-6 py-3.5 flex-1 sm:flex-none whitespace-nowrap hover:bg-[#202A29]/70 transition-colors text-center cursor-pointer active:scale-95"
            >
              View Documentation
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
