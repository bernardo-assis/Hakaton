import { useState, useEffect } from "react";
import Lenis from "lenis";
import { WalletAuthProvider, useWalletAuth } from "./components/WalletAuth";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { AgentFleet } from "./pages/AgentFleet";
import { Simulator } from "./pages/Simulator";
import { VaultBudgets } from "./pages/VaultBudgets";
import { Hero } from "./components/Hero";
import { Solutions } from "./components/Solutions";
import { Features } from "./components/Features";
import { Services } from "./components/Services";
import { Testimonials } from "./components/Testimonials";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

function AuthenticatedApp() {
  const auth = useWalletAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-inter pb-12">
      <Header
        key={`header-${auth.generation}`}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      {auth.session ? (
        <div key={`content-${auth.generation}`}>
          {currentPage === "dashboard" && (
            <Dashboard onNavigate={setCurrentPage} />
          )}
          {currentPage === "fleet" && <AgentFleet />}
          {currentPage === "simulator" && <Simulator />}
          {currentPage === "vault" && <VaultBudgets />}
        </div>
      ) : (
        <main className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100">
            <h1 className="text-[#111827] text-[24px] font-medium mb-3">
              Connect your wallet to enter
            </h1>
            <p role="status" className="text-[#777D85] text-[13px]">
              {auth.status === "checking"
                ? "Verifying your session..."
                : auth.status === "signing"
                  ? "Confirm the message signature in Phantom."
                  : auth.status === "revoking"
                    ? "Closing previous session..."
                    : "Use Connect Phantom Wallet and sign the message to access your vaults and agents."}
            </p>
            <p className="text-[#777D85] text-[12px] mt-3">
              The signature authenticates your wallet; it does not authorize transfers.
              Data is displayed only after verification.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("landing");

  useEffect(() => {
    if (currentPage !== "landing") return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [currentPage]);

  return (
    <>
      {currentPage === "landing" ? (
        <div className="w-full relative bg-[#060D0C]">
          
          {/* Fundo de Vdeo (Google Flow / Veo 3.1) - Fixo para todo o site */}
          <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
            <video 
              autoPlay 
              loop
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-90 scale-[1.15]"
            >
              <source src="/videos/hero-bg-pingpong.mp4?v=5" type="video/mp4" />
            </video>
          </div>

          <Hero />
          <Solutions />
          <Features />
          <Services />
          <Testimonials />
          <Pricing />
          <Footer />
          
          {/* Botǜo flutuante temporǭrio para ir pro App interno */}
          <button 
            onClick={() => setCurrentPage("dashboard")}
            className="fixed bottom-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20"
          >
            Acessar Sistema Interno &rarr;
          </button>
        </div>
      ) : (
        <WalletAuthProvider>
          <AuthenticatedApp />
        </WalletAuthProvider>
      )}
    </>
  );
}

export default App;
