import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  History as HistoryIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useAllSessions, useWorkoutPlans } from "../hooks/useQueries";

export default function History() {
  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessions();
  const { data: plans = [], isLoading: plansLoading } = useWorkoutPlans();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isLoading = sessionsLoading || plansLoading;

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );

  const planMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of plans) {
      map[p.id] = p.name;
    }
    return map;
  }, [plans]);

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All your logged workout sessions.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : sortedSessions.length === 0 ? (
        <div
          data-ocid="history.sessions.empty_state"
          className="text-center py-16"
        >
          <HistoryIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No sessions yet</p>
          <p className="text-muted-foreground text-sm">
            Complete your first workout to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session, idx) => {
            const completedSets = session.logs.filter(
              (l) => l.completed,
            ).length;
            const totalSets = session.logs.length;
            const pct =
              totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
            const isExpanded = !!expanded[session.id];

            const byExercise = session.logs.reduce<
              Record<string, typeof session.logs>
            >((acc, log) => {
              if (!acc[log.exerciseName]) acc[log.exerciseName] = [];
              acc[log.exerciseName].push(log);
              return acc;
            }, {});

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  data-ocid={`history.sessions.item.${idx + 1}`}
                  className="shadow-card border-border"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => toggleExpand(session.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {session.dayLabel}
                            </CardTitle>
                            {pct === 100 && (
                              <Badge className="bg-success/10 text-success border border-success/20 text-xs hover:bg-success/10">
                                Complete
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {new Date(
                              `${session.date}T12:00:00`,
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {planMap[session.planId] && (
                            <p className="text-xs text-muted-foreground">
                              {planMap[session.planId]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-accent">
                              {pct}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {completedSets}/{totalSets} sets
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {totalSets > 0 && (
                        <Progress value={pct} className="h-1.5 mt-2" />
                      )}
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <div className="border-t border-border pt-4 space-y-4">
                        {Object.entries(byExercise).map(([exName, logs]) => (
                          <div key={exName}>
                            <p className="text-sm font-semibold text-foreground mb-2">
                              {exName}
                            </p>
                            <div className="space-y-1.5">
                              {logs
                                .sort(
                                  (a, b) =>
                                    Number(a.setNumber) - Number(b.setNumber),
                                )
                                .map((log) => (
                                  <div
                                    key={`${exName}-set-${String(log.setNumber)}`}
                                    className="flex items-center gap-3 text-sm"
                                  >
                                    {log.completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="text-muted-foreground w-12">
                                      Set {String(log.setNumber)}
                                    </span>
                                    <span className="font-medium">
                                      {log.weight}kg
                                    </span>
                                    <span className="text-muted-foreground">
                                      ×
                                    </span>
                                    <span className="font-medium">
                                      {String(log.reps)} reps
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                        {totalSets === 0 && (
                          <p className="text-sm text-muted-foreground italic">
                            No sets logged for this session.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
