// =========================================================
// engine.js – מנוע משותף לכל ההדמיות
//
// • createLoop    – לולאת אנימציה שרצה רק כשההדמיה נראית על המסך
//                   (חוסך כוח במחשב נייד חלש).
// • createMeter   – מד חשמל 0–10, בלי יחידות.
// • setupFullscreen – כפתור "מסך מלא" להקרנה בכיתה.
// • reducedMotion – האם המחשב מוגדר ל"צמצום תנועה".
// =========================================================

import { icon } from "../ui/icons.js";

/** true אם המשתמש ביקש פחות תנועה במסך */
export function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * לולאת אנימציה. tick(dt) נקרא בכל פריים, dt בשניות.
 * הלולאה עוצרת כשההדמיה מחוץ למסך, מוסתרת, או כשהלשונית ברקע.
 */
export function createLoop(host, tick) {
  let visible = false;
  let raf = 0;
  let last = 0;

  function frame(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    tick(dt);
    raf = requestAnimationFrame(frame);
  }
  function update() {
    const shouldRun = visible && !document.hidden;
    if (shouldRun && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      update();
    }).observe(host);
  } else {
    visible = true;
  }
  document.addEventListener("visibilitychange", update);
  update();
  return { refresh: update };
}

/**
 * מד חשמל 0–10.
 * מחזיר אובייקט עם set(value) – הערך יכול להיות שבר, המספר מוצג שלם.
 */
let meterCount = 0;
export function createMeter(host, { label = "מד חשמל" } = {}) {
  const labelId = `meter-label-${++meterCount}`;
  const cx = 100, cy = 104, r = 80;
  const point = (v, rad) => {
    const a = Math.PI - (v / 10) * Math.PI;
    return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)];
  };
  let ticks = "";
  for (let v = 0; v <= 10; v++) {
    const [x1, y1] = point(v, r - 2);
    const [x2, y2] = point(v, v % 5 === 0 ? r - 16 : r - 10);
    const [tx, ty] = point(v, r - 28);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    ticks += `<text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}">${v}</text>`;
  }

  const box = document.createElement("div");
  box.className = "meter";
  box.innerHTML = `
    <p class="meter-label" id="${labelId}">${label}</p>
    <svg class="meter-svg" viewBox="0 0 200 118" aria-hidden="true" focusable="false">
      <path class="meter-track" d="M20 104 A80 80 0 0 1 180 104"/>
      <path class="meter-fill" d="M20 104 A80 80 0 0 1 180 104" pathLength="100"/>
      <g class="meter-ticks">${ticks}</g>
      <line class="meter-needle" x1="${cx}" y1="${cy}" x2="${cx - r + 14}" y2="${cy}"/>
      <circle class="meter-hub" cx="${cx}" cy="${cy}" r="7"/>
    </svg>
    <p class="meter-value"><span class="meter-num">0</span><span class="meter-of"> מתוך 10</span></p>`;
  host.append(box);

  const fill = box.querySelector(".meter-fill");
  const needle = box.querySelector(".meter-needle");
  const num = box.querySelector(".meter-num");
  let shown = -1;
  let shownNum = -1;

  function set(value) {
    const v = Math.max(0, Math.min(10, value));
    if (Math.abs(v - shown) < 0.01) return;
    shown = v;
    const [x, y] = point(v, r - 14);
    needle.setAttribute("x2", x.toFixed(1));
    needle.setAttribute("y2", y.toFixed(1));
    fill.style.strokeDasharray = `${v * 10} 100`;
    const n = Math.round(v);
    if (n !== shownNum) {
      shownNum = n;
      num.textContent = String(n);
    }
  }
  set(0);
  return { set, get value() { return Math.round(shown); } };
}

/**
 * כפתור "מסך מלא". אם הדפדפן לא תומך במסך מלא אמיתי,
 * ההדמיה מתפרסת על כל החלון.
 */
export function setupFullscreen(button, target) {
  const LABEL_ON = "מסך מלא";
  const LABEL_OFF = "יציאה ממסך מלא";
  const native = target.requestFullscreen || target.webkitRequestFullscreen;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  function render() {
    const on = fsElement() === target || target.classList.contains("is-pseudo-full");
    target.classList.toggle("is-full", on);
    button.innerHTML = `${icon(on ? "shrink" : "expand")}<span>${on ? LABEL_OFF : LABEL_ON}</span>`;
    button.setAttribute("aria-pressed", String(on));
  }

  function exitPseudo() {
    target.classList.remove("is-pseudo-full");
    document.documentElement.classList.remove("has-pseudo-full");
  }

  button.addEventListener("click", async () => {
    if (fsElement() === target) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    if (target.classList.contains("is-pseudo-full")) {
      exitPseudo();
      render();
      return;
    }
    try {
      if (!native) throw new Error("no fullscreen");
      await native.call(target);
    } catch {
      target.classList.add("is-pseudo-full");
      document.documentElement.classList.add("has-pseudo-full");
      render();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && target.classList.contains("is-pseudo-full")) {
      exitPseudo();
      render();
    }
  });
  document.addEventListener("fullscreenchange", render);
  document.addEventListener("webkitfullscreenchange", render);
  render();
}

/** מחזיר את הערך של כפתור radio שנבחר בקבוצה */
export function radioValue(root, name) {
  const r = root.querySelector(`input[name="${name}"]:checked`);
  return r ? r.value : null;
}
