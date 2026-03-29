import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Exercise = {
    name : Text;
    sets : Nat;
    targetReps : Nat;
    targetWeight : Float;
  };

  type Day = {
    dayOfWeek : Nat; // 0 = Sunday, 6 = Saturday
    dayLabel : Text;
    exercises : [Exercise];
  };

  type WorkoutPlan = {
    id : Text;
    name : Text;
    owner : Principal;
    days : [Day];
  };

  type LogEntry = {
    exerciseName : Text;
    setNumber : Nat;
    reps : Nat;
    weight : Float;
    completed : Bool;
  };

  type WorkoutSession = {
    id : Text;
    planId : Text;
    owner : Principal;
    date : Text;
    dayLabel : Text;
    logs : [LogEntry];
  };

  public type UserProfile = {
    name : Text;
  };

  type GymAttendance = {
    date : Text;
    done : Bool;
  };

  func compareWorkoutPlansByName(plan1 : WorkoutPlan, plan2 : WorkoutPlan) : Order.Order {
    Text.compare(plan1.name, plan2.name);
  };

  func compareWorkoutSessionsByDate(s1 : WorkoutSession, s2 : WorkoutSession) : Order.Order {
    Text.compare(s1.date, s2.date);
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let workoutPlans = Map.empty<Text, WorkoutPlan>();
  let workoutSessions = Map.empty<Text, WorkoutSession>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let gymAttendance = Map.empty<Text, GymAttendance>();

  // --- User Profile Operations ---

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --- Workout Plan Operations ---

  public shared ({ caller }) func createWorkoutPlan(plan : WorkoutPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create workout plans");
    };
    if (not workoutPlans.containsKey(plan.id)) {
      let newPlan : WorkoutPlan = {
        plan with
        owner = caller;
      };
      workoutPlans.add(plan.id, newPlan);
    } else {
      Runtime.trap("Plan already exists");
    };
  };

  public shared ({ caller }) func updateWorkoutPlan(plan : WorkoutPlan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update workout plans");
    };
    switch (workoutPlans.get(plan.id)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own plans");
        };
        let updatedPlan : WorkoutPlan = {
          plan with
          owner = caller;
        };
        workoutPlans.add(plan.id, updatedPlan);
      };
    };
  };

  public shared ({ caller }) func deleteWorkoutPlan(planId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete workout plans");
    };
    switch (workoutPlans.get(planId)) {
      case (null) { Runtime.trap("Plan not found") };
      case (?existing) {
        if (existing.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own plans");
        };
        workoutPlans.remove(planId);
      };
    };
  };

  public query ({ caller }) func getAllOwnWorkoutPlans() : async [WorkoutPlan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workout plans");
    };
    workoutPlans.values().toArray().filter(
      func(p) { p.owner == caller }
    ).sort(compareWorkoutPlansByName);
  };

  public query ({ caller }) func getWorkoutPlanById(planId : Text) : async ?WorkoutPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workout plans");
    };
    switch (workoutPlans.get(planId)) {
      case (null) { null };
      case (?plan) {
        if (plan.owner == caller) {
          ?plan;
        } else {
          Runtime.trap("Unauthorized: Can only view your own plans");
        };
      };
    };
  };

  // --- Session Operations ---

  public shared ({ caller }) func createSession(session : WorkoutSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create workout sessions");
    };
    if (not workoutSessions.containsKey(session.id)) {
      let newSession : WorkoutSession = {
        session with
        owner = caller;
      };
      workoutSessions.add(session.id, newSession);
    } else {
      Runtime.trap("Session already exists");
    };
  };

  public shared ({ caller }) func updateSessionLog(sessionId : Text, log : LogEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update workout sessions");
    };
    switch (workoutSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?session) {
        if (session.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own sessions");
        };

        let mutableLogs = List.empty<LogEntry>();
        mutableLogs.addAll(session.logs.values());

        var found = false;
        let updatedLogs = mutableLogs.map<LogEntry, LogEntry>(
          func(existingLog) {
            if (
              existingLog.exerciseName == log.exerciseName and existingLog.setNumber == log.setNumber
            ) {
              found := true;
              let newLog : LogEntry = {
                log with
                completed = true;
              };
              newLog;
            } else {
              existingLog;
            };
          }
        );

        let newLogsArray = updatedLogs.toArray();
        let mutableLogs2 = List.empty<LogEntry>();
        mutableLogs2.addAll(newLogsArray.values());

        let finalLogs = if (found) {
          newLogsArray;
        } else {
          let newLogArray = mutableLogs2.toArray();
          [log].concat(newLogArray);
        };

        let updatedSession : WorkoutSession = {
          session with
          logs = finalLogs;
        };
        workoutSessions.add(sessionId, updatedSession);
      };
    };
  };

  public query ({ caller }) func getSessionByDate(date : Text) : async [WorkoutSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workout sessions");
    };
    workoutSessions.values().toArray().filter(
      func(s) { s.owner == caller and s.date == date }
    ).sort(compareWorkoutSessionsByDate);
  };

  public query ({ caller }) func getSessionsByPlan(planId : Text) : async [WorkoutSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workout sessions");
    };
    workoutSessions.values().toArray().filter(
      func(s) { s.owner == caller and s.planId == planId }
    ).sort(compareWorkoutSessionsByDate);
  };

  public query ({ caller }) func getAllSessions() : async [WorkoutSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workout sessions");
    };
    workoutSessions.values().toArray().filter(
      func(s) { s.owner == caller }
    ).sort(compareWorkoutSessionsByDate);
  };

  // --- Gym Attendance ---

  public shared ({ caller }) func markGymDay(date : Text, done : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let key = date # ":" # caller.toText();
    gymAttendance.add(key, { date; done });
  };

  public query ({ caller }) func getGymDaysForWeek(weekStart : Text) : async [GymAttendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let suffix = ":" # caller.toText();
    gymAttendance.entries().toArray().filter(
      func((k, v)) {
        v.date >= weekStart and v.date <= weekStart # "z" and k.endsWith(#text suffix);
      }
    ).map(func((_, v)) { v });
  };

  // --- Seed Sample Data ---

  public shared ({ caller }) func seedSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can seed sample data");
    };
    let samplePlan : WorkoutPlan = {
      id = "my-4day-plan";
      name = "My 4-Day Plan";
      owner = caller;
      days = [
        {
          dayOfWeek = 1;
          dayLabel = "Day 1 - Glutes & Hamstrings";
          exercises = [
            { name = "Hip Thrust"; sets = 4; targetReps = 10; targetWeight = 0.0 },
            { name = "RDL"; sets = 3; targetReps = 10; targetWeight = 0.0 },
            { name = "Leg Curl"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Sumo Squat"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Cable Kick Back"; sets = 3; targetReps = 15; targetWeight = 0.0 },
            { name = "Hyper Extension"; sets = 3; targetReps = 12; targetWeight = 0.0 },
          ];
        },
        {
          dayOfWeek = 2;
          dayLabel = "Day 2 - Back & Shoulders";
          exercises = [
            { name = "Lat Pull Down"; sets = 4; targetReps = 10; targetWeight = 0.0 },
            { name = "Seated Row"; sets = 3; targetReps = 10; targetWeight = 0.0 },
            { name = "Shoulder Press"; sets = 3; targetReps = 10; targetWeight = 0.0 },
            { name = "Cable Lateral Raises"; sets = 3; targetReps = 15; targetWeight = 0.0 },
            { name = "Push Down"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Cable Biceps Curl"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Push Up"; sets = 3; targetReps = 15; targetWeight = 0.0 },
          ];
        },
        {
          dayOfWeek = 4;
          dayLabel = "Day 3 - Quads & Legs";
          exercises = [
            { name = "Elevated Squat"; sets = 4; targetReps = 10; targetWeight = 0.0 },
            { name = "Leg Extension"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Bulgarian Split Squat"; sets = 3; targetReps = 10; targetWeight = 0.0 },
            { name = "Leg Press"; sets = 3; targetReps = 10; targetWeight = 0.0 },
            { name = "Walking Lunge"; sets = 3; targetReps = 12; targetWeight = 0.0 },
            { name = "Calf Raises"; sets = 4; targetReps = 15; targetWeight = 0.0 },
          ];
        },
        {
          dayOfWeek = 5;
          dayLabel = "Day 4 - Cardio";
          exercises = [
            { name = "Cardio"; sets = 1; targetReps = 1; targetWeight = 0.0 },
          ];
        },
      ];
    };

    switch (workoutPlans.get(samplePlan.id)) {
      case (null) {
        workoutPlans.add(samplePlan.id, samplePlan);
      };
      case (_) {};
    };
  };
};
