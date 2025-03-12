// Note:
// The config is a hardcoded object and the type is inferred from it for the
// demo. In a real project it would probably come from the outside world and
// I would define a zod schema for the type and validate the config using it

export const gameConfig = {
  assets: {
    symbols: ["cherry.png", "plum.jpg", "orange.jpg"],
    spinButton: "spin.png",
    stopButton: "stop.png",
  },
  reelsCount: 6,
  symbolsPerReel: 4,
  reelAreaWidth: 133 * 6, // px
  // reelAreaWidth: 130, // px
  reelAreaHeight: 400, // px
  spinButtonSize: 150, // px
  spinningSpeed: 3, // full reel rotations per second
  stopDelay: 40, // time to first reel stop, ms
  stopInterval: 40, // time between reel stops, ms
  startInterval: 40, // time between reel starts, ms
  autoStopTimeout: 2000, // time to auto stop spin, ms
};

export type GameConfig = typeof gameConfig;

export const mockResults = [
  {
    reelResults: [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    winLines: [1, 2, 3, 4]
  },
  {
    reelResults: [
      [1, 2, 3, 1],
      [1, 2, 3, 2],
      [1, 1, 3, 3],
      [1, 2, 3, 1],
      [1, 2, 3, 2],
      [1, 3, 3, 3],
    ],
    winLines: [1, 3]
  },

  {reelResults: [
      [1, 2, 2, 1],
      [2, 2, 3, 2],
      [1, 3, 3, 3],
      [1, 2, 3, 1],
      [1, 2, 1, 2],
      [1, 2, 3, 3],
    ],
    winLines: []
  },
  {
    reelResults: [
      [1, 1, 3, 2],
      [1, 2, 3, 2],
      [1, 3, 3, 2],
      [1, 1, 3, 2],
      [1, 2, 3, 2],
      [1, 3, 3, 2],
    ],
    winLines: [1, 3, 4]
  },
  {
    reelResults: [
      [ 1, 3, 1, 2],
      [ 2, 3, 1, 1],
      [ 3, 3, 1, 3],
      [ 1, 2, 1, 3],
      [ 2, 3, 1, 2],
      [ 3, 3, 1, 3],
    ],
    winLines: [3]
  },
];
export type MockResult = typeof mockResults[0];
