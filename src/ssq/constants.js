export const RED_MIN = 1;
export const RED_MAX = 33;
export const BLUE_MIN = 1;
export const BLUE_MAX = 16;

export const RED_CANDIDATE_MIN = 7;
export const BLUE_CANDIDATE_MIN = 2;

export const RED_PICK_COUNT = 7;
export const BLUE_PICK_COUNT = 2;

export const DRAW_RED_COUNT = 6;
export const DRAW_BLUE_COUNT = 1;

export const ROUND_HISTORY_LIMIT = 50;
export const MATCH_LAB_STORAGE_KEY = "ssq.matchLab.roundHistory";

export const MODE_TABS = Object.freeze({
  MATCH_LAB: "match-lab",
  POINTS_CHALLENGE: "points-challenge"
});

export const DEFAULT_ACTIVE_MODE_TAB = MODE_TABS.MATCH_LAB;

export const SSQ_RULE_NUMBERS = Object.freeze({
  redMin: RED_MIN,
  redMax: RED_MAX,
  redCountPerLine: DRAW_RED_COUNT,
  blueMin: BLUE_MIN,
  blueMax: BLUE_MAX,
  blueCountPerLine: DRAW_BLUE_COUNT,
  unitCostPoints: 2,
  totalOutcomeCount: 17721088
});

export const MULTIPLIER_RULE = Object.freeze({
  defaultMultiplier: 1,
  minAdvancedMultiplier: 2,
  maxAdvancedMultiplier: 99,
  maxVirtualSlipCostPoints: 20000
});

export const REALISTIC_POINTS_STORAGE_KEY = "ssq_realistic_points_challenge_v1";

export const CSV_HEADERS = [
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
