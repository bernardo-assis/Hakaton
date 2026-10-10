import React from 'react';

export function Services() {
  const services = [
    {
      title: "Autonomous Auditing",
      desc: "We provide AI-driven tools to continuously audit agent behavior, transaction logs, and permission scopes in real-time.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      title: "Smart Contract Shielding",
      desc: "Our AI platforms offer advanced execution analytics to prevent malicious payloads from interacting with your core contracts.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      )
    },
    {
      title: "Security Consulting",
      desc: "We empower DevSecOps teams with AI tools for vulnerability analysis, threat modeling, and immediate mitigation strategies.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Enterprise Deployments",
      desc: "Our scalable AI security solutions adapt to the unique architectural challenges of businesses running heavy multi-agent swarms.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      )
    }
  ];

  return (
    <section className="relative w-full px-6 lg:px-12 xl:px-20 py-32 text-[#FAFCFA] z-10 min-h-screen">
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-start relative">
        
        {/* Coluna da Esquerda (Sticky - Fica Fixa no Scroll) */}
        <div className="w-full lg:w-5/12 sticky top-40 flex flex-col items-start lg:pt-10">
          <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
            Services
          </span>
          <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-6">
            Tailored for every autonomous need.
          </h2>
          <p className="text-[18px] text-[#FAFCFA]/80 max-w-md">
            Our security solutions are designed to cater to diverse AI ecosystems and enterprise architectures.
          </p>
        </div>

        {/* Coluna da Direita (Cards rolando para cima) */}
        <div className="w-full lg:w-7/12 flex flex-col gap-8 lg:pb-32">
          {services.map((service, idx) => (
            <div 
              key={idx}
              className="flex flex-col sm:flex-row items-start gap-6 bg-[#0C1411]/40 backdrop-blur-xl border border-white/5 rounded-[24px] p-8 hover:bg-[#0C1411]/80 hover:border-white/10 transition-all duration-300 group"
            >
              {/* Ícone */}
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#FAFCFA]/5 flex items-center justify-center text-[#B6F03F] group-hover:scale-110 group-hover:bg-[#B6F03F]/10 transition-all duration-300">
                {service.icon}
              </div>
              
              {/* Texto */}
              <div className="flex flex-col">
                <h3 className="text-[24px] font-medium mb-3">
                  {service.title}
                </h3>
                <p className="text-[16px] text-[#FAFCFA]/60 leading-relaxed">
                  {service.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
