/* Resources.js
 *
 * 这是一个简单的图片加载工具。他简化了图片加载的过程从而这些图片可以在你的游戏里面使用。
 * 这个工具还包含一个缓存层从而当你试图加载同一张图片多次的时候可以重复使用缓存的图片
 */

/* jshint undef: false, unused: false */

(function() {
    'use strict';
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    /* 这是公开访问的图片加载函数, 它接受一个指向图片文件的字符串的数组或者是单个图片的
     * 路径字符串。然后再调用我们私有的图片加载函数。
     */
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            /* 如果开发者传进来一个图片数组，循环访问每个值，然后调用我们的图片加载器 */
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        } else {
            /* 如果开发者传进来的不是一个数组，那么就可以认为参数值是一个字符串，
             * 然后立即调用我们的图片加载器即可。
             */
            _load(urlOrArr);
        }
    }

    /* 这是我们私有的图片加载函数， 它会被公有的图片加载函数调用 */
    function _load(url) {
        if(resourceCache[url]) {
            /* 如果这个 URL 之前已经被加载了，那么它会被放进我们的资源缓存数组里面，
             * 然后直接返回那张图片即可。
             */
            return resourceCache[url];
        } else {
            /* 否则， 这个 URL 之前没被加载过而且在缓存里面不存在，那么我们得加载这张图片
             */
            var img = new Image();
            img.onload = function() {
                /* 一旦我们的图片已经被加载了，就把它放进我们的缓存，然后我们在开发者试图
                 * 在未来再次加载这个图片的时候我们就可以简单的返回即可。
                 */
                resourceCache[url] = img;
                /* 一旦我们的图片已经被全部加载和缓存，调用所有我们已经定义的回调函数。
                 */
                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };

            /* 将一开始的缓存值设置成 false 。在图片的 onload 事件回调被调用的时候会
             * 改变这个值。最后，将图片的 src 属性值设置成传进来的 URl 。
             */
            resourceCache[url] = false;
            img.src = url;
        }
    }

    /* 这个函数用来让开发者拿到他们已经加载的图片的引用。如果这个图片被缓存了，
     * 这个函数的作用和在那个 URL 上调用 load() 函数的作用一样。
     */
    function get(url) {
        return resourceCache[url];
    }

    /* 这个函数是否检查所有被请求加载的图片都已经被加载了。
     */
    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    /* 这个函数会在被请求的函数都被加载了这个事件的回调函数栈里面增加一个函数。*/
    function onReady(func) {
        readyCallbacks.push(func);
    }

    /* 这个对象通过创造一个公共的资源对象来定义公有的开发者可以访问的函数。*/
    window.Resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();

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

/* jshint undef: false, unused: false */

/* 这是玩家要躲避的敌人类 */
var Enemy = function(level) {
    'use strict';
    this.level = level;
    this.initLocation();

    /* 敌人的图片或者雪碧图，需要用Resources.load()方法加载，这一步由engine已经完成 */
    this.sprite = 'images/enemy-bug.png';
};

/* 重置敌人的初始位置（绘图区域左侧之外）和速度。
 * 在实例对象初始化，或者已经移出屏幕边界，以及特殊效果触发时，都可能调用。
 */
Enemy.prototype.initLocation = function() {
    'use strict';
    this.x = -CELL_WIDTH;
    this.y = CELL_HEIGHT * (Math.ceil(Math.random() * 4));

    /* 敌人的速度区间会随等级变化，k是一个随等级变化的系数 */
    var k = 1;
    var baseSpeed = 36;
    if (this.level < 36) {
        baseSpeed = 36 + this.level * k;
    } else if (this.level < 72) {
        baseSpeed = 36 + 36 * 1 + (this.level - 36) * 0.95;
    } else if (this.level < 108) {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + (this.level - 72) * 0.88;
    } else if (this.level < 144) {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + 36 * 0.88 +
            (this.level - 108) * 0.77;
    } else {
        baseSpeed = 36 + 36 * 1 + 36 * 0.95 + 36 * 0.88 +
            36 * 0.77 + (this.level - 144) * 0.6;
    }
    this.speed = baseSpeed * (2 + Math.random() * 3);
};

/* 此函数用来更新敌人的位置，参数 dt 表示时间间隙 */
Enemy.prototype.update = function(dt) {
    'use strict';
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
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x + 20, this.y - 20, 60, 102);
};

/* Entity类为障碍物类和宝物类的父类 */
var Entity = function() {
    'use strict';
    this.initLocation();
};

/* 子类可能需要在多种情形下重设坐标，而不仅仅是初始化时 */
Entity.prototype.initLocation = function() {
    'use strict';
    var col, row;

    /* 通过下面的循环，保证新生成的静态元素不会和目前已有的静态元素或玩家重叠。
     * 通过Controller.pavement这个二维变量，得知目前已有静态元素的位置信息。
     */
    do {
        col = Math.floor(Math.random() * 5);
        row = Math.floor(Math.random() * 4);
        this.x = CELL_WIDTH * col;
        this.y = CELL_HEIGHT * (row + 1);

    } while (Controller.pavement[row][col] ||
        (this.x === player.x && this.y === player.y)
    );
    Controller.pavement[row][col] = true;
};

/* Obstacle类是Entity类的子类，它的主要特点是玩家无法移动到障碍物所在区域 */
var Obstacle = function() {
    'use strict';
    Entity.call(this);
    this.sprite = 'images/Rock.png';
};

Obstacle.prototype = Object.create(Entity.prototype);
Obstacle.prototype.constructor = Obstacle;

/* 障碍物在绘制时的大小和方位，我们进行了修正 */
Obstacle.prototype.render = function() {
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x + 10, this.y - 40, 80, 136);
};

/* Treasure类也是Entity类的子类，包含宝石、生命符等静态元素
 * 玩家移动到所在格子之后会导致其消失，并触发效果
 */
var Treasure = function() {
    'use strict';
    Entity.call(this);
};

Treasure.prototype = Object.create(Entity.prototype);
Treasure.prototype.constructor = Treasure;

/* 宝物在绘制时的大小和方位，同样进行了修正 */
Treasure.prototype.render = function() {
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y - 15, 60, 102);
};

/* Treasure类的子类 */
var BlueGem = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Gem Blue.png';
};
BlueGem.prototype = Object.create(Treasure.prototype);
BlueGem.prototype.constructor = BlueGem;

/* Treasure类的子类 */
var GreenGem = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Gem Green.png';
};
GreenGem.prototype = Object.create(Treasure.prototype);
GreenGem.prototype.constructor = GreenGem;

/* Treasure类的子类 */
var OrangeGem = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Gem Orange.png';
};
OrangeGem.prototype = Object.create(Treasure.prototype);
OrangeGem.prototype.constructor = OrangeGem;

/* Treasure类的子类 */
var Heart = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Heart.png';
};
Heart.prototype = Object.create(Treasure.prototype);
Heart.prototype.constructor = Heart;
Heart.prototype.render = function() {
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x + 21, this.y - 5, 60, 102);
};

/* Treasure类的子类 */
var Key = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Key.png';
};
Key.prototype = Object.create(Treasure.prototype);
Key.prototype.constructor = Key;
Key.prototype.render = function() {
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x + 12, this.y - 30, 80, 136);
};

/* Treasure类的子类 */
var Star = function() {
    'use strict';
    Treasure.call(this);
    this.sprite = 'images/Star.png';
};
Star.prototype = Object.create(Treasure.prototype);
Star.prototype.constructor = Star;


/* 玩家类的实例变量，拥有生命值信息和分数信息
 * 需要一个 update() 函数， render() 函数，和一个 handleInput()函数
 */
var Player = function() {
    'use strict';
    var roleImages = [
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'
    ];
    var index = Math.floor(Math.random() * roleImages.length);
    this.sprite = roleImages[index];

    this.lives = 3;
    this.score = 0;

    /* 这个变量主要用来控制是否能被键盘响应 */
    this.canMove = true;

    this.initLocation();
};

/* initLocation不仅在初始化时调用，在游戏中只要角色回到初始位置，就调用这个函数 */
Player.prototype.initLocation = function() {
    'use strict';
    this.x = CELL_WIDTH * 2;
    this.y = CELL_HEIGHT * 5;
};

/* 因为update函数会不断地被 Engine调用，所以我们只在这里检测是否与移动物体（敌人）发生碰撞。
 * 是否与静态物体(宝物等)发生碰撞，这个检测放到handleInput函数里，因为只有下达命令后才需检测
 */
Player.prototype.update = function() {
    'use strict';
    /* 发生碰撞时先暂停游戏，然后在上面文字区域提示玩家发生碰撞，
     * 再将角色归附原位，最后继续游戏
     */
    if (this.canMove && this.hasCollisionWith(allEnemies)) {
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
    'use strict';
    /* 确保参数是Array对象 */
    if (!(array instanceof Array)) {
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

            } else if (obj instanceof Heart) {
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
            allTreasure = Util.takeOutNullOrUndefined(array);
            var row = this.y / CELL_HEIGHT - 1,
                col = this.x / CELL_WIDTH;
            Controller.pavement[row][col] = false;

            return true;
        }
    }

    /* 数组遍历结束时，函数仍没有返回，说明没有发生碰撞 */
    return false;
};

/* 参数修正是为了调整玩家图像的坐标显示 */
Player.prototype.render = function() {
    'use strict';
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 50);
};

Player.prototype.handleInput = function(direction) {
    'use strict';
    /* 到达河边，或者和敌人发生碰撞时，为了让玩家看清发生了什么，会让角色短暂地固定在事发地。
     * 而如果处于这种状态下，角色的canMove属性就会被我们置为false。
     * 这时我们就直接返回，相当于此时handleInput函数不起作用，也即键盘方向键失去了响应。
     */
    if (!this.canMove) {
        return;
    }

    /* 若移动后和障碍物发生碰撞，则还原到碰撞前的位置，因此这里对碰撞前位置进行记录 */
    var lastX = this.x,
        lastY = this.y;

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
    if (this.hasCollisionWith(allObstacles)) {
        this.x = lastX;
        this.y = lastY;
    }
    /* 如果是移动后吃到一个宝物，函数内部已经做出了处理，暂时用不到它的返回值 */
    this.hasCollisionWith(allTreasure);
};

/* Util.js
 *
 * 这个文件用来提供工具函数，为其它数据操作提供辅助功能
 *
 */

/* jshint undef: false, unused: false */

var Util = (function(global) {
    'use strict';
    /* 功能函数，返回值是参数数组去掉了null或undefined之后的结果 */
    var takeOutNullOrUndefined = function(array) {
        var newArray = [];
        for (var i = 0, j = 0; i < array.length; i++) {
            /* 如果元素不是null或undefined，就移到新数组来 */
            if (array[i] !== null && array[i] !== undefined) {
                newArray[j] = array[i];
                j++;
            }
        }
        return newArray;
    };

    var prefix = 'frogger_game_';
    /* localStorage是以字符串形式存储的，所以JSON对象要先转化才能存取，读取同理 */
    var StorageGetter = function(key) {
        var stringValue = global.localStorage.getItem(prefix + key);
        return JSON.parse(stringValue);
    };
    var StorageSetter = function(key, value) {
        var stringValue = JSON.stringify(value);
        return global.localStorage.setItem(prefix + key, stringValue);
    };

    return {
        takeOutNullOrUndefined: takeOutNullOrUndefined,
        StorageGetter: StorageGetter,
        StorageSetter: StorageSetter
    };
})(this);

/* Controller.js
 *
 * 这个文件提供了游戏控制中心的功能，Controller是一个单例对象，供其它模块调用。
 * 大部分和游戏逻辑相关的代码都写在了这里，任何游戏元素想知道自己什么时候该生成，
 * 或者碰到一个事件该怎么办，都要向Controller来询问。
 * 所以可以把Controller理解成这个游戏的管家。
 *
 * 具体来说，Controller有以下几个作用：
 * 1.控制游戏的开始、暂停、继续、重启等等
 * 2.保持游戏的逻辑循环，从而不断生成新的元素，或者提升敌人等级，这个循环可以停止和重启
 * 3.增删游戏元素，不过这部分接口并不暴露在外，由内部函数调用
 * 4.提供处理游戏事件的API，包括碰到敌人和宝物之后的逻辑
 * 5.随着玩家的游戏进程，通知 DomManager更新 DOM元素
 * 6.提供一个二维数组对象 pavement，用来表示画面中间区域的占用情况，可以被外部访问
 *
 */

/* jshint undef: false, unused: false */

var Controller = (function(global) {
    'use strict';

    /* 用来设定游戏开始时各元素的数量的对象 */
    var initialSettings = {
        treasureNum: 2,
        obstacleNum: 2,
        enemyNum: 5,
        enemyLevel: 1
    };

    /* 创建一个二维数组，用来标记格子是否被已有静态元素占据。
     * 因为对应着游戏中的路面区域，所以取名为pavement。
     * 如果某一个坐标的值为true，则意味着该坐标已经有固定元素了，无法在此生成新的静态元素
     */
    var pavement = (function() {
        var matrix = [];

        /* 重置自己 */
        matrix.reset = function() {
            for (var i = 0; i < 4; i++) {
                matrix[i] = [];
                for (var j = 0; j < 5; j++) {
                    matrix[i][j] = false;
                }
            }
        };

        /* 求出自身的所有单元格共有多少个true，并将结果作为返回值
         * 它的返回值用来决定能否继续添加静态元素
         */
        matrix.getOccupiedNum = function() {
            var num = 0;
            this.forEach(function(eachRow) {
                eachRow.forEach(function(eachCell) {
                    num += (eachCell ? 1 : 0);
                });
            });
            return num;
        };

        /* 执行自身的重置函数就能完成初始化 */
        matrix.reset();

        return matrix;
    })();

    /* 添加敌人，数量和等级作为参数传递
     * 当前游戏没有敌人时，等级参数才有实际意义
     * 如果allEnemies不为空，则新加入的敌人保持和数组中第一个敌人为相同等级。
     */
    var addEnemy = function(num, level) {

        if (allEnemies.length > 0) {
            level = allEnemies[0].level;
        }
        for (var i = 0; i < num; i++) {
            allEnemies.push(new Enemy(level));
        }
    };

    /* 添加障碍物，新增数量作为参数传递，如果路面中已有大量格子被占据，则取消添加 */
    var addObstacle = function(num) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 10) {
                allObstacles.push(new Obstacle());
            }
        }
    };

    /* 添加宝物，新增数量作为参数传递，如果路面中已有大量格子被占据，则取消添加 */
    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 12) {
                allTreasure.push(new ClassName());
            }
        }
    };

    /* 按各种宝物的概率权重，随机生成若干个宝物，生成数量作为参数传递 */
    var addRandomTreasure = function(num) {

        /* 这里设置各种宝物出现的概率权重 */
        var treasureList = [{
                ClassName: BlueGem,
                weight: 20
            },
            {
                ClassName: GreenGem,
                weight: 10
            },
            {
                ClassName: OrangeGem,
                weight: 15
            },
            {
                ClassName: Heart,
                weight: 10
            },
            {
                ClassName: Key,
                weight: 10
            },
            {
                ClassName: Star,
                weight: 5
            },
        ];

        var i, j;
        var totalWeight = 0;
        for (i = 0; i < treasureList.length; i++) {
            totalWeight += treasureList[i].weight;
        }

        var randomNum, currentTotalWeight, targetClass;
        for (i = 0; i < num; i++) {
            randomNum = Math.ceil(Math.random() * totalWeight);
            targetClass = treasureList[0].ClassName;
            currentTotalWeight = 0;

            /* 这里的思路是将权重值依次累加，换算成一个个逐步增大的区间，
             * 然后看随机生成的整数落在那个区间内，便选出该区间对应的宝物类。
             * 权重越大的宝物类，所对应的区间范围也越大。
             */
            for (j = 0; j < treasureList.length - 1; j++) {
                currentTotalWeight += treasureList[j].weight;
                if (currentTotalWeight < randomNum) {
                    targetClass = treasureList[j + 1].ClassName;
                }
            }
            addTreasure(1, targetClass);
        }
    };

    /* 随机移除石块，如果游戏中没有石块了，则直接返回 */
    var removeRock = function() {
        if (allObstacles.length === 0) {
            return;
        }

        var randomIndex = Math.floor(Math.random() * allObstacles.length);

        /* 调整pavement二维数组中对应的元素为false */
        var row = allObstacles[randomIndex].y / CELL_HEIGHT - 1,
            col = allObstacles[randomIndex].x / CELL_WIDTH;
        pavement[row][col] = false;

        allObstacles[randomIndex] = null;
        allObstacles = Util.takeOutNullOrUndefined(allObstacles);
    };

    /* 重启游戏的函数 */
    var restartGame = function() {

        /* 先将player实例还原成初始状态，然后重置上方面板信息 */
        player.initLocation();
        player.lives = 3;
        player.score = 0;
        player.canMove = true;
        DomManager.updateLives();
        DomManager.updateScore();
        DomManager.resetMsg();

        DomManager.hideMenu();

        /* 结束上一局的游戏循环 */
        stopLoop();

        /* 清除上一局的蓝宝石倒计时效果（如果还没结束的话） */
        stopTimer();
        DomManager.setProgressBarLength(0);

        /* 使时间流速恢复默认状态，并使 Engine内部计时器清零重置 */
        Engine.reset();

        /* 初始化游戏元素 */
        initElements(initialSettings.treasureNum,
            initialSettings.obstacleNum,
            initialSettings.enemyNum,
            initialSettings.enemyLevel);

        /* 先重置游戏阶段为0，再开启游戏逻辑循环 */
        stage = 0;
        startLoop();
    };

    /* 暂停游戏，此时角色不受键盘响应 */
    var pauseGame = function() {
        player.canMove = false;

        /* 让时间流速为0，相当于暂停动画，
         * 但实际上浏览器依然在不断渲染，只是每次渲染的图画都一样而已。
         * 由于时间静止，玩家的得分在此期间也不能发生变化，所以stage变量也不会变。
         */
        Engine.setTimeSpeed(0);

        /* 暂停倒计时器
         * 注意倒计时器是按照真实时间来计时的，不受Engine里的时间影响，
         * 因此基于Engine实现的暂停或者时间减缓，都对倒计时器的运行不起作用
         */
        pauseTimer();
    };

    /* 继续游戏，恢复键盘响应，恢复时间流速，
     * 并启动倒计时器，如果 leftTime 大于0的话，则继续上一次没有结束的效果
     */
    var continueGame = function() {
        player.canMove = true;
        Engine.setTimeSpeed(1);

        if (leftTime > 0) {
            startTimer();
        }
    };

    /* 停止游戏，判断玩家的分数能否进入排行榜，玩家点击确定后再重启游戏 */
    var endGame = function() {
        stopLoop();
        stopTimer();

        var endWords = ['Game Over', '游戏结束！'];
        DomManager.setMsg(endWords[language]);

        /* 下面的这层逻辑做成异步，是因为我们的游戏结束发生在player的update函数中，
         * 所以输入框弹出的时候，玩家最后移动的一步动画的render函数还没有执行，
         * 因此我们加入一小段延时，让这部分处理发生在走出这一步后
         */
        global.setTimeout(function() {

            var time = Date.now();
            var record = {
                name: "",
                score: player.score,
                role: player.sprite,
                time: time
            };

            /* 玩家登上了本地 Top10，或者在线的 Top100榜单时，都可以留下姓名 */
            var localList = Data.getLocalList();
            var remoteList = Data.getRemoteList();

            var isOnRemoteList = remoteList.length < 100 ||
                record.score > remoteList[99].score;
            var isOnLocalList = localList.length < 10 ||
                record.score > localList[9].score;

            var prefix = '没有名字的';
            var defaultNames = ['小猫', '小狗', '小老鼠', '小牛', '小老虎', '小兔子',
                '小羊羔', '小猴子', '小猪', '小熊猫', '小苹果'
            ];
            var randomIndex = Math.floor(Math.random() * defaultNames.length);
            var defaultName = prefix + defaultNames[randomIndex];

            if (isOnRemoteList) {
                var worldCongratsWords = [
                    'Congratulations! You\'ve broaded on the global record list!' +
                    'Please leave your name: ',
                    '恭喜，你成功登上了全球排行榜！\n请留下你的大名：'];
                record.name = global.prompt(worldCongratsWords[language],
                    defaultName) || defaultName;
                Data.updateRemoteList(record);
                Data.updateLocalList(record);

            } else if (isOnLocalList) {
                var localCongratsWords = [
                    'You have freshed your own top 10 records!\n' +
                    'Please leave your name: ' ,
                    '你刷新了个人的10佳记录，可以留个名了：'];
                record.name = global.prompt(localCongratsWords[language],
                    defaultName) || defaultName;
                Data.updateLocalList(record);
            } else {
                var encouragingWords = ['You could do better!', '下次努力'];
                global.alert(encouragingWords[language]);
            }

            restartGame();
        }, 10);
    };

    /* 该函数用来初始化游戏元素 */
    var initElements = function(treasureNum, obstacleNum, enemyNum, level) {
        /* 先将几个数组置空 */
        allEnemies = [];
        allObstacles = [];
        allTreasure = [];

        /* 重置用来标记格子是否被占用的二维数组 */
        pavement.reset();

        /* 最后添加游戏元素 */
        addRandomTreasure(treasureNum);
        addObstacle(obstacleNum);
        addEnemy(enemyNum, level);
    };

    /* 我们将游戏分为一个一个的阶段，用变量stage来表示
     * stage的值决定了什么时候增加敌人，提升敌人等级，生成静态元素等等
     */
    var stage = 0;

    /* 这个变量是游戏逻辑循环的id，用作clearInterval()的参数 */
    var gameLoopId;

    /* 游戏逻辑循环函数，根据游戏时间和玩家当前分数，来控制各项元素的增减以及等级变化 */
    var startLoop = function() {

        /* 先记录上一个stage */
        var lastStage = stage;

        /* 每次执行下面的setInterval时，都需要将上一次的结果清除掉 */
        global.clearInterval(gameLoopId);

        /* 这个setInterval函数每隔1秒检查stage值是否有变化，
         * 如果有变化，则准备新增元素，并提升敌人等级。
         * 将它的返回值存储下来，方便之后clearInterval调用，从而停止游戏逻辑循环
         */
        gameLoopId = global.setInterval(function() {

            /* 只有player.score和Engine.getTime()两个值都达标，才能进入下一个stage
             * 游戏前期，stage值主要由游戏时间决定，每隔 5秒提升一档。
             * 游戏后期，不希望玩家通过等甲虫自动提升到很高的等级，再利用道具过河拿分，
             * stage更多地由分数决定，因此利用了指数函数的成长作为限制。
             * 个别情况会导致stage停留不动，例如玩家在出发点挂机。
             */
            var timeLimitStage = Engine.getTime() / 5.0,
                scoreLimitStage = Math.sqrt(player.score) * 1.25;
            stage = Math.floor(Math.min(timeLimitStage, scoreLimitStage));

            if (stage !== lastStage) {
                // console.log(stage);
                allEnemies.forEach(function(enemy) {
                    enemy.level += 1;
                });
                addRandomTreasure(1);

                if (stage % 3 === 0) {
                    if (allEnemies.length < 4) {
                        addEnemy(1, stage);
                    }
                    addObstacle(1);
                }
                if (stage % 4 === 0) {
                    if (allEnemies.length < 8) {
                        addEnemy(1, stage);
                    }
                }
                if (stage % 6 === 0) {
                    addTreasure(1, Key);
                }
                if (stage % 8 === 0) {
                    addTreasure(1, GreenGem);
                }
                if (stage % 12 === 0) {
                    addTreasure(1, Heart);
                }
            }
            lastStage = stage;

        }, 1000);
    };

    /* 结束游戏循环 */
    var stopLoop = function() {
        global.clearInterval(gameLoopId);
    };

    /* 新增一个变量lastCrossTime，用来记录上次过河时间，如果短时间连续过河，有加分奖励 */
    var lastCrossTime = 0;
    /* 用一个变量记录这个不间断的连续过河次数，不间断的意思是两两之间均在设定间隔内 */
    var k = 1;
    var resetMsgId = 0;

    /* 如果到了最上面的那条河，增加得分，给出提示信息。
     * 这时玩家的角色会停留一小段时间，好让玩家看清楚，角色确实到达河边。
     * 该期间其它角色正常，只是玩家角色被固定住，同时不受键盘响应。
     * 随后角色回到初始位置，键盘恢复响应。
     */
    var crossRiver = function() {
        global.clearTimeout(resetMsgId);
        player.canMove = false;
        var crossTime = Date.now();
        if (crossTime - lastCrossTime < 2800) {
            k = k < 4 ? (k + 1) : 4;
        } else {
            k = 1;
        }

        /* 游戏阶段越往后，单次过河的分数越高 */
        var awardScore = (10 + stage) * k;
        player.score += awardScore;
        DomManager.updateScore();

        var congratsWords = [];
        congratsWords[0] = [
            'Good Job!',
            'Nice Move!',
            'Well Done!',
            'You Need Water!'
        ];
        congratsWords[1] = [
            '好样的！',
            '身手敏捷！',
            '你的身法让人眼花缭乱',
            '该让甲虫跑得再快一点',
            '甲虫朋友们，碾死他！'
        ];
        var randomIndex = Math.floor(Math.random() *
            congratsWords[language].length);

        var continuityWords = ['Fast Crossing\n' +
            k + ' * ' + awardScore + ' Scores Awarded',
            '连续过河! ' + k + '倍积分奖励'];

        if (k > 1) {
            DomManager.setMsg(continuityWords[language]);
            DomManager.setMsgColor('#fbf850');
        } else {
            DomManager.setMsg(congratsWords[language][randomIndex]);
        }

        /* 再将上次过河时间更新到现在，用于下次比较 */
        lastCrossTime = Date.now();

        /* 0.5秒后让角色归位并恢复键盘响应，再过 1秒还原文字区域 */
        global.setTimeout(function() {
            player.initLocation();
            player.canMove = true;
        }, 500);
        resetMsgId = global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 碰撞到敌人时，所有元素会静止一小段时间，好让玩家看清发碰撞的发生
     * 减去玩家一点生命，然后再判断玩家剩余生命是否为 0，并作进一步处理
     */
    var collideWithEnemy = function() {
        pauseGame();

        player.lives -= 1;
        DomManager.updateLives();
        DomManager.setMsgColor('#f13');

        /* 如果剩余生命值大于 0，则重置角色位置，减去一滴血，再继续游戏。
         * 如果剩余生命值为 0，则提示Game Over，并重新开始游戏。
         */
        if (player.lives > 0) {
            var collisionWords = ['Oops! Collide with a bug!',
                '你被甲虫给逮住啦!'];
            DomManager.setMsg(collisionWords[language]);
            global.setTimeout(function() {
                DomManager.resetMsg();
                player.initLocation();
                continueGame();
            }, 1500);

        } else {
            endGame();
        }
    };

    /* timerId 用来标记进度条的倒计时器，是setInterval函数的返回值。
     * 在一个蓝宝石的效果还没结束，又碰到另一个蓝宝石时，就需要先将上一次的
     * 倒计时器清空，此时这个id变量就会被clearInterval函数调用。
     * 暂停游戏时，要清空倒计时器；恢复游戏时再继续让倒计时器运行
     * 重启游戏时，要确保上一局的蓝宝石倒计时效果已经失效，因此也要清空倒计时器。
     */
    var timerId;

    /* 得到蓝宝石，让时间变慢，持续一小段时间。
     * 让时间变慢就是启动一个倒计时器，不断减少leftTime，当其为0时，时间流速恢复正常
     */
    var obtainBlueGem = function() {

        /* 这个倒计时器就像一个旧式闹钟，要上发条才能动
         * 这里设定leftTime就相当于给其上发条，不能超过5000，即 5秒
         */
        leftTime = 5000;
        startTimer();
    };


    /* 这个变量是倒计时器的核心，反应时间减速效果的剩余时间，是Controller内的全局变量 */
    var leftTime = 0;

    /* 启动倒计时器，核心就是启动 setInterval()函数，不断更新 leftTime，直到其减为 0,
     * 每一次减少后，都通知 DomManager同比例地反映到进度条的长度上去
     */
    var startTimer = function() {
        Engine.setTimeSpeed(0.2);
        var words = ['Time Slowing Down', '时间变慢了！'];
        DomManager.setMsg(words[language]);

        /* leftTime最长不超过5秒 */
        var maxTime = 5000;
        leftTime = Math.min(maxTime, leftTime);
        /* 渲染的时间间隔，会影响进度条动画的平顺 */
        var dt = 10;

        /* 每次启动setInterval之前，需要将上一次的循环清除 */
        global.clearInterval(timerId);

        /* 倒计时器，leftTime逐步减少，直到为 0，才触发时间流速恢复正常 */
        timerId = global.setInterval(function() {
            leftTime -= dt;
            leftTime = Math.max(leftTime - dt, 0);
            DomManager.setProgressBarLength(leftTime / maxTime);
            if (leftTime <= 0) {
                Engine.setTimeSpeed(1);
                DomManager.resetMsg();
                global.clearInterval(timerId);
            }
        }, dt);
    };

    /* 暂停倒计时器，游戏暂停时执行 */
    var pauseTimer = function() {
        global.clearInterval(timerId);
    };

    /* 停止倒计时器，游戏重启时执行 */
    var stopTimer = function() {
        global.clearInterval(timerId);
        leftTime = 0;
        DomManager.setProgressBarLength(0);
    };

    /* 得到绿宝石，减少一个敌人，如果当前只剩一个敌人，则效果改为得到中量分数
     * 2017.3.20添加：如果到了游戏后期，绿宝石可以减去两个敌人
     */
    var obtainGreenGem = function() {
        if (allEnemies.length <= 1) {
            var awardScore = 30 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = [' Scores Awarded!', '分到手！'];
            DomManager.setMsg(awardScore + scoreWords[language]);
        } else {
            var k = (allEnemies.length > 2 && stage > 60) ? 2 : 1;
            allEnemies = allEnemies.slice(0, allEnemies.length - k);
            var eliminatedWords = [' Bug Eliminated!', '只甲虫被消灭！'];
            DomManager.setMsg(k + eliminatedWords[language]);
        }

        global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 橙色宝石可以将所有敌人移到屏幕左侧以外去 */
    var obtainOrangeGem = function() {
        allEnemies.forEach(function(enemy) {
            enemy.x = -200;
        });
        var pushWords = ['Push Bugs Away!!', '全部给我闪开！'];
        DomManager.setMsg(pushWords[language]);
        global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到桃心，恢复一点生命。如果生命达到上限，则改为获得中量分数 */
    var obtainHeart = function() {
        if (player.lives < 5) {
            player.lives += 1;
            DomManager.updateLives();
            var lifeWords = ['One More Life!', '奖励1点生命值'];
            DomManager.setMsg(lifeWords[language]);
        } else {
            var awardScore = 50 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = ['分到手！', ' Extra Scores'];
            DomManager.setMsg(player.score + scoreWords[language]);
        }
        global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到钥匙时，消除一个石头（如果屏幕上还有石头的话），同时得到少量分数 */
    var obtainKey = function() {
        removeRock();
        player.score += 20 + Math.floor(stage * 0.5);
        DomManager.updateScore();
        var rockWords = ['Remove a Rock!', '移开了一块石头!'];
        DomManager.setMsg(rockWords[language]);
        global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到星星可以获得大量分数 */
    var obtainStar = function() {
        var awardScore = 100 + 3 * stage;
        player.score += awardScore;
        DomManager.updateScore();
        var scoreWords = [' Scores Awarded!', '分到手，好多!'];
        DomManager.setMsg(awardScore + scoreWords[language]);
        global.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* Controller对象暴露的这些方法和对象，按名字可理解其作用 */
    return {
        /* 二维数组对象，表示中间区域的占用情况 */
        pavement: pavement,

        /* 这个对象用来自定义游戏开始时的元素数量和敌人等级 */
        initialSettings: initialSettings,

        /* 控制游戏进程 */
        restartGame: restartGame,
        pauseGame: pauseGame,
        continueGame: continueGame,

        /* 下面一组API用来处理事件发生后的逻辑 */
        crossRiver: crossRiver,
        collideWithEnemy: collideWithEnemy,
        obtainBlueGem: obtainBlueGem,
        obtainGreenGem: obtainGreenGem,
        obtainOrangeGem: obtainOrangeGem,
        obtainKey: obtainKey,
        obtainHeart: obtainHeart,
        obtainStar: obtainStar
    };
})(this);

/* DomManager.js
 *
 * 这个文件用来操作屏幕上的DOM元素，包括改变其显示，获得其属性，以及添加响应事件等等
 *
 */

/* jshint undef: false, unused: false */

DomManager = (function(global) {
    'use strict';

    /* 下面这些DOM元素用来反应游戏状态 */
    var doc = global.document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        lifeTxt = doc.getElementById('life'),
        progressBar = doc.getElementById('progress-bar'),
        topBar = doc.getElementById('top-bar'),
        menuButton = doc.getElementById('btn-menu'),
        menu = doc.getElementById('menu'),

        rankingButton = doc.getElementById('btn-ranking'),
        titleWorld = doc.getElementById('title-world'),
        titleLocal = doc.getElementById('title-local'),
        rankingBoard = doc.getElementById('ranking-board'),
        remoteList = doc.getElementById('remote-list'),
        localList = doc.getElementById('local-list'),
        closeRankingButton = doc.getElementById('btn-close-ranking'),

        instructionButton = doc.getElementById('btn-instruction'),
        instructionBoard = doc.getElementById('instruction-board'),
        closeInstructionButton = doc.getElementById('btn-close-instruction'),

        roleListButton = doc.getElementById('btn-role'),
        roleList = doc.getElementById('role-list'),
        languageListButton = doc.getElementById('btn-language'),
        languageList = doc.getElementById('language-list'),
        restartButton = doc.getElementById('btn-restart'),

        operationPanel = doc.getElementById('operation-panel'),
        arrowUp = doc.getElementById('arrow-up'),
        arrowDown = doc.getElementById('arrow-down'),
        arrowLeft = doc.getElementById('arrow-left'),
        arrowRight = doc.getElementById('arrow-right');

    /* 给游戏标题栏，以及菜单栏的按钮，按语言设定起好对应的名字 */
    var initDomText = function() {
        var gameTitleWords = ['Frogger', '扶小朋友过马路'];
        doc.getElementById('game-title').innerText = gameTitleWords[language];
        var rankingButtonWords = ['Ranking', '排行榜'];
        rankingButton.innerText = rankingButtonWords[language];
        var roleListButtonWords = ['Role', '角色'];
        roleListButton.innerText = roleListButtonWords[language];
        var languageButtonWords = ['Language', '语言'];
        languageListButton.innerText = languageButtonWords[language];
        var instructionButtonWords = ['Instruction', '游戏说明'];
        instructionButton.innerText = instructionButtonWords[language];
        var restartButtonWords = ['Restart', '重新开始'];
        restartButton.innerText = restartButtonWords[language];
        var titleWorldWords = ['World', '全球榜单'];
        titleWorld.innerText = titleWorldWords[language];
        var titleLocalWords = ['Local', '本地榜单'];
        titleLocal.innerText = titleLocalWords[language];
    };

    /* 重置上方中央的信息栏，参数为空 */
    var resetMsg = function() {
        var defaultWords = ['Move to the river above', '快到河边来！'];
        msgTxt.innerText = defaultWords[language];
        msgTxt.style.color = '#fff';
    };

    /* 设置信息栏的文字，参数为需要显示的字符串 */
    var setMsg = function(msg) {
        msgTxt.innerText = msg;
    };

    /* 设置信息栏的颜色，参数为表示颜色的字符串 */
    var setMsgColor = function(color) {
        msgTxt.style.color = color;
    };

    /* 更新上方左边的得分栏 */
    var updateScore = function() {
        var scoreWords = ['Score: ', '分数: '];
        scoreTxt.innerText = scoreWords[language] + player.score;
    };

    /* 更新上方右边的生命值栏 */
    var updateLives = function() {
        lifeTxt.innerText = '';
        for (var i = 0; i < player.lives; i++) {
            lifeTxt.innerText += '♥';
        }
    };

    /* 设置进度条的长度，参数为 0到1之间的数值，代表相对其最大长度的比例 */
    var setProgressBarLength = function(ratio) {
        /* ratio取值范围在 [0, 1] */
        ratio = Math.max(ratio, 0);
        ratio = Math.min(ratio, 1);
        progressBar.style.width = (topBar.offsetWidth * ratio) + 'px';
    };

    /* 添加菜单中的点击响应事件 */
    /* 定义一个变量，用来标记菜单栏是否隐藏 */
    var isMenuHidden = true;
    var showMenu = function() {
        menu.style.height = '303px';
        menu.style.borderBottom = '2px solid #251';
        isMenuHidden = false;
        /* 菜单栏出现时，游戏暂停 */
        Controller.pauseGame();
    };
    var hideMenu = function() {
        menu.style.height = 0;
        menu.style.borderBottom = 0;
        isMenuHidden = true;
        /* 菜单栏隐藏时，游戏继续 */
        Controller.continueGame();
    };

    /* 鼠标放在角色按钮上，会弹出二级菜单，供玩家自定义角色外观 */
    /* 定义一个变量，用来标记角色选择栏是否隐藏 */
    var isSelectionListHidden = true;
    var showSelectionList = function() {
        roleList.style.width = '310px';
        isSelectionListHidden = false;
    };
    var hideSelectionList = function() {
        roleList.style.width = '0';
        isSelectionListHidden = false;
    };

    /* 鼠标放在语言按钮上，会弹出二级菜单，供玩家自定义角色外观 */
    /* 定义一个变量，用来标记语言选择栏是否隐藏 */
    var isLanguageSelectionListHidden = true;
    var showLanguageList = function() {
        languageList.style.width = '204px';
        isLanguageSelectionListHidden = false;
    };
    var hideLanguageList = function() {
        languageList.style.width = '0';
        isLanguageSelectionListHidden = false;
    };

    /* 判断登陆设备是否是PC */
    var isPC = function() {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"
        ];
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    };

    /* 添加各种事件响应，只需在游戏启动时执行一次，由Engine.init()调用 */
    var addEventListener = function() {

        /* 先执行给标题和按钮起名字的函数 */
        initDomText();

        /* 监听游戏玩家的键盘点击事件 */
        doc.addEventListener('keyup', function(e) {
            var allowedKeys = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down'
            };
            player.handleInput(allowedKeys[e.keyCode]);
        });

        menuButton.onclick = function(e) {
            /* 点击菜单按钮时，点击事件停止向上传递 */
            e.stopPropagation();
            if (isMenuHidden) {
                showMenu();
            } else {
                hideMenu();
            }
        };

        /* 除菜单按钮和下面的角色按钮外，点击屏幕中的其它区域都会让菜单栏隐藏 */
        doc.onclick = function() {
            hideMenu();
            hideSelectionList();
            hideLanguageList();
        };

        /* 以下一部分内容是关于排行榜面板的，首先动态控制排行榜的高度，让它充满屏幕 */
        rankingBoard.style.height = doc.documentElement.clientHeight + 'px';

        /* 生成一个li节点，根据参数的不同决定它是本地排行榜里的还是在线排行榜里的
         * 参数scope的取值是'remote-'或'local-'，用来标记 id
         */
        var makeLiNode = function(scope) {
            var li = doc.createElement('li');
            var rowClass = ranking % 2 === 0 ? 'odd-row' : 'even-row';
            li.className = 'record ' + rowClass;

            var pRanking = doc.createElement('p');
            pRanking.className = 'record-ranking record-txt';
            pRanking.id = scope + 'ranking-' + ranking;

            var div = doc.createElement('div');
            div.className = 'record-role';
            var img = doc.createElement('img');
            img.className = 'role-img';
            img.id = scope + 'img-' + ranking;
            div.appendChild(img);

            var pRecord = doc.createElement('p');
            pRecord.className = 'record-name record-txt';
            pRecord.id = scope + 'name-' + ranking;
            var pScore = doc.createElement('p');
            pScore.className = 'record-score record-txt';
            pScore.id = scope + 'score-' + ranking;

            li.appendChild(pRanking);
            li.appendChild(div);
            li.appendChild(pRecord);
            li.appendChild(pScore);

            return li;
        };

        /* 在显示排行榜之前，生成它的Dom结构 */
        var ranking, li;
        /* 生成在线排行榜 */
        for (ranking = 0; ranking < 100; ranking++) {
            li = makeLiNode('remote-');
            remoteList.appendChild(li);
        }
        /* 生成在线排行榜 */
        for (ranking = 0; ranking < 10; ranking++) {
            li = makeLiNode('local-');
            localList.appendChild(li);
        }

        /* 点击排行榜按钮时，弹出排行榜 */
        rankingButton.onclick = function(e) {
            /* 点击排行榜按钮时，点击事件停止应当向上传递，否则游戏会失去暂停效果 */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            rankingBoard.style.display = 'block';

            /* 将之前没有上传但是应该上榜的本地记录上传 */
            Data.uploadLocalList();

            var remoteList = Data.getRemoteList();
            var localList = Data.getLocalList();
            var i, record, ranking, img, name, score;

            var remoteCount = Math.min(remoteList.length, 100);
            for (i = 0; i < remoteCount; i++) {
                record = remoteList[i];
                ranking = doc.getElementById('remote-ranking-' + i);
                img = doc.getElementById('remote-img-' + i);
                name = doc.getElementById('remote-name-' + i);
                score = doc.getElementById('remote-score-' + i);
                ranking.innerText = i + 1;
                img.src = record.role || 'images/char-boy.png';
                img.alt = img.src;
                name.innerText = record.name;
                score.innerText = record.score;
            }
            var localCount = Math.min(localList.length, 10);
            for (i = 0; i < localCount; i++) {
                record = localList[i];
                ranking = doc.getElementById('local-ranking-' + i);
                img = doc.getElementById('local-img-' + i);
                name = doc.getElementById('local-name-' + i);
                score = doc.getElementById('local-score-' + i);
                ranking.innerText = i + 1;
                img.src = record.role || 'images/char-boy.png';
                img.alt = img.src;
                name.innerText = record.name;
                score.innerText = record.score;
            }
        };

        /* 点击排行榜上方的按钮，可以切换面板 */
        titleWorld.onclick = function(e) {
            e.stopPropagation();
            titleWorld.style.backgroundColor = '#4156a0';
            titleLocal.style.backgroundColor = 'transparent';
            remoteList.style.left = '0';
            localList.style.left = remoteList.offsetWidth + 'px';
        };

        titleLocal.onclick = function(e) {
            e.stopPropagation();
            titleLocal.style.backgroundColor = '#4156a0';
            titleWorld.style.backgroundColor = 'transparent';
            remoteList.style.left = -remoteList.offsetWidth + 'px';
            localList.style.left = '0';
        };

        /* 点击排行榜面板里的OK按钮时，关闭榜单
         * 由于该点击事件会向上传递到document，因此会触发hideMenu()，从而继续游戏
         */
        closeRankingButton.onclick = function() {
            rankingBoard.style.display = 'none';
        };

        /* 点击角色按钮时，点击事件停止向上传递 */
        roleListButton.onclick = function(e) {
            e.stopPropagation();
        };

        /* 点击语言按钮时，点击事件停止向上传递 */
        languageListButton.onclick = function(e) {
            e.stopPropagation();
        };

        /* 鼠标移到角色按钮上，或者移到由它弹出的二级菜单上，二级菜单都会处于显示状态 */
        roleListButton.onmouseover = function() {
            showSelectionList();
        };
        roleList.onmouseover = function() {
            showSelectionList();
        };
        /* 鼠标离开角色列表按钮，而且也离开了由它弹出的二级菜单，二级菜单就会处于隐藏状态 */
        roleListButton.onmouseout = function() {
            hideSelectionList();
        };
        roleList.onmouseout = function() {
            hideSelectionList();
        };

        /* 以下一部分内容是关于排行榜面板的，首先动态控制排行榜的高度，让它充满屏幕 */
        instructionBoard.style.height = doc.documentElement.clientHeight + 'px';

        /* 点击游戏说明按钮时，弹出排行榜 */
        instructionButton.onclick = function(e) {
            /* 点击该按钮时，点击事件应当停止向上传递，否则游戏会失去暂停效果 */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            instructionBoard.style.display = 'block';
        };

        /* 点击游戏说明面板里的OK按钮时，关闭面板
         * 由于该点击事件会向上传递到document，因此会触发hideMenu()，从而继续游戏
         */
        closeInstructionButton.onclick = function() {
            instructionBoard.style.display = 'none';
        };

        /* 初始化角色菜单中的图像 */
        var roleImages = [
            'images/char-boy.png',
            'images/char-cat-girl.png',
            'images/char-horn-girl.png',
            'images/char-pink-girl.png',
            'images/char-princess-girl.png'
        ];

        /* 在角色菜单栏点击图片，会将玩家形象改变成相应的样子 */
        for (var i = 0; i < roleImages.length; i++) {
            var roleImg = doc.getElementById('role-' + i);
            roleImg.src = roleImages[i];
            /* 用立即执行的方式，解决异步调用中 i的值不对的问题 */
            (function(index) {
                roleImg.onclick = function() {
                    player.sprite = roleImages[index];
                    hideSelectionList();
                };
            })(i);
        }

        /* 鼠标移到语言按钮上，或者移到由它弹出的二级菜单上，二级菜单都会处于显示状态 */
        languageListButton.onmouseover = function() {
            showLanguageList();
        };
        languageList.onmouseover = function() {
            showLanguageList();
        };
        /* 鼠标离开语言列表按钮，而且也离开了由它弹出的二级菜单，二级菜单就会处于隐藏状态 */
        languageListButton.onmouseout = function() {
            hideLanguageList();
        };
        languageList.onmouseout = function() {
            hideLanguageList();
        };

        var languageEnglishButton = doc.getElementById('language-0'),
            languageChineseButton = doc.getElementById('language-1');
        /* 点击语言切换按钮后，要同时刷新分数栏和信息栏 */
        languageEnglishButton.onclick = function() {
            language = 0;
            initDomText();
            resetMsg();
            updateScore();
            Util.StorageSetter('language', language);
        };
        languageChineseButton.onclick = function() {
            language = 1;
            initDomText();
            resetMsg();
            updateScore();
            Util.StorageSetter('language', language);
        };

        /* 点击重启按钮会重启游戏 */
        restartButton.onclick = function() {
            Controller.restartGame();
        };

        /* 根据登陆设备决定是否显示模拟操作面板 */
        if (isPC()) {
            operationPanel.style.display = 'none';
        } else {
            operationPanel.style.display = 'block';
            /* 再来绑定模拟操作面板上的事件 */
            arrowUp.ontouchstart = function() {
                player.handleInput('up');
            };
            arrowDown.ontouchstart = function() {
                player.handleInput('down');
            };
            arrowLeft.ontouchstart = function() {
                player.handleInput('left');
            };
            arrowRight.ontouchstart = function() {
                player.handleInput('right');
            };

            /* 以下两个事件监听阻止了移动设备上的双击放大效果 */
            doc.addEventListener('touchstart',function (event) {
                if(event.touches.length>1){
                    event.preventDefault();
                }
            });
            var lastTouchEnd=0;
            doc.addEventListener('touchend',function (event) {
                var now=(new Date()).getTime();
                if(now-lastTouchEnd<=500){
                    event.preventDefault();
                }
                lastTouchEnd=now;
            },false);
        }
    };

    return {
        resetMsg: resetMsg,
        setMsg: setMsg,
        setMsgColor: setMsgColor,
        updateScore: updateScore,
        updateLives: updateLives,

        setProgressBarLength: setProgressBarLength,

        hideMenu: hideMenu,

        addEventListener: addEventListener
    };

})(this);

/* Data.js
 *
 * 这个文件用来提供数据的存取接口，能够从本地和服务器分别返回有序数组
 * 在登陆Wilddog服务器之前，需要通过邮箱名以及密码进行认证登陆，
 * 这部分存在administrator.js文件里了，而它没有参与版本记录，也没有上传到github
 *
 */

/* jshint undef: false, unused: false */
var Data = (function(global) {
    'use strict';

    /* 要读写数据，必须先创建 Wilddog 引用 */
    var ref = new Wilddog('https://frogger.wilddogio.com/records');

    /* 登陆成功的回调函数 */
    // function authHandler(error, authData) {
    //     if (error) {
    //         console.log("Login Failed!", error);
    //     } else {
    //         console.log("Authenticated successfully with payload:");
    //         console.log(authData);
    //     }
    // }
    /* 认证登陆 */
    // ref.authWithPassword({
    //     email    : Administrator.email,
    //     password : Administrator.password
    // }, authHandler);
    // console.log(refroot.getAuth());


    /* 在这里就直接初始化remoteList，并利用Wilddog提供的回调函数，和服务器端同步更新 */
    var remoteList = [];
    var record = {};
    /* 每次有新数据添加，都会触发回调函数，参数是新增节点对象 */
    ref.on('child_added', function(snapshot) {
        var data = snapshot.val();
        record = {
            name: data.name,
            score: data.score,
            role: data.role,
            time: data.time
        };
        remoteList.push(record);
    });

    /* 以数组的形式返回按分数从高到低顺序的在线排行榜 */
    var getRemoteList = function() {
        return remoteList.sort(function(recordA, recordB) {
            return recordB.score - recordA.score;
        });
    };

    /* 更新在线排行榜，参数是record对象 */
    var updateRemoteList = function(record) {
        ref.push(record);
    };

    /* 返回本地排行榜，返回值是一个长度为10的分数从高到低的数组 */
    var getLocalList = function() {
        /* 如果本地还没有存，则新建一个空数组 */
        return (Util.StorageGetter('topList') || []);
    };

    /* 更新本地排行榜，参数是record对象 */
    var updateLocalList = function(record) {
        var localList = getLocalList();

        /* 先添加本次记录，再按照分数对榜单上对所有记录进行排序 */
        localList.push(record);
        localList.sort(function(recordA, recordB) {
            return recordB.score - recordA.score;
        });

        /* 本地排行榜如果多余10位，则去除后面的 */
        localList = localList.slice(0, 10);
        Util.StorageSetter('topList', localList);
    };

    /* 将本地排行榜更新到全球排行榜，从而将上次上传失败的数据提交上去，在游戏第一次启动后执行 */
    var uploadLocalList = function() {
        var localList = getLocalList();
        localList.forEach(function(record) {
            if (shouldUpload(record)) {
                // console.log("Going to add record：" + record.name);
                updateRemoteList(record);
            }
        });
    };

    /* 远程排行榜取回后按从高到低排序，看参数record是否应该添加到榜单上去
     * 如果榜单上已有该record，或者榜单的第100位分数高于这一个record，都不应该添加
     * 反之则需要添加
     */
    var shouldUpload = function(record) {
        var remoteList = getRemoteList();
        for (var i = 0; i < remoteList.length; i++) {
            if (remoteList[i].time === record.time) {
                // console.log('This record has existed: ' + record.name);
                return false;
            }
        }
        if (remoteList.length >= 100 && remoteList[99].score >= record.score) {
            return false;
        }

        return true;
    };

    return {
        getRemoteList: getRemoteList,
        updateRemoteList: updateRemoteList,

        getLocalList: getLocalList,
        updateLocalList: updateLocalList,

        uploadLocalList: uploadLocalList
    };
})(this);

/* App.js
 *
 * 整个游戏的加载逻辑大致是:
 *
 * 1.实例化 Resourse对象(图片加载工具)，Engine对象(动画渲染工具)，Data对象(数据读取工具)，
 *   Controller对象(游戏逻辑控制中心)，DomManager对象(Dom元素控制中心)，
 *   Util对象(辅助功能提供者)，player玩家对象，
 *   以及三个不同类别的数组 allEnemies, allObstacles, allTreasure
 *
 * 2.Resourse将所有需要的图片资源进行缓存
 *
 * 3.全部缓存成功后，会执行Engine.init()函数
 *
 * 4.Engine.init()函数有几个主要任务，一是自己开启动画渲染，
 *   二是通过 Controller的API启动游戏逻辑，三是通过 DomManager添加事件响应
 *
 * 5.动画渲染就是让 Engine不断地执行 main函数。具体来说，所有元素对象，先执行 update()更新位置，
 *   再执行 render()利用canvas进行渲染。当然静态元素因为不动，所以不用执行 update方法
 *
 * 6.DomManager在一次性地加入监听事件后，Controller就会调用自己的restart方法，
 *   既要初始化开始时的游戏元素，还要开启逻辑循环，根据游戏持续时间来不断生成新的游戏元素。
 *   游戏时间从哪里获得呢？负责动画的 Engine对象理所应当地承担起了这个责任！
 *
 * 7.接下来就该玩家自己操作了，玩家通过移动角色，和游戏元素发生交互，并通知 Controller
 *   处理交互事件。Controller会因此处理游戏逻辑，并通知DomManager显示相应的信息。
 *
 *
 * Enjoy Your Game!
 *
 */

/* jshint undef: false, unused: false */

/* 用来界定格子大小的全局常量，玩家不可修改，这组赋值是必须的 */
var CELL_WIDTH = 101;
var CELL_HEIGHT = 83;

/* 把玩家对象放进一个叫 player 的变量里面，这个赋值是必须的 */
var player = new Player();

/* 用三个数组分别装载各项游戏元素，这组赋值是必须的 */
var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

/* 全局变量language，用来表示界面语言，0代表English，1代表中文。这个赋值是必须的 */
var language = Util.StorageGetter('language');
if (language === undefined || language === null) {
    language = 1;
}

/* 这里可以自定义设置游戏开始时的元素，不赋值时取默认值，这组赋值不是必要的 */
// Controller.initialSettings.treasureNum = 2;
// Controller.initialSettings.obstacleNum = 2;
// Controller.initialSettings.enemyNum = 5;
// Controller.initialSettings.enemyLevel = 1;

/* Engine.js
 *
 * 这个文件提供了游戏循环玩耍的功能（更新敌人和渲染）
 * 在屏幕上画出出事的游戏面板，然后调用玩家和敌人对象的 update / render 函数
 *
 * 一个游戏引擎的工作过程就是不停的绘制整个游戏屏幕，和小时候你们做的 flipbook 有点像。当
 * 玩家在屏幕上移动的时候，看上去就是图片在移动或者被重绘。但这都是表面现象。实际上是整个屏幕
 * 被重绘导致这样的动画产生的假象

 * 这个引擎是可以通过 Engine 变量公开访问的，而且它也让 canvas context (ctx) 对象也可以
 * 公开访问，以此使编写app.js的时候更加容易
 */

/* jshint undef: false, unused: false */

var Engine = (function(global) {
    'use strict';
    /* 实现定义我们会在这个作用域用到的变量
     * 创建 canvas 元素，拿到对应的 2D 上下文
     * 设置 canvas 元素的高/宽 然后添加到dom中
     */
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime;

    /* 自定义变量，用来记录总时长，便于控制游戏进程，游戏重启时被置为 0 */
    var elapsedTime;

    /* 自定义变量用来控制时间流逝的快慢，值越大，代表时间流逝的越快，默认值是1 */
    var timeSpeed = 1;

    canvas.width = CELL_WIDTH * 5;
    canvas.height = CELL_HEIGHT * 6.8;
    doc.body.appendChild(canvas);
    canvas.style.marginTop = '-11px';

    /* 这个函数是整个游戏的主入口，负责适当的调用 update / render 函数 */
    function main() {
        /* 如果你想要更平滑的动画过度就需要获取时间间隙。因为每个人的电脑处理指令的
         * 速度是不一样的，我们需要一个对每个人都一样的常数（而不管他们的电脑有多快）
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0 * timeSpeed;

        /* 调用我们的 update / render 函数， 传递事件间隙给 update 函数
         * 因为这样可以使动画更加顺畅。
         */
        update(dt);
        render();

        /* 设置我们的 lastTime 变量，它会被用来决定 main 函数下次被调用的事件。 */
        lastTime = now;

        /* 内部累计时长，注意dt受到timeSpeed影响，因此它也一样 */
        elapsedTime += dt;

        /* 在浏览准备好调用重绘下一个帧的时候，用浏览器的 requestAnimationFrame 函数
         * 来调用这个函数
         */
        win.requestAnimationFrame(main);
    }

    /* 这个函数完成一些初始化工作，特别是设置游戏必须的 lastTime 变量，
     * 这些工作只用做一次就够了
     * 而且init()函数的执行发生在所有图像资源加载完成之后
     */
    function init() {
        Controller.restartGame();
        DomManager.addEventListener();
        lastTime = Date.now();
        main();
    }

    /* 这个函数被 main 函数（我们的游戏主循环）调用，它本身调用所有的需要更新游戏角色
     * 数据的函数，取决于你怎样实现碰撞检测（意思是如何检测两个角色占据了同一个位置，
     * 比如你的角色死的时候），你可能需要在这里调用一个额外的函数。现在我们已经把这里
     * 注释了，你可以在这里实现，也可以在 app.js 对应的角色类里面实现。
     */
    function update(dt) {
        updateEntities(dt);
        // checkCollisions();
    }

    /* 这个函数会遍历在 app.js 定义的存放所有敌人实例的数组，并且调用他们的 update()
     * 函数，然后，它会调用玩家对象的 update 方法，最后这个函数被 update 函数调用。
     * 这些更新函数应该只聚焦于更新和对象相关的数据/属性。把重绘的工作交给 render 函数。
     */
    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.update();
    }

    /* 这个函数做了一些游戏的初始渲染，然后调用 renderEntities 函数。记住，这个函数
     * 在每个游戏的时间间隙都会被调用一次（或者说游戏引擎的每个循环），因为这就是游戏
     * 怎么工作的，他们就像是那种每一页上都画着不同画儿的书，快速翻动的时候就会出现是
     * 动画的幻觉，但是实际上，他们只是不停的在重绘整个屏幕。
     */
    function render() {
        /* 这个数组保存着游戏关卡的特有的行对应的图片相对路径。 */
        var rowImages = [
                'images/water-block.png', // 这一行是河。
                'images/stone-block.png', // 第一行石头
                'images/stone-block.png', // 第二行石头
                'images/stone-block.png', // 第三行石头
                'images/stone-block.png', // 第四行石头
                'images/grass-block.png' // 第一行草地
            ],
            numRows = 6,
            numCols = 5,
            row, col;

        /* 便利我们上面定义的行和列，用 rowImages 数组，在各自的各个位置绘制正确的图片 */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* 这个 canvas 上下文的 drawImage 函数需要三个参数，第一个是需要绘制的图片
                 * 第二个和第三个分别是起始点的x和y坐标。我们用我们事先写好的资源管理工具来获取
                 * 我们需要的图片，这样我们可以享受缓存图片的好处，因为我们会反复的用到这些图片
                 */
                ctx.drawImage(Resources.get(rowImages[row]),
                    col * CELL_WIDTH,
                    row * CELL_HEIGHT - 40);
            }
        }

        renderEntities();
    }

    /* 这个函数会在每个时间间隙被 render 函数调用。
     * 目的是分别调用你在 enemy 和 player对象中定义的 render 方法。
     */
    function renderEntities() {
        /* 遍历在各数组中存放的对象，然后调用你事先定义的 render 函数 */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });
        allObstacles.forEach(function(obstacle) {
            obstacle.render();
        });
        allTreasure.forEach(function(treasure) {
            treasure.render();
        });

        player.render();
    }

    /* 这个函数用来重置Engine，在游戏重启时调用。
     * Engine所掌管的游戏变量只有时间，其它的都交给Controller去做了。
     * 因此这里只用将计时器归零，然后让时间流速恢复正常就可以了。
     */
    function reset() {
        elapsedTime = 0;
        setTimeSpeed(1);
    }

    /* 自定义函数用来获取游戏总时长，单位是秒
     */
    function getTime() {
        return elapsedTime;
    }

    /* 自定义函数用来控制时间流逝的快慢
     * 影响的不仅是敌人的速度，内部计时elapsedTime也受影响
     */
    function setTimeSpeed(speed) {
        timeSpeed = speed;
    }

    /* 紧接着我们来加载我们知道的需要来绘制我们游戏关卡的图片。然后把 init 方法设置为回调函数。
     * 那么当这些图片都已经加载完毕的时候游戏就会开始。
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png',
        'images/Rock.png',
        'images/Gem Blue.png',
        'images/Gem Green.png',
        'images/Gem Orange.png',
        'images/Heart.png',
        'images/Key.png',
        'images/Star.png'
    ]);
    Resources.onReady(init);

    /* 把 canvas 上下文对象绑定在 global 全局变量上（在浏览器运行的时候就是 window
     * 对象。从而开发者就可以在他们的app.js文件里面更容易的使用它。
     */
    global.ctx = ctx;

    /* Engine提供的API，用来设置时间流速，获取计时结果，或者重置内部时间变量 */
    return {
        reset: reset,
        getTime: getTime,
        setTimeSpeed: setTimeSpeed
    };
})(this);
