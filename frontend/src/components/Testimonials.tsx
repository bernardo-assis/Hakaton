export function Testimonials() {
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

  return (
    <section
      id="testimonials"
      className="relative w-full px-6 lg:px-12 xl:px-20 py-32 text-[#FAFCFA] z-10 bg-[#070814]"
    >
      {/* Header Centralizado - 100% Fiel à Imagem de Referência */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
        <span className="text-[#38BDF8] text-[12px] md:text-[13px] font-semibold tracking-[0.25em] uppercase mb-4">
          TESTIMONIALS
        </span>
        <h2 className="text-[38px] md:text-[50px] lg:text-[54px] font-semibold tracking-[-0.03em] text-white">
          What our clients say.
        </h2>
      </div>

      {/* Grid de 3 Colunas Limpas (Sem efeito vidro, fundo sólido, como na referência) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 max-w-7xl mx-auto">
        {testimonials.map((item, idx) => (
          <div key={idx} className="flex flex-col justify-start">
            {/* Header do Autor (Avatar + Info) */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-white text-[16px] font-semibold leading-snug">
                  {item.name}
                </span>
                <span className="text-[#94A3B8] text-[11px] md:text-[12px] tracking-[0.08em] font-medium uppercase mt-0.5">
                  {item.role}
                </span>
              </div>
            </div>

            {/* Citação */}
            <p className="text-[#CBD5E1] text-[15px] md:text-[16px] leading-[1.65] font-normal">
              {item.quote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
