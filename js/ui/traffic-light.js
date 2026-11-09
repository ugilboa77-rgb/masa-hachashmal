// =========================================================
// traffic-light.js – כרטיס הרמזור בפינת המסך
//
// כל לחיצה מעבירה למצב הבא: עובד ← צריך עזרה ← סיימתי ← עובד.
// כל מצב מוצג גם בצבע, גם בסמל וגם בטקסט.
// במצב "צריך עזרה" הכרטיס גדל, כדי שהמורה יראה אותו מרחוק.
// =========================================================

import { load, save } from "../storage.js";
import { icon } from "./icons.js";

// הטקסטים מתוך "דף הבית והסיפור" > כרטיס הרמזור
const STATES = [
  { id: "working", icon: "gear", text: "אני עובד" },
  { id: "help",    icon: "hand", text: "תקוע, צריך עזרה" },
  { id: "done",    icon: "flag", text: "סיימתי תחנה" },
];
const HELP_NOTE = "המורה רואה אתכם. בינתיים נסו את כפתור הרמז.";

let card;
let current = 0;

function render() {
  const st = STATES[current];
  card.dataset.state = st.id;
  card.querySelector(".tl-icon").innerHTML = icon(st.icon);
  card.querySelector(".tl-text").textContent = st.text;
  card.querySelector(".tl-note").hidden = st.id !== "help";
  card.querySelector(".tl-button").setAttribute(
    "aria-label",
    `כרטיס הרמזור: ${st.text}. לחיצה מעבירה למצב הבא.`
  );
}

/** מעביר את הכרטיס למצב מסוים (למשל "help" מתוך כפתור הרמז) */
export function setTrafficLight(stateId) {
  const i = STATES.findIndex((s) => s.id === stateId);
  if (i < 0 || !card) return;
  current = i;
  save("traffic-light", STATES[current].id);
  render();
}

export function renderTrafficLight() {
  if (document.body.dataset.trafficLight === "off") return;

  const savedId = load("traffic-light", "working");
  current = Math.max(0, STATES.findIndex((s) => s.id === savedId));

  card = document.createElement("aside");
  card.className = "traffic-light";
  card.setAttribute("aria-label", "כרטיס הרמזור");
  card.innerHTML = `
    <button class="tl-button" type="button">
      <span class="tl-lamp" aria-hidden="true"><span class="tl-icon"></span></span>
      <span class="tl-text" aria-hidden="true"></span>
    </button>
    <p class="tl-note" hidden>${HELP_NOTE}</p>
    <p class="visually-hidden" role="status" aria-live="polite"></p>`;
  document.body.append(card);

  const live = card.querySelector("[role=status]");
  card.querySelector(".tl-button").addEventListener("click", () => {
    current = (current + 1) % STATES.length;
    save("traffic-light", STATES[current].id);
    render();
    live.textContent = STATES[current].text;
  });

  render();
}
