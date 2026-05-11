const STORAGE_KEY = "agrotech-state-v1";
const THEME_KEY = "agrotech-theme";
const createId = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialState = {
  volunteers: [
    { id: createId(), name: "Ana Ribeiro", role: "Colheita", phone: "(11) 98888-1144" },
    { id: createId(), name: "Carlos Mendes", role: "Irrigacao", phone: "(11) 97777-2299" },
    { id: createId(), name: "Joana Silva", role: "Logistica", phone: "(11) 96666-3388" }
  ],
  harvests: [
    { id: createId(), date: "2026-05-02", crop: "Tomate", quantity: 680, responsible: "Ana Ribeiro", unitPrice: 7.2, unitCost: 3.1 },
    { id: createId(), date: "2026-05-05", crop: "Alface", quantity: 430, responsible: "Carlos Mendes", unitPrice: 5.6, unitCost: 2.2 },
    { id: createId(), date: "2026-04-18", crop: "Milho", quantity: 920, responsible: "Joana Silva", unitPrice: 3.9, unitCost: 1.8 },
    { id: createId(), date: "2026-04-27", crop: "Mandioca", quantity: 760, responsible: "Ana Ribeiro", unitPrice: 4.8, unitCost: 2.4 },
    { id: createId(), date: "2026-03-20", crop: "Feijao", quantity: 510, responsible: "Carlos Mendes", unitPrice: 8.5, unitCost: 4.6 },
    { id: createId(), date: "2026-02-12", crop: "Cenoura", quantity: 370, responsible: "Joana Silva", unitPrice: 6.2, unitCost: 2.9 },
    { id: createId(), date: "2025-12-15", crop: "Milho", quantity: 1120, responsible: "Ana Ribeiro", unitPrice: 3.7, unitCost: 1.7 }
  ]
};

const state = loadState();
let currentPage = 1;
let reportPeriod = "weekly";
const pageSize = 5;

const elements = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginForm: document.querySelector("#loginForm"),
  loginError: document.querySelector("#loginError"),
  password: document.querySelector("#password"),
  togglePassword: document.querySelector("#togglePassword"),
  themeToggle: document.querySelector("#themeToggle"),
  themeLabel: document.querySelector("#themeLabel"),
  logoutButton: document.querySelector("#logoutButton"),
  menuToggle: document.querySelector("#menuToggle"),
  sidebar: document.querySelector(".sidebar"),
  pageTitle: document.querySelector("#pageTitle"),
  navLinks: document.querySelectorAll(".nav-link"),
  sections: document.querySelectorAll(".page-section"),
  volunteerForm: document.querySelector("#volunteerForm"),
  volunteerId: document.querySelector("#volunteerId"),
  volunteerName: document.querySelector("#volunteerName"),
  volunteerRole: document.querySelector("#volunteerRole"),
  volunteerPhone: document.querySelector("#volunteerPhone"),
  clearVolunteer: document.querySelector("#clearVolunteer"),
  volunteerTable: document.querySelector("#volunteerTable"),
  volunteerCount: document.querySelector("#volunteerCount"),
  harvestForm: document.querySelector("#harvestForm"),
  harvestDate: document.querySelector("#harvestDate"),
  cropType: document.querySelector("#cropType"),
  quantity: document.querySelector("#quantity"),
  responsible: document.querySelector("#responsible"),
  unitPrice: document.querySelector("#unitPrice"),
  unitCost: document.querySelector("#unitCost"),
  historySearch: document.querySelector("#historySearch"),
  historyTable: document.querySelector("#historyTable"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  pageInfo: document.querySelector("#pageInfo"),
  dashboardPeriod: document.querySelector("#dashboardPeriod"),
  toast: document.querySelector("#toast"),
  reportSegments: document.querySelectorAll("[data-report-period]")
};

const titles = {
  home: "Painel principal",
  volunteers: "Cadastro de voluntarios",
  harvest: "Registro de colheita",
  history: "Historico de producao",
  reports: "Relatorios automaticos"
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", debounce(renderCharts, 180));

function init() {
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  elements.harvestDate.valueAsDate = new Date();
  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.togglePassword.addEventListener("click", togglePassword);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.logoutButton.addEventListener("click", logout);
  elements.menuToggle.addEventListener("click", () => elements.sidebar.classList.toggle("open"));
  elements.navLinks.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
  elements.volunteerForm.addEventListener("submit", saveVolunteer);
  elements.clearVolunteer.addEventListener("click", resetVolunteerForm);
  elements.harvestForm.addEventListener("submit", saveHarvest);
  elements.historySearch.addEventListener("input", () => {
    currentPage = 1;
    renderHistory();
  });
  elements.prevPage.addEventListener("click", () => changePage(-1));
  elements.nextPage.addEventListener("click", () => changePage(1));
  elements.dashboardPeriod.addEventListener("change", renderAll);
  elements.reportSegments.forEach((button) => button.addEventListener("click", () => {
    reportPeriod = button.dataset.reportPeriod;
    elements.reportSegments.forEach((item) => item.classList.toggle("active", item === button));
    renderReports();
    renderCharts();
  }));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialState);

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(initialState);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleLogin(event) {
  event.preventDefault();
  const email = document.querySelector("#email").value.trim();
  const password = elements.password.value.trim();

  if (!email || password.length < 6) {
    elements.loginError.textContent = "Informe um e-mail valido e senha com pelo menos 6 caracteres.";
    return;
  }

  elements.loginError.textContent = "";
  elements.loginView.classList.add("hidden");
  elements.appView.classList.remove("hidden");
  showToast("Acesso liberado. Bem-vindo ao Agrotech.");
  renderCharts();
}

function togglePassword() {
  const visible = elements.password.type === "text";
  elements.password.type = visible ? "password" : "text";
  elements.togglePassword.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha");
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
  renderCharts();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const isDark = theme === "dark";
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  elements.themeLabel.textContent = isDark ? "Modo claro" : "Modo escuro";
}

function logout() {
  elements.appView.classList.add("hidden");
  elements.loginView.classList.remove("hidden");
  showToast("Sessao encerrada.");
}

function showSection(sectionId) {
  elements.sections.forEach((section) => section.classList.toggle("active", section.id === sectionId));
  elements.navLinks.forEach((button) => button.classList.toggle("active", button.dataset.section === sectionId));
  elements.pageTitle.textContent = titles[sectionId];
  elements.sidebar.classList.remove("open");
  if (sectionId === "home" || sectionId === "reports") renderCharts();
}

function saveVolunteer(event) {
  event.preventDefault();
  const payload = {
    id: elements.volunteerId.value || createId(),
    name: elements.volunteerName.value.trim(),
    role: elements.volunteerRole.value,
    phone: elements.volunteerPhone.value.trim()
  };

  if (!payload.name || !payload.role || !payload.phone) {
    showToast("Preencha todos os campos do voluntario.");
    return;
  }

  const index = state.volunteers.findIndex((item) => item.id === payload.id);
  if (index >= 0) {
    state.volunteers[index] = payload;
    showToast("Voluntario atualizado.");
  } else {
    state.volunteers.push(payload);
    showToast("Voluntario cadastrado.");
  }

  persist();
  resetVolunteerForm();
  renderVolunteers();
  renderResponsibleOptions();
}

function editVolunteer(id) {
  const volunteer = state.volunteers.find((item) => item.id === id);
  if (!volunteer) return;
  elements.volunteerId.value = volunteer.id;
  elements.volunteerName.value = volunteer.name;
  elements.volunteerRole.value = volunteer.role;
  elements.volunteerPhone.value = volunteer.phone;
  showSection("volunteers");
}

function deleteVolunteer(id) {
  const volunteer = state.volunteers.find((item) => item.id === id);
  if (!volunteer) return;
  const inUse = state.harvests.some((harvest) => harvest.responsible === volunteer.name);
  if (inUse) {
    showToast("Este voluntario esta vinculado a colheitas registradas.");
    return;
  }

  state.volunteers = state.volunteers.filter((item) => item.id !== id);
  persist();
  renderVolunteers();
  renderResponsibleOptions();
  showToast("Voluntario removido.");
}

function resetVolunteerForm() {
  elements.volunteerForm.reset();
  elements.volunteerId.value = "";
}

function saveHarvest(event) {
  event.preventDefault();
  const payload = {
    id: createId(),
    date: elements.harvestDate.value,
    crop: elements.cropType.value,
    quantity: Number(elements.quantity.value),
    responsible: elements.responsible.value,
    unitPrice: Number(elements.unitPrice.value),
    unitCost: Number(elements.unitCost.value)
  };

  if (!payload.date || !payload.crop || !payload.quantity || !payload.responsible) {
    showToast("Preencha os dados obrigatorios da colheita.");
    return;
  }

  state.harvests.unshift(payload);
  persist();
  elements.harvestForm.reset();
  elements.harvestDate.valueAsDate = new Date();
  showToast("Colheita registrada com sucesso.");
  renderAll();
}

function renderAll() {
  renderVolunteers();
  renderResponsibleOptions();
  renderKpis();
  renderHistory();
  renderReports();
  renderCharts();
}

function renderVolunteers() {
  elements.volunteerCount.textContent = `${state.volunteers.length} pessoas`;
  elements.volunteerTable.innerHTML = state.volunteers.map((volunteer) => `
    <tr>
      <td>${escapeHtml(volunteer.name)}</td>
      <td>${escapeHtml(volunteer.role)}</td>
      <td>${escapeHtml(volunteer.phone)}</td>
      <td>
        <div class="row-actions">
          <button class="ghost-button" type="button" data-edit-volunteer="${volunteer.id}">Editar</button>
          <button class="ghost-button" type="button" data-delete-volunteer="${volunteer.id}">Remover</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-edit-volunteer]").forEach((button) => {
    button.addEventListener("click", () => editVolunteer(button.dataset.editVolunteer));
  });

  document.querySelectorAll("[data-delete-volunteer]").forEach((button) => {
    button.addEventListener("click", () => deleteVolunteer(button.dataset.deleteVolunteer));
  });
}

function renderResponsibleOptions() {
  const options = state.volunteers.map((volunteer) => `<option>${escapeHtml(volunteer.name)}</option>`).join("");
  elements.responsible.innerHTML = `<option value="">Selecione</option>${options}`;
}

function renderKpis() {
  const data = filterByPeriod(state.harvests, elements.dashboardPeriod.value);
  const totals = calculateTotals(data);
  const topCrop = findTopCrop(data, "quantity");

  document.querySelector("#kpiProduction").textContent = `${formatNumber(totals.quantity)} kg`;
  document.querySelector("#kpiRevenue").textContent = formatCurrency(totals.revenue);
  document.querySelector("#kpiTopCrop").textContent = topCrop?.name || "-";
  document.querySelector("#kpiBalance").textContent = formatCurrency(totals.balance);
  document.querySelector("#kpiProductionTrend").textContent = `${data.length} registros no periodo`;
}

function renderHistory() {
  const query = elements.historySearch.value.toLowerCase();
  const filtered = state.harvests
    .filter((item) => item.crop.toLowerCase().includes(query) || item.responsible.toLowerCase().includes(query))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  elements.historyTable.innerHTML = rows.length ? rows.map((item) => {
    const revenue = item.quantity * item.unitPrice;
    const balance = revenue - item.quantity * item.unitCost;
    return `
      <tr>
        <td>${formatDate(item.date)}</td>
        <td>${escapeHtml(item.crop)}</td>
        <td>${formatNumber(item.quantity)} kg</td>
        <td>${escapeHtml(item.responsible)}</td>
        <td>${formatCurrency(revenue)}</td>
        <td>${formatCurrency(balance)}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="6">Nenhum registro encontrado.</td></tr>`;

  elements.pageInfo.textContent = `Pagina ${currentPage} de ${totalPages}`;
  elements.prevPage.disabled = currentPage === 1;
  elements.nextPage.disabled = currentPage === totalPages;
}

function changePage(direction) {
  currentPage += direction;
  renderHistory();
}

function renderReports() {
  const data = filterByPeriod(state.harvests, reportPeriod);
  const previous = filterPreviousPeriod(state.harvests, reportPeriod);
  const totals = calculateTotals(data);
  const previousTotals = calculateTotals(previous);
  const topProfit = findTopProfit(data);
  const topProduction = findTopCrop(data, "quantity");
  const variation = previousTotals.quantity ? ((totals.quantity - previousTotals.quantity) / previousTotals.quantity) * 100 : 0;

  document.querySelector("#reportFinancial").textContent = formatCurrency(totals.balance);
  document.querySelector("#reportFinancialText").textContent = `${formatCurrency(totals.revenue)} em receitas e ${formatCurrency(totals.cost)} em custos.`;
  document.querySelector("#reportProfit").textContent = topProfit ? topProfit.name : "-";
  document.querySelector("#reportProfitText").textContent = topProfit ? `Margem media de ${topProfit.margin.toFixed(1)}%.` : "Sem dados no periodo.";
  document.querySelector("#reportProduction").textContent = topProduction ? topProduction.name : "-";
  document.querySelector("#reportProductionText").textContent = topProduction ? `${formatNumber(topProduction.value)} kg produzidos.` : "Sem dados no periodo.";
  document.querySelector("#reportCompare").textContent = `${variation.toFixed(1)}%`;
  document.querySelector("#reportCompareText").textContent = variation >= 0
    ? "Producao acima do periodo anterior."
    : "Producao abaixo do periodo anterior.";
}

function renderCharts() {
  if (elements.appView.classList.contains("hidden")) return;
  renderKpis();
  drawBarChart("productionChart", buildCropSeries(filterByPeriod(state.harvests, elements.dashboardPeriod.value), "quantity"), {
    valueSuffix: " kg",
    color: cssVar("--primary")
  });
  drawDonutChart("profitChart", buildProfitSeries(filterByPeriod(state.harvests, elements.dashboardPeriod.value)));
  drawComboChart("comparisonChart", buildComparisonSeries(filterByPeriod(state.harvests, reportPeriod)));
}

function buildCropSeries(data, metric) {
  const map = data.reduce((acc, item) => {
    const value = metric === "quantity" ? item.quantity : item.quantity * item.unitPrice;
    acc[item.crop] = (acc[item.crop] || 0) + value;
    return acc;
  }, {});
  return Object.entries(map).map(([label, value]) => ({ label, value }));
}

function buildProfitSeries(data) {
  return buildCropSeries(data, "quantity").map((item) => {
    const cropRows = data.filter((row) => row.crop === item.label);
    const totals = calculateTotals(cropRows);
    const margin = totals.revenue ? (totals.balance / totals.revenue) * 100 : 0;
    return { label: item.label, value: Math.max(margin, 0) };
  });
}

function buildComparisonSeries(data) {
  const crops = buildCropSeries(data, "quantity");
  return crops.map((item) => {
    const cropRows = data.filter((row) => row.crop === item.label);
    const totals = calculateTotals(cropRows);
    return {
      label: item.label,
      production: item.value,
      profit: totals.balance
    };
  });
}

function drawBarChart(id, series, options = {}) {
  const canvas = document.getElementById(id);
  const ctx = setupCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawPanelBackground(ctx, width, height);

  if (!series.length) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = 42;
  const max = Math.max(...series.map((item) => item.value), 1);
  const barWidth = Math.max(28, (width - padding * 2) / series.length - 18);
  const chartHeight = height - padding * 2;

  ctx.font = "600 12px Inter, sans-serif";
  ctx.fillStyle = cssVar("--muted");
  ctx.textAlign = "center";

  series.forEach((item, index) => {
    const x = padding + index * ((width - padding * 2) / series.length) + 8;
    const barHeight = (item.value / max) * chartHeight;
    const y = height - padding - barHeight;

    ctx.fillStyle = options.color || cssVar("--primary");
    roundRect(ctx, x, y, barWidth, barHeight, 7);
    ctx.fill();
    ctx.fillStyle = cssVar("--text");
    ctx.fillText(`${formatCompact(item.value)}${options.valueSuffix || ""}`, x + barWidth / 2, y - 8);
    ctx.fillStyle = cssVar("--muted");
    ctx.fillText(item.label, x + barWidth / 2, height - 16);
  });
}

function drawDonutChart(id, series) {
  const canvas = document.getElementById(id);
  const ctx = setupCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawPanelBackground(ctx, width, height);

  const total = series.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const colors = [cssVar("--primary"), cssVar("--accent"), "#38bdf8", "#a3e635", "#f97316", "#c084fc"];
  const cx = width * 0.35;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * 0.28;
  let start = -Math.PI / 2;

  series.forEach((item, index) => {
    const angle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.lineWidth = 28;
    ctx.strokeStyle = colors[index % colors.length];
    ctx.stroke();
    start += angle;
  });

  ctx.font = "800 22px Inter, sans-serif";
  ctx.fillStyle = cssVar("--text");
  ctx.textAlign = "center";
  ctx.fillText(`${(total / series.length).toFixed(1)}%`, cx, cy + 8);

  ctx.textAlign = "left";
  ctx.font = "600 12px Inter, sans-serif";
  series.forEach((item, index) => {
    const y = 52 + index * 26;
    ctx.fillStyle = colors[index % colors.length];
    roundRect(ctx, width * 0.62, y - 10, 12, 12, 3);
    ctx.fill();
    ctx.fillStyle = cssVar("--text");
    ctx.fillText(`${item.label}: ${item.value.toFixed(1)}%`, width * 0.62 + 20, y);
  });
}

function drawComboChart(id, series) {
  const canvas = document.getElementById(id);
  const ctx = setupCanvas(canvas);
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  drawPanelBackground(ctx, width, height);

  if (!series.length) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = 46;
  const maxProduction = Math.max(...series.map((item) => item.production), 1);
  const maxProfit = Math.max(...series.map((item) => item.profit), 1);
  const slot = (width - padding * 2) / series.length;
  const chartHeight = height - padding * 2;
  const points = [];

  series.forEach((item, index) => {
    const x = padding + index * slot + slot / 2;
    const barHeight = (item.production / maxProduction) * chartHeight;
    const y = height - padding - barHeight;
    roundRect(ctx, x - 16, y, 32, barHeight, 6);
    ctx.fillStyle = cssVar("--primary");
    ctx.fill();

    const profitY = height - padding - (item.profit / maxProfit) * chartHeight;
    points.push({ x, y: profitY });
    ctx.fillStyle = cssVar("--muted");
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.label, x, height - 16);
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = cssVar("--accent");
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = cssVar("--accent");
    ctx.fill();
  });

  ctx.font = "700 12px Inter, sans-serif";
  ctx.fillStyle = cssVar("--text");
  ctx.textAlign = "left";
  ctx.fillText("Barras: producao", padding, 24);
  ctx.fillText("Linha: rentabilidade", padding + 130, 24);
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(320, rect.width) * ratio;
  canvas.height = Number(canvas.getAttribute("height")) * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  canvas.width = Math.max(320, rect.width);
  canvas.height = Number(canvas.getAttribute("height"));
  return canvas.getContext("2d");
}

function drawPanelBackground(ctx, width, height) {
  ctx.fillStyle = cssVar("--surface");
  roundRect(ctx, 0, 0, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = cssVar("--line");
  ctx.stroke();
}

function drawEmptyState(ctx, width, height) {
  ctx.fillStyle = cssVar("--muted");
  ctx.font = "700 15px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Sem dados para o periodo", width / 2, height / 2);
}

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function calculateTotals(data) {
  return data.reduce((acc, item) => {
    const revenue = item.quantity * item.unitPrice;
    const cost = item.quantity * item.unitCost;
    acc.quantity += item.quantity;
    acc.revenue += revenue;
    acc.cost += cost;
    acc.balance += revenue - cost;
    return acc;
  }, { quantity: 0, revenue: 0, cost: 0, balance: 0 });
}

function findTopCrop(data) {
  const series = buildCropSeries(data, "quantity");
  return series.sort((a, b) => b.value - a.value)[0] || null;
}

function findTopProfit(data) {
  return buildProfitSeries(data)
    .map((item) => ({ name: item.label, margin: item.value }))
    .sort((a, b) => b.margin - a.margin)[0] || null;
}

function filterByPeriod(data, period) {
  const now = new Date("2026-05-11T12:00:00");
  const start = getPeriodStart(now, period, 0);
  return data.filter((item) => new Date(`${item.date}T12:00:00`) >= start);
}

function filterPreviousPeriod(data, period) {
  const now = new Date("2026-05-11T12:00:00");
  const start = getPeriodStart(now, period, 1);
  const end = getPeriodStart(now, period, 0);
  return data.filter((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    return date >= start && date < end;
  });
}

function getPeriodStart(now, period, offset) {
  const date = new Date(now);
  if (period === "weekly") date.setDate(date.getDate() - 7 * (offset + 1));
  if (period === "monthly") date.setMonth(date.getMonth() - (offset + 1));
  if (period === "yearly") date.setFullYear(date.getFullYear() - (offset + 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCompact(value) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(null, args), wait);
  };
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => elements.toast.classList.remove("show"), 3200);
}
