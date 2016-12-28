/**
 * DIY 一个underscore库4
 */
(function() {
    //在浏览器上是window(self),服务器上是global
    var root = typeof self == 'object' && self.self === self && self ||
        typeof global == 'object' && global.global === global && global ||
        this;

    var previousUnderscore = root._;

    var _ = function(obj) {
        if (obj instanceof _) return obj;
        if (!(this instanceof _)) return new _(obj);
        this._wrapped = obj; //存放数据
    };

    if (typeof exports != 'undefined' && !exports.nodeType) {
        if (typeof module != 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }


    var ArrayProto = Array.prototype,
        ObjProto = Object.prototype;
    var push = ArrayProto.push,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys;
    //判断是不是对象/函数
    _.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };
    var optimizeCb = function(func, context, argCount) {
        //void 0 === undefined 返回ture
        if (context === void 0) return func;
        return function() {
            return func.apply(context, arguments);
        };
    };

    _.VERSION = '0.0.1';

    var property = function(key) {
        return function(obj) {
            return obj == null ? void 0 : obj[key];
        };
    };

    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = property('length');
    var isArrayLike = function(collection) {
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    var builtinIteratee;
    //如果是函数则返回上面说到的回调函数；
    //如果是对象则返回一个能判断对象是否相等的函数；
    //默认返回一个获取对象属性的函数
    var cb = function(value, context, argCount) {
        if (_.iteratee !== builtinIteratee) return _.iteratee(value, context);
        if (value == null) return _.identity; //默认的迭代器
        if (_.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    var restArgs = function(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0),
                rest = Array(length),
                index = 0;
            for (; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0:
                    return func.call(this, rest);
                case 1:
                    return func.call(this, arguments[0], rest);
                case 2:
                    return func.call(this, arguments[0], arguments[1], rest);
            }
            var args = Array(startIndex + 1);
            for (index = 0; index < startIndex; index++) {
                args[index] = arguments[index];
            }
            args[startIndex] = rest;
            return func.apply(this, args);
        };
    };
    _.restArgs = restArgs;

    _.iteratee = builtinIteratee = function(value, context) {
        return cb(value, context, Infinity);
    };

    _.each = _.forEach = function(obj, iteratee, context) {
        iteratee = optimizeCb(iteratee, context);
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteratee(obj[i], i, obj); //(element, index, list)
            }
        } else {
            var keys = _.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteratee(obj[keys[i]], keys[i], obj); //(value, key, list)
            }
        }
        return obj; //返回obj方便链式调用
    };
    _.map = _.collect = function(obj, iteratee, context) {
        iteratee = cb(iteratee, context);
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length,
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obj[currentKey], currentKey, obj);
        }
        return results;
    };

    _.filter = _.select = function(obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        _.each(obj, function(value, index, list) {
            if (predicate(value, index, list)) results.push(value);
        });
        return results;
    };




    _.keys = function(obj) {
        //不是对象/函数,返回空数组
        if (!_.isObject(obj)) return [];
        //使用ES5中的方法，返回属性（数组）
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        for (var key in obj)
            if (_.has(obj, key)) keys.push(key);
            //兼容IE< 9
            // if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };
    _.allKeys = function(obj) {
        if (!_.isObject(obj)) return [];
        var keys = [];
        for (var key in obj) keys.push(key);
        // Ahem, IE < 9.
        // if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    };
    _.has = function(obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    };


    /*链式*/
    _.chain = function(obj) {
        var instance = _(obj);
        instance._chain = true;
        return instance;
    };
    /*
    _.chain(arr)
        .each(function(ele) {
            console.log(ele);
        })
     */
    var chainResult = function(instance, obj) {
        return instance._chain ? _(obj).chain() : obj;
    };
    /**
     * 方法放入原型中
     */
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error', 'Symbol', 'Map', 'WeakMap', 'Set', 'WeakSet'], function(name) {
        _['is' + name] = function(obj) {
            return toString.call(obj) === '[object ' + name + ']';
        };
    });
    // IE 11 (#1621), Safari 8 (#1929), and PhantomJS (#2236).
    var nodelist = root.document && root.document.childNodes;
    if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    _.functions = _.methods = function(obj) {
        var names = [];
        for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();
    };
    _.mixin = function(obj) {
        _.each(_.functions(obj), function(name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function() {
                var args = [this._wrapped]; //_ 保存的数据obj
                push.apply(args, arguments);
                //原型方法中的数据和args合并到一个数组中
                return chainResult(this, func.apply(_, args));
                //将_.prototype[name]的this指向 _ (func.apply(_,args)已经
                //将func的this指向了 _ ,并且传了参数),返回带链式的obj，即是 _ 

            };
        });
        return _;
    };
    _.mixin(_);

    /**
     * 避免冲突
     */
    _.noConflict = function() {
        root._ = previousUnderscore;
        return this;
    };
    _.now = Date.now || function() {
        return new Date().getTime();
    };
    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };
    var createEscaper = function(map) {
        var escaper = function(match) { //match 匹配的子串
            return map[match];
        };
        var source = '(?:' + _.keys(map).join('|') + ')';
        var testRegexp = RegExp(source);
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };
    _.escape = createEscaper(escapeMap);
    _.invert = function(obj) {
        var result = {};
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };
    var unescapeMap = _.invert(escapeMap);
    _.unescape = createEscaper(unescapeMap);

    _.identity = function(value) {
        return value;
    };
    _.property = property;
    _.matcher = _.matches = function(attrs) {
        attrs = _.extendOwn({}, attrs);
        return function(obj) {
            return _.isMatch(obj, attrs);
        };
    };
    //两个对象是不是全等于
    _.isMatch = function(object, attrs) {
        var keys = _.keys(attrs),
            length = keys.length;
        if (object == null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;

    };
    var createAssigner = function(keysFunc, defaults) {
        return function(obj) {
            var length = arguments.length;
            if (defaults) obj = Object(obj);
            if (length < 2 || obj == null) return obj;
            for (var index = 1; index < length; index++) {
                var source = arguments[index],
                    keys = keysFunc(source),
                    l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    if (!defaults || obj[key] === void 0) obj[key] = source[key];
                }
            }
            return obj;
        };
    };
    _.extend = createAssigner(_.allKeys);
    _.extendOwn = _.assign = createAssigner(_.keys);
    _.delay = restArgs(function(func, wait, args) {
        return setTimeout(function() {
            return func.apply(null, args);
        }, wait);
    });
    _.throttle = function(func, wait, options) {
        var timeout, context, args, result;
        var previous = 0;
        if (!options) options = {};

        var later = function() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);

            if (!timeout) context = args = null;
        };

        var throttled = function() {
            var now = _.now();
            if (!previous && options.leading === false) previous = now; //禁止第一次执行(A) remaining = wait - 0 = wait > 0 的话不会执行A
            //不禁止第一次执行A的时候,previous = 0,现在时间now >= wait,就是过了wait等待时间 
            var remaining = wait - (now - previous); //remaining 第一次为< 0
            console.warn(wait, now, remaining);
            context = this;
            args = arguments;
            //按理来说remaining <= 0已经足够证明已经到达wait的时间间隔，但这里还考虑到假如客户端修改了系统时间则马上执行func函数（remaining > wait）
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                result = func.apply(context, args); //第一次执行A
                if (!timeout) context = args = null;
            } else if (!timeout && options.trailing !== false) { //不会禁用第二次执行(B)
                console.log("============第二次===============");
                timeout = setTimeout(later, remaining); //第二次执行(B)
            }
            return result;
        };

        throttled.cancel = function() {
            clearTimeout(timeout);
            previous = 0;
            timeout = context = args = null;
        };

        return throttled;
    };

    //immediate默认为false
    //只在最后一次关闭的时候，延迟后执行一次
    _.debounce = function(func, wait, immediate) {
        var timeout, result;

        var later = function(context, args) {
            timeout = null;
            if (args) result = func.apply(context, args);
        };
        var debounced = restArgs(function(args) {
            if (timeout) clearTimeout(timeout);
            //控制timeout，一直拖动的时候会清除timeout，这样中间就不会执行了
            if (immediate) {//immediate为true立刻执行
                var callNow = !timeout;
                timeout = setTimeout(later, wait);
                if (callNow) result = func.apply(this, args);
            } else {
                timeout = _.delay(later, wait, this, args);
            }

            return result;
        });

        debounced.cancel = function() {
            clearTimeout(timeout);
            timeout = null;
        };

        return debounced;
    };
    if (typeof define == 'function' && define.amd) {
        //定义一个模块并且起个名字
        define('_underscore', [], function() {
            return _;
        });
    } else if (typeof define == 'function' && define.cmd) { //seajs
        define(function(require, exports, module) {
            module.exports = _;
        });
    }

}());
