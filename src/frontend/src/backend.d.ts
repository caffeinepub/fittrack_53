import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Exercise {
    name: string;
    sets: bigint;
    targetReps: bigint;
    targetWeight: number;
}
export interface WorkoutPlan {
    id: string;
    owner: Principal;
    days: Array<Day>;
    name: string;
}
export interface LogEntry {
    setNumber: bigint;
    weight: number;
    reps: bigint;
    completed: boolean;
    exerciseName: string;
}
export interface WorkoutSession {
    id: string;
    planId: string;
    owner: Principal;
    date: string;
    logs: Array<LogEntry>;
    dayLabel: string;
}
export interface Day {
    dayOfWeek: bigint;
    exercises: Array<Exercise>;
    dayLabel: string;
}
export interface UserProfile {
    name: string;
}
export interface GymAttendance {
    date: string;
    done: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSession(session: WorkoutSession): Promise<void>;
    createWorkoutPlan(plan: WorkoutPlan): Promise<void>;
    deleteWorkoutPlan(planId: string): Promise<void>;
    getAllOwnWorkoutPlans(): Promise<Array<WorkoutPlan>>;
    getAllSessions(): Promise<Array<WorkoutSession>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSessionByDate(date: string): Promise<Array<WorkoutSession>>;
    getSessionsByPlan(planId: string): Promise<Array<WorkoutSession>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWorkoutPlanById(planId: string): Promise<WorkoutPlan | null>;
    isCallerAdmin(): Promise<boolean>;
    markGymDay(date: string, done: boolean): Promise<void>;
    getGymDaysForWeek(weekStart: string): Promise<Array<GymAttendance>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedSampleData(): Promise<void>;
    updateSessionLog(sessionId: string, log: LogEntry): Promise<void>;
    updateWorkoutPlan(plan: WorkoutPlan): Promise<void>;
}
