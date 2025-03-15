import gsap from "gsap";
import { Container } from "pixi.js";

import {GameConfig} from "./config";
import { ReelArea, ReelAreaEvents } from "./ReelArea";
import { SpinButton } from "./SpinButton";
import { StopButton } from "./StopButton";
import { MockResult, mockResults } from "./mockResults.ts";
import {AssetLoader} from "./AssetLoader.ts";

export class Game extends Container {
  private config: GameConfig;
  private spinButton: SpinButton = new SpinButton();
  private stopButton: StopButton = new StopButton();
  private reelArea: ReelArea;
  private resultState: MockResult | null = null;
  private uiDebugBtns: { [key: string]: { [key: string]: Element } } = {};

  constructor(config: GameConfig) {
    console.log('new Game', config);
    super();
    this.config = config;

    this.initUIButtons();

    const reelArea = new ReelArea(config);
    this.addChild(reelArea);
    this.reelArea = reelArea;


    reelArea.on(ReelAreaEvents.allStoppedSpinning, () => {
      console.warn('Game ReelAreaEvent allStoppedSpinning');

      if (this.resultState) {
        if (this.resultState.winLines.length) {
          reelArea.showWinLines(this.resultState.winLines);
        }
      }
    });

    reelArea.on(ReelAreaEvents.allStartedSpinning, () => {
      console.warn('Game ReelAreaEvent allStartedSpinning');
      this.stopButton.enable();
    });

    reelArea.on(ReelAreaEvents.allStartedStoppingWithResult, () => {
      console.warn('Game ReelAreaEvent allStartedStoppingWithResult');
      this.spinButton.disable();
      this.showSpinButton();
    });

    reelArea.on(ReelAreaEvents.allStoppedWithResult, () => {
      console.warn('Game ReelAreaEvent allStoppedWithResult');

      if (this.resultState?.winLines.length === 0) {
        this.showSpinButton();
        this.spinButton.enable();
      }
    });

    reelArea.on(ReelAreaEvents.allWinLinesShown, () => {
      console.warn('Game ReelAreaEvent allLinesShown');

      this.showSpinButton();
      this.spinButton.enable();
    });

    reelArea.on(ReelAreaEvents.allSymbolsDropped, () => {
      console.warn('   Game ReelAreaEvent allSymbolsDropped');

      /* debug */
      setTimeout(()=> {
        reelArea.debugReels();
      }, 200);
      /* debug */

    });

    this.initDebugBtns();
  }

  private initUIButtons() {
    console.log('Game initUIButtons');

    // this.spinButton = new SpinButton();
    // this.stopButton = new StopButton();

    [this.spinButton, this.stopButton].forEach((button) => {
      button.position.set(this.config.reelAreaWidth, this.config.reelAreaHeight / 2);
      button.anchor.set(0, 0.5);
      button.width = this.config.spinButtonSize;
      button.height = this.config.spinButtonSize;
      this.addChild(button);
    });

    this.stopButton.visible = false;

    this.spinButton.on("click", () => {
      this.reelArea.startSpinning();
      this.showStopButton();
      this.stopButton.disable();

      gsap.delayedCall(this.config.autoStopTimeout, () => {
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
  }

  private initDebugBtns() {
    console.log('Game initDebugBtns');
    this.uiDebugBtns = {
      direction: {
        "btnSetDirectionUP": document.getElementById('btnSetDirectionUP')!,
        "btnSetDirectionDOWN": document.getElementById('btnSetDirectionDOWN')!,
        "btnSetDirectionUPDOWN": document.getElementById('btnSetDirectionUPDOWN')!,
      },
      symbols: {},
    }
    const symbolButtonsHolder = document.getElementById('clearSymbolButtons')!;

    const loadedSymbolTextures = AssetLoader.getInstance()?.loadedTextures?.['symbols'];
    loadedSymbolTextures?.forEach((texture, i) => {
      console.log('initDebugBtns', texture.symbolId, texture.symbolName);
      const button = this.uiDebugBtns.symbols[`btn-${texture.symbolId}`] = document.createElement('button');
      button.textContent = texture.symbolId.toString();
      button.style.backgroundImage = `url(/${texture.symbolName})`;

      button.addEventListener(('click'), () => {
        this.reelArea.clearSymbol(texture.symbolId);
      });

      symbolButtonsHolder.appendChild(button);
    });

    for (const groupKey in this.uiDebugBtns) {
      const group = this.uiDebugBtns[groupKey];
      console.log('', groupKey);
      for (const btnKey in group) {
        const btn = group[btnKey];
        console.log(' ', btnKey, btn);
        if (groupKey === 'direction') {
          btn.addEventListener('click', () => {
            this.reelArea.setDirection( btnKey.replace('btnSetDirection', '') );
          });
        }
      }
    }

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
