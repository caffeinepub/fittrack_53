import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogEntry, WorkoutPlan, WorkoutSession } from "../backend.d.ts";
import { useActor } from "./useActor";

export function useWorkoutPlans() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutPlan[]>({
    queryKey: ["workoutPlans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOwnWorkoutPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSessionsByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["sessions", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSessionByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useCreateWorkoutPlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: WorkoutPlan) => {
      if (!actor) throw new Error("No actor");
      return actor.createWorkoutPlan(plan);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutPlans"] }),
  });
}

export function useUpdateWorkoutPlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: WorkoutPlan) => {
      if (!actor) throw new Error("No actor");
      return actor.updateWorkoutPlan(plan);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutPlans"] }),
  });
}

export function useDeleteWorkoutPlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteWorkoutPlan(planId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutPlans"] }),
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session: WorkoutSession) => {
      if (!actor) throw new Error("No actor");
      return actor.createSession(session);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useUpdateSessionLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      log,
    }: { sessionId: string; log: LogEntry }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateSessionLog(sessionId, log);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// Gym week checklist — persisted in localStorage
function getStorageKey(weekStart: string) {
  return `gymWeek:${weekStart}`;
}

function loadGymWeek(weekStart: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(getStorageKey(weekStart));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGymWeek(weekStart: string, data: Record<string, boolean>) {
  localStorage.setItem(getStorageKey(weekStart), JSON.stringify(data));
}

export function useGymWeekChecklist(weekStart: string) {
  return useQuery<Record<string, boolean>>({
    queryKey: ["gymWeek", weekStart],
    queryFn: () => loadGymWeek(weekStart),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useMarkGymDay(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, done }: { date: string; done: boolean }) => {
      const current = loadGymWeek(weekStart);
      const updated = { ...current, [date]: done };
      saveGymWeek(weekStart, updated);
      return updated;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gymWeek", weekStart] });
    },
  });
}
