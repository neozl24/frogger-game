//用来界定格子大小的变量
const cellWidth = 101;
const cellHeight = 83;

// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
// 把玩家对象放进一个叫 player 的变量里面
var player = new Player();

var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

// 初始化游戏元素
controller.addEnemy(3, 1);
controller.addObstacle(2);
controller.addRandomTreasure(3);


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
