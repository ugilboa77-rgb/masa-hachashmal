// =========================================================
// links.js – כפתורי קישור וסרטונים
//
// • קישור ריק ב-config.js מוצג ככפתור "בקרוב" ולא ככפתור שבור.
// • טפסים וקישורים חיצוניים נפתחים תמיד בלשונית חדשה.
// • סרטונים מוטמעים מ-youtube-nocookie, ומתחתם תמיד קישור ישיר
//   למקרה שסינון הרשת חוסם את ההטמעה.
// =========================================================

import { icon } from "./icons.js";

/** כפתור שפותח קישור בלשונית חדשה, או "בקרוב" אם הקישור ריק */
export function linkButton(url, label, variant = "btn-primary") {
  if (url) {
    const a = document.createElement("a");
    a.className = `btn ${variant}`;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `<span>${label}</span>${icon("external")}`;
    a.setAttribute("aria-label", `${label} (נפתח בלשונית חדשה)`);
    return a;
  }
  const span = document.createElement("span");
  span.className = "btn btn-soon";
  span.setAttribute("aria-disabled", "true");
  span.innerHTML = `<span>${label}</span><span class="soon-tag">בקרוב</span>`;
  return span;
}

/** מטמיע סרטון YouTube בתוך slot. אם אין מזהה – כרטיס "בקרוב". */
export function embedVideo(slot, videoId, title) {
  slot.innerHTML = "";
  if (!videoId) {
    slot.classList.add("video-soon");
    slot.innerHTML = `<p class="video-soon-text">${icon("clock")}<span>בקרוב</span></p>`;
    return;
  }
  const frame = document.createElement("div");
  frame.className = "video-frame";
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
  iframe.title = title;
  iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
  iframe.allowFullscreen = true;
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  frame.append(iframe);

  const fallback = document.createElement("p");
  fallback.className = "video-fallback";
  fallback.innerHTML = `<a href="https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}" target="_blank" rel="noopener">הסרטון לא נפתח כאן. צפו בו ב-YouTube.</a>`;

  slot.append(frame, fallback);
}
