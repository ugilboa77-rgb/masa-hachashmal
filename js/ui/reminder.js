// =========================================================
// reminder.js – תזכורת לא חוסמת לנקודת הביקורת
//
// כשנכנסים לתחנה חדשה, מופיעה בראש העמוד שאלה:
// "עשיתם את נקודת הביקורת של התחנה הקודמת?" עם קישור.
// אפשר להמשיך גם בלי. אחרי "סגירה" היא לא מופיעה שוב בתחנה הזו.
//
// בעמוד התחנה: <body data-reminder="station1">
// (השם הוא המפתח של נקודת הביקורת ב-config.js)
// =========================================================

import { config } from "../config.js";
import { load, save } from "../storage.js";
import { linkButton } from "./links.js";
import { icon } from "./icons.js";

export function setupReminder() {
  const key = document.body.dataset.reminder;
  if (!key) return;
  const dismissed = load("reminders-closed", []) || [];
  const here = document.body.dataset.station || key;
  if (dismissed.includes(here)) return;

  const main = document.getElementById("main");
  const box = document.createElement("aside");
  box.className = "reminder";
  box.setAttribute("aria-label", "תזכורת");
  box.innerHTML = `
    <p class="reminder-text">${icon("flag")}<span>עשיתם את נקודת הביקורת של התחנה הקודמת?</span></p>
    <div class="reminder-actions"></div>`;
  const actions = box.querySelector(".reminder-actions");
  actions.append(linkButton(config.checkpoints[key], "פתיחת נקודת הביקורת", "btn-secondary"));

  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn btn-ghost";
  close.innerHTML = `${icon("close")}<span>סגירה</span>`;
  close.addEventListener("click", () => {
    dismissed.push(here);
    save("reminders-closed", dismissed);
    box.remove();
  });
  actions.append(close);

  main.prepend(box);
}
