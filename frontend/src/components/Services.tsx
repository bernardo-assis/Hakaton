import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const services = [
    {
      title: "Autonomous Auditing",
      desc: "We provide AI-driven tools to continuously audit agent behavior, transaction logs, and permission scopes in real-time.",
      badge: "Real-time Telemetry",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      title: "Smart Contract Shielding",
      desc: "Our AI platforms offer advanced execution analytics to prevent malicious payloads from interacting with your core contracts.",
      badge: "Zero-Trust Guard",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      )
    },
    {
      title: "Security Consulting",
      desc: "We empower DevSecOps teams with AI tools for vulnerability analysis, threat modeling, and immediate mitigation strategies.",
      badge: "Advisory Swarms",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Enterprise Deployments",
      desc: "Our scalable AI security solutions adapt to the unique architectural challenges of businesses running heavy multi-agent swarms.",
      badge: "High Concurrency",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animação de entrada suave e sem travamentos em cada card conforme entra na tela
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-start relative">
        
        {/* Coluna da Esquerda (Sticky Seguro — Fixa de forma nativa e sem bugs de layout) */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-36 flex flex-col items-start self-start z-10">
          <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
            Services
          </span>
          <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-6 text-[#FAFCFA]">
            Tailored for every autonomous need.
          </h2>
          <p className="text-[18px] text-[#FAFCFA]/80 max-w-md leading-relaxed">
            Our security solutions are designed to cater to diverse AI ecosystems and enterprise architectures.
          </p>
        </div>

        {/* Coluna da Direita (Cards com Rolagem Fluida e Entrada Limpa) */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6 lg:gap-8 relative z-10">
          {services.map((service, idx) => (
            <div
              key={idx}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className="flex flex-col sm:flex-row items-start gap-6 bg-[#0C1411]/70 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 lg:p-10 hover:bg-[#0C1411]/90 hover:border-[#B6F03F]/40 transition-all duration-300 shadow-xl hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.8)] hover:-translate-y-1 group cursor-pointer relative overflow-hidden will-change-transform"
            >
              {/* Brilho dinâmico sutil no hover */}
              <div className="absolute -inset-20 bg-gradient-to-tr from-[#B6F03F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Ícone */}
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-[#FAFCFA]/5 flex items-center justify-center text-[#B6F03F] group-hover:scale-110 group-hover:bg-[#B6F03F]/15 transition-all duration-300 border border-white/5 shadow-inner">
                {service.icon}
              </div>
              
              {/* Texto do Serviço */}
              <div className="flex flex-col relative z-10 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[24px] font-normal text-[#FAFCFA] group-hover:text-[#B6F03F] transition-colors duration-300 tracking-tight">
                    {service.title}
                  </h3>
                  <span className="text-[11px] font-mono text-[#FAFCFA]/40 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {service.badge}
                  </span>
                </div>
                <p className="text-[16px] text-[#FAFCFA]/70 leading-relaxed font-normal">
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
