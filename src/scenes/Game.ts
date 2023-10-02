import Phase from "phaser";
import PlayerController from "./PlayerController";
import ObstaclesController from "./ObstaclesController";
import SnowmanController from "./SnowmanController";
import { sharedInstance as events } from "./EventCenter";

export default class Game extends Phase.Scene {
  private cursors!: Phase.Types.Input.Keyboard.CursorKeys;
  private penguin!: Phase.Physics.Matter.Sprite;
  private snowmen: SnowmanController[] = [];
  private stars: Phase.Physics.Matter.Sprite[] = [];
  private obstacles!: ObstaclesController;
  private playerController!: PlayerController;
  private gameWin!: MatterJS.BodyType;
  private backgrounds: {
    ratioX: number;
    sprite: Phaser.GameObjects.TileSprite;
  }[] = [];

  constructor() {
    super("game");
  }

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = new ObstaclesController();
    this.snowmen = [];
    this.stars = [];

    events.once("restart-game", this.restartGame, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
      events.off("restart-game", this.restartGame, this);
    });
  }

  preload() {
    this.load.image("sky", "assets/Sky.png");
    this.load.image("mountains", "assets/Mountains.png");
    this.load.image("middle", "assets/Middle.png");
    this.load.image("foreground", "assets/Foreground.png");
    this.load.image("ground1", "assets/Ground_01.png");
    this.load.image("ground2", "assets/Ground_02.png");

    this.load.atlas("penguin", "assets/penguin.png", "assets/penguin.json");
    this.load.image("tiles", "assets/sheet.png");
    this.load.tilemapTiledJSON("tilemap", "assets/game.json");

    this.load.image("star", "assets/star.png");
    this.load.image("health", "assets/health.png");

    this.load.atlas("snowman", "assets/snowman.png", "assets/snowman.json");
  }

  create() {
    const { width, height } = this.scale;
    console.log({ width, height });
    this.scene.launch("ui");

    const sky = this.add
      .tileSprite(0, 0, width, height, "sky")
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);

    const mountains = this.add
      .tileSprite(0, 0, width, height, "mountains")
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);

    const middle = this.add
      .tileSprite(0, 0, width, height, "middle")
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);

    const foreground = this.add
      .tileSprite(0, 0, width, height, "foreground")
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);

    // const ground1 = this.add
    //   .tileSprite(0, 0, width, height, "ground1")
    //   .setOrigin(0, 0)
    //   .setScrollFactor(0, 0);

    // const ground2 = this.add
    //   .tileSprite(0, 0, width, height, "ground2")
    //   .setOrigin(0, 0)
    //   .setScrollFactor(0, 0);

    this.backgrounds = [
      {
        ratioX: 0,
        sprite: sky,
      },
      {
        ratioX: 0.01,
        sprite: mountains,
      },
      {
        ratioX: 0.05,
        sprite: middle,
      },
      {
        ratioX: 0.1,
        sprite: foreground,
      },
      // {
      //   ratioX: 1,
      //   sprite: ground1,
      // },
      // {
      //   ratioX: 1,
      //   sprite: ground2,
      // },
    ];

    const map = this.make.tilemap({ key: "tilemap" });
    const tileset = map.addTilesetImage("iceworld", "tiles");

    const ground = map.createLayer("ground", tileset);
    ground.setCollisionByProperty({ collides: true });
    ground.setDepth(1);

    map.createLayer("obstacles", tileset);

    const objectsLayer = map.getObjectLayer("objects");

    objectsLayer.objects.forEach((objData) => {
      const { name, x = 0, y = 0, width = 0, height = 0 } = objData;

      switch (name) {
        case "penguin-spawn": {
          this.penguin = this.matter.add
            .sprite(x + width * 0.5, y + height * 0.5, "penguin")
            .setFixedRotation();

          this.playerController = new PlayerController(
            this,
            this.penguin,
            this.cursors,
            this.obstacles
          );

          this.cameras.main.startFollow(this.penguin);
          this.cameras.main.setZoom(1);

          break;
        }
        case "star-spawn": {
          console.log("star spawn!");
          const star = this.matter.add.sprite(x, y, "star", undefined, {
            isStatic: true,
            isSensor: true,
          });

          star.setData("type", "star");
          this.stars.push(star);

          break;
        }
        case "spikes": {
          const spike = this.matter.add.rectangle(
            x + 0.5 * width,
            y + 0.5 * height,
            width,
            height,
            {
              isStatic: true,
            }
          );
          this.obstacles.add("spikes", spike);

          break;
        }
        case "health": {
          const health = this.matter.add.sprite(
            x + 0.5 * width,
            y + 0.5 * height,
            "health",
            undefined,
            {
              isStatic: true,
              isSensor: true,
            }
          );

          health.setData("type", "health");
          health.setData("healthPoints", 50);
          break;
        }
        case "snowman": {
          const snowman = this.matter.add
            .sprite(x + width * 0.5, y, "snowman")
            .setFixedRotation();

          this.snowmen.push(new SnowmanController(this, snowman));
          this.obstacles.add("snowman", snowman.body as MatterJS.BodyType);
          break;
        }
        case "game-win": {
          this.gameWin = this.matter.add.rectangle(
            x + 0.5 * width,
            y + 0.5 * height,
            width,
            height,
            {
              isStatic: true,
              isSensor: true,
            }
          );

          this.obstacles.add("gameWin", this.gameWin);

          break;
        }
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  destroy() {
    this.snowmen.forEach((snowman) => snowman.destroy());
    this.stars.forEach((star) => star.destroy());
    this.penguin.destroy();
  }

  update(_t: number, dt: number) {
    this.playerController.update(dt);
    this.snowmen.forEach((snowman) => {
      snowman.update(dt);
    });

    for (let i = 0; i < this.backgrounds.length; i++) {
      const bg = this.backgrounds[i];
      bg.sprite.tilePositionX = this.cameras.main.scrollX * bg.ratioX;
    }
  }

  restartGame() {
    this.destroy();
    this.scene.restart();
  }
}
