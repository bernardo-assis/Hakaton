import { useState, useEffect, useRef, lazy, Suspense } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "./components/Hero";
import { AboutProject } from "./components/AboutProject";
import { Solutions } from "./components/Solutions";
import { Features } from "./components/Features";
import { Services } from "./components/Services";
import { Testimonials } from "./components/Testimonials";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

gsap.registerPlugin(ScrollTrigger);

const AuthenticatedApp = lazy(() => import("./components/AuthenticatedApp"));

function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [appSection, setAppSection] = useState("dashboard");
  const videoRef = useRef<HTMLVideoElement>(null);

  const launchApp = (section: string = "dashboard") => {
    setAppSection(section);
    setCurrentPage("app");
  };

  const openDocs = () => {
    setAppSection("docs");
    setCurrentPage("app");
  };

  useEffect(() => {
    if (currentPage !== "landing") return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    let animationFrameId: number | null = null;
    let isRunning = true;

    function raf(time: number) {
      if (!isRunning) return;
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        videoRef.current?.pause();
      } else {
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(raf);
        }
        videoRef.current?.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      lenis.destroy();
    };
  }, [currentPage]);

  return (
    <>
      {currentPage === "landing" ? (
        <div className="w-full relative bg-[#060D0C]">

          {/* Fundo de Vídeo (Google Flow / Veo 3.1) - Fixo para todo o site */}
          <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-90 scale-[1.15]"
            >
              <source src="/videos/hero-bg-pingpong-opt.mp4" type="video/mp4" />
            </video>
          </div>

          <Hero onLaunchApp={() => launchApp("dashboard")} onOpenDocs={openDocs} />
          <AboutProject onLaunchApp={() => launchApp("dashboard")} onOpenDocs={openDocs} />
          <Solutions onLaunchApp={() => launchApp("dashboard")} onOpenDocs={openDocs} />
          <Features />
          <Services />
          <Testimonials />
          <Pricing onLaunchApp={() => launchApp("dashboard")} />
          <Footer onLaunchApp={() => launchApp("dashboard")} onOpenDocs={openDocs} />

          {/* Quick Launch Floating Pill */}
          <button
            onClick={() => launchApp("dashboard")}
            className="fixed bottom-6 right-6 z-50 bg-[#B6F03F] text-[#0C160B] font-semibold px-5 py-2.5 rounded-full text-xs shadow-xl hover:bg-[#a3d938] transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-[#B6F03F]/40"
          >
            <span>Launch App</span>
            <span>&rarr;</span>
          </button>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <AuthenticatedApp
            initialPage={appSection}
            onBackToLanding={() => setCurrentPage("landing")}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;
