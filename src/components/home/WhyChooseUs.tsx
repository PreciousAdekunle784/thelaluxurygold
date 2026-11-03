import { Reveal } from "@/components/ui/Reveal";

const icon = "h-11 w-11 text-champagne";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const features = [
  {
    title: "Authentic gold",
    copy: "Quality gold products you can trust.",
    svg: (
      <svg viewBox="0 0 48 48" className={icon} aria-hidden>
        <circle cx="24" cy="24" r="17" {...stroke} />
        <circle cx="24" cy="24" r="13" {...stroke} strokeDasharray="1.5 2.5" />
        <text x="24" y="28.5" textAnchor="middle" fill="currentColor" style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>
          Au
        </text>
      </svg>
    ),
  },
  {
    title: "Premium selection",
    copy: "Carefully selected jewellery and gold products.",
    svg: (
      <svg viewBox="0 0 48 48" className={icon} aria-hidden>
        <ellipse cx="24" cy="28" rx="13" ry="13" {...stroke} />
        <ellipse cx="24" cy="28" rx="9.5" ry="9.5" {...stroke} />
        <path d="M19 11l5-5 5 5-5 4z" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Worldwide delivery",
    copy: "Bringing luxury closer to you, wherever you are.",
    svg: (
      <svg viewBox="0 0 48 48" className={icon} aria-hidden>
        <circle cx="24" cy="24" r="17" {...stroke} />
        <ellipse cx="24" cy="24" rx="7.5" ry="17" {...stroke} />
        <path d="M7 24h34M9.5 15h29M9.5 33h29" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Exceptional service",
    copy: "Dedicated customer assistance.",
    svg: (
      <svg viewBox="0 0 48 48" className={icon} aria-hidden>
        <path d="M9 13h30v18H22l-8 6v-6H9z" {...stroke} />
        <path d="M16 20h16M16 25h10" {...stroke} />
      </svg>
    ),
  },
];

export function WhyChooseUs() {
  return (
    <section className="border-b border-line py-24 md:py-32" aria-labelledby="why-choose">
      <div className="container-luxe">
        <Reveal className="mb-16 flex flex-col items-center text-center md:mb-20">
          <p className="eyebrow mb-5 text-champagne">The LA Luxury Gold promise</p>
          <h2 id="why-choose" className="display max-w-3xl text-[2.3rem] uppercase sm:text-5xl lg:text-[3.6rem]">
            Why choose <span className="script">LA Luxury Gold</span>
          </h2>
        </Reveal>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal
              as="li"
              key={f.title}
              delay={i * 0.1}
              className="flex flex-col items-center border-line px-6 py-10 text-center max-lg:border-t sm:max-lg:[&:nth-child(odd)]:border-r lg:border-l lg:first:border-l-0 lg:py-4"
            >
              {f.svg}
              <h3 className="mt-7 font-display text-[1.65rem] leading-none">{f.title}</h3>
              <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-stone">{f.copy}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
