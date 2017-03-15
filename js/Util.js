/* Util.js
 *
 * 这个文件用来提供工具函数，以及本地存储功能
 *
 */

/* jshint undef: false, unused: false, strict: false */

var Util = (function() {

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

    return {
        takeOutNullOrUndefined: takeOutNullOrUndefined
    };
})();
