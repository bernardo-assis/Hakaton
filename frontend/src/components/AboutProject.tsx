import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AboutProjectProps {
  onLaunchApp?: () => void;
  onOpenDocs?: () => void;
}

export function AboutProject({ onLaunchApp, onOpenDocs }: AboutProjectProps = {}) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const problemCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const techCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Entrada suave da seção
      if (containerRef.current && sectionRef.current) {
        gsap.fromTo(
          containerRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 2. Cascata nos cards de Problema & Solução
      const validProblemCards = problemCardsRef.current.filter(Boolean);
      if (validProblemCards.length && sectionRef.current) {
        gsap.fromTo(
          validProblemCards,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: validProblemCards[0],
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // 3. Cascata nos cards de Tecnologia
      const validTechCards = techCardsRef.current.filter(Boolean);
      if (validTechCards.length && sectionRef.current) {
        gsap.fromTo(
          validTechCards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: validTechCards[0],
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const coreCards = [
    {
      badge: "THE CHALLENGE",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      title: "The Agentic Dilemma (The Problem)",
      description:
        "Enterprises and developers are delegating direct financial autonomy to AI agents for trading, web scraping, and API operations. However, a single prompt injection, runtime bug, or LLM hallucination can drain 100% of the corporate treasury in seconds without remediation.",
      highlight: "Vulnerability: Unbounded Autonomous Wallets",
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      badge: "THE SOLUTION",
      badgeColor: "text-[#B6F03F] bg-[#B6F03F]/10 border-[#B6F03F]/20",
      title: "Programmable Financial Guardrails (The Solution)",
      description:
        "AgentSafe intercepts agent transaction intents in under 5ms before broadcast. Enforces mathematical hard caps, per-transaction ceilings, strict recipient whitelists, and optional human-in-the-loop approvals for anomalous or high-risk transfers.",
      highlight: "Protection: Deterministic Sub-5ms Interception",
      icon: (
        <svg className="w-5 h-5 text-[#B6F03F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      badge: "KEY HYGIENE",
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      title: "Non-Custodial Multi-Vault Isolation",
      description:
        "Operational test vaults function with isolated, scoped ephemeral signers. Master Phantom treasury keys remain 100% cold and decoupled from cloud server environments, eliminating single points of cryptographic failure.",
      highlight: "Architecture: Zero Private Key Exposure",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const technologies = [
    {
      category: "SETTLEMENT & BLOCKCHAIN",
      title: "Solana Blockchain & Devnet",
      spec: "Fast settlement & micropayments",
      desc: "Instant finality and near-zero transaction fees on Solana Devnet, perfectly optimized for high-cadence autonomous agent micro-transfers.",
      badge: "Solana Web3.js",
    },
    {
      category: "CRYPTOGRAPHIC SECURITY",
      title: "Ed25519 Cryptography & Key Management",
      spec: "Isolated keypair generation",
      desc: "Cryptographically air-gapped signing architecture. Client-side signers never expose primary Phantom treasury credentials to backend instances.",
      badge: "Ed25519 / TweetNaCl",
    },
    {
      category: "ACID CONCURRENCY",
      title: "PostgreSQL 15 & Advisory Locks",
      spec: "pg_advisory_xact_lock concurrency & idempotency",
      desc: "Hardware-level serial execution via PostgreSQL advisory transaction locks, completely eliminating double-spend race conditions in distributed fleets.",
      badge: "Advisory Locks",
    },
    {
      category: "BACKEND ARCHITECTURE",
      title: "Node.js & Express REST API",
      spec: "Clean architecture: routes, controllers, services, repositories",
      desc: "Robust domain-driven service architecture with end-to-end type safety, strict schema validation, and deterministic pre-flight policy evaluation.",
      badge: "TypeScript Clean Arch",
    },
    {
      category: "INSTITUTIONAL UI",
      title: "React 19, Vite & Tailwind CSS",
      spec: "High-performance institutional Web3 UI & micro-interactions",
      desc: "Zero-CLS reactive dashboard featuring Lenis smooth scrolling, GSAP hardware-accelerated animations, and real-time fleet health telemetry.",
      badge: "React 19 + GSAP",
    },
    {
      category: "CLOUD ORCHESTRATION",
      title: "Docker Swarm & Traefik",
      spec: "Containerized overlay networks & automated SSL termination",
      desc: "Resilient container overlay mesh, automated TLS certificates via Let's Encrypt, and seamless horizontal microservice scaling.",
      badge: "Docker + Traefik",
    },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative w-full px-6 lg:px-12 xl:px-20 py-24 text-[#FAFCFA] z-10"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[600px] h-[300px] bg-[#B6F03F]/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[260px] bg-cyan-500/5 blur-[140px] pointer-events-none rounded-full" />

      {/* Main Glassmorphism Container */}
      <div
        ref={containerRef}
        className="max-w-7xl mx-auto bg-[#0C1411]/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 lg:p-16 flex flex-col gap-16 shadow-2xl relative overflow-hidden will-change-transform"
      >
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 border-b border-white/10 pb-12">
          <div className="flex flex-col max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B6F03F]/10 border border-[#B6F03F]/30 text-[#B6F03F] text-[12px] md:text-[13px] font-medium tracking-[0.18em] uppercase mb-5 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#B6F03F] animate-pulse" />
              ABOUT AGENTSAFE
            </div>
            <h2 className="text-[34px] md:text-[46px] lg:text-[54px] font-normal leading-[1.12] tracking-tight text-[#FAFCFA]">
              The Zero-Trust Financial Firewall for Autonomous AI.
            </h2>
          </div>

          <div className="max-w-md lg:pt-8">
            <p className="text-[17px] md:text-[18px] font-normal leading-[1.55] text-[#FAFCFA]/80">
              As AI agents evolve from read-only advisors into autonomous financial actors, AgentSafe acts as the deterministic guardrail—preventing catastrophic treasury drain from prompts, bugs, and hallucinations.
            </p>
          </div>
        </div>

        {/* Part 1: The Core Problem & Solution (Grid of 3 Cards) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#B6F03F] text-[13px] font-mono tracking-[0.2em] uppercase">
                // SYSTEMIC RISK & RESOLUTION
              </span>
              <h3 className="text-[26px] md:text-[32px] font-normal tracking-tight text-[#FAFCFA] mt-1">
                The Core Problem &amp; Architecture
              </h3>
            </div>
            <p className="text-[14px] text-[#FAFCFA]/60 font-mono">
              ZERO-TRUST EXECUTION MODEL
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {coreCards.map((card, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  problemCardsRef.current[idx] = el;
                }}
                className="group relative bg-[#121A18]/60 hover:bg-[#121A18]/90 backdrop-blur-md border border-white/10 hover:border-[#B6F03F]/40 rounded-[24px] p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] will-change-transform"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <span
                      className={`text-[11px] font-medium tracking-[0.14em] uppercase px-3 py-1 rounded-full border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                  </div>

                  <h4 className="text-[20px] font-medium text-[#FAFCFA] mb-3 group-hover:text-[#B6F03F] transition-colors leading-snug">
                    {card.title}
                  </h4>

                  <p className="text-[15px] font-normal text-[#FAFCFA]/75 leading-[1.65]">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[12px] text-[#FAFCFA]/60 font-mono">
                  <span>{card.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Full-Stack Technology Stack */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#B6F03F] text-[13px] font-mono tracking-[0.2em] uppercase">
                // PRODUCTION READINESS
              </span>
              <h3 className="text-[26px] md:text-[32px] font-normal tracking-tight text-[#FAFCFA] mt-1">
                Full-Stack Technology Stack
              </h3>
            </div>
            <p className="text-[14px] text-[#FAFCFA]/60 font-mono">
              STANDARDS-COMPLIANT ARCHITECTURE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map((tech, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  techCardsRef.current[idx] = el;
                }}
                className="group relative bg-[#121A18]/50 hover:bg-[#121A18]/80 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-[20px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 will-change-transform"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono text-[#FAFCFA]/50 tracking-[0.14em] uppercase">
                      {tech.category}
                    </span>
                    <span className="text-[11px] font-mono text-[#B6F03F] bg-[#B6F03F]/10 border border-[#B6F03F]/20 px-2 py-0.5 rounded">
                      {tech.badge}
                    </span>
                  </div>

                  <h4 className="text-[18px] font-medium text-[#FAFCFA] mb-1.5 group-hover:text-[#B6F03F] transition-colors leading-snug">
                    {tech.title}
                  </h4>

                  <p className="text-[13px] text-[#B6F03F]/80 font-mono mb-3">
                    {tech.spec}
                  </p>

                  <p className="text-[14px] text-[#FAFCFA]/70 leading-relaxed font-normal">
                    {tech.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3: Action Banner & CTAs */}
        <div className="bg-[#121A18]/80 border border-white/10 rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#B6F03F]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col text-center md:text-left relative z-10">
            <h4 className="text-[22px] md:text-[26px] font-medium text-[#FAFCFA] mb-2 tracking-tight">
              Ready to deploy zero-trust guardrails?
            </h4>
            <p className="text-[15px] text-[#FAFCFA]/70 max-w-xl">
              Connect your Phantom wallet, configure deterministic spending limits, and give your AI agent fleet financial autonomy without treasury risks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
            <button
              onClick={onLaunchApp}
              className="bg-[#B6F03F] text-[#0C160B] text-[15px] font-medium rounded-[11px] px-6 py-3.5 hover:bg-[#a3d938] transition-colors whitespace-nowrap text-center cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>Launch Dashboard</span>
              <span>&rarr;</span>
            </button>
            <button
              onClick={onOpenDocs}
              className="bg-[#202A29]/60 backdrop-blur-[12px] border border-white/10 text-[#FAFCFA] text-[15px] font-normal rounded-[11px] px-6 py-3.5 hover:bg-[#202A29]/90 transition-colors whitespace-nowrap text-center cursor-pointer active:scale-95"
            >
              Read Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
