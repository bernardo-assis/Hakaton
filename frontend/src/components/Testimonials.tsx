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
      className="relative w-full px-6 lg:px-12 xl:px-20 py-28 text-[#FAFCFA] z-10 bg-[#060D0C]"
    >
      {/* Header Centralizado — Harmonizado com a tipografia do site */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 lg:mb-20">
        <span className="text-[#B6F03F] text-[14px] md:text-[16px] font-normal tracking-[0.2em] uppercase mb-4">
          Testimonials
        </span>
        <h2 className="text-[36px] md:text-[48px] lg:text-[56px] font-normal leading-[1.1] tracking-tight text-[#FAFCFA]">
          What our clients say.
        </h2>
      </div>

      {/* Grid de 3 Colunas Limpas (Sem efeito vidro, fundo sólido, como na referência) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 max-w-6xl mx-auto">
        {testimonials.map((item, idx) => (
          <div key={idx} className="flex flex-col justify-start">
            {/* Header do Autor (Avatar + Info) */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src={item.avatar}
                alt={item.name}
                className="w-[44px] h-[44px] rounded-full object-cover border border-white/10 shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-[#FAFCFA] text-[16px] font-medium leading-snug">
                  {item.name}
                </span>
                <span className="text-[#FAFCFA]/60 text-[11px] md:text-[12px] tracking-[0.1em] font-normal uppercase mt-0.5">
                  {item.role}
                </span>
              </div>
            </div>

            {/* Citação */}
            <p className="text-[#FAFCFA]/80 text-[16px] font-normal leading-[1.65]">
              {item.quote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
