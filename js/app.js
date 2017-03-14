/* App.js
 *
 * 整个游戏的加载逻辑大致是:
 *
 * 1.实例化 Resourse对象(图片加载工具)，Engine对象(动画渲染工具)，Controller对象(游戏控制中心)，
 *   player玩家对象，以及三个不同类别的数组allEnemies, allObstacles, allTreasure
 *
 * 2.Resourse将所有需要的图片资源进行缓存
 *
 * 3.全部缓存成功后，会执行Engine.init()函数
 *
 * 4.Engine.init()函数有几个主要任务，一个是开启动画渲染，二是通过Controller的API启动游戏逻辑
 *
 * 5.动画渲染就是让 Engine不断地执行 main函数。具体来说，所有元素对象，先执行 update()更新位置，
 *   再执行 render()利用canvas进行渲染。当然静态元素因为不动，所以不用执行 update方法
 *
 * 6.Controller在一次性地加入监听事件后，就会调用自己的restart方法，既要初始化开始时的游戏元素，
 *   还要开启逻辑循环，根据游戏时间来不断生成新的游戏元素。时间从哪里获得呢？负责动画的 Engine对象
 *   理所应当地承担起了这个责任！
 *
 * 7.接下来就该玩家自己操作了，玩家通过移动角色，和游戏元素发生交互，并通知Controller来处理交互事件。
 *   Controller会因此决定游戏的信息显示，元素变化，以及游戏什么时候结束！
 *
 *
 * Enjoy Your Game!
 *
 */

/* 用来界定格子大小的常量 */
var CELL_WIDTH = 101;
var CELL_HEIGHT = 83;

/* 把玩家对象放进一个叫 player 的变量里面，这个赋值是必须的 */
var player = new Player();

/* 用三个数组分别装载各项游戏元素，这组赋值是必须的 */
var allEnemies = [];
var allObstacles = [];
var allTreasure = [];

/* 这里可以设置游戏开始时的元素，不设定时取默认值，这组赋值不是必要的 */
Controller.initialSettings.treasureNum = 2;
Controller.initialSettings.obstacleNum = 2;
Controller.initialSettings.enemyNum = 5;
Controller.initialSettings.enemyLevel = 1;
