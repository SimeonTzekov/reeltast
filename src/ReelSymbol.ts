import { Sprite, Texture, Text } from "pixi.js";

export class ReelSymbol extends Sprite {
  private readonly text: Text;
  public id: number;

  constructor(texture: Texture, width: number, height: number, id: number) {
    console.log('    new ReelSymbol', id, width, height);
    super(texture);
    this.width = width;
    this.height = height;
    this.id = id + 1;

    this.text = new Text("Symbol", {
      fontFamily: "Arial",
      fontSize: 54,
      fill: 0x000000, // white color
      align: "center",
    });

    this.text.anchor.set(0.5);
    this.text.x = this.width / 2;
    this.text.y = this.height / 2;
    this.text.text = this.id;

    this.addChild(this.text);
  }
}
