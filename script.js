
"use strict";

const API_URL = "./api/measurements.json";

// 1. MONITORING PARAMETRLARI
const parameters = [
  { uz: "Suv sathi", code: "H", unit: "m", color: "#4aa3ce", max: 30 },
  { uz: "Suvning sho'rlanishi", code: "S", unit: "ppt", color: "#648df4", max: 5 },
  { uz: "Tuproq namligi", code: "SM", unit: "%", color: "#27c68b", max: 100 },
  { uz: "Havo namligi", code: "RH", unit: "%", color: "#50a8ae", max: 100 },
  { uz: "Suv harorati", code: "T", unit: "°C", color: "#f4a43b", max: 50 },
  { uz: "Suvning pH ko'rsatkichi", code: "pH", unit: "pH", color: "#9d7ad8", max: 14 },
  { uz: "Suvning elektr o'tkazuvchanligi", code: "EC", unit: "µS/cm", color: "#468ac1", max: 2000 },
  { uz: "Umumiy erigan moddalar miqdori", code: "TDS", unit: "mg/L", color: "#d6a047", max: 2000 },
  { uz: "Tuproq sho'rlanishi", code: "ECe", unit: "dS/m", color: "#d37da7", max: 10 },
  { uz: "Tuproq elektr o'tkazuvchanligi", code: "ECs", unit: "µS/cm", color: "#77945b", max: 2000 }
];

// 2. JSON MANBASI VA O'LCHOVLAR
const MAX_RECORDS = 200;
const POLL_INTERVAL_MS = 10000;

let records = [];
let pollingEnabled = true;
let lastFetchAt = null;

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Noma'lum";
  }

  const pad = n => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeMeasurement(item) {
  if (!item || typeof item !== "object") return null;

  const date = new Date(item.timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const values = parameters.map(p => Number(item[p.code]));

  if (
    values.some(v => !Number.isFinite(v) || v < 0) ||
    values[5] > 14
  ) {
    return null;
  }

  return {
    time: formatDate(date),
    timestamp: date.getTime(),
    values,
    source: "JSON",
    id: String(item.id || item.timestamp)
  };
}

// 3. WATER QUALITY: 3 TA SINF
// Bu namunaviy tasniflash qoidasi, laboratoriya xulosasi emas.

function classifyWaterQuality(values) {
  const pH = values[5];
  const tds = values[7];

  if (
    !Number.isFinite(pH) ||
    !Number.isFinite(tds) ||
    pH < 0 ||
    pH > 14 ||
    tds < 0
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

// 4. PARAMETR KARTOCHKALARI

function showCards() {
  const latest = records[0];
  const container = document.getElementById("parameters");

  if (!container) return;

  if (!latest) {
    container.innerHTML =
      '<div class="card">O‘lchov ma’lumotlari kutilmoqda...</div>';
    return;
  }

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

// 5. JADVAL

function showTable(filter = "") {
  const tbody = document.getElementById("results");
  if (!tbody) return;

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

  const count = document.getElementById("recordCount");

  if (count) {
    count.textContent =
      `Jami: ${records.length} ta o'lchov. ` +
      `Ko'rsatilmoqda: ${filtered.length} ta.`;
  }
}

// 6. QO'LDA O'LCHOV KIRITISH

function addMeasurement() {
  const values = [];

  for (let i = 0; i < parameters.length; i++) {
    const p = parameters[i];

    const answer = prompt(
      `${p.uz} (${p.code})\n` +
      `O'lchov birligi: ${p.unit}\n` +
      `Yangi qiymatni kiriting:`,
      records[0]?.values[i] ?? ""
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
    timestamp: Date.now(),
    values,
    source: "MANUAL",
    id: `manual-${Date.now()}`
  });

  if (records.length > MAX_RECORDS) {
    records.length = MAX_RECORDS;
  }

  const search = document.getElementById("search");
  if (search) search.value = "";

  updateDashboard();
}

// 7. CSV EKSPORT

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

// 8. TASODIFIY DEMO MA'LUMOTLAR YARATILMAYDI
// Ma'lumotlar JSON manbasidan yoki qo'lda kiritish orqali olinadi.

// 9. OGOHLANTIRISHLAR

function checkAlerts() {
  const alertText = document.getElementById("alertText");
  const alertBox = document.getElementById("alerts");

  if (!records.length) {
    if (alertText) {
      alertText.textContent = "O‘lchov ma’lumotlari kutilmoqda.";
    }
    return;
  }

  const values = records[0].values;
  const quality = classifyWaterQuality(values);
  const warnings = [];

  if (quality === "YOMON") {
    warnings.push("Suv sifati YOMON sinfga tushdi.");
  }

  if (values[5] < 6.5 || values[5] > 8.5) {
    warnings.push(
      `pH = ${values[5]}: belgilangan chegaradan tashqarida.`
    );
  }

  if (values[7] > 1000) {
    warnings.push(
      `TDS = ${values[7]} mg/L: belgilangan chegaradan yuqori.`
    );
  }

  if (values[2] < 20) {
    warnings.push(
      `Tuproq namligi = ${values[2]}%: past.`
    );
  }

  if (alertText) {
    alertText.textContent = warnings.length
      ? warnings.join(" ")
      : "Belgilangan chegaralar bo‘yicha ogohlantirish yo‘q.";
  }

  if (alertBox) {
    alertBox.classList.toggle("has-alert", warnings.length > 0);
  }
}

// 10. LINE GRAPH

const chartSelect = document.getElementById("chartParameter");

if (chartSelect) {
  parameters.forEach((p, i) => {
    const option = document.createElement("option");

    option.value = String(i);
    option.textContent = `${p.uz} (${p.code}, ${p.unit})`;

    chartSelect.appendChild(option);
  });

  chartSelect.value = "7";
}

function drawTrendChart() {
  const canvas = document.getElementById("trendChart");

  if (!canvas || !chartSelect) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = Math.max(
    300,
    canvas.getBoundingClientRect().width || 700
  );

  const height = 230;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

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
    (data.length === 1 ? 0.5 : i / (data.length - 1));

  const Y = value =>
    bottom -
    (value - min) / (max - min) *
    (bottom - top);

  ctx.font = "11px Arial";
  ctx.strokeStyle = "#e4eaf2";
  ctx.fillStyle = "#64748b";
  ctx.lineWidth = 1;

  for (let t = 0; t <= 4; t++) {
    const y = top + (bottom - top) * t / 4;

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

  ctx.fillText(data[0].time.slice(11), left, height - 8);

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

// 11. DASHBOARDNI YANGILASH

function updateDashboard() {
  showCards();

  const search = document.getElementById("search");
  showTable(search ? search.value : "");

  const updated = document.getElementById("lastUpdated");

  if (updated) {
    updated.textContent =
      records[0]?.time || "Ma'lumot kutilmoqda";
  }

  checkAlerts();
  drawTrendChart();
}

function updateCountdown() {
  const el = document.getElementById("countdown");

  if (el) {
    el.textContent = pollingEnabled
      ? "10 s"
      : "To‘xtatilgan";
  }
}

function setPolling(enabled) {
  pollingEnabled = enabled;

  const pause = document.getElementById("pauseBtn");
  const resume = document.getElementById("resumeBtn");
  const mode = document.getElementById("modeLabel");
  const status = document.getElementById("monitoringText");

  if (pause) pause.hidden = !enabled;
  if (resume) resume.hidden = enabled;

  if (mode) {
    mode.textContent = enabled
      ? "JSON • Monitoring"
      : "JSON • To‘xtatilgan";
  }

  if (status) {
    status.textContent = enabled
      ? "JSON manbasidan o‘qilmoqda"
      : "Avtomatik o‘qish to‘xtatilgan";
  }

  updateCountdown();
}

// 12. JSON FAYLDAN MA'LUMOT OLISH

async function loadMeasurements() {
  try {
    const response = await fetch(
      API_URL + "?t=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const payload = await response.json();

    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.measurements)
        ? payload.measurements
        : [payload];

    const incoming = items
      .map(normalizeMeasurement)
      .filter(Boolean);

    if (!incoming.length) {
      throw new Error(
        "JSON ichida yaroqli o‘lchov topilmadi"
      );
    }

    for (const record of incoming) {
      const exists = records.some(
        r => r.id === record.id &&
             r.timestamp === record.timestamp
      );

      if (!exists) {
        records.push(record);
      }
    }

    records.sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );

    records.length = Math.min(records.length, MAX_RECORDS);
    lastFetchAt = Date.now();

    const status = document.getElementById("monitoringText");

    if (status) {
      status.textContent =
        "JSON o‘qildi • " +
        formatDate(new Date(lastFetchAt)) +
        " (yangi sensor o‘lchovi kelganini anglatmaydi)";
    }

    updateDashboard();
  } catch (error) {
    console.error("JSON yuklash xatosi:", error);

    const status = document.getElementById("monitoringText");

    if (status) {
      status.textContent =
        "JSON yuklanmadi: " + error.message;
    }
  }
}

// 13. TUGMALAR VA ISHGA TUSHIRISH

function on(id, event, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener(event, handler);
  }
}

on("search", "input", e => showTable(e.target.value));
on("addBtn", "click", addMeasurement);
on("exportBtn", "click", exportCSV);

on("pauseBtn", "click", () => setPolling(false));

on("resumeBtn", "click", () => {
  setPolling(true);
  loadMeasurements();
});

if (chartSelect) {
  chartSelect.addEventListener("change", drawTrendChart);
}

window.addEventListener("resize", drawTrendChart);

setInterval(() => {
  if (pollingEnabled) {
    loadMeasurements();
  }
}, POLL_INTERVAL_MS);

setPolling(true);
updateDashboard();
loadMeasurements();
// Qurilma holatini tekshirish
async function checkDeviceStatus() {
    const status = document.getElementById("deviceStatus");

    if (!status) return;

    try {
        const response = await fetch("./api/measurements.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Ma'lumot olinmadi");
        }

        const data = await response.json();
        const lastTime = new Date(data.timestamp).getTime();

        // Oxirgi o'lchov 30 soniyadan eski bo'lmasligi kerak
        const isOnline =
            Number.isFinite(lastTime) &&
            lastTime <= Date.now() &&
            Date.now() - lastTime <= 30000;

        if (isOnline) {
            status.textContent = "● ONLINE";
            status.style.color = "#16a34a";
        } else {
            status.textContent = "● OFFLINE";
            status.style.color = "#dc2626";
        }

    } catch (error) {
        status.textContent = "● OFFLINE";
        status.style.color = "#dc2626";
        console.error(error);
    }
}

// Har 5 soniyada tekshirish
checkDeviceStatus();
setInterval(checkDeviceStatus, 5000);