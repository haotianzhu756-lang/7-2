import assert from "node:assert/strict";
import { parseCsv } from "../src/ssq/csv.js";
import {
  filterDraws,
  generateSevenTwo,
  parseCandidateInput,
  validateCandidateSets
} from "../src/ssq/logic.js";
import {
  appendRoundRecord,
  buildDrawKeyFromParts,
  calculateBetCount,
  compareSelection,
  computeCoverage,
  createRandomSeed,
  createSeededRandom,
  createTargetFromSeed,
  createHistoryKeySet,
  createNonHistoricalTarget,
  createRandomStandardDraw,
  evaluateCandidatePool,
  getMatchBand,
  getPrizeTier,
  loadRoundHistory,
  normalizeSeed,
  pickSubmittedSelection
} from "../src/ssq/match-lab.js";
import {
  dedupeAndSort,
  normalizeApiItem,
  recordsToCsv
} from "../scripts/ssq_data_tools.js";

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

run("CSV 解析成功并校验字段", () => {
  const text = [
    "issue,draw_date,red_1,red_2,red_3,red_4,red_5,red_6,blue_1",
    "2024001,2024-01-02,1,2,3,4,5,6,8"
  ].join("\n");
  const result = parseCsv(text);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].blue_1, 8);
});

run("CSV 行内红球重复会报错", () => {
  const text = [
    "issue,draw_date,red_1,red_2,red_3,red_4,red_5,red_6,blue_1",
    "2024001,2024-01-02,1,1,3,4,5,6,8"
  ].join("\n");
  const result = parseCsv(text);
  assert.equal(result.rows.length, 0);
  assert.equal(result.errors.length, 1);
});

run("候选号去重后可通过校验", () => {
  const result = parseCandidateInput("1,1,2,3,4,5,6,7", {
    min: 1,
    max: 33,
    label: "红球",
    minCount: 7
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.value, [1, 2, 3, 4, 5, 6, 7]);
});

run("非法格式与越界应失败", () => {
  const badFormat = validateCandidateSets("1,2,a,4,5,6,7", "1,2");
  assert.equal(badFormat.valid, false);

  const outOfRange = validateCandidateSets("1,2,3,4,5,6,34", "1,2");
  assert.equal(outOfRange.valid, false);
});

run("候选号不足不能生成", () => {
  assert.throws(() => generateSevenTwo([1, 2, 3], [1, 2]), /红球候选号至少/);
  assert.throws(() => generateSevenTwo([1, 2, 3, 4, 5, 6, 7], [1]), /蓝球候选号至少/);
});

run("7+2 结果合法", () => {
  const randomSeq = [0.99, 0.88, 0.77, 0.66, 0.55, 0.44, 0.33, 0.22, 0.11, 0.01];
  let idx = 0;
  const randomFn = () => {
    const value = randomSeq[idx % randomSeq.length];
    idx += 1;
    return value;
  };

  const result = generateSevenTwo(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4],
    randomFn
  );

  assert.equal(result.reds.length, 7);
  assert.equal(result.blues.length, 2);
  assert.equal(new Set(result.reds).size, 7);
  assert.equal(new Set(result.blues).size, 2);
  assert.ok(result.reds.every((n) => n >= 1 && n <= 33));
  assert.ok(result.blues.every((n) => n >= 1 && n <= 16));
});

run("筛选支持期号、年份、日期范围", () => {
  const draws = [
    {
      issue: "2024001",
      draw_date: "2024-01-02",
      red_1: 1,
      red_2: 2,
      red_3: 3,
      red_4: 4,
      red_5: 5,
      red_6: 6,
      blue_1: 1
    },
    {
      issue: "2025001",
      draw_date: "2025-01-01",
      red_1: 1,
      red_2: 2,
      red_3: 3,
      red_4: 4,
      red_5: 5,
      red_6: 6,
      blue_1: 1
    }
  ];

  const result = filterDraws(draws, {
    issueKeyword: "2025",
    year: "2025",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].issue, "2025001");
});

run("标准组合 key 格式稳定", () => {
  assert.equal(buildDrawKeyFromParts([1, 2, 3, 4, 5, 6], 8), "01,02,03,04,05,06|08");
});

run("历史组合 Set 构建正确", () => {
  const draws = [
    {
      issue: "2024001",
      draw_date: "2024-01-02",
      red_1: 1,
      red_2: 2,
      red_3: 3,
      red_4: 4,
      red_5: 5,
      red_6: 6,
      blue_1: 8
    },
    {
      issue: "2024002",
      draw_date: "2024-01-04",
      red_1: 7,
      red_2: 8,
      red_3: 9,
      red_4: 10,
      red_5: 11,
      red_6: 12,
      blue_1: 16
    }
  ];

  const historySet = createHistoryKeySet(draws);
  assert.equal(historySet.size, 2);
  assert.ok(historySet.has("01,02,03,04,05,06|08"));
  assert.ok(historySet.has("07,08,09,10,11,12|16"));
});

run("隐藏目标会避开历史组合", () => {
  const historical = createRandomStandardDraw(() => 0);
  const historySet = new Set([buildDrawKeyFromParts(historical.reds, historical.blue)]);
  let callCount = 0;

  const target = createNonHistoricalTarget(
    historySet,
    () => {
      callCount += 1;
      return callCount <= 47 ? 0 : 0.999999;
    },
    2
  );

  assert.ok(!historySet.has(target.key));
  assert.notEqual(target.key, buildDrawKeyFromParts(historical.reds, historical.blue));
});

run("同一种子会生成同样的随机序列", () => {
  const randomA = createSeededRandom("demo-seed");
  const randomB = createSeededRandom("demo-seed");

  const valuesA = Array.from({ length: 5 }, () => randomA());
  const valuesB = Array.from({ length: 5 }, () => randomB());

  assert.deepEqual(valuesA, valuesB);
});

run("同一种子会生成同一组隐藏目标", () => {
  const historySet = new Set(["01,02,03,04,05,06|08"]);
  const targetA = createTargetFromSeed(historySet, "seed-001");
  const targetB = createTargetFromSeed(historySet, "seed-001");

  assert.deepEqual(targetA, targetB);
  assert.equal(targetA.seed, "seed-001");
});

run("种子会被标准化校验", () => {
  assert.equal(normalizeSeed("  demo-seed  "), "demo-seed");
  assert.throws(() => normalizeSeed("   "), /请输入有效种子/);
});

run("本轮提交组合从候选号池中抽取 6+1", () => {
  const randomSeq = [0.91, 0.73, 0.62, 0.44, 0.28, 0.12, 0.95, 0.07];
  let idx = 0;
  const result = pickSubmittedSelection(
    [1, 2, 3, 4, 5, 6, 7, 8],
    [2, 4, 6],
    () => {
      const value = randomSeq[idx % randomSeq.length];
      idx += 1;
      return value;
    }
  );

  assert.equal(result.reds.length, 6);
  assert.equal(new Set(result.reds).size, 6);
  assert.ok(result.reds.every((value) => value >= 1 && value <= 8));
  assert.ok([2, 4, 6].includes(result.blue));
});

run("覆盖率与命中统计是两个概念", () => {
  const target = {
    reds: [1, 2, 3, 4, 5, 6],
    blue: 8
  };
  const candidatePool = {
    redCandidates: [1, 2, 3, 4, 5, 7, 9],
    blueCandidates: [8, 10]
  };
  const submitted = {
    reds: [1, 2, 4, 5, 7, 9],
    blue: 10
  };

  const coverage = computeCoverage(candidatePool, target);
  assert.deepEqual(coverage, {
    redCovered: 5,
    blueCovered: true,
    totalCovered: 6
  });

  const result = compareSelection(target, submitted, candidatePool);
  assert.equal(result.redHits, 4);
  assert.equal(result.blueHits, 0);
  assert.equal(result.totalHits, 4);
  assert.equal(result.coverage.totalCovered, 6);
  assert.equal(result.matchBand, "medium");
});

run("匹配等级映射正确", () => {
  assert.equal(getMatchBand(6, 1), "full");
  assert.equal(getMatchBand(5, 0), "strong");
  assert.equal(getMatchBand(3, 0), "medium");
  assert.equal(getMatchBand(1, 0), "light");
  assert.equal(getMatchBand(0, 0), "none");
});

run("真实奖项映射正确", () => {
  assert.equal(getPrizeTier(6, 1), "first");
  assert.equal(getPrizeTier(6, 0), "second");
  assert.equal(getPrizeTier(5, 1), "third");
  assert.equal(getPrizeTier(5, 0), "fourth");
  assert.equal(getPrizeTier(4, 1), "fourth");
  assert.equal(getPrizeTier(4, 0), "fifth");
  assert.equal(getPrizeTier(3, 1), "fifth");
  assert.equal(getPrizeTier(0, 1), "sixth");
  assert.equal(getPrizeTier(0, 0), "none");
});

run("复式票总注数计算正确", () => {
  assert.equal(calculateBetCount([1, 2, 3, 4, 5, 6, 7], [1, 2]), 14);
  assert.equal(calculateBetCount([1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3]), 84);
});

run("整张复式票按最佳一注评估命中", () => {
  const target = {
    reds: [1, 2, 3, 4, 5, 6],
    blue: 8
  };
  const candidatePool = {
    redCandidates: [1, 2, 3, 4, 5, 7, 9],
    blueCandidates: [8, 10]
  };

  const result = evaluateCandidatePool(target, candidatePool);
  assert.equal(result.redHits, 5);
  assert.equal(result.blueHits, 1);
  assert.equal(result.totalHits, 6);
  assert.equal(result.betCount, 14);
  assert.equal(result.coverage.totalCovered, 6);
  assert.equal(result.prizeTier, "third");
  assert.equal(result.matchBand, "strong");
});

run("增加非中奖候选号不会降低整张票的最佳命中", () => {
  const target = {
    reds: [1, 2, 3, 4, 5, 6],
    blue: 8
  };
  const basePool = {
    redCandidates: [1, 2, 3, 4, 5, 7, 9],
    blueCandidates: [8, 10]
  };
  const expandedPool = {
    redCandidates: [1, 2, 3, 4, 5, 7, 9, 11, 12, 13],
    blueCandidates: [8, 10, 12, 14]
  };

  const baseResult = evaluateCandidatePool(target, basePool);
  const expandedResult = evaluateCandidatePool(target, expandedPool);

  assert.equal(expandedResult.redHits, baseResult.redHits);
  assert.equal(expandedResult.blueHits, baseResult.blueHits);
  assert.equal(expandedResult.matchBand, baseResult.matchBand);
});

run("最近 10 局记录追加后会裁剪", () => {
  const storage = createMemoryStorage();

  for (let index = 0; index < 12; index += 1) {
    appendRoundRecord(storage, { id: `round-${index}` }, 10, "test.rounds");
  }

  const saved = JSON.parse(storage.getItem("test.rounds"));
  assert.equal(saved.length, 10);
  assert.equal(saved[0].id, "round-11");
  assert.equal(saved[9].id, "round-2");
});

run("随机种子格式可用", () => {
  const seed = createRandomSeed(() => 0.5);
  assert.match(seed, /^ssq-/);
});

run("回合记录会保留隐藏目标的揭晓状态", () => {
  const storage = createMemoryStorage();

  appendRoundRecord(
    storage,
    {
      id: "round-hidden",
      targetRevealed: false,
      result: {
        coverage: {
          redCovered: 5,
          blueCovered: true,
          totalCovered: 6
        }
      }
    },
    10,
    "test.rounds"
  );

  const saved = loadRoundHistory(storage, "test.rounds", 10);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].targetRevealed, false);
});

run("采集数据标准化 + 去重 + CSV 输出", () => {
  const sample = {
    codeNum: "2024010",
    date: "2024-01-23",
    code: "01,02,03,04,05,06,16"
  };
  const normalized = normalizeApiItem(sample);
  assert.equal(normalized.valid, true);

  const deduped = dedupeAndSort([normalized.value, normalized.value]);
  assert.equal(deduped.length, 1);

  const csv = recordsToCsv(deduped);
  assert.ok(csv.includes("issue,draw_date"));
  assert.ok(csv.includes("2024010,2024-01-23"));
});

if (!process.exitCode) {
  console.log("All tests passed.");
}
