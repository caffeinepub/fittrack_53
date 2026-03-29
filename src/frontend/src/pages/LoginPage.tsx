import { Button } from "@/components/ui/button";
import { BarChart3, CalendarDays, Dumbbell, Zap } from "lucide-react";
import { motion } from "motion/react";

interface LoginPageProps {
  login: () => void;
  loginStatus: string;
}

export default function LoginPage({ login, loginStatus }: LoginPageProps) {
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-primary text-white p-12 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FT</span>
          </div>
          <span className="font-bold text-xl tracking-tight">FitTrack</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold leading-tight mb-4">
            Track every rep.
            <br />
            Crush every goal.
          </h1>
          <p className="text-white/70 text-lg">
            Your personal fitness companion — plans, sets, reps, and progress
            all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: Dumbbell, label: "Workout Plans" },
              { icon: BarChart3, label: "Progress Tracking" },
              { icon: CalendarDays, label: "Weekly Schedule" },
              { icon: Zap, label: "Set & Rep Logging" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-white/80"
              >
                <Icon className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">FT</span>
            </div>
            <span className="font-bold text-xl text-foreground">FitTrack</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign in to continue your fitness journey.
          </p>
          <Button
            data-ocid="login.primary_button"
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base h-12"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Secure, decentralized authentication on the Internet Computer.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
