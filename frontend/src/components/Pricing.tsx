export function Pricing() {
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

  return (
    <section
      id="pricing"
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 bg-[#060D0C]"
    >
      {/* Header Centralizado — Harmonizado com o restante do site */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Pricing
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FAFCFA]">
          Plans for every scale.
        </h2>
      </div>

      {/* Grid de 3 Planos - Fundo Sólido Matte fiel à imagem de referência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between transition-all duration-300 ${
              plan.featured
                ? "bg-[#0C1411] border border-white/15 rounded-[24px] p-8 lg:p-10 shadow-2xl relative md:-translate-y-2"
                : "p-8 lg:p-10 flex flex-col justify-between rounded-[24px]"
            }`}
          >
            <div>
              {/* Título e Subtítulo */}
              <h3 className="text-[#FAFCFA] text-[26px] font-normal tracking-tight">
                {plan.name}
              </h3>
              <p className="text-[#FAFCFA]/70 text-[15px] font-normal mt-2 mb-6 leading-relaxed">
                {plan.description}
              </p>

              {/* Linha divisória fina (Destaque do plano Professional na referência) */}
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

              {/* Lista de Features com Marcador Losango (◆) em Verde Neon */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-[#FAFCFA]/80 text-[15px] font-normal">
                    <span className="text-[#B6F03F] text-[10px] leading-none select-none">
                      ◆
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de Ação / CTA — Harmonizado com botões do Hero e Solutions */}
            <button
              className={`w-full flex items-center justify-center gap-2 cursor-pointer ${plan.buttonClass}`}
            >
              <span>{plan.buttonText}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
