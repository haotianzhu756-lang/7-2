import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DEFAULT_SANDBOX_CONFIG,
  MATCH_CODES,
  SANDBOX_REWARD_MODES,
  SANDBOX_SAMPLING_STRATEGIES,
  SANDBOX_DISCLAIMER,
  calculateVirtualRewardCredits,
  classifyMatchCode,
  combination,
  countExperimentLines,
  createDefaultSandboxState,
  generateExperimentLines,
  loadSandboxState,
  saveSandboxState,
  simulatePoolIndexStep,
  simulateSandboxRound
} from "../src/ssq/challenge-sandbox.js";

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

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

run("combination 支持基础组合数", () => {
  assert.equal(combination(7, 6), 7);
  assert.equal(combination(8, 6), 28);
});

run("countExperimentLines 计算正确", () => {
  assert.equal(countExperimentLines(7, 2), 14);
  assert.equal(countExperimentLines(8, 3), 84);
});

run("非法组合输入返回 0", () => {
  assert.equal(combination(5, 6), 0);
  assert.equal(combination(-1, 6), 0);
  assert.equal(combination(7, -1), 0);
});

run("generateExperimentLines 在上限内全量展开", () => {
  const result = generateExperimentLines([1, 2, 3, 4, 5, 6, 7], [1, 2], {
    maxLinesPerRound: 120,
    sampleMode: false
  });

  assert.equal(result.totalLineCount, 14);
  assert.equal(result.lines.length, 14);
  assert.equal(result.isSampled, false);
});

run("generateExperimentLines 超上限时支持抽样实验", () => {
  const result = generateExperimentLines(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [1, 2, 3, 4],
    {
      maxLinesPerRound: 20,
      sampleMode: true,
      randomFn: () => 0.42
    }
  );

  assert.equal(result.isSampled, true);
  assert.equal(result.lines.length, 20);
  assert.ok(result.totalLineCount > 20);
});

run("generateExperimentLines 支持有回补抽样", () => {
  const result = generateExperimentLines(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [1, 2, 3, 4],
    {
      maxLinesPerRound: 6,
      samplingStrategy: SANDBOX_SAMPLING_STRATEGIES.WITH_REPLACEMENT,
      randomFn: () => 0.18
    }
  );

  assert.equal(result.isSampled, true);
  assert.equal(result.samplingStrategy, SANDBOX_SAMPLING_STRATEGIES.WITH_REPLACEMENT);
  assert.equal(result.lines.length, 6);
});

run("classifyMatchCode 分类正确", () => {
  assert.equal(classifyMatchCode(6, 1), MATCH_CODES.MATCH_6_1);
  assert.equal(classifyMatchCode(6, 0), MATCH_CODES.MATCH_6_0);
  assert.equal(classifyMatchCode(5, 1), MATCH_CODES.MATCH_5_1);
  assert.equal(classifyMatchCode(5, 0), MATCH_CODES.MATCH_5_0_OR_4_1);
  assert.equal(classifyMatchCode(4, 1), MATCH_CODES.MATCH_5_0_OR_4_1);
  assert.equal(classifyMatchCode(4, 0), MATCH_CODES.MATCH_4_0_OR_3_1);
  assert.equal(classifyMatchCode(3, 1), MATCH_CODES.MATCH_4_0_OR_3_1);
  assert.equal(classifyMatchCode(0, 1), MATCH_CODES.MATCH_BLUE_ONLY);
  assert.equal(classifyMatchCode(3, 0), MATCH_CODES.NO_MATCH);
});

run("特别三红匹配默认关闭", () => {
  assert.equal(classifyMatchCode(3, 0), MATCH_CODES.NO_MATCH);
});

run("池指数计算返回非负整数", () => {
  const result = simulatePoolIndexStep({
    previousPoolIndex: 50000,
    totalExperimentCostCredits: 100,
    fixedRewardCreditsPaid: 20,
    rareMatchCounts: {
      [MATCH_CODES.MATCH_6_1]: 1,
      [MATCH_CODES.MATCH_6_0]: 2
    },
    config: DEFAULT_SANDBOX_CONFIG
  });

  assert.equal(Number.isInteger(result.topRewardCredits), true);
  assert.equal(Number.isInteger(result.secondRewardCredits), true);
  assert.equal(Number.isInteger(result.nextPoolIndex), true);
  assert.ok(result.topRewardCredits >= 0);
  assert.ok(result.secondRewardCredits >= 0);
  assert.ok(result.nextPoolIndex >= 0);
});

run("calculateVirtualRewardCredits 支持动态与固定回补", () => {
  const fixed = calculateVirtualRewardCredits(MATCH_CODES.MATCH_5_1, {
    config: DEFAULT_SANDBOX_CONFIG
  });
  const dynamic = calculateVirtualRewardCredits(MATCH_CODES.MATCH_6_1, {
    config: DEFAULT_SANDBOX_CONFIG,
    poolIndexState: {
      topRewardCredits: 888,
      secondRewardCredits: 222
    }
  });

  assert.equal(fixed.rewardCredits, 3000);
  assert.equal(fixed.isDynamic, false);
  assert.equal(dynamic.rewardCredits, 888);
  assert.equal(dynamic.isDynamic, true);
});

run("calculateVirtualRewardCredits 可关闭回补", () => {
  const disabled = calculateVirtualRewardCredits(MATCH_CODES.MATCH_5_1, {
    config: {
      ...DEFAULT_SANDBOX_CONFIG,
      rewardMode: SANDBOX_REWARD_MODES.DISABLED
    }
  });

  assert.equal(disabled.rewardCredits, 0);
  assert.equal(disabled.isDynamic, false);
});

run("点数不足时不能运行实验", () => {
  assert.throws(
    () =>
      simulateSandboxRound({
        redCandidates: [1, 2, 3, 4, 5, 6, 7],
        blueCandidates: [1, 2],
        target: {
          reds: [1, 2, 3, 4, 5, 6],
          blue: 1
        },
        currentCredits: 1,
        roundIndex: 1,
        poolIndexState: {
          currentPoolIndex: 50000
        },
        config: DEFAULT_SANDBOX_CONFIG,
        sampleMode: false
      }),
    /点数不足/
  );
});

run("组合过多且未启用抽样时不能直接展开", () => {
  assert.throws(
    () =>
      generateExperimentLines([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4], {
        maxLinesPerRound: 20,
        sampleMode: false
      }),
    /本轮组合过多/
  );
});

run("simulateSandboxRound 输出最佳匹配和点数结果", () => {
  const result = simulateSandboxRound({
    redCandidates: [1, 2, 3, 4, 5, 6, 7],
    blueCandidates: [8, 9],
    target: {
      reds: [1, 2, 3, 4, 5, 6],
      blue: 8
    },
    currentCredits: 1000,
    roundIndex: 1,
    poolIndexState: {
      currentPoolIndex: 50000
    },
    config: DEFAULT_SANDBOX_CONFIG,
    sampleMode: false,
    randomFn: () => 0.3
  });

  assert.equal(result.lineCount, 14);
  assert.equal(result.bestMatchCode, MATCH_CODES.MATCH_6_1);
  assert.ok(result.afterCredits >= 0);
});

run("沙盒状态可保存与读取", () => {
  const storage = createMemoryStorage();
  const initialState = createDefaultSandboxState();
  const savedState = saveSandboxState(storage, {
    ...initialState,
    currentCredits: 860,
    rounds: [
      {
        roundIndex: 1,
        afterCredits: 860
      }
    ]
  });
  const loadedState = loadSandboxState(storage);

  assert.equal(savedState.currentCredits, 860);
  assert.equal(loadedState.currentCredits, 860);
  assert.equal(loadedState.rounds.length, 1);
});

run("固定说明文案不含真实交易承诺", () => {
  assert.ok(SANDBOX_DISCLAIMER.includes("非官方"));
  assert.ok(SANDBOX_DISCLAIMER.includes("不可兑换"));
});

run("点数挑战面板不包含禁用词", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const start = html.indexOf('data-panel="challenge-sandbox"');
  const end = html.indexOf('data-panel="match-lab"');
  const sandboxHtml = html.slice(start, end);
  const bannedTerms = [
    "下注",
    "投注",
    "购彩",
    "买球",
    "奖金",
    "兑奖",
    "奖池",
    "一等奖",
    "二等奖",
    "三等奖",
    "四等奖",
    "五等奖",
    "六等奖",
    "回本",
    "盈利",
    "赚了",
    "倍投",
    "追号"
  ];

  for (const term of bannedTerms) {
    assert.equal(
      sandboxHtml.includes(term),
      false,
      `点数挑战面板不应包含禁用词：${term}`
    );
  }
});

if (!process.exitCode) {
  console.log("All tests passed.");
}
