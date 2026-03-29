import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart2, Dumbbell, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ExerciseEntry {
  exerciseName: string;
  sets: number;
  weight: number;
  date: string;
}

const STORAGE_KEY = "exerciseProgress";

function loadEntries(): ExerciseEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: ExerciseEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function Progress() {
  const [entries, setEntries] = useState<ExerciseEntry[]>(loadEntries);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");

  const exerciseNames = useMemo(() => {
    const names = new Set(entries.map((e) => e.exerciseName));
    return Array.from(names).sort();
  }, [entries]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    return entries
      .filter((e) => e.exerciseName === selectedExercise)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        Sets: e.sets,
        "Weight (kg)": e.weight,
      }));
  }, [entries, selectedExercise]);

  const handleSave = () => {
    const trimmed = exerciseName.trim();
    if (!trimmed || !sets || !weight) return;
    const entry: ExerciseEntry = {
      exerciseName: trimmed,
      sets: Number(sets),
      weight: Number(weight),
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
    if (!selectedExercise) setSelectedExercise(trimmed);
    setExerciseName("");
    setSets("");
    setWeight("");
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
          Your Journey
        </p>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-accent" />
          Exercise Progress
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your sets and weight over time
        </p>
      </motion.div>

      {/* Entry Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-accent" />
              Log Exercise Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <Label
                  htmlFor="exercise-name"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Exercise Name
                </Label>
                <Input
                  id="exercise-name"
                  data-ocid="progress.exercise_name.input"
                  placeholder="e.g. Hip Thrust"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="sets"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Sets
                </Label>
                <Input
                  id="sets"
                  data-ocid="progress.sets.input"
                  type="number"
                  min="1"
                  placeholder="e.g. 4"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="weight"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  data-ocid="progress.weight.input"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 60"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <Button
              data-ocid="progress.save.primary_button"
              onClick={handleSave}
              disabled={!exerciseName.trim() || !sets || !weight}
              className="bg-accent hover:bg-accent/90 text-white font-semibold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Save Entry
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-accent" />
                Progress Chart
              </CardTitle>
              <select
                data-ocid="progress.exercise.select"
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="text-sm border border-input rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select an exercise —</option>
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedExercise ? (
              <div
                data-ocid="progress.chart.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Dumbbell className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium">
                  Select an exercise to view its progress chart
                </p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                  Log entries above to start tracking
                </p>
              </div>
            ) : chartData.length === 0 ? (
              <div
                data-ocid="progress.chart.empty_state"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <BarChart2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No data for {selectedExercise} yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0.010 20)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "oklch(0.50 0.015 20)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "oklch(0.50 0.015 20)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.92 0.010 20)",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "13px" }} />
                  <Bar
                    dataKey="Sets"
                    fill="oklch(0.55 0.10 220)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Weight (kg)"
                    fill="oklch(0.55 0.22 22)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
