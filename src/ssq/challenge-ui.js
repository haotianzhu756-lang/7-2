import {
  BLUE_MAX,
  BLUE_MIN,
  RED_MAX,
  RED_MIN
} from "./constants.js";
import { validateCandidateSets } from "./logic.js";
import { createNonHistoricalTarget } from "./match-lab.js";
import {
  DEFAULT_SANDBOX_CONFIG,
  MATCH_CODE_LABELS,
  MATCH_CODES,
  SANDBOX_DISCLAIMER,
  SANDBOX_REWARD_MODES,
  SANDBOX_SAMPLING_STRATEGIES,
  countExperimentLines,
  createDefaultSandboxState,
  loadSandboxState,
  normalizeCandidatePool,
  saveSandboxState,
  simulateSandboxRound,
  summarizeMatchDistribution
} from "./challenge-sandbox.js";

function formatNum(value) {
  return String(value).padStart(2, "0");
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

function getElements() {
  return {
    panel: document.querySelector('[data-panel="challenge-sandbox"]'),
    disclaimer: document.querySelector("#challengeSandboxDisclaimer"),
    statusMessage: document.querySelector("#challengeSandboxStatusMessage"),
    initialCredits: document.querySelector("#challengeInitialCredits"),
    samplingStrategy: document.querySelector("#challengeSamplingStrategy"),
    rewardMode: document.querySelector("#challengeRewardMode"),
    redInput: document.querySelector("#challengeRedCandidates"),
    blueInput: document.querySelector("#challengeBlueCandidates"),
    selectionSummary: document.querySelector("#challengeSelectionSummary"),
    redBoard: document.querySelector("#challengeRedBoard"),
    blueBoard: document.querySelector("#challengeBlueBoard"),
    lineCount: document.querySelector("#challengeLineCount"),
    currentCredits: document.querySelector("#challengeCurrentCredits"),
    experimentCost: document.querySelector("#challengeExperimentCost"),
    lastReward: document.querySelector("#challengeLastReward"),
    bestMatch: document.querySelector("#challengeBestMatch"),
    poolIndex: document.querySelector("#challengePoolIndex"),
    roundsCount: document.querySelector("#challengeRoundsCount"),
    runButton: document.querySelector("#runChallengeRound"),
    mobileRunButton: document.querySelector("#runChallengeRoundMobile"),
    resetButton: document.querySelector("#resetChallengeCredits"),
    clearButton: document.querySelector("#clearChallengeHistory"),
    error: document.querySelector("#challengeError"),
    summaryText: document.querySelector("#challengeRoundSummary"),
    chart: document.querySelector("#challengeCreditsChart"),
    distribution: document.querySelector("#challengeDistribution"),
    roundsList: document.querySelector("#challengeRoundsList")
  };
}

function formatMatchLabel(matchCode) {
  return MATCH_CODE_LABELS[matchCode] || MATCH_CODE_LABELS[MATCH_CODES.NO_MATCH];
}

function formatBlueHitText(blueHit) {
  return blueHit ? "命中" : "未命中";
}

function formatSamplingStrategy(strategy) {
  if (strategy === SANDBOX_SAMPLING_STRATEGIES.WITH_REPLACEMENT) {
    return "抽样有回补";
  }
  if (strategy === SANDBOX_SAMPLING_STRATEGIES.WITHOUT_REPLACEMENT) {
    return "抽样无回补";
  }
  return "不抽样";
}

function isSamplingEnabled(strategy) {
  return strategy !== SANDBOX_SAMPLING_STRATEGIES.NONE;
}

function parsePositiveInteger(raw, fallbackValue) {
  const parsed = Number.parseInt(String(raw || "").trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function createSandboxConfig(state) {
  return {
    ...DEFAULT_SANDBOX_CONFIG,
    initialCredits: state.initialCreditsDraft,
    rewardMode: state.rewardMode,
    enablePoolIndex: state.rewardMode === SANDBOX_REWARD_MODES.ENABLED,
    poolIndex: {
      ...DEFAULT_SANDBOX_CONFIG.poolIndex
    },
    rewardProfileCredits: {
      ...DEFAULT_SANDBOX_CONFIG.rewardProfileCredits
    }
  };
}

function getCurrentCreditsChartMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无长期曲线数据</div>';
  }

  const orderedRounds = rounds.slice().reverse();
  const values = orderedRounds.map((round) => round.afterCredits);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const width = 520;
  const height = 180;
  const padding = 20;
  const range = Math.max(1, maxValue - minValue);
  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index * (width - padding * 2)) / (values.length - 1);
      const y =
        height -
        padding -
        ((value - minValue) / range) * (height - padding * 2);

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return [
    '<svg class="challenge-chart-svg" viewBox="0 0 520 180" aria-label="点数曲线图">',
    `<polyline class="challenge-chart-line" points="${points}" />`,
    "</svg>",
    `<div class="challenge-chart-scale"><span>最低 ${minValue}</span><span>最高 ${maxValue}</span></div>`
  ].join("");
}

function getDistributionMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无匹配分布</div>';
  }

  const distribution = summarizeMatchDistribution(rounds);
  const maxCount = Math.max(...Object.values(distribution), 1);

  return Object.entries(distribution)
    .map(([matchCode, count]) => {
      const widthPercent = Math.round((count / maxCount) * 100);

      return [
        '<div class="challenge-distribution-row">',
        `<span>${formatMatchLabel(matchCode)}</span>`,
        '<div class="challenge-distribution-bar-track">',
        `<div class="challenge-distribution-bar" style="width:${widthPercent}%"></div>`,
        "</div>",
        `<strong>${count}</strong>`,
        "</div>"
      ].join("");
    })
    .join("");
}

function getRoundsListMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无实验记录</div>';
  }

  return rounds
    .map((round) => {
      const roundTime = new Date(round.createdAt).toLocaleString("zh-CN", {
        hour12: false
      });
      const samplingText = round.isSampled
        ? `${formatSamplingStrategy(round.samplingStrategy)} ${round.lineCount}/${round.totalLineCount} 行`
        : `全量实验 ${round.lineCount} 行`;
      const rewardText =
        round.rewardMode === SANDBOX_REWARD_MODES.DISABLED
          ? "本轮未启用回补"
          : `回补 ${round.totalRewardCredits} 点`;

      return [
        '<article class="challenge-round-card">',
        '<div class="challenge-round-head">',
        `<strong>第 ${round.roundIndex} 轮</strong>`,
        `<span>${roundTime}</span>`,
        "</div>",
        `<p>${samplingText}</p>`,
        `<p>最佳匹配：${formatMatchLabel(round.bestMatchCode)}，红球 ${round.bestRedHits}/6，蓝球 ${formatBlueHitText(round.bestBlueHit)}</p>`,
        `<p>消耗 ${round.experimentCostCredits} 点，${rewardText}，剩余 ${round.afterCredits} 点</p>`,
        `<p>池指数：${round.rewardMode === SANDBOX_REWARD_MODES.ENABLED ? (round.poolIndexState?.currentPoolIndex ?? "—") : "—"}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

export function initChallengeSandbox({ storage, getHistoryKeySet }) {
  const elements = getElements();
  const requiredEntries = Object.entries(elements).filter(([, value]) => !value);

  if (requiredEntries.length) {
    console.error(
      "Challenge sandbox init failed, missing elements:",
      requiredEntries.map(([key]) => key)
    );
    return {
      refresh() {}
    };
  }

  let sandboxState = loadSandboxState(storage);
  let state = {
    selectedReds: [],
    selectedBlues: [],
    initialCreditsDraft: DEFAULT_SANDBOX_CONFIG.initialCredits,
    samplingStrategy: SANDBOX_SAMPLING_STRATEGIES.WITHOUT_REPLACEMENT,
    rewardMode: DEFAULT_SANDBOX_CONFIG.rewardMode,
    lastRound: sandboxState.rounds[0] || null
  };

  function setChallengeError(message) {
    elements.error.textContent = message || "";
  }

  function saveSession() {
    sandboxState = saveSandboxState(storage, sandboxState);
  }

  function renderBoards() {
    elements.redBoard.innerHTML = buildBoardMarkup("red", RED_MAX, state.selectedReds);
    elements.blueBoard.innerHTML = buildBoardMarkup("blue", BLUE_MAX, state.selectedBlues);
  }

  function getLineEstimate() {
    const validation = validateCandidateSets(elements.redInput.value, elements.blueInput.value);

    if (!validation.valid) {
      return {
        valid: false,
        message: validation.error,
        totalLineCount: 0,
        experimentLineCount: 0,
        experimentCostCredits: 0,
        isSampled: false
      };
    }

    const config = createSandboxConfig(state);
    const candidatePool = normalizeCandidatePool(
      validation.value.redCandidates,
      validation.value.blueCandidates
    );
    const lineCount = countExperimentLines(
      candidatePool.redCandidates.length,
      candidatePool.blueCandidates.length
    );
    const isSampled =
      lineCount > config.maxLinesPerRound && isSamplingEnabled(state.samplingStrategy);
    const experimentLineCount = isSampled
      ? config.maxLinesPerRound
      : lineCount;

    return {
      valid: true,
      candidatePool,
      totalLineCount: lineCount,
      experimentLineCount,
      experimentCostCredits:
        experimentLineCount * config.experimentCostCreditsPerLine,
      isSampled,
      samplingStrategy: state.samplingStrategy,
      overLimitWithoutSample:
        lineCount > config.maxLinesPerRound && !isSamplingEnabled(state.samplingStrategy)
    };
  }

  function updateRunButtons(canRun) {
    elements.runButton.disabled = !canRun;
    elements.mobileRunButton.disabled = !canRun;
  }

  function renderState() {
    const historyKeySet = getHistoryKeySet();
    const lineEstimate = getLineEstimate();
    const rounds = sandboxState.rounds || [];
    const currentPoolIndex = sandboxState.poolIndexState?.currentPoolIndex
      ?? DEFAULT_SANDBOX_CONFIG.poolIndex.initialPoolIndex;

    elements.disclaimer.textContent = SANDBOX_DISCLAIMER;
    elements.initialCredits.value = state.initialCreditsDraft;
    elements.samplingStrategy.value = state.samplingStrategy;
    elements.rewardMode.value = state.rewardMode;
    elements.selectionSummary.textContent =
      `已选红球 ${state.selectedReds.length} 个，已选蓝球 ${state.selectedBlues.length} 个`;
    elements.currentCredits.textContent = `${sandboxState.currentCredits} 点`;
    elements.poolIndex.textContent = state.rewardMode === SANDBOX_REWARD_MODES.ENABLED
      ? `${currentPoolIndex}（教学模型）`
      : "已随回补关闭";
    elements.roundsCount.textContent = `${rounds.length}/${DEFAULT_SANDBOX_CONFIG.maxRoundsPerSession} 轮`;
    elements.lastReward.textContent = state.lastRound
      ? `${state.lastRound.totalRewardCredits} 点`
      : state.rewardMode === SANDBOX_REWARD_MODES.DISABLED
        ? "回补关闭"
        : "暂无";
    elements.bestMatch.textContent = state.lastRound
      ? `${formatMatchLabel(state.lastRound.bestMatchCode)} / 红 ${state.lastRound.bestRedHits} / 蓝 ${formatBlueHitText(state.lastRound.bestBlueHit)}`
      : "尚未开始";

    if (!lineEstimate.valid) {
      elements.lineCount.textContent = "请先完成候选号输入";
      elements.experimentCost.textContent = "—";
    } else if (lineEstimate.isSampled) {
      elements.lineCount.textContent =
        `总组合 ${lineEstimate.totalLineCount}，${formatSamplingStrategy(lineEstimate.samplingStrategy)} ${lineEstimate.experimentLineCount} 行`;
      elements.experimentCost.textContent = `${lineEstimate.experimentCostCredits} 点`;
    } else {
      elements.lineCount.textContent = `全量实验 ${lineEstimate.totalLineCount} 行`;
      elements.experimentCost.textContent = `${lineEstimate.experimentCostCredits} 点`;
    }

    if (!historyKeySet?.size) {
      elements.statusMessage.textContent = "请先加载历史开奖数据后再使用点数挑战。";
      updateRunButtons(false);
    } else if (rounds.length >= DEFAULT_SANDBOX_CONFIG.maxRoundsPerSession) {
      elements.statusMessage.textContent = "本次会话已达到 50 轮，可重置点数重新开始。";
      updateRunButtons(false);
    } else if (!lineEstimate.valid) {
      elements.statusMessage.textContent = lineEstimate.message || "请先完成候选号输入。";
      updateRunButtons(false);
    } else if (lineEstimate.overLimitWithoutSample) {
      elements.statusMessage.textContent = "本轮组合过多，请缩小候选号池或使用抽样实验。";
      updateRunButtons(false);
    } else if (sandboxState.currentCredits < lineEstimate.experimentCostCredits) {
      elements.statusMessage.textContent =
        "点数不足，无法运行本轮实验。可重置点数重新开始。";
      updateRunButtons(false);
    } else {
      elements.statusMessage.textContent =
        state.rewardMode === SANDBOX_REWARD_MODES.ENABLED
          ? "当前设置可运行概率实验；低位匹配按固定点数回补，高位匹配按池指数给出动态回补。"
          : "当前设置可运行概率实验；本轮仅统计消耗、组合与匹配，不启用回补。";
      updateRunButtons(true);
    }

    if (state.lastRound) {
      elements.summaryText.textContent =
        state.lastRound.rewardMode === SANDBOX_REWARD_MODES.DISABLED
          ? `本轮实验消耗 ${state.lastRound.experimentCostCredits} 点，未启用回补，当前剩余 ${state.lastRound.afterCredits} 点。最佳匹配：红球命中 ${state.lastRound.bestRedHits}/6，蓝球 ${formatBlueHitText(state.lastRound.bestBlueHit)}。`
          : `本轮实验消耗 ${state.lastRound.experimentCostCredits} 点，回补 ${state.lastRound.totalRewardCredits} 点，当前剩余 ${state.lastRound.afterCredits} 点。最佳匹配：红球命中 ${state.lastRound.bestRedHits}/6，蓝球 ${formatBlueHitText(state.lastRound.bestBlueHit)}。`;
    } else {
      elements.summaryText.textContent = "尚未开始实验。";
    }

    renderBoards();
    elements.chart.innerHTML = getCurrentCreditsChartMarkup(rounds);
    elements.distribution.innerHTML = getDistributionMarkup(rounds);
    elements.roundsList.innerHTML = getRoundsListMarkup(rounds);
  }

  function syncSelectedFromInputs() {
    const redResult = parseLooseCandidateInput(elements.redInput.value, {
      min: RED_MIN,
      max: RED_MAX
    });
    const blueResult = parseLooseCandidateInput(elements.blueInput.value, {
      min: BLUE_MIN,
      max: BLUE_MAX
    });

    if (redResult.valid) {
      state.selectedReds = redResult.value;
    }
    if (blueResult.valid) {
      state.selectedBlues = blueResult.value;
    }

    renderState();
  }

  function syncInputsFromSelection() {
    elements.redInput.value = state.selectedReds.join(",");
    elements.blueInput.value = state.selectedBlues.join(",");
    renderState();
  }

  function handleBoardClick(event) {
    const button = event.target.closest("[data-ball-value]");
    if (!button) {
      return;
    }

    const color = button.dataset.ballColor;
    const value = Number(button.dataset.ballValue);
    const key = color === "red" ? "selectedReds" : "selectedBlues";
    const selection = state[key];

    if (selection.includes(value)) {
      state[key] = selection.filter((item) => item !== value);
    } else {
      state[key] = selection.concat(value).sort((left, right) => left - right);
    }

    setChallengeError("");
    syncInputsFromSelection();
  }

  function runRound() {
    setChallengeError("");

    try {
      const validation = validateCandidateSets(elements.redInput.value, elements.blueInput.value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const historyKeySet = getHistoryKeySet();
      if (!historyKeySet?.size) {
        throw new Error("请先加载历史开奖数据后再使用点数挑战。");
      }

      const config = createSandboxConfig(state);
      const target = createNonHistoricalTarget(historyKeySet);
      const roundResult = simulateSandboxRound({
        redCandidates: validation.value.redCandidates,
        blueCandidates: validation.value.blueCandidates,
        target,
        currentCredits: sandboxState.currentCredits,
        roundIndex: (sandboxState.rounds?.length || 0) + 1,
        poolIndexState: sandboxState.poolIndexState,
        config,
        samplingStrategy: state.samplingStrategy
      });

      const roundSummary = {
        roundIndex: roundResult.roundIndex,
        createdAt: new Date().toISOString(),
        lineCount: roundResult.lineCount,
        totalLineCount: roundResult.totalLineCount,
        isSampled: roundResult.isSampled,
        samplingStrategy: roundResult.samplingStrategy,
        rewardMode: state.rewardMode,
        experimentCostCredits: roundResult.experimentCostCredits,
        totalRewardCredits: roundResult.totalRewardCredits,
        afterCredits: roundResult.afterCredits,
        bestRedHits: roundResult.bestRedHits,
        bestBlueHit: roundResult.bestBlueHit,
        bestMatchCode: roundResult.bestMatchCode,
        poolIndexState: {
          currentPoolIndex:
            state.rewardMode === SANDBOX_REWARD_MODES.ENABLED
              ? roundResult.poolIndexState.currentPoolIndex
              : null
        }
      };

      sandboxState = {
        version: sandboxState.version,
        currentCredits: roundResult.afterCredits,
        poolIndexState: {
          currentPoolIndex: roundResult.poolIndexState.currentPoolIndex
        },
        rounds: [roundSummary, ...(sandboxState.rounds || [])]
      };
      saveSession();
      state.lastRound = roundSummary;
      renderState();
    } catch (error) {
      setChallengeError(error instanceof Error ? error.message : "实验执行失败");
      renderState();
    }
  }

  function resetCredits() {
    setChallengeError("");
    const config = createSandboxConfig(state);

    sandboxState = createDefaultSandboxState(config);
    saveSession();
    state.lastRound = null;
    renderState();
  }

  function clearHistory() {
    setChallengeError("");
    sandboxState = {
      ...sandboxState,
      rounds: []
    };
    saveSession();
    state.lastRound = null;
    renderState();
  }

  elements.redInput.addEventListener("input", () => {
    setChallengeError("");
    syncSelectedFromInputs();
  });
  elements.blueInput.addEventListener("input", () => {
    setChallengeError("");
    syncSelectedFromInputs();
  });
  elements.redBoard.addEventListener("click", handleBoardClick);
  elements.blueBoard.addEventListener("click", handleBoardClick);
  elements.initialCredits.addEventListener("input", () => {
    state.initialCreditsDraft = parsePositiveInteger(
      elements.initialCredits.value,
      DEFAULT_SANDBOX_CONFIG.initialCredits
    );
    renderState();
  });
  elements.samplingStrategy.addEventListener("change", () => {
    state.samplingStrategy = elements.samplingStrategy.value;
    renderState();
  });
  elements.rewardMode.addEventListener("change", () => {
    state.rewardMode = elements.rewardMode.value;
    renderState();
  });
  elements.runButton.addEventListener("click", runRound);
  elements.mobileRunButton.addEventListener("click", runRound);
  elements.resetButton.addEventListener("click", resetCredits);
  elements.clearButton.addEventListener("click", clearHistory);

  renderState();

  return {
    refresh() {
      renderState();
    }
  };
}
