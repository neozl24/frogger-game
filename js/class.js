/* Class.js
 *
 * 这个文件定义了游戏中的各种元素类，包括敌人类，玩家类，和实体类。
 * 实体类又有两个个子类，障碍物类 和 宝物类。
 * 宝物类进一步又有多个子类，分别具有各自独特的触发效果。
 *
 *
 * 下面是类的继承结构:
 *
 *  +-- Enemy
 *  |
 *  +-- Entity --+-- Obstacle
 *  |            |
 *  |            +-- Treasure --+-- BlueGem
 *  |                           +-- GreenGem
 *  |                           +-- OrangeGem
 *  |                           +-- Heart
 *  |                           +-- Key
 *  |                           +-- Star
 *  |
 *  +-- Player
 *
 */

/* jshint undef: false, unused: false, strict: false */

/* 这是玩家要躲避的敌人类 */
var Enemy = function(level) {
    this.level = level;
    this.initLocation();

    /* 敌人的图片或者雪碧图，需要用Resources.load()方法加载，这一步由engine已经完成 */
    this.sprite = 'images/enemy-bug.png';
};

/* 重置敌人的初始位置（绘图区域左侧之外）和速度。
 * 在实例对象初始化，或者已经移出屏幕边界，以及特殊效果触发时，都可能调用。
 */
Enemy.prototype.initLocation = function() {
    this.x = -CELL_WIDTH;
    this.y = CELL_HEIGHT * ( Math.ceil( Math.random() * 4) );

    /* 敌人的速度区间会随等级变化 */
    this.speed = (35 + this.level) * (2 + Math.random() * 3);
};

/* 此函数用来更新敌人的位置，参数 dt 表示时间间隙 */
Enemy.prototype.update = function(dt) {
    /* 给每一次的移动都乘以 dt 参数，以此来保证游戏在所有的电脑上
     * 都是以同样的速度运行的
     */
    this.x += this.speed * dt;

    /* 敌人跑到屏幕右侧之外后，将其重置到屏幕左侧 */
    if (this.x > CELL_WIDTH * 5) {
        this.initLocation();
    }
};

/* 此为游戏必须的函数，用来在屏幕上画出敌人，几个数字用来调整大小和坐标偏移 */
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 20, this.y - 20, 60, 102);
};

/* Entity类为障碍物类和宝物类的父类 */
var Entity = function() {
    this.initLocation();
};

/* 子类可能需要在多种情形下重设坐标，而不仅仅是初始化时 */
Entity.prototype.initLocation = function() {

    var col, row;

    /* 通过下面的循环，保证新生成的静态元素不会和目前已有的静态元素或玩家重叠。
     * 通过Controller.pavement这个二维变量，得知目前已有静态元素的位置信息。
     */
    do {
        col = Math.floor( Math.random() * 5);
        row = Math.floor( Math.random() * 4);
        this.x = CELL_WIDTH * col;
        this.y = CELL_HEIGHT * (row + 1);

    } while (Controller.pavement[row][col] ||
        (this.x === player.x && this.y === player.y)
    );
    Controller.pavement[row][col] = true;
};

/* Obstacle类是Entity类的子类，它的主要特点是玩家无法移动到障碍物所在区域 */
var Obstacle = function() {
    Entity.call(this);
    this.sprite = 'images/Rock.png';
};

Obstacle.prototype = Object.create(Entity.prototype);
Obstacle.prototype.constructor = Obstacle;

/* 障碍物在绘制时的大小和方位，我们进行了修正 */
Obstacle.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 10, this.y - 40, 80, 136);
};

/* Treasure类也是Entity类的子类，包含宝石、生命符等静态元素
 * 玩家移动到所在格子之后会导致其消失，并触发效果
 */
var Treasure = function() {
    Entity.call(this);
};

Treasure.prototype = Object.create(Entity.prototype);
Treasure.prototype.constructor = Treasure;

/* 宝物在绘制时的大小和方位，同样进行了修正 */
Treasure.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y - 15, 60, 102);
};

/* Treasure类的子类 */
var BlueGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Blue.png';
};
BlueGem.prototype = Object.create(Treasure.prototype);
BlueGem.prototype.constructor = BlueGem;

/* Treasure类的子类 */
var GreenGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Green.png';
};
GreenGem.prototype = Object.create(Treasure.prototype);
GreenGem.prototype.constructor = GreenGem;

/* Treasure类的子类 */
var OrangeGem = function() {
    Treasure.call(this);
    this.sprite = 'images/Gem Orange.png';
};
OrangeGem.prototype = Object.create(Treasure.prototype);
OrangeGem.prototype.constructor = OrangeGem;

/* Treasure类的子类 */
var Heart = function() {
    Treasure.call(this);
    this.sprite = 'images/Heart.png';
};
Heart.prototype = Object.create(Treasure.prototype);
Heart.prototype.constructor = Heart;
Heart.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y - 5, 60, 102);
};

/* Treasure类的子类 */
var Key = function() {
    Treasure.call(this);
    this.sprite = 'images/Key.png';
};
Key.prototype = Object.create(Treasure.prototype);
Key.prototype.constructor = Key;
Key.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 12, this.y - 30, 80, 136);
};

/* Treasure类的子类 */
var Star = function() {
    Treasure.call(this);
    this.sprite = 'images/Star.png';
};
Star.prototype = Object.create(Treasure.prototype);
Star.prototype.constructor = Star;


/* 玩家类的实例变量，拥有生命值信息和分数信息
 * 需要一个 update() 函数， render() 函数，和一个 handleInput()函数
 */
var Player = function() {
    this.sprite = 'images/char-boy.png';
    this.lives = 3;
    this.score = 0;

    /* 这个变量主要用来控制是否能被键盘响应 */
    this.canMove = true;

    this.initLocation();
};

/* initLocation不仅在初始化时调用，在游戏中只要角色回到初始位置，就调用这个函数 */
Player.prototype.initLocation = function() {
    this.x = CELL_WIDTH * 2;
    this.y = CELL_HEIGHT * 5;
};

/* 因为update函数会不断地被 Engine调用，所以我们只在这里检测是否与移动物体（敌人）发生碰撞。
 * 是否与静态物体(宝物等)发生碰撞，这个检测放到handleInput函数里，因为只有下达命令后才需检测
 */
Player.prototype.update = function() {

    /* 发生碰撞时先暂停游戏，然后在上面文字区域提示玩家发生碰撞，
     * 再将角色归附原位，最后继续游戏
     */
    if ( this.canMove && this.hasCollisionWith(allEnemies) ) {
        Controller.collideWithEnemy();
    }
};

/* 针对玩家位置检测是否与其它物体发生碰撞，如果碰到道具，则有一系列效果。
 * 参数为一个装满敌人，障碍物，或者宝物的数组对象（数组只能装载以上三种当中的单一种类）
 * 这个函数不仅有一个返回值（true或者false），而且在碰撞到Treasure类时，
 * 在函数内部直接交由Controller提供的API来处理。如果碰撞到了Enemy类和Obstacle类，
 * 则由外部函数处理。
 */
Player.prototype.hasCollisionWith = function(array) {

    /* 确保参数是Array对象 */
    if ( !(array instanceof Array) ) {
        console.log('not an array!');
        return false;
    }

    /* 遍历该数组 */
    for (var i = 0; i < array.length; i++) {
        var obj = array[i];

        /* 确保该数组成员有横纵坐标值，如果没有则跳入下一个循环 */
        if (obj === undefined ||
            obj === null ||
            !obj.hasOwnProperty('x') ||
            !obj.hasOwnProperty('y')
        ) {
            continue;
        }

        /* 具体数字是根据角色和甲虫的宽度量出来的，这时实际图片刚刚开始重叠 */
        if ((obj instanceof Enemy) &&
            Math.abs(this.x - obj.x) < 50 && this.y === obj.y) {
            return true;

        } else if ((obj instanceof Obstacle) &&
                    this.x === obj.x && this.y === obj.y) {
            return true;

        } else if ((obj instanceof Treasure) &&
                    this.x === obj.x && this.y === obj.y) {
            if (obj instanceof BlueGem) {
                Controller.obtainBlueGem();

            } else if (obj instanceof GreenGem) {
                Controller.obtainGreenGem();

            } else if (obj instanceof OrangeGem) {
                Controller.obtainOrangeGem();

            } else if ((obj instanceof Heart) && this.lives < 5) {
                Controller.obtainHeart();

            } else if (obj instanceof Key) {
                Controller.obtainKey();

            } else if (obj instanceof Star) {
                Controller.obtainStar();
            }

            /* 如果是碰撞到了Treasure类，则需要在这里对事件直接进行处理。
             * 将allTreasure中的对应元素移出(先赋值为null，再用Controller的工具API移除)，
             * 同时将pavement二维数组中对应的格子元素置为false。
             * 最后返回true。
             */
            array[i] = null;
            /* 注意这一行是赋值给allTreasure，而不是array，否则对allTreasure无效 */
            allTreasure = Controller.takeOutNullOrUndefined(array);
            var row = this.y / CELL_HEIGHT - 1,
                col = this.x / CELL_WIDTH ;
            Controller.pavement[row][col] = false;

            return true;
        }
    }

    /* 数组遍历结束时，函数仍没有返回，说明没有发生碰撞 */
    return false;
};

/* 参数修正是为了调整玩家图像的坐标显示 */
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 50);
};

Player.prototype.handleInput = function(direction) {
    /* 到达河边，或者和敌人发生碰撞时，为了让玩家看清发生了什么，会让角色短暂地固定在事发地。
     * 而如果处于这种状态下，角色的canMove属性就会被我们置为false。
     * 这时我们就直接返回，相当于此时handleInput函数不起作用，也即键盘方向键失去了响应。
     */
    if (!this.canMove) {
        return;
    }

    /* 若移动后和障碍物发生碰撞，则还原到碰撞前的位置，因此这里对碰撞前位置进行记录 */
    var lastX = this.x, lastY = this.y;

    switch (direction) {
        case 'left':
            if (this.x >= CELL_WIDTH) {
                this.x -= CELL_WIDTH;
            }
            break;
        case 'right':
            if (this.x < CELL_WIDTH * 4) {
                this.x += CELL_WIDTH;
            }
            break;
        case 'up':
            if (this.y > 0) {
                this.y -= CELL_HEIGHT;

                if (this.y <= 0) {
                    /* 到达最上面的河了，交由Controller处理 */
                    Controller.crossRiver();
                }
            }
            break;
        case 'down':
            if (this.y < CELL_HEIGHT * 5) {
                this.y += CELL_HEIGHT;
            }
            break;
        default:
            return;
    }

    /* 如果移动后和障碍物碰到一起去了，就回到刚才的位置，相当于不能朝障碍物移动 */
    if ( this.hasCollisionWith(allObstacles) ) {
        this.x = lastX;
        this.y = lastY;
    }
    /* 如果是移动后吃到一个宝物，函数内部已经做出了处理，暂时用不到它的返回值 */
    this.hasCollisionWith(allTreasure);
};
