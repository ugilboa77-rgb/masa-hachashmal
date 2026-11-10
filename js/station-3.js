// =========================================================
// station-3.js – החיבורים של תחנה 3 (תחנה הידרואלקטרית)
// • הדמיית הסכר והשבוע בסכר
// • שתי נקודות העתקה ליומן
// =========================================================

import { createCopyPoint, stamp, journalValue, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { createHydroSim, createHydroWeek } from "./sims/hydro.js";

const STATION = "s3";
const $ = (sel) => document.querySelector(sel);
const v = (key) => journalValue(STATION, key);

createHydroSim($("#hydro-sim"));
createHydroWeek($("#hydro-week"));

createCopyPoint($("#s3-lab-copy"), {
  message: LAB_MESSAGE,
  getText: () => [
    `תחנה 3: תחנה הידרואלקטרית – מעבדה | ${stamp()}`,
    `הניבוי שלי בפתיחה: ${v("s3.predict")}`,
    `ניסוי 1 – גובה הנפילה: נמוך ${v("s3.e1.low")} | בינוני ${v("s3.e1.mid")} | גבוה ${v("s3.e1.high")}`,
    `ההסבר שלי: ${v("s3.e1.explain")}`,
    `ניסוי 2 – כמות המים: ברבע ${v("s3.e2.quarter")} | בחצי ${v("s3.e2.half")} | לגמרי ${v("s3.e2.full")}`,
    `ההסבר שלי: ${v("s3.e2.explain")}`,
    `ניסוי 3 – קיץ יבש`,
    `ההסבר שלי: ${v("s3.e3.explain")}`,
    `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}`,
  ].join("\n"),
});

createCopyPoint($("#s3-hands-copy"), {
  message: HANDS_MESSAGE,
  getText: () => [
    `תחנה 3: תחנה הידרואלקטרית – ניסוי בידיים | ${stamp()}`,
    `10 ס״מ: ${v("s3.hands.h10")} סיבובים`,
    `30 ס״מ: ${v("s3.hands.h30")} סיבובים`,
    `50 ס״מ: ${v("s3.hands.h50")} סיבובים`,
    `מאיזה גובה הגלגל סב הכי מהר? ${v("s3.hands.c1")}`,
    `איך זה מתאים למה שראיתם במעבדה? ${v("s3.hands.c2")}`,
    `מה עוד אפשר לשנות כדי שהגלגל יסתובב מהר יותר? ${v("s3.hands.c3")}`,
  ].join("\n"),
});
