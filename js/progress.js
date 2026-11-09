// =========================================================
// progress.js – מה התלמיד כבר עשה (נשמר רק במחשב הזה)
//
// שלושה דברים נשמרים:
// 1. חלקים שהושלמו בכל תחנה, ותחנות שהושלמו.
// 2. המקום האחרון שבו התלמיד עבד (לכפתור "המשיכו מאיפה שעצרתם").
// 3. יומן המהנדס: כל מה שהתלמיד כתב או בחר.
// =========================================================

import { load, save } from "./storage.js";

// ----- 1. חלקים ותחנות -----

/** רשימת מספרי החלקים שהושלמו בתחנה */
export function completedParts(stationId) {
  const all = load("parts", {}) || {};
  return Array.isArray(all[stationId]) ? all[stationId] : [];
}

export function markPartDone(stationId, partNum) {
  const all = load("parts", {}) || {};
  const list = Array.isArray(all[stationId]) ? all[stationId] : [];
  if (!list.includes(partNum)) {
    list.push(partNum);
    all[stationId] = list;
    save("parts", all);
  }
}

export function isStationDone(stationId) {
  const done = load("stations-done", []) || [];
  return done.includes(stationId);
}

export function markStationDone(stationId) {
  const done = load("stations-done", []) || [];
  if (!done.includes(stationId)) {
    done.push(stationId);
    save("stations-done", done);
  }
}

// ----- 2. המקום האחרון -----

/** שומר את המקום האחרון: { stationId, stationNum, part, partTitle, href } */
export function setLastPlace(place) {
  save("last-place", place);
}

export function getLastPlace() {
  const p = load("last-place", null);
  return p && typeof p.href === "string" ? p : null;
}

// ----- 3. יומן המהנדס -----
// מבנה: { s1: { "s1.predict": { label, value, order, part } , ... }, ... }

export function getJournal() {
  const j = load("journal", {});
  return j && typeof j === "object" ? j : {};
}

export function setJournalEntry(stationId, key, entry) {
  const j = getJournal();
  if (!j[stationId]) j[stationId] = {};
  j[stationId][key] = { ...entry, updated: Date.now() };
  save("journal", j);
}

export function getJournalEntry(stationId, key) {
  const j = getJournal();
  return (j[stationId] && j[stationId][key]) || null;
}

/** מספר הרמזים שנפתחו בתחנה (לשורה "רמזים שהשתמשתי בהם") */
export function countHint(stationId, hintKey) {
  const all = load("hints", {}) || {};
  const list = Array.isArray(all[stationId]) ? all[stationId] : [];
  if (!list.includes(hintKey)) {
    list.push(hintKey);
    all[stationId] = list;
    save("hints", all);
  }
}

export function hintsUsed(stationId) {
  const all = load("hints", {}) || {};
  return Array.isArray(all[stationId]) ? all[stationId].length : 0;
}

export function hintOpened(stationId, hintKey) {
  const all = load("hints", {}) || {};
  return Array.isArray(all[stationId]) && all[stationId].includes(hintKey);
}
