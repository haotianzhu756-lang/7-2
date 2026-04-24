import { BLUE_MAX, BLUE_MIN, CSV_HEADERS, RED_MAX, RED_MIN } from "./constants.js";

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toInteger(value) {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  return Number(value);
}

export function normalizeDrawRecord(record) {
  const issue = String(record.issue || "").trim();
  const drawDate = String(record.draw_date || "").trim();
  const reds = [
    toInteger(String(record.red_1 || "").trim()),
    toInteger(String(record.red_2 || "").trim()),
    toInteger(String(record.red_3 || "").trim()),
    toInteger(String(record.red_4 || "").trim()),
    toInteger(String(record.red_5 || "").trim()),
    toInteger(String(record.red_6 || "").trim())
  ];
  const blue = toInteger(String(record.blue_1 || "").trim());

  const errors = [];
  if (!/^\d+$/.test(issue)) {
    errors.push("期号无效");
  }
  if (!isIsoDate(drawDate)) {
    errors.push("开奖日期无效");
  }
  if (reds.some((value) => value === null)) {
    errors.push("红球必须是整数");
  }
  if (blue === null) {
    errors.push("蓝球必须是整数");
  }

  if (!errors.length) {
    if (reds.some((value) => value < RED_MIN || value > RED_MAX)) {
      errors.push("红球超出范围");
    }

    if (blue < BLUE_MIN || blue > BLUE_MAX) {
      errors.push("蓝球超出范围");
    }

    if (new Set(reds).size !== reds.length) {
      errors.push("红球存在重复");
    }
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  const sortedReds = reds.slice().sort((a, b) => a - b);
  return {
    valid: true,
    value: {
      issue,
      draw_date: drawDate,
      red_1: sortedReds[0],
      red_2: sortedReds[1],
      red_3: sortedReds[2],
      red_4: sortedReds[3],
      red_5: sortedReds[4],
      red_6: sortedReds[5],
      blue_1: blue
    }
  };
}

export function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { rows: [], errors: ["CSV 内容为空"] };
  }

  const expectedHeader = CSV_HEADERS.join(",");
  if (lines[0] !== expectedHeader) {
    return {
      rows: [],
      errors: [`CSV 表头不匹配，期望：${expectedHeader}`]
    };
  }

  const rows = [];
  const errors = [];

  for (let index = 1; index < lines.length; index += 1) {
    const cols = lines[index].split(",");
    if (cols.length !== CSV_HEADERS.length) {
      errors.push(`第 ${index + 1} 行字段数量错误`);
      continue;
    }

    const rawRecord = CSV_HEADERS.reduce((acc, key, colIndex) => {
      acc[key] = cols[colIndex];
      return acc;
    }, {});

    const normalized = normalizeDrawRecord(rawRecord);
    if (!normalized.valid) {
      errors.push(`第 ${index + 1} 行无效：${normalized.errors.join("、")}`);
      continue;
    }

    rows.push(normalized.value);
  }

  return { rows, errors };
}
