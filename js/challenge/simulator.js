// =========================================================
// simulator.js – המסך של סימולטור "אי האנרגיה"
//
// • מפה: גוררים תחנות למקומות שלהן (או משתמשים בכפתורים).
// • בדיקת התוכנית: שלושה ימים, גרף שעה אחרי שעה, והכפר נכבה
//   במפה בשעות של חוסר.
// • שלושה מדדים (חושך, כסף, אוויר) ומשפט מנעמה.
// • כל ניסיון נשמר ברשימה. קוד תוכנית משחזר אותה במחשב אחר.
// • הכנת ההגשה: בוחרים ניסיון ומעתיקים סיכום לטופס.
//
// כל המספרים נמצאים ב-model.js.
// =========================================================

import * as M from "./model.js";
import { load, save } from "../storage.js";
import { createDayChart } from "../sims/chart.js";
import { islandBase, PLACES } from "../sims/island.js";
import { setupFullscreen, reducedMotion } from "../sims/engine.js";
import { createCopyPoint } from "../ui/copy.js";
import { config } from "../config.js";
import { markStationDone } from "../progress.js";
import { icon } from "../ui/icons.js";

const $ = (s, root = document) => root.querySelector(s);
const calm = reducedMotion();
const hh = (h) => `${String(h).padStart(2, "0")}:00`;

// ----- הודעות מתוך מסמך התוכן -----
const MSG = {
  dark: (h) => `בשעה ${hh(h)} הכפר נכבה. המרפאה עברה לפנסים.`,
  budget: "אין מספיק מטבעות. הסירו תחנה או בחרו תחנה קטנה יותר.",
  place: (where) => `את התחנה הזו אפשר לבנות רק ב${where}.`,
  surplus: "האי מייצר הרבה יותר ממה שהוא צריך. אולי אפשר לחסוך כסף?",
  maxTurbines: "אפשר לבנות עד 6 טורבינות.",
};
const NAAMA = {
  allLit: "הכפר מואר בכל שלושת הימים! עכשיו שווה לבדוק אם אפשר לחסוך כסף או עשן.",
  calmOnly: "ביום שקט האי נכבה. מה יכול לייצר חשמל כשאין רוח?",
  summerOnly: "בקיץ היבש נגמר החשמל בערב. אולי אפשר לחסוך מים לשעות האלה?",
  smoke: "הכפר מואר, אבל השמיים אפורים. אפשר להסתדר עם פחות דלק?",
};
// איפה מותר לבנות כל סוג (למשפט "אפשר לבנות רק ב…")
const WHERE = {
  turbine: "רכס הרוחות, בחוף או בעמק התאנים",
  dam: "נחל השחף",
  steam: "נמל הדייגים",
};
const KIND_SITE = { dam: "falls", small: "port", large: "port" };
const TURBINE_SITES = ["ridge", "coast", "valley"];
const MAP_SITES = { ridge: "ridge", coast: "coast", valley: "valley", falls: "falls", port: "port" };

// ----- שמירה -----
function loadState() {
  // אם מה שנשמר פגום – מתחילים מתוכנית ריקה, בלי לקרוס
  try {
    const s = load("challenge", null);
    const plan = s && s.plan ? M.parseCode(M.planCode(s.plan)) : null;
    const attempts = (s && Array.isArray(s.attempts))
      ? s.attempts.filter((a) => a && a.code && Array.isArray(a.dark))
      : [];
    return { plan: plan || M.emptyPlan(), attempts };
  } catch {
    return { plan: M.emptyPlan(), attempts: [] };
  }
}
const state = loadState();
const persist = () => save("challenge", { plan: state.plan, attempts: state.attempts });

// ----- סמלים -----
const ICONS = {
  turbine: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M15 30 L15.6 13 h0.8 L17 30 Z" fill="#fff" stroke="#4A5870"/><g stroke="#1D3A66" stroke-width="2.6" stroke-linecap="round"><path d="M16 12 V2"/><path d="M16 12 L24.5 17"/><path d="M16 12 L7.5 17"/></g><circle cx="16" cy="12" r="2.2" fill="#A5561F"/></svg>',
  dam: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M2 8 H12 L14 28 H2 Z" fill="#7FB1E3"/><path d="M12 4 H18 L22 28 H14 Z" fill="#8C99AD" stroke="#4A5870"/><path d="M22 24 H30" stroke="#4F86C6" stroke-width="3"/></svg>',
  small: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="16" width="18" height="12" fill="#A9B5C6" stroke="#4A5870"/><rect x="18" y="6" width="4" height="10" fill="#8C99AD"/><circle cx="22" cy="4" r="2.5" fill="#B5BFCC"/></svg>',
  large: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="12" width="26" height="16" fill="#8C99AD" stroke="#4A5870"/><rect x="18" y="2" width="5" height="10" fill="#6F7F96"/><rect x="24" y="4" width="4" height="8" fill="#6F7F96"/><circle cx="21" cy="1.5" r="2.5" fill="#8593A8"/></svg>',
};
const METRIC_ICONS = {
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="#1D3A66"/></svg>',
  money: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FFCF4A" stroke="#9A5B00" stroke-width="1.8"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#9A5B00" stroke-width="1.5"/></svg>',
  air: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 9.5 4.3 4.3 0 0 0 7 18z" fill="#8593A8"/></svg>',
};

// =========================================================
// ימי הבדיקה (בחלק "הכללים")
// =========================================================
$("#ch-days").innerHTML = M.DAYS.map((d) => `<dt>${d.name}</dt><dd>${d.text}</dd>`).join("");

// =========================================================
// בניית המסך
// =========================================================
const host = $("#ch-sim");
host.className = "sim ch-sim";
const blockBoxes = (name) => M.BLOCKS.map((b, i) => `
  <label class="ch-check"><input type="checkbox" data-${name}="${i}"><span>${b.name} <span class="ch-hours">${hh(b.from)}–${hh(b.to % 24)}</span></span></label>`).join("");

host.innerHTML = `
  <div class="sim-bar">
    <p class="sim-name">אי האנרגיה</p>
    <button type="button" class="btn btn-secondary sim-full"></button>
  </div>
  <div class="ch-grid">
    <div class="ch-map-col">
      <ul class="ch-palette" aria-label="תחנות שאפשר לגרור למפה">
        <li><span class="ch-chip" data-kind="turbine">${ICONS.turbine}<span>טורבינת רוח<span class="ch-price">10</span></span></span></li>
        <li><span class="ch-chip" data-kind="dam">${ICONS.dam}<span>סכר<span class="ch-price">35</span></span></span></li>
        <li><span class="ch-chip" data-kind="small">${ICONS.small}<span>קיטורית קטנה<span class="ch-price">20</span></span></span></li>
        <li><span class="ch-chip" data-kind="large">${ICONS.large}<span>קיטורית גדולה<span class="ch-price">35</span></span></span></li>
      </ul>
      <div class="ch-map">
        <svg class="map-svg ch-map-svg" viewBox="0 0 640 400" role="img" aria-labelledby="ch-map-desc">
          <desc id="ch-map-desc"></desc>
          ${islandBase({ labels: ["ridge", "coast", "valley", "falls", "port", "village"] })}
          <g class="ch-sites">${Object.keys(MAP_SITES).map((k) => `<circle class="map-spot" data-site="${k}" cx="${PLACES[k].x}" cy="${PLACES[k].y}" r="30"/>`).join("")}</g>
          <g class="ch-built"></g>
          <g class="ch-village"></g>
        </svg>
      </div>
      <p class="sim-tip">גררו תחנה אל המקום שלה במפה, או בנו בכפתורים שליד המפה.</p>
    </div>

    <div class="ch-build-col">
      <div class="ch-budget">
        <p class="ch-budget-text">${METRIC_ICONS.money}<span>מטבעות: <strong class="ch-cost">0</strong> מתוך ${M.BUDGET}</span></p>
        <div class="ch-budget-bar" aria-hidden="true"><span></span></div>
      </div>

      <fieldset class="ch-group">
        <legend>טורבינות רוח</legend>
        ${TURBINE_SITES.map((s) => `
          <div class="ch-count-row">
            <span class="ch-count-name" id="ch-t-${s}">${M.SITES[s].name}</span>
            <button type="button" class="ch-step" data-turbine="${s}" data-delta="-1" aria-label="להוריד טורבינה מ${M.SITES[s].name}">−</button>
            <output class="ch-count" data-count="${s}" aria-labelledby="ch-t-${s}">0</output>
            <button type="button" class="ch-step" data-turbine="${s}" data-delta="1" aria-label="להוסיף טורבינה ב${M.SITES[s].name}">+</button>
          </div>`).join("")}
      </fieldset>

      <fieldset class="ch-group">
        <legend>סכר ותחנה הידרואלקטרית</legend>
        <button type="button" class="btn btn-secondary ch-dam-toggle" aria-pressed="false"></button>
        <div class="ch-sched" data-for="dam">
          <p class="ch-sched-title">באילו שעות פותחים את השער?</p>
          ${blockBoxes("gate")}
        </div>
      </fieldset>

      <fieldset class="ch-group">
        <legend>תחנה קיטורית</legend>
        <div class="seg">
          <label><input type="radio" name="ch-steam" value="none"><span>בלי</span></label>
          <label><input type="radio" name="ch-steam" value="small"><span>קטנה</span></label>
          <label><input type="radio" name="ch-steam" value="large"><span>גדולה</span></label>
        </div>
        <div class="ch-sched" data-for="steam">
          <p class="ch-sched-title">באילו שעות היא עובדת?</p>
          ${blockBoxes("steam")}
        </div>
      </fieldset>

      <div class="ch-messages" role="status" aria-live="polite"></div>

      <p class="ch-code-line">קוד תוכנית: <code class="ch-code"></code></p>
      <button type="button" class="btn btn-primary btn-large ch-run">בדיקת התוכנית</button>

      <details class="ch-load">
        <summary>טעינת תוכנית</summary>
        <label for="ch-load-input">הדביקו כאן קוד תוכנית:</label>
        <div class="ch-load-row">
          <input type="text" id="ch-load-input" dir="ltr" autocomplete="off" spellcheck="false">
          <button type="button" class="btn btn-secondary ch-load-btn">טעינת תוכנית</button>
        </div>
        <p class="ch-load-msg" role="status"></p>
      </details>
    </div>
  </div>

  <div class="ch-results" hidden>
    <div class="ch-metrics">
      <div class="ch-metric">${METRIC_ICONS.dark}<p><span class="ch-metric-name">חושך</span><strong class="ch-m-dark"></strong><span class="ch-metric-desc">כמה שעות בשלושת הימים הכפר היה בלי חשמל.</span></p></div>
      <div class="ch-metric">${METRIC_ICONS.money}<p><span class="ch-metric-name">כסף</span><strong class="ch-m-money"></strong><span class="ch-metric-desc">כמה מטבעות הוצאו, כולל דלק.</span></p></div>
      <div class="ch-metric">${METRIC_ICONS.air}<p><span class="ch-metric-name">אוויר</span><strong class="ch-m-air"></strong><span class="ch-metric-desc">כמה עשן עלה מעל האי (נקי / מעט עשן / הרבה עשן).</span></p></div>
    </div>
    <p class="feedback feedback-note ch-naama" hidden></p>
    <ul class="ch-events"></ul>
    <div class="ch-charts">
      ${M.DAYS.map((d, i) => `<figure class="ch-chart"><figcaption>${d.name}</figcaption><div class="ch-chart-box" data-day="${i}"></div></figure>`).join("")}
    </div>
    <p class="chart-legend">
      <span class="legend-item"><span class="legend-line legend-blue" aria-hidden="true"></span>קו כחול: החשמל שהאי מייצר.</span>
      <span class="legend-item"><span class="legend-line legend-orange" aria-hidden="true"></span>קו כתום: כמה חשמל הכפר צריך.</span>
      <span class="legend-item"><span class="legend-bar legend-gap" aria-hidden="true"></span>רקע אפור: שעות של חושך.</span>
    </p>
  </div>

  <div class="ch-attempts">
    <h3>הניסיונות שלכם</h3>
    <p class="ch-no-attempts">עוד לא בדקתם תוכנית.</p>
    <div class="table-scroll">
      <table class="ch-table ch-attempts-table" hidden>
        <thead><tr><th scope="col">ניסיון</th><th scope="col">תחנות</th><th scope="col">עלות</th><th scope="col">שעות חושך<br><span class="ch-sub">סוער / שקט / קיץ</span></th><th scope="col">עשן</th><th scope="col"><span class="visually-hidden">פעולות</span></th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <button type="button" class="btn btn-primary ch-prepare" hidden>הכנת ההגשה</button>
  </div>`;

setupFullscreen($(".sim-full", host), host);

const charts = M.DAYS.map((d, i) => createDayChart($(`.ch-chart-box[data-day="${i}"]`, host), {
  lines: [
    { key: "need", color: "#C2611F", dash: "8 5" },
    { key: "prod", color: "#1D3A66" },
  ],
  gapOf: ["prod", "need"],
  label: `${d.name}: החשמל שהאי מייצר מול החשמל שהכפר צריך`,
}));

// =========================================================
// ציור המפה
// =========================================================
const VILLAGE = [[470, 262], [496, 270], [522, 258], [486, 232], [512, 236]];
function drawVillage(lit) {
  $(".ch-village", host).innerHTML = VILLAGE.map(([x, y]) =>
    `<rect x="${x - 4}" y="${y - 8}" width="8" height="6" rx="1" fill="${lit ? "#FFCF4A" : "#12284A"}"/>`).join("");
}

function drawBuilt() {
  const p = state.plan;
  let g = "";
  TURBINE_SITES.forEach((s) => {
    const n = p.turbines[s];
    for (let i = 0; i < n; i++) {
      const x = PLACES[s].x - 30 + (i % 3) * 22;
      const y = PLACES[s].y - 34 - Math.floor(i / 3) * 30;
      g += `<g transform="translate(${x} ${y}) scale(0.9)">${ICONS.turbine.replace('<svg viewBox="0 0 32 32" aria-hidden="true">', "").replace("</svg>", "")}</g>`;
    }
  });
  const inner = (k) => ICONS[k].replace('<svg viewBox="0 0 32 32" aria-hidden="true">', "").replace("</svg>", "");
  if (p.dam) g += `<g transform="translate(${PLACES.falls.x - 24} ${PLACES.falls.y - 24}) scale(1.5)">${inner("dam")}</g>`;
  if (p.steam !== "none") g += `<g transform="translate(${PLACES.port.x - 24} ${PLACES.port.y - 58}) scale(1.5)">${inner(p.steam)}</g>`;
  $(".ch-built", host).innerHTML = g;
  $("#ch-map-desc").textContent = `מפת האי. התוכנית: ${M.describe(p)}.`;
}

// =========================================================
// עדכון הפקדים לפי התוכנית
// =========================================================
const msgBox = $(".ch-messages", host);
function say(text) {
  msgBox.innerHTML = text ? `<p class="feedback feedback-retry">${text}</p>` : "";
}

function render() {
  const p = state.plan;
  TURBINE_SITES.forEach((s) => { $(`[data-count="${s}"]`, host).textContent = p.turbines[s]; });
  const damBtn = $(".ch-dam-toggle", host);
  damBtn.setAttribute("aria-pressed", String(p.dam));
  damBtn.textContent = p.dam ? "להסיר את הסכר" : "לבנות סכר";
  $('.ch-sched[data-for="dam"]', host).hidden = !p.dam;
  host.querySelectorAll("[data-gate]").forEach((c) => { c.checked = p.gateOn[Number(c.dataset.gate)]; });
  host.querySelectorAll('input[name="ch-steam"]').forEach((r) => { r.checked = r.value === p.steam; });
  $('.ch-sched[data-for="steam"]', host).hidden = p.steam === "none";
  host.querySelectorAll("[data-steam]").forEach((c) => { c.checked = p.steamOn[Number(c.dataset.steam)]; });

  const cost = M.totalCost(p);
  $(".ch-cost", host).textContent = cost;
  const bar = $(".ch-budget-bar span", host);
  bar.style.width = `${Math.min(100, cost)}%`;
  $(".ch-budget", host).classList.toggle("is-over", cost > M.BUDGET);
  $(".ch-code", host).textContent = M.planCode(p);
  drawBuilt();
  persist();
}

/** מנסה לשנות את התוכנית. אם אין מספיק מטבעות – לא משנה ומודיע */
function tryChange(mutate) {
  const next = JSON.parse(JSON.stringify(state.plan));
  mutate(next);
  if (M.totalCost(next) > M.BUDGET && M.totalCost(next) > M.totalCost(state.plan)) {
    say(MSG.budget);
    render();
    return false;
  }
  if (M.turbineCount(next) > M.MAX_TURBINES) {
    say(MSG.maxTurbines);
    return false;
  }
  state.plan = next;
  say("");
  render();
  return true;
}

host.querySelectorAll("[data-turbine]").forEach((b) => b.addEventListener("click", () => {
  const s = b.dataset.turbine;
  const d = Number(b.dataset.delta);
  tryChange((p) => { p.turbines[s] = Math.max(0, p.turbines[s] + d); });
}));
$(".ch-dam-toggle", host).addEventListener("click", () => tryChange((p) => { p.dam = !p.dam; }));
host.querySelectorAll("[data-gate]").forEach((c) => c.addEventListener("change", () =>
  tryChange((p) => { p.gateOn[Number(c.dataset.gate)] = c.checked; })));
host.querySelectorAll('input[name="ch-steam"]').forEach((r) => r.addEventListener("change", () =>
  tryChange((p) => { p.steam = r.value; })));
host.querySelectorAll("[data-steam]").forEach((c) => c.addEventListener("change", () =>
  tryChange((p) => { p.steamOn[Number(c.dataset.steam)] = c.checked; })));

// =========================================================
// גרירה מהלוח אל המפה
// =========================================================
const svg = $(".ch-map-svg", host);
function siteAt(clientX, clientY) {
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm.inverse());
  let best = null, bestD = 48;
  Object.keys(MAP_SITES).forEach((k) => {
    const d = Math.hypot(PLACES[k].x - p.x, PLACES[k].y - p.y);
    if (d < bestD) { best = k; bestD = d; }
  });
  return best;
}
function dropOn(kind, site) {
  if (kind === "turbine") {
    if (!TURBINE_SITES.includes(site)) { say(MSG.place(WHERE.turbine)); return; }
    tryChange((p) => { p.turbines[site] += 1; });
  } else if (kind === "dam") {
    if (site !== "falls") { say(MSG.place(WHERE.dam)); return; }
    tryChange((p) => { p.dam = true; });
  } else {
    if (site !== "port") { say(MSG.place(WHERE.steam)); return; }
    tryChange((p) => { p.steam = kind; if (!p.steamOn.some(Boolean)) p.steamOn = [false, false, true, true]; });
  }
}
host.querySelectorAll(".ch-chip").forEach((chip) => {
  let ghost = null;
  chip.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    chip.setPointerCapture(e.pointerId);
    ghost = chip.cloneNode(true);
    ghost.classList.add("ch-ghost");
    ghost.setAttribute("aria-hidden", "true");
    document.body.append(ghost);
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  });
  chip.addEventListener("pointermove", (e) => {
    if (!ghost) return;
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    const s = siteAt(e.clientX, e.clientY);
    host.querySelectorAll(".map-spot").forEach((c) => c.classList.toggle("is-on", c.dataset.site === s));
  });
  const end = (e) => {
    if (!ghost) return;
    ghost.remove();
    ghost = null;
    host.querySelectorAll(".map-spot").forEach((c) => c.classList.remove("is-on"));
    const s = e.type === "pointerup" ? siteAt(e.clientX, e.clientY) : null;
    if (s) dropOn(chip.dataset.kind, s);
  };
  chip.addEventListener("pointerup", end);
  chip.addEventListener("pointercancel", end);
});

// =========================================================
// בדיקת התוכנית
// =========================================================
const results = $(".ch-results", host);
let running = 0;

function naamaLine(res) {
  const byDay = Object.fromEntries(res.days.map((d) => [d.key, d.dark.length]));
  if (res.darkHours === 0) return res.smokeName === "הרבה" ? NAAMA.smoke : NAAMA.allLit;
  if (byDay.calm && !byDay.storm && !byDay.summer) return NAAMA.calmOnly;
  if (byDay.summer && !byDay.storm && !byDay.calm) return NAAMA.summerOnly;
  return "";
}

function showSummary(res) {
  $(".ch-m-dark", host).textContent = res.darkHours === 1 ? "שעה אחת" : `${res.darkHours} שעות`;
  $(".ch-m-money", host).textContent = `${res.cost} מתוך ${M.BUDGET}`;
  $(".ch-m-air", host).textContent = res.smokeName === "נקי" ? "נקי" : `${res.smokeName} עשן`;
  const line = naamaLine(res);
  const nm = $(".ch-naama", host);
  nm.hidden = !line;
  nm.innerHTML = line ? `<strong>נעמה:</strong> "${line}"` : "";
  const ev = [];
  res.days.forEach((d, i) => {
    if (d.dark.length) ev.push(`<li><strong>${M.DAYS[i].name}:</strong> ${MSG.dark(d.dark[0])}</li>`);
  });
  if (res.surplus) ev.push(`<li>${MSG.surplus}</li>`);
  $(".ch-events", host).innerHTML = ev.join("");
}

function saveAttempt(res) {
  const n = state.attempts.length + 1;
  state.attempts.push({
    n,
    code: M.planCode(state.plan),
    desc: M.describe(state.plan),
    cost: res.cost,
    dark: res.days.map((d) => d.dark.length),
    smoke: res.smokeName,
  });
  persist();
  renderAttempts();
}

$(".ch-run", host).addEventListener("click", () => {
  if (M.totalCost(state.plan) > M.BUDGET) { say(MSG.budget); return; }
  clearInterval(running);
  const res = M.runPlan(state.plan);
  results.hidden = false;
  $(".ch-naama", host).hidden = true;
  $(".ch-events", host).innerHTML = "";
  $(".ch-m-dark", host).textContent = "…";
  $(".ch-m-money", host).textContent = "…";
  $(".ch-m-air", host).textContent = "…";
  charts.forEach((c) => c.draw({}, -1));
  const finish = () => {
    drawVillage(true);
    showSummary(res);
    saveAttempt(res);
  };
  if (calm) {
    res.days.forEach((d, i) => charts[i].draw(d));
    finish();
    return;
  }
  let step = 0;
  running = setInterval(() => {
    const day = Math.floor(step / 24);
    const h = step % 24;
    const d = res.days[day];
    charts[day].draw(d, h);
    drawVillage(!d.dark.includes(h));
    step += 1;
    if (step >= 72) { clearInterval(running); finish(); }
  }, 45);
  results.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// =========================================================
// טעינת תוכנית מקוד
// =========================================================
$(".ch-load-btn", host).addEventListener("click", () => {
  const p = M.parseCode($("#ch-load-input").value);
  const msg = $(".ch-load-msg", host);
  if (!p) {
    // [ממתין לאישור אודי] הודעה כשהקוד לא תקין
    msg.textContent = "הקוד הזה לא מוכר. בדקו שהעתקתם אותו בשלמותו.";
    return;
  }
  state.plan = p;
  msg.textContent = "";
  say("");
  render();
});

// =========================================================
// רשימת הניסיונות
// =========================================================
function renderAttempts() {
  const table = $(".ch-attempts-table", host);
  const has = state.attempts.length > 0;
  table.hidden = !has;
  $(".ch-no-attempts", host).hidden = has;
  $(".ch-prepare", host).hidden = !has;
  table.querySelector("tbody").innerHTML = state.attempts.slice().reverse().map((a) => `
    <tr>
      <th scope="row">${a.n}</th>
      <td>${a.desc}</td>
      <td>${a.cost}</td>
      <td class="ch-num">${a.dark.join(" / ")}</td>
      <td>${a.smoke}</td>
      <td><button type="button" class="btn btn-ghost ch-reload" data-code="${a.code}" aria-label="לטעון את ניסיון ${a.n}">טעינה</button></td>
    </tr>`).join("");
  table.querySelectorAll(".ch-reload").forEach((b) => b.addEventListener("click", () => {
    const p = M.parseCode(b.dataset.code);
    if (p) { state.plan = p; say(""); render(); host.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }));
  renderSubmitOptions();
}

// =========================================================
// הכנת ההגשה
// =========================================================
const submit = $("#ch-submit");
const submitBody = $("#ch-submit-body");
submit.hidden = true;
submitBody.innerHTML = `
  <ol class="card rules">
    <li>בחרו את הניסיון שאתם מגישים.</li>
    <li>לחצו "העתקה".</li>
    <li>פתחו את טופס ההגשה והדביקו.</li>
  </ol>
  <div class="card">
    <label class="question" for="ch-pick">הניסיון שאתם מגישים</label>
    <select id="ch-pick" class="ch-pick"></select>
    <div id="ch-copy"></div>
  </div>`;
const pick = $("#ch-pick");

function attemptText(a) {
  if (!a) return "";
  const names = M.DAYS.map((d) => d.short);
  return [
    `תוכנית לאי האלמוג – ניסיון ${a.n}`,
    `תחנות: ${a.desc}`,
    `עלות: ${a.cost} מתוך ${M.BUDGET} מטבעות`,
    `${names[0]}: ${a.dark[0]} שעות חושך | ${names[1]}: ${a.dark[1]} | ${names[2]}: ${a.dark[2]}`,
    `עשן: ${a.smoke}`,
    `מספר ניסיונות: ${state.attempts.length}`,
    `קוד תוכנית: ${a.code}`,
  ].join("\n");
}
let userPicked = false; // אם התלמיד בחר ניסיון בעצמו – שומרים על הבחירה שלו
function renderSubmitOptions() {
  const keep = userPicked ? pick.value : "";
  pick.innerHTML = state.attempts.slice().reverse().map((a) =>
    `<option value="${a.n}">ניסיון ${a.n}: ${a.cost} מטבעות, ${a.dark.reduce((x, y) => x + y, 0)} שעות חושך, עשן ${a.smoke}</option>`).join("");
  if (keep && state.attempts.some((a) => String(a.n) === keep)) pick.value = keep;
  if (copy) copy.refresh();
}
const copy = createCopyPoint($("#ch-copy"), {
  message: "",
  getText: () => attemptText(state.attempts.find((a) => String(a.n) === pick.value)),
  link: { url: config.challengeForm, label: "פתיחת טופס ההגשה" },
});
pick.addEventListener("change", () => { userPicked = true; copy.refresh(); });

$(".ch-prepare", host).addEventListener("click", () => {
  submit.hidden = false;
  markStationDone("challenge");
  copy.refresh();
  submit.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  $("#ch-submit-title").setAttribute("tabindex", "-1");
  $("#ch-submit-title").focus({ preventScroll: true });
});

// =========================================================
drawVillage(true);
render();
renderAttempts();
