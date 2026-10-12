import { useState, lazy, Suspense } from "react";
import { WalletAuthProvider, useWalletAuth } from "./WalletAuth";
import { Header } from "./Header";

const Dashboard = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const AgentFleet = lazy(() => import("../pages/AgentFleet").then((m) => ({ default: m.AgentFleet })));
const Simulator = lazy(() => import("../pages/Simulator").then((m) => ({ default: m.Simulator })));
const VaultBudgets = lazy(() => import("../pages/VaultBudgets").then((m) => ({ default: m.VaultBudgets })));
const Docs = lazy(() => import("../pages/Docs").then((m) => ({ default: m.Docs })));

export function AuthenticatedLoadingState() {
  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8">
      <div className="bg-white rounded-[22px] p-8 shadow-sm border border-gray-100 min-h-[320px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[#777D85] text-[13px] font-medium">Loading workspace...</p>
      </div>
    </div>
  );
}

function AuthenticatedInner({
  initialPage = "dashboard",
  onBackToLanding,
}: {
  initialPage?: string;
  onBackToLanding?: () => void;
}) {
  const auth = useWalletAuth();
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handleNavigate = (page: string) => {
    if (page === "landing" && onBackToLanding) {
      onBackToLanding();
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-inter pb-12">
      <Header
        key={`header-${auth.generation}`}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      <Suspense fallback={<AuthenticatedLoadingState />}>
        {currentPage === "docs" ? (
          <Docs onNavigate={handleNavigate} />
        ) : auth.session ? (
          <div key={`content-${auth.generation}`}>
            {currentPage === "dashboard" && (
              <Dashboard onNavigate={handleNavigate} />
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
      </Suspense>
    </div>
  );
}

export function AuthenticatedApp(props: {
  initialPage?: string;
  onBackToLanding?: () => void;
}) {
  return (
    <WalletAuthProvider>
      <AuthenticatedInner {...props} />
    </WalletAuthProvider>
  );
}

export default AuthenticatedApp;
