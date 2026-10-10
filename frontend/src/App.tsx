import { useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { AgentFleet } from "./pages/AgentFleet";
import { Simulator } from "./pages/Simulator";
import { VaultBudgets } from "./pages/VaultBudgets";
import { Hero } from "./components/Hero";
import { Solutions } from "./components/Solutions";
import { Features } from "./components/Features";
import { Services } from "./components/Services";

function App() {
  const [currentPage, setCurrentPage] = useState("landing");

  return (
    <>
      {currentPage === "landing" ? (
        <div className="w-full relative bg-[#060D0C]">
          
          {/* Fundo de Vídeo (Google Flow / Veo 3.1) - Fixo para todo o site */}
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
          
          {/* Botão flutuante temporário para ir pro App interno */}
          <button 
            onClick={() => setCurrentPage("dashboard")}
            className="fixed bottom-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20"
          >
            Acessar Sistema Interno &rarr;
          </button>
        </div>
      ) : (
        <div className="min-h-screen bg-[#F3F4F6] font-inter pb-12">
          <Header currentPage={currentPage} onNavigate={setCurrentPage} />
          {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
          {currentPage === "fleet" && <AgentFleet />}
          {currentPage === "simulator" && <Simulator />}
          {currentPage === "vault" && <VaultBudgets />}
        </div>
      )}
    </>
  );
}

export default App;
