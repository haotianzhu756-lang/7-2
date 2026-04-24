import assert from "node:assert/strict";
import {
  BLACK,
  WHITE,
  createInitialState,
  placeStone,
  hasFiveInARow
} from "../src/gomoku.js";

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

run("合法落子后切换到另一方", () => {
  const initial = createInitialState(15);
  const result = placeStone(initial, 7, 7);

  assert.equal(result.placed, true);
  assert.equal(result.state.board[7][7], BLACK);
  assert.equal(result.state.currentPlayer, WHITE);
  assert.equal(result.state.moves.length, 1);
});

run("不能在已有棋子位置重复落子", () => {
  let state = createInitialState(15);
  state = placeStone(state, 1, 1).state;

  const secondTry = placeStone(state, 1, 1);

  assert.equal(secondTry.placed, false);
  assert.equal(secondTry.reason, "occupied");
  assert.equal(secondTry.state.moves.length, 1);
});

run("横向五连判胜", () => {
  let state = createInitialState(15);
  const sequence = [
    [7, 1],
    [0, 0],
    [7, 2],
    [0, 1],
    [7, 3],
    [0, 2],
    [7, 4],
    [0, 3],
    [7, 5]
  ];

  for (const [r, c] of sequence) {
    state = placeStone(state, r, c).state;
  }

  assert.equal(state.winner, BLACK);
  assert.equal(state.isDraw, false);
});

run("边界副对角线五连判胜", () => {
  const state = createInitialState(5);
  const board = state.board.map((row) => row.slice());

  board[4][0] = BLACK;
  board[3][1] = BLACK;
  board[2][2] = BLACK;
  board[1][3] = BLACK;
  board[0][4] = BLACK;

  assert.equal(hasFiveInARow(board, 5, 0, 4, BLACK), true);
});

run("棋盘下满且无五连时判定平局", () => {
  let state = createInitialState(3);
  const sequence = [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [1, 0],
    [1, 2],
    [2, 1],
    [2, 0],
    [2, 2]
  ];

  for (const [r, c] of sequence) {
    state = placeStone(state, r, c).state;
  }

  assert.equal(state.winner, null);
  assert.equal(state.isDraw, true);
});

if (!process.exitCode) {
  console.log("All tests passed.");
}
