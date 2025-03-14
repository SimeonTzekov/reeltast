import {Sprite, Texture, Text, Container} from "pixi.js";
import gsap from "gsap";

export class ReelSymbol extends Container {
  private readonly text: Text;
  public id: number;
  public sprite: Sprite;
  private dim: { width: number; height: number } = { width: 0, height: 0 };

  constructor(texture: Texture, width: number, height: number, id: number) {
    console.log('    new ReelSymbol', id, `w: ${width}, h: ${height}`);
    // super(texture);
    super();
    this.id = id + 1;
    this.width = width;
    this.height = height;
    this.dim.width = width;
    this.dim.height = height;

    this.sprite = new Sprite(texture);
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

  public switchTexture(texture: Texture) {
    // console.warn('   ReelSymbol.switchTexture', texture);
    this.sprite.texture = texture;

    this.fitTexture();

    /*const textureAspectRatio = texture.width / texture.height;
    if (this.width / this.height > textureAspectRatio) {
      this.sprite.height = this.height;
      this.sprite.width = this.height * textureAspectRatio;
    } else {
      this.sprite.width = this.width;
      this.sprite.height = this.width / textureAspectRatio;
    }
*/

  }

  private fitTexture() {
    // console.log('   ReelSymbol.fitTexture', this.sprite.texture);

    const textureAspectRatio = this.sprite.width / this.sprite.height;
    if (this.dim.width / this.dim.height > textureAspectRatio) {
      this.sprite.height = this.dim.height;
      this.sprite.width = this.dim.height * textureAspectRatio;
    } else {
      this.sprite.width = this.dim.width;
      this.sprite.height = this.dim.width / textureAspectRatio;
    }
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
    console.log('   ReelSymbol', this.id,  'dropToPosition', position);
    return gsap.to(this, {
      y: position * this.dim.height,
      delay: delay,
      duration: 500,
      ease: "power1.in",
    });
  }
}
