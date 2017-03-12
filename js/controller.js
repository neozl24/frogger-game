// 用来控制游戏进程的对象
var controller = (function() {
    //下面是用来计分统计的DOM元素
    var scoreTxt = document.getElementById('score'),
        msgTxt = document.getElementById('msg'),
        chancesTxt = document.getElementById('chances'),
        progressBar = document.getElementById('progress-bar');

    // 用来设定游戏开始时各元素的数量的对象
    var initialSettings = {
        "treasureNum": 2,
        "obstacleNum": 2,
        "enemyNum": 3,
        "enemyLevel": 1
    };

    // 这个用来标记进度条的倒计时效果
    var countdown;

    // 创建一个二维数组，用来标记格子是否被已有静态元素占据，如果是，则无法在此生成新的静态元素
    var isOccupied = (function() {
        var matrix = [];

        // 这个二维数组有一个方法，可以重置自己
        matrix.reset = function() {
            for (let i = 0; i < 4; i++) {
                matrix[i] = [];
                for (let j = 0; j < 5; j++) {
                    matrix[i][j] = false;
                }
            }
        };

        // 执行重置函数就能完成初始化
        matrix.reset();

        return matrix;
    })();

    var addEnemy = function(num, level) {
        for (var i = 0; i < num; i++) {
            allEnemies.push(new Enemy(level));
        }
    }

    var addObstacle = function(num) {
        for (var i = 0; i < num; i++) {
            allObstacles.push(new Obstacle());
        }
    }

    var addTreasure = function(num, ClassName) {
        for (var i = 0; i < num; i++) {
            allTreasure.push(new ClassName());
        }
    }

    // 按各种宝物的概率权重，随机生成若干个宝物
    var addRandomTreasure = function(num) {
        var treasureList = [
            { ClassName: BlueGem, weight: 20 },
            { ClassName: GreenGem, weight: 10 },
            { ClassName: OrangeGem, weight: 15 },
            { ClassName: Heart, weight: 10 },
            { ClassName: Key, weight: 10 },
            { ClassName: Star, weight: 5 },
        ];
        var totalWeight = 0;
        for (let i = 0; i < treasureList.length; i++) {
            totalWeight += treasureList[i].weight;
        }

        var randomNum, currentTotalWeight, targetClass;
        for (let i = 0; i < num; i++) {
            randomNum = Math.ceil( Math.random() * totalWeight);
            targetClass = treasureList[0].ClassName;
            currentTotalWeight = 0;
            for (let j = 0; j < treasureList.length - 1; j++) {
                currentTotalWeight += treasureList[j].weight;
                if (currentTotalWeight < randomNum) {
                    targetClass = treasureList[j+1].ClassName;
                }
            }
            addTreasure(1, targetClass);
        }
    }

    var removeRock = function(num) {
        var randomIndex = Math.floor(Math.random() * allObstacles.length);
        allObstacles[randomIndex] = null;
        allObstacles = takeOutNullOrUndefined(allObstacles);
    };

    var resetMsg = function() {
        msgTxt.innerText = "Move to the river above";
        msgTxt.style.color = "white";
    };

    var updateScore = function(p) {
        scoreTxt.innerText = "Score: " + p.score;
    };

    var updateChances = function(p) {
        chancesTxt.innerText = "";
        for(let i = 0; i < p.chances; i ++) {
            chancesTxt.innerText += "♥";
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

        initElements(  initialSettings["treasureNum"],
                            initialSettings["obstacleNum"],
                            initialSettings["enemyNum"],
                            initialSettings["enemyLevel"]   );
        Engine.reset();
    }

    // 初始化游戏元素
    var initElements = function(treasureNum, obstacleNum, enemyNum, level) {
        // 先将几个数组置空
        allEnemies = [];
        allObstacles = [];
        allTreasure = [];

        // 重置用来标记格子是否被占用的二维数组
        isOccupied.reset();

        addRandomTreasure(treasureNum);
        addObstacle(obstacleNum);
        addEnemy(enemyNum, level);
    };

    // 如果到了最上面的那条河，就记录成功一次，并重归原位
    // 到了最上面，会停留一下子，此时将canMove置为false
    var handleCrossingRiver = function(p) {

        p.canMove = false;

        p.score += 10;
        updateScore(p);

        var congratsWords = [   "Good Job!", "Nice Move!", ": P",
                                "Well Done!", "You Need Water!"  ];
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
        p.canMove = false;
        Engine.pauseGame(); //暂停游戏

        p.chances -= 1;
        updateChances(p);

        msgTxt.style.color = "#FF1133";

        //如果剩余机会大于0，则重置角色位置，减去一滴血，再继续游戏
        //如果剩余机会为0，则提示Game Over，重置所有元素和记分板，再重新开始游戏
        if (p.chances > 0) {
            msgTxt.innerText = "Oops! Collide with a bug!"
            setTimeout(function(){
                resetMsg();
                p.initLocation();
                Engine.continueGame();
            }, 1000);
        } else {
            msgTxt.innerText = "Game Over";
            setTimeout(function(){
                restart(p);
                Engine.continueGame();
            }, 1000);
        }
    };

    // 蓝宝石触发的效果，让时间变慢，持续一小段时间
    var obtainBlueGem = function(p) {
        Engine.setTimeSpeed(0.2);

        // 如果短时间内吃到两个蓝宝石，需要先将上一个产生的倒计时效果清楚
        clearInterval(countdown);

        msgTxt.innerText = "Time Slowing Down";

        // 有效时间
        var actionTime = 5000;
        // 渲染的时间间隔，会影响进度条动画的平顺
        var dt = 10;

        var totalWidth = progressBar.parentNode.offsetWidth;
        var width = totalWidth;
        var unitWidth = Math.ceil( totalWidth  * dt / actionTime);

        countdown = setInterval(function() {
            width -= unitWidth;
            progressBar.style.width = width + "px";
        }, dt);

        // 将游戏时间恢复正常
        setTimeout(function() {
            Engine.setTimeSpeed(1);
            clearInterval(countdown);
            resetMsg()
        }, actionTime);
    };

    // 碰到绿宝石可以减少一个敌人，如果当前只剩一个敌人，则效果改为得到大量分数
    var obtainGreenGem = function(p) {
        if (allEnemies.length <= 1) {
            p.score += 30;
            updateScore(p);
            msgTxt.innerText = "50 Scores Awarded!";
        } else {
            allEnemies = allEnemies.slice(0, allEnemies.length - 1);
            msgTxt.innerText = "One Bug Eliminated!";
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
        msgTxt.innerText = "Push Bugs Away!!"
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 得到桃心，恢复一点生命
    var obtainHeart = function(p) {
        if (p.chances < 5) {
            p.chances += 1;
            updateChances(p);
            msgTxt.innerText = "One More Life!";
        } else {
            p.score += 30;
            updateScore(p);
            msgTxt.innerText = "30 Extra Scores";
        }
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 钥匙可以消除一个石头，同时得到少量分数
    var obtainKey = function(p) {
        removeRock(1);
        p.score += 20;
        updateScore(p);
        msgTxt.innerText = "Remove a Rock";
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    // 星星可以得到大量分数
    var obtainStar = function(p) {
        p.score += 50;
        updateScore(p);
        msgTxt.innerText = "Lucky! 50 More Scores!";
        setTimeout(function() {
            resetMsg();
        }, 1000);
    };

    //这是一个功能函数，返回值去除了原数组中的null或undefined元素
    var takeOutNullOrUndefined = function(array) {
        var newArray = [];
        for(var i = 0, j = 0; i < array.length; i ++) {
            if (array[i] !== null && array[i] !== undefined) {
                newArray[j] = array[i];
                j ++;
            }
        }
        return newArray;
    }

    // controller对象暴露的这些方法，按名字可理解其作用
    // 注意其中有一些需要传入player实例对象作为参数
    return {
        isOccupied: isOccupied,     // 二维数组对象

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

        takeOutNullOrUndefined: takeOutNullOrUndefined
    }
})();
