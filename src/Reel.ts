import gsap from "gsap";
import {Container} from "pixi.js";

import {ReelSymbol} from "./ReelSymbol";
import {AssetLoader} from "./AssetLoader";
import {GameConfig, GameReelingType} from "./config";

export enum ReelEvents {
  stoppedSpinning = "stoppedSpinning",
  winLineShown = "winLinesShown",
  symbolsDropFinished = "symbolDropFinished",
}

export enum ReelSpinDirection {
  up = -1,
  down = 1,
}

export class Reel extends Container {
  public symbols: ReelSymbol[] = [];

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
  public readonly id: number;

  private displayResult: number[] = [];
  private config: GameConfig;

  private symbolPositions: number[] = [];

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

    // this.symbols = [];
    this.createSymbols();
  }

  public override on(
    event: ReelEvents | Parameters<Container["on"]>[0],
    callback: (payload: number) => void
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
              // symbol.sprite.texture = AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1];
              symbol.switchTexture(AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1]);
            }
            if (this.displayResult.length === 0) {
              this.stopSpinning();
            }
          } else {
            // symbol.sprite.texture = AssetLoader.getInstance().getRandomSymbolTexture();
            symbol.switchTexture(AssetLoader.getInstance().getRandomSymbolTexture());
          }
        }
      } else {
        symbol.position.y -= this.symbolHeight;
        if (symbol.position.y < 0 - eps) {
          symbol.position.y = this.symbols.length * this.symbolHeight - this.symbolHeight;

          if (this.resultReceived) {
            const resultTextureId = this.displayResult.shift();
            if (resultTextureId !== undefined) {
              symbol.switchTexture(AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1]);
              // symbol.sprite.texture = AssetLoader.getInstance().getTexture('symbols')[resultTextureId - 1];
            }
            if (this.displayResult.length === 0) {
              this.stopSpinning();
            }
          } else {
            symbol.switchTexture(AssetLoader.getInstance().getRandomSymbolTexture());
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
      symbol.winAnimation().then(() => {
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
    console.log(' Reel', this.id, 'createSymbols');

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

    /*if (this.config.reelingType === GameReelingType.Regular) {
      this.positionSymbols();
    } else {
      this.dropSymbols();
    }*/
  }

  public positionSymbols() {
    console.log(' Reel positionSymbols', this.config.reelingType);

    if (this.config.reelingType === GameReelingType.Regular) {
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

  private resetSymbolPosition(symbol: ReelSymbol) {

    if (this.spinDirection === ReelSpinDirection.down) {
      symbol.y = -1 * this.symbolHeight;
    } else {
      symbol.y = this.symbols.length * this.symbolHeight;
    }

    symbol.atPosition = -1;

    symbol.switchTexture(  AssetLoader.getInstance().getRandomSymbolTexture() );
    symbol.fitTexture();
  }

  public dropSymbols() {
    console.log('  Reel', this.id, 'dropSymbols');

    let symbolsDroppedCount = 0;

    const symbolsToDrop = this.symbols.slice(0, this.symbols.length - 1);
    symbolsToDrop.forEach((symbol, i) => {
      symbol.dropToPosition(symbolsToDrop.length - i, i * 100).then(() => {
        symbolsDroppedCount++;
        if (symbolsDroppedCount === symbolsToDrop.length) {
          console.log('  Reel', this.id, 'dropSymbols finished');
          this.emit(ReelEvents.symbolsDropFinished);
        }
      });
    });
  }

  public clearPosition(positionIds: number[]) {
    console.log('  Reel', this.id, 'clearPosition', positionIds);

    const symbolsToClear = this.symbols.filter((symbol) => {
      // console.log('    ReelSymbol', symbol.id, symbol.atPosition);
      if (symbol.atPosition) {
        return positionIds.includes(symbol.atPosition);
      }
    });

    symbolsToClear.forEach((symbol) => {
      console.log('CLEAR    ReelSymbol', symbol.id, symbol.atPosition);
    });

    /*symbolsToClear.forEach((symbolToClear, index) => {
      return symbolToClear.clearAnimation().then(() => {
        console.log('  Reel', this.id, ' ReelSymbol', symbolToClear.id, 'clearPosition finished');
        // const emptyPosition = symbolToClear.atPosition;
        // this.resetSymbolPosition(symbolToClear);
        // this.shiftSymbolsDown(emptyPosition);
      });
    });*/

    const clearPromises = symbolsToClear.map((symbolToClear) => {
      return symbolToClear.clearAnimation().then(() => {
        console.log('  Reel', this.id, ' ReelSymbol', symbolToClear.id, 'clearPosition finished');
        // const emptyPosition = symbolToClear.atPosition
        this.resetSymbolPosition(symbolToClear);
      });
    });

    return Promise.all(clearPromises).then(() => {
      console.log('All clear animations finished');
      this.shiftSymbolsDown(positionIds.length);
    });

  }

  private getReadySymbol() {
    // console.warn('  Reel', this.id, 'getReadySymbol');
    const readySymbol = this.symbols.find((symbol) => (symbol.atPosition === null || symbol.atPosition === -1));
    return readySymbol;
  }

  public shiftSymbolsDown() {
    // console.clear();
    console.log('  Reel', this.id, 'shiftSymbolsDown');

    let symbolsShiftedCount = 0;
    const reelSlots: ReelSymbol[] | null [] = [];
    let emptyPosCount = 0;

    // [1, 2, 3, 4].reverse().forEach((position) => {
    [1, 2, 3, 4].reverse().forEach((position) => {
      const symbol = this.symbols.find((symbol) => symbol.atPosition === position);
      // console.log('    ReelSymbol at POS', position, symbol?.id);
      if (symbol) {
        console.log('pos', position, '      filled slot', symbol?.id, symbol?.atPosition, 'emptyPosCount', emptyPosCount);
        reelSlots[position] = symbol;
        this.shiftSymbolDown(symbol, emptyPosCount);
      } else {
        console.log('pos', position, '      empty slot', position);
        reelSlots[position] = null;
        emptyPosCount++;
      }
      /*if (!symbol) {
        let prevSymbol: ReelSymbol | undefined;
        let counter = 0;
        while (!prevSymbol && counter < 50) {
          prevSymbol = this.symbols.find((symbol) => symbol.atPosition === position - counter);
          counter++
        }
        // let prevSymbol = this.symbols.find((symbol) => symbol.atPosition === position - 1);
        console.log('emptyPosition', position, 'prevSymbol', prevSymbol?.id);

        if (prevSymbol) {
          this.shiftSymbolDown(prevSymbol);
          symbolsShiftedCount++;
        }
      }*/
    });

    [1, 2, 3, 4].reverse().forEach((position) => {
      const symbol = this.symbols.find((symbol) => symbol.atPosition === position);
      // console.log('    ReelSymbol at POS', position, symbol?.id);
      if (symbol) {
        reelSlots[position] = symbol;
      } else {
        reelSlots[position] = null;
      }
    });

    console.log('---------------------------------');

    let dropSymbolsCount = 0;
    reelSlots.reverse().forEach((reelSymbol, pos) => {
      console.log('---', pos, reelSymbol?.id);
      // console.log('pos', pos, reelSymbol?.id,   );
      if (reelSymbol === null) {
        const readySymbol = this.getReadySymbol();
        console.log('      empty slot', pos, 'readySymbol:', readySymbol?.id, readySymbol?.atPosition);
        // console.log('pos', pos, '      empty slot');
        // emptyPosCount++;
        if (readySymbol) {
          // console.log('readySymbol', readySymbol?.id, readySymbol?.atPosition );
          // readySymbol.posToGo = emptyPosCount;
          // gsap.delayedCall((1 - dropSymbolsCount) * 1000, () => {
          //   this.shiftSymbolDown(readySymbol, pos);
          // })
          readySymbol.atPosition = pos;
          readySymbol.dropToPosition(4 - pos, ( dropSymbolsCount ) * 150);
          dropSymbolsCount++;
        }
      }
    });

  }

  public shiftSymbolDown(symbolToShift: ReelSymbol, count: number = 1) {
    console.log('  Reel', this.id, 'shiftSymbolDown', symbolToShift?.id);

    if (symbolToShift.atPosition !== null) {
      symbolToShift.atPosition += count;
      symbolToShift.dropToPosition(symbolToShift.atPosition);
    }

  }

  public dropSymbolDown(emptyPosition: number | null) {
    console.warn('\n\n  Reel', this.id, 'shiftSymbolDown', emptyPosition);

    for (const [i, symbol] of this.symbols.entries()) {
      console.log('    ReelSymbol shiftSymbolsDown', symbol.id, symbol.atPosition);

      if (symbol.atPosition !== null && emptyPosition !== null && symbol.atPosition < emptyPosition) {
        symbol.atPosition++;
        symbol.dropToPosition(symbol.atPosition, i * 50);
      } else {
        if (symbol.atPosition === null && emptyPosition) {
          symbol.dropToPosition(1, i * 50);
          // symbol.dropToPosition(1, 0);
        }
      }

    }
  }
}
