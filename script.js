
const parameters = [
  {
    name: "Groundwater Level",
    uz: "Suv sathi",
    code: "H",
    unit: "m",
    color: "#4aa3ce",
    max: 30
  },
  {
    name: "Water Salinity",
    uz: "Suvning sho'rlanishi",
    code: "S",
    unit: "ppt",
    color: "#648df4",
    max: 5
  },
  {
    name: "Soil Moisture Content",
    uz: "Tuproq namligi",
    code: "SM",
    unit: "%",
    color: "#27c68b",
    max: 100
  },
  {
    name: "Relative Humidity",
    uz: "Havo namligi",
    code: "RH",
    unit: "%",
    color: "#50a8ae",
    max: 100
  },
  {
    name: "Water Temperature",
    uz: "Suv harorati",
    code: "T",
    unit: "°C",
    color: "#f4a43b",
    max: 50
  },
  {
    name: "Water pH",
    uz: "Suvning pH ko'rsatkichi",
    code: "pH",
    unit: "pH",
    color: "#9d7ad8",
    max: 14
  },
  {
    name: "Water Electrical Conductivity",
    uz: "Suvning elektr o'tkazuvchanligi",
    code: "EC",
    unit: "µS/cm",
    color: "#468ac1",
    max: 2000
  },
  {
    name: "Total Dissolved Solids",
    uz: "Umumiy erigan moddalar miqdori",
    code: "TDS",
    unit: "mg/L",
    color: "#d6a047",
    max: 2000
  },
  {
    name: "Soil Saturation Extract EC",
    uz: "Tuproq sho'rlanishi",
    code: "ECe",
    unit: "dS/m",
    color: "#d37da7",
    max: 10
  },
  {
    name: "Soil Electrical Conductivity",
    uz: "Tuproq elektr o'tkazuvchanligi",
    code: "ECs",
    unit: "µS/cm",
    color: "#77945b",
    max: 2000
  }
];

// 10 ta sintetik namunaviy o'lchov
let records = [
  {
    time: "2026-10-29 18:35:49",
    values: [18.6,0.51,32.2,57.6,14.8,6.66,783.9,505.9,1.31,418.5]
  },
  {
    time: "2026-10-29 17:35:49",
    values: [18.4,0.50,32.4,58.3,14.9,6.62,775,502.5,1.32,423.3]
  },
  {
    time: "2026-10-29 16:35:49",
    values: [18.3,0.50,32.3,58.7,15.1,6.66,770.6,496.8,1.31,425]
  },
  {
    time: "2026-10-29 15:35:49",
    values: [18.3,0.49,31.9,58.5,15.2,6.73,774.9,494,1.29,422.1]
  },
  {
    time: "2026-10-29 14:35:49",
    values: [18.2,0.49,31.8,59.1,15.3,6.70,768.2,491.5,1.28,420.4]
  },
  {
    time: "2026-10-29 13:35:49",
    values: [18.1,0.48,31.7,59.4,15.4,6.68,762.4,487.2,1.27,417.8]
  },
  {
    time: "2026-10-29 12:35:49",
    values: [18.0,0.48,31.5,59.8,15.5,6.71,758.1,484.6,1.26,415.2]
  },
  {
    time: "2026-10-29 11:35:49",
    values: [17.9,0.47,31.4,60.1,15.6,6.69,751.7,480.3,1.25,412.6]
  },
  {
    time: "2026-10-29 10:35:49",
    values: [17.8,0.47,31.2,60.4,15.7,6.72,746.3,477.1,1.24,409.9]
  },
  {
    time: "2026-10-29 09:35:49",
    values: [17.7,0.46,31.0,60.8,15.8,6.74,740.8,473.4,1.23,407.5]
  }
];

// Kartochkalarni ko'rsatish
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
        <h3 title="${p.name}">${p.uz}</h3>
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

// Jadvalni ko'rsatish
function showTable(filter = "") {
  const tbody = document.getElementById("results");

  const filtered = records
    .map((r, index) => ({ ...r, number: records.length - index }))
    .filter(r => {
      const searchable = [
        r.time,
        ...r.values,
        "SIMULATED"
      ].join(" ").toLowerCase();

      return searchable.includes(filter.toLowerCase());
    });

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td>${r.number}</td>
      <td>${r.time}</td>
      ${r.values.map(v => `<td>${v}</td>`).join("")}
      <td><span class="quality">SIMULATED</span></td>
    </tr>
  `).join("");

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13">Ma'lumot topilmadi</td>
      </tr>
    `;
  }

  document.getElementById("recordCount").textContent =
    `Jami: ${records.length} ta o'lchov. Ko'rsatilmoqda: ${filtered.length} ta.`;
}

// Sana va vaqtni formatlash
function formatDate(date) {
  const pad = n => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Yangi o'lchov kiritish
function addMeasurement() {
  const latest = records[0];
  const values = [];

  for (let i = 0; i < parameters.length; i++) {
    const p = parameters[i];

    const answer = prompt(
      `${p.uz} (${p.code})\n` +
      `O'lchov birligi: ${p.unit}\n` +
      `Yangi qiymatni kiriting:`,
      latest.values[i]
    );

    if (answer === null) {
      return;
    }

    const trimmed = answer.trim();

    if (trimmed === "") {
      alert("Qiymat bo'sh bo'lmasligi kerak.");
      return;
    }

    const value = Number(trimmed.replace(",", "."));

    if (!Number.isFinite(value)) {
      alert("Faqat raqam kiriting.");
      return;
    }

    if (value < 0 || (p.code === "pH" && value > 14)) {
      alert("Kiritilgan qiymat ruxsat etilgan diapazonda emas.");
      return;
    }

    values.push(value);
  }

  records.unshift({
    time: formatDate(new Date()),
    values
  });

  document.getElementById("search").value = "";

  showCards();
  showTable();

  alert("Yangi namunaviy o'lchov qo'shildi!");
}

// CSV eksport
function exportCSV() {
  const headers = [
    "Timestamp",
    ...parameters.map(p => `${p.code} (${p.unit})`),
    "Data Quality"
  ];

  const rows = records.map(r => [
    r.time,
    ...r.values,
    "SIMULATED"
  ]);

  const escapeCSV = value => {
    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Noosfera_Monitoring_Data.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Tugmalarni ulash
document.getElementById("search")
  .addEventListener("input", e => {
    showTable(e.target.value);
  });

document.getElementById("addBtn")
  .addEventListener("click", addMeasurement);

document.getElementById("exportBtn")
  .addEventListener("click", exportCSV);

// Dastlabki yuklash
showCards();
showTable();
