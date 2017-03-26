/* Util.js
 *
 * 这个文件用来提供工具函数，为其它数据操作提供辅助功能
 *
 */

/* jshint undef: false, unused: false */

var Util = (function(global) {
    'use strict';
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

    var prefix = 'frogger_game_';
    /* localStorage是以字符串形式存储的，所以JSON对象要先转化才能存取，读取同理 */
    var StorageGetter = function(key) {
        var stringValue = global.localStorage.getItem(prefix + key);
        return JSON.parse(stringValue);
    };
    var StorageSetter = function(key, value) {
        var stringValue = JSON.stringify(value);
        global.localStorage.setItem(prefix + key, stringValue);
    };

    /* 将图片资源缓存到 localStorage */
    var storeImg = function(img, url) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        /* 保证canvas足够大 */
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        var storageFile = StorageGetter(url) || {};

        /* 下面这一行是以字符串形式获取图像信息的关键，需要在服务器上运行这行代码，
         * 而且要求html里面有meta标签，设置访问权限的跨域处理，否则canvas无法对
         * 其它域的 url执行 toDataURL函数
         */
        storageFile.img = canvas.toDataURL(url);
        storageFile.time = Date.now();
        console.log(url + ' 存储到本地');
        try {
            StorageSetter(url, storageFile);
        } catch (e) {
            console.log("Storage failed: " + e);
        }
    };

    /* 从localStorage中读取对应的图片资源 */
    var getImg = function(url) {
        var storageFile = StorageGetter(url);
        var now = Date.now();

        /* 设置一个过期时间，超过了这个时间则需从服务器重新获取 */
        var warrantyPeriod = 1000 * 60 * 60 * 24 * 30;
        if (storageFile === null || (now - storageFile.time) > warrantyPeriod) {
            console.log(url + ' 本地没有或者过期');
            return null;
        }
        console.log('成功获取本地文件: ' + url);
        return storageFile.img;
    };

    return {
        takeOutNullOrUndefined: takeOutNullOrUndefined,
        StorageGetter: StorageGetter,
        StorageSetter: StorageSetter,

        getImg: getImg,
        storeImg: storeImg

    };
})(this);
