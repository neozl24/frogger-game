// 用来控制游戏进程的对象
var controller = (function() {
    //下面是用来计分统计的DOM元素
    var scoreTxt = document.getElementById('score'),
        msgTxt = document.getElementById('msg'),
        chancesTxt = document.getElementById('chances');

    var addElements = function(num, ClassName, array, level) {
        for(let i = 0; i < num; i ++) {
            // level这个参数只对ClassName为Enemy时才有作用
            array.push(new ClassName(level));
        }
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

    return {
        addElements: addElements,
        resetMsg: resetMsg,
        updateScore: updateScore,
        updateChances: updateChances,
        handleCrossingRiver: handleCrossingRiver,
        handleCollisionWithEnemy: handleCollisionWithEnemy
    }
})();
