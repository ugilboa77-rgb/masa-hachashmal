// =========================================================
// copy.js – נקודת העתקה ליומן המהנדס ב-Google Docs
//
// כל נקודת העתקה מתארת את התוכן שלה כ"בלוק" אחד (getBlocks):
//   { title: "תחנה 1: המחולל", part: "ניסוי בידיים", stamp: "12.11, 10:42",
//     items: [
//       { type: "heading", text: "ניסוי 1: מהירות הסיבוב" },
//       { type: "table", headers: ["מה עשינו", "מה קרה למחט?"], rows: [["הכנסה מהירה", "זזה הרבה"]] },
//       { type: "qa", q: "מתי המחט זזה הכי הרבה?", a: "..." },
//       { type: "fact", label: "עלות", value: "94 מתוך 100 מטבעות" },
//       { type: "note", text: "רמזים שהשתמשתי בהם: 1" },
//     ] }
// מהבלוק נבנים שלושה דברים:
//   • HTML עם עיצוב מוטבע – זה מה שמודבק ב-Google Docs
//   • כרטיס תצוגה באתר – אותו מבנה, מעוצב לפי css/tokens.css
//   • טקסט רגיל – גיבוי, כשהדפדפן לא מרשה להעתיק HTML
// ההעתקה קורית בתוך הלחיצה. אם היא נכשלת, מופיעה תיבת טקסט
// מסומנת כדי שאפשר יהיה להעתיק בעצמכם (Ctrl+C).
// =========================================================

import { config } from "../config.js";
import { icon } from "./icons.js";
import { linkButton } from "./links.js";
import { getJournalEntry } from "../progress.js";

// המשפט שמעל נקודת ההעתקה – מתוך לשונית הסקירה במסמך התוכן
export const LAB_MESSAGE = "סיימתם את המעבדה! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.";
// [ממתין לאישור אודי] במסמך יש נוסח רק למעבדה. זה הנוסח הזמני לסוף הניסוי בידיים
export const HANDS_MESSAGE = "סיימתם את הניסוי! העתיקו את העבודה שלכם ליומן המהנדס ב-Classroom.";

/** מה שמופיע כשהתלמיד עוד לא ענה */
export const EMPTY = "לא נענה";

/** הערך שהתלמיד כתב ביומן, או "" אם עוד לא כתב (ואז בהעתקה יופיע "לא נענה") */
export function answerOf(stationId, key) {
  const e = getJournalEntry(stationId, key);
  return e && e.value ? String(e.value) : "";
}

/** תאריך ושעה בפורמט של היומן: 12.11, 10:42 */
export function stamp(d = new Date()) {
  const two = (n) => String(n).padStart(2, "0");
  return `${d.getDate()}.${d.getMonth() + 1}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "";

// ---------------------------------------------------------
// 1. HTML – אותו מבנה לאתר וללוח ההעתקה
// ---------------------------------------------------------

// עיצוב מוטבע ללוח ההעתקה. Google Docs מתעלם מ-CSS חיצוני,
// ולכן כל אלמנט מקבל style משלו, וכולם מימין לשמאל.
const C = { text: "#16233A", text2: "#4A5870", line: "#8C99AD", head: "#12284A", headBg: "#E6EDF7", warn: "#9A5B00" };
const RTL = "direction:rtl;text-align:right;";
const FONT = "font-family:Assistant,Arial,sans-serif;";
const INLINE = {
  wrap:    `${RTL}${FONT}color:${C.text};font-size:12pt;`,
  title:   `${RTL}font-family:Rubik,Arial,sans-serif;color:${C.head};font-size:14pt;font-weight:bold;margin:0 0 2pt 0;`,
  stamp:   `${RTL}${FONT}color:${C.text2};font-size:9pt;margin:0 0 8pt 0;`,
  heading: `${RTL}${FONT}color:${C.head};font-size:12pt;font-weight:bold;margin:10pt 0 4pt 0;`,
  q:       `${RTL}${FONT}color:${C.text};font-size:12pt;font-weight:bold;margin:8pt 0 2pt 0;`,
  a:       `${RTL}${FONT}color:${C.text};font-size:12pt;margin:0 0 6pt 0;`,
  empty:   `color:${C.warn};font-weight:bold;`,
  fact:    `${RTL}${FONT}color:${C.text};font-size:12pt;margin:0 0 3pt 0;`,
  factL:   "font-weight:bold;",
  table:   `${RTL}border-collapse:collapse;margin:2pt 0 8pt 0;`,
  th:      `${RTL}${FONT}border:1px solid ${C.line};background:${C.headBg};color:${C.head};font-weight:bold;font-size:11pt;padding:3pt 8pt;`,
  td:      `${RTL}${FONT}border:1px solid ${C.line};color:${C.text};font-size:11pt;padding:3pt 8pt;`,
  note:    `${RTL}${FONT}color:${C.text2};font-size:9pt;margin:10pt 0 0 0;`,
};

/**
 * בונה HTML מהבלוק.
 * forClipboard=true: עיצוב מוטבע, ולפי config.copyTableReverse – סדר עמודות הפוך.
 * forClipboard=false: מחלקות CSS לכרטיס התצוגה באתר.
 */
export function blockToHtml(block, { forClipboard = false } = {}) {
  const at = (name, tag) => forClipboard
    ? ` dir="rtl" style="${INLINE[name]}"`
    : ` class="cp-${name}"${tag === "wrap" ? ' dir="rtl"' : ""}`;
  const answer = (v) => isEmpty(v)
    ? `<span${forClipboard ? ` style="${INLINE.empty}"` : ' class="cp-empty"'}>${EMPTY}</span>`
    : esc(v).replace(/\n/g, "<br>");
  const reverse = forClipboard && config.copyTableReverse === true;
  const cols = (arr) => (reverse ? [...arr].reverse() : arr);

  let qNum = 0;
  const parts = block.items.map((it) => {
    switch (it.type) {
      case "heading":
        return `<p${at("heading")}>${esc(it.text)}</p>`;
      case "qa":
        qNum += 1;
        return `<p${at("q")}>${qNum}. ${esc(it.q)}</p><p${at("a")}>${answer(it.a)}</p>`;
      case "fact":
        return `<p${at("fact")}><span${forClipboard ? ` style="${INLINE.factL}"` : ' class="cp-fact-label"'}>${esc(it.label)}:</span> ${answer(it.value)}</p>`;
      case "table": {
        const head = `<tr>${cols(it.headers).map((h) => `<th${at("th")}>${esc(h)}</th>`).join("")}</tr>`;
        const body = it.rows.map((r) => `<tr>${cols(r).map((c, i) => {
          // התא הראשון (מה עשינו) הוא תיאור, לא תשובה – לא מסמנים אותו "לא נענה"
          const first = reverse ? i === r.length - 1 : i === 0;
          return `<td${at("td")}>${first ? esc(c) : answer(c)}</td>`;
        }).join("")}</tr>`).join("");
        return `<table${at("table")}><thead>${head}</thead><tbody>${body}</tbody></table>`;
      }
      case "note":
        return `<p${at("note")}>${esc(it.text)}</p>`;
      default:
        return "";
    }
  }).join("");

  const title = block.part ? `${block.title} – ${block.part}` : block.title;
  const h3 = forClipboard ? `<h3 dir="rtl" style="${INLINE.title}">${esc(title)}</h3>` : `<h3 class="cp-title">${esc(title)}</h3>`;
  const st = block.stamp ? `<p${at("stamp")}>${esc(block.stamp)}</p>` : "";
  return `<div${at("wrap", "wrap")}>${h3}${st}${parts}</div>`;
}

// ---------------------------------------------------------
// 2. טקסט רגיל – גיבוי
// ---------------------------------------------------------
export function blockToText(block) {
  const out = [];
  const title = block.part ? `${block.title} – ${block.part}` : block.title;
  out.push(block.stamp ? `${title} | ${block.stamp}` : title, "");
  const val = (v) => (isEmpty(v) ? EMPTY : String(v));
  let qNum = 0;
  block.items.forEach((it) => {
    switch (it.type) {
      case "heading":
        out.push(it.text);
        break;
      case "qa":
        qNum += 1;
        out.push(`${qNum}. ${it.q}`, `תשובה: ${val(it.a)}`, "");
        break;
      case "fact":
        out.push(`${it.label}: ${val(it.value)}`);
        break;
      case "table": {
        const sep = it.headers.length === 2 ? " ← " : " | ";
        out.push(it.headers.join(sep));
        it.rows.forEach((r) => out.push(r.map((c, i) => (i === 0 ? c : val(c))).join(sep)));
        out.push("");
        break;
      }
      case "note":
        out.push("", it.text);
        break;
      default:
    }
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ---------------------------------------------------------
// 3. ההעתקה עצמה
// ---------------------------------------------------------
async function writeClipboard(html, text) {
  if (!navigator.clipboard || !window.isSecureContext) return false;
  // עשיר: גם HTML וגם טקסט רגיל, והתוכנה שמדביקים בה בוחרת
  if (html && navigator.clipboard.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      })]);
      return true;
    } catch {
      // ממשיכים לטקסט רגיל
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * חלופה כשהדפדפן חוסם את הגישה ללוח (קורה במחשבים מנוהלים):
 * פקודת ההעתקה הישנה, ובזמן ההעתקה ממלאים את הלוח בעצמנו – גם HTML וגם טקסט.
 */
function copyViaEvent(html, text) {
  let filled = false;
  const onCopy = (e) => {
    if (!e.clipboardData) return;
    e.clipboardData.setData("text/plain", text);
    if (html) e.clipboardData.setData("text/html", html);
    e.preventDefault();
    filled = true;
  };
  document.addEventListener("copy", onCopy, true);
  try {
    return document.execCommand("copy") && filled;
  } catch {
    return false;
  } finally {
    document.removeEventListener("copy", onCopy, true);
  }
}

function copyFromTextarea(textarea) {
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
 *   message   – השורה שמעל הבלוק (מתוך מסמך התוכן)
 *   getBlocks – פונקציה שמחזירה בלוק (או מערך בלוקים). נקראת מחדש בכל פעם
 *   link      – קישור אחר במקום "פתיחת היומן" (למשל טופס ההגשה באתגר)
 */
export function createCopyPoint(host, { message, getBlocks, link = null }) {
  const box = document.createElement("div");
  box.className = "copy-point";
  const uid = `copy-${Math.random().toString(36).slice(2, 8)}`;
  box.innerHTML = `
    ${message ? `<p class="copy-message">${message}</p>` : ""}
    <div class="copy-preview" role="region" tabindex="0" aria-label="מה שיודבק ביומן"></div>
    <label class="visually-hidden" for="${uid}">הטקסט להעתקה</label>
    <textarea id="${uid}" class="copy-text" readonly rows="8" dir="rtl" hidden></textarea>
    <div class="copy-actions">
      <button type="button" class="btn btn-primary copy-btn">${icon("copy")}<span>העתקה</span></button>
      <span class="copy-journal-link"></span>
    </div>
    <p class="copy-status" role="status" aria-live="polite"></p>`;
  host.append(box);

  const preview = box.querySelector(".copy-preview");
  const textarea = box.querySelector(".copy-text");
  const status = box.querySelector(".copy-status");
  box.querySelector(".copy-journal-link").append(
    link ? linkButton(link.url, link.label, "btn-secondary") : linkButton(config.journalDoc, "פתיחת היומן", "btn-secondary")
  );

  let current = { html: "", clip: "", text: "" };

  function build() {
    const raw = getBlocks();
    const blocks = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
    return {
      html: blocks.map((b) => blockToHtml(b)).join(""),
      clip: blocks.map((b) => blockToHtml(b, { forClipboard: true })).join('<p dir="rtl"><br></p>'),
      text: blocks.map(blockToText).join("\n\n\n"),
    };
  }

  function refresh() {
    current = build();
    preview.innerHTML = current.html;
    preview.hidden = !current.html; // אין מה להעתיק עדיין (למשל באתגר לפני הניסיון הראשון)
    textarea.value = current.text;
    textarea.rows = Math.min(14, Math.max(4, current.text.split("\n").length + 1));
  }

  box.querySelector(".copy-btn").addEventListener("click", async () => {
    refresh();
    // קודם הדרך שעובדת גם כשהגישה ללוח חסומה (נשארת בתוך הלחיצה עצמה),
    // ואם לא – הממשק החדש של הדפדפן
    let ok = copyViaEvent(current.clip, current.text);
    if (!ok) ok = await writeClipboard(current.clip, current.text);
    if (!ok) {
      // חלופה: מסמנים את הטקסט הרגיל ומעתיקים אותו
      textarea.hidden = false;
      ok = copyFromTextarea(textarea);
      if (ok) textarea.hidden = true;
    }
    status.className = "copy-status " + (ok ? "is-ok" : "is-warn");
    status.innerHTML = ok
      ? `${icon("check")}<span>הועתק! עכשיו הדביקו במקום המתאים.</span>`
      : `<span>לא הצלחנו להעתיק. סמנו את הטקסט ולחצו Ctrl+C.</span>`;
    if (!ok) { textarea.hidden = false; textarea.focus(); textarea.select(); }
  });

  // התצוגה מתעדכנת בכל פעם שהתלמיד כותב או עובר חלק
  document.addEventListener("journal-change", refresh);
  document.addEventListener("part-shown", refresh);
  refresh();
  return { refresh };
}
