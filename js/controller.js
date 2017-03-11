// 用来控制游戏进程的对象
var controller = (function() {
    //下面是用来计分统计的DOM元素
    var scoreTxt = document.getElementById('score'),
        msgTxt = document.getElementById('msg'),
        chancesTxt = document.getElementById('chances'),
        progressBar = document.getElementById('progress-bar');

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
            { ClassName: OrangeGem, weight: 25 },
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
            this.addTreasure(1, targetClass);
        }
    }

    var removeRock = function(num) {
        var randomIndex = Math.floor(Math.random(allObstacles.length));
        allObstacles[randomIndex] = null;
        this.takeOutNullElements(allObstacles);
    };

    var resetMsg = function() {
        msgTxt.innerText = "Move to the river above";
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

    // 如果到了最上面的那条河，就记录成功一次，并重归原位
    // 到了最上面，会停留一下子，此时将canMove置为false
    var handleCrossingRiver = function(p) {

        p.canMove = false;

        p.score += 10;
        this.updateScore(p);
        msgTxt.innerText = "Good job!";

        setTimeout(function() {
            p.initLocation();
        }, 500);
        setTimeout(function() {
            controller.resetMsg(); //0.5秒后让角色归位，再过0.5秒还原文字区域
        }, 1000);
    }

    var handleCollisionWithEnemy = function(p) {
        p.canMove = false;
        Engine.pauseGame(); //暂停游戏

        p.increaseChancesBy(-1);

        var _this = this;
        //如果剩余机会大于0，则重置角色位置，减去一滴血，再继续游戏
        //如果剩余机会为0，则提示Game Over，重置所有元素和记分板，再重新开始游戏
        if (p.chances > 0) {
            msgTxt.innerText = "Oops! Collide with a bug!"
            setTimeout(function(){
                _this.resetMsg();
                p.initLocation();
                Engine.continueGame();
            }, 1000);
        } else {
            msgTxt.innerText = "Game Over";
            setTimeout(function(){
                p.initLocation();
                p.chances = 3;
                p.score = 0;
                Engine.restartGame();
            }, 1000);
        }
    };

    var slowTimeTemporarily = function() {
        Engine.setTimeSpeed(0.2);

        // 有效时间
        var actionTime = 5000;
        // 渲染的时间间隔，会影响进度条动画的平顺
        var dt = 20;

        var totalWidth = progressBar.parentNode.offsetWidth;
        var width = totalWidth;

        setInterval(function() {
            width -= totalWidth * (dt / actionTime);
            progressBar.style.width = width + "px";
        }, dt);

        setTimeout(function() {
            Engine.setTimeSpeed(1);
            clearInterval();
        }, actionTime);
    };

    var takeOutNullElements = function(array) {
        var newArray = [];
        for(var i = 0, j = 0; i < array.length; i ++) {
            if (array[i] !== null) {
                newArray[j] = array[i];
                j ++;
            }
        }
    }

    return {
        addEnemy: addEnemy,
        addObstacle: addObstacle,
        addTreasure: addTreasure,
        addRandomTreasure: addRandomTreasure,
        removeRock: removeRock,

        resetMsg: resetMsg,
        updateScore: updateScore,
        updateChances: updateChances,

        handleCrossingRiver: handleCrossingRiver,
        handleCollisionWithEnemy: handleCollisionWithEnemy,

        slowTimeTemporarily: slowTimeTemporarily,

        takeOutNullElements: takeOutNullElements
    }
})();
