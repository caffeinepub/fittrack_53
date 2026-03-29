import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Day, Exercise, WorkoutPlan } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateWorkoutPlan,
  useDeleteWorkoutPlan,
  useUpdateWorkoutPlan,
  useWorkoutPlans,
} from "../hooks/useQueries";

const DAY_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

type ExerciseForm = {
  _key: string;
  name: string;
  sets: string;
  targetReps: string;
  targetWeight: string;
};
type DayForm = {
  _key: string;
  dayOfWeek: string;
  dayLabel: string;
  exercises: ExerciseForm[];
};

function emptyExercise(): ExerciseForm {
  return {
    _key: crypto.randomUUID(),
    name: "",
    sets: "3",
    targetReps: "10",
    targetWeight: "0",
  };
}

function emptyDay(): DayForm {
  return {
    _key: crypto.randomUUID(),
    dayOfWeek: "1",
    dayLabel: "",
    exercises: [emptyExercise()],
  };
}

interface PlanFormState {
  name: string;
  days: DayForm[];
}

export default function MyPlans() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading } = useWorkoutPlans();
  const createPlan = useCreateWorkoutPlan();
  const updatePlan = useUpdateWorkoutPlan();
  const deletePlan = useDeleteWorkoutPlan();
  const { identity } = useInternetIdentity();
  const seedPlan = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.seedSampleData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutPlans"] });
      toast.success("4-Day Plan loaded!");
    },
    onError: () => toast.error("Failed to load plan"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<WorkoutPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<PlanFormState>({
    name: "",
    days: [emptyDay()],
  });

  function openCreate() {
    const firstDay = emptyDay();
    setEditPlan(null);
    setForm({ name: "", days: [firstDay] });
    setExpandedDays({ [firstDay._key]: true });
    setDialogOpen(true);
  }

  function openEdit(plan: WorkoutPlan) {
    setEditPlan(plan);
    const days: DayForm[] = plan.days.map((d) => ({
      _key: crypto.randomUUID(),
      dayOfWeek: String(d.dayOfWeek),
      dayLabel: d.dayLabel,
      exercises: d.exercises.map((e) => ({
        _key: crypto.randomUUID(),
        name: e.name,
        sets: String(e.sets),
        targetReps: String(e.targetReps),
        targetWeight: String(e.targetWeight),
      })),
    }));
    const exp: Record<string, boolean> = {};
    for (const d of days) {
      exp[d._key] = true;
    }
    setForm({ name: plan.name, days });
    setExpandedDays(exp);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (!identity) {
      toast.error("Not authenticated");
      return;
    }

    const days: Day[] = form.days.map((d) => ({
      dayOfWeek: BigInt(d.dayOfWeek),
      dayLabel:
        d.dayLabel ||
        DAY_OPTIONS.find((o) => o.value === d.dayOfWeek)?.label ||
        "",
      exercises: d.exercises
        .filter((e) => e.name.trim())
        .map(
          (e): Exercise => ({
            name: e.name,
            sets: BigInt(Number(e.sets) || 1),
            targetReps: BigInt(Number(e.targetReps) || 1),
            targetWeight: Number(e.targetWeight) || 0,
          }),
        ),
    }));

    try {
      if (editPlan) {
        await updatePlan.mutateAsync({ ...editPlan, name: form.name, days });
        toast.success("Plan updated!");
      } else {
        const plan: WorkoutPlan = {
          id: crypto.randomUUID(),
          owner: identity.getPrincipal(),
          name: form.name,
          days,
        };
        await createPlan.mutateAsync(plan);
        toast.success("Plan created!");
      }
      setDialogOpen(false);
    } catch (_e) {
      toast.error("Failed to save plan");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePlan.mutateAsync(deleteId);
      toast.success("Plan deleted");
    } catch (_e) {
      toast.error("Failed to delete plan");
    } finally {
      setDeleteId(null);
    }
  }

  function updateDay(
    key: string,
    field: keyof Omit<DayForm, "_key" | "exercises">,
    value: string,
  ) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) => (d._key === key ? { ...d, [field]: value } : d)),
    }));
  }

  function addDay() {
    const nd = emptyDay();
    setForm((f) => ({ ...f, days: [...f.days, nd] }));
    setExpandedDays((e) => ({ ...e, [nd._key]: true }));
  }

  function removeDay(key: string) {
    setForm((f) => ({ ...f, days: f.days.filter((d) => d._key !== key) }));
  }

  function addExercise(dayKey: string) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d._key === dayKey
          ? { ...d, exercises: [...d.exercises, emptyExercise()] }
          : d,
      ),
    }));
  }

  function removeExercise(dayKey: string, exKey: string) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d._key === dayKey
          ? { ...d, exercises: d.exercises.filter((e) => e._key !== exKey) }
          : d,
      ),
    }));
  }

  function updateExercise(
    dayKey: string,
    exKey: string,
    field: keyof Omit<ExerciseForm, "_key">,
    value: string,
  ) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) =>
        d._key === dayKey
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e._key === exKey ? { ...e, [field]: value } : e,
              ),
            }
          : d,
      ),
    }));
  }

  const isSaving = createPlan.isPending || updatePlan.isPending;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Plans</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage your workout plans.
          </p>
        </div>
        <Button
          data-ocid="plans.create.primary_button"
          onClick={openCreate}
          className="bg-accent hover:bg-accent/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card
          className="shadow-card border-border"
          data-ocid="plans.list.empty_state"
        >
          <CardContent className="py-16 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">
              No workout plans yet
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first plan to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                data-ocid="plans.load_preset.primary_button"
                onClick={() => seedPlan.mutate()}
                disabled={seedPlan.isPending || !actor}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                {seedPlan.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Dumbbell className="h-4 w-4 mr-2" />
                )}
                Load My 4-Day Plan
              </Button>
              <Button
                variant="outline"
                onClick={openCreate}
                data-ocid="plans.create.secondary_button"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" data-ocid="plans.list">
          {plans.map((plan, idx) => {
            const totalExercises = plan.days.reduce(
              (acc, d) => acc + d.exercises.length,
              0,
            );
            return (
              <Card
                key={plan.id}
                data-ocid={`plans.item.${idx + 1}`}
                className="shadow-card border-border"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {plan.days.length} day
                          {plan.days.length !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {totalExercises} exercise
                          {totalExercises !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`plans.item.edit_button.${idx + 1}`}
                        onClick={() => openEdit(plan)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-ocid={`plans.item.delete_button.${idx + 1}`}
                        onClick={() => setDeleteId(plan.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.days.map((d) => (
                      <div
                        key={String(d.dayOfWeek)}
                        className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {d.dayLabel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({d.exercises.length} ex)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="plans.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                data-ocid="plans.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Push/Pull/Legs"
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Training Days</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Day
                </Button>
              </div>

              {form.days.map((day) => (
                <div
                  key={day._key}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() =>
                      setExpandedDays((e) => ({
                        ...e,
                        [day._key]: !e[day._key],
                      }))
                    }
                  >
                    <span className="font-medium text-sm">
                      {day.dayLabel ||
                        DAY_OPTIONS.find((o) => o.value === day.dayOfWeek)
                          ?.label ||
                        "New Day"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {day.exercises.length} exercise
                        {day.exercises.length !== 1 ? "s" : ""}
                      </span>
                      {expandedDays[day._key] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {expandedDays[day._key] && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Day of Week</Label>
                          <Select
                            value={day.dayOfWeek}
                            onValueChange={(v) =>
                              updateDay(day._key, "dayOfWeek", v)
                            }
                          >
                            <SelectTrigger
                              className="mt-1 h-9"
                              data-ocid="plans.day_of_week.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Day Label</Label>
                          <Input
                            className="mt-1 h-9"
                            data-ocid="plans.day_label.input"
                            value={day.dayLabel}
                            onChange={(e) =>
                              updateDay(day._key, "dayLabel", e.target.value)
                            }
                            placeholder="e.g. Push Day"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                          <span className="col-span-4">Exercise</span>
                          <span className="col-span-2">Sets</span>
                          <span className="col-span-2">Reps</span>
                          <span className="col-span-3">Weight (kg)</span>
                          <span className="col-span-1" />
                        </div>
                        {day.exercises.map((ex) => (
                          <div
                            key={ex._key}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <Input
                              className="col-span-4 h-8 text-sm"
                              data-ocid="plans.exercise_name.input"
                              value={ex.name}
                              onChange={(e) =>
                                updateExercise(
                                  day._key,
                                  ex._key,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Bench Press"
                            />
                            <Input
                              className="col-span-2 h-8 text-sm"
                              type="number"
                              min="1"
                              value={ex.sets}
                              onChange={(e) =>
                                updateExercise(
                                  day._key,
                                  ex._key,
                                  "sets",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              className="col-span-2 h-8 text-sm"
                              type="number"
                              min="1"
                              value={ex.targetReps}
                              onChange={(e) =>
                                updateExercise(
                                  day._key,
                                  ex._key,
                                  "targetReps",
                                  e.target.value,
                                )
                              }
                            />
                            <Input
                              className="col-span-3 h-8 text-sm"
                              type="number"
                              min="0"
                              step="0.5"
                              value={ex.targetWeight}
                              onChange={(e) =>
                                updateExercise(
                                  day._key,
                                  ex._key,
                                  "targetWeight",
                                  e.target.value,
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeExercise(day._key, ex._key)}
                              className="col-span-1 flex items-center justify-center text-muted-foreground hover:text-destructive h-8"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addExercise(day._key)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Exercise
                        </Button>
                      </div>

                      {form.days.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDay(day._key)}
                          className="text-destructive hover:text-destructive h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remove Day
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="plans.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-accent hover:bg-accent/90 text-white"
              data-ocid="plans.dialog.submit_button"
            >
              {isSaving
                ? "Saving..."
                : editPlan
                  ? "Update Plan"
                  : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="plans.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plan? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="plans.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="plans.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
