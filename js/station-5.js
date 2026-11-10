// =========================================================
// station-5.js – החיבורים של תחנה 5 (השוואה)
// • מיון הכרטיסים (js/ui/sort.js)
// • "חזרה לנקודת הזינוק": מציג את מה שהתלמיד כתב בתחנה 0
// =========================================================

import { setupSorters } from "./ui/sort.js";
import { getJournalEntry } from "./progress.js";

setupSorters();

const then = document.getElementById("s5-then");
const entry = getJournalEntry("s0", "s0.predict");
const p = document.createElement("p");
if (entry && entry.value) {
  p.textContent = entry.value;
} else {
  // [ממתין לאישור אודי] משפט למקרה שלא נשמרה תשובה בתחנה 0 (למשל במחשב אחר)
  p.textContent = "לא מצאנו כאן תשובה מתחנה 0. אולי עבדתם אז במחשב אחר.";
  then.classList.add("is-empty");
}
then.append(p);
