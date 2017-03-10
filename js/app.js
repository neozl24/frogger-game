// 这是我们的玩家要躲避的敌人
var Enemy = function() {
    // 要应用到每个敌人的实例的变量写在这里
    // 我们已经提供了一个来帮助你实现更多

    // 敌人的图片或者雪碧图，用一个我们提供的工具函数来轻松的加载文件
    this.sprite = 'images/enemy-bug.png';

    this.initLocation();
};

Enemy.prototype.initLocation = function() {
    this.x = -100;
    this.y = 83 * ( Math.ceil( Math.random() * 3) );
    this.speed = 40 * Math.ceil( 2 + Math.random() * 3);
}

// 此为游戏必须的函数，用来更新敌人的位置
// 参数: dt ，表示时间间隙
Enemy.prototype.update = function(dt) {
    // 你应该给每一次的移动都乘以 dt 参数，以此来保证游戏在所有的电脑上
    // 都是以同样的速度运行的
    this.x += this.speed * dt;

    //敌人跑到屏幕右侧之外后，将其重置到屏幕左侧
    if (this.x > 101 * 5) {
        this.initLocation();
    }
};

// 此为游戏必须的函数，用来在屏幕上画出敌人，
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 65);
};


// 现在实现你自己的玩家类
// 这个类需要一个 update() 函数， render() 函数和一个 handleInput()函数
var Player = function() {
    this.sprite = 'images/char-boy.png';
    this.initLocation();
}

Player.prototype.initLocation = function() {
    this.x = 101 * 2;
    this.y = 83 * 5;
}

Player.prototype.update = function() {

    for (var i = 0, len = allEnemies.length; i < len; i ++) {
        if ( this.hasCollisionWith(allEnemies[i]) ) {
            console.log('collision!');
            this.initLocation();
        }
    }
};

Player.prototype.hasCollisionWith = function(obj) {
    if (!obj.hasOwnProperty('x') || !obj.hasOwnProperty('y')) {
        console.log('not an obj!');
        return false;
    }
    if ( (this.x - obj.x) < 80 && (this.x - obj.x) > -80
        && (this.y - obj.y) === 0 ) {
        return true;
    } else {
        return false;
    }
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y - 50);
};

Player.prototype.handleInput = function(direction) {
    switch (direction) {
        case 'left':
            if (this.x >= 101 && this.y > 0) {
                this.x -= 101;
            }
            break;
        case 'right':
            if (this.x < 101 * 4 && this.y > 0) {
                this.x += 101;
            }
            break;
        case 'up':
            if (this.y > 0) {
                this.y -= 83;

                //如果到了最上面的那条河，就记录成功一次，并重归原位
                if (this.y <= 0) {
                    score += 1;
                    scoreTxt.innerText = "Score: " + score;
                    var _this = this;
                    setTimeout(function() {
                        _this.initLocation();
                    }, 100);
                }
            }
            break;
        case 'down':
            if (this.y < 83 * 5 && this.y > 0) {
                this.y += 83;
            }
            break;
        default:
            return;
    }
};

//下面是用来计分统计的变量
var doc = this.document,
    scoreTxt = doc.getElementById('score'),
    msgTxt = doc.getElementById('msg'),
    chancesTxt = doc.getElementById('chances'),
    score = 0;

// 现在实例化你的所有对象
// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
// 把玩家对象放进一个叫 player 的变量里面
var player = new Player();

var allEnemies = [];
for(var i = 0; i < 3; i ++) {
    allEnemies.push(new Enemy());
}

// 这段代码监听游戏玩家的键盘点击事件并且代表将按键的关键数字送到 Play.handleInput()
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
