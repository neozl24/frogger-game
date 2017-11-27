/* Controller.js
 *
 * 这个文件提供了游戏控制中心的功能，Controller是一个单例对象，供其它模块调用。
 * 大部分和游戏逻辑相关的代码都写在了这里，任何游戏元素想知道自己什么时候该生成，
 * 或者碰到一个事件该怎么办，都要向Controller来询问。
 * 所以可以把Controller理解成这个游戏的管家。
 *
 * 具体来说，Controller有以下几个作用：
 * 1.控制游戏的开始、暂停、继续、重启等等
 * 2.保持游戏的逻辑循环，从而不断生成新的元素，或者提升敌人等级，这个循环可以停止和重启
 * 3.增删游戏元素，不过这部分接口并不暴露在外，由内部函数调用
 * 4.提供处理游戏事件的API，包括碰到敌人和宝物之后的逻辑
 * 5.随着玩家的游戏进程，通知 DomManager更新 DOM元素
 * 6.提供一个二维数组对象 pavement，用来表示画面中间区域的占用情况，可以被外部访问
 *
 */

/* jshint undef: false, unused: false */

var Controller = (function(global) {
    'use strict';

    var win = global.window;

    /* 用来设定游戏开始时各元素的数量的对象 */
    var initialSettings = {
        treasureNum: 2,
        obstacleNum: 2,
        enemyNum: 5,
        enemyLevel: 1
    };

    /* 创建一个二维数组，用来标记格子是否被已有静态元素占据。
     * 因为对应着游戏中的路面区域，所以取名为pavement。
     * 如果某一个坐标的值为true，则意味着该坐标已经有固定元素了，无法在此生成新的静态元素
     */
    var pavement = (function() {
        var matrix = [];

        /* 重置自己 */
        matrix.reset = function() {
            for (var i = 0; i < 4; i++) {
                matrix[i] = [];
                for (var j = 0; j < 5; j++) {
                    matrix[i][j] = false;
                }
            }
        };

        /* 求出自身的所有单元格共有多少个true，并将结果作为返回值
         * 它的返回值用来决定能否继续添加静态元素
         */
        matrix.getOccupiedNum = function() {
            var num = 0;
            this.forEach(function(eachRow) {
                eachRow.forEach(function(eachCell) {
                    num += (eachCell ? 1 : 0);
                });
            });
            return num;
        };

        /* 执行自身的重置函数就能完成初始化 */
        matrix.reset();

        return matrix;
    })();

    /* 添加敌人，数量和等级作为参数传递
     * 当前游戏没有敌人时，等级参数才有实际意义
     * 如果allEnemies不为空，则新加入的敌人保持和数组中第一个敌人为相同等级。
     */
    var addEnemy = function(num, level) {

        if (allEnemies.length > 0) {
            level = allEnemies[0].level;
        }
        for (var i = 0; i < num; i++) {
            allEnemies.push(new Enemy(level));
        }
    };

    /* 添加障碍物，新增数量作为参数传递，如果路面中已有大量格子被占据，则取消添加 */
    var addObstacle = function(num) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 10) {
                allObstacles.push(new Obstacle());
            }
        }
    };

    /* 添加宝物，新增数量作为参数传递，如果路面中已有大量格子被占据，则取消添加 */
    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 12) {
                allTreasure.push(new ClassName());
            }
        }
    };

    /* 按各种宝物的概率权重，随机生成若干个宝物，生成数量作为参数传递 */
    var addRandomTreasure = function(num) {

        /* 这里设置各种宝物出现的概率权重 */
        var treasureList = [{
                ClassName: BlueGem,
                weight: 20
            },
            {
                ClassName: GreenGem,
                weight: 10
            },
            {
                ClassName: OrangeGem,
                weight: 15
            },
            {
                ClassName: Heart,
                weight: 10
            },
            {
                ClassName: Key,
                weight: 10
            },
            {
                ClassName: Star,
                weight: 5
            },
        ];

        var i, j;
        var totalWeight = 0;
        for (i = 0; i < treasureList.length; i++) {
            totalWeight += treasureList[i].weight;
        }

        var randomNum, currentTotalWeight, targetClass;
        for (i = 0; i < num; i++) {
            randomNum = Math.ceil(Math.random() * totalWeight);
            targetClass = treasureList[0].ClassName;
            currentTotalWeight = 0;

            /* 这里的思路是将权重值依次累加，换算成一个个逐步增大的区间，
             * 然后看随机生成的整数落在那个区间内，便选出该区间对应的宝物类。
             * 权重越大的宝物类，所对应的区间范围也越大。
             */
            for (j = 0; j < treasureList.length - 1; j++) {
                currentTotalWeight += treasureList[j].weight;
                if (currentTotalWeight < randomNum) {
                    targetClass = treasureList[j + 1].ClassName;
                }
            }
            addTreasure(1, targetClass);
        }
    };

    /* 随机移除石块，如果游戏中没有石块了，则直接返回 */
    var removeRock = function() {
        if (allObstacles.length === 0) {
            return;
        }

        var randomIndex = Math.floor(Math.random() * allObstacles.length);

        /* 调整pavement二维数组中对应的元素为false */
        var row = allObstacles[randomIndex].y / CELL_HEIGHT - 1,
            col = allObstacles[randomIndex].x / CELL_WIDTH;
        pavement[row][col] = false;

        allObstacles[randomIndex] = null;
        allObstacles = Util.takeOutNullOrUndefined(allObstacles);
    };

    /* 重启游戏的函数 */
    var restartGame = function() {

        /* 先将player实例还原成初始状态，然后重置上方面板信息 */
        player.initLocation();
        player.lives = 3;
        player.score = 0;
        player.canMove = true;
        DomManager.updateLives();
        DomManager.updateScore();
        DomManager.resetMsg();

        DomManager.hideMenu();

        /* 结束上一局的游戏循环 */
        stopLoop();

        /* 清除上一局的蓝宝石倒计时效果（如果还没结束的话） */
        stopTimer();
        DomManager.setProgressBarLength(0);

        /* 使时间流速恢复默认状态，并使 Engine内部计时器清零重置 */
        Engine.reset();

        /* 初始化游戏元素 */
        initElements(initialSettings.treasureNum,
            initialSettings.obstacleNum,
            initialSettings.enemyNum,
            initialSettings.enemyLevel);

        /* 先重置游戏阶段为0，再开启游戏逻辑循环 */
        stage = 0;
        startLoop();
    };

    /* 暂停游戏，此时角色不受键盘响应 */
    var pauseGame = function() {
        player.canMove = false;

        /* 让时间流速为0，相当于暂停动画，
         * 但实际上浏览器依然在不断渲染，只是每次渲染的图画都一样而已。
         * 由于时间静止，玩家的得分在此期间也不能发生变化，所以stage变量也不会变。
         */
        Engine.setTimeSpeed(0);

        /* 暂停倒计时器
         * 注意倒计时器是按照真实时间来计时的，不受Engine里的时间影响，
         * 因此基于Engine实现的暂停或者时间减缓，都对倒计时器的运行不起作用
         */
        pauseTimer();
    };

    /* 继续游戏，恢复键盘响应，恢复时间流速，
     * 并启动倒计时器，如果 leftTime 大于0的话，则继续上一次没有结束的效果
     */
    var continueGame = function() {
        player.canMove = true;
        Engine.setTimeSpeed(1);

        if (leftTime > 0) {
            startTimer();
        }
    };

    /* 停止游戏，判断玩家的分数能否进入排行榜，玩家点击确定后再重启游戏 */
    var endGame = function() {
        stopLoop();
        stopTimer();

        var endWords = ['Game Over', '游戏结束！'];
        DomManager.setMsg(endWords[language]);

        /* 下面的这层逻辑做成异步，是因为我们的游戏结束发生在player的update函数中，
         * 所以输入框弹出的时候，玩家最后移动的一步动画的render函数还没有执行，
         * 因此我们加入一小段延时，让这部分处理发生在走出这一步后
         */
        win.setTimeout(function() {

            var time = Date.now();
            var record = {
                name: "",
                score: player.score,
                role: player.sprite,
                time: time
            };

            /* 玩家登上了本地 Top10，或者在线的 Top100榜单时，都可以留下姓名 */
            var localList = Data.getLocalList();
            var remoteList = Data.getRemoteList();

            var isOnRemoteList = remoteList.length < 100 ||
                record.score > remoteList[99].score;
            var isOnLocalList = localList.length < 10 ||
                record.score > localList[9].score;

            var prefix = '没有名字的';
            var defaultNames = ['小猫', '小狗', '小老鼠', '小牛', '小老虎', '小兔子',
                '小羊羔', '小猴子', '小猪', '小熊猫', '小苹果', '小辣椒', '小青蛙', '小螃蟹',
                '小虾米', '小毛豆', '小西瓜', '小苹果', '小雪梨', '小笨蛋'
            ];
            var randomIndex = Math.floor(Math.random() * defaultNames.length);
            var defaultName = prefix + defaultNames[randomIndex];

            if (isOnRemoteList) {
                var worldCongratsWords = [
                    'Congratulations! You\'ve broaded on the global record list!' +
                    'Please leave your name: ',
                    '恭喜，你成功登上了全球排行榜！\n请留下你的大名：'];
                record.name = win.prompt(worldCongratsWords[language],
                    defaultName) || defaultName;
                Data.updateRemoteList(record);
                Data.updateLocalList(record);

            } else if (isOnLocalList) {
                var localCongratsWords = [
                    'You have freshed your own top 10 records!\n' +
                    'Please leave your name: ' ,
                    '你刷新了个人的10佳记录，可以留个名了：'];
                record.name = win.prompt(localCongratsWords[language],
                    defaultName) || defaultName;
                Data.updateLocalList(record);
            } else {
                var encouragingWords = ['You could do better!', '下次努力'];
                win.alert(encouragingWords[language]);
            }

            restartGame();
        }, 10);
    };

    /* 该函数用来初始化游戏元素 */
    var initElements = function(treasureNum, obstacleNum, enemyNum, level) {
        /* 先将几个数组置空 */
        allEnemies = [];
        allObstacles = [];
        allTreasure = [];

        /* 重置用来标记格子是否被占用的二维数组 */
        pavement.reset();

        /* 最后添加游戏元素 */
        addRandomTreasure(treasureNum);
        addObstacle(obstacleNum);
        addEnemy(enemyNum, level);
    };

    /* 我们将游戏分为一个一个的阶段，用变量stage来表示
     * stage的值决定了什么时候增加敌人，提升敌人等级，生成静态元素等等
     */
    var stage = 0;

    /* 这个变量是游戏逻辑循环的id，用作clearInterval()的参数 */
    var gameLoopId;

    /* 游戏逻辑循环函数，根据游戏时间和玩家当前分数，来控制各项元素的增减以及等级变化 */
    var startLoop = function() {

        /* 先记录上一个stage */
        var lastStage = stage;

        /* 每次执行下面的setInterval时，都需要将上一次的结果清除掉 */
        win.clearInterval(gameLoopId);

        /* 这个setInterval函数每隔1秒检查stage值是否有变化，
         * 如果有变化，则准备新增元素，并提升敌人等级。
         * 将它的返回值存储下来，方便之后clearInterval调用，从而停止游戏逻辑循环
         */
        gameLoopId = win.setInterval(function() {

            /* 只有player.score和Engine.getTime()两个值都达标，才能进入下一个stage
             * 游戏前期，stage值主要由游戏时间决定，每隔 5秒提升一档。
             * 游戏后期，不希望玩家通过等甲虫自动提升到很高的等级，再利用道具过河拿分，
             * stage更多地由分数决定，因此利用了指数函数的成长作为限制。
             * 个别情况会导致stage停留不动，例如玩家在出发点挂机。
             */
            var timeLimitStage = Engine.getTime() / 5.0,
                scoreLimitStage = Math.sqrt(player.score) * 1.25;
            stage = Math.floor(Math.min(timeLimitStage, scoreLimitStage));

            if (stage !== lastStage) {
                // console.log(stage);
                allEnemies.forEach(function(enemy) {
                    enemy.level += 1;
                });
                addRandomTreasure(1);

                if (stage % 3 === 0) {
                    if (allEnemies.length < 4) {
                        addEnemy(1, stage);
                    }
                    addObstacle(1);
                }
                if (stage % 4 === 0) {
                    if (allEnemies.length < 8) {
                        addEnemy(1, stage);
                    }
                }
                if (stage % 6 === 0) {
                    addTreasure(1, Key);
                }
                if (stage % 8 === 0) {
                    addTreasure(1, GreenGem);
                }
                if (stage % 12 === 0) {
                    addTreasure(1, Heart);
                }
            }
            lastStage = stage;

        }, 1000);
    };

    /* 结束游戏循环 */
    var stopLoop = function() {
        win.clearInterval(gameLoopId);
    };

    /* 新增一个变量lastCrossTime，用来记录上次过河时间，如果短时间连续过河，有加分奖励 */
    var lastCrossTime = 0;
    /* 用一个变量记录这个不间断的连续过河次数，不间断的意思是两两之间均在设定间隔内 */
    var k = 1;
    var resetMsgId = 0;

    /* 如果到了最上面的那条河，增加得分，给出提示信息。
     * 这时玩家的角色会停留一小段时间，好让玩家看清楚，角色确实到达河边。
     * 该期间其它角色正常，只是玩家角色被固定住，同时不受键盘响应。
     * 随后角色回到初始位置，键盘恢复响应。
     */
    var crossRiver = function() {
        win.clearTimeout(resetMsgId);
        player.canMove = false;
        var crossTime = Date.now();
        if (crossTime - lastCrossTime < 2800) {
            k = k < 4 ? (k + 1) : 4;
        } else {
            k = 1;
        }

        /* 游戏阶段越往后，单次过河的分数越高 */
        var awardScore = (10 + stage) * k;
        player.score += awardScore;
        DomManager.updateScore();

        var congratsWords = [];
        congratsWords[0] = [
            'Good Job!',
            'Nice Move!',
            'Well Done!',
            'You Need Water!'
        ];
        congratsWords[1] = [
            '好样的！',
            '身手敏捷！',
            '你的身法让人眼花缭乱',
            '该让甲虫跑得再快一点',
            '甲虫朋友们，碾死他！'
        ];
        var randomIndex = Math.floor(Math.random() *
            congratsWords[language].length);

        var continuityWords = ['Fast Crossing\n' +
            k + ' * ' + awardScore + ' Scores Awarded',
            '连续过河! ' + k + '倍积分奖励'];

        if (k > 1) {
            DomManager.setMsg(continuityWords[language]);
            DomManager.setMsgColor('#fbf850');
        } else {
            DomManager.setMsg(congratsWords[language][randomIndex]);
        }

        /* 再将上次过河时间更新到现在，用于下次比较 */
        lastCrossTime = Date.now();

        /* 0.5秒后让角色归位并恢复键盘响应，再过 1秒还原文字区域 */
        win.setTimeout(function() {
            player.initLocation();
            player.canMove = true;
        }, 500);
        resetMsgId = win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 碰撞到敌人时，所有元素会静止一小段时间，好让玩家看清发碰撞的发生
     * 减去玩家一点生命，然后再判断玩家剩余生命是否为 0，并作进一步处理
     */
    var collideWithEnemy = function() {
        pauseGame();

        player.lives -= 1;
        DomManager.updateLives();
        DomManager.setMsgColor('#f13');

        /* 如果剩余生命值大于 0，则重置角色位置，减去一滴血，再继续游戏。
         * 如果剩余生命值为 0，则提示Game Over，并重新开始游戏。
         */
        if (player.lives > 0) {
            var collisionWords = ['Oops! Collide with a bug!',
                '你被甲虫给逮住啦!'];
            DomManager.setMsg(collisionWords[language]);
            win.setTimeout(function() {
                DomManager.resetMsg();
                player.initLocation();
                continueGame();
            }, 1500);

        } else {
            endGame();
        }
    };

    /* timerId 用来标记进度条的倒计时器，是setInterval函数的返回值。
     * 在一个蓝宝石的效果还没结束，又碰到另一个蓝宝石时，就需要先将上一次的
     * 倒计时器清空，此时这个id变量就会被clearInterval函数调用。
     * 暂停游戏时，要清空倒计时器；恢复游戏时再继续让倒计时器运行
     * 重启游戏时，要确保上一局的蓝宝石倒计时效果已经失效，因此也要清空倒计时器。
     */
    var timerId;

    /* 得到蓝宝石，让时间变慢，持续一小段时间。
     * 让时间变慢就是启动一个倒计时器，不断减少leftTime，当其为0时，时间流速恢复正常
     */
    var obtainBlueGem = function() {

        /* 这个倒计时器就像一个旧式闹钟，要上发条才能动
         * 这里设定leftTime就相当于给其上发条，不能超过5000，即 5秒
         */
        leftTime = 5000;
        startTimer();
    };


    /* 这个变量是倒计时器的核心，反应时间减速效果的剩余时间，是Controller内的全局变量 */
    var leftTime = 0;

    /* 启动倒计时器，核心就是启动 setInterval()函数，不断更新 leftTime，直到其减为 0,
     * 每一次减少后，都通知 DomManager同比例地反映到进度条的长度上去
     */
    var startTimer = function() {
        Engine.setTimeSpeed(0.2);
        var words = ['Time Slowing Down', '时间变慢了！'];
        DomManager.setMsg(words[language]);

        /* leftTime最长不超过5秒 */
        var maxTime = 5000;
        leftTime = Math.min(maxTime, leftTime);
        /* 渲染的时间间隔，会影响进度条动画的平顺 */
        var dt = 10;

        /* 每次启动setInterval之前，需要将上一次的循环清除 */
        win.clearInterval(timerId);

        /* 倒计时器，leftTime逐步减少，直到为 0，才触发时间流速恢复正常 */
        timerId = win.setInterval(function() {
            leftTime -= dt;
            leftTime = Math.max(leftTime - dt, 0);
            DomManager.setProgressBarLength(leftTime / maxTime);
            if (leftTime <= 0) {
                Engine.setTimeSpeed(1);
                DomManager.resetMsg();
                win.clearInterval(timerId);
            }
        }, dt);
    };

    /* 暂停倒计时器，游戏暂停时执行 */
    var pauseTimer = function() {
        win.clearInterval(timerId);
    };

    /* 停止倒计时器，游戏重启时执行 */
    var stopTimer = function() {
        win.clearInterval(timerId);
        leftTime = 0;
        DomManager.setProgressBarLength(0);
    };

    /* 得到绿宝石，减少一个敌人，如果当前只剩一个敌人，则效果改为得到中量分数
     * 2017.3.20添加：如果到了游戏后期，绿宝石可以减去两个敌人
     */
    var obtainGreenGem = function() {
        if (allEnemies.length <= 1) {
            var awardScore = 30 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = [' Scores Awarded!', '分到手！'];
            DomManager.setMsg(awardScore + scoreWords[language]);
        } else {
            var k = (allEnemies.length > 2 && stage > 60) ? 2 : 1;
            allEnemies = allEnemies.slice(0, allEnemies.length - k);
            var eliminatedWords = [' Bug Eliminated!', '只甲虫被消灭！'];
            DomManager.setMsg(k + eliminatedWords[language]);
        }

        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 橙色宝石可以将所有敌人移到屏幕左侧以外去 */
    var obtainOrangeGem = function() {
        allEnemies.forEach(function(enemy) {
            enemy.x = -200;
        });
        var pushWords = ['Push Bugs Away!!', '全部给我闪开！'];
        DomManager.setMsg(pushWords[language]);
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到桃心，恢复一点生命。如果生命达到上限，则改为获得中量分数 */
    var obtainHeart = function() {
        if (player.lives < 5) {
            player.lives += 1;
            DomManager.updateLives();
            var lifeWords = ['One More Life!', '奖励1点生命值'];
            DomManager.setMsg(lifeWords[language]);
        } else {
            var awardScore = 50 + 2 * stage;
            player.score += awardScore;
            DomManager.updateScore();
            var scoreWords = ['分到手！', ' Extra Scores'];
            DomManager.setMsg(player.score + scoreWords[language]);
        }
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到钥匙时，消除一个石头（如果屏幕上还有石头的话），同时得到少量分数 */
    var obtainKey = function() {
        removeRock();
        player.score += 20 + Math.floor(stage * 0.5);
        DomManager.updateScore();
        var rockWords = ['Remove a Rock!', '移开了一块石头!'];
        DomManager.setMsg(rockWords[language]);
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* 得到星星可以获得大量分数 */
    var obtainStar = function() {
        var awardScore = 100 + 3 * stage;
        player.score += awardScore;
        DomManager.updateScore();
        var scoreWords = [' Scores Awarded!', '分到手，好多!'];
        DomManager.setMsg(awardScore + scoreWords[language]);
        win.setTimeout(function() {
            DomManager.resetMsg();
        }, 1500);
    };

    /* Controller对象暴露的这些方法和对象，按名字可理解其作用 */
    return {
        /* 二维数组对象，表示中间区域的占用情况 */
        pavement: pavement,

        /* 这个对象用来自定义游戏开始时的元素数量和敌人等级 */
        initialSettings: initialSettings,

        /* 控制游戏进程 */
        restartGame: restartGame,
        pauseGame: pauseGame,
        continueGame: continueGame,

        /* 下面一组API用来处理事件发生后的逻辑 */
        crossRiver: crossRiver,
        collideWithEnemy: collideWithEnemy,
        obtainBlueGem: obtainBlueGem,
        obtainGreenGem: obtainGreenGem,
        obtainOrangeGem: obtainOrangeGem,
        obtainKey: obtainKey,
        obtainHeart: obtainHeart,
        obtainStar: obtainStar
    };
})(this);
