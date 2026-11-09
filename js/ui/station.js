// =========================================================
// station.js – תבנית התחנה
//
// כל תחנה היא עמוד אחד עם כמה חלקים:
//   <section class="part" data-part="1" data-title="פתיחה מהאי"
//            data-tag="core" data-time="5 דק'">
//     <h2>פתיחה מהאי</h2> …
//   </section>
//
//   data-tag  – core = ליבה, extra = אם יש זמן
//   data-time – זמן משוער (אפשר להשאיר ריק)
//   data-next-label + data-next-href – כפתור "הבא" מיוחד בחלק האחרון
//
// מה הקובץ עושה:
// • מציג חלק אחד בכל פעם, עם "חלק X מתוך Y" ורשימת חלקים לחיצה.
// • מסמן חלקים שהושלמו (כשעוברים מהם הלאה ב"הבא").
// • מוסיף כפתורי "הקודם" ו"הבא" בתחתית כל חלק.
// • שומר את המקום האחרון, בשביל "המשיכו מאיפה שעצרתם".
// =========================================================

import { stationById } from "../site.js";
import {
  completedParts, markPartDone, markStationDone, setLastPlace,
} from "../progress.js";
import { icon } from "./icons.js";

const TAGS = {
  core: "ליבה",
  extra: "אם יש זמן",
};

export function setupStation() {
  const stationId = document.body.dataset.station;
  const station = stationById(stationId);
  const parts = [...document.querySelectorAll("section.part")];
  if (!parts.length) return;

  const total = parts.length;
  const file = location.pathname.split("/").pop() || "index.html";
  const progressHost = document.getElementById("station-progress");

  // ----- תגיות וזמן מתחת לכותרת של כל חלק -----
  parts.forEach((part, i) => {
    part.dataset.part = String(i + 1);
    part.id = `part-${i + 1}`;
    part.setAttribute("aria-labelledby", `part-${i + 1}-title`);
    const h2 = part.querySelector("h2");
    if (h2) {
      h2.id = `part-${i + 1}-title`;
      h2.tabIndex = -1;
    }
    const meta = document.createElement("p");
    meta.className = "part-meta";
    const tag = part.dataset.tag;
    if (TAGS[tag]) {
      meta.insertAdjacentHTML("beforeend",
        `<span class="tag tag-${tag}">${TAGS[tag]}</span>`);
    }
    if (part.dataset.time) {
      meta.insertAdjacentHTML("beforeend",
        `<span class="part-time">${icon("clock")}<span><span class="visually-hidden">זמן משוער: </span>${part.dataset.time}</span></span>`);
    }
    if (meta.children.length && h2) h2.after(meta);
  });

  // ----- מחוון ההתקדמות -----
  progressHost.className = "station-progress";
  progressHost.setAttribute("aria-label", "חלקי התחנה");
  progressHost.innerHTML = `
    <p class="progress-count" aria-live="polite"></p>
    <ol class="progress-steps"></ol>`;
  const countEl = progressHost.querySelector(".progress-count");
  const stepsEl = progressHost.querySelector(".progress-steps");

  parts.forEach((part, i) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#part-${i + 1}`;
    a.className = "step";
    a.innerHTML = `
      <span class="step-num" aria-hidden="true">${i + 1}</span>
      <span class="step-title">${part.dataset.title || ""}</span>
      <span class="step-state"></span>`;
    li.append(a);
    stepsEl.append(li);
  });
  const stepLinks = [...stepsEl.querySelectorAll(".step")];

  // ----- כפתורי "הקודם" ו"הבא" -----
  parts.forEach((part, i) => {
    const nav = document.createElement("nav");
    nav.className = "part-nav";
    nav.setAttribute("aria-label", "מעבר בין חלקים");

    if (i > 0) {
      const prev = document.createElement("a");
      prev.className = "btn btn-secondary part-prev";
      prev.href = `#part-${i}`;
      prev.innerHTML = `${icon("prev")}<span>הקודם</span>`;
      nav.append(prev);
    }

    let next = null;
    if (part.dataset.nextHref) {
      next = document.createElement("a");
      next.href = part.dataset.nextHref;
      next.innerHTML = `<span>${part.dataset.nextLabel || "הבא"}</span>${icon("next")}`;
    } else if (i < total - 1) {
      next = document.createElement("a");
      next.href = `#part-${i + 2}`;
      next.innerHTML = `<span>הבא</span>${icon("next")}`;
    }
    if (next) {
      next.className = "btn btn-primary part-next";
      next.addEventListener("click", () => finishPart(i + 1));
      nav.append(next);
    }
    part.append(nav);
  });

  // ----- סימון חלק שהושלם -----
  function finishPart(num) {
    markPartDone(stationId, num);
    const done = completedParts(stationId);
    const coreAll = parts
      .filter((p) => p.dataset.tag !== "extra")
      .every((p) => done.includes(Number(p.dataset.part)));
    if (coreAll) markStationDone(stationId);
    renderSteps();
  }

  let current = 1;

  function renderSteps() {
    const done = completedParts(stationId);
    stepLinks.forEach((a, i) => {
      const num = i + 1;
      const isDone = done.includes(num);
      a.classList.toggle("is-done", isDone);
      a.classList.toggle("is-current", num === current);
      if (num === current) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
      a.querySelector(".step-state").innerHTML = isDone
        ? `${icon("check")}<span class="visually-hidden">(הושלם)</span>`
        : "";
    });
    countEl.textContent = `חלק ${current} מתוך ${total}`;
  }

  function show(num, { focus = true } = {}) {
    current = Math.min(Math.max(1, num), total);
    parts.forEach((p, i) => { p.hidden = i + 1 !== current; });
    renderSteps();

    const part = parts[current - 1];
    setLastPlace({
      stationId,
      stationNum: station ? station.num : null,
      part: current,
      partTitle: part.dataset.title || "",
      href: `${file}#part-${current}`,
    });

    if (focus) {
      progressHost.scrollIntoView({ block: "start" });
      const h2 = part.querySelector("h2");
      if (h2) h2.focus({ preventScroll: true });
    }
    part.dispatchEvent(new CustomEvent("part-shown", { bubbles: true }));
  }

  function fromHash() {
    const m = /^#part-(\d+)$/.exec(location.hash);
    return m ? Number(m[1]) : null;
  }

  window.addEventListener("hashchange", () => {
    const n = fromHash();
    if (n) show(n);
  });

  show(fromHash() || 1, { focus: false });
}
