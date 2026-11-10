// =========================================================
// journal-page.js – עמוד "יומן המהנדס" בתוך האתר
//
// מציג במסך אחד את כל מה שהתלמיד כתב, תחנה אחרי תחנה.
// אפשר להעתיק הכול בלחיצה, להדפיס, ולהתחיל מחדש.
// =========================================================

import { stations } from "../site.js";

import { getJournal, hintsUsed } from "../progress.js";
import { clearAll, isAvailable } from "../storage.js";
import { createCopyPoint } from "./copy.js";
import { icon } from "./icons.js";

function entriesOf(stationData) {
  return Object.values(stationData || {})
    .filter((e) => e && typeof e.value === "string" && e.value.trim())
    .sort((a, b) => (a.part - b.part) || (a.order - b.order));
}

const SECTIONS = stations;

function asText(journal) {
  const lines = [];
  SECTIONS.forEach((s) => {
    const list = entriesOf(journal[s.id]);
    if (!list.length) return;
    lines.push(`תחנה ${s.num}: ${s.title}`);
    list.forEach((e) => lines.push(`${e.label}`, `${e.value}`, ""));
  });
  return lines.join("\n").trim();
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
      getText: () => asText(getJournal()),
    });
  }

  const printBtn = document.getElementById("journal-print");
  printBtn.innerHTML = `${icon("print")}<span>הדפסה</span>`;
  printBtn.addEventListener("click", () => window.print());

  document.getElementById("journal-reset").addEventListener("click", () => {
    const ok = window.confirm(
      "למחוק את כל מה שנשמר במחשב הזה? היומן, החלקים שהושלמו והמקום שבו עצרתם יימחקו. אי אפשר לבטל."
    );
    if (!ok) return;
    clearAll();
    location.href = "index.html";
  });
}
