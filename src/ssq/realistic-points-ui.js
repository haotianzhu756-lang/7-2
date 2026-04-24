import {
  BLUE_MAX,
  BLUE_MIN,
  MODE_TABS,
  RED_MAX,
  RED_MIN
} from "./constants.js";
import { createNonHistoricalTarget } from "./match-lab.js";
import {
  DEFAULT_FLOATING_SCENARIO,
  DEFAULT_POINT_REFILL_CONFIG,
  DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
  DEFAULT_SAMPLING_CONFIG,
  POINTS_CHALLENGE_DISCLAIMER,
  REALISTIC_TIER_CODES,
  REPLACEMENT_MODES,
  SELECTION_MODES,
  TIER_CODE_LABELS,
  commitPointsChallengeRound,
  countSelectionLines,
  createDefaultPointsChallengeState,
  createEmptyTierCounts,
  loadPointsChallengeState,
  resolveChallengeConfig,
  savePointsChallengeActiveMode,
  savePointsChallengeState,
  settlePointsChallengeRound,
  validateSelection
} from "./realistic-points-challenge.js";

const POINTS_FIELD_EXPLANATIONS = Object.freeze({
  overview: {
    title: "字段说明",
    body: "将光标放到参数输入框、摘要卡片或操作按钮上，这里会显示对应说明，帮助理解当前字段在规则映射中的作用。"
  },
  initialPoints: {
    title: "初始点数",
    body: "每一局开始时的虚拟点数基线。重置本局时会回到这个值，不涉及任何真实账户或支付。"
  },
  samplingEnabled: {
    title: "开启上限抽样",
    body: "组合数过大时，只抽取部分计奖注数，避免页面一次性展开过多单注。关闭后，如果组合数超过硬上限，本轮会被阻止。"
  },
  replacementMode: {
    title: "抽样方式",
    body: "无放回表示每次抽中的单注都不重复；有放回则允许重复抽到同一注，重复也会计入计奖注数。"
  },
  capLimit: {
    title: "抽样上限（注）",
    body: "当理论注数超过这个阈值时，只按这个数量计奖。预计消耗和实际结算都以计奖注数为准。"
  },
  refillEnabled: {
    title: "开启虚拟回补",
    body: "点数不足时，允许系统按当前规则自动补一次虚拟点数后继续结算。它只是教学机制，不表示充值或余额系统。"
  },
  refillMode: {
    title: "回补方式",
    body: "可以选择直接重置到初始点数，或在当前基础上增加固定点数。两种方式都只影响本地虚拟点数。"
  },
  fixedRefillPoints: {
    title: "固定回补点数",
    body: "只有在“增加固定点数”模式下才会使用。这个值越大，点数不足时一次能补的空间越大。"
  },
  maxRefills: {
    title: "本局最多回补次数",
    body: "限制单局内最多自动回补多少次，避免挑战无限续跑。达到上限后，点数不足会直接阻止本轮。"
  },
  specialRuleMode: {
    title: "特别规则",
    body: "控制是否启用特别规则。自动模式会根据奖池阈值判断；开启或关闭则强制覆盖自动判断。"
  },
  currentSalesPoints: {
    title: "当期销售点数",
    body: "这是当前场景里用于推导奖池分配的销售规模输入，只是规则映射参数，不代表实时外部数据。"
  },
  carryPoolBeforePoints: {
    title: "期初奖池点数",
    body: "表示本轮结算前的奖池规模。一二等奖单注点数和下一轮结转奖池都会从这里出发计算。"
  },
  publicFixedPayoutTotalPoints: {
    title: "公开固定奖级派奖总点数",
    body: "表示公开环境中固定奖级合计需要派发的点数，会先从当期可分配总量里扣除，再计算一二等奖的浮动部分。"
  },
  publicTier1WinningLines: {
    title: "公开一等奖中奖注数",
    body: "表示在公开场景下，除当前用户外预计或手动给定的一等奖中奖注数。数量越多，每注可分到的一等奖点数通常越低。"
  },
  publicTier2WinningLines: {
    title: "公开二等奖中奖注数",
    body: "表示公开场景下二等奖中奖注数，会直接影响二等奖单注点数以及总封顶是否触发。"
  },
  redCandidates: {
    title: "候选红球",
    body: "当前 MVP 先按复式投注处理。红球至少需要 6 个，系统会根据红球组合数量推导理论注数。"
  },
  blueCandidates: {
    title: "候选蓝球",
    body: "蓝球至少需要 1 个。蓝球候选号越多，理论注数会按倍数增加。"
  },
  unitCost: {
    title: "单注消耗",
    body: "每一注固定消耗 2 点。最终预计消耗 = 计奖注数 × 单注消耗 × 倍数。"
  },
  selectionMode: {
    title: "选号方式",
    body: "当前页面先开放复式投注。之后如果补上胆拖 UI，这里会同步显示当前生效的投注方式。"
  },
  samplingState: {
    title: "抽样状态",
    body: "这里会告诉你当前是全量计奖、已触发抽样，还是因为关闭抽样而面临组合过大风险。"
  },
  specialRuleState: {
    title: "特别规则状态",
    body: "显示当前特别规则是自动判断、强制开启还是强制关闭；如果已经跑过一轮，也会反映本轮实际是否生效。"
  },
  publicWinningMode: {
    title: "公开中奖口径",
    body: "当前实现使用手动输入的公开中奖注数，保证计奖结果可复现、可测试。"
  },
  currentPoints: {
    title: "当前点数",
    body: "当前这局还剩多少虚拟点数。它会受每轮消耗、返回点数和虚拟回补共同影响。"
  },
  theoreticalLines: {
    title: "理论注数",
    body: "根据候选号池完整展开后应有的投注总注数。它反映组合规模，不一定等于本轮实际计奖注数。"
  },
  effectiveLines: {
    title: "计奖注数",
    body: "本轮真正参与结算的投注注数。开启上限抽样后，这个值可能小于理论注数。"
  },
  costEstimate: {
    title: "预计消耗",
    body: "当前设置下本轮预计要扣掉的点数，依据的是计奖注数而不是理论注数。"
  },
  refillCount: {
    title: "已用回补次数",
    body: "显示本局已经触发过几次虚拟回补，便于判断后续还有没有回补空间。"
  },
  returnPoints: {
    title: "本轮返回点数",
    body: "本轮所有中奖注数合计返回的虚拟点数，包括固定奖级和一二等奖浮动部分。"
  },
  bestTier: {
    title: "最高奖级",
    body: "显示本轮候选号池里表现最好的一注，便于快速理解当前组合的最高奖级。"
  },
  tierCounts: {
    title: "各奖级中奖注数",
    body: "展示本轮计奖注数中各奖级分别中了多少注。它比“最高奖级”更完整，能看见整体分布。"
  },
  highTierValues: {
    title: "一二等奖单注点数",
    body: "显示一等奖和二等奖在当前场景下每一注对应的点数。"
  },
  carryPoolChange: {
    title: "奖池变化",
    body: "展示本轮结算前后的奖池规模，便于观察高奖级派发、未分配部分和下一轮结转的变化。"
  },
  roundSummary: {
    title: "本轮摘要",
    body: "汇总本轮是否抽样、消耗多少点数、返回多少点数，以及回补是否触发。"
  },
  runChallenge: {
    title: "运行一轮挑战",
    body: "按当前参数和候选号池立即执行一轮计奖。不会自动连跑，也不会触发任何外部流程。"
  },
  resetSession: {
    title: "重置本局",
    body: "把当前点数、回补计数和奖池状态重置为这局的起始设定，方便重新做一组对照实验。"
  },
  clearHistory: {
    title: "清空记录",
    body: "只清除本地点数挑战历史摘要，不会影响历史开奖数据或号码实验室记录。"
  },
  customFixedTierPoints: {
    title: "固定奖级点数",
    body: "这里可以自定义三等奖到六等奖，以及特别规则命中的固定点数。应用后会按新金额重新开始本局挑战。"
  },
  currentPrizePoolRatio: {
    title: "当期奖池计提比例",
    body: "表示当期销售点数中，有多少百分比进入当期奖池。这个比例越高，可参与一二等奖分配的点数通常越多。"
  },
  regulationFundRatio: {
    title: "调节基金计提比例",
    body: "表示当期销售点数中，单独计入调节基金的比例。这里只做规则映射展示，不代表真实外部资金流。"
  },
  specialPoolRatios: {
    title: "特别规则奖池比例",
    body: "特别规则开启时，这组比例决定当期浮动奖池如何在一等奖追加部分和二等奖之间分配。应用前需要凑满 100%。"
  },
  lowPoolRatios: {
    title: "常规低奖池比例",
    body: "当奖池低于阈值时，这组比例决定当期浮动奖池如何在一等奖和二等奖之间分配。应用前需要凑满 100%。"
  },
  highPoolRatios: {
    title: "常规高奖池比例",
    body: "当奖池高于阈值时，这组比例决定一等奖基础部分、一等奖追加部分和二等奖的分配占比。应用前需要凑满 100%。"
  },
  applyCustomRules: {
    title: "应用自定义并重新开始",
    body: "点击后会保存当前自定义金额和比例，并立即按新规则重新开始本局挑战。当前点数、回补次数和挑战记录都会清空。"
  },
  restoreCustomRules: {
    title: "恢复默认并重新开始",
    body: "点击后会把自定义金额和比例恢复为默认规则，并重新开始本局挑战。"
  }
});

function formatNum(value) {
  return String(value).padStart(2, "0");
}

function formatPoints(value) {
  return `${Number(value || 0).toLocaleString("zh-CN")} 点`;
}

function formatTierLabel(tierCode) {
  return TIER_CODE_LABELS[tierCode] || TIER_CODE_LABELS[REALISTIC_TIER_CODES.NO_TIER];
}

function formatBlueHit(blueHit) {
  return blueHit ? "命中" : "未中";
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
  const { min, max, label } = options;
  const source = String(raw || "").trim();

  if (!source) {
    return { valid: true, value: [] };
  }

  const tokens = source.split(/[,\s，、；;]+/).filter(Boolean);
  const values = [];

  for (const token of tokens) {
    if (!/^\d+$/.test(token)) {
      return { valid: false, error: `${label}中存在非法格式：${token}`, value: [] };
    }

    const numericValue = Number(token);
    if (numericValue < min || numericValue > max) {
      return { valid: false, error: `${label}超出范围：${numericValue}`, value: [] };
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
    panel: document.querySelector("#panel-points-challenge"),
    disclaimer: document.querySelector("#pointsChallengeDisclaimer"),
    statusMessage: document.querySelector("#pointsChallengeStatusMessage"),
    initialPoints: document.querySelector("#pointsChallengeInitialPoints"),
    samplingEnabled: document.querySelector("#pointsChallengeSamplingEnabled"),
    replacementMode: document.querySelector("#pointsChallengeReplacementMode"),
    capLimit: document.querySelector("#pointsChallengeCapLimit"),
    refillEnabled: document.querySelector("#pointsChallengeRefillEnabled"),
    refillMode: document.querySelector("#pointsChallengeRefillMode"),
    fixedRefillPoints: document.querySelector("#pointsChallengeFixedRefillPoints"),
    maxRefills: document.querySelector("#pointsChallengeMaxRefills"),
    specialRuleMode: document.querySelector("#pointsChallengeSpecialRuleMode"),
    currentSalesPoints: document.querySelector("#pointsChallengeCurrentSalesPoints"),
    carryPoolBeforePoints: document.querySelector("#pointsChallengeCarryPoolBeforePoints"),
    currentPrizePoolRatio: document.querySelector("#pointsChallengeCurrentPrizePoolRatio"),
    regulationFundRatio: document.querySelector("#pointsChallengeRegulationFundRatio"),
    tier3Points: document.querySelector("#pointsChallengeTier3Points"),
    tier4Points: document.querySelector("#pointsChallengeTier4Points"),
    tier5Points: document.querySelector("#pointsChallengeTier5Points"),
    tier6Points: document.querySelector("#pointsChallengeTier6Points"),
    fuYunPoints: document.querySelector("#pointsChallengeFuYunPoints"),
    specialTier1Part2Ratio: document.querySelector(
      "#pointsChallengeSpecialTier1Part2Ratio"
    ),
    specialTier2Ratio: document.querySelector("#pointsChallengeSpecialTier2Ratio"),
    lowPoolTier1Ratio: document.querySelector("#pointsChallengeLowPoolTier1Ratio"),
    lowPoolTier2Ratio: document.querySelector("#pointsChallengeLowPoolTier2Ratio"),
    highPoolTier1Part1Ratio: document.querySelector(
      "#pointsChallengeHighPoolTier1Part1Ratio"
    ),
    highPoolTier1Part2Ratio: document.querySelector(
      "#pointsChallengeHighPoolTier1Part2Ratio"
    ),
    highPoolTier2Ratio: document.querySelector("#pointsChallengeHighPoolTier2Ratio"),
    publicTier1WinningLines: document.querySelector("#pointsChallengePublicTier1WinningLines"),
    publicTier2WinningLines: document.querySelector("#pointsChallengePublicTier2WinningLines"),
    publicFixedPayoutTotalPoints: document.querySelector(
      "#pointsChallengePublicFixedPayoutTotalPoints"
    ),
    redInput: document.querySelector("#pointsChallengeRedCandidates"),
    blueInput: document.querySelector("#pointsChallengeBlueCandidates"),
    selectionSummary: document.querySelector("#pointsChallengeSelectionSummary"),
    redBoard: document.querySelector("#pointsChallengeRedBoard"),
    blueBoard: document.querySelector("#pointsChallengeBlueBoard"),
    currentPoints: document.querySelector("#pointsChallengeCurrentPoints"),
    theoreticalLines: document.querySelector("#pointsChallengeTheoreticalLines"),
    effectiveLines: document.querySelector("#pointsChallengeEffectiveLines"),
    costEstimate: document.querySelector("#pointsChallengeCostEstimate"),
    refillCount: document.querySelector("#pointsChallengeRefillCount"),
    returnPoints: document.querySelector("#pointsChallengeReturnPoints"),
    bestTier: document.querySelector("#pointsChallengeBestTier"),
    tierCounts: document.querySelector("#pointsChallengeTierCounts"),
    highTierValues: document.querySelector("#pointsChallengeHighTierValues"),
    carryPoolChange: document.querySelector("#pointsChallengeCarryPoolChange"),
    roundSummary: document.querySelector("#pointsChallengeRoundSummary"),
    unitCost: document.querySelector("#pointsChallengeUnitCost"),
    selectionModeBadge: document.querySelector("#pointsChallengeSelectionModeBadge"),
    samplingBadge: document.querySelector("#pointsChallengeSamplingBadge"),
    specialRuleBadge: document.querySelector("#pointsChallengeSpecialRuleBadge"),
    publicWinningModeBadge: document.querySelector("#pointsChallengePublicWinningModeBadge"),
    inspectorTitle: document.querySelector("#pointsChallengeInspectorTitle"),
    inspectorLabel: document.querySelector("#pointsChallengeInspectorLabel"),
    inspectorBody: document.querySelector("#pointsChallengeInspectorBody"),
    customRulesHint: document.querySelector("#pointsChallengeCustomRulesHint"),
    applyCustomRulesButton: document.querySelector("#applyPointsChallengeCustomRules"),
    resetCustomRulesButton: document.querySelector("#resetPointsChallengeCustomRules"),
    ruleTier3: document.querySelector("#pointsChallengeRuleTier3"),
    ruleTier4: document.querySelector("#pointsChallengeRuleTier4"),
    ruleTier5: document.querySelector("#pointsChallengeRuleTier5"),
    ruleTier6: document.querySelector("#pointsChallengeRuleTier6"),
    ruleFuYun: document.querySelector("#pointsChallengeRuleFuYun"),
    baseRatioHint: document.querySelector("#pointsChallengeBaseRatioHint"),
    specialRatioHint: document.querySelector("#pointsChallengeSpecialPoolRatioHint"),
    lowPoolRatioHint: document.querySelector("#pointsChallengeLowPoolRatioHint"),
    highPoolRatioHint: document.querySelector("#pointsChallengeHighPoolRatioHint"),
    runButton: document.querySelector("#runPointsChallengeRound"),
    mobileRunButton: document.querySelector("#runPointsChallengeRoundMobile"),
    resetButton: document.querySelector("#resetPointsChallengeSession"),
    clearButton: document.querySelector("#clearPointsChallengeHistory"),
    error: document.querySelector("#pointsChallengeError"),
    chart: document.querySelector("#pointsChallengeChart"),
    distribution: document.querySelector("#pointsChallengeDistribution"),
    roundsList: document.querySelector("#pointsChallengeRoundsList")
  };
}

function getExplanationMeta(explainKey) {
  return POINTS_FIELD_EXPLANATIONS[explainKey] || POINTS_FIELD_EXPLANATIONS.overview;
}

function findExplainTarget(target, container) {
  if (!(target instanceof Element) || !container) {
    return null;
  }

  return target.closest("[data-explain-key]");
}

function getCurrentPointsChartMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无点数曲线</div>';
  }

  const orderedRounds = rounds.slice().reverse();
  const values = orderedRounds.map((round) => round.afterPoints);
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
    '<svg class="challenge-chart-svg" viewBox="0 0 520 180" aria-label="点数曲线">',
    `<polyline class="challenge-chart-line" points="${points}" />`,
    "</svg>",
    `<div class="challenge-chart-scale"><span>最低 ${minValue.toLocaleString("zh-CN")}</span><span>最高 ${maxValue.toLocaleString("zh-CN")}</span></div>`
  ].join("");
}

function summarizeTierDistribution(rounds) {
  const distribution = createEmptyTierCounts();

  for (const round of rounds || []) {
    if (round?.tierCounts) {
      for (const tierCode of Object.keys(distribution)) {
        distribution[tierCode] += round.tierCounts[tierCode] || 0;
      }
    }
  }

  return distribution;
}

function getDistributionMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无级别分布</div>';
  }

  const distribution = summarizeTierDistribution(rounds);
  const entries = Object.entries(distribution).filter(([, count]) => count > 0);

  if (!entries.length) {
    return '<div class="empty-state">当前记录中还没有命中级别</div>';
  }

  const maxCount = Math.max(...entries.map(([, count]) => count), 1);

  return entries
    .map(([tierCode, count]) => {
      const widthPercent = Math.round((count / maxCount) * 100);

      return [
        '<div class="challenge-distribution-row">',
        `<span>${formatTierLabel(tierCode)}</span>`,
        '<div class="challenge-distribution-bar-track">',
        `<div class="challenge-distribution-bar" style="width:${widthPercent}%"></div>`,
        "</div>",
        `<strong>${count}</strong>`,
        "</div>"
      ].join("");
    })
    .join("");
}

function formatTierCountsInline(tierCounts) {
  const entries = Object.entries(tierCounts || {}).filter(([, count]) => count > 0);

  if (!entries.length) {
    return "本轮未中任何奖级";
  }

  return entries
    .map(([tierCode, count]) => `${formatTierLabel(tierCode)} ${count} 注`)
    .join(" / ");
}

function getRoundsListMarkup(rounds) {
  if (!rounds.length) {
    return '<div class="empty-state">暂无挑战记录</div>';
  }

  return rounds
    .map((round) => {
      const roundTime = new Date(round.createdAt).toLocaleString("zh-CN", {
        hour12: false
      });
      const lineSummary = round.sampled
        ? `理论 ${round.theoreticalLineCount} 注，抽样计奖 ${round.effectiveLineCount} 注`
        : `全量计奖 ${round.effectiveLineCount} 注`;
      const refillText = round.refillApplied
        ? `，回补 ${formatPoints(round.refillPoints)}`
        : "";

      return [
        '<article class="challenge-round-card">',
        '<div class="challenge-round-head">',
        `<strong>第 ${round.roundIndex} 轮</strong>`,
        `<span>${roundTime}</span>`,
        "</div>",
        `<p>${lineSummary}</p>`,
        `<p>消耗 ${formatPoints(round.costPoints)}，返回 ${formatPoints(round.returnPoints)}${refillText}，当前剩余 ${formatPoints(round.afterPoints)}</p>`,
        `<p>最高奖级：${formatTierLabel(round.bestTierCode)}，红球 ${round.bestRedHits}/6，蓝球 ${formatBlueHit(round.bestBlueHit)}</p>`,
        `<p>各奖级中奖：${formatTierCountsInline(round.tierCounts)}</p>`,
        `<p>奖池：${formatPoints(round.carryPoolBeforePoints)} → ${formatPoints(round.carryPoolAfterPoints)}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function formatHighTierValuesText(round) {
  if (!round?.highTierValues) {
    return "尚未开始";
  }

  return `一等奖 ${formatPoints(round.highTierValues.tier1PerLinePoints || 0)} / 二等奖 ${formatPoints(round.highTierValues.tier2PerLinePoints || 0)}`;
}

function formatBestTierText(round) {
  if (!round) {
    return "尚未开始";
  }

  return `${formatTierLabel(round.bestTierCode)} / 红球 ${round.bestRedHits}/6 / 蓝球 ${formatBlueHit(round.bestBlueHit)}`;
}

function formatRoundSummary(round) {
  if (!round) {
    return "尚未开始虚拟点数挑战。";
  }

  const samplingText = round.sampled
    ? `理论 ${round.theoreticalLineCount} 注，经抽样计奖 ${round.effectiveLineCount} 注`
    : `全量计奖 ${round.effectiveLineCount} 注`;
  const refillText = round.refillApplied
    ? `，并触发 ${formatPoints(round.refillPoints)} 的虚拟回补`
    : "";

  return `本轮${samplingText}，消耗 ${formatPoints(round.costPoints)}，返回 ${formatPoints(round.returnPoints)}${refillText}，当前剩余 ${formatPoints(round.afterPoints)}。`;
}

function toNumberInputValue(value, fallback) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toPercentInputValue(value, fallbackPercent) {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return fallbackPercent;
  }

  return Math.max(0, normalized);
}

function ratioToPercent(ratio) {
  return Number((Number(ratio || 0) * 100).toFixed(1));
}

function percentToRatio(percent) {
  return Math.max(0, Number(percent || 0)) / 100;
}

function createCustomRulesDraft(sourceState) {
  const fixedTierPoints =
    sourceState?.fixedTierPoints || DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints;
  const floatingScenario =
    sourceState?.floatingScenario || DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario;

  return {
    tier3Points: fixedTierPoints[REALISTIC_TIER_CODES.TIER_3] || 0,
    tier4Points: fixedTierPoints[REALISTIC_TIER_CODES.TIER_4] || 0,
    tier5Points: fixedTierPoints[REALISTIC_TIER_CODES.TIER_5] || 0,
    tier6Points: fixedTierPoints[REALISTIC_TIER_CODES.TIER_6] || 0,
    fuYunPoints: fixedTierPoints[REALISTIC_TIER_CODES.FU_YUN] || 0,
    currentPrizePoolRatio: ratioToPercent(floatingScenario.currentPrizePoolRatio),
    regulationFundRatio: ratioToPercent(floatingScenario.regulationFundRatio),
    specialTier1Part2Ratio: ratioToPercent(floatingScenario.specialTier1Part2Ratio),
    specialTier2Ratio: ratioToPercent(floatingScenario.specialTier2Ratio),
    lowPoolTier1Ratio: ratioToPercent(floatingScenario.lowPoolTier1Ratio),
    lowPoolTier2Ratio: ratioToPercent(floatingScenario.lowPoolTier2Ratio),
    highPoolTier1Part1Ratio: ratioToPercent(floatingScenario.highPoolTier1Part1Ratio),
    highPoolTier1Part2Ratio: ratioToPercent(floatingScenario.highPoolTier1Part2Ratio),
    highPoolTier2Ratio: ratioToPercent(floatingScenario.highPoolTier2Ratio)
  };
}

function formatPercentLabel(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function setRatioHint(element, { valid, text }) {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.classList.remove("is-valid", "is-invalid");
  element.classList.add(valid ? "is-valid" : "is-invalid");
}

export function initRealisticPointsChallengeUI({ storage, getHistoryKeySet }) {
  const elements = getElements();
  const requiredEntries = Object.entries(elements).filter(([, value]) => !value);

  if (requiredEntries.length) {
    console.error(
      "Points challenge init failed, missing elements:",
      requiredEntries.map(([key]) => key)
    );
    return {
      refresh() {},
      getActiveModeTab() {
        return MODE_TABS.MATCH_LAB;
      },
      setActiveModeTab() {}
    };
  }

  let sessionState = loadPointsChallengeState(storage);
  let selectedReds = [];
  let selectedBlues = [];
  let lastRound = sessionState.rounds[0] || null;
  let currentExplainKey = "overview";
  let customRulesDraft = createCustomRulesDraft(sessionState);

  function setChallengeError(message) {
    elements.error.textContent = message || "";
  }

  function setInspector(explainKey) {
    currentExplainKey = explainKey || "overview";
    const meta = getExplanationMeta(currentExplainKey);

    elements.inspectorTitle.textContent = meta.title;
    elements.inspectorLabel.textContent =
      currentExplainKey === "overview"
        ? "当前未选中字段"
        : `当前说明：${meta.title}`;
    elements.inspectorBody.textContent = meta.body;
  }

  function getCurrentConfig() {
    return resolveChallengeConfig({
      ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
      initialPoints: sessionState.initialPoints,
      selectionMode: SELECTION_MODES.COMPOUND,
      multiplier: sessionState.multiplier,
      sampling: sessionState.sampling,
      refill: sessionState.refill,
      fixedTierPoints: sessionState.fixedTierPoints,
      floatingScenario: sessionState.floatingScenario
    });
  }

  function saveSession() {
    sessionState = savePointsChallengeState(storage, sessionState, getCurrentConfig());
  }

  function isSameNumberValue(left, right) {
    return Math.abs(Number(left || 0) - Number(right || 0)) < 0.0001;
  }

  function buildAppliedCustomRulesSnapshot(state) {
    return {
      tier3Points: state.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_3] || 0,
      tier4Points: state.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_4] || 0,
      tier5Points: state.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_5] || 0,
      tier6Points: state.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_6] || 0,
      fuYunPoints: state.fixedTierPoints?.[REALISTIC_TIER_CODES.FU_YUN] || 0,
      currentPrizePoolRatio:
        ratioToPercent(state.floatingScenario?.currentPrizePoolRatio),
      regulationFundRatio:
        ratioToPercent(state.floatingScenario?.regulationFundRatio),
      specialTier1Part2Ratio:
        ratioToPercent(state.floatingScenario?.specialTier1Part2Ratio),
      specialTier2Ratio: ratioToPercent(state.floatingScenario?.specialTier2Ratio),
      lowPoolTier1Ratio: ratioToPercent(state.floatingScenario?.lowPoolTier1Ratio),
      lowPoolTier2Ratio: ratioToPercent(state.floatingScenario?.lowPoolTier2Ratio),
      highPoolTier1Part1Ratio:
        ratioToPercent(state.floatingScenario?.highPoolTier1Part1Ratio),
      highPoolTier1Part2Ratio:
        ratioToPercent(state.floatingScenario?.highPoolTier1Part2Ratio),
      highPoolTier2Ratio:
        ratioToPercent(state.floatingScenario?.highPoolTier2Ratio)
    };
  }

  function isDraftApplied() {
    const appliedSnapshot = buildAppliedCustomRulesSnapshot(sessionState);

    return Object.keys(appliedSnapshot).every((key) =>
      isSameNumberValue(customRulesDraft[key], appliedSnapshot[key])
    );
  }

  function isUsingDefaultCustomRules() {
    const defaultSnapshot = createCustomRulesDraft({
      fixedTierPoints: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints,
      floatingScenario: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario
    });
    const appliedSnapshot = buildAppliedCustomRulesSnapshot(sessionState);

    return Object.keys(defaultSnapshot).every((key) =>
      isSameNumberValue(defaultSnapshot[key], appliedSnapshot[key])
    );
  }

  function syncCustomInputsFromDraft() {
    elements.tier3Points.value = customRulesDraft.tier3Points;
    elements.tier4Points.value = customRulesDraft.tier4Points;
    elements.tier5Points.value = customRulesDraft.tier5Points;
    elements.tier6Points.value = customRulesDraft.tier6Points;
    elements.fuYunPoints.value = customRulesDraft.fuYunPoints;
    elements.currentPrizePoolRatio.value = customRulesDraft.currentPrizePoolRatio;
    elements.regulationFundRatio.value = customRulesDraft.regulationFundRatio;
    elements.specialTier1Part2Ratio.value = customRulesDraft.specialTier1Part2Ratio;
    elements.specialTier2Ratio.value = customRulesDraft.specialTier2Ratio;
    elements.lowPoolTier1Ratio.value = customRulesDraft.lowPoolTier1Ratio;
    elements.lowPoolTier2Ratio.value = customRulesDraft.lowPoolTier2Ratio;
    elements.highPoolTier1Part1Ratio.value = customRulesDraft.highPoolTier1Part1Ratio;
    elements.highPoolTier1Part2Ratio.value = customRulesDraft.highPoolTier1Part2Ratio;
    elements.highPoolTier2Ratio.value = customRulesDraft.highPoolTier2Ratio;
  }

  function renderRuleTable() {
    elements.ruleTier3.textContent = formatPoints(
      sessionState.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_3] || 0
    );
    elements.ruleTier4.textContent = formatPoints(
      sessionState.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_4] || 0
    );
    elements.ruleTier5.textContent = formatPoints(
      sessionState.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_5] || 0
    );
    elements.ruleTier6.textContent = formatPoints(
      sessionState.fixedTierPoints?.[REALISTIC_TIER_CODES.TIER_6] || 0
    );
    elements.ruleFuYun.textContent = formatPoints(
      sessionState.fixedTierPoints?.[REALISTIC_TIER_CODES.FU_YUN] || 0
    );
  }

  function getCustomRulesHintText() {
    if (!isDraftApplied()) {
      return "你有未应用的自定义规则。点击“应用自定义并重新开始”后，会清空本局点数、回补次数和挑战记录。";
    }

    if (isUsingDefaultCustomRules()) {
      return "当前使用默认计奖规则。应用后会清空本局点数、回补次数和挑战记录。";
    }

    return "当前使用自定义计奖规则。再次应用或恢复默认时，会重新开始本局挑战。";
  }

  function getCustomRatioValidation() {
    const baseTotal =
      toPercentInputValue(customRulesDraft.currentPrizePoolRatio, 0) +
      toPercentInputValue(customRulesDraft.regulationFundRatio, 0);
    const specialTotal =
      toPercentInputValue(customRulesDraft.specialTier1Part2Ratio, 0) +
      toPercentInputValue(customRulesDraft.specialTier2Ratio, 0);
    const lowPoolTotal =
      toPercentInputValue(customRulesDraft.lowPoolTier1Ratio, 0) +
      toPercentInputValue(customRulesDraft.lowPoolTier2Ratio, 0);
    const highPoolTotal =
      toPercentInputValue(customRulesDraft.highPoolTier1Part1Ratio, 0) +
      toPercentInputValue(customRulesDraft.highPoolTier1Part2Ratio, 0) +
      toPercentInputValue(customRulesDraft.highPoolTier2Ratio, 0);

    return {
      baseTotal,
      specialTotal,
      lowPoolTotal,
      highPoolTotal,
      baseValid: baseTotal <= 100,
      specialValid: isSameNumberValue(specialTotal, 100),
      lowPoolValid: isSameNumberValue(lowPoolTotal, 100),
      highPoolValid: isSameNumberValue(highPoolTotal, 100)
    };
  }

  function renderCustomRatioHints() {
    const validation = getCustomRatioValidation();
    const baseRemaining = Math.max(0, 100 - validation.baseTotal);
    const specialDelta = validation.specialTotal - 100;
    const lowPoolDelta = validation.lowPoolTotal - 100;
    const highPoolDelta = validation.highPoolTotal - 100;

    setRatioHint(elements.baseRatioHint, {
      valid: validation.baseValid,
      text: validation.baseValid
        ? `当前合计 ${formatPercentLabel(validation.baseTotal)}，剩余 ${formatPercentLabel(baseRemaining)} 未计入奖池或调节基金。`
        : `当前合计 ${formatPercentLabel(validation.baseTotal)}，已超出 ${formatPercentLabel(
            validation.baseTotal - 100
          )}。`
    });
    setRatioHint(elements.specialRatioHint, {
      valid: validation.specialValid,
      text: validation.specialValid
        ? `当前合计 ${formatPercentLabel(validation.specialTotal)}，可以直接应用。`
        : specialDelta < 0
          ? `当前合计 ${formatPercentLabel(validation.specialTotal)}，还差 ${formatPercentLabel(
              Math.abs(specialDelta)
            )}。`
          : `当前合计 ${formatPercentLabel(validation.specialTotal)}，超出 ${formatPercentLabel(
              specialDelta
            )}。`
    });
    setRatioHint(elements.lowPoolRatioHint, {
      valid: validation.lowPoolValid,
      text: validation.lowPoolValid
        ? `当前合计 ${formatPercentLabel(validation.lowPoolTotal)}，可以直接应用。`
        : lowPoolDelta < 0
          ? `当前合计 ${formatPercentLabel(validation.lowPoolTotal)}，还差 ${formatPercentLabel(
              Math.abs(lowPoolDelta)
            )}。`
          : `当前合计 ${formatPercentLabel(validation.lowPoolTotal)}，超出 ${formatPercentLabel(
              lowPoolDelta
            )}。`
    });
    setRatioHint(elements.highPoolRatioHint, {
      valid: validation.highPoolValid,
      text: validation.highPoolValid
        ? `当前合计 ${formatPercentLabel(validation.highPoolTotal)}，可以直接应用。`
        : highPoolDelta < 0
          ? `当前合计 ${formatPercentLabel(validation.highPoolTotal)}，还差 ${formatPercentLabel(
              Math.abs(highPoolDelta)
            )}。`
          : `当前合计 ${formatPercentLabel(validation.highPoolTotal)}，超出 ${formatPercentLabel(
              highPoolDelta
            )}。`
    });

    return validation;
  }

  function buildConfigWithCustomRulesDraft() {
    const tier3Points = toNumberInputValue(
      customRulesDraft.tier3Points,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
        REALISTIC_TIER_CODES.TIER_3
      ]
    );
    const tier4Points = toNumberInputValue(
      customRulesDraft.tier4Points,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
        REALISTIC_TIER_CODES.TIER_4
      ]
    );
    const tier5Points = toNumberInputValue(
      customRulesDraft.tier5Points,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
        REALISTIC_TIER_CODES.TIER_5
      ]
    );
    const tier6Points = toNumberInputValue(
      customRulesDraft.tier6Points,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
        REALISTIC_TIER_CODES.TIER_6
      ]
    );
    const fuYunPoints = toNumberInputValue(
      customRulesDraft.fuYunPoints,
      DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
        REALISTIC_TIER_CODES.FU_YUN
      ]
    );
    const currentPrizePoolRatio = toPercentInputValue(
      customRulesDraft.currentPrizePoolRatio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.currentPrizePoolRatio)
    );
    const regulationFundRatio = toPercentInputValue(
      customRulesDraft.regulationFundRatio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.regulationFundRatio)
    );
    const specialTier1Part2Ratio = toPercentInputValue(
      customRulesDraft.specialTier1Part2Ratio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.specialTier1Part2Ratio)
    );
    const specialTier2Ratio = toPercentInputValue(
      customRulesDraft.specialTier2Ratio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.specialTier2Ratio)
    );
    const lowPoolTier1Ratio = toPercentInputValue(
      customRulesDraft.lowPoolTier1Ratio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.lowPoolTier1Ratio)
    );
    const lowPoolTier2Ratio = toPercentInputValue(
      customRulesDraft.lowPoolTier2Ratio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.lowPoolTier2Ratio)
    );
    const highPoolTier1Part1Ratio = toPercentInputValue(
      customRulesDraft.highPoolTier1Part1Ratio,
      ratioToPercent(
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.highPoolTier1Part1Ratio
      )
    );
    const highPoolTier1Part2Ratio = toPercentInputValue(
      customRulesDraft.highPoolTier1Part2Ratio,
      ratioToPercent(
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.highPoolTier1Part2Ratio
      )
    );
    const highPoolTier2Ratio = toPercentInputValue(
      customRulesDraft.highPoolTier2Ratio,
      ratioToPercent(DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario.highPoolTier2Ratio)
    );

    const ratioValidation = getCustomRatioValidation();

    if (!ratioValidation.baseValid) {
      throw new Error("当期奖池计提比例与调节基金计提比例之和不能超过 100%。");
    }
    if (!ratioValidation.specialValid) {
      throw new Error("特别规则奖池比例合计必须为 100%。");
    }
    if (!ratioValidation.lowPoolValid) {
      throw new Error("常规低奖池比例合计必须为 100%。");
    }
    if (!ratioValidation.highPoolValid) {
      throw new Error("常规高奖池比例合计必须为 100%。");
    }

    return resolveChallengeConfig({
      ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
      initialPoints: sessionState.initialPoints,
      selectionMode: SELECTION_MODES.COMPOUND,
      multiplier: sessionState.multiplier,
      sampling: sessionState.sampling,
      refill: sessionState.refill,
      fixedTierPoints: {
        [REALISTIC_TIER_CODES.TIER_3]: tier3Points,
        [REALISTIC_TIER_CODES.TIER_4]: tier4Points,
        [REALISTIC_TIER_CODES.TIER_5]: tier5Points,
        [REALISTIC_TIER_CODES.TIER_6]: tier6Points,
        [REALISTIC_TIER_CODES.FU_YUN]: fuYunPoints
      },
      floatingScenario: {
        ...sessionState.floatingScenario,
        currentPrizePoolRatio: percentToRatio(currentPrizePoolRatio),
        regulationFundRatio: percentToRatio(regulationFundRatio),
        specialTier1Part2Ratio: percentToRatio(specialTier1Part2Ratio),
        specialTier2Ratio: percentToRatio(specialTier2Ratio),
        lowPoolTier1Ratio: percentToRatio(lowPoolTier1Ratio),
        lowPoolTier2Ratio: percentToRatio(lowPoolTier2Ratio),
        highPoolTier1Part1Ratio: percentToRatio(highPoolTier1Part1Ratio),
        highPoolTier1Part2Ratio: percentToRatio(highPoolTier1Part2Ratio),
        highPoolTier2Ratio: percentToRatio(highPoolTier2Ratio)
      }
    });
  }

  function restartSessionWithConfig(nextConfig) {
    const nextState = createDefaultPointsChallengeState(nextConfig);

    sessionState = nextState;
    sessionState.activeModeTab = MODE_TABS.POINTS_CHALLENGE;
    lastRound = null;
    customRulesDraft = createCustomRulesDraft(sessionState);
    saveSession();
    renderState();
  }

  function renderBoards() {
    elements.redBoard.innerHTML = buildBoardMarkup("red", RED_MAX, selectedReds);
    elements.blueBoard.innerHTML = buildBoardMarkup("blue", BLUE_MAX, selectedBlues);
  }

  function readCandidateSelection() {
    const redResult = parseLooseCandidateInput(elements.redInput.value, {
      min: RED_MIN,
      max: RED_MAX,
      label: "红球"
    });

    if (!redResult.valid) {
      return { valid: false, error: redResult.error };
    }

    const blueResult = parseLooseCandidateInput(elements.blueInput.value, {
      min: BLUE_MIN,
      max: BLUE_MAX,
      label: "蓝球"
    });

    if (!blueResult.valid) {
      return { valid: false, error: blueResult.error };
    }

    return validateSelection({
      mode: SELECTION_MODES.COMPOUND,
      redCandidates: redResult.value,
      blueCandidates: blueResult.value,
      multiplier: sessionState.multiplier
    });
  }

  function getLineEstimate() {
    const validation = readCandidateSelection();

    if (!validation.valid) {
      return {
        valid: false,
        message: validation.error,
        theoreticalLineCount: 0,
        effectiveLineCount: 0,
        costPoints: 0,
        sampled: false,
        replacementMode: REPLACEMENT_MODES.NONE,
        runBlockedReason: validation.error
      };
    }

    const selection = validation.value;
    const config = getCurrentConfig();
    const theoreticalLineCount = countSelectionLines(selection);
    let effectiveLineCount = theoreticalLineCount;
    let sampled = false;
    let replacementMode = REPLACEMENT_MODES.NONE;
    let runBlockedReason = "";

    if (config.sampling.capSamplingEnabled) {
      if (theoreticalLineCount > config.sampling.capLimit) {
        effectiveLineCount = config.sampling.capLimit;
        sampled = true;
        replacementMode = config.sampling.replacementMode;
      }
    } else if (theoreticalLineCount > config.sampling.hardGenerationLimit) {
      runBlockedReason = "组合注数过多，请开启上限抽样或缩小候选号池。";
    }

    return {
      valid: !runBlockedReason,
      selection,
      theoreticalLineCount,
      effectiveLineCount,
      costPoints: effectiveLineCount * config.unitCostPoints * sessionState.multiplier,
      sampled,
      replacementMode,
      runBlockedReason
    };
  }

  function updateRunButtons(canRun) {
    elements.runButton.disabled = !canRun;
    elements.mobileRunButton.disabled = !canRun;
  }

  function renderState() {
    const config = getCurrentConfig();
    const historyKeySet = getHistoryKeySet();
    const lineEstimate = getLineEstimate();
    const rounds = sessionState.rounds || [];

    elements.disclaimer.textContent = POINTS_CHALLENGE_DISCLAIMER;
    elements.initialPoints.value = sessionState.initialPoints;
    elements.samplingEnabled.checked = sessionState.sampling.capSamplingEnabled;
    elements.replacementMode.value = sessionState.sampling.replacementMode;
    elements.capLimit.value = sessionState.sampling.capLimit;
    elements.refillEnabled.checked = sessionState.refill.enabled;
    elements.refillMode.value = sessionState.refill.mode;
    elements.fixedRefillPoints.value = sessionState.refill.fixedRefillPoints;
    elements.maxRefills.value = sessionState.refill.maxRefillsPerSession;
    elements.specialRuleMode.value = sessionState.floatingScenario.specialRuleMode;
    elements.currentSalesPoints.value = sessionState.floatingScenario.currentSalesPoints;
    elements.carryPoolBeforePoints.value =
      sessionState.floatingScenario.carryPoolBeforePoints;
    elements.publicTier1WinningLines.value =
      sessionState.floatingScenario.publicTier1WinningLines;
    elements.publicTier2WinningLines.value =
      sessionState.floatingScenario.publicTier2WinningLines;
    elements.publicFixedPayoutTotalPoints.value =
      sessionState.floatingScenario.publicFixedPayoutTotalPoints;
    syncCustomInputsFromDraft();

    elements.selectionSummary.textContent = `已选红球 ${selectedReds.length} 个，已选蓝球 ${selectedBlues.length} 个`;
    elements.unitCost.textContent = formatPoints(config.unitCostPoints);
    elements.selectionModeBadge.textContent = "复式";
    elements.publicWinningModeBadge.textContent = "手动输入";
    elements.customRulesHint.textContent = getCustomRulesHintText();
    const customRatioValidation = renderCustomRatioHints();
    elements.applyCustomRulesButton.disabled =
      isDraftApplied() ||
      !customRatioValidation.baseValid ||
      !customRatioValidation.specialValid ||
      !customRatioValidation.lowPoolValid ||
      !customRatioValidation.highPoolValid;
    elements.resetCustomRulesButton.disabled =
      isDraftApplied() && isUsingDefaultCustomRules();
    elements.currentPoints.textContent = formatPoints(sessionState.currentPoints);
    elements.refillCount.textContent = `${sessionState.refillCountInSession} / ${sessionState.refill.maxRefillsPerSession} 次`;
    elements.returnPoints.textContent = lastRound
      ? formatPoints(lastRound.returnPoints)
      : "尚未开始";
    elements.bestTier.textContent = formatBestTierText(lastRound);
    elements.tierCounts.textContent = formatTierCountsInline(lastRound?.tierCounts);
    elements.highTierValues.textContent = formatHighTierValuesText(lastRound);
    elements.carryPoolChange.textContent = lastRound
      ? `${formatPoints(lastRound.carryPoolBeforePoints)} → ${formatPoints(lastRound.carryPoolAfterPoints)}`
      : "尚未开始";
    elements.roundSummary.textContent = formatRoundSummary(lastRound);

    if (!lineEstimate.valid) {
      elements.theoreticalLines.textContent = "请先完成候选号输入";
      elements.effectiveLines.textContent = "—";
      elements.costEstimate.textContent = "—";
      elements.samplingBadge.textContent = sessionState.sampling.capSamplingEnabled
        ? "等待候选号"
        : "已关闭";
    } else {
      elements.theoreticalLines.textContent = `${lineEstimate.theoreticalLineCount.toLocaleString("zh-CN")} 注`;
      elements.effectiveLines.textContent = lineEstimate.sampled
        ? `${lineEstimate.effectiveLineCount.toLocaleString("zh-CN")} 注（${lineEstimate.replacementMode === REPLACEMENT_MODES.WITH_REPLACEMENT ? "有放回" : "无放回"}）`
        : `${lineEstimate.effectiveLineCount.toLocaleString("zh-CN")} 注`;
      elements.costEstimate.textContent = formatPoints(lineEstimate.costPoints);
      elements.samplingBadge.textContent = lineEstimate.sampled
        ? `已触发 / ${lineEstimate.replacementMode === REPLACEMENT_MODES.WITH_REPLACEMENT ? "有放回" : "无放回"}`
        : sessionState.sampling.capSamplingEnabled
          ? "开启但未触发"
          : "已关闭";
    }

    elements.specialRuleBadge.textContent =
      sessionState.floatingScenario.specialRuleMode === "auto"
        ? lastRound
          ? `自动（本轮${lastRound.specialRuleActive ? "开启" : "关闭"}）`
          : "自动判断"
        : sessionState.floatingScenario.specialRuleMode === "forceOn"
          ? "强制开启"
          : "强制关闭";

    let canRun = true;
    let statusMessage = "当前设置可以运行虚拟点数挑战。";

    if (!historyKeySet?.size) {
      canRun = false;
      statusMessage = "请先加载历史开奖数据后再运行虚拟点数挑战。";
    } else if (!lineEstimate.valid) {
      canRun = false;
      statusMessage = lineEstimate.runBlockedReason || "请先完成候选号输入。";
    } else if (sessionState.currentPoints < lineEstimate.costPoints) {
      if (!sessionState.refill.enabled) {
        canRun = false;
        statusMessage = "点数不足，无法运行本轮挑战。";
      } else if (
        sessionState.refillCountInSession >= sessionState.refill.maxRefillsPerSession
      ) {
        canRun = false;
        statusMessage = "点数不足，且本局可用回补次数已用完。";
      } else {
        const projectedPoints =
          sessionState.refill.mode === "addFixedAmount"
            ? sessionState.currentPoints + sessionState.refill.fixedRefillPoints
            : sessionState.initialPoints;

        if (projectedPoints < lineEstimate.costPoints) {
          canRun = false;
          statusMessage = "点数回补后仍不足以覆盖本轮消耗，请缩小组合。";
        } else {
          statusMessage = "点数不足时会自动触发一次虚拟回补，然后继续结算本轮挑战。";
        }
      }
    }

    elements.statusMessage.textContent = statusMessage;
    updateRunButtons(canRun);
    renderBoards();
    renderRuleTable();
    elements.chart.innerHTML = getCurrentPointsChartMarkup(rounds);
    elements.distribution.innerHTML = getDistributionMarkup(rounds);
    elements.roundsList.innerHTML = getRoundsListMarkup(rounds);
    setInspector(currentExplainKey);
  }

  function syncSelectedFromInputs() {
    const redResult = parseLooseCandidateInput(elements.redInput.value, {
      min: RED_MIN,
      max: RED_MAX,
      label: "红球"
    });
    const blueResult = parseLooseCandidateInput(elements.blueInput.value, {
      min: BLUE_MIN,
      max: BLUE_MAX,
      label: "蓝球"
    });

    if (redResult.valid) {
      selectedReds = redResult.value;
    }
    if (blueResult.valid) {
      selectedBlues = blueResult.value;
    }

    renderState();
  }

  function syncInputsFromSelection() {
    elements.redInput.value = selectedReds.join(",");
    elements.blueInput.value = selectedBlues.join(",");
    renderState();
  }

  function updateCustomRulesDraft(mutator) {
    mutator();
    renderState();
  }

  function handleBoardClick(event) {
    const button = event.target.closest("[data-ball-value]");
    if (!button) {
      return;
    }

    const color = button.dataset.ballColor;
    const value = Number(button.dataset.ballValue);
    const current = color === "red" ? selectedReds : selectedBlues;

    if (current.includes(value)) {
      if (color === "red") {
        selectedReds = current.filter((item) => item !== value);
      } else {
        selectedBlues = current.filter((item) => item !== value);
      }
    } else if (color === "red") {
      selectedReds = current.concat(value).sort((left, right) => left - right);
    } else {
      selectedBlues = current.concat(value).sort((left, right) => left - right);
    }

    setChallengeError("");
    syncInputsFromSelection();
  }

  function updateNumberState(mutator) {
    mutator();
    saveSession();
    renderState();
  }

  function runRound() {
    setChallengeError("");

    try {
      const validation = readCandidateSelection();
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const historyKeySet = getHistoryKeySet();
      if (!historyKeySet?.size) {
        throw new Error("请先加载历史开奖数据后再运行虚拟点数挑战。");
      }

      const config = getCurrentConfig();
      const target = createNonHistoricalTarget(historyKeySet);
      const roundResult = settlePointsChallengeRound({
        selection: validation.value,
        target,
        currentPoints: sessionState.currentPoints,
        refillCountInSession: sessionState.refillCountInSession,
        previousSpecialState: sessionState.specialRuleActive,
        roundIndex: (sessionState.rounds?.length || 0) + 1,
        config
      });

      sessionState = commitPointsChallengeRound(sessionState, roundResult, config);
      lastRound = roundResult;
      saveSession();
      renderState();
    } catch (error) {
      setChallengeError(error instanceof Error ? error.message : "挑战运行失败");
      renderState();
    }
  }

  function resetSession() {
    setChallengeError("");
    const currentConfig = getCurrentConfig();

    sessionState = createDefaultPointsChallengeState(currentConfig);
    sessionState.activeModeTab = MODE_TABS.POINTS_CHALLENGE;
    sessionState.sampling = {
      ...currentConfig.sampling
    };
    sessionState.refill = {
      ...currentConfig.refill
    };
    sessionState.floatingScenario = {
      ...currentConfig.floatingScenario
    };
    sessionState.fixedTierPoints = {
      ...currentConfig.fixedTierPoints
    };
    customRulesDraft = createCustomRulesDraft(sessionState);
    lastRound = null;
    saveSession();
    renderState();
  }

  function clearHistory() {
    setChallengeError("");
    sessionState.rounds = [];
    lastRound = null;
    saveSession();
    renderState();
  }

  function applyCustomRules() {
    setChallengeError("");

    try {
      if (isDraftApplied()) {
        setChallengeError("当前自定义规则未发生变化。");
        renderState();
        return;
      }

      const nextConfig = buildConfigWithCustomRulesDraft();
      restartSessionWithConfig(nextConfig);
    } catch (error) {
      setChallengeError(error instanceof Error ? error.message : "自定义规则应用失败");
      renderState();
    }
  }

  function resetCustomRules() {
    setChallengeError("");
    customRulesDraft = createCustomRulesDraft({
      fixedTierPoints: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints,
      floatingScenario: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.floatingScenario
    });

    try {
      if (isDraftApplied() && isUsingDefaultCustomRules()) {
        setChallengeError("当前已经是默认计奖规则。");
        renderState();
        return;
      }

      const nextConfig = buildConfigWithCustomRulesDraft();
      restartSessionWithConfig(nextConfig);
    } catch (error) {
      setChallengeError(error instanceof Error ? error.message : "默认规则恢复失败");
      renderState();
    }
  }

  function handleExplainEvent(event) {
    const explainTarget = findExplainTarget(event.target, elements.panel);
    if (!explainTarget) {
      return;
    }

    setInspector(explainTarget.dataset.explainKey);
  }

  elements.panel.addEventListener("focusin", handleExplainEvent);
  elements.panel.addEventListener("mouseover", handleExplainEvent);
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
  elements.initialPoints.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.initialPoints = toNumberInputValue(
        elements.initialPoints.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.initialPoints
      );
    });
  });
  elements.samplingEnabled.addEventListener("change", () => {
    updateNumberState(() => {
      sessionState.sampling.capSamplingEnabled = elements.samplingEnabled.checked;
    });
  });
  elements.replacementMode.addEventListener("change", () => {
    updateNumberState(() => {
      sessionState.sampling.replacementMode = elements.replacementMode.value;
    });
  });
  elements.capLimit.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.sampling.capLimit = toNumberInputValue(
        elements.capLimit.value,
        DEFAULT_SAMPLING_CONFIG.capLimit
      );
    });
  });
  elements.refillEnabled.addEventListener("change", () => {
    updateNumberState(() => {
      sessionState.refill.enabled = elements.refillEnabled.checked;
    });
  });
  elements.refillMode.addEventListener("change", () => {
    updateNumberState(() => {
      sessionState.refill.mode = elements.refillMode.value;
    });
  });
  elements.fixedRefillPoints.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.refill.fixedRefillPoints = toNumberInputValue(
        elements.fixedRefillPoints.value,
        DEFAULT_POINT_REFILL_CONFIG.fixedRefillPoints
      );
    });
  });
  elements.maxRefills.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.refill.maxRefillsPerSession = toNumberInputValue(
        elements.maxRefills.value,
        DEFAULT_POINT_REFILL_CONFIG.maxRefillsPerSession
      );
    });
  });
  elements.specialRuleMode.addEventListener("change", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.specialRuleMode = elements.specialRuleMode.value;
    });
  });
  elements.currentSalesPoints.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.currentSalesPoints = toNumberInputValue(
        elements.currentSalesPoints.value,
        DEFAULT_FLOATING_SCENARIO.currentSalesPoints
      );
    });
  });
  elements.carryPoolBeforePoints.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.carryPoolBeforePoints = toNumberInputValue(
        elements.carryPoolBeforePoints.value,
        DEFAULT_FLOATING_SCENARIO.carryPoolBeforePoints
      );
    });
  });
  elements.publicTier1WinningLines.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.publicTier1WinningLines = toNumberInputValue(
        elements.publicTier1WinningLines.value,
        DEFAULT_FLOATING_SCENARIO.publicTier1WinningLines
      );
    });
  });
  elements.publicTier2WinningLines.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.publicTier2WinningLines = toNumberInputValue(
        elements.publicTier2WinningLines.value,
        DEFAULT_FLOATING_SCENARIO.publicTier2WinningLines
      );
    });
  });
  elements.publicFixedPayoutTotalPoints.addEventListener("input", () => {
    updateNumberState(() => {
      sessionState.floatingScenario.publicFixedPayoutTotalPoints = toNumberInputValue(
        elements.publicFixedPayoutTotalPoints.value,
        DEFAULT_FLOATING_SCENARIO.publicFixedPayoutTotalPoints
      );
    });
  });
  elements.tier3Points.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.tier3Points = toNumberInputValue(
        elements.tier3Points.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
          REALISTIC_TIER_CODES.TIER_3
        ]
      );
    });
  });
  elements.tier4Points.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.tier4Points = toNumberInputValue(
        elements.tier4Points.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
          REALISTIC_TIER_CODES.TIER_4
        ]
      );
    });
  });
  elements.tier5Points.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.tier5Points = toNumberInputValue(
        elements.tier5Points.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
          REALISTIC_TIER_CODES.TIER_5
        ]
      );
    });
  });
  elements.tier6Points.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.tier6Points = toNumberInputValue(
        elements.tier6Points.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
          REALISTIC_TIER_CODES.TIER_6
        ]
      );
    });
  });
  elements.fuYunPoints.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.fuYunPoints = toNumberInputValue(
        elements.fuYunPoints.value,
        DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.fixedTierPoints[
          REALISTIC_TIER_CODES.FU_YUN
        ]
      );
    });
  });
  elements.currentPrizePoolRatio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.currentPrizePoolRatio = toPercentInputValue(
        elements.currentPrizePoolRatio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.currentPrizePoolRatio)
      );
    });
  });
  elements.regulationFundRatio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.regulationFundRatio = toPercentInputValue(
        elements.regulationFundRatio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.regulationFundRatio)
      );
    });
  });
  elements.specialTier1Part2Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.specialTier1Part2Ratio = toPercentInputValue(
        elements.specialTier1Part2Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.specialTier1Part2Ratio)
      );
    });
  });
  elements.specialTier2Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.specialTier2Ratio = toPercentInputValue(
        elements.specialTier2Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.specialTier2Ratio)
      );
    });
  });
  elements.lowPoolTier1Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.lowPoolTier1Ratio = toPercentInputValue(
        elements.lowPoolTier1Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.lowPoolTier1Ratio)
      );
    });
  });
  elements.lowPoolTier2Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.lowPoolTier2Ratio = toPercentInputValue(
        elements.lowPoolTier2Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.lowPoolTier2Ratio)
      );
    });
  });
  elements.highPoolTier1Part1Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.highPoolTier1Part1Ratio = toPercentInputValue(
        elements.highPoolTier1Part1Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.highPoolTier1Part1Ratio)
      );
    });
  });
  elements.highPoolTier1Part2Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.highPoolTier1Part2Ratio = toPercentInputValue(
        elements.highPoolTier1Part2Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.highPoolTier1Part2Ratio)
      );
    });
  });
  elements.highPoolTier2Ratio.addEventListener("input", () => {
    updateCustomRulesDraft(() => {
      customRulesDraft.highPoolTier2Ratio = toPercentInputValue(
        elements.highPoolTier2Ratio.value,
        ratioToPercent(DEFAULT_FLOATING_SCENARIO.highPoolTier2Ratio)
      );
    });
  });
  elements.applyCustomRulesButton.addEventListener("click", applyCustomRules);
  elements.resetCustomRulesButton.addEventListener("click", resetCustomRules);
  elements.runButton.addEventListener("click", runRound);
  elements.mobileRunButton.addEventListener("click", runRound);
  elements.resetButton.addEventListener("click", resetSession);
  elements.clearButton.addEventListener("click", clearHistory);

  setInspector(currentExplainKey);
  renderState();

  return {
    refresh() {
      renderState();
    },
    getActiveModeTab() {
      return sessionState.activeModeTab || MODE_TABS.MATCH_LAB;
    },
    setActiveModeTab(activeModeTab) {
      sessionState.activeModeTab = activeModeTab;
      savePointsChallengeActiveMode(storage, activeModeTab, getCurrentConfig());
    }
  };
}
