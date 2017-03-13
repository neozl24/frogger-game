// 用来控制游戏进程的对象
var Controller = (function() {
    //下面是用来计分统计的DOM元素
    var doc = document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        chancesTxt = doc.getElementById('chances'),
        progressBar = doc.getElementById('progress-bar'),
        button = doc.getElementById('settings');

    // 用来设定游戏开始时各元素的数量的对象
    var initialSettings = {
        "treasureNum": 2,
        "obstacleNum": 2,
        "enemyNum": 4,
        "enemyLevel": 1
    };

    // 创建一个二维数组，用来标记格子是否被已有静态元素占据，如果是，则无法在此生成新的静态元素
    var pavement = (function() {
        var matrix = [];

        // 这个二维数组的私有方法，可以重置自己
        matrix.reset = function() {
            for (var i = 0; i < 4; i++) {
                matrix[i] = [];
                for (var j = 0; j < 5; j++) {
                    matrix[i][j] = false;
                }
            }
        };

        // 这个函数用来求pavement二维数组中有多少个true
        // 它的返回值用来决定能否继续添加静态元素
        matrix.getOccupiedNum = function() {
            var num = 0;
            this.forEach(function(eachRow) {
                eachRow.forEach(function(eachCell) {
                    num += (eachCell ? 1 : 0);
                });
            });
            return num;
        };

        // 执行重置函数就能完成初始化
        matrix.reset();

        return matrix;
    })();

    var addEnemy = function(num, level) {

        // 如果allEnemies不为空，则新加入的敌人保持和之前的敌人为相同等级
        if (allEnemies.length > 0) {
            level = allEnemies[0].level;
        }
        for (var i = 0; i < num; i++) {
            allEnemies.push(new Enemy(level));
        }
    }

    var addObstacle = function(num) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() < 10) {
                allObstacles.push(new Obstacle());
            }
        }
    }

    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            if (pavement.getOccupiedNum() < 16) {
                allTreasure.push(new ClassName());
            }
        }
    }

    // 按各种宝物的概率权重，随机生成若干个宝物
    var addRandomTreasure = function(num) {

        // 这里设置各种宝物出现的概率权重
        var treasureList = [
            {ClassName: BlueGem, weight: 20},
            {ClassName: GreenGem, weight: 10},
            {ClassName: OrangeGem, weight: 15},
            {ClassName: Heart, weight: 10},
            {ClassName: Key, weight: 10},
            {ClassName: Star, weight: 5},
        ];

        var i, j;
        var totalWeight = 0;
        for (i = 0; i < treasureList.length; i++) {
            totalWeight += treasureList[i].weight;
        }

        var randomNum, currentTotalWeight, targetClass;
        for (i = 0; i < num; i++) {
            randomNum = Math.ceil( Math.random() * totalWeight);
            targetClass = treasureList[0].ClassName;
            currentTotalWeight = 0;
            for (j = 0; j < treasureList.length - 1; j++) {
                currentTotalWeight += treasureList[j].weight;
                if (currentTotalWeight < randomNum) {
                    targetClass = treasureList[j+1].ClassName;
                }
            }
            addTreasure(1, targetClass);
        }
    }

    var removeRock = function(num) {
        if (allObstacles.length === 0) {
            return;
        }

        var randomIndex = Math.floor(Math.random() * allObstacles.length);

        // 先调整pavement二维数组中对应的元素为false
        var row = allObstacles[randomIndex].y / CELL_HEIGHT - 1,
            col = allObstacles[randomIndex].x / CELL_WIDTH;
        pavement[row][col] = false;

        allObstacles[randomIndex] = null;
        allObstacles = takeOutNullOrUndefined(allObstacles);
    };

    var resetMsg = function() {
        msgTxt.innerText = 'Move to the river above';
        msgTxt.style.color = 'white';
    };

    var updateScore = function(p) {
        scoreTxt.innerText = 'Score: ' + p.score;
    };

    var updateChances = function(p) {
        chancesTxt.innerText = '';
        for(var i = 0; i < p.chances; i ++) {
            chancesTxt.innerText += '♥';
        }
    };

    // 重启游戏的函数，注意要传入player实例作为参数
    var restart = function(p) {
        p.initLocation();
        p.chances = 3;
        p.score = 0;
        updateChances(p);
        updateScore(p);
        resetMsg();

        // 清除上一局的倒计时效果（如果还没结束的话）和游戏循环
        clearInterval(countdownId);
        clearTimeout(restoreId);
        progressBar.style.width = 0;

        stopLoop();

        // 执行初始化函数，生成初始元素
        initElements(   initialSettings['treasureNum'],
                        initialSettings['obstacleNum'],
                        initialSettings['enemyNum'],
                        initialSettings['enemyLevel']   );

        // 执行Engine的函数，使时间流速和计时恢复默认状态
        Engine.reset();

        //先重置游戏阶段stage，再开启游戏逻辑循环
        stage = 0;
        startLoop(p);
    }

    // 初始化游戏元素
    var initElements = function(treasureNum, obstacleNum, enemyNum, level) {
        // 先将几个数组置空
        allEnemies = [];
        allObstacles = [];
        allTreasure = [];

        // 重置用来标记格子是否被占用的二维数组
        pavement.reset();

        addRandomTreasure(treasureNum);
        addObstacle(obstacleNum);
        addEnemy(enemyNum, level);
    };

    // 我们将游戏分为一个一个的阶段，用变量stage来表示
    // stage的值决定了什么时候增加敌人，提升敌人等级，生成静态元素等等
    var stage = 0;

    // 游戏循环控制各个元素的数量，增删，速度提升等等
    // 这个变量是游戏逻辑循环的id，用作clearInterval()的参数
    var gameLoopId;

    // 游戏逻辑循环函数，根据时间和玩家当前分数来控制敌人的数量和等级，以及障碍物和宝物的增减
    var startLoop = function(p) {

        // 先记录上一次的stage
        var lastStage = stage;

        // 只有player.score和Engine.getTime()两个值都达标，才能进入下一个stage
        gameLoopId = setInterval(function() {
            /* 一般情况下，我们希望stage值由游戏时间决定，每隔5秒提升一档
             * 只有玩家分数太低，才会导致stage停留不动，例如玩家在出发点挂机的情况
             */
            stage = Math.floor(Math.min(Engine.getTime()/5.0, p.score/10.0));
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
                    addEnemy(1, allEnemies[0].level);
                }
                if (stage % 5 === 0) {
                    addTreasure(1, Key);
                }
                if (stage % 6 === 0) {
                    addTreasure(1, Heart);
                }
                if (stage % 7 === 0) {
                    addTreasure(1, GreenGem);
                }
            }
            lastStage = stage;
        }, 1000);   // 每隔1秒检查一次，游戏处于哪个stage了
    };

    var stopLoop = function(p) {
        clearInterval(gameLoopId);
    }

    // 暂停游戏
    var pauseGame = function(p) {
        p.canMove = false;          // 保证角色不受键盘响应
        Engine.setTimeSpeed(0);     // 相当于暂停动画
    }

    // 继续游戏
    var continueGame = function(p) {
        p.canMove = true;           // 恢复键盘响应
        Engine.setTimeSpeed(1);     // 恢复动画速度
    }

    // 如果到了最上面的那条河，就记录成功一次，并重归原位
    // 到了最上面，会停留一下子，此时将canMove置为false
    var handleCrossingRiver = function(p) {

        p.canMove = false;

        p.score += (10 + stage);    // 游戏阶段越往后，单次过河的分数越高
        updateScore(p);

        var congratsWords = [
            'Good Job!',
            'Nice Move!',
            ': P',
            'Well Done!',
            'You Need Water!'
        ];
        var randomIndex = Math.floor(Math.random() * congratsWords.length);
        msgTxt.innerText = congratsWords[randomIndex];

        setTimeout(function() {
            p.initLocation();
        }, 500);
        setTimeout(function() {
            resetMsg(); //0.5秒后让角色归位，再过0.5秒还原文字区域
        }, 1000);
    }

    // 碰到敌人所触发的效果
    var handleCollisionWithEnemy = function(p) {
        // 碰到敌人时会短暂地暂停游戏，好让玩家看清楚发生了什么
        pauseGame(p);

        p.chances -= 1;
        updateChances(p);

        msgTxt.style.color = '#ff1133';

        //如果剩余机会大于0，则重置角色位置，减去一滴血，再继续游戏
        //如果剩余机会为0，则提示Game Over，重置所有元素和记分板，再重新开始游戏
        if (p.chances > 0) {
            msgTxt.innerText = 'Oops! Collide with a bug!'
            setTimeout(function(){
                resetMsg();
                p.initLocation();
                continueGame(p);
            }, 1000);
        } else {
            msgTxt.innerText = 'Game Over';
            setTimeout(function(){
                restart(p);
                continueGame(p);
            }, 1000);
        }
    };

    // countdownId用来标记进度条的倒计时效果
    var countdownId;
    // restoreId用来标记进度条恢复触发器效果
    var restoreId;

    // 蓝宝石触发的效果，让时间变慢，持续一小段时间
    var obtainBlueGem = function(p) {
        Engine.setTimeSpeed(0.2);

        // 如果短时间内吃到两个蓝宝石，需要先将上一个产生的倒计时和恢复器效果清除
        clearInterval(countdownId);
        clearTimeout(restoreId);

        msgTxt.innerText = 'Time Slowing Down';

        // 有效时间
        var actionTime = 5000;
        // 渲染的时间间隔，会影响进度条动画的平顺
        var dt = 10;

        var totalWidth = progressBar.parentNode.offsetWidth;
        var width = totalWidth;
        var unitWidth = Math.ceil( totalWidth  * dt / actionTime);

        progressBar.style.width = width + 'px';

        countdownId = setInterval(function() {
            width -= unitWidth;
            width = Math.max(width, 0);
            progressBar.style.width = width + 'px';
        }, dt);

        // 将游戏时间恢复正常
        restoreId = setTimeout(function() {
            Engine.setTimeSpeed(1);
            clearInterval(countdownId);
            resetMsg();
        }, actionTime);
    };

    // 碰到绿宝石可以减少一个敌人，如果当前只剩一个敌人，则效果改为得到大量分数
    var obtainGreenGem = function(p) {
        if (allEnemies.length <= 1) {
            p.score += 50;
            updateScore(p);
            msgTxt.innerText = '50 Scores Awarded!';
        } else {
            allEnemies = allEnemies.slice(0, allEnemies.length - 1);
            msgTxt.innerText = 'One Bug Eliminated!';
        }

        setTimeout(function() {
            resetMsg();
        }, 1000);
    }

    // 橙色宝石可以将所有敌人移到屏幕左侧以外去
    var obtainOrangeGem = function(p) {
        allEnemies.forEach(function(enemy) {
            enemy.x = -100;
        });
        msgTxt.innerText = 'Push Bugs Away!!'
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 得到桃心，恢复一点生命
    var obtainHeart = function(p) {
        if (p.chances < 5) {
            p.chances += 1;
            updateChances(p);
            msgTxt.innerText = 'One More Life!';
        } else {
            p.score += (30 + 3 * stage);
            updateScore(p);
            msgTxt.innerText = p.score + 'Extra Scores';
        }
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 钥匙可以消除一个石头，同时得到少量分数。如果没有石头，则只获得同样多的分数。
    var obtainKey = function(p) {
        removeRock(1);
        p.score += 20;
        updateScore(p);
        msgTxt.innerText = 'Remove a Rock';
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 星星可以得到大量分数
    var obtainStar = function(p) {
        p.score += (50 + 5 * stage);
        updateScore(p);
        msgTxt.innerText = 'Lucky! Much More Scores!';
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    //这是一个功能函数，返回值去除了原数组中的null或undefined元素
    var takeOutNullOrUndefined = function(array) {
        var newArray = [];
        for(var i = 0, j = 0; i < array.length; i ++) {
            // 如果元素不是null或undefined，就移到新数组来
            if (array[i] !== null && array[i] !== undefined) {
                newArray[j] = array[i];
                j ++;
            }
        }
        return newArray;
    }

    var addEventListener = function(p) {
        /* 这段代码监听游戏玩家的键盘点击事件，并且代表将按键的关键数字
         * 送到 Player.handleInput()方法里面。
         */
        document.addEventListener('keyup', function(e) {
            var allowedKeys = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down'
            };
            player.handleInput(allowedKeys[e.keyCode]);
        });

        button.onclick = function(p) {
            restart(p);
        };
    };

    // Controller对象暴露的这些方法，按名字可理解其作用
    // 注意其中有一些需要传入player实例对象作为参数
    return {
        pavement: pavement,     // 二维数组对象

        restart: restart,
        initialSettings: initialSettings,   //保存游戏初始设置的对象

        handleCrossingRiver: handleCrossingRiver,
        handleCollisionWithEnemy: handleCollisionWithEnemy,
        obtainBlueGem: obtainBlueGem,
        obtainGreenGem: obtainGreenGem,
        obtainOrangeGem: obtainOrangeGem,
        obtainKey: obtainKey,
        obtainHeart: obtainHeart,
        obtainStar: obtainStar,

        takeOutNullOrUndefined: takeOutNullOrUndefined,

        addEventListener: addEventListener
    }
})();
