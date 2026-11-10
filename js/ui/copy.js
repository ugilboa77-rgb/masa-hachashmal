// =========================================================
// copy.js – נקודת העתקה ליומן המהנדס ב-Google Docs
//
// מציג בלוק טקסט מסודר, כפתור "העתקה" וקישור "פתיחת היומן".
// ההעתקה קורית בתוך הלחיצה (navigator.clipboard). אם הדפדפן
// לא מרשה, הטקסט מסומן כדי שאפשר יהיה להעתיק בעצמכם (Ctrl+C).
// =========================================================

import { config } from "../config.js";
import { icon } from "./icons.js";
import { linkButton } from "./links.js";
import { getJournalEntry } from "../progress.js";

// המשפט שמעל נקודת ההעתקה – מתוך לשונית הסקירה במסמך התוכן
export const LAB_MESSAGE = "סיימתם את המעבדה! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.";
// [ממתין לאישור אודי] במסמך יש נוסח רק למעבדה. זה הנוסח הזמני לסוף הניסוי בידיים
export const HANDS_MESSAGE = "סיימתם את הניסוי! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.";

/** הערך שהתלמיד כתב ביומן, או "..." אם עוד לא כתב */
export function journalValue(stationId, key) {
  const e = getJournalEntry(stationId, key);
  return e && e.value ? e.value : "...";
}

/** תאריך ושעה בפורמט של היומן: 12.11, 10:42 */
export function stamp(d = new Date()) {
  const two = (n) => String(n).padStart(2, "0");
  return `${d.getDate()}.${d.getMonth() + 1}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}

async function copyText(text, textarea) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ממשיכים לחלופה
  }
  try {
    textarea.focus();
    textarea.select();
    return document.execCommand("copy");
  } catch {
    return false;
  }
}

/**
 * יוצר נקודת העתקה.
 * @param {HTMLElement} host – איפה לשים אותה
 * @param {object} opts
 *   message – השורה שמעל הבלוק (מתוך מסמך התוכן)
 *   getText – פונקציה שמחזירה את הטקסט להעתקה (נקראת מחדש בכל פעם)
 */
export function createCopyPoint(host, { message, getText }) {
  const box = document.createElement("div");
  box.className = "copy-point";
  const uid = `copy-${Math.random().toString(36).slice(2, 8)}`;
  box.innerHTML = `
    <p class="copy-message">${message}</p>
    <label class="visually-hidden" for="${uid}">הטקסט להעתקה</label>
    <textarea id="${uid}" class="copy-text" readonly rows="8" dir="rtl"></textarea>
    <div class="copy-actions">
      <button type="button" class="btn btn-primary copy-btn">${icon("copy")}<span>העתקה</span></button>
      <span class="copy-journal-link"></span>
    </div>
    <p class="copy-status" role="status" aria-live="polite"></p>`;
  host.append(box);

  const textarea = box.querySelector(".copy-text");
  const status = box.querySelector(".copy-status");
  box.querySelector(".copy-journal-link").append(
    linkButton(config.journalDoc, "פתיחת היומן", "btn-secondary")
  );

  function refresh() {
    const text = getText();
    textarea.value = text;
    textarea.rows = Math.min(14, Math.max(4, text.split("\n").length + 1));
  }

  box.querySelector(".copy-btn").addEventListener("click", async () => {
    refresh();
    const ok = await copyText(textarea.value, textarea);
    status.className = "copy-status " + (ok ? "is-ok" : "is-warn");
    status.innerHTML = ok
      ? `${icon("check")}<span>הועתק! עכשיו הדביקו ביומן (Ctrl+V).</span>`
      : `<span>הטקסט מסומן. העתיקו אותו בעצמכם (Ctrl+C).</span>`;
    if (!ok) { textarea.focus(); textarea.select(); }
  });

  // הטקסט מתעדכן בכל פעם שהתלמיד כותב או עובר חלק
  textarea.addEventListener("focus", refresh);
  document.addEventListener("journal-change", refresh);
  document.addEventListener("part-shown", refresh);
  refresh();
  return { refresh };
}
