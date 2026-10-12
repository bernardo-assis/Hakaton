import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<(HTMLDivElement | null)[]>([]);

  const pillars = [
    {
      icon: (
        <svg className="w-5 h-5 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      name: "Sub-5ms Execution Guardrails",
      role: "POLICY & LATENCY INTERCEPTION",
      quote:
        "Deterministic pre-flight policy evaluation blocks anomalous agent transactions before RPC broadcast, guaranteeing treasury protection with zero perceptible latency overhead.",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      name: "Non-Custodial Multi-Vault Isolation",
      role: "CRYPTOGRAPHIC KEY HYGIENE",
      quote:
        "Autonomous agents operate with dedicated, scoped ephemeral signers. Master treasury keys remain isolated in Phantom wallets, completely decoupled from agent runtime servers.",
    },
    {
      icon: (
        <svg className="w-5 h-5 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      name: "ACID Advisory Lock Concurrency",
      role: "DOUBLE-SPEND PREVENTION",
      quote:
        "PostgreSQL transaction-level advisory locks prevent race conditions, balance overflows, and replay attacks across distributed agent fleets running in parallel.",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Feixe de luz verde que desenha a linha de leitura horizontal
      if (lineRef.current && sectionRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.4,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Revelação suave das colunas em cascata (Stagger Reveal)
      const validCols = columnsRef.current.filter(Boolean);
      if (validCols.length && sectionRef.current) {
        gsap.fromTo(
          validCols,
          { y: 45, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 bg-[#060D0C] overflow-hidden"
    >
      {/* Header Centralizado */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Core Architectural Pillars
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FAFCFA]">
          Engineered for zero-trust resilience.
        </h2>
      </div>

      {/* Feixe de Luz Verde que Desenha a Linha de Leitura */}
      <div className="max-w-6xl mx-auto mb-14 relative flex justify-center">
        <div
          ref={lineRef}
          style={{ transformOrigin: "left center" }}
          className="w-full h-px bg-gradient-to-r from-transparent via-[#B6F03F]/50 to-transparent shadow-[0_0_12px_#B6F03F]"
        />
      </div>

      {/* Grid de 3 Colunas Limpas com Micro-Glow no Hover */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 max-w-6xl mx-auto">
        {pillars.map((item, idx) => (
          <div
            key={idx}
            ref={(el) => {
              columnsRef.current[idx] = el;
            }}
            className="flex flex-col justify-start group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 will-change-transform"
          >
            {/* Header do Pilar (Ícone + Info) */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-[48px] h-[48px] rounded-full bg-[#121A18]/80 border border-white/10 flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 group-hover:ring-2 group-hover:ring-[#B6F03F] group-hover:shadow-[0_0_18px_rgba(182,240,63,0.45)]">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[#FAFCFA] text-[16px] font-medium leading-snug group-hover:text-[#B6F03F] transition-colors duration-300">
                  {item.name}
                </span>
                <span className="text-[#FAFCFA]/60 text-[11px] md:text-[12px] tracking-[0.1em] font-normal uppercase mt-0.5 group-hover:text-[#FAFCFA]/80 transition-colors duration-300">
                  {item.role}
                </span>
              </div>
            </div>

            {/* Descrição técnica */}
            <p className="text-[#FAFCFA]/75 text-[15px] font-normal leading-[1.65] group-hover:text-[#FAFCFA] transition-colors duration-300">
              {item.quote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
