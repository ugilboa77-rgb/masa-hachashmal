// =========================================================
// wind.js – הדמיות טורבינת הרוח (תחנה 2, מעבדה)
//
// createWindSim – ניסויים 1 ו-2: מהירות הרוח וכיוון הרוח.
// createWindDay – ניסוי 3: יום שלם באי. מציבים טורבינה ברכס,
//                 בחוף או בעמק, ומפעילים יממה עם גרף.
//
// אפשר לשנות את המספרים בטבלאות שלמטה.
// =========================================================

import { createLoop, createMeter, setupFullscreen, reducedMotion, radioValue } from "./engine.js";
import { islandBase, windArrows, PLACES } from "./island.js";
import { createDayChart } from "./chart.js";

// ----- כמה חשמל בכל מצב רוח (0–10). בסערה עוצרים את הטורבינה -----
const WIND = {
  calm:   { name: "שקט",      power: 0, spin: 0,   streaks: 0 },
  breeze: { name: "בריזה",    power: 3, spin: 0.5, streaks: 3 },
  strong: { name: "רוח חזקה", power: 9, spin: 1.4, streaks: 6 },
  storm:  { name: "סערה",     power: 0, spin: 0,   streaks: 10, stopped: true },
};
// ----- מאיפה מגיעה הרוח (מעלות). הטורבינה מתחילה מול "מקדימה" -----
const DIRS = { front: 0, diag: 45, side: 90 };

const TEMPLATE = (id) => `
  <div class="sim-bar">
    <p class="sim-name">טורבינה ברוח</p>
    <button type="button" class="btn btn-secondary sim-full"></button>
  </div>
  <p class="sim-intro" id="${id}-intro">לפניכם טורבינת רוח על האי. אתם שולטים במזג האוויר. בדקו מתי היא מייצרת הכי הרבה חשמל.</p>
  <div class="sim-main">
    <div class="sim-stage">
      <svg class="gen-svg wind-svg" viewBox="0 0 640 360" role="img" aria-labelledby="${id}-intro">
        <rect width="640" height="360" fill="#E6EFF9"/>
        <g class="w-streaks"></g>
        <path d="M0 300 C 140 250, 300 240, 420 270 C 520 292, 600 280, 640 270 V360 H0 Z" fill="#B9C79E"/>
        <!-- תורן -->
        <path d="M262 324 L270 132 h12 L290 324 Z" fill="#FFFFFF" stroke="#8C99AD" stroke-width="2"/>
        <!-- בית המכונות -->
        <rect class="w-nacelle" x="252" y="112" width="48" height="26" rx="8" fill="#FFFFFF" stroke="#8C99AD" stroke-width="2"/>
        <g class="w-rotor">
          <path d="M276 125 L270 30 Q276 22 282 30 Z"/>
          <path d="M276 125 L270 30 Q276 22 282 30 Z" transform="rotate(120 276 125)"/>
          <path d="M276 125 L270 30 Q276 22 282 30 Z" transform="rotate(240 276 125)"/>
          <circle cx="276" cy="125" r="10" fill="#E6EDF7" stroke="#4A5870" stroke-width="2.5"/>
        </g>
        <g class="w-brake"><circle cx="276" cy="125" r="17" fill="#9A5B00"/><rect x="266" y="121" width="20" height="8" rx="2" fill="#fff"/></g>
        <!-- מבט מלמעלה: כיוון הרוח וכיוון הראש -->
        <g class="w-compass" transform="translate(530 92)">
          <circle r="66" fill="#FFFFFF" stroke="#A9B5C6" stroke-width="2"/>
          <g class="w-wind-dir"><path d="M0 -60 V-24" stroke="#1D3A66" stroke-width="6" stroke-linecap="round"/><path d="M-11 -36 L0 -20 L11 -36" fill="none" stroke="#1D3A66" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
          <g class="w-yaw"><rect x="-10" y="-6" width="20" height="30" rx="5" fill="#8C99AD"/><path d="M-26 -8 H26" stroke="#4A5870" stroke-width="5" stroke-linecap="round"/></g>
          <text y="88" class="w-compass-label">כיוון הרוח</text>
        </g>
      </svg>
    </div>
    <div class="sim-side"></div>
  </div>
  <div class="sim-controls">
    <fieldset class="sim-control sim-speed">
      <legend>מהירות הרוח</legend>
      <div class="seg">
        ${Object.entries(WIND).map(([k, w]) => `<label><input type="radio" name="${id}-wind" value="${k}"${k === "calm" ? " checked" : ""}><span>${w.name}</span></label>`).join("")}
      </div>
    </fieldset>
    <fieldset class="sim-control">
      <legend>כיוון הרוח</legend>
      <div class="seg">
        <label><input type="radio" name="${id}-dir" value="front" checked><span>מקדימה</span></label>
        <label><input type="radio" name="${id}-dir" value="diag"><span>באלכסון</span></label>
        <label><input type="radio" name="${id}-dir" value="side"><span>מהצד</span></label>
      </div>
    </fieldset>
    <div class="sim-control">
      <button type="button" class="btn btn-primary w-face">סובבו את הראש מול הרוח</button>
    </div>
  </div>
  <p class="visually-hidden sim-live" aria-live="polite"></p>`;

export function createWindSim(host) {
  const id = host.id || "wind";
  host.classList.add("sim");
  host.innerHTML = TEMPLATE(id);
  const meter = createMeter(host.querySelector(".sim-side"));
  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();

  const rotor = host.querySelector(".w-rotor");
  const brake = host.querySelector(".w-brake");
  const streaksG = host.querySelector(".w-streaks");
  const windDirG = host.querySelector(".w-wind-dir");
  const yawG = host.querySelector(".w-yaw");
  const nacelle = host.querySelector(".w-nacelle");
  const live = host.querySelector(".sim-live");

  const state = { wind: "calm", dir: "front", yaw: 0, yawTarget: 0, angle: 0, shown: 0, t: 0 };

  const align = () => Math.max(0, Math.cos(((DIRS[state.dir] - state.yaw) * Math.PI) / 180)) ** 2;
  const output = () => WIND[state.wind].power * align();

  function drawStreaks() {
    const n = WIND[state.wind].streaks;
    let s = "";
    for (let i = 0; i < n; i++) {
      const y = 30 + ((i * 53) % 220);
      s += `<path data-i="${i}" d="M0 ${y} h${40 + (i % 3) * 20}"/>`;
    }
    streaksG.innerHTML = s;
  }

  let liveTimer = 0;
  function announce() {
    const value = Math.round(output());
    const w = WIND[state.wind];
    host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail: { wind: state.wind, dir: state.dir, value } }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = `${w.name}. ${w.stopped ? "הטורבינה עצרה. " : ""}מד החשמל: ${value} מתוך 10.`;
    }, 600);
  }

  host.querySelectorAll(".sim-controls input").forEach((r) => r.addEventListener("change", () => {
    state.wind = radioValue(host, `${id}-wind`);
    state.dir = radioValue(host, `${id}-dir`);
    drawStreaks();
    announce();
  }));
  host.querySelector(".w-face").addEventListener("click", () => {
    state.yawTarget = DIRS[state.dir];
    if (calm) state.yaw = state.yawTarget;
    setTimeout(announce, calm ? 0 : 1600);
  });
  drawStreaks();

  createLoop(host, (dt) => {
    state.t += dt;
    // הראש מסתובב לאט לכיוון החדש
    if (state.yaw !== state.yawTarget) {
      const d = state.yawTarget - state.yaw;
      const step = Math.sign(d) * Math.min(Math.abs(d), 40 * dt);
      state.yaw += step;
    }
    const w = WIND[state.wind];
    const a = align();
    if (!calm) state.angle = (state.angle + w.spin * Math.sqrt(a) * 360 * dt) % 360;
    rotor.setAttribute("transform", `rotate(${state.angle.toFixed(1)} 276 125)`);
    // הראש נראה צר יותר כשהוא מסובב הצידה
    const sx = Math.max(0.35, Math.cos((state.yaw * Math.PI) / 180));
    rotor.style.transformOrigin = "276px 125px";
    rotor.style.scale = `${sx.toFixed(3)} 1`;
    nacelle.setAttribute("width", (48 - 22 * (1 - sx)).toFixed(1));
    brake.style.opacity = w.stopped ? "1" : "0";
    windDirG.setAttribute("transform", `rotate(${DIRS[state.dir]})`);
    yawG.setAttribute("transform", `rotate(${state.yaw.toFixed(1)})`);

    if (!calm) {
      const speed = 60 + w.streaks * 45;
      streaksG.querySelectorAll("path").forEach((p) => {
        const i = Number(p.dataset.i);
        const xPos = ((state.t * speed + i * 97) % 760) - 100;
        p.setAttribute("transform", `translate(${xPos.toFixed(1)} 0)`);
      });
    } else {
      streaksG.querySelectorAll("path").forEach((p) => {
        const i = Number(p.dataset.i);
        p.setAttribute("transform", `translate(${(i * 97) % 600} 0)`);
      });
    }

    const target = output();
    state.shown += (target - state.shown) * Math.min(1, dt * 5);
    if (Math.abs(target - state.shown) < 0.02) state.shown = target;
    meter.set(state.shown);
  });
}

// =========================================================
// ניסוי 3: יום שלם באי
// =========================================================

// ----- כמה חשמל הכפר צריך בכל שעה (0–23) -----
export const VILLAGE_NEED = [3, 2, 2, 2, 2, 3, 4, 6, 6, 5, 5, 5, 5, 5, 5, 5, 6, 7, 8, 8, 7, 6, 5, 4];
// ----- כמה חשמל טורבינה אחת מייצרת בכל מקום, שעה אחרי שעה -----
const DAY_WIND = {
  ridge:  [8, 8, 9, 9, 8, 7, 6, 5, 3, 1, 0, 0, 1, 2, 4, 6, 7, 8, 9, 9, 8, 8, 9, 8],
  coast:  [4, 4, 5, 5, 4, 4, 3, 3, 2, 1, 0, 0, 0, 1, 2, 3, 4, 4, 5, 5, 4, 4, 5, 4],
  valley: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};
const SPOTS = ["ridge", "coast", "valley"];

export function createWindDay(host) {
  const id = host.id || "wday";
  host.classList.add("sim", "sim-day");
  host.innerHTML = `
    <div class="sim-bar">
      <p class="sim-name">יום שלם באי</p>
      <button type="button" class="btn btn-secondary sim-full"></button>
    </div>
    <div class="day-map">
      <svg class="map-svg" viewBox="0 0 640 400" role="img" aria-label="מפת האי עם שלושה מקומות לטורבינה: רכס הרוחות, החוף ועמק התאנים">
        ${islandBase({ labels: SPOTS })}
        ${windArrows()}
        ${SPOTS.map((k) => `<circle class="map-spot" data-spot="${k}" cx="${PLACES[k].x}" cy="${PLACES[k].y}" r="26"/>`).join("")}
        <g class="map-token" tabindex="-1">
          <circle r="30" fill="transparent"/>
          <path d="M-3 22 L-1 -6 h2 L3 22 Z" fill="#FFFFFF" stroke="#4A5870" stroke-width="1.5"/>
          <g stroke="#1D3A66" stroke-width="4" stroke-linecap="round"><path d="M0 -8 V-28"/><path d="M0 -8 L17 2"/><path d="M0 -8 L-17 2"/></g>
          <circle cy="-8" r="4" fill="#A5561F"/>
        </g>
      </svg>
    </div>
    <fieldset class="sim-control day-where">
      <legend>איפה הטורבינה?</legend>
      <div class="seg">
        ${SPOTS.map((k) => `<label><input type="radio" name="${id}-spot" value="${k}"${k === "valley" ? " checked" : ""}><span>${PLACES[k].name}</span></label>`).join("")}
      </div>
    </fieldset>
    <button type="button" class="btn btn-primary day-run">הפעילו ימה</button>
    <div class="day-chart"></div>
    <p class="chart-legend">
      <span class="legend-item"><span class="legend-line legend-blue" aria-hidden="true"></span>קו כחול: החשמל שהטורבינה מייצרת.</span>
      <span class="legend-item"><span class="legend-line legend-orange" aria-hidden="true"></span>קו כתום: כמה חשמל הכפר צריך.</span>
    </p>
    <p class="visually-hidden sim-live" aria-live="polite"></p>`;

  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();
  const svg = host.querySelector(".map-svg");
  const token = host.querySelector(".map-token");
  const live = host.querySelector(".sim-live");
  const chart = createDayChart(host.querySelector(".day-chart"), {
    lines: [
      { key: "need", color: "#C2611F", dash: "10 6" },
      { key: "prod", color: "#1D3A66" },
    ],
    gapOf: ["prod", "need"],
    label: "גרף של יממה: החשמל שהטורבינה מייצרת מול החשמל שהכפר צריך",
  });

  let spot = "valley";
  let runTimer = 0;
  const pos = { x: PLACES.valley.x, y: PLACES.valley.y };

  function placeToken(x, y) {
    pos.x = x; pos.y = y;
    token.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }
  function setSpot(k, { fromDrag = false } = {}) {
    spot = k;
    placeToken(PLACES[k].x, PLACES[k].y);
    host.querySelectorAll(".map-spot").forEach((c) => c.classList.toggle("is-on", c.dataset.spot === k));
    if (fromDrag) host.querySelector(`input[name="${id}-spot"][value="${k}"]`).checked = true;
    clearInterval(runTimer);
    chart.draw({}, -1);
  }

  host.querySelectorAll(`input[name="${id}-spot"]`).forEach((r) =>
    r.addEventListener("change", () => setSpot(r.value)));

  // ----- גרירת הטורבינה על המפה -----
  const toSvg = (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  let dragging = false;
  token.addEventListener("pointerdown", (e) => {
    dragging = true;
    token.setPointerCapture(e.pointerId);
    token.classList.add("is-dragging");
  });
  token.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = toSvg(e);
    placeToken(p.x, p.y);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    token.classList.remove("is-dragging");
    const near = SPOTS.reduce((best, k) =>
      Math.hypot(PLACES[k].x - pos.x, PLACES[k].y - pos.y) < Math.hypot(PLACES[best].x - pos.x, PLACES[best].y - pos.y) ? k : best, SPOTS[0]);
    setSpot(near, { fromDrag: true });
  };
  token.addEventListener("pointerup", endDrag);
  token.addEventListener("pointercancel", endDrag);

  // ----- הפעלת יממה -----
  host.querySelector(".day-run").addEventListener("click", () => {
    clearInterval(runTimer);
    const data = { prod: DAY_WIND[spot], need: VILLAGE_NEED };
    const done = () => {
      const short = data.prod.filter((v, h) => v < data.need[h]).length;
      live.textContent = `${PLACES[spot].name}: הקו הכחול נמוך מהקו הכתום ב-${short} שעות מתוך 24.`;
      host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail: { spot, ran: true } }));
    };
    if (calm) { chart.draw(data, 23); done(); return; }
    let h = 0;
    chart.draw(data, 0);
    runTimer = setInterval(() => {
      h += 1;
      chart.draw(data, h);
      if (h >= 23) { clearInterval(runTimer); done(); }
    }, 200);
  });

  setSpot("valley");
}
