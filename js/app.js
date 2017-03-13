//用来界定格子大小的常量
var CELL_WIDTH = 101;
var CELL_HEIGHT = 83;

// 把玩家对象放进一个叫 player 的变量里面，这个赋值是必须的
var player = new Player();

// 用三个数组分别装载各项游戏元素，这组赋值是必须的
var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

// 这里可以设置游戏开始时的元素，不设定时取默认值，这组赋值不是必要的
Controller.initialSettings['treasureNum'] = 2;
Controller.initialSettings['obstacleNum'] = 2;
Controller.initialSettings['enemyNum'] = 4;
Controller.initialSettings['enemyLevel'] = 1;
