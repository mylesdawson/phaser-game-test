import Phaser from "phaser";
import { sharedInstance as events } from "./EventCenter";

export default class UI extends Phaser.Scene {
  private starsLabel!: Phaser.GameObjects.Text;
  private starsCollected = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private lastHealth = 100;
  private gameOver!: Phaser.GameObjects.Text;
  private restartText!: Phaser.GameObjects.Text;
  private gameWin!: Phaser.GameObjects.Text;

  constructor() {
    super("ui");
  }

  init() {
    this.starsCollected = 0;
  }

  preload() {
    this.load.image("snow-particle", "assets/snow.png");
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

    this.gameWin = this.add.text(200, 200, "Game Win!", {
      fontSize: "40px",
    });
    this.gameWin.visible = false;

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

    const particles = this.add.particles("snow-particle");
    particles.setDepth(0);

    // const { width, height } = this.scale;
    // const emitter = particles.createEmitter({
    //   x: 0,
    //   y: 0,
    //   emitZone: {
    //     source: new Phaser.Geom.Rectangle(0 * 3, 0, 100 * 7, 100),
    //     type: "random",
    //     quantity: 30,
    //   },
    //   speedY: { min: 50, max: 70 },
    //   speedX: { min: -20, max: 20 },
    //   accelerationY: { random: [10, 15] },
    //   lifespan: { min: 8000, max: 10000 },
    //   scale: { random: [0.25, 0.75] },
    //   alpha: { random: [0.1, 0.5] },
    //   gravityY: 10,
    //   frequency: 3,
    //   blendMode: Phaser.BlendModes.ADD,
    // });
    // emitter.setScrollFactor(0);

    events.on("star-collected", this.handleStarCollected, this);
    events.on("health-changed", this.handleHealthChanged, this);
    events.on("game-win", this.handleGameWin, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      events.off("star-collected", this.handleStarCollected, this);
      events.off("health-changed", this.handleHealthChanged, this);
      events.off("game-win", this.handleGameWin, this);
    });
  }

  private restart() {
    this.starsLabel.destroy();
    this.gameOver.destroy();
    this.restartText.destroy();
    events.off("star-collected", this.handleStarCollected, this);
    events.off("health-changed", this.handleHealthChanged, this);
    events.off("game-win", this.handleGameWin, this);
    events.emit("restart-game");
    // Don't restart this scene because its a child of other scenes and will duplicate!
    // this.scene.restart();
  }

  private handleGameWin() {
    this.gameWin.visible = true;
    this.restartText.visible = true;
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
