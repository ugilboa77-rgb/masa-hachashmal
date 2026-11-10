// =========================================================
// storage.js – שמירה בטוחה במחשב של התלמיד (localStorage)
//
// • כל המידע נשמר רק בדפדפן הזה. שום דבר לא נשלח לשום מקום.
// • אם האחסון חסום או מלא – האתר ממשיך לעבוד, והמידע נשמר
//   רק עד שסוגרים את הלשונית.
// =========================================================

const PREFIX = "masa:";

// גיבוי בזיכרון, למקרה שהאחסון חסום
const memory = new Map();

let available = null;

/** האם אפשר לשמור בדפדפן הזה? */
export function isAvailable() {
  if (available !== null) return available;
  try {
    const testKey = PREFIX + "__test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

/** האם הערך השמור מאותו סוג כמו ברירת המחדל (רשימה, אובייקט, מחרוזת...)? */
function sameKind(value, fallback) {
  if (value === null) return false;
  if (fallback === null || fallback === undefined) return true;
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (typeof fallback === "object") return typeof value === "object" && !Array.isArray(value);
  return typeof value === typeof fallback;
}

/** קריאת ערך. אם אין ערך, או שהוא פגום או מסוג לא צפוי – מחזיר את ברירת המחדל. */
export function load(key, fallback = null) {
  const fullKey = PREFIX + key;
  try {
    if (isAvailable()) {
      const raw = window.localStorage.getItem(fullKey);
      if (raw !== null) {
        const value = JSON.parse(raw);
        if (sameKind(value, fallback)) return value;
      }
    }
  } catch {
    // ערך פגום או אחסון חסום – ממשיכים לגיבוי
  }
  return memory.has(fullKey) ? memory.get(fullKey) : fallback;
}

/** שמירת ערך. מחזיר true אם נשמר בדפדפן, false אם רק בזיכרון. */
export function save(key, value) {
  const fullKey = PREFIX + key;
  memory.set(fullKey, value);
  try {
    if (isAvailable()) {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    }
  } catch {
    // אחסון מלא או חסום – נשאר בזיכרון בלבד
  }
  return false;
}

/** מחיקת ערך אחד. */
export function remove(key) {
  const fullKey = PREFIX + key;
  memory.delete(fullKey);
  try {
    if (isAvailable()) window.localStorage.removeItem(fullKey);
  } catch {
    // אין מה לעשות
  }
}

/** מחיקת כל מה שהלומדה שמרה (לכפתור "התחלה מחדש"). */
export function clearAll() {
  memory.clear();
  try {
    if (!isAvailable()) return;
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // אין מה לעשות
  }
}
