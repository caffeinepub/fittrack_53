import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { useWorkoutPlans } from "../hooks/useQueries";

const DAYS = [
  { dow: 1, label: "Monday", short: "Mon" },
  { dow: 2, label: "Tuesday", short: "Tue" },
  { dow: 3, label: "Wednesday", short: "Wed" },
  { dow: 4, label: "Thursday", short: "Thu" },
  { dow: 5, label: "Friday", short: "Fri" },
  { dow: 6, label: "Saturday", short: "Sat" },
  { dow: 0, label: "Sunday", short: "Sun" },
];

export default function Schedule() {
  const { data: plans = [], isLoading } = useWorkoutPlans();
  const todayDow = new Date().getDay();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Weekly Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your workout plan across the week.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map(({ dow, label, short }, idx) => {
            const workouts = plans.flatMap((plan) =>
              plan.days
                .filter((d) => Number(d.dayOfWeek) === dow)
                .map((d) => ({
                  planName: plan.name,
                  dayLabel: d.dayLabel,
                  exercises: d.exercises,
                })),
            );
            const isToday = dow === todayDow;

            return (
              <motion.div
                key={dow}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  data-ocid={`schedule.day.item.${idx + 1}`}
                  className={`shadow-card border-border h-full ${
                    isToday ? "ring-2 ring-primary/30 border-primary/30" : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                          isToday
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {short}
                      </div>
                      {isToday && (
                        <Badge className="text-xs bg-accent/10 text-accent hover:bg-accent/10 border border-accent/20">
                          Today
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm mt-2">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workouts.length === 0 ? (
                      <div className="py-2">
                        <p className="text-xs text-muted-foreground italic">
                          Rest day
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workouts.map((w) => (
                          <div key={w.dayLabel}>
                            <p className="text-sm font-semibold text-foreground">
                              {w.dayLabel}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1.5">
                              {w.planName}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {w.exercises.slice(0, 4).map((ex) => (
                                <span
                                  key={ex.name}
                                  className="text-xs bg-muted rounded-md px-2 py-0.5 text-foreground"
                                >
                                  {ex.name}
                                </span>
                              ))}
                              {w.exercises.length > 4 && (
                                <span className="text-xs text-muted-foreground">
                                  +{w.exercises.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div
          data-ocid="schedule.plans.empty_state"
          className="text-center py-12"
        >
          <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No plans yet</p>
          <p className="text-muted-foreground text-sm">
            Create a workout plan to see your schedule here.
          </p>
        </div>
      )}
    </div>
  );
}
