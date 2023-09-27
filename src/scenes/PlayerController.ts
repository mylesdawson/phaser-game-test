import Phaser from "phaser";
import StateMachine from "../machines/StateMachine";
import { sharedInstance as events } from "./EventCenter";
import ObstaclesController from "./ObstaclesController";

export default class PlayerController {
  private sprite!: Phaser.Physics.Matter.Sprite;
  private stateMachine!: StateMachine;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private obstacles!: ObstaclesController;
  private scene!: Phaser.Scene;
  private health = 100;
  private jumpSpacebarUp = false;

  private lastSnowman!: Phaser.Physics.Matter.Sprite;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    obstacles: ObstaclesController
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;

    this.createAnimations();
    this.stateMachine = new StateMachine(this, "player");

    this.stateMachine
      .addState("idle", {
        onEnter: this.idleOnEnter,
        onUpdate: this.idleOnUpdate,
      })
      .addState("walk", {
        onEnter: this.walkOnEnter,
        onUpdate: this.walkOnUpdate,
        onExit: this.walkOnExit,
      })
      .addState("jump", {
        onEnter: this.jumpOnEnter,
        onUpdate: this.jumpOnUpdate,
      })
      .addState("spike-hit", {
        onEnter: this.spikeHitOnEnter,
      })
      .addState("snowman-hit", {
        onEnter: this.snowmanHitOnEnter,
      })
      .addState("snowman-stomp", {
        onEnter: this.snowmanStompOnEnter,
      })
      .setState("idle");

    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;

      if (this.obstacles.is("spikes", body)) {
        this.stateMachine.setState("spike-hit");
        return;
      }

      if (this.obstacles.is("snowman", body)) {
        if (this.sprite.y < body.position.y) {
          // stomp on snowman
          this.lastSnowman = body.gameObject;
          this.stateMachine.setState("snowman-stomp");
        } else {
          // hit by snowman
          this.lastSnowman = body.gameObject;
          this.stateMachine.setState("snowman-hit");
        }
        return;
      }

      if (!gameObject) return;

      if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
        if (this.stateMachine.isCurrentState("jump")) {
          this.stateMachine.setState("idle");
        }
        return;
      }

      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      const type = sprite.getData("type");

      switch (type) {
        case "star": {
          events.emit("star-collected");
          sprite.destroy();
          break;
        }
        case "health": {
          const value = sprite.getData("healthPoints") ?? 0;
          this.health = Phaser.Math.Clamp(this.health + value, 0, 100);
          events.emit("health-changed", this.health);
          sprite.destroy();
          break;
        }
      }
    });
  }

  update(dt: number) {
    this.stateMachine.update(dt);
  }

  private spikeHitOnEnter() {
    this.sprite.setVelocityY(-8);
    this.health = Phaser.Math.Clamp(this.health - 50, 0, 100);
    console.log(this.health);
    events.emit("health-changed", this.health);

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0000);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
      yoyo: true,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value
        );
        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b
        );

        this.sprite.setTint(color);
      },
    });

    if (this.health === 0) {
      this.sprite.play("player-death");
    } else {
      this.stateMachine.setState("idle");
    }
  }

  private snowmanHitOnEnter() {
    if (this.lastSnowman) {
      if (this.sprite.x < this.lastSnowman.x) {
        this.sprite.setVelocityX(-20);
      } else {
        this.sprite.setVelocityX(20);
      }
    } else {
      this.sprite.setVelocityY(-20);
    }

    this.health = Phaser.Math.Clamp(this.health - 50, 0, 100);
    events.emit("health-changed", this.health);

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0x00ff);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
      yoyo: true,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value
        );
        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b
        );

        this.sprite.setTint(color);
      },
    });

    if (this.health === 0) {
      this.sprite.play("player-death");
    } else {
      this.stateMachine.setState("idle");
    }
  }

  private snowmanStompOnEnter() {
    this.sprite.setVelocityY(-10);
    events.emit("snowman-stomped", this.lastSnowman);
    this.stateMachine.setState("idle");
  }

  private idleOnEnter() {
    this.sprite.play("player-idle");
  }

  private idleOnUpdate() {
    if (this.cursors.left.isDown || this.cursors.right.isDown) {
      this.stateMachine.setState("walk");
    }

    const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    if (spaceJustPressed) {
      this.stateMachine.setState("jump");
    }
  }

  private walkOnEnter() {
    this.sprite.play("player-walk");
  }

  private walkOnUpdate() {
    const SPEED = 6;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-SPEED);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(SPEED);
    } else {
      this.sprite.setVelocityX(0);
      this.stateMachine.setState("idle");
    }
    const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
    if (spaceJustPressed) {
      this.stateMachine.setState("jump");
    }
  }

  private walkOnExit() {
    this.sprite.stop();
  }

  private jumpOnEnter() {
    this.jumpSpacebarUp = false;
    this.sprite.play("player-jump");
    this.sprite.setVelocityY(-16);
  }

  private jumpOnUpdate() {
    const SPEED = 6;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-SPEED);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(SPEED);
    }

    if (!this.jumpSpacebarUp && this.cursors.space.isUp) {
      if (this.sprite.body.velocity.y < 0) {
        this.sprite.setVelocityY(-(16 * 0.2));
      }
      this.jumpSpacebarUp = true;
    }
  }

  private createAnimations() {
    this.sprite.anims.create({
      key: "player-idle",
      frames: [{ key: "penguin", frame: "penguin_walk01.png" }],
    });

    this.sprite.anims.create({
      key: "player-walk",
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames("penguin", {
        start: 1,
        end: 4,
        prefix: "penguin_walk0",
        suffix: ".png",
      }),
      repeat: -1,
    });

    this.sprite.anims.create({
      key: "player-jump",
      frameRate: 30,
      frames: this.sprite.anims.generateFrameNames("penguin", {
        start: 1,
        end: 3,
        prefix: "penguin_jump0",
        suffix: ".png",
      }),
      repeat: 0,
    });

    this.sprite.anims.create({
      key: "player-death",
      frameRate: 30,
      frames: this.sprite.anims.generateFrameNames("penguin", {
        start: 1,
        end: 4,
        prefix: "penguin_die0",
        suffix: ".png",
      }),
      repeat: 0,
    });
  }
}
