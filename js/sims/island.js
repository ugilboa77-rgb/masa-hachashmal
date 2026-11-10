// =========================================================
// island.js – מפת אי האלמוג ביום (משותפת לתחנות ולאתגר)
//
// אותה צורה כמו המפה בדף הבית, בצבעי יום.
// המקומות (לפי "שמות שאפשר לשנות" בלשונית הסקירה):
//   רכס הרוחות (מערב), עמק התאנים (מרכז), נחל השחף ומפל השחף (צפון),
//   נמל הדייגים (דרום), הכפר (מזרח).
// PLACES – נקודות במפה שבהן אפשר להציב תחנות.
// =========================================================

export const PLACES = {
  ridge:  { name: "רכס הרוחות", x: 158, y: 176 },
  valley: { name: "עמק התאנים", x: 262, y: 236 },
  coast:  { name: "החוף",       x: 548, y: 168 },
  falls:  { name: "מפל השחף",   x: 336, y: 120 },
  port:   { name: "נמל הדייגים", x: 318, y: 326 },
  village:{ name: "הכפר",       x: 492, y: 244 },
};

const ISLAND_PATH = `M96 210 C 80 150, 140 96, 220 86 C 270 50, 360 44, 420 76 C 500 92, 590 140, 600 220
  C 610 290, 560 340, 470 338 C 420 362, 360 362, 330 346 C 270 360, 200 350, 160 316
  C 110 296, 104 252, 96 210 Z`;

/** החלקים הקבועים של המפה. labels: אילו שמות מקומות להציג */
export function islandBase({ labels = [] } = {}) {
  const houses = [[470, 262], [496, 270], [522, 258], [486, 232], [512, 236]]
    .map(([x, y]) => `<path d="M${x - 10} ${y} v-11 l10 -9 l10 9 v11 z" fill="#FFFFFF" stroke="#4A5870" stroke-width="1.5"/>`)
    .join("");
  const text = labels.map((k) => {
    const p = PLACES[k];
    return `<text x="${p.x}" y="${p.y + 34}">${p.name}</text>`;
  }).join("");
  return `
    <rect width="640" height="400" rx="20" fill="#CFE0F2"/>
    <g stroke="#B5CDE8" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M40 60 q12 -8 24 0 t24 0"/><path d="M560 360 q12 -8 24 0 t24 0"/><path d="M30 340 q12 -8 24 0 t24 0"/>
    </g>
    <path d="${ISLAND_PATH}" fill="#E4EBD2" stroke="#A5561F" stroke-width="3"/>
    <path d="M262 112 l30 -40 l30 40 z M300 112 l34 -46 l34 46 z" fill="#A9B5C6"/>
    <path d="M334 80 C 330 140, 300 170, 318 230 C 330 270, 316 300, 318 330" fill="none" stroke="#4F86C6" stroke-width="4" stroke-linecap="round"/>
    <path d="M110 200 C 136 140, 184 140, 210 200 z" fill="#B9C79E"/>
    <g fill="#9DB57F"><circle cx="246" cy="226" r="8"/><circle cx="264" cy="218" r="9"/><circle cx="282" cy="228" r="8"/></g>
    <path d="M290 344 h56 v8 h-56 z" fill="#A5561F"/>
    ${houses}
    <g class="island-labels" font-family="Assistant, Arial, sans-serif" font-size="17" font-weight="600" fill="#12284A" text-anchor="middle">${text}</g>`;
}

/** חצי רוח: עבים על הרכס, בינוניים על החוף, כמעט כלום בעמק */
export function windArrows() {
  const arrow = (x, y, w, len) =>
    `<g stroke="#1D3A66" stroke-width="${w}" stroke-linecap="round" fill="none">
       <path d="M${x} ${y} h${len}"/><path d="M${x + len - w * 2.2} ${y - w * 2} l${w * 2.2} ${w * 2} l${-w * 2.2} ${w * 2}"/>
     </g>`;
  return `
    <g class="wind-arrows">
      ${arrow(70, 120, 7, 90)}${arrow(84, 152, 7, 86)}${arrow(70, 232, 6, 80)}
      ${arrow(500, 128, 4, 70)}${arrow(520, 206, 4, 60)}${arrow(420, 300, 3.5, 56)}
      ${arrow(246, 196, 1.5, 26)}
    </g>`;
}
