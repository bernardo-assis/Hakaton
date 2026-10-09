import { useState } from "react";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { AgentFleet } from "./pages/AgentFleet";
import { Simulator } from "./pages/Simulator";
import { VaultBudgets } from "./pages/VaultBudgets";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard"); // Começando na nova tela para ver o resultado

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-inter pb-12">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
      {currentPage === "fleet" && <AgentFleet />}
      {currentPage === "simulator" && <Simulator />}
      {currentPage === "vault" && <VaultBudgets />}
    </div>
  );
}

export default App;
