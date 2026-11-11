// =========================================================
// station-4.js – החיבורים של תחנה 4 (תחנה קיטורית)
// • התרשים המונפש בכרטיס 2, ההדמיה ושבועיים באי
// • המשוב של ניסוי 3 (אחרי שניסו גם פחם וגם גז)
// • נקודת העתקה אחת: סוף המעבדה (אין ניסוי בידיים בתחנה הזו)
// =========================================================

import { createCopyPoint, stamp, answerOf, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { plantDiagram, createSteamSim, createSteamWeeks } from "./sims/steam.js";

const STATION = "s4";
const $ = (sel) => document.querySelector(sel);
const a = (key) => answerOf(STATION, key);

plantDiagram($("#plant-diagram"));
createSteamSim($("#steam-sim"));
createSteamWeeks($("#steam-weeks"));

// ניסוי 3: המשוב מופיע אחרי ששרפו גם פחם וגם גז
const tried = new Set();
const e3 = $("#s4-e3-feedback");
const checkE3 = () => { if (tried.size === 2 && !e3.closest(".is-locked")) e3.hidden = false; };
$("#steam-sim").addEventListener("sim-change", (e) => {
  if (e.detail.fuel > 0) tried.add(e.detail.type);
  checkE3();
});
document.addEventListener("experiment-unlocked", checkE3);

// נקודת העתקה: סוף המעבדה (השאלות והכותרות – אותן מילים שבעמוד התחנה)
createCopyPoint($("#s4-lab-copy"), {
  message: LAB_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 4: תחנה קיטורית",
    part: "מעבדה",
    stamp: stamp(),
    items: [
      { type: "qa", q: "הניבוי שלי בפתיחה", a: a("s4.predict") },
      { type: "heading", text: "ניסוי 1: כמה דלק שורפים" },
      { type: "qa", q: "מה מקבלים כששורפים יותר דלק, ומה משלמים?", a: a("s4.e1.explain") },
      { type: "heading", text: "ניסוי 2: האונייה מתעכבת" },
      { type: "qa", q: "למה תחנה שתלויה באונייה היא סיכון לאי?", a: a("s4.e2.explain") },
      { type: "note", text: `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}` },
    ],
  }),
});
