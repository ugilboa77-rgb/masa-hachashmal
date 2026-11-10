// =========================================================
// model.js – החישוב של סימולטור "אי האנרגיה"
//
// כאן נמצאים כל המספרים של האתגר: מחירים, ימי בדיקה, כמה
// מייצרת כל תחנה. הם כוילו כך שיש כמה תוכניות שונות שעומדות
// בכל התנאים, ואין תוכנית אחת שהכי טובה בכל שלושת המדדים.
// (ראו docs/calibration.md)
//
// יחידות: "יחידות חשמל" לשעה, כמו מד ה-0–10 בתחנות.
// כל הכללים כבר הופיעו בתחנות: רוח משתנה, מים נשמרים בסכר,
// דלק שנגמר.
// =========================================================

// ----- תקציב ומחירים -----
export const BUDGET = 100;
export const PRICES = {
  turbine: 10,          // לכל טורבינה
  dam: 35,              // סכר ותחנה הידרואלקטרית
  small: 20,            // תחנה קיטורית קטנה
  large: 35,            // תחנה קיטורית גדולה
};
export const FUEL_PER_DAY = { small: 3, large: 7 }; // דלק לכל יום שהתחנה עובדת
export const MAX_TURBINES = 6;

// ----- המקומות במפה ומה אפשר לבנות בכל אחד -----
export const SITES = {
  ridge:  { name: "רכס הרוחות", allows: "turbine", wind: 1 },
  coast:  { name: "החוף",       allows: "turbine", wind: 0.6 },
  valley: { name: "עמק התאנים", allows: "turbine", wind: 0.15 },
  falls:  { name: "נחל השחף",   allows: "dam" },
  port:   { name: "נמל הדייגים", allows: "steam" },
};

// ----- כמה חשמל הכפר צריך בכל שעה (שיא בבוקר ושיא גדול בערב) -----
export const NEED = [3, 2, 2, 2, 2, 3, 4, 6, 6, 5, 5, 5, 5, 5, 5, 5, 6, 7, 8, 8, 7, 6, 5, 4];

// ----- התחנות (TUNE = המספרים שכוילו) -----
export const TUNE = {
  turbineMax: 2.5,                     // טורבינה ברוח מלאה במקום הכי סוער
  damMax: 7,                           // הסכר בשער פתוח לגמרי
  damCapacity: 60,                     // כמה מים המאגר מחזיק
  steamOut: { small: 3, large: 7 },    // כמה מייצרת כל תחנה קיטורית בשעה
  smokePerHour: { small: 1, large: 3 },
};
export const SMOKE_LEVELS = [
  { max: 0, name: "נקי" },
  { max: 36, name: "מעט" },
  { max: Infinity, name: "הרבה" },
];

// ----- חלקי היום (כמו בתחנה 3) -----
export const BLOCKS = [
  { key: "night",   name: "לילה",   from: 0,  to: 6 },
  { key: "morning", name: "בוקר",   from: 6,  to: 12 },
  { key: "noon",    name: "צהריים", from: 12, to: 17 },
  { key: "evening", name: "ערב",    from: 17, to: 24 },
];
const blockOf = (h) => BLOCKS.findIndex((b) => h >= b.from && h < b.to);

// ----- שלושת ימי הבדיקה -----
// wind: כמה רוח בכל שעה (0–1). "S" = סערה: עוצרים את הטורבינות.
// water: כמה מים במאגר בבוקר, וכמה הנחל מוסיף בכל שעה.
// fuelHours: לכמה שעות עבודה יש דלק (Infinity = כמה שצריך).
export const DAYS = [
  {
    key: "storm",
    name: "יום סוער בחורף",
    short: "יום סוער",
    text: "רוח חזקה רוב היום, ובצהריים סערה של שעתיים. הנחל מלא.",
    wind: [0.9, 0.9, 0.95, 1, 1, 0.95, 0.9, 0.85, 0.9, 0.95, 1, 1, "S", "S", 1, 0.95, 0.9, 0.85, 0.9, 0.95, 1, 1, 0.95, 0.9],
    water: { start: 60, inflow: 4 },
    fuelHours: Infinity,
  },
  {
    key: "calm",
    name: "יום שקט",
    short: "יום שקט",
    text: "כמעט אין רוח כל היום. הנחל בינוני.",
    wind: [0.1, 0.1, 0.05, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05, 0.1, 0.1],
    water: { start: 46, inflow: 1.5 },
    fuelHours: Infinity,
  },
  {
    key: "summer",
    name: "סוף קיץ יבש",
    short: "קיץ יבש",
    text: "רוח בינונית, הנחל כמעט יבש, והאונייה התעכבה ומלאי הדלק קטן.",
    wind: [0.45, 0.4, 0.4, 0.35, 0.35, 0.3, 0.3, 0.35, 0.4, 0.5, 0.55, 0.6, 0.6, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.3, 0.35, 0.4, 0.45],
    water: { start: 20, inflow: 0.3 },
    fuelHours: 16,
  },
];

// ----- תוכנית ריקה -----
export function emptyPlan() {
  return {
    turbines: { ridge: 0, coast: 0, valley: 0 },
    dam: false,
    gateOn: [false, true, true, true],  // באילו חלקי היום השער פתוח
    steam: "none",                      // none / small / large
    steamOn: [false, false, true, true], // באילו חלקי היום התחנה הקיטורית עובדת
  };
}

export const turbineCount = (p) => p.turbines.ridge + p.turbines.coast + p.turbines.valley;
const steamRuns = (p) => p.steam !== "none" && p.steamOn.some(Boolean);

/** עלות הקמה בלבד */
export function buildCost(p) {
  return turbineCount(p) * PRICES.turbine + (p.dam ? PRICES.dam : 0) + (p.steam !== "none" ? PRICES[p.steam] : 0);
}
/** עלות הדלק לשלושת ימי הבדיקה */
export function fuelCost(p) {
  return steamRuns(p) ? FUEL_PER_DAY[p.steam] * DAYS.length : 0;
}
export const totalCost = (p) => buildCost(p) + fuelCost(p);

/** מריץ יום אחד. מחזיר ייצור לכל שעה, צריכה, ושעות חושך */
export function runDay(p, day) {
  let water = p.dam ? day.water.start : 0;
  let fuelLeft = day.fuelHours;
  const prod = [], need = [], waterLeft = [], dark = [];
  let smoke = 0;
  for (let h = 0; h < 24; h++) {
    const b = blockOf(h);
    let out = 0;
    // רוח
    const w = day.wind[h];
    if (w !== "S") {
      for (const site of ["ridge", "coast", "valley"]) out += p.turbines[site] * TUNE.turbineMax * SITES[site].wind * w;
    }
    // קיטור: בשעות שהיא עובדת היא שורפת דלק ומעלה עשן, ומשלימה את מה שהרוח לא נתנה
    if (p.steam !== "none" && p.steamOn[b] && fuelLeft > 0) {
      out += Math.min(TUNE.steamOut[p.steam], Math.max(0, NEED[h] - out));
      smoke += TUNE.smokePerHour[p.steam];
      fuelLeft -= 1;
    }
    // סכר: כשהשער פתוח, יוצאים רק המים שצריך כדי להשלים את מה שעוד חסר
    if (p.dam) {
      water = Math.min(TUNE.damCapacity, water + day.water.inflow);
      if (p.gateOn[b]) {
        const used = Math.min(water, TUNE.damMax, Math.max(0, NEED[h] - out));
        water -= used;
        out += used;
      }
    }
    prod.push(Math.round(out * 100) / 100);
    need.push(NEED[h]);
    waterLeft.push(water);
    if (out < NEED[h] - 0.001) dark.push(h);
  }
  return { prod, need, water: waterLeft, dark, smoke };
}

export function smokeLevel(total) {
  return SMOKE_LEVELS.find((l) => total <= l.max).name;
}

/** מריץ את שלושת הימים ומחזיר את שלושת המדדים */
export function runPlan(p) {
  const days = DAYS.map((d) => ({ key: d.key, ...runDay(p, d) }));
  const darkHours = days.reduce((s, d) => s + d.dark.length, 0);
  const smoke = days.reduce((s, d) => s + d.smoke, 0);
  const produced = days.reduce((s, d) => s + d.prod.reduce((a, b) => a + b, 0), 0);
  const needed = days.reduce((s, d) => s + d.need.reduce((a, b) => a + b, 0), 0);
  return {
    days,
    darkHours,
    cost: totalCost(p),
    smoke,
    smokeName: smokeLevel(smoke),
    surplus: produced > needed * 1.6,
  };
}

// ----- קוד תוכנית: משחזר תוכנית במחשב אחר -----
// דוגמה: W300-H0111-S1-0011
//   W + טורבינות ברכס, בחוף ובעמק
//   H + באילו חלקי יום השער פתוח (או HX בלי סכר)
//   S + 0 בלי / 1 קטנה / 2 גדולה, ואחריו באילו חלקי יום היא עובדת
const STEAM_CODE = { none: 0, small: 1, large: 2 };
export function planCode(p) {
  const t = p.turbines;
  const h = p.dam ? `H${p.gateOn.map((x) => (x ? 1 : 0)).join("")}` : "HX";
  const s = `S${STEAM_CODE[p.steam]}-${p.steamOn.map((x) => (x ? 1 : 0)).join("")}`;
  return `W${t.ridge}${t.coast}${t.valley}-${h}-${s}`;
}
export function parseCode(code) {
  const m = /^W([0-6])([0-6])([0-6])-H(X|[01]{4})-S([0-2])-([01]{4})$/i.exec(String(code).trim().toUpperCase());
  if (!m) return null;
  const p = emptyPlan();
  p.turbines = { ridge: +m[1], coast: +m[2], valley: +m[3] };
  if (turbineCount(p) > MAX_TURBINES) return null;
  if (m[4] !== "X") { p.dam = true; p.gateOn = m[4].split("").map((c) => c === "1"); }
  p.steam = ["none", "small", "large"][+m[5]];
  p.steamOn = m[6].split("").map((c) => c === "1");
  return p;
}

/** תיאור קצר של התוכנית, לסיכום ולהגשה */
export function describe(p) {
  const parts = [];
  for (const site of ["ridge", "coast", "valley"]) {
    const n = p.turbines[site];
    if (n) parts.push(`${n === 1 ? "טורבינת רוח אחת" : `${n} טורבינות רוח`} (${SITES[site].name})`);
  }
  if (p.dam) parts.push(`סכר (${SITES.falls.name})`);
  if (p.steam === "small") parts.push("תחנה קיטורית קטנה");
  if (p.steam === "large") parts.push("תחנה קיטורית גדולה");
  return parts.length ? parts.join(", ") : "אין תחנות";
}
