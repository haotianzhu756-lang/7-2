#!/usr/bin/env node
import { dedupeAndSort, normalizeApiItem, readRawJson, writeCsv } from "./ssq_data_tools.js";

const API_URL =
  "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";
const DEFAULT_OUTPUT = "data/ssq_history.csv";
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 40;
const SOURCE_AUTO = "auto";
const SOURCE_CWL = "cwl";
const SOURCE_500STAR = "500star";

function parseArgs(argv) {
  const args = {
    output: DEFAULT_OUTPUT,
    maxPages: DEFAULT_MAX_PAGES,
    input: "",
    cookie: process.env.SSQ_COOKIE || "",
    userAgent:
      process.env.SSQ_UA ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
    source: SOURCE_AUTO
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--output" && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--max-pages" && argv[i + 1]) {
      args.maxPages = Number(argv[i + 1]) || DEFAULT_MAX_PAGES;
      i += 1;
      continue;
    }
    if (token === "--input" && argv[i + 1]) {
      args.input = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--cookie" && argv[i + 1]) {
      args.cookie = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--ua" && argv[i + 1]) {
      args.userAgent = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--source" && argv[i + 1]) {
      args.source = String(argv[i + 1]).toLowerCase();
      i += 1;
    }
  }

  return args;
}

async function fetchPage(pageNo, pageSize, auth = {}) {
  const query = new URLSearchParams({
    name: "ssq",
    issueCount: "",
    issueStart: "",
    issueEnd: "",
    dayStart: "",
    dayEnd: "",
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    week: "",
    systemType: "PC"
  });
  const url = `${API_URL}?${query.toString()}`;
  const headers = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    Referer: "https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/",
    "User-Agent": auth.userAgent,
    "X-Requested-With": "XMLHttpRequest"
  };
  if (auth.cookie) {
    headers.Cookie = auth.cookie;
  }

  const response = await fetch(url, {
    headers
  });
  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`);
  }
  const json = await response.json();
  const list = Array.isArray(json.result)
    ? json.result
    : Array.isArray(json.data)
      ? json.data
      : [];
  return list;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
}

function normalizeList(rawList) {
  const records = [];
  const errors = [];

  for (const item of rawList) {
    const normalized = normalizeApiItem(item);
    if (normalized.valid) {
      records.push(normalized.value);
    } else {
      const issueHint = String(item.codeNum || item.issue || "unknown");
      errors.push(`issue=${issueHint} ${normalized.reason}`);
    }
  }

  return { records, errors };
}

async function fetch500StarHtml(url, userAgent) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://datachart.500star.com/ssq/history/history.shtml"
    }
  });
  if (!response.ok) {
    throw new Error(`500star 请求失败：HTTP ${response.status}`);
  }
  return response.text();
}

function parse500StarHtml(html) {
  const tbody = html.match(/<tbody id="tdata">([\s\S]*?)<\/tbody>/i);
  if (!tbody) {
    throw new Error("500star 页面结构变化：未找到 tdata");
  }

  const rows = [...tbody[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const normalizedItems = [];
  const errors = [];

  for (const rowMatch of rows) {
    const tds = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      stripHtml(m[1])
    );
    if (tds.length < 10) {
      errors.push("500star 行字段过少");
      continue;
    }

    const issue = tds[1];
    const reds = tds.slice(2, 8);
    const blue = tds[8];
    const date = tds[tds.length - 1];
    const item = {
      issue,
      date,
      red: reds.join(","),
      blue
    };
    normalizedItems.push(item);
  }

  const normalized = normalizeList(normalizedItems);
  return { records: normalized.records, errors: errors.concat(normalized.errors) };
}

async function collectFrom500Star(userAgent) {
  const allRangeUrl =
    "https://datachart.500star.com/ssq/history/newinc/history.php?start=03001&end=99999";
  const html = await fetch500StarHtml(allRangeUrl, userAgent);
  const parsed = parse500StarHtml(html);
  return { records: dedupeAndSort(parsed.records), errors: parsed.errors };
}

async function collectFromApi(maxPages, auth) {
  const collected = [];
  const errors = [];

  for (let page = 1; page <= maxPages; page += 1) {
    let list;
    try {
      list = await fetchPage(page, DEFAULT_PAGE_SIZE, auth);
    } catch (error) {
      throw new Error(`第 ${page} 页采集失败：${error instanceof Error ? error.message : "未知错误"}`);
    }

    if (!list.length) {
      break;
    }

    const normalized = normalizeList(list);
    collected.push(...normalized.records);
    errors.push(...normalized.errors);
  }

  return { records: dedupeAndSort(collected), errors };
}

async function convertFromRawJson(inputPath) {
  const raw = await readRawJson(inputPath);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.result)
      ? raw.result
      : Array.isArray(raw.data)
        ? raw.data
        : [];
  const normalized = normalizeList(list);
  return { records: dedupeAndSort(normalized.records), errors: normalized.errors };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { output, maxPages, input, cookie, userAgent, source } = args;

  try {
    let result;

    if (input) {
      result = await convertFromRawJson(input);
    } else if (source === SOURCE_CWL) {
      result = await collectFromApi(maxPages, { cookie, userAgent });
    } else if (source === SOURCE_500STAR) {
      result = await collectFrom500Star(userAgent);
    } else {
      try {
        result = await collectFromApi(maxPages, { cookie, userAgent });
      } catch (error) {
        console.warn(
          `CWL 源失败，改用 500star：${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
        result = await collectFrom500Star(userAgent);
      }
    }

    if (!result.records.length) {
      throw new Error("未采集到有效记录");
    }
    await writeCsv(output, result.records);

    console.log(`CSV 已生成：${output}`);
    console.log(`有效记录：${result.records.length} 条`);
    if (result.errors.length) {
      console.log(`已跳过异常记录：${result.errors.length} 条`);
      console.log(result.errors.slice(0, 5).join("\n"));
    }
  } catch (error) {
    console.error(`执行失败：${error instanceof Error ? error.message : "未知错误"}`);
    if (String(error instanceof Error ? error.message : "").includes("HTTP 403")) {
      console.error(
        "提示：可尝试增加 --cookie \"...\"，或设置环境变量 SSQ_COOKIE 后重试。"
      );
    }
    process.exitCode = 1;
  }
}

main();
