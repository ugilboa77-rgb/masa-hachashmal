// =========================================================
// station-2.js – החיבורים של תחנה 2 (טורבינת רוח)
// • מפת הרוחות בפתיחה
// • הדמיית הטורבינה והיום השלם באי
// • שתי נקודות העתקה ליומן
// =========================================================

import { createCopyPoint, stamp, journalValue, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { islandBase, windArrows } from "./sims/island.js";
import { createWindSim, createWindDay } from "./sims/wind.js";

const STATION = "s2";
const $ = (sel) => document.querySelector(sel);
const v = (key) => journalValue(STATION, key);

// ----- מפת הרוחות -----
$("#s2-wind-map").innerHTML = islandBase({ labels: ["ridge", "valley", "coast", "village"] }) + windArrows();

// ----- הדמיות -----
createWindSim($("#wind-sim"));
createWindDay($("#wind-day"));

// ----- נקודות העתקה -----
createCopyPoint($("#s2-lab-copy"), {
  message: LAB_MESSAGE,
  getText: () => [
    `תחנה 2: טורבינת רוח – מעבדה | ${stamp()}`,
    `הניבוי שלי בפתיחה: ${v("s2.predict")}. ${v("s2.predictWhy")}`,
    `ניסוי 1 – מהירות הרוח: שקט ${v("s2.e1.calm")} | בריזה ${v("s2.e1.breeze")} | רוח חזקה ${v("s2.e1.strong")} | סערה ${v("s2.e1.storm")}`,
    `ההסבר שלי: ${v("s2.e1.explain")}`,
    `ניסוי 2 – כיוון הרוח`,
    `ההסבר שלי: ${v("s2.e2.explain")}`,
    `ניסוי 3 – יום שלם באי`,
    `ההסבר שלי: ${v("s2.e3.explain")}`,
    `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}`,
  ].join("\n"),
});

createCopyPoint($("#s2-hands-copy"), {
  message: HANDS_MESSAGE,
  getText: () => [
    `תחנה 2: טורבינת רוח – ניסוי בידיים | ${stamp()}`,
    `100 ס״מ (רוח חלשה): ${v("s2.hands.d100a")} | ${v("s2.hands.d100b")}`,
    `50 ס״מ: ${v("s2.hands.d50a")} | ${v("s2.hands.d50b")}`,
    `25 ס״מ (רוח חזקה): ${v("s2.hands.d25a")} | ${v("s2.hands.d25b")}`,
    `באיזה מרחק האטב עלה הכי מהר? למה? ${v("s2.hands.c1")}`,
    `למה מדדנו כל פעם פעמיים? ${v("s2.hands.c2")}`,
    `בטורבינה אמיתית, מה מסובב הציר במקום להרים אטב? ${v("s2.hands.c3")}`,
  ].join("\n"),
});
