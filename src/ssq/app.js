import {
  BLUE_MAX,
  BLUE_MIN,
  DEFAULT_ACTIVE_MODE_TAB,
  DRAW_BLUE_COUNT,
  DRAW_RED_COUNT,
  MODE_TABS,
  RED_MAX,
  RED_MIN
} from "./constants.js";
import { parseCsv } from "./csv.js";
import { filterDraws, generateSevenTwo, validateCandidateSets } from "./logic.js";
import { initRealisticPointsChallengeUI } from "./realistic-points-ui.js";
import {
  appendRoundRecord,
  calculateBetCount,
  createHistoryKeySet,
  createRandomSeed,
  createTargetFromSeed,
  evaluateCandidatePool,
  loadRoundHistory,
  normalizeSeed,
  saveRoundHistory
} from "./match-lab.js";

const DATA_PATH = "./data/ssq_history.csv";
const MATCH_LAB_AUTO_REVEAL_STORAGE_KEY = "ssq.matchLab.autoRevealTarget";
const TOTAL_DRAW_COUNT = DRAW_RED_COUNT + DRAW_BLUE_COUNT;

const MATCH_LEVEL_LABELS = Object.freeze({
  first: "层级 A",
  second: "层级 B",
  third: "层级 C",
  fourth: "层级 D",
  fifth: "层级 E",
  sixth: "层级 F",
  none: "未命中"
});

const MATCH_LEVEL_TONES = Object.freeze({
  first: "full",
  second: "strong",
  third: "strong",
  fourth: "medium",
  fifth: "light",
  sixth: "light",
  none: "none"
});

function getElements() {
  return {
    modeTabs: Array.from(document.querySelectorAll("[data-mode-tab]")),
    modePanels: Array.from(document.querySelectorAll("[data-mode-panel]")),
    issueKeyword: document.querySelector("#issueKeyword"),
    year: document.querySelector("#yearFilter"),
    startDate: document.querySelector("#startDate"),
    endDate: document.querySelector("#endDate"),
    applyFilters: document.querySelector("#applyFilters"),
    clearFilters: document.querySelector("#clearFilters"),
    loadError: document.querySelector("#loadError"),
    drawsCount: document.querySelector("#drawsCount"),
    drawsBody: document.querySelector("#drawsBody"),
    redInput: document.querySelector("#redCandidates"),
    blueInput: document.querySelector("#blueCandidates"),
    generateBtn: document.querySelector("#generate"),
    resetBtn: document.querySelector("#reset"),
    inputError: document.querySelector("#inputError"),
    result: document.querySelector("#result"),
    matchRedInput: document.querySelector("#matchRedCandidates"),
    matchBlueInput: document.querySelector("#matchBlueCandidates"),
    matchLabSeedInput: document.querySelector("#matchLabSeedInput"),
    generateMatchLabSeed: document.querySelector("#generateMatchLabSeed"),
    applyMatchLabSeed: document.querySelector("#applyMatchLabSeed"),
    matchLabAutoReveal: document.querySelector("#matchLabAutoReveal"),
    startMatchLab: document.querySelector("#startMatchLab"),
    revealMatchLabTarget: document.querySelector("#revealMatchLabTarget"),
    newTarget: document.querySelector("#newTarget"),
    clearMatchLab: document.querySelector("#clearMatchLab"),
    matchRedBoard: document.querySelector("#matchLabRedBoard"),
    matchBlueBoard: document.querySelector("#matchLabBlueBoard"),
    matchLabError: document.querySelector("#matchLabError"),
    matchLabSelectionSummary: document.querySelector("#matchLabSelectionSummary"),
    matchLabStatusMessage: document.querySelector("#matchLabStatusMessage"),
    matchLabTargetStatus: document.querySelector("#matchLabTargetStatus"),
    matchLabTargetNumbers: document.querySelector("#matchLabTargetNumbers"),
    matchLabCurrentSeed: document.querySelector("#matchLabCurrentSeed"),
    matchLabSubmitted: document.querySelector("#matchLabSubmitted"),
    matchLabHits: document.querySelector("#matchLabHits"),
    matchLabCoverage: document.querySelector("#matchLabCoverage"),
    matchLabBandCard: document.querySelector("#matchLabBandCard"),
    matchLabBand: document.querySelector("#matchLabBand"),
    matchLabHistory: document.querySelector("#matchLabHistory")
  };
}

function formatNum(value) {
  return String(value).padStart(2, "0");
}

function formatDraw(draw) {
  if (!draw || !Array.isArray(draw.reds)) {
    return "—";
  }

  return `${draw.reds.map(formatNum).join(" ")} + ${formatNum(draw.blue)}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "");
  }

  return date.toLocaleString("zh-CN", {
    hour12: false
  });
}

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createRoundId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadBooleanPreference(storage, storageKey, defaultValue = false) {
  if (!storage || typeof storage.getItem !== "function") {
    return defaultValue;
  }

  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) {
      return defaultValue;
    }

    return raw === "true";
  } catch {
    return defaultValue;
  }
}

function saveBooleanPreference(storage, storageKey, value) {
  if (!storage || typeof storage.setItem !== "function") {
    return;
  }

  try {
    storage.setItem(storageKey, value ? "true" : "false");
  } catch {
    // Ignore localStorage write failures.
  }
}

function getCoveragePercent(coverage) {
  return Math.round((coverage.totalCovered / TOTAL_DRAW_COUNT) * 100);
}

function formatCoverageSummary(coverage) {
  return `红球覆盖 ${coverage.redCovered}/${DRAW_RED_COUNT}，蓝球覆盖 ${
    coverage.blueCovered ? "是" : "否"
  }，总覆盖 ${coverage.totalCovered}/${TOTAL_DRAW_COUNT}（${getCoveragePercent(
    coverage
  )}%）`;
}

function isTargetRevealed(record) {
  return record.targetRevealed !== false;
}

function formatSeedDisplay(seed) {
  return seed || "旧记录无种子";
}

function normalizeRoundHistoryRecords(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((record) => {
    if (!record?.candidatePool || !record?.target) {
      return record;
    }

    const seed = record.seed || record.target.seed || null;

    return {
      ...record,
      seed,
      target: {
        ...record.target,
        seed
      },
      result: evaluateCandidatePool(record.target, record.candidatePool)
    };
  });
}

function formatCandidatePoolDetail(candidatePool, betCount) {
  if (!candidatePool) {
    return "—";
  }

  const totalBets = Number.isFinite(betCount)
    ? betCount
    : calculateBetCount(candidatePool.redCandidates, candidatePool.blueCandidates);

  return [
    `<div>红球（${candidatePool.redCandidates.length}）：<strong>${candidatePool.redCandidates
      .map(formatNum)
      .join(" ")}</strong></div>`,
    `<div>蓝球（${candidatePool.blueCandidates.length}）：<strong>${candidatePool.blueCandidates
      .map(formatNum)
      .join(" ")}</strong></div>`,
    `<div>共 <strong>${totalBets}</strong> 注</div>`
  ].join("");
}

function formatCandidatePoolCounts(candidatePool, betCount) {
  if (!candidatePool) {
    return "—";
  }

  const totalBets = Number.isFinite(betCount)
    ? betCount
    : calculateBetCount(candidatePool.redCandidates, candidatePool.blueCandidates);

  return `红 ${candidatePool.redCandidates.length} 个 / 蓝 ${candidatePool.blueCandidates.length} 个 / ${totalBets} 注`;
}

function getMatchLevel(recordOrResult) {
  return recordOrResult?.prizeTier || "none";
}

function getMatchTone(recordOrResult) {
  return MATCH_LEVEL_TONES[getMatchLevel(recordOrResult)] || "none";
}

function parseLooseCandidateInput(raw, options) {
  const { min, max } = options;
  const source = String(raw || "").trim();

  if (!source) {
    return { valid: true, value: [] };
  }

  const tokens = source.split(/[,\s，、；;]+/).filter(Boolean);
  const values = [];

  for (const token of tokens) {
    if (!/^\d+$/.test(token)) {
      return { valid: false, value: [] };
    }

    const numericValue = Number(token);
    if (numericValue < min || numericValue > max) {
      return { valid: false, value: [] };
    }

    values.push(numericValue);
  }

  return {
    valid: true,
    value: Array.from(new Set(values)).sort((left, right) => left - right)
  };
}

function buildBoardMarkup(color, total, selectedValues) {
  const selectedSet = new Set(selectedValues);

  return Array.from({ length: total }, (_, index) => {
    const value = index + 1;
    const selectedClass = selectedSet.has(value) ? " is-selected" : "";
    const pressed = selectedSet.has(value) ? "true" : "false";

    return [
      `<button class="ball ball-${color}${selectedClass}"`,
      'type="button"',
      `data-ball-color="${color}"`,
      `data-ball-value="${value}"`,
      `aria-pressed="${pressed}">`,
      formatNum(value),
      "</button>"
    ].join(" ");
  }).join("");
}

export function initSsqApp() {
  const elements = getElements();
  const requiredEntries = Object.entries(elements).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return !value;
  });

  if (requiredEntries.length) {
    console.error(
      "SSQ app init failed, missing elements:",
      requiredEntries.map(([key]) => key)
    );
    return;
  }

  const storage = getStorage();
  let historyKeySet = new Set();
  const pointsChallenge = initRealisticPointsChallengeUI({
    storage,
    getHistoryKeySet: () => historyKeySet
  });
  const initialRoundHistory = normalizeRoundHistoryRecords(loadRoundHistory(storage));

  saveRoundHistory(storage, initialRoundHistory);

  let allDraws = [];
  let filteredDraws = [];
  let activeMode = pointsChallenge.getActiveModeTab() || DEFAULT_ACTIVE_MODE_TAB;
  let matchLabState = {
    selectedReds: [],
    selectedBlues: [],
    seedDraft: "",
    autoRevealTarget: loadBooleanPreference(storage, MATCH_LAB_AUTO_REVEAL_STORAGE_KEY),
    target: null,
    targetRevealed: false,
    roundResult: null,
    roundHistory: initialRoundHistory
  };

  function setLoadError(message) {
    elements.loadError.textContent = message || "";
  }

  function setInputError(message) {
    elements.inputError.textContent = message || "";
  }

  function setMatchLabError(message) {
    elements.matchLabError.textContent = message || "";
  }

  function renderModeTabs(modeName) {
    activeMode = Object.values(MODE_TABS).includes(modeName)
      ? modeName
      : DEFAULT_ACTIVE_MODE_TAB;

    elements.modeTabs.forEach((button) => {
      const selected = button.dataset.modeTab === activeMode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    elements.modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== activeMode;
    });

    pointsChallenge.setActiveModeTab(activeMode);
  }

  function renderSevenTwoResult(result) {
    if (!result) {
      elements.result.textContent = "尚未生成号码";
      return;
    }

    elements.result.innerHTML = [
      `<div>红球：<strong>${result.reds.map(formatNum).join(" ")}</strong></div>`,
      `<div>蓝球：<strong>${result.blues.map(formatNum).join(" ")}</strong></div>`
    ].join("");
  }

  function renderDraws(draws) {
    elements.drawsCount.textContent = `共 ${draws.length} 条`;

    if (!draws.length) {
      elements.drawsBody.innerHTML =
        '<tr><td colspan="4" class="empty-row">当前没有可显示的历史数据。</td></tr>';
      return;
    }

    elements.drawsBody.innerHTML = draws
      .map((draw) => {
        const reds = [
          draw.red_1,
          draw.red_2,
          draw.red_3,
          draw.red_4,
          draw.red_5,
          draw.red_6
        ]
          .map(formatNum)
          .join(" ");

        return [
          "<tr>",
          `<td>${draw.issue}</td>`,
          `<td>${draw.draw_date}</td>`,
          `<td>${reds}</td>`,
          `<td>${formatNum(draw.blue_1)}</td>`,
          "</tr>"
        ].join("");
      })
      .join("");
  }

  function renderBoards() {
    elements.matchRedBoard.innerHTML = buildBoardMarkup(
      "red",
      RED_MAX,
      matchLabState.selectedReds
    );
    elements.matchBlueBoard.innerHTML = buildBoardMarkup(
      "blue",
      BLUE_MAX,
      matchLabState.selectedBlues
    );
  }

  function renderRoundHistory() {
    if (!matchLabState.roundHistory.length) {
      elements.matchLabHistory.innerHTML =
        '<div class="empty-state">暂无实验记录</div>';
      return;
    }

    elements.matchLabHistory.innerHTML = matchLabState.roundHistory
      .map((record) => {
        const coverage = record.result.coverage;
        const matchLevel = getMatchLevel(record.result);
        const levelLabel = MATCH_LEVEL_LABELS[matchLevel] || MATCH_LEVEL_LABELS.none;
        const targetText = isTargetRevealed(record)
          ? formatDraw(record.target)
          : "尚未揭晓";
        const poolText = record.candidatePool
          ? formatCandidatePoolCounts(record.candidatePool, record.result.betCount)
          : formatDraw(record.submitted);
        const seedText = formatSeedDisplay(record.seed || record.target?.seed);

        return [
          `<article class="round-card" data-band="${getMatchTone(record.result)}">`,
          '<div class="round-card-head">',
          `<strong>${formatDateTime(record.createdAt)}</strong>`,
          `<span class="round-badge">${levelLabel}</span>`,
          "</div>",
          '<div class="round-line">',
          "<span>隐藏目标</span>",
          `<strong>${targetText}</strong>`,
          "</div>",
          '<div class="round-line">',
          "<span>种子</span>",
          `<strong class="seed-inline">${seedText}</strong>`,
          "</div>",
          '<div class="round-line">',
          "<span>候选号池</span>",
          `<strong>${poolText}</strong>`,
          "</div>",
          '<div class="round-line">',
          "<span>最佳命中</span>",
          `<strong>红球 ${record.result.redHits} / 蓝球 ${record.result.blueHits}</strong>`,
          "</div>",
          '<div class="round-line">',
          "<span>覆盖情况</span>",
          `<strong>${formatCoverageSummary(coverage)}</strong>`,
          "</div>",
          "</article>"
        ].join("");
      })
      .join("");
  }

  function updateStartButtonState() {
    const validation = validateCandidateSets(
      elements.matchRedInput.value,
      elements.matchBlueInput.value
    );

    elements.startMatchLab.disabled = !matchLabState.target || !validation.valid;
    elements.applyMatchLabSeed.disabled =
      !historyKeySet.size || !matchLabState.seedDraft.trim();
    elements.revealMatchLabTarget.disabled =
      !matchLabState.target || !matchLabState.roundResult || matchLabState.targetRevealed;
    elements.revealMatchLabTarget.textContent = matchLabState.targetRevealed
      ? "当前目标已揭晓"
      : "揭晓当前目标";
    elements.newTarget.disabled = historyKeySet.size === 0;
  }

  function renderMatchLabState() {
    renderBoards();
    updateStartButtonState();
    elements.matchLabSeedInput.value = matchLabState.seedDraft;
    elements.matchLabAutoReveal.checked = matchLabState.autoRevealTarget;

    elements.matchLabSelectionSummary.textContent =
      `已选红球 ${matchLabState.selectedReds.length} 个，已选蓝球 ${matchLabState.selectedBlues.length} 个`;

    if (!historyKeySet.size) {
      elements.matchLabStatusMessage.textContent =
        "请先加载历史开奖数据后再开始实验。";
    } else if (!matchLabState.target) {
      elements.matchLabStatusMessage.textContent = "隐藏目标尚未生成。";
    } else if (!matchLabState.roundResult) {
      elements.matchLabStatusMessage.textContent = matchLabState.autoRevealTarget
        ? "系统会根据当前种子生成一组隐藏目标，并在本局结束后自动揭晓。"
        : "系统会根据当前种子生成一组隐藏目标，并在本局结束后先展示覆盖和命中摘要。";
    } else if (!matchLabState.targetRevealed) {
      elements.matchLabStatusMessage.textContent =
        "本局已完成，当前先展示覆盖和最佳命中结果；如需查看号码，可手动揭晓目标。";
    } else {
      elements.matchLabStatusMessage.textContent =
        "本局结果已生成，可以继续创建新目标或调整候选号池。";
    }

    if (!matchLabState.target) {
      elements.matchLabTargetStatus.textContent = "隐藏目标：未生成";
      elements.matchLabTargetNumbers.textContent =
        "请先加载历史开奖数据后再开始实验。";
    } else if (matchLabState.targetRevealed) {
      elements.matchLabTargetStatus.textContent = "隐藏目标：已揭晓";
      elements.matchLabTargetNumbers.textContent = formatDraw(matchLabState.target);
    } else if (matchLabState.roundResult) {
      elements.matchLabTargetStatus.textContent = "隐藏目标：待揭晓";
      elements.matchLabTargetNumbers.textContent =
        "当前仅展示覆盖和命中摘要，点击“揭晓当前目标”查看具体号码。";
    } else {
      elements.matchLabTargetStatus.textContent = "隐藏目标：已生成";
      elements.matchLabTargetNumbers.textContent = matchLabState.autoRevealTarget
        ? "本局结束后会自动揭晓。"
        : "本局结束后默认保持隐藏，只展示覆盖和命中情况。";
    }

    elements.matchLabCurrentSeed.textContent = matchLabState.target
      ? formatSeedDisplay(matchLabState.target.seed)
      : "尚未生成";

    if (!matchLabState.roundResult) {
      elements.matchLabSubmitted.textContent = "尚未开始实验";
      elements.matchLabHits.textContent =
        "本局结束后将显示整组候选号池的最佳命中情况。";
      elements.matchLabCoverage.textContent = "本局结束后将显示覆盖范围。";
      elements.matchLabBand.textContent = "尚未开始";
      elements.matchLabBandCard.dataset.band = "none";
      return;
    }

    const { candidatePool, result } = matchLabState.roundResult;
    const matchLevel = getMatchLevel(result);

    elements.matchLabSubmitted.innerHTML = formatCandidatePoolDetail(
      candidatePool,
      result.betCount
    );
    elements.matchLabHits.textContent =
      `最佳一注命中：红球 ${result.redHits} 个，蓝球 ${result.blueHits} 个。`;
    elements.matchLabCoverage.textContent = formatCoverageSummary(result.coverage);
    elements.matchLabBand.textContent = MATCH_LEVEL_LABELS[matchLevel];
    elements.matchLabBandCard.dataset.band = getMatchTone(result);
  }

  function syncSelectedFromInputs() {
    const redResult = parseLooseCandidateInput(elements.matchRedInput.value, {
      min: RED_MIN,
      max: RED_MAX
    });
    const blueResult = parseLooseCandidateInput(elements.matchBlueInput.value, {
      min: BLUE_MIN,
      max: BLUE_MAX
    });

    if (redResult.valid) {
      matchLabState.selectedReds = redResult.value;
    }
    if (blueResult.valid) {
      matchLabState.selectedBlues = blueResult.value;
    }

    renderMatchLabState();
  }

  function syncInputsFromSelection() {
    elements.matchRedInput.value = matchLabState.selectedReds.join(",");
    elements.matchBlueInput.value = matchLabState.selectedBlues.join(",");
    renderMatchLabState();
  }

  function createNextTarget(seed = createRandomSeed()) {
    if (!historyKeySet.size) {
      matchLabState.target = null;
      matchLabState.seedDraft = "";
      matchLabState.targetRevealed = false;
      matchLabState.roundResult = null;
      renderMatchLabState();
      return;
    }

    try {
      const normalizedSeed = normalizeSeed(seed);
      matchLabState.target = createTargetFromSeed(historyKeySet, normalizedSeed);
      matchLabState.seedDraft = normalizedSeed;
      matchLabState.targetRevealed = false;
      matchLabState.roundResult = null;
      setMatchLabError("");
      renderMatchLabState();
    } catch (error) {
      setMatchLabError(error instanceof Error ? error.message : "生成隐藏目标失败");
    }
  }

  function applyFilters() {
    filteredDraws = filterDraws(allDraws, {
      issueKeyword: elements.issueKeyword.value,
      year: elements.year.value,
      startDate: elements.startDate.value,
      endDate: elements.endDate.value
    });
    renderDraws(filteredDraws);
  }

  function clearFilters() {
    elements.issueKeyword.value = "";
    elements.year.value = "";
    elements.startDate.value = "";
    elements.endDate.value = "";
    filteredDraws = allDraws.slice();
    renderDraws(filteredDraws);
  }

  function resetSevenTwo() {
    elements.redInput.value = "";
    elements.blueInput.value = "";
    setInputError("");
    renderSevenTwoResult(null);
  }

  function clearMatchLab() {
    matchLabState.selectedReds = [];
    matchLabState.selectedBlues = [];
    matchLabState.roundResult = null;
    matchLabState.targetRevealed = false;
    matchLabState.seedDraft = matchLabState.target?.seed || "";
    elements.matchRedInput.value = "";
    elements.matchBlueInput.value = "";
    setMatchLabError("");
    renderMatchLabState();
  }

  function generateSeedDraft() {
    matchLabState.seedDraft = createRandomSeed();
    setMatchLabError("");
    renderMatchLabState();
  }

  function applySeedTarget() {
    try {
      createNextTarget(elements.matchLabSeedInput.value);
    } catch (error) {
      setMatchLabError(error instanceof Error ? error.message : "按种子生成失败");
    }
  }

  function revealCurrentTarget() {
    if (!matchLabState.target || !matchLabState.roundResult || matchLabState.targetRevealed) {
      return;
    }

    matchLabState.targetRevealed = true;
    matchLabState.roundHistory = saveRoundHistory(
      storage,
      matchLabState.roundHistory.map((record) => {
        if (record.id !== matchLabState.roundResult.id) {
          return record;
        }

        return {
          ...record,
          targetRevealed: true
        };
      })
    );

    renderMatchLabState();
    renderRoundHistory();
  }

  async function loadCsvData() {
    try {
      const response = await fetch(DATA_PATH, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`加载 CSV 失败：HTTP ${response.status}`);
      }

      const text = await response.text();
      const parsed = parseCsv(text);
      if (parsed.errors.length) {
        throw new Error(parsed.errors.join("；"));
      }

      allDraws = parsed.rows.sort((left, right) => Number(right.issue) - Number(left.issue));
      filteredDraws = allDraws.slice();
      historyKeySet = createHistoryKeySet(allDraws);
      renderDraws(filteredDraws);
      setLoadError("");
      createNextTarget();
      pointsChallenge.refresh();
    } catch (error) {
      allDraws = [];
      filteredDraws = [];
      historyKeySet = new Set();
      matchLabState.target = null;
      matchLabState.targetRevealed = false;
      matchLabState.roundResult = null;
      renderDraws(filteredDraws);
      renderMatchLabState();
      setLoadError(error instanceof Error ? error.message : "加载失败");
      pointsChallenge.refresh();
    }
  }

  function generate() {
    setInputError("");
    const validation = validateCandidateSets(elements.redInput.value, elements.blueInput.value);

    if (!validation.valid) {
      setInputError(validation.error);
      renderSevenTwoResult(null);
      return;
    }

    try {
      const result = generateSevenTwo(
        validation.value.redCandidates,
        validation.value.blueCandidates
      );
      renderSevenTwoResult(result);
    } catch (error) {
      setInputError(error instanceof Error ? error.message : "生成失败");
      renderSevenTwoResult(null);
    }
  }

  function startMatchLabRound() {
    setMatchLabError("");

    if (!matchLabState.target) {
      setMatchLabError("请先加载历史开奖数据后再开始实验。");
      return;
    }

    const validation = validateCandidateSets(
      elements.matchRedInput.value,
      elements.matchBlueInput.value
    );

    if (!validation.valid) {
      setMatchLabError(validation.error);
      renderMatchLabState();
      return;
    }

    try {
      const candidatePool = validation.value;
      const roundId = createRoundId();
      const result = evaluateCandidatePool(matchLabState.target, candidatePool);

      matchLabState.roundResult = {
        id: roundId,
        candidatePool,
        result
      };
      matchLabState.targetRevealed = matchLabState.autoRevealTarget;

      const record = {
        id: roundId,
        createdAt: new Date().toISOString(),
        target: matchLabState.target,
        seed: matchLabState.target.seed,
        candidatePool,
        result,
        targetRevealed: matchLabState.targetRevealed
      };

      matchLabState.roundHistory = appendRoundRecord(storage, record);
      renderMatchLabState();
      renderRoundHistory();
    } catch (error) {
      setMatchLabError(error instanceof Error ? error.message : "实验执行失败");
    }
  }

  function handleBoardClick(event) {
    const button = event.target.closest("[data-ball-value]");
    if (!button) {
      return;
    }

    const color = button.dataset.ballColor;
    const value = Number(button.dataset.ballValue);
    const key = color === "red" ? "selectedReds" : "selectedBlues";
    const selection = matchLabState[key];

    if (selection.includes(value)) {
      matchLabState[key] = selection.filter((item) => item !== value);
    } else {
      matchLabState[key] = selection.concat(value).sort((left, right) => left - right);
    }

    setMatchLabError("");
    syncInputsFromSelection();
  }

  elements.modeTabs.forEach((button) => {
    button.addEventListener("click", () => {
      renderModeTabs(button.dataset.modeTab);
    });
  });
  elements.applyFilters.addEventListener("click", applyFilters);
  elements.clearFilters.addEventListener("click", clearFilters);
  elements.generateBtn.addEventListener("click", generate);
  elements.resetBtn.addEventListener("click", resetSevenTwo);
  elements.matchRedInput.addEventListener("input", () => {
    setMatchLabError("");
    syncSelectedFromInputs();
  });
  elements.matchBlueInput.addEventListener("input", () => {
    setMatchLabError("");
    syncSelectedFromInputs();
  });
  elements.matchLabSeedInput.addEventListener("input", () => {
    matchLabState.seedDraft = elements.matchLabSeedInput.value.trim();
    setMatchLabError("");
    renderMatchLabState();
  });
  elements.matchLabAutoReveal.addEventListener("change", () => {
    matchLabState.autoRevealTarget = elements.matchLabAutoReveal.checked;
    saveBooleanPreference(
      storage,
      MATCH_LAB_AUTO_REVEAL_STORAGE_KEY,
      matchLabState.autoRevealTarget
    );
    renderMatchLabState();
  });
  elements.matchRedBoard.addEventListener("click", handleBoardClick);
  elements.matchBlueBoard.addEventListener("click", handleBoardClick);
  elements.generateMatchLabSeed.addEventListener("click", generateSeedDraft);
  elements.applyMatchLabSeed.addEventListener("click", applySeedTarget);
  elements.startMatchLab.addEventListener("click", startMatchLabRound);
  elements.revealMatchLabTarget.addEventListener("click", revealCurrentTarget);
  elements.newTarget.addEventListener("click", () => {
    createNextTarget();
  });
  elements.clearMatchLab.addEventListener("click", clearMatchLab);

  renderModeTabs(activeMode);
  renderSevenTwoResult(null);
  renderDraws([]);
  renderRoundHistory();
  renderMatchLabState();
  pointsChallenge.refresh();
  loadCsvData();
}
