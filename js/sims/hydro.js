// =========================================================
// hydro.js – הדמיות הסכר (תחנה 3, מעבדה)
//
// createHydroSim  – ניסויים 1 ו-2: גובה הנפילה ופתיחת השער.
//                   המאגר מתרוקן כשהשער פתוח, ומתמלא מהנחל.
// createHydroWeek – ניסוי 3: חורף מול סוף הקיץ. מכוונים את השער
//                   לכל חלק ביום, ומפעילים שבוע שלם עם גרף.
//
// אפשר לשנות את המספרים בטבלאות שלמטה.
// =========================================================

import { createLoop, createMeter, setupFullscreen, reducedMotion, radioValue } from "./engine.js";
import { createDayChart } from "./chart.js";
import { VILLAGE_NEED } from "./wind.js";

// ----- כמה כל גובה מגדיל את החשמל -----
const HEIGHT = {
  low:  { name: "נמוך",  factor: 0.3, dam: 70 },
  mid:  { name: "בינוני", factor: 0.6, dam: 120 },
  high: { name: "גבוה",  factor: 1,   dam: 170 },
};
// ----- השער: 0 = סגור, 4 = פתוח לגמרי -----
const GATE_WORDS = ["סגור", "פתוח ברבע", "פתוח בחצי", "פתוח בשלושה רבעים", "פתוח לגמרי"];
// ----- מאגר: אחוזים בשנייה. בשער פתוח בחצי, הנחל ממלא בדיוק כמו שיוצא -----
const OUT_FULL = 8;  // יציאה בשער פתוח לגמרי
const IN_FLOW = 4;   // כמה הנחל מוסיף

const BASE_Y = 300; // קרקעית העמק בציור

export function createHydroSim(host) {
  const id = host.id || "hydro";
  host.classList.add("sim");
  host.innerHTML = `
    <div class="sim-bar">
      <p class="sim-name">הסכר של נחל השחף</p>
      <button type="button" class="btn btn-secondary sim-full"></button>
    </div>
    <p class="sim-intro" id="${id}-intro">לפניכם סכר על נחל השחף. אתם שולטים בגובה הסכר ובשער. בדקו מה מייצר הכי הרבה חשמל.</p>
    <div class="sim-main">
      <div class="sim-stage">
        <svg class="gen-svg" viewBox="0 0 640 360" role="img" aria-labelledby="${id}-intro">
          <rect width="640" height="360" fill="#E6EFF9"/>
          <!-- הרים והעמק -->
          <path d="M0 80 L60 40 L130 70 L170 50 L210 ${BASE_Y} H0 Z" fill="#B9C79E"/>
          <path class="h-ground" d=""/>
          <!-- המאגר -->
          <path class="h-water" d=""/>
          <!-- הסכר -->
          <path class="h-dam" d=""/>
          <!-- הצינור והמים בתוכו -->
          <path class="h-pipe" d=""/>
          <path class="h-flow" d=""/>
          <!-- תחנת הכוח: טורבינה ומחולל -->
          <rect x="430" y="${BASE_Y - 70}" width="110" height="70" rx="6" fill="#FFFFFF" stroke="#8C99AD" stroke-width="2"/>
          <g class="h-wheel">
            <circle cx="462" cy="${BASE_Y - 30}" r="22" fill="#E6EDF7" stroke="#4A5870" stroke-width="3"/>
            <path d="M462 ${BASE_Y - 52} V${BASE_Y - 8} M440 ${BASE_Y - 30} H484 M446 ${BASE_Y - 46} L478 ${BASE_Y - 14} M478 ${BASE_Y - 46} L446 ${BASE_Y - 14}" stroke="#4A5870" stroke-width="3"/>
          </g>
          <path d="M484 ${BASE_Y - 30} H506" stroke="#4A5870" stroke-width="5"/>
          <rect x="506" y="${BASE_Y - 46}" width="26" height="32" rx="4" fill="#A5561F"/>
          <!-- הנהר שממשיך -->
          <path d="M540 ${BASE_Y - 6} H640" stroke="#4F86C6" stroke-width="10"/>
          <path class="h-river" d="M540 ${BASE_Y - 6} H640" stroke="#BFDDF7" stroke-width="3" stroke-dasharray="10 14"/>
          <rect y="${BASE_Y}" width="640" height="${360 - BASE_Y}" fill="#B9C79E"/>
          <!-- תוויות -->
          <g class="gen-labels">
            <text x="100" y="${BASE_Y + 34}">מאגר</text>
            <text x="485" y="${BASE_Y + 34}">טורבינה</text>
          </g>
        </svg>
      </div>
      <div class="sim-side">
        <div class="level">
          <p class="meter-label" id="${id}-level-label">מים במאגר</p>
          <div class="level-bar" role="meter" aria-labelledby="${id}-level-label" aria-valuemin="0" aria-valuemax="100"><span class="level-fill"></span></div>
        </div>
      </div>
    </div>
    <div class="sim-controls">
      <fieldset class="sim-control">
        <legend>גובה הנפילה</legend>
        <div class="seg">
          ${Object.entries(HEIGHT).map(([k, h]) => `<label><input type="radio" name="${id}-height" value="${k}"${k === "mid" ? " checked" : ""}><span>${h.name}</span></label>`).join("")}
        </div>
      </fieldset>
      <div class="sim-control">
        <label for="${id}-gate">פתיחת השער</label>
        <input type="range" id="${id}-gate" min="0" max="4" step="1" value="0">
        <div class="range-ends" aria-hidden="true"><span>סגור</span><span>פתוח לגמרי</span></div>
      </div>
    </div>
    <p class="visually-hidden sim-live" aria-live="polite"></p>`;

  const side = host.querySelector(".sim-side");
  const meter = createMeter(side);
  side.append(side.querySelector(".level")); // מד המים מתחת למד החשמל
  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();
  const $ = (s) => host.querySelector(s);
  const gate = $(`#${id}-gate`);
  const live = $(".sim-live");
  const levelBar = $(".level-bar");
  const levelFill = $(".level-fill");

  const state = { height: "mid", gate: 0, level: 100, shown: 0, angle: 0, flowOff: 0 };

  function drawShape() {
    const top = BASE_Y - HEIGHT[state.height].dam;
    // הסכר: קיר טרפז
    $(".h-dam").setAttribute("d", `M200 ${BASE_Y} L214 ${top} H232 L250 ${BASE_Y} Z`);
    // הקרקע מתחת למאגר ומימין לסכר
    $(".h-ground").setAttribute("d", `M250 ${BASE_Y} L430 ${BASE_Y} V${BASE_Y} H250 Z`);
    // הצינור מבסיס הסכר לטורבינה
    const p = `M232 ${BASE_Y - 26} C 320 ${BASE_Y - 26}, 380 ${BASE_Y - 30}, 440 ${BASE_Y - 30}`;
    $(".h-pipe").setAttribute("d", p);
    $(".h-flow").setAttribute("d", p);
  }
  function drawWater() {
    const damH = HEIGHT[state.height].dam;
    const wTop = BASE_Y - 8 - (damH - 14) * (state.level / 100);
    $(".h-water").setAttribute("d", `M0 ${wTop.toFixed(1)} H${(208 + 8 * (1 - state.level / 100)).toFixed(1)} L210 ${BASE_Y} H0 Z`);
    levelFill.style.height = `${state.level.toFixed(1)}%`;
    levelBar.setAttribute("aria-valuenow", String(Math.round(state.level)));
  }
  drawShape();
  drawWater();

  // כמה מים זורמים עכשיו (0–1). מאגר ריק = רק מה שהנחל מביא
  const flow = () => {
    const g = state.gate / 4;
    if (state.level > 0.5) return g;
    return Math.min(g, IN_FLOW / OUT_FULL);
  };
  const output = () => 10 * HEIGHT[state.height].factor * flow();

  let liveTimer = 0;
  function announce() {
    const value = Math.round(output());
    host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail: { height: state.height, gate: state.gate, value } }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = `גובה ${HEIGHT[state.height].name}, השער ${GATE_WORDS[state.gate]}. מד החשמל: ${value} מתוך 10. מים במאגר: ${Math.round(state.level)} מתוך 100.`;
    }, 700);
  }

  host.querySelectorAll(`input[name="${id}-height"]`).forEach((r) => r.addEventListener("change", () => {
    state.height = radioValue(host, `${id}-height`);
    drawShape();
    drawWater();
    announce();
  }));
  gate.addEventListener("input", () => {
    state.gate = Number(gate.value);
    gate.setAttribute("aria-valuetext", GATE_WORDS[state.gate]);
    announce();
  });
  gate.setAttribute("aria-valuetext", GATE_WORDS[0]);

  let wasEmpty = false;
  createLoop(host, (dt) => {
    // המאגר: יוצא לפי השער, נכנס מהנחל
    const out = OUT_FULL * flow();
    state.level = Math.max(0, Math.min(100, state.level + (IN_FLOW - out) * dt));
    drawWater();
    const empty = state.level <= 0.5;
    if (empty !== wasEmpty) { wasEmpty = empty; announce(); }

    const target = output();
    state.shown += (target - state.shown) * Math.min(1, dt * 5);
    if (Math.abs(target - state.shown) < 0.02) state.shown = target;
    meter.set(state.shown);

    if (!calm) {
      state.angle = (state.angle + state.shown * 70 * dt) % 360;
      state.flowOff -= flow() * 160 * dt;
    }
    $(".h-wheel").setAttribute("transform", `rotate(${state.angle.toFixed(1)} 462 ${BASE_Y - 30})`);
    const f = $(".h-flow");
    f.style.strokeDashoffset = state.flowOff.toFixed(1);
    f.style.opacity = flow() > 0 ? "1" : "0";
    $(".h-river").style.strokeDashoffset = (state.flowOff * 0.6).toFixed(1);
  });
}

// =========================================================
// ניסוי 3: חורף מול סוף הקיץ – שבוע שלם
// =========================================================

// ----- כמה מים הנחל מביא בכל שעה, בכל עונה -----
const SEASONS = {
  winter: { name: "חורף",     inflow: 9 },
  summer: { name: "סוף הקיץ", inflow: 2 },
};
const CAPACITY = 100;       // גודל המאגר
const USE_FULL = 12;        // כמה מים בשעה יוצאים בשער פתוח לגמרי
const BLOCKS = [            // חלקי היום שבהם מכוונים את השער
  { key: "night",   name: "לילה",    from: 0,  to: 6 },
  { key: "morning", name: "בוקר",    from: 6,  to: 12 },
  { key: "noon",    name: "צהריים",  from: 12, to: 17 },
  { key: "evening", name: "ערב",     from: 17, to: 24 },
];
const GATE_SHORT = ["סגור", "רבע", "חצי", "שלושה רבעים", "לגמרי"];
const DAYS = 7;

/** מחשב שבוע שלם. מחזיר ייצור, צריכה ומים במאגר לכל שעה */
export function runWeek(season, schedule) {
  let water = CAPACITY;
  const prod = [], need = [], level = [];
  for (let d = 0; d < DAYS; d++) {
    for (let h = 0; h < 24; h++) {
      water = Math.min(CAPACITY, water + SEASONS[season].inflow);
      const block = BLOCKS.find((b) => h >= b.from && h < b.to);
      const g = schedule[block.key] / 4;
      const used = Math.min(water, g * USE_FULL);
      water -= used;
      prod.push((10 * used) / USE_FULL);
      need.push(VILLAGE_NEED[h]);
      level.push(water);
    }
  }
  return { prod, need, level };
}

export function createHydroWeek(host) {
  const id = host.id || "hweek";
  host.classList.add("sim", "sim-day");
  host.innerHTML = `
    <div class="sim-bar">
      <p class="sim-name">שבוע בסכר</p>
      <button type="button" class="btn btn-secondary sim-full"></button>
    </div>
    <fieldset class="sim-control">
      <legend>עונה</legend>
      <div class="seg">
        ${Object.entries(SEASONS).map(([k, s]) => `<label><input type="radio" name="${id}-season" value="${k}"${k === "winter" ? " checked" : ""}><span>${s.name}</span></label>`).join("")}
      </div>
    </fieldset>
    <div class="schedule">
      <p class="schedule-title">פתיחת השער</p>
      ${BLOCKS.map((b) => `
        <div class="schedule-row">
          <label for="${id}-${b.key}"><span class="schedule-name">${b.name}</span> <span class="schedule-hours">${String(b.from).padStart(2, "0")}:00–${String(b.to % 24).padStart(2, "0")}:00</span></label>
          <input type="range" id="${id}-${b.key}" data-block="${b.key}" min="0" max="4" step="1" value="2">
          <output class="schedule-val" for="${id}-${b.key}">חצי</output>
        </div>`).join("")}
    </div>
    <button type="button" class="btn btn-primary day-run">הפעילו שבוע שלם</button>
    <div class="day-chart"></div>
    <p class="chart-legend">
      <span class="legend-item"><span class="legend-line legend-blue" aria-hidden="true"></span>קו כחול: חשמל מהסכר.</span>
      <span class="legend-item"><span class="legend-line legend-orange" aria-hidden="true"></span>קו כתום: כמה חשמל הכפר צריך.</span>
      <span class="legend-item"><span class="legend-bar" aria-hidden="true"></span>עמודות תכלת: כמה מים נשארו במאגר.</span>
    </p>
    <p class="visually-hidden sim-live" aria-live="polite"></p>`;

  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();
  const live = host.querySelector(".sim-live");
  const ticks = Array.from({ length: DAYS }, (_, d) => [d * 24 + 12, `יום ${d + 1}`]);
  const chart = createDayChart(host.querySelector(".day-chart"), {
    lines: [
      { key: "need", color: "#C2611F", dash: "6 4" },
      { key: "prod", color: "#1D3A66" },
    ],
    bars: { key: "level", color: "#BFDDF7", max: CAPACITY },
    gapOf: ["prod", "need"],
    points: DAYS * 24,
    xTicks: ticks,
    label: "גרף של שבוע: חשמל מהסכר, החשמל שהכפר צריך, והמים שנשארו במאגר",
  });

  const schedule = {};
  host.querySelectorAll("[data-block]").forEach((r) => {
    const out = r.parentElement.querySelector("output");
    const sync = () => {
      schedule[r.dataset.block] = Number(r.value);
      out.textContent = GATE_SHORT[Number(r.value)];
      r.setAttribute("aria-valuetext", GATE_SHORT[Number(r.value)]);
    };
    r.addEventListener("input", sync);
    sync();
  });

  let timer = 0;
  host.querySelector(".day-run").addEventListener("click", () => {
    clearInterval(timer);
    const season = radioValue(host, `${id}-season`);
    const data = runWeek(season, schedule);
    const done = () => {
      const short = data.prod.filter((v, h) => v < data.need[h] - 0.25).length;
      live.textContent = `${SEASONS[season].name}: הקו הכחול נמוך מהקו הכתום ב-${short} שעות מתוך ${DAYS * 24}.`;
      host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail: { season, ran: true } }));
    };
    if (calm) { chart.draw(data); done(); return; }
    let h = 0;
    timer = setInterval(() => {
      h = Math.min(DAYS * 24 - 1, h + 4);
      chart.draw(data, h);
      if (h >= DAYS * 24 - 1) { clearInterval(timer); done(); }
    }, 60);
  });
}
