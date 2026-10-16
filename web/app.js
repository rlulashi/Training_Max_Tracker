const PERCENTAGES = [
  40, 45, 50, 55, 60, 65, 70, 72.5, 75, 77.5, 80, 82.5, 85, 87.5, 90, 92.5, 95,
  97.5, 100, 101, 103, 105, 107.5, 110, 112.5, 115, 117.5, 120,
];

const DEFAULT_ATHLETE_ID = "default-athlete";
const FIVE_POUNDS = 5;
const PLATE_UNIT = 1.25;
const KG_PLATE_UNIT = 0.25;
const KG_TO_LB = 1 / 0.45359237;
const COMPETITION_KG_STEP = 2.5;
const COMPETITION_KG_MIN = 25;
const COMPETITION_KG_MAX = 472.5;

const BAR_TYPES = [
  { id: "olympic", name: "Olympic bar", weight: 45 },
  { id: "womens", name: "Women's Olympic bar", weight: 35 },
  { id: "safety-squat", name: "Safety squat bar", weight: 65 },
  { id: "cambered", name: "Cambered bar", weight: 55 },
  { id: "squat", name: "Squat bar", weight: 55 },
  { id: "monster-squat", name: "Monster squat bar", weight: 65 },
  { id: "american-cambered", name: "American cambered bar", weight: 35 },
  { id: "bench", name: "Bench bar", weight: 55 },
  { id: "log-10-60", name: "10 inch log", weight: 60, maxPlate: 25 },
  { id: "log-10-65", name: "10 inch log", weight: 65, maxPlate: 25 },
  { id: "log-12", name: "12 inch log", weight: 90, maxPlate: 25 },
  { id: "trap", name: "Trap/Hex bar", weight: 60 },
  { id: "swiss", name: "Swiss/football bar", weight: 45 },
  { id: "axle", name: "Axle bar", weight: 25 },
  { id: "technique", name: "Technique bar", weight: 15 },
  { id: "custom", name: "Custom bar", weight: 45 },
];

const PLATE_SETS = {
  standard: { unit: "lb", plates: [100, 45, 25, 10, 5, 2.5] },
  calibrated: { unit: "lb", plates: [100, 55, 45, 35, 25, 10, 5, 2.5] },
  calibratedKg: { unit: "kg", plates: [50, 25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] },
};

const PLATE_COLORS = {
  100: "silver",
  55: "red",
  45: "blue",
  35: "yellow",
  25: "green",
  10: "white",
  5: "black",
  2.5: "silver",
};

const KG_PLATE_COLORS = {
  50: "black",
  25: "red",
  20: "blue",
  15: "yellow",
  10: "green",
  5: "white",
  2.5: "black",
  1.25: "silver",
  0.5: "silver",
  0.25: "silver",
};

let editingExerciseId = null;
let editingWorkout = null;
let disclosureExerciseId = null;
const LiftCatalog = window.LiftCatalog;

const state = {
  view: "athlete",
  athletes: [],
  selectedAthleteId: DEFAULT_ATHLETE_ID,
  selectedId: null,
  darkMode: false,
  repDrafts: {},
  volumePeriod: "day",
  bestRepsMode: "weight",
  deadliftStyle: "conventional",
  activeLiftGroup: "squat",
  openLiftGroups: {},
  units: {max:"lb",table:"lb",workout:"lb",volume:"lb",loader:"lb"},
};

const form = document.querySelector("#exerciseForm");
const athleteViewButton = document.querySelector("#athleteViewButton");
const coachViewButton = document.querySelector("#coachViewButton");
const darkModeButton = document.querySelector("#darkModeButton");
const coachPanel = document.querySelector("#coachPanel");
const athleteForm = document.querySelector("#athleteForm");
const athleteName = document.querySelector("#athleteName");
const athleteList = document.querySelector("#athleteList");
const exerciseName = document.querySelector("#exerciseName");
const oneRepMax = document.querySelector("#oneRepMax");
const trainingMaxPercent = document.querySelector("#trainingMaxPercent");
const exerciseList = document.querySelector("#exerciseList");
const exerciseListTitle = document.querySelector("#exerciseListTitle");
const emptyState = document.querySelector("#emptyState");
const detailPanel = document.querySelector("#detailPanel");
const selectedName = document.querySelector("#selectedName");
const selectedTitle = document.querySelector("#selectedTitle");
const selectedOneRepMax = document.querySelector("#selectedOneRepMax");
const baseTrainingMaxLabel = document.querySelector("#baseTrainingMaxLabel");
const baseTrainingMax = document.querySelector("#baseTrainingMax");
const currentTrainingMax = document.querySelector("#currentTrainingMax");
const earnedIncreases = document.querySelector("#earnedIncreases");
const oneRepOnlyForm = document.querySelector("#oneRepOnlyForm");
const recordOneRepMax = document.querySelector("#recordOneRepMax");
const manualTmForm = document.querySelector("#manualTmForm");
const manualTmAmount = document.querySelector("#manualTmAmount");
const autoIncreaseNotice = document.querySelector("#autoIncreaseNotice");
const progressTrainingMax = document.querySelector("#progressTrainingMax");
const percentageRows = document.querySelector("#percentageRows");
const rowTemplate = document.querySelector("#rowTemplate");
const clearData = document.querySelector("#clearData");
const editExercise = document.querySelector("#editExercise");
const deleteExercise = document.querySelector("#deleteExercise");
const loaderForm = document.querySelector("#loaderForm");
const barType = document.querySelector("#barType");
const customBarLabel = document.querySelector("#customBarLabel");
const customBarWeight = document.querySelector("#customBarWeight");
const loadMode = document.querySelector("#loadMode");
const loadValueLabel = document.querySelector("#loadValueLabel");
const loadValue = document.querySelector("#loadValue");
const loadPercentLabel = document.querySelector("#loadPercentLabel");
const loadPercent = document.querySelector("#loadPercent");
const plateSet = document.querySelector("#plateSet");
const useHundredPlates = document.querySelector("#useHundredPlates");
const useFiftyKgPlates = document.querySelector("#useFiftyKgPlates");
const useCollars = document.querySelector("#useCollars");
const loadSummary = document.querySelector("#loadSummary");
const barLabel = document.querySelector("#barLabel");
const leftPlates = document.querySelector("#leftPlates");
const rightPlates = document.querySelector("#rightPlates");
const plateBreakdown = document.querySelector("#plateBreakdown");
const converterForm = document.querySelector("#converterForm");
const conversionValue = document.querySelector("#conversionValue");
const conversionDirection = document.querySelector("#conversionDirection");
const conversionResult = document.querySelector("#conversionResult");
const workoutForm = document.querySelector("#workoutForm");
const workoutDate = document.querySelector("#workoutDate");
const workoutWeight = document.querySelector("#workoutWeight");
const workoutPercent = document.querySelector("#workoutPercent");
const workoutResistance = document.querySelector("#workoutResistance");
const workoutChainWeight = document.querySelector("#workoutChainWeight");
const workoutChainBasis = document.querySelector("#workoutChainBasis");
const workoutSets = document.querySelector("#workoutSets");
const workoutReps = document.querySelector("#workoutReps");
const workoutHistory = document.querySelector("#workoutHistory");
const workoutCount = document.querySelector("#workoutCount");
const volumeChart = document.querySelector("#volumeChart");
const volumeButtons = document.querySelectorAll(".period-toggle button");

function snapshotState() {
  return JSON.parse(JSON.stringify({
    ...state.persistedExtras,
    view: state.view, athletes: state.athletes,
    selectedAthleteId: state.selectedAthleteId, selectedId: state.selectedId,
    darkMode: state.darkMode, volumePeriod: state.volumePeriod, bestRepsMode: state.bestRepsMode, deadliftStyle: state.deadliftStyle, activeLiftGroup: state.activeLiftGroup, units: state.units,
  }));
}

function applyStoredState(parsed) {
  state.persistedExtras = {...parsed};
  for (const section of Object.keys(state.units)) {
    setSectionUnit(section,parsed.units?.[section] === "kg" ? "kg" : "lb",false);
  }
  const selectedBarId=barType.value;
  populateBarOptions();barType.value=selectedBarId;updateBarControls();updateLoaderMode();
  state.view = parsed.view === "coach" ? "coach" : "athlete";
  state.darkMode = Boolean(parsed.darkMode);
  state.bestRepsMode = parsed.bestRepsMode === "ar" ? "ar" : "weight";
  state.deadliftStyle = parsed.deadliftStyle === "sumo" ? "sumo" : "conventional";
  state.volumePeriod = ["day", "week", "month", "year"].includes(parsed.volumePeriod) ? parsed.volumePeriod : "day";
  state.athletes = parsed.athletes;
  state.athletes.forEach(normalizeAthlete);
  state.selectedAthleteId = parsed.selectedAthleteId ?? state.athletes[0].id;
  if (!state.athletes.some(a => a.id === state.selectedAthleteId)) state.selectedAthleteId = state.athletes[0].id;
  state.selectedId = Object.hasOwn(parsed,"selectedId") ? parsed.selectedId : currentExercises()[0]?.id ?? null;
  if (state.selectedId !== null && !currentExercises().some(e => e.id === state.selectedId)) state.selectedId = currentExercises()[0]?.id ?? null;
  const selectedLift = selectedExercise() ? LiftCatalog.describe(selectedExercise()) : null;
  state.activeLiftGroup = selectedLift?.key ?? parsed.activeLiftGroup ?? "squat";
  if (selectedLift?.key === "deadlift" && selectedLift.style) state.deadliftStyle = selectedLift.style;
  render();
}

function saveState() {
  window.TrainingStore.save();
}

function createAthlete(name, id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`, exercises = []) {
  return { id, name, exercises };
}

function normalizeAthlete(athlete) {
  athlete.id = athlete.id ?? (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  athlete.name = athlete.name || "Unnamed athlete";
  athlete.exercises = Array.isArray(athlete.exercises) ? athlete.exercises : [];
  athlete.exercises.forEach((exercise) => {
    exercise.increases = Number(exercise.increases ?? 0);
    exercise.trainingMaxPercent = Number(exercise.trainingMaxPercent ?? 85);
    exercise.trainingMaxBase = Number(
      exercise.trainingMaxBase ?? roundToNearestFive(exercise.oneRepMax * (exercise.trainingMaxPercent / 100)),
    );
    exercise.manualTrainingMaxAdjustment = Number(exercise.manualTrainingMaxAdjustment ?? 0);
    exercise.reps = exercise.reps ?? {};
    exercise.arReps = exercise.arReps ?? {};
    exercise.arRecords = exercise.arRecords ?? {};
    exercise.records = exercise.records ?? {};
    Object.values(exercise.records).forEach((records) => {
      records.forEach((record) => {
        record.attempts = Array.isArray(record.attempts)
          ? record.attempts
          : [
              {
                weight: Number(record.weight ?? 0),
                reps: Number(record.reps ?? 0),
                savedAt: record.savedAt ?? new Date().toISOString(),
              },
            ];
      });
    });
    exercise.workouts = Array.isArray(exercise.workouts) ? exercise.workouts : [];
    exercise.setSessions = Array.isArray(exercise.setSessions) ? exercise.setSessions : [];
    exercise.increaseAwards = exercise.increaseAwards ?? {};
  });
}

function currentAthlete() {
  return state.athletes.find((athlete) => athlete.id === state.selectedAthleteId) ?? state.athletes[0] ?? null;
}

function currentExercises() {
  return currentAthlete()?.exercises ?? [];
}

function selectedExercise() {
  return currentExercises().find((exercise) => exercise.id === state.selectedId) ?? null;
}

function draftKey(exerciseId, percent) {
  return `${exerciseId}:${state.bestRepsMode ?? "weight"}:${percent}`;
}

function formatWeight(value) {
  return `${Number(value.toFixed(2)).toLocaleString()} lb`;
}

const weightInputCache = new WeakMap();
const sectionInputs = {max:["oneRepMax"],table:["recordOneRepMax","manualTmAmount"],workout:["workoutWeight","workoutChainWeight","workoutBandWeight"],volume:[],loader:["loadValue","customBarWeight"]};
function sectionUnit(section) { return state.units?.[section] === "kg" ? "kg" : "lb"; }
function displayNumber(pounds, section) { return sectionUnit(section) === "kg" ? pounds / KG_TO_LB : pounds; }
function displayWeight(pounds, section = "table") {
  return `${displayNumber(Number(pounds),section).toLocaleString(undefined,{maximumFractionDigits:3})} ${sectionUnit(section)}`;
}
function formatWorkoutWeight(pounds) { return displayWeight(pounds,"workout"); }
function formatLoaderWeight(pounds) { return displayWeight(pounds,"loader"); }
function formatVolumeValue(pounds) { return displayNumber(pounds,"volume").toLocaleString(undefined,{maximumFractionDigits:3}); }
function readWeightInput(input, section) {
  const saved = weightInputCache.get(input);
  if (saved && saved.text === input.value && saved.unit === sectionUnit(section)) return saved.pounds;
  const value = Number.parseFloat(input.value);
  return sectionUnit(section) === "kg" ? value * KG_TO_LB : value;
}
function writeWeightInput(input, pounds, section) {
  const text = Number.isFinite(pounds) ? String(Number(displayNumber(pounds,section).toFixed(6))) : "";
  input.value = text;
  weightInputCache.set(input,{text,pounds,unit:sectionUnit(section)});
}
function syncUnitControls() {
  for (const [section,id] of Object.entries({max:"unitMax",table:"unitTable",workout:"unitWorkout",volume:"unitVolume",loader:"unitLoader"})) {
    document.querySelector(`#${id}`).value=sectionUnit(section);
  }
  for (const [id,label,section] of [["oneRepMaxLabel","Current 1RM","max"],["recordOneRepMaxLabel","Update 1RM only","table"],["manualTmAmountLabel","TM adjustment","table"],["workoutWeightLabel","Weight","workout"],["workoutChainWeightLabel","Chain weight","workout"],["workoutBandWeightLabel","Tension / assistance","workout"],["customBarWeightLabel","Custom bar","loader"]]) {
    document.querySelector(`#${id}`).textContent=`${label} (${sectionUnit(section)})`;
  }
  updateLoaderMode();
}
function setSectionUnit(section, nextUnit, persist = true) {
  const next = nextUnit === "kg" ? "kg" : "lb";
  if (next !== sectionUnit(section)) {
    const values = sectionInputs[section].map(id=>{const input=document.querySelector(`#${id}`);return {input,pounds:readWeightInput(input,section)};});
    state.units[section]=next;
    for (const {input,pounds} of values) writeWeightInput(input,pounds,section);
  }
  syncUnitControls();
  if (!persist) return;
  const exercise=selectedExercise();
  if (section === "table" && exercise) {renderMetrics(exercise,true);renderRows(exercise);renderExerciseList();}
  if (section === "workout") {updateChainControls();if(exercise)renderWorkoutHistory(exercise);}
  if (section === "volume" && exercise) renderVolumeChart(exercise);
  if (section === "loader") {
    const selected=barType.value;populateBarOptions();barType.value=selected;updateBarControls();updateLoaderMode();calculateLoad();
  }
  saveState();
}

function poundsToKg(value) {
  return value / KG_TO_LB;
}

function kgToChartPounds(value) {
  return Number((value * KG_TO_LB).toFixed(1));
}

function roundToKgStep(value) {
  return mround(value, COMPETITION_KG_STEP);
}

function roundToCompetitionKg(value) {
  return Math.min(COMPETITION_KG_MAX, Math.max(COMPETITION_KG_MIN, roundToKgStep(value)));
}

function formatKg(value) {
  return `${Number(value.toFixed(2)).toLocaleString()} kg`;
}

function formatChartWeight(value) {
  return `${kgToChartPounds(value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} lb`;
}

function formatLoadWeight(value, unit) {
  return unit === "kg" ? `${formatKg(value)} (${formatChartWeight(value)})` : formatLoaderWeight(value);
}

function formatPlateWeight(value, unit) {
  return unit === "kg" ? `${Number(value.toFixed(2)).toLocaleString()} kg` : formatWeight(value);
}

function formatSignedWeight(value) {
  return `${value >= 0 ? "+" : ""}${displayWeight(value,"table")}`;
}

function mround(value, multiple) {
  if (multiple === 0) return 0;
  return Math.round((value + Number.EPSILON) / multiple) * multiple;
}

function roundToNearestFive(value) {
  return mround(value, 5);
}

function roundUpToPlateUnit(value) {
  return Math.ceil(value / PLATE_UNIT) * PLATE_UNIT;
}

function roundUpToUnit(value, unit) {
  return Math.ceil(value / unit) * unit;
}

function formatPercent(percent) {
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

function dateKey(value) {
  return String(value ?? todayDateValue()).slice(0, 10);
}

function weekKey(value) {
  const date = new Date(`${dateKey(value)}T12:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function groupWorkoutDate(value, period) {
  const key = dateKey(value);
  if (period === "week") return weekKey(key);
  if (period === "month") return key.slice(0, 7);
  if (period === "year") return key.slice(0, 4);
  return key;
}

function formatVolumePeriodLabel(key, period) {
  if (period === "week") return `Week of ${formatDate(key)}`;
  if (period === "month") {
    const date = new Date(`${key}-01T12:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date);
  }
  if (period === "year") return key;
  return formatDate(key);
}

function chainTotal(workout) {
  const resistance = workout.accommodatingResistance;
  return resistance?.type === "chains"
    ? Number(resistance.weight) * (resistance.basis === "per-side" ? 2 : 1) : 0;
}

function chainDescription(workout) {
  const resistance = workout.accommodatingResistance;
  if (resistance?.type !== "chains") return "";
  return `Chains ${formatWorkoutWeight(resistance.weight)} ${resistance.basis === "per-side" ? "per side" : "both sides total"} (${formatWorkoutWeight(chainTotal(workout))} added)`;
}

const BAND_NAMES = { "micro-mini": "Micro mini", mini: "Red mini", "monster-mini": "Monster mini", light: "Light", average: "Average", strong: "Strong", custom: "Custom / other" };
const BAND_SETUPS = { single: "Single looped", doubled: "Doubled", quadded: "Quadded", choked: "Choked / anchored squat", other: "Other setup" };
const BAND_DIRECTIONS = { down: "Down", forward: "Forward", reverse: "Reverse" };
function bandTotal(workout) {
  const resistance = workout.accommodatingResistance;
  if (resistance?.type !== "bands") return 0;
  return Number(resistance.weight) * (resistance.basis === "per-side" ? 2 : 1) * (resistance.direction === "reverse" ? -1 : 1);
}

function resistanceDescription(workout) {
  const r = workout.accommodatingResistance;
  if (r?.type !== "bands") return chainDescription(workout);
  return `Bands: ${BAND_NAMES[r.band]}, ${BAND_SETUPS[r.setup] ?? "Other setup"}, ${BAND_DIRECTIONS[r.direction]}; ${formatWorkoutWeight(r.weight)} ${r.basis === "per-side" ? "per side" : "both sides total"}; ${formatWorkoutWeight(Math.abs(bandTotal(workout)))} ${r.direction === "reverse" ? "assistance subtracted" : "added"}${r.notes ? `; ${r.notes}` : ""}`;
}

function workoutVolume(workout) {
  return workoutVolumeParts(workout).volume;
}

function workoutVolumeParts(workout) {
  const repetitions = Number(workout.sets ?? 0) * Number(workout.reps ?? 0);
  const baseVolume = Number(workout.weight ?? 0) * repetitions;
  const arVolume = (chainTotal(workout) + bandTotal(workout)) * repetitions;
  return { baseVolume, arAdded: Math.max(0, arVolume), arAssistance: Math.max(0, -arVolume), volume: baseVolume + arVolume };
}

function updateBandControls() {
  const active = workoutResistance.value === "bands";
  document.querySelector("#bandFields").hidden = !active;
  for (const id of ["workoutBand", "workoutBandSetup", "workoutBandDirection", "workoutBandWeight", "workoutBandBasis", "workoutBandNotes"]) {
    document.querySelector(`#${id}`).disabled = !active;
  }
  const input = document.querySelector("#workoutBandWeight");
  input.readOnly = false;
  input.required = active;
  input.placeholder = "Enter tension";
  const tension = readWeightInput(input,"workout");
  document.querySelector("#bandTensionStatus").textContent = !active ? "" : Number.isFinite(tension)
    ? `Entered: ${formatWorkoutWeight(tension)}` : "Enter your band tension or assistance.";
  const total = tension * (document.querySelector("#workoutBandBasis").value === "per-side" ? 2 : 1);
  const reverse = document.querySelector("#workoutBandDirection").value === "reverse";
  const bar = readWeightInput(workoutWeight,"workout");
  const load = bar + (reverse ? -total : total);
  document.querySelector("#bandSummary").textContent = !active ? "" : Number.isFinite(total) && total >= 0
    ? `${formatWorkoutWeight(total)} total ${reverse ? "assistance subtracted" : "resistance added"}${Number.isFinite(bar) ? `; ${formatWorkoutWeight(load)} logged load per rep` : ""}. ${load < 0 ? "Assistance cannot exceed bar weight. " : ""}Percentage uses bar weight only.`
    : "Volume uses your manually entered tension. Percentage uses bar weight only.";
}

function updateChainControls() {
  const active = workoutResistance.value === "chains";
  document.querySelector("#chainFields").hidden = !active;
  workoutChainWeight.disabled = !active;
  workoutChainWeight.required = active;
  workoutChainBasis.disabled = !active;
  const weight = readWeightInput(workoutChainWeight,"workout");
  const total = weight * (workoutChainBasis.value === "per-side" ? 2 : 1);
  const barWeight = readWeightInput(workoutWeight,"workout");
  document.querySelector("#chainSummary").textContent = !active ? "" :
    Number.isFinite(total) && total > 0
      ? `${formatWorkoutWeight(total)} total chains added${Number.isFinite(barWeight) ? `; ${formatWorkoutWeight(barWeight + total)} logged load per rep` : ""}. Volume includes bar weight plus chains. Percentage uses bar weight only.`
      : "Enter the added chain weight. Volume includes bar weight plus chains. Percentage uses bar weight only.";
  updateBandControls();
}

function workoutPercentFromWeight(exercise, weight) {
  const max = currentMax(exercise);
  if (!max || weight <= 0) return "";
  return Number(((weight / max) * 100).toFixed(1));
}

function workoutWeightFromPercent(exercise, percent) {
  if (!exercise || percent <= 0) return "";
  return percentageWeight(exercise, percent);
}

function parseSetReps(value) {
  return String(value)
    .split(/[,\s]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function setSessionVolume(session) {
  const totalReps = (session.repsBySet ?? []).reduce((sum, reps) => sum + Number(reps ?? 0), 0);
  return Number(session.weight ?? 0) * totalReps;
}

function setSessionLabel(session) {
  const reps = (session.repsBySet ?? []).join(", ");
  return `${formatDate(session.date)} - ${formatWeight(Number(session.weight))}: ${reps}`;
}

function baseMax(exercise) {
  return Number(exercise.trainingMaxBase ?? roundToNearestFive(exercise.oneRepMax * (exercise.trainingMaxPercent / 100)));
}

function currentMax(exercise) {
  return baseMax(exercise) + exercise.increases * FIVE_POUNDS + Number(exercise.manualTrainingMaxAdjustment ?? 0);
}

function createExercise(name, max, tmPercent) {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    oneRepMax: max,
    trainingMaxPercent: tmPercent,
    trainingMaxBase: roundToNearestFive(max * (tmPercent / 100)),
    manualTrainingMaxAdjustment: 0,
    increases: 0,
    reps: {},
    records: {},
    workouts: [],
    setSessions: [],
    increaseAwards: {},
  };
}

function percentageWeight(exercise, percent) {
  return roundToNearestFive(currentMax(exercise) * (percent / 100));
}

function estimatedMax(weight, reps) {
  if (reps <= 0 || reps >= 37) return null;
  return (36 * weight) / (37 - reps);
}

function hasTrainingMaxAward(exercise) {
  return Object.values(exercise.records ?? {}).some((records) =>
    records.some((record) => Number(record.awardedForReps ?? 0) > 0),
  );
}

function findPendingProgressRecord(exercise) {
  const pending = [];

  Object.entries(exercise.records ?? {}).forEach(([percent, records]) => {
    const numericPercent = Number(percent);
    if (numericPercent < 85) return;

    records.forEach((record) => {
      const eligibleForReps = Number(record.eligibleForReps ?? 0);
      const awardedForReps = Number(record.awardedForReps ?? 0);
      const estimate = estimatedMax(Number(record.weight), Number(record.reps ?? 0));

      if (eligibleForReps > awardedForReps && estimate !== null && estimate > currentMax(exercise)) {
        pending.push({ percent, record, estimate });
      }
    });
  });

  return pending.sort((a, b) => b.estimate - a.estimate)[0] ?? null;
}

function recordCanProgress(exercise, record) {
  const eligibleForReps = Number(record.eligibleForReps ?? 0);
  const awardedForReps = Number(record.awardedForReps ?? 0);
  const estimate = estimatedMax(Number(record.weight), Number(record.reps ?? 0));
  return eligibleForReps > awardedForReps && estimate !== null && estimate > currentMax(exercise);
}

function recordsForPercent(exercise, percent) {
  return (state.bestRepsMode === "ar" ? exercise.arRecords : exercise.records)?.[percent] ?? [];
}

function bestRepsForPercent(exercise, percent) {
  const savedBest = recordsForPercent(exercise, percent).reduce(
    (best, record) => Math.max(best, Number(record.reps ?? 0)),
    0,
  );
  const targetWeight = percentageWeight(exercise, Number(percent));
  const workoutBest = (exercise.workouts ?? []).reduce((best, workout) => {
    const hasAR = workout.accommodatingResistance?.type === "chains" || workout.accommodatingResistance?.type === "bands";
    // Allow half a displayed millikilogram so a typed kg conversion still matches its lb row.
    return hasAR === (state.bestRepsMode === "ar") && Math.abs(Number(workout.weight) - targetWeight) < KG_TO_LB * 0.00051
      ? Math.max(best, Number(workout.reps ?? 0)) : best;
  }, 0);
  const manualReps = state.bestRepsMode === "ar" ? exercise.arReps : exercise.reps;
  return Math.max(savedBest, Number(manualReps?.[percent] ?? 0), workoutBest);
}

function renderSavedRecords(exercise, percent) {
  const attempts = recordsForPercent(exercise, percent)
    .flatMap((record) =>
      (record.attempts ?? []).map((attempt) => ({
        ...attempt,
        ready: state.bestRepsMode !== "ar" && recordCanProgress(exercise, record) && Number(attempt.reps ?? 0) === Number(record.eligibleForReps ?? 0),
      })),
    )
    .sort((a, b) => new Date(b.savedAt ?? 0) - new Date(a.savedAt ?? 0) || b.weight - a.weight || b.reps - a.reps);

  if (attempts.length === 0) return "None";

  return attempts
    .slice(0, 4)
    .map((attempt) => {
      const status = attempt.ready ? " (ready)" : "";
      return `${displayWeight(Number(attempt.weight))} x ${attempt.reps} on ${formatDate(attempt.savedAt)}${status}`;
    })
    .join(", ");
}

function exerciseGroups() {
  const groups = LiftCatalog.groups.map(group => ({...group}));
  for (const exercise of currentExercises()) {
    const group = LiftCatalog.describe(exercise);
    if (!groups.some(item => item.key === group.key)) groups.push({...group, variations:[]});
  }
  return groups;
}

function syncExerciseGroupControls() {
  const group = document.querySelector("#exerciseGroup").value;
  const isNew = group === "new";
  const isDeadlift = group === "deadlift";
  document.querySelector("#newExerciseGroupLabel").hidden = !isNew;
  document.querySelector("#newExerciseGroup").disabled = !isNew;
  document.querySelector("#newExerciseGroup").required = isNew;
  document.querySelector("#exerciseStanceLabel").hidden = !isDeadlift;
  document.querySelector("#exerciseStance").disabled = !isDeadlift;
}

function openExerciseDialog() {
  syncUnitControls();
  document.querySelector("#exerciseDialogTitle").textContent = editingExerciseId ? "Edit exercise" : "Add exercise";
  const dialog = document.querySelector("#exerciseDialog");
  if (!dialog.open) dialog.showModal();
}

function closeExerciseDialog() {
  editingExerciseId = null;
  document.querySelector("#exerciseDialog").close();
}

function prepareExercise(name, groupKey, style = state.deadliftStyle) {
  editingExerciseId = null;
  if (groupKey !== "new") state.activeLiftGroup = groupKey;
  form.reset();
  document.querySelector("#exerciseGroup").value = groupKey;
  document.querySelector("#exerciseStance").value = style;
  exerciseName.value = name;
  oneRepMax.value = "";
  trainingMaxPercent.value = "85";
  form.querySelector('button[type="submit"]').textContent = "Add exercise";
  syncExerciseGroupControls();
  openExerciseDialog();
  (name ? oneRepMax : exerciseName).focus();
}

function selectOrPrepareExercise(name, groupKey, style = state.deadliftStyle) {
  const existing = currentExercises().find(exercise => {
    const info = LiftCatalog.describe(exercise);
    return info.key === groupKey && (groupKey !== "deadlift" || info.style === style) && LiftCatalog.sameName(exercise.name,name);
  });
  if (existing) {
    state.selectedId = existing.id;
    saveState();
    render();
  } else prepareExercise(name,groupKey,style);
}

function exerciseListButton(exercise, description = "") {
  const item = document.createElement("button");
  const title = document.createElement("strong");
  const subtitle = document.createElement("span");
  item.className = "exercise-item";
  item.type = "button";
  item.setAttribute("aria-current", exercise.id === state.selectedId ? "true" : "false");
  title.textContent = exercise.name;
  subtitle.textContent = `${description ? `${description} · ` : ""}${displayWeight(currentMax(exercise))} training max (${exercise.trainingMaxPercent}%)`;
  item.append(title,subtitle);
  item.addEventListener("click", () => {
    state.selectedId = exercise.id;
    state.activeLiftGroup = LiftCatalog.describe(exercise).key;
    saveState();
    render();
  });
  return item;
}

function renderExerciseList() {
  exerciseList.innerHTML = "";
  const athlete = currentAthlete();
  const exercises = currentExercises();
  exerciseListTitle.textContent = state.view === "coach" && athlete ? athlete.name : "Main Exercises";
  const groups = exerciseGroups();
  if (!groups.some(group=>group.key===state.activeLiftGroup)) state.activeLiftGroup = groups[0].key;
  const tabs = document.querySelector("#mainExerciseTabs");
  tabs.innerHTML = "";
  for (const group of groups) {
    const tab = document.createElement("button");
    tab.type="button"; tab.textContent=group.name;
    tab.setAttribute("aria-pressed",String(state.activeLiftGroup===group.key));
    tab.addEventListener("click",()=>{
      state.activeLiftGroup=group.key;
      const matches=currentExercises().filter(exercise=>{
        const info=LiftCatalog.describe(exercise);
        return info.key===group.key && (group.key!=="deadlift" || !info.style || info.style===state.deadliftStyle);
      });
      state.selectedId=(matches.find(exercise=>LiftCatalog.describe(exercise).role==="main") ?? matches[0])?.id ?? null;
      saveState(); render();
    });
    tabs.append(tab);
  }
  const groupSelect = document.querySelector("#exerciseGroup");
  const chosenGroup = groupSelect.value;
  groupSelect.innerHTML = "";
  for (const group of [...groups.filter(g=>g.key!=="other"), {key:"other",name:"Other exercises"}, {key:"new",name:"Add another main exercise…"}]) {
    const option = document.createElement("option");
    option.value = group.key; option.textContent = group.name;
    groupSelect.append(option);
  }
  groupSelect.value = [...groups.map(g=>g.key),"other","new"].includes(chosenGroup) ? chosenGroup : "squat";
  syncExerciseGroupControls();

  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "lift-group";
    section.hidden = group.key !== state.activeLiftGroup;
    const heading = document.createElement("h3");
    heading.textContent = group.name;
    section.append(heading);
    const all = exercises.filter(exercise => LiftCatalog.describe(exercise).key === group.key);
    if (group.key === "other") {
      for (const exercise of all) section.append(exerciseListButton(exercise));
      exerciseList.append(section);
      continue;
    }
    const isDeadlift = group.key === "deadlift";
    if (isDeadlift) {
      const toggle = document.createElement("div");
      toggle.className = "deadlift-style-toggle";
      toggle.setAttribute("role","group"); toggle.setAttribute("aria-label","Deadlift stance");
      for (const [key,label] of [["conventional","Conventional"],["sumo","Sumo"]]) {
        const button = document.createElement("button"); button.type="button"; button.textContent=label;
        button.setAttribute("aria-pressed",String(state.deadliftStyle===key));
        button.addEventListener("click",()=>{
          if (editingExerciseId && LiftCatalog.describe(selectedExercise() ?? {}).key === "deadlift") {
            editingExerciseId=null; form.reset(); syncExerciseGroupControls();
          }
          state.deadliftStyle=key;
          const main=all.find(exercise=>{const info=LiftCatalog.describe(exercise); return info.role==="main"&&info.style===key;});
          state.selectedId=main?.id ?? all.find(exercise=>LiftCatalog.describe(exercise).style===key)?.id ?? null;
          saveState(); render();
        });
        toggle.append(button);
      }
      section.append(toggle);
    }
    const visible = all.filter(exercise=>!isDeadlift || LiftCatalog.describe(exercise).style===state.deadliftStyle);
    const mains=visible.filter(exercise=>LiftCatalog.describe(exercise).role==="main");
    for (const exercise of mains) section.append(exerciseListButton(exercise,isDeadlift?state.deadliftStyle:""));
    if(!mains.length) {
      const button=document.createElement("button"); button.type="button"; button.className="exercise-item unconfigured-exercise";
      button.textContent=`Set up ${group.name}${isDeadlift?` (${state.deadliftStyle})`:""}`;
      button.addEventListener("click",()=>prepareExercise(group.name,group.key));
      section.append(button);
    }
    const details=document.createElement("details"); details.className="lift-variations";
    const summary=document.createElement("summary"); summary.textContent="Variations";
    details.open=state.openLiftGroups[group.key] ?? visible.some(exercise=>exercise.id===state.selectedId && LiftCatalog.describe(exercise).role!=="main");
    details.addEventListener("toggle",()=>{state.openLiftGroups[group.key]=details.open;});
    details.append(summary);
    for(const exercise of visible.filter(exercise=>LiftCatalog.describe(exercise).role!=="main")) details.append(exerciseListButton(exercise));
    const label=document.createElement("label"); const caption=document.createElement("span"); caption.textContent="Choose a variation";
    const select=document.createElement("select"); const empty=document.createElement("option"); empty.value=""; empty.textContent="Select variation…"; select.append(empty);
    for(const name of [...group.variations,"Add custom variation…"]) {
      const option=document.createElement("option"); option.value=name; option.textContent=name; select.append(option);
    }
    select.addEventListener("change",()=>{
      if(!select.value)return;
      const name=select.value==="Add custom variation…"?"":select.value;
      state.openLiftGroups[group.key]=true;
      selectOrPrepareExercise(name,group.key);
      select.value="";
    });
    label.append(caption,select); details.append(label); section.append(details);
    const unspecified=isDeadlift?all.filter(exercise=>!LiftCatalog.describe(exercise).style):[];
    if(unspecified.length) {
      const legacy=document.createElement("details"); legacy.className="lift-variations";
      const title=document.createElement("summary"); title.textContent="Existing records — stance not set"; legacy.append(title);
      legacy.open=unspecified.some(exercise=>exercise.id===state.selectedId);
      for(const exercise of unspecified) legacy.append(exerciseListButton(exercise,"Edit to set stance"));
      section.append(legacy);
    }
    exerciseList.append(section);
  }
}

function renderRows(exercise) {
  document.querySelector("#bestRepsWeight").setAttribute("aria-pressed", String(state.bestRepsMode !== "ar"));
  document.querySelector("#bestRepsAR").setAttribute("aria-pressed", String(state.bestRepsMode === "ar"));
  percentageRows.innerHTML = "";

  PERCENTAGES.forEach((percent) => {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");
    const repsInput = fragment.querySelector(".reps-input");
    const saveButton = fragment.querySelector(".save-row-button");
    const key = String(percent);

    fragment.querySelector(".percent-cell").textContent = formatPercent(percent);
    fragment.querySelector(".weight-cell").textContent = displayWeight(percentageWeight(exercise, percent));
    fragment.querySelector(".records-cell").textContent = renderSavedRecords(exercise, key);
    repsInput.value = state.repDrafts[draftKey(exercise.id, key)] ?? (bestRepsForPercent(exercise, key) || "");
    repsInput.dataset.percent = key;
    saveButton.dataset.percent = key;

    if (percent === 100) row.classList.add("hundred-row");

    repsInput.addEventListener("input", () => {
      state.repDrafts[draftKey(exercise.id, key)] = repsInput.value;
    });
    repsInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveLift(exercise.id, key, repsInput.value);
      }
    });
    saveButton.addEventListener("click", () => saveLift(exercise.id, key, repsInput.value));

    percentageRows.append(fragment);
  });
}

function renderWorkoutHistory(exercise) {
  workoutHistory.innerHTML = "";
  const workouts = (exercise.workouts ?? [])
    .slice()
    .sort((a, b) => new Date(b.date ?? b.savedAt ?? 0) - new Date(a.date ?? a.savedAt ?? 0));

  workoutCount.textContent = workouts.length === 1 ? "1 workout" : `${workouts.length} workouts`;

  if (workouts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No workouts logged for this exercise yet.";
    workoutHistory.append(empty);
    return;
  }

  workouts.forEach((workout) => {
    const item = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const deleteButton = document.createElement("button");
    const editButton = document.createElement("button");
    const actions = document.createElement("div");
    const volume = workoutVolume(workout);
    const percent = Number(workout.percent ?? 0);

    item.className = "history-item";
    title.textContent = `${formatDate(workout.date)} - ${formatWorkoutWeight(Number(workout.weight))} x ${workout.sets} x ${workout.reps}`;
    const chains = resistanceDescription(workout);
    meta.textContent = `${percent > 0 ? `${formatPercent(percent)} | ` : ""}${chains ? `${chains} | ` : ""}Volume ${displayWeight(volume,"workout")}`;
    deleteButton.type = "button";
    deleteButton.className = "danger-button workout-delete-button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete workout: ${title.textContent}`);
    deleteButton.addEventListener("click", () => deleteWorkout(exercise.id, workout));
    editButton.type = "button";
    editButton.className = "ghost-button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", `Edit workout: ${title.textContent}`);
    editButton.addEventListener("click", () => editWorkout(exercise.id, workout));
    actions.className = "workout-history-actions";
    actions.append(editButton, deleteButton);
    item.append(title, meta, actions);
    workoutHistory.append(item);
  });
}

function resetWorkoutForm() {
  editingWorkout = null;
  workoutDate.value = todayDateValue();
  workoutWeight.value = "";
  workoutPercent.value = "";
  workoutSets.value = "";
  workoutReps.value = "";
  workoutResistance.value = "none";
  workoutChainWeight.value = "";
  workoutChainBasis.value = "per-side";
  for (const [id, value] of Object.entries({workoutBand:"micro-mini", workoutBandSetup:"single", workoutBandDirection:"down", workoutBandWeight:"", workoutBandBasis:"total",  workoutBandNotes:""})) {
    document.querySelector(`#${id}`).value = value;
  }
  updateChainControls();
  document.querySelector("#workoutEntryTitle").textContent = "Sets and Reps";
  document.querySelector("#workoutSubmit").textContent = "Save";
  document.querySelector("#cancelWorkoutEdit").hidden = true;
}

function editWorkout(exerciseId, workout) {
  const exercise = selectedExercise();
  if (exercise?.id !== exerciseId || !exercise.workouts?.includes(workout)) return;
  editingWorkout = { exerciseId, workout };
  workoutDate.value = workout.date;
  writeWeightInput(workoutWeight, workout.weight, "workout");
  workoutPercent.value = workout.percent ?? workoutPercentFromWeight(exercise, workout.weight);
  workoutSets.value = workout.sets;
  workoutReps.value = workout.reps;
  workoutResistance.value = workout.accommodatingResistance?.type ?? "none";
  writeWeightInput(workoutChainWeight, workout.accommodatingResistance?.type === "chains" ? workout.accommodatingResistance.weight : NaN, "workout");
  workoutChainBasis.value = workout.accommodatingResistance?.basis ?? "per-side";
  const band = workout.accommodatingResistance?.type === "bands" ? workout.accommodatingResistance : {};
  for (const [id, value] of Object.entries({workoutBand:band.band ?? "micro-mini", workoutBandSetup:band.setup === "reference" ? "other" : band.setup ?? "single", workoutBandDirection:band.direction ?? "down", workoutBandWeight:band.weight ?? "", workoutBandBasis:band.basis ?? "total",  workoutBandNotes:band.notes ?? ""})) {
    document.querySelector(`#${id}`).value = value;
  }
  writeWeightInput(document.querySelector("#workoutBandWeight"), band.weight ?? NaN, "workout");
  updateChainControls();
  document.querySelector("#workoutEntryTitle").textContent = "Edit Workout";
  document.querySelector("#workoutSubmit").textContent = "Update workout";
  document.querySelector("#cancelWorkoutEdit").hidden = false;
  workoutDate.focus();
}

function deleteWorkout(exerciseId, workout) {
  const exercise = currentExercises().find(item => item.id === exerciseId);
  const index = exercise?.workouts?.indexOf(workout) ?? -1;
  if (index < 0) return;
  const description = `${formatDate(workout.date)}: ${formatWorkoutWeight(Number(workout.weight))} x ${workout.sets} sets x ${workout.reps} reps${resistanceDescription(workout) ? ` | ${resistanceDescription(workout)}` : ""}`;
  if (!confirm(`Delete this workout for ${exercise.name}?\n${description}`)) return;
  exercise.workouts.splice(index, 1);
  saveState();
  render();
}

function volumeBuckets(exercise) {
  const buckets = new Map();
  const addVolume = (key, parts) => {
    const bucket = buckets.get(key) ?? {key, baseVolume:0, arAdded:0, arAssistance:0, volume:0};
    for (const field of ["baseVolume", "arAdded", "arAssistance", "volume"]) bucket[field] += parts[field];
    buckets.set(key, bucket);
  };

  (exercise.workouts ?? []).forEach((workout) => {
    const key = groupWorkoutDate(workout.date ?? workout.savedAt, state.volumePeriod);
    addVolume(key, workoutVolumeParts(workout));
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key));
}

function renderVolumeChart(exercise) {
  volumeChart.innerHTML = "";
  volumeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.period === state.volumePeriod));
  });

  const buckets = volumeBuckets(exercise);
  if (buckets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Log workouts to build a volume chart.";
    volumeChart.append(empty);
    return;
  }

  const visibleBuckets = buckets.slice(-12);
  const maxVolume = Math.max(...visibleBuckets.map((bucket) => bucket.volume + bucket.arAssistance));
  const legend = document.createElement("div");
  legend.className = "volume-legend";
  for (const [className, text] of [["base", "Weight volume"], ["ar", "AR added"], ["assistance", "AR assistance (excluded)"]]) {
    const item = document.createElement("span");
    item.className = `volume-legend-${className}`;
    item.textContent = text;
    legend.append(item);
  }
  const graph = document.createElement("div");
  const yAxis = document.createElement("div");
  const plot = document.createElement("div");
  const yTop = document.createElement("span");
  const yMiddle = document.createElement("span");
  const yBottom = document.createElement("span");

  graph.className = "volume-graph";
  yAxis.className = "volume-y-axis";
  plot.className = "volume-plot";
  yTop.textContent = formatVolumeValue(maxVolume);
  yMiddle.textContent = formatVolumeValue(maxVolume / 2);
  yBottom.textContent = "0";
  yAxis.append(yTop, yMiddle, yBottom);

  visibleBuckets.forEach((bucket) => {
    const column = document.createElement("div");
    const value = document.createElement("strong");
    const track = document.createElement("div");
    const bar = document.createElement("div");
    const base = document.createElement("div");
    const ar = document.createElement("div");
    const assistance = document.createElement("div");
    const label = document.createElement("span");

    column.className = "volume-column";
    value.textContent = formatVolumeValue(bucket.volume);
    track.className = "volume-bar-track";
    bar.className = "volume-bar-fill";
    base.className = "volume-base-segment";
    ar.className = "volume-ar-segment";
    assistance.className = "volume-assistance-segment";
    bar.style.height = `${maxVolume > 0 ? bucket.volume / maxVolume * 100 : 0}%`;
    base.style.height = `${bucket.volume > 0 ? (bucket.baseVolume - bucket.arAssistance) / bucket.volume * 100 : 0}%`;
    ar.style.height = `${bucket.volume > 0 ? bucket.arAdded / bucket.volume * 100 : 0}%`;
    assistance.style.height = `${maxVolume > 0 ? bucket.arAssistance / maxVolume * 100 : 0}%`;
    assistance.style.bottom = `${maxVolume > 0 ? bucket.volume / maxVolume * 100 : 0}%`;
    assistance.hidden = bucket.arAssistance === 0;
    const description = `${formatVolumePeriodLabel(bucket.key, state.volumePeriod)}: Total ${formatVolumeValue(bucket.volume)} ${sectionUnit("volume")}; weight ${formatVolumeValue(bucket.baseVolume)} ${sectionUnit("volume")}; AR added ${formatVolumeValue(bucket.arAdded)} ${sectionUnit("volume")}; assistance subtracted ${formatVolumeValue(bucket.arAssistance)} ${sectionUnit("volume")}`;
    track.title = description;
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", description);
    base.title = `Weight volume after assistance: ${formatVolumeValue(bucket.baseVolume - bucket.arAssistance)} ${sectionUnit("volume")}`;
    ar.title = `AR added: ${formatVolumeValue(bucket.arAdded)} ${sectionUnit("volume")}`;
    assistance.title = `AR assistance: ${formatVolumeValue(bucket.arAssistance)} ${sectionUnit("volume")} (excluded from total)`;
    bar.append(base, ar);
    track.append(bar, assistance);
    label.textContent = formatVolumePeriodLabel(bucket.key, state.volumePeriod);
    column.append(value, track, label);
    plot.append(column);
  });

  graph.append(yAxis, plot);
  volumeChart.append(legend, graph);
}

function renderMetrics(exercise, preserveInputs = false) {
  const lift = LiftCatalog.describe(exercise);
  selectedName.textContent = `${lift.name}${lift.key === "deadlift" ? ` · ${lift.style ?? "stance not set"}` : ""}${lift.role === "variation" ? " · Variation" : ""}`;
  selectedTitle.textContent = exercise.name;
  selectedOneRepMax.textContent = displayWeight(exercise.oneRepMax);
  baseTrainingMaxLabel.textContent = `Base training max (${exercise.trainingMaxPercent}%)`;
  baseTrainingMax.textContent = displayWeight(baseMax(exercise));
  currentTrainingMax.textContent = displayWeight(currentMax(exercise));
  earnedIncreases.textContent = formatSignedWeight(
    exercise.increases * FIVE_POUNDS + Number(exercise.manualTrainingMaxAdjustment ?? 0),
  );
  if (!preserveInputs) {
    writeWeightInput(recordOneRepMax, exercise.oneRepMax, "table");
    manualTmAmount.value = "";
  }
  progressTrainingMax.textContent = `Progress TM +${displayWeight(FIVE_POUNDS,"table")}`;
  workoutDate.value = workoutDate.value || todayDateValue();

  const pendingProgress = findPendingProgressRecord(exercise);
  progressTrainingMax.disabled = !pendingProgress;

  if (pendingProgress) {
    autoIncreaseNotice.textContent =
      `A saved set qualifies this exercise for a +${displayWeight(FIVE_POUNDS,"table")} training max increase. Use Progress TM when you are ready.`;
    autoIncreaseNotice.classList.remove("hidden");
  } else if (hasTrainingMaxAward(exercise)) {
    autoIncreaseNotice.textContent = `A previous saved set progressed the training max by ${displayWeight(FIVE_POUNDS,"table")}.`;
    autoIncreaseNotice.classList.remove("hidden");
  } else {
    autoIncreaseNotice.classList.add("hidden");
  }
}

function renderDetail() {
  const exercise = selectedExercise();

  emptyState.classList.toggle("hidden", Boolean(exercise));
  detailPanel.classList.toggle("hidden", !exercise);

  if (!exercise) return;
  if (disclosureExerciseId !== exercise.id) {
    for (const id of ["percentageDetails", "workoutHistoryDetails"]) document.querySelector(`#${id}`).open = false;
    disclosureExerciseId = exercise.id;
  }

  renderMetrics(exercise);
  renderRows(exercise);
  renderWorkoutHistory(exercise);
  renderVolumeChart(exercise);
}

function render() {
  syncUnitControls();
  if (editingWorkout && (selectedExercise()?.id !== editingWorkout.exerciseId ||
      !selectedExercise()?.workouts?.includes(editingWorkout.workout))) {
    resetWorkoutForm();
  }
  if (editingExerciseId && editingExerciseId !== state.selectedId) {
    editingExerciseId = null;
    form.reset();
    form.querySelector('button[type="submit"]').textContent = "Add exercise";
  }
  renderView();
  renderAthleteList();
  renderExerciseList();
  renderDetail();
}

function renderView() {
  const isCoach = state.view === "coach";
  document.body.classList.toggle("dark-mode", state.darkMode);
  coachPanel.classList.toggle("hidden", !isCoach);
  athleteViewButton.setAttribute("aria-pressed", String(!isCoach));
  coachViewButton.setAttribute("aria-pressed", String(isCoach));
  darkModeButton.setAttribute("aria-pressed", String(state.darkMode));
  darkModeButton.textContent = state.darkMode ? "Light" : "Dark";
}

function renderAthleteList() {
  athleteList.innerHTML = "";

  const sortedAthletes = state.athletes.slice().sort((a, b) => {
    if (a.id === DEFAULT_ATHLETE_ID) return -1;
    if (b.id === DEFAULT_ATHLETE_ID) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
  });

  sortedAthletes.forEach((athlete) => {
    const item = document.createElement("button");
    const title = document.createElement("strong");

    item.className = "athlete-item";
    item.type = "button";
    item.setAttribute("aria-current", athlete.id === state.selectedAthleteId ? "true" : "false");
    title.textContent = athlete.name;
    item.append(title);
    item.addEventListener("click", () => {
      state.selectedAthleteId = athlete.id;
      state.selectedId = athlete.exercises[0]?.id ?? null;
      saveState();
      render();
    });
    athleteList.append(item);
  });
}

function saveLift(exerciseId, percent, rawValue) {
  const exercise = currentExercises().find((item) => item.id === exerciseId);
  const numericPercent = Number(percent);
  const reps = Number.parseInt(rawValue, 10);

  if (!exercise) return;

  if (Number.isNaN(reps) || reps <= 0) {
    delete state.repDrafts[draftKey(exerciseId, percent)];
    render();
    return;
  }

  const liftedWeight = percentageWeight(exercise, numericPercent);
  const isAR = state.bestRepsMode === "ar";
  const records = isAR ? (exercise.arRecords ??= {}) : exercise.records;
  const manualReps = isAR ? (exercise.arReps ??= {}) : exercise.reps;
  records[percent] = records[percent] ?? [];

  let record = records[percent].find((item) => item.weight === liftedWeight);
  if (!record) {
    record = {
      weight: liftedWeight,
      reps: 0,
      awardedForReps: 0,
      savedAt: new Date().toISOString(),
      attempts: [],
    };
    records[percent].push(record);
  }

  record.attempts = Array.isArray(record.attempts) ? record.attempts : [];
  record.attempts.push({
    weight: liftedWeight,
    reps,
    savedAt: new Date().toISOString(),
  });
  record.reps = Math.max(Number(record.reps ?? 0), reps);
  record.savedAt = new Date().toISOString();
  // Keep workout-derived bests out of the manual cache so edits/deletes can lower them.
  manualReps[percent] = records[percent].reduce((best, item) => Math.max(best, Number(item.reps ?? 0)), 0);

  if (!isAR && numericPercent >= 85) {
    const estimate = estimatedMax(liftedWeight, record.reps);
    if (estimate !== null && estimate > currentMax(exercise)) {
      record.eligibleForReps = Math.max(Number(record.eligibleForReps ?? 0), record.reps);
    }
  }

  saveState();
  delete state.repDrafts[draftKey(exerciseId, percent)];
  render();
}

function saveWorkout(event) {
  event.preventDefault();

  const exercise = selectedExercise();
  const date = workoutDate.value || todayDateValue();
  const rawWeight = readWeightInput(workoutWeight,"workout");
  const rawPercent = Number.parseFloat(workoutPercent.value);
  const weight = Number.isNaN(rawWeight) ? workoutWeightFromPercent(exercise, rawPercent) : rawWeight;
  const percent = Number.isNaN(rawPercent) ? workoutPercentFromWeight(exercise, weight) : rawPercent;
  const sets = Number.parseInt(workoutSets.value, 10);
  const reps = Number.parseInt(workoutReps.value, 10);

  if (!exercise || Number.isNaN(weight) || Number.isNaN(sets) || Number.isNaN(reps) || weight <= 0 || sets <= 0 || reps <= 0) {
    return;
  }

  let accommodatingResistance = null;
  if (workoutResistance.value === "chains") {
    const chainWeight = readWeightInput(workoutChainWeight,"workout");
    const basis = workoutChainBasis.value;
    if (!Number.isFinite(chainWeight) || chainWeight <= 0 || !["per-side", "total"].includes(basis)) {
      alert("Enter a positive chain weight and choose per side or both sides total.");
      return;
    }
    accommodatingResistance = { type: "chains", weight: chainWeight, basis };
  } else if (workoutResistance.value === "bands") {
    const field = id => document.querySelector(`#workoutBand${id}`).value;
    const band = document.querySelector("#workoutBand").value;
    const bandWeight = readWeightInput(document.querySelector("#workoutBandWeight"),"workout");
    const basis = field("Basis"), setup = field("Setup"), direction = field("Direction");
    const notes = field("Notes").trim();
    if (!Number.isFinite(bandWeight) || bandWeight < 0 || !Object.hasOwn(BAND_NAMES, band) || !Object.hasOwn(BAND_SETUPS, setup) || !Object.hasOwn(BAND_DIRECTIONS, direction) || !["per-side", "total"].includes(basis) || notes.length > 500) {
      alert("Enter a nonnegative band tension and choose a band, setup, direction and weight basis.");
      return;
    }
    accommodatingResistance = { type: "bands", weight: bandWeight, basis, band, setup, direction, notes, valueSource: "manual" };
    if (weight + bandTotal({accommodatingResistance}) < 0) {
      alert("Reverse-band assistance cannot exceed bar weight.");
      return;
    }
  }

  exercise.workouts = Array.isArray(exercise.workouts) ? exercise.workouts : [];
  if (editingWorkout) {
    if (editingWorkout.exerciseId !== exercise.id || !exercise.workouts.includes(editingWorkout.workout)) {
      resetWorkoutForm();
      return;
    }
    Object.assign(editingWorkout.workout, { date, weight, percent, sets, reps, accommodatingResistance, updatedAt: new Date().toISOString() });
  } else {
    exercise.workouts.push({
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date, weight, percent, sets, reps, accommodatingResistance,
      savedAt: new Date().toISOString(),
    });
  }

  resetWorkoutForm();
  saveState();
  render();
}

function syncWorkoutPercentFromWeight() {
  const exercise = selectedExercise();
  const weight = readWeightInput(workoutWeight,"workout");
  if (!exercise || Number.isNaN(weight) || weight <= 0) return;
  workoutPercent.value = workoutPercentFromWeight(exercise, weight);
  updateChainControls();
}

function syncWorkoutWeightFromPercent() {
  const exercise = selectedExercise();
  const percent = Number.parseFloat(workoutPercent.value);
  if (!exercise || Number.isNaN(percent) || percent <= 0) return;
  writeWeightInput(workoutWeight, workoutWeightFromPercent(exercise, percent), "workout");
  updateChainControls();
}

function progressSelectedTrainingMax() {
  const exercise = selectedExercise();
  if (exercise) void window.TrainingStore.progress(exercise.id);
}

function populateBarOptions() {
  barType.innerHTML = "";
  BAR_TYPES.slice()
    .sort((a, b) => {
      if (a.id === "custom") return 1;
      if (b.id === "custom") return -1;
      return a.weight - b.weight || a.name.localeCompare(b.name, undefined, { numeric: true });
    })
    .forEach((bar) => {
    const option = document.createElement("option");
    option.value = bar.id;
    option.textContent = bar.id === "custom" ? bar.name : `${bar.name} (${formatLoaderWeight(bar.weight)})`;
    barType.append(option);
  });
}

function selectedBar() {
  const bar = BAR_TYPES.find((item) => item.id === barType.value) ?? BAR_TYPES[0];
  const weight = bar.id === "custom" ? readWeightInput(customBarWeight,"loader") : bar.weight;
  return {
    name: bar.name,
    weight: Number.isNaN(weight) || weight < 0 ? bar.weight : weight,
    maxPlate: bar.maxPlate ?? Infinity,
  };
}

function selectedPlateConfig(bar = selectedBar()) {
  const config = PLATE_SETS[plateSet.value] ?? PLATE_SETS.standard;
  const plates = config.plates.filter((plate) => {
    if (config.unit === "lb" && !useHundredPlates.checked && plate === 100) return false;
    if (config.unit === "kg" && !useFiftyKgPlates.checked && plate === 50) return false;
    const platePounds = config.unit === "kg" ? kgToChartPounds(plate) : plate;
    return platePounds <= bar.maxPlate;
  });

  return { ...config, plates };
}

function solvePlateLoad(weightPerSide, availablePlates, unitSize = PLATE_UNIT) {
  const targetUnits = Math.round(roundUpToUnit(weightPerSide, unitSize) / unitSize);
  const plateUnits = availablePlates.map((plate) => Math.round(plate / unitSize));
  const limitUnits = targetUnits + Math.max(...plateUnits);
  const best = Array.from({ length: limitUnits + 1 }, () => null);
  best[0] = [];

  for (let total = 1; total <= limitUnits; total += 1) {
    plateUnits.forEach((units, index) => {
      if (units > total || best[total - units] === null) return;

      const candidate = [...best[total - units], availablePlates[index]];
      const current = best[total];
      if (current === null || candidate.length < current.length) {
        best[total] = candidate;
      }
    });
  }

  for (let total = targetUnits; total <= limitUnits; total += 1) {
    if (best[total] !== null) return best[total].sort((a, b) => b - a);
  }

  return [];
}

function plateSizeClass(plate, unit = "lb") {
  if (unit === "kg") {
    if (plate >= 50) return "plate-xxl";
    if (plate >= 25) return "plate-xl";
    if (plate >= 15) return "plate-lg";
    if (plate >= 5) return "plate-md";
    return "plate-sm";
  }
  if (plate >= 55) return "plate-xl";
  if (plate >= 25) return "plate-lg";
  if (plate >= 10) return "plate-md";
  return "plate-sm";
}

function plateColor(plate, unit = "lb") {
  return unit === "kg" ? KG_PLATE_COLORS[plate] ?? "#6b7280" : PLATE_COLORS[plate] ?? "#6b7280";
}

function plateTextColor(plate, unit = "lb") {
  const lightPlates = unit === "kg" ? [15, 5, 1.25, 0.5, 0.25] : [100, 35, 10, 2.5];
  return lightPlates.includes(plate) ? "#111827" : "#ffffff";
}

function renderPlateStack(container, plates, side, unit = "lb") {
  container.innerHTML = "";

  plates.forEach((plate) => {
    const plateElement = document.createElement("div");

    plateElement.className = `plate ${plateSizeClass(plate, unit)}`;
    plateElement.style.background = plateColor(plate, unit);
    plateElement.style.color = plateTextColor(plate, unit);
    plateElement.textContent = plate;
    plateElement.title = `${plate} ${unit} plate`;

    if (side === "left") {
      container.prepend(plateElement);
    } else {
      container.append(plateElement);
    }
  });

  if (useCollars.checked) {
    const collar = document.createElement("div");
    collar.className = "collar";
    collar.textContent = "2.5";
    collar.title = `2.5 ${unit} collar`;

    if (side === "left") {
      container.prepend(collar);
    } else {
      container.append(collar);
    }
  }
}

function summarizePlates(plates) {
  return summarizePlatesForUnit(plates, "lb");
}

function summarizePlatesForUnit(plates, unit = "lb") {
  const counts = plates.reduce((summary, plate) => {
    summary[plate] = (summary[plate] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([plate, count]) => `${count} x ${formatPlateWeight(Number(plate), unit)} per side`)
    .join(", ");
}

function calculateLoad(event) {
  event?.preventDefault();

  const bar = selectedBar();
  const plateConfig = selectedPlateConfig(bar);
  const plates = plateConfig.plates;
  const unitSize = plateConfig.unit === "kg" ? KG_PLATE_UNIT : PLATE_UNIT;
  const collarWeight = plateConfig.unit === "kg" ? (useCollars.checked ? 5 : 0) : useCollars.checked ? 5 : 0;
  const barWeight = plateConfig.unit === "kg" ? roundToKgStep(poundsToKg(bar.weight)) : bar.weight;
  const mainValue = readWeightInput(loadValue,"loader");
  const percentValue = Number.parseFloat(loadPercent.value);
  let requestedWeightPounds = mainValue;
  let requestedLabel = "";

  if (loadMode.value === "percent") {
    if (Number.isNaN(mainValue) || mainValue <= 0 || Number.isNaN(percentValue) || percentValue <= 0) {
      loadSummary.textContent = "Enter a 1RM and percent to calculate the load.";
      return;
    }

    const rawPercentWeight = mainValue * (percentValue / 100);
    requestedWeightPounds = roundToNearestFive(rawPercentWeight);
    if (plateConfig.unit === "kg") {
      const competitionLoad = roundToCompetitionKg(poundsToKg(requestedWeightPounds));
      requestedLabel = `${formatPercent(percentValue)} of ${formatLoaderWeight(mainValue)} = ${formatLoaderWeight(rawPercentWeight)}, rounded to ${formatLoadWeight(competitionLoad, "kg")}`;
    } else {
      requestedLabel = `${formatPercent(percentValue)} of ${formatLoaderWeight(mainValue)} = ${formatLoaderWeight(rawPercentWeight)}, rounded to ${formatLoaderWeight(requestedWeightPounds)}`;
    }
  } else if (Number.isNaN(requestedWeightPounds) || requestedWeightPounds <= 0) {
    loadSummary.textContent = "Enter a target to load the bar.";
    return;
  }

  const requestedLoad = plateConfig.unit === "kg" ? roundToCompetitionKg(poundsToKg(requestedWeightPounds)) : requestedWeightPounds;
  if (plateConfig.unit === "kg" && loadMode.value !== "percent") {
    requestedLabel = `${formatLoaderWeight(requestedWeightPounds)} target rounded to ${formatLoadWeight(requestedLoad, "kg")}`;
  }
  const baseLoad = barWeight + collarWeight;

  if (requestedLoad <= baseLoad) {
    loadSummary.textContent =
      `${formatLoadWeight(requestedLoad, plateConfig.unit)} is at or below the ${formatLoadWeight(baseLoad, plateConfig.unit)} bar and collar weight.`;
    renderPlateStack(leftPlates, [], "left", plateConfig.unit);
    renderPlateStack(rightPlates, [], "right", plateConfig.unit);
    plateBreakdown.textContent = useCollars.checked
      ? `Use the empty bar with 2.5 ${plateConfig.unit} collars on each side.`
      : "Use the empty bar.";
    return;
  }

  const sideTarget = (requestedLoad - baseLoad) / 2;
  const sidePlates = solvePlateLoad(sideTarget, plates, unitSize);
  const sideWeight = sidePlates.reduce((sum, plate) => sum + plate, 0);
  const loadedWeight = baseLoad + sideWeight * 2;
  const loadedWeightPounds = plateConfig.unit === "kg" ? kgToChartPounds(loadedWeight) : loadedWeight;
  const chartDifference =
    plateConfig.unit === "kg" ? kgToChartPounds(loadedWeight) - kgToChartPounds(requestedLoad) : loadedWeightPounds - requestedWeightPounds;

  renderPlateStack(leftPlates, sidePlates, "left", plateConfig.unit);
  renderPlateStack(rightPlates, sidePlates, "right", plateConfig.unit);

  barLabel.textContent =
    plateConfig.unit === "kg" ? `${formatKg(barWeight)} (${formatLoaderWeight(bar.weight)}) ${bar.name}` : `${formatLoaderWeight(bar.weight)} ${bar.name}`;
  loadSummary.textContent =
    `${requestedLabel ? `${requestedLabel}. ` : ""}Load ${formatLoadWeight(loadedWeight, plateConfig.unit)} with ${bar.name}.`;
  plateBreakdown.textContent =
    `${summarizePlatesForUnit(sidePlates, plateConfig.unit) || "No plates"}${
      useCollars.checked ? `; 2.5 ${plateConfig.unit} collar per side` : ""
    }; ${
      chartDifference > 0 ? `${formatLoaderWeight(chartDifference)} above chart target` : "exact chart load"
    }.`;
}

function updateLoaderMode() {
  const isPercentMode = loadMode.value === "percent";
  loadValueLabel.textContent = `${isPercentMode ? "1RM" : "Target weight"} (${sectionUnit("loader")})`;
  loadValue.placeholder = isPercentMode ? "500" : "400";
  loadPercentLabel.classList.toggle("hidden", !isPercentMode);
}

function updateBarControls() {
  const bar = selectedBar();
  const plateConfig = selectedPlateConfig(bar);
  customBarLabel.classList.toggle("hidden", barType.value !== "custom");
  barLabel.textContent =
    plateConfig.unit === "kg"
      ? `${formatKg(roundToKgStep(poundsToKg(bar.weight)))} (${formatLoaderWeight(bar.weight)}) ${bar.name}`
      : `${formatLoaderWeight(bar.weight)} ${bar.name}`;
  useHundredPlates.disabled = plateConfig.unit === "kg";
  useHundredPlates.closest("label")?.classList.toggle("disabled-control", plateConfig.unit === "kg");
  useFiftyKgPlates.disabled = plateConfig.unit !== "kg";
  useFiftyKgPlates.closest("label")?.classList.toggle("disabled-control", plateConfig.unit !== "kg");
}

function formatConvertedWeight(value, unit) {
  return `${Number(value.toFixed(2)).toLocaleString()} ${unit}`;
}

function convertWeight(event) {
  event?.preventDefault();

  const value = Number.parseFloat(conversionValue.value);
  if (Number.isNaN(value) || value < 0) {
    conversionResult.textContent = "Enter a weight to convert.";
    return;
  }

  if (conversionDirection.value === "kg-to-lb") {
    conversionResult.textContent = `${formatConvertedWeight(value, "kg")} = ${formatConvertedWeight(value * 2.2046226218, "lb")}`;
  } else {
    conversionResult.textContent = `${formatConvertedWeight(value, "lb")} = ${formatConvertedWeight(value / 2.2046226218, "kg")}`;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = exerciseName.value.trim();
  const max = readWeightInput(oneRepMax,"max");
  const tmPercent = Number.parseInt(trainingMaxPercent.value, 10);

  if (!name || Number.isNaN(max) || max <= 0 || ![85, 90].includes(tmPercent)) return;

  let groupKey = document.querySelector("#exerciseGroup").value || LiftCatalog.infer(name);
  let groupLabel = exerciseGroups().find(group=>group.key===groupKey)?.name ?? "Other exercises";
  if (groupKey === "new") {
    groupLabel = document.querySelector("#newExerciseGroup").value.trim();
    if (!LiftCatalog.normalize(groupLabel)) return;
    const known = exerciseGroups().find(group=>LiftCatalog.sameName(group.name,groupLabel));
    groupKey = known?.key ?? `custom:${LiftCatalog.normalize(groupLabel).replace(/ /g,"-")}`;
    groupLabel = known?.name ?? groupLabel;
  }
  const style = groupKey === "deadlift" ? document.querySelector("#exerciseStance").value || state.deadliftStyle : null;
  const normalizedStyle = style === "unspecified" ? null : style;
  const exercises = currentExercises();
  const duplicate = exercises.find(exercise => {
    const info=LiftCatalog.describe(exercise);
    return LiftCatalog.sameName(exercise.name,name) && info.key===groupKey && info.style===normalizedStyle && exercise.id!==editingExerciseId;
  });
  if (editingExerciseId && duplicate) { alert("An exercise with that name already exists for this athlete."); return; }
  const existing = editingExerciseId
    ? exercises.find(exercise => exercise.id === editingExerciseId)
    : duplicate;

  if (existing) {
    existing.name = name;
    if (existing.oneRepMax !== max || existing.trainingMaxPercent !== tmPercent) {
      existing.trainingMaxBase = roundToNearestFive(max * (tmPercent / 100));
      existing.manualTrainingMaxAdjustment = 0;
    }
    existing.oneRepMax = max;
    existing.trainingMaxPercent = tmPercent;
    state.selectedId = existing.id;
  } else {
    const exercise = createExercise(name, max, tmPercent);
    exercises.push(exercise);
    state.selectedId = exercise.id;
  }
  const saved = exercises.find(exercise=>exercise.id===state.selectedId);
  saved.liftGroup = groupKey;
  state.activeLiftGroup = groupKey;
  saved.liftGroupLabel = groupLabel;
  saved.liftRole = LiftCatalog.describe({name,liftGroup:groupKey,liftGroupLabel:groupLabel}).role;
  if (groupKey === "deadlift") {
    saved.deadliftStyle=style;
    if (style !== "unspecified") state.deadliftStyle=style;
  } else delete saved.deadliftStyle;

  editingExerciseId = null;
  form.querySelector('button[type="submit"]').textContent = "Add exercise";
  form.reset();
  document.querySelector("#exerciseGroup").value=groupKey;
  document.querySelector("#exerciseStance").value=style ?? state.deadliftStyle;
  syncExerciseGroupControls();
  trainingMaxPercent.value = "85";
  exerciseName.focus();
  closeExerciseDialog();
  saveState();
  render();
});

editExercise.addEventListener("click", () => {
  const exercise = selectedExercise();
  if (!exercise) return;

  editingExerciseId = exercise.id;
  form.querySelector('button[type="submit"]').textContent = "Save exercise";
  exerciseName.value = exercise.name;
  writeWeightInput(oneRepMax, exercise.oneRepMax, "max");
  trainingMaxPercent.value = String(exercise.trainingMaxPercent);
  const info=LiftCatalog.describe(exercise);
  document.querySelector("#exerciseGroup").value=info.key;
  document.querySelector("#exerciseStance").value=info.style ?? "unspecified";
  syncExerciseGroupControls();
  openExerciseDialog();
  exerciseName.focus();
});

deleteExercise.addEventListener("click", () => {
  const exercise = selectedExercise();
  if (!exercise || !confirm(`Delete ${exercise.name}?`)) return;

  const athlete = currentAthlete();
  athlete.exercises = athlete.exercises.filter((item) => item.id !== exercise.id);
  state.selectedId = athlete.exercises[0]?.id ?? null;
  saveState();
  render();
});

clearData.addEventListener("click", () => {
  const athlete = currentAthlete();
  if (!athlete?.exercises.length || !confirm(`Clear all saved exercises for ${athlete.name}?`)) return;

  athlete.exercises = [];
  state.selectedId = null;
  saveState();
  render();
});

athleteViewButton.addEventListener("click", () => {
  state.view = "athlete";
  saveState();
  render();
});

coachViewButton.addEventListener("click", () => {
  state.view = "coach";
  saveState();
  render();
});

darkModeButton.addEventListener("click", () => {
  state.darkMode = !state.darkMode;
  saveState();
  render();
});

athleteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = athleteName.value.trim();
  if (!name) return;

  const existing = state.athletes.find((athlete) => athlete.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    state.selectedAthleteId = existing.id;
    state.selectedId = existing.exercises[0]?.id ?? null;
  } else {
    const athlete = createAthlete(name);
    state.athletes.push(athlete);
    state.selectedAthleteId = athlete.id;
    state.selectedId = null;
  }

  athleteForm.reset();
  athleteName.focus();
  saveState();
  render();
});

oneRepOnlyForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const exercise = selectedExercise();
  const max = readWeightInput(recordOneRepMax,"table");

  if (!exercise || Number.isNaN(max) || max <= 0) return;

  exercise.oneRepMax = max;
  saveState();
  render();
});

manualTmForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const exercise = selectedExercise();
  const amount = readWeightInput(manualTmAmount,"table");

  if (!exercise || Number.isNaN(amount) || amount === 0) return;

  exercise.manualTrainingMaxAdjustment = Number(exercise.manualTrainingMaxAdjustment ?? 0) + amount;
  saveState();
  render();
});

progressTrainingMax.addEventListener("click", progressSelectedTrainingMax);
loaderForm.addEventListener("submit", calculateLoad);
barType.addEventListener("change", () => {
  updateBarControls();
  calculateLoad();
});
customBarWeight.addEventListener("input", () => {
  updateBarControls();
  calculateLoad();
});
loadMode.addEventListener("change", () => {
  updateLoaderMode();
  calculateLoad();
});
plateSet.addEventListener("change", () => {
  updateBarControls();
  calculateLoad();
});
useHundredPlates.addEventListener("change", calculateLoad);
useFiftyKgPlates.addEventListener("change", calculateLoad);
useCollars.addEventListener("change", calculateLoad);
converterForm.addEventListener("submit", convertWeight);
conversionValue.addEventListener("input", convertWeight);
conversionDirection.addEventListener("change", convertWeight);
workoutForm.addEventListener("submit", saveWorkout);
document.querySelector("#cancelWorkoutEdit").addEventListener("click", resetWorkoutForm);
workoutWeight.addEventListener("input", syncWorkoutPercentFromWeight);
workoutPercent.addEventListener("input", syncWorkoutWeightFromPercent);
workoutResistance.addEventListener("change", updateChainControls);
workoutChainWeight.addEventListener("input", updateChainControls);
workoutChainBasis.addEventListener("change", updateChainControls);
for (const id of ["workoutBand", "workoutBandSetup", "workoutBandDirection", "workoutBandWeight", "workoutBandBasis"]) {
  document.querySelector(`#${id}`).addEventListener(id === "workoutBandWeight" ? "input" : "change", updateBandControls);
}
volumeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.volumePeriod = button.dataset.period;
    saveState();
    render();
  });
});

for (const [id, mode] of [["bestRepsWeight", "weight"], ["bestRepsAR", "ar"]]) {
  document.querySelector(`#${id}`).addEventListener("click", () => {
    state.bestRepsMode = mode;
    saveState();
    render();
  });
}

for (const [section,id] of Object.entries({max:"unitMax",table:"unitTable",workout:"unitWorkout",volume:"unitVolume",loader:"unitLoader"})) {
  document.querySelector(`#${id}`).addEventListener("change", () => setSectionUnit(section,document.querySelector(`#${id}`).value));
}

document.querySelector("#exerciseGroup").addEventListener("change", syncExerciseGroupControls);
document.querySelector("#openAddExercise").addEventListener("click", () => prepareExercise("", state.activeLiftGroup || "squat"));
document.querySelector("#closeExerciseDialog").addEventListener("click", closeExerciseDialog);
document.querySelector("#exerciseDialog").addEventListener("cancel", () => { editingExerciseId = null; });
document.querySelector("#newExerciseGroup").addEventListener("input", () => {
  if (document.querySelector("#exerciseGroup").value === "new") exerciseName.value = document.querySelector("#newExerciseGroup").value;
});

async function init() {
  document.querySelector("main").inert = true;
  state.athletes = [createAthlete("My Training", DEFAULT_ATHLETE_ID)];
  populateBarOptions();
  updateBarControls();
  updateLoaderMode();
  render();
  await window.TrainingStore.start(snapshotState, applyStoredState);
}

init();
