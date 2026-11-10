// =========================================================
// generator.js – הדמיית המחולל (תחנה 1, מעבדה)
//
// מגנט מסתובב בין שני סלילים, והסלילים מחוברים לנורה.
// התלמיד משנה: מהירות סיבוב (מחוון, או גרירת המגנט),
// חוזק המגנט, מספר הליפופים, ומה מסתובב (המגנט או הסליל).
//
// כמות החשמל במד (0–10) = מהירות × חוזק המגנט × ליפופים.
// במהירות בינונית, מגנט בינוני ו-50 ליפופים המד מראה 5.
// אפשר לשנות את המספרים בטבלאות שלמטה.
// =========================================================

import { createLoop, createMeter, setupFullscreen, reducedMotion, radioValue } from "./engine.js";

// ----- הכיול: כמה כל בחירה מגדילה את החשמל -----
const MAGNET = { weak: 0.6, mid: 1, strong: 1.6 };
const TURNS = { 10: 0.4, 50: 1, 100: 1.8 };
const MAX_SPEED = 10;
const REV_PER_SEC_AT_MAX = 2.2; // כמה סיבובים בשנייה במהירות הכי גבוהה

// ----- מראה המגנט לפי החוזק -----
const MAGNET_SIZE = {
  weak: { len: 104, thick: 24 },
  mid: { len: 120, thick: 34 },
  strong: { len: 132, thick: 46 },
};
// ----- כמה פסי נחושת מציירים לכל סליל -----
const TURN_BANDS = { 10: 3, 50: 6, 100: 10 };

const C = { x: 210, y: 180 }; // מרכז המחולל בציור

function coilSVG(cx, n) {
  const y = C.y;
  const inner = 56;
  const step = inner / n;
  const w = Math.max(3, step * 0.72);
  let bands = "";
  for (let i = 0; i < n; i++) {
    const x = cx - inner / 2 + step * i + (step - w) / 2;
    bands += `<rect x="${x.toFixed(1)}" y="${y - 52}" width="${w.toFixed(1)}" height="104" rx="${Math.min(3, w / 2).toFixed(1)}"/>`;
  }
  return `
    <rect class="gen-core" x="${cx - 30}" y="${y - 44}" width="60" height="88" rx="4"/>
    <g class="gen-wind">${bands}</g>`;
}

function magnetSVG(strength) {
  const { len, thick } = MAGNET_SIZE[strength];
  const h = len / 2;
  const t = thick / 2;
  return `
    <rect class="gen-mag-a" x="${C.x - h}" y="${C.y - t}" width="${h}" height="${thick}" rx="5"/>
    <rect class="gen-mag-b" x="${C.x}" y="${C.y - t}" width="${h}" height="${thick}" rx="5"/>
    <circle class="gen-axle" cx="${C.x}" cy="${C.y}" r="8"/>
    <circle class="gen-grip" cx="${C.x - h + 16}" cy="${C.y}" r="${Math.min(10, t - 3)}"/>`;
}

const TEMPLATE = (id) => `
  <div class="sim-bar">
    <p class="sim-name">מעבדת המחולל</p>
    <button type="button" class="btn btn-secondary sim-full"></button>
  </div>
  <p class="sim-intro" id="${id}-intro">לפניכם מחולל פתוח. מגנט מסתובב בין שני סלילים, והסלילים מחוברים לנורה. בכל ניסוי תשנו דבר אחד ותבדקו מה קורה.</p>
  <div class="sim-main">
    <div class="sim-stage">
      <svg class="gen-svg" viewBox="0 0 640 360" role="img" aria-labelledby="${id}-intro">
        <defs>
          <radialGradient id="${id}-glow">
            <stop offset="0" stop-color="#FFCF4A" stop-opacity="0.9"/>
            <stop offset="1" stop-color="#FFCF4A" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- חוטים מהסלילים לנורה -->
        <g class="gen-wires">
          <path d="M90 136 V26 H612 V226 H556"/>
          <path d="M330 224 V334 H468 V226 H524"/>
        </g>
        <g class="gen-flow">
          <path d="M90 136 V26 H612 V226 H556"/>
          <path d="M524 226 H468 V334 H330 V224"/>
        </g>
        <!-- גוף המחולל -->
        <rect class="gen-house" x="34" y="56" width="352" height="250" rx="22"/>
        <!-- הסלילים -->
        <g class="gen-coils">
          <g class="gen-coil" data-coil="1"></g>
          <g class="gen-coil" data-coil="2"></g>
        </g>
        <!-- המגנט -->
        <g class="gen-rotor"><g class="gen-magnet"></g></g>
        <!-- חצי סיבוב (מוצגים רק במצב "צמצום תנועה") -->
        <g class="gen-spin-arrows">
          <path d="M210 82 A98 98 0 0 1 300 128"/><path d="M296 116 L302 130 L288 132"/>
          <path d="M210 278 A98 98 0 0 1 120 232"/><path d="M124 244 L118 230 L132 228"/>
        </g>
        <!-- אזור גרירה -->
        <circle class="gen-hit" cx="${C.x}" cy="${C.y}" r="112"/>
        <!-- הנורה -->
        <circle class="gen-glow" cx="540" cy="168" r="96" fill="url(#${id}-glow)"/>
        <g class="gen-rays">
          <path d="M540 104 V84"/><path d="M586 122 L600 108"/><path d="M494 122 L480 108"/>
          <path d="M604 168 H624"/><path d="M476 168 H456"/>
        </g>
        <circle class="gen-glass" cx="540" cy="168" r="40"/>
        <circle class="gen-light" cx="540" cy="168" r="36"/>
        <path class="gen-filament" d="M526 200 V176 l6 -10 l8 12 l8 -12 l6 10 V200"/>
        <rect class="gen-base" x="522" y="204" width="36" height="34" rx="5"/>
        <!-- תוויות -->
        <g class="gen-labels">
          <text x="${C.x}" y="336">מגנט</text>
          <text x="90" y="44">סליל נחושת</text>
          <text x="330" y="44">סליל נחושת</text>
          <text x="540" y="270">נורה</text>
        </g>
      </svg>
    </div>
    <div class="sim-side"></div>
  </div>
  <div class="sim-controls">
    <div class="sim-control sim-speed">
      <label for="${id}-speed">מהירות סיבוב</label>
      <input type="range" id="${id}-speed" min="0" max="${MAX_SPEED}" step="1" value="0">
      <div class="range-ends" aria-hidden="true"><span>עומד</span><span>מהר מאוד</span></div>
      <p class="sim-tip">אפשר גם לסובב את המגנט בגרירה, בעכבר או באצבע.</p>
    </div>
    <fieldset class="sim-control">
      <legend>חוזק המגנט</legend>
      <div class="seg">
        <label><input type="radio" name="${id}-magnet" value="weak"><span>חלש</span></label>
        <label><input type="radio" name="${id}-magnet" value="mid" checked><span>בינוני</span></label>
        <label><input type="radio" name="${id}-magnet" value="strong"><span>חזק</span></label>
      </div>
    </fieldset>
    <fieldset class="sim-control">
      <legend>מספר הליפופים</legend>
      <div class="seg">
        <label><input type="radio" name="${id}-turns" value="10"><span>10</span></label>
        <label><input type="radio" name="${id}-turns" value="50" checked><span>50</span></label>
        <label><input type="radio" name="${id}-turns" value="100"><span>100</span></label>
      </div>
    </fieldset>
    <fieldset class="sim-control">
      <legend>מה מסתובב?</legend>
      <div class="seg">
        <label><input type="radio" name="${id}-spin" value="magnet" checked><span>המגנט</span></label>
        <label><input type="radio" name="${id}-spin" value="coil"><span>הסליל</span></label>
      </div>
    </fieldset>
  </div>
  <p class="visually-hidden sim-live" aria-live="polite"></p>`;

const SPEED_WORDS = (s) => (s === 0 ? "עומד" : `מהירות ${s} מתוך 10`);

/**
 * בונה את הדמיית המחולל בתוך host.
 * שולחת אירוע "sim-change" עם { speed, magnet, turns, spin, value } בכל שינוי.
 */
export function createGeneratorSim(host) {
  const id = host.id || "gen";
  host.classList.add("sim");
  host.innerHTML = TEMPLATE(id);

  const svg = host.querySelector(".gen-svg");
  const rotor = host.querySelector(".gen-rotor");
  const magnetG = host.querySelector(".gen-magnet");
  const coilsG = host.querySelector(".gen-coils");
  const coilEls = [...host.querySelectorAll(".gen-coil")];
  const flow = host.querySelector(".gen-flow");
  const light = host.querySelector(".gen-light");
  const glow = host.querySelector(".gen-glow");
  const rays = host.querySelector(".gen-rays");
  const filament = host.querySelector(".gen-filament");
  const arrows = host.querySelector(".gen-spin-arrows");
  const hit = host.querySelector(".gen-hit");
  const slider = host.querySelector(`#${id}-speed`);
  const live = host.querySelector(".sim-live");
  const meter = createMeter(host.querySelector(".sim-side"));
  setupFullscreen(host.querySelector(".sim-full"), host);

  const calm = reducedMotion();
  host.classList.toggle("is-calm", calm);

  const state = {
    speed: 0,          // המהירות כרגע (0–10)
    magnet: "mid",
    turns: "50",
    spin: "magnet",
    angle: 0,          // זווית הסיבוב, במעלות
    dragging: false,
    coasting: false,   // אחרי שעוזבים את הגרירה, הסיבוב נעצר לאט
    shownValue: 0,
    flowOffset: 0,
  };

  const output = () =>
    Math.min(10, state.speed * MAGNET[state.magnet] * TURNS[state.turns]);

  // ----- ציור לפי הבחירות -----
  function drawMagnet() { magnetG.innerHTML = magnetSVG(state.magnet); }
  function drawCoils() {
    const n = TURN_BANDS[state.turns];
    coilEls[0].innerHTML = coilSVG(90, n);
    coilEls[1].innerHTML = coilSVG(330, n);
  }
  drawMagnet();
  drawCoils();

  // ----- הודעה לקורא מסך, ואירוע לעמוד -----
  let liveTimer = 0;
  function announce() {
    const detail = {
      speed: Math.round(state.speed), magnet: state.magnet, turns: state.turns,
      spin: state.spin, value: Math.round(output()),
    };
    host.dispatchEvent(new CustomEvent("sim-change", { bubbles: true, detail }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = `${SPEED_WORDS(detail.speed)}. מד החשמל: ${detail.value} מתוך 10.`;
    }, 700);
  }

  // ----- פקדים -----
  slider.addEventListener("input", () => {
    state.coasting = false;
    state.speed = Number(slider.value);
    announce();
  });
  host.querySelectorAll(".sim-controls input[type=radio]").forEach((r) => {
    r.addEventListener("change", () => {
      state.magnet = radioValue(host, `${id}-magnet`);
      state.turns = radioValue(host, `${id}-turns`);
      state.spin = radioValue(host, `${id}-spin`);
      drawMagnet();
      drawCoils();
      announce();
    });
  });

  // ----- גרירת המגנט (או הסליל) בעכבר או באצבע -----
  let lastPointerAngle = 0;
  let lastTime = 0;
  let dragSpeed = 0;

  function pointerAngle(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return (Math.atan2(p.y - C.y, p.x - C.x) * 180) / Math.PI;
  }

  hit.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    state.coasting = false;
    hit.setPointerCapture(e.pointerId);
    lastPointerAngle = pointerAngle(e);
    lastTime = performance.now();
    dragSpeed = state.speed;
    host.classList.add("is-dragging");
  });
  hit.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const a = pointerAngle(e);
    let d = a - lastPointerAngle;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastPointerAngle = a;
    const now = performance.now();
    const dt = Math.max(0.008, (now - lastTime) / 1000);
    lastTime = now;
    state.angle += d;
    // מעלות לשנייה → מהירות 0–10
    const inst = Math.min(MAX_SPEED, Math.abs(d / dt) / (360 * REV_PER_SEC_AT_MAX) * MAX_SPEED);
    dragSpeed += (inst - dragSpeed) * Math.min(1, dt * 8);
    state.speed = dragSpeed;
    slider.value = String(Math.round(state.speed));
  });
  function endDrag() {
    if (!state.dragging) return;
    state.dragging = false;
    state.coasting = true;
    host.classList.remove("is-dragging");
    announce();
  }
  hit.addEventListener("pointerup", endDrag);
  hit.addEventListener("pointercancel", endDrag);

  // ----- לולאת האנימציה -----
  let lastRounded = -1;
  createLoop(host, (dt) => {
    // בזמן גרירה: אם היד עוצרת, המהירות יורדת
    if (state.dragging) {
      if (performance.now() - lastTime > 120) {
        dragSpeed = Math.max(0, dragSpeed - dt * 12);
        state.speed = dragSpeed;
        slider.value = String(Math.round(state.speed));
      }
    } else if (state.coasting) {
      state.speed = Math.max(0, state.speed - dt * 5);
      slider.value = String(Math.round(state.speed));
      if (state.speed === 0) { state.coasting = false; announce(); }
    }

    if (!calm && !state.dragging) {
      state.angle += (state.speed / MAX_SPEED) * REV_PER_SEC_AT_MAX * 360 * dt;
    }
    state.angle %= 360;

    const transform = `rotate(${state.angle.toFixed(1)} ${C.x} ${C.y})`;
    if (state.spin === "magnet") {
      rotor.setAttribute("transform", transform);
      coilsG.removeAttribute("transform");
    } else {
      coilsG.setAttribute("transform", transform);
      rotor.removeAttribute("transform");
    }

    // המד נע בעדינות לערך החדש
    const target = output();
    state.shownValue += (target - state.shownValue) * Math.min(1, dt * 6);
    if (Math.abs(target - state.shownValue) < 0.02) state.shownValue = target;
    meter.set(state.shownValue);

    // הנורה: בהירות לפי המד. במהירות נמוכה היא מהבהבת
    let b = state.shownValue / 10;
    if (!calm && state.speed > 0 && state.speed < 4) {
      b *= 0.3 + 0.7 * Math.abs(Math.sin((state.angle * Math.PI) / 180));
    }
    light.style.opacity = b.toFixed(3);
    glow.style.opacity = (b * 0.9).toFixed(3);
    rays.style.opacity = b > 0.25 ? Math.min(1, b * 1.2).toFixed(3) : "0";
    filament.classList.toggle("is-on", b > 0.05);

    // זרם בחוטים
    if (!calm) {
      state.flowOffset -= state.shownValue * dt * 14;
      flow.style.strokeDashoffset = state.flowOffset.toFixed(1);
    }
    flow.style.opacity = state.shownValue > 0.2 ? "1" : "0";
    arrows.style.opacity = calm && state.speed > 0 ? "1" : "0";

    const rounded = Math.round(state.speed);
    if (rounded !== lastRounded) {
      lastRounded = rounded;
      slider.setAttribute("aria-valuetext", SPEED_WORDS(rounded));
    }
  });

  return {
    get value() { return Math.round(output()); },
    get state() { return { ...state }; },
  };
}
