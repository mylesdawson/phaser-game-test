import Phase from "phaser";
import PlayerController from "./PlayerController";
import ObstaclesController from "./ObstaclesController";
import SnowmanController from "./SnowmanController";

export default class Game extends Phase.Scene {
  private cursors!: Phase.Types.Input.Keyboard.CursorKeys;
  private penguin!: Phase.Physics.Matter.Sprite;
  private snowmen: SnowmanController[] = [];
  private obstacles!: ObstaclesController;
  private playerController!: PlayerController;

  constructor() {
    super("game");
  }

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = new ObstaclesController();
    this.snowmen = [];

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
    ``;
  }

  preload() {
    this.load.atlas("penguin", "assets/penguin.png", "assets/penguin.json");
    this.load.image("tiles", "assets/sheet.png");
    this.load.tilemapTiledJSON("tilemap", "assets/game.json");

    this.load.image("star", "assets/star.png");
    this.load.image("health", "assets/health.png");

    this.load.atlas("snowman", "assets/snowman.png", "assets/snowman.json");
  }

  create() {
    this.scene.launch("ui");
    const map = this.make.tilemap({ key: "tilemap" });
    const tileset = map.addTilesetImage("iceworld", "tiles");

    const ground = map.createLayer("ground", tileset);
    ground.setCollisionByProperty({ collides: true });

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

          break;
        }
        case "star-spawn": {
          const star = this.matter.add.sprite(x, y, "star", undefined, {
            isStatic: true,
            isSensor: true,
          });

          star.setData("type", "star");

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
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  destroy() {
    this.snowmen.forEach((snowman) => snowman.destroy());
  }

  update(t: number, dt: number) {
    this.playerController.update(dt);
    this.snowmen.forEach((snowman) => {
      snowman.update(dt);
    });
  }
}
