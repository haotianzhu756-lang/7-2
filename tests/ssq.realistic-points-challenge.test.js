import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DEFAULT_FLOATING_SCENARIO,
  DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
  FIXED_TIER_POINTS,
  REALISTIC_TIER_CODES,
  REPLACEMENT_MODES,
  SELECTION_MODES,
  allocateFloatingGrossPools,
  applyHighTierCapsAndGuarantees,
  calculateCurrentPrizePools,
  calculateFloatingTierValues,
  calculateLinePointReturn,
  combination,
  countSelectionLines,
  createStandardLineKey,
  generateSelectionLines,
  settlePointsChallengeRound,
  classifyRealisticTier,
  validateSelection
} from "../src/ssq/realistic-points-challenge.js";
import {
  DEFAULT_ACTIVE_MODE_TAB,
  MODE_TABS
} from "../src/ssq/constants.js";

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function createCompoundSelection(redCount, blueCount, multiplier = 1) {
  return {
    mode: SELECTION_MODES.COMPOUND,
    redCandidates: Array.from({ length: redCount }, (_, index) => index + 1),
    blueCandidates: Array.from({ length: blueCount }, (_, index) => index + 1),
    multiplier
  };
}

function createTarget() {
  return {
    reds: [1, 2, 3, 4, 5, 6],
    blue: 1
  };
}

run("默认激活模式是号码实验室", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.equal(DEFAULT_ACTIVE_MODE_TAB, MODE_TABS.MATCH_LAB);
  assert.match(
    html,
    /id="tab-match-lab"[\s\S]*class="mode-tab is-active"[\s\S]*data-mode-tab="match-lab"/
  );
});

run("combination(7, 6) === 7", () => {
  assert.equal(combination(7, 6), 7);
});

run("复式 7 红 + 2 蓝产生 14 注", () => {
  assert.equal(countSelectionLines(createCompoundSelection(7, 2)), 14);
});

run("14 注在倍数 1 下消耗 28 点", () => {
  const result = settlePointsChallengeRound({
    selection: createCompoundSelection(7, 2, 1),
    target: createTarget(),
    currentPoints: 1000,
    roundIndex: 1,
    config: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
    randomFn: () => 0.2
  });

  assert.equal(result.effectiveLineCount, 14);
  assert.equal(result.costPoints, 28);
});

run("胆拖 2 胆 + 6 拖 + 2 蓝产生 30 注", () => {
  assert.equal(
    countSelectionLines({
      mode: SELECTION_MODES.DANTUO,
      redDan: [1, 2],
      redTuo: [3, 4, 5, 6, 7, 8],
      blueCandidates: [1, 2],
      multiplier: 1
    }),
    30
  );
});

run("非法选号返回显式错误", () => {
  const result = validateSelection({
    mode: SELECTION_MODES.COMPOUND,
    redCandidates: [1, 2, 3, 4, 5],
    blueCandidates: [1]
  });

  assert.equal(result.valid, false);
  assert.match(result.error, /至少需要/);
});

run("超出 capLimit 且启用抽样时，计奖注数等于 capLimit", () => {
  const result = generateSelectionLines(
    createCompoundSelection(10, 4),
    {
      capSamplingEnabled: true,
      capLimit: 20,
      hardGenerationLimit: 50000,
      replacementMode: REPLACEMENT_MODES.WITHOUT_REPLACEMENT
    },
    () => 0.3
  );

  assert.equal(result.sampled, true);
  assert.equal(result.effectiveLineCount, 20);
});

run("无放回抽样不重复", () => {
  const result = generateSelectionLines(
    createCompoundSelection(10, 4),
    {
      capSamplingEnabled: true,
      capLimit: 20,
      hardGenerationLimit: 50000,
      replacementMode: REPLACEMENT_MODES.WITHOUT_REPLACEMENT
    },
    () => 0.1
  );
  const keys = result.lines.map(createStandardLineKey);

  assert.equal(new Set(keys).size, keys.length);
});

run("有放回抽样允许重复", () => {
  const result = generateSelectionLines(
    createCompoundSelection(10, 4),
    {
      capSamplingEnabled: true,
      capLimit: 6,
      hardGenerationLimit: 50000,
      replacementMode: REPLACEMENT_MODES.WITH_REPLACEMENT
    },
    () => 0
  );
  const keys = result.lines.map(createStandardLineKey);

  assert.equal(new Set(keys).size < keys.length, true);
});

run("关闭抽样且超过 hardGenerationLimit 时阻止运行", () => {
  assert.throws(
    () =>
      generateSelectionLines(createCompoundSelection(20, 16), {
        capSamplingEnabled: false,
        capLimit: 5000,
        hardGenerationLimit: 50000,
        replacementMode: REPLACEMENT_MODES.WITHOUT_REPLACEMENT
      }),
    /组合注数过多/
  );
});

run("回补关闭且点数不足时阻止运行", () => {
  assert.throws(
    () =>
      settlePointsChallengeRound({
        selection: createCompoundSelection(6, 1),
        target: createTarget(),
        currentPoints: 1,
        roundIndex: 1,
        config: DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG
      }),
    /点数不足/
  );
});

run("回补开启且点数不足时先回补再结算", () => {
  const result = settlePointsChallengeRound({
    selection: createCompoundSelection(6, 1),
    target: createTarget(),
    currentPoints: 0,
    roundIndex: 1,
    config: {
      ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
      refill: {
        ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.refill,
        enabled: true,
        mode: "resetToInitial",
        maxRefillsPerSession: 3
      }
    }
  });

  assert.equal(result.refillApplied, true);
  assert.equal(result.refillPoints, 1000);
  assert.equal(result.refillIndexInSession, 1);
});

run("回补次数不能超过本局上限", () => {
  assert.throws(
    () =>
      settlePointsChallengeRound({
        selection: createCompoundSelection(6, 1),
        target: createTarget(),
        currentPoints: 0,
        refillCountInSession: 1,
        roundIndex: 2,
        config: {
          ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
          refill: {
            ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.refill,
            enabled: true,
            mode: "resetToInitial",
            maxRefillsPerSession: 1
          }
        }
      }),
    /回补次数已用完/
  );
});

run("回补记录写入轮次结果", () => {
  const result = settlePointsChallengeRound({
    selection: createCompoundSelection(6, 1),
    target: createTarget(),
    currentPoints: 0,
    roundIndex: 1,
    config: {
      ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG,
      refill: {
        ...DEFAULT_REALISTIC_POINTS_CHALLENGE_CONFIG.refill,
        enabled: true,
        mode: "addFixedAmount",
        fixedRefillPoints: 20
      }
    }
  });

  assert.equal(result.refillApplied, true);
  assert.equal(result.refillPoints, 20);
  assert.equal(result.refillMode, "addFixedAmount");
});

run("奖级分类符合 TASK-06 规则", () => {
  assert.equal(classifyRealisticTier(6, 1), REALISTIC_TIER_CODES.TIER_1);
  assert.equal(classifyRealisticTier(6, 0), REALISTIC_TIER_CODES.TIER_2);
  assert.equal(classifyRealisticTier(5, 1), REALISTIC_TIER_CODES.TIER_3);
  assert.equal(classifyRealisticTier(5, 0), REALISTIC_TIER_CODES.TIER_4);
  assert.equal(classifyRealisticTier(4, 1), REALISTIC_TIER_CODES.TIER_4);
  assert.equal(classifyRealisticTier(4, 0), REALISTIC_TIER_CODES.TIER_5);
  assert.equal(classifyRealisticTier(3, 1), REALISTIC_TIER_CODES.TIER_5);
  assert.equal(classifyRealisticTier(0, 1), REALISTIC_TIER_CODES.TIER_6);
  assert.equal(classifyRealisticTier(1, 1), REALISTIC_TIER_CODES.TIER_6);
  assert.equal(classifyRealisticTier(2, 1), REALISTIC_TIER_CODES.TIER_6);
  assert.equal(classifyRealisticTier(3, 0), REALISTIC_TIER_CODES.NO_TIER);
  assert.equal(
    classifyRealisticTier(3, 0, { specialRuleActive: true }),
    REALISTIC_TIER_CODES.FU_YUN
  );
});

run("固定奖级点数映射正确", () => {
  assert.equal(FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_3], 3000);
  assert.equal(FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_4], 200);
  assert.equal(FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_5], 10);
  assert.equal(FIXED_TIER_POINTS[REALISTIC_TIER_CODES.TIER_6], 5);
  assert.equal(FIXED_TIER_POINTS[REALISTIC_TIER_CODES.FU_YUN], 5);
});

run("自定义固定奖级点数会进入结算", () => {
  const customFixedTierPoints = {
    ...FIXED_TIER_POINTS,
    [REALISTIC_TIER_CODES.TIER_3]: 4321
  };

  assert.equal(
    calculateLinePointReturn({
      tierCode: REALISTIC_TIER_CODES.TIER_3,
      highTierValues: {
        tier1PerLinePoints: 0,
        tier2PerLinePoints: 0
      },
      fixedTierPoints: customFixedTierPoints,
      multiplier: 1
    }),
    4321
  );
});

run("自定义奖池比例会改变奖池分配", () => {
  const scenario = {
    ...DEFAULT_FLOATING_SCENARIO,
    currentSalesPoints: 1000,
    currentPrizePoolRatio: 0.5,
    regulationFundRatio: 0.03,
    carryPoolBeforePoints: 90,
    normalPoolSplitThresholdPoints: 100,
    lowPoolTier1Ratio: 0.6,
    lowPoolTier2Ratio: 0.4
  };
  const prizePools = calculateCurrentPrizePools({
    scenario,
    fixedPayoutTotalPoints: 100
  });
  const grossPools = allocateFloatingGrossPools({
    scenario,
    currentFloatingPoints: prizePools.currentFloatingPoints,
    specialRuleActive: false
  });

  assert.equal(prizePools.currentPrizePoints, 500);
  assert.equal(prizePools.regulationFundInflowPoints, 30);
  assert.equal(prizePools.currentFloatingPoints, 400);
  assert.equal(grossPools.tier1Part1GrossPoints, 330);
  assert.equal(grossPools.tier1Part2GrossPoints, 0);
  assert.equal(grossPools.tier2GrossPoints, 160);
});

run("浮动奖级模型基础数值正确", () => {
  const scenario = {
    ...DEFAULT_FLOATING_SCENARIO,
    currentSalesPoints: 350_000_000,
    carryPoolBeforePoints: 850_000_000,
    publicFixedPayoutTotalPoints: 110_000_000,
    publicTier1WinningLines: 2,
    publicTier2WinningLines: 60,
    specialRuleMode: "forceOff"
  };
  const prizePools = calculateCurrentPrizePools({
    scenario,
    fixedPayoutTotalPoints: 110_000_000
  });
  const grossPools = allocateFloatingGrossPools({
    scenario,
    currentFloatingPoints: prizePools.currentFloatingPoints,
    specialRuleActive: false
  });
  const highTierValues = calculateFloatingTierValues({
    scenario,
    grossPools,
    winningCounts: {
      tier1WinningLines: 2,
      tier2WinningLines: 60
    }
  });

  assert.equal(prizePools.currentPrizePoints, 171_500_000);
  assert.equal(prizePools.currentFloatingPoints, 61_500_000);
  assert.equal(grossPools.tier1Part1GrossPoints, 883_825_000);
  assert.equal(grossPools.tier1Part2GrossPoints, 12_300_000);
  assert.equal(grossPools.tier2GrossPoints, 15_375_000);
  assert.equal(Number.isInteger(highTierValues.tier1PerLinePoints), true);
  assert.equal(Number.isInteger(highTierValues.tier2PerLinePoints), true);
  assert.equal(highTierValues.tier1PerLinePoints >= 0, true);
  assert.equal(highTierValues.tier2PerLinePoints >= 0, true);
});

run("总封顶优先于保底规则", () => {
  const result = applyHighTierCapsAndGuarantees({
    scenario: DEFAULT_FLOATING_SCENARIO,
    tier1PerLine: 10_000_000,
    tier2PerLine: 10_000_000,
    tier1Count: 50,
    tier2Count: 20
  });

  assert.equal(result.notes.includes("TIER_1_TOTAL_CAP_APPLIED"), true);
  assert.equal(result.notes.includes("TIER_2_TOTAL_CAP_APPLIED"), true);
  assert.equal(result.notes.includes("TIER_2_GUARANTEE_APPLIED"), false);
});

run("保底规则在未触发总封顶时生效", () => {
  const result = applyHighTierCapsAndGuarantees({
    scenario: DEFAULT_FLOATING_SCENARIO,
    tier1PerLine: 5000,
    tier2PerLine: 3000,
    tier1Count: 1,
    tier2Count: 1
  });

  assert.equal(result.tier2PerLinePoints, 6000);
  assert.equal(result.tier1PerLinePoints, 12000);
  assert.equal(result.notes.includes("TIER_2_GUARANTEE_APPLIED"), true);
  assert.equal(result.notes.includes("TIER_1_GUARANTEE_APPLIED"), true);
});

run("主 CTA 与点数挑战面板不包含禁用词", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = html.indexOf('id="panel-points-challenge"');
  const challengeHtml = html.slice(start);
  const bannedTerms = [
    "充值",
    "提现",
    "稳赚",
    "推荐号码",
    "购买入口"
  ];

  assert.equal(html.includes(">运行一轮挑战<"), true);
  assert.equal(challengeHtml.includes(">计奖注数<"), true);
  assert.equal(challengeHtml.includes(">一等奖<"), true);
  assert.equal(
    challengeHtml.includes('id="applyPointsChallengeCustomRules"'),
    true
  );
  assert.equal(
    challengeHtml.includes('id="pointsChallengeTier3Points"'),
    true
  );
  assert.equal(
    challengeHtml.includes('id="pointsChallengeSpecialPoolRatioHint"'),
    true
  );
  assert.equal(
    challengeHtml.includes('class="challenge-custom-group"'),
    true
  );
  assert.equal(
    challengeHtml.includes('id="pointsChallengeInspectorBody"'),
    true
  );
  assert.equal(
    challengeHtml.includes('data-explain-key="publicTier1WinningLines"'),
    true
  );

  for (const term of bannedTerms) {
    assert.equal(challengeHtml.includes(term), false, `点数挑战面板不应包含 ${term}`);
  }
});

if (!process.exitCode) {
  console.log("All tests passed.");
}
