import Phase from "phaser";
import { sharedInstance as events } from "./EventCenter";

export default class UI extends Phase.Scene {
  private starsLabel!: Phase.GameObjects.Text;
  private totalStars = 0;
  private starsCollected = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private lastHealth = 100;

  constructor() {
    super({
      key: "ui",
    });
  }

  init() {
    this.starsCollected = 0;
  }

  create() {
    this.graphics = this.add.graphics();
    this.setHealthBar(100);

    this.starsLabel = this.add.text(10, 30, "Stars: 0", {
      fontSize: "32px",
    });

    events.on("star-collected", this.handleStarCollected, this);

    events.on("health-changed", this.handleHealthChanged, this);

    events.on("star-spawn", this.handleStarSpawn, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      events.off("star-collected", this.handleStarCollected, this);
      events.off("health-changed", this.handleHealthChanged, this);
      events.off("star-spawn", this.handleStarSpawn, this);
    });
  }

  private setHealthBar(value: number) {
    const BAR_WIDTH = 200;
    const fillHealth = Phase.Math.Clamp(value * 2, 0, BAR_WIDTH);

    this.graphics.clear();
    this.graphics.fillStyle(0x808080);
    this.graphics.fillRoundedRect(10, 10, BAR_WIDTH, 20, 5);
    if (fillHealth > 0) {
      this.graphics.fillStyle(0x00ff00);
      this.graphics.fillRoundedRect(10, 10, fillHealth, 20, 5);
    }
  }

  private handleHealthChanged(value: number) {
    this.tweens.addCounter({
      from: this.lastHealth,
      to: value,
      duration: 200,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        console.log(value);
        this.setHealthBar(value);
      },
    });
    this.lastHealth = value;
  }

  private handleStarSpawn() {
    this.totalStars += 1;
  }

  private handleStarCollected() {
    ++this.starsCollected;
    this.starsLabel.text = `Stars: ${this.starsCollected}`;

    console.log({
      collected: this.starsCollected,
      total: this.totalStars,
    });

    // if (this.starsCollected >= this.totalStars) {
    //   const { width = 0, height = 0 } = this.sys.canvas;
    //   this.add.text(width * 0.5, height * 0.5, "Game Win!", {
    //     fontSize: "32px",
    //   });
    // }
  }
}
