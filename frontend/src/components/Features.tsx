import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mousePos, setMousePos] = useState<Record<number, { x: number; y: number } | null>>({});

  const features = [
    {
      title: "Predictive Analytics",
      description: "Gain foresight into market trends and autonomous fleet telemetry.",
      image: "/images/feature-predictive.jpg",
      badge: "AI Forecasting",
      spotlightColor: "radial-gradient(circle, #38BDF8 0%, transparent 70%)",
    },
    {
      title: "Automated Compliance",
      description: "Ensure regulatory adherence and enforce mathematical hard caps.",
      image: "/images/feature-compliance.jpg",
      badge: "Policy Engine",
      spotlightColor: "radial-gradient(circle, #B6F03F 0%, transparent 70%)",
    },
    {
      title: "Fraud Detection",
      description: "Protect your assets proactively with real-time multi-sig shielding.",
      image: "/images/feature-fraud.jpg",
      badge: "Zero-Trust Shield",
      spotlightColor: "radial-gradient(circle, #10B981 0%, transparent 70%)",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Cascata no Scroll (Stagger Reveal)
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length && sectionRef.current) {
        gsap.fromTo(
          validCards,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            stagger: 0.16,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Zero-G Levitation (Flutuação contínua senoidal das esferas 3D)
      orbRefs.current.forEach((orb, idx) => {
        if (!orb) return;
        gsap.to(orb, {
          y: idx % 2 === 0 ? -9 : 9,
          duration: 3.2 + idx * 0.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: idx * 0.35,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // 3. Mouse Magnetic 3D Tilt Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const card = cardsRef.current[idx];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Ângulo de inclinação suave (até 6 graus)
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    gsap.to(card, {
      rotateX,
      rotateY,
      transformPerspective: 1000,
      duration: 0.25,
      ease: "power1.out",
    });

    setMousePos((prev) => ({ ...prev, [idx]: { x, y } }));
  };

  const handleMouseLeave = (idx: number) => {
    const card = cardsRef.current[idx];
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.7,
      ease: "power2.out",
    });

    setMousePos((prev) => ({ ...prev, [idx]: null }));
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 overflow-hidden"
    >
      {/* Luz ambiente de fundo (Glow sutil) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#B6F03F]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[250px] bg-[#38BDF8]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Centralizado — Harmonizado com a tipografia do site */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20 relative z-10">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Features
        </span>

        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-5 text-[#FAFCFA]">
          The future of finance is here.
        </h2>

        <p className="text-[18px] text-[#FAFCFA]/80 leading-relaxed max-w-xl">
          We provide cutting-edge AI tools to optimize your financial performance and secure autonomous execution.
        </p>
      </div>

      {/* Grid de 3 Cards com 3D Perspective Container */}
      <div
        style={{ perspective: 1200 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto relative z-10"
      >
        {features.map((item, idx) => (
          <div
            key={idx}
            ref={(el) => {
              cardsRef.current[idx] = el;
            }}
            onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseLeave={() => handleMouseLeave(idx)}
            className="group relative bg-[#090D17]/85 backdrop-blur-xl border border-white/10 hover:border-[#B6F03F]/40 rounded-[24px] p-6 lg:p-7 flex flex-col justify-between transition-colors duration-300 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] cursor-pointer overflow-hidden will-change-transform"
          >
            {/* Spotlight Dinâmico de Luz que segue o mouse */}
            {mousePos[idx] && (
              <div
                className="absolute pointer-events-none rounded-full w-[280px] h-[280px] -translate-x-1/2 -translate-y-1/2 blur-[80px] opacity-40 transition-opacity duration-300"
                style={{
                  top: mousePos[idx]?.y,
                  left: mousePos[idx]?.x,
                  background: item.spotlightColor,
                }}
              />
            )}

            {/* Container da Imagem 3D Holográfica com Flutuação Zero-G */}
            <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-black/60 border border-white/5 mb-6 shadow-inner flex items-center justify-center">
              <div
                ref={(el) => {
                  orbRefs.current[idx] = el;
                }}
                className="w-full h-full will-change-transform"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Degradê de fusão suave na base da imagem */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090D17] via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Badge discreto com efeito pill */}
              <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80 select-none">
                {item.badge}
              </div>
            </div>

            {/* Conteúdo do Card (Texto) */}
            <div className="relative z-10 flex flex-col">
              <h3 className="text-[22px] lg:text-[24px] font-medium text-[#FAFCFA] mb-2 group-hover:text-[#B6F03F] transition-colors duration-300 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[15px] text-[#FAFCFA]/70 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            {/* Linha de realce animada no rodapé do card */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-[#B6F03F] transition-colors relative z-10">
              <span className="font-mono">0{idx + 1} // PROTOCOL</span>
              <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">
                &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
