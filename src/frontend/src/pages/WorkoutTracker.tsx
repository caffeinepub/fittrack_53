import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Dumbbell,
  Pencil,
  Play,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { LogEntry, WorkoutSession } from "../backend.d.ts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSession,
  useSessionsByDate,
  useUpdateSessionLog,
  useWorkoutPlans,
} from "../hooks/useQueries";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type SetInputMap = Record<
  string,
  Record<number, { reps: string; weight: string }>
>;

function getFinishedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem("finishedSessions");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSessionFinished(id: string) {
  const set = getFinishedSessions();
  set.add(id);
  localStorage.setItem("finishedSessions", JSON.stringify([...set]));
}

export default function WorkoutTracker() {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const { identity } = useInternetIdentity();
  const { data: plans = [], isLoading: plansLoading } = useWorkoutPlans();
  const {
    data: dateSessions = [],
    isLoading: sessionsLoading,
    refetch,
  } = useSessionsByDate(selectedDate);
  const createSession = useCreateSession();
  const updateLog = useUpdateSessionLog();

  const [setInputs, setSetInputs] = useState<SetInputMap>({});
  const [editingSet, setEditingSet] = useState<{
    ex: string;
    si: number;
  } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const selectedDow = new Date(`${selectedDate}T12:00:00`).getDay();

  const scheduledWorkout =
    plans.flatMap((plan) =>
      plan.days
        .filter((d) => Number(d.dayOfWeek) === selectedDow)
        .map((d) => ({ plan, day: d })),
    )[0] ?? null;

  const currentSession = dateSessions[0] ?? null;

  // Track finished state
  useEffect(() => {
    if (currentSession) {
      setIsFinished(getFinishedSessions().has(currentSession.id));
    } else {
      setIsFinished(false);
    }
  }, [currentSession]);

  useEffect(() => {
    if (!scheduledWorkout) return;
    const inputs: SetInputMap = {};
    for (const ex of scheduledWorkout.day.exercises) {
      inputs[ex.name] = {};
      for (let s = 0; s < Number(ex.sets); s++) {
        const existing = currentSession?.logs.find(
          (l) => l.exerciseName === ex.name && Number(l.setNumber) === s + 1,
        );
        inputs[ex.name][s] = {
          reps: existing ? String(existing.reps) : String(ex.targetReps),
          weight: existing ? String(existing.weight) : String(ex.targetWeight),
        };
      }
    }
    setSetInputs(inputs);
  }, [scheduledWorkout, currentSession]);

  async function handleStartSession() {
    if (!scheduledWorkout || !identity) return;
    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      planId: scheduledWorkout.plan.id,
      owner: identity.getPrincipal(),
      date: selectedDate,
      logs: [],
      dayLabel: scheduledWorkout.day.dayLabel,
    };
    try {
      await createSession.mutateAsync(session);
      await refetch();
      toast.success("Session started!");
    } catch (_e) {
      toast.error("Failed to start session");
    }
  }

  async function handleLogSet(exerciseName: string, setIdx: number) {
    if (!currentSession) return;
    const input = setInputs[exerciseName]?.[setIdx];
    if (!input) return;
    const log: LogEntry = {
      exerciseName,
      setNumber: BigInt(setIdx + 1),
      reps: BigInt(Number(input.reps) || 0),
      weight: Number(input.weight) || 0,
      completed: true,
    };
    try {
      await updateLog.mutateAsync({ sessionId: currentSession.id, log });
      await refetch();
      setEditingSet(null);
      toast.success(`Set ${setIdx + 1} logged!`);
    } catch (_e) {
      toast.error("Failed to log set");
    }
  }

  async function handleLogAll() {
    if (!currentSession || !scheduledWorkout) return;
    const uncompletedSets: { exerciseName: string; setIdx: number }[] = [];
    for (const ex of scheduledWorkout.day.exercises) {
      for (let si = 0; si < Number(ex.sets); si++) {
        if (!isSetCompleted(ex.name, si)) {
          uncompletedSets.push({ exerciseName: ex.name, setIdx: si });
        }
      }
    }
    if (uncompletedSets.length === 0) {
      toast.info("All sets already logged!");
      return;
    }
    try {
      for (const { exerciseName, setIdx } of uncompletedSets) {
        const input = setInputs[exerciseName]?.[setIdx];
        const log: LogEntry = {
          exerciseName,
          setNumber: BigInt(setIdx + 1),
          reps: BigInt(Number(input?.reps) || 0),
          weight: Number(input?.weight) || 0,
          completed: true,
        };
        await updateLog.mutateAsync({ sessionId: currentSession.id, log });
      }
      await refetch();
      toast.success(`${uncompletedSets.length} set logged!`);
    } catch (_e) {
      toast.error("Failed to log all sets");
    }
  }

  function handleFinishWorkout() {
    if (!currentSession) return;
    markSessionFinished(currentSession.id);
    setIsFinished(true);
    toast.success("Workout finished! Great job! 💪");
  }

  function isSetCompleted(exerciseName: string, setIdx: number) {
    return (
      currentSession?.logs.some(
        (l) =>
          l.exerciseName === exerciseName &&
          Number(l.setNumber) === setIdx + 1 &&
          l.completed,
      ) ?? false
    );
  }

  function updateInput(
    exerciseName: string,
    setIdx: number,
    field: "reps" | "weight",
    value: string,
  ) {
    setSetInputs((prev) => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        [setIdx]: {
          ...(prev[exerciseName]?.[setIdx] ?? { reps: "", weight: "" }),
          [field]: value,
        },
      },
    }));
  }

  const totalSets = scheduledWorkout
    ? scheduledWorkout.day.exercises.reduce(
        (acc, ex) => acc + Number(ex.sets),
        0,
      )
    : 0;
  const completedSets =
    currentSession?.logs.filter((l) => l.completed).length ?? 0;
  const progressPct =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const allSetsCompleted = totalSets > 0 && completedSets >= totalSets;

  // Auto-finish when all sets completed
  useEffect(() => {
    if (allSetsCompleted && currentSession && !isFinished) {
      markSessionFinished(currentSession.id);
      setIsFinished(true);
      toast.success("Tüm setler tamamlandı! Workout bitti! 💪");
    }
  }, [allSetsCompleted, currentSession, isFinished]);

  const isLoading = plansLoading || sessionsLoading;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Workout Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your sets, reps, and weights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            data-ocid="tracker.date.input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-sm"
            max={todayStr()}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      ) : !scheduledWorkout ? (
        <Card
          className="shadow-card border-border"
          data-ocid="tracker.no_workout.empty_state"
        >
          <CardContent className="py-16 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-foreground">
              {DAY_NAMES[selectedDow]} — Rest Day
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              No workout scheduled. You deserve the rest!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Session header */}
          <Card className="shadow-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {scheduledWorkout.plan.name}
                  </p>
                  <h2 className="text-xl font-bold text-foreground mt-0.5">
                    {scheduledWorkout.day.dayLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
                {!currentSession ? (
                  <Button
                    data-ocid="tracker.start_session.primary_button"
                    onClick={handleStartSession}
                    disabled={createSession.isPending}
                    className="bg-accent hover:bg-accent/90 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {createSession.isPending ? "Starting..." : "Start Workout"}
                  </Button>
                ) : isFinished ? (
                  <Badge className="bg-success text-white flex items-center gap-1 px-3 py-1.5">
                    <Trophy className="h-4 w-4" />
                    Completed
                  </Badge>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <Badge className="bg-success text-white">Active</Badge>
                    <p className="text-xs text-muted-foreground">
                      {completedSets}/{totalSets} sets done
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFinishWorkout}
                      className="text-xs border-accent text-accent hover:bg-accent hover:text-white"
                    >
                      Finish Workout
                    </Button>
                  </div>
                )}
              </div>
              {currentSession && totalSets > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-accent">
                      {progressPct}%
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>
              )}
              {/* Log All button */}
              {currentSession && !isFinished && (
                <div className="mt-3">
                  <Button
                    onClick={handleLogAll}
                    disabled={updateLog.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Log All Sets
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finished banner */}
          {isFinished && (
            <Card className="shadow-card border-success/40 bg-success/5">
              <CardContent className="py-6 text-center">
                <Trophy className="h-10 w-10 text-success mx-auto mb-2" />
                <p className="font-bold text-foreground text-lg">
                  Workout Tamamlandı!
                </p>
                <p className="text-muted-foreground text-sm">
                  {completedSets}/{totalSets} set loglandı.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Exercises */}
          {currentSession ? (
            scheduledWorkout.day.exercises.map((ex, exIdx) => {
              const exCompleted = Array.from(
                { length: Number(ex.sets) },
                (_, i) => i,
              ).every((i) => isSetCompleted(ex.name, i));
              return (
                <Card
                  key={ex.name}
                  data-ocid={`tracker.exercise.item.${exIdx + 1}`}
                  className={cn(
                    "shadow-card border-border",
                    exCompleted && "border-success/30",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {exCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        {ex.name}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Target: {Number(ex.sets)}×{Number(ex.targetReps)} @{" "}
                        {ex.targetWeight}kg
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1 mb-1">
                        <span className="col-span-1">Set</span>
                        <span className="col-span-4">Weight (kg)</span>
                        <span className="col-span-4">Reps</span>
                        <span className="col-span-3" />
                      </div>
                      {Array.from({ length: Number(ex.sets) }, (_, si) => {
                        const completed = isSetCompleted(ex.name, si);
                        const isEditing =
                          editingSet?.ex === ex.name && editingSet?.si === si;
                        const inp = setInputs[ex.name]?.[si] ?? {
                          reps: String(ex.targetReps),
                          weight: String(ex.targetWeight),
                        };
                        const inputsDisabled = completed && !isEditing;
                        return (
                          <div
                            key={`${ex.name}-set-${si}`}
                            data-ocid={`tracker.set.item.${si + 1}`}
                            className={cn(
                              "grid grid-cols-12 gap-2 items-center",
                              completed && !isEditing && "opacity-70",
                            )}
                          >
                            <span
                              className={cn(
                                "col-span-1 text-sm font-semibold",
                                completed
                                  ? "text-success"
                                  : "text-muted-foreground",
                              )}
                            >
                              {si + 1}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="col-span-4 h-9 text-sm"
                              data-ocid="tracker.weight.input"
                              value={inp.weight}
                              onChange={(e) =>
                                updateInput(
                                  ex.name,
                                  si,
                                  "weight",
                                  e.target.value,
                                )
                              }
                              disabled={inputsDisabled}
                            />
                            <Input
                              type="number"
                              min="0"
                              className="col-span-4 h-9 text-sm"
                              data-ocid="tracker.reps.input"
                              value={inp.reps}
                              onChange={(e) =>
                                updateInput(ex.name, si, "reps", e.target.value)
                              }
                              disabled={inputsDisabled}
                            />
                            {completed && !isEditing ? (
                              <div className="col-span-3 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-full text-xs text-muted-foreground hover:text-accent"
                                  onClick={() =>
                                    setEditingSet({ ex: ex.name, si })
                                  }
                                  title="Edit this set"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : isEditing ? (
                              <div className="col-span-3 flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-9 flex-1 text-xs bg-primary hover:bg-primary/90 text-white"
                                  onClick={() => handleLogSet(ex.name, si)}
                                  disabled={updateLog.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-8 text-muted-foreground"
                                  onClick={() => setEditingSet(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                data-ocid={`tracker.log_set.button.${si + 1}`}
                                onClick={() => handleLogSet(ex.name, si)}
                                disabled={updateLog.isPending}
                                className="col-span-3 h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
                              >
                                Log Set
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="shadow-card border-border border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  Start the session to begin logging sets.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
