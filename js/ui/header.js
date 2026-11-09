// =========================================================
// header.js – התפריט העליון הקבוע
//
// • במחשב: כל התחנות בשורה אחת.
// • בטאבלט ובטלפון: כפתור "תפריט" שפותח רשימה.
// • תחנה שהושלמה מסומנת בסמל וי. עמוד שעוד לא נבנה מסומן "בקרוב".
// =========================================================

import { stations, challenge, tools } from "../site.js";
import { isStationDone } from "../progress.js";
import { icon } from "./icons.js";

function menuItem({ id, label, num, href, ready, current, done }) {
  const li = document.createElement("li");
  const numHtml = num !== undefined
    ? `<span class="menu-num" aria-hidden="true">${num}</span>`
    : "";
  const doneHtml = done
    ? `<span class="menu-done">${icon("check")}<span class="visually-hidden">(הושלמה)</span></span>`
    : "";

  if (ready) {
    const a = document.createElement("a");
    a.className = "menu-link";
    a.href = href;
    if (current) a.setAttribute("aria-current", "page");
    a.innerHTML = `${numHtml}<span class="menu-label">${label}</span>${doneHtml}`;
    li.append(a);
  } else {
    const span = document.createElement("span");
    span.className = "menu-link is-soon";
    span.setAttribute("aria-disabled", "true");
    span.innerHTML = `${numHtml}<span class="menu-label">${label}<span class="menu-soon">בקרוב</span></span>`;
    li.append(span);
  }
  li.dataset.id = id;
  return li;
}

export function renderHeader() {
  const host = document.getElementById("site-header");
  if (!host) return;
  const page = document.body.dataset.page || "";

  host.className = "site-header";
  host.innerHTML = `
    <div class="topbar">
      <a class="brand" href="index.html">
        <img src="assets/images/logo.png" alt="" width="40" height="40">
        <span>מסע החשמל</span>
      </a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">
        ${icon("menu")}<span>תפריט</span>
      </button>
      <nav id="site-menu" class="site-menu" aria-label="תפריט ראשי">
        <ul class="menu-stations"></ul>
        <ul class="menu-tools"></ul>
      </nav>
    </div>`;

  const stationList = host.querySelector(".menu-stations");
  stations.forEach((s) => {
    stationList.append(menuItem({
      id: s.id,
      label: s.title,
      num: s.num,
      href: s.href,
      ready: s.ready,
      current: page === s.id,
      done: isStationDone(s.id),
    }));
  });
  stationList.append(menuItem({
    id: challenge.id,
    label: challenge.title,
    num: "★",
    href: challenge.href,
    ready: challenge.ready,
    current: page === challenge.id,
  }));

  const toolList = host.querySelector(".menu-tools");
  tools.forEach((t) => {
    toolList.append(menuItem({
      id: t.id,
      label: t.title,
      href: t.href,
      ready: t.ready,
      current: page === t.id,
    }));
  });

  // ----- פתיחה וסגירה של התפריט במסך צר -----
  const toggle = host.querySelector(".menu-toggle");
  const menu = host.querySelector(".site-menu");

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (menu.classList.contains("is-open") && !host.contains(e.target)) setOpen(false);
  });
}
