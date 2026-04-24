import {
  BLUE_MAX,
  BLUE_MIN,
  DEFAULT_ACTIVE_MODE_TAB,
  DRAW_BLUE_COUNT,
  DRAW_RED_COUNT,
  MODE_TABS,
  MULTIPLIER_RULE,
  REALISTIC_POINTS_STORAGE_KEY,
  RED_MAX,
  RED_MIN,
  ROUND_HISTORY_LIMIT,
  SSQ_RULE_NUMBERS
} from "./constants.js";

export const REPLACEMENT_MODES = Object.freeze({
  NONE: "none",
  WITHOUT_REPLACEMENT: "withoutReplacement",
  WITH_REPLACEMENT: "withReplacement"
});

export const SELECTION_MODES = Object.freeze({
  COMPOUND: "compound",
  DANTUO: "dantuo"
});

export const REALISTIC_POINTS_STORAGE_VERSION = 1;

export const DEFAULT_SAMPLING_CONFIG = Object.freeze({
  capSamplingEnabled: true,
  capLimit: 5000,
  hardGenerationLimit: 50000,
  replacementMode: REPLACEMENT_MODES.WITHOUT_REPLACEMENT,
  allowUserToggle: true,
  showSamplingBadge: true
});

export const DEFAULT_POINT_REFILL_CONFIG = Object.freeze({
  enabled: false,
  trigger: "insufficientPoints",
  mode: "resetToInitial",
  fixedRefillPoints: 1000,
  maxRefillsPerSession: 3,
  showRefillCount: true
});

export const DEFAULT_FLOATING_SCENARIO = Object.freeze({
  currentSalesPoints: 350_000_000,
  carryPoolBeforePoints: 850_000_000,
  regulationFundBeforePoints: 100_000_000,
  currentPrizePoolRatio: 0.49,
  regulationFundRatio: 0.02,
  specialRuleMode: "auto",
  publicWinningCountsMode: "manual",
  publicTier1WinningLines: 2,
  publicTier2WinningLines: 60,
  publicFixedPayoutTotalPoints: 110_000_000,
  includeUserHighTierInPublicCounts: true,
  includeUserFixedPayoutInFixedTotal: true,
  tier1SinglePartCapPoints: 5_000_000,
  tier2SingleCapPoints: 5_000_000,
  tier1TotalCapPoints: 100_000_000,
  tier2TotalCapPoints: 70_000_000,
  tier2GuaranteedMinPoints: 6000,
  tier1GuaranteedMaxPoints: 5_000_000,
  normalPoolSplitThresholdPoints: 100_000_000,
  specialTier1Part2Ratio: 0.2,
  specialTier2Ratio: 0.8,
  lowPoolTier1Ratio: 0.75,
  lowPoolTier2Ratio: 0.25,
  highPoolTier1Part1Ratio: 0.55,
  highPoolTier1Part2Ratio: 0.2,
  highPoolTier2Ratio: 0.25,
  specialStartThresholdPoints: 1_500_000_000,
  specialStopThresholdPoints: 300_000_000,
  rounding: "floor"
});

export const REALISTIC_TIER_CODES = Object.freeze({
  TIER_1: "TIER_1",
  TIER_2: "TIER_2",
  TIER_3: "TIER_3",
  TIER_4: "TIER_4",
  TIER_5: "TIER_5",
  TIER_6: "TIER_6",
  FU_YUN: "FU_YUN",
  NO_TIER: "NO_TIER"
});

export const FIXED_TIER_POINTS = Object.freeze({
  [REALISTIC_TIER_CODES.TIER_3]: 3000,
  [REALISTIC_TIER_CODES.TIER_4]: 200,
  [REALISTIC_TIER_CODES.TIER_5]: 10,
  [REALISTIC_TIER_CODES.TIER_6]: 5,
  [REALISTIC_TIER_CODES.FU_YUN]: 5,
  [REALISTIC_TIER_CODES.NO_TIER]: 0
});

export const EXACT_TIER_PROBABILITY_NUMERATORS = Object.freeze({
  [REALISTIC_TIER_CODES.TIER_1]: 1,
  [REALISTIC_TIER_CODES.TIER_2]: 15,
  [REALISTIC_TIER_CODES.TIER_3]: 162,
  [REALISTIC_TIER_CODES.TIER_4]: 7695,
  [REALISTIC_TIER_CODES.TIER_5]: 137475,
  [REALISTIC_TIER_CODES.TIER_6]: 1043640,
  [REALISTIC_TIER_CODES.FU_YUN]: 877500
});

export const TIER_CODE_LABELS = Object.freeze({
  [REALISTIC_TIER_CODES.TIER_1]: "一等奖",
  [REALISTIC_TIER_CODES.TIER_2]: "二等奖",
  [REALISTIC_TIER_CODES.TIER_3]: "三等奖",
  [REALISTIC_TIER_CODES.TIER_4]: "四等奖",
  [REALISTIC_TIER_CODES.TIER_5]: "五等奖",
  [REALISTIC_TIER_CODES.TIER_6]: "六等奖",
  [REALISTIC_TIER_CODES.FU_YUN]: "特别规则",
  [REALISTIC_TIER_CODES.NO_TIER]: "未中奖"
});

export const POINTS_CHALLENGE_DISCLAIMER =
  "本功能是虚拟点数挑战。页面中的点数按规则数值映射计算，不代表真实资金、真实票据、真实奖池或可兑换结果。";

export const POINTS_CHALLENGE_BANNED_TERMS = Object.freeze([
  "下注",
  "购彩",
  "充值",
  "提现",
  "兑奖",
  "购买",
  "稳赚",
  "回本",
  "盈利",
  "推荐号码",
  "购买入口"
]);

export const DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG = Object.freeze({
  initialPoints: 1000,
  unitCostPoints: SSQ_RULE_NUMBERS.unitCostPoints,
  maxRoundsStored: ROUND_HISTORY_LIMIT,
  defaultModeTab: DEFAULT_ACTIVE_MODE_TAB,
  selectionMode: SELECTION_MODES.COMPOUND,
  multiplier: MULTIPLIER_RULE.defaultMultiplier,
  sampling: DEFAULT_SAMPLING_CONFIG,
  refill: DEFAULT_POINT_REFILL_CONFIG,
  floatingScenario: DEFAULT_FLOATING_SCENARIO,
  fixedTierPoints: FIXED_TIER_POINTS,
  labels: Object.freeze({
    pointUnit: "点",
    standardLineLabel: "单注",
    challengeTitle: "点数挑战",
    matchLabTitle: "号码实验室"
  })
});

const TIER_PRIORITY = Object.freeze({
  [REALISTIC_TIER_CODES.TIER_1]: 7,
  [REALISTIC_TIER_CODES.TIER_2]: 6,
  [REALISTIC_TIER_CODES.TIER_3]: 5,
  [REALISTIC_TIER_CODES.TIER_4]: 4,
  [REALISTIC_TIER_CODES.TIER_5]: 3,
  [REALISTIC_TIER_CODES.TIER_6]: 2,
  [REALISTIC_TIER_CODES.FU_YUN]: 1,
  [REALISTIC_TIER_CODES.NO_TIER]: 0
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toInteger(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;
}

function toNonNegativeInteger(value, fallback = 0) {
  return Math.max(0, toInteger(value, fallback));
}

function toPositiveInteger(value, fallback = 1) {
  const normalized = toInteger(value, fallback);
  return normalized > 0 ? normalized : fallback;
}

function normalizeMultiplier(value) {
  const normalized = toPositiveInteger(
    value,
    DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.multiplier
  );

  if (normalized === MULTIPLIER_RULE.defaultMultiplier) {
    return normalized;
  }

  return clamp(
    normalized,
    MULTIPLIER_RULE.minAdvancedMultiplier,
    MULTIPLIER_RULE.maxAdvancedMultiplier
  );
}

function normalizeRatio(value, fallback = 0) {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return fallback;
  }

  return clamp(normalized, 0, 1);
}

function resolveFixedTierPoints(config = FIXED_TIER_POINTS) {
  return {
    [REALISTIC_TIER_CODES.TIER_3]: toNonNegativeInteger(
      config[REALISTIC_TIER_CODES.TIER_3],
      FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_3]
    ),
    [REALISTIC_TIER_CODES.TIER_4]: toNonNegativeInteger(
      config[REALISTIC_TIER_CODES.TIER_4],
      FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_4]
    ),
    [REALISTIC_TIER_CODES.TIER_5]: toNonNegativeInteger(
      config[REALISTIC_TIER_CODES.TIER_5],
      FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_5]
    ),
    [REALISTIC_TIER_CODES.TIER_6]: toNonNegativeInteger(
      config[REALISTIC_TIER_CODES.TIER_6],
      FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_6]
    ),
    [REALISTIC_TIER_CODES.FU_YUN]: toNonNegativeInteger(
      config[REALISTIC_TIER_CODES.FU_YUN],
      FIXED_TIER_POINTS[REALISTIC_TIER_CODES.FU_YUN]
    ),
    [REALISTIC_TIER_CODES.NO_TIER]: 0
  };
}

function normalizeUniqueNumberList(values, options) {
  const {
    min,
    max,
    minimumCount,
    maximumCount,
    exactCount,
    label
  } = options;
  const source = Array.isArray(values) ? values : [];
  const normalizedValues = Array.from(new Set(source.map(Number))).sort(
    (left, right) => left - right
  );

  if (normalizedValues.some((value) => !Number.isInteger(value))) {
    throw new Error(`${label}必须是整数`);
  }

  const invalidValue = normalizedValues.find((value) => value < min || value > max);
  if (invalidValue !== undefined) {
    throw new Error(`${label}超出范围：${invalidValue}`);
  }

  if (exactCount !== undefined && normalizedValues.length !== exactCount) {
    throw new Error(`${label}数量必须为 ${exactCount}`);
  }

  if (minimumCount !== undefined && normalizedValues.length < minimumCount) {
    throw new Error(`${label}至少需要 ${minimumCount} 个`);
  }

  if (maximumCount !== undefined && normalizedValues.length > maximumCount) {
    throw new Error(`${label}至多允许 ${maximumCount} 个`);
  }

  return normalizedValues;
}

function normalizeTarget(target) {
  if (!target || typeof target !== "object") {
    throw new Error("目标号码无效");
  }

  return {
    reds: normalizeUniqueNumberList(target.reds, {
      min: RED_MIN,
      max: RED_MAX,
      exactCount: DRAW_RED_COUNT,
      label: "目标红球"
    }),
    blue: normalizeUniqueNumberList([target.blue], {
      min: BLUE_MIN,
      max: BLUE_MAX,
      exactCount: DRAW_BLUE_COUNT,
      label: "目标蓝球"
    })[0]
  };
}

export function combination(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < k) {
    return 0;
  }

  const size = Math.min(k, n - k);
  let result = 1;

  for (let index = 1; index <= size; index += 1) {
    result = (result * (n - size + index)) / index;
  }

  return Math.round(result);
}

function normalizeCompoundSelection(selection) {
  return {
    mode: SELECTION_MODES.COMPOUND,
    redCandidates: normalizeUniqueNumberList(selection.redCandidates, {
      min: RED_MIN,
      max: RED_MAX,
      minimumCount: DRAW_RED_COUNT,
      label: "红球候选号"
    }),
    blueCandidates: normalizeUniqueNumberList(selection.blueCandidates, {
      min: BLUE_MIN,
      max: BLUE_MAX,
      minimumCount: DRAW_BLUE_COUNT,
      label: "蓝球候选号"
    }),
    multiplier: normalizeMultiplier(selection.multiplier)
  };
}

function normalizeDantuoSelection(selection) {
  const redDan = normalizeUniqueNumberList(selection.redDan, {
    min: RED_MIN,
    max: RED_MAX,
    minimumCount: 1,
    maximumCount: 5,
    label: "胆码"
  });
  const redTuo = normalizeUniqueNumberList(selection.redTuo, {
    min: RED_MIN,
    max: RED_MAX,
    minimumCount: 1,
    label: "拖码"
  });
  const duplicate = redDan.find((value) => redTuo.includes(value));

  if (duplicate !== undefined) {
    throw new Error(`胆码和拖码不能重复：${duplicate}`);
  }

  if (redDan.length + redTuo.length < DRAW_RED_COUNT + 1) {
    throw new Error("胆拖模式下，胆码和拖码合计至少需要 7 个红球");
  }

  return {
    mode: SELECTION_MODES.DANTUO,
    redDan,
    redTuo,
    blueCandidates: normalizeUniqueNumberList(selection.blueCandidates, {
      min: BLUE_MIN,
      max: BLUE_MAX,
      minimumCount: DRAW_BLUE_COUNT,
      label: "蓝球候选号"
    }),
    multiplier: normalizeMultiplier(selection.multiplier)
  };
}

export function normalizeSelection(selection) {
  const mode = selection?.mode || SELECTION_MODES.COMPOUND;

  if (mode === SELECTION_MODES.DANTUO) {
    return normalizeDantuoSelection(selection);
  }

  return normalizeCompoundSelection(selection || {});
}

export function validateSelection(selection) {
  try {
    return {
      valid: true,
      value: normalizeSelection(selection)
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "选号无效"
    };
  }
}

export function countSelectionLines(selection) {
  const normalizedSelection = normalizeSelection(selection);

  if (normalizedSelection.mode === SELECTION_MODES.DANTUO) {
    return (
      combination(
        normalizedSelection.redTuo.length,
        DRAW_RED_COUNT - normalizedSelection.redDan.length
      ) * normalizedSelection.blueCandidates.length
    );
  }

  return (
    combination(normalizedSelection.redCandidates.length, DRAW_RED_COUNT) *
    normalizedSelection.blueCandidates.length
  );
}

function createCompoundDescriptor(selection) {
  return {
    redBase: selection.redCandidates,
    redFixed: [],
    redVariablePickCount: DRAW_RED_COUNT,
    blueCandidates: selection.blueCandidates
  };
}

function createDantuoDescriptor(selection) {
  return {
    redBase: selection.redTuo,
    redFixed: selection.redDan,
    redVariablePickCount: DRAW_RED_COUNT - selection.redDan.length,
    blueCandidates: selection.blueCandidates
  };
}

function getSelectionDescriptor(selection) {
  if (selection.mode === SELECTION_MODES.DANTUO) {
    return createDantuoDescriptor(selection);
  }

  return createCompoundDescriptor(selection);
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

function getLineByIndex(selection, lineIndex) {
  const descriptor = getSelectionDescriptor(selection);
  const blueCount = descriptor.blueCandidates.length;
  const redCombinationIndex = Math.floor(lineIndex / blueCount);
  const blueIndex = lineIndex % blueCount;
  const variableReds = getRedCombinationByIndex(
    descriptor.redBase,
    descriptor.redVariablePickCount,
    redCombinationIndex
  );

  return {
    reds: descriptor.redFixed.concat(variableReds).sort((left, right) => left - right),
    blue: descriptor.blueCandidates[blueIndex]
  };
}

export function createStandardLineKey(line) {
  return `${line.reds.map((value) => String(value).padStart(2, "0")).join(",")}|${String(
    line.blue
  ).padStart(2, "0")}`;
}

function sampleUniqueLineIndexes(totalCount, sampleCount, randomFn) {
  const indexes = new Set();

  while (indexes.size < sampleCount) {
    let candidate = Math.floor(randomFn() * totalCount);

    while (indexes.has(candidate)) {
      candidate = (candidate + 1) % totalCount;
    }

    indexes.add(candidate);
  }

  return Array.from(indexes);
}

function resolveSamplingConfig(config = DEFAULT_SAMPLING_CONFIG) {
  const hardGenerationLimit = toPositiveInteger(
    config.hardGenerationLimit,
    DEFAULT_SAMPLING_CONFIG.hardGenerationLimit
  );
  const capLimit = clamp(
    toPositiveInteger(config.capLimit, DEFAULT_SAMPLING_CONFIG.capLimit),
    1,
    hardGenerationLimit
  );

  return {
    capSamplingEnabled: config.capSamplingEnabled !== false,
    capLimit,
    hardGenerationLimit,
    replacementMode:
      config.replacementMode === REPLACEMENT_MODES.WITH_REPLACEMENT
        ? REPLACEMENT_MODES.WITH_REPLACEMENT
        : REPLACEMENT_MODES.WITHOUT_REPLACEMENT,
    allowUserToggle: config.allowUserToggle !== false,
    showSamplingBadge: config.showSamplingBadge !== false
  };
}

function resolveRefillConfig(config = DEFAULT_POINT_REFILL_CONFIG) {
  return {
    enabled: Boolean(config.enabled),
    trigger: "insufficientPoints",
    mode: config.mode === "addFixedAmount" ? "addFixedAmount" : "resetToInitial",
    fixedRefillPoints: toPositiveInteger(
      config.fixedRefillPoints,
      DEFAULT_POINT_REFILL_CONFIG.fixedRefillPoints
    ),
    maxRefillsPerSession: toPositiveInteger(
      config.maxRefillsPerSession,
      DEFAULT_POINT_REFILL_CONFIG.maxRefillsPerSession
    ),
    showRefillCount: config.showRefillCount !== false
  };
}

function resolveFloatingScenario(config = DEFAULT_FLOATING_SCENARIO) {
  return {
    currentSalesPoints: toNonNegativeInteger(
      config.currentSalesPoints,
      DEFAULT_FLOATING_SCENARIO.currentSalesPoints
    ),
    carryPoolBeforePoints: toNonNegativeInteger(
      config.carryPoolBeforePoints,
      DEFAULT_FLOATING_SCENARIO.carryPoolBeforePoints
    ),
    regulationFundBeforePoints: toNonNegativeInteger(
      config.regulationFundBeforePoints,
      DEFAULT_FLOATING_SCENARIO.regulationFundBeforePoints
    ),
    currentPrizePoolRatio: normalizeRatio(
      config.currentPrizePoolRatio,
      DEFAULT_FLOATING_SCENARIO.currentPrizePoolRatio
    ),
    regulationFundRatio: normalizeRatio(
      config.regulationFundRatio,
      DEFAULT_FLOATING_SCENARIO.regulationFundRatio
    ),
    specialRuleMode:
      config.specialRuleMode === "forceOn" || config.specialRuleMode === "forceOff"
        ? config.specialRuleMode
        : "auto",
    publicWinningCountsMode:
      config.publicWinningCountsMode === "expected" ||
      config.publicWinningCountsMode === "poisson"
        ? config.publicWinningCountsMode
        : "manual",
    publicTier1WinningLines: toNonNegativeInteger(
      config.publicTier1WinningLines,
      DEFAULT_FLOATING_SCENARIO.publicTier1WinningLines
    ),
    publicTier2WinningLines: toNonNegativeInteger(
      config.publicTier2WinningLines,
      DEFAULT_FLOATING_SCENARIO.publicTier2WinningLines
    ),
    publicFixedPayoutTotalPoints: toNonNegativeInteger(
      config.publicFixedPayoutTotalPoints,
      DEFAULT_FLOATING_SCENARIO.publicFixedPayoutTotalPoints
    ),
    includeUserHighTierInPublicCounts:
      config.includeUserHighTierInPublicCounts !== false,
    includeUserFixedPayoutInFixedTotal:
      config.includeUserFixedPayoutInFixedTotal !== false,
    tier1SinglePartCapPoints: toNonNegativeInteger(
      config.tier1SinglePartCapPoints,
      DEFAULT_FLOATING_SCENARIO.tier1SinglePartCapPoints
    ),
    tier2SingleCapPoints: toNonNegativeInteger(
      config.tier2SingleCapPoints,
      DEFAULT_FLOATING_SCENARIO.tier2SingleCapPoints
    ),
    tier1TotalCapPoints: toNonNegativeInteger(
      config.tier1TotalCapPoints,
      DEFAULT_FLOATING_SCENARIO.tier1TotalCapPoints
    ),
    tier2TotalCapPoints: toNonNegativeInteger(
      config.tier2TotalCapPoints,
      DEFAULT_FLOATING_SCENARIO.tier2TotalCapPoints
    ),
    tier2GuaranteedMinPoints: toNonNegativeInteger(
      config.tier2GuaranteedMinPoints,
      DEFAULT_FLOATING_SCENARIO.tier2GuaranteedMinPoints
    ),
    tier1GuaranteedMaxPoints: toNonNegativeInteger(
      config.tier1GuaranteedMaxPoints,
      DEFAULT_FLOATING_SCENARIO.tier1GuaranteedMaxPoints
    ),
    normalPoolSplitThresholdPoints: toNonNegativeInteger(
      config.normalPoolSplitThresholdPoints,
      DEFAULT_FLOATING_SCENARIO.normalPoolSplitThresholdPoints
    ),
    specialTier1Part2Ratio: normalizeRatio(
      config.specialTier1Part2Ratio,
      DEFAULT_FLOATING_SCENARIO.specialTier1Part2Ratio
    ),
    specialTier2Ratio: normalizeRatio(
      config.specialTier2Ratio,
      DEFAULT_FLOATING_SCENARIO.specialTier2Ratio
    ),
    lowPoolTier1Ratio: normalizeRatio(
      config.lowPoolTier1Ratio,
      DEFAULT_FLOATING_SCENARIO.lowPoolTier1Ratio
    ),
    lowPoolTier2Ratio: normalizeRatio(
      config.lowPoolTier2Ratio,
      DEFAULT_FLOATING_SCENARIO.lowPoolTier2Ratio
    ),
    highPoolTier1Part1Ratio: normalizeRatio(
      config.highPoolTier1Part1Ratio,
      DEFAULT_FLOATING_SCENARIO.highPoolTier1Part1Ratio
    ),
    highPoolTier1Part2Ratio: normalizeRatio(
      config.highPoolTier1Part2Ratio,
      DEFAULT_FLOATING_SCENARIO.highPoolTier1Part2Ratio
    ),
    highPoolTier2Ratio: normalizeRatio(
      config.highPoolTier2Ratio,
      DEFAULT_FLOATING_SCENARIO.highPoolTier2Ratio
    ),
    specialStartThresholdPoints: toNonNegativeInteger(
      config.specialStartThresholdPoints,
      DEFAULT_FLOATING_SCENARIO.specialStartThresholdPoints
    ),
    specialStopThresholdPoints: toNonNegativeInteger(
      config.specialStopThresholdPoints,
      DEFAULT_FLOATING_SCENARIO.specialStopThresholdPoints
    ),
    rounding: "floor"
  };
}

export function resolveChallengeConfig(config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG) {
  const sampling = resolveSamplingConfig(config.sampling);
  const refill = resolveRefillConfig(config.refill);
  const floatingScenario = resolveFloatingScenario(config.floatingScenario);
  const fixedTierPoints = resolveFixedTierPoints(config.fixedTierPoints);

  return {
    initialPoints: toPositiveInteger(
      config.initialPoints,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.initialPoints
    ),
    unitCostPoints: toPositiveInteger(
      config.unitCostPoints,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.unitCostPoints
    ),
    maxRoundsStored: toPositiveInteger(
      config.maxRoundsStored,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.maxRoundsStored
    ),
    defaultModeTab: Object.values(MODE_TABS).includes(config.defaultModeTab)
      ? config.defaultModeTab
      : DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.defaultModeTab,
    selectionMode:
      config.selectionMode === SELECTION_MODES.DANTUO
        ? SELECTION_MODES.DANTUO
        : SELECTION_MODES.COMPOUND,
    multiplier: normalizeMultiplier(config.multiplier),
    sampling,
    refill,
    floatingScenario,
    fixedTierPoints,
    labels: {
      ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.labels,
      ...(config.labels || {})
    }
  };
}

export function generateSelectionLines(selection, samplingConfig, randomFn = Math.random) {
  const normalizedSelection = normalizeSelection(selection);
  const resolvedSampling = resolveSamplingConfig(samplingConfig);
  const theoreticalLineCount = countSelectionLines(normalizedSelection);

  if (!resolvedSampling.capSamplingEnabled) {
    if (theoreticalLineCount > resolvedSampling.hardGenerationLimit) {
      throw new Error("组合注数过多，请开启上限抽样或缩小候选号池。");
    }

    return {
      theoreticalLineCount,
      effectiveLineCount: theoreticalLineCount,
      sampled: false,
      replacementMode: REPLACEMENT_MODES.NONE,
      lines: Array.from({ length: theoreticalLineCount }, (_, index) =>
        getLineByIndex(normalizedSelection, index)
      )
    };
  }

  if (theoreticalLineCount <= resolvedSampling.capLimit) {
    return {
      theoreticalLineCount,
      effectiveLineCount: theoreticalLineCount,
      sampled: false,
      replacementMode: REPLACEMENT_MODES.NONE,
      lines: Array.from({ length: theoreticalLineCount }, (_, index) =>
        getLineByIndex(normalizedSelection, index)
      )
    };
  }

  const effectiveLineCount = resolvedSampling.capLimit;

  if (resolvedSampling.replacementMode === REPLACEMENT_MODES.WITH_REPLACEMENT) {
    return {
      theoreticalLineCount,
      effectiveLineCount,
      sampled: true,
      replacementMode: REPLACEMENT_MODES.WITH_REPLACEMENT,
      lines: Array.from({ length: effectiveLineCount }, () =>
        getLineByIndex(
          normalizedSelection,
          Math.floor(randomFn() * theoreticalLineCount)
        )
      )
    };
  }

  const uniqueIndexes = sampleUniqueLineIndexes(
    theoreticalLineCount,
    effectiveLineCount,
    randomFn
  );

  return {
    theoreticalLineCount,
    effectiveLineCount,
    sampled: true,
    replacementMode: REPLACEMENT_MODES.WITHOUT_REPLACEMENT,
    lines: uniqueIndexes.map((index) => getLineByIndex(normalizedSelection, index))
  };
}

export function classifyRealisticTier(redHits, blueHit, options = {}) {
  const specialRuleActive = Boolean(options.specialRuleActive);

  if (redHits === 6 && blueHit === 1) {
    return REALISTIC_TIER_CODES.TIER_1;
  }
  if (redHits === 6 && blueHit === 0) {
    return REALISTIC_TIER_CODES.TIER_2;
  }
  if (redHits === 5 && blueHit === 1) {
    return REALISTIC_TIER_CODES.TIER_3;
  }
  if ((redHits === 5 && blueHit === 0) || (redHits === 4 && blueHit === 1)) {
    return REALISTIC_TIER_CODES.TIER_4;
  }
  if ((redHits === 4 && blueHit === 0) || (redHits === 3 && blueHit === 1)) {
    return REALISTIC_TIER_CODES.TIER_5;
  }
  if (blueHit === 1 && redHits >= 0 && redHits <= 2) {
    return REALISTIC_TIER_CODES.TIER_6;
  }
  if (specialRuleActive && redHits === 3 && blueHit === 0) {
    return REALISTIC_TIER_CODES.FU_YUN;
  }

  return REALISTIC_TIER_CODES.NO_TIER;
}

export function isSpecialRuleActive(scenario, previousSpecialState = false) {
  if (scenario.specialRuleMode === "forceOn") {
    return true;
  }
  if (scenario.specialRuleMode === "forceOff") {
    return false;
  }

  if (previousSpecialState) {
    return scenario.carryPoolBeforePoints >= scenario.specialStopThresholdPoints;
  }

  return scenario.carryPoolBeforePoints >= scenario.specialStartThresholdPoints;
}

function resolveWeightGroup(weights, fallbackWeights) {
  const source = Array.isArray(weights) ? weights : [];
  const fallbackSource = Array.isArray(fallbackWeights) ? fallbackWeights : [];
  const normalizedWeights = source.map((weight, index) =>
    normalizeRatio(weight, fallbackSource[index] ?? 0)
  );
  const totalWeight = normalizedWeights.reduce((total, weight) => total + weight, 0);

  if (totalWeight > 0) {
    return normalizedWeights.map((weight) => weight / totalWeight);
  }

  const normalizedFallback = fallbackSource.map((weight) => normalizeRatio(weight, 0));
  const fallbackTotal = normalizedFallback.reduce((total, weight) => total + weight, 0);

  if (fallbackTotal > 0) {
    return normalizedFallback.map((weight) => weight / fallbackTotal);
  }

  if (!source.length) {
    return [];
  }

  return source.map(() => 0);
}

export function calculateCurrentPrizePools({ scenario, fixedPayoutTotalPoints }) {
  const currentPrizePoints = Math.floor(
    scenario.currentSalesPoints * scenario.currentPrizePoolRatio
  );
  const regulationFundInflowPoints = Math.floor(
    scenario.currentSalesPoints * scenario.regulationFundRatio
  );
  const currentFloatingPoints = Math.max(
    0,
    currentPrizePoints - toNonNegativeInteger(fixedPayoutTotalPoints)
  );

  return {
    currentPrizePoints,
    regulationFundInflowPoints,
    currentFloatingPoints
  };
}

export function allocateFloatingGrossPools({
  scenario,
  currentFloatingPoints,
  specialRuleActive
}) {
  const pool = scenario.carryPoolBeforePoints;

  if (specialRuleActive) {
    const [tier1Part2Ratio, tier2Ratio] = resolveWeightGroup(
      [scenario.specialTier1Part2Ratio, scenario.specialTier2Ratio],
      [
        DEFAULT_FLOATING_SCENARIO.specialTier1Part2Ratio,
        DEFAULT_FLOATING_SCENARIO.specialTier2Ratio
      ]
    );

    return {
      tier1Part1GrossPoints: pool,
      tier1Part2GrossPoints: Math.floor(currentFloatingPoints * tier1Part2Ratio),
      tier2GrossPoints: Math.floor(currentFloatingPoints * tier2Ratio)
    };
  }

  if (pool < scenario.normalPoolSplitThresholdPoints) {
    const [tier1Ratio, tier2Ratio] = resolveWeightGroup(
      [scenario.lowPoolTier1Ratio, scenario.lowPoolTier2Ratio],
      [
        DEFAULT_FLOATING_SCENARIO.lowPoolTier1Ratio,
        DEFAULT_FLOATING_SCENARIO.lowPoolTier2Ratio
      ]
    );

    return {
      tier1Part1GrossPoints: pool + Math.floor(currentFloatingPoints * tier1Ratio),
      tier1Part2GrossPoints: 0,
      tier2GrossPoints: Math.floor(currentFloatingPoints * tier2Ratio)
    };
  }

  const [tier1Part1Ratio, tier1Part2Ratio, tier2Ratio] = resolveWeightGroup(
    [
      scenario.highPoolTier1Part1Ratio,
      scenario.highPoolTier1Part2Ratio,
      scenario.highPoolTier2Ratio
    ],
    [
      DEFAULT_FLOATING_SCENARIO.highPoolTier1Part1Ratio,
      DEFAULT_FLOATING_SCENARIO.highPoolTier1Part2Ratio,
      DEFAULT_FLOATING_SCENARIO.highPoolTier2Ratio
    ]
  );

  return {
    tier1Part1GrossPoints: pool + Math.floor(currentFloatingPoints * tier1Part1Ratio),
    tier1Part2GrossPoints: Math.floor(currentFloatingPoints * tier1Part2Ratio),
    tier2GrossPoints: Math.floor(currentFloatingPoints * tier2Ratio)
  };
}

export function applyHighTierCapsAndGuarantees({
  scenario,
  tier1PerLine,
  tier2PerLine,
  tier1Count,
  tier2Count
}) {
  let adjustedTier1 = tier1PerLine;
  let adjustedTier2 = tier2PerLine;
  const notes = [];

  if (tier1Count > 0 && adjustedTier1 * tier1Count > scenario.tier1TotalCapPoints) {
    adjustedTier1 = Math.floor(scenario.tier1TotalCapPoints / tier1Count);
    notes.push("TIER_1_TOTAL_CAP_APPLIED");
  }

  if (tier2Count > 0 && adjustedTier2 * tier2Count > scenario.tier2TotalCapPoints) {
    adjustedTier2 = Math.floor(scenario.tier2TotalCapPoints / tier2Count);
    notes.push("TIER_2_TOTAL_CAP_APPLIED");
  }

  const tier1CapApplied = notes.includes("TIER_1_TOTAL_CAP_APPLIED");
  const tier2CapApplied = notes.includes("TIER_2_TOTAL_CAP_APPLIED");

  if (
    !tier2CapApplied &&
    tier2Count > 0 &&
    adjustedTier2 > 0 &&
    adjustedTier2 < scenario.tier2GuaranteedMinPoints
  ) {
    adjustedTier2 = scenario.tier2GuaranteedMinPoints;
    notes.push("TIER_2_GUARANTEE_APPLIED");
  }

  if (!tier1CapApplied && tier1Count > 0 && adjustedTier1 > 0) {
    const minByTier2 = adjustedTier2 > 0 ? adjustedTier2 * 2 : 0;
    const minByTier3 = scenario.tier2GuaranteedMinPoints * 2;
    const targetMin = Math.max(minByTier2, minByTier3);

    if (
      adjustedTier1 < targetMin &&
      adjustedTier1 < scenario.tier1GuaranteedMaxPoints
    ) {
      adjustedTier1 = Math.min(scenario.tier1GuaranteedMaxPoints, targetMin);
      notes.push("TIER_1_GUARANTEE_APPLIED");
    }
  }

  return {
    tier1PerLinePoints: Math.max(0, Math.floor(adjustedTier1)),
    tier2PerLinePoints: Math.max(0, Math.floor(adjustedTier2)),
    notes
  };
}

export function calculateFloatingTierValues({ scenario, grossPools, winningCounts }) {
  const tier1Count = Math.max(0, winningCounts.tier1WinningLines);
  const tier2Count = Math.max(0, winningCounts.tier2WinningLines);
  let tier1PerLine = 0;
  let tier2PerLine = 0;

  if (tier1Count > 0) {
    const part1 = Math.min(
      scenario.tier1SinglePartCapPoints,
      Math.floor(grossPools.tier1Part1GrossPoints / tier1Count)
    );
    const part2 =
      grossPools.tier1Part2GrossPoints > 0
        ? Math.min(
            scenario.tier1SinglePartCapPoints,
            Math.floor(grossPools.tier1Part2GrossPoints / tier1Count)
          )
        : 0;
    tier1PerLine = part1 + part2;
  }

  if (tier2Count > 0) {
    tier2PerLine = Math.min(
      scenario.tier2SingleCapPoints,
      Math.floor(grossPools.tier2GrossPoints / tier2Count)
    );
  }

  return applyHighTierCapsAndGuarantees({
    scenario,
    tier1PerLine,
    tier2PerLine,
    tier1Count,
    tier2Count
  });
}

export function calculateNextCarryPool({
  scenario,
  grossPools,
  highTierValues,
  winningCounts
}) {
  const tier1Paid =
    highTierValues.tier1PerLinePoints * winningCounts.tier1WinningLines;
  const tier2Paid =
    highTierValues.tier2PerLinePoints * winningCounts.tier2WinningLines;

  const tier1GrossTotal =
    grossPools.tier1Part1GrossPoints + grossPools.tier1Part2GrossPoints;
  const tier2GrossTotal = grossPools.tier2GrossPoints;

  const tier1Unpaid = Math.max(0, tier1GrossTotal - tier1Paid);
  const tier2Unpaid = Math.max(0, tier2GrossTotal - tier2Paid);

  return Math.max(0, Math.floor(tier1Unpaid + tier2Unpaid));
}

function poisson(lambda, randomFn = Math.random) {
  if (lambda <= 0) {
    return 0;
  }

  const threshold = Math.exp(-lambda);
  let product = 1;
  let count = 0;

  while (product > threshold) {
    count += 1;
    product *= randomFn();
  }

  return Math.max(0, count - 1);
}

function estimateCount(mode, estimatedPublicLines, tierCode, randomFn) {
  const numerator = EXACT_TIER_PROBABILITY_NUMERATORS[tierCode] || 0;
  const lambda =
    (estimatedPublicLines * numerator) / SSQ_RULE_NUMBERS.totalOutcomeCount;

  if (mode === "poisson") {
    return poisson(lambda, randomFn);
  }

  return Math.round(lambda);
}

export function resolvePublicWinningCounts({
  scenario,
  userTierCounts,
  userEffectiveLineCount,
  randomFn = Math.random
}) {
  if (scenario.publicWinningCountsMode === "manual") {
    return {
      mode: "manual",
      estimatedPublicLines: Math.max(
        0,
        Math.floor(scenario.currentSalesPoints / SSQ_RULE_NUMBERS.unitCostPoints) -
          userEffectiveLineCount
      ),
      tier1WinningLines:
        scenario.publicTier1WinningLines +
        (scenario.includeUserHighTierInPublicCounts
          ? userTierCounts[REALISTIC_TIER_CODES.TIER_1] || 0
          : 0),
      tier2WinningLines:
        scenario.publicTier2WinningLines +
        (scenario.includeUserHighTierInPublicCounts
          ? userTierCounts[REALISTIC_TIER_CODES.TIER_2] || 0
          : 0)
    };
  }

  const estimatedPublicLines = Math.max(
    0,
    Math.floor(scenario.currentSalesPoints / SSQ_RULE_NUMBERS.unitCostPoints) -
      userEffectiveLineCount
  );
  const tier1Estimated = estimateCount(
    scenario.publicWinningCountsMode,
    estimatedPublicLines,
    REALISTIC_TIER_CODES.TIER_1,
    randomFn
  );
  const tier2Estimated = estimateCount(
    scenario.publicWinningCountsMode,
    estimatedPublicLines,
    REALISTIC_TIER_CODES.TIER_2,
    randomFn
  );

  return {
    mode: scenario.publicWinningCountsMode,
    estimatedPublicLines,
    tier1WinningLines:
      tier1Estimated +
      (scenario.includeUserHighTierInPublicCounts
        ? userTierCounts[REALISTIC_TIER_CODES.TIER_1] || 0
        : 0),
    tier2WinningLines:
      tier2Estimated +
      (scenario.includeUserHighTierInPublicCounts
        ? userTierCounts[REALISTIC_TIER_CODES.TIER_2] || 0
        : 0)
  };
}

export function estimatePublicFixedPayoutTotalPoints({
  scenario,
  fixedTierPoints = FIXED_TIER_POINTS,
  userTierCounts,
  userFixedReturnPoints,
  userEffectiveLineCount,
  specialRuleActive,
  randomFn = Math.random
}) {
  let publicFixedPayoutTotalPoints = scenario.publicFixedPayoutTotalPoints;
  let estimatedFixedTierCounts = null;

  if (scenario.publicWinningCountsMode !== "manual") {
    const estimatedPublicLines = Math.max(
      0,
      Math.floor(scenario.currentSalesPoints / SSQ_RULE_NUMBERS.unitCostPoints) -
        userEffectiveLineCount
    );
    const fixedTierCodes = [
      REALISTIC_TIER_CODES.TIER_3,
      REALISTIC_TIER_CODES.TIER_4,
      REALISTIC_TIER_CODES.TIER_5,
      REALISTIC_TIER_CODES.TIER_6
    ];

    if (specialRuleActive) {
      fixedTierCodes.push(REALISTIC_TIER_CODES.FU_YUN);
    }

    estimatedFixedTierCounts = Object.fromEntries(
      fixedTierCodes.map((tierCode) => [
        tierCode,
        estimateCount(
          scenario.publicWinningCountsMode,
          estimatedPublicLines,
          tierCode,
          randomFn
        )
      ])
    );

    publicFixedPayoutTotalPoints = fixedTierCodes.reduce(
      (total, tierCode) =>
        total +
        (estimatedFixedTierCounts[tierCode] || 0) * (fixedTierPoints[tierCode] || 0),
      0
    );
  }

  return {
    publicFixedPayoutTotalPoints,
    fixedPayoutTotalPoints:
      publicFixedPayoutTotalPoints +
      (scenario.includeUserFixedPayoutInFixedTotal ? userFixedReturnPoints : 0),
    estimatedFixedTierCounts,
    userFixedTierCounts:
      scenario.includeUserFixedPayoutInFixedTotal === false ? {} : userTierCounts
  };
}

export function calculateLinePointReturn({
  tierCode,
  highTierValues,
  fixedTierPoints = FIXED_TIER_POINTS,
  multiplier = 1
}) {
  let base = 0;

  if (tierCode === REALISTIC_TIER_CODES.TIER_1) {
    base = highTierValues.tier1PerLinePoints;
  } else if (tierCode === REALISTIC_TIER_CODES.TIER_2) {
    base = highTierValues.tier2PerLinePoints;
  } else {
    base = fixedTierPoints[tierCode] || 0;
  }

  return Math.max(0, Math.floor(base * normalizeMultiplier(multiplier)));
}

export function createEmptyTierCounts() {
  return Object.fromEntries(
    Object.values(REALISTIC_TIER_CODES).map((tierCode) => [tierCode, 0])
  );
}

function compareBestSettlement(currentBest, nextSettlement) {
  if (!currentBest) {
    return nextSettlement;
  }

  const currentPriority = TIER_PRIORITY[currentBest.tierCode] || 0;
  const nextPriority = TIER_PRIORITY[nextSettlement.tierCode] || 0;

  if (nextPriority !== currentPriority) {
    return nextPriority > currentPriority ? nextSettlement : currentBest;
  }
  if (nextSettlement.returnPoints !== currentBest.returnPoints) {
    return nextSettlement.returnPoints > currentBest.returnPoints
      ? nextSettlement
      : currentBest;
  }
  if (nextSettlement.redHits !== currentBest.redHits) {
    return nextSettlement.redHits > currentBest.redHits ? nextSettlement : currentBest;
  }
  if (nextSettlement.blueHit !== currentBest.blueHit) {
    return nextSettlement.blueHit > currentBest.blueHit ? nextSettlement : currentBest;
  }

  return currentBest;
}

function createStoredRoundSummary(round) {
  return {
    roundIndex: round.roundIndex,
    createdAt: round.createdAt,
    beforePoints: round.beforePoints,
    theoreticalLineCount: round.theoreticalLineCount,
    effectiveLineCount: round.effectiveLineCount,
    sampled: round.sampled,
    replacementMode: round.replacementMode,
    costPoints: round.costPoints,
    returnPoints: round.returnPoints,
    afterPoints: round.afterPoints,
    refillApplied: round.refillApplied,
    refillPoints: round.refillPoints,
    refillMode: round.refillMode,
    refillIndexInSession: round.refillIndexInSession,
    bestTierCode: round.bestTierCode,
    bestRedHits: round.bestRedHits,
    bestBlueHit: round.bestBlueHit,
    tierCounts: {
      ...(round.tierCounts || {})
    },
    highTierValues: {
      ...(round.highTierValues || {})
    },
    carryPoolBeforePoints: round.carryPoolBeforePoints,
    carryPoolAfterPoints: round.carryPoolAfterPoints,
    specialRuleActive: round.specialRuleActive,
    notes: Array.isArray(round.notes) ? round.notes.slice() : []
  };
}

export function createDefaultPointsChallengeState(
  config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG
) {
  const resolvedConfig = resolveChallengeConfig(config);

  return {
    version: REALISTIC_POINTS_STORAGE_VERSION,
    activeModeTab: resolvedConfig.defaultModeTab,
    currentPoints: resolvedConfig.initialPoints,
    initialPoints: resolvedConfig.initialPoints,
    refillCountInSession: 0,
    specialRuleActive: false,
    selectionMode: resolvedConfig.selectionMode,
    multiplier: resolvedConfig.multiplier,
    sampling: {
      ...resolvedConfig.sampling
    },
    refill: {
      ...resolvedConfig.refill
    },
    fixedTierPoints: {
      ...resolvedConfig.fixedTierPoints
    },
    floatingScenario: {
      ...resolvedConfig.floatingScenario
    },
    rounds: []
  };
}

function normalizeStoredState(state, config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG) {
  const fallback = createDefaultPointsChallengeState(config);

  return {
    version: REALISTIC_POINTS_STORAGE_VERSION,
    activeModeTab: Object.values(MODE_TABS).includes(state?.activeModeTab)
      ? state.activeModeTab
      : fallback.activeModeTab,
    currentPoints: toNonNegativeInteger(state?.currentPoints, fallback.currentPoints),
    initialPoints: toPositiveInteger(state?.initialPoints, fallback.initialPoints),
    refillCountInSession: toNonNegativeInteger(
      state?.refillCountInSession,
      fallback.refillCountInSession
    ),
    specialRuleActive: Boolean(state?.specialRuleActive),
    selectionMode:
      state?.selectionMode === SELECTION_MODES.DANTUO
        ? SELECTION_MODES.DANTUO
        : fallback.selectionMode,
    multiplier: normalizeMultiplier(state?.multiplier ?? fallback.multiplier),
    sampling: resolveSamplingConfig({
      ...fallback.sampling,
      ...(state?.sampling || {})
    }),
    refill: resolveRefillConfig({
      ...fallback.refill,
      ...(state?.refill || {})
    }),
    fixedTierPoints: resolveFixedTierPoints({
      ...fallback.fixedTierPoints,
      ...(state?.fixedTierPoints || {})
    }),
    floatingScenario: resolveFloatingScenario({
      ...fallback.floatingScenario,
      ...(state?.floatingScenario || {})
    }),
    rounds: Array.isArray(state?.rounds)
      ? state.rounds
          .slice(0, config.maxRoundsStored || fallback.rounds.length || ROUND_HISTORY_LIMIT)
          .map(createStoredRoundSummary)
      : []
  };
}

export function loadPointsChallengeState(
  storage,
  config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
  storageKey = REALISTIC_POINTS_STORAGE_KEY
) {
  const fallback = createDefaultPointsChallengeState(config);

  if (!storage || typeof storage.getItem !== "function") {
    return fallback;
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return fallback;
    }

    return normalizeStoredState(JSON.parse(raw), config);
  } catch {
    return fallback;
  }
}

export function savePointsChallengeState(
  storage,
  state,
  config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
  storageKey = REALISTIC_POINTS_STORAGE_KEY
) {
  const normalizedState = normalizeStoredState(state, config);

  if (storage && typeof storage.setItem === "function") {
    storage.setItem(storageKey, JSON.stringify(normalizedState));
  }

  return normalizedState;
}

export function savePointsChallengeActiveMode(
  storage,
  activeModeTab,
  config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
  storageKey = REALISTIC_POINTS_STORAGE_KEY
) {
  const nextState = loadPointsChallengeState(storage, config, storageKey);
  nextState.activeModeTab = Object.values(MODE_TABS).includes(activeModeTab)
    ? activeModeTab
    : DEFAULT_ACTIVE_MODE_TAB;

  return savePointsChallengeState(storage, nextState, config, storageKey);
}

export function commitPointsChallengeRound(
  state,
  roundResult,
  config = DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG
) {
  const resolvedConfig = resolveChallengeConfig(config);
  const nextState = normalizeStoredState(state, resolvedConfig);

  nextState.currentPoints = roundResult.afterPoints;
  nextState.initialPoints = resolvedConfig.initialPoints;
  nextState.refillCountInSession = roundResult.refillIndexInSession;
  nextState.specialRuleActive = roundResult.specialRuleActive;
  nextState.multiplier = roundResult.multiplier;
  nextState.selectionMode = roundResult.selectionMode;
  nextState.sampling = {
    ...resolvedConfig.sampling
  };
  nextState.refill = {
    ...resolvedConfig.refill
  };
  nextState.fixedTierPoints = {
    ...resolvedConfig.fixedTierPoints
  };
  nextState.floatingScenario = {
    ...resolvedConfig.floatingScenario,
    carryPoolBeforePoints: roundResult.carryPoolAfterPoints
  };
  nextState.rounds = [
    createStoredRoundSummary(roundResult),
    ...nextState.rounds
  ].slice(0, resolvedConfig.maxRoundsStored);

  return nextState;
}

export function settlePointsChallengeRound(input) {
  const resolvedConfig = resolveChallengeConfig(input.config);
  const normalizedSelection = normalizeSelection({
    ...input.selection,
    multiplier: input.selection?.multiplier ?? resolvedConfig.multiplier
  });
  const normalizedTarget = normalizeTarget(input.target);
  const samplingResult = generateSelectionLines(
    normalizedSelection,
    resolvedConfig.sampling,
    input.randomFn
  );
  const beforePoints = toNonNegativeInteger(
    input.currentPoints,
    resolvedConfig.initialPoints
  );
  const refillCountInSession = toNonNegativeInteger(input.refillCountInSession, 0);
  const costPoints =
    samplingResult.effectiveLineCount *
    resolvedConfig.unitCostPoints *
    normalizedSelection.multiplier;

  if (
    normalizedSelection.multiplier > MULTIPLIER_RULE.defaultMultiplier &&
    costPoints > MULTIPLIER_RULE.maxVirtualSlipCostPoints
  ) {
    throw new Error("当前虚拟倍数下的单次消耗过高，请缩小组合或降低倍数。");
  }

  let spendablePoints = beforePoints;
  let refillApplied = false;
  let refillPoints = 0;
  let refillIndexInSession = refillCountInSession;
  let refillMode = resolvedConfig.refill.mode;

  if (spendablePoints < costPoints) {
    if (!resolvedConfig.refill.enabled) {
      throw new Error("点数不足，无法运行本轮挑战。");
    }
    if (refillCountInSession >= resolvedConfig.refill.maxRefillsPerSession) {
      throw new Error("本局可用回补次数已用完，无法继续运行。");
    }

    refillApplied = true;
    refillIndexInSession = refillCountInSession + 1;
    refillPoints =
      resolvedConfig.refill.mode === "addFixedAmount"
        ? resolvedConfig.refill.fixedRefillPoints
        : resolvedConfig.initialPoints;

    spendablePoints =
      resolvedConfig.refill.mode === "addFixedAmount"
        ? spendablePoints + resolvedConfig.refill.fixedRefillPoints
        : resolvedConfig.initialPoints;

    if (spendablePoints < costPoints) {
      throw new Error("点数回补后仍不足以覆盖本轮消耗，请缩小组合。");
    }
  }

  const carryPoolBeforePoints = resolvedConfig.floatingScenario.carryPoolBeforePoints;
  const specialRuleActive = isSpecialRuleActive(
    resolvedConfig.floatingScenario,
    Boolean(input.previousSpecialState)
  );
  const targetRedSet = new Set(normalizedTarget.reds);
  const tierCounts = createEmptyTierCounts();
  const provisionalSettlements = samplingResult.lines.map((line) => {
    const redHits = line.reds.filter((value) => targetRedSet.has(value)).length;
    const blueHit = line.blue === normalizedTarget.blue ? 1 : 0;
    const tierCode = classifyRealisticTier(redHits, blueHit, {
      specialRuleActive
    });

    tierCounts[tierCode] += 1;

    return {
      line,
      redHits,
      blueHit,
      tierCode
    };
  });

  const userFixedReturnPoints = provisionalSettlements.reduce((total, settlement) => {
    if (
      settlement.tierCode === REALISTIC_TIER_CODES.TIER_1 ||
      settlement.tierCode === REALISTIC_TIER_CODES.TIER_2
    ) {
      return total;
    }

    return (
      total +
      calculateLinePointReturn({
        tierCode: settlement.tierCode,
        highTierValues: {
          tier1PerLinePoints: 0,
          tier2PerLinePoints: 0
        },
        fixedTierPoints: resolvedConfig.fixedTierPoints,
        multiplier: normalizedSelection.multiplier
      })
    );
  }, 0);

  const winningCounts = resolvePublicWinningCounts({
    scenario: resolvedConfig.floatingScenario,
    userTierCounts: tierCounts,
    userEffectiveLineCount: samplingResult.effectiveLineCount,
    randomFn: input.randomFn
  });
  const fixedPayoutMeta = estimatePublicFixedPayoutTotalPoints({
    scenario: resolvedConfig.floatingScenario,
    fixedTierPoints: resolvedConfig.fixedTierPoints,
    userTierCounts: tierCounts,
    userFixedReturnPoints,
    userEffectiveLineCount: samplingResult.effectiveLineCount,
    specialRuleActive,
    randomFn: input.randomFn
  });
  const prizePools = calculateCurrentPrizePools({
    scenario: resolvedConfig.floatingScenario,
    fixedPayoutTotalPoints: fixedPayoutMeta.fixedPayoutTotalPoints
  });
  const grossPools = allocateFloatingGrossPools({
    scenario: resolvedConfig.floatingScenario,
    currentFloatingPoints: prizePools.currentFloatingPoints,
    specialRuleActive
  });
  const highTierValues = calculateFloatingTierValues({
    scenario: resolvedConfig.floatingScenario,
    grossPools,
    winningCounts
  });
  const lineSettlements = provisionalSettlements.map((settlement) => ({
    ...settlement,
    returnPoints: calculateLinePointReturn({
      tierCode: settlement.tierCode,
      highTierValues,
      fixedTierPoints: resolvedConfig.fixedTierPoints,
      multiplier: normalizedSelection.multiplier
    })
  }));
  const returnPoints = lineSettlements.reduce(
    (total, settlement) => total + settlement.returnPoints,
    0
  );
  const bestSettlement =
    lineSettlements.reduce(compareBestSettlement, null) || lineSettlements[0] || null;
  const carryPoolAfterPoints = calculateNextCarryPool({
    scenario: resolvedConfig.floatingScenario,
    grossPools,
    highTierValues,
    winningCounts
  });
  const notes = [];

  if (samplingResult.sampled) {
    notes.push(
      samplingResult.replacementMode === REPLACEMENT_MODES.WITH_REPLACEMENT
        ? "SAMPLING_WITH_REPLACEMENT"
        : "SAMPLING_WITHOUT_REPLACEMENT"
    );
  }
  if (refillApplied) {
    notes.push("REFILL_APPLIED");
  }
  notes.push(...highTierValues.notes);

  return {
    roundIndex: toPositiveInteger(input.roundIndex, 1),
    createdAt: new Date().toISOString(),
    beforePoints,
    theoreticalLineCount: samplingResult.theoreticalLineCount,
    effectiveLineCount: samplingResult.effectiveLineCount,
    sampled: samplingResult.sampled,
    replacementMode: samplingResult.replacementMode,
    unitCostPoints: resolvedConfig.unitCostPoints,
    multiplier: normalizedSelection.multiplier,
    selectionMode: normalizedSelection.mode,
    costPoints,
    returnPoints,
    afterPoints: spendablePoints - costPoints + returnPoints,
    refillApplied,
    refillPoints,
    refillMode,
    refillIndexInSession,
    target: normalizedTarget,
    lineSettlements,
    tierCounts,
    bestTierCode: bestSettlement?.tierCode || REALISTIC_TIER_CODES.NO_TIER,
    bestRedHits: bestSettlement?.redHits || 0,
    bestBlueHit: bestSettlement?.blueHit || 0,
    highTierValues,
    publicWinningCounts: winningCounts,
    fixedPayoutMeta,
    prizePools,
    grossPools,
    carryPoolBeforePoints,
    carryPoolAfterPoints,
    specialRuleActive,
    notes
  };
}
