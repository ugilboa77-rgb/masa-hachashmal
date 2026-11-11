// =========================================================
// station-2.js – החיבורים של תחנה 2 (טורבינת רוח)
// • מפת הרוחות בפתיחה
// • הדמיית הטורבינה והיום השלם באי
// • שתי נקודות העתקה ליומן
// =========================================================

import { createCopyPoint, stamp, answerOf, HANDS_MESSAGE, LAB_MESSAGE } from "./ui/copy.js";
import { hintsUsed } from "./progress.js";
import { islandBase, windArrows } from "./sims/island.js";
import { createWindSim, createWindDay } from "./sims/wind.js";

const STATION = "s2";
const $ = (sel) => document.querySelector(sel);
const a = (key) => answerOf(STATION, key);

// ----- מפת הרוחות -----
$("#s2-wind-map").innerHTML = islandBase({ labels: ["ridge", "valley", "coast", "village"] }) + windArrows();

// ----- הדמיות -----
createWindSim($("#wind-sim"));
createWindDay($("#wind-day"));

// ----- נקודות העתקה (השאלות והכותרות – אותן מילים שבעמוד התחנה) -----
createCopyPoint($("#s2-lab-copy"), {
  message: LAB_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 2: טורבינת רוח",
    part: "מעבדה",
    stamp: stamp(),
    items: [
      { type: "qa", q: "איפה הייתם מציבים טורבינת רוח?", a: a("s2.predict") },
      { type: "qa", q: "ולמה?", a: a("s2.predictWhy") },
      { type: "heading", text: "ניסוי 1: מהירות הרוח" },
      { type: "table", headers: ["מהירות הרוח", "מד חשמל (0–10)"],
        rows: [["שקט", a("s2.e1.calm")], ["בריזה", a("s2.e1.breeze")], ["רוח חזקה", a("s2.e1.strong")], ["סערה", a("s2.e1.storm")]] },
      { type: "qa", q: "למה בסערה המד ירד לאפס?", a: a("s2.e1.explain") },
      { type: "heading", text: "ניסוי 2: כיוון הרוח" },
      { type: "qa", q: "למה בית המכונות של טורבינה יכול להסתובב על התורן?", a: a("s2.e2.explain") },
      { type: "heading", text: "ניסוי 3: יום שלם באי" },
      { type: "qa", q: "איפה הכי כדאי להציב טורבינה? ומה קורה לכפר בשעות שבהן אין רוח?", a: a("s2.e3.explain") },
      { type: "note", text: `רמזים שהשתמשתי בהם: ${hintsUsed(STATION)}` },
    ],
  }),
});

createCopyPoint($("#s2-hands-copy"), {
  message: HANDS_MESSAGE,
  getBlocks: () => ({
    title: "תחנה 2: טורבינת רוח",
    part: "ניסוי בידיים",
    stamp: stamp(),
    items: [
      { type: "table", headers: ["מרחק מהמאוורר", "זמן הרמה, מדידה 1", "זמן הרמה, מדידה 2"],
        rows: [
          ["100 ס״מ (רוח חלשה)", a("s2.hands.d100a"), a("s2.hands.d100b")],
          ["50 ס״מ", a("s2.hands.d50a"), a("s2.hands.d50b")],
          ["25 ס״מ (רוח חזקה)", a("s2.hands.d25a"), a("s2.hands.d25b")],
        ] },
      { type: "qa", q: "באיזה מרחק האטב עלה הכי מהר? למה?", a: a("s2.hands.c1") },
      { type: "qa", q: "למה מדדנו כל פעם פעמיים?", a: a("s2.hands.c2") },
      { type: "qa", q: "בטורבינה אמיתית, מה מסובב הציר במקום להרים אטב?", a: a("s2.hands.c3") },
    ],
  }),
});
