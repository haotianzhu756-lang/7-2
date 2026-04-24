import {
  BLUE_CANDIDATE_MIN,
  BLUE_MAX,
  BLUE_MIN,
  DRAW_BLUE_COUNT,
  DRAW_RED_COUNT,
  RED_CANDIDATE_MIN,
  RED_MAX,
  RED_MIN
} from "./constants.js";

export const SANDBOX_STORAGE_KEY = "ssq_probability_sandbox_history_v1";
export const SANDBOX_STORAGE_VERSION = 1;
export const SANDBOX_HISTORY_LIMIT = 50;

export const SANDBOX_DISCLAIMER =
  "本功能为非官方、非交易、不可兑换的概率教育沙盒。页面中的点数、池指数和回补结果只用于理解随机匹配与长期波动，不代表真实购买、真实奖池或真实奖金。";

export const SANDBOX_SAMPLING_STRATEGIES = Object.freeze({
  NONE: "none",
  WITHOUT_REPLACEMENT: "without_replacement",
  WITH_REPLACEMENT: "with_replacement"
});

export const SANDBOX_REWARD_MODES = Object.freeze({
  ENABLED: "enabled",
  DISABLED: "disabled"
});

export const DEFAULT_SANDBOX_CONFIG = Object.freeze({
  initialCredits: 10000,
  experimentCostCreditsPerLine: 2,
  maxLinesPerRound: 120,
  maxRoundsPerSession: 50,
  rewardMode: SANDBOX_REWARD_MODES.ENABLED,
  enablePoolIndex: true,
  enableSpecialThreeRedMatch: false,
  poolIndex: {
    initialPoolIndex: 2800000000,
    minPoolIndex: 0,
    maxPoolIndex: 9999999999,
    inflowRate: 0.5,
    rareMatchShare: 0.75,
    secondRareMatchShare: 0.25,
    carryForwardShare: 0,
    topSingleRewardCapCredits: 10000000,
    secondSingleRewardCapCredits: 500000
  },
  rewardProfileCredits: {
    MATCH_6_1: null,
    MATCH_6_0: null,
    MATCH_5_1: 3000,
    MATCH_5_0_OR_4_1: 200,
    MATCH_4_0_OR_3_1: 10,
    MATCH_BLUE_ONLY: 5,
    MATCH_3_0_SPECIAL: 0,
    NO_MATCH: 0
  }
});

export const MATCH_CODES = Object.freeze({
  MATCH_6_1: "MATCH_6_1",
  MATCH_6_0: "MATCH_6_0",
  MATCH_5_1: "MATCH_5_1",
  MATCH_5_0_OR_4_1: "MATCH_5_0_OR_4_1",
  MATCH_4_0_OR_3_1: "MATCH_4_0_OR_3_1",
  MATCH_BLUE_ONLY: "MATCH_BLUE_ONLY",
  MATCH_3_0_SPECIAL: "MATCH_3_0_SPECIAL",
  NO_MATCH: "NO_MATCH"
});

export const MATCH_CODE_LABELS = Object.freeze({
  [MATCH_CODES.MATCH_6_1]: "稀有匹配 A",
  [MATCH_CODES.MATCH_6_0]: "稀有匹配 B",
  [MATCH_CODES.MATCH_5_1]: "高位匹配",
  [MATCH_CODES.MATCH_5_0_OR_4_1]: "进阶匹配",
  [MATCH_CODES.MATCH_4_0_OR_3_1]: "基础匹配",
  [MATCH_CODES.MATCH_BLUE_ONLY]: "蓝球匹配",
  [MATCH_CODES.MATCH_3_0_SPECIAL]: "特别三红匹配",
  [MATCH_CODES.NO_MATCH]: "未命中"
});

const MATCH_CODE_PRIORITY = Object.freeze({
  [MATCH_CODES.MATCH_6_1]: 7,
  [MATCH_CODES.MATCH_6_0]: 6,
  [MATCH_CODES.MATCH_5_1]: 5,
  [MATCH_CODES.MATCH_5_0_OR_4_1]: 4,
  [MATCH_CODES.MATCH_4_0_OR_3_1]: 3,
  [MATCH_CODES.MATCH_BLUE_ONLY]: 2,
  [MATCH_CODES.MATCH_3_0_SPECIAL]: 1,
  [MATCH_CODES.NO_MATCH]: 0
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isRewardEnabled(config = DEFAULT_SANDBOX_CONFIG) {
  return config.rewardMode !== SANDBOX_REWARD_MODES.DISABLED;
}

function resolveSamplingStrategy(options = {}) {
  if (options.samplingStrategy) {
    return options.samplingStrategy;
  }

  return options.sampleMode
    ? SANDBOX_SAMPLING_STRATEGIES.WITHOUT_REPLACEMENT
    : SANDBOX_SAMPLING_STRATEGIES.NONE;
}

function normalizeUniqueNumberList(values, options) {
  const { min, max, minimumCount, expectedCount, label } = options;
  const normalizedValues = Array.from(new Set(values)).sort((left, right) => left - right);

  if (normalizedValues.some((value) => !Number.isInteger(value))) {
    throw new Error(`${label}必须是整数`);
  }

  const invalidValue = normalizedValues.find((value) => value < min || value > max);
  if (invalidValue !== undefined) {
    throw new Error(`${label}超出范围：${invalidValue}`);
  }

  if (expectedCount !== undefined && normalizedValues.length !== expectedCount) {
    throw new Error(`${label}数量必须为 ${expectedCount} 个`);
  }

  if (minimumCount !== undefined && normalizedValues.length < minimumCount) {
    throw new Error(`${label}至少需要 ${minimumCount} 个`);
  }

  return normalizedValues;
}

export function normalizeCandidatePool(redCandidates, blueCandidates) {
  return {
    redCandidates: normalizeUniqueNumberList(redCandidates, {
      min: RED_MIN,
      max: RED_MAX,
      minimumCount: RED_CANDIDATE_MIN,
      label: "红球候选号"
    }),
    blueCandidates: normalizeUniqueNumberList(blueCandidates, {
      min: BLUE_MIN,
      max: BLUE_MAX,
      minimumCount: BLUE_CANDIDATE_MIN,
      label: "蓝球候选号"
    })
  };
}

function normalizeTarget(target) {
  if (!target || !Array.isArray(target.reds)) {
    throw new Error("实验目标无效");
  }

  return {
    reds: normalizeUniqueNumberList(target.reds, {
      min: RED_MIN,
      max: RED_MAX,
      expectedCount: DRAW_RED_COUNT,
      label: "目标红球"
    }),
    blue: normalizeUniqueNumberList([target.blue], {
      min: BLUE_MIN,
      max: BLUE_MAX,
      expectedCount: DRAW_BLUE_COUNT,
      label: "目标蓝球"
    })[0]
  };
}

export function combination(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < k) {
    return 0;
  }

  const size = Math.min(k, n - k);
  let value = 1;

  for (let index = 1; index <= size; index += 1) {
    value = (value * (n - size + index)) / index;
  }

  return Math.round(value);
}

export function countExperimentLines(redCandidateCount, blueCandidateCount) {
  return combination(redCandidateCount, DRAW_RED_COUNT) * blueCandidateCount;
}

function generateRedCombinations(values, count, start = 0, prefix = [], output = []) {
  if (prefix.length === count) {
    output.push(prefix.slice());
    return output;
  }

  for (let index = start; index <= values.length - (count - prefix.length); index += 1) {
    prefix.push(values[index]);
    generateRedCombinations(values, count, index + 1, prefix, output);
    prefix.pop();
  }

  return output;
}

function getRedCombinationByIndex(values, count, combinationIndex) {
  const result = [];
  let start = 0;
  let remainingCount = count;
  let remainingIndex = combinationIndex;

  while (remainingCount > 0) {
    for (
      let valueIndex = start;
      valueIndex <= values.length - remainingCount;
      valueIndex += 1
    ) {
      const combinationsForValue = combination(
        values.length - valueIndex - 1,
        remainingCount - 1
      );

      if (remainingIndex < combinationsForValue) {
        result.push(values[valueIndex]);
        start = valueIndex + 1;
        remainingCount -= 1;
        break;
      }

      remainingIndex -= combinationsForValue;
    }
  }

  return result;
}

function getLineByIndex(candidatePool, lineIndex) {
  const blueCount = candidatePool.blueCandidates.length;
  const redCombinationIndex = Math.floor(lineIndex / blueCount);
  const blueIndex = lineIndex % blueCount;

  return {
    reds: getRedCombinationByIndex(
      candidatePool.redCandidates,
      DRAW_RED_COUNT,
      redCombinationIndex
    ),
    blue: candidatePool.blueCandidates[blueIndex]
  };
}

export function generateExperimentLines(redCandidates, blueCandidates, options = {}) {
  const {
    maxLinesPerRound = DEFAULT_SANDBOX_CONFIG.maxLinesPerRound,
    randomFn = Math.random
  } = options;
  const samplingStrategy = resolveSamplingStrategy(options);
  const candidatePool = normalizeCandidatePool(redCandidates, blueCandidates);
  const totalLineCount = countExperimentLines(
    candidatePool.redCandidates.length,
    candidatePool.blueCandidates.length
  );

  if (totalLineCount <= maxLinesPerRound) {
    const redCombinations = generateRedCombinations(candidatePool.redCandidates, DRAW_RED_COUNT);
    const lines = redCombinations.flatMap((reds) =>
      candidatePool.blueCandidates.map((blue) => ({ reds, blue }))
    );

    return {
      lines,
      totalLineCount,
      sampledCount: lines.length,
      isSampled: false
    };
  }

  if (samplingStrategy === SANDBOX_SAMPLING_STRATEGIES.NONE) {
    throw new Error("本轮组合过多，请缩小候选号池或使用抽样实验。");
  }

  const lines = [];
  const sampleLimit = Math.min(maxLinesPerRound, totalLineCount);
  const sampledLineIndexes =
    samplingStrategy === SANDBOX_SAMPLING_STRATEGIES.WITHOUT_REPLACEMENT
      ? new Set()
      : null;

  while (lines.length < sampleLimit) {
    let lineIndex = Math.floor(randomFn() * totalLineCount);

    if (sampledLineIndexes) {
      while (sampledLineIndexes.has(lineIndex)) {
        lineIndex = (lineIndex + 1) % totalLineCount;
      }

      sampledLineIndexes.add(lineIndex);
    }

    lines.push(getLineByIndex(candidatePool, lineIndex));
  }

  return {
    lines,
    totalLineCount,
    sampledCount: lines.length,
    isSampled: true,
    samplingStrategy
  };
}

export function classifyMatchCode(redHits, blueHit, config = DEFAULT_SANDBOX_CONFIG) {
  if (redHits === 6 && blueHit === 1) {
    return MATCH_CODES.MATCH_6_1;
  }
  if (redHits === 6 && blueHit === 0) {
    return MATCH_CODES.MATCH_6_0;
  }
  if (redHits === 5 && blueHit === 1) {
    return MATCH_CODES.MATCH_5_1;
  }
  if (redHits === 5 || (redHits === 4 && blueHit === 1)) {
    return MATCH_CODES.MATCH_5_0_OR_4_1;
  }
  if (redHits === 4 || (redHits === 3 && blueHit === 1)) {
    return MATCH_CODES.MATCH_4_0_OR_3_1;
  }
  if (config.enableSpecialThreeRedMatch && redHits === 3 && blueHit === 0) {
    return MATCH_CODES.MATCH_3_0_SPECIAL;
  }
  if (blueHit === 1) {
    return MATCH_CODES.MATCH_BLUE_ONLY;
  }

  return MATCH_CODES.NO_MATCH;
}

export function calculateVirtualRewardCredits(matchCode, context) {
  const { config = DEFAULT_SANDBOX_CONFIG, poolIndexState } = context || {};

  if (!isRewardEnabled(config)) {
    return {
      rewardCredits: 0,
      isDynamic: false,
      explanation: "当前回补已关闭。"
    };
  }

  const fixedReward = config.rewardProfileCredits[matchCode];

  if (fixedReward !== null && fixedReward !== undefined) {
    return {
      rewardCredits: Math.max(0, Number(fixedReward) || 0),
      isDynamic: false,
      explanation: "固定教学点数回补，不可兑换。"
    };
  }

  if (matchCode === MATCH_CODES.MATCH_6_1) {
    return {
      rewardCredits: Math.max(0, poolIndexState?.topRewardCredits || 0),
      isDynamic: true,
      explanation: "基于池指数的教学模型动态回补，不代表真实奖池或真实奖金。"
    };
  }

  if (matchCode === MATCH_CODES.MATCH_6_0) {
    return {
      rewardCredits: Math.max(0, poolIndexState?.secondRewardCredits || 0),
      isDynamic: true,
      explanation: "基于池指数的教学模型动态回补，不代表真实奖池或真实奖金。"
    };
  }

  return {
    rewardCredits: 0,
    isDynamic: false,
    explanation: "未命中可回补区间。"
  };
}

export function simulatePoolIndexStep({
  previousPoolIndex,
  totalExperimentCostCredits,
  fixedRewardCreditsPaid,
  rareMatchCounts,
  config = DEFAULT_SANDBOX_CONFIG
}) {
  const poolConfig = config.poolIndex;
  const inflowCredits = Math.floor(totalExperimentCostCredits * poolConfig.inflowRate);
  const availableRarePool = Math.max(
    0,
    previousPoolIndex + inflowCredits - fixedRewardCreditsPaid
  );
  const topMatchCount = rareMatchCounts[MATCH_CODES.MATCH_6_1] || 0;
  const secondMatchCount = rareMatchCounts[MATCH_CODES.MATCH_6_0] || 0;

  const topRewardCredits = topMatchCount
    ? Math.min(
        poolConfig.topSingleRewardCapCredits,
        Math.floor((availableRarePool * poolConfig.rareMatchShare) / topMatchCount)
      )
    : 0;

  const secondRewardCredits = secondMatchCount
    ? Math.min(
        poolConfig.secondSingleRewardCapCredits,
        Math.floor((availableRarePool * poolConfig.secondRareMatchShare) / secondMatchCount)
      )
    : 0;

  const paidRareCredits =
    topRewardCredits * topMatchCount + secondRewardCredits * secondMatchCount;

  const nextPoolIndex = clamp(
    Math.floor(
      availableRarePool -
        paidRareCredits +
        availableRarePool * poolConfig.carryForwardShare
    ),
    poolConfig.minPoolIndex,
    poolConfig.maxPoolIndex
  );

  return {
    previousPoolIndex,
    inflowCredits,
    availableRarePool,
    fixedRewardCreditsPaid,
    topRewardCredits,
    secondRewardCredits,
    paidRareCredits,
    nextPoolIndex,
    rareMatchCounts: {
      [MATCH_CODES.MATCH_6_1]: topMatchCount,
      [MATCH_CODES.MATCH_6_0]: secondMatchCount
    }
  };
}

function compareBestLine(currentBest, nextLine) {
  if (!currentBest) {
    return nextLine;
  }

  const currentPriority = MATCH_CODE_PRIORITY[currentBest.matchCode] || 0;
  const nextPriority = MATCH_CODE_PRIORITY[nextLine.matchCode] || 0;

  if (nextPriority !== currentPriority) {
    return nextPriority > currentPriority ? nextLine : currentBest;
  }
  if (nextLine.rewardCredits !== currentBest.rewardCredits) {
    return nextLine.rewardCredits > currentBest.rewardCredits ? nextLine : currentBest;
  }
  if (nextLine.redHits !== currentBest.redHits) {
    return nextLine.redHits > currentBest.redHits ? nextLine : currentBest;
  }
  if (nextLine.blueHit !== currentBest.blueHit) {
    return nextLine.blueHit > currentBest.blueHit ? nextLine : currentBest;
  }

  return currentBest;
}

export function summarizeMatchDistribution(rounds) {
  const distribution = Object.fromEntries(
    Object.values(MATCH_CODES).map((matchCode) => [matchCode, 0])
  );

  for (const round of rounds || []) {
    const matchCode = round?.bestMatchCode || MATCH_CODES.NO_MATCH;
    distribution[matchCode] = (distribution[matchCode] || 0) + 1;
  }

  return distribution;
}

export function createDefaultSandboxState(config = DEFAULT_SANDBOX_CONFIG) {
  return {
    version: SANDBOX_STORAGE_VERSION,
    currentCredits: config.initialCredits,
    poolIndexState: {
      currentPoolIndex: config.poolIndex.initialPoolIndex
    },
    rounds: []
  };
}

export function loadSandboxState(
  storage,
  config = DEFAULT_SANDBOX_CONFIG,
  storageKey = SANDBOX_STORAGE_KEY
) {
  const fallbackState = createDefaultSandboxState(config);

  if (!storage || typeof storage.getItem !== "function") {
    return fallbackState;
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return fallbackState;
    }

    const parsed = JSON.parse(raw);
    return {
      version: SANDBOX_STORAGE_VERSION,
      currentCredits: Number.isFinite(parsed?.currentCredits)
        ? parsed.currentCredits
        : fallbackState.currentCredits,
      poolIndexState: {
        currentPoolIndex: Number.isFinite(parsed?.poolIndexState?.currentPoolIndex)
          ? parsed.poolIndexState.currentPoolIndex
          : fallbackState.poolIndexState.currentPoolIndex
      },
      rounds: Array.isArray(parsed?.rounds)
        ? parsed.rounds.slice(0, SANDBOX_HISTORY_LIMIT)
        : []
    };
  } catch {
    return fallbackState;
  }
}

export function saveSandboxState(
  storage,
  state,
  storageKey = SANDBOX_STORAGE_KEY
) {
  const normalizedState = {
    version: SANDBOX_STORAGE_VERSION,
    currentCredits: Math.max(0, Math.floor(state.currentCredits || 0)),
    poolIndexState: {
      currentPoolIndex: Math.max(
        0,
        Math.floor(state.poolIndexState?.currentPoolIndex || 0)
      )
    },
    rounds: Array.isArray(state.rounds)
      ? state.rounds.slice(0, SANDBOX_HISTORY_LIMIT)
      : []
  };

  if (storage && typeof storage.setItem === "function") {
    storage.setItem(storageKey, JSON.stringify(normalizedState));
  }

  return normalizedState;
}

export function simulateSandboxRound({
  redCandidates,
  blueCandidates,
  target,
  currentCredits,
  roundIndex,
  poolIndexState,
  config = DEFAULT_SANDBOX_CONFIG,
  sampleMode = false,
  samplingStrategy,
  randomFn = Math.random
}) {
  const normalizedTarget = normalizeTarget(target);
  const resolvedSamplingStrategy = resolveSamplingStrategy({
    sampleMode,
    samplingStrategy
  });
  const linePack = generateExperimentLines(redCandidates, blueCandidates, {
    maxLinesPerRound: config.maxLinesPerRound,
    samplingStrategy: resolvedSamplingStrategy,
    randomFn
  });
  const experimentCostCredits =
    linePack.lines.length * config.experimentCostCreditsPerLine;

  if (currentCredits < experimentCostCredits) {
    throw new Error("点数不足，无法运行本轮实验。可重置点数重新开始。");
  }

  const targetRedSet = new Set(normalizedTarget.reds);
  const rareMatchCounts = {
    [MATCH_CODES.MATCH_6_1]: 0,
    [MATCH_CODES.MATCH_6_0]: 0
  };
  const provisionalLineResults = [];
  let fixedRewardCreditsPaid = 0;

  for (const line of linePack.lines) {
    const redHits = line.reds.filter((value) => targetRedSet.has(value)).length;
    const blueHit = line.blue === normalizedTarget.blue ? 1 : 0;
    const matchCode = classifyMatchCode(redHits, blueHit, config);

    if (
      isRewardEnabled(config) &&
      (matchCode === MATCH_CODES.MATCH_6_1 || matchCode === MATCH_CODES.MATCH_6_0)
    ) {
      rareMatchCounts[matchCode] += 1;
    } else if (isRewardEnabled(config)) {
      fixedRewardCreditsPaid += config.rewardProfileCredits[matchCode] || 0;
    }

    provisionalLineResults.push({
      line,
      redHits,
      blueHit,
      matchCode
    });
  }

  const previousPoolIndex = config.enablePoolIndex && isRewardEnabled(config)
    ? poolIndexState?.currentPoolIndex ?? config.poolIndex.initialPoolIndex
    : config.poolIndex.initialPoolIndex;

  const nextPoolIndexState = config.enablePoolIndex && isRewardEnabled(config)
    ? simulatePoolIndexStep({
        previousPoolIndex,
        totalExperimentCostCredits: experimentCostCredits,
        fixedRewardCreditsPaid,
        rareMatchCounts,
        config
      })
    : {
        previousPoolIndex,
        inflowCredits: 0,
        availableRarePool: previousPoolIndex,
        fixedRewardCreditsPaid,
        topRewardCredits: 0,
        secondRewardCredits: 0,
        paidRareCredits: 0,
        nextPoolIndex: previousPoolIndex,
        rareMatchCounts
      };

  let totalRewardCredits = 0;
  let bestLineResult = null;

  const lineResults = provisionalLineResults.map((lineResult) => {
    const rewardMeta = calculateVirtualRewardCredits(lineResult.matchCode, {
      config,
      poolIndexState: nextPoolIndexState
    });
    const normalizedLineResult = {
      ...lineResult,
      rewardCredits: rewardMeta.rewardCredits,
      isDynamicReward: rewardMeta.isDynamic,
      rewardExplanation: rewardMeta.explanation
    };

    totalRewardCredits += normalizedLineResult.rewardCredits;
    bestLineResult = compareBestLine(bestLineResult, normalizedLineResult);

    return normalizedLineResult;
  });

  const afterCredits = currentCredits - experimentCostCredits + totalRewardCredits;

  return {
    roundIndex,
    beforeCredits: currentCredits,
    experimentCostCredits,
    afterCredits,
    totalLineCount: linePack.totalLineCount,
    lineCount: linePack.lines.length,
    sampledLines: linePack.lines,
    lineResults,
    totalRewardCredits,
    bestRedHits: bestLineResult?.redHits || 0,
    bestBlueHit: bestLineResult?.blueHit || 0,
    bestMatchCode: bestLineResult?.matchCode || MATCH_CODES.NO_MATCH,
    isSampled: linePack.isSampled,
    samplingStrategy: linePack.isSampled
      ? linePack.samplingStrategy || resolvedSamplingStrategy
      : SANDBOX_SAMPLING_STRATEGIES.NONE,
    poolIndexState: {
      ...nextPoolIndexState,
      currentPoolIndex: nextPoolIndexState.nextPoolIndex
    }
  };
}
