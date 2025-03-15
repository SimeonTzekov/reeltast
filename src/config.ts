// Note:
// The config is a hardcoded object and the type is inferred from it for the
// demo. In a real project it would probably come from the outside world and
// I would define a zod schema for the type and validate the config using it

export enum GameReelingType {
  Regular = "Regular",
  Tumbling = "Tumbling"
}

const reelsCount = 6;

export const gameConfig = {
  assets: {
    symbols: ["cherry.png", "plum.png", "orange.png", "apple.png", "grapes.png", "watermelon.png"],
    spinButton: "spin.png",
    stopButton: "stop.png",
  },
  reelingType: "Tumbling" as GameReelingType,
  reelsCount: reelsCount,
  symbolsPerReel: 4,
  reelAreaWidth: 133 * reelsCount, // px
  // reelAreaWidth: 130, // px
  reelAreaHeight: 400, // px
  spinButtonSize: 150, // px
  spinningSpeed: 3, // full reel rotations per second
  stopDelay: 40, // time to first reel stop, ms
  stopInterval: 400, // time between reel stops, ms
  startInterval: 400, // time between reel starts, ms
  dropInterval: 40, // time between reel symbol drops, ms
  autoStopTimeout: 1000, // time to auto stop spin, ms
};

export type GameConfig = typeof gameConfig;

