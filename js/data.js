/* Data.js
 *
 * 这个文件用来提供数据的存取接口，能够从本地和服务器分别返回有序数组
 * 在登陆Wilddog服务器之前，需要通过邮箱名以及密码进行认证登陆，
 * 这部分存在administrator.js文件里了，而它没有参与版本记录，也没有上传到github
 *
 */

/* jshint undef: false, unused: false */
var Data = (function(global) {
    'use strict';

    /* 要读写数据，必须先创建 Wilddog 引用 */
    var ref = new Wilddog('https://frogger.wilddogio.com/records');

    /* 登陆成功的回调函数 */
    // function authHandler(error, authData) {
    //     if (error) {
    //         console.log("Login Failed!", error);
    //     } else {
    //         console.log("Authenticated successfully with payload:");
    //         console.log(authData);
    //     }
    // }
    /* 认证登陆 */
    // ref.authWithPassword({
    //     email    : Administrator.email,
    //     password : Administrator.password
    // }, authHandler);
    // console.log(refroot.getAuth());


    /* 在这里就直接初始化remoteList，并利用Wilddog提供的回调函数，和服务器端同步更新 */
    var remoteList = [];
    var record = {};
    /* 每次有新数据添加，都会触发回调函数，参数是新增节点对象 */
    ref.on('child_added', function(snapshot) {
        var data = snapshot.val();
        record = {
            name: data.name,
            score: data.score,
            role: data.role,
            time: data.time
        };
        remoteList.push(record);
    });

    /* 以数组的形式返回按分数从高到低顺序的在线排行榜 */
    var getRemoteList = function() {
        return remoteList.sort(function(recordA, recordB) {
            return recordB.score - recordA.score;
        });
    };

    /* 更新在线排行榜，参数是record对象 */
    var updateRemoteList = function(record) {
        ref.push(record);
    };

    /* 返回本地排行榜，返回值是一个长度为10的分数从高到低的数组 */
    var getLocalList = function() {
        /* 如果本地还没有存，则新建一个空数组 */
        return (Util.StorageGetter('topList') || []);
    };

    /* 更新本地排行榜，参数是record对象 */
    var updateLocalList = function(record) {
        var localList = getLocalList();

        /* 先添加本次记录，再按照分数对榜单上对所有记录进行排序 */
        localList.push(record);
        localList.sort(function(recordA, recordB) {
            return recordB.score - recordA.score;
        });

        /* 本地排行榜如果多余10位，则去除后面的 */
        localList = localList.slice(0, 10);
        Util.StorageSetter('topList', localList);
    };

    /* 将本地排行榜更新到全球排行榜，从而将上次上传失败的数据提交上去，在游戏第一次启动后执行 */
    var uploadLocalList = function() {
        var localList = getLocalList();
        localList.forEach(function(record) {
            if (shouldUpload(record)) {
                // console.log("Going to add record：" + record.name);
                updateRemoteList(record);
            }
        });
    };

    /* 远程排行榜取回后按从高到低排序，看参数record是否应该添加到榜单上去
     * 如果榜单上已有该record，或者榜单的第100位分数高于这一个record，都不应该添加
     * 反之则需要添加
     */
    var shouldUpload = function(record) {
        var remoteList = getRemoteList();
        for (var i = 0; i < remoteList.length; i++) {
            if (remoteList[i].time === record.time) {
                // console.log('This record has existed: ' + record.name);
                return false;
            }
        }
        if (remoteList.length >= 100 && remoteList[99].score >= record.score) {
            return false;
        }

        return true;
    };

    return {
        getRemoteList: getRemoteList,
        updateRemoteList: updateRemoteList,

        getLocalList: getLocalList,
        updateLocalList: updateLocalList,

        uploadLocalList: uploadLocalList
    };
})(this);
