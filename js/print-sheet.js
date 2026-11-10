// =========================================================
// print-sheet.js – בונה דף להדפסה מתוך עמוד התחנה
//
// לוקח מעמוד התחנה את חלק "ניסוי בידיים" (מטרה, חומרים,
// בטיחות, שלבים, טבלת תצפיות, מסקנות) ומסדר אותו לדף A4.
// כך הטקסטים נשארים במקום אחד: בעמוד התחנה.
// =========================================================

import { stations } from "./site.js";
import { icon } from "./ui/icons.js";

const sheet = document.getElementById("sheet");
const params = new URLSearchParams(location.search);
const printBtn = document.getElementById("print-now");
printBtn.innerHTML = `${icon("print")}<span>הדפסה</span>`;
printBtn.addEventListener("click", () => window.print());

async function loadPage(href) {
  const res = await fetch(href);
  if (!res.ok) throw new Error(href);
  return new DOMParser().parseFromString(await res.text(), "text/html");
}

/** חלק הניסוי בידיים בעמוד התחנה */
function handsPart(doc) {
  return [...doc.querySelectorAll("section.part")].find((p) => p.dataset.title === "ניסוי בידיים");
}

const text = (el) => (el ? el.textContent.trim() : "");

/** טבלת התצפיות, עם משבצות ריקות לכתיבה ביד */
function blankTable(table) {
  const t = table.cloneNode(true);
  t.className = "print-table";
  t.querySelectorAll("td").forEach((td) => {
    const opts = [...td.querySelectorAll(".seg span")].map((s) => s.textContent.trim());
    td.innerHTML = opts.length ? `<span class="print-options">${opts.map((o) => `<span>☐ ${o}</span>`).join("")}</span>` : "";
  });
  t.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  return t.outerHTML;
}

function stationHead(st, label) {
  return `
    <header class="sheet-head">
      <p class="sheet-eyebrow">מסע החשמל · תחנה ${st.num}: ${st.title}</p>
      <h1>${label}</h1>
      <p class="sheet-name">שם: <span class="line"></span> כיתה: <span class="line short"></span></p>
    </header>`;
}

/** דף ניסוי: מטרה, חומרים, בטיחות, שלבים, טבלה, מסקנות עם שורות לכתיבה */
async function experimentSheet(st) {
  const doc = await loadPage(st.href);
  const part = handsPart(doc);
  if (!part) throw new Error("no hands-on part");
  const cards = [...part.querySelectorAll(".card")];
  const byTitle = (t) => cards.find((c) => text(c.querySelector("h3")) === t);
  const materials = byTitle("חומרים");
  const safety = byTitle("בטיחות");
  const steps = byTitle("שלבים");
  const table = part.querySelector(".obs-table");
  const conclusions = [...(byTitle("מסקנות") || document.createElement("div")).querySelectorAll("label")].map(text);

  sheet.innerHTML = `
    ${stationHead(st, text(part.querySelector("h2")))}
    ${part.querySelector(".goal") ? `<p class="goal">${part.querySelector(".goal").innerHTML}</p>` : ""}
    <div class="sheet-two">
      ${materials ? `<section><h2>חומרים</h2>${materials.querySelector("ul").outerHTML}</section>` : ""}
      ${safety ? `<section class="sheet-safety"><h2>בטיחות</h2>${safety.querySelector("p").outerHTML}</section>` : ""}
    </div>
    ${steps ? `<section><h2>שלבים</h2>${steps.querySelector("ol").outerHTML}</section>` : ""}
    ${table ? `<section><h2>טבלת תצפיות</h2>${blankTable(table)}</section>` : ""}
    ${conclusions.length ? `<section><h2>מסקנות</h2>${conclusions.map((q) => `<p class="sheet-q">${q}</p><div class="write-lines"><span></span><span></span></div>`).join("")}</section>` : ""}`;
  document.title = `דף ניסוי: תחנה ${st.num} · מסע החשמל`;
}

/** כרטיס הוראות לשולחן הניסוי: גדול וקצר – מטרה, חומרים, בטיחות, שלבים */
async function tableCard(st) {
  const doc = await loadPage(st.href);
  const part = handsPart(doc);
  if (!part) throw new Error("no hands-on part");
  const cards = [...part.querySelectorAll(".card")];
  const byTitle = (t) => cards.find((c) => text(c.querySelector("h3")) === t);
  const materials = byTitle("חומרים");
  const safety = byTitle("בטיחות");
  const steps = byTitle("שלבים");
  sheet.classList.add("table-card");
  sheet.innerHTML = `
    <header class="sheet-head">
      <p class="sheet-eyebrow">מסע החשמל · תחנה ${st.num}: ${st.title}</p>
      <h1>${text(part.querySelector("h2"))}</h1>
    </header>
    ${part.querySelector(".goal") ? `<p class="goal">${part.querySelector(".goal").innerHTML}</p>` : ""}
    ${safety ? `<section class="sheet-safety"><h2>בטיחות</h2>${safety.querySelector("p").outerHTML}</section>` : ""}
    ${materials ? `<section><h2>חומרים</h2>${materials.querySelector("ul").outerHTML}</section>` : ""}
    ${steps ? `<section><h2>שלבים</h2>${steps.querySelector("ol").outerHTML}</section>` : ""}`;
  document.title = `כרטיס לשולחן הניסוי: תחנה ${st.num} · מסע החשמל`;
}

/** מחוון האתגר */
async function rubric() {
  const doc = await loadPage("challenge.html");
  const table = doc.querySelector(".rubric table");
  sheet.innerHTML = `
    <header class="sheet-head">
      <p class="sheet-eyebrow">מסע החשמל · אתגר הסיכום</p>
      <h1>אי האנרגיה: המחוון</h1>
      <p class="sheet-name">שם: <span class="line"></span> כיתה: <span class="line short"></span></p>
    </header>
    ${table ? table.outerHTML.replace('class="ch-table"', 'class="print-table"') : ""}`;
  document.title = "מחוון האתגר · מסע החשמל";
}

async function build() {
  try {
    if (params.get("rubric")) return await rubric();
    const id = params.get("sheet") || params.get("card");
    const st = stations.find((s) => s.id === id);
    if (!st) throw new Error("unknown");
    if (params.get("card")) return await tableCard(st);
    return await experimentSheet(st);
  } catch {
    // [ממתין לאישור אודי] הודעה כשאי אפשר לבנות את הדף
    sheet.innerHTML = `<p class="card">לא מצאנו את הדף הזה. חזרו לעמוד המורה ובחרו דף להדפסה.</p>`;
  }
}
build();
