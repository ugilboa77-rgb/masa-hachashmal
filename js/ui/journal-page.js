// =========================================================
// journal-page.js – עמוד "יומן המהנדס" בתוך האתר
//
// מציג במסך אחד את כל מה שהתלמיד כתב, תחנה אחרי תחנה.
// אפשר להעתיק הכול בלחיצה, להדפיס, ולהתחיל מחדש.
// =========================================================

import { stations } from "../site.js";

import { getJournal, hintsUsed } from "../progress.js";
import { clearAll, isAvailable } from "../storage.js";
import { createCopyPoint, stamp } from "./copy.js";
import { icon } from "./icons.js";

function entriesOf(stationData) {
  return Object.values(stationData || {})
    .filter((e) => e && typeof e.value === "string" && e.value.trim())
    .sort((a, b) => (a.part - b.part) || (a.order - b.order));
}

const SECTIONS = stations;

/** בלוק העתקה לכל תחנה שיש בה תשובות: כל שאלה והתשובה שלה */
function asBlocks(journal) {
  const when = stamp();
  return SECTIONS.map((s) => {
    const list = entriesOf(journal[s.id]);
    if (!list.length) return null;
    const hints = hintsUsed(s.id);
    return {
      title: `תחנה ${s.num}: ${s.title}`,
      stamp: when,
      items: [
        ...list.map((e) => ({ type: "qa", q: e.label, a: e.value })),
        ...(hints ? [{ type: "note", text: `רמזים שהשתמשתי בהם: ${hints}` }] : []),
      ],
    };
  }).filter(Boolean);
}

export function renderJournalPage() {
  const host = document.getElementById("journal-entries");
  const journal = getJournal();

  if (!isAvailable()) {
    document.getElementById("journal-storage-warning").hidden = false;
  }

  let any = false;
  SECTIONS.forEach((s) => {
    const list = entriesOf(journal[s.id]);
    if (!list.length) return;
    any = true;
    const sec = document.createElement("section");
    sec.className = "card journal-station";
    sec.setAttribute("aria-labelledby", `j-${s.id}`);
    const hints = hintsUsed(s.id);
    sec.innerHTML = `
      <h2 id="j-${s.id}"><span class="journal-num">${s.num}</span> ${s.title}</h2>
      <dl class="journal-list"></dl>
      ${hints ? `<p class="journal-hints">רמזים שהשתמשתי בהם: ${hints}</p>` : ""}`;
    const dl = sec.querySelector("dl");
    list.forEach((e) => {
      const dt = document.createElement("dt");
      dt.textContent = e.label;
      const dd = document.createElement("dd");
      dd.textContent = e.value;
      dl.append(dt, dd);
    });
    host.append(sec);
  });

  document.getElementById("journal-empty").hidden = any;
  document.getElementById("journal-tools").hidden = !any;

  if (any) {
    createCopyPoint(document.getElementById("journal-copy"), {
      message: "כל היומן כטקסט אחד:",
      getBlocks: () => asBlocks(getJournal()),
    });
  }

  const printBtn = document.getElementById("journal-print");
  printBtn.innerHTML = `${icon("print")}<span>הדפסה</span>`;
  printBtn.addEventListener("click", () => window.print());

  // התחלה מחדש – הטקסטים מתוך "טקסטי ממשק" במילון
  const resetBtn = document.getElementById("journal-reset");
  const dlg = document.createElement("dialog");
  dlg.className = "confirm-dialog";
  dlg.setAttribute("aria-labelledby", "reset-title");
  dlg.innerHTML = `
    <h2 id="reset-title">התחלה מחדש</h2>
    <p>כל מה שכתבתם במחשב הזה יימחק. להמשיך?</p>
    <div class="confirm-actions">
      <button type="button" class="btn btn-danger-solid" value="yes">מחיקה</button>
      <button type="button" class="btn btn-secondary" value="no">ביטול</button>
    </div>`;
  document.body.append(dlg);
  dlg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    dlg.close();
    if (b.value === "yes") {
      clearAll();
      location.href = "index.html";
    } else {
      resetBtn.focus();
    }
  }));
  resetBtn.addEventListener("click", () => {
    if (typeof dlg.showModal === "function") dlg.showModal();
    else if (window.confirm("כל מה שכתבתם במחשב הזה יימחק. להמשיך?")) { clearAll(); location.href = "index.html"; }
  });
}
