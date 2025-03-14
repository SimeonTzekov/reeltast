import {Sprite, Texture, Text, Container} from "pixi.js";

export class ReelSymbol extends Container {
  private readonly text: Text;
  public id: number;
  public sprite: Sprite;

  constructor(texture: Texture, width: number, height: number, id: number) {
    console.log('    new ReelSymbol', id, `w: ${width}, h: ${height}`);
    // super(texture);
    super();
    this.width = width;
    this.height = height;
    // this.anchor.set(0.5);
    this.id = id + 1;


    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = width;
    this.sprite.height = height;
    this.addChild(this.sprite);

    this.text = new Text("Symbol", {
      fontFamily: "Arial",
      fontSize: 54,
      fill: 0xffffff, // white color
      align: "center",
    });

    this.text.anchor.set(0.5);
    this.text.x = this.width / 2;
    this.text.y = this.height / 2;
    this.text.text = this.id;

    // this.addChild(this.text);
  }
}
