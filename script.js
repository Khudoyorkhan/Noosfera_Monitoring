
"use strict";

// ========================================
// 1. MONITORING PARAMETRLARI
// ========================================

const parameters = [
  { uz: "Suv sathi", code: "H", unit: "m",
    color: "#4aa3ce", max: 30 },
  { uz: "Suvning sho'rlanishi", code: "S", unit: "ppt",
    color: "#648df4", max: 5 },
  { uz: "Tuproq namligi", code: "SM", unit: "%",
    color: "#27c68b", max: 100 },
  { uz: "Havo namligi", code: "RH", unit: "%",
    color: "#50a8ae", max: 100 },
  { uz: "Suv harorati", code: "T", unit: "°C",
    color: "#f4a43b", max: 50 },
  { uz: "Suvning pH ko'rsatkichi", code: "pH", unit: "pH",
    color: "#9d7ad8", max: 14 },
  { uz: "Suvning elektr o'tkazuvchanligi", code: "EC",
    unit: "µS/cm", color: "#468ac1", max: 2000 },
  { uz: "Umumiy erigan moddalar miqdori", code: "TDS",
    unit: "mg/L", color: "#d6a047", max: 2000 },
  { uz: "Tuproq sho'rlanishi", code: "ECe", unit: "dS/m",
    color: "#d37da7", max: 10 },
  { uz: "Tuproq elektr o'tkazuvchanligi", code: "ECs",
    unit: "µS/cm", color: "#77945b", max: 2000 }
];

// ========================================
// 2. BOSHLANG'ICH DEMO MA'LUMOTLAR
// ========================================

const initialValues = [
  [18.6, 0.51, 32.2, 57.6, 14.8, 6.66, 783.9, 505.9, 1.31, 418.5],
  [18.4, 0.50, 32.4, 58.3, 14.9, 6.62, 775, 502.5, 1.32, 423.3],
  [18.3, 0.50, 32.3, 58.7, 15.1, 6.66, 770.6, 496.8, 1.31, 425],
  [18.3, 0.49, 31.9, 58.5, 15.2, 6.73, 774.9, 494, 1.29, 422.1],
  [18.2, 0.49, 31.8, 59.1, 15.3, 6.70, 768.2, 491.5, 1.28, 420.4],
  [18.1, 0.48, 31.7, 59.4, 15.4, 6.68, 762.4, 487.2, 1.27, 417.8],
  [18.0, 0.48, 31.5, 59.8, 15.5, 6.71, 758.1, 484.6, 1.26, 415.2],
  [17.9, 0.47, 31.4, 60.1, 15.6, 6.69, 751.7, 480.3, 1.25, 412.6],
  [17.8, 0.47, 31.2, 60.4, 15.7, 6.72, 746.3, 477.1, 1.24, 409.9],
  [17.7, 0.46, 31.0, 60.8, 15.8, 6.74, 740.8, 473.4, 1.23, 407.5]
];

function formatDate(date) {
  const pad = n => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

const now = Date.now();

let records = initialValues.map((values, index) => ({
  time: formatDate(new Date(now - index * 3600000)),
  values: [...values],
  source: "DEMO"
}));

// ========================================
// 3. WATER QUALITY: 3 TA SINF
// ========================================
// Bu namunaviy qoida, laboratoriya xulosasi emas.

function classifyWaterQuality(values) {
  const pH = values[5];
  const tds = values[7];

  if (
    !Number.isFinite(pH) ||
    !Number.isFinite(tds) ||
    pH < 0 || pH > 14 || tds < 0
  ) {
    return "ANIQLANMADI";
  }

  if (pH >= 6.5 && pH <= 8.5 && tds <= 500) {
    return "YAXSHI";
  }

  if (pH >= 6.0 && pH <= 9.0 && tds <= 1000) {
    return "O‘RTACHA";
  }

  return "YOMON";
}

function qualityClass(quality) {
  if (quality === "YAXSHI") return "quality-good";
  if (quality === "O‘RTACHA") return "quality-medium";
  if (quality === "YOMON") return "quality-bad";
  return "quality-unknown";
}

// ========================================
// 4. PARAMETR KARTOCHKALARI
// ========================================

function showCards() {
  const latest = records[0];
  const container = document.getElementById("parameters");

  container.innerHTML = parameters.map((p, i) => {
    const value = latest.values[i];
    const percent = Math.min(
      100,
      Math.max(0, value / p.max * 100)
    );

    return `
      <div class="card" style="--accent:${p.color}">
        <h3>${p.uz}</h3>
        <span class="code">${p.code}</span>

        <div class="value">
          ${value}
          <span class="unit">${p.unit}</span>
        </div>

        <div class="progress">
          <div class="progress-fill"
               style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

// ========================================
// 5. JADVAL
// ========================================

function showTable(filter = "") {
  const tbody = document.getElementById("results");

  const filtered = records
    .map((r, index) => ({
      ...r,
      number: records.length - index
    }))
    .filter(r => {
      const quality = classifyWaterQuality(r.values);

      const text = [
        r.time,
        ...r.values,
        quality
      ].join(" ").toLowerCase();

      return text.includes(filter.toLowerCase());
    });

  tbody.innerHTML = filtered.map(r => {
    const quality = classifyWaterQuality(r.values);

    return `
      <tr>
        <td>${r.number}</td>
        <td>${r.time}</td>
        ${r.values.map(v => `<td>${v}</td>`).join("")}
        <td>
          <span class="quality ${qualityClass(quality)}">
            ${quality}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13">Ma'lumot topilmadi</td>
      </tr>
    `;
  }

  document.getElementById("recordCount").textContent =
    `Jami: ${records.length} ta o'lchov. ` +
    `Ko'rsatilmoqda: ${filtered.length} ta.`;
}

// ========================================
// 6. QO'LDA O'LCHOV KIRITISH
// ========================================

function addMeasurement() {
  const values = [];

  for (let i = 0; i < parameters.length; i++) {
    const p = parameters[i];

    const answer = prompt(
      `${p.uz} (${p.code})\n` +
      `O'lchov birligi: ${p.unit}\n` +
      `Yangi qiymatni kiriting:`,
      records[0].values[i]
    );

    if (answer === null) return;

    const normalized = answer.trim().replace(",", ".");

    if (!normalized) {
      alert("Qiymat bo'sh bo'lmasligi kerak.");
      return;
    }

    const value = Number(normalized);

    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (p.code === "pH" && value > 14)
    ) {
      alert("Noto'g'ri qiymat kiritildi.");
      return;
    }

    values.push(value);
  }

  records.unshift({
    time: formatDate(new Date()),
    values,
    source: "MANUAL"
  });

  if (records.length > MAX_RECORDS) {
    records.length = MAX_RECORDS;
  }

  document.getElementById("search").value = "";
  updateDashboard();
}

// ========================================
// 7. CSV EKSPORT
// ========================================

function exportCSV() {
  const headers = [
    "Timestamp",
    ...parameters.map(p => `${p.code} (${p.unit})`),
    "Water Quality",
    "Data Source"
  ];

  const rows = records.map(r => [
    r.time,
    ...r.values,
    classifyWaterQuality(r.values),
    r.source
  ]);

  const escapeCSV = value =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Noosfera_Water_Quality.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ========================================
// 8. AVTOMATIK DEMO MONITORING
// ========================================

const DEMO_INTERVAL_MS = 5000;
const MAX_RECORDS = 200;

let demoRunning = true;
let nextTick = Date.now() + DEMO_INTERVAL_MS;

const bounds = [
  [15, 23],
  [0.25, 1.3],
  [20, 60],
  [35, 85],
  [8, 25],
  [5.8, 8.6],
  [400, 1400],
  [240, 950],
  [0.5, 3.8],
  [250, 850]
];

const steps = [
  0.06, 0.015, 0.5, 0.8, 0.12,
  0.025, 9, 6, 0.03, 5
];

const decimals = [
  2, 3, 1, 1, 2, 2, 1, 1, 2, 1
];

const referenceValues = [...records[0].values];

function demoMeasurement() {
  const previous = records[0].values;

  const values = previous.map((old, i) => {
    const [min, max] = bounds[i];

    const variation =
      (Math.random() - 0.5) * steps[i] * 2;

    const drift =
      (referenceValues[i] - old) * 0.012;

    return Number(
      Math.max(
        min,
        Math.min(max, old + variation + drift)
      ).toFixed(decimals[i])
    );
  });

  records.unshift({
    time: formatDate(new Date()),
    values,
    source: "DEMO"
  });

  if (records.length > MAX_RECORDS) {
    records.length = MAX_RECORDS;
  }

  updateDashboard();
}

// ========================================
// 9. OGОHLANTIRISHLAR
// ========================================

function checkAlerts() {
  const values = records[0].values;
  const quality = classifyWaterQuality(values);
  const warnings = [];

  if (quality === "YOMON") {
    warnings.push(
      "Suv sifati YOMON sinfga tushdi."
    );
  }

  if (values[5] < 6.5 || values[5] > 8.5) {
    warnings.push(
      `pH = ${values[5]}: demo chegaradan tashqarida.`
    );
  }

  if (values[7] > 1000) {
    warnings.push(
      `TDS = ${values[7]} mg/L: demo chegaradan yuqori.`
    );
  }

  if (values[2] < 20) {
    warnings.push(
      `Tuproq namligi = ${values[2]}%: past.`
    );
  }

  const alertBox = document.getElementById("alerts");

  document.getElementById("alertText").textContent =
    warnings.length
      ? warnings.join(" ")
      : "Namuna chegaralari bo'yicha ogohlantirish yo'q.";

  alertBox.classList.toggle(
    "has-alert",
    warnings.length > 0
  );
}

// ========================================
// 10. LINE GRAPH
// ========================================

const chartSelect =
  document.getElementById("chartParameter");

parameters.forEach((p, i) => {
  const option = document.createElement("option");

  option.value = String(i);
  option.textContent =
    `${p.uz} (${p.code}, ${p.unit})`;

  chartSelect.appendChild(option);
});

chartSelect.value = "7";

function drawTrendChart() {
  const canvas = document.getElementById("trendChart");
  const ctx = canvas.getContext("2d");

  const width = Math.max(
    300,
    canvas.getBoundingClientRect().width || 700
  );

  const height = 230;
  const dpr = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const index = Number(chartSelect.value || 7);
  const data = records.slice(0, 40).reverse();

  if (!data.length) return;

  const values = data.map(r => r.values[index]);

  let min = Math.min(...values);
  let max = Math.max(...values);

  const margin = Math.max(
    (max - min) * 0.25,
    Math.abs(max) * 0.005,
    0.01
  );

  min -= margin;
  max += margin;

  const left = 58;
  const right = width - 16;
  const top = 16;
  const bottom = height - 32;

  const X = i =>
    left + (right - left) *
    (data.length === 1
      ? 0.5
      : i / (data.length - 1));

  const Y = value =>
    bottom -
    (value - min) / (max - min) *
    (bottom - top);

  ctx.font = "11px Arial";
  ctx.strokeStyle = "#e4eaf2";
  ctx.fillStyle = "#64748b";
  ctx.lineWidth = 1;

  for (let t = 0; t <= 4; t++) {
    const y =
      top + (bottom - top) * t / 4;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.fillText(
      (max - (max - min) * t / 4).toFixed(2),
      4,
      y + 4
    );
  }

  ctx.fillText(
    data[0].time.slice(11),
    left,
    height - 8
  );

  ctx.textAlign = "right";

  ctx.fillText(
    data[data.length - 1].time.slice(11),
    right,
    height - 8
  );

  ctx.textAlign = "left";
  ctx.beginPath();

  data.forEach((record, i) => {
    if (i === 0) {
      ctx.moveTo(X(i), Y(values[i]));
    } else {
      ctx.lineTo(X(i), Y(values[i]));
    }
  });

  ctx.strokeStyle = parameters[index].color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.stroke();

  const lastX = X(values.length - 1);
  const lastY = Y(values[values.length - 1]);

  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = parameters[index].color;
  ctx.fill();
}

// ========================================
// 11. DASHBOARDNI YANGILASH
// ========================================

function updateDashboard() {
  showCards();

  showTable(
    document.getElementById("search").value
  );

  document.getElementById("lastUpdated").textContent =
    records[0].time;

  checkAlerts();
  drawTrendChart();
}

function updateCountdown() {
  document.getElementById("countdown").textContent =
    demoRunning
      ? Math.max(
          0,
          Math.ceil((nextTick - Date.now()) / 1000)
        ) + " s"
      : "To'xtatilgan";
}

function setDemoRunning(running) {
  demoRunning = running;
  nextTick = Date.now() + DEMO_INTERVAL_MS;

  document.getElementById("pauseBtn").hidden = !running;
  document.getElementById("resumeBtn").hidden = running;

  document.getElementById("modeLabel").textContent =
    running
      ? "DEMO • Avtomatik monitoring"
      : "DEMO • To'xtatilgan";

  document.getElementById("monitoringText").textContent =
    running
      ? "Demo ma'lumotlar avtomatik yangilanmoqda"
      : "Demo yangilanishi to'xtatilgan";

  updateCountdown();
}

// ========================================
// 12. TUGMALAR VA ISHGA TUSHIRISH
// ========================================

document.getElementById("search")
  .addEventListener("input", e => {
    showTable(e.target.value);
  });

document.getElementById("addBtn")
  .addEventListener("click", addMeasurement);

document.getElementById("exportBtn")
  .addEventListener("click", exportCSV);

document.getElementById("pauseBtn")
  .addEventListener("click", () => {
    setDemoRunning(false);
  });

document.getElementById("resumeBtn")
  .addEventListener("click", () => {
    setDemoRunning(true);
  });

chartSelect.addEventListener(
  "change",
  drawTrendChart
);

window.addEventListener(
  "resize",
  drawTrendChart
);

setInterval(() => {
  if (demoRunning && Date.now() >= nextTick) {
    demoMeasurement();
    nextTick = Date.now() + DEMO_INTERVAL_MS;
  }

  updateCountdown();
}, 250);

updateDashboard();
updateCountdown();
