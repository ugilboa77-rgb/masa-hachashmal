// =========================================================
// chart.js – גרף שעה אחרי שעה (משותף לתחנות ולאתגר)
//
//   const chart = createDayChart(host, { lines: [...], bars: {...} })
//   chart.draw({ prod: [...], need: [...] }, upTo)
//
// lines  – קווים: { key, color, dash, width }. הערכים 0–max.
// bars   – עמודות (לא חובה): { key, color, max }. למשל מים במאגר.
// points – כמה נקודות בציר הזמן (24 = יממה, 168 = שבוע).
// xTicks – תוויות בציר הזמן: [[מספר נקודה, "טקסט"], …]
// gapOf  – [קו א, קו ב]: שעות שבהן א נמוך מ-ב מסומנות ברקע אפור.
// =========================================================

const W = 600, H = 250;
const L = 44, R = 586, T = 16, B = 214;

const DAY_TICKS = [0, 6, 12, 18, 23].map((h) => [h, `${String(h).padStart(2, "0")}:00`]);

export function createDayChart(host, { lines, bars = null, max = 10, gapOf = null, label = "", points = 24, xTicks = DAY_TICKS }) {
  const x = (h) => L + ((R - L) * h) / (points - 1);
  const y = (v) => B - ((B - T) * Math.max(0, Math.min(max, v))) / max;
  const step = (R - L) / (points - 1);

  let grid = "";
  for (let v = 0; v <= max; v += max / 5) {
    grid += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}"/>`;
    grid += `<text class="chart-y" x="${L - 8}" y="${y(v) + 5}">${v}</text>`;
  }
  for (const [i, t] of xTicks) {
    grid += `<text class="chart-x" x="${x(i)}" y="${B + 24}">${t}</text>`;
  }
  host.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
      <g class="chart-gaps"></g>
      <g class="chart-bars"></g>
      <g class="chart-grid">${grid}</g>
      <g class="chart-lines">${lines.map((l) => `<polyline data-key="${l.key}" fill="none" stroke="${l.color}" stroke-width="${l.width || (points > 48 ? 2.5 : 4)}" stroke-dasharray="${l.dash || ""}" stroke-linejoin="round" stroke-linecap="round"/>`).join("")}</g>
      <line class="chart-now" y1="${T}" y2="${B}" x1="${L}" x2="${L}"/>
    </svg>`;
  const svg = host.querySelector("svg");
  const gaps = svg.querySelector(".chart-gaps");
  const barsG = svg.querySelector(".chart-bars");
  const now = svg.querySelector(".chart-now");

  function draw(data, upTo = points - 1) {
    lines.forEach((l) => {
      const vals = (data[l.key] || []).slice(0, upTo + 1);
      svg.querySelector(`[data-key="${l.key}"]`).setAttribute(
        "points", vals.map((v, h) => `${x(h).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
      );
    });
    if (bars) {
      const vals = (data[bars.key] || []).slice(0, upTo + 1);
      const bw = Math.max(1, step * 0.8);
      barsG.innerHTML = vals.map((v, h) => {
        const top = y((v / (bars.max || max)) * max);
        return `<rect x="${(x(h) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(B - top).toFixed(1)}" fill="${bars.color}"/>`;
      }).join("");
    }
    let g = "";
    if (gapOf) {
      const [a, b] = gapOf;
      for (let h = 0; h <= upTo; h++) {
        if ((data[a] || [])[h] < (data[b] || [])[h] - 0.25) {
          g += `<rect x="${(x(h) - step / 2).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${B - T}"/>`;
        }
      }
    }
    gaps.innerHTML = g;
    now.setAttribute("x1", x(Math.max(0, upTo)));
    now.setAttribute("x2", x(Math.max(0, upTo)));
    now.style.opacity = upTo >= 0 && upTo < points - 1 ? "1" : "0";
  }
  draw({}, -1);
  return { draw };
}
