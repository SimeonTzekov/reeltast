import {Sprite, Text, Container} from "pixi.js";
import gsap from "gsap";
import {getRandomInt} from "./utils";
import {LoadedTexture} from "./AssetLoader.ts";

export class ReelSymbol extends Container {
  private readonly text: Text;
  public id: number;
  public sprite: Sprite;
  public atPosition: number | null = null;
  private dim: { width: number; height: number } = {width: 0, height: 0};
  public symbolId: number | null = null;

  constructor(texture: LoadedTexture, width: number, height: number, id: number) {
    console.log('    new ReelSymbol', id, `w: ${width}, h: ${height}`);
    // super(texture);
    super();
    this.id = id + 1;
    this.width = width;
    this.height = height;
    this.dim.width = width;
    this.dim.height = height;

    this.sprite = new Sprite(texture.texture);
    this.symbolId = texture.symbolId;
    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);

    // this.sprite.width = width;
    // this.sprite.height = height;

    this.fitTexture();


    this.text = new Text("Symbol", {
      fontFamily: "Arial",
      fontSize: 18,
      fill: 0xffffff, // white color
      align: "center",
      stroke: 0x000000,
      strokeThickness: 3,
    });

    // this.text.anchor.set(0.5);
    this.text.x = -width / 2;
    this.text.y = -height / 2;
    this.text.text = this.id;

    this.addChild(this.text);
  }

  public switchTexture(texture: LoadedTexture) {
    console.log('   ReelSymbol', this.id, 'switchTexture', texture.symbolId);
    this.sprite.texture = texture.texture;
    this.symbolId = texture.symbolId;

    this.fitTexture();
  }

  public fitTexture() {
    // console.log('   ReelSymbol.fitTexture', this.sprite.texture);

    const textureAspectRatio = this.sprite.width / this.sprite.height;
    if (this.dim.width / this.dim.height > textureAspectRatio) {
      this.sprite.height = this.dim.height;
      this.sprite.width = this.dim.height * textureAspectRatio;
    } else {
      this.sprite.width = this.dim.width;
      this.sprite.height = this.dim.width / textureAspectRatio;
    }

    this.sprite.alpha = 1;
  }

  public winAnimation() {
    gsap.to(this.sprite, {
      alpha: 0.65,
      duration: 250,
      repeat: 3,
      yoyo: true,
      ease: "power1.inOut",
    });
    return gsap.to(this.sprite.scale, {
      x: this.sprite.scale.x * 1.1,
      y: this.sprite.scale.y * 1.1,
      duration: 250,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut"
    });
  }

  public dropToPosition(position: number, delay = 0) {
    console.log('   ReelSymbol', this.id, 'dropToPosition', position);

    this.atPosition = position;

    return gsap.to(this, {
      y: (position - 1) * this.dim.height,
      delay: delay,
      duration: 500,
      ease: "power1.in",
    }).then(() => {
      this.shakeAnimation();
    });
  }

  public shakeAnimation() {
    return gsap.to(this.sprite, {
      x: this.sprite.x - getRandomInt(-2, 2),
      y: this.sprite.y - getRandomInt(2, 5),
      duration: 40,
      ease: "power1",
      // delay: 50
    }).then(() => {
      gsap.to(this.sprite, {
        x: this.sprite.x + getRandomInt(1, 2),
        y: this.sprite.y + getRandomInt(1, 3),
        duration: 40,
        repeat: 1,
        yoyo: true,
        ease: "power1",
      }).then(() => {
        this.sprite.x = 0;
        this.sprite.y = 0;
      });
    });
  }

  public clearAnimation() {
    console.log('   ReelSymbol', this.id, 'clearAnimation');

    return gsap.to(this.sprite, {
      alpha: 0.5,
      // tint: 0xff0000,
      duration: 100,
      yoyo: true,
      repeat: 5,
      ease: "power1.out",
    }).then(() => {
      gsap.to(this.sprite, {
        alpha: 0,
        duration: 200,
        ease: "sine.out",
        // delay: 100
      })
      return gsap.to(this.sprite.scale, {
        x: this.sprite.scale.x + 0.5,
        y: this.sprite.scale.y + 0.5,
        duration: 200,
        ease: "sine.in",
      });
    });
  }
}
