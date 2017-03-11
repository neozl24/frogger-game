// 这是玩家要躲避的敌人类
var Enemy = function(level) {
    this.level = level;
    this.initLocation();
    // 敌人的图片或者雪碧图，用一个我们提供的工具函数来轻松地加载文件
    this.sprite = 'images/enemy-bug.png';
};

// 重置敌人的初始位置（绘图区域左侧之外），覆盖了父类的方法
Enemy.prototype.initLocation = function() {
    this.x = -cellWidth;
    this.y = cellHeight * ( Math.ceil( Math.random() * 4) );
    this.speed = (25 + this.level * 5) * (3 + Math.random() * 4);
}

// 此为游戏必须的函数，用来更新敌人的位置
// 参数: dt ，表示时间间隙
Enemy.prototype.update = function(dt) {
    // 你应该给每一次的移动都乘以 dt 参数，以此来保证游戏在所有的电脑上
    // 都是以同样的速度运行的
    this.x += this.speed * dt;

    // 敌人跑到屏幕右侧之外后，将其重置到屏幕左侧
    if (this.x > cellWidth * 5) {
        this.initLocation();
    }
};

// 此为游戏必须的函数，用来在屏幕上画出敌人，几个数字用来调整大小和坐标偏移
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 10, this.y - 40, 80, 136);
};

// Entity为后面障碍物类和宝物类的父类
var Entity = function() {
    this.initLocation();
}

//把坐标的设定单独写成一个方法，是因为子类需要在多种情形下重设坐标，而不仅仅是初始化时
Entity.prototype.initLocation = function() {

    var col, row;

    // 通过下面的循环，保证新生成的静态元素不会和目前已有的静态元素重叠
    do {
        col = Math.floor( Math.random() * 5);
        row = Math.floor( Math.random() * 4);
        if (!Entity.isOccupied[row][col]) {
            break;
        }
    } while (true);
    Entity.isOccupied[row][col] = true;

    this.x = cellWidth * col;
    this.y = cellHeight * (row + 1);
}

// 创建一个二维数组，用来标记格子是否被障碍物或道具占据，如果是，则无法在此生成新的静态元素
Entity.isOccupied = (function() {
    var matrix = [];
    for (var i = 0; i < 4; i ++) {
        matrix[i] = [];
        for (var j = 0; j < 5; j ++) {
            matrix[i][j] = false;
        }
    }
    return matrix;
}) ();

// 障碍物类是Entity类的子类，它的主要特点是玩家无法移动到障碍物所在区域
var Obstacle = function() {
    Entity.call(this);
    this.sprite = 'images/Rock.png';
}

Obstacle.prototype = Object.create(Entity.prototype);
Obstacle.prototype.constructor = Obstacle;

Obstacle.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 10, this.y - 40, 80, 136);
}

// 宝物类也是Entity类的子类，包含宝石、生命符等静态元素
// 玩家移动到所在格子之后会导致其消失，并触发效果
var Treasure = function() {
    Entity.call(this);
}

Treasure.prototype = Object.create(Entity.prototype);
Treasure.prototype.constructor = Treasure;
Treasure.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x + 20, this.y - 15, 60, 102);
}

// 三个Gem类都是Treasure类的子类
var BlueGem = function() {
    Treasure.call(this);
    this.sprite = "images/Gem Blue.png";
}
BlueGem.prototype = Object.create(Treasure.prototype);
BlueGem.prototype.constructor = BlueGem;

var GreenGem = function() {
    Treasure.call(this);
    this.sprite = "images/Gem Green.png";
}
GreenGem.prototype = Object.create(Treasure.prototype);
GreenGem.prototype.constructor = GreenGem;

var OrangeGem = function() {
    Treasure.call(this);
    this.sprite = "images/Gem Orange.png";
}
OrangeGem.prototype = Object.create(Treasure.prototype);
OrangeGem.prototype.constructor = OrangeGem;


// 现在实现你自己的玩家类
// 这个类需要一个 update() 函数， render() 函数和一个 handleInput()函数
var Player = function() {
    this.sprite = 'images/char-boy.png';
    this.chances = 3;
    this.score = 0;
    this.initLocation();
}

Player.prototype.initLocation = function() {
    this.x = cellWidth * 2;
    this.y = cellHeight * 5;
    this.canMove = true;    //回归原位后就把canMove再设置成true
}

Player.prototype.update = function() {

    //发生碰撞时先暂停游戏，然后在上面文字区域提示玩家发生碰撞，再将角色归附原位，最后继续游戏
    if ( this.canMove && this.hasCollisionWith(allEnemies) ) {
        var _this = this;
        this.canMove = false;
        Engine.pauseGame(); //暂停游戏

        this.chances -= 1;
        chancesTxt.update();

        //如果剩余机会大于0，则重置角色位置，减去一滴血，再继续游戏
        //如果剩余机会为0，则提示Game Over，重置所有元素和记分板，再重新开始游戏
        if (this.chances > 0) {
            msgTxt.innerText = "Oops! Collide with a bug!"
            setTimeout(function(){
                msgTxt.reset();
                _this.initLocation();
                Engine.continueGame();
            }, 1000);
        } else {
            msgTxt.innerText = "Game Over";
            setTimeout(function(){
                _this.initLocation();
                _this.chances = 3;
                Engine.restartGame();
            }, 1000);
        }
    }
};

//针对玩家位置检测是否与其它物体发生碰撞
Player.prototype.hasCollisionWith = function(array) {

    //确保参数是Array对象
    if ( !(array instanceof Array) ) {
        console.log('not an array!');
        return false;
    }

    //遍历该数组
    for (let i = 0; i < array.length; i++) {
        var obj = array[i];

        //确保数组成员有横纵坐标值，如果没有则跳入下一个循环
        if (!obj.hasOwnProperty('x') || !obj.hasOwnProperty('y')) {
            console.log('not an obj!');
            continue;
        }

        // 65这个数字是根据角色和甲虫的宽度量出来的，这时实际图片刚刚开始重叠
        if ( (this.x - obj.x) < 65 && (this.x - obj.x) > -65
            && (this.y - obj.y) === 0 ) {
            return true;
        }
    }

    return false;
};

Player.prototype.render = function() {
    // -50是为了修正玩家的纵坐标显示
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 50);
};

Player.prototype.handleInput = function(direction) {
    //到达河边，或者和敌人发生碰撞时，为了让玩家看清发生了什么，会让角色短暂地固定在事发地
    //如果角色处于我们规定的 canMove === false状态，则不产生任何动作
    if (!this.canMove) {
        return;
    }

    //若移动后和障碍物发生碰撞，则还原到碰撞前的位置，等同于无法移动到障碍物所在处
    switch (direction) {
        case 'left':
            if (this.x >= cellWidth) {
                this.x -= cellWidth;
                if (this.hasCollisionWith(allObstacles)) {
                    this.x += cellWidth;
                }
            }
            break;
        case 'right':
            if (this.x < cellWidth * 4) {
                this.x += cellWidth;
                if (this.hasCollisionWith(allObstacles)) {
                    this.x -= cellWidth;
                }
            }
            break;
        case 'up':
            if (this.y > 0) {
                this.y -= cellHeight;
                if (this.hasCollisionWith(allObstacles)) {
                    this.y += cellHeight;
                }

                //如果到了最上面的那条河，就记录成功一次，并重归原位
                //到了最上面，会停留一下子，此时将canMove置为false
                if (this.y <= 0) {
                    this.canMove = false;

                    this.score += 10;
                    scoreTxt.update();
                    msgTxt.innerText = "Good job!";

                    var _this = this;
                    setTimeout(function() {
                        _this.initLocation();
                    }, 500);
                    setTimeout(function() {
                        msgTxt.reset(); //让角色先归位，再还原文字区域
                    }, 1000);
                }
            }
            break;
        case 'down':
            if (this.y < cellHeight * 5) {
                this.y += cellHeight;
                if (this.hasCollisionWith(allObstacles)) {
                    this.y -= cellHeight;
                }
            }
            break;
        default:
            return;
    }
};

//用来界定格子大小的变量
const cellWidth = 101;
const cellHeight = 83;

//下面是用来计分统计的变量
var scoreTxt = document.getElementById('score'),
    msgTxt = document.getElementById('msg'),
    chancesTxt = document.getElementById('chances');

msgTxt.reset = function() {
    this.innerText = "Move to the river above";
}
scoreTxt.update = function() {
    this.innerText = "Score: " + player.score;
}
chancesTxt.update = function() {
    this.innerText = "";
    for(let i = 0; i < player.chances; i ++) {
        this.innerText += "♥";
    }
}

// 现在实例化你的所有对象
// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
// 把玩家对象放进一个叫 player 的变量里面
var player = new Player();

var allEnemies = [];
for(let i = 0; i < 3; i ++) {
    allEnemies.push(new Enemy(1));
}

var allObstacles = [];
for(let i = 0; i < 3; i ++) {
    allObstacles.push(new Obstacle());
}

var allTreasure = [];
allTreasure.push(new BlueGem());
allTreasure.push(new GreenGem());
allTreasure.push(new OrangeGem());

// 这段代码监听游戏玩家的键盘点击事件并且代表将按键的关键数字送到 Player.handleInput()
// 方法里面。你不需要再更改这段代码了。
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
