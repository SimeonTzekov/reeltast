import gsap from "gsap";
import { Container } from "pixi.js";

import {GameConfig, MockResult, mockResults} from "./config";
import { ReelArea, ReelAreaEvents } from "./ReelArea";
import { SpinButton } from "./SpinButton";
import { StopButton } from "./StopButton";



export class Game extends Container {
  private spinButton: SpinButton;
  private stopButton: StopButton;
  private reelArea: ReelArea;
  private resultState: MockResult | null = null;
  private uiDebugBtns: { [key: string]: Element } = {};

  constructor(config: GameConfig) {
    super();

    const reelArea = new ReelArea(config);
    this.addChild(reelArea);

    this.reelArea = reelArea;

    this.spinButton = new SpinButton();
    this.stopButton = new StopButton();

    [this.spinButton, this.stopButton].forEach((button) => {
      button.position.set(config.reelAreaWidth, config.reelAreaHeight / 2);
      button.anchor.set(0, 0.5);
      button.width = config.spinButtonSize;
      button.height = config.spinButtonSize;
      this.addChild(button);
    });

    this.stopButton.visible = false;

    this.spinButton.on("click", () => {
      reelArea.startSpinning();
      this.showStopButton();
      this.stopButton.disable();

      gsap.delayedCall(config.autoStopTimeout, () => {
        this.mockResult(mockResults[Math.floor(Math.random() * mockResults.length)]);
      });
    });

    this.stopButton.on("click", () => {
      // reelArea.stopSpinning();
      // this.mockResult();
      this.mockResult( mockResults[ Math.floor(Math.random() * mockResults.length) ] );
      this.showSpinButton();
      this.spinButton.disable();
    });

    reelArea.on(ReelAreaEvents.allStoppedSpinning, () => {
      console.warn('Game ReelAreaEvent allStoppedSpinning');
      this.showSpinButton();
      this.spinButton.enable();
      console.log(this.resultState);

      if (this.resultState) {
        console.log( this.resultState.winLines );
        if (this.resultState.winLines.length) {
          reelArea.showWinLines(this.resultState.winLines);
        }
        // this.resultState = null;
      }

    });

    reelArea.on(ReelAreaEvents.allStartedSpinning, () => {
      console.warn('Game ReelAreaEvent allStartedSpinning');
      this.stopButton.enable();
      console.log(this.resultState);
    });

    reelArea.on(ReelAreaEvents.allStoppedWithResult, () => {
      console.warn('Game ReelAreaEvent allStoppedWithResult');
      // this.resultState = null;
      // this.stopButton.enable();
      console.log(this.resultState);
    });

    this.uiDebugBtns = {
      "btnSetDirectionUP": document.getElementById('btnSetDirectionUP')!,
      "btnSetDirectionDOWN": document.getElementById('btnSetDirectionDOWN')!,
      "btnSetDirectionUPDOWN": document.getElementById('btnSetDirectionUPDOWN')!,
    }

    for (const key in this.uiDebugBtns) {
      if (Object.prototype.hasOwnProperty.call(this.uiDebugBtns, key)) {
        const btn = this.uiDebugBtns[key];
        console.log(key, btn);
        btn.addEventListener('click', () => {
          // console.log('btn', key, btn);
          // console.log(this)
          reelArea.setDirection( key.replace('btnSetDirection', '') );
        });
      }
    }

    /*this.uiDebugBtns.forEach((btn, key) => {

      btn.addEventListener('click', () => {
        console.log('btn', key);
        // reelArea.setDirection( key );
      });
    });*/

    /*setTimeout(()=>{
      reelArea.startSpinning();
      this.showStopButton();
      this.stopButton.disable();

      setTimeout(()=>{
        this.mockResult( mockResults[ 0 ] );
      }, 2000);
    }, 1000);*/
  }

  private mockResult(resultState: MockResult) {
    console.log('Game mockResult');
    this.showResult( JSON.parse(JSON.stringify( resultState )) );
    // return mockResults;
  }

  private showResult(resultState: MockResult) {
    console.log('Game showResult', resultState);
    this.resultState = resultState;
    this.reelArea.stopWithResult(resultState);
    // this.resultState = null;
  }

  private showSpinButton() {
    this.spinButton.visible = true;
    this.stopButton.visible = false;
  }

  private showStopButton() {
    this.spinButton.visible = false;
    this.stopButton.visible = true;
  }

}
