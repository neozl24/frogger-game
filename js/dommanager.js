/* DomManager.js
 *
 * 这个文件用来操作屏幕上的DOM元素，包括改变其显示，获得其属性，以及添加响应事件等等
 *
 */

/* jshint undef: false, unused: false */

DomManager = (function(global) {
    'use strict';

    /* 下面这些DOM元素用来反应游戏状态 */
    var doc = global.document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        lifeTxt = doc.getElementById('life'),
        progressBar = doc.getElementById('progress-bar'),
        topBar = doc.getElementById('top-bar'),
        menuButton = doc.getElementById('btn-menu'),
        menu = doc.getElementById('menu'),
        rankingButton = doc.getElementById('btn-ranking'),
        titleWorld = doc.getElementById('title-world'),
        titleLocal = doc.getElementById('title-local'),
        rankingBoard = doc.getElementById('ranking-board'),
        remoteList = doc.getElementById('remote-list'),
        localList = doc.getElementById('local-list'),
        closeBoardButton = doc.getElementById('btn-close'),
        roleListButton = doc.getElementById('btn-role'),
        selectionList = doc.getElementById('selection-list'),
        restartButton = doc.getElementById('btn-restart');

    /* 重置上方中央的信息栏，参数为空 */
    var resetMsg = function() {
        msgTxt.innerText = 'Move to the river above';
        msgTxt.style.color = '#fff';
    };

    /* 设置信息栏的文字，参数为需要显示的字符串 */
    var setMsg = function(msg) {
        msgTxt.innerText = msg;
    };

    /* 设置信息栏的颜色，参数为表示颜色的字符串 */
    var setMsgColor = function(color) {
        msgTxt.style.color = color;
    };

    /* 更新上方左边的得分栏 */
    var updateScore = function() {
        scoreTxt.innerText = 'Score: ' + player.score;
    };

    /* 更新上方右边的生命值栏 */
    var updateLives = function() {
        lifeTxt.innerText = '';
        for (var i = 0; i < player.lives; i++) {
            lifeTxt.innerText += '♥';
        }
    };

    /* 设置进度条的长度，参数为 0到1之间的数值，代表相对其最大长度的比例 */
    var setProgressBarLength = function(ratio) {
        /* ratio取值范围在 [0, 1] */
        ratio = Math.max(ratio, 0);
        ratio = Math.min(ratio, 1);
        progressBar.style.width = (topBar.offsetWidth * ratio) + 'px';
    };

    /* 添加菜单中的点击响应事件 */
    /* 定义一个变量，用来标记菜单栏是否隐藏 */
    var isMenuHidden = true;
    var showMenu = function() {
        menu.style.height = '183px';
        menu.style.borderBottom = '2px solid #251';
        isMenuHidden = false;
        /* 菜单栏出现时，游戏暂停 */
        Controller.pauseGame();
    };
    var hideMenu = function() {
        menu.style.height = 0;
        menu.style.borderBottom = 0;
        isMenuHidden = true;
        /* 菜单栏隐藏时，游戏继续 */
        Controller.continueGame();
    };

    /* 鼠标放在角色按钮上，会弹出二级菜单，供玩家自定义角色外观 */
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

    /* 添加各种事件响应，只需在游戏启动时执行一次，由Engine.init()调用 */
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

        menuButton.onclick = function(e) {
            /* 点击菜单按钮时，点击事件停止向上传递 */
            e.stopPropagation();
            if (isMenuHidden) {
                showMenu();
            } else {
                hideMenu();
            }
        };

        /* 除菜单按钮和下面的角色按钮外，点击屏幕中的其它区域都会让菜单栏隐藏 */
        doc.onclick = function() {
            hideMenu();
            hideSelectionList();
        };

        /* 生成一个li节点，根据参数的不同决定它是本地排行榜里的还是在线排行榜里的
         * 参数scope的取值是'remote-'或'local-'，用来标记 id
         */
        var makeLiNode = function(scope) {
            var li = doc.createElement('li');
            var rowClass = ranking % 2 === 0 ? 'odd-row' : 'even-row';
            li.className = 'record ' + rowClass;

            var pRanking = doc.createElement('p');
            pRanking.className = 'record-ranking record-txt';
            pRanking.id = scope + 'ranking-' + ranking;

            var div = doc.createElement('div');
            div.className = 'record-role';
            var img = doc.createElement('img');
            img.className = 'role-img';
            img.id = scope + 'img-' + ranking;
            div.appendChild(img);

            var pRecord = doc.createElement('p');
            pRecord.className = 'record-name record-txt';
            pRecord.id = scope + 'name-' + ranking;
            var pScore = doc.createElement('p');
            pScore.className = 'record-score record-txt';
            pScore.id = scope + 'score-' + ranking;

            li.appendChild(pRanking);
            li.appendChild(div);
            li.appendChild(pRecord);
            li.appendChild(pScore);

            return li;
        };

        /* 在显示排行榜之前，生成它的Dom结构 */
        var ranking, li;
        /* 生成在线排行榜 */
        for (ranking = 0; ranking < 100; ranking++) {
            li = makeLiNode('remote-');
            remoteList.appendChild(li);
        }
        /* 生成在线排行榜 */
        for (ranking = 0; ranking < 10; ranking++) {
            li = makeLiNode('local-');
            localList.appendChild(li);
        }

        /* 点击排行榜按钮时，弹出Top 10排行榜 */
        rankingButton.onclick = function(e) {
            /* 点击排行榜按钮时，点击事件停止向上传递，否则游戏会失去暂停效果 */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            rankingBoard.style.display = 'block';

            var remoteList = Data.getRemoteList();
            var localList = Data.getLocalList();
            var i, record, ranking, img, name, score;

            var remoteCount = Math.min(remoteList.length, 100);
            for (i = 0; i < remoteCount; i++) {
                record = remoteList[i];
                ranking = doc.getElementById('remote-ranking-' + i);
                img = doc.getElementById('remote-img-' + i);
                name = doc.getElementById('remote-name-' + i);
                score = doc.getElementById('remote-score-' + i);
                ranking.innerText = i + 1;
                img.src = record.role || 'images/char-boy.png';
                img.alt = img.src;
                name.innerText = record.name;
                score.innerText = record.score;
            }
            var localCount = Math.min(localList.length, 10);
            for (i = 0; i < localCount; i++) {
                record = localList[i];
                ranking = doc.getElementById('local-ranking-' + i);
                img = doc.getElementById('local-img-' + i);
                name = doc.getElementById('local-name-' + i);
                score = doc.getElementById('local-score-' + i);
                ranking.innerText = i + 1;
                img.src = record.role || 'images/char-boy.png';
                img.alt = img.src;
                name.innerText = record.name;
                score.innerText = record.score;
            }
        };

        /* 点击排行榜上方的按钮，可以切换面板 */
        titleWorld.onclick = function() {
            titleWorld.style.backgroundColor = '#4156a0';
            titleLocal.style.backgroundColor = 'transparent';
            remoteList.style.left = '0';
            localList.style.left = remoteList.offsetWidth + 'px';
        };

        titleLocal.onclick = function() {
            titleLocal.style.backgroundColor = '#4156a0';
            titleWorld.style.backgroundColor = 'transparent';
            remoteList.style.left = -remoteList.offsetWidth + 'px';
            localList.style.left = '0';
        };

        /* 点击排行榜面板里的OK按钮时，关闭榜单
         * 由于该点击事件会向上传递到document，因此会触发hideMenu()，从而继续游戏
         */
        closeBoardButton.onclick = function() {
            rankingBoard.style.display = 'none';
        };

        /* 点击角色按钮时，点击事件停止向上传递 */
        roleListButton.onclick = function(e) {
            e.stopPropagation();
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
            var roleImg = document.getElementById('role-' + i);
            roleImg.src = roleImages[i];
            /* 用立即执行的方式，解决异步调用中 i的值不对的问题 */
            (function(index) {
                roleImg.onclick = function() {
                    player.sprite = roleImages[index];
                    hideSelectionList();
                };
            })(i);
        }

        /* 点击重启按钮会重启游戏 */
        restartButton.onclick = function() {
            Controller.restartGame();
        };
    };

    return {
        resetMsg: resetMsg,
        setMsg: setMsg,
        setMsgColor: setMsgColor,
        updateScore: updateScore,
        updateLives: updateLives,

        setProgressBarLength: setProgressBarLength,

        hideMenu: hideMenu,

        addEventListener: addEventListener
    };

})(this);
