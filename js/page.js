// =========================================================
// page.js – מה שקורה בכל עמוד באתר
//
// כל עמוד טוען את הקובץ הזה:
//   <script type="module" src="js/page.js"></script>
//
// הוא מוסיף את התפריט העליון ואת כרטיס הרמזור, ובעמודי תחנה
// גם את תבנית התחנה, הרמזים, הנעילה ושמירת היומן.
// =========================================================

import { renderHeader } from "./ui/header.js";
import { renderTrafficLight } from "./ui/traffic-light.js";
import { setupStation } from "./ui/station.js";
import { setupHints } from "./ui/hints.js";
import { setupLocks } from "./ui/lock.js";
import { bindJournalFields } from "./ui/journal-fields.js";
import { setupReminder } from "./ui/reminder.js";
import { setupOrders } from "./ui/order.js";

renderHeader();
renderTrafficLight();

if (document.body.dataset.station) {
  bindJournalFields();
  setupHints();
  setupLocks();
  setupOrders();
  setupReminder();
  setupStation();
}
