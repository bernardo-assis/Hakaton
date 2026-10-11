import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<(HTMLDivElement | null)[]>([]);

  const testimonials = [
    {
      avatar: "/images/avatar-1.png",
      name: "Jane Doe",
      role: "CFO, GLOBAL BANK",
      quote:
        "“AgentSafe has transformed our operations, bringing unparalleled efficiency and insight to our banking processes.”",
    },
    {
      avatar: "/images/avatar-2.png",
      name: "Celine Smith",
      role: "CEO, INVESTCORP",
      quote:
        "“We've seen significant improvements in our investment strategies and risk management since partnering with AgentSafe.”",
    },
    {
      avatar: "/images/avatar-3.png",
      name: "Mike Jones",
      role: "ANALYST, FINCONSULT",
      quote:
        "“Their AI solutions are practical, data-driven, and immediately actionable for our consulting needs.”",
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
          Testimonials
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FAFCFA]">
          What our clients say.
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
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            ref={(el) => {
              columnsRef.current[idx] = el;
            }}
            className="flex flex-col justify-start group cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 will-change-transform"
          >
            {/* Header do Autor (Avatar + Info) */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-[48px] h-[48px] rounded-full object-cover border border-white/10 shadow-sm transition-all duration-300 group-hover:ring-2 group-hover:ring-[#B6F03F] group-hover:shadow-[0_0_18px_rgba(182,240,63,0.45)]"
              />
              <div className="flex flex-col">
                <span className="text-[#FAFCFA] text-[16px] font-medium leading-snug group-hover:text-[#B6F03F] transition-colors duration-300">
                  {item.name}
                </span>
                <span className="text-[#FAFCFA]/60 text-[11px] md:text-[12px] tracking-[0.1em] font-normal uppercase mt-0.5 group-hover:text-[#FAFCFA]/80 transition-colors duration-300">
                  {item.role}
                </span>
              </div>
            </div>

            {/* Citação com destaque de contraste no hover */}
            <p className="text-[#FAFCFA]/75 text-[16px] font-normal leading-[1.65] group-hover:text-[#FAFCFA] transition-colors duration-300">
              {item.quote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
