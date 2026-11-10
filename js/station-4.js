// =========================================================
// station-4.js – החיבורים של תחנה 4 (תחנה קיטורית)
// • התרשים המונפש בכרטיס 2, ההדמיה ושבועיים באי
// • המשוב של ניסוי 3 (אחרי שניסו גם פחם וגם גז)
// • נקודת העתקה אחת: סוף המעבדה (אין ניסוי בידיים בתחנה הזו)
// =========================================================

import { createCopyPoint, stamp, journalValue, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { plantDiagram, createSteamSim, createSteamWeeks } from "./sims/steam.js";

const STATION = "s4";
const $ = (sel) => document.querySelector(sel);
const v = (key) => journalValue(STATION, key);

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

createCopyPoint($("#s4-lab-copy"), {
  message: LAB_MESSAGE,
  getText: () => [
    `תחנה 4: תחנה קיטורית – מעבדה | ${stamp()}`,
    `הניבוי שלי בפתיחה: ${v("s4.predict")}`,
    `ניסוי 1 – כמה דלק שורפים`,
    `ההסבר שלי: ${v("s4.e1.explain")}`,
    `ניסוי 2 – האונייה מתעכבת`,
    `ההסבר שלי: ${v("s4.e2.explain")}`,
    `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}`,
  ].join("\n"),
});
