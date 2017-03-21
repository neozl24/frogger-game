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
if (language === undefined) {
    language = 1;
}

/* 这里可以自定义设置游戏开始时的元素，不赋值时取默认值，这组赋值不是必要的 */
// Controller.initialSettings.treasureNum = 2;
// Controller.initialSettings.obstacleNum = 2;
// Controller.initialSettings.enemyNum = 5;
// Controller.initialSettings.enemyLevel = 1;
