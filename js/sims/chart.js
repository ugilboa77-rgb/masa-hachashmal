// =========================================================
// chart.js – גרף של יום שלם, שעה אחרי שעה (0–23)
// משותף לתחנת הרוח, לתחנת המים ולאתגר.
//
//   const chart = createDayChart(host, { lines: [...] })
//   chart.draw({ prod: [24 מספרים], need: [24 מספרים] }, upToHour)
//
// כל קו: { key, color, dash, width }. הערכים 0–10.
// שעות שבהן הייצור נמוך מהצריכה מסומנות ברקע אפור.
// =========================================================

const W = 600, H = 250;
const L = 44, R = 586, T = 16, B = 214;
const x = (h) => L + ((R - L) * h) / 23;
const y = (v, max) => B - ((B - T) * Math.max(0, Math.min(max, v))) / max;

export function createDayChart(host, { lines, max = 10, gapOf = null, label = "" }) {
  let grid = "";
  for (let v = 0; v <= max; v += max / 5) {
    grid += `<line x1="${L}" x2="${R}" y1="${y(v, max)}" y2="${y(v, max)}"/>`;
    grid += `<text class="chart-y" x="${L - 8}" y="${y(v, max) + 5}">${v}</text>`;
  }
  for (const h of [0, 6, 12, 18, 23]) {
    grid += `<text class="chart-x" x="${x(h)}" y="${B + 24}">${String(h).padStart(2, "0")}:00</text>`;
  }
  host.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
      <g class="chart-gaps"></g>
      <g class="chart-grid">${grid}</g>
      <g class="chart-lines">${lines.map((l) => `<polyline data-key="${l.key}" fill="none" stroke="${l.color}" stroke-width="${l.width || 4}" stroke-dasharray="${l.dash || ""}" stroke-linejoin="round" stroke-linecap="round"/>`).join("")}</g>
      <line class="chart-now" y1="${T}" y2="${B}" x1="${L}" x2="${L}"/>
    </svg>`;
  const svg = host.querySelector("svg");
  const gaps = svg.querySelector(".chart-gaps");
  const now = svg.querySelector(".chart-now");

  function draw(data, upTo = 23) {
    lines.forEach((l) => {
      const vals = (data[l.key] || []).slice(0, upTo + 1);
      svg.querySelector(`[data-key="${l.key}"]`).setAttribute(
        "points", vals.map((v, h) => `${x(h).toFixed(1)},${y(v, max).toFixed(1)}`).join(" ")
      );
    });
    let g = "";
    if (gapOf) {
      const [a, b] = gapOf;
      const step = (R - L) / 23;
      for (let h = 0; h <= upTo; h++) {
        if ((data[a] || [])[h] < (data[b] || [])[h]) {
          g += `<rect x="${(x(h) - step / 2).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${B - T}"/>`;
        }
      }
    }
    gaps.innerHTML = g;
    now.setAttribute("x1", x(upTo));
    now.setAttribute("x2", x(upTo));
    now.style.opacity = upTo < 23 ? "1" : "0";
  }
  draw({}, -1);
  return { draw };
}
