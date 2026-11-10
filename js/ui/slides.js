// =========================================================
// slides.js – כרטיסי מידע שעוברים ביניהם בחץ
//
//   <div class="slides" aria-label="כרטיסי מידע">
//     <article class="slide"> … </article>
//     <article class="slide"> … </article>
//   </div>
//
// מוצג כרטיס אחד בכל פעם, עם "הקודם", "הבא" ו"כרטיס X מתוך Y".
// =========================================================

import { icon } from "./icons.js";

function setupOne(box) {
  const slides = [...box.querySelectorAll(".slide")];
  if (slides.length < 2) return;
  let current = 0;

  const nav = document.createElement("div");
  nav.className = "slides-nav";
  nav.innerHTML = `
    <button type="button" class="btn btn-secondary slides-prev">${icon("prev")}<span>הקודם</span></button>
    <p class="slides-count" aria-live="polite"></p>
    <button type="button" class="btn btn-secondary slides-next"><span>הבא</span>${icon("next")}</button>`;
  box.append(nav);

  const dots = document.createElement("div");
  dots.className = "slides-dots";
  dots.setAttribute("aria-hidden", "true");
  dots.innerHTML = slides.map(() => "<span></span>").join("");
  nav.after(dots);

  const prev = nav.querySelector(".slides-prev");
  const next = nav.querySelector(".slides-next");
  const count = nav.querySelector(".slides-count");

  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, j) => { s.hidden = j !== current; });
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.textContent = `כרטיס ${current + 1} מתוך ${slides.length}`;
    [...dots.children].forEach((d, j) => d.classList.toggle("is-on", j <= current));
  }

  prev.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  show(0);
}

export function setupSlides(root = document) {
  root.querySelectorAll(".slides").forEach((box) => {
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    setupOne(box);
  });
}
