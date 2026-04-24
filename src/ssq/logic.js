import {
  BLUE_CANDIDATE_MIN,
  BLUE_MAX,
  BLUE_MIN,
  BLUE_PICK_COUNT,
  RED_CANDIDATE_MIN,
  RED_MAX,
  RED_MIN,
  RED_PICK_COUNT
} from "./constants.js";

function uniqueSortedNumbers(values) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function parseTokenToInt(token) {
  const value = token.trim();
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function parseCandidateInput(raw, options) {
  const { min, max, label, minCount } = options;
  const source = String(raw || "").trim();

  if (!source) {
    return { valid: false, error: `请输入${label}候选号` };
  }

  const tokens = source.split(/[,\s，、；;]+/).filter(Boolean);
  if (!tokens.length) {
    return { valid: false, error: `请输入${label}候选号` };
  }

  const numbers = [];
  for (const token of tokens) {
    const parsed = parseTokenToInt(token);
    if (parsed === null) {
      return { valid: false, error: `${label}中存在非法格式：${token}` };
    }
    numbers.push(parsed);
  }

  const uniqueValues = uniqueSortedNumbers(numbers);
  const outOfRange = uniqueValues.find((value) => value < min || value > max);
  if (outOfRange !== undefined) {
    return { valid: false, error: `${label}超出范围：${outOfRange}` };
  }

  if (uniqueValues.length < minCount) {
    return {
      valid: false,
      error: `${label}至少需要 ${minCount} 个，当前只有 ${uniqueValues.length} 个`
    };
  }

  return {
    valid: true,
    value: uniqueValues
  };
}

function pickUnique(values, count, randomFn) {
  if (values.length === count) {
    return values.slice();
  }

  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy.slice(0, count).sort((left, right) => left - right);
}

export function generateSevenTwo(redCandidates, blueCandidates, randomFn = Math.random) {
  if (redCandidates.length < RED_PICK_COUNT) {
    throw new Error(`红球候选号至少 ${RED_PICK_COUNT} 个`);
  }
  if (blueCandidates.length < BLUE_PICK_COUNT) {
    throw new Error(`蓝球候选号至少 ${BLUE_PICK_COUNT} 个`);
  }

  return {
    reds: pickUnique(redCandidates, RED_PICK_COUNT, randomFn),
    blues: pickUnique(blueCandidates, BLUE_PICK_COUNT, randomFn)
  };
}

export function validateCandidateSets(redRaw, blueRaw) {
  const redResult = parseCandidateInput(redRaw, {
    min: RED_MIN,
    max: RED_MAX,
    label: "红球",
    minCount: RED_CANDIDATE_MIN
  });
  if (!redResult.valid) {
    return redResult;
  }

  const blueResult = parseCandidateInput(blueRaw, {
    min: BLUE_MIN,
    max: BLUE_MAX,
    label: "蓝球",
    minCount: BLUE_CANDIDATE_MIN
  });
  if (!blueResult.valid) {
    return blueResult;
  }

  return {
    valid: true,
    value: {
      redCandidates: redResult.value,
      blueCandidates: blueResult.value
    }
  };
}

export function filterDraws(draws, filters) {
  const issueKeyword = String(filters.issueKeyword || "").trim();
  const year = String(filters.year || "").trim();
  const startDate = String(filters.startDate || "").trim();
  const endDate = String(filters.endDate || "").trim();

  return draws.filter((draw) => {
    if (issueKeyword && !draw.issue.includes(issueKeyword)) {
      return false;
    }

    if (year && !draw.draw_date.startsWith(`${year}-`)) {
      return false;
    }

    if (startDate && draw.draw_date < startDate) {
      return false;
    }

    if (endDate && draw.draw_date > endDate) {
      return false;
    }

    return true;
  });
}
