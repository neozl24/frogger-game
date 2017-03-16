/* Class.js
 *
 * 这个文件用来操作屏幕上的DOM元素，包括改变其显示，获得其属性，以及添加响应事件等等
 *
 */

/* jshint undef: false, unused: false, strict: false */

DomManager = (function(global) {

    /* 下面这些DOM元素用来反应游戏状态 */
    var doc = global.document,
        scoreTxt = doc.getElementById('score'),
        msgTxt = doc.getElementById('msg'),
        lifeTxt = doc.getElementById('life'),
        progressBar = doc.getElementById('progress-bar'),
        topBar = doc.getElementById('top-bar'),
        menuButton = doc.getElementById('btn-menu'),
        menu = doc.getElementById('menu'),
        recordButton = doc.getElementById('btn-record'),
        roleListButton = doc.getElementById('btn-role'),
        selectionList = doc.getElementById('selection-list'),
        restartButton = doc.getElementById('btn-restart');

    /* 重置上方中央的信息栏，参数为空 */
    var resetMsg = function() {
        msgTxt.innerText = 'Move to the river above';
        msgTxt.style.color = 'white';
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

        /* 点击记录按钮时，弹出Top 10排行榜 */
        recordButton.onclick = function() {
            console.log(Util.StorageGetter('topList'));
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
