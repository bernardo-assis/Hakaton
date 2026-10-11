
export function Features() {
  const features = [
    {
      title: "Predictive Analytics",
      description: "Gain foresight into market trends and autonomous fleet telemetry.",
      image: "/images/feature-predictive.jpg",
      badge: "AI Forecasting",
      glowColor: "from-[#38BDF8]/10"
    },
    {
      title: "Automated Compliance",
      description: "Ensure regulatory adherence and enforce mathematical hard caps.",
      image: "/images/feature-compliance.jpg",
      badge: "Policy Engine",
      glowColor: "from-[#B6F03F]/10"
    },
    {
      title: "Fraud Detection",
      description: "Protect your assets proactively with real-time multi-sig shielding.",
      image: "/images/feature-fraud.jpg",
      badge: "Zero-Trust Shield",
      glowColor: "from-[#10B981]/10"
    }
  ];

  return (
    <section id="features" className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 overflow-hidden">
      {/* Luz ambiente de fundo (Glow sutil) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#B6F03F]/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[250px] bg-[#38BDF8]/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Centralizado - 100% Fiel à Referência */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20 relative z-10">
        <span className="text-[#38BDF8] text-[12px] md:text-[13px] font-semibold tracking-[0.25em] uppercase mb-4 px-3.5 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 backdrop-blur-sm">
          FEATURES
        </span>
        
        <h2 className="text-[38px] md:text-[50px] lg:text-[56px] font-semibold tracking-[-0.03em] leading-[1.1] mb-5 text-white">
          The future of finance is here.
        </h2>
        
        <p className="text-[16px] md:text-[18px] text-[#94A3B8] leading-relaxed max-w-xl">
          We provide cutting-edge AI tools to optimize your financial performance and secure autonomous execution.
        </p>
      </div>

      {/* Grid de 3 Cards - Clonagem e Adaptação da Referência Visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto relative z-10">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="group relative bg-[#090D17]/80 backdrop-blur-xl border border-white/10 hover:border-[#B6F03F]/40 rounded-[24px] p-6 lg:p-7 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] cursor-pointer overflow-hidden"
          >
            {/* Efeito Glow Interno Dinâmico no Hover */}
            <div className={`absolute -inset-px bg-gradient-to-b ${item.glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px] pointer-events-none`} />

            {/* Container da Imagem 3D Holográfica (Proporção 1:1) */}
            <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-black/60 border border-white/5 mb-6 shadow-inner">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:rotate-[0.5deg] transition-all duration-700 ease-out"
                loading="lazy"
              />
              
              {/* Degradê de fusão suave na base da imagem */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090D17] via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Badge discreto com efeito pill */}
              <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/80">
                {item.badge}
              </div>
            </div>

            {/* Conteúdo do Card (Texto) */}
            <div className="relative z-10 flex flex-col">
              <h3 className="text-[22px] lg:text-[24px] font-semibold text-white mb-2 group-hover:text-[#B6F03F] transition-colors duration-300 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[14px] lg:text-[15px] text-[#94A3B8] leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Linha de realce animada no rodapé do card */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 group-hover:text-[#B6F03F] transition-colors">
              <span className="font-mono">0{idx + 1} // PROTOCOL</span>
              <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
