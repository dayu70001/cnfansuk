const DEFAULT_STATE = {
  settings: {
    imageLimit: 6,
    multiplier: 1.8,
    rates: { GBP: 9, EUR: 8, USD: 7 },
    defaultSizes: ["M", "L", "XL", "XXL"],
    apiBase: "https://api.cnfans.co.uk",
    r2ImageBase: "https://img.cnfans.co.uk",
  },
  candidates: [],
  selectedIds: [],
  publishDrafts: [],
  apiStatus: "未检测",
};

const state = structuredClone(DEFAULT_STATE);
const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));
const pageTitle = document.querySelector("#pageTitle");
const apiStatus = document.querySelector("#apiStatus");

const pageTitles = {
  source: "来源扫描",
  pool: "候选商品池",
  collect: "已选采集队列",
  review: "审核与定价",
  publish: "发布预览",
  settings: "面板设置",
};

const mainCategories = ["新品", "外套", "上衣", "下装", "套装"];
const subCategories = ["连帽卫衣", "短袖", "夹克", "运动套装", "长裤", "短裤", "成套搭配"];

const mockTitles = [
  ["p100 黑色连帽卫衣", 6, "p100", false, false],
  ["p150 水洗夹克", 8, "p150", false, false],
  ["p220 运动套装", 7, "p220", false, false],
  ["未标价短袖样品", 6, "", false, false],
  ["p80 棉质短袖", 4, "p80", false, false],
  ["p120 宽松长裤", 5, "p120", false, false],
  ["p180 加厚外套", 9, "p180", true, false],
  ["p95 夏季短裤", 3, "p95", false, false],
  ["p160 疑似重复卫衣", 6, "p160", false, true],
  ["p130 拉链连帽卫衣", 7, "p130", false, false],
  ["p260 高级运动套装", 8, "p260", false, false],
  ["未标价夹克样品", 7, "", false, false],
];

function mergeState(nextState) {
  Object.assign(state, structuredClone(DEFAULT_STATE), nextState || {});
  state.settings = { ...DEFAULT_STATE.settings, ...(nextState?.settings || {}) };
  state.settings.rates = { ...DEFAULT_STATE.settings.rates, ...(nextState?.settings?.rates || {}) };
  state.settings.defaultSizes = Array.isArray(nextState?.settings?.defaultSizes)
    ? nextState.settings.defaultSizes
    : DEFAULT_STATE.settings.defaultSizes;
  state.candidates = Array.isArray(nextState?.candidates) ? nextState.candidates : [];
  state.selectedIds = Array.isArray(nextState?.selectedIds) ? nextState.selectedIds : [];
  state.publishDrafts = Array.isArray(nextState?.publishDrafts) ? nextState.publishDrafts : [];
}

async function loadState() {
  try {
    const response = await fetch("/api/state");
    mergeState(await response.json());
  } catch {
    mergeState(DEFAULT_STATE);
  }
  syncSettingsControls();
  renderAll();
}

async function saveState() {
  await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}

function showTab(tabName) {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  panels.forEach((panel) => panel.classList.toggle("active-panel", panel.id === tabName));
  pageTitle.textContent = pageTitles[tabName] || "本地上架面板";
  renderAll();
}

function getCostFromTitle(title) {
  const match = title.match(/(?:^|\s)p(\d+)(?:\s|$)/i);
  return match ? Number(match[1]) : null;
}

function cnfansRound(value) {
  if (!Number.isFinite(value)) return null;
  const whole = Math.floor(value);
  const firstDecimal = Math.floor((value - whole) * 10 + 0.000001);
  return firstDecimal >= 6 ? whole + 1 : whole;
}

function calculatePrices(costCny, settings = state.settings) {
  if (!Number.isFinite(costCny)) {
    return { costCny: null, saleCny: null, GBP: null, EUR: null, USD: null };
  }
  const saleCny = costCny * Number(settings.multiplier || 1.8);
  return {
    costCny,
    saleCny: cnfansRound(saleCny),
    GBP: cnfansRound(saleCny / Number(settings.rates.GBP || 9)),
    EUR: cnfansRound(saleCny / Number(settings.rates.EUR || 8)),
    USD: cnfansRound(saleCny / Number(settings.rates.USD || 7)),
  };
}

function money(value, prefix = "") {
  return Number.isFinite(value) ? `${prefix}${value}` : "—";
}

function statusFor(candidate) {
  if (candidate.existsInD1) return { key: "exists", label: "已存在", className: "local", collectable: false };
  if (candidate.duplicate) return { key: "duplicate", label: "疑似重复", className: "selected", collectable: false };
  if (!Number.isFinite(candidate.detectedCostCny)) return { key: "no-price", label: "未识别价格", className: "no-price", collectable: false };
  if (candidate.imageCount < state.settings.imageLimit) return { key: "image-short", label: "图片不足", className: "image-short", collectable: false };
  if (candidate.collectStatus === "待编辑") return { key: "editing", label: "待编辑", className: "editing", collectable: true };
  return { key: "collectable", label: "可采集", className: "collectable", collectable: true };
}

function selectedCandidates() {
  return state.candidates.filter((candidate) => state.selectedIds.includes(candidate.id));
}

function editableCandidates() {
  return selectedCandidates().filter((candidate) => candidate.collectStatus === "待编辑");
}

function makeMockCandidates() {
  const sourceUrl = document.querySelector("#sourceUrl").value.trim() || "https://mock.local/source";
  const keyword = document.querySelector("#keyword").value.trim();
  const skipD1 = document.querySelector("#skipD1").checked;
  const skipDuplicate = document.querySelector("#skipDuplicate").checked;
  const count = 8 + Math.floor(Math.random() * 5);
  const rows = mockTitles.slice(0, count).filter(([, , , existsInD1, duplicate]) => {
    if (skipD1 && existsInD1) return false;
    if (skipDuplicate && duplicate) return false;
    return true;
  });

  state.candidates = rows.map(([baseTitle, imageCount, rawPriceText, existsInD1, duplicate], index) => {
    const title = keyword ? `${baseTitle} ${keyword}` : baseTitle;
    const costCny = getCostFromTitle(title);
    const prices = calculatePrices(costCny);
    return {
      id: `mock-${Date.now()}-${index + 1}`,
      title,
      description: `${title} 的本地草稿描述。正式发布前请人工检查标题、分类、价格和图片。`,
      sourceUrl: `${sourceUrl.replace(/\/$/, "")}/item-${index + 1}`,
      imageCount,
      imageUrl: "占位图",
      rawPriceText,
      detectedCostCny: costCny,
      saleCny: prices.saleCny,
      prices: { GBP: prices.GBP, EUR: prices.EUR, USD: prices.USD },
      status: "模拟候选",
      collectStatus: "待采集",
      category: "新品",
      subcategory: "连帽卫衣",
      sizes: [...state.settings.defaultSizes],
      existsInD1,
      duplicate,
    };
  });
  state.selectedIds = [];
  state.publishDrafts = [];
  document.querySelector("#scanMessage").textContent = `已生成 ${state.candidates.length} 条模拟候选商品。`;
}

function renderStatusBar() {
  const label = state.apiStatus === "已连接" ? "接口：已连接" : state.apiStatus === "失败" ? "接口：失败" : "接口：未连接";
  apiStatus.textContent = label;
  apiStatus.className = `status-pill ${state.apiStatus === "已连接" ? "connected" : state.apiStatus === "失败" ? "failed" : "neutral"}`;
}

function renderCandidates() {
  const grid = document.querySelector("#candidateGrid");
  if (!state.candidates.length) {
    grid.innerHTML = `<div class="empty-box">还没有候选商品。请先到“来源扫描”点击“开始模拟扫描”。</div>`;
    return;
  }

  grid.innerHTML = state.candidates.map((candidate) => {
    const status = statusFor(candidate);
    const selected = state.selectedIds.includes(candidate.id);
    const prices = calculatePrices(candidate.detectedCostCny);
    return `
      <article class="product-card ${selected ? "selected-card" : ""}" data-id="${candidate.id}">
        <div class="card-top">
          <input class="card-checkbox" type="checkbox" ${selected ? "checked" : ""} aria-label="选择 ${escapeHtml(candidate.title)}" />
          <div class="thumb">图片占位</div>
        </div>
        <h4>${escapeHtml(candidate.title)}</h4>
        <div class="meta-lines">
          <span>识别价格：${candidate.rawPriceText || "未识别"}</span>
          <span>图片数量：${candidate.imageCount} / 要求 ${state.settings.imageLimit}</span>
          <span>来源：<a href="${escapeAttr(candidate.sourceUrl)}" target="_blank" rel="noreferrer">查看来源</a></span>
        </div>
        <div class="tag-row">
          <span class="tag ${status.className}">${status.label}</span>
          ${selected ? `<span class="tag selected">已选择</span>` : ""}
        </div>
        <div class="price-grid">
          <div><span>成本人民币</span><strong>${money(prices.costCny)}</strong></div>
          <div><span>售价人民币</span><strong>${money(prices.saleCny)}</strong></div>
          <div><span>英镑</span><strong>${money(prices.GBP, "£")}</strong></div>
          <div><span>欧元</span><strong>${money(prices.EUR, "€")}</strong></div>
          <div><span>美元</span><strong>${money(prices.USD, "$")}</strong></div>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".product-card").forEach((card) => {
    card.querySelector(".card-checkbox").addEventListener("change", (event) => {
      toggleSelected(card.dataset.id, event.target.checked);
    });
  });
}

function renderCollect() {
  const selected = selectedCandidates();
  const stats = {
    selected: selected.length,
    collectable: selected.filter((item) => statusFor(item).collectable).length,
    imageShort: selected.filter((item) => item.imageCount < state.settings.imageLimit).length,
    noPrice: selected.filter((item) => !Number.isFinite(item.detectedCostCny)).length,
    editing: selected.filter((item) => item.collectStatus === "待编辑").length,
  };
  document.querySelector("#collectStats").innerHTML = [
    ["已选数量", stats.selected],
    ["可采集", stats.collectable],
    ["图片不足", stats.imageShort],
    ["未识别价格", stats.noPrice],
    ["待编辑", stats.editing],
  ].map(([label, value]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join("");

  document.querySelector("#collectList").innerHTML = selected.length ? selected.map((candidate) => {
    const status = statusFor(candidate);
    return `
      <article class="queue-row">
        <div>
          <h4>${escapeHtml(candidate.title)}</h4>
          <div class="meta-lines">
            <span>图片：${candidate.imageCount} / ${state.settings.imageLimit}</span>
            <span>价格：${candidate.rawPriceText || "未识别"}</span>
          </div>
        </div>
        <span class="tag ${candidate.collectStatus === "待编辑" ? "editing" : status.className}">${candidate.collectStatus}</span>
      </article>
    `;
  }).join("") : `<div class="empty-box">还没有选择商品。请先到“候选商品池”勾选商品。</div>`;
}

function renderReview() {
  document.querySelector("#multiplierText").textContent = state.settings.multiplier;
  document.querySelector("#gbpRateText").textContent = state.settings.rates.GBP;
  document.querySelector("#eurRateText").textContent = state.settings.rates.EUR;
  document.querySelector("#usdRateText").textContent = state.settings.rates.USD;

  const items = editableCandidates();
  const list = document.querySelector("#reviewList");
  if (!items.length) {
    list.innerHTML = `<div class="empty-box">还没有待编辑商品。请先到“已选采集队列”点击“模拟采集已选商品”。</div>`;
    return;
  }

  list.innerHTML = items.map((candidate) => `
    <article class="review-card" data-id="${candidate.id}">
      <div class="thumb">草稿商品</div>
      <label>标题<input data-field="title" value="${escapeAttr(candidate.title)}" /></label>
      <label>描述<textarea data-field="description">${escapeHtml(candidate.description || "")}</textarea></label>
      <div class="field-pair">
        <label>主分类${categorySelect("category", candidate.category)}</label>
        <label>小类${subcategorySelect("subcategory", candidate.subcategory)}</label>
      </div>
      <div class="field-pair">
        <label>成本人民币<input data-field="detectedCostCny" type="number" value="${candidate.detectedCostCny ?? ""}" /></label>
        <label>售价人民币<input data-field="saleCny" type="number" value="${candidate.saleCny ?? ""}" /></label>
      </div>
      <div class="field-pair">
        <label>英镑<input data-price="GBP" type="number" value="${candidate.prices?.GBP ?? ""}" /></label>
        <label>欧元<input data-price="EUR" type="number" value="${candidate.prices?.EUR ?? ""}" /></label>
      </div>
      <label>美元<input data-price="USD" type="number" value="${candidate.prices?.USD ?? ""}" /></label>
      <div>
        <span class="helper">默认尺码</span>
        <div class="sizes-row">${state.settings.defaultSizes.map((size) => `<span class="size-pill">${escapeHtml(size)}</span>`).join("")}</div>
      </div>
      <button class="recalc-btn">按成本重新计算价格</button>
    </article>
  `).join("");

  list.querySelectorAll(".review-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("change", () => updateCandidateField(id, input.dataset.field, input.value));
    });
    card.querySelectorAll("[data-price]").forEach((input) => {
      input.addEventListener("change", () => updateCandidatePrice(id, input.dataset.price, input.value));
    });
    card.querySelector(".recalc-btn").addEventListener("click", () => {
      const candidate = state.candidates.find((item) => item.id === id);
      const cost = Number(card.querySelector('[data-field="detectedCostCny"]').value);
      const prices = calculatePrices(cost);
      candidate.detectedCostCny = prices.costCny;
      candidate.saleCny = prices.saleCny;
      candidate.prices = { GBP: prices.GBP, EUR: prices.EUR, USD: prices.USD };
      saveState();
      renderAll();
    });
  });
}

function renderPublish() {
  const list = document.querySelector("#publishList");
  if (!state.publishDrafts.length) {
    list.innerHTML = `<div class="empty-box">还没有发布预览。请点击“生成发布预览”。</div>`;
    return;
  }
  list.innerHTML = state.publishDrafts.map((draft) => `
    <article class="preview-row">
      <div>
        <h4>${escapeHtml(draft.title)}</h4>
        <div class="meta-lines">
          <span>分类：${escapeHtml(draft.category)} / ${escapeHtml(draft.subcategory)}</span>
          <span>图片数量：${draft.imageCount}</span>
          <span>尺码：${draft.sizes.join(" / ")}</span>
          <span>图片路径：${draft.r2Key}</span>
          <span>商品编号：${draft.productCode}</span>
        </div>
        <div class="price-grid">
          <div><span>人民币售价</span><strong>${draft.saleCny}</strong></div>
          <div><span>英镑</span><strong>£${draft.prices.GBP}</strong></div>
          <div><span>欧元</span><strong>€${draft.prices.EUR}</strong></div>
          <div><span>美元</span><strong>$${draft.prices.USD}</strong></div>
        </div>
      </div>
      <span class="tag local">待发布</span>
    </article>
  `).join("");
}

function renderSettings() {
  document.querySelector("#settingsMessage").textContent = `接口检测：${state.apiStatus}`;
}

function renderAll() {
  renderStatusBar();
  renderCandidates();
  renderCollect();
  renderReview();
  renderPublish();
  renderSettings();
}

function syncSettingsControls() {
  document.querySelector("#sourceImageLimit").value = String(state.settings.imageLimit);
  document.querySelector("#settingsImageLimit").value = String(state.settings.imageLimit);
  document.querySelector("#settingsMultiplier").value = String(state.settings.multiplier);
  document.querySelector("#settingsGbp").value = String(state.settings.rates.GBP);
  document.querySelector("#settingsEur").value = String(state.settings.rates.EUR);
  document.querySelector("#settingsUsd").value = String(state.settings.rates.USD);
  document.querySelector("#settingsSizes").value = state.settings.defaultSizes.join(" / ");
  document.querySelector("#settingsApiBase").value = state.settings.apiBase;
  document.querySelector("#settingsR2Base").value = state.settings.r2ImageBase;
}

function toggleSelected(id, checked) {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) return;
  if (checked && !state.selectedIds.includes(id)) {
    state.selectedIds.push(id);
  }
  if (!checked) {
    state.selectedIds = state.selectedIds.filter((itemId) => itemId !== id);
  }
  saveState();
  renderAll();
}

function updateCandidateField(id, field, value) {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) return;
  if (["detectedCostCny", "saleCny"].includes(field)) {
    candidate[field] = value === "" ? null : Number(value);
  } else {
    candidate[field] = value;
  }
  saveState();
}

function updateCandidatePrice(id, currency, value) {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) return;
  candidate.prices = candidate.prices || {};
  candidate.prices[currency] = value === "" ? null : Number(value);
  saveState();
}

function categorySelect(field, current) {
  return `<select data-field="${field}">${mainCategories.map((item) => `<option ${item === current ? "selected" : ""}>${item}</option>`).join("")}</select>`;
}

function subcategorySelect(field, current) {
  return `<select data-field="${field}">${subCategories.map((item) => `<option ${item === current ? "selected" : ""}>${item}</option>`).join("")}</select>`;
}

function generatePreview() {
  state.publishDrafts = editableCandidates().map((candidate, index) => {
    const productCode = `CNF-APP-${String(index + 1).padStart(4, "0")}`;
    return {
      title: candidate.title,
      category: candidate.category,
      subcategory: candidate.subcategory,
      imageCount: candidate.imageCount,
      sizes: [...state.settings.defaultSizes],
      saleCny: candidate.saleCny,
      prices: candidate.prices,
      productCode,
      r2Key: `products/${productCode}/01.webp`,
      status: "待发布",
    };
  });
}

function exportDraftJson() {
  const payload = JSON.stringify(state.publishDrafts, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cnfans-catalog-draft.json";
  link.click();
  URL.revokeObjectURL(url);

  const box = document.createElement("pre");
  box.className = "json-box";
  box.textContent = payload;
  const list = document.querySelector("#publishList");
  list.appendChild(box);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

tabs.forEach((tab) => tab.addEventListener("click", () => showTab(tab.dataset.tab)));

document.querySelector("#sourceImageLimit").addEventListener("change", async (event) => {
  state.settings.imageLimit = Number(event.target.value);
  syncSettingsControls();
  await saveState();
  renderAll();
});

document.querySelector("#mockScanBtn").addEventListener("click", async () => {
  makeMockCandidates();
  await saveState();
  renderAll();
  showTab("pool");
});

document.querySelector("#selectCollectableBtn").addEventListener("click", async () => {
  state.selectedIds = state.candidates.filter((candidate) => statusFor(candidate).collectable).map((candidate) => candidate.id);
  await saveState();
  renderAll();
});

document.querySelector("#clearSelectionBtn").addEventListener("click", async () => {
  state.selectedIds = [];
  await saveState();
  renderAll();
});

document.querySelector("#keepImageQualifiedBtn").addEventListener("click", async () => {
  state.candidates = state.candidates.filter((candidate) => candidate.imageCount >= state.settings.imageLimit);
  state.selectedIds = state.selectedIds.filter((id) => state.candidates.some((candidate) => candidate.id === id));
  await saveState();
  renderAll();
});

document.querySelector("#removeImageShortBtn").addEventListener("click", async () => {
  state.candidates = state.candidates.filter((candidate) => candidate.imageCount >= state.settings.imageLimit);
  state.selectedIds = state.selectedIds.filter((id) => state.candidates.some((candidate) => candidate.id === id));
  await saveState();
  renderAll();
});

document.querySelector("#goCollectBtn").addEventListener("click", () => showTab("collect"));

document.querySelector("#simulateCollectBtn").addEventListener("click", async () => {
  selectedCandidates().forEach((candidate) => {
    const status = statusFor(candidate);
    candidate.collectStatus = status.collectable ? "待编辑" : "采集失败";
  });
  await saveState();
  renderAll();
  showTab("review");
});

document.querySelector("#applyCategoryBtn").addEventListener("click", async () => {
  const category = document.querySelector("#bulkCategory").value;
  const subcategory = document.querySelector("#bulkSubcategory").value;
  selectedCandidates().forEach((candidate) => {
    candidate.category = category;
    candidate.subcategory = subcategory;
  });
  await saveState();
  renderAll();
});

document.querySelector("#generatePreviewBtn").addEventListener("click", async () => {
  generatePreview();
  await saveState();
  renderAll();
});

document.querySelector("#exportJsonBtn").addEventListener("click", exportDraftJson);

document.querySelector("#saveSettingsBtn").addEventListener("click", async () => {
  state.settings.imageLimit = Number(document.querySelector("#settingsImageLimit").value);
  state.settings.multiplier = Number(document.querySelector("#settingsMultiplier").value);
  state.settings.rates.GBP = Number(document.querySelector("#settingsGbp").value);
  state.settings.rates.EUR = Number(document.querySelector("#settingsEur").value);
  state.settings.rates.USD = Number(document.querySelector("#settingsUsd").value);
  state.settings.defaultSizes = document.querySelector("#settingsSizes").value.split(/[\/,]/).map((item) => item.trim()).filter(Boolean);
  state.settings.apiBase = document.querySelector("#settingsApiBase").value.trim();
  state.settings.r2ImageBase = document.querySelector("#settingsR2Base").value.trim();
  syncSettingsControls();
  await saveState();
  document.querySelector("#settingsMessage").textContent = "本地设置已保存";
  renderAll();
});

document.querySelector("#healthBtn").addEventListener("click", async () => {
  document.querySelector("#settingsMessage").textContent = "接口检测中...";
  try {
    const response = await fetch("/api/health");
    const result = await response.json();
    state.apiStatus = result.ok ? "已连接" : "失败";
    document.querySelector("#settingsMessage").textContent = result.ok
      ? `接口已连接（状态 ${result.status}，耗时 ${result.elapsedMs} 毫秒）`
      : `接口连接失败（状态 ${result.status || "无响应"}）${result.error || ""}`;
  } catch (error) {
    state.apiStatus = "失败";
    document.querySelector("#settingsMessage").textContent = `接口连接失败：${error.message}`;
  }
  await saveState();
  renderStatusBar();
});

loadState();
