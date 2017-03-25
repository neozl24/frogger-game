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
        closeRankingButton = doc.getElementById('btn-close-ranking'),

        instructionButton = doc.getElementById('btn-instruction'),
        instructionBoard = doc.getElementById('instruction-board'),
        closeInstructionButton = doc.getElementById('btn-close-instruction'),

        roleListButton = doc.getElementById('btn-role'),
        roleList = doc.getElementById('role-list'),
        languageListButton = doc.getElementById('btn-language'),
        languageList = doc.getElementById('language-list'),
        restartButton = doc.getElementById('btn-restart'),

        operationPanel = doc.getElementById('operation-panel'),
        arrowUp = doc.getElementById('arrow-up'),
        arrowDown = doc.getElementById('arrow-down'),
        arrowLeft = doc.getElementById('arrow-left'),
        arrowRight = doc.getElementById('arrow-right');

    /* 给游戏标题栏，以及菜单栏的按钮，按语言设定起好对应的名字 */
    var initDomText = function() {
        var gameTitleWords = ['Frogger', '扶小朋友过马路'];
        doc.getElementById('game-title').innerText = gameTitleWords[language];
        var rankingButtonWords = ['Ranking', '排行榜'];
        rankingButton.innerText = rankingButtonWords[language];
        var roleListButtonWords = ['Role', '角色'];
        roleListButton.innerText = roleListButtonWords[language];
        var languageButtonWords = ['Language', '语言'];
        languageListButton.innerText = languageButtonWords[language];
        var instructionButtonWords = ['Instruction', '游戏说明'];
        instructionButton.innerText = instructionButtonWords[language];
        var restartButtonWords = ['Restart', '重新开始'];
        restartButton.innerText = restartButtonWords[language];
        var titleWorldWords = ['World', '全球榜单'];
        titleWorld.innerText = titleWorldWords[language];
        var titleLocalWords = ['Local', '本地榜单'];
        titleLocal.innerText = titleLocalWords[language];
    };

    /* 重置上方中央的信息栏，参数为空 */
    var resetMsg = function() {
        var defaultWords = ['Move to the river above', '快到河边来！'];
        msgTxt.innerText = defaultWords[language];
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
        var scoreWords = ['Score: ', '分数: '];
        scoreTxt.innerText = scoreWords[language] + player.score;
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
        menu.style.height = '303px';
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
        roleList.style.width = '310px';
        isSelectionListHidden = false;
    };
    var hideSelectionList = function() {
        roleList.style.width = '0';
        isSelectionListHidden = false;
    };

    /* 鼠标放在语言按钮上，会弹出二级菜单，供玩家自定义角色外观 */
    /* 定义一个变量，用来标记语言选择栏是否隐藏 */
    var isLanguageSelectionListHidden = true;
    var showLanguageList = function() {
        languageList.style.width = '204px';
        isLanguageSelectionListHidden = false;
    };
    var hideLanguageList = function() {
        languageList.style.width = '0';
        isLanguageSelectionListHidden = false;
    };

    /* 判断登陆设备是否是PC */
    var isPC = function() {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"
        ];
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    };

    /* 添加各种事件响应，只需在游戏启动时执行一次，由Engine.init()调用 */
    var addEventListener = function() {

        /* 先执行给标题和按钮起名字的函数 */
        initDomText();

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
            hideLanguageList();
        };

        /* 以下一部分内容是关于排行榜面板的，首先动态控制排行榜的高度，让它充满屏幕 */
        rankingBoard.style.height = doc.documentElement.clientHeight + 'px';

        /* 生成一个li节点，根据参数的不同决定它是本地排行榜里的还是在线排行榜里的
         * 参数scope的取值是'remote-'或'local-'，用来标记 id
         */
        var makeLiNode = function(scope) {
            var li = doc.createElement('li');
            var rowClass = ranking % 2 === 0 ? 'odd-row' : 'even-row';
            li.className = 'record ' + rowClass;

            /* 本地排行榜的第一行因为要显示总排名信息，所以要大一点 */
            if (scope === 'local-' && ranking === 0) {
                li.className = 'first-record ' + rowClass;
                var pDetail = doc.createElement('p');
                pDetail.className = 'ranking-detail';
                pDetail.id = 'ranking-detail';
                li.appendChild(pDetail);
            }

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

        /* 点击排行榜按钮时，弹出排行榜 */
        rankingButton.onclick = function(e) {
            /* 点击排行榜按钮时，点击事件停止应当向上传递，否则游戏会失去暂停效果 */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            rankingBoard.style.display = 'block';

            /* 将之前没有上传但是应该上榜的本地记录上传 */
            Data.uploadLocalList();

            var remoteList = Data.getRemoteList();
            var localList = Data.getLocalList();

            /* 计算本地最佳成绩在排行榜上的排名 */
            var bestRanking = 0;
            var bestScore = localList[0].score || 0;
            bestRanking = Data.getRanking(bestScore, remoteList);
            console.log(bestScore, bestRanking);
            if (bestRanking !== 0) {
                var rankingDetail = doc.getElementById('ranking-detail');
                var percent = (remoteList.length - bestRanking) / remoteList.length;
                percent = Math.floor(10000 * percent) / 100;
                rankingDetail.innerText = '全球排名第' + bestRanking +
                    '，超过了' + percent + '%的玩家';
            }

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
        titleWorld.onclick = function(e) {
            e.stopPropagation();
            titleWorld.style.backgroundColor = '#4156a0';
            titleLocal.style.backgroundColor = 'transparent';
            remoteList.style.left = '0';
            localList.style.left = remoteList.offsetWidth + 'px';
        };

        titleLocal.onclick = function(e) {
            e.stopPropagation();
            titleLocal.style.backgroundColor = '#4156a0';
            titleWorld.style.backgroundColor = 'transparent';
            remoteList.style.left = -remoteList.offsetWidth + 'px';
            localList.style.left = '0';
        };

        /* 点击排行榜面板里的OK按钮时，关闭榜单
         * 由于该点击事件会向上传递到document，因此会触发hideMenu()，从而继续游戏
         */
        closeRankingButton.onclick = function() {
            rankingBoard.style.display = 'none';
        };

        /* 点击角色按钮时，点击事件停止向上传递 */
        roleListButton.onclick = function(e) {
            e.stopPropagation();
        };

        /* 点击语言按钮时，点击事件停止向上传递 */
        languageListButton.onclick = function(e) {
            e.stopPropagation();
        };

        /* 鼠标移到角色按钮上，或者移到由它弹出的二级菜单上，二级菜单都会处于显示状态 */
        roleListButton.onmouseover = function() {
            showSelectionList();
        };
        roleList.onmouseover = function() {
            showSelectionList();
        };
        /* 鼠标离开角色列表按钮，而且也离开了由它弹出的二级菜单，二级菜单就会处于隐藏状态 */
        roleListButton.onmouseout = function() {
            hideSelectionList();
        };
        roleList.onmouseout = function() {
            hideSelectionList();
        };

        /* 以下一部分内容是关于排行榜面板的，首先动态控制排行榜的高度，让它充满屏幕 */
        instructionBoard.style.height = doc.documentElement.clientHeight + 'px';

        /* 点击游戏说明按钮时，弹出排行榜 */
        instructionButton.onclick = function(e) {
            /* 点击该按钮时，点击事件应当停止向上传递，否则游戏会失去暂停效果 */
            e.stopPropagation();
            hideMenu();
            Controller.pauseGame();
            instructionBoard.style.display = 'block';
        };

        /* 点击游戏说明面板里的OK按钮时，关闭面板
         * 由于该点击事件会向上传递到document，因此会触发hideMenu()，从而继续游戏
         */
        closeInstructionButton.onclick = function() {
            instructionBoard.style.display = 'none';
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
            var roleImg = doc.getElementById('role-' + i);
            roleImg.src = roleImages[i];
            /* 用立即执行的方式，解决异步调用中 i的值不对的问题 */
            (function(index) {
                roleImg.onclick = function() {
                    player.sprite = roleImages[index];
                    hideSelectionList();
                };
            })(i);
        }

        /* 鼠标移到语言按钮上，或者移到由它弹出的二级菜单上，二级菜单都会处于显示状态 */
        languageListButton.onmouseover = function() {
            showLanguageList();
        };
        languageList.onmouseover = function() {
            showLanguageList();
        };
        /* 鼠标离开语言列表按钮，而且也离开了由它弹出的二级菜单，二级菜单就会处于隐藏状态 */
        languageListButton.onmouseout = function() {
            hideLanguageList();
        };
        languageList.onmouseout = function() {
            hideLanguageList();
        };

        var languageEnglishButton = doc.getElementById('language-0'),
            languageChineseButton = doc.getElementById('language-1');
        /* 点击语言切换按钮后，要同时刷新分数栏和信息栏 */
        languageEnglishButton.onclick = function() {
            language = 0;
            initDomText();
            resetMsg();
            updateScore();
            Util.StorageSetter('language', language);
        };
        languageChineseButton.onclick = function() {
            language = 1;
            initDomText();
            resetMsg();
            updateScore();
            Util.StorageSetter('language', language);
        };

        /* 点击重启按钮会重启游戏 */
        restartButton.onclick = function() {
            Controller.restartGame();
        };

        /* 根据登陆设备决定是否显示模拟操作面板 */
        if (isPC()) {
            operationPanel.style.display = 'none';
        } else {
            operationPanel.style.display = 'block';
            /* 再来绑定模拟操作面板上的事件 */
            arrowUp.ontouchstart = function() {
                player.handleInput('up');
            };
            arrowDown.ontouchstart = function() {
                player.handleInput('down');
            };
            arrowLeft.ontouchstart = function() {
                player.handleInput('left');
            };
            arrowRight.ontouchstart = function() {
                player.handleInput('right');
            };

            /* 以下两个事件监听阻止了移动设备上的双击放大效果 */
            doc.addEventListener('touchstart',function (event) {
                if(event.touches.length>1){
                    event.preventDefault();
                }
            });
            var lastTouchEnd=0;
            doc.addEventListener('touchend',function (event) {
                var now=(new Date()).getTime();
                if(now-lastTouchEnd<=500){
                    event.preventDefault();
                }
                lastTouchEnd=now;
            },false);
        }
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
