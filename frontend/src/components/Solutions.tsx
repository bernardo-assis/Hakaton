import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SolutionsProps {
  onLaunchApp?: () => void;
  onOpenDocs?: () => void;
}

export function Solutions({ onLaunchApp, onOpenDocs }: SolutionsProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrada do Container Bento: scale: 0.94 -> 1, y: 50 -> 0
      if (containerRef.current && sectionRef.current) {
        gsap.fromTo(
          containerRef.current,
          { scale: 0.94, y: 50, opacity: 0.7 },
          {
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. 3D Perspective Tilt no Mockup: rotateX: 8deg -> 0deg no scroll
      if (mockupWrapperRef.current) {
        gsap.fromTo(
          mockupWrapperRef.current,
          {
            rotateX: 8,
            yPercent: 10,
            scale: 0.96,
            transformPerspective: 1200,
            transformOrigin: "center top",
          },
          {
            rotateX: 0,
            yPercent: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: mockupWrapperRef.current,
              start: "top 90%",
              end: "center 55%",
              scrub: 1.2,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-24 text-[#FAFCFA] z-10"
    >
      {/* Glassmorphism Container com Entrada Animada (scale & y) */}
      <div
        ref={containerRef}
        className="bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 lg:p-16 flex flex-col gap-12 lg:gap-16 shadow-2xl transition-shadow will-change-transform"
      >
        {/* Top Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
          {/* Left Text & Buttons */}
          <div className="flex flex-col max-w-2xl">
            <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
              Solutions
            </span>
            <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight mb-8 text-[#FAFCFA]">
              Automate your defense workflows.
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Botão Get Started com Efeito Shimmer a cada 5s */}
              <button
                onClick={onLaunchApp}
                className="relative overflow-hidden bg-[#FAFCFA] text-[#0C160B] text-[16px] font-medium rounded-[11px] px-8 py-3.5 hover:bg-gray-200 transition-colors whitespace-nowrap inline-flex items-center justify-center group cursor-pointer shadow-sm active:scale-95"
              >
                {/* Feixe dinâmico de luz (Shimmer) cruzando a cada 5 segundos */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/20 to-transparent skew-x-[-25deg] animate-shimmer pointer-events-none" />
                <span className="relative z-10">Get Started &gt;</span>
              </button>

              <button
                onClick={onOpenDocs}
                className="bg-[#202A29]/50 backdrop-blur-[12px] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] px-8 py-3.5 hover:bg-white/10 transition-colors whitespace-nowrap text-center cursor-pointer active:scale-95"
              >
                View Architecture Docs
              </button>
            </div>
          </div>

          {/* Right Description */}
          <div className="max-w-lg lg:pt-12">
            <p className="text-[18px] font-normal leading-[1.5] text-[#FAFCFA]/80">
              Our autonomous agents monitor your infrastructure 24/7, instantly
              neutralizing threats and ensuring continuous compliance without
              human bottlenecks.
            </p>
          </div>
        </div>

        {/* Bottom Mockup Area — Perspectiva 3D com Tilt conectado ao Scroll */}
        <div
          style={{ perspective: 1200 }}
          className="w-full flex justify-center"
        >
          <div
            ref={mockupWrapperRef}
            className="w-full relative rounded-[20px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(182,240,63,0.07)] will-change-transform"
          >
            {/* Camada sutil interativa no hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-500 z-10 pointer-events-none" />
            <img
              src="/images/dashboard-mockup.png"
              alt="AgentSafe Dashboard"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
