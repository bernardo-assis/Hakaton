export function Pricing() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small financial teams exploring AI.",
      price: "$199",
      period: "/mo",
      featured: false,
      buttonText: "Sign Up",
      buttonStyle: "bg-[#101320] hover:bg-[#1A1F33] text-white border border-white/10",
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
      buttonText: "Contact Sales",
      buttonStyle: "bg-white hover:bg-gray-100 text-[#070814] font-semibold shadow-md",
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
      buttonText: "Contact Sales",
      buttonStyle: "bg-[#101320] hover:bg-[#1A1F33] text-white border border-white/10",
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
      className="relative w-full px-6 lg:px-12 xl:px-20 py-32 text-[#FAFCFA] z-10 bg-[#070814]"
    >
      {/* Header Centralizado - 100% Fiel à Imagem de Referência */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
        <span className="text-[#38BDF8] text-[12px] md:text-[13px] font-semibold tracking-[0.25em] uppercase mb-4">
          PRICING
        </span>
        <h2 className="text-[38px] md:text-[50px] lg:text-[54px] font-semibold tracking-[-0.03em] text-white">
          Plans for every scale.
        </h2>
      </div>

      {/* Grid de 3 Planos - Fundo Sólido Matte sem efeito vidro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between transition-all duration-300 ${
              plan.featured
                ? "bg-[#030408] border border-white/15 rounded-[26px] p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative md:-translate-y-2"
                : "p-8 lg:p-10 flex flex-col justify-between rounded-[26px]"
            }`}
          >
            <div>
              {/* Título e Subtítulo */}
              <h3 className="text-white text-[24px] lg:text-[26px] font-semibold tracking-tight">
                {plan.name}
              </h3>
              <p className="text-[#94A3B8] text-[14px] mt-2 mb-6 leading-relaxed">
                {plan.description}
              </p>

              {/* Linha divisória fina (Destaque do plano Professional na referência) */}
              {plan.featured && (
                <div className="w-full h-px bg-white/15 mb-8" />
              )}

              {/* Preço */}
              <div className="flex items-baseline mb-8">
                <span className="text-[38px] lg:text-[44px] font-bold text-white tracking-tight">
                  {plan.price}
                </span>
                <span className="text-[#94A3B8] text-[16px] font-normal ml-1">
                  {plan.period}
                </span>
              </div>

              {/* Lista de Features com Marcador Losango (◆) */}
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-[#CBD5E1] text-[14px] lg:text-[15px]">
                    <span className="text-[#38BDF8] text-[10px] leading-none select-none">
                      ◆
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de Ação / CTA */}
            <button
              className={`w-full py-3.5 px-6 rounded-full text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer ${plan.buttonStyle}`}
            >
              <span>{plan.buttonText}</span>
              <span className="w-5 h-5 rounded-full bg-current/15 flex items-center justify-center text-[11px] leading-none">
                &gt;
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
