import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Play,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  useAllSessions,
  useGymWeekChecklist,
  useMarkGymDay,
  useWorkoutPlans,
} from "../hooks/useQueries";
import type { Page } from "../types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getMonday(d = new Date()) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

function getWeekSessions(sessions: { date: string }[]) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const startStr = start.toISOString().slice(0, 10);
  const endStr = today.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= startStr && s.date <= endStr).length;
}

// 4 gym day slots: Mon, Tue, Thu, Fri
function getGymSlotDates(mondayStr: string) {
  const mon = new Date(mondayStr);
  return [0, 1, 3, 4].map((offset) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });
}

interface DashboardProps {
  setPage: (p: Page) => void;
}

export default function Dashboard({ setPage }: DashboardProps) {
  const { data: plans = [], isLoading: plansLoading } = useWorkoutPlans();
  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessions();

  const weekStart = getMonday();
  const { data: gymDoneMap = {} } = useGymWeekChecklist(weekStart);
  const markGymDay = useMarkGymDay(weekStart);

  const isLoading = plansLoading || sessionsLoading;

  const todayDow = new Date().getDay();
  const today = todayStr();

  const todayWorkout = useMemo(() => {
    for (const plan of plans) {
      const day = plan.days.find((d) => Number(d.dayOfWeek) === todayDow);
      if (day) return { plan, day };
    }
    return null;
  }, [plans, todayDow]);

  const todaySession = sessions.find((s) => s.date === today);

  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [sessions]);

  const weekSchedule = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const matches = plans.flatMap((plan) =>
        plan.days
          .filter((d) => Number(d.dayOfWeek) === i)
          .map((d) => ({ planName: plan.name, dayLabel: d.dayLabel })),
      );
      return { dow: i, label: SHORT_DAYS[i], workouts: matches };
    });
  }, [plans]);

  const weekSessions = getWeekSessions(sessions);

  const gymSlotDates = getGymSlotDates(weekStart);
  const gymDoneCount = gymSlotDates.filter((d) => gymDoneMap[d]).length;
  const gymProgressPct = Math.round((gymDoneCount / 4) * 100);

  const handleToggleGymDay = (date: string, currentDone: boolean) => {
    markGymDay.mutate({ date, done: !currentDone });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
          Today&apos;s Journey
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back! Let&apos;s crush today&apos;s goals.
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Sessions",
            value: sessions.length,
            icon: TrendingUp,
            color: "text-secondary",
          },
          {
            label: "This Week",
            value: weekSessions,
            icon: CalendarDays,
            color: "text-accent",
          },
          {
            label: "Active Plans",
            value: plans.length,
            icon: Dumbbell,
            color: "text-success",
          },
        ].map(({ label, value, icon: Icon, color }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="shadow-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly Gym Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-6"
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                Weekly Gym Checklist
              </CardTitle>
              <motion.span
                key={gymDoneCount}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-sm font-bold ${
                  gymDoneCount === 4
                    ? "text-success"
                    : gymDoneCount > 0
                      ? "text-accent"
                      : "text-muted-foreground"
                }`}
              >
                Day {gymDoneCount} / 4 done
              </motion.span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Weekly Progress</span>
                <span>{gymProgressPct}%</span>
              </div>
              <Progress
                value={gymProgressPct}
                className="h-2"
                data-ocid="gym.checklist.progress"
              />
            </div>

            {/* Day slots */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gymSlotDates.map((date, idx) => {
                const isDone = gymDoneMap[date] ?? false;
                const isPending = markGymDay.isPending;
                return (
                  <motion.button
                    key={date}
                    type="button"
                    data-ocid={`gym.checklist.item.${idx + 1}`}
                    onClick={() =>
                      !isPending && handleToggleGymDay(date, isDone)
                    }
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                      isDone
                        ? "bg-success/10 border-success/40 text-success"
                        : "bg-muted/40 border-border hover:border-accent/40 hover:bg-accent/5 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all ${
                        isDone
                          ? "bg-success border-success text-white"
                          : "bg-background border-border"
                      }`}
                    >
                      {isDone && (
                        <motion.svg
                          role="img"
                          aria-label="Completed"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </motion.svg>
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-xs font-semibold ${
                          isDone ? "line-through opacity-70" : ""
                        }`}
                      >
                        Day {idx + 1}
                      </p>
                    </div>
                    {/* Hidden checkbox for a11y */}
                    <Checkbox
                      checked={isDone}
                      className="sr-only"
                      aria-label={`Mark Day ${
                        idx + 1
                      } as ${isDone ? "undone" : "done"}`}
                      tabIndex={-1}
                    />
                  </motion.button>
                );
              })}
            </div>

            {gymDoneCount === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center py-3 rounded-xl bg-success/10 border border-success/20"
              >
                <p className="text-sm font-semibold text-success">
                  🎉 Perfect week! All 4 gym days completed!
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout - dark card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-primary text-white border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/15 text-white hover:bg-white/20 text-xs">
                  {DAY_NAMES[todayDow]}
                </Badge>
                {todaySession && (
                  <Badge className="bg-success text-white hover:bg-success text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-white text-lg mt-2">
                {isLoading
                  ? "Loading..."
                  : todayWorkout
                    ? todayWorkout.day.dayLabel
                    : "Rest Day"}
              </CardTitle>
              {todayWorkout && (
                <p className="text-white/60 text-xs">
                  {todayWorkout.plan.name}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/20" />
                  <Skeleton className="h-4 w-24 bg-white/20" />
                </div>
              ) : todayWorkout ? (
                <>
                  <div className="space-y-2 mb-6">
                    {todayWorkout.day.exercises.slice(0, 4).map((ex) => (
                      <div
                        key={ex.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-white/80 text-sm">{ex.name}</span>
                        <span className="text-white/50 text-xs">
                          {Number(ex.sets)}×{Number(ex.targetReps)}
                        </span>
                      </div>
                    ))}
                    {todayWorkout.day.exercises.length > 4 && (
                      <p className="text-white/40 text-xs">
                        +{todayWorkout.day.exercises.length - 4} more
                      </p>
                    )}
                  </div>
                  <Button
                    data-ocid="dashboard.start_workout.primary_button"
                    className="w-full bg-accent hover:bg-accent/90 text-white font-semibold"
                    onClick={() => setPage("tracker")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {todaySession ? "Continue Workout" : "Start Workout"}
                  </Button>
                </>
              ) : (
                <div className="text-white/50 text-sm py-4 text-center">
                  No workout scheduled. Enjoy your rest day! 🎉
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-secondary" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weekSchedule.map(({ dow, label, workouts }) => (
                  <div
                    key={dow}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      dow === todayDow
                        ? "bg-primary/8 ring-1 ring-primary/20"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        dow === todayDow
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {label}
                    </div>
                    <div className="flex-1 min-w-0">
                      {workouts.length > 0 ? (
                        workouts.map((w) => (
                          <div key={w.dayLabel} className="truncate">
                            <span className="text-sm font-medium text-foreground">
                              {w.dayLabel}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              — {w.planName}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Rest day
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Recent Sessions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => setPage("history")}
                  data-ocid="dashboard.history.link"
                >
                  View all <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentSessions.length === 0 ? (
                <div
                  data-ocid="dashboard.sessions.empty_state"
                  className="text-center py-8"
                >
                  <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No sessions yet. Start your first workout!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((s, i) => {
                    const completed = s.logs.filter((l) => l.completed).length;
                    const total = s.logs.length;
                    const pct =
                      total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div
                        key={s.id}
                        data-ocid={`dashboard.sessions.item.${i + 1}`}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {s.dayLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-semibold text-accent">
                            {pct}%
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {completed}/{total} sets
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
