import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";

persistent actor {
  // Types for our fitness app
  type UserId = Text;
  type ExerciseName = Text;
  
  type User = {
    id: UserId;
    email: Text;
    name: Text;
    createdAt: Int;
    fitnessLevel: Text;
    goals: [Text];
    profilePicture: ?Text;
  };
  
  type ExerciseItem = {
    name: ExerciseName;
    reps: ?Nat;
    sets: ?Nat;
    durationSec: ?Nat;
    completed: Bool;
  };
  
  type WorkoutSession = {
    id: Text;
    userId: UserId;
    dateISO: Text;
    items: [ExerciseItem];
  };
  
  type Stats = {
    id: Text;
    userId: UserId;
    totalRepsByExercise: [(ExerciseName, Nat)];
    totalDurationSecByExercise: [(ExerciseName, Nat)];
    completedDays: [Text];
    completedWeeks: [Text];
    completedMonths: [Text];
    lastUpdated: Int;
  };
  
  type Achievement = {
    id: Text;
    userId: UserId;
    code: Text;
    title: Text;
    level: Nat;
    earnedAt: Int;
    progress: Nat;
    target: Nat;
  };

  // Payment Types
  type SubscriptionPlan = {
    #Basic;
    #Premium;
    #PremiumPlus;
  };

  type SubscriptionStatus = {
    #Active;
    #Inactive;
    #Cancelled;
    #PastDue;
  };

  type Subscription = {
    id: Text;
    userId: UserId;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    stripeSubscriptionId: ?Text;
    stripeCustomerId: ?Text;
    currentPeriodStart: Int;
    currentPeriodEnd: Int;
    createdAt: Int;
    updatedAt: Int;
  };

  type CheckoutSession = {
    id: Text;
    userId: UserId;
    plan: SubscriptionPlan;
    stripeSessionId: Text;
    status: Text; // "pending", "completed", "expired"
    createdAt: Int;
    expiresAt: Int;
  };

  // HTTP Outcall Types for Stripe API
  type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : HttpMethod;
    transform : ?TransformRawResponseFunction;
  };

  type HttpHeader = {
    name : Text;
    value : Text;
  };

  type HttpMethod = {
    #get;
    #post;
    #head;
  };

  type HttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };

  type TransformRawResponseFunction = {
    function : shared query TransformRawResponseArgs -> async HttpResponsePayload;
    context : Blob;
  };

  type TransformRawResponseArgs = {
    response : HttpResponsePayload;
    context : Blob;
  };
  
  // Storage
  private stable var nextUserId : Nat = 1;
  private stable var nextSessionId : Nat = 1;
  private stable var nextStatsId : Nat = 1;
  private stable var nextAchievementId : Nat = 1;
  private stable var nextSubscriptionId : Nat = 1;
  private stable var nextCheckoutSessionId : Nat = 1;
  
  private stable var usersEntries : [(UserId, User)] = [];
  private stable var sessionsEntries : [(Text, WorkoutSession)] = [];
  private stable var statsEntries : [(Text, Stats)] = [];
  private stable var achievementsEntries : [(Text, Achievement)] = [];
  private stable var subscriptionsEntries : [(Text, Subscription)] = [];
  private stable var checkoutSessionsEntries : [(Text, CheckoutSession)] = [];
  
  private transient let users = HashMap.fromIter<UserId, User>(Iter.fromArray(usersEntries), 10, Text.equal, Text.hash);
  private transient let sessions = HashMap.fromIter<Text, WorkoutSession>(Iter.fromArray(sessionsEntries), 10, Text.equal, Text.hash);
  private transient let stats = HashMap.fromIter<Text, Stats>(Iter.fromArray(statsEntries), 10, Text.equal, Text.hash);
  private transient let achievements = HashMap.fromIter<Text, Achievement>(Iter.fromArray(achievementsEntries), 10, Text.equal, Text.hash);
  private transient let subscriptions = HashMap.fromIter<Text, Subscription>(Iter.fromArray(subscriptionsEntries), 10, Text.equal, Text.hash);
  private transient let checkoutSessions = HashMap.fromIter<Text, CheckoutSession>(Iter.fromArray(checkoutSessionsEntries), 10, Text.equal, Text.hash);
  
  // User Management
  public shared(msg) func createUser(email: Text, name: Text, fitnessLevel: Text, goals: [Text], profilePicture: ?Text) : async UserId {
    let caller = Principal.toText(msg.caller);
    let userId = Nat.toText(nextUserId);
    nextUserId += 1;
    
    let user : User = {
      id = userId;
      email = email;
      name = name;
      createdAt = Time.now();
      fitnessLevel = fitnessLevel;
      goals = goals;
      profilePicture = profilePicture;
    };
    
    users.put(userId, user);
    return userId;
  };
  
  public query func getUser(userId: UserId) : async ?User {
    users.get(userId)
  };
  
  public shared(msg) func updateUser(userId: UserId, name: ?Text, fitnessLevel: ?Text, goals: ?[Text], profilePicture: ?Text) : async Bool {
    let userOpt = users.get(userId);
    
    switch (userOpt) {
      case (null) { return false; };
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          email = user.email;
          name = switch (name) { case (null) user.name; case (?n) n; };
          createdAt = user.createdAt;
          fitnessLevel = switch (fitnessLevel) { case (null) user.fitnessLevel; case (?f) f; };
          goals = switch (goals) { case (null) user.goals; case (?g) g; };
          profilePicture = switch (profilePicture) { case (null) user.profilePicture; case (?p) ?p; };
        };
        
        users.put(userId, updatedUser);
        return true;
      };
    };
  };
  
  // Workout Sessions
  public shared(msg) func recordWorkoutSession(userId: UserId, dateISO: Text, items: [ExerciseItem]) : async Text {
    let sessionId = Nat.toText(nextSessionId);
    nextSessionId += 1;
    
    let session : WorkoutSession = {
      id = sessionId;
      userId = userId;
      dateISO = dateISO;
      items = items;
    };
    
    sessions.put(sessionId, session);
    
    // Update stats
    await updateStats(userId, items);
    
    return sessionId;
  };
  
  public query func getWorkoutSessions(userId: UserId) : async [WorkoutSession] {
    let userSessions = Iter.toArray(
      Iter.filter<(Text, WorkoutSession)>(
        sessions.entries(),
        func((_, session)) { session.userId == userId }
      )
    );
    
    Array.map<(Text, WorkoutSession), WorkoutSession>(
      userSessions,
      func((_, session)) { session }
    )
  };
  
  // Helper functions for array operations
  private func findIndex<T>(arr: [T], predicate: T -> Bool) : ?Nat {
    var i = 0;
    for (item in arr.vals()) {
      if (predicate(item)) {
        return ?i;
      };
      i += 1;
    };
    null
  };

  private func find<T>(arr: [T], predicate: T -> Bool) : ?T {
    for (item in arr.vals()) {
      if (predicate(item)) {
        return ?item;
      };
    };
    null
  };

  // Stats Management
  private func getUserStatsSync(userId: UserId) : ?Stats {
    let userStats = Iter.toArray(
      Iter.filter<(Text, Stats)>(
        stats.entries(),
        func((_, s)) { s.userId == userId }
      )
    );
    
    if (userStats.size() > 0) {
      ?userStats[0].1
    } else {
      null
    }
  };

  private func updateStats(userId: UserId, items: [ExerciseItem]) : async () {
    var userStats : Stats = switch (getUserStatsSync(userId)) {
      case (null) {
        {
          id = Nat.toText(nextStatsId);
          userId = userId;
          totalRepsByExercise = [];
          totalDurationSecByExercise = [];
          completedDays = [];
          completedWeeks = [];
          completedMonths = [];
          lastUpdated = Time.now();
        }
      };
      case (?existingStats) { existingStats };
    };
    
    // Update exercise stats
    for (item in items.vals()) {
      if (item.completed) {
        // Update reps
        switch (item.reps) {
          case (null) {};
          case (?reps) {
            userStats := updateExerciseReps(userStats, item.name, reps);
          };
        };
        
        // Update duration
        switch (item.durationSec) {
          case (null) {};
          case (?duration) {
            userStats := updateExerciseDuration(userStats, item.name, duration);
          };
        };
      };
    };
    
    // Save updated stats
    stats.put(userStats.id, userStats);
  };
  
  private func updateExerciseReps(userStats: Stats, exerciseName: ExerciseName, reps: Nat) : Stats {
    let existingIndex = findIndex<(ExerciseName, Nat)>(
      userStats.totalRepsByExercise, 
      func((name, _)) { name == exerciseName }
    );
    
    let updatedReps = switch (existingIndex) {
      case (null) {
        Array.append(userStats.totalRepsByExercise, [(exerciseName, reps)]);
      };
      case (?index) {
        let (_, currentReps) = userStats.totalRepsByExercise[index];
        Array.tabulate<(ExerciseName, Nat)>(
          userStats.totalRepsByExercise.size(),
          func (i) {
            if (i == index) { (exerciseName, currentReps + reps) }
            else { userStats.totalRepsByExercise[i] }
          }
        );
      };
    };
    
    {
      id = userStats.id;
      userId = userStats.userId;
      totalRepsByExercise = updatedReps;
      totalDurationSecByExercise = userStats.totalDurationSecByExercise;
      completedDays = userStats.completedDays;
      completedWeeks = userStats.completedWeeks;
      completedMonths = userStats.completedMonths;
      lastUpdated = Time.now();
    }
  };
  
  private func updateExerciseDuration(userStats: Stats, exerciseName: ExerciseName, duration: Nat) : Stats {
    let existingIndex = findIndex<(ExerciseName, Nat)>(
      userStats.totalDurationSecByExercise, 
      func((name, _)) { name == exerciseName }
    );
    
    let updatedDuration = switch (existingIndex) {
      case (null) {
        Array.append(userStats.totalDurationSecByExercise, [(exerciseName, duration)]);
      };
      case (?index) {
        let (_, currentDuration) = userStats.totalDurationSecByExercise[index];
        Array.tabulate<(ExerciseName, Nat)>(
          userStats.totalDurationSecByExercise.size(),
          func (i) {
            if (i == index) { (exerciseName, currentDuration + duration) }
            else { userStats.totalDurationSecByExercise[i] }
          }
        );
      };
    };
    
    {
      id = userStats.id;
      userId = userStats.userId;
      totalRepsByExercise = userStats.totalRepsByExercise;
      totalDurationSecByExercise = updatedDuration;
      completedDays = userStats.completedDays;
      completedWeeks = userStats.completedWeeks;
      completedMonths = userStats.completedMonths;
      lastUpdated = Time.now();
    }
  };
  
  public query func getUserStats(userId: UserId) : async ?Stats {
    let userStats = Iter.toArray(
      Iter.filter<(Text, Stats)>(
        stats.entries(),
        func((_, s)) { s.userId == userId }
      )
    );
    
    if (userStats.size() > 0) {
      ?userStats[0].1
    } else {
      null
    }
  };
  
  // Achievements
  public shared(msg) func recordAchievement(userId: UserId, code: Text, title: Text, level: Nat, progress: Nat, target: Nat) : async Text {
    let achievementId = Nat.toText(nextAchievementId);
    nextAchievementId += 1;
    
    let achievement : Achievement = {
      id = achievementId;
      userId = userId;
      code = code;
      title = title;
      level = level;
      earnedAt = Time.now();
      progress = progress;
      target = target;
    };
    
    achievements.put(achievementId, achievement);
    return achievementId;
  };
  
  public query func getUserAchievements(userId: UserId) : async [Achievement] {
    let userAchievements = Iter.toArray(
      Iter.filter<(Text, Achievement)>(
        achievements.entries(),
        func((_, a)) { a.userId == userId }
      )
    );
    
    Array.map<(Text, Achievement), Achievement>(
      userAchievements,
      func((_, achievement)) { achievement }
    )
  };
  
  // Payment Functions
  public shared(msg) func createCheckoutSession(userId: UserId, plan: SubscriptionPlan) : async Result.Result<Text, Text> {
    let caller = Principal.toText(msg.caller);
    let sessionId = Nat.toText(nextCheckoutSessionId);
    nextCheckoutSessionId += 1;
    
    // Create Stripe checkout session via HTTP outcall
    let stripeApiKey = "sk_test_..."; // This should be set via environment or configuration
    let priceId = switch (plan) {
      case (#Basic) { "price_basic_test_id" };
      case (#Premium) { "price_premium_test_id" };
      case (#PremiumPlus) { "price_premium_plus_test_id" };
    };
    
    let requestBody = "price_data[currency]=usd&price_data[product_data][name]=ATOS Fit Subscription&price_data[unit_amount]=" # 
      (switch (plan) {
        case (#Basic) { "999" }; // $9.99
        case (#Premium) { "1999" }; // $19.99
        case (#PremiumPlus) { "2999" }; // $29.99
      }) # "&mode=subscription&success_url=https://yourapp.com/success&cancel_url=https://yourapp.com/cancel";
    
    let request : HttpRequestArgs = {
      url = "https://api.stripe.com/v1/checkout/sessions";
      max_response_bytes = ?1024;
      headers = [
        { name = "Authorization"; value = "Bearer " # stripeApiKey },
        { name = "Content-Type"; value = "application/x-www-form-urlencoded" }
      ];
      body = ?Blob.toArray(Text.encodeUtf8(requestBody));
      method = #post;
      transform = null;
    };
    
    try {
      let ic : actor {
        http_request : HttpRequestArgs -> async HttpResponsePayload;
      } = actor("aaaaa-aa"); // Management canister
      
      let response = await ic.http_request(request);
      
      if (response.status == 200) {
        // Parse response to get session ID (simplified)
        let stripeSessionId = "cs_test_" # sessionId; // In real implementation, parse from response
        
        let checkoutSession : CheckoutSession = {
          id = sessionId;
          userId = userId;
          plan = plan;
          stripeSessionId = stripeSessionId;
          status = "pending";
          createdAt = Time.now();
          expiresAt = Time.now() + (24 * 60 * 60 * 1000000000); // 24 hours
        };
        
        checkoutSessions.put(sessionId, checkoutSession);
        #ok(stripeSessionId)
      } else {
        #err("Failed to create checkout session")
      }
    } catch (error) {
      #err("HTTP request failed")
    }
  };
  
  public shared(msg) func verifySubscription(stripeSessionId: Text) : async Result.Result<Text, Text> {
    let caller = Principal.toText(msg.caller);
    
    // Find checkout session
    let sessionOpt = find<(Text, CheckoutSession)>(
      Iter.toArray(checkoutSessions.entries()),
      func((_, session)) { session.stripeSessionId == stripeSessionId }
    );
    
    switch (sessionOpt) {
      case (null) { #err("Checkout session not found") };
      case (?(sessionId, session)) {
        // Verify with Stripe API
        let stripeApiKey = "sk_test_...";
        let request : HttpRequestArgs = {
          url = "https://api.stripe.com/v1/checkout/sessions/" # stripeSessionId;
          max_response_bytes = ?1024;
          headers = [
            { name = "Authorization"; value = "Bearer " # stripeApiKey }
          ];
          body = null;
          method = #get;
          transform = null;
        };
        
        try {
          let ic : actor {
            http_request : HttpRequestArgs -> async HttpResponsePayload;
          } = actor("aaaaa-aa");
          
          let response = await ic.http_request(request);
          
          if (response.status == 200) {
            // Create subscription record
            let subscriptionId = Nat.toText(nextSubscriptionId);
            nextSubscriptionId += 1;
            
            let subscription : Subscription = {
              id = subscriptionId;
              userId = session.userId;
              plan = session.plan;
              status = #Active;
              stripeSubscriptionId = ?("sub_" # subscriptionId);
              stripeCustomerId = ?("cus_" # session.userId);
              currentPeriodStart = Time.now();
              currentPeriodEnd = Time.now() + (30 * 24 * 60 * 60 * 1000000000); // 30 days
              createdAt = Time.now();
              updatedAt = Time.now();
            };
            
            subscriptions.put(subscriptionId, subscription);
            
            // Update checkout session status
            let updatedSession = {
              session with status = "completed"
            };
            checkoutSessions.put(sessionId, updatedSession);
            
            #ok(subscriptionId)
          } else {
            #err("Failed to verify with Stripe")
          }
        } catch (error) {
          #err("Verification failed")
        }
      }
    }
  };
  
  public query func getUserSubscription(userId: UserId) : async ?Subscription {
    let userSubscriptions = Iter.toArray(
      Iter.filter<(Text, Subscription)>(
        subscriptions.entries(),
        func((_, sub)) { sub.userId == userId and sub.status == #Active }
      )
    );
    
    if (userSubscriptions.size() > 0) {
      ?userSubscriptions[0].1
    } else {
      null
    }
  };
  
  public shared(msg) func cancelSubscription(subscriptionId: Text) : async Result.Result<Text, Text> {
    let caller = Principal.toText(msg.caller);
    
    switch (subscriptions.get(subscriptionId)) {
      case (null) { #err("Subscription not found") };
      case (?subscription) {
        let updatedSubscription = {
          subscription with 
          status = #Cancelled;
          updatedAt = Time.now();
        };
        
        subscriptions.put(subscriptionId, updatedSubscription);
        #ok("Subscription cancelled")
      }
    }
  };
  
  // System upgrade hooks
  system func preupgrade() {
    usersEntries := Iter.toArray(users.entries());
    sessionsEntries := Iter.toArray(sessions.entries());
    statsEntries := Iter.toArray(stats.entries());
    achievementsEntries := Iter.toArray(achievements.entries());
    subscriptionsEntries := Iter.toArray(subscriptions.entries());
    checkoutSessionsEntries := Iter.toArray(checkoutSessions.entries());
  };
  
  system func postupgrade() {
    usersEntries := [];
    sessionsEntries := [];
    statsEntries := [];
    achievementsEntries := [];
    subscriptionsEntries := [];
    checkoutSessionsEntries := [];
  };
}