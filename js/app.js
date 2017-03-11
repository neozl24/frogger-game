//用来界定格子大小的变量
const cellWidth = 101;
const cellHeight = 83;

// 用来控制游戏进程的对象
var controller = {};

//下面是用来计分统计的变量
var scoreTxt = document.getElementById('score'),
    msgTxt = document.getElementById('msg'),
    chancesTxt = document.getElementById('chances');

// 把所有敌人的对象都放进一个叫 allEnemies 的数组里面
// 把玩家对象放进一个叫 player 的变量里面
var player = new Player();

var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

controller.addElements = function(num, ClassName, array, level) {
    for(let i = 0; i < num; i ++) {
        // level这个参数只对ClassName为Enemy时才有作用
        array.push(new ClassName(level));
    }
}
controller.resetMsg = function() {
    msgTxt.innerText = "Move to the river above";
};
controller.updateScore = function() {
    scoreTxt.innerText = "Score: " + player.score;
};
controller.updateChances = function() {
    chancesTxt.innerText = "";
    for(let i = 0; i < player.chances; i ++) {
        this.innerText += "♥";
    }
};

// 初始化游戏元素
controller.addElements(3, Enemy, allEnemies, 1);
controller.addElements(2, Obstacle, allObstacles);
controller.addElements(1, GreenGem, allTreasure);
controller.addElements(1, BlueGem, allTreasure);

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
