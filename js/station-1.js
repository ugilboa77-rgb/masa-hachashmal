// =========================================================
// station-1.js – החיבורים של תחנה 1 (המחולל)
//
// מה שמשותף לכל התחנות (סרטונים, משוב, נקודת ביקורת) נמצא
// ב-js/ui/station-kit.js. כאן רק מה שמיוחד לתחנה הזו:
// • הדמיית המחולל ומשימת התיקון
// • המשוב של ניסוי 4
// • שתי נקודות העתקה ליומן: סוף המעבדה וסוף הניסוי בידיים
// =========================================================

import { createCopyPoint, stamp, journalValue, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { createGeneratorSim } from "./sims/generator.js";
import { createRepairSim } from "./sims/repair.js";

const STATION = "s1";
const $ = (sel) => document.querySelector(sel);
const v = (key) => journalValue(STATION, key);

// ----- הדמיות -----
createGeneratorSim($("#gen-sim"));
createRepairSim($("#repair-sim"));

// ----- ניסוי 4: המשוב מופיע אחרי ניבוי, ואחרי שסובבו את הסליל -----
const e4Predict = $("#s1-e4-predict");
const e4Feedback = $("#s1-e4-feedback");
let coilSpun = false;
function checkE4() {
  if (coilSpun && e4Predict.value.trim()) e4Feedback.hidden = false;
}
$("#gen-sim").addEventListener("sim-change", (e) => {
  if (e.detail.spin === "coil" && e.detail.value > 0) {
    coilSpun = true;
    checkE4();
  }
});
e4Predict.addEventListener("input", checkE4);

// ----- נקודת העתקה: סוף המעבדה (הפורמט מתוך לשונית הסקירה) -----
createCopyPoint($("#s1-lab-copy"), {
  message: LAB_MESSAGE,
  getText: () => [
    `תחנה 1: המחולל – מעבדה | ${stamp()}`,
    `הניבוי שלי בפתיחה: ${v("s1.predict")}`,
    `ניסוי 1 – מהירות: לאט ${v("s1.e1.slow")} | בינוני ${v("s1.e1.mid")} | מהר ${v("s1.e1.fast")}`,
    `ההסבר שלי: ${v("s1.e1.explain")}`,
    `ניסוי 2 – חוזק מגנט: חלש ${v("s1.e2.weak")} | בינוני ${v("s1.e2.mid")} | חזק ${v("s1.e2.strong")}`,
    `ההסבר שלי: ${v("s1.e2.explain")}`,
    `ניסוי 3 – ליפופים: 10 → ${v("s1.e3.t10")} | 50 → ${v("s1.e3.t50")} | 100 → ${v("s1.e3.t100")}`,
    `ההסבר שלי: ${v("s1.e3.explain")}`,
    `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}`,
  ].join("\n"),
});

// ----- נקודת העתקה: סוף הניסוי בידיים -----
createCopyPoint($("#s1-hands-copy"), {
  message: HANDS_MESSAGE,
  getText: () => [
    `תחנה 1: המחולל – ניסוי בידיים | ${stamp()}`,
    `הכנסה מהירה: ${v("s1.hands.fastIn")}`,
    `הוצאה מהירה: ${v("s1.hands.fastOut")}`,
    `הכנסה איטית: ${v("s1.hands.slowIn")}`,
    `מגנט עומד בתוך הגליל: ${v("s1.hands.still")}`,
    `מתי המחט זזה הכי הרבה? ${v("s1.hands.c1")}`,
    `מה קרה כשהמגנט עמד? מה זה אומר על מחוללים? ${v("s1.hands.c2")}`,
    `למה הרחקנו את המצפן מהמגנט? ${v("s1.hands.c3")}`,
  ].join("\n"),
});
