import React from 'react';

export function Solutions() {
  return (
    <section className="relative w-full px-6 lg:px-12 xl:px-20 py-24 text-[#FAFCFA] z-10">
      
      {/* Glassmorphism Container */}
      <div className="bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 lg:p-16 flex flex-col gap-12 lg:gap-16 shadow-2xl">
        
        {/* Top Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
          
          {/* Left Text & Buttons */}
          <div className="flex flex-col max-w-2xl">
            <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
              Solutions
            </span>
            <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-8">
              Automate your defense workflows.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#FAFCFA] text-[#0C160B] text-[16px] font-normal rounded-[11px] px-8 py-3.5 hover:bg-gray-200 transition-colors whitespace-nowrap">
                Get Started &gt;
              </button>
              <button className="bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] px-8 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap">
                View Demo
              </button>
            </div>
          </div>

          {/* Right Description */}
          <div className="max-w-lg lg:pt-12">
            <p className="text-[18px] font-normal leading-[1.5] text-[#FAFCFA]/80">
              Our autonomous agents monitor your infrastructure 24/7, instantly neutralizing threats and ensuring continuous compliance without human bottlenecks.
            </p>
          </div>
          
        </div>

        {/* Bottom Mockup Area */}
        <div className="w-full relative rounded-[20px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(182,240,63,0.07)]">
          {/* Uma leve camada preta no hover para dar profundidade de UI no mockup */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-500 z-10 pointer-events-none" />
          <img 
            src="/images/dashboard-mockup.png" 
            alt="AgentSafe Dashboard" 
            className="w-full h-auto object-cover"
          />
        </div>

      </div>
    </section>
  );
}
