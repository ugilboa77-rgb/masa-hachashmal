// =========================================================
// station-1.js – החיבורים של תחנה 1 (המחולל)
//
// מה שמשותף לכל התחנות (סרטונים, משוב, נקודת ביקורת) נמצא
// ב-js/ui/station-kit.js. כאן רק מה שמיוחד לתחנה הזו:
// • הדמיית המחולל ומשימת התיקון
// • המשוב של ניסוי 4
// • שתי נקודות העתקה ליומן: סוף המעבדה וסוף הניסוי בידיים
// =========================================================

import { createCopyPoint, stamp, answerOf, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { createGeneratorSim } from "./sims/generator.js";
import { createRepairSim } from "./sims/repair.js";

const STATION = "s1";
const $ = (sel) => document.querySelector(sel);
const a = (key) => answerOf(STATION, key);

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

// ----- נקודת העתקה: סוף המעבדה -----
// השאלות והכותרות הן אותן מילים שמופיעות בעמוד התחנה
createCopyPoint($("#s1-lab-copy"), {
  message: LAB_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 1: המחולל",
    part: "מעבדה",
    stamp: stamp(),
    items: [
      { type: "qa", q: "הניבוי שלי בפתיחה", a: a("s1.predict") },
      { type: "heading", text: "ניסוי 1: מהירות הסיבוב" },
      { type: "table", headers: ["מהירות", "מד חשמל (0–10)"],
        rows: [["לאט", a("s1.e1.slow")], ["בינוני", a("s1.e1.mid")], ["מהר", a("s1.e1.fast")]] },
      { type: "qa", q: "מה הקשר בין מהירות הסיבוב לכמות החשמל?", a: a("s1.e1.explain") },
      { type: "heading", text: "ניסוי 2: חוזק המגנט" },
      { type: "table", headers: ["מגנט", "מד חשמל (0–10)"],
        rows: [["חלש", a("s1.e2.weak")], ["בינוני", a("s1.e2.mid")], ["חזק", a("s1.e2.strong")]] },
      { type: "qa", q: "למה חשוב שהמהירות תישאר אותו דבר כשמחליפים מגנט?", a: a("s1.e2.explain") },
      { type: "heading", text: "ניסוי 3: מספר הליפופים" },
      { type: "table", headers: ["ליפופים", "מד חשמל (0–10)"],
        rows: [["10", a("s1.e3.t10")], ["50", a("s1.e3.t50")], ["100", a("s1.e3.t100")]] },
      { type: "qa", q: "אילו שלושה דברים מגדילים את כמות החשמל שמחולל מייצר?", a: a("s1.e3.explain") },
      { type: "note", text: `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}` },
    ],
  }),
});

// ----- נקודת העתקה: סוף הניסוי בידיים -----
createCopyPoint($("#s1-hands-copy"), {
  message: HANDS_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 1: המחולל",
    part: "ניסוי בידיים",
    stamp: stamp(),
    items: [
      { type: "table", headers: ["מה עשינו", "מה קרה למחט?"],
        rows: [
          ["הכנסה מהירה", a("s1.hands.fastIn")],
          ["הוצאה מהירה", a("s1.hands.fastOut")],
          ["הכנסה איטית", a("s1.hands.slowIn")],
          ["מגנט עומד בתוך הגליל", a("s1.hands.still")],
        ] },
      { type: "qa", q: "מתי המחט זזה הכי הרבה?", a: a("s1.hands.c1") },
      { type: "qa", q: "מה קרה כשהמגנט עמד? מה זה אומר על מחוללים?", a: a("s1.hands.c2") },
      { type: "qa", q: "למה הרחקנו את המצפן מהמגנט?", a: a("s1.hands.c3") },
    ],
  }),
});
