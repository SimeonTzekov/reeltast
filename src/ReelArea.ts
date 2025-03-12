import gsap from "gsap";
import {Container, Graphics} from "pixi.js";

import {GameConfig, MockResult} from "./config";
import {Reel, ReelEvents, ReelSpinDirection} from "./Reel";

export enum ReelAreaEvents {
  allStartedSpinning = "allStartedSpinning",
  allStoppedSpinning = "allStoppedSpinning",
  allStoppedWithResult = "allStoppedWithResult",
}

export class ReelArea extends Container {
  private reels: Reel[];
  private reelsFinishedSpinningCount = 0;
  private reelsFinishedWithResultCount = 0;
  private readonly stopDelay: number;
  private readonly stopInterval: number;
  private readonly startInterval: number;

  constructor(config: GameConfig) {
    console.log(' new ReelArea', config);
    super();

    this.stopDelay = config.stopDelay;
    this.stopInterval = config.stopInterval;
    this.startInterval = config.startInterval;

    this.mask = new Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, config.reelAreaWidth, config.reelAreaHeight)
      .endFill();

    this.addChild(this.mask);

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

    // const symbolWidth = config.reelAreaWidth / config.reelsCount;
    const symbolWidth = 133;

    this.reels = Array.from(
      { length: config.reelsCount },
      (_, index) => new Reel(config, index + 1)
    );

    for (const [i, reel] of this.reels.entries()) {
      reel.position.x = i * symbolWidth;
      this.addChild(reel);
    }

    for (const reel of this.reels) {
      reel.on(ReelEvents.stoppedSpinning, () => {
        this.reelsFinishedSpinningCount++;
        if (this.reelsFinishedSpinningCount === this.reels.length) {
          this.emit(ReelAreaEvents.allStoppedSpinning);
        }
      });
    }

    this.setDirection('UPDOWN')
  }

  public override on(
    event: ReelAreaEvents | Parameters<Container["on"]>[0],
    callback: () => void
  ) {
    return super.on(event, callback);
  }

  public startSpinning() {
    /*if (this.reels.length * this.startInterval > this.stopDelay) {
      throw new Error(
        `Invalid config: reels start after stop delay (${this.reels.length}*${this.startInterval} > ${this.stopDelay})`
      );
    }*/

    this.reelsFinishedSpinningCount = 0;

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
    for (const [i, reel] of this.reels.entries()) {
      gsap.delayedCall(i * this.stopInterval + this.stopDelay, () => {
        reel.stopWithResult(result.reelResults[i]);
      }).then(() => {
          this.reelsFinishedWithResultCount++;
          if (this.reelsFinishedWithResultCount === this.reels.length) {
            this.emit(ReelAreaEvents.allStoppedWithResult);
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
}
