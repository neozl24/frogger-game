/* Controller.js
 * 这个文件提供了游戏控制中心的功能，Controller相当于一个单例对象，供其它模块调用。
 * 大部分和游戏逻辑相关的代码都写在了这里，任何游戏元素想知道自己什么时候该生成，
 * 或者碰到一个事件该怎么办，都要向Controller来询问。
 * 所以可以把Controller理解成这个游戏的管家。
 *
 * 具体来说，Controller有以下几个作用：
 * 1.控制游戏的开始、暂停、继续、重启等等
 * 2.保持游戏的逻辑循环，从而不断生成新的元素，或者提升敌人等级，这个循环可以停止和重启
 * 3.增删游戏元素，不过这部分接口并不暴露在外，由内部函数调用
 * 4.处理游戏事件，包括碰到敌人和宝物之后的逻辑，这部分函数暴露在外
 * 5.操作DOM元素，随着玩家的游戏进程，相关DOM元素会实时更新
 * 6.提供一个二维数组pavement用来表示画面中间区域的占用情况，可以被外部访问
 * 7.提供工具函数API，例如剔出一个数组中的空元素
 * 8.添加系统响应事件，由Engine.init()函数负责调用
 *
 */

/* jshint undef: false, unused: false, strict: false */

var Controller = (function(global) {

    /* 下面这些DOM元素用来反应游戏状态 */
    var doc = global.document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        lifeTxt = doc.getElementById('life'),
        progressBar = doc.getElementById('progress-bar'),
        topBar = doc.getElementById('top-bar');

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
            if (pavement.getOccupiedNum() <= 16) {
                allObstacles.push(new Obstacle());
            }
        }
    };

    /* 添加宝物，新增数量作为参数传递，如果路面中已有大量格子被占据，则取消添加 */
    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() <= 10) {
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
        allObstacles = takeOutNullOrUndefined(allObstacles);
    };

    /* 重置上方中央的信息栏，参数为空 */
    var resetMsg = function() {
        msgTxt.innerText = 'Move to the river above';
        msgTxt.style.color = 'white';
    };

    /* 更新上方左边的得分栏，player实例作为参数传递 */
    var updateScore = function() {
        scoreTxt.innerText = 'Score: ' + player.score;
    };

    /* 更新上方右边的生命值栏，player实例作为参数传递 */
    var updateLives = function() {
        lifeTxt.innerText = '';
        for (var i = 0; i < player.lives; i++) {
            lifeTxt.innerText += '♥';
        }
    };

    /* 重启游戏的函数，传入player实例作为参数 */
    var restart = function() {

        /* 先将player实例还原成初始状态，然后重置上方面板信息 */
        player.initLocation();
        player.lives = 3;
        player.score = 0;
        updateLives();
        updateScore();
        resetMsg();

        /* 结束上一局的游戏循环 */
        global.clearInterval(gameLoopId);

        /* 清除上一局的蓝宝石倒计时效果（如果还没结束的话） */
        global.clearInterval(countdownId);
        progressBar.style.width = 0;
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

        /* 这个setInterval函数每隔1秒检查stage值是否有变化，
         * 如果有，则准备新增元素，并提升敌人等级。
         * 将它的返回值存储下来，方便之后clearInterval调用，从而停止游戏逻辑循环
         */
        gameLoopId = setInterval(function() {

            /* 只有player.score和Engine.getTime()两个值都达标，才能进入下一个stage
             * 一般情况下，我们希望stage值由游戏时间决定，每隔 5秒提升一档。
             * 只有玩家分数太低，平均每 5秒的得分不到10分的情况下，stage才由分数决定
             * 个别情况会导致stage停留不动，例如玩家在出发点挂机。
             */
            stage = Math.floor(Math.min(Engine.getTime() / 5.0, player.score / 10.0));

            if (stage !== lastStage) {
                console.log(stage);
                allEnemies.forEach(function(enemy) {
                    enemy.level += 1;
                });
                addRandomTreasure(1);

                if (stage % 3 === 0) {
                    addObstacle(1);
                }
                if (stage % 4 === 0) {
                    addEnemy(1, stage);
                }
                if (stage % 6 === 0) {
                    addTreasure(1, Key);
                }
                if (stage % 8 === 0) {
                    addTreasure(1, GreenGem);
                }
                if (stage % 9 === 0) {
                    addTreasure(1, Heart);
                }
            }
            lastStage = stage;

        }, 1000);
    };

    /* 暂停游戏，此时角色不受键盘响应 */
    var pauseGame = function() {
        player.canMove = false;

        /* 让时间流速为0，相当于暂停动画，
         * 但实际上浏览器依然在不断渲染，只是每次渲染的图画都一样而已。
         * 由于时间静止，玩家的得分在此期间也不能发生变化，所以stage变量也不会变。
         */
        Engine.setTimeSpeed(0);

        /* 同时要清除进度条缩减的倒计时器
         * 否则进度条会继续缩减，直到减为 0时，自动触发时间恢复的效果
         * 注意倒计时器是按照真实时间来计时的，不受Engine里的时间影响，
         * 因此基于Engine实现的暂停或者时间减缓，都对倒计时器的运行不起作用
         */
        global.clearInterval(countdownId);
    };

    /* 继续游戏，恢复键盘响应，恢复时间流速 */
    var continueGame = function() {
        player.canMove = true;
        Engine.setTimeSpeed(1);

        /* 如果暂停之前的进度条长度还没有缩减到 0，那么就继续缩减，时间变缓效果仍将继续 */
        shortenProgressBar(progressBar.offsetWidth);
    };

    /* 如果到了最上面的那条河，增加得分，给出提示信息。
     * 这时玩家的角色会停留一小段时间，好让玩家看清除，角色确实到达河边。
     * 该期间其它角色正常，只是玩家角色被固定住，同时不受键盘响应。
     * 随后角色回到初始位置，键盘恢复响应。
     */
    var crossRiver = function() {
        player.canMove = false;

        /* 游戏阶段越往后，单次过河的分数越高 */
        player.score += (10 + stage);
        updateScore();

        var congratsWords = [
            'Good Job!',
            'Nice Move!',
            'Game is Too Easy, Right?',
            'Well Done!',
            'You Need Water!'
        ];
        var randomIndex = Math.floor(Math.random() * congratsWords.length);
        msgTxt.innerText = congratsWords[randomIndex];

        /* 0.5秒后让角色归位并恢复键盘响应，再过 0.5秒还原文字区域 */
        global.setTimeout(function() {
            player.initLocation();
            player.canMove = true;
        }, 500);
        global.setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 碰撞到敌人时，所有元素会静止一小段时间，好让玩家看清发碰撞的发生
     * 减去玩家一点生命，然后再判断玩家剩余生命是否为 0，并作进一步处理
     */
    var collideWithEnemy = function() {
        pauseGame();

        player.lives -= 1;
        updateLives();
        msgTxt.style.color = '#f13';

        /* 如果剩余生命值大于 0，则重置角色位置，减去一滴血，再继续游戏。
         * 如果剩余生命值为 0，则提示Game Over，并重新开始游戏。
         */
        if (player.lives > 0) {
            msgTxt.innerText = 'Oops! Collide with a bug!';
            global.setTimeout(function() {
                resetMsg();
                player.initLocation();
                continueGame();
            }, 1000);

        } else {
            msgTxt.innerText = 'Game Over';
            global.setTimeout(function() {
                restart();
                continueGame();
            }, 1000);
        }
    };

    /* countdownId 用来标记进度条的倒计时器，是setInterval函数的返回值。
     * 在一个蓝宝石的效果还没结束，又碰到另一个蓝宝石时，就需要将上一次的
     * 倒计时器清空，此时这个id变量就会被clear函数调用。
     * 暂停游戏时，要清空倒计时器，恢复游戏时再继续让倒计时器运行
     * 重启游戏时，要确保上一局的蓝宝石效果已经清空，因此也要清空倒计时器。
     */
    var countdownId;

    /* 得到蓝宝石，让时间变慢，持续一小段时间。
     * 让时间变慢的具体做法就是启动进度条缩减函数，这个函数启动了一个倒计时器，
     * 不断缩减进度条长度，直到其长度为 0，时间流速才恢复正常
     */
    var obtainBlueGem = function() {

        /* 如果连续吃到两个蓝宝石，需要先将上一个产生的倒计时器清除 */
        global.clearInterval(countdownId);

        /* 让进度条从最大值开始缩减，当它长度变为 0时，时间流速恢复正常 */
        shortenProgressBar(topBar.offsetWidth);
    };

    /* 缩短上方的蓝色进度条，蓝色进度条的起始长度作为参数传递
     * 当蓝色进度条的长度减到 0 或是被直接置为 0 时，都会导致倒计时器终止，时间流速恢复正常
     * 因此，只要给这个函数一个大于 0 的参数并执行，就自动开始时间减速效果
     * 游戏的暂停和恢复也是这个原理，暂停时清除倒计时器，但是进度条长度停留在了暂停时的位置
     * 而游戏恢复时，将刚才的进度条长度作为参数重新传递，倒计时器又继续从刚才的地方启动
     * 这样就使暂停游戏不影响时间减速的效果，核心就在于进度条长度————这个传递信息的关键！
     */
    var shortenProgressBar = function(initialWidth) {

        /* 先计算进度条的起始长度 */
        progressBar.style.width = initialWidth + 'px';

        Engine.setTimeSpeed(0.2);
        msgTxt.innerText = 'Time Slowing Down';

        /* 有效时间 */
        var actionTime = 5000;
        /* 渲染的时间间隔，会影响进度条动画的平顺 */
        var dt = 10;

        var totalWidth = topBar.offsetWidth;
        var unitWidth = Math.ceil(totalWidth * dt / actionTime);

        var width = initialWidth;

        /* 倒计时器，逐步将进度条缩短，直到为 0，才触发时间流速恢复正常 */
        countdownId = setInterval(function() {
            width -= unitWidth;
            width = Math.max(width, 0);
            progressBar.style.width = width + 'px';
            if (width <= 0) {
                Engine.setTimeSpeed(1);
                resetMsg();
                global.clearInterval(countdownId);
            }
        }, dt);
    };

    /* 得到绿宝石，减少一个敌人，如果当前只剩一个敌人，则效果改为得到大量分数 */
    var obtainGreenGem = function() {
        if (allEnemies.length <= 1) {
            player.score += 50;
            updateScore();
            msgTxt.innerText = '50 Scores Awarded!';
        } else {
            allEnemies = allEnemies.slice(0, allEnemies.length - 1);
            msgTxt.innerText = 'One Bug Eliminated!';
        }

        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 橙色宝石可以将所有敌人移到屏幕左侧以外去 */
    var obtainOrangeGem = function() {
        allEnemies.forEach(function(enemy) {
            enemy.x = -100;
        });
        msgTxt.innerText = 'Push Bugs Away!!';
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 得到桃心，恢复一点生命。如果生命达到上限，则改为获得一定量的分数 */
    var obtainHeart = function() {
        if (player.lives < 5) {
            player.lives += 1;
            updateLives();
            msgTxt.innerText = 'One More Life!';
        } else {
            player.score += (30 + 3 * stage);
            updateScore();
            msgTxt.innerText = player.score + 'Extra Scores';
        }
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 得到钥匙时，消除一个石头（如果屏幕上还有石头的话），同时得到少量分数 */
    var obtainKey = function() {
        removeRock();
        player.score += 20;
        updateScore();
        msgTxt.innerText = 'Remove a Rock';
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 得到星星可以获得大量分数 */
    var obtainStar = function() {
        player.score += (50 + 5 * stage);
        updateScore();
        msgTxt.innerText = 'Lucky! Much More Scores!';
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    /* 功能函数，返回值是参数数组去掉了null或undefined之后的结果 */
    var takeOutNullOrUndefined = function(array) {
        var newArray = [];
        for (var i = 0, j = 0; i < array.length; i++) {
            /* 如果元素不是null或undefined，就移到新数组来 */
            if (array[i] !== null && array[i] !== undefined) {
                newArray[j] = array[i];
                j++;
            }
        }
        return newArray;
    };

    /* 添加各种事件响应，只需在游戏启动时执行一次 */
    var addEventListener = function() {

        /* 监听游戏玩家的键盘点击事件 */
        doc.addEventListener('keyup', function(e) {
            var allowedKeys = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down'
            };
            player.handleInput(allowedKeys[e.keyCode]);
        });

        /* 添加菜单中的点击响应事件 */
        var menuButton = doc.getElementById('btn-menu');
        var menu = doc.getElementById('menu');
        /* 定义一个变量，用来标记菜单栏是否隐藏 */
        var isMenuHidden = true;
        var showMenu = function() {
            menu.style.height = '183px';
            menu.style.borderBottom = '2px solid #251';
            isMenuHidden = false;
            /* 菜单栏出现时，游戏暂停 */
            pauseGame();
        };
        var hideMenu = function() {
            menu.style.height = 0;
            menu.style.borderBottom = '0';
            isMenuHidden = true;
            /* 菜单栏隐藏时，游戏继续 */
            continueGame();
        };
        menuButton.onclick = function(e) {
            /* 点击菜单按钮时，点击事件停止向上传递 */
            e.stopPropagation();
            if (isMenuHidden) {
                showMenu();
            } else {
                hideMenu();
            }
        };
        /* 点击屏幕中除菜单按钮外的其它区域都会让菜单栏隐藏 */
        doc.onclick = function() {
            hideMenu();
            hideSelectionList();
        };

        /* 鼠标放在角色按钮上，会弹出二级菜单，供玩家自定义角色外观 */
        var roleListButton = doc.getElementById('btn-role');
        var selectionList = doc.getElementById('selection-list');
        /* 定义一个变量，用来标记角色选择栏是否隐藏 */
        var isSelectionListHidden = true;
        var showSelectionList = function() {
            selectionList.style.width = '310px';
            isSelectionListHidden = false;
        };
        var hideSelectionList = function() {
            selectionList.style.width = '0';
            isSelectionListHidden = false;
        };

        /* 鼠标移到角色按钮上，或者移到由它弹出的二级菜单上，二级菜单都会处于显示状态 */
        roleListButton.onmouseover = function() {
            showSelectionList();
        };
        selectionList.onmouseover = function() {
            showSelectionList();
        };
        /* 鼠标离开角色列表按钮，而且也离开了由它弹出的二级菜单，二级菜单就会处于隐藏状态 */
        roleListButton.onmouseout = function() {
            hideSelectionList();
        };
        selectionList.onmouseout = function() {
            hideSelectionList();
        };

        /* 初始化角色菜单中的图像 */
        var roleImages = [
            'images/char-boy.png',
            'images/char-cat-girl.png',
            'images/char-horn-girl.png',
            'images/char-pink-girl.png',
            'images/char-princess-girl.png'
        ];

        /* 在角色菜单栏点击图片，会将玩家形象改变成相应的样子 */
        for (var i = 0; i < roleImages.length; i++) {
            var img = doc.getElementById('role-' + i);
            img.src = roleImages[i];
            /* 用立即执行的方式，解决异步调用中 i的值不对的问题 */
            (function(index) {
                img.onclick = function() {
                    player.sprite = roleImages[index];
                    hideSelectionList();
                };
            })(i);
        }

        /* 点击重启按钮会重启游戏 */
        var restartButton = doc.getElementById('btn-restart');
        restartButton.onclick = function() {
            restart();
        };
    };

    /* Controller对象暴露的这些方法，按名字可理解其作用 */
    return {
        /* 二维数组对象，表示中间区域的占用情况 */
        pavement: pavement,

        /* 这个对象用来自定义游戏开始时的元素数量和敌人等级 */
        initialSettings: initialSettings,

        /* 重启游戏，第一次启动游戏，或者玩家点击重启按钮，都会调用该函数 */
        restart: restart,

        /* 下面一组API用来处理事件发生后的逻辑 */
        crossRiver: crossRiver,
        collideWithEnemy: collideWithEnemy,
        obtainBlueGem: obtainBlueGem,
        obtainGreenGem: obtainGreenGem,
        obtainOrangeGem: obtainOrangeGem,
        obtainKey: obtainKey,
        obtainHeart: obtainHeart,
        obtainStar: obtainStar,

        /* 工具API */
        takeOutNullOrUndefined: takeOutNullOrUndefined,

        /* 添加事件响应，只需要调用一次 */
        addEventListener: addEventListener
    };
})(this);
