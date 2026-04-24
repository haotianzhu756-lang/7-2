import { readFile, writeFile } from "node:fs/promises";

export const HEADER = [
  "issue",
  "draw_date",
  "red_1",
  "red_2",
  "red_3",
  "red_4",
  "red_5",
  "red_6",
  "blue_1"
];

function toIsoDate(input) {
  const value = String(input || "").trim();
  const matched = value.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!matched) {
    return null;
  }
  const year = matched[1];
  const month = matched[2].padStart(2, "0");
  const day = matched[3].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCodeNumbers(item) {
  const candidates = [item.code, item.red, item.redBall, item.red_num]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  const blueCandidates = [item.blue, item.blueBall, item.blue_num]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const nums = candidate.match(/\d+/g)?.map(Number) || [];
    if (nums.length === 7) {
      return { reds: nums.slice(0, 6), blue: nums[6] };
    }
    if (nums.length === 6 && blueCandidates.length) {
      const blueNum = Number(blueCandidates[0].match(/\d+/)?.[0]);
      if (Number.isInteger(blueNum)) {
        return { reds: nums, blue: blueNum };
      }
    }
  }

  return null;
}

export function normalizeApiItem(item) {
  const issueRaw = String(item.codeNum || item.issue || item.code || "").trim();
  const issue = issueRaw.match(/\d+/)?.[0] || "";
  const drawDate = toIsoDate(item.date || item.drawDate || item.openTime);
  const codes = parseCodeNumbers(item);

  if (!issue || !drawDate || !codes) {
    return { valid: false, reason: "缺少期号、日期或号码" };
  }

  const reds = codes.reds
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b);
  const blue = Number(codes.blue);

  if (reds.length !== 6 || new Set(reds).size !== 6) {
    return { valid: false, reason: "红球数量错误或重复" };
  }

  if (reds.some((n) => n < 1 || n > 33)) {
    return { valid: false, reason: "红球超范围" };
  }

  if (!Number.isInteger(blue) || blue < 1 || blue > 16) {
    return { valid: false, reason: "蓝球超范围" };
  }

  return {
    valid: true,
    value: {
      issue,
      draw_date: drawDate,
      red_1: reds[0],
      red_2: reds[1],
      red_3: reds[2],
      red_4: reds[3],
      red_5: reds[4],
      red_6: reds[5],
      blue_1: blue
    }
  };
}

export function dedupeAndSort(records) {
  const map = new Map();
  for (const record of records) {
    const key = `${record.issue}|${record.draw_date}`;
    if (!map.has(key)) {
      map.set(key, record);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const issueDiff = Number(a.issue) - Number(b.issue);
    if (issueDiff !== 0) {
      return issueDiff;
    }
    return a.draw_date.localeCompare(b.draw_date);
  });
}

export function recordsToCsv(records) {
  const lines = [HEADER.join(",")];
  for (const record of records) {
    lines.push(
      [
        record.issue,
        record.draw_date,
        record.red_1,
        record.red_2,
        record.red_3,
        record.red_4,
        record.red_5,
        record.red_6,
        record.blue_1
      ].join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

export async function readRawJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

export async function writeCsv(path, records) {
  const csv = recordsToCsv(records);
  await writeFile(path, csv, "utf8");
}
