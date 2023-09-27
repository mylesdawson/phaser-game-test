import Phaser from "phaser";
import { sharedInstance as events } from "./EventCenter";

export default class UI extends Phaser.Scene {
  private starsLabel!: Phaser.GameObjects.Text;
  private starsCollected = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private lastHealth = 100;
  private gameOver!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;

  constructor() {
    super("ui");
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

    this.gameOver = this.add.text(200, 200, "Game Over!", {
      fontSize: "40px",
    });
    this.gameOver.visible = false;

    this.restartText = this.add
      .text(200, 250, "Restart?", {
        fontSize: "40px",
        backgroundColor: "#ffffff",
        color: "#000000",
      })
      .setInteractive()
      .on("pointerdown", () => {
        this.restart();
      });
    this.restartText.setInteractive();
    this.restartText.visible = false;

    events.on("star-collected", this.handleStarCollected, this);
    events.on("health-changed", this.handleHealthChanged, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      events.off("star-collected", this.handleStarCollected, this);
      events.off("health-changed", this.handleHealthChanged, this);
    });
  }

  private restart() {
    this.starsLabel.destroy();
    this.gameOver.destroy();
    this.restartText.destroy();
    events.off("star-collected", this.handleStarCollected, this);
    events.off("health-changed", this.handleHealthChanged, this);
    events.emit("restart-game");
    // Don't restart this scene because its a child of other scenes and will duplicate!
    // this.scene.restart();
  }

  private setHealthBar(value: number) {
    const BAR_WIDTH = 200;
    const fillHealth = Phaser.Math.Clamp(value * 2, 0, BAR_WIDTH);

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

    if (value === 0) {
      this.gameOver.visible = true;
      this.restartText.visible = true;
    }

    this.lastHealth = value;
  }

  private handleStarCollected() {
    console.log("wow! star collected!");
    ++this.starsCollected;
    this.starsLabel.text = `Stars: ${this.starsCollected}`;
  }
}
