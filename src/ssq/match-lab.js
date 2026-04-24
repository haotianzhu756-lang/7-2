import {
  BLUE_CANDIDATE_MIN,
  BLUE_MAX,
  BLUE_MIN,
  DRAW_BLUE_COUNT,
  DRAW_RED_COUNT,
  MATCH_LAB_STORAGE_KEY,
  RED_CANDIDATE_MIN,
  RED_MAX,
  RED_MIN,
  ROUND_HISTORY_LIMIT
} from "./constants.js";

function formatNumber(value) {
  return String(value).padStart(2, "0");
}

function normalizeUniqueNumberList(values, options) {
  const { min, max, expectedCount, minimumCount, label } = options;
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);

  if (uniqueValues.some((value) => !Number.isInteger(value))) {
    throw new Error(`${label}必须是整数`);
  }

  const outOfRange = uniqueValues.find((value) => value < min || value > max);
  if (outOfRange !== undefined) {
    throw new Error(`${label}超出范围：${outOfRange}`);
  }

  if (expectedCount !== undefined && uniqueValues.length !== expectedCount) {
    throw new Error(`${label}数量必须为 ${expectedCount} 个`);
  }

  if (minimumCount !== undefined && uniqueValues.length < minimumCount) {
    throw new Error(`${label}至少需要 ${minimumCount} 个`);
  }

  return uniqueValues;
}

function normalizeStandardDraw(reds, blue) {
  const normalizedReds = normalizeUniqueNumberList(reds, {
    min: RED_MIN,
    max: RED_MAX,
    expectedCount: DRAW_RED_COUNT,
    label: "红球"
  });

  if (!Number.isInteger(blue)) {
    throw new Error("蓝球必须是整数");
  }

  if (blue < BLUE_MIN || blue > BLUE_MAX) {
    throw new Error(`蓝球超出范围：${blue}`);
  }

  return {
    reds: normalizedReds,
    blue
  };
}

function normalizeCandidatePool(redCandidates, blueCandidates) {
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

function pickUnique(values, count, randomFn) {
  if (values.length < count) {
    throw new Error(`候选号数量不足，无法抽取 ${count} 个号码`);
  }

  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count).sort((a, b) => a - b);
}

function createRange(min, max) {
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function buildDrawKeyFromParts(reds, blue) {
  const draw = normalizeStandardDraw(reds, blue);
  return `${draw.reds.map(formatNumber).join(",")}|${formatNumber(draw.blue)}`;
}

export function buildDrawKeyFromRecord(draw) {
  const reds = Array.isArray(draw.reds)
    ? draw.reds
    : [draw.red_1, draw.red_2, draw.red_3, draw.red_4, draw.red_5, draw.red_6];
  const blue = "blue" in draw ? draw.blue : draw.blue_1;
  return buildDrawKeyFromParts(reds, blue);
}

export function createHistoryKeySet(draws) {
  return new Set(draws.map((draw) => buildDrawKeyFromRecord(draw)));
}

export function createRandomStandardDraw(randomFn = Math.random) {
  const reds = pickUnique(createRange(RED_MIN, RED_MAX), DRAW_RED_COUNT, randomFn);
  const [blue] = pickUnique(createRange(BLUE_MIN, BLUE_MAX), DRAW_BLUE_COUNT, randomFn);
  return { reds, blue };
}

export function normalizeSeed(seed) {
  const normalizedSeed = String(seed || "").trim();
  if (!normalizedSeed) {
    throw new Error("请输入有效种子");
  }
  return normalizedSeed;
}

function hashSeed(seed) {
  let hash = 2166136261;

  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = hashSeed(normalizeSeed(seed));

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomSeed(randomFn = Math.random) {
  const timePart = Date.now().toString(36);
  const randomPart = Math.floor(randomFn() * 0xffffffff)
    .toString(36)
    .padStart(7, "0");

  return `ssq-${timePart}-${randomPart}`;
}

export function createNonHistoricalTarget(
  historySet,
  randomFn = Math.random,
  maxAttempts = 5000
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createRandomStandardDraw(randomFn);
    const key = buildDrawKeyFromParts(candidate.reds, candidate.blue);
    if (!historySet.has(key)) {
      return {
        ...candidate,
        key
      };
    }
  }

  throw new Error("未能生成非历史目标，请稍后重试");
}

export function createTargetFromSeed(
  historySet,
  seed,
  maxAttempts = 5000
) {
  const normalizedSeed = normalizeSeed(seed);
  const target = createNonHistoricalTarget(
    historySet,
    createSeededRandom(normalizedSeed),
    maxAttempts
  );

  return {
    ...target,
    seed: normalizedSeed
  };
}

export function pickSubmittedSelection(redCandidates, blueCandidates, randomFn = Math.random) {
  const candidatePool = normalizeCandidatePool(redCandidates, blueCandidates);
  const reds = pickUnique(candidatePool.redCandidates, DRAW_RED_COUNT, randomFn);
  const [blue] = pickUnique(candidatePool.blueCandidates, DRAW_BLUE_COUNT, randomFn);
  return { reds, blue };
}

function combination(n, k) {
  if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || n < k) {
    return 0;
  }

  const loopCount = Math.min(k, n - k);
  let result = 1;

  for (let index = 1; index <= loopCount; index += 1) {
    result = (result * (n - loopCount + index)) / index;
  }

  return Math.round(result);
}

export function computeCoverage(candidatePool, target) {
  const normalizedPool = normalizeCandidatePool(
    candidatePool.redCandidates,
    candidatePool.blueCandidates
  );
  const normalizedTarget = normalizeStandardDraw(target.reds, target.blue);
  const redPoolSet = new Set(normalizedPool.redCandidates);
  const redCovered = normalizedTarget.reds.filter((value) => redPoolSet.has(value)).length;
  const blueCovered = normalizedPool.blueCandidates.includes(normalizedTarget.blue);

  return {
    redCovered,
    blueCovered,
    totalCovered: redCovered + (blueCovered ? 1 : 0)
  };
}

export function calculateBetCount(redCandidates, blueCandidates) {
  const candidatePool = normalizeCandidatePool(redCandidates, blueCandidates);
  return combination(candidatePool.redCandidates.length, DRAW_RED_COUNT) *
    candidatePool.blueCandidates.length;
}

export function getMatchBand(redHits, blueHits) {
  const totalHits = redHits + blueHits;

  if (redHits === DRAW_RED_COUNT && blueHits === DRAW_BLUE_COUNT) {
    return "full";
  }
  if (totalHits >= 5) {
    return "strong";
  }
  if (totalHits >= 3) {
    return "medium";
  }
  if (totalHits >= 1) {
    return "light";
  }
  return "none";
}

export function getPrizeTier(redHits, blueHits) {
  if (redHits === DRAW_RED_COUNT && blueHits === DRAW_BLUE_COUNT) {
    return "first";
  }
  if (redHits === DRAW_RED_COUNT) {
    return "second";
  }
  if (redHits === 5 && blueHits === 1) {
    return "third";
  }
  if (redHits === 5 || (redHits === 4 && blueHits === 1)) {
    return "fourth";
  }
  if (redHits === 4 || (redHits === 3 && blueHits === 1)) {
    return "fifth";
  }
  if (blueHits === 1) {
    return "sixth";
  }

  return "none";
}

export function compareSelection(target, submitted, candidatePool) {
  const normalizedTarget = normalizeStandardDraw(target.reds, target.blue);
  const normalizedSubmitted = normalizeStandardDraw(submitted.reds, submitted.blue);
  const targetRedSet = new Set(normalizedTarget.reds);
  const redHits = normalizedSubmitted.reds.filter((value) => targetRedSet.has(value)).length;
  const blueHits = normalizedSubmitted.blue === normalizedTarget.blue ? 1 : 0;
  const totalHits = redHits + blueHits;

  return {
    redHits,
    blueHits,
    totalHits,
    coverage: computeCoverage(candidatePool, normalizedTarget),
    prizeTier: getPrizeTier(redHits, blueHits),
    matchBand: getMatchBand(redHits, blueHits)
  };
}

export function evaluateCandidatePool(target, candidatePool) {
  const normalizedTarget = normalizeStandardDraw(target.reds, target.blue);
  const normalizedPool = normalizeCandidatePool(
    candidatePool.redCandidates,
    candidatePool.blueCandidates
  );
  const coverage = computeCoverage(normalizedPool, normalizedTarget);
  const redHits = coverage.redCovered;
  const blueHits = coverage.blueCovered ? 1 : 0;

  return {
    redHits,
    blueHits,
    totalHits: redHits + blueHits,
    coverage,
    betCount: calculateBetCount(
      normalizedPool.redCandidates,
      normalizedPool.blueCandidates
    ),
    prizeTier: getPrizeTier(redHits, blueHits),
    matchBand: getMatchBand(redHits, blueHits)
  };
}

export function loadRoundHistory(
  storage,
  storageKey = MATCH_LAB_STORAGE_KEY,
  limit = ROUND_HISTORY_LIMIT
) {
  if (!storage || typeof storage.getItem !== "function") {
    return [];
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function saveRoundHistory(
  storage,
  records,
  limit = ROUND_HISTORY_LIMIT,
  storageKey = MATCH_LAB_STORAGE_KEY
) {
  const normalizedRecords = Array.isArray(records) ? records.slice(0, limit) : [];

  if (storage && typeof storage.setItem === "function") {
    storage.setItem(storageKey, JSON.stringify(normalizedRecords));
  }

  return normalizedRecords;
}

export function appendRoundRecord(
  storage,
  record,
  limit = ROUND_HISTORY_LIMIT,
  storageKey = MATCH_LAB_STORAGE_KEY
) {
  const records = [record, ...loadRoundHistory(storage, storageKey, limit)];
  return saveRoundHistory(storage, records, limit, storageKey);
}
