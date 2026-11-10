// =========================================================
// site.js – מפת האתר: התחנות, השמות והקישורים
//
// • השמות ושתי המילים מתחת לכל שם לקוחים מ"דף הבית והסיפור".
// • ready: true  – העמוד כבר בנוי, והקישור פעיל.
//   ready: false – העמוד עוד לא נבנה. בתפריט ובמפה מופיע "בקרוב".
//   כשבונים עמוד חדש, מחליפים כאן false ב-true.
// =========================================================

export const stations = [
  { id: "s0", num: 0, title: "נקודת זינוק",        sub: "האי כבה",          href: "station-0.html", ready: true  },
  { id: "s1", num: 1, title: "המחולל",             sub: "סיבוב הופך לחשמל", href: "station-1.html", ready: true  },
  { id: "s2", num: 2, title: "טורבינת רוח",        sub: "רוח מסובבת",       href: "station-2.html", ready: false },
  { id: "s3", num: 3, title: "תחנה הידרואלקטרית", sub: "מים מסובבים",      href: "station-3.html", ready: false },
  { id: "s4", num: 4, title: "תחנה קיטורית",       sub: "קיטור מסובב",      href: "station-4.html", ready: false },
  { id: "s5", num: 5, title: "השוואה",             sub: "ישיבת מועצה",      href: "station-5.html", ready: false },
];

export const challenge = { id: "challenge", title: "אתגר", sub: "התוכנית שלכם", href: "challenge.html", ready: false };

// כלים שמופיעים בתפריט מימין לתחנות
export const tools = [
  { id: "glossary", title: "מילון מושגים", href: "glossary.html", ready: false },
  { id: "journal",  title: "יומן המהנדס",  href: "journal.html",  ready: true  },
];

/** מחזיר תחנה לפי מזהה (s0…s5), או null */
export function stationById(id) {
  return stations.find((s) => s.id === id) || null;
}
