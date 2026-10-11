import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface PricingProps {
  onLaunchApp?: () => void;
}

export function Pricing({ onLaunchApp }: PricingProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const featuredCardRef = useRef<HTMLDivElement>(null);
  const bulletsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for small financial teams exploring AI.",
      price: "$199",
      period: "/mo",
      featured: false,
      buttonText: "Sign Up >",
      buttonClass:
        "bg-[#202A29]/60 hover:bg-[#202A29] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] py-3.5 px-6 transition-colors",
      features: [
        "Up to 2 users",
        "Basic analytics access",
        "Core AI tools",
        "Standard support",
      ],
    },
    {
      name: "Professional",
      description: "Ideal for growing financial institutions.",
      price: "$499",
      period: "/mo",
      featured: true,
      buttonText: "Contact Sales >",
      buttonClass:
        "bg-[#B6F03F] hover:bg-[#a3d938] text-[#0C160B] text-[16px] font-normal rounded-[11px] py-3.5 px-6 transition-colors shadow-lg",
      features: [
        "Up to 10 users",
        "Advanced analytics access",
        "Enhanced AI features",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      description: "Best for large organizations with complex needs.",
      price: "$899",
      period: "/mo",
      featured: false,
      buttonText: "Contact Sales >",
      buttonClass:
        "bg-[#202A29]/60 hover:bg-[#202A29] border border-white/10 text-[#FAFCFA] text-[16px] font-normal rounded-[11px] py-3.5 px-6 transition-colors",
      features: [
        "Unlimited Users",
        "Comprehensive analytics",
        "Custom AI solutions",
        "Dedicated support",
      ],
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrada suave dos 3 Cards (Stagger Reveal)
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length && sectionRef.current) {
        gsap.fromTo(
          validCards,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Spotlight no Card Professional (Acende aura verde neon no centro)
      if (featuredCardRef.current && sectionRef.current) {
        gsap.fromTo(
          featuredCardRef.current,
          {
            boxShadow: "0 0 0px rgba(182, 240, 63, 0)",
            borderColor: "rgba(255, 255, 255, 0.15)",
          },
          {
            boxShadow: "0 0 55px rgba(182, 240, 63, 0.22)",
            borderColor: "rgba(182, 240, 63, 0.45)",
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 68%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 3. Cyber Bullets: Acendimento sequencial dos losangos (◆)
      const validBullets = bulletsRef.current.filter(Boolean);
      if (validBullets.length && sectionRef.current) {
        gsap.fromTo(
          validBullets,
          { opacity: 0.2, scale: 0.7, filter: "brightness(0.6)" },
          {
            opacity: 1,
            scale: 1,
            filter: "brightness(1.4) drop-shadow(0 0 6px #B6F03F)",
            duration: 0.4,
            stagger: 0.06,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 62%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  let bulletCounter = 0;

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 bg-[#060D0C] overflow-hidden"
    >
      {/* Header Centralizado */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Pricing
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FAFCFA]">
          Plans for every scale.
        </h2>
      </div>

      {/* Grid de 3 Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            ref={(el) => {
              cardsRef.current[idx] = el;
              if (plan.featured) {
                featuredCardRef.current = el;
              }
            }}
            className={`flex flex-col justify-between transition-all duration-300 will-change-transform ${
              plan.featured
                ? "bg-[#0C1411] border rounded-[24px] p-8 lg:p-10 shadow-2xl relative md:-translate-y-2 z-10"
                : "p-8 lg:p-10 flex flex-col justify-between rounded-[24px] border border-white/5 bg-[#0C1411]/40 hover:border-white/10"
            }`}
          >
            <div>
              {/* Título e Subtítulo */}
              <div className="flex items-center justify-between">
                <h3 className="text-[#FAFCFA] text-[26px] font-normal tracking-tight">
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="text-[11px] font-mono text-[#0C160B] bg-[#B6F03F] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
              </div>

              <p className="text-[#FAFCFA]/70 text-[15px] font-normal mt-2 mb-6 leading-relaxed">
                {plan.description}
              </p>

              {/* Linha divisória fina */}
              {plan.featured && (
                <div className="w-full h-px bg-white/10 mb-8" />
              )}

              {/* Preço */}
              <div className="flex items-baseline mb-8">
                <span className="text-[42px] lg:text-[48px] font-normal text-[#FAFCFA] tracking-tight">
                  {plan.price}
                </span>
                <span className="text-[#FAFCFA]/70 text-[16px] font-normal ml-1">
                  {plan.period}
                </span>
              </div>

              {/* Lista de Features com Cyber Bullets animados */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => {
                  const currentBulletIdx = bulletCounter++;
                  return (
                    <li
                      key={fIdx}
                      className="flex items-center gap-3 text-[#FAFCFA]/80 text-[15px] font-normal"
                    >
                      <span
                        ref={(el) => {
                          bulletsRef.current[currentBulletIdx] = el;
                        }}
                        className="text-[#B6F03F] text-[11px] leading-none select-none inline-block will-change-transform"
                      >
                        ◆
                      </span>
                      <span>{feature}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Botão de Ação / CTA */}
            <button
              onClick={onLaunchApp}
              className={`w-full flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${plan.buttonClass}`}
            >
              <span>{plan.buttonText}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
