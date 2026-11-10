// =========================================================
// repair.js – משימת התיקון (תחנה 1, "רוצים עוד?")
//
// חלקים פזורים: מגנט, סליל, ציר, ידית, סוללה, מאוורר ונורה.
// מכניסים חלק למחולל בלחיצה עליו, או בגרירה אל המחולל.
// לחיצה נוספת (או גרירה החוצה) מוציאה אותו.
//
// מחולל אמיתי = מגנט + סליל + ציר + ידית + נורה, ומסובבים את הידית.
// סוללה מדליקה את הנורה, אבל אז זה כבר לא מחולל.
// מאוורר לא נחוץ.
// =========================================================

import { createLoop, createMeter, setupFullscreen, reducedMotion } from "./engine.js";
import { icon } from "../ui/icons.js";

const PARTS = [
  { id: "magnet", name: "מגנט" },
  { id: "coil", name: "סליל" },
  { id: "axle", name: "ציר" },
  { id: "handle", name: "ידית" },
  { id: "battery", name: "סוללה" },
  { id: "fan", name: "מאוורר" },
  { id: "bulb", name: "נורה" },
];
const NEEDED = ["magnet", "coil", "axle", "handle", "bulb"];

// משוב מתוך מסמך התוכן
const BATTERY_FEEDBACK = "עם סוללה הנורה תידלק, אבל זה כבר לא מחולל. נסו להדליק בלי סוללה.";

// סמלים קטנים לכפתורי החלקים
const PART_ICONS = {
  magnet: '<rect x="4" y="9" width="8" height="8" rx="1.5" fill="#A5561F"/><rect x="12" y="9" width="8" height="8" rx="1.5" fill="#1D3A66"/>',
  coil: '<rect x="5" y="8" width="14" height="10" rx="2" fill="#8C99AD"/><path d="M8 6v14M11 6v14M14 6v14M17 6v14" stroke="#A5561F" stroke-width="2"/>',
  axle: '<path d="M3 13h18" stroke="#4A5870" stroke-width="3" stroke-linecap="round"/>',
  handle: '<path d="M7 18V8" stroke="#4A5870" stroke-width="2.5" stroke-linecap="round"/><circle cx="7" cy="7" r="3" fill="#A5561F"/><path d="M7 18h11" stroke="#4A5870" stroke-width="2.5" stroke-linecap="round"/>',
  battery: '<rect x="3" y="8" width="16" height="10" rx="2" fill="#4A5870"/><rect x="19" y="11" width="2.5" height="4" fill="#4A5870"/><path d="M7 13h4M9 11v4" stroke="#fff" stroke-width="1.6"/>',
  fan: '<circle cx="12" cy="13" r="2.2" fill="#4A5870"/><ellipse cx="12" cy="7" rx="2.5" ry="4.5" fill="#6F86AA"/><ellipse cx="12" cy="19" rx="2.5" ry="4.5" fill="#6F86AA"/>',
  bulb: '<circle cx="12" cy="10" r="6" fill="#fff" stroke="#4A5870" stroke-width="1.8"/><rect x="9" y="15.5" width="6" height="5" rx="1" fill="#4A5870"/>',
};
const partIcon = (id) =>
  `<svg class="part-icon" viewBox="0 0 24 26" aria-hidden="true" focusable="false">${PART_ICONS[id]}</svg>`;

const TEMPLATE = (id) => `
  <div class="sim-bar">
    <p class="sim-name">משימת תיקון</p>
    <button type="button" class="btn btn-secondary sim-full"></button>
  </div>
  <div class="repair-layout">
    <div class="repair-tray">
      <p class="repair-head" id="${id}-tray">חלקים פזורים</p>
      <ul class="repair-parts" aria-labelledby="${id}-tray">
        ${PARTS.map((p) => `
          <li><button type="button" class="repair-part" data-part="${p.id}" aria-pressed="false">
            ${partIcon(p.id)}<span class="repair-part-name">${p.name}</span>
            <span class="repair-part-in">${icon("check")}<span class="visually-hidden"> (במחולל)</span></span>
          </button></li>`).join("")}
      </ul>
      <p class="sim-tip">לחצו על חלק כדי להכניס אותו למחולל או להוציא אותו. אפשר גם לגרור.</p>
    </div>
    <div class="repair-bench" aria-labelledby="${id}-bench">
      <p class="repair-head" id="${id}-bench">המחולל שלכם</p>
      <svg class="repair-svg" viewBox="0 0 520 250" role="img" aria-label="המחולל שהרכבתם">
        <rect class="repair-floor" x="8" y="8" width="504" height="234" rx="16"/>
        <g data-show="axle"><path class="r-axle" d="M100 150 H372"/></g>
        <g data-show="fan" class="r-fan"></g>
        <g data-show="magnet" class="r-magnet"></g>
        <g data-show="coil" class="r-coil"></g>
        <g data-show="handle" class="r-handle"></g>
        <g data-show="wires" class="r-wires"><path d="M214 92 V34 H452 V104"/><path d="M266 92 V54 H468 V104"/></g>
        <g data-show="battery" class="r-battery">
          <path class="r-wire" d="M448 156 V122 M472 156 V122"/>
          <rect x="428" y="156" width="64" height="30" rx="5"/><rect x="492" y="164" width="7" height="14" rx="2"/>
          <path d="M444 171 h12 M450 165 v12" stroke="#fff" stroke-width="3"/>
        </g>
        <g data-show="bulb" class="r-bulb">
          <circle class="r-glow" cx="460" cy="72" r="62"/>
          <circle class="r-glass" cx="460" cy="72" r="30"/>
          <circle class="r-light" cx="460" cy="72" r="27"/>
          <rect class="r-base" x="447" y="102" width="26" height="20" rx="4"/>
        </g>
      </svg>
      <div class="repair-out">
        <p class="repair-bulb-state" aria-live="polite"></p>
        <div class="repair-meter"></div>
      </div>
      <div class="sim-control repair-turn">
        <label for="${id}-turn">סיבוב הידית</label>
        <input type="range" id="${id}-turn" min="0" max="10" step="1" value="0" disabled>
        <div class="range-ends" aria-hidden="true"><span>עומד</span><span>מהר מאוד</span></div>
      </div>
      <p class="feedback feedback-retry repair-battery" hidden>${BATTERY_FEEDBACK}</p>
    </div>
  </div>`;

export function createRepairSim(host) {
  const id = host.id || "repair";
  host.classList.add("sim", "repair");
  host.innerHTML = TEMPLATE(id);

  const svg = host.querySelector(".repair-svg");
  const bench = host.querySelector(".repair-bench");
  const buttons = [...host.querySelectorAll(".repair-part")];
  const turn = host.querySelector(`#${id}-turn`);
  const bulbState = host.querySelector(".repair-bulb-state");
  const batteryFb = host.querySelector(".repair-battery");
  const meter = createMeter(host.querySelector(".repair-meter"));
  setupFullscreen(host.querySelector(".sim-full"), host);
  const calm = reducedMotion();

  const g = (name) => svg.querySelector(`[data-show="${name}"]`);
  const placed = new Set();
  let speed = 0;
  let angle = 0;
  let shown = 0;

  // ----- ציור החלקים שבתוך המחולל -----
  g("coil").innerHTML = [182, 198, 214, 230, 246, 262, 278, 294]
    .map((x) => `<ellipse cx="${x}" cy="150" rx="7" ry="56"/>`).join("");

  function drawMoving() {
    const c = Math.cos((angle * Math.PI) / 180);
    const s = Math.max(0.12, Math.abs(c));
    const top = c >= 0 ? "#A5561F" : "#1D3A66";
    const bottom = c >= 0 ? "#1D3A66" : "#A5561F";
    const h = 38 * s;
    g("magnet").innerHTML =
      `<rect x="188" y="${150 - h}" width="104" height="${h}" rx="4" fill="${top}"/>` +
      `<rect x="188" y="150" width="104" height="${h}" rx="4" fill="${bottom}"/>`;
    const ky = 150 - 40 * c;
    g("handle").innerHTML =
      `<path class="r-arm" d="M100 150 V${ky.toFixed(1)}"/>` +
      `<circle class="r-knob" cx="100" cy="${ky.toFixed(1)}" r="10"/>` +
      `<circle class="r-hub" cx="100" cy="150" r="7"/>`;
    const fs = Math.max(0.1, Math.abs(c)) * 44;
    g("fan").innerHTML =
      `<ellipse cx="372" cy="${150 - fs / 2}" rx="9" ry="${(fs / 2).toFixed(1)}"/>` +
      `<ellipse cx="372" cy="${150 + fs / 2}" rx="9" ry="${(fs / 2).toFixed(1)}"/>` +
      `<circle cx="372" cy="150" r="7" class="r-hub"/>`;
  }

  const has = (p) => placed.has(p);
  const isGenerator = () => NEEDED.every(has) && !has("battery");

  function target() {
    if (!has("bulb")) return 0;
    if (has("battery")) return 8;
    if (isGenerator()) return speed;
    return 0;
  }

  function render() {
    buttons.forEach((b) => {
      const on = has(b.dataset.part);
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-in", on);
    });
    PARTS.forEach((p) => { g(p.id).style.display = has(p.id) ? "" : "none"; });
    g("wires").style.display = has("coil") && has("bulb") ? "" : "none";

    const canTurn = has("axle") && has("handle");
    turn.disabled = !canTurn;
    if (!canTurn) { turn.value = "0"; speed = 0; }
    batteryFb.hidden = !(has("battery") && has("bulb"));
  }

  function toggle(partId, force) {
    const on = force === undefined ? !has(partId) : force;
    if (on) placed.add(partId); else placed.delete(partId);
    render();
  }

  // ----- לחיצה -----
  let suppressClick = false;
  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      if (suppressClick) { suppressClick = false; return; }
      toggle(b.dataset.part);
    });
  });

  // ----- גרירה (עכבר ומגע). הלחיצה נשארת החלופה -----
  buttons.forEach((b) => {
    let start = null;
    let ghost = null;
    b.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    b.addEventListener("pointermove", (e) => {
      if (!start || e.pointerId !== start.id) return;
      if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        b.setPointerCapture(e.pointerId);
        ghost = b.cloneNode(true);
        ghost.classList.add("repair-ghost");
        ghost.setAttribute("aria-hidden", "true");
        document.body.append(ghost);
      }
      if (ghost) {
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        const r = bench.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        bench.classList.toggle("is-drop", over);
      }
    });
    function finish(e) {
      if (ghost) {
        const r = bench.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        toggle(b.dataset.part, over);
        ghost.remove();
        ghost = null;
        bench.classList.remove("is-drop");
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 50);
      }
      start = null;
    }
    b.addEventListener("pointerup", finish);
    b.addEventListener("pointercancel", (e) => {
      if (ghost) { ghost.remove(); ghost = null; bench.classList.remove("is-drop"); }
      start = null;
      void e;
    });
  });

  turn.addEventListener("input", () => { speed = Number(turn.value); });

  // ----- אנימציה -----
  let lastLit = null;
  createLoop(host, (dt) => {
    if (!calm && has("axle") && has("handle")) angle = (angle + speed * 80 * dt) % 360;
    drawMoving();
    const t = target();
    shown += (t - shown) * Math.min(1, dt * 6);
    if (Math.abs(t - shown) < 0.02) shown = t;
    meter.set(shown);
    const b = shown / 10;
    svg.querySelector(".r-light").style.opacity = b.toFixed(3);
    svg.querySelector(".r-glow").style.opacity = (b * 0.8).toFixed(3);
    const lit = t > 0;
    if (lit !== lastLit) {
      lastLit = lit;
      bulbState.innerHTML = lit
        ? `${icon("bulbOn")}<span>הנורה דולקת</span>`
        : `${icon("bulb")}<span>הנורה כבויה</span>`;
      bulbState.classList.toggle("is-on", lit);
    }
  });

  render();
}
