import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const score = document.querySelector(".score");
const bestScore = document.querySelector(".best-score");

const gameOver = document.querySelector('.game-over');
const info = document.querySelector('.help');
const title = document.querySelector('.title');

const New = document.getElementById('new');
const Try = document.querySelector('.try');
const Close = document.querySelector('.close');

const GameState = {
  tiles: {},
  score: 0,
  over: false,
};

title.addEventListener('click', () => {
  info.classList.toggle("show");
});

Try.addEventListener('click',() => {
  gameOver.classList.remove("show");
  newGame();
});

New.addEventListener('click',() => {
  newGame();
})

Close.addEventListener('click', () => {
  info.classList.toggle('show');
})


document.addEventListener('DOMContentLoaded', () => {
  if(getLocalStorage() == null){
    setLocalStorage();
  }
  if(localStorage.getItem('best') == null){
    localStorage.setItem('best',0);
  }

  if (getLocalStorage() != null && getLocalStorage().tiles.length > 0 && !getLocalStorage().over) {
    score.innerHTML = getLocalStorage().score;
    loadLastGame();
  } else {
    loadNewGame();
  }
})


bestScore.innerHTML = localStorage.getItem('best') || 0;
let grid = new Grid(gameBoard);


setupInput();

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(e) {
  const isTutorialOpen = info.classList.contains('show');
  if(isTutorialOpen){
    return;
  }
  switch (e.key) {
    case "w":
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "s":
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "a":
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "d":
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;

    default:
      setupInput();
      return;
  }

  AddScore(grid.additionalScore(), score);

  grid.cells.forEach((cell) => cell.mergeTiles());

  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;
  saveCurrentState();

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransition(true).then(() => {
      GameState.over = true;
      setLocalStorage();
      gameOver.classList.add('show');
    });
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i++) {
        const cell = group[i];
        if (cell.tile == null) continue;
        let lastValidCell;

        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}

function AddScore(addScore, scoreEl) {
  if (addScore != 0) {
    const addScoreEl = document.createElement("div");
    addScoreEl.classList.add("add-score");
    addScoreEl.textContent = `+${addScore}`;
    const nScore = parseInt(score.textContent) + parseInt(grid.additionalScore());
    score.innerHTML = nScore;
    GameState.score = nScore;
    setLocalStorage();
    if(localStorage.getItem('best') <= nScore){
      bestScore.innerHTML = nScore;
      localStorage.setItem('best',nScore);
    }
    scoreEl.appendChild(addScoreEl);
  }
}

function saveCurrentState(){
  GameState.tiles = grid.cells
  .filter(cell => cell.tile != null)
  .map(cell => {return { x: cell.x, y: cell.y, value: cell.tile.value}});

  setLocalStorage();
}

function loadLastGame(){
  GameState.tiles = JSON.parse(localStorage.getItem('gameState')).tiles;
  GameState.tiles.forEach(t => {
    const tile = new Tile(gameBoard,t.value);
    grid.cellsByColumn[t.x][t.y].tile = tile;
  })
}

function loadNewGame(){
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  GameState.over = false;
  setLocalStorage();
  saveCurrentState();
}

function setLocalStorage(){
  localStorage.setItem("gameState", JSON.stringify(GameState));
}

function getLocalStorage() {
  return JSON.parse(localStorage.getItem("gameState"));
}

function newGame(){
  GameState.over = false;
  setLocalStorage();
  grid.reset();
  score.innerHTML = 0;
  loadNewGame();
}