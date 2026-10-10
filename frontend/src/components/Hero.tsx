import React from 'react';

export function Hero() {
  return (
    <div className="relative min-h-screen w-full text-[#FAFCFA] font-sans overflow-hidden">
      
      {/* Figma Gradient Scrim for Readability (Now floating over the Spline 3D background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060D0C]/80 z-0 pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative z-10 pt-6 px-6 lg:px-12 xl:px-20 flex items-center justify-between">
        <div className="text-[24px] text-white font-normal tracking-tight drop-shadow-md">
          AgentSafe
        </div>
        
        {/* Glass Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 rounded-[15px] pl-8 pr-2 py-1.5">
          <a href="#" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Solutions</a>
          <a href="#" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Features</a>
          <a href="#" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Integration</a>
          <a href="#" className="text-[16px] font-normal hover:text-[#B6F03F] transition-colors">Pricing</a>
          
          <button className="bg-[#B6F03F] text-[#0C160B] text-[16px] font-normal rounded-[11px] px-6 py-2.5 ml-4 hover:bg-[#a3d938] transition-colors">
            Get Started &gt;
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-100px)] px-6 lg:px-12 xl:px-20 pb-16 items-end justify-between">
        
        {/* Left Side: Headline & Social Proof */}
        <div className="flex flex-col max-w-3xl mb-10 lg:mb-0">
          <h1 className="text-[42px] md:text-[60px] lg:text-[72px] font-normal leading-[1.05] tracking-tight mb-6">
            The future of autonomous security.
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-2">
            <p className="text-[18px] md:text-[20px] font-normal text-[#FAFCFA]/90">
              Agentic safety for tomorrow.
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
            We specialize in leveraging advanced AI agents to transform your infrastructure security and compliance workflows without manual intervention.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button className="bg-[#B6F03F] text-[#0C160B] text-[16px] font-normal rounded-[11px] px-6 py-3.5 flex-1 sm:flex-none whitespace-nowrap hover:bg-[#a3d938] transition-colors">
              Start Free Trial -&gt;
            </button>
            <button className="bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] px-6 py-3.5 flex-1 sm:flex-none whitespace-nowrap hover:bg-[#202A29]/70 transition-colors">
              View Documentation
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
