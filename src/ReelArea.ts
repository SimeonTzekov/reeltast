import gsap from "gsap";
import {Container, Graphics} from "pixi.js";

import {GameConfig, GameReelingType} from "./config";
import {Reel, ReelEvents, ReelSpinDirection} from "./Reel";
import {MockResult} from "./mockResults.ts";
import {getRandomInt} from "./utils.ts";

export enum ReelAreaEvents {
  allStartedSpinning = "allStartedSpinning",
  allStoppedSpinning = "allStoppedSpinning",
  allStoppedWithResult = "allStoppedWithResult",
  allStartedStoppingWithResult = "allStartedStoppingWithResult",
  allWinLinesShown = "allWinLinesShown",
  allSymbolsDropped = "allSymbolsDropped",
}

export class ReelArea extends Container {
  private readonly config: GameConfig;
  private reels: Reel[] = [];
  private reelsFinishedSpinningCount = 0;
  private reelsFinishedWithResultCount = 0;
  private reelsFinishedDroppingCount = 0;
  // private winLinesShownCount = 0;
  private winLinesShown: number[] = [];
  private resultDisplayed = false;
  private readonly stopDelay: number;
  private readonly stopInterval: number;
  private readonly startInterval: number;
  private resultState: MockResult | null = null;
  private reelsContainer: Container | null = null;

  constructor(config: GameConfig) {
    console.log(' new ReelArea', config);
    super();

    this.config = config;

    this.stopDelay = config.stopDelay;
    this.stopInterval = config.stopInterval;
    this.startInterval = config.startInterval;

   /* this.mask = new Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, config.reelAreaWidth, config.reelAreaHeight)
      .endFill();

    this.addChild(this.mask);*/

    this.addChild(
      new Graphics()
        .lineStyle(10, 0xaa0000)
        .drawRect(
          -10,
          -10,
          config.reelAreaWidth + 20,
          config.reelAreaHeight + 20
        )
    );

    this.addChild(
      new Graphics()
        .beginFill(0x444444)
        .drawRect(0, 0, config.reelAreaWidth, config.reelAreaHeight)
        .endFill()
    );

    this.createReels();
  }

  public override on(
    event: ReelAreaEvents | Parameters<Container["on"]>[0],
    callback: () => void
  ) {
    return super.on(event, callback);
  }

  public startSpinning() {
    console.log(' ReelArea startSpinning');
    /*if (this.reels.length * this.startInterval > this.stopDelay) {
      throw new Error(
        `Invalid config: reels start after stop delay (${this.reels.length}*${this.startInterval} > ${this.stopDelay})`
      );
    }*/

    this.reelsFinishedSpinningCount = 0;
    this.resultDisplayed = false;

    for (const [i, reel] of this.reels.entries()) {
      gsap.delayedCall(i * this.startInterval, () => {
        reel.startSpinning();
        if (i === this.reels.length - 1) {
          this.emit("allStartedSpinning");
        }
      });
    }

    /*for (const [i, reel] of this.reels.entries()) {
      // gsap.delayedCall(this.stopDelay + i * this.stopInterval, () => {
      setTimeout(() => {
        // reel.stopSpinning();
        // reel.stopWithResult([1, 1, 1, 1]);
      }, 2000);
    }*/
  }

  public stopSpinning() {
    for (const reel of this.reels) {
      reel.stopSpinning();
    }
  }

  public stopWithResult(result: MockResult) {
    console.log(' ReelArea stopWithResult', result);
    this.resultState = result;

    for (const [i, reel] of this.reels.entries()) {
      gsap.delayedCall(i * this.stopInterval + this.stopDelay, () => {
        reel.stopWithResult(result.reelResults[i]);
      }).then(() => {
          this.reelsFinishedWithResultCount++;
          if (this.reelsFinishedWithResultCount === this.reels.length) {
            this.emit(ReelAreaEvents.allStartedStoppingWithResult);
            this.reelsFinishedWithResultCount = 0;
          }
        }
      );
    }
  }

  public showWinLines(winLines: number[]) {
    console.log(' ReelArea showWinLines', winLines);

    for (const [i, winLine] of winLines.entries()) {
      gsap.delayedCall(i * 900, () => {
        for (const reel of this.reels) {
          reel.showWinLines(winLine);
        }
      });
    }

  }

  public setDirection( direction: string ) {
    console.log(' ReelArea setDirection', direction);
    for (const [i, reel] of this.reels.entries()) {
      switch (direction) {
        case 'UP':
          reel.setDirection( ReelSpinDirection.up );
          break;
        case 'DOWN':
          reel.setDirection( ReelSpinDirection.down );
          break;
        case 'UPDOWN':
          if (i%2 === 0) {
            reel.setDirection(ReelSpinDirection.up);
          } else {
            reel.setDirection(ReelSpinDirection.down);
          }
          break;
        default:
          break;
      }
    }
  }

  /* !!! */

  private createReels() {
    console.log(' ReelArea createSymbols');

    // return;

    // const symbolWidth = config.reelAreaWidth / config.reelsCount;
    const symbolWidth = 133;
    const symbolHeight = 105;
    this.reelsContainer = new Container();
    this.reelsContainer.x = symbolWidth / 2;
    this.reelsContainer.y = symbolHeight / 2;
    this.addChild(this.reelsContainer);

    this.reels = Array.from(
      { length: this.config.reelsCount },
      (_, index) => new Reel(this.config, index + 1)
    );

    this.reelsFinishedDroppingCount = 0;

    for (const [i, reel] of this.reels.entries()) {
      reel.position.x = i * symbolWidth;
      this.reelsContainer.addChild(reel);

      if (this.config.reelingType === GameReelingType.Regular) {
        reel.positionSymbols();
      } else {
        gsap.delayedCall(i * this.config.dropInterval, () => {
          reel.dropSymbols();
        });
      }
    }

    for (const reel of this.reels) {
      reel.on(ReelEvents.stoppedSpinning, () => {
        this.reelsFinishedSpinningCount++;
        if (this.reelsFinishedSpinningCount === this.reels.length) {
          this.emit(ReelAreaEvents.allStoppedSpinning);
          if (this.resultState) {
            this.emit(ReelAreaEvents.allStoppedWithResult);
          }
        }
      });

      reel.on(ReelEvents.winLineShown, (winLineId) => {
        // console.warn('   ReelArea ReelEvent winLinesShown', winLineId, this.winLinesShown);
        // console.log(this.resultState?.winLines);
        if (!this.resultDisplayed && !this.winLinesShown.includes(winLineId)) {
          this.winLinesShown.push(winLineId);
        }
        if (this.winLinesShown.length === this.resultState?.winLines.length) {
          this.emit(ReelAreaEvents.allWinLinesShown);
          this.winLinesShown = [];
          this.resultDisplayed = true;
        }
      });

      reel.on(ReelEvents.symbolsDropFinished, () => {
        // console.warn('   ReelArea ReelEvent symbolsDropFinished', this.reelsFinishedDroppingCount, reelId, this.reels.length);
        this.reelsFinishedDroppingCount++;
        if (this.reelsFinishedDroppingCount === this.reels.length) {
          this.emit(ReelAreaEvents.allSymbolsDropped);
          this.reelsFinishedDroppingCount = 0;
        }
      });
    }

  }

  public clearSymbol( symbolId: number ) {
    console.log(' ReelArea clearSymbol', symbolId);

    for (const reel of this.reels) {

      console.log('>>>', reel.id);

      for (const symbol of reel.symbols) {
        console.log('>>>>>', symbol.id, symbol.symbolId, symbol.atPosition);
        if (symbol.symbolId === symbolId && symbol.atPosition !== null) {
          console.log('>>>>>>>>> clear');
          reel.clearPosition([symbol.atPosition]);
          //   symbol.clear();
        }
      }

      // reel.clearPosition( symbolId );
    }
  }




  /* !!!!!!!!!!!!!!! */
  public debugReels() {
    // console.clear();
    console.log(' ReelArea debugReels');

    // this.clearSymbol(5);
    // this.clearSymbol(2);

    // const reel = this.reels[0];

    // this.reels[0].clearPosition(1);

    // this.reels.forEach((reel) => {
    //   reel.clearPosition(
    //     Array.from({ length: getRandomInt(1, 4) }, () => getRandomInt(1, 4))
    //   )
    // });

    // this.reels[ getRandomInt( 0, this.reels.length-1 ) ].clearPosition([4,2,1]);
    // this.reels[0].clearPosition([1]);
    // this.reels[1].clearPosition([1,4]);
    // this.reels[2].clearPosition([2,3, 4]);
    // this.reels[3].clearPosition([1,2,3,4]);
    // this.reels[4].clearPosition([4]);
    // this.reels[5].clearPosition([3]);
    // this.reels[0].clearPosition(4);
    // this.reels[1].clearPosition(2);

    // console.log(reel)

    for (const [i, reel] of this.reels.entries()) {
      // console.log(i, reel);

      // reel.clearPosition( getRandomInt(1,2) );
      // reel.clearPosition( getRandomInt(3,4) );
      // reel.clearPosition( 1 );
      // reel?.clearPosition( 2 ).then(()=>{
      //   reel.clearPosition( 4 );
      // });
      // reel.clearPosition( 3 );
      // reel.clearPosition( 4 );

    }
  }

}
