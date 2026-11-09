// =========================================================
// journal-fields.js – שמירה אוטומטית של מה שהתלמיד כותב
//
// כל שדה עם data-journal נשמר ביומן המהנדס תוך כדי כתיבה,
// וחוזר למקומו כשפותחים את העמוד שוב.
//
//   <label for="s1-q1">מה סובב במחולל שראיתם?</label>
//   <textarea id="s1-q1" data-journal="s1.watch1"></textarea>
//
// לשאלת בחירה: <fieldset data-journal="s1.predict"> עם כפתורי radio.
// כותרת השאלה ביומן נלקחת מה-label או מה-legend,
// או מ-data-journal-label אם רוצים כותרת אחרת.
// =========================================================

import { getJournalEntry, setJournalEntry } from "../progress.js";

let order = 0;

function labelFor(el) {
  if (el.dataset.journalLabel) return el.dataset.journalLabel;
  if (el.tagName === "FIELDSET") {
    const legend = el.querySelector("legend");
    return legend ? legend.textContent.trim() : "";
  }
  if (el.id) {
    const lab = document.querySelector(`label[for="${el.id}"]`);
    if (lab) return lab.textContent.trim();
  }
  return el.getAttribute("aria-label") || "";
}

function partNum(el) {
  const part = el.closest("[data-part]");
  return part ? Number(part.dataset.part) : 0;
}

/** שולח אירוע כדי שרכיבים אחרים (נעילה, העתקה) ידעו שמשהו השתנה */
function announce(el, value) {
  el.dispatchEvent(new CustomEvent("journal-change", { bubbles: true, detail: { value } }));
}

function bindText(el, stationId) {
  const key = el.dataset.journal;
  const saved = getJournalEntry(stationId, key);
  if (saved && typeof saved.value === "string" && !el.value) el.value = saved.value;
  const myOrder = order++;

  // שומרים בכל הקלדה, כך ששום דבר לא הולך לאיבוד גם אם סוגרים את הלשונית
  el.addEventListener("input", () => {
    setJournalEntry(stationId, key, {
      label: labelFor(el), value: el.value.trim(), order: myOrder, part: partNum(el),
    });
    announce(el, el.value);
  });
}

function bindChoice(fs, stationId) {
  const key = fs.dataset.journal;
  const saved = getJournalEntry(stationId, key);
  const radios = [...fs.querySelectorAll('input[type="radio"]')];
  if (saved && saved.value) {
    const match = radios.find((r) => r.value === saved.value);
    if (match) match.checked = true;
  }
  const myOrder = order++;
  radios.forEach((r) => {
    r.addEventListener("change", () => {
      if (!r.checked) return;
      setJournalEntry(stationId, key, {
        label: labelFor(fs), value: r.value, order: myOrder, part: partNum(fs),
      });
      announce(fs, r.value);
    });
  });
}

/** מחבר את כל שדות היומן בתוך root */
export function bindJournalFields(root = document) {
  const stationId = document.body.dataset.station || "general";
  root.querySelectorAll("[data-journal]").forEach((el) => {
    if (el.dataset.journalReady) return;
    el.dataset.journalReady = "1";
    if (el.tagName === "FIELDSET") bindChoice(el, stationId);
    else bindText(el, stationId);
  });
}
