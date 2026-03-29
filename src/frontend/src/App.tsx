import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import LoginPage from "./pages/LoginPage";
import MyPlans from "./pages/MyPlans";
import Progress from "./pages/Progress";
import Schedule from "./pages/Schedule";
import WorkoutTracker from "./pages/WorkoutTracker";
import type { Page } from "./types";

const queryClient = new QueryClient();

function AppContent() {
  const { identity, isInitializing, login, loginStatus } =
    useInternetIdentity();
  const { actor } = useActor();
  const [page, setPage] = useState<Page>("dashboard");
  const [seeded, setSeeded] = useState(false);

  const isLoggedIn = !!identity;

  const seedAndLoad = useCallback(async () => {
    if (!actor || !isLoggedIn || seeded) return;
    try {
      await actor.seedSampleData();
    } catch (_e) {
      // ignore if already seeded
    }
    setSeeded(true);
  }, [actor, isLoggedIn, seeded]);

  useEffect(() => {
    seedAndLoad();
  }, [seedAndLoad]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">FT</span>
          </div>
          <p className="text-muted-foreground text-sm">Loading FitTrack...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage login={login} loginStatus={loginStatus} />;
  }

  return (
    <Layout page={page} setPage={setPage}>
      {page === "dashboard" && <Dashboard setPage={setPage} />}
      {page === "plans" && <MyPlans />}
      {page === "progress" && <Progress />}
      {page === "tracker" && <WorkoutTracker />}
      {page === "schedule" && <Schedule />}
      {page === "history" && <History />}
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
