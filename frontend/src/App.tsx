import { useState } from "react";
import { WalletAuthProvider, useWalletAuth } from "./components/WalletAuth";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { AgentFleet } from "./pages/AgentFleet";
import { Simulator } from "./pages/Simulator";
import { VaultBudgets } from "./pages/VaultBudgets";

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
              Conecte sua carteira para entrar
            </h1>
            <p role="status" className="text-[#777D85] text-[13px]">
              {auth.status === "checking"
                ? "Verificando sua sessão..."
                : auth.status === "signing"
                  ? "Confirme a assinatura da mensagem na Phantom."
                  : auth.status === "revoking"
                    ? "Encerrando a sessão anterior..."
                    : "Use Conectar Phantom Wallet e assine a mensagem para acessar seus cofres e agentes."}
            </p>
            <p className="text-[#777D85] text-[12px] mt-3">
              A assinatura autentica sua carteira; não autoriza transferências.
              Os dados são exibidos somente após a verificação.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

function App() {
  return (
    <WalletAuthProvider>
      <AuthenticatedApp />
    </WalletAuthProvider>
  );
}

export default App;
