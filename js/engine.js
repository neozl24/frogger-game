/* Engine.js
 * 这个文件提供了游戏循环玩耍的功能（更新敌人和渲染）
 * 在屏幕上画出出事的游戏面板，然后调用玩家和敌人对象的 update / render 函数
 *
 * 一个游戏引擎的工作过程就是不停的绘制整个游戏屏幕，和小时候你们做的 flipbook 有点像。当
 * 玩家在屏幕上移动的时候，看上去就是图片在移动或者被重绘。但这都是表面现象。实际上是整个屏幕
 * 被重绘导致这样的动画产生的假象

 * 这个引擎是可以通过 Engine 变量公开访问的，而且它也让 canvas context (ctx) 对象也可以
 * 公开访问，以此使编写app.js的时候更加容易
 */

var Engine = (function(global) {
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
        Controller.addEventListener(player);
        Controller.restart(player);
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
                'images/water-block.png',   // 这一行是河。
                'images/stone-block.png',   // 第一行石头
                'images/stone-block.png',   // 第二行石头
                'images/stone-block.png',   // 第三行石头
                'images/stone-block.png',   // 第四行石头
                'images/grass-block.png'    // 第一行草地
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
