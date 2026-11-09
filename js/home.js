// =========================================================
// home.js – דף הבית
//
// • כפתור ראשי: "מתחילים את המסע" בכניסה ראשונה,
//   או "המשיכו מאיפה שעצרתם" בכניסה חוזרת.
// • מפת המסע: האי מתאיר עוד מקום בכל תחנה שהושלמה,
//   ורשימת התחנות מסמנת תחנה שהושלמה בסמל ובנורה דולקת.
// =========================================================

import { stations, challenge } from "./site.js";
import { getLastPlace, isStationDone } from "./progress.js";
import { icon } from "./ui/icons.js";

// ----- 1. הכפתור הראשי -----
function renderCta() {
  const host = document.getElementById("hero-cta");
  const last = getLastPlace();
  const first = stations[0];

  if (last) {
    const a = document.createElement("a");
    a.className = "btn btn-light btn-large";
    a.href = last.href;
    const where = last.stationNum !== null && last.stationNum !== undefined
      ? `תחנה ${last.stationNum}, ${last.partTitle}`
      : last.partTitle;
    a.innerHTML = `<span class="cta-main">המשיכו מאיפה שעצרתם</span><span class="cta-sub">${where}</span>`;
    host.append(a);
  } else if (first.ready) {
    const a = document.createElement("a");
    a.className = "btn btn-light btn-large";
    a.href = first.href;
    a.innerHTML = `<span class="cta-main">מתחילים את המסע</span>${icon("next")}`;
    host.append(a);
  } else {
    const span = document.createElement("span");
    span.className = "btn btn-soon btn-large";
    span.setAttribute("aria-disabled", "true");
    span.innerHTML = `<span class="cta-main">מתחילים את המסע</span><span class="soon-tag">בקרוב</span>`;
    host.append(span);
  }
}

// ----- 2. מפת האי -----
// כל תחנה מדליקה מקום אחד באי. x,y – מיקום במפה.
const LIGHTS = [
  { id: "s0", x: 455, y: 205 },          // הכפר – הבית הראשון
  { id: "s1", x: 492, y: 188 },          // המחסן מאחורי המאפייה
  { id: "s2", x: 150, y: 168 },          // רכס הרוחות
  { id: "s3", x: 318, y: 92 },           // מפל השחף
  { id: "s4", x: 318, y: 318 },          // נמל הדייגים
  { id: "s5", x: 528, y: 222 },          // בית המועצה
  { id: "challenge", x: 572, y: 292 },   // המגדלור
];

function house(x, y, lit) {
  const glow = lit
    ? `<circle cx="${x}" cy="${y - 6}" r="26" fill="url(#glow)"/>`
    : "";
  return `
    <g class="map-house${lit ? " is-lit" : ""}">
      ${glow}
      <path d="M${x - 13} ${y} v-14 l13 -11 l13 11 v14 z" fill="${lit ? "#F3E3D6" : "#3A5784"}" stroke="#0E1D36" stroke-width="1.5"/>
      <rect x="${x - 5}" y="${y - 12}" width="10" height="9" rx="1.5" fill="${lit ? "#FFCF4A" : "#12284A"}"/>
    </g>`;
}

function renderIsland() {
  const fig = document.getElementById("island-map");
  const all = [...stations.map((s) => s.id), challenge.id];
  const litIds = all.filter((id) => isStationDone(id));

  const houses = LIGHTS.map((l) => house(l.x, l.y, litIds.includes(l.id))).join("");

  fig.innerHTML = `
    <svg viewBox="0 0 640 400" role="img" aria-labelledby="island-title">
      <title id="island-title">מפת אי האלמוג בלילה. ${litIds.length} מתוך ${all.length} מקומות באי מוארים.</title>
      <defs>
        <radialGradient id="glow">
          <stop offset="0" stop-color="#FFCF4A" stop-opacity="0.75"/>
          <stop offset="1" stop-color="#FFCF4A" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="400" rx="20" fill="#12284A"/>
      <g fill="#C9D6EA" opacity="0.7">
        <circle cx="60" cy="40" r="1.6"/><circle cx="210" cy="28" r="1.2"/><circle cx="420" cy="36" r="1.6"/>
        <circle cx="590" cy="60" r="1.2"/><circle cx="40" cy="330" r="1.2"/><circle cx="610" cy="370" r="1.6"/>
      </g>
      <!-- האי -->
      <path d="M96 210 C 80 150, 140 96, 220 86 C 270 50, 360 44, 420 76 C 500 92, 590 140, 600 220
               C 610 290, 560 340, 470 338 C 420 362, 360 362, 330 346 C 270 360, 200 350, 160 316
               C 110 296, 104 252, 96 210 Z"
            fill="#2B4C7E" stroke="#A5561F" stroke-width="3"/>
      <!-- הרים בצפון והנחל -->
      <path d="M262 112 l30 -40 l30 40 z M300 112 l34 -46 l34 46 z" fill="#3A5784"/>
      <path d="M334 80 C 330 140, 300 170, 318 230 C 330 270, 316 300, 318 330" fill="none" stroke="#7FA6D9" stroke-width="4" stroke-linecap="round"/>
      <!-- רכס הרוחות -->
      <path d="M118 196 C 140 150, 180 150, 204 196 z" fill="#3A5784"/>
      <!-- הנמל -->
      <path d="M290 344 h56 v8 h-56 z" fill="#A5561F"/>
      ${houses}
      <g font-family="Assistant, Arial, sans-serif" font-size="16" fill="#FFFFFF" text-anchor="middle">
        <text x="150" y="222">רכס הרוחות</text>
        <text x="410" y="118">מפל השחף</text>
        <text x="250" y="250">עמק התאנים</text>
        <text x="492" y="252">הכפר</text>
        <text x="410" y="322">נמל הדייגים</text>
      </g>
    </svg>
    <figcaption>בכל תחנה שמסתיימת, עוד חלק של האי מתאיר.</figcaption>`;
}

// ----- 3. רשימת התחנות -----
function stop({ num, title, sub, href, ready, done }) {
  const li = document.createElement("li");
  li.className = "stop" + (done ? " is-done" : "") + (ready ? "" : " is-soon");
  const status = done
    ? `<span class="stop-status">${icon("bulbOn")}${icon("check", "icon stop-check")}<span class="visually-hidden">הושלמה</span></span>`
    : `<span class="stop-status">${icon("bulb", "icon stop-bulb-off")}</span>`;
  const inner = `
    <span class="stop-num" aria-hidden="true">${num}</span>
    <span class="stop-text">
      <span class="stop-title">${title}</span>
      <span class="stop-sub">${sub}</span>
    </span>
    ${ready ? status : `<span class="soon-tag">בקרוב</span>`}`;

  if (ready) {
    const a = document.createElement("a");
    a.className = "stop-card";
    a.href = href;
    a.innerHTML = inner;
    li.append(a);
  } else {
    const div = document.createElement("div");
    div.className = "stop-card";
    div.setAttribute("aria-disabled", "true");
    div.innerHTML = inner;
    li.append(div);
  }
  return li;
}

function renderJourney() {
  const list = document.getElementById("journey-list");
  stations.forEach((s) => {
    list.append(stop({
      num: s.num, title: s.title, sub: s.sub, href: s.href, ready: s.ready, done: isStationDone(s.id),
    }));
  });
  list.append(stop({
    num: "★", title: challenge.title, sub: challenge.sub, href: challenge.href,
    ready: challenge.ready, done: isStationDone(challenge.id),
  }));
}

renderCta();
renderIsland();
renderJourney();
