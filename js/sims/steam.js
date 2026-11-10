// =========================================================
// steam.js – התחנה הקיטורית (תחנה 4)
//
// plantDiagram   – התרשים המונפש של כרטיס 2 (המסלול בתחנה).
// createSteamSim – ניסויים 1 ו-3: כמה דלק שורפים, ופחם או גז.
//                  מלאי הדלק יורד, והאונייה ממלאת אותו מדי פעם.
// createSteamWeeks – ניסוי 2: שבועיים באי, והאונייה מתעכבת.
// =========================================================

import { createLoop, createMeter, setupFullscreen, reducedMotion, radioValue } from "./engine.js";
import { createDayChart } from "./chart.js";

// ----- כיול -----
const FUEL_MAX = 5;                         // מחוון הדלק: 0–5
const SMOKE = { coal: 2, gas: 0.8 };        // כמה עשן לכל יחידת דלק (פחם מעשן הרבה יותר)
const BURN_PER_SEC = 0.6;                   // כמה אחוזים מהמלאי נשרפים בשנייה לכל יחידת דלק
const SHIP_EVERY = 40;                      // כל כמה שניות האונייה ממלאת את המלאי

// ----- הציור של התחנה (משותף לתרשים ולהדמיה) -----
function plantSVG(id) {
  return `
    <svg class="gen-svg steam-svg" viewBox="0 0 640 360" role="img" aria-labelledby="${id}-desc">
      <desc id="${id}-desc">תחנה קיטורית: דלק נשרף מתחת לדוד, המים בדוד רותחים לקיטור, הקיטור מסובב טורבינה, הטורבינה מסובבת מחולל, והמחולל מדליק נורה. אחרי הטורבינה הקיטור מתקרר במעבה בעזרת מי ים, וחוזר לדוד כמים.</desc>
      <rect width="640" height="360" fill="#F6F8FB"/>
      <!-- ים -->
      <path d="M470 312 H640 V360 H470 Z" fill="#7FB1E3"/>
      <g class="s-ship"><path d="M560 300 h56 l-8 12 h-40 z" fill="#4A5870"/><rect x="574" y="286" width="22" height="14" fill="#8C99AD"/></g>
      <!-- ארובה ועשן -->
      <rect x="236" y="40" width="22" height="100" fill="#8C99AD"/>
      <g class="s-smoke"></g>
      <!-- דלק -->
      <path d="M30 322 L60 268 L104 268 L120 322 Z" fill="#4A5870"/>
      <path class="s-fuel-feed" d="M110 300 H156"/>
      <!-- הדוד והאש -->
      <rect x="142" y="120" width="84" height="170" rx="14" fill="#C7D0DC" stroke="#4A5870" stroke-width="3"/>
      <rect class="s-boil-water" x="150" y="200" width="68" height="82" rx="8"/>
      <g class="s-flame"><path d="M154 318 q10 -30 20 -6 q8 -28 20 0 q10 -26 20 6 z" fill="#E0A800"/><path d="M164 318 q8 -18 14 -2 q8 -16 14 2 z" fill="#C2611F"/></g>
      <!-- קיטור לטורבינה -->
      <path class="s-pipe" d="M226 150 H300"/>
      <path class="s-steam" d="M226 150 H300"/>
      <!-- טורבינה -->
      <rect x="300" y="112" width="84" height="76" rx="10" fill="#FFFFFF" stroke="#4A5870" stroke-width="3"/>
      <g class="s-wheel">
        <circle cx="342" cy="150" r="26" fill="#E6EDF7" stroke="#4A5870" stroke-width="3"/>
        <path d="M342 124 V176 M316 150 H368 M324 132 L360 168 M360 132 L324 168" stroke="#4A5870" stroke-width="3"/>
      </g>
      <!-- ציר ומחולל -->
      <path d="M384 150 H410" stroke="#4A5870" stroke-width="6"/>
      <rect x="410" y="124" width="56" height="52" rx="8" fill="#A5561F"/>
      <!-- חוטים ונורה -->
      <path class="s-wire" d="M466 140 H560 V112"/>
      <circle class="s-glow" cx="560" cy="88" r="44"/>
      <circle cx="560" cy="88" r="20" fill="#FFFFFF" stroke="#4A5870" stroke-width="3"/>
      <circle class="s-light" cx="560" cy="88" r="17"/>
      <!-- מעבה ומי ים -->
      <path class="s-pipe" d="M342 188 V232"/>
      <path class="s-steam" d="M342 188 V232"/>
      <rect x="296" y="232" width="100" height="58" rx="10" fill="#E6EFF9" stroke="#4A5870" stroke-width="3"/>
      <path class="s-sea-pipe" d="M640 300 H430 V262 H396"/>
      <path class="s-sea-flow" d="M640 300 H430 V262 H396"/>
      <!-- מים חוזרים לדוד -->
      <path class="s-return" d="M296 270 H250 V270 H226"/>
      <path class="s-return-flow" d="M296 270 H226"/>
      <!-- תוויות -->
      <g class="gen-labels steam-labels">
        <text x="75" y="350">דלק</text>
        <text x="184" y="110">דוד</text>
        <text x="263" y="140">קיטור</text>
        <text x="342" y="102">טורבינה</text>
        <text x="438" y="114">מחולל</text>
        <text x="346" y="314">מעבה</text>
        <text x="560" y="276">מי ים לקירור</text>
      </g>
    </svg>`;
}

/** מצייר את התחנה לפי כמות הדלק (0–1) ומחזיר פונקציית ציור לכל פריים */
function plantPainter(root) {
  const $ = (s) => root.querySelector(s);
  const steam = [...root.querySelectorAll(".s-steam")];
  const smokeG = $(".s-smoke");
  const st = { angle: 0, off: 0, puff: 0, t: 0 };
  smokeG.innerHTML = Array.from({ length: 6 }, (_, i) => `<circle data-i="${i}" r="12"/>`).join("");
  const puffs = [...smokeG.children];

  return function paint(dt, { fire, power, smoke, calm }) {
    st.t += dt;
    if (!calm) {
      st.angle = (st.angle + power * 80 * dt) % 360;
      st.off -= fire * 140 * dt;
    }
    $(".s-wheel").setAttribute("transform", `rotate(${st.angle.toFixed(1)} 342 150)`);
    steam.forEach((p) => { p.style.strokeDashoffset = st.off.toFixed(1); p.style.opacity = fire > 0 ? "1" : "0"; });
    $(".s-return-flow").style.strokeDashoffset = (st.off * 0.5).toFixed(1);
    $(".s-return-flow").style.opacity = fire > 0 ? "1" : "0";
    $(".s-sea-flow").style.strokeDashoffset = (st.off * 0.7).toFixed(1);
    $(".s-sea-flow").style.opacity = fire > 0 ? "1" : "0";
    const flame = $(".s-flame");
    flame.style.transformOrigin = "184px 318px";
    flame.style.scale = `1 ${Math.max(0.001, fire).toFixed(3)}`;
    flame.style.opacity = fire > 0 ? "1" : "0";
    const b = power / 10;
    $(".s-light").style.opacity = b.toFixed(3);
    $(".s-glow").style.opacity = (b * 0.8).toFixed(3);
    // עשן עולה מהארובה
    puffs.forEach((c) => {
      const i = Number(c.dataset.i);
      const phase = calm ? i / 6 : ((st.t * 0.35 + i / 6) % 1);
      c.setAttribute("cx", (247 + phase * 40 + Math.sin(phase * 6 + i) * 6).toFixed(1));
      c.setAttribute("cy", (40 - phase * 36).toFixed(1));
      c.setAttribute("r", (8 + phase * 14).toFixed(1));
      c.style.opacity = ((smoke / 10) * (1 - phase) * 0.9).toFixed(3);
    });
  };
}

/** התרשים המונפש של כרטיס 2 */
export function plantDiagram(host) {
  host.innerHTML = plantSVG(host.id || "plant");
  const paint = plantPainter(host);
  const calm = reducedMotion();
  createLoop(host, (dt) => paint(dt, { fire: 0.6, power: 6, smoke: 4, calm }));
}

// =========================================================
// ניסויים 1 ו-3
// =========================================================
export function createSteamSim(host) {
  const id = host.id || "steam";
  host.classList.add("sim");
  host.innerHTML = `
    <div class="sim-bar">
      <p class="sim-name">התחנה שליד הנמל</p>
      <button type="button" class="btn btn-secondary sim-full"></button>
    </div>
    <p class="sim-intro">לפניכם תחנה קיטורית פתוחה. עקבו אחרי האנרגיה מהדלק ועד הנורה.</p>
    <div class="sim-main">
      <div class="sim-stage">${plantSVG(id)}</div>
      <div class="sim-side steam-side">
        <div class="steam-meter-power"></div>
        <div class="steam-meter-smoke"></div>
        <div class="level">
          <p class="meter-label" id="${id}-stock-label">מלאי דלק</p>
          <div class="level-bar level-fuel" role="meter" aria-labelledby="${id}-stock-label" aria-valuemin="0" aria-valuemax="100"><span class="level-fill"></span></div>
        </div>
      </div>
    </div>
    <div class="sim-controls">
      <div class="sim-control sim-speed">
        <label for="${id}-fuel">דלק</label>
        <input type="range" id="${id}-fuel" min="0" max="${FUEL_MAX}" step="1" value="0">
        <div class="range-ends" aria-hidden="true"><span>0</span><span>${FUEL_MAX}</span></div>
      </div>
      <fieldset class="sim-control">
        <legend>סוג הדלק</legend>
        <div class="seg">
          <label><input type="radio" name="${id}-type" value="coal" checked><span>פחם</span></label>
          <label><input type="radio" name="${id}-type" value="gas"><span>גז</span></label>
        </div>
      </fieldset>
    </div>
    <p class="visually-hidden sim-live" aria-live="polite"></p>`;

  const power = createMeter(host.querySelector(".steam-meter-power"));
  const smoke = createMeter(host.querySelector(".steam-meter-smoke"), { label: "מד עשן" });
  host.querySelector(".steam-meter-smoke .meter").classList.add("meter-smoke");
  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();
  const paint = plantPainter(host);
  const fuel = host.querySelector(`#${id}-fuel`);
  const live = host.querySelector(".sim-live");
  const levelBar = host.querySelector(".level-bar");
  const levelFill = host.querySelector(".level-fill");
  const ship = host.querySelector(".s-ship");

  const state = { fuel: 0, type: "coal", stock: 100, shipT: 0, shipShow: 0, pw: 0, sm: 0 };
  const burning = () => (state.stock > 0 ? state.fuel : 0);
  const outPower = () => burning() * 2;
  const outSmoke = () => Math.min(10, burning() * SMOKE[state.type]);

  let liveTimer = 0;
  function announce() {
    const detail = { fuel: state.fuel, type: state.type, value: Math.round(outPower()), smoke: Math.round(outSmoke()) };
    host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = `דלק ${state.fuel} מתוך ${FUEL_MAX}, ${state.type === "coal" ? "פחם" : "גז"}. מד חשמל: ${detail.value}. מד עשן: ${detail.smoke}. מלאי דלק: ${Math.round(state.stock)} מתוך 100.`;
    }, 700);
  }
  fuel.addEventListener("input", () => { state.fuel = Number(fuel.value); announce(); });
  host.querySelectorAll(`input[name="${id}-type"]`).forEach((r) => r.addEventListener("change", () => {
    state.type = radioValue(host, `${id}-type`);
    announce();
  }));

  let wasEmpty = false;
  createLoop(host, (dt) => {
    state.stock = Math.max(0, state.stock - burning() * BURN_PER_SEC * dt);
    // האונייה מגיעה וממלאת את המלאי
    state.shipT += dt;
    if (state.shipT >= SHIP_EVERY) {
      state.shipT = 0;
      state.stock = 100;
      state.shipShow = 3;
      announce();
    }
    state.shipShow = Math.max(0, state.shipShow - dt);
    ship.style.opacity = state.shipShow > 0 ? "1" : "0";
    levelFill.style.height = `${state.stock.toFixed(1)}%`;
    levelBar.setAttribute("aria-valuenow", String(Math.round(state.stock)));
    const empty = state.stock <= 0;
    if (empty !== wasEmpty) { wasEmpty = empty; announce(); }

    state.pw += (outPower() - state.pw) * Math.min(1, dt * 4);
    state.sm += (outSmoke() - state.sm) * Math.min(1, dt * 3);
    power.set(state.pw);
    smoke.set(state.sm);
    paint(dt, { fire: burning() / FUEL_MAX, power: state.pw, smoke: state.sm, calm });
  });
}

// =========================================================
// ניסוי 2: שבועיים באי, והאונייה מתעכבת
// =========================================================
const STOCK_FULL = 70;   // כמה דלק האונייה מביאה בכל פעם
const DAY_NEED = 5;      // כמה חשמל הכפר צריך ביום, בממוצע

/** מחשב שבועיים. fuel = כמה דלק שורפים ביום (1–5) */
export function runTwoWeeks(fuel, delayed) {
  let stock = STOCK_FULL;
  const prod = [], need = [], level = [];
  for (let d = 0; d < 14; d++) {
    if (d === 7 && !delayed) stock = STOCK_FULL;
    const burn = Math.min(stock, fuel * 2);
    stock -= burn;
    prod.push(burn);          // כל יחידת דלק = יחידת חשמל
    need.push(DAY_NEED);
    level.push(stock);
  }
  return { prod, need, level };
}

export function createSteamWeeks(host) {
  const id = host.id || "sweeks";
  host.classList.add("sim", "sim-day");
  host.innerHTML = `
    <div class="sim-bar">
      <p class="sim-name">שבועיים באי</p>
      <button type="button" class="btn btn-secondary sim-full"></button>
    </div>
    <div class="sim-control">
      <label for="${id}-fuel">דלק</label>
      <input type="range" id="${id}-fuel" min="1" max="${FUEL_MAX}" step="1" value="${FUEL_MAX}">
      <div class="range-ends" aria-hidden="true"><span>1</span><span>${FUEL_MAX}</span></div>
    </div>
    <div class="weeks-actions">
      <button type="button" class="btn btn-secondary weeks-delay" aria-pressed="false">האונייה מתעכבת</button>
      <button type="button" class="btn btn-primary day-run">הפעילו שבועיים</button>
    </div>
    <div class="day-chart"></div>
    <p class="chart-legend">
      <span class="legend-item"><span class="legend-line legend-blue" aria-hidden="true"></span>קו כחול: חשמל מהתחנה.</span>
      <span class="legend-item"><span class="legend-line legend-orange" aria-hidden="true"></span>קו כתום: כמה חשמל הכפר צריך.</span>
      <span class="legend-item"><span class="legend-bar legend-fuel" aria-hidden="true"></span>עמודות: מלאי הדלק.</span>
    </p>
    <p class="visually-hidden sim-live" aria-live="polite"></p>`;

  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();
  const live = host.querySelector(".sim-live");
  const fuel = host.querySelector(`#${id}-fuel`);
  const delayBtn = host.querySelector(".weeks-delay");
  const chart = createDayChart(host.querySelector(".day-chart"), {
    lines: [
      { key: "need", color: "#C2611F", dash: "8 5" },
      { key: "prod", color: "#1D3A66" },
    ],
    bars: { key: "level", color: "#D9C2A8", max: STOCK_FULL },
    gapOf: ["prod", "need"],
    points: 14,
    xTicks: [[0, "יום 1"], [6, "יום 7"], [13, "יום 14"]],
    label: "גרף של שבועיים: חשמל מהתחנה, החשמל שהכפר צריך, ומלאי הדלק",
  });

  delayBtn.addEventListener("click", () => {
    const on = delayBtn.getAttribute("aria-pressed") !== "true";
    delayBtn.setAttribute("aria-pressed", String(on));
  });
  fuel.addEventListener("input", () => fuel.setAttribute("aria-valuetext", fuel.value));

  let timer = 0;
  host.querySelector(".day-run").addEventListener("click", () => {
    clearInterval(timer);
    const delayed = delayBtn.getAttribute("aria-pressed") === "true";
    const data = runTwoWeeks(Number(fuel.value), delayed);
    const done = () => {
      const dark = data.prod.filter((v) => v === 0).length;
      const short = data.prod.filter((v, d) => v < data.need[d]).length;
      live.textContent = `${short} ימים מתוך 14 בלי מספיק חשמל. ${dark} ימים בלי חשמל בכלל.`;
      host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail: { delayed, ran: true } }));
    };
    if (calm) { chart.draw(data); done(); return; }
    let d = 0;
    chart.draw(data, 0);
    timer = setInterval(() => {
      d += 1;
      chart.draw(data, d);
      if (d >= 13) { clearInterval(timer); done(); }
    }, 280);
  });
}
