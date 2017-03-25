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

    return {
        takeOutNullOrUndefined: takeOutNullOrUndefined,
        StorageGetter: StorageGetter,
        StorageSetter: StorageSetter
    };
})(this);
