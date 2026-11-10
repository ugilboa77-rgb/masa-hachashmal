// =========================================================
// station-kit.js – התנהגויות שחוזרות בכל התחנות
//
// • סרטונים:   <div class="video-slot" data-video="station2.video1" data-video-title="…">
//               המזהה נלקח מ-config.js. ריק = "בקרוב".
// • נקודת ביקורת: <div data-checkpoint="station2"></div>
//               כפתור "פתיחת נקודת הביקורת" עם הקישור מ-config.js.
// • משפט אחרי בחירה: <p data-show-after="id-של-fieldset" hidden>
//               מופיע אחרי שבוחרים תשובה.
// • משוב במעבדה: בכל ניסוי שיש בו [data-explain], ה-.exp-feedback
//               מופיע אחרי הסבר של 10 תווים לפחות, כשמפסיקים להקליד.
// =========================================================

import { config } from "../config.js";
import { embedVideo, linkButton } from "./links.js";
import { MIN_EXPLAIN } from "./lock.js";

export function setupVideos(root = document) {
  root.querySelectorAll(".video-slot[data-video]").forEach((slot) => {
    const [station, name] = slot.dataset.video.split(".");
    const id = (config.videos[station] || {})[name] || "";
    embedVideo(slot, id, slot.dataset.videoTitle || "");
  });
}

export function setupCheckpoints(root = document) {
  root.querySelectorAll("[data-checkpoint]").forEach((host) => {
    host.append(linkButton(config.checkpoints[host.dataset.checkpoint], "פתיחת נקודת הביקורת", "btn-primary btn-large"));
  });
}

export function setupRevealAfter(root = document) {
  root.querySelectorAll("[data-show-after]").forEach((el) => {
    const fs = document.getElementById(el.dataset.showAfter);
    if (!fs) return;
    const sync = () => { el.hidden = !fs.querySelector("input:checked"); };
    fs.addEventListener("change", sync);
    sync();
  });
}

export function setupExpFeedback(root = document) {
  root.querySelectorAll(".experiment").forEach((exp) => {
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
}

// ----- איור שנפתח בלחיצה -----
//   <div class="explore">
//     <svg> … <g data-spot="blades"> … </svg>
//     <ul class="explore-list">
//       <li><button data-explore="blades">להבים</button><p class="explore-text">…</p></li>
//     </ul>
//   </div>
// לחיצה על שם החלק פותחת את ההסבר ומדגישה את החלק באיור.
export function setupExplore(root = document) {
  root.querySelectorAll(".explore").forEach((box) => {
    const buttons = [...box.querySelectorAll("[data-explore]")];
    buttons.forEach((b, i) => {
      const text = b.parentElement.querySelector(".explore-text");
      text.id = text.id || `explore-${Math.random().toString(36).slice(2, 7)}-${i}`;
      text.hidden = true;
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-controls", text.id);
      b.addEventListener("click", () => {
        const open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(open));
        text.hidden = !open;
        box.querySelectorAll(`[data-spot="${b.dataset.explore}"]`).forEach((s) => s.classList.toggle("is-on", open));
      });
      // לחיצה על החלק באיור עצמו
      box.querySelectorAll(`[data-spot="${b.dataset.explore}"]`).forEach((s) => {
        s.addEventListener("click", () => b.click());
      });
    });
  });
}
