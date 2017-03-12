//用来界定格子大小的变量
const cellWidth = 101;
const cellHeight = 83;

// 把玩家对象放进一个叫 player 的变量里面，这个赋值是必须的
var player = new Player();

// 用三个数组分别装载各项游戏元素，这组赋值是必须的
var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

// 这里可以设置游戏开始时的元素，不设定时取默认值，这组赋值不是必要的
controller.initialSettings["treasureNum"] = 2;
controller.initialSettings["obstacleNum"] = 2;
controller.initialSettings["enemyNum"] = 3;
controller.initialSettings["enemyLevel"] = 1;

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

var button = document.getElementById("settings");
button.onclick = function() {
    controller.restart(player);
};
