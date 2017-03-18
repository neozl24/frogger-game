/* Data.js
 *
 * 这个文件用来提供数据的存取接口，能够从本地和服务器分别返回有序数组
 *
 *
 */

/* jshint undef: false, unused: false */
var Data = (function(global) {
    'use strict';

    /* 要读写数据，必须先创建 Wilddog 引用 */
    var ref = new Wilddog("https://frogger.wilddogio.com/records");

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

    return {
        getRemoteList: getRemoteList,
        updateRemoteList: updateRemoteList,
        getLocalList: getLocalList,
        updateLocalList: updateLocalList
    };
})(this);