// =========================================================
// station-1.js – החיבורים של תחנה 1 (המחולל)
//
// • סרטונים מתוך config.js
// • הדמיית המחולל ומשימת התיקון
// • המשפט שמופיע אחרי הניבוי בפתיחה
// • משוב אחרי ההסבר בכל ניסוי
// • שתי נקודות העתקה ליומן: סוף המעבדה וסוף הניסוי בידיים
// • כפתור נקודת הביקורת
// =========================================================

import { config } from "./config.js";
import { embedVideo, linkButton } from "./ui/links.js";
import { createCopyPoint, stamp } from "./ui/copy.js";
import { getJournalEntry, hintsUsed } from "./progress.js";
import { MIN_EXPLAIN } from "./ui/lock.js";
import { createGeneratorSim } from "./sims/generator.js";
import { createRepairSim } from "./sims/repair.js";

const STATION = "s1";
const $ = (sel) => document.querySelector(sel);
const v = (key) => {
  const e = getJournalEntry(STATION, key);
  return e && e.value ? e.value : "...";
};

// ----- סרטונים -----
document.querySelectorAll(".video-slot[data-video]").forEach((slot) => {
  const [station, name] = slot.dataset.video.split(".");
  const id = (config.videos[station] || {})[name] || "";
  embedVideo(slot, id, slot.dataset.videoTitle || "");
});

// ----- הדמיות -----
createGeneratorSim($("#gen-sim"));
createRepairSim($("#repair-sim"));

// ----- פתיחה: המשפט אחרי הבחירה -----
const predict = $("#s1-predict");
const after = $("#s1-predict-after");
const syncPredict = () => { after.hidden = !predict.querySelector("input:checked"); };
predict.addEventListener("change", syncPredict);
syncPredict();

// ----- משוב אחרי ההסבר (ניסויים 1–3) -----
// המשוב מופיע כשהתלמיד כתב הסבר של 10 תווים לפחות ועצר לרגע
document.querySelectorAll(".experiment").forEach((exp) => {
  const text = exp.querySelector("[data-explain]");
  const fb = exp.querySelector(".exp-feedback");
  if (!text || !fb) return;
  let timer = 0;
  const check = () => {
    if (text.value.trim().length >= MIN_EXPLAIN) fb.hidden = false;
  };
  text.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(check, 1500);
  });
  text.addEventListener("change", check);
  check();
});

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
  message: "סיימתם את המעבדה! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.",
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
// [ממתין לאישור אודי] המשפט שמעל הבלוק – במסמך יש נוסח רק למעבדה
createCopyPoint($("#s1-hands-copy"), {
  message: "סיימתם את הניסוי! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.",
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

// ----- נקודת ביקורת -----
$("#s1-checkpoint").append(
  linkButton(config.checkpoints.station1, "פתיחת נקודת הביקורת", "btn-primary btn-large")
);
