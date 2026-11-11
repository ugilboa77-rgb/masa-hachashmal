// =========================================================
// station-3.js – החיבורים של תחנה 3 (תחנה הידרואלקטרית)
// • הדמיית הסכר והשבוע בסכר
// • שתי נקודות העתקה ליומן
// =========================================================

import { createCopyPoint, stamp, answerOf, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { createHydroSim, createHydroWeek } from "./sims/hydro.js";

const STATION = "s3";
const $ = (sel) => document.querySelector(sel);
const a = (key) => answerOf(STATION, key);

createHydroSim($("#hydro-sim"));
createHydroWeek($("#hydro-week"));

// ----- נקודות העתקה (השאלות והכותרות – אותן מילים שבעמוד התחנה) -----
createCopyPoint($("#s3-lab-copy"), {
  message: LAB_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 3: תחנה הידרואלקטרית",
    part: "מעבדה",
    stamp: stamp(),
    items: [
      { type: "qa", q: "הניבוי שלי בפתיחה", a: a("s3.predict") },
      { type: "heading", text: "ניסוי 1: גובה הנפילה" },
      { type: "table", headers: ["גובה הנפילה", "מד חשמל (0–10)"],
        rows: [["נמוך", a("s3.e1.low")], ["בינוני", a("s3.e1.mid")], ["גבוה", a("s3.e1.high")]] },
      { type: "qa", q: "למה בונים תחנות כאלה באזורים הרריים?", a: a("s3.e1.explain") },
      { type: "heading", text: "ניסוי 2: כמות המים" },
      { type: "table", headers: ["פתיחת השער", "מד חשמל (0–10)"],
        rows: [["ברבע", a("s3.e2.quarter")], ["בחצי", a("s3.e2.half")], ["לגמרי", a("s3.e2.full")]] },
      { type: "qa", q: "מה קרה למאגר כשהשער היה פתוח לגמרי? למה לא תמיד פותחים אותו עד הסוף?", a: a("s3.e2.explain") },
      { type: "heading", text: "ניסוי 3: קיץ יבש" },
      { type: "qa", q: "באיזו עונה הסכר מספיק לכפר, ובאיזו לא? מה עזר לכם לחסוך מים?", a: a("s3.e3.explain") },
      { type: "note", text: `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}` },
    ],
  }),
});

createCopyPoint($("#s3-hands-copy"), {
  message: HANDS_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 3: תחנה הידרואלקטרית",
    part: "ניסוי בידיים",
    stamp: stamp(),
    items: [
      { type: "table", headers: ["גובה השפיכה", "סיבובים ב-10 שניות"],
        rows: [["10 ס״מ", a("s3.hands.h10")], ["30 ס״מ", a("s3.hands.h30")], ["50 ס״מ", a("s3.hands.h50")]] },
      { type: "qa", q: "מאיזה גובה הגלגל סב הכי מהר?", a: a("s3.hands.c1") },
      { type: "qa", q: "איך זה מתאים למה שראיתם במעבדה?", a: a("s3.hands.c2") },
      { type: "qa", q: "מה עוד אפשר לשנות כדי שהגלגל יסתובב מהר יותר?", a: a("s3.hands.c3") },
    ],
  }),
});
