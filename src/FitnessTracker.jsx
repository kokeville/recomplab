import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Font loader — Barlow Condensed (display) + Barlow (body), athletic + bold.
// ---------------------------------------------------------------------------
function useAthleticFonts() {
  useEffect(() => {
    const id = "barlow-athletic-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ---------------------------------------------------------------------------
// Daily motivational quotes — rotates once per day, deterministic by date so it
// stays fixed all day and flips at midnight (no reshuffle on re-render).
// ---------------------------------------------------------------------------
const QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", by: "Abraham Lincoln" },
  { text: "The body achieves what the mind believes.", by: "Napoleon Hill" },
  { text: "You don't have to be extreme, just consistent.", by: "Unknown" },
  { text: "Sweat is just fat crying.", by: "Gym proverb" },
  { text: "Strength does not come from the physical capacity. It comes from an indomitable will.", by: "Mahatma Gandhi" },
  { text: "The only bad workout is the one that didn't happen.", by: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", by: "Jim Rohn" },
  { text: "Success isn't always about greatness. It's about consistency.", by: "Dwayne Johnson" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", by: "Arnold Schwarzenegger" },
  { text: "Don't limit your challenges. Challenge your limits.", by: "Unknown" },
  { text: "It never gets easier, you just get better.", by: "Jordan Hoechlin" },
  { text: "A one-hour workout is 4% of your day. No excuses.", by: "Unknown" },
  { text: "Motivation gets you started. Habit keeps you going.", by: "Jim Ryun" },
  { text: "Fall in love with the process and the results will come.", by: "Eric Thomas" },
  { text: "The hardest lift of all is lifting your butt off the couch.", by: "Unknown" },
  { text: "What seems impossible today will one day become your warm-up.", by: "Unknown" },
  { text: "Your only competition is who you were yesterday.", by: "Unknown" },
  { text: "Slow progress is still progress.", by: "Unknown" },
  { text: "The groundwork for all happiness is good health.", by: "Leigh Hunt" },
  { text: "If it doesn't challenge you, it won't change you.", by: "Fred DeVito" },
  { text: "Wake up with determination. Go to bed with satisfaction.", by: "George Lorimer" },
  { text: "Do something today that your future self will thank you for.", by: "Sean Patrick Flanery" },
  { text: "Once you learn to quit, it becomes a habit.", by: "Vince Lombardi" },
  { text: "The difference between try and triumph is a little umph.", by: "Marvin Phillips" },
  { text: "Push yourself because no one else is going to do it for you.", by: "Unknown" },
  { text: "Little by little, a little becomes a lot.", by: "Tanzanian proverb" },
  { text: "Champions keep playing until they get it right.", by: "Billie Jean King" },
  { text: "Energy and persistence conquer all things.", by: "Benjamin Franklin" },
  { text: "You are far more capable than you think.", by: "Unknown" },
  { text: "Results happen over time, not overnight. Work hard, stay consistent.", by: "Unknown" },
  { text: "Nobody who ever gave their best regretted it.", by: "George Halas" },
];

// Days since epoch -> stable index for "today"
function quoteOfDay() {
  const dayNum = Math.floor(Date.now() / 86400000);
  return QUOTES[((dayNum % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

// ---------------------------------------------------------------------------
// Weekly plan — derived from Jorge's profile.
// 6-day hybrid: 3 lift + 3 run + 1 rest. Lift-then-run preferred, 30-45 min cap.
// Lift guardrails: no heavy squat/deadlift, hinge-dominant lower, moderate load /
// higher rep, anti-rotation core, 35 lb/hand cap.
// Run base: 2-3 mi @ 11-12 min/mi with room to progress.
// ---------------------------------------------------------------------------
const PLAN = {
  day1: {
    id: "day1", type: "lift", name: "Upper Body", short: "Upper",
    warmup: [
      "5 min jump rope or brisk incline walk",
      "Band pull-aparts x20",
      "Arm circles + shoulder dislocates x10",
      "Scapular push-ups x10",
    ],
    exercises: [
      { name: "Dumbbell Bench Press", muscle: "Chest", sets: 3, targetReps: "8-10" },
      { name: "One-Arm Dumbbell Row", muscle: "Back", sets: 3, targetReps: "8-10" },
      { name: "Seated Overhead Press", muscle: "Shoulders", sets: 3, targetReps: "8-10" },
      { name: "Lateral Raise", muscle: "Shoulders", sets: 3, targetReps: "12-15" },
      { name: "Band Face Pull", muscle: "Rear Delts", sets: 3, targetReps: "15-20" },
      { name: "Dumbbell Curl", muscle: "Biceps", sets: 2, targetReps: "10-12" },
      { name: "Overhead Triceps Ext.", muscle: "Triceps", sets: 2, targetReps: "10-12" },
    ],
    cooldown: [
      "Doorway chest stretch 30s/side",
      "Cross-body shoulder stretch 30s/side",
      "Child's pose 60s",
    ],
  },
  run1: {
    id: "run1", type: "run", name: "Easy Base Run", short: "Base Run",
    goal: { distance: 2.5, pace: "11:30", note: "Conversational pace. Nose-breathe, keep it chill." },
    warmup: [
      "3 min brisk walk",
      "Leg swings x10/side",
      "Ankle circles + calf pumps x15",
      "20s each: high knees, butt kicks",
    ],
    cooldown: [
      "3 min walk to bring HR down",
      "Standing quad stretch 30s/side",
      "Standing calf + hamstring stretch 30s/side",
    ],
  },
  day2: {
    id: "day2", type: "lift", name: "Lower (Hinge)", short: "Lower",
    warmup: [
      "5 min easy bike or walk",
      "Bodyweight hip hinge x15",
      "Glute bridge x15",
      "World's greatest stretch x5/side",
    ],
    exercises: [
      { name: "Dumbbell RDL", muscle: "Hamstrings/Glutes", sets: 4, targetReps: "10-12" },
      { name: "Dumbbell Hip Thrust", muscle: "Glutes", sets: 3, targetReps: "12-15" },
      { name: "Reverse Lunge (controlled)", muscle: "Quads/Glutes", sets: 3, targetReps: "10/side" },
      { name: "Ankle-Weight Leg Curl", muscle: "Hamstrings", sets: 3, targetReps: "12-15" },
      { name: "Standing Calf Raise", muscle: "Calves", sets: 3, targetReps: "15-20" },
      { name: "Pallof Press (band)", muscle: "Core", sets: 3, targetReps: "12/side" },
    ],
    cooldown: [
      "Standing hamstring stretch 30s/side",
      "Couch/hip flexor stretch 30s/side",
      "Cat-cow x10",
    ],
  },
  run2: {
    id: "run2", type: "run", name: "Intervals / Tempo", short: "Intervals",
    goal: { distance: 2.5, pace: "10:30", note: "After warm-up: 4-6 x 1 min quicker / 2 min easy. Knee-friendly on flats." },
    warmup: [
      "5 min easy jog to open up",
      "Leg swings x10/side",
      "Strides: 4 x 15s build-ups",
      "A-skips x20",
    ],
    cooldown: [
      "5 min easy jog/walk down",
      "Standing quad + hip flexor 30s/side",
      "Figure-4 glute stretch 30s/side",
    ],
  },
  day3: {
    id: "day3", type: "lift", name: "Push/Pull + Core", short: "Push/Pull",
    warmup: [
      "5 min jump rope",
      "Band pull-aparts x20",
      "Dead bug x10/side",
      "Bird dog x10/side",
    ],
    exercises: [
      { name: "Incline Dumbbell Press", muscle: "Upper Chest", sets: 3, targetReps: "8-10" },
      { name: "Chest-Supported Row", muscle: "Back", sets: 3, targetReps: "10-12" },
      { name: "Arnold Press", muscle: "Shoulders", sets: 3, targetReps: "10-12" },
      { name: "Hammer Curl", muscle: "Biceps", sets: 2, targetReps: "10-12" },
      { name: "Bench Dip", muscle: "Triceps", sets: 2, targetReps: "10-15" },
      { name: "Plank", muscle: "Core", sets: 3, targetReps: "45-60s" },
      { name: "Lying Leg Raise", muscle: "Core", sets: 3, targetReps: "12-15" },
    ],
    cooldown: [
      "Cobra stretch 30s",
      "Seated twist 30s/side",
      "Child's pose 60s",
    ],
  },
  run3: {
    id: "run3", type: "run", name: "Long Progression Run", short: "Long Run",
    goal: { distance: 3.0, pace: "11:45", note: "Start easy, finish the last half-mile a touch quicker. Build distance over time." },
    warmup: [
      "4 min brisk walk",
      "Leg swings x10/side",
      "Hip openers x8/side",
      "20s each: high knees, skips",
    ],
    cooldown: [
      "4 min walk down",
      "Full lower-body stretch flow 5 min",
      "Foam roll calves + quads if available",
    ],
  },
};

// Ordered week for display: Lift -> Run pairing, rest on Sunday.
const WEEK_ORDER = ["day1", "run1", "day2", "run2", "day3", "run3"];

// ---------------------------------------------------------------------------
// Nutrition plan — supports the recomp goal.
// Targets: ~1,950 cal / ~175g protein/day (slow recomp, adjust on weekly trend).
// Rules from profile: reheat-friendly only (NO pan-seared chicken breast), lean
// on ground beef / braised-oven proteins / tuna / eggs / cottage cheese, scale
// off wife's budget staples (rice, tortillas, plantain, peppers, onion, zucchini,
// carrot, tomato), keep grocery cost low, fish OK but no shellfish, fasted AM
// training so breakfast + caffeine come post-session.
// Two rotating day templates: A = lift days (steady), B = run days (carb-forward).
// ---------------------------------------------------------------------------
const NUTRITION = {
  calTarget: 1950,
  proteinTarget: 175,
  note: "Fasted AM training — first meal comes after your session. Judge the target by the weekly scale + waist trend, not any single day.",
  water: { bottleOz: 36, bottles: 3, totalOz: 108, label: "36oz Yeti" },
  weekend: {
    title: "Weekend / Drink Buffer",
    blurb: "You mentioned cutting back — this keeps a couple beers in the plan without derailing the week.",
    bankPerDay: 220,
    bankDays: "Mon, Wed & Fri",
    points: [
      "On your 3 lift days, skip the optional 2nd protein shake (~220 cal each). Protein still lands ~150g those days — plenty.",
      "That banks ~450–650 cal across the week you can spend Saturday.",
      "Roughly 4 light beers (~110 cal) or 3 regular (~150 cal) — or a couple drinks plus a bigger Saturday dinner.",
      "Hydrate hard on drink days: aim for an extra Yeti bottle, and front-load protein earlier so you're not chasing it late.",
    ],
  },
  templates: {
    A: {
      id: "A", label: "Lift-Day Plate", accent: "#1DB954",
      blurb: "Steady protein across the day to back your lifting sessions.",
      meals: [
        { slot: "Breakfast", name: "Egg scramble + oats", cal: 400, protein: 31,
          detail: "3 whole eggs + 2 whites scrambled with peppers & onion, 40g oats on the side. Cook eggs soft so they reheat without rubberizing.",
          tags: ["eggs", "oats", "peppers"] },
        { slot: "Lunch", name: "Ground beef rice bowl", cal: 537, protein: 36,
          detail: "5oz 93/7 ground beef, 1 cup rice, zucchini + peppers, splash of olive oil. Batch the beef & rice — reheats great all week.",
          tags: ["ground beef", "rice", "zucchini"] },
        { slot: "Dinner", name: "Tuna rice bowl", cal: 514, protein: 51,
          detail: "2 cans tuna, 3/4 cup rice, tomato + onion, half avocado. No cooking, assembles in 5 min.",
          tags: ["tuna", "rice", "avocado"],
          alt: { name: "Not feeling tuna? Baked salmon bowl", cal: 575, protein: 46,
            detail: "Sub in ~7oz baked or air-fried salmon over 3/4 cup rice with peppers & onion (skip the avocado to keep cal in range). Reheats far better than any pan-seared fish. Fish only — no shellfish. Heartier swap: oven-braised chicken thighs (NOT breast — thighs stay moist on reheat)." } },
        { slot: "Snack", name: "Cottage cheese + banana", cal: 285, protein: 25,
          detail: "1 cup cottage cheese, sliced banana, cinnamon. Afternoon protein hit.",
          tags: ["cottage cheese", "banana"] },
        { slot: "Snack", name: "Protein shake", cal: 220, protein: 33,
          detail: "1 scoop whey + 1 cup milk. Optional — drop it if you're full and trends are on track.",
          tags: ["whey", "milk"] },
      ],
    },
    B: {
      id: "B", label: "Run-Day Plate", accent: "#8AE82C",
      blurb: "A touch more carbs to fuel and recover from the run days.",
      meals: [
        { slot: "Breakfast", name: "Greek yogurt + oats bowl", cal: 408, protein: 40,
          detail: "1 cup nonfat Greek yogurt, 30g oats, banana, half scoop whey stirred in. Overnight-oats it for grab-and-go.",
          tags: ["greek yogurt", "oats", "whey"] },
        { slot: "Lunch", name: "Ground beef tacos", cal: 655, protein: 50,
          detail: "6oz 93/7 ground beef, 2 tortillas, peppers & onion, slice of cheese. Same beef batch as lift-day bowls.",
          tags: ["ground beef", "tortillas", "cheese"] },
        { slot: "Dinner", name: "Egg + plantain skillet", cal: 676, protein: 42,
          detail: "3 eggs, air-fried plantain, black beans, peppers, half cup cottage cheese on the side. Hearty post-run refuel.",
          tags: ["eggs", "plantain", "black beans"] },
        { slot: "Snack", name: "Protein shake", cal: 220, protein: 33,
          detail: "1 scoop whey + 1 cup milk. Post-run or mid-afternoon.",
          tags: ["whey", "milk"] },
      ],
    },
  },
  // Which template each day of the week uses (mirrors the training split)
  week: [
    { day: "Mon", trains: "Upper Body", template: "A" },
    { day: "Tue", trains: "Easy Base Run", template: "B" },
    { day: "Wed", trains: "Lower (Hinge)", template: "A" },
    { day: "Thu", trains: "Intervals / Tempo", template: "B" },
    { day: "Fri", trains: "Push/Pull + Core", template: "A" },
    { day: "Sat", trains: "Long Run + Golf", template: "B" },
    { day: "Sun", trains: "Rest", template: "A" },
  ],
  // Budget grocery list, grouped — scales off the shared staples with the wife's plan
  grocery: [
    { group: "Proteins", items: ["Ground beef 93/7 (family pack)", "Canned tuna (in water)", "Eggs (18-ct)", "Cottage cheese", "Nonfat Greek yogurt", "Whey protein"] },
    { group: "Carbs", items: ["White rice (big bag)", "Rolled oats", "Flour tortillas", "Plantains", "Black beans (canned)", "Bananas"] },
    { group: "Produce", items: ["Bell peppers", "Onions", "Zucchini", "Carrots", "Tomatoes", "Avocados"] },
    { group: "Extras", items: ["Olive oil", "Shredded cheese", "Milk", "Cinnamon / spices"] },
  ],
};

const EXERCISE_LIBRARY = [
  "Dumbbell Bench Press", "Incline Dumbbell Press", "One-Arm Dumbbell Row",
  "Chest-Supported Row", "Seated Overhead Press", "Arnold Press", "Lateral Raise",
  "Band Face Pull", "Dumbbell Curl", "Hammer Curl", "Overhead Triceps Ext.",
  "Bench Dip", "Dumbbell RDL", "Dumbbell Hip Thrust", "Reverse Lunge (controlled)",
  "Ankle-Weight Leg Curl", "Standing Calf Raise", "Goblet Squat (light)",
  "Pallof Press (band)", "Plank", "Lying Leg Raise", "Dead Bug", "Bird Dog",
  "Russian Twist", "Push-Up", "Jump Rope Intervals",
];

const MUSCLE_FOR = {
  "Dumbbell Bench Press": "Chest", "Incline Dumbbell Press": "Upper Chest",
  "One-Arm Dumbbell Row": "Back", "Chest-Supported Row": "Back",
  "Seated Overhead Press": "Shoulders", "Arnold Press": "Shoulders",
  "Lateral Raise": "Shoulders", "Band Face Pull": "Rear Delts",
  "Dumbbell Curl": "Biceps", "Hammer Curl": "Biceps",
  "Overhead Triceps Ext.": "Triceps", "Bench Dip": "Triceps",
  "Dumbbell RDL": "Hamstrings/Glutes", "Dumbbell Hip Thrust": "Glutes",
  "Reverse Lunge (controlled)": "Quads/Glutes", "Ankle-Weight Leg Curl": "Hamstrings",
  "Standing Calf Raise": "Calves", "Goblet Squat (light)": "Quads",
  "Pallof Press (band)": "Core", "Plank": "Core", "Lying Leg Raise": "Core",
  "Dead Bug": "Core", "Bird Dog": "Core", "Russian Twist": "Core",
  "Push-Up": "Chest", "Jump Rope Intervals": "Conditioning",
};

// ---------------------------------------------------------------------------
// Workout history — persisted in Supabase (`workouts` table), scoped to the
// signed-in user via RLS. `user_id` is set by a database default on insert.
// ---------------------------------------------------------------------------
async function fetchWorkouts() {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("date", { ascending: true });
  if (error) {
    console.error("Failed to load workouts:", error.message);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    planId: row.plan_id,
    type: row.type,
    name: row.name,
    date: row.date,
    durationSec: row.duration_sec,
    exercises: row.exercises || [],
    run: row.run || null,
  }));
}

async function insertWorkout(record) {
  const { error } = await supabase.from("workouts").insert({
    plan_id: record.planId,
    type: record.type,
    name: record.name,
    date: record.date,
    duration_sec: record.durationSec,
    exercises: record.type === "lift" ? record.exercises : null,
    run: record.type === "run" ? record.run : null,
  });
  if (error) console.error("Failed to save workout:", error.message);
}

// ---------------------------------------------------------------------------
// Water log — persisted in Supabase (`water_logs` table), one row per user
// per day, keyed by the (user_id, date) unique constraint.
// ---------------------------------------------------------------------------
async function fetchTodayWater() {
  const { data, error } = await supabase
    .from("water_logs")
    .select("bottles")
    .eq("date", todayISO())
    .maybeSingle();
  if (error) {
    console.error("Failed to load water log:", error.message);
    return 0;
  }
  return data ? data.bottles : 0;
}

async function upsertTodayWater(bottles) {
  const { error } = await supabase
    .from("water_logs")
    .upsert({ date: todayISO(), bottles }, { onConflict: "user_id,date" });
  if (error) console.error("Failed to save water log:", error.message);
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#0A0A0A", card: "#181818", cardAlt: "#121212", line: "#2A2A2A",
  accent: "#1DB954", accentSoft: "#12401F", text: "#FFFFFF", muted: "#A7A7A7",
  green: "#1DB954", gold: "#F0C33C", run: "#8AE82C",
};

const MUSCLE_COLORS = {
  Chest: "#1DB954", "Upper Chest": "#25C55E", Back: "#3BE477",
  Shoulders: "#8FE9A6", "Rear Delts": "#6FD98C", Biceps: "#4AD07A",
  Triceps: "#2FB861", "Hamstrings/Glutes": "#B7F0C4", Glutes: "#A0EBB2",
  "Quads/Glutes": "#88E5A0", Hamstrings: "#70DE8D", Calves: "#57C878",
  Quads: "#9DE8AF", Core: "#C9F3D3", Conditioning: "#7A7A7A",
};
const muscleColor = (m) => MUSCLE_COLORS[m] || COLORS.accent;

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function fmtDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function fmtDurationLong(sec) { return `${Math.round(sec / 60)} min`; }
function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateShort(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

// pace in seconds per mile -> "mm:ss"
function paceStr(distanceMi, durationSec) {
  if (!distanceMi || distanceMi <= 0) return "—";
  const secPerMi = durationSec / distanceMi;
  const m = Math.floor(secPerMi / 60), s = Math.round(secPerMi % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function paceSecPerMi(distanceMi, durationSec) {
  if (!distanceMi || distanceMi <= 0) return 0;
  return durationSec / distanceMi;
}

function bestSet(sets) {
  return sets.reduce(
    (best, s) => (s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best),
    { weight: 0, reps: 0 }
  );
}

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------
function computePRs(history) {
  const prs = {};
  history.filter((w) => w.type === "lift").forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.weight <= 0) return;
        const cur = prs[ex.name];
        if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps)) {
          prs[ex.name] = { name: ex.name, muscle: ex.muscle, weight: s.weight, reps: s.reps, date: w.date };
        }
      });
    });
  });
  return prs;
}

// Fastest run pace overall (best run "PR")
function computeRunPR(history) {
  let best = null;
  history.filter((w) => w.type === "run").forEach((w) => {
    const p = paceSecPerMi(w.run.distance, w.run.durationSec);
    if (p > 0 && (!best || p < best.pace)) {
      best = { pace: p, paceLabel: paceStr(w.run.distance, w.run.durationSec), distance: w.run.distance, date: w.date };
    }
  });
  return best;
}

// Longest run (distance PR)
function computeLongestRun(history) {
  let best = null;
  history.filter((w) => w.type === "run").forEach((w) => {
    if (!best || w.run.distance > best.distance) best = { distance: w.run.distance, date: w.date };
  });
  return best;
}

// Sessions that set a lift PR (chronological)
function computePRSessions(history) {
  const running = {}, flagged = {};
  [...history].filter((w) => w.type === "lift").sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
    let hit = false;
    w.exercises.forEach((ex) => ex.sets.forEach((s) => {
      if (s.weight > 0 && (!running[ex.name] || s.weight > running[ex.name])) { running[ex.name] = s.weight; hit = true; }
    }));
    if (hit) flagged[w.id] = true;
  });
  return flagged;
}

function computeStreak(history) {
  if (history.length === 0) return 0;
  const days = new Set(history.map((w) => w.date));
  const has = (d) => days.has(d.toISOString().slice(0, 10));
  let cursor = new Date();
  if (!has(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!has(cursor)) {
      const latest = [...history].sort((a, b) => b.date.localeCompare(a.date))[0].date;
      cursor = new Date(latest + "T00:00:00");
    }
  }
  let streak = 0;
  while (has(cursor)) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function weekBounds() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function thisWeekCounts(history) {
  const monday = weekBounds();
  const inWeek = history.filter((w) => new Date(w.date + "T00:00:00") >= monday);
  return {
    lifts: inWeek.filter((w) => w.type === "lift").length,
    runs: inWeek.filter((w) => w.type === "run").length,
    total: inWeek.length,
  };
}

function weeklyVolumeByMuscle(history) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const totals = {};
  history.filter((w) => w.type === "lift").forEach((w) => {
    if (new Date(w.date + "T00:00:00") < cutoff) return;
    w.exercises.forEach((ex) => {
      const vol = ex.sets.reduce((sum, s) => sum + (s.weight > 0 ? s.weight * s.reps : s.reps * 2), 0);
      totals[ex.muscle] = (totals[ex.muscle] || 0) + vol;
    });
  });
  return Object.entries(totals).map(([muscle, volume]) => ({ muscle, volume })).sort((a, b) => b.volume - a.volume);
}

function weeklyMileage(history) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  return history
    .filter((w) => w.type === "run" && new Date(w.date + "T00:00:00") >= cutoff)
    .reduce((sum, w) => sum + w.run.distance, 0);
}

function exerciseTrends(history) {
  const map = {};
  [...history].filter((w) => w.type === "lift").sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
    w.exercises.forEach((ex) => {
      const best = bestSet(ex.sets);
      if (best.weight <= 0) return;
      if (!map[ex.name]) map[ex.name] = { name: ex.name, muscle: ex.muscle, points: [] };
      map[ex.name].points.push({ date: w.date, weight: best.weight, reps: best.reps });
    });
  });
  return Object.values(map);
}

// Run pace trend (lower is better) — we plot pace so improvement trends down
function runTrends(history) {
  const map = {};
  [...history].filter((w) => w.type === "run").sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
    if (!map[w.planId]) map[w.planId] = { planId: w.planId, name: w.name, points: [] };
    map[w.planId].points.push({
      date: w.date,
      pace: paceSecPerMi(w.run.distance, w.run.durationSec),
      paceLabel: paceStr(w.run.distance, w.run.durationSec),
      distance: w.run.distance,
    });
  });
  return Object.values(map);
}

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------
function StatBox({ label, value, sub, accent }) {
  return (
    <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="flex-1 rounded-xl border p-4">
      <div style={{ color: accent || COLORS.accent, fontFamily: "'Barlow Condensed', sans-serif" }}
        className="text-4xl font-extrabold leading-none tabular-nums">{value}</div>
      <div style={{ color: COLORS.muted }} className="mt-1 text-[11px] font-semibold uppercase tracking-widest">{label}</div>
      {sub && <div style={{ color: COLORS.muted }} className="mt-0.5 text-[11px]">{sub}</div>}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between">
      <h2 style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
        className="text-xl font-bold uppercase tracking-wide">{children}</h2>
      {right}
    </div>
  );
}

function Trophy({ size = 14, color = COLORS.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" fill={color} />
      <path d="M6 5H3v1a4 4 0 0 0 4 4M18 5h3v1a4 4 0 0 1-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 12h4v3h-4zM8 19h8v2H8z" fill={color} />
      <path d="M11 15h2v4h-2z" fill={color} />
    </svg>
  );
}

function RunIcon({ size = 16, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="16" cy="5" r="2" fill={color} />
      <path d="M5 20l3-4 2-3 4 1 1 4M10 13l-1-4 4-2 3 3 3 1"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
function Dashboard({ history, onLaunch }) {
  const streak = computeStreak(history);
  const wk = thisWeekCounts(history);
  const total = history.length;
  const prs = computePRs(history);
  const topPRs = Object.values(prs).sort((a, b) => b.weight - a.weight).slice(0, 3);
  const runPR = computeRunPR(history);
  const longest = computeLongestRun(history);

  return (
    <div>
      <div className="flex gap-3">
        <StatBox label="Day Streak" value={streak} accent={COLORS.accent} />
        <StatBox label="This Week" value={wk.total} sub={`${wk.lifts} lift · ${wk.runs} run`} accent={COLORS.green} />
        <StatBox label="Total" value={total} sub="sessions" accent={COLORS.text} />
      </div>

      <SectionTitle right={<span style={{ color: COLORS.muted }} className="text-[11px] uppercase tracking-widest">6-day hybrid</span>}>
        Start a Session
      </SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WEEK_ORDER.map((pid, i) => {
          const d = PLAN[pid];
          const isRun = d.type === "run";
          const accent = isRun ? COLORS.run : COLORS.accent;
          return (
            <button key={d.id} onClick={() => onLaunch(d.id)}
              style={{ background: COLORS.card, borderColor: COLORS.line }}
              className="group flex items-center justify-between rounded-xl border p-4 text-left transition active:scale-[0.98]">
              <div className="min-w-0">
                <div style={{ color: accent }} className="text-[11px] font-bold uppercase tracking-widest">
                  Day {i + 1} · {isRun ? "Run" : "Lift"}
                </div>
                <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="truncate text-2xl font-bold leading-tight">{d.name}</div>
                <div style={{ color: COLORS.muted }} className="mt-0.5 text-xs">
                  {isRun ? `${d.goal.distance} mi target · ${d.goal.pace}/mi` : `${d.exercises.length} exercises`}
                </div>
              </div>
              <div style={{ background: accent }}
                className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition group-active:scale-90">
                {isRun ? <RunIcon color="#0A0A0A" /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5Z" fill="#0A0A0A" /></svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <SectionTitle>Top Lift PRs</SectionTitle>
      <div className="flex flex-col gap-2">
        {topPRs.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">No PRs yet — go set one.</div>}
        {topPRs.map((pr, idx) => (
          <div key={pr.name} style={{ background: COLORS.card, borderColor: COLORS.line }}
            className="flex items-center gap-3 rounded-xl border p-3">
            <div style={{ background: COLORS.accentSoft, color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-extrabold">{idx + 1}</div>
            <div className="min-w-0 flex-1">
              <div style={{ color: COLORS.text }} className="truncate font-semibold">{pr.name}</div>
              <div style={{ color: COLORS.muted }} className="text-xs">
                <span style={{ color: muscleColor(pr.muscle) }}>{pr.muscle}</span> · {fmtDate(pr.date)}
              </div>
            </div>
            <div className="text-right">
              <div style={{ color: COLORS.gold, fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-extrabold leading-none tabular-nums">{pr.weight}<span className="text-sm"> lb</span></div>
              <div style={{ color: COLORS.muted }} className="text-xs">{pr.reps} reps</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Running Bests</SectionTitle>
      <div className="flex gap-3">
        <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="flex-1 rounded-xl border p-4">
          <div className="flex items-center gap-1.5">
            <RunIcon size={13} color={COLORS.run} />
            <span style={{ color: COLORS.muted }} className="text-[11px] font-semibold uppercase tracking-widest">Fastest Pace</span>
          </div>
          <div style={{ color: COLORS.run, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="mt-1 text-3xl font-extrabold leading-none tabular-nums">
            {runPR ? runPR.paceLabel : "—"}<span className="text-sm"> /mi</span>
          </div>
          {runPR && <div style={{ color: COLORS.muted }} className="mt-0.5 text-[11px]">{runPR.distance} mi · {fmtDate(runPR.date)}</div>}
        </div>
        <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="flex-1 rounded-xl border p-4">
          <div className="flex items-center gap-1.5">
            <Trophy size={13} color={COLORS.run} />
            <span style={{ color: COLORS.muted }} className="text-[11px] font-semibold uppercase tracking-widest">Longest Run</span>
          </div>
          <div style={{ color: COLORS.run, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="mt-1 text-3xl font-extrabold leading-none tabular-nums">
            {longest ? longest.distance : "—"}<span className="text-sm"> mi</span>
          </div>
          {longest && <div style={{ color: COLORS.muted }} className="mt-0.5 text-[11px]">{fmtDate(longest.date)}</div>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LIFT LOGGER PARTS
// ---------------------------------------------------------------------------
function ExercisePicker({ onPick, onClose, current }) {
  const [q, setQ] = useState("");
  const filtered = EXERCISE_LIBRARY.filter((e) => e.toLowerCase().includes(q.toLowerCase()) && !current.includes(e));
  return (
    <div style={{ background: COLORS.cardAlt, borderColor: COLORS.line }} className="mt-3 rounded-xl border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-lg font-bold uppercase tracking-wide">Add Exercise</div>
        <button onClick={onClose} style={{ color: COLORS.muted }} className="text-sm font-semibold">Close</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises…"
        style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
        className="mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
      <div className="max-h-48 overflow-y-auto">
        {filtered.map((e) => (
          <button key={e} onClick={() => onPick(e)} style={{ borderColor: COLORS.line, color: COLORS.text }}
            className="flex w-full items-center justify-between border-b py-2 text-left text-sm last:border-0">
            <span>{e}</span>
            <span style={{ color: muscleColor(MUSCLE_FOR[e]) }} className="text-xs">{MUSCLE_FOR[e]}</span>
          </button>
        ))}
        {filtered.length === 0 && <div style={{ color: COLORS.muted }} className="py-3 text-center text-sm">No matches</div>}
      </div>
    </div>
  );
}

function SetRow({ set, prev, onChange, onToggle }) {
  const done = set.done;
  const bd = done ? COLORS.green : COLORS.line;
  return (
    <div className="flex items-center gap-2 rounded-lg px-1 py-1.5"
      style={{ background: done ? "rgba(29,185,84,0.12)" : "transparent" }}>
      <div style={{ color: done ? COLORS.green : COLORS.muted, fontFamily: "'Barlow Condensed', sans-serif" }}
        className="w-6 shrink-0 text-center text-lg font-bold tabular-nums">{set.n}</div>
      <div style={{ color: COLORS.muted }} className="w-12 shrink-0 truncate text-xs">{prev ? `${prev.weight}×${prev.reps}` : "—"}</div>
      <input type="number" inputMode="decimal" value={set.weight} onChange={(e) => onChange({ ...set, weight: e.target.value })}
        placeholder="lb" style={{ background: COLORS.bg, borderColor: bd, color: COLORS.text }}
        className="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-center text-sm outline-none tabular-nums" />
      <input type="number" inputMode="numeric" value={set.reps} onChange={(e) => onChange({ ...set, reps: e.target.value })}
        placeholder="reps" style={{ background: COLORS.bg, borderColor: bd, color: COLORS.text }}
        className="min-w-0 flex-1 rounded-md border px-2 py-1.5 text-center text-sm outline-none tabular-nums" />
      <button onClick={onToggle} aria-label={done ? "Mark set incomplete" : "Mark set complete"}
        style={{ background: done ? COLORS.green : "transparent", borderColor: bd }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition active:scale-90">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5 10 17.5 19 7" stroke={done ? "#0A0A0A" : COLORS.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function ExerciseCard({ ex, prevData, onUpdate, onRemove }) {
  const prevSets = prevData ? prevData.sets : [];
  const addSet = () => onUpdate({ ...ex, sets: [...ex.sets, { n: ex.sets.length + 1, weight: "", reps: "", done: false }] });
  const updateSet = (i, s) => onUpdate({ ...ex, sets: ex.sets.map((x, idx) => (idx === i ? s : x)) });
  const toggleSet = (i) => onUpdate({ ...ex, sets: ex.sets.map((x, idx) => (idx === i ? { ...x, done: !x.done } : x)) });
  const doneCount = ex.sets.filter((s) => s.done).length;

  return (
    <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="min-w-0">
          <div style={{ color: COLORS.text }} className="font-semibold leading-tight">{ex.name}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span style={{ background: muscleColor(ex.muscle) + "22", color: muscleColor(ex.muscle) }}
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{ex.muscle}</span>
            {ex.targetReps && <span style={{ color: COLORS.muted }} className="text-[11px]">target {ex.targetReps}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: doneCount === ex.sets.length && ex.sets.length ? COLORS.green : COLORS.muted }}
            className="text-xs font-semibold tabular-nums">{doneCount}/{ex.sets.length}</span>
          <button onClick={onRemove} style={{ color: COLORS.muted }} className="text-lg leading-none" aria-label="Remove exercise">×</button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-1 pb-1">
        <div style={{ color: COLORS.muted }} className="w-6 shrink-0 text-center text-[10px] font-bold uppercase tracking-wider">Set</div>
        <div style={{ color: COLORS.muted }} className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider">Prev</div>
        <div style={{ color: COLORS.muted }} className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider">Weight</div>
        <div style={{ color: COLORS.muted }} className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider">Reps</div>
        <div className="w-8 shrink-0" />
      </div>
      <div className="flex flex-col gap-1">
        {ex.sets.map((s, i) => (
          <SetRow key={i} set={s} prev={prevSets[i]} onChange={(ns) => updateSet(i, ns)} onToggle={() => toggleSet(i)} />
        ))}
      </div>
      <button onClick={addSet} style={{ borderColor: COLORS.line, color: COLORS.accent }}
        className="mt-2 w-full rounded-lg border border-dashed py-2 text-xs font-bold uppercase tracking-wider transition active:scale-[0.98]">
        + Add Set
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RUN LOGGER
// ---------------------------------------------------------------------------
function RunLogger({ plan, prevRun, distance, setDistance, mins, setMins, secs, setSecs }) {
  const totalSec = (Number(mins) || 0) * 60 + (Number(secs) || 0);
  const live = paceStr(Number(distance) || 0, totalSec);
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div style={{ color: COLORS.run, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-lg font-bold uppercase tracking-wide">Log the Run</div>
          <span style={{ color: COLORS.muted }} className="text-[11px]">
            {prevRun ? `Last: ${prevRun.distance} mi · ${paceStr(prevRun.distance, prevRun.durationSec)}/mi` : "First one logged"}
          </span>
        </div>
        <div style={{ color: COLORS.muted }} className="mt-1 text-xs">{plan.goal.note}</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label style={{ color: COLORS.muted }} className="mb-1 block text-[10px] font-bold uppercase tracking-wider">Distance (mi)</label>
            <input type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)}
              placeholder={String(plan.goal.distance)} style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
              className="w-full rounded-lg border px-3 py-2.5 text-center text-lg font-bold outline-none tabular-nums" />
          </div>
          <div>
            <label style={{ color: COLORS.muted }} className="mb-1 block text-[10px] font-bold uppercase tracking-wider">Time (min : sec)</label>
            <div className="flex items-center gap-1">
              <input type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} placeholder="min"
                style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
                className="w-full rounded-lg border px-2 py-2.5 text-center text-lg font-bold outline-none tabular-nums" />
              <span style={{ color: COLORS.muted }} className="text-lg font-bold">:</span>
              <input type="number" inputMode="numeric" value={secs} onChange={(e) => setSecs(e.target.value)} placeholder="sec"
                style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
                className="w-full rounded-lg border px-2 py-2.5 text-center text-lg font-bold outline-none tabular-nums" />
            </div>
          </div>
        </div>

        <div style={{ background: COLORS.bg, borderColor: COLORS.line }}
          className="mt-3 flex items-center justify-between rounded-lg border px-4 py-3">
          <span style={{ color: COLORS.muted }} className="text-[11px] font-bold uppercase tracking-widest">Pace</span>
          <span style={{ color: COLORS.run, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl font-extrabold leading-none tabular-nums">
            {live}<span className="text-sm"> /mi</span>
          </span>
        </div>
        <div style={{ color: COLORS.muted }} className="mt-2 text-center text-[11px]">
          Target this run: {plan.goal.distance} mi @ {plan.goal.pace}/mi
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SESSION SCREEN (lift or run)
// ---------------------------------------------------------------------------
function WarmCoolCard({ kind, items, done, onToggle, color }) {
  const isWarm = kind === "warmup";
  return (
    <button onClick={onToggle}
      style={{ background: done ? color + "1A" : COLORS.card, borderColor: done ? color : COLORS.line }}
      className="w-full rounded-xl border p-3 text-left">
      <div className="flex items-center justify-between">
        <div style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold uppercase tracking-wide">
          {isWarm ? "Warm-Up · 5 min" : "Cool-Down"}
        </div>
        <span style={{ color: done ? color : COLORS.muted }} className="text-xs font-bold">{done ? "DONE" : "TAP WHEN DONE"}</span>
      </div>
      <ul style={{ color: COLORS.muted }} className="mt-1 space-y-0.5 text-sm">
        {items.map((w, i) => <li key={i}>• {w}</li>)}
      </ul>
    </button>
  );
}

function Session({ planId, history, onFinish, onDiscard }) {
  const plan = PLAN[planId] || PLAN.day1;
  const isRun = plan.type === "run";

  // Previous-session references
  const prevByName = useRef({});
  const prevRun = useRef(null);
  useEffect(() => {
    if (isRun) {
      const last = history.filter((w) => w.type === "run" && w.planId === planId).sort((a, b) => b.date.localeCompare(a.date))[0]
        || history.filter((w) => w.type === "run").sort((a, b) => b.date.localeCompare(a.date))[0];
      prevRun.current = last ? last.run : null;
    } else {
      const map = {};
      const sameDay = history.filter((w) => w.type === "lift" && w.planId === planId).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (sameDay) sameDay.exercises.forEach((ex) => { map[ex.name] = ex; });
      [...history].filter((w) => w.type === "lift").sort((a, b) => b.date.localeCompare(a.date)).forEach((w) =>
        w.exercises.forEach((ex) => { if (!map[ex.name]) map[ex.name] = ex; }));
      prevByName.current = map;
    }
  }, [planId, history, isRun]);

  // Lift state
  const [exercises, setExercises] = useState(() =>
    isRun ? [] : plan.exercises.map((e) => ({
      name: e.name, muscle: e.muscle, targetReps: e.targetReps,
      sets: Array.from({ length: e.sets }, (_, i) => ({ n: i + 1, weight: "", reps: "", done: false })),
    }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  // Run state
  const [distance, setDistance] = useState("");
  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");

  // Shared state
  const [elapsed, setElapsed] = useState(0);
  const [warmDone, setWarmDone] = useState(false);
  const [coolDone, setCoolDone] = useState(false);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const updateExercise = (i, ex) => setExercises((prev) => prev.map((x, idx) => (idx === i ? ex : x)));
  const removeExercise = (i) => setExercises((prev) => prev.filter((_, idx) => idx !== i));
  const addExercise = (name) => {
    setExercises((prev) => [...prev, { name, muscle: MUSCLE_FOR[name] || "Other", sets: [{ n: 1, weight: "", reps: "", done: false }] }]);
    setPickerOpen(false);
  };

  const finish = () => {
    if (isRun) {
      const dist = Number(distance) || 0;
      const runSec = (Number(mins) || 0) * 60 + (Number(secs) || 0);
      if (dist <= 0 || runSec <= 0) { onDiscard(); return; }
      onFinish({
        id: "w" + Date.now(), planId, type: "run", name: plan.name, date: todayISO(),
        durationSec: elapsed || runSec, run: { distance: dist, durationSec: runSec },
      });
      return;
    }
    const cleaned = exercises.map((ex) => ({
      name: ex.name, muscle: ex.muscle,
      sets: ex.sets.filter((s) => s.done && (s.weight !== "" || s.reps !== "")).map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 })),
    })).filter((ex) => ex.sets.length > 0);
    onFinish({ id: "w" + Date.now(), planId, type: "lift", name: plan.name, date: todayISO(), durationSec: elapsed, exercises: cleaned });
  };

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const headerColor = isRun ? COLORS.run : COLORS.accent;

  return (
    <div className="pb-4">
      <div style={{ background: COLORS.cardAlt, borderColor: COLORS.line }} className="sticky top-0 z-10 -mx-4 mb-4 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRun && <span style={{ background: COLORS.run }} className="flex h-7 w-7 items-center justify-center rounded-md"><RunIcon size={15} color="#0A0A0A" /></span>}
            <div>
              <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-bold uppercase leading-none">{plan.name}</div>
              <div style={{ color: COLORS.muted }} className="text-xs">{fmtDate(todayISO())}</div>
            </div>
          </div>
          <div className="text-right">
            <div style={{ color: headerColor, fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-extrabold leading-none tabular-nums">{fmtDuration(elapsed)}</div>
            <div style={{ color: COLORS.muted }} className="text-[11px] uppercase tracking-widest">
              {isRun ? "elapsed" : `${doneSets}/${totalSets} sets`}
            </div>
          </div>
        </div>
      </div>

      <WarmCoolCard kind="warmup" items={plan.warmup} done={warmDone} onToggle={() => setWarmDone((v) => !v)} color={COLORS.gold} />

      {isRun ? (
        <RunLogger plan={plan} prevRun={prevRun.current}
          distance={distance} setDistance={setDistance} mins={mins} setMins={setMins} secs={secs} setSecs={setSecs} />
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            {exercises.map((ex, i) => (
              <ExerciseCard key={ex.name + i} ex={ex} prevData={prevByName.current[ex.name]}
                onUpdate={(nx) => updateExercise(i, nx)} onRemove={() => removeExercise(i)} />
            ))}
          </div>
          {pickerOpen ? (
            <ExercisePicker current={exercises.map((e) => e.name)} onPick={addExercise} onClose={() => setPickerOpen(false)} />
          ) : (
            <button onClick={() => setPickerOpen(true)} style={{ borderColor: COLORS.accent, color: COLORS.accent }}
              className="mt-3 w-full rounded-xl border py-3 text-sm font-bold uppercase tracking-wider transition active:scale-[0.98]">
              + Add Exercise
            </button>
          )}
        </>
      )}

      <div className="mt-4">
        <WarmCoolCard kind="cooldown" items={plan.cooldown} done={coolDone} onToggle={() => setCoolDone((v) => !v)} color={COLORS.run} />
      </div>

      <div className="mt-5 flex gap-3">
        <button onClick={onDiscard} style={{ flex: "1 1 0%", borderColor: COLORS.line, color: COLORS.muted }}
          className="rounded-xl border py-3 text-sm font-bold uppercase tracking-wider transition active:scale-[0.98]">Discard</button>
        <button onClick={finish} style={{ flex: "2 1 0%", background: headerColor, color: "#0A0A0A" }}
          className="rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition active:scale-[0.98]">
          {isRun ? "Finish Run" : "Finish Workout"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HISTORY
// ---------------------------------------------------------------------------
function History({ history }) {
  const prSessions = computePRSessions(history);
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const prExercisesBySession = React.useMemo(() => {
    const running = {}, result = {};
    [...history].filter((w) => w.type === "lift").sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
      const hits = [];
      w.exercises.forEach((ex) => {
        let exHit = false;
        ex.sets.forEach((s) => { if (s.weight > 0 && (!running[ex.name] || s.weight > running[ex.name])) { running[ex.name] = s.weight; exHit = true; } });
        if (exHit) hits.push(ex.name);
      });
      result[w.id] = hits;
    });
    return result;
  }, [history]);

  // Track fastest pace over time to flag run PRs in history
  const runPRSessions = React.useMemo(() => {
    let best = Infinity; const flagged = {};
    [...history].filter((w) => w.type === "run").sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
      const p = paceSecPerMi(w.run.distance, w.run.durationSec);
      if (p > 0 && p < best) { best = p; flagged[w.id] = true; }
    });
    return flagged;
  }, [history]);

  return (
    <div>
      <SectionTitle right={<span style={{ color: COLORS.muted }} className="text-xs">{history.length} sessions</span>}>History</SectionTitle>
      <div className="flex flex-col gap-3">
        {sorted.map((w) => {
          const isRun = w.type === "run";
          if (isRun) {
            const pr = runPRSessions[w.id];
            return (
              <div key={w.id} style={{ background: COLORS.card, borderColor: pr ? COLORS.run + "66" : COLORS.line }}
                className="rounded-xl border p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ background: COLORS.run }} className="flex h-8 w-8 items-center justify-center rounded-md"><RunIcon size={15} color="#0A0A0A" /></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase">{w.name}</span>
                        {pr && (
                          <span style={{ background: COLORS.run + "22", color: COLORS.run }}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <Trophy size={11} color={COLORS.run} /> Pace PR
                          </span>
                        )}
                      </div>
                      <div style={{ color: COLORS.muted }} className="text-xs">{fmtDate(w.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ color: COLORS.run, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold tabular-nums">
                      {paceStr(w.run.distance, w.run.durationSec)}<span className="text-xs"> /mi</span>
                    </div>
                    <div style={{ color: COLORS.muted }} className="text-xs">{w.run.distance} mi · {fmtDurationLong(w.run.durationSec)}</div>
                  </div>
                </div>
              </div>
            );
          }
          const totalSets = w.exercises.reduce((n, e) => n + e.sets.length, 0);
          const isPR = prSessions[w.id];
          const prExercises = prExercisesBySession[w.id] || [];
          return (
            <div key={w.id} style={{ background: COLORS.card, borderColor: isPR ? COLORS.gold + "55" : COLORS.line }}
              className="rounded-xl border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase">{w.name}</span>
                    {isPR && (
                      <span style={{ background: COLORS.gold + "22", color: COLORS.gold }}
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Trophy size={11} /> PR
                      </span>
                    )}
                  </div>
                  <div style={{ color: COLORS.muted }} className="text-xs">{fmtDate(w.date)}</div>
                </div>
                <div className="text-right">
                  <div style={{ color: COLORS.accent, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold tabular-nums">{fmtDurationLong(w.durationSec)}</div>
                  <div style={{ color: COLORS.muted }} className="text-xs">{totalSets} sets</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.exercises.map((ex) => {
                  const prd = prExercises.includes(ex.name);
                  return (
                    <span key={ex.name}
                      style={{ background: prd ? COLORS.gold + "1A" : COLORS.bg, borderColor: prd ? COLORS.gold + "66" : COLORS.line, color: prd ? COLORS.gold : COLORS.text }}
                      className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs">
                      {prd && <Trophy size={11} />}{ex.name}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PROGRESS
// ---------------------------------------------------------------------------
function VolumeBars({ data }) {
  const max = Math.max(...data.map((d) => d.volume), 1);
  return (
    <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-4">
      <div style={{ color: COLORS.muted }} className="mb-3 text-[11px] font-bold uppercase tracking-widest">Volume · last 7 days (lb moved)</div>
      {data.length === 0 && <div style={{ color: COLORS.muted }} className="text-sm">No volume logged this week.</div>}
      <div className="flex flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.muscle} className="flex items-center gap-3">
            <div style={{ color: COLORS.text }} className="w-28 shrink-0 truncate text-xs font-semibold">{d.muscle}</div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md" style={{ background: COLORS.bg }}>
              <div className="flex h-full items-center justify-end rounded-md pr-2 transition-all"
                style={{ width: `${(d.volume / max) * 100}%`, background: muscleColor(d.muscle) }}>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: "#0A0A0A" }}>{Math.round(d.volume).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic sparkline. invert=true means lower values are "better" (pace).
function Sparkline({ points, color, invert = false }) {
  const w = 220, h = 48, pad = 4;
  if (points.length === 0) return null;
  const vals = points.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const norm = (p.v - min) / range;
    const y = invert ? pad + norm * (h - pad * 2) : h - pad - norm * (h - pad * 2);
    return [x, y];
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${coords[coords.length - 1][0].toFixed(1)},${h} L${coords[0][0].toFixed(1)},${h} Z`;
  const last = coords[coords.length - 1];
  const gid = "grad" + color.replace("#", "") + (invert ? "i" : "");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.length > 1 && <circle cx={last[0]} cy={last[1]} r="3" fill={color} />}
    </svg>
  );
}

function Progress({ history }) {
  const volume = weeklyVolumeByMuscle(history);
  const mileage = weeklyMileage(history);
  const trends = exerciseTrends(history).sort((a, b) => b.points.length - a.points.length);
  const runs = runTrends(history);
  const runPR = computeRunPR(history);

  return (
    <div>
      <SectionTitle right={
        <span style={{ color: COLORS.run }} className="text-xs font-bold tabular-nums">{mileage.toFixed(1)} mi this wk</span>
      }>Weekly Volume</SectionTitle>
      <VolumeBars data={volume} />

      <SectionTitle>Running Pace</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {runs.map((r) => {
          const pts = r.points.map((p) => ({ ...p, v: p.pace }));
          const first = r.points[0].pace, latest = r.points[r.points.length - 1].pace;
          const delta = latest - first; // negative = faster = good
          const bestP = r.points.reduce((m, p) => (p.pace < m.pace ? p : m), r.points[0]);
          return (
            <div key={r.planId} style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <RunIcon size={13} color={COLORS.run} />
                    <span style={{ color: COLORS.text }} className="truncate text-sm font-semibold">{r.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                    <Trophy size={11} color={COLORS.run} />
                    <span style={{ color: COLORS.run }} className="font-bold tabular-nums">{bestP.paceLabel}/mi best</span>
                  </div>
                </div>
                {delta !== 0 && (
                  <span style={{ color: delta < 0 ? COLORS.green : COLORS.muted }} className="text-xs font-bold tabular-nums">
                    {delta < 0 ? "▼" : "▲"} {Math.abs(Math.round(delta))}s/mi
                  </span>
                )}
              </div>
              <div className="mt-2"><Sparkline points={pts} color={COLORS.run} invert /></div>
              <div className="mt-1 flex justify-between text-[10px]" style={{ color: COLORS.muted }}>
                <span>{fmtDateShort(r.points[0].date)}</span>
                <span style={{ color: COLORS.muted }}>faster ▼</span>
                <span>{fmtDateShort(r.points[r.points.length - 1].date)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle>Strength Trends</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trends.map((t) => {
          const pts = t.points.map((p) => ({ ...p, v: p.weight }));
          const pr = t.points.reduce((m, p) => (p.weight > m.weight ? p : m), t.points[0]);
          const delta = t.points[t.points.length - 1].weight - t.points[0].weight;
          const c = muscleColor(t.muscle);
          return (
            <div key={t.name} style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div style={{ color: COLORS.text }} className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                    <Trophy size={11} />
                    <span style={{ color: COLORS.gold }} className="font-bold tabular-nums">{pr.weight} lb PR</span>
                    <span style={{ color: COLORS.muted }}>· {pr.reps} reps</span>
                  </div>
                </div>
                {delta !== 0 && (
                  <span style={{ color: delta > 0 ? COLORS.green : COLORS.muted }} className="text-xs font-bold tabular-nums">
                    {delta > 0 ? "+" : ""}{delta} lb
                  </span>
                )}
              </div>
              <div className="mt-2"><Sparkline points={pts} color={c} /></div>
              <div className="mt-1 flex justify-between text-[10px]" style={{ color: COLORS.muted }}>
                <span>{fmtDateShort(t.points[0].date)}</span>
                <span>{fmtDateShort(t.points[t.points.length - 1].date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NUTRITION (FUEL) SCREEN
// ---------------------------------------------------------------------------
function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen((v) => !v)}
      style={{ background: COLORS.cardAlt, borderColor: COLORS.line }}
      className="w-full rounded-lg border p-3 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div style={{ color: COLORS.muted }} className="text-[10px] font-bold uppercase tracking-widest">{meal.slot}</div>
          <div style={{ color: COLORS.text }} className="font-semibold leading-tight">{meal.name}</div>
        </div>
        <div className="shrink-0 text-right">
          <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-xl font-bold leading-none tabular-nums">{meal.cal}<span className="text-xs"> cal</span></div>
          <div style={{ color: COLORS.accent }} className="text-xs font-bold tabular-nums">{meal.protein}g protein</div>
        </div>
      </div>
      {open && (
        <div className="mt-2">
          <p style={{ color: COLORS.muted }} className="text-xs leading-relaxed">{meal.detail}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meal.tags.map((t) => (
              <span key={t} style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.muted }}
                className="rounded-full border px-2 py-0.5 text-[10px]">{t}</span>
            ))}
          </div>
          {meal.alt && (
            <div style={{ background: COLORS.bg, borderColor: COLORS.accent + "55" }} className="mt-3 rounded-lg border p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div style={{ color: COLORS.accent }} className="text-xs font-bold uppercase tracking-wider">Swap option</div>
                <div style={{ color: COLORS.muted }} className="shrink-0 text-[11px] font-bold tabular-nums">{meal.alt.cal} cal · {meal.alt.protein}g</div>
              </div>
              <div style={{ color: COLORS.text }} className="mt-0.5 text-sm font-semibold">{meal.alt.name}</div>
              <p style={{ color: COLORS.muted }} className="mt-1 text-xs leading-relaxed">{meal.alt.detail}</p>
            </div>
          )}
        </div>
      )}
      <div style={{ color: COLORS.muted }} className="mt-1 text-[10px] uppercase tracking-wider">{open ? "tap to hide" : "tap for how-to"}</div>
    </button>
  );
}

function TemplateBlock({ tpl }) {
  const totals = tpl.meals.reduce((a, m) => ({ cal: a.cal + m.cal, protein: a.protein + m.protein }), { cal: 0, protein: 0 });
  return (
    <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
      <div className="mb-1 flex items-center gap-2">
        <span style={{ background: tpl.accent }} className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold"
          ><span style={{ color: "#0A0A0A", fontFamily: "'Barlow Condensed', sans-serif" }}>{tpl.id}</span></span>
        <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase leading-none">{tpl.label}</div>
      </div>
      <p style={{ color: COLORS.muted }} className="mb-3 text-xs">{tpl.blurb}</p>
      <div className="flex flex-col gap-2">
        {tpl.meals.map((m, i) => <MealCard key={i} meal={m} />)}
      </div>
      <div style={{ background: COLORS.bg, borderColor: COLORS.line }}
        className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2">
        <span style={{ color: COLORS.muted }} className="text-[11px] font-bold uppercase tracking-widest">Day Total</span>
        <span style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold tabular-nums">
          {totals.cal} cal · <span style={{ color: tpl.accent }}>{totals.protein}g</span>
        </span>
      </div>
    </div>
  );
}

function WaterTracker() {
  const w = NUTRITION.water;
  const [filled, setFilled] = useState(0); // number of bottles drunk

  useEffect(() => {
    fetchTodayWater().then(setFilled);
  }, []);

  const tapBottle = (i, active) => {
    const next = active ? i : i + 1;
    setFilled(next);
    upsertTodayWater(next);
  };

  const oz = filled * w.bottleOz;
  const pct = Math.min(100, Math.round((oz / w.totalOz) * 100));
  const done = filled >= w.bottles;
  return (
    <div style={{ background: COLORS.card, borderColor: done ? COLORS.accent : COLORS.line }} className="rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase leading-none">Water</div>
          <div style={{ color: COLORS.muted }} className="mt-1 text-xs">{w.bottles} × {w.label} · {w.totalOz}oz/day</div>
        </div>
        <div className="text-right">
          <div style={{ color: done ? COLORS.accent : COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl font-extrabold leading-none tabular-nums">{oz}<span className="text-sm">oz</span></div>
          <div style={{ color: COLORS.muted }} className="text-[11px]">{pct}% of goal</div>
        </div>
      </div>

      {/* Bottle toggles */}
      <div className="mt-3 flex gap-2">
        {Array.from({ length: w.bottles }).map((_, i) => {
          const active = i < filled;
          return (
            <button key={i} onClick={() => tapBottle(i, active)}
              aria-label={`Bottle ${i + 1}`}
              style={{ background: active ? COLORS.accent : COLORS.bg, borderColor: active ? COLORS.accent : COLORS.line }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-3 transition active:scale-[0.97]">
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M5 1h6v2l1 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5l1-2V1Z"
                  stroke={active ? "#0A0A0A" : COLORS.muted} strokeWidth="1.5" fill="none" />
                <path d="M4 11h8" stroke={active ? "#0A0A0A" : COLORS.muted} strokeWidth="1.5" />
              </svg>
              <span style={{ color: active ? "#0A0A0A" : COLORS.muted, fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-sm font-bold tabular-nums">{w.bottleOz}oz</span>
            </button>
          );
        })}
      </div>
      <div style={{ color: COLORS.muted }} className="mt-2 text-center text-[11px]">
        {done ? "Hydration locked in for the day 💧" : `Tap a bottle each time you finish one · ${w.bottles - filled} to go`}
      </div>
    </div>
  );
}

function Nutrition() {
  const n = NUTRITION;
  const [showGrocery, setShowGrocery] = useState(false);
  return (
    <div>
      {/* Targets */}
      <div className="flex gap-3">
        <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="flex-1 rounded-xl border p-4">
          <div style={{ color: COLORS.accent, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl font-extrabold leading-none tabular-nums">{n.calTarget}</div>
          <div style={{ color: COLORS.muted }} className="mt-1 text-[11px] font-semibold uppercase tracking-widest">Cal / Day</div>
          <div style={{ color: COLORS.muted }} className="mt-0.5 text-[11px]">slow recomp target</div>
        </div>
        <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="flex-1 rounded-xl border p-4">
          <div style={{ color: COLORS.accent, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl font-extrabold leading-none tabular-nums">{n.proteinTarget}<span className="text-lg">g</span></div>
          <div style={{ color: COLORS.muted }} className="mt-1 text-[11px] font-semibold uppercase tracking-widest">Protein / Day</div>
          <div style={{ color: COLORS.muted }} className="mt-0.5 text-[11px]">~1g per lb goal weight</div>
        </div>
      </div>
      <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="mt-3 flex items-stretch gap-3 rounded-lg border p-3">
        <div style={{ background: COLORS.accent }} className="w-1 shrink-0 rounded-full" />
        <p style={{ color: COLORS.muted }} className="text-xs leading-relaxed">{n.note}</p>
      </div>

      {/* Water */}
      <SectionTitle>Hydration</SectionTitle>
      <WaterTracker />

      {/* Week map */}
      <SectionTitle>The Week</SectionTitle>
      <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
        <div className="flex flex-col gap-1.5">
          {n.week.map((d) => {
            const tpl = n.templates[d.template];
            const rest = d.trains === "Rest";
            return (
              <div key={d.day} className="flex items-center gap-3">
                <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="w-10 shrink-0 text-sm font-bold uppercase">{d.day}</div>
                <div style={{ color: COLORS.muted }} className="min-w-0 flex-1 truncate text-xs">{d.trains}</div>
                <span style={{ background: tpl.accent + "22", color: tpl.accent }}
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Plate {d.template}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekend buffer */}
      <SectionTitle>Weekend Buffer</SectionTitle>
      <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
        <div style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold uppercase leading-none">{n.weekend.title}</div>
        <p style={{ color: COLORS.muted }} className="mt-1 mb-2 text-xs leading-relaxed">{n.weekend.blurb}</p>
        <div className="flex flex-col gap-2">
          {n.weekend.points.map((p, i) => (
            <div key={i} className="flex gap-2">
              <span style={{ background: COLORS.accent }} className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              <p style={{ color: COLORS.muted }} className="text-xs leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      <SectionTitle>Lift-Day Meals</SectionTitle>
      <TemplateBlock tpl={n.templates.A} />
      <SectionTitle>Run-Day Meals</SectionTitle>
      <TemplateBlock tpl={n.templates.B} />

      {/* Grocery */}
      <SectionTitle right={
        <button onClick={() => setShowGrocery((v) => !v)} style={{ color: COLORS.accent }} className="text-xs font-bold uppercase tracking-wider">
          {showGrocery ? "Hide" : "Show"}
        </button>
      }>Grocery List</SectionTitle>
      {showGrocery && (
        <div style={{ background: COLORS.card, borderColor: COLORS.line }} className="rounded-xl border p-3">
          <p style={{ color: COLORS.muted }} className="mb-3 text-xs leading-relaxed">
            Built off the staples you already share with your wife's plan — buy the proteins in family packs and batch-cook to keep cost down. Fish is fine; nothing here uses shellfish.
          </p>
          <div className="flex flex-col gap-3">
            {n.grocery.map((g) => (
              <div key={g.group}>
                <div style={{ color: COLORS.accent }} className="mb-1 text-[11px] font-bold uppercase tracking-widest">{g.group}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <span key={it} style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
                      className="rounded-full border px-2.5 py-1 text-xs">{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NAV + SHELL
// ---------------------------------------------------------------------------
const NAV = [
  { id: "dashboard", label: "Home", icon: (a) => <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" fill={a} /> },
  { id: "workout", label: "Train", icon: (a) => <path d="M6.5 6.5 4 9l2 2m11.5-4.5L20 9l-2 2M8 12h8m-9-3 9 9m-9-9-1 1m10-1 1 1" stroke={a} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
  { id: "fuel", label: "Fuel", icon: (a) => <path d="M7 3v7a3 3 0 0 0 3 3v8m-6-18v5m3-5v5M17 3c-1.5 0-3 2-3 6 0 2 1 3 3 3v9" stroke={a} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
  { id: "history", label: "History", icon: (a) => <><circle cx="12" cy="12" r="8" stroke={a} strokeWidth="2" fill="none" /><path d="M12 8v4l3 2" stroke={a} strokeWidth="2" strokeLinecap="round" fill="none" /></> },
  { id: "progress", label: "Progress", icon: (a) => <path d="M4 20V10m5 10V4m5 16v-7m5 7V8" stroke={a} strokeWidth="2" strokeLinecap="round" fill="none" /> },
];

export default function App() {
  useAthleticFonts();
  const [tab, setTab] = useState("dashboard");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("day1");

  const quote = quoteOfDay();

  const loadHistory = async () => setHistory(await fetchWorkouts());

  useEffect(() => {
    (async () => {
      await loadHistory();
      setHistoryLoading(false);
    })();
  }, []);

  const launch = (planId) => { setActivePlan(planId); setTab("workout"); };
  const finish = async (record) => {
    const hasContent = record.type === "run" ? record.run.distance > 0 : record.exercises.length > 0;
    if (hasContent) {
      await insertWorkout(record);
      await loadHistory();
    }
    setTab("history");
  };
  const discard = () => setTab("dashboard");

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Barlow', sans-serif" }}>
      <div className="mx-auto max-w-md px-4 pb-24 pt-5">
        <header className="mb-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div style={{ background: COLORS.accent }} className="h-6 w-1.5 rounded-full" />
              <h1 style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-3xl font-extrabold uppercase leading-none tracking-tight">
                Recomp<span style={{ color: COLORS.accent }}>Lab</span>
              </h1>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              style={{ color: COLORS.muted, borderColor: COLORS.line }}
              className="rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-widest transition active:scale-95">
              Log Out
            </button>
          </div>
          <div style={{ background: COLORS.card, borderColor: COLORS.line }}
            className="mt-3 flex items-center justify-between rounded-lg border px-3 py-2">
            <div style={{ color: COLORS.muted }} className="text-[11px] font-semibold uppercase tracking-widest">Goal · Flat + Defined</div>
            <div style={{ color: COLORS.accent }} className="text-[11px] font-bold uppercase tracking-widest">By Dec 31, 2026</div>
          </div>
          <div style={{ background: COLORS.card, borderColor: COLORS.line }}
            className="mt-3 flex items-stretch gap-3 rounded-lg border p-3">
            <div style={{ background: COLORS.accent }} className="w-1 shrink-0 rounded-full" />
            <div className="min-w-0">
              <div style={{ color: COLORS.muted }} className="text-[10px] font-bold uppercase tracking-widest">Daily Fuel</div>
              <p style={{ color: COLORS.text }} className="mt-0.5 text-sm font-medium leading-snug">“{quote.text}”</p>
              <div style={{ color: COLORS.accent }} className="mt-1 text-[11px] font-semibold uppercase tracking-wider">— {quote.by}</div>
            </div>
          </div>
        </header>

        {historyLoading ? (
          <div style={{ color: COLORS.muted }} className="mt-10 text-center text-sm">Loading…</div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard history={history} onLaunch={launch} />}
            {tab === "workout" && <Session planId={activePlan} history={history} onFinish={finish} onDiscard={discard} />}
            {tab === "fuel" && <Nutrition />}
            {tab === "history" && <History history={history} />}
            {tab === "progress" && <Progress history={history} />}
          </>
        )}
      </div>

      <nav style={{ background: COLORS.cardAlt, borderColor: COLORS.line }} className="fixed inset-x-0 bottom-0 z-20 border-t">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV.map((n) => {
            const active = tab === n.id;
            const a = active ? COLORS.accent : COLORS.muted;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-1 flex-col items-center gap-1 py-2.5 transition active:scale-95">
                <svg width="22" height="22" viewBox="0 0 24 24">{n.icon(a)}</svg>
                <span style={{ color: a, fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[11px] font-bold uppercase tracking-wider">{n.label}</span>
                {active && <div style={{ background: COLORS.accent }} className="h-0.5 w-6 rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
