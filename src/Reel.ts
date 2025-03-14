import gsap from "gsap";
import { Container } from "pixi.js";

import { ReelSymbol } from "./ReelSymbol";
import { AssetLoader } from "./AssetLoader";
import { GameConfig } from "./config";

export enum ReelEvents {
  stoppedSpinning = "stoppedSpinning",
  winLineShown = "winLinesShown",
}

export enum ReelSpinDirection {
    up = -1,
    down = 1,
}

export class Reel extends Container {
  private symbols: ReelSymbol[];

  /** if the reel is currently in the stopping animation */
  private stopping = false;

  /** if the reel is currently in the backout part of the stopping animation
      used to loop the reels once when it starts to not show a blank space */
  private backoutStarted = false;

  /** if the reel needs to stop spinning, it will currently stop on the next loop
      we use a variable instead of directly stopping for 2 reasons:
        1. to ensure animation consistency by stopping from the next coming symbol
        2. to have the possibility to wait for a result before stopping (not implemented in the demo) */
  private needsToStop = false;

  private readonly symbolWidth: number;
  private readonly symbolHeight: number;
  private readonly reelAreaWidth: number;
  private readonly reelAreaHeight: number;

  /** the amount of time it takes one symbol going to go one symbols's height down
      which is done repeatedly use in the spinning animation */
  private readonly spinningTweenDuration: number;

  // private spinDirection: ReelSpinDirection = ReelSpinDirection.up;
  private spinDirection: ReelSpinDirection = ReelSpinDirection.down;
  private resultReceived = false;
  private readonly id: number;

  private displayResult: number[] = [];
  private config: GameConfig;

  constructor(config: GameConfig, id: number) {
    console.log('   new Reel', id);
    super();

    this.id = id;
    this.config = config;

    this.reelAreaWidth = config.reelAreaWidth;
    this.reelAreaHeight = config.reelAreaHeight;
    // this.symbolWidth = this.reelAreaWidth / config.reelsCount;
    this.symbolHeight = this.reelAreaHeight / config.symbolsPerReel;
    this.symbolWidth = 120;
    // this.symbolHeight = 120;
    this.spinningTweenDuration = 1000 / (config.symbolsPerReel * config.spinningSpeed);

    // this.ancor.x.set(0.5);

    this.symbols = [];
    this.createSymbols();
  }

  public override on(
    event: ReelEvents | Parameters<Container["on"]>[0],
    callback: (payload) => void
  ) {
    return super.on(event, callback);
  }

  public async startSpinning() {
    console.log('  Reel', this.id, 'startSpinning', this.resultReceived, this.needsToStop);

    // ease in to the spinning animiation
    this.needsToStop = false;
    this.resultReceived = false;
    await gsap.to(this.position, {
        y: this.symbolHeight * this.spinDirection,
        duration: this.spinningTweenDuration * 2, // will approximately match the linear speed of the spinning, but would be good to calculate it explicitly
        ease: "power1.in",
    });
    this.loopReel();
    this.position.y = 0;


  // would prefer to use repeat but I think it doesn't work reliably in GSAP - https://github.com/greensock/GSAP/issues/593
  // this.spinningTween = gsap.to(this.position, {
  //   startAt: { y: 0 },
  //   y: this.symbolHeight,
  //   duration: this.spinningTweenDuration,
  //   ease: "none",
  //   repeat: Infinity,
  //   onRepeat: () => {
  //     this.loopReel();
  //   },
  // });
  // instead we simulate the above repeat like so:
  const tween = gsap.to(this.position, {
    // start animating twice the height and time
    y: this.symbolHeight * 2 * this.spinDirection,
    duration: this.spinningTweenDuration * 2,
    ease: "none",
    onUpdate: () => {
      const time = tween.time();
      // when we cross the spinning duration (and equvalently 1 symbol height)
      // we loop the reel and restart the animation (accounting for the time passed)
      if (time > this.spinningTweenDuration) {
        this.loopReel();
        tween.time(time % this.spinningTweenDuration, true);
        if (this.needsToStop) {
          tween.pause();
          this.beginStoppingAnimation();
        }
      }
    },
  });
}

/** moves all symbols 1 position down, and puts a random symbol on the top
   when the spinning animation is reset, the reel will go back one place, and the symbols down one place, visually staying in the same place */
  private loopReel() {
        // console.log('  Reel loopReel', this.spinDirection, this.resultReceived, this.displayResult)

        const eps = 0.1;
        for (const symbol of this.symbols) {
            if (this.spinDirection === ReelSpinDirection.down) {
                symbol.position.y += this.symbolHeight;
                // only the last reel will be close to the boundary
                // we use reuse it as the random symbol and move it to the top
                if (symbol.position.y >= this.reelAreaHeight - eps) {
                    symbol.position.y = -this.symbolHeight;
                    if (this.resultReceived) {
                        const resultTextureId = this.displayResult.pop();
                        if (resultTextureId !== undefined) {
                            symbol.sprite.texture = AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1];
                        }
                        if (this.displayResult.length === 0) {
                          this.stopSpinning();
                        }
                    } else {
                        symbol.sprite.texture = AssetLoader.getInstance().getRandomSymbolTexture();
                    }
                }
            } else {
                symbol.position.y -= this.symbolHeight;
                if (symbol.position.y < 0 - eps) {
                    symbol.position.y = this.symbols.length * this.symbolHeight - this.symbolHeight;

                    if (this.resultReceived) {
                        const resultTextureId = this.displayResult.shift();
                        if (resultTextureId !== undefined) {
                            symbol.sprite.texture = AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1];
                        }
                        if (this.displayResult.length === 0) {
                            this.stopSpinning();
                        }
                    } else {
                        symbol.sprite.texture = AssetLoader.getInstance().getRandomSymbolTexture();
                    }

                }
            }
        }
        // tween.pause();
    }

  public stopSpinning() {
    this.needsToStop = true;
  }

  public async beginStoppingAnimation() {
    console.log('  Reel', this.id, 'beginStoppingAnimation')
    if (this.stopping) {
      // could be stopping from multiple sources, if it's already stopping, we let the animation continue
      return;
    }

    this.stopping = true;
    this.backoutStarted = false;

    await gsap.to(this.position, {
      y: this.symbolHeight * this.spinDirection,
      duration: this.spinningTweenDuration * 4, // approximately matches the spinning speed, but would be good to calculate it explicitly
      ease: "back.out",
      onUpdate: () => {
        // once the reel crosses the symbol height it will only go back
        // and we loop the last symbol to be visible at the top (without resetting the animation)
        if (!this.backoutStarted && this.position.y >= this.symbolHeight) {
          this.resultReceived = false;

          this.loopReel();
          for (const symbol of this.symbols) {
              if (this.spinDirection === ReelSpinDirection.down) {
                symbol.position.y -= this.symbolHeight;
              } else {
                symbol.position.y += this.symbolHeight;
              }
          }
          this.backoutStarted = true;
        }
      },
      onComplete: () => {
        // console.log('onComplete', this.needsToStop);
        this.needsToStop = false;
        this.backoutStarted = false;
        // this.resultReceived = false;
        // console.log('onComplete', this.needsToStop);
      }
    });

    // we loop the reel once more to reset the board for the next spin
    if (this.spinDirection === ReelSpinDirection.down) {
      this.loopReel();
      this.position.y = 0;
    } else {
      this.loopReel();
      this.position.y = 0;
    }

    this.stopping = false;
    this.resultReceived = false;

    this.emit(ReelEvents.stoppedSpinning);
    // if (this.resultReceived) {
    //   this.emit(ReelEvents.stoppedSpinning)
    // }
  }

  public stopWithResult(result: number[]) {
      console.log('  Reel', this.id, 'stopWithResult', result);

      this.resultReceived = true;
      this.displayResult = result;
    }

  public setDirection(direction: ReelSpinDirection) {
    console.log('  Reel', this.id, 'setDirection', direction);
    this.spinDirection = direction;

    for (const [i, symbol] of this.symbols.entries()) {
      if (this.spinDirection === ReelSpinDirection.down) {
        symbol.y = (i - 1) * this.symbolHeight;
      } else {
        symbol.y = (i) * this.symbolHeight;
      }
    }

  }

  public showWinLines(winLine: number) {
    console.log('  Reel', this.id, 'showWinLines', winLine);

    let winSymbolsShownCount = 0;
    const winSymbols = this.symbols.filter((symbol) => {
      const symbolAtPosition = Math.floor(symbol.y / this.symbolHeight) + 1;
      return symbolAtPosition === winLine;
    });

    winSymbols.forEach((symbol) => {

      gsap.to(symbol.scale, {
        x: symbol.scale.x * 1.1,
        y: symbol.scale.y * 1.1,
        duration: 250,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      });

      gsap.to(symbol, {
        alpha: 0.65,
        duration: 250,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut",
      }).then(() => {
        // console.warn('  ReelSymbol ', symbol.id, 'winLineShown');
        winSymbolsShownCount++;
        if (winSymbolsShownCount === winSymbols.length) {
          // console.warn('  ReelSymbol ', symbol.id, 'winLineShown');
          this.emit(ReelEvents.winLineShown, winLine);
        }
      });
    });

  }

  /* !!! */

  private createSymbols() {
    console.log(' Reel createSymbols');

    this.symbols = Array.from(
      // while animating, we see two halves of 2 different symbols on the top and bottom, so it +1 symbols in total
      {length: this.config.symbolsPerReel + 1},
      (_, index) => {
        return new ReelSymbol(
          AssetLoader.getInstance().getRandomSymbolTexture(),
          this.symbolWidth,
          this.symbolHeight,
          parseInt(this.id + '' + index)
        )
      }
    );

    for (const symbol of this.symbols) {
      symbol.y = -1 * this.symbolHeight;
      this.addChild(symbol);
    }

    this.positionSymbols();
  }

  private positionSymbols() {
    console.log(' Reel positionSymbols');
    for (const [i, symbol] of this.symbols.entries()) {
      // the first symbol is actually placed above the reel area so while moving down there won't be a blank space
      if (this.spinDirection === ReelSpinDirection.down) {
        symbol.y = (i - 1) * this.symbolHeight;
      } else {
        symbol.y = (i) * this.symbolHeight;
      }
    }
  }
}
