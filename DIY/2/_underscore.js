/**
 * DIY 一个underscore库2
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
