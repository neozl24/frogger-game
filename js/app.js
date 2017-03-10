// 这是我们的玩家要躲避的敌人
var Enemy = function() {
    // 要应用到每个敌人的实例的变量写在这里
    // 我们已经提供了一个来帮助你实现更多

    // 敌人的图片或者雪碧图，用一个我们提供的工具函数来轻松的加载文件
    this.sprite = 'images/enemy-bug.png';
    this.initLocation();
};

//重置敌人的初始位置（绘图区域左侧之外）
Enemy.prototype.initLocation = function() {
    this.x = -cellWidth;
    this.y = cellHeight * ( Math.ceil( Math.random() * 3) );
    this.speed = 40 * Math.ceil( 2 + Math.random() * 3);
}

// 此为游戏必须的函数，用来更新敌人的位置
// 参数: dt ，表示时间间隙
Enemy.prototype.update = function(dt) {
    // 你应该给每一次的移动都乘以 dt 参数，以此来保证游戏在所有的电脑上
    // 都是以同样的速度运行的
    this.x += this.speed * dt;

    //敌人跑到屏幕右侧之外后，将其重置到屏幕左侧
    if (this.x > cellWidth * 5) {
        this.initLocation();
    }
};

// 此为游戏必须的函数，用来在屏幕上画出敌人，-65是为了修正敌人的纵坐标显示
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 65);
};


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
    for (var i = 0, len = allEnemies.length; i < len; i ++) {
        if ( this.canMove && this.hasCollisionWith(allEnemies[i]) ) {
            var _this = this;
            this.canMove = false;
            Engine.pauseGame(); //暂停游戏
            this.chances -= 1;
            chancesTxt.update();

            //如果剩余机会大于0，则重置角色位置，减去一滴血，再继续游戏
            //如果剩余机会为0，则提示Game Over，重置所有角色和记分板，再重新开始游戏
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
    }
};

//针对玩家位置检测是否与其它物体发生碰撞
Player.prototype.hasCollisionWith = function(obj) {

    //确保该物体有横纵坐标值
    if (!obj.hasOwnProperty('x') || !obj.hasOwnProperty('y')) {
        console.log('not an obj!');
        return false;
    }
    // 80这个数字是量出来的，这时实际图片效果刚刚开始重叠
    if ( (this.x - obj.x) < 80 && (this.x - obj.x) > -80
        && (this.y - obj.y) === 0 ) {
        return true;
    } else {
        return false;
    }
};

Player.prototype.render = function() {
    // -50是为了修正玩家的纵坐标显示
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 50);
};

Player.prototype.handleInput = function(direction) {
    //如果角色处于我们规定的 canMove === false状态，则不进入判断
    if (!this.canMove) {
        return;
    }

    switch (direction) {
        case 'left':
            if (this.x >= cellWidth) {
                this.x -= cellWidth;
            }
            break;
        case 'right':
            if (this.x < cellWidth * 4) {
                this.x += cellWidth;
            }
            break;
        case 'up':
            if (this.y > 0) {
                this.y -= cellHeight;

                //如果到了最上面的那条河，就记录成功一次，并重归原位
                //到了最上面，会停留一下子，此时将canMove置为false
                if (this.y <= 0) {
                    this.canMove = false;

                    this.score += 1;
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
            }
            break;
        default:
            return;
    }
};

//用来界定元素大小的变量
var cellWidth = 101,
    cellHeight = 83;

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
    for(var i = 0; i < player.chances; i ++) {
        this.innerText += "♥";
    }
}

// 现在实例化你的所有对象
// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
// 把玩家对象放进一个叫 player 的变量里面
var player = new Player();

var allEnemies = [];
for(var i = 0; i < 3; i ++) {
    allEnemies.push(new Enemy());
}

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
