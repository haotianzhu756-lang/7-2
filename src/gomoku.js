export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

export function createBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY));
}

export function createInitialState(size = BOARD_SIZE) {
  return {
    size,
    board: createBoard(size),
    currentPlayer: BLACK,
    moves: [],
    winner: null,
    isDraw: false
  };
}

export function inBounds(size, row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function countDirection(board, size, row, col, dx, dy, player) {
  let count = 0;
  let r = row + dx;
  let c = col + dy;

  while (inBounds(size, r, c) && board[r][c] === player) {
    count += 1;
    r += dx;
    c += dy;
  }

  return count;
}

export function hasFiveInARow(board, size, row, col, player) {
  for (const [dx, dy] of DIRECTIONS) {
    const total =
      1 +
      countDirection(board, size, row, col, dx, dy, player) +
      countDirection(board, size, row, col, -dx, -dy, player);

    if (total >= 5) {
      return true;
    }
  }

  return false;
}

function nextPlayer(player) {
  return player === BLACK ? WHITE : BLACK;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

export function placeStone(state, row, col) {
  if (state.winner || state.isDraw) {
    return { state, placed: false, reason: "game-over" };
  }

  if (!inBounds(state.size, row, col)) {
    return { state, placed: false, reason: "out-of-bounds" };
  }

  if (state.board[row][col] !== EMPTY) {
    return { state, placed: false, reason: "occupied" };
  }

  const board = cloneBoard(state.board);
  board[row][col] = state.currentPlayer;
  const moves = state.moves.concat({
    row,
    col,
    player: state.currentPlayer,
    moveNumber: state.moves.length + 1
  });

  const winner = hasFiveInARow(board, state.size, row, col, state.currentPlayer)
    ? state.currentPlayer
    : null;
  const isDraw = !winner && moves.length === state.size * state.size;

  const nextState = {
    ...state,
    board,
    moves,
    winner,
    isDraw,
    currentPlayer: winner || isDraw ? state.currentPlayer : nextPlayer(state.currentPlayer)
  };

  return { state: nextState, placed: true };
}
