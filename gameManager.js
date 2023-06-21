import Grid from "./Grid.js";

const bestScore = 0;
localStorage.setItem('best',bestScore);

const GameState = {
  tiles: {},
  showIntro: false,
  score: 0,
  over: false,
};