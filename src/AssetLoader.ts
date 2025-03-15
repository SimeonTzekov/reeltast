import { Assets, Texture } from "pixi.js";

import { GameConfig } from "./config";

export type LoadedTexture = { texture: Texture, symbolId: number };

export class AssetLoader {
  private static instance: AssetLoader;

  private loadedTextures?: {
    [K in keyof GameConfig["assets"]]: GameConfig["assets"][K] extends Array<unknown>
      ? LoadedTexture[]
      : LoadedTexture;
  };

  private constructor() {
    if (AssetLoader.instance) {
      throw new Error("AssetLoader is a singleton");
    }

    AssetLoader.instance = this;
  }

  public static getInstance() {
    if (!AssetLoader.instance) {
      return new AssetLoader();
    }

    return AssetLoader.instance;
  }

  /*Object.entries(gameConfig.assets).map(
          async ([name, assetPathOrPaths]) => {
            if (Array.isArray(assetPathOrPaths)) {
              console.warn('   AssetLoader load', name, assetPathOrPaths);
              return [
                name,
                await Promise.all(
                  assetPathOrPaths.map((assetPath) => Assets.load(assetPath))
                ),
              ];
            } else {
              console.warn('   AssetLoader load', name, assetPathOrPaths);
              return [name, await Assets.load(assetPathOrPaths)];
            }
          }
        )*/

  async load(gameConfig: GameConfig) {
    console.log('   AssetLoader load', gameConfig);
    this.loadedTextures = Object.fromEntries(
      await Promise.all(
        Object.entries(gameConfig.assets).map(
          async ([name, assetPathOrPaths]) => {
            if (Array.isArray(assetPathOrPaths)) {
              console.warn('   AssetLoader load', name, assetPathOrPaths);
              return [
                name,
                await Promise.all(
                  assetPathOrPaths.map(async (assetPath, index) => ({
                    texture: await Assets.load(assetPath),
                    symbolId: index
                  } as LoadedTexture))
                ),
              ];
            } else {
              console.warn('   AssetLoader load', name, assetPathOrPaths);
              return [name, await Assets.load(assetPathOrPaths)];
            }
          }
        )
      )
    );

    console.log('   AssetLoader load done', this.loadedTextures);

  }

  getRandomSymbolTexture() {
    if (!this.loadedTextures) {
      throw new Error("Symbol textures not loaded yet");
    }

    const symbols = this.loadedTextures.symbols;
    let randomIndex = Math.floor(Math.random() * symbols.length);

    // console.warn('symbols[randomIndex]', symbols[randomIndex])

    return symbols[randomIndex];
  }

  getTexture<K extends keyof GameConfig["assets"]>(name: K) {
    if (!this.loadedTextures) {
      throw new Error("Textures not loaded yet");
    }

    return this.loadedTextures[name];
  }
}
