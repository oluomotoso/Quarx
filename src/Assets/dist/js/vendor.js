/*!
 * typeahead.js 0.11.1
 * https://github.com/twitter/typeahead.js
 * Copyright 2013-2015 Twitter, Inc. and other contributors; Licensed MIT
 */

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define("bloodhound", [ "jquery" ], function(a0) {
            return root["Bloodhound"] = factory(a0);
        });
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        root["Bloodhound"] = factory(jQuery);
    }
})(this, function($) {
    var _ = function() {
        "use strict";
        return {
            isMsie: function() {
                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
            },
            isBlankString: function(str) {
                return !str || /^\s*$/.test(str);
            },
            escapeRegExChars: function(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            isString: function(obj) {
                return typeof obj === "string";
            },
            isNumber: function(obj) {
                return typeof obj === "number";
            },
            isArray: $.isArray,
            isFunction: $.isFunction,
            isObject: $.isPlainObject,
            isUndefined: function(obj) {
                return typeof obj === "undefined";
            },
            isElement: function(obj) {
                return !!(obj && obj.nodeType === 1);
            },
            isJQuery: function(obj) {
                return obj instanceof $;
            },
            toStr: function toStr(s) {
                return _.isUndefined(s) || s === null ? "" : s + "";
            },
            bind: $.proxy,
            each: function(collection, cb) {
                $.each(collection, reverseArgs);
                function reverseArgs(index, value) {
                    return cb(value, index);
                }
            },
            map: $.map,
            filter: $.grep,
            every: function(obj, test) {
                var result = true;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (!(result = test.call(null, val, key, obj))) {
                        return false;
                    }
                });
                return !!result;
            },
            some: function(obj, test) {
                var result = false;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (result = test.call(null, val, key, obj)) {
                        return false;
                    }
                });
                return !!result;
            },
            mixin: $.extend,
            identity: function(x) {
                return x;
            },
            clone: function(obj) {
                return $.extend(true, {}, obj);
            },
            getIdGenerator: function() {
                var counter = 0;
                return function() {
                    return counter++;
                };
            },
            templatify: function templatify(obj) {
                return $.isFunction(obj) ? obj : template;
                function template() {
                    return String(obj);
                }
            },
            defer: function(fn) {
                setTimeout(fn, 0);
            },
            debounce: function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var context = this, args = arguments, later, callNow;
                    later = function() {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                        }
                    };
                    callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                    }
                    return result;
                };
            },
            throttle: function(func, wait) {
                var context, args, timeout, result, previous, later;
                previous = 0;
                later = function() {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };
                return function() {
                    var now = new Date(), remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            },
            stringify: function(val) {
                return _.isString(val) ? val : JSON.stringify(val);
            },
            noop: function() {}
        };
    }();
    var VERSION = "0.11.1";
    var tokenizers = function() {
        "use strict";
        return {
            nonword: nonword,
            whitespace: whitespace,
            obj: {
                nonword: getObjTokenizer(nonword),
                whitespace: getObjTokenizer(whitespace)
            }
        };
        function whitespace(str) {
            str = _.toStr(str);
            return str ? str.split(/\s+/) : [];
        }
        function nonword(str) {
            str = _.toStr(str);
            return str ? str.split(/\W+/) : [];
        }
        function getObjTokenizer(tokenizer) {
            return function setKey(keys) {
                keys = _.isArray(keys) ? keys : [].slice.call(arguments, 0);
                return function tokenize(o) {
                    var tokens = [];
                    _.each(keys, function(k) {
                        tokens = tokens.concat(tokenizer(_.toStr(o[k])));
                    });
                    return tokens;
                };
            };
        }
    }();
    var LruCache = function() {
        "use strict";
        function LruCache(maxSize) {
            this.maxSize = _.isNumber(maxSize) ? maxSize : 100;
            this.reset();
            if (this.maxSize <= 0) {
                this.set = this.get = $.noop;
            }
        }
        _.mixin(LruCache.prototype, {
            set: function set(key, val) {
                var tailItem = this.list.tail, node;
                if (this.size >= this.maxSize) {
                    this.list.remove(tailItem);
                    delete this.hash[tailItem.key];
                    this.size--;
                }
                if (node = this.hash[key]) {
                    node.val = val;
                    this.list.moveToFront(node);
                } else {
                    node = new Node(key, val);
                    this.list.add(node);
                    this.hash[key] = node;
                    this.size++;
                }
            },
            get: function get(key) {
                var node = this.hash[key];
                if (node) {
                    this.list.moveToFront(node);
                    return node.val;
                }
            },
            reset: function reset() {
                this.size = 0;
                this.hash = {};
                this.list = new List();
            }
        });
        function List() {
            this.head = this.tail = null;
        }
        _.mixin(List.prototype, {
            add: function add(node) {
                if (this.head) {
                    node.next = this.head;
                    this.head.prev = node;
                }
                this.head = node;
                this.tail = this.tail || node;
            },
            remove: function remove(node) {
                node.prev ? node.prev.next = node.next : this.head = node.next;
                node.next ? node.next.prev = node.prev : this.tail = node.prev;
            },
            moveToFront: function(node) {
                this.remove(node);
                this.add(node);
            }
        });
        function Node(key, val) {
            this.key = key;
            this.val = val;
            this.prev = this.next = null;
        }
        return LruCache;
    }();
    var PersistentStorage = function() {
        "use strict";
        var LOCAL_STORAGE;
        try {
            LOCAL_STORAGE = window.localStorage;
            LOCAL_STORAGE.setItem("~~~", "!");
            LOCAL_STORAGE.removeItem("~~~");
        } catch (err) {
            LOCAL_STORAGE = null;
        }
        function PersistentStorage(namespace, override) {
            this.prefix = [ "__", namespace, "__" ].join("");
            this.ttlKey = "__ttl__";
            this.keyMatcher = new RegExp("^" + _.escapeRegExChars(this.prefix));
            this.ls = override || LOCAL_STORAGE;
            !this.ls && this._noop();
        }
        _.mixin(PersistentStorage.prototype, {
            _prefix: function(key) {
                return this.prefix + key;
            },
            _ttlKey: function(key) {
                return this._prefix(key) + this.ttlKey;
            },
            _noop: function() {
                this.get = this.set = this.remove = this.clear = this.isExpired = _.noop;
            },
            _safeSet: function(key, val) {
                try {
                    this.ls.setItem(key, val);
                } catch (err) {
                    if (err.name === "QuotaExceededError") {
                        this.clear();
                        this._noop();
                    }
                }
            },
            get: function(key) {
                if (this.isExpired(key)) {
                    this.remove(key);
                }
                return decode(this.ls.getItem(this._prefix(key)));
            },
            set: function(key, val, ttl) {
                if (_.isNumber(ttl)) {
                    this._safeSet(this._ttlKey(key), encode(now() + ttl));
                } else {
                    this.ls.removeItem(this._ttlKey(key));
                }
                return this._safeSet(this._prefix(key), encode(val));
            },
            remove: function(key) {
                this.ls.removeItem(this._ttlKey(key));
                this.ls.removeItem(this._prefix(key));
                return this;
            },
            clear: function() {
                var i, keys = gatherMatchingKeys(this.keyMatcher);
                for (i = keys.length; i--; ) {
                    this.remove(keys[i]);
                }
                return this;
            },
            isExpired: function(key) {
                var ttl = decode(this.ls.getItem(this._ttlKey(key)));
                return _.isNumber(ttl) && now() > ttl ? true : false;
            }
        });
        return PersistentStorage;
        function now() {
            return new Date().getTime();
        }
        function encode(val) {
            return JSON.stringify(_.isUndefined(val) ? null : val);
        }
        function decode(val) {
            return $.parseJSON(val);
        }
        function gatherMatchingKeys(keyMatcher) {
            var i, key, keys = [], len = LOCAL_STORAGE.length;
            for (i = 0; i < len; i++) {
                if ((key = LOCAL_STORAGE.key(i)).match(keyMatcher)) {
                    keys.push(key.replace(keyMatcher, ""));
                }
            }
            return keys;
        }
    }();
    var Transport = function() {
        "use strict";
        var pendingRequestsCount = 0, pendingRequests = {}, maxPendingRequests = 6, sharedCache = new LruCache(10);
        function Transport(o) {
            o = o || {};
            this.cancelled = false;
            this.lastReq = null;
            this._send = o.transport;
            this._get = o.limiter ? o.limiter(this._get) : this._get;
            this._cache = o.cache === false ? new LruCache(0) : sharedCache;
        }
        Transport.setMaxPendingRequests = function setMaxPendingRequests(num) {
            maxPendingRequests = num;
        };
        Transport.resetCache = function resetCache() {
            sharedCache.reset();
        };
        _.mixin(Transport.prototype, {
            _fingerprint: function fingerprint(o) {
                o = o || {};
                return o.url + o.type + $.param(o.data || {});
            },
            _get: function(o, cb) {
                var that = this, fingerprint, jqXhr;
                fingerprint = this._fingerprint(o);
                if (this.cancelled || fingerprint !== this.lastReq) {
                    return;
                }
                if (jqXhr = pendingRequests[fingerprint]) {
                    jqXhr.done(done).fail(fail);
                } else if (pendingRequestsCount < maxPendingRequests) {
                    pendingRequestsCount++;
                    pendingRequests[fingerprint] = this._send(o).done(done).fail(fail).always(always);
                } else {
                    this.onDeckRequestArgs = [].slice.call(arguments, 0);
                }
                function done(resp) {
                    cb(null, resp);
                    that._cache.set(fingerprint, resp);
                }
                function fail() {
                    cb(true);
                }
                function always() {
                    pendingRequestsCount--;
                    delete pendingRequests[fingerprint];
                    if (that.onDeckRequestArgs) {
                        that._get.apply(that, that.onDeckRequestArgs);
                        that.onDeckRequestArgs = null;
                    }
                }
            },
            get: function(o, cb) {
                var resp, fingerprint;
                cb = cb || $.noop;
                o = _.isString(o) ? {
                    url: o
                } : o || {};
                fingerprint = this._fingerprint(o);
                this.cancelled = false;
                this.lastReq = fingerprint;
                if (resp = this._cache.get(fingerprint)) {
                    cb(null, resp);
                } else {
                    this._get(o, cb);
                }
            },
            cancel: function() {
                this.cancelled = true;
            }
        });
        return Transport;
    }();
    var SearchIndex = window.SearchIndex = function() {
        "use strict";
        var CHILDREN = "c", IDS = "i";
        function SearchIndex(o) {
            o = o || {};
            if (!o.datumTokenizer || !o.queryTokenizer) {
                $.error("datumTokenizer and queryTokenizer are both required");
            }
            this.identify = o.identify || _.stringify;
            this.datumTokenizer = o.datumTokenizer;
            this.queryTokenizer = o.queryTokenizer;
            this.reset();
        }
        _.mixin(SearchIndex.prototype, {
            bootstrap: function bootstrap(o) {
                this.datums = o.datums;
                this.trie = o.trie;
            },
            add: function(data) {
                var that = this;
                data = _.isArray(data) ? data : [ data ];
                _.each(data, function(datum) {
                    var id, tokens;
                    that.datums[id = that.identify(datum)] = datum;
                    tokens = normalizeTokens(that.datumTokenizer(datum));
                    _.each(tokens, function(token) {
                        var node, chars, ch;
                        node = that.trie;
                        chars = token.split("");
                        while (ch = chars.shift()) {
                            node = node[CHILDREN][ch] || (node[CHILDREN][ch] = newNode());
                            node[IDS].push(id);
                        }
                    });
                });
            },
            get: function get(ids) {
                var that = this;
                return _.map(ids, function(id) {
                    return that.datums[id];
                });
            },
            search: function search(query) {
                var that = this, tokens, matches;
                tokens = normalizeTokens(this.queryTokenizer(query));
                _.each(tokens, function(token) {
                    var node, chars, ch, ids;
                    if (matches && matches.length === 0) {
                        return false;
                    }
                    node = that.trie;
                    chars = token.split("");
                    while (node && (ch = chars.shift())) {
                        node = node[CHILDREN][ch];
                    }
                    if (node && chars.length === 0) {
                        ids = node[IDS].slice(0);
                        matches = matches ? getIntersection(matches, ids) : ids;
                    } else {
                        matches = [];
                        return false;
                    }
                });
                return matches ? _.map(unique(matches), function(id) {
                    return that.datums[id];
                }) : [];
            },
            all: function all() {
                var values = [];
                for (var key in this.datums) {
                    values.push(this.datums[key]);
                }
                return values;
            },
            reset: function reset() {
                this.datums = {};
                this.trie = newNode();
            },
            serialize: function serialize() {
                return {
                    datums: this.datums,
                    trie: this.trie
                };
            }
        });
        return SearchIndex;
        function normalizeTokens(tokens) {
            tokens = _.filter(tokens, function(token) {
                return !!token;
            });
            tokens = _.map(tokens, function(token) {
                return token.toLowerCase();
            });
            return tokens;
        }
        function newNode() {
            var node = {};
            node[IDS] = [];
            node[CHILDREN] = {};
            return node;
        }
        function unique(array) {
            var seen = {}, uniques = [];
            for (var i = 0, len = array.length; i < len; i++) {
                if (!seen[array[i]]) {
                    seen[array[i]] = true;
                    uniques.push(array[i]);
                }
            }
            return uniques;
        }
        function getIntersection(arrayA, arrayB) {
            var ai = 0, bi = 0, intersection = [];
            arrayA = arrayA.sort();
            arrayB = arrayB.sort();
            var lenArrayA = arrayA.length, lenArrayB = arrayB.length;
            while (ai < lenArrayA && bi < lenArrayB) {
                if (arrayA[ai] < arrayB[bi]) {
                    ai++;
                } else if (arrayA[ai] > arrayB[bi]) {
                    bi++;
                } else {
                    intersection.push(arrayA[ai]);
                    ai++;
                    bi++;
                }
            }
            return intersection;
        }
    }();
    var Prefetch = function() {
        "use strict";
        var keys;
        keys = {
            data: "data",
            protocol: "protocol",
            thumbprint: "thumbprint"
        };
        function Prefetch(o) {
            this.url = o.url;
            this.ttl = o.ttl;
            this.cache = o.cache;
            this.prepare = o.prepare;
            this.transform = o.transform;
            this.transport = o.transport;
            this.thumbprint = o.thumbprint;
            this.storage = new PersistentStorage(o.cacheKey);
        }
        _.mixin(Prefetch.prototype, {
            _settings: function settings() {
                return {
                    url: this.url,
                    type: "GET",
                    dataType: "json"
                };
            },
            store: function store(data) {
                if (!this.cache) {
                    return;
                }
                this.storage.set(keys.data, data, this.ttl);
                this.storage.set(keys.protocol, location.protocol, this.ttl);
                this.storage.set(keys.thumbprint, this.thumbprint, this.ttl);
            },
            fromCache: function fromCache() {
                var stored = {}, isExpired;
                if (!this.cache) {
                    return null;
                }
                stored.data = this.storage.get(keys.data);
                stored.protocol = this.storage.get(keys.protocol);
                stored.thumbprint = this.storage.get(keys.thumbprint);
                isExpired = stored.thumbprint !== this.thumbprint || stored.protocol !== location.protocol;
                return stored.data && !isExpired ? stored.data : null;
            },
            fromNetwork: function(cb) {
                var that = this, settings;
                if (!cb) {
                    return;
                }
                settings = this.prepare(this._settings());
                this.transport(settings).fail(onError).done(onResponse);
                function onError() {
                    cb(true);
                }
                function onResponse(resp) {
                    cb(null, that.transform(resp));
                }
            },
            clear: function clear() {
                this.storage.clear();
                return this;
            }
        });
        return Prefetch;
    }();
    var Remote = function() {
        "use strict";
        function Remote(o) {
            this.url = o.url;
            this.prepare = o.prepare;
            this.transform = o.transform;
            this.transport = new Transport({
                cache: o.cache,
                limiter: o.limiter,
                transport: o.transport
            });
        }
        _.mixin(Remote.prototype, {
            _settings: function settings() {
                return {
                    url: this.url,
                    type: "GET",
                    dataType: "json"
                };
            },
            get: function get(query, cb) {
                var that = this, settings;
                if (!cb) {
                    return;
                }
                query = query || "";
                settings = this.prepare(query, this._settings());
                return this.transport.get(settings, onResponse);
                function onResponse(err, resp) {
                    err ? cb([]) : cb(that.transform(resp));
                }
            },
            cancelLastRequest: function cancelLastRequest() {
                this.transport.cancel();
            }
        });
        return Remote;
    }();
    var oParser = function() {
        "use strict";
        return function parse(o) {
            var defaults, sorter;
            defaults = {
                initialize: true,
                identify: _.stringify,
                datumTokenizer: null,
                queryTokenizer: null,
                sufficient: 5,
                sorter: null,
                local: [],
                prefetch: null,
                remote: null
            };
            o = _.mixin(defaults, o || {});
            !o.datumTokenizer && $.error("datumTokenizer is required");
            !o.queryTokenizer && $.error("queryTokenizer is required");
            sorter = o.sorter;
            o.sorter = sorter ? function(x) {
                return x.sort(sorter);
            } : _.identity;
            o.local = _.isFunction(o.local) ? o.local() : o.local;
            o.prefetch = parsePrefetch(o.prefetch);
            o.remote = parseRemote(o.remote);
            return o;
        };
        function parsePrefetch(o) {
            var defaults;
            if (!o) {
                return null;
            }
            defaults = {
                url: null,
                ttl: 24 * 60 * 60 * 1e3,
                cache: true,
                cacheKey: null,
                thumbprint: "",
                prepare: _.identity,
                transform: _.identity,
                transport: null
            };
            o = _.isString(o) ? {
                url: o
            } : o;
            o = _.mixin(defaults, o);
            !o.url && $.error("prefetch requires url to be set");
            o.transform = o.filter || o.transform;
            o.cacheKey = o.cacheKey || o.url;
            o.thumbprint = VERSION + o.thumbprint;
            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
            return o;
        }
        function parseRemote(o) {
            var defaults;
            if (!o) {
                return;
            }
            defaults = {
                url: null,
                cache: true,
                prepare: null,
                replace: null,
                wildcard: null,
                limiter: null,
                rateLimitBy: "debounce",
                rateLimitWait: 300,
                transform: _.identity,
                transport: null
            };
            o = _.isString(o) ? {
                url: o
            } : o;
            o = _.mixin(defaults, o);
            !o.url && $.error("remote requires url to be set");
            o.transform = o.filter || o.transform;
            o.prepare = toRemotePrepare(o);
            o.limiter = toLimiter(o);
            o.transport = o.transport ? callbackToDeferred(o.transport) : $.ajax;
            delete o.replace;
            delete o.wildcard;
            delete o.rateLimitBy;
            delete o.rateLimitWait;
            return o;
        }
        function toRemotePrepare(o) {
            var prepare, replace, wildcard;
            prepare = o.prepare;
            replace = o.replace;
            wildcard = o.wildcard;
            if (prepare) {
                return prepare;
            }
            if (replace) {
                prepare = prepareByReplace;
            } else if (o.wildcard) {
                prepare = prepareByWildcard;
            } else {
                prepare = idenityPrepare;
            }
            return prepare;
            function prepareByReplace(query, settings) {
                settings.url = replace(settings.url, query);
                return settings;
            }
            function prepareByWildcard(query, settings) {
                settings.url = settings.url.replace(wildcard, encodeURIComponent(query));
                return settings;
            }
            function idenityPrepare(query, settings) {
                return settings;
            }
        }
        function toLimiter(o) {
            var limiter, method, wait;
            limiter = o.limiter;
            method = o.rateLimitBy;
            wait = o.rateLimitWait;
            if (!limiter) {
                limiter = /^throttle$/i.test(method) ? throttle(wait) : debounce(wait);
            }
            return limiter;
            function debounce(wait) {
                return function debounce(fn) {
                    return _.debounce(fn, wait);
                };
            }
            function throttle(wait) {
                return function throttle(fn) {
                    return _.throttle(fn, wait);
                };
            }
        }
        function callbackToDeferred(fn) {
            return function wrapper(o) {
                var deferred = $.Deferred();
                fn(o, onSuccess, onError);
                return deferred;
                function onSuccess(resp) {
                    _.defer(function() {
                        deferred.resolve(resp);
                    });
                }
                function onError(err) {
                    _.defer(function() {
                        deferred.reject(err);
                    });
                }
            };
        }
    }();
    var Bloodhound = function() {
        "use strict";
        var old;
        old = window && window.Bloodhound;
        function Bloodhound(o) {
            o = oParser(o);
            this.sorter = o.sorter;
            this.identify = o.identify;
            this.sufficient = o.sufficient;
            this.local = o.local;
            this.remote = o.remote ? new Remote(o.remote) : null;
            this.prefetch = o.prefetch ? new Prefetch(o.prefetch) : null;
            this.index = new SearchIndex({
                identify: this.identify,
                datumTokenizer: o.datumTokenizer,
                queryTokenizer: o.queryTokenizer
            });
            o.initialize !== false && this.initialize();
        }
        Bloodhound.noConflict = function noConflict() {
            window && (window.Bloodhound = old);
            return Bloodhound;
        };
        Bloodhound.tokenizers = tokenizers;
        _.mixin(Bloodhound.prototype, {
            __ttAdapter: function ttAdapter() {
                var that = this;
                return this.remote ? withAsync : withoutAsync;
                function withAsync(query, sync, async) {
                    return that.search(query, sync, async);
                }
                function withoutAsync(query, sync) {
                    return that.search(query, sync);
                }
            },
            _loadPrefetch: function loadPrefetch() {
                var that = this, deferred, serialized;
                deferred = $.Deferred();
                if (!this.prefetch) {
                    deferred.resolve();
                } else if (serialized = this.prefetch.fromCache()) {
                    this.index.bootstrap(serialized);
                    deferred.resolve();
                } else {
                    this.prefetch.fromNetwork(done);
                }
                return deferred.promise();
                function done(err, data) {
                    if (err) {
                        return deferred.reject();
                    }
                    that.add(data);
                    that.prefetch.store(that.index.serialize());
                    deferred.resolve();
                }
            },
            _initialize: function initialize() {
                var that = this, deferred;
                this.clear();
                (this.initPromise = this._loadPrefetch()).done(addLocalToIndex);
                return this.initPromise;
                function addLocalToIndex() {
                    that.add(that.local);
                }
            },
            initialize: function initialize(force) {
                return !this.initPromise || force ? this._initialize() : this.initPromise;
            },
            add: function add(data) {
                this.index.add(data);
                return this;
            },
            get: function get(ids) {
                ids = _.isArray(ids) ? ids : [].slice.call(arguments);
                return this.index.get(ids);
            },
            search: function search(query, sync, async) {
                var that = this, local;
                local = this.sorter(this.index.search(query));
                sync(this.remote ? local.slice() : local);
                if (this.remote && local.length < this.sufficient) {
                    this.remote.get(query, processRemote);
                } else if (this.remote) {
                    this.remote.cancelLastRequest();
                }
                return this;
                function processRemote(remote) {
                    var nonDuplicates = [];
                    _.each(remote, function(r) {
                        !_.some(local, function(l) {
                            return that.identify(r) === that.identify(l);
                        }) && nonDuplicates.push(r);
                    });
                    async && async(nonDuplicates);
                }
            },
            all: function all() {
                return this.index.all();
            },
            clear: function clear() {
                this.index.reset();
                return this;
            },
            clearPrefetchCache: function clearPrefetchCache() {
                this.prefetch && this.prefetch.clear();
                return this;
            },
            clearRemoteCache: function clearRemoteCache() {
                Transport.resetCache();
                return this;
            },
            ttAdapter: function ttAdapter() {
                return this.__ttAdapter();
            }
        });
        return Bloodhound;
    }();
    return Bloodhound;
});

(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define("typeahead.js", [ "jquery" ], function(a0) {
            return factory(a0);
        });
    } else if (typeof exports === "object") {
        module.exports = factory(require("jquery"));
    } else {
        factory(jQuery);
    }
})(this, function($) {
    var _ = function() {
        "use strict";
        return {
            isMsie: function() {
                return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
            },
            isBlankString: function(str) {
                return !str || /^\s*$/.test(str);
            },
            escapeRegExChars: function(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            },
            isString: function(obj) {
                return typeof obj === "string";
            },
            isNumber: function(obj) {
                return typeof obj === "number";
            },
            isArray: $.isArray,
            isFunction: $.isFunction,
            isObject: $.isPlainObject,
            isUndefined: function(obj) {
                return typeof obj === "undefined";
            },
            isElement: function(obj) {
                return !!(obj && obj.nodeType === 1);
            },
            isJQuery: function(obj) {
                return obj instanceof $;
            },
            toStr: function toStr(s) {
                return _.isUndefined(s) || s === null ? "" : s + "";
            },
            bind: $.proxy,
            each: function(collection, cb) {
                $.each(collection, reverseArgs);
                function reverseArgs(index, value) {
                    return cb(value, index);
                }
            },
            map: $.map,
            filter: $.grep,
            every: function(obj, test) {
                var result = true;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (!(result = test.call(null, val, key, obj))) {
                        return false;
                    }
                });
                return !!result;
            },
            some: function(obj, test) {
                var result = false;
                if (!obj) {
                    return result;
                }
                $.each(obj, function(key, val) {
                    if (result = test.call(null, val, key, obj)) {
                        return false;
                    }
                });
                return !!result;
            },
            mixin: $.extend,
            identity: function(x) {
                return x;
            },
            clone: function(obj) {
                return $.extend(true, {}, obj);
            },
            getIdGenerator: function() {
                var counter = 0;
                return function() {
                    return counter++;
                };
            },
            templatify: function templatify(obj) {
                return $.isFunction(obj) ? obj : template;
                function template() {
                    return String(obj);
                }
            },
            defer: function(fn) {
                setTimeout(fn, 0);
            },
            debounce: function(func, wait, immediate) {
                var timeout, result;
                return function() {
                    var context = this, args = arguments, later, callNow;
                    later = function() {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                        }
                    };
                    callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) {
                        result = func.apply(context, args);
                    }
                    return result;
                };
            },
            throttle: function(func, wait) {
                var context, args, timeout, result, previous, later;
                previous = 0;
                later = function() {
                    previous = new Date();
                    timeout = null;
                    result = func.apply(context, args);
                };
                return function() {
                    var now = new Date(), remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0) {
                        clearTimeout(timeout);
                        timeout = null;
                        previous = now;
                        result = func.apply(context, args);
                    } else if (!timeout) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };
            },
            stringify: function(val) {
                return _.isString(val) ? val : JSON.stringify(val);
            },
            noop: function() {}
        };
    }();
    var WWW = function() {
        "use strict";
        var defaultClassNames = {
            wrapper: "twitter-typeahead",
            input: "tt-input",
            hint: "tt-hint",
            menu: "tt-menu",
            dataset: "tt-dataset",
            suggestion: "tt-suggestion",
            selectable: "tt-selectable",
            empty: "tt-empty",
            open: "tt-open",
            cursor: "tt-cursor",
            highlight: "tt-highlight"
        };
        return build;
        function build(o) {
            var www, classes;
            classes = _.mixin({}, defaultClassNames, o);
            www = {
                css: buildCss(),
                classes: classes,
                html: buildHtml(classes),
                selectors: buildSelectors(classes)
            };
            return {
                css: www.css,
                html: www.html,
                classes: www.classes,
                selectors: www.selectors,
                mixin: function(o) {
                    _.mixin(o, www);
                }
            };
        }
        function buildHtml(c) {
            return {
                wrapper: '<span class="' + c.wrapper + '"></span>',
                menu: '<div class="' + c.menu + '"></div>'
            };
        }
        function buildSelectors(classes) {
            var selectors = {};
            _.each(classes, function(v, k) {
                selectors[k] = "." + v;
            });
            return selectors;
        }
        function buildCss() {
            var css = {
                wrapper: {
                    position: "relative",
                    display: "inline-block"
                },
                hint: {
                    position: "absolute",
                    top: "0",
                    left: "0",
                    borderColor: "transparent",
                    boxShadow: "none",
                    opacity: "1"
                },
                input: {
                    position: "relative",
                    verticalAlign: "top",
                    backgroundColor: "transparent"
                },
                inputWithNoHint: {
                    position: "relative",
                    verticalAlign: "top"
                },
                menu: {
                    position: "absolute",
                    top: "100%",
                    left: "0",
                    zIndex: "100",
                    display: "none"
                },
                ltr: {
                    left: "0",
                    right: "auto"
                },
                rtl: {
                    left: "auto",
                    right: " 0"
                }
            };
            if (_.isMsie()) {
                _.mixin(css.input, {
                    backgroundImage: "url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)"
                });
            }
            return css;
        }
    }();
    var EventBus = function() {
        "use strict";
        var namespace, deprecationMap;
        namespace = "typeahead:";
        deprecationMap = {
            render: "rendered",
            cursorchange: "cursorchanged",
            select: "selected",
            autocomplete: "autocompleted"
        };
        function EventBus(o) {
            if (!o || !o.el) {
                $.error("EventBus initialized without el");
            }
            this.$el = $(o.el);
        }
        _.mixin(EventBus.prototype, {
            _trigger: function(type, args) {
                var $e;
                $e = $.Event(namespace + type);
                (args = args || []).unshift($e);
                this.$el.trigger.apply(this.$el, args);
                return $e;
            },
            before: function(type) {
                var args, $e;
                args = [].slice.call(arguments, 1);
                $e = this._trigger("before" + type, args);
                return $e.isDefaultPrevented();
            },
            trigger: function(type) {
                var deprecatedType;
                this._trigger(type, [].slice.call(arguments, 1));
                if (deprecatedType = deprecationMap[type]) {
                    this._trigger(deprecatedType, [].slice.call(arguments, 1));
                }
            }
        });
        return EventBus;
    }();
    var EventEmitter = function() {
        "use strict";
        var splitter = /\s+/, nextTick = getNextTick();
        return {
            onSync: onSync,
            onAsync: onAsync,
            off: off,
            trigger: trigger
        };
        function on(method, types, cb, context) {
            var type;
            if (!cb) {
                return this;
            }
            types = types.split(splitter);
            cb = context ? bindContext(cb, context) : cb;
            this._callbacks = this._callbacks || {};
            while (type = types.shift()) {
                this._callbacks[type] = this._callbacks[type] || {
                    sync: [],
                    async: []
                };
                this._callbacks[type][method].push(cb);
            }
            return this;
        }
        function onAsync(types, cb, context) {
            return on.call(this, "async", types, cb, context);
        }
        function onSync(types, cb, context) {
            return on.call(this, "sync", types, cb, context);
        }
        function off(types) {
            var type;
            if (!this._callbacks) {
                return this;
            }
            types = types.split(splitter);
            while (type = types.shift()) {
                delete this._callbacks[type];
            }
            return this;
        }
        function trigger(types) {
            var type, callbacks, args, syncFlush, asyncFlush;
            if (!this._callbacks) {
                return this;
            }
            types = types.split(splitter);
            args = [].slice.call(arguments, 1);
            while ((type = types.shift()) && (callbacks = this._callbacks[type])) {
                syncFlush = getFlush(callbacks.sync, this, [ type ].concat(args));
                asyncFlush = getFlush(callbacks.async, this, [ type ].concat(args));
                syncFlush() && nextTick(asyncFlush);
            }
            return this;
        }
        function getFlush(callbacks, context, args) {
            return flush;
            function flush() {
                var cancelled;
                for (var i = 0, len = callbacks.length; !cancelled && i < len; i += 1) {
                    cancelled = callbacks[i].apply(context, args) === false;
                }
                return !cancelled;
            }
        }
        function getNextTick() {
            var nextTickFn;
            if (window.setImmediate) {
                nextTickFn = function nextTickSetImmediate(fn) {
                    setImmediate(function() {
                        fn();
                    });
                };
            } else {
                nextTickFn = function nextTickSetTimeout(fn) {
                    setTimeout(function() {
                        fn();
                    }, 0);
                };
            }
            return nextTickFn;
        }
        function bindContext(fn, context) {
            return fn.bind ? fn.bind(context) : function() {
                fn.apply(context, [].slice.call(arguments, 0));
            };
        }
    }();
    var highlight = function(doc) {
        "use strict";
        var defaults = {
            node: null,
            pattern: null,
            tagName: "strong",
            className: null,
            wordsOnly: false,
            caseSensitive: false
        };
        return function hightlight(o) {
            var regex;
            o = _.mixin({}, defaults, o);
            if (!o.node || !o.pattern) {
                return;
            }
            o.pattern = _.isArray(o.pattern) ? o.pattern : [ o.pattern ];
            regex = getRegex(o.pattern, o.caseSensitive, o.wordsOnly);
            traverse(o.node, hightlightTextNode);
            function hightlightTextNode(textNode) {
                var match, patternNode, wrapperNode;
                if (match = regex.exec(textNode.data)) {
                    wrapperNode = doc.createElement(o.tagName);
                    o.className && (wrapperNode.className = o.className);
                    patternNode = textNode.splitText(match.index);
                    patternNode.splitText(match[0].length);
                    wrapperNode.appendChild(patternNode.cloneNode(true));
                    textNode.parentNode.replaceChild(wrapperNode, patternNode);
                }
                return !!match;
            }
            function traverse(el, hightlightTextNode) {
                var childNode, TEXT_NODE_TYPE = 3;
                for (var i = 0; i < el.childNodes.length; i++) {
                    childNode = el.childNodes[i];
                    if (childNode.nodeType === TEXT_NODE_TYPE) {
                        i += hightlightTextNode(childNode) ? 1 : 0;
                    } else {
                        traverse(childNode, hightlightTextNode);
                    }
                }
            }
        };
        function getRegex(patterns, caseSensitive, wordsOnly) {
            var escapedPatterns = [], regexStr;
            for (var i = 0, len = patterns.length; i < len; i++) {
                escapedPatterns.push(_.escapeRegExChars(patterns[i]));
            }
            regexStr = wordsOnly ? "\\b(" + escapedPatterns.join("|") + ")\\b" : "(" + escapedPatterns.join("|") + ")";
            return caseSensitive ? new RegExp(regexStr) : new RegExp(regexStr, "i");
        }
    }(window.document);
    var Input = function() {
        "use strict";
        var specialKeyCodeMap;
        specialKeyCodeMap = {
            9: "tab",
            27: "esc",
            37: "left",
            39: "right",
            13: "enter",
            38: "up",
            40: "down"
        };
        function Input(o, www) {
            o = o || {};
            if (!o.input) {
                $.error("input is missing");
            }
            www.mixin(this);
            this.$hint = $(o.hint);
            this.$input = $(o.input);
            this.query = this.$input.val();
            this.queryWhenFocused = this.hasFocus() ? this.query : null;
            this.$overflowHelper = buildOverflowHelper(this.$input);
            this._checkLanguageDirection();
            if (this.$hint.length === 0) {
                this.setHint = this.getHint = this.clearHint = this.clearHintIfInvalid = _.noop;
            }
        }
        Input.normalizeQuery = function(str) {
            return _.toStr(str).replace(/^\s*/g, "").replace(/\s{2,}/g, " ");
        };
        _.mixin(Input.prototype, EventEmitter, {
            _onBlur: function onBlur() {
                this.resetInputValue();
                this.trigger("blurred");
            },
            _onFocus: function onFocus() {
                this.queryWhenFocused = this.query;
                this.trigger("focused");
            },
            _onKeydown: function onKeydown($e) {
                var keyName = specialKeyCodeMap[$e.which || $e.keyCode];
                this._managePreventDefault(keyName, $e);
                if (keyName && this._shouldTrigger(keyName, $e)) {
                    this.trigger(keyName + "Keyed", $e);
                }
            },
            _onInput: function onInput() {
                this._setQuery(this.getInputValue());
                this.clearHintIfInvalid();
                this._checkLanguageDirection();
            },
            _managePreventDefault: function managePreventDefault(keyName, $e) {
                var preventDefault;
                switch (keyName) {
                  case "up":
                  case "down":
                    preventDefault = !withModifier($e);
                    break;

                  default:
                    preventDefault = false;
                }
                preventDefault && $e.preventDefault();
            },
            _shouldTrigger: function shouldTrigger(keyName, $e) {
                var trigger;
                switch (keyName) {
                  case "tab":
                    trigger = !withModifier($e);
                    break;

                  default:
                    trigger = true;
                }
                return trigger;
            },
            _checkLanguageDirection: function checkLanguageDirection() {
                var dir = (this.$input.css("direction") || "ltr").toLowerCase();
                if (this.dir !== dir) {
                    this.dir = dir;
                    this.$hint.attr("dir", dir);
                    this.trigger("langDirChanged", dir);
                }
            },
            _setQuery: function setQuery(val, silent) {
                var areEquivalent, hasDifferentWhitespace;
                areEquivalent = areQueriesEquivalent(val, this.query);
                hasDifferentWhitespace = areEquivalent ? this.query.length !== val.length : false;
                this.query = val;
                if (!silent && !areEquivalent) {
                    this.trigger("queryChanged", this.query);
                } else if (!silent && hasDifferentWhitespace) {
                    this.trigger("whitespaceChanged", this.query);
                }
            },
            bind: function() {
                var that = this, onBlur, onFocus, onKeydown, onInput;
                onBlur = _.bind(this._onBlur, this);
                onFocus = _.bind(this._onFocus, this);
                onKeydown = _.bind(this._onKeydown, this);
                onInput = _.bind(this._onInput, this);
                this.$input.on("blur.tt", onBlur).on("focus.tt", onFocus).on("keydown.tt", onKeydown);
                if (!_.isMsie() || _.isMsie() > 9) {
                    this.$input.on("input.tt", onInput);
                } else {
                    this.$input.on("keydown.tt keypress.tt cut.tt paste.tt", function($e) {
                        if (specialKeyCodeMap[$e.which || $e.keyCode]) {
                            return;
                        }
                        _.defer(_.bind(that._onInput, that, $e));
                    });
                }
                return this;
            },
            focus: function focus() {
                this.$input.focus();
            },
            blur: function blur() {
                this.$input.blur();
            },
            getLangDir: function getLangDir() {
                return this.dir;
            },
            getQuery: function getQuery() {
                return this.query || "";
            },
            setQuery: function setQuery(val, silent) {
                this.setInputValue(val);
                this._setQuery(val, silent);
            },
            hasQueryChangedSinceLastFocus: function hasQueryChangedSinceLastFocus() {
                return this.query !== this.queryWhenFocused;
            },
            getInputValue: function getInputValue() {
                return this.$input.val();
            },
            setInputValue: function setInputValue(value) {
                this.$input.val(value);
                this.clearHintIfInvalid();
                this._checkLanguageDirection();
            },
            resetInputValue: function resetInputValue() {
                this.setInputValue(this.query);
            },
            getHint: function getHint() {
                return this.$hint.val();
            },
            setHint: function setHint(value) {
                this.$hint.val(value);
            },
            clearHint: function clearHint() {
                this.setHint("");
            },
            clearHintIfInvalid: function clearHintIfInvalid() {
                var val, hint, valIsPrefixOfHint, isValid;
                val = this.getInputValue();
                hint = this.getHint();
                valIsPrefixOfHint = val !== hint && hint.indexOf(val) === 0;
                isValid = val !== "" && valIsPrefixOfHint && !this.hasOverflow();
                !isValid && this.clearHint();
            },
            hasFocus: function hasFocus() {
                return this.$input.is(":focus");
            },
            hasOverflow: function hasOverflow() {
                var constraint = this.$input.width() - 2;
                this.$overflowHelper.text(this.getInputValue());
                return this.$overflowHelper.width() >= constraint;
            },
            isCursorAtEnd: function() {
                var valueLength, selectionStart, range;
                valueLength = this.$input.val().length;
                selectionStart = this.$input[0].selectionStart;
                if (_.isNumber(selectionStart)) {
                    return selectionStart === valueLength;
                } else if (document.selection) {
                    range = document.selection.createRange();
                    range.moveStart("character", -valueLength);
                    return valueLength === range.text.length;
                }
                return true;
            },
            destroy: function destroy() {
                this.$hint.off(".tt");
                this.$input.off(".tt");
                this.$overflowHelper.remove();
                this.$hint = this.$input = this.$overflowHelper = $("<div>");
            }
        });
        return Input;
        function buildOverflowHelper($input) {
            return $('<pre aria-hidden="true"></pre>').css({
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "pre",
                fontFamily: $input.css("font-family"),
                fontSize: $input.css("font-size"),
                fontStyle: $input.css("font-style"),
                fontVariant: $input.css("font-variant"),
                fontWeight: $input.css("font-weight"),
                wordSpacing: $input.css("word-spacing"),
                letterSpacing: $input.css("letter-spacing"),
                textIndent: $input.css("text-indent"),
                textRendering: $input.css("text-rendering"),
                textTransform: $input.css("text-transform")
            }).insertAfter($input);
        }
        function areQueriesEquivalent(a, b) {
            return Input.normalizeQuery(a) === Input.normalizeQuery(b);
        }
        function withModifier($e) {
            return $e.altKey || $e.ctrlKey || $e.metaKey || $e.shiftKey;
        }
    }();
    var Dataset = function() {
        "use strict";
        var keys, nameGenerator;
        keys = {
            val: "tt-selectable-display",
            obj: "tt-selectable-object"
        };
        nameGenerator = _.getIdGenerator();
        function Dataset(o, www) {
            o = o || {};
            o.templates = o.templates || {};
            o.templates.notFound = o.templates.notFound || o.templates.empty;
            if (!o.source) {
                $.error("missing source");
            }
            if (!o.node) {
                $.error("missing node");
            }
            if (o.name && !isValidName(o.name)) {
                $.error("invalid dataset name: " + o.name);
            }
            www.mixin(this);
            this.highlight = !!o.highlight;
            this.name = o.name || nameGenerator();
            this.limit = o.limit || 5;
            this.displayFn = getDisplayFn(o.display || o.displayKey);
            this.templates = getTemplates(o.templates, this.displayFn);
            this.source = o.source.__ttAdapter ? o.source.__ttAdapter() : o.source;
            this.async = _.isUndefined(o.async) ? this.source.length > 2 : !!o.async;
            this._resetLastSuggestion();
            this.$el = $(o.node).addClass(this.classes.dataset).addClass(this.classes.dataset + "-" + this.name);
        }
        Dataset.extractData = function extractData(el) {
            var $el = $(el);
            if ($el.data(keys.obj)) {
                return {
                    val: $el.data(keys.val) || "",
                    obj: $el.data(keys.obj) || null
                };
            }
            return null;
        };
        _.mixin(Dataset.prototype, EventEmitter, {
            _overwrite: function overwrite(query, suggestions) {
                suggestions = suggestions || [];
                if (suggestions.length) {
                    this._renderSuggestions(query, suggestions);
                } else if (this.async && this.templates.pending) {
                    this._renderPending(query);
                } else if (!this.async && this.templates.notFound) {
                    this._renderNotFound(query);
                } else {
                    this._empty();
                }
                this.trigger("rendered", this.name, suggestions, false);
            },
            _append: function append(query, suggestions) {
                suggestions = suggestions || [];
                if (suggestions.length && this.$lastSuggestion.length) {
                    this._appendSuggestions(query, suggestions);
                } else if (suggestions.length) {
                    this._renderSuggestions(query, suggestions);
                } else if (!this.$lastSuggestion.length && this.templates.notFound) {
                    this._renderNotFound(query);
                }
                this.trigger("rendered", this.name, suggestions, true);
            },
            _renderSuggestions: function renderSuggestions(query, suggestions) {
                var $fragment;
                $fragment = this._getSuggestionsFragment(query, suggestions);
                this.$lastSuggestion = $fragment.children().last();
                this.$el.html($fragment).prepend(this._getHeader(query, suggestions)).append(this._getFooter(query, suggestions));
            },
            _appendSuggestions: function appendSuggestions(query, suggestions) {
                var $fragment, $lastSuggestion;
                $fragment = this._getSuggestionsFragment(query, suggestions);
                $lastSuggestion = $fragment.children().last();
                this.$lastSuggestion.after($fragment);
                this.$lastSuggestion = $lastSuggestion;
            },
            _renderPending: function renderPending(query) {
                var template = this.templates.pending;
                this._resetLastSuggestion();
                template && this.$el.html(template({
                    query: query,
                    dataset: this.name
                }));
            },
            _renderNotFound: function renderNotFound(query) {
                var template = this.templates.notFound;
                this._resetLastSuggestion();
                template && this.$el.html(template({
                    query: query,
                    dataset: this.name
                }));
            },
            _empty: function empty() {
                this.$el.empty();
                this._resetLastSuggestion();
            },
            _getSuggestionsFragment: function getSuggestionsFragment(query, suggestions) {
                var that = this, fragment;
                fragment = document.createDocumentFragment();
                _.each(suggestions, function getSuggestionNode(suggestion) {
                    var $el, context;
                    context = that._injectQuery(query, suggestion);
                    $el = $(that.templates.suggestion(context)).data(keys.obj, suggestion).data(keys.val, that.displayFn(suggestion)).addClass(that.classes.suggestion + " " + that.classes.selectable);
                    fragment.appendChild($el[0]);
                });
                this.highlight && highlight({
                    className: this.classes.highlight,
                    node: fragment,
                    pattern: query
                });
                return $(fragment);
            },
            _getFooter: function getFooter(query, suggestions) {
                return this.templates.footer ? this.templates.footer({
                    query: query,
                    suggestions: suggestions,
                    dataset: this.name
                }) : null;
            },
            _getHeader: function getHeader(query, suggestions) {
                return this.templates.header ? this.templates.header({
                    query: query,
                    suggestions: suggestions,
                    dataset: this.name
                }) : null;
            },
            _resetLastSuggestion: function resetLastSuggestion() {
                this.$lastSuggestion = $();
            },
            _injectQuery: function injectQuery(query, obj) {
                return _.isObject(obj) ? _.mixin({
                    _query: query
                }, obj) : obj;
            },
            update: function update(query) {
                var that = this, canceled = false, syncCalled = false, rendered = 0;
                this.cancel();
                this.cancel = function cancel() {
                    canceled = true;
                    that.cancel = $.noop;
                    that.async && that.trigger("asyncCanceled", query);
                };
                this.source(query, sync, async);
                !syncCalled && sync([]);
                function sync(suggestions) {
                    if (syncCalled) {
                        return;
                    }
                    syncCalled = true;
                    suggestions = (suggestions || []).slice(0, that.limit);
                    rendered = suggestions.length;
                    that._overwrite(query, suggestions);
                    if (rendered < that.limit && that.async) {
                        that.trigger("asyncRequested", query);
                    }
                }
                function async(suggestions) {
                    suggestions = suggestions || [];
                    if (!canceled && rendered < that.limit) {
                        that.cancel = $.noop;
                        rendered += suggestions.length;
                        that._append(query, suggestions.slice(0, that.limit - rendered));
                        that.async && that.trigger("asyncReceived", query);
                    }
                }
            },
            cancel: $.noop,
            clear: function clear() {
                this._empty();
                this.cancel();
                this.trigger("cleared");
            },
            isEmpty: function isEmpty() {
                return this.$el.is(":empty");
            },
            destroy: function destroy() {
                this.$el = $("<div>");
            }
        });
        return Dataset;
        function getDisplayFn(display) {
            display = display || _.stringify;
            return _.isFunction(display) ? display : displayFn;
            function displayFn(obj) {
                return obj[display];
            }
        }
        function getTemplates(templates, displayFn) {
            return {
                notFound: templates.notFound && _.templatify(templates.notFound),
                pending: templates.pending && _.templatify(templates.pending),
                header: templates.header && _.templatify(templates.header),
                footer: templates.footer && _.templatify(templates.footer),
                suggestion: templates.suggestion || suggestionTemplate
            };
            function suggestionTemplate(context) {
                return $("<div>").text(displayFn(context));
            }
        }
        function isValidName(str) {
            return /^[_a-zA-Z0-9-]+$/.test(str);
        }
    }();
    var Menu = function() {
        "use strict";
        function Menu(o, www) {
            var that = this;
            o = o || {};
            if (!o.node) {
                $.error("node is required");
            }
            www.mixin(this);
            this.$node = $(o.node);
            this.query = null;
            this.datasets = _.map(o.datasets, initializeDataset);
            function initializeDataset(oDataset) {
                var node = that.$node.find(oDataset.node).first();
                oDataset.node = node.length ? node : $("<div>").appendTo(that.$node);
                return new Dataset(oDataset, www);
            }
        }
        _.mixin(Menu.prototype, EventEmitter, {
            _onSelectableClick: function onSelectableClick($e) {
                this.trigger("selectableClicked", $($e.currentTarget));
            },
            _onRendered: function onRendered(type, dataset, suggestions, async) {
                this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
                this.trigger("datasetRendered", dataset, suggestions, async);
            },
            _onCleared: function onCleared() {
                this.$node.toggleClass(this.classes.empty, this._allDatasetsEmpty());
                this.trigger("datasetCleared");
            },
            _propagate: function propagate() {
                this.trigger.apply(this, arguments);
            },
            _allDatasetsEmpty: function allDatasetsEmpty() {
                return _.every(this.datasets, isDatasetEmpty);
                function isDatasetEmpty(dataset) {
                    return dataset.isEmpty();
                }
            },
            _getSelectables: function getSelectables() {
                return this.$node.find(this.selectors.selectable);
            },
            _removeCursor: function _removeCursor() {
                var $selectable = this.getActiveSelectable();
                $selectable && $selectable.removeClass(this.classes.cursor);
            },
            _ensureVisible: function ensureVisible($el) {
                var elTop, elBottom, nodeScrollTop, nodeHeight;
                elTop = $el.position().top;
                elBottom = elTop + $el.outerHeight(true);
                nodeScrollTop = this.$node.scrollTop();
                nodeHeight = this.$node.height() + parseInt(this.$node.css("paddingTop"), 10) + parseInt(this.$node.css("paddingBottom"), 10);
                if (elTop < 0) {
                    this.$node.scrollTop(nodeScrollTop + elTop);
                } else if (nodeHeight < elBottom) {
                    this.$node.scrollTop(nodeScrollTop + (elBottom - nodeHeight));
                }
            },
            bind: function() {
                var that = this, onSelectableClick;
                onSelectableClick = _.bind(this._onSelectableClick, this);
                this.$node.on("click.tt", this.selectors.selectable, onSelectableClick);
                _.each(this.datasets, function(dataset) {
                    dataset.onSync("asyncRequested", that._propagate, that).onSync("asyncCanceled", that._propagate, that).onSync("asyncReceived", that._propagate, that).onSync("rendered", that._onRendered, that).onSync("cleared", that._onCleared, that);
                });
                return this;
            },
            isOpen: function isOpen() {
                return this.$node.hasClass(this.classes.open);
            },
            open: function open() {
                this.$node.addClass(this.classes.open);
            },
            close: function close() {
                this.$node.removeClass(this.classes.open);
                this._removeCursor();
            },
            setLanguageDirection: function setLanguageDirection(dir) {
                this.$node.attr("dir", dir);
            },
            selectableRelativeToCursor: function selectableRelativeToCursor(delta) {
                var $selectables, $oldCursor, oldIndex, newIndex;
                $oldCursor = this.getActiveSelectable();
                $selectables = this._getSelectables();
                oldIndex = $oldCursor ? $selectables.index($oldCursor) : -1;
                newIndex = oldIndex + delta;
                newIndex = (newIndex + 1) % ($selectables.length + 1) - 1;
                newIndex = newIndex < -1 ? $selectables.length - 1 : newIndex;
                return newIndex === -1 ? null : $selectables.eq(newIndex);
            },
            setCursor: function setCursor($selectable) {
                this._removeCursor();
                if ($selectable = $selectable && $selectable.first()) {
                    $selectable.addClass(this.classes.cursor);
                    this._ensureVisible($selectable);
                }
            },
            getSelectableData: function getSelectableData($el) {
                return $el && $el.length ? Dataset.extractData($el) : null;
            },
            getActiveSelectable: function getActiveSelectable() {
                var $selectable = this._getSelectables().filter(this.selectors.cursor).first();
                return $selectable.length ? $selectable : null;
            },
            getTopSelectable: function getTopSelectable() {
                var $selectable = this._getSelectables().first();
                return $selectable.length ? $selectable : null;
            },
            update: function update(query) {
                var isValidUpdate = query !== this.query;
                if (isValidUpdate) {
                    this.query = query;
                    _.each(this.datasets, updateDataset);
                }
                return isValidUpdate;
                function updateDataset(dataset) {
                    dataset.update(query);
                }
            },
            empty: function empty() {
                _.each(this.datasets, clearDataset);
                this.query = null;
                this.$node.addClass(this.classes.empty);
                function clearDataset(dataset) {
                    dataset.clear();
                }
            },
            destroy: function destroy() {
                this.$node.off(".tt");
                this.$node = $("<div>");
                _.each(this.datasets, destroyDataset);
                function destroyDataset(dataset) {
                    dataset.destroy();
                }
            }
        });
        return Menu;
    }();
    var DefaultMenu = function() {
        "use strict";
        var s = Menu.prototype;
        function DefaultMenu() {
            Menu.apply(this, [].slice.call(arguments, 0));
        }
        _.mixin(DefaultMenu.prototype, Menu.prototype, {
            open: function open() {
                !this._allDatasetsEmpty() && this._show();
                return s.open.apply(this, [].slice.call(arguments, 0));
            },
            close: function close() {
                this._hide();
                return s.close.apply(this, [].slice.call(arguments, 0));
            },
            _onRendered: function onRendered() {
                if (this._allDatasetsEmpty()) {
                    this._hide();
                } else {
                    this.isOpen() && this._show();
                }
                return s._onRendered.apply(this, [].slice.call(arguments, 0));
            },
            _onCleared: function onCleared() {
                if (this._allDatasetsEmpty()) {
                    this._hide();
                } else {
                    this.isOpen() && this._show();
                }
                return s._onCleared.apply(this, [].slice.call(arguments, 0));
            },
            setLanguageDirection: function setLanguageDirection(dir) {
                this.$node.css(dir === "ltr" ? this.css.ltr : this.css.rtl);
                return s.setLanguageDirection.apply(this, [].slice.call(arguments, 0));
            },
            _hide: function hide() {
                this.$node.hide();
            },
            _show: function show() {
                this.$node.css("display", "block");
            }
        });
        return DefaultMenu;
    }();
    var Typeahead = function() {
        "use strict";
        function Typeahead(o, www) {
            var onFocused, onBlurred, onEnterKeyed, onTabKeyed, onEscKeyed, onUpKeyed, onDownKeyed, onLeftKeyed, onRightKeyed, onQueryChanged, onWhitespaceChanged;
            o = o || {};
            if (!o.input) {
                $.error("missing input");
            }
            if (!o.menu) {
                $.error("missing menu");
            }
            if (!o.eventBus) {
                $.error("missing event bus");
            }
            www.mixin(this);
            this.eventBus = o.eventBus;
            this.minLength = _.isNumber(o.minLength) ? o.minLength : 1;
            this.input = o.input;
            this.menu = o.menu;
            this.enabled = true;
            this.active = false;
            this.input.hasFocus() && this.activate();
            this.dir = this.input.getLangDir();
            this._hacks();
            this.menu.bind().onSync("selectableClicked", this._onSelectableClicked, this).onSync("asyncRequested", this._onAsyncRequested, this).onSync("asyncCanceled", this._onAsyncCanceled, this).onSync("asyncReceived", this._onAsyncReceived, this).onSync("datasetRendered", this._onDatasetRendered, this).onSync("datasetCleared", this._onDatasetCleared, this);
            onFocused = c(this, "activate", "open", "_onFocused");
            onBlurred = c(this, "deactivate", "_onBlurred");
            onEnterKeyed = c(this, "isActive", "isOpen", "_onEnterKeyed");
            onTabKeyed = c(this, "isActive", "isOpen", "_onTabKeyed");
            onEscKeyed = c(this, "isActive", "_onEscKeyed");
            onUpKeyed = c(this, "isActive", "open", "_onUpKeyed");
            onDownKeyed = c(this, "isActive", "open", "_onDownKeyed");
            onLeftKeyed = c(this, "isActive", "isOpen", "_onLeftKeyed");
            onRightKeyed = c(this, "isActive", "isOpen", "_onRightKeyed");
            onQueryChanged = c(this, "_openIfActive", "_onQueryChanged");
            onWhitespaceChanged = c(this, "_openIfActive", "_onWhitespaceChanged");
            this.input.bind().onSync("focused", onFocused, this).onSync("blurred", onBlurred, this).onSync("enterKeyed", onEnterKeyed, this).onSync("tabKeyed", onTabKeyed, this).onSync("escKeyed", onEscKeyed, this).onSync("upKeyed", onUpKeyed, this).onSync("downKeyed", onDownKeyed, this).onSync("leftKeyed", onLeftKeyed, this).onSync("rightKeyed", onRightKeyed, this).onSync("queryChanged", onQueryChanged, this).onSync("whitespaceChanged", onWhitespaceChanged, this).onSync("langDirChanged", this._onLangDirChanged, this);
        }
        _.mixin(Typeahead.prototype, {
            _hacks: function hacks() {
                var $input, $menu;
                $input = this.input.$input || $("<div>");
                $menu = this.menu.$node || $("<div>");
                $input.on("blur.tt", function($e) {
                    var active, isActive, hasActive;
                    active = document.activeElement;
                    isActive = $menu.is(active);
                    hasActive = $menu.has(active).length > 0;
                    if (_.isMsie() && (isActive || hasActive)) {
                        $e.preventDefault();
                        $e.stopImmediatePropagation();
                        _.defer(function() {
                            $input.focus();
                        });
                    }
                });
                $menu.on("mousedown.tt", function($e) {
                    $e.preventDefault();
                });
            },
            _onSelectableClicked: function onSelectableClicked(type, $el) {
                this.select($el);
            },
            _onDatasetCleared: function onDatasetCleared() {
                this._updateHint();
            },
            _onDatasetRendered: function onDatasetRendered(type, dataset, suggestions, async) {
                this._updateHint();
                this.eventBus.trigger("render", suggestions, async, dataset);
            },
            _onAsyncRequested: function onAsyncRequested(type, dataset, query) {
                this.eventBus.trigger("asyncrequest", query, dataset);
            },
            _onAsyncCanceled: function onAsyncCanceled(type, dataset, query) {
                this.eventBus.trigger("asynccancel", query, dataset);
            },
            _onAsyncReceived: function onAsyncReceived(type, dataset, query) {
                this.eventBus.trigger("asyncreceive", query, dataset);
            },
            _onFocused: function onFocused() {
                this._minLengthMet() && this.menu.update(this.input.getQuery());
            },
            _onBlurred: function onBlurred() {
                if (this.input.hasQueryChangedSinceLastFocus()) {
                    this.eventBus.trigger("change", this.input.getQuery());
                }
            },
            _onEnterKeyed: function onEnterKeyed(type, $e) {
                var $selectable;
                if ($selectable = this.menu.getActiveSelectable()) {
                    this.select($selectable) && $e.preventDefault();
                }
            },
            _onTabKeyed: function onTabKeyed(type, $e) {
                var $selectable;
                if ($selectable = this.menu.getActiveSelectable()) {
                    this.select($selectable) && $e.preventDefault();
                } else if ($selectable = this.menu.getTopSelectable()) {
                    this.autocomplete($selectable) && $e.preventDefault();
                }
            },
            _onEscKeyed: function onEscKeyed() {
                this.close();
            },
            _onUpKeyed: function onUpKeyed() {
                this.moveCursor(-1);
            },
            _onDownKeyed: function onDownKeyed() {
                this.moveCursor(+1);
            },
            _onLeftKeyed: function onLeftKeyed() {
                if (this.dir === "rtl" && this.input.isCursorAtEnd()) {
                    this.autocomplete(this.menu.getTopSelectable());
                }
            },
            _onRightKeyed: function onRightKeyed() {
                if (this.dir === "ltr" && this.input.isCursorAtEnd()) {
                    this.autocomplete(this.menu.getTopSelectable());
                }
            },
            _onQueryChanged: function onQueryChanged(e, query) {
                this._minLengthMet(query) ? this.menu.update(query) : this.menu.empty();
            },
            _onWhitespaceChanged: function onWhitespaceChanged() {
                this._updateHint();
            },
            _onLangDirChanged: function onLangDirChanged(e, dir) {
                if (this.dir !== dir) {
                    this.dir = dir;
                    this.menu.setLanguageDirection(dir);
                }
            },
            _openIfActive: function openIfActive() {
                this.isActive() && this.open();
            },
            _minLengthMet: function minLengthMet(query) {
                query = _.isString(query) ? query : this.input.getQuery() || "";
                return query.length >= this.minLength;
            },
            _updateHint: function updateHint() {
                var $selectable, data, val, query, escapedQuery, frontMatchRegEx, match;
                $selectable = this.menu.getTopSelectable();
                data = this.menu.getSelectableData($selectable);
                val = this.input.getInputValue();
                if (data && !_.isBlankString(val) && !this.input.hasOverflow()) {
                    query = Input.normalizeQuery(val);
                    escapedQuery = _.escapeRegExChars(query);
                    frontMatchRegEx = new RegExp("^(?:" + escapedQuery + ")(.+$)", "i");
                    match = frontMatchRegEx.exec(data.val);
                    match && this.input.setHint(val + match[1]);
                } else {
                    this.input.clearHint();
                }
            },
            isEnabled: function isEnabled() {
                return this.enabled;
            },
            enable: function enable() {
                this.enabled = true;
            },
            disable: function disable() {
                this.enabled = false;
            },
            isActive: function isActive() {
                return this.active;
            },
            activate: function activate() {
                if (this.isActive()) {
                    return true;
                } else if (!this.isEnabled() || this.eventBus.before("active")) {
                    return false;
                } else {
                    this.active = true;
                    this.eventBus.trigger("active");
                    return true;
                }
            },
            deactivate: function deactivate() {
                if (!this.isActive()) {
                    return true;
                } else if (this.eventBus.before("idle")) {
                    return false;
                } else {
                    this.active = false;
                    this.close();
                    this.eventBus.trigger("idle");
                    return true;
                }
            },
            isOpen: function isOpen() {
                return this.menu.isOpen();
            },
            open: function open() {
                if (!this.isOpen() && !this.eventBus.before("open")) {
                    this.menu.open();
                    this._updateHint();
                    this.eventBus.trigger("open");
                }
                return this.isOpen();
            },
            close: function close() {
                if (this.isOpen() && !this.eventBus.before("close")) {
                    this.menu.close();
                    this.input.clearHint();
                    this.input.resetInputValue();
                    this.eventBus.trigger("close");
                }
                return !this.isOpen();
            },
            setVal: function setVal(val) {
                this.input.setQuery(_.toStr(val));
            },
            getVal: function getVal() {
                return this.input.getQuery();
            },
            select: function select($selectable) {
                var data = this.menu.getSelectableData($selectable);
                if (data && !this.eventBus.before("select", data.obj)) {
                    this.input.setQuery(data.val, true);
                    this.eventBus.trigger("select", data.obj);
                    this.close();
                    return true;
                }
                return false;
            },
            autocomplete: function autocomplete($selectable) {
                var query, data, isValid;
                query = this.input.getQuery();
                data = this.menu.getSelectableData($selectable);
                isValid = data && query !== data.val;
                if (isValid && !this.eventBus.before("autocomplete", data.obj)) {
                    this.input.setQuery(data.val);
                    this.eventBus.trigger("autocomplete", data.obj);
                    return true;
                }
                return false;
            },
            moveCursor: function moveCursor(delta) {
                var query, $candidate, data, payload, cancelMove;
                query = this.input.getQuery();
                $candidate = this.menu.selectableRelativeToCursor(delta);
                data = this.menu.getSelectableData($candidate);
                payload = data ? data.obj : null;
                cancelMove = this._minLengthMet() && this.menu.update(query);
                if (!cancelMove && !this.eventBus.before("cursorchange", payload)) {
                    this.menu.setCursor($candidate);
                    if (data) {
                        this.input.setInputValue(data.val);
                    } else {
                        this.input.resetInputValue();
                        this._updateHint();
                    }
                    this.eventBus.trigger("cursorchange", payload);
                    return true;
                }
                return false;
            },
            destroy: function destroy() {
                this.input.destroy();
                this.menu.destroy();
            }
        });
        return Typeahead;
        function c(ctx) {
            var methods = [].slice.call(arguments, 1);
            return function() {
                var args = [].slice.call(arguments);
                _.each(methods, function(method) {
                    return ctx[method].apply(ctx, args);
                });
            };
        }
    }();
    (function() {
        "use strict";
        var old, keys, methods;
        old = $.fn.typeahead;
        keys = {
            www: "tt-www",
            attrs: "tt-attrs",
            typeahead: "tt-typeahead"
        };
        methods = {
            initialize: function initialize(o, datasets) {
                var www;
                datasets = _.isArray(datasets) ? datasets : [].slice.call(arguments, 1);
                o = o || {};
                www = WWW(o.classNames);
                return this.each(attach);
                function attach() {
                    var $input, $wrapper, $hint, $menu, defaultHint, defaultMenu, eventBus, input, menu, typeahead, MenuConstructor;
                    _.each(datasets, function(d) {
                        d.highlight = !!o.highlight;
                    });
                    $input = $(this);
                    $wrapper = $(www.html.wrapper);
                    $hint = $elOrNull(o.hint);
                    $menu = $elOrNull(o.menu);
                    defaultHint = o.hint !== false && !$hint;
                    defaultMenu = o.menu !== false && !$menu;
                    defaultHint && ($hint = buildHintFromInput($input, www));
                    defaultMenu && ($menu = $(www.html.menu).css(www.css.menu));
                    $hint && $hint.val("");
                    $input = prepInput($input, www);
                    if (defaultHint || defaultMenu) {
                        $wrapper.css(www.css.wrapper);
                        $input.css(defaultHint ? www.css.input : www.css.inputWithNoHint);
                        $input.wrap($wrapper).parent().prepend(defaultHint ? $hint : null).append(defaultMenu ? $menu : null);
                    }
                    MenuConstructor = defaultMenu ? DefaultMenu : Menu;
                    eventBus = new EventBus({
                        el: $input
                    });
                    input = new Input({
                        hint: $hint,
                        input: $input
                    }, www);
                    menu = new MenuConstructor({
                        node: $menu,
                        datasets: datasets
                    }, www);
                    typeahead = new Typeahead({
                        input: input,
                        menu: menu,
                        eventBus: eventBus,
                        minLength: o.minLength
                    }, www);
                    $input.data(keys.www, www);
                    $input.data(keys.typeahead, typeahead);
                }
            },
            isEnabled: function isEnabled() {
                var enabled;
                ttEach(this.first(), function(t) {
                    enabled = t.isEnabled();
                });
                return enabled;
            },
            enable: function enable() {
                ttEach(this, function(t) {
                    t.enable();
                });
                return this;
            },
            disable: function disable() {
                ttEach(this, function(t) {
                    t.disable();
                });
                return this;
            },
            isActive: function isActive() {
                var active;
                ttEach(this.first(), function(t) {
                    active = t.isActive();
                });
                return active;
            },
            activate: function activate() {
                ttEach(this, function(t) {
                    t.activate();
                });
                return this;
            },
            deactivate: function deactivate() {
                ttEach(this, function(t) {
                    t.deactivate();
                });
                return this;
            },
            isOpen: function isOpen() {
                var open;
                ttEach(this.first(), function(t) {
                    open = t.isOpen();
                });
                return open;
            },
            open: function open() {
                ttEach(this, function(t) {
                    t.open();
                });
                return this;
            },
            close: function close() {
                ttEach(this, function(t) {
                    t.close();
                });
                return this;
            },
            select: function select(el) {
                var success = false, $el = $(el);
                ttEach(this.first(), function(t) {
                    success = t.select($el);
                });
                return success;
            },
            autocomplete: function autocomplete(el) {
                var success = false, $el = $(el);
                ttEach(this.first(), function(t) {
                    success = t.autocomplete($el);
                });
                return success;
            },
            moveCursor: function moveCursoe(delta) {
                var success = false;
                ttEach(this.first(), function(t) {
                    success = t.moveCursor(delta);
                });
                return success;
            },
            val: function val(newVal) {
                var query;
                if (!arguments.length) {
                    ttEach(this.first(), function(t) {
                        query = t.getVal();
                    });
                    return query;
                } else {
                    ttEach(this, function(t) {
                        t.setVal(newVal);
                    });
                    return this;
                }
            },
            destroy: function destroy() {
                ttEach(this, function(typeahead, $input) {
                    revert($input);
                    typeahead.destroy();
                });
                return this;
            }
        };
        $.fn.typeahead = function(method) {
            if (methods[method]) {
                return methods[method].apply(this, [].slice.call(arguments, 1));
            } else {
                return methods.initialize.apply(this, arguments);
            }
        };
        $.fn.typeahead.noConflict = function noConflict() {
            $.fn.typeahead = old;
            return this;
        };
        function ttEach($els, fn) {
            $els.each(function() {
                var $input = $(this), typeahead;
                (typeahead = $input.data(keys.typeahead)) && fn(typeahead, $input);
            });
        }
        function buildHintFromInput($input, www) {
            return $input.clone().addClass(www.classes.hint).removeData().css(www.css.hint).css(getBackgroundStyles($input)).prop("readonly", true).removeAttr("id name placeholder required").attr({
                autocomplete: "off",
                spellcheck: "false",
                tabindex: -1
            });
        }
        function prepInput($input, www) {
            $input.data(keys.attrs, {
                dir: $input.attr("dir"),
                autocomplete: $input.attr("autocomplete"),
                spellcheck: $input.attr("spellcheck"),
                style: $input.attr("style")
            });
            $input.addClass(www.classes.input).attr({
                autocomplete: "off",
                spellcheck: false
            });
            try {
                !$input.attr("dir") && $input.attr("dir", "auto");
            } catch (e) {}
            return $input;
        }
        function getBackgroundStyles($el) {
            return {
                backgroundAttachment: $el.css("background-attachment"),
                backgroundClip: $el.css("background-clip"),
                backgroundColor: $el.css("background-color"),
                backgroundImage: $el.css("background-image"),
                backgroundOrigin: $el.css("background-origin"),
                backgroundPosition: $el.css("background-position"),
                backgroundRepeat: $el.css("background-repeat"),
                backgroundSize: $el.css("background-size")
            };
        }
        function revert($input) {
            var www, $wrapper;
            www = $input.data(keys.www);
            $wrapper = $input.parent().filter(www.selectors.wrapper);
            _.each($input.data(keys.attrs), function(val, key) {
                _.isUndefined(val) ? $input.removeAttr(key) : $input.attr(key, val);
            });
            $input.removeData(keys.typeahead).removeData(keys.www).removeData(keys.attr).removeClass(www.classes.input);
            if ($wrapper.length) {
                $input.detach().insertAfter($wrapper);
                $wrapper.remove();
            }
        }
        function $elOrNull(obj) {
            var isValid, $el;
            isValid = _.isJQuery(obj) || _.isElement(obj);
            $el = isValid ? $(obj).first() : [];
            return $el.length ? $el : null;
        }
    })();
});
/*
 * bootstrap-tagsinput v0.4.2 by Tim Schlechter
 *
 */

!function(a){"use strict";function b(b,c){this.itemsArray=[],this.$element=a(b),this.$element.hide(),this.isSelect="SELECT"===b.tagName,this.multiple=this.isSelect&&b.hasAttribute("multiple"),this.objectItems=c&&c.itemValue,this.placeholderText=b.hasAttribute("placeholder")?this.$element.attr("placeholder"):"",this.inputSize=Math.max(1,this.placeholderText.length),this.$container=a('<div class="bootstrap-tagsinput"></div>'),this.$input=a('<input type="text" placeholder="'+this.placeholderText+'"/>').appendTo(this.$container),this.$element.after(this.$container);var d=(this.inputSize<3?3:this.inputSize)+"em";this.$input.get(0).style.cssText="width: "+d+" !important; padding: 8px;",this.build(c)}function c(a,b){if("function"!=typeof a[b]){var c=a[b];a[b]=function(a){return a[c]}}}function d(a,b){if("function"!=typeof a[b]){var c=a[b];a[b]=function(){return c}}}function e(a){return a?i.text(a).html():""}function f(a){var b=0;if(document.selection){a.focus();var c=document.selection.createRange();c.moveStart("character",-a.value.length),b=c.text.length}else(a.selectionStart||"0"==a.selectionStart)&&(b=a.selectionStart);return b}function g(b,c){var d=!1;return a.each(c,function(a,c){if("number"==typeof c&&b.which===c)return d=!0,!1;if(b.which===c.which){var e=!c.hasOwnProperty("altKey")||b.altKey===c.altKey,f=!c.hasOwnProperty("shiftKey")||b.shiftKey===c.shiftKey,g=!c.hasOwnProperty("ctrlKey")||b.ctrlKey===c.ctrlKey;if(e&&f&&g)return d=!0,!1}}),d}var h={tagClass:function(){return"label label-info"},itemValue:function(a){return a?a.toString():a},itemText:function(a){return this.itemValue(a)},freeInput:!0,addOnBlur:!0,maxTags:void 0,maxChars:void 0,confirmKeys:[13,44],onTagExists:function(a,b){b.hide().fadeIn()},trimValue:!1,allowDuplicates:!1};b.prototype={constructor:b,add:function(b,c){var d=this;if(!(d.options.maxTags&&d.itemsArray.length>=d.options.maxTags||b!==!1&&!b)){if("string"==typeof b&&d.options.trimValue&&(b=a.trim(b)),"object"==typeof b&&!d.objectItems)throw"Can't add objects when itemValue option is not set";if(!b.toString().match(/^\s*$/)){if(d.isSelect&&!d.multiple&&d.itemsArray.length>0&&d.remove(d.itemsArray[0]),"string"==typeof b&&"INPUT"===this.$element[0].tagName){var f=b.split(",");if(f.length>1){for(var g=0;g<f.length;g++)this.add(f[g],!0);return void(c||d.pushVal())}}var h=d.options.itemValue(b),i=d.options.itemText(b),j=d.options.tagClass(b),k=a.grep(d.itemsArray,function(a){return d.options.itemValue(a)===h})[0];if(!k||d.options.allowDuplicates){if(!(d.items().toString().length+b.length+1>d.options.maxInputLength)){var l=a.Event("beforeItemAdd",{item:b,cancel:!1});if(d.$element.trigger(l),!l.cancel){d.itemsArray.push(b);var m=a('<span class="tag '+e(j)+'">'+e(i)+'<span data-role="remove"></span></span>');if(m.data("item",b),d.findInputWrapper().before(m),m.after(" "),d.isSelect&&!a('option[value="'+encodeURIComponent(h)+'"]',d.$element)[0]){var n=a("<option selected>"+e(i)+"</option>");n.data("item",b),n.attr("value",h),d.$element.append(n)}c||d.pushVal(),(d.options.maxTags===d.itemsArray.length||d.items().toString().length===d.options.maxInputLength)&&d.$container.addClass("bootstrap-tagsinput-max"),d.$element.trigger(a.Event("itemAdded",{item:b}))}}}else if(d.options.onTagExists){var o=a(".tag",d.$container).filter(function(){return a(this).data("item")===k});d.options.onTagExists(b,o)}}}},remove:function(b,c){var d=this;if(d.objectItems&&(b="object"==typeof b?a.grep(d.itemsArray,function(a){return d.options.itemValue(a)==d.options.itemValue(b)}):a.grep(d.itemsArray,function(a){return d.options.itemValue(a)==b}),b=b[b.length-1]),b){var e=a.Event("beforeItemRemove",{item:b,cancel:!1});if(d.$element.trigger(e),e.cancel)return;a(".tag",d.$container).filter(function(){return a(this).data("item")===b}).remove(),a("option",d.$element).filter(function(){return a(this).data("item")===b}).remove(),-1!==a.inArray(b,d.itemsArray)&&d.itemsArray.splice(a.inArray(b,d.itemsArray),1)}c||d.pushVal(),d.options.maxTags>d.itemsArray.length&&d.$container.removeClass("bootstrap-tagsinput-max"),d.$element.trigger(a.Event("itemRemoved",{item:b}))},removeAll:function(){var b=this;for(a(".tag",b.$container).remove(),a("option",b.$element).remove();b.itemsArray.length>0;)b.itemsArray.pop();b.pushVal()},refresh:function(){var b=this;a(".tag",b.$container).each(function(){var c=a(this),d=c.data("item"),f=b.options.itemValue(d),g=b.options.itemText(d),h=b.options.tagClass(d);if(c.attr("class",null),c.addClass("tag "+e(h)),c.contents().filter(function(){return 3==this.nodeType})[0].nodeValue=e(g),b.isSelect){var i=a("option",b.$element).filter(function(){return a(this).data("item")===d});i.attr("value",f)}})},items:function(){return this.itemsArray},pushVal:function(){var b=this,c=a.map(b.items(),function(a){return b.options.itemValue(a).toString()});b.$element.val(c,!0).trigger("change")},build:function(b){var e=this;if(e.options=a.extend({},h,b),e.objectItems&&(e.options.freeInput=!1),c(e.options,"itemValue"),c(e.options,"itemText"),d(e.options,"tagClass"),e.options.typeahead){var i=e.options.typeahead||{};d(i,"source"),e.$input.typeahead(a.extend({},i,{source:function(b,c){function d(a){for(var b=[],d=0;d<a.length;d++){var g=e.options.itemText(a[d]);f[g]=a[d],b.push(g)}c(b)}this.map={};var f=this.map,g=i.source(b);a.isFunction(g.success)?g.success(d):a.isFunction(g.then)?g.then(d):a.when(g).then(d)},updater:function(a){e.add(this.map[a])},matcher:function(a){return-1!==a.toLowerCase().indexOf(this.query.trim().toLowerCase())},sorter:function(a){return a.sort()},highlighter:function(a){var b=new RegExp("("+this.query+")","gi");return a.replace(b,"<strong>$1</strong>")}}))}if(e.options.typeaheadjs){var j=e.options.typeaheadjs||{};e.$input.typeahead(null,j).on("typeahead:selected",a.proxy(function(a,b){e.add(j.valueKey?b[j.valueKey]:b),e.$input.typeahead("val","")},e))}e.$container.on("click",a.proxy(function(){e.$element.attr("disabled")||e.$input.removeAttr("disabled"),e.$input.focus()},e)),e.options.addOnBlur&&e.options.freeInput&&e.$input.on("focusout",a.proxy(function(){0===a(".typeahead, .twitter-typeahead",e.$container).length&&(e.add(e.$input.val()),e.$input.val(""))},e)),e.$container.on("keydown","input",a.proxy(function(b){var c=a(b.target),d=e.findInputWrapper();if(e.$element.attr("disabled"))return void e.$input.attr("disabled","disabled");switch(b.which){case 8:if(0===f(c[0])){var g=d.prev();g&&e.remove(g.data("item"))}break;case 46:if(0===f(c[0])){var h=d.next();h&&e.remove(h.data("item"))}break;case 37:var i=d.prev();0===c.val().length&&i[0]&&(i.before(d),c.focus());break;case 39:var j=d.next();0===c.val().length&&j[0]&&(j.after(d),c.focus())}{var k=c.val().length;Math.ceil(k/5)}c.attr("size",Math.max(this.inputSize,c.val().length))},e)),e.$container.on("keypress","input",a.proxy(function(b){var c=a(b.target);if(e.$element.attr("disabled"))return void e.$input.attr("disabled","disabled");var d=c.val(),f=e.options.maxChars&&d.length>=e.options.maxChars;e.options.freeInput&&(g(b,e.options.confirmKeys)||f)&&(e.add(f?d.substr(0,e.options.maxChars):d),c.val(""),b.preventDefault());{var h=c.val().length;Math.ceil(h/5)}c.attr("size",Math.max(this.inputSize,c.val().length))},e)),e.$container.on("click","[data-role=remove]",a.proxy(function(b){e.$element.attr("disabled")||e.remove(a(b.target).closest(".tag").data("item"))},e)),e.options.itemValue===h.itemValue&&("INPUT"===e.$element[0].tagName?e.add(e.$element.val()):a("option",e.$element).each(function(){e.add(a(this).attr("value"),!0)}))},destroy:function(){var a=this;a.$container.off("keypress","input"),a.$container.off("click","[role=remove]"),a.$container.remove(),a.$element.removeData("tagsinput"),a.$element.show()},focus:function(){this.$input.focus()},input:function(){return this.$input},findInputWrapper:function(){for(var b=this.$input[0],c=this.$container[0];b&&b.parentNode!==c;)b=b.parentNode;return a(b)}},a.fn.tagsinput=function(c,d){var e=[];return this.each(function(){var f=a(this).data("tagsinput");if(f)if(c||d){if(void 0!==f[c]){var g=f[c](d);void 0!==g&&e.push(g)}}else e.push(f);else f=new b(this,c),a(this).data("tagsinput",f),e.push(f),"SELECT"===this.tagName&&a("option",a(this)).attr("selected","selected"),a(this).val(a(this).val())}),"string"==typeof c?e.length>1?e:e[0]:e},a.fn.tagsinput.Constructor=b;var i=a("<div />");a(function(){a("input[data-role=tagsinput], select[multiple][data-role=tagsinput]").tagsinput()})}(window.jQuery);
/*! Sortable 1.6.0 - MIT | git://github.com/rubaxa/Sortable.git */
!function(a){"use strict";"function"==typeof define&&define.amd?define(a):"undefined"!=typeof module&&"undefined"!=typeof module.exports?module.exports=a():window.Sortable=a()}(function(){"use strict";function a(a,b){if(!a||!a.nodeType||1!==a.nodeType)throw"Sortable: `el` must be HTMLElement, and not "+{}.toString.call(a);this.el=a,this.options=b=t({},b),a[T]=this;var c={group:Math.random(),sort:!0,disabled:!1,store:null,handle:null,scroll:!0,scrollSensitivity:30,scrollSpeed:10,draggable:/[uo]l/i.test(a.nodeName)?"li":">*",ghostClass:"sortable-ghost",chosenClass:"sortable-chosen",dragClass:"sortable-drag",ignore:"a, img",filter:null,preventOnFilter:!0,animation:0,setData:function(a,b){a.setData("Text",b.textContent)},dropBubble:!1,dragoverBubble:!1,dataIdAttr:"data-id",delay:0,forceFallback:!1,fallbackClass:"sortable-fallback",fallbackOnBody:!1,fallbackTolerance:0,fallbackOffset:{x:0,y:0}};for(var d in c)!(d in b)&&(b[d]=c[d]);ga(b);for(var e in this)"_"===e.charAt(0)&&"function"==typeof this[e]&&(this[e]=this[e].bind(this));this.nativeDraggable=!b.forceFallback&&$,f(a,"mousedown",this._onTapStart),f(a,"touchstart",this._onTapStart),f(a,"pointerdown",this._onTapStart),this.nativeDraggable&&(f(a,"dragover",this),f(a,"dragenter",this)),ea.push(this._onDragOver),b.store&&this.sort(b.store.get(this))}function b(a,b){"clone"!==a.lastPullMode&&(b=!0),z&&z.state!==b&&(i(z,"display",b?"none":""),b||z.state&&(a.options.group.revertClone?(A.insertBefore(z,B),a._animate(w,z)):A.insertBefore(z,w)),z.state=b)}function c(a,b,c){if(a){c=c||V;do if(">*"===b&&a.parentNode===c||r(a,b))return a;while(a=d(a))}return null}function d(a){var b=a.host;return b&&b.nodeType?b:a.parentNode}function e(a){a.dataTransfer&&(a.dataTransfer.dropEffect="move"),a.preventDefault()}function f(a,b,c){a.addEventListener(b,c,Z)}function g(a,b,c){a.removeEventListener(b,c,Z)}function h(a,b,c){if(a)if(a.classList)a.classList[c?"add":"remove"](b);else{var d=(" "+a.className+" ").replace(R," ").replace(" "+b+" "," ");a.className=(d+(c?" "+b:"")).replace(R," ")}}function i(a,b,c){var d=a&&a.style;if(d){if(void 0===c)return V.defaultView&&V.defaultView.getComputedStyle?c=V.defaultView.getComputedStyle(a,""):a.currentStyle&&(c=a.currentStyle),void 0===b?c:c[b];b in d||(b="-webkit-"+b),d[b]=c+("string"==typeof c?"":"px")}}function j(a,b,c){if(a){var d=a.getElementsByTagName(b),e=0,f=d.length;if(c)for(;e<f;e++)c(d[e],e);return d}return[]}function k(a,b,c,d,e,f,g){a=a||b[T];var h=V.createEvent("Event"),i=a.options,j="on"+c.charAt(0).toUpperCase()+c.substr(1);h.initEvent(c,!0,!0),h.to=b,h.from=e||b,h.item=d||b,h.clone=z,h.oldIndex=f,h.newIndex=g,b.dispatchEvent(h),i[j]&&i[j].call(a,h)}function l(a,b,c,d,e,f,g,h){var i,j,k=a[T],l=k.options.onMove;return i=V.createEvent("Event"),i.initEvent("move",!0,!0),i.to=b,i.from=a,i.dragged=c,i.draggedRect=d,i.related=e||b,i.relatedRect=f||b.getBoundingClientRect(),i.willInsertAfter=h,a.dispatchEvent(i),l&&(j=l.call(k,i,g)),j}function m(a){a.draggable=!1}function n(){aa=!1}function o(a,b){var c=a.lastElementChild,d=c.getBoundingClientRect();return b.clientY-(d.top+d.height)>5||b.clientX-(d.left+d.width)>5}function p(a){for(var b=a.tagName+a.className+a.src+a.href+a.textContent,c=b.length,d=0;c--;)d+=b.charCodeAt(c);return d.toString(36)}function q(a,b){var c=0;if(!a||!a.parentNode)return-1;for(;a&&(a=a.previousElementSibling);)"TEMPLATE"===a.nodeName.toUpperCase()||">*"!==b&&!r(a,b)||c++;return c}function r(a,b){if(a){b=b.split(".");var c=b.shift().toUpperCase(),d=new RegExp("\\s("+b.join("|")+")(?=\\s)","g");return!(""!==c&&a.nodeName.toUpperCase()!=c||b.length&&((" "+a.className+" ").match(d)||[]).length!=b.length)}return!1}function s(a,b){var c,d;return function(){void 0===c&&(c=arguments,d=this,setTimeout(function(){1===c.length?a.call(d,c[0]):a.apply(d,c),c=void 0},b))}}function t(a,b){if(a&&b)for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a}function u(a){return X?X(a).clone(!0)[0]:Y&&Y.dom?Y.dom(a).cloneNode(!0):a.cloneNode(!0)}function v(a){for(var b=a.getElementsByTagName("input"),c=b.length;c--;){var d=b[c];d.checked&&da.push(d)}}if("undefined"==typeof window||!window.document)return function(){throw new Error("Sortable.js requires a window with a document")};var w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q={},R=/\s+/g,S=/left|right|inline/,T="Sortable"+(new Date).getTime(),U=window,V=U.document,W=U.parseInt,X=U.jQuery||U.Zepto,Y=U.Polymer,Z=!1,$=!!("draggable"in V.createElement("div")),_=function(a){return!navigator.userAgent.match(/Trident.*rv[ :]?11\./)&&(a=V.createElement("x"),a.style.cssText="pointer-events:auto","auto"===a.style.pointerEvents)}(),aa=!1,ba=Math.abs,ca=Math.min,da=[],ea=[],fa=s(function(a,b,c){if(c&&b.scroll){var d,e,f,g,h,i,j=c[T],k=b.scrollSensitivity,l=b.scrollSpeed,m=a.clientX,n=a.clientY,o=window.innerWidth,p=window.innerHeight;if(E!==c&&(D=b.scroll,E=c,F=b.scrollFn,D===!0)){D=c;do if(D.offsetWidth<D.scrollWidth||D.offsetHeight<D.scrollHeight)break;while(D=D.parentNode)}D&&(d=D,e=D.getBoundingClientRect(),f=(ba(e.right-m)<=k)-(ba(e.left-m)<=k),g=(ba(e.bottom-n)<=k)-(ba(e.top-n)<=k)),f||g||(f=(o-m<=k)-(m<=k),g=(p-n<=k)-(n<=k),(f||g)&&(d=U)),Q.vx===f&&Q.vy===g&&Q.el===d||(Q.el=d,Q.vx=f,Q.vy=g,clearInterval(Q.pid),d&&(Q.pid=setInterval(function(){return i=g?g*l:0,h=f?f*l:0,"function"==typeof F?F.call(j,h,i,a):void(d===U?U.scrollTo(U.pageXOffset+h,U.pageYOffset+i):(d.scrollTop+=i,d.scrollLeft+=h))},24)))}},30),ga=function(a){function b(a,b){return void 0!==a&&a!==!0||(a=c.name),"function"==typeof a?a:function(c,d){var e=d.options.group.name;return b?a:a&&(a.join?a.indexOf(e)>-1:e==a)}}var c={},d=a.group;d&&"object"==typeof d||(d={name:d}),c.name=d.name,c.checkPull=b(d.pull,!0),c.checkPut=b(d.put),c.revertClone=d.revertClone,a.group=c};a.prototype={constructor:a,_onTapStart:function(a){var b,d=this,e=this.el,f=this.options,g=f.preventOnFilter,h=a.type,i=a.touches&&a.touches[0],j=(i||a).target,l=a.target.shadowRoot&&a.path[0]||j,m=f.filter;if(v(e),!w&&!("mousedown"===h&&0!==a.button||f.disabled)&&(j=c(j,f.draggable,e),j&&C!==j)){if(b=q(j,f.draggable),"function"==typeof m){if(m.call(this,a,j,this))return k(d,l,"filter",j,e,b),void(g&&a.preventDefault())}else if(m&&(m=m.split(",").some(function(a){if(a=c(l,a.trim(),e))return k(d,a,"filter",j,e,b),!0})))return void(g&&a.preventDefault());f.handle&&!c(l,f.handle,e)||this._prepareDragStart(a,i,j,b)}},_prepareDragStart:function(a,b,c,d){var e,g=this,i=g.el,l=g.options,n=i.ownerDocument;c&&!w&&c.parentNode===i&&(N=a,A=i,w=c,x=w.parentNode,B=w.nextSibling,C=c,L=l.group,J=d,this._lastX=(b||a).clientX,this._lastY=(b||a).clientY,w.style["will-change"]="transform",e=function(){g._disableDelayedDrag(),w.draggable=g.nativeDraggable,h(w,l.chosenClass,!0),g._triggerDragStart(a,b),k(g,A,"choose",w,A,J)},l.ignore.split(",").forEach(function(a){j(w,a.trim(),m)}),f(n,"mouseup",g._onDrop),f(n,"touchend",g._onDrop),f(n,"touchcancel",g._onDrop),f(n,"pointercancel",g._onDrop),f(n,"selectstart",g),l.delay?(f(n,"mouseup",g._disableDelayedDrag),f(n,"touchend",g._disableDelayedDrag),f(n,"touchcancel",g._disableDelayedDrag),f(n,"mousemove",g._disableDelayedDrag),f(n,"touchmove",g._disableDelayedDrag),f(n,"pointermove",g._disableDelayedDrag),g._dragStartTimer=setTimeout(e,l.delay)):e())},_disableDelayedDrag:function(){var a=this.el.ownerDocument;clearTimeout(this._dragStartTimer),g(a,"mouseup",this._disableDelayedDrag),g(a,"touchend",this._disableDelayedDrag),g(a,"touchcancel",this._disableDelayedDrag),g(a,"mousemove",this._disableDelayedDrag),g(a,"touchmove",this._disableDelayedDrag),g(a,"pointermove",this._disableDelayedDrag)},_triggerDragStart:function(a,b){b=b||("touch"==a.pointerType?a:null),b?(N={target:w,clientX:b.clientX,clientY:b.clientY},this._onDragStart(N,"touch")):this.nativeDraggable?(f(w,"dragend",this),f(A,"dragstart",this._onDragStart)):this._onDragStart(N,!0);try{V.selection?setTimeout(function(){V.selection.empty()}):window.getSelection().removeAllRanges()}catch(a){}},_dragStarted:function(){if(A&&w){var b=this.options;h(w,b.ghostClass,!0),h(w,b.dragClass,!1),a.active=this,k(this,A,"start",w,A,J)}else this._nulling()},_emulateDragOver:function(){if(O){if(this._lastX===O.clientX&&this._lastY===O.clientY)return;this._lastX=O.clientX,this._lastY=O.clientY,_||i(y,"display","none");var a=V.elementFromPoint(O.clientX,O.clientY),b=a,c=ea.length;if(b)do{if(b[T]){for(;c--;)ea[c]({clientX:O.clientX,clientY:O.clientY,target:a,rootEl:b});break}a=b}while(b=b.parentNode);_||i(y,"display","")}},_onTouchMove:function(b){if(N){var c=this.options,d=c.fallbackTolerance,e=c.fallbackOffset,f=b.touches?b.touches[0]:b,g=f.clientX-N.clientX+e.x,h=f.clientY-N.clientY+e.y,j=b.touches?"translate3d("+g+"px,"+h+"px,0)":"translate("+g+"px,"+h+"px)";if(!a.active){if(d&&ca(ba(f.clientX-this._lastX),ba(f.clientY-this._lastY))<d)return;this._dragStarted()}this._appendGhost(),P=!0,O=f,i(y,"webkitTransform",j),i(y,"mozTransform",j),i(y,"msTransform",j),i(y,"transform",j),b.preventDefault()}},_appendGhost:function(){if(!y){var a,b=w.getBoundingClientRect(),c=i(w),d=this.options;y=w.cloneNode(!0),h(y,d.ghostClass,!1),h(y,d.fallbackClass,!0),h(y,d.dragClass,!0),i(y,"top",b.top-W(c.marginTop,10)),i(y,"left",b.left-W(c.marginLeft,10)),i(y,"width",b.width),i(y,"height",b.height),i(y,"opacity","0.8"),i(y,"position","fixed"),i(y,"zIndex","100000"),i(y,"pointerEvents","none"),d.fallbackOnBody&&V.body.appendChild(y)||A.appendChild(y),a=y.getBoundingClientRect(),i(y,"width",2*b.width-a.width),i(y,"height",2*b.height-a.height)}},_onDragStart:function(a,b){var c=a.dataTransfer,d=this.options;this._offUpEvents(),L.checkPull(this,this,w,a)&&(z=u(w),z.draggable=!1,z.style["will-change"]="",i(z,"display","none"),h(z,this.options.chosenClass,!1),A.insertBefore(z,w),k(this,A,"clone",w)),h(w,d.dragClass,!0),b?("touch"===b?(f(V,"touchmove",this._onTouchMove),f(V,"touchend",this._onDrop),f(V,"touchcancel",this._onDrop),f(V,"pointermove",this._onTouchMove),f(V,"pointerup",this._onDrop)):(f(V,"mousemove",this._onTouchMove),f(V,"mouseup",this._onDrop)),this._loopId=setInterval(this._emulateDragOver,50)):(c&&(c.effectAllowed="move",d.setData&&d.setData.call(this,c,w)),f(V,"drop",this),setTimeout(this._dragStarted,0))},_onDragOver:function(d){var e,f,g,h,j=this.el,k=this.options,m=k.group,p=a.active,q=L===m,r=!1,s=k.sort;if(void 0!==d.preventDefault&&(d.preventDefault(),!k.dragoverBubble&&d.stopPropagation()),!w.animated&&(P=!0,p&&!k.disabled&&(q?s||(h=!A.contains(w)):M===this||(p.lastPullMode=L.checkPull(this,p,w,d))&&m.checkPut(this,p,w,d))&&(void 0===d.rootEl||d.rootEl===this.el))){if(fa(d,k,this.el),aa)return;if(e=c(d.target,k.draggable,j),f=w.getBoundingClientRect(),M!==this&&(M=this,r=!0),h)return b(p,!0),x=A,void(z||B?A.insertBefore(w,z||B):s||A.appendChild(w));if(0===j.children.length||j.children[0]===y||j===d.target&&o(j,d)){if(0!==j.children.length&&j.children[0]!==y&&j===d.target&&(e=j.lastElementChild),e){if(e.animated)return;g=e.getBoundingClientRect()}b(p,q),l(A,j,w,f,e,g,d)!==!1&&(w.contains(j)||(j.appendChild(w),x=j),this._animate(f,w),e&&this._animate(g,e))}else if(e&&!e.animated&&e!==w&&void 0!==e.parentNode[T]){G!==e&&(G=e,H=i(e),I=i(e.parentNode)),g=e.getBoundingClientRect();var t=g.right-g.left,u=g.bottom-g.top,v=S.test(H.cssFloat+H.display)||"flex"==I.display&&0===I["flex-direction"].indexOf("row"),C=e.offsetWidth>w.offsetWidth,D=e.offsetHeight>w.offsetHeight,E=(v?(d.clientX-g.left)/t:(d.clientY-g.top)/u)>.5,F=e.nextElementSibling,J=!1;if(v){var K=w.offsetTop,N=e.offsetTop;J=K===N?e.previousElementSibling===w&&!C||E&&C:e.previousElementSibling===w||w.previousElementSibling===e?(d.clientY-g.top)/u>.5:N>K}else r||(J=F!==w&&!D||E&&D);var O=l(A,j,w,f,e,g,d,J);O!==!1&&(1!==O&&O!==-1||(J=1===O),aa=!0,setTimeout(n,30),b(p,q),w.contains(j)||(J&&!F?j.appendChild(w):e.parentNode.insertBefore(w,J?F:e)),x=w.parentNode,this._animate(f,w),this._animate(g,e))}}},_animate:function(a,b){var c=this.options.animation;if(c){var d=b.getBoundingClientRect();1===a.nodeType&&(a=a.getBoundingClientRect()),i(b,"transition","none"),i(b,"transform","translate3d("+(a.left-d.left)+"px,"+(a.top-d.top)+"px,0)"),b.offsetWidth,i(b,"transition","all "+c+"ms"),i(b,"transform","translate3d(0,0,0)"),clearTimeout(b.animated),b.animated=setTimeout(function(){i(b,"transition",""),i(b,"transform",""),b.animated=!1},c)}},_offUpEvents:function(){var a=this.el.ownerDocument;g(V,"touchmove",this._onTouchMove),g(V,"pointermove",this._onTouchMove),g(a,"mouseup",this._onDrop),g(a,"touchend",this._onDrop),g(a,"pointerup",this._onDrop),g(a,"touchcancel",this._onDrop),g(a,"pointercancel",this._onDrop),g(a,"selectstart",this)},_onDrop:function(b){var c=this.el,d=this.options;clearInterval(this._loopId),clearInterval(Q.pid),clearTimeout(this._dragStartTimer),g(V,"mousemove",this._onTouchMove),this.nativeDraggable&&(g(V,"drop",this),g(c,"dragstart",this._onDragStart)),this._offUpEvents(),b&&(P&&(b.preventDefault(),!d.dropBubble&&b.stopPropagation()),y&&y.parentNode&&y.parentNode.removeChild(y),A!==x&&"clone"===a.active.lastPullMode||z&&z.parentNode&&z.parentNode.removeChild(z),w&&(this.nativeDraggable&&g(w,"dragend",this),m(w),w.style["will-change"]="",h(w,this.options.ghostClass,!1),h(w,this.options.chosenClass,!1),k(this,A,"unchoose",w,A,J),A!==x?(K=q(w,d.draggable),K>=0&&(k(null,x,"add",w,A,J,K),k(this,A,"remove",w,A,J,K),k(null,x,"sort",w,A,J,K),k(this,A,"sort",w,A,J,K))):w.nextSibling!==B&&(K=q(w,d.draggable),K>=0&&(k(this,A,"update",w,A,J,K),k(this,A,"sort",w,A,J,K))),a.active&&(null!=K&&K!==-1||(K=J),k(this,A,"end",w,A,J,K),this.save()))),this._nulling()},_nulling:function(){A=w=x=y=B=z=C=D=E=N=O=P=K=G=H=M=L=a.active=null,da.forEach(function(a){a.checked=!0}),da.length=0},handleEvent:function(a){switch(a.type){case"drop":case"dragend":this._onDrop(a);break;case"dragover":case"dragenter":w&&(this._onDragOver(a),e(a));break;case"selectstart":a.preventDefault()}},toArray:function(){for(var a,b=[],d=this.el.children,e=0,f=d.length,g=this.options;e<f;e++)a=d[e],c(a,g.draggable,this.el)&&b.push(a.getAttribute(g.dataIdAttr)||p(a));return b},sort:function(a){var b={},d=this.el;this.toArray().forEach(function(a,e){var f=d.children[e];c(f,this.options.draggable,d)&&(b[a]=f)},this),a.forEach(function(a){b[a]&&(d.removeChild(b[a]),d.appendChild(b[a]))})},save:function(){var a=this.options.store;a&&a.set(this)},closest:function(a,b){return c(a,b||this.options.draggable,this.el)},option:function(a,b){var c=this.options;return void 0===b?c[a]:(c[a]=b,void("group"===a&&ga(c)))},destroy:function(){var a=this.el;a[T]=null,g(a,"mousedown",this._onTapStart),g(a,"touchstart",this._onTapStart),g(a,"pointerdown",this._onTapStart),this.nativeDraggable&&(g(a,"dragover",this),g(a,"dragenter",this)),Array.prototype.forEach.call(a.querySelectorAll("[draggable]"),function(a){a.removeAttribute("draggable")}),ea.splice(ea.indexOf(this._onDragOver),1),this._onDrop(),this.el=a=null}},f(V,"touchmove",function(b){a.active&&b.preventDefault()});try{window.addEventListener("test",null,Object.defineProperty({},"passive",{get:function(){Z={capture:!1,passive:!1}}}))}catch(a){}return a.utils={on:f,off:g,css:i,find:j,is:function(a,b){return!!c(a,b,a)},extend:t,throttle:s,closest:c,toggleClass:h,clone:u,index:q},a.create=function(b,c){return new a(b,c)},a.version="1.6.0",a});

/*
 *
 * More info at [www.dropzonejs.com](http://www.dropzonejs.com)
 *
 * Copyright (c) 2012, Matias Meno
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

(function() {
  var Dropzone, Emitter, camelize, contentLoaded, detectVerticalSquash, drawImageIOSFix, noop, without,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  noop = function() {};

  Emitter = (function() {
    function Emitter() {}

    Emitter.prototype.addEventListener = Emitter.prototype.on;

    Emitter.prototype.on = function(event, fn) {
      this._callbacks = this._callbacks || {};
      if (!this._callbacks[event]) {
        this._callbacks[event] = [];
      }
      this._callbacks[event].push(fn);
      return this;
    };

    Emitter.prototype.emit = function() {
      var args, callback, callbacks, event, _i, _len;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._callbacks = this._callbacks || {};
      callbacks = this._callbacks[event];
      if (callbacks) {
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          callback.apply(this, args);
        }
      }
      return this;
    };

    Emitter.prototype.removeListener = Emitter.prototype.off;

    Emitter.prototype.removeAllListeners = Emitter.prototype.off;

    Emitter.prototype.removeEventListener = Emitter.prototype.off;

    Emitter.prototype.off = function(event, fn) {
      var callback, callbacks, i, _i, _len;
      if (!this._callbacks || arguments.length === 0) {
        this._callbacks = {};
        return this;
      }
      callbacks = this._callbacks[event];
      if (!callbacks) {
        return this;
      }
      if (arguments.length === 1) {
        delete this._callbacks[event];
        return this;
      }
      for (i = _i = 0, _len = callbacks.length; _i < _len; i = ++_i) {
        callback = callbacks[i];
        if (callback === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }
      return this;
    };

    return Emitter;

  })();

  Dropzone = (function(_super) {
    var extend, resolveOption;

    __extends(Dropzone, _super);

    Dropzone.prototype.Emitter = Emitter;


    /*
    This is a list of all available events you can register on a dropzone object.
    
    You can register an event handler like this:
    
        dropzone.on("dragEnter", function() { });
     */

    Dropzone.prototype.events = ["drop", "dragstart", "dragend", "dragenter", "dragover", "dragleave", "addedfile", "removedfile", "thumbnail", "error", "errormultiple", "processing", "processingmultiple", "uploadprogress", "totaluploadprogress", "sending", "sendingmultiple", "success", "successmultiple", "canceled", "canceledmultiple", "complete", "completemultiple", "reset", "maxfilesexceeded", "maxfilesreached", "queuecomplete"];

    Dropzone.prototype.defaultOptions = {
      url: null,
      method: "post",
      withCredentials: false,
      parallelUploads: 2,
      uploadMultiple: false,
      maxFilesize: 256,
      paramName: "file",
      createImageThumbnails: true,
      maxThumbnailFilesize: 10,
      thumbnailWidth: 120,
      thumbnailHeight: 120,
      filesizeBase: 1000,
      maxFiles: null,
      filesizeBase: 1000,
      params: {},
      clickable: true,
      ignoreHiddenFiles: true,
      acceptedFiles: null,
      acceptedMimeTypes: null,
      autoProcessQueue: true,
      autoQueue: true,
      addRemoveLinks: false,
      previewsContainer: null,
      capture: null,
      dictDefaultMessage: "Drop files here to upload",
      dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
      dictFallbackText: "Please use the fallback form below to upload your files like in the olden days.",
      dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
      dictInvalidFileType: "You can't upload files of this type.",
      dictResponseError: "Server responded with {{statusCode}} code.",
      dictCancelUpload: "Cancel upload",
      dictCancelUploadConfirmation: "Are you sure you want to cancel this upload?",
      dictRemoveFile: "Remove file",
      dictRemoveFileConfirmation: null,
      dictMaxFilesExceeded: "You can not upload any more files.",
      accept: function(file, done) {
        return done();
      },
      init: function() {
        return noop;
      },
      forceFallback: false,
      fallback: function() {
        var child, messageElement, span, _i, _len, _ref;
        this.element.className = "" + this.element.className + " dz-browser-not-supported";
        _ref = this.element.getElementsByTagName("div");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (/(^| )dz-message($| )/.test(child.className)) {
            messageElement = child;
            child.className = "dz-message";
            continue;
          }
        }
        if (!messageElement) {
          messageElement = Dropzone.createElement("<div class=\"dz-message\"><span></span></div>");
          this.element.appendChild(messageElement);
        }
        span = messageElement.getElementsByTagName("span")[0];
        if (span) {
          span.textContent = this.options.dictFallbackMessage;
        }
        return this.element.appendChild(this.getFallbackForm());
      },
      resize: function(file) {
        var info, srcRatio, trgRatio;
        info = {
          srcX: 0,
          srcY: 0,
          srcWidth: file.width,
          srcHeight: file.height
        };
        srcRatio = file.width / file.height;
        info.optWidth = this.options.thumbnailWidth;
        info.optHeight = this.options.thumbnailHeight;
        if ((info.optWidth == null) && (info.optHeight == null)) {
          info.optWidth = info.srcWidth;
          info.optHeight = info.srcHeight;
        } else if (info.optWidth == null) {
          info.optWidth = srcRatio * info.optHeight;
        } else if (info.optHeight == null) {
          info.optHeight = (1 / srcRatio) * info.optWidth;
        }
        trgRatio = info.optWidth / info.optHeight;
        if (file.height < info.optHeight || file.width < info.optWidth) {
          info.trgHeight = info.srcHeight;
          info.trgWidth = info.srcWidth;
        } else {
          if (srcRatio > trgRatio) {
            info.srcHeight = file.height;
            info.srcWidth = info.srcHeight * trgRatio;
          } else {
            info.srcWidth = file.width;
            info.srcHeight = info.srcWidth / trgRatio;
          }
        }
        info.srcX = (file.width - info.srcWidth) / 2;
        info.srcY = (file.height - info.srcHeight) / 2;
        return info;
      },

      /*
      Those functions register themselves to the events on init and handle all
      the user interface specific stuff. Overwriting them won't break the upload
      but can break the way it's displayed.
      You can overwrite them if you don't like the default behavior. If you just
      want to add an additional event handler, register it on the dropzone object
      and don't overwrite those options.
       */
      drop: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragstart: noop,
      dragend: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragenter: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragover: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragleave: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      paste: noop,
      reset: function() {
        return this.element.classList.remove("dz-started");
      },
      addedfile: function(file) {
        var node, removeFileEvent, removeLink, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
        if (this.element === this.previewsContainer) {
          this.element.classList.add("dz-started");
        }
        if (this.previewsContainer) {
          file.previewElement = Dropzone.createElement(this.options.previewTemplate.trim());
          file.previewTemplate = file.previewElement;
          this.previewsContainer.appendChild(file.previewElement);
          _ref = file.previewElement.querySelectorAll("[data-dz-name]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.textContent = file.name;
          }
          _ref1 = file.previewElement.querySelectorAll("[data-dz-size]");
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            node.innerHTML = this.filesize(file.size);
          }
          if (this.options.addRemoveLinks) {
            file._removeLink = Dropzone.createElement("<a class=\"dz-remove\" href=\"javascript:undefined;\" data-dz-remove>" + this.options.dictRemoveFile + "</a>");
            file.previewElement.appendChild(file._removeLink);
          }
          removeFileEvent = (function(_this) {
            return function(e) {
              e.preventDefault();
              e.stopPropagation();
              if (file.status === Dropzone.UPLOADING) {
                return Dropzone.confirm(_this.options.dictCancelUploadConfirmation, function() {
                  return _this.removeFile(file);
                });
              } else {
                if (_this.options.dictRemoveFileConfirmation) {
                  return Dropzone.confirm(_this.options.dictRemoveFileConfirmation, function() {
                    return _this.removeFile(file);
                  });
                } else {
                  return _this.removeFile(file);
                }
              }
            };
          })(this);
          _ref2 = file.previewElement.querySelectorAll("[data-dz-remove]");
          _results = [];
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            removeLink = _ref2[_k];
            _results.push(removeLink.addEventListener("click", removeFileEvent));
          }
          return _results;
        }
      },
      removedfile: function(file) {
        var _ref;
        if (file.previewElement) {
          if ((_ref = file.previewElement) != null) {
            _ref.parentNode.removeChild(file.previewElement);
          }
        }
        return this._updateMaxFilesReachedClass();
      },
      thumbnail: function(file, dataUrl) {
        var thumbnailElement, _i, _len, _ref;
        if (file.previewElement) {
          file.previewElement.classList.remove("dz-file-preview");
          _ref = file.previewElement.querySelectorAll("[data-dz-thumbnail]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            thumbnailElement = _ref[_i];
            thumbnailElement.alt = file.name;
            thumbnailElement.src = dataUrl;
          }
          return setTimeout(((function(_this) {
            return function() {
              return file.previewElement.classList.add("dz-image-preview");
            };
          })(this)), 1);
        }
      },
      error: function(file, message) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          file.previewElement.classList.add("dz-error");
          if (typeof message !== "String" && message.error) {
            message = message.error;
          }
          _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            _results.push(node.textContent = message);
          }
          return _results;
        }
      },
      errormultiple: noop,
      processing: function(file) {
        if (file.previewElement) {
          file.previewElement.classList.add("dz-processing");
          if (file._removeLink) {
            return file._removeLink.textContent = this.options.dictCancelUpload;
          }
        }
      },
      processingmultiple: noop,
      uploadprogress: function(file, progress, bytesSent) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          _ref = file.previewElement.querySelectorAll("[data-dz-uploadprogress]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            if (node.nodeName === 'PROGRESS') {
              _results.push(node.value = progress);
            } else {
              _results.push(node.style.width = "" + progress + "%");
            }
          }
          return _results;
        }
      },
      totaluploadprogress: noop,
      sending: noop,
      sendingmultiple: noop,
      success: function(file) {
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-success");
        }
      },
      successmultiple: noop,
      canceled: function(file) {
        return this.emit("error", file, "Upload canceled.");
      },
      canceledmultiple: noop,
      complete: function(file) {
        if (file._removeLink) {
          file._removeLink.textContent = this.options.dictRemoveFile;
        }
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-complete");
        }
      },
      completemultiple: noop,
      maxfilesexceeded: noop,
      maxfilesreached: noop,
      queuecomplete: noop,
      previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n  <div class=\"dz-image\"><img data-dz-thumbnail /></div>\n  <div class=\"dz-details\">\n    <div class=\"dz-size\"><span data-dz-size></span></div>\n    <div class=\"dz-filename\"><span data-dz-name></span></div>\n  </div>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div>\n  <div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n  <div class=\"dz-success-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Check</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" stroke-opacity=\"0.198794158\" stroke=\"#747474\" fill-opacity=\"0.816519475\" fill=\"#FFFFFF\" sketch:type=\"MSShapeGroup\"></path>\n      </g>\n    </svg>\n  </div>\n  <div class=\"dz-error-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Error</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <g id=\"Check-+-Oval-2\" sketch:type=\"MSLayerGroup\" stroke=\"#747474\" stroke-opacity=\"0.198794158\" fill=\"#FFFFFF\" fill-opacity=\"0.816519475\">\n          <path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" sketch:type=\"MSShapeGroup\"></path>\n        </g>\n      </g>\n    </svg>\n  </div>\n</div>"
    };

    extend = function() {
      var key, object, objects, target, val, _i, _len;
      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        for (key in object) {
          val = object[key];
          target[key] = val;
        }
      }
      return target;
    };

    function Dropzone(element, options) {
      var elementOptions, fallback, _ref;
      this.element = element;
      this.version = Dropzone.version;
      this.defaultOptions.previewTemplate = this.defaultOptions.previewTemplate.replace(/\n*/g, "");
      this.clickableElements = [];
      this.listeners = [];
      this.files = [];
      if (typeof this.element === "string") {
        this.element = document.querySelector(this.element);
      }
      if (!(this.element && (this.element.nodeType != null))) {
        throw new Error("Invalid dropzone element.");
      }
      if (this.element.dropzone) {
        throw new Error("Dropzone already attached.");
      }
      Dropzone.instances.push(this);
      this.element.dropzone = this;
      elementOptions = (_ref = Dropzone.optionsForElement(this.element)) != null ? _ref : {};
      this.options = extend({}, this.defaultOptions, elementOptions, options != null ? options : {});
      if (this.options.forceFallback || !Dropzone.isBrowserSupported()) {
        return this.options.fallback.call(this);
      }
      if (this.options.url == null) {
        this.options.url = this.element.getAttribute("action");
      }
      if (!this.options.url) {
        throw new Error("No URL provided.");
      }
      if (this.options.acceptedFiles && this.options.acceptedMimeTypes) {
        throw new Error("You can't provide both 'acceptedFiles' and 'acceptedMimeTypes'. 'acceptedMimeTypes' is deprecated.");
      }
      if (this.options.acceptedMimeTypes) {
        this.options.acceptedFiles = this.options.acceptedMimeTypes;
        delete this.options.acceptedMimeTypes;
      }
      this.options.method = this.options.method.toUpperCase();
      if ((fallback = this.getExistingFallback()) && fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
      if (this.options.previewsContainer !== false) {
        if (this.options.previewsContainer) {
          this.previewsContainer = Dropzone.getElement(this.options.previewsContainer, "previewsContainer");
        } else {
          this.previewsContainer = this.element;
        }
      }
      if (this.options.clickable) {
        if (this.options.clickable === true) {
          this.clickableElements = [this.element];
        } else {
          this.clickableElements = Dropzone.getElements(this.options.clickable, "clickable");
        }
      }
      this.init();
    }

    Dropzone.prototype.getAcceptedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getRejectedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (!file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getFilesWithStatus = function(status) {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === status) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getQueuedFiles = function() {
      return this.getFilesWithStatus(Dropzone.QUEUED);
    };

    Dropzone.prototype.getUploadingFiles = function() {
      return this.getFilesWithStatus(Dropzone.UPLOADING);
    };

    Dropzone.prototype.getActiveFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === Dropzone.UPLOADING || file.status === Dropzone.QUEUED) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.init = function() {
      var eventName, noPropagation, setupHiddenFileInput, _i, _len, _ref, _ref1;
      if (this.element.tagName === "form") {
        this.element.setAttribute("enctype", "multipart/form-data");
      }
      if (this.element.classList.contains("dropzone") && !this.element.querySelector(".dz-message")) {
        this.element.appendChild(Dropzone.createElement("<div class=\"dz-default dz-message\"><span>" + this.options.dictDefaultMessage + "</span></div>"));
      }
      if (this.clickableElements.length) {
        setupHiddenFileInput = (function(_this) {
          return function() {
            if (_this.hiddenFileInput) {
              document.body.removeChild(_this.hiddenFileInput);
            }
            _this.hiddenFileInput = document.createElement("input");
            _this.hiddenFileInput.setAttribute("type", "file");
            if ((_this.options.maxFiles == null) || _this.options.maxFiles > 1) {
              _this.hiddenFileInput.setAttribute("multiple", "multiple");
            }
            _this.hiddenFileInput.className = "dz-hidden-input";
            if (_this.options.acceptedFiles != null) {
              _this.hiddenFileInput.setAttribute("accept", _this.options.acceptedFiles);
            }
            if (_this.options.capture != null) {
              _this.hiddenFileInput.setAttribute("capture", _this.options.capture);
            }
            _this.hiddenFileInput.style.visibility = "hidden";
            _this.hiddenFileInput.style.position = "absolute";
            _this.hiddenFileInput.style.top = "0";
            _this.hiddenFileInput.style.left = "0";
            _this.hiddenFileInput.style.height = "0";
            _this.hiddenFileInput.style.width = "0";
            document.body.appendChild(_this.hiddenFileInput);
            return _this.hiddenFileInput.addEventListener("change", function() {
              var file, files, _i, _len;
              files = _this.hiddenFileInput.files;
              if (files.length) {
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  _this.addFile(file);
                }
              }
              return setupHiddenFileInput();
            });
          };
        })(this);
        setupHiddenFileInput();
      }
      this.URL = (_ref = window.URL) != null ? _ref : window.webkitURL;
      _ref1 = this.events;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        eventName = _ref1[_i];
        this.on(eventName, this.options[eventName]);
      }
      this.on("uploadprogress", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("removedfile", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("canceled", (function(_this) {
        return function(file) {
          return _this.emit("complete", file);
        };
      })(this));
      this.on("complete", (function(_this) {
        return function(file) {
          if (_this.getUploadingFiles().length === 0 && _this.getQueuedFiles().length === 0) {
            return setTimeout((function() {
              return _this.emit("queuecomplete");
            }), 0);
          }
        };
      })(this));
      noPropagation = function(e) {
        e.stopPropagation();
        if (e.preventDefault) {
          return e.preventDefault();
        } else {
          return e.returnValue = false;
        }
      };
      this.listeners = [
        {
          element: this.element,
          events: {
            "dragstart": (function(_this) {
              return function(e) {
                return _this.emit("dragstart", e);
              };
            })(this),
            "dragenter": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.emit("dragenter", e);
              };
            })(this),
            "dragover": (function(_this) {
              return function(e) {
                var efct;
                try {
                  efct = e.dataTransfer.effectAllowed;
                } catch (_error) {}
                e.dataTransfer.dropEffect = 'move' === efct || 'linkMove' === efct ? 'move' : 'copy';
                noPropagation(e);
                return _this.emit("dragover", e);
              };
            })(this),
            "dragleave": (function(_this) {
              return function(e) {
                return _this.emit("dragleave", e);
              };
            })(this),
            "drop": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.drop(e);
              };
            })(this),
            "dragend": (function(_this) {
              return function(e) {
                return _this.emit("dragend", e);
              };
            })(this)
          }
        }
      ];
      this.clickableElements.forEach((function(_this) {
        return function(clickableElement) {
          return _this.listeners.push({
            element: clickableElement,
            events: {
              "click": function(evt) {
                if ((clickableElement !== _this.element) || (evt.target === _this.element || Dropzone.elementInside(evt.target, _this.element.querySelector(".dz-message")))) {
                  return _this.hiddenFileInput.click();
                }
              }
            }
          });
        };
      })(this));
      this.enable();
      return this.options.init.call(this);
    };

    Dropzone.prototype.destroy = function() {
      var _ref;
      this.disable();
      this.removeAllFiles(true);
      if ((_ref = this.hiddenFileInput) != null ? _ref.parentNode : void 0) {
        this.hiddenFileInput.parentNode.removeChild(this.hiddenFileInput);
        this.hiddenFileInput = null;
      }
      delete this.element.dropzone;
      return Dropzone.instances.splice(Dropzone.instances.indexOf(this), 1);
    };

    Dropzone.prototype.updateTotalUploadProgress = function() {
      var activeFiles, file, totalBytes, totalBytesSent, totalUploadProgress, _i, _len, _ref;
      totalBytesSent = 0;
      totalBytes = 0;
      activeFiles = this.getActiveFiles();
      if (activeFiles.length) {
        _ref = this.getActiveFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          totalBytesSent += file.upload.bytesSent;
          totalBytes += file.upload.total;
        }
        totalUploadProgress = 100 * totalBytesSent / totalBytes;
      } else {
        totalUploadProgress = 100;
      }
      return this.emit("totaluploadprogress", totalUploadProgress, totalBytes, totalBytesSent);
    };

    Dropzone.prototype._getParamName = function(n) {
      if (typeof this.options.paramName === "function") {
        return this.options.paramName(n);
      } else {
        return "" + this.options.paramName + (this.options.uploadMultiple ? "[" + n + "]" : "");
      }
    };

    Dropzone.prototype.getFallbackForm = function() {
      var existingFallback, fields, fieldsString, form;
      if (existingFallback = this.getExistingFallback()) {
        return existingFallback;
      }
      fieldsString = "<div class=\"dz-fallback\">";
      if (this.options.dictFallbackText) {
        fieldsString += "<p>" + this.options.dictFallbackText + "</p>";
      }
      fieldsString += "<input type=\"file\" name=\"" + (this._getParamName(0)) + "\" " + (this.options.uploadMultiple ? 'multiple="multiple"' : void 0) + " /><input type=\"submit\" value=\"Upload!\"></div>";
      fields = Dropzone.createElement(fieldsString);
      if (this.element.tagName !== "FORM") {
        form = Dropzone.createElement("<form action=\"" + this.options.url + "\" enctype=\"multipart/form-data\" method=\"" + this.options.method + "\"></form>");
        form.appendChild(fields);
      } else {
        this.element.setAttribute("enctype", "multipart/form-data");
        this.element.setAttribute("method", this.options.method);
      }
      return form != null ? form : fields;
    };

    Dropzone.prototype.getExistingFallback = function() {
      var fallback, getFallback, tagName, _i, _len, _ref;
      getFallback = function(elements) {
        var el, _i, _len;
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )fallback($| )/.test(el.className)) {
            return el;
          }
        }
      };
      _ref = ["div", "form"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tagName = _ref[_i];
        if (fallback = getFallback(this.element.getElementsByTagName(tagName))) {
          return fallback;
        }
      }
    };

    Dropzone.prototype.setupEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.addEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.removeEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.removeEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.disable = function() {
      var file, _i, _len, _ref, _results;
      this.clickableElements.forEach(function(element) {
        return element.classList.remove("dz-clickable");
      });
      this.removeEventListeners();
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        _results.push(this.cancelUpload(file));
      }
      return _results;
    };

    Dropzone.prototype.enable = function() {
      this.clickableElements.forEach(function(element) {
        return element.classList.add("dz-clickable");
      });
      return this.setupEventListeners();
    };

    Dropzone.prototype.filesize = function(size) {
      var cutoff, i, selectedSize, selectedUnit, unit, units, _i, _len;
      units = ['TB', 'GB', 'MB', 'KB', 'b'];
      selectedSize = selectedUnit = null;
      for (i = _i = 0, _len = units.length; _i < _len; i = ++_i) {
        unit = units[i];
        cutoff = Math.pow(this.options.filesizeBase, 4 - i) / 10;
        if (size >= cutoff) {
          selectedSize = size / Math.pow(this.options.filesizeBase, 4 - i);
          selectedUnit = unit;
          break;
        }
      }
      selectedSize = Math.round(10 * selectedSize) / 10;
      return "<strong>" + selectedSize + "</strong> " + selectedUnit;
    };

    Dropzone.prototype._updateMaxFilesReachedClass = function() {
      if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        if (this.getAcceptedFiles().length === this.options.maxFiles) {
          this.emit('maxfilesreached', this.files);
        }
        return this.element.classList.add("dz-max-files-reached");
      } else {
        return this.element.classList.remove("dz-max-files-reached");
      }
    };

    Dropzone.prototype.drop = function(e) {
      var files, items;
      if (!e.dataTransfer) {
        return;
      }
      this.emit("drop", e);
      files = e.dataTransfer.files;
      if (files.length) {
        items = e.dataTransfer.items;
        if (items && items.length && (items[0].webkitGetAsEntry != null)) {
          this._addFilesFromItems(items);
        } else {
          this.handleFiles(files);
        }
      }
    };

    Dropzone.prototype.paste = function(e) {
      var items, _ref;
      if ((e != null ? (_ref = e.clipboardData) != null ? _ref.items : void 0 : void 0) == null) {
        return;
      }
      this.emit("paste", e);
      items = e.clipboardData.items;
      if (items.length) {
        return this._addFilesFromItems(items);
      }
    };

    Dropzone.prototype.handleFiles = function(files) {
      var file, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        _results.push(this.addFile(file));
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromItems = function(items) {
      var entry, item, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if ((item.webkitGetAsEntry != null) && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) {
            _results.push(this.addFile(item.getAsFile()));
          } else if (entry.isDirectory) {
            _results.push(this._addFilesFromDirectory(entry, entry.name));
          } else {
            _results.push(void 0);
          }
        } else if (item.getAsFile != null) {
          if ((item.kind == null) || item.kind === "file") {
            _results.push(this.addFile(item.getAsFile()));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromDirectory = function(directory, path) {
      var dirReader, entriesReader;
      dirReader = directory.createReader();
      entriesReader = (function(_this) {
        return function(entries) {
          var entry, _i, _len;
          for (_i = 0, _len = entries.length; _i < _len; _i++) {
            entry = entries[_i];
            if (entry.isFile) {
              entry.file(function(file) {
                if (_this.options.ignoreHiddenFiles && file.name.substring(0, 1) === '.') {
                  return;
                }
                file.fullPath = "" + path + "/" + file.name;
                return _this.addFile(file);
              });
            } else if (entry.isDirectory) {
              _this._addFilesFromDirectory(entry, "" + path + "/" + entry.name);
            }
          }
        };
      })(this);
      return dirReader.readEntries(entriesReader, function(error) {
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log(error) : void 0 : void 0;
      });
    };

    Dropzone.prototype.accept = function(file, done) {
      if (file.size > this.options.maxFilesize * 1024 * 1024) {
        return done(this.options.dictFileTooBig.replace("{{filesize}}", Math.round(file.size / 1024 / 10.24) / 100).replace("{{maxFilesize}}", this.options.maxFilesize));
      } else if (!Dropzone.isValidFile(file, this.options.acceptedFiles)) {
        return done(this.options.dictInvalidFileType);
      } else if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        done(this.options.dictMaxFilesExceeded.replace("{{maxFiles}}", this.options.maxFiles));
        return this.emit("maxfilesexceeded", file);
      } else {
        return this.options.accept.call(this, file, done);
      }
    };

    Dropzone.prototype.addFile = function(file) {
      file.upload = {
        progress: 0,
        total: file.size,
        bytesSent: 0
      };
      this.files.push(file);
      file.status = Dropzone.ADDED;
      this.emit("addedfile", file);
      this._enqueueThumbnail(file);
      return this.accept(file, (function(_this) {
        return function(error) {
          if (error) {
            file.accepted = false;
            _this._errorProcessing([file], error);
          } else {
            file.accepted = true;
            if (_this.options.autoQueue) {
              _this.enqueueFile(file);
            }
          }
          return _this._updateMaxFilesReachedClass();
        };
      })(this));
    };

    Dropzone.prototype.enqueueFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        this.enqueueFile(file);
      }
      return null;
    };

    Dropzone.prototype.enqueueFile = function(file) {
      if (file.status === Dropzone.ADDED && file.accepted === true) {
        file.status = Dropzone.QUEUED;
        if (this.options.autoProcessQueue) {
          return setTimeout(((function(_this) {
            return function() {
              return _this.processQueue();
            };
          })(this)), 0);
        }
      } else {
        throw new Error("This file can't be queued because it has already been processed or was rejected.");
      }
    };

    Dropzone.prototype._thumbnailQueue = [];

    Dropzone.prototype._processingThumbnail = false;

    Dropzone.prototype._enqueueThumbnail = function(file) {
      if (this.options.createImageThumbnails && file.type.match(/image.*/) && file.size <= this.options.maxThumbnailFilesize * 1024 * 1024) {
        this._thumbnailQueue.push(file);
        return setTimeout(((function(_this) {
          return function() {
            return _this._processThumbnailQueue();
          };
        })(this)), 0);
      }
    };

    Dropzone.prototype._processThumbnailQueue = function() {
      if (this._processingThumbnail || this._thumbnailQueue.length === 0) {
        return;
      }
      this._processingThumbnail = true;
      return this.createThumbnail(this._thumbnailQueue.shift(), (function(_this) {
        return function() {
          _this._processingThumbnail = false;
          return _this._processThumbnailQueue();
        };
      })(this));
    };

    Dropzone.prototype.removeFile = function(file) {
      if (file.status === Dropzone.UPLOADING) {
        this.cancelUpload(file);
      }
      this.files = without(this.files, file);
      this.emit("removedfile", file);
      if (this.files.length === 0) {
        return this.emit("reset");
      }
    };

    Dropzone.prototype.removeAllFiles = function(cancelIfNecessary) {
      var file, _i, _len, _ref;
      if (cancelIfNecessary == null) {
        cancelIfNecessary = false;
      }
      _ref = this.files.slice();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status !== Dropzone.UPLOADING || cancelIfNecessary) {
          this.removeFile(file);
        }
      }
      return null;
    };

    Dropzone.prototype.createThumbnail = function(file, callback) {
      var fileReader;
      fileReader = new FileReader;
      fileReader.onload = (function(_this) {
        return function() {
          if (file.type === "image/svg+xml") {
            _this.emit("thumbnail", file, fileReader.result);
            if (callback != null) {
              callback();
            }
            return;
          }
          return _this.createThumbnailFromUrl(file, fileReader.result, callback);
        };
      })(this);
      return fileReader.readAsDataURL(file);
    };

    Dropzone.prototype.createThumbnailFromUrl = function(file, imageUrl, callback) {
      var img;
      img = document.createElement("img");
      img.onload = (function(_this) {
        return function() {
          var canvas, ctx, resizeInfo, thumbnail, _ref, _ref1, _ref2, _ref3;
          file.width = img.width;
          file.height = img.height;
          resizeInfo = _this.options.resize.call(_this, file);
          if (resizeInfo.trgWidth == null) {
            resizeInfo.trgWidth = resizeInfo.optWidth;
          }
          if (resizeInfo.trgHeight == null) {
            resizeInfo.trgHeight = resizeInfo.optHeight;
          }
          canvas = document.createElement("canvas");
          ctx = canvas.getContext("2d");
          canvas.width = resizeInfo.trgWidth;
          canvas.height = resizeInfo.trgHeight;
          drawImageIOSFix(ctx, img, (_ref = resizeInfo.srcX) != null ? _ref : 0, (_ref1 = resizeInfo.srcY) != null ? _ref1 : 0, resizeInfo.srcWidth, resizeInfo.srcHeight, (_ref2 = resizeInfo.trgX) != null ? _ref2 : 0, (_ref3 = resizeInfo.trgY) != null ? _ref3 : 0, resizeInfo.trgWidth, resizeInfo.trgHeight);
          thumbnail = canvas.toDataURL("image/png");
          _this.emit("thumbnail", file, thumbnail);
          if (callback != null) {
            return callback();
          }
        };
      })(this);
      if (callback != null) {
        img.onerror = callback;
      }
      return img.src = imageUrl;
    };

    Dropzone.prototype.processQueue = function() {
      var i, parallelUploads, processingLength, queuedFiles;
      parallelUploads = this.options.parallelUploads;
      processingLength = this.getUploadingFiles().length;
      i = processingLength;
      if (processingLength >= parallelUploads) {
        return;
      }
      queuedFiles = this.getQueuedFiles();
      if (!(queuedFiles.length > 0)) {
        return;
      }
      if (this.options.uploadMultiple) {
        return this.processFiles(queuedFiles.slice(0, parallelUploads - processingLength));
      } else {
        while (i < parallelUploads) {
          if (!queuedFiles.length) {
            return;
          }
          this.processFile(queuedFiles.shift());
          i++;
        }
      }
    };

    Dropzone.prototype.processFile = function(file) {
      return this.processFiles([file]);
    };

    Dropzone.prototype.processFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.processing = true;
        file.status = Dropzone.UPLOADING;
        this.emit("processing", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("processingmultiple", files);
      }
      return this.uploadFiles(files);
    };

    Dropzone.prototype._getFilesWithXhr = function(xhr) {
      var file, files;
      return files = (function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          if (file.xhr === xhr) {
            _results.push(file);
          }
        }
        return _results;
      }).call(this);
    };

    Dropzone.prototype.cancelUpload = function(file) {
      var groupedFile, groupedFiles, _i, _j, _len, _len1, _ref;
      if (file.status === Dropzone.UPLOADING) {
        groupedFiles = this._getFilesWithXhr(file.xhr);
        for (_i = 0, _len = groupedFiles.length; _i < _len; _i++) {
          groupedFile = groupedFiles[_i];
          groupedFile.status = Dropzone.CANCELED;
        }
        file.xhr.abort();
        for (_j = 0, _len1 = groupedFiles.length; _j < _len1; _j++) {
          groupedFile = groupedFiles[_j];
          this.emit("canceled", groupedFile);
        }
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", groupedFiles);
        }
      } else if ((_ref = file.status) === Dropzone.ADDED || _ref === Dropzone.QUEUED) {
        file.status = Dropzone.CANCELED;
        this.emit("canceled", file);
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", [file]);
        }
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    resolveOption = function() {
      var args, option;
      option = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (typeof option === 'function') {
        return option.apply(this, args);
      }
      return option;
    };

    Dropzone.prototype.uploadFile = function(file) {
      return this.uploadFiles([file]);
    };

    Dropzone.prototype.uploadFiles = function(files) {
      var file, formData, handleError, headerName, headerValue, headers, i, input, inputName, inputType, key, method, option, progressObj, response, updateProgress, url, value, xhr, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      xhr = new XMLHttpRequest();
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.xhr = xhr;
      }
      method = resolveOption(this.options.method, files);
      url = resolveOption(this.options.url, files);
      xhr.open(method, url, true);
      xhr.withCredentials = !!this.options.withCredentials;
      response = null;
      handleError = (function(_this) {
        return function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
            file = files[_j];
            _results.push(_this._errorProcessing(files, response || _this.options.dictResponseError.replace("{{statusCode}}", xhr.status), xhr));
          }
          return _results;
        };
      })(this);
      updateProgress = (function(_this) {
        return function(e) {
          var allFilesFinished, progress, _j, _k, _l, _len1, _len2, _len3, _results;
          if (e != null) {
            progress = 100 * e.loaded / e.total;
            for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
              file = files[_j];
              file.upload = {
                progress: progress,
                total: e.total,
                bytesSent: e.loaded
              };
            }
          } else {
            allFilesFinished = true;
            progress = 100;
            for (_k = 0, _len2 = files.length; _k < _len2; _k++) {
              file = files[_k];
              if (!(file.upload.progress === 100 && file.upload.bytesSent === file.upload.total)) {
                allFilesFinished = false;
              }
              file.upload.progress = progress;
              file.upload.bytesSent = file.upload.total;
            }
            if (allFilesFinished) {
              return;
            }
          }
          _results = [];
          for (_l = 0, _len3 = files.length; _l < _len3; _l++) {
            file = files[_l];
            _results.push(_this.emit("uploadprogress", file, progress, file.upload.bytesSent));
          }
          return _results;
        };
      })(this);
      xhr.onload = (function(_this) {
        return function(e) {
          var _ref;
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          if (xhr.readyState !== 4) {
            return;
          }
          response = xhr.responseText;
          if (xhr.getResponseHeader("content-type") && ~xhr.getResponseHeader("content-type").indexOf("application/json")) {
            try {
              response = JSON.parse(response);
            } catch (_error) {
              e = _error;
              response = "Invalid JSON response from server.";
            }
          }
          updateProgress();
          if (!((200 <= (_ref = xhr.status) && _ref < 300))) {
            return handleError();
          } else {
            return _this._finished(files, response, e);
          }
        };
      })(this);
      xhr.onerror = (function(_this) {
        return function() {
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          return handleError();
        };
      })(this);
      progressObj = (_ref = xhr.upload) != null ? _ref : xhr;
      progressObj.onprogress = updateProgress;
      headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "X-Requested-With": "XMLHttpRequest"
      };
      if (this.options.headers) {
        extend(headers, this.options.headers);
      }
      for (headerName in headers) {
        headerValue = headers[headerName];
        xhr.setRequestHeader(headerName, headerValue);
      }
      formData = new FormData();
      if (this.options.params) {
        _ref1 = this.options.params;
        for (key in _ref1) {
          value = _ref1[key];
          formData.append(key, value);
        }
      }
      for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
        file = files[_j];
        this.emit("sending", file, xhr, formData);
      }
      if (this.options.uploadMultiple) {
        this.emit("sendingmultiple", files, xhr, formData);
      }
      if (this.element.tagName === "FORM") {
        _ref2 = this.element.querySelectorAll("input, textarea, select, button");
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          input = _ref2[_k];
          inputName = input.getAttribute("name");
          inputType = input.getAttribute("type");
          if (input.tagName === "SELECT" && input.hasAttribute("multiple")) {
            _ref3 = input.options;
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              option = _ref3[_l];
              if (option.selected) {
                formData.append(inputName, option.value);
              }
            }
          } else if (!inputType || ((_ref4 = inputType.toLowerCase()) !== "checkbox" && _ref4 !== "radio") || input.checked) {
            formData.append(inputName, input.value);
          }
        }
      }
      for (i = _m = 0, _ref5 = files.length - 1; 0 <= _ref5 ? _m <= _ref5 : _m >= _ref5; i = 0 <= _ref5 ? ++_m : --_m) {
        formData.append(this._getParamName(i), files[i], files[i].name);
      }
      return xhr.send(formData);
    };

    Dropzone.prototype._finished = function(files, responseText, e) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.SUCCESS;
        this.emit("success", file, responseText, e);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("successmultiple", files, responseText, e);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    Dropzone.prototype._errorProcessing = function(files, message, xhr) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.ERROR;
        this.emit("error", file, message, xhr);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("errormultiple", files, message, xhr);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    return Dropzone;

  })(Emitter);

  Dropzone.version = "4.0.1";

  Dropzone.options = {};

  Dropzone.optionsForElement = function(element) {
    if (element.getAttribute("id")) {
      return Dropzone.options[camelize(element.getAttribute("id"))];
    } else {
      return void 0;
    }
  };

  Dropzone.instances = [];

  Dropzone.forElement = function(element) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if ((element != null ? element.dropzone : void 0) == null) {
      throw new Error("No Dropzone found for given element. This is probably because you're trying to access it before Dropzone had the time to initialize. Use the `init` option to setup any additional observers on your Dropzone.");
    }
    return element.dropzone;
  };

  Dropzone.autoDiscover = true;

  Dropzone.discover = function() {
    var checkElements, dropzone, dropzones, _i, _len, _results;
    if (document.querySelectorAll) {
      dropzones = document.querySelectorAll(".dropzone");
    } else {
      dropzones = [];
      checkElements = function(elements) {
        var el, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )dropzone($| )/.test(el.className)) {
            _results.push(dropzones.push(el));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      checkElements(document.getElementsByTagName("div"));
      checkElements(document.getElementsByTagName("form"));
    }
    _results = [];
    for (_i = 0, _len = dropzones.length; _i < _len; _i++) {
      dropzone = dropzones[_i];
      if (Dropzone.optionsForElement(dropzone) !== false) {
        _results.push(new Dropzone(dropzone));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Dropzone.blacklistedBrowsers = [/opera.*Macintosh.*version\/12/i];

  Dropzone.isBrowserSupported = function() {
    var capableBrowser, regex, _i, _len, _ref;
    capableBrowser = true;
    if (window.File && window.FileReader && window.FileList && window.Blob && window.FormData && document.querySelector) {
      if (!("classList" in document.createElement("a"))) {
        capableBrowser = false;
      } else {
        _ref = Dropzone.blacklistedBrowsers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          regex = _ref[_i];
          if (regex.test(navigator.userAgent)) {
            capableBrowser = false;
            continue;
          }
        }
      }
    } else {
      capableBrowser = false;
    }
    return capableBrowser;
  };

  without = function(list, rejectedItem) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      item = list[_i];
      if (item !== rejectedItem) {
        _results.push(item);
      }
    }
    return _results;
  };

  camelize = function(str) {
    return str.replace(/[\-_](\w)/g, function(match) {
      return match.charAt(1).toUpperCase();
    });
  };

  Dropzone.createElement = function(string) {
    var div;
    div = document.createElement("div");
    div.innerHTML = string;
    return div.childNodes[0];
  };

  Dropzone.elementInside = function(element, container) {
    if (element === container) {
      return true;
    }
    while (element = element.parentNode) {
      if (element === container) {
        return true;
      }
    }
    return false;
  };

  Dropzone.getElement = function(el, name) {
    var element;
    if (typeof el === "string") {
      element = document.querySelector(el);
    } else if (el.nodeType != null) {
      element = el;
    }
    if (element == null) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector or a plain HTML element.");
    }
    return element;
  };

  Dropzone.getElements = function(els, name) {
    var e, el, elements, _i, _j, _len, _len1, _ref;
    if (els instanceof Array) {
      elements = [];
      try {
        for (_i = 0, _len = els.length; _i < _len; _i++) {
          el = els[_i];
          elements.push(this.getElement(el, name));
        }
      } catch (_error) {
        e = _error;
        elements = null;
      }
    } else if (typeof els === "string") {
      elements = [];
      _ref = document.querySelectorAll(els);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        el = _ref[_j];
        elements.push(el);
      }
    } else if (els.nodeType != null) {
      elements = [els];
    }
    if (!((elements != null) && elements.length)) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector, a plain HTML element or a list of those.");
    }
    return elements;
  };

  Dropzone.confirm = function(question, accepted, rejected) {
    if (window.confirm(question)) {
      return accepted();
    } else if (rejected != null) {
      return rejected();
    }
  };

  Dropzone.isValidFile = function(file, acceptedFiles) {
    var baseMimeType, mimeType, validType, _i, _len;
    if (!acceptedFiles) {
      return true;
    }
    acceptedFiles = acceptedFiles.split(",");
    mimeType = file.type;
    baseMimeType = mimeType.replace(/\/.*$/, "");
    for (_i = 0, _len = acceptedFiles.length; _i < _len; _i++) {
      validType = acceptedFiles[_i];
      validType = validType.trim();
      if (validType.charAt(0) === ".") {
        if (file.name.toLowerCase().indexOf(validType.toLowerCase(), file.name.length - validType.length) !== -1) {
          return true;
        }
      } else if (/\/\*$/.test(validType)) {
        if (baseMimeType === validType.replace(/\/.*$/, "")) {
          return true;
        }
      } else {
        if (mimeType === validType) {
          return true;
        }
      }
    }
    return false;
  };

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.fn.dropzone = function(options) {
      return this.each(function() {
        return new Dropzone(this, options);
      });
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Dropzone;
  } else {
    window.Dropzone = Dropzone;
  }

  Dropzone.ADDED = "added";

  Dropzone.QUEUED = "queued";

  Dropzone.ACCEPTED = Dropzone.QUEUED;

  Dropzone.UPLOADING = "uploading";

  Dropzone.PROCESSING = Dropzone.UPLOADING;

  Dropzone.CANCELED = "canceled";

  Dropzone.ERROR = "error";

  Dropzone.SUCCESS = "success";


  /*
  
  Bugfix for iOS 6 and 7
  Source: http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
  based on the work of https://github.com/stomita/ios-imagefile-megapixel
   */

  detectVerticalSquash = function(img) {
    var alpha, canvas, ctx, data, ey, ih, iw, py, ratio, sy;
    iw = img.naturalWidth;
    ih = img.naturalHeight;
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = ih;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    data = ctx.getImageData(0, 0, 1, ih).data;
    sy = 0;
    ey = ih;
    py = ih;
    while (py > sy) {
      alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    ratio = py / ih;
    if (ratio === 0) {
      return 1;
    } else {
      return ratio;
    }
  };

  drawImageIOSFix = function(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    var vertSquashRatio;
    vertSquashRatio = detectVerticalSquash(img);
    return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
  };


  /*
   * contentloaded.js
   *
   * Author: Diego Perini (diego.perini at gmail.com)
   * Summary: cross-browser wrapper for DOMContentLoaded
   * Updated: 20101020
   * License: MIT
   * Version: 1.2
   *
   * URL:
   * http://javascript.nwbox.com/ContentLoaded/
   * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
   */

  contentLoaded = function(win, fn) {
    var add, doc, done, init, poll, pre, rem, root, top;
    done = false;
    top = true;
    doc = win.document;
    root = doc.documentElement;
    add = (doc.addEventListener ? "addEventListener" : "attachEvent");
    rem = (doc.addEventListener ? "removeEventListener" : "detachEvent");
    pre = (doc.addEventListener ? "" : "on");
    init = function(e) {
      if (e.type === "readystatechange" && doc.readyState !== "complete") {
        return;
      }
      (e.type === "load" ? win : doc)[rem](pre + e.type, init, false);
      if (!done && (done = true)) {
        return fn.call(win, e.type || e);
      }
    };
    poll = function() {
      var e;
      try {
        root.doScroll("left");
      } catch (_error) {
        e = _error;
        setTimeout(poll, 50);
        return;
      }
      return init("poll");
    };
    if (doc.readyState !== "complete") {
      if (doc.createEventObject && root.doScroll) {
        try {
          top = !win.frameElement;
        } catch (_error) {}
        if (top) {
          poll();
        }
      }
      doc[add](pre + "DOMContentLoaded", init, false);
      doc[add](pre + "readystatechange", init, false);
      return win[add](pre + "load", init, false);
    }
  };

  Dropzone._autoDiscoverFunction = function() {
    if (Dropzone.autoDiscover) {
      return Dropzone.discover();
    }
  };

  contentLoaded(window, Dropzone._autoDiscoverFunction);

}).call(this);

//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
!function(a,b){"object"==typeof exports&&"undefined"!=typeof module?module.exports=b():"function"==typeof define&&define.amd?define(b):a.moment=b()}(this,function(){"use strict";function a(){return sd.apply(null,arguments)}function b(a){sd=a}function c(a){return a instanceof Array||"[object Array]"===Object.prototype.toString.call(a)}function d(a){return null!=a&&"[object Object]"===Object.prototype.toString.call(a)}function e(a){var b;for(b in a)return!1;return!0}function f(a){return void 0===a}function g(a){return"number"==typeof a||"[object Number]"===Object.prototype.toString.call(a)}function h(a){return a instanceof Date||"[object Date]"===Object.prototype.toString.call(a)}function i(a,b){var c,d=[];for(c=0;c<a.length;++c)d.push(b(a[c],c));return d}function j(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function k(a,b){for(var c in b)j(b,c)&&(a[c]=b[c]);return j(b,"toString")&&(a.toString=b.toString),j(b,"valueOf")&&(a.valueOf=b.valueOf),a}function l(a,b,c,d){return sb(a,b,c,d,!0).utc()}function m(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1,parsedDateParts:[],meridiem:null,rfc2822:!1,weekdayMismatch:!1}}function n(a){return null==a._pf&&(a._pf=m()),a._pf}function o(a){if(null==a._isValid){var b=n(a),c=ud.call(b.parsedDateParts,function(a){return null!=a}),d=!isNaN(a._d.getTime())&&b.overflow<0&&!b.empty&&!b.invalidMonth&&!b.invalidWeekday&&!b.nullInput&&!b.invalidFormat&&!b.userInvalidated&&(!b.meridiem||b.meridiem&&c);if(a._strict&&(d=d&&0===b.charsLeftOver&&0===b.unusedTokens.length&&void 0===b.bigHour),null!=Object.isFrozen&&Object.isFrozen(a))return d;a._isValid=d}return a._isValid}function p(a){var b=l(NaN);return null!=a?k(n(b),a):n(b).userInvalidated=!0,b}function q(a,b){var c,d,e;if(f(b._isAMomentObject)||(a._isAMomentObject=b._isAMomentObject),f(b._i)||(a._i=b._i),f(b._f)||(a._f=b._f),f(b._l)||(a._l=b._l),f(b._strict)||(a._strict=b._strict),f(b._tzm)||(a._tzm=b._tzm),f(b._isUTC)||(a._isUTC=b._isUTC),f(b._offset)||(a._offset=b._offset),f(b._pf)||(a._pf=n(b)),f(b._locale)||(a._locale=b._locale),vd.length>0)for(c=0;c<vd.length;c++)d=vd[c],e=b[d],f(e)||(a[d]=e);return a}function r(b){q(this,b),this._d=new Date(null!=b._d?b._d.getTime():NaN),this.isValid()||(this._d=new Date(NaN)),wd===!1&&(wd=!0,a.updateOffset(this),wd=!1)}function s(a){return a instanceof r||null!=a&&null!=a._isAMomentObject}function t(a){return a<0?Math.ceil(a)||0:Math.floor(a)}function u(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=t(b)),c}function v(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;d<e;d++)(c&&a[d]!==b[d]||!c&&u(a[d])!==u(b[d]))&&g++;return g+f}function w(b){a.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+b)}function x(b,c){var d=!0;return k(function(){if(null!=a.deprecationHandler&&a.deprecationHandler(null,b),d){for(var e,f=[],g=0;g<arguments.length;g++){if(e="","object"==typeof arguments[g]){e+="\n["+g+"] ";for(var h in arguments[0])e+=h+": "+arguments[0][h]+", ";e=e.slice(0,-2)}else e=arguments[g];f.push(e)}w(b+"\nArguments: "+Array.prototype.slice.call(f).join("")+"\n"+(new Error).stack),d=!1}return c.apply(this,arguments)},c)}function y(b,c){null!=a.deprecationHandler&&a.deprecationHandler(b,c),xd[b]||(w(c),xd[b]=!0)}function z(a){return a instanceof Function||"[object Function]"===Object.prototype.toString.call(a)}function A(a){var b,c;for(c in a)b=a[c],z(b)?this[c]=b:this["_"+c]=b;this._config=a,this._dayOfMonthOrdinalParseLenient=new RegExp((this._dayOfMonthOrdinalParse.source||this._ordinalParse.source)+"|"+/\d{1,2}/.source)}function B(a,b){var c,e=k({},a);for(c in b)j(b,c)&&(d(a[c])&&d(b[c])?(e[c]={},k(e[c],a[c]),k(e[c],b[c])):null!=b[c]?e[c]=b[c]:delete e[c]);for(c in a)j(a,c)&&!j(b,c)&&d(a[c])&&(e[c]=k({},e[c]));return e}function C(a){null!=a&&this.set(a)}function D(a,b,c){var d=this._calendar[a]||this._calendar.sameElse;return z(d)?d.call(b,c):d}function E(a){var b=this._longDateFormat[a],c=this._longDateFormat[a.toUpperCase()];return b||!c?b:(this._longDateFormat[a]=c.replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a])}function F(){return this._invalidDate}function G(a){return this._ordinal.replace("%d",a)}function H(a,b,c,d){var e=this._relativeTime[c];return z(e)?e(a,b,c,d):e.replace(/%d/i,a)}function I(a,b){var c=this._relativeTime[a>0?"future":"past"];return z(c)?c(b):c.replace(/%s/i,b)}function J(a,b){var c=a.toLowerCase();Hd[c]=Hd[c+"s"]=Hd[b]=a}function K(a){return"string"==typeof a?Hd[a]||Hd[a.toLowerCase()]:void 0}function L(a){var b,c,d={};for(c in a)j(a,c)&&(b=K(c),b&&(d[b]=a[c]));return d}function M(a,b){Id[a]=b}function N(a){var b=[];for(var c in a)b.push({unit:c,priority:Id[c]});return b.sort(function(a,b){return a.priority-b.priority}),b}function O(b,c){return function(d){return null!=d?(Q(this,b,d),a.updateOffset(this,c),this):P(this,b)}}function P(a,b){return a.isValid()?a._d["get"+(a._isUTC?"UTC":"")+b]():NaN}function Q(a,b,c){a.isValid()&&a._d["set"+(a._isUTC?"UTC":"")+b](c)}function R(a){return a=K(a),z(this[a])?this[a]():this}function S(a,b){if("object"==typeof a){a=L(a);for(var c=N(a),d=0;d<c.length;d++)this[c[d].unit](a[c[d].unit])}else if(a=K(a),z(this[a]))return this[a](b);return this}function T(a,b,c){var d=""+Math.abs(a),e=b-d.length,f=a>=0;return(f?c?"+":"":"-")+Math.pow(10,Math.max(0,e)).toString().substr(1)+d}function U(a,b,c,d){var e=d;"string"==typeof d&&(e=function(){return this[d]()}),a&&(Md[a]=e),b&&(Md[b[0]]=function(){return T(e.apply(this,arguments),b[1],b[2])}),c&&(Md[c]=function(){return this.localeData().ordinal(e.apply(this,arguments),a)})}function V(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function W(a){var b,c,d=a.match(Jd);for(b=0,c=d.length;b<c;b++)Md[d[b]]?d[b]=Md[d[b]]:d[b]=V(d[b]);return function(b){var e,f="";for(e=0;e<c;e++)f+=z(d[e])?d[e].call(b,a):d[e];return f}}function X(a,b){return a.isValid()?(b=Y(b,a.localeData()),Ld[b]=Ld[b]||W(b),Ld[b](a)):a.localeData().invalidDate()}function Y(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(Kd.lastIndex=0;d>=0&&Kd.test(a);)a=a.replace(Kd,c),Kd.lastIndex=0,d-=1;return a}function Z(a,b,c){ce[a]=z(b)?b:function(a,d){return a&&c?c:b}}function $(a,b){return j(ce,a)?ce[a](b._strict,b._locale):new RegExp(_(a))}function _(a){return aa(a.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e}))}function aa(a){return a.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function ba(a,b){var c,d=b;for("string"==typeof a&&(a=[a]),g(b)&&(d=function(a,c){c[b]=u(a)}),c=0;c<a.length;c++)de[a[c]]=d}function ca(a,b){ba(a,function(a,c,d,e){d._w=d._w||{},b(a,d._w,d,e)})}function da(a,b,c){null!=b&&j(de,a)&&de[a](b,c._a,c,a)}function ea(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function fa(a,b){return a?c(this._months)?this._months[a.month()]:this._months[(this._months.isFormat||oe).test(b)?"format":"standalone"][a.month()]:c(this._months)?this._months:this._months.standalone}function ga(a,b){return a?c(this._monthsShort)?this._monthsShort[a.month()]:this._monthsShort[oe.test(b)?"format":"standalone"][a.month()]:c(this._monthsShort)?this._monthsShort:this._monthsShort.standalone}function ha(a,b,c){var d,e,f,g=a.toLocaleLowerCase();if(!this._monthsParse)for(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[],d=0;d<12;++d)f=l([2e3,d]),this._shortMonthsParse[d]=this.monthsShort(f,"").toLocaleLowerCase(),this._longMonthsParse[d]=this.months(f,"").toLocaleLowerCase();return c?"MMM"===b?(e=ne.call(this._shortMonthsParse,g),e!==-1?e:null):(e=ne.call(this._longMonthsParse,g),e!==-1?e:null):"MMM"===b?(e=ne.call(this._shortMonthsParse,g),e!==-1?e:(e=ne.call(this._longMonthsParse,g),e!==-1?e:null)):(e=ne.call(this._longMonthsParse,g),e!==-1?e:(e=ne.call(this._shortMonthsParse,g),e!==-1?e:null))}function ia(a,b,c){var d,e,f;if(this._monthsParseExact)return ha.call(this,a,b,c);for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),d=0;d<12;d++){if(e=l([2e3,d]),c&&!this._longMonthsParse[d]&&(this._longMonthsParse[d]=new RegExp("^"+this.months(e,"").replace(".","")+"$","i"),this._shortMonthsParse[d]=new RegExp("^"+this.monthsShort(e,"").replace(".","")+"$","i")),c||this._monthsParse[d]||(f="^"+this.months(e,"")+"|^"+this.monthsShort(e,""),this._monthsParse[d]=new RegExp(f.replace(".",""),"i")),c&&"MMMM"===b&&this._longMonthsParse[d].test(a))return d;if(c&&"MMM"===b&&this._shortMonthsParse[d].test(a))return d;if(!c&&this._monthsParse[d].test(a))return d}}function ja(a,b){var c;if(!a.isValid())return a;if("string"==typeof b)if(/^\d+$/.test(b))b=u(b);else if(b=a.localeData().monthsParse(b),!g(b))return a;return c=Math.min(a.date(),ea(a.year(),b)),a._d["set"+(a._isUTC?"UTC":"")+"Month"](b,c),a}function ka(b){return null!=b?(ja(this,b),a.updateOffset(this,!0),this):P(this,"Month")}function la(){return ea(this.year(),this.month())}function ma(a){return this._monthsParseExact?(j(this,"_monthsRegex")||oa.call(this),a?this._monthsShortStrictRegex:this._monthsShortRegex):(j(this,"_monthsShortRegex")||(this._monthsShortRegex=re),this._monthsShortStrictRegex&&a?this._monthsShortStrictRegex:this._monthsShortRegex)}function na(a){return this._monthsParseExact?(j(this,"_monthsRegex")||oa.call(this),a?this._monthsStrictRegex:this._monthsRegex):(j(this,"_monthsRegex")||(this._monthsRegex=se),this._monthsStrictRegex&&a?this._monthsStrictRegex:this._monthsRegex)}function oa(){function a(a,b){return b.length-a.length}var b,c,d=[],e=[],f=[];for(b=0;b<12;b++)c=l([2e3,b]),d.push(this.monthsShort(c,"")),e.push(this.months(c,"")),f.push(this.months(c,"")),f.push(this.monthsShort(c,""));for(d.sort(a),e.sort(a),f.sort(a),b=0;b<12;b++)d[b]=aa(d[b]),e[b]=aa(e[b]);for(b=0;b<24;b++)f[b]=aa(f[b]);this._monthsRegex=new RegExp("^("+f.join("|")+")","i"),this._monthsShortRegex=this._monthsRegex,this._monthsStrictRegex=new RegExp("^("+e.join("|")+")","i"),this._monthsShortStrictRegex=new RegExp("^("+d.join("|")+")","i")}function pa(a){return qa(a)?366:365}function qa(a){return a%4===0&&a%100!==0||a%400===0}function ra(){return qa(this.year())}function sa(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return a<100&&a>=0&&isFinite(h.getFullYear())&&h.setFullYear(a),h}function ta(a){var b=new Date(Date.UTC.apply(null,arguments));return a<100&&a>=0&&isFinite(b.getUTCFullYear())&&b.setUTCFullYear(a),b}function ua(a,b,c){var d=7+b-c,e=(7+ta(a,0,d).getUTCDay()-b)%7;return-e+d-1}function va(a,b,c,d,e){var f,g,h=(7+c-d)%7,i=ua(a,d,e),j=1+7*(b-1)+h+i;return j<=0?(f=a-1,g=pa(f)+j):j>pa(a)?(f=a+1,g=j-pa(a)):(f=a,g=j),{year:f,dayOfYear:g}}function wa(a,b,c){var d,e,f=ua(a.year(),b,c),g=Math.floor((a.dayOfYear()-f-1)/7)+1;return g<1?(e=a.year()-1,d=g+xa(e,b,c)):g>xa(a.year(),b,c)?(d=g-xa(a.year(),b,c),e=a.year()+1):(e=a.year(),d=g),{week:d,year:e}}function xa(a,b,c){var d=ua(a,b,c),e=ua(a+1,b,c);return(pa(a)-d+e)/7}function ya(a){return wa(a,this._week.dow,this._week.doy).week}function za(){return this._week.dow}function Aa(){return this._week.doy}function Ba(a){var b=this.localeData().week(this);return null==a?b:this.add(7*(a-b),"d")}function Ca(a){var b=wa(this,1,4).week;return null==a?b:this.add(7*(a-b),"d")}function Da(a,b){return"string"!=typeof a?a:isNaN(a)?(a=b.weekdaysParse(a),"number"==typeof a?a:null):parseInt(a,10)}function Ea(a,b){return"string"==typeof a?b.weekdaysParse(a)%7||7:isNaN(a)?null:a}function Fa(a,b){return a?c(this._weekdays)?this._weekdays[a.day()]:this._weekdays[this._weekdays.isFormat.test(b)?"format":"standalone"][a.day()]:c(this._weekdays)?this._weekdays:this._weekdays.standalone}function Ga(a){return a?this._weekdaysShort[a.day()]:this._weekdaysShort}function Ha(a){return a?this._weekdaysMin[a.day()]:this._weekdaysMin}function Ia(a,b,c){var d,e,f,g=a.toLocaleLowerCase();if(!this._weekdaysParse)for(this._weekdaysParse=[],this._shortWeekdaysParse=[],this._minWeekdaysParse=[],d=0;d<7;++d)f=l([2e3,1]).day(d),this._minWeekdaysParse[d]=this.weekdaysMin(f,"").toLocaleLowerCase(),this._shortWeekdaysParse[d]=this.weekdaysShort(f,"").toLocaleLowerCase(),this._weekdaysParse[d]=this.weekdays(f,"").toLocaleLowerCase();return c?"dddd"===b?(e=ne.call(this._weekdaysParse,g),e!==-1?e:null):"ddd"===b?(e=ne.call(this._shortWeekdaysParse,g),e!==-1?e:null):(e=ne.call(this._minWeekdaysParse,g),e!==-1?e:null):"dddd"===b?(e=ne.call(this._weekdaysParse,g),e!==-1?e:(e=ne.call(this._shortWeekdaysParse,g),e!==-1?e:(e=ne.call(this._minWeekdaysParse,g),e!==-1?e:null))):"ddd"===b?(e=ne.call(this._shortWeekdaysParse,g),e!==-1?e:(e=ne.call(this._weekdaysParse,g),e!==-1?e:(e=ne.call(this._minWeekdaysParse,g),e!==-1?e:null))):(e=ne.call(this._minWeekdaysParse,g),e!==-1?e:(e=ne.call(this._weekdaysParse,g),e!==-1?e:(e=ne.call(this._shortWeekdaysParse,g),e!==-1?e:null)))}function Ja(a,b,c){var d,e,f;if(this._weekdaysParseExact)return Ia.call(this,a,b,c);for(this._weekdaysParse||(this._weekdaysParse=[],this._minWeekdaysParse=[],this._shortWeekdaysParse=[],this._fullWeekdaysParse=[]),d=0;d<7;d++){if(e=l([2e3,1]).day(d),c&&!this._fullWeekdaysParse[d]&&(this._fullWeekdaysParse[d]=new RegExp("^"+this.weekdays(e,"").replace(".",".?")+"$","i"),this._shortWeekdaysParse[d]=new RegExp("^"+this.weekdaysShort(e,"").replace(".",".?")+"$","i"),this._minWeekdaysParse[d]=new RegExp("^"+this.weekdaysMin(e,"").replace(".",".?")+"$","i")),this._weekdaysParse[d]||(f="^"+this.weekdays(e,"")+"|^"+this.weekdaysShort(e,"")+"|^"+this.weekdaysMin(e,""),this._weekdaysParse[d]=new RegExp(f.replace(".",""),"i")),c&&"dddd"===b&&this._fullWeekdaysParse[d].test(a))return d;if(c&&"ddd"===b&&this._shortWeekdaysParse[d].test(a))return d;if(c&&"dd"===b&&this._minWeekdaysParse[d].test(a))return d;if(!c&&this._weekdaysParse[d].test(a))return d}}function Ka(a){if(!this.isValid())return null!=a?this:NaN;var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=Da(a,this.localeData()),this.add(a-b,"d")):b}function La(a){if(!this.isValid())return null!=a?this:NaN;var b=(this.day()+7-this.localeData()._week.dow)%7;return null==a?b:this.add(a-b,"d")}function Ma(a){if(!this.isValid())return null!=a?this:NaN;if(null!=a){var b=Ea(a,this.localeData());return this.day(this.day()%7?b:b-7)}return this.day()||7}function Na(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysStrictRegex:this._weekdaysRegex):(j(this,"_weekdaysRegex")||(this._weekdaysRegex=ye),this._weekdaysStrictRegex&&a?this._weekdaysStrictRegex:this._weekdaysRegex)}function Oa(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysShortStrictRegex:this._weekdaysShortRegex):(j(this,"_weekdaysShortRegex")||(this._weekdaysShortRegex=ze),this._weekdaysShortStrictRegex&&a?this._weekdaysShortStrictRegex:this._weekdaysShortRegex)}function Pa(a){return this._weekdaysParseExact?(j(this,"_weekdaysRegex")||Qa.call(this),a?this._weekdaysMinStrictRegex:this._weekdaysMinRegex):(j(this,"_weekdaysMinRegex")||(this._weekdaysMinRegex=Ae),this._weekdaysMinStrictRegex&&a?this._weekdaysMinStrictRegex:this._weekdaysMinRegex)}function Qa(){function a(a,b){return b.length-a.length}var b,c,d,e,f,g=[],h=[],i=[],j=[];for(b=0;b<7;b++)c=l([2e3,1]).day(b),d=this.weekdaysMin(c,""),e=this.weekdaysShort(c,""),f=this.weekdays(c,""),g.push(d),h.push(e),i.push(f),j.push(d),j.push(e),j.push(f);for(g.sort(a),h.sort(a),i.sort(a),j.sort(a),b=0;b<7;b++)h[b]=aa(h[b]),i[b]=aa(i[b]),j[b]=aa(j[b]);this._weekdaysRegex=new RegExp("^("+j.join("|")+")","i"),this._weekdaysShortRegex=this._weekdaysRegex,this._weekdaysMinRegex=this._weekdaysRegex,this._weekdaysStrictRegex=new RegExp("^("+i.join("|")+")","i"),this._weekdaysShortStrictRegex=new RegExp("^("+h.join("|")+")","i"),this._weekdaysMinStrictRegex=new RegExp("^("+g.join("|")+")","i")}function Ra(){return this.hours()%12||12}function Sa(){return this.hours()||24}function Ta(a,b){U(a,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),b)})}function Ua(a,b){return b._meridiemParse}function Va(a){return"p"===(a+"").toLowerCase().charAt(0)}function Wa(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"}function Xa(a){return a?a.toLowerCase().replace("_","-"):a}function Ya(a){for(var b,c,d,e,f=0;f<a.length;){for(e=Xa(a[f]).split("-"),b=e.length,c=Xa(a[f+1]),c=c?c.split("-"):null;b>0;){if(d=Za(e.slice(0,b).join("-")))return d;if(c&&c.length>=b&&v(e,c,!0)>=b-1)break;b--}f++}return null}function Za(a){var b=null;if(!Fe[a]&&"undefined"!=typeof module&&module&&module.exports)try{b=Be._abbr,require("./locale/"+a),$a(b)}catch(a){}return Fe[a]}function $a(a,b){var c;return a&&(c=f(b)?bb(a):_a(a,b),c&&(Be=c)),Be._abbr}function _a(a,b){if(null!==b){var c=Ee;if(b.abbr=a,null!=Fe[a])y("defineLocaleOverride","use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."),c=Fe[a]._config;else if(null!=b.parentLocale){if(null==Fe[b.parentLocale])return Ge[b.parentLocale]||(Ge[b.parentLocale]=[]),Ge[b.parentLocale].push({name:a,config:b}),null;c=Fe[b.parentLocale]._config}return Fe[a]=new C(B(c,b)),Ge[a]&&Ge[a].forEach(function(a){_a(a.name,a.config)}),$a(a),Fe[a]}return delete Fe[a],null}function ab(a,b){if(null!=b){var c,d=Ee;null!=Fe[a]&&(d=Fe[a]._config),b=B(d,b),c=new C(b),c.parentLocale=Fe[a],Fe[a]=c,$a(a)}else null!=Fe[a]&&(null!=Fe[a].parentLocale?Fe[a]=Fe[a].parentLocale:null!=Fe[a]&&delete Fe[a]);return Fe[a]}function bb(a){var b;if(a&&a._locale&&a._locale._abbr&&(a=a._locale._abbr),!a)return Be;if(!c(a)){if(b=Za(a))return b;a=[a]}return Ya(a)}function cb(){return Ad(Fe)}function db(a){var b,c=a._a;return c&&n(a).overflow===-2&&(b=c[fe]<0||c[fe]>11?fe:c[ge]<1||c[ge]>ea(c[ee],c[fe])?ge:c[he]<0||c[he]>24||24===c[he]&&(0!==c[ie]||0!==c[je]||0!==c[ke])?he:c[ie]<0||c[ie]>59?ie:c[je]<0||c[je]>59?je:c[ke]<0||c[ke]>999?ke:-1,n(a)._overflowDayOfYear&&(b<ee||b>ge)&&(b=ge),n(a)._overflowWeeks&&b===-1&&(b=le),n(a)._overflowWeekday&&b===-1&&(b=me),n(a).overflow=b),a}function eb(a){var b,c,d,e,f,g,h=a._i,i=He.exec(h)||Ie.exec(h);if(i){for(n(a).iso=!0,b=0,c=Ke.length;b<c;b++)if(Ke[b][1].exec(i[1])){e=Ke[b][0],d=Ke[b][2]!==!1;break}if(null==e)return void(a._isValid=!1);if(i[3]){for(b=0,c=Le.length;b<c;b++)if(Le[b][1].exec(i[3])){f=(i[2]||" ")+Le[b][0];break}if(null==f)return void(a._isValid=!1)}if(!d&&null!=f)return void(a._isValid=!1);if(i[4]){if(!Je.exec(i[4]))return void(a._isValid=!1);g="Z"}a._f=e+(f||"")+(g||""),lb(a)}else a._isValid=!1}function fb(a){var b,c,d,e,f,g,h,i,j={" GMT":" +0000"," EDT":" -0400"," EST":" -0500"," CDT":" -0500"," CST":" -0600"," MDT":" -0600"," MST":" -0700"," PDT":" -0700"," PST":" -0800"},k="YXWVUTSRQPONZABCDEFGHIKLM";if(b=a._i.replace(/\([^\)]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").replace(/^\s|\s$/g,""),c=Ne.exec(b)){if(d=c[1]?"ddd"+(5===c[1].length?", ":" "):"",e="D MMM "+(c[2].length>10?"YYYY ":"YY "),f="HH:mm"+(c[4]?":ss":""),c[1]){var l=new Date(c[2]),m=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][l.getDay()];if(c[1].substr(0,3)!==m)return n(a).weekdayMismatch=!0,void(a._isValid=!1)}switch(c[5].length){case 2:0===i?h=" +0000":(i=k.indexOf(c[5][1].toUpperCase())-12,h=(i<0?" -":" +")+(""+i).replace(/^-?/,"0").match(/..$/)[0]+"00");break;case 4:h=j[c[5]];break;default:h=j[" GMT"]}c[5]=h,a._i=c.splice(1).join(""),g=" ZZ",a._f=d+e+f+g,lb(a),n(a).rfc2822=!0}else a._isValid=!1}function gb(b){var c=Me.exec(b._i);return null!==c?void(b._d=new Date(+c[1])):(eb(b),void(b._isValid===!1&&(delete b._isValid,fb(b),b._isValid===!1&&(delete b._isValid,a.createFromInputFallback(b)))))}function hb(a,b,c){return null!=a?a:null!=b?b:c}function ib(b){var c=new Date(a.now());return b._useUTC?[c.getUTCFullYear(),c.getUTCMonth(),c.getUTCDate()]:[c.getFullYear(),c.getMonth(),c.getDate()]}function jb(a){var b,c,d,e,f=[];if(!a._d){for(d=ib(a),a._w&&null==a._a[ge]&&null==a._a[fe]&&kb(a),null!=a._dayOfYear&&(e=hb(a._a[ee],d[ee]),(a._dayOfYear>pa(e)||0===a._dayOfYear)&&(n(a)._overflowDayOfYear=!0),c=ta(e,0,a._dayOfYear),a._a[fe]=c.getUTCMonth(),a._a[ge]=c.getUTCDate()),b=0;b<3&&null==a._a[b];++b)a._a[b]=f[b]=d[b];for(;b<7;b++)a._a[b]=f[b]=null==a._a[b]?2===b?1:0:a._a[b];24===a._a[he]&&0===a._a[ie]&&0===a._a[je]&&0===a._a[ke]&&(a._nextDay=!0,a._a[he]=0),a._d=(a._useUTC?ta:sa).apply(null,f),null!=a._tzm&&a._d.setUTCMinutes(a._d.getUTCMinutes()-a._tzm),a._nextDay&&(a._a[he]=24)}}function kb(a){var b,c,d,e,f,g,h,i;if(b=a._w,null!=b.GG||null!=b.W||null!=b.E)f=1,g=4,c=hb(b.GG,a._a[ee],wa(tb(),1,4).year),d=hb(b.W,1),e=hb(b.E,1),(e<1||e>7)&&(i=!0);else{f=a._locale._week.dow,g=a._locale._week.doy;var j=wa(tb(),f,g);c=hb(b.gg,a._a[ee],j.year),d=hb(b.w,j.week),null!=b.d?(e=b.d,(e<0||e>6)&&(i=!0)):null!=b.e?(e=b.e+f,(b.e<0||b.e>6)&&(i=!0)):e=f}d<1||d>xa(c,f,g)?n(a)._overflowWeeks=!0:null!=i?n(a)._overflowWeekday=!0:(h=va(c,d,e,f,g),a._a[ee]=h.year,a._dayOfYear=h.dayOfYear)}function lb(b){if(b._f===a.ISO_8601)return void eb(b);if(b._f===a.RFC_2822)return void fb(b);b._a=[],n(b).empty=!0;var c,d,e,f,g,h=""+b._i,i=h.length,j=0;for(e=Y(b._f,b._locale).match(Jd)||[],c=0;c<e.length;c++)f=e[c],d=(h.match($(f,b))||[])[0],d&&(g=h.substr(0,h.indexOf(d)),g.length>0&&n(b).unusedInput.push(g),h=h.slice(h.indexOf(d)+d.length),j+=d.length),Md[f]?(d?n(b).empty=!1:n(b).unusedTokens.push(f),da(f,d,b)):b._strict&&!d&&n(b).unusedTokens.push(f);n(b).charsLeftOver=i-j,h.length>0&&n(b).unusedInput.push(h),b._a[he]<=12&&n(b).bigHour===!0&&b._a[he]>0&&(n(b).bigHour=void 0),n(b).parsedDateParts=b._a.slice(0),n(b).meridiem=b._meridiem,b._a[he]=mb(b._locale,b._a[he],b._meridiem),jb(b),db(b)}function mb(a,b,c){var d;return null==c?b:null!=a.meridiemHour?a.meridiemHour(b,c):null!=a.isPM?(d=a.isPM(c),d&&b<12&&(b+=12),d||12!==b||(b=0),b):b}function nb(a){var b,c,d,e,f;if(0===a._f.length)return n(a).invalidFormat=!0,void(a._d=new Date(NaN));for(e=0;e<a._f.length;e++)f=0,b=q({},a),null!=a._useUTC&&(b._useUTC=a._useUTC),b._f=a._f[e],lb(b),o(b)&&(f+=n(b).charsLeftOver,f+=10*n(b).unusedTokens.length,n(b).score=f,(null==d||f<d)&&(d=f,c=b));k(a,c||b)}function ob(a){if(!a._d){var b=L(a._i);a._a=i([b.year,b.month,b.day||b.date,b.hour,b.minute,b.second,b.millisecond],function(a){return a&&parseInt(a,10)}),jb(a)}}function pb(a){var b=new r(db(qb(a)));return b._nextDay&&(b.add(1,"d"),b._nextDay=void 0),b}function qb(a){var b=a._i,d=a._f;return a._locale=a._locale||bb(a._l),null===b||void 0===d&&""===b?p({nullInput:!0}):("string"==typeof b&&(a._i=b=a._locale.preparse(b)),s(b)?new r(db(b)):(h(b)?a._d=b:c(d)?nb(a):d?lb(a):rb(a),o(a)||(a._d=null),a))}function rb(b){var e=b._i;f(e)?b._d=new Date(a.now()):h(e)?b._d=new Date(e.valueOf()):"string"==typeof e?gb(b):c(e)?(b._a=i(e.slice(0),function(a){return parseInt(a,10)}),jb(b)):d(e)?ob(b):g(e)?b._d=new Date(e):a.createFromInputFallback(b)}function sb(a,b,f,g,h){var i={};return f!==!0&&f!==!1||(g=f,f=void 0),(d(a)&&e(a)||c(a)&&0===a.length)&&(a=void 0),i._isAMomentObject=!0,i._useUTC=i._isUTC=h,i._l=f,i._i=a,i._f=b,i._strict=g,pb(i)}function tb(a,b,c,d){return sb(a,b,c,d,!1)}function ub(a,b){var d,e;if(1===b.length&&c(b[0])&&(b=b[0]),!b.length)return tb();for(d=b[0],e=1;e<b.length;++e)b[e].isValid()&&!b[e][a](d)||(d=b[e]);return d}function vb(){var a=[].slice.call(arguments,0);return ub("isBefore",a)}function wb(){var a=[].slice.call(arguments,0);return ub("isAfter",a)}function xb(a){for(var b in a)if(Re.indexOf(b)===-1||null!=a[b]&&isNaN(a[b]))return!1;for(var c=!1,d=0;d<Re.length;++d)if(a[Re[d]]){if(c)return!1;parseFloat(a[Re[d]])!==u(a[Re[d]])&&(c=!0)}return!0}function yb(){return this._isValid}function zb(){return Sb(NaN)}function Ab(a){var b=L(a),c=b.year||0,d=b.quarter||0,e=b.month||0,f=b.week||0,g=b.day||0,h=b.hour||0,i=b.minute||0,j=b.second||0,k=b.millisecond||0;this._isValid=xb(b),this._milliseconds=+k+1e3*j+6e4*i+1e3*h*60*60,this._days=+g+7*f,this._months=+e+3*d+12*c,this._data={},this._locale=bb(),this._bubble()}function Bb(a){return a instanceof Ab}function Cb(a){return a<0?Math.round(-1*a)*-1:Math.round(a)}function Db(a,b){U(a,0,0,function(){var a=this.utcOffset(),c="+";return a<0&&(a=-a,c="-"),c+T(~~(a/60),2)+b+T(~~a%60,2)})}function Eb(a,b){var c=(b||"").match(a);if(null===c)return null;var d=c[c.length-1]||[],e=(d+"").match(Se)||["-",0,0],f=+(60*e[1])+u(e[2]);return 0===f?0:"+"===e[0]?f:-f}function Fb(b,c){var d,e;return c._isUTC?(d=c.clone(),e=(s(b)||h(b)?b.valueOf():tb(b).valueOf())-d.valueOf(),d._d.setTime(d._d.valueOf()+e),a.updateOffset(d,!1),d):tb(b).local()}function Gb(a){return 15*-Math.round(a._d.getTimezoneOffset()/15)}function Hb(b,c,d){var e,f=this._offset||0;if(!this.isValid())return null!=b?this:NaN;if(null!=b){if("string"==typeof b){if(b=Eb(_d,b),null===b)return this}else Math.abs(b)<16&&!d&&(b=60*b);return!this._isUTC&&c&&(e=Gb(this)),this._offset=b,this._isUTC=!0,null!=e&&this.add(e,"m"),f!==b&&(!c||this._changeInProgress?Xb(this,Sb(b-f,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,a.updateOffset(this,!0),this._changeInProgress=null)),this}return this._isUTC?f:Gb(this)}function Ib(a,b){return null!=a?("string"!=typeof a&&(a=-a),this.utcOffset(a,b),this):-this.utcOffset()}function Jb(a){return this.utcOffset(0,a)}function Kb(a){return this._isUTC&&(this.utcOffset(0,a),this._isUTC=!1,a&&this.subtract(Gb(this),"m")),this}function Lb(){if(null!=this._tzm)this.utcOffset(this._tzm,!1,!0);else if("string"==typeof this._i){var a=Eb($d,this._i);null!=a?this.utcOffset(a):this.utcOffset(0,!0)}return this}function Mb(a){return!!this.isValid()&&(a=a?tb(a).utcOffset():0,(this.utcOffset()-a)%60===0)}function Nb(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()}function Ob(){if(!f(this._isDSTShifted))return this._isDSTShifted;var a={};if(q(a,this),a=qb(a),a._a){var b=a._isUTC?l(a._a):tb(a._a);this._isDSTShifted=this.isValid()&&v(a._a,b.toArray())>0}else this._isDSTShifted=!1;return this._isDSTShifted}function Pb(){return!!this.isValid()&&!this._isUTC}function Qb(){return!!this.isValid()&&this._isUTC}function Rb(){return!!this.isValid()&&(this._isUTC&&0===this._offset)}function Sb(a,b){var c,d,e,f=a,h=null;return Bb(a)?f={ms:a._milliseconds,d:a._days,M:a._months}:g(a)?(f={},b?f[b]=a:f.milliseconds=a):(h=Te.exec(a))?(c="-"===h[1]?-1:1,f={y:0,d:u(h[ge])*c,h:u(h[he])*c,m:u(h[ie])*c,s:u(h[je])*c,ms:u(Cb(1e3*h[ke]))*c}):(h=Ue.exec(a))?(c="-"===h[1]?-1:1,f={y:Tb(h[2],c),M:Tb(h[3],c),w:Tb(h[4],c),d:Tb(h[5],c),h:Tb(h[6],c),m:Tb(h[7],c),s:Tb(h[8],c)}):null==f?f={}:"object"==typeof f&&("from"in f||"to"in f)&&(e=Vb(tb(f.from),tb(f.to)),f={},f.ms=e.milliseconds,f.M=e.months),d=new Ab(f),Bb(a)&&j(a,"_locale")&&(d._locale=a._locale),d}function Tb(a,b){var c=a&&parseFloat(a.replace(",","."));return(isNaN(c)?0:c)*b}function Ub(a,b){var c={milliseconds:0,months:0};return c.months=b.month()-a.month()+12*(b.year()-a.year()),a.clone().add(c.months,"M").isAfter(b)&&--c.months,c.milliseconds=+b-+a.clone().add(c.months,"M"),c}function Vb(a,b){var c;return a.isValid()&&b.isValid()?(b=Fb(b,a),a.isBefore(b)?c=Ub(a,b):(c=Ub(b,a),c.milliseconds=-c.milliseconds,c.months=-c.months),c):{milliseconds:0,months:0}}function Wb(a,b){return function(c,d){var e,f;return null===d||isNaN(+d)||(y(b,"moment()."+b+"(period, number) is deprecated. Please use moment()."+b+"(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."),f=c,c=d,d=f),c="string"==typeof c?+c:c,e=Sb(c,d),Xb(this,e,a),this}}function Xb(b,c,d,e){var f=c._milliseconds,g=Cb(c._days),h=Cb(c._months);b.isValid()&&(e=null==e||e,f&&b._d.setTime(b._d.valueOf()+f*d),g&&Q(b,"Date",P(b,"Date")+g*d),h&&ja(b,P(b,"Month")+h*d),e&&a.updateOffset(b,g||h))}function Yb(a,b){var c=a.diff(b,"days",!0);return c<-6?"sameElse":c<-1?"lastWeek":c<0?"lastDay":c<1?"sameDay":c<2?"nextDay":c<7?"nextWeek":"sameElse"}function Zb(b,c){var d=b||tb(),e=Fb(d,this).startOf("day"),f=a.calendarFormat(this,e)||"sameElse",g=c&&(z(c[f])?c[f].call(this,d):c[f]);return this.format(g||this.localeData().calendar(f,this,tb(d)))}function $b(){return new r(this)}function _b(a,b){var c=s(a)?a:tb(a);return!(!this.isValid()||!c.isValid())&&(b=K(f(b)?"millisecond":b),"millisecond"===b?this.valueOf()>c.valueOf():c.valueOf()<this.clone().startOf(b).valueOf())}function ac(a,b){var c=s(a)?a:tb(a);return!(!this.isValid()||!c.isValid())&&(b=K(f(b)?"millisecond":b),"millisecond"===b?this.valueOf()<c.valueOf():this.clone().endOf(b).valueOf()<c.valueOf())}function bc(a,b,c,d){return d=d||"()",("("===d[0]?this.isAfter(a,c):!this.isBefore(a,c))&&(")"===d[1]?this.isBefore(b,c):!this.isAfter(b,c))}function cc(a,b){var c,d=s(a)?a:tb(a);return!(!this.isValid()||!d.isValid())&&(b=K(b||"millisecond"),"millisecond"===b?this.valueOf()===d.valueOf():(c=d.valueOf(),this.clone().startOf(b).valueOf()<=c&&c<=this.clone().endOf(b).valueOf()))}function dc(a,b){return this.isSame(a,b)||this.isAfter(a,b)}function ec(a,b){return this.isSame(a,b)||this.isBefore(a,b)}function fc(a,b,c){var d,e,f,g;return this.isValid()?(d=Fb(a,this),d.isValid()?(e=6e4*(d.utcOffset()-this.utcOffset()),b=K(b),"year"===b||"month"===b||"quarter"===b?(g=gc(this,d),"quarter"===b?g/=3:"year"===b&&(g/=12)):(f=this-d,g="second"===b?f/1e3:"minute"===b?f/6e4:"hour"===b?f/36e5:"day"===b?(f-e)/864e5:"week"===b?(f-e)/6048e5:f),c?g:t(g)):NaN):NaN}function gc(a,b){var c,d,e=12*(b.year()-a.year())+(b.month()-a.month()),f=a.clone().add(e,"months");return b-f<0?(c=a.clone().add(e-1,"months"),d=(b-f)/(f-c)):(c=a.clone().add(e+1,"months"),d=(b-f)/(c-f)),-(e+d)||0}function hc(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")}function ic(){if(!this.isValid())return null;var a=this.clone().utc();return a.year()<0||a.year()>9999?X(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):z(Date.prototype.toISOString)?this.toDate().toISOString():X(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")}function jc(){if(!this.isValid())return"moment.invalid(/* "+this._i+" */)";var a="moment",b="";this.isLocal()||(a=0===this.utcOffset()?"moment.utc":"moment.parseZone",b="Z");var c="["+a+'("]',d=0<=this.year()&&this.year()<=9999?"YYYY":"YYYYYY",e="-MM-DD[T]HH:mm:ss.SSS",f=b+'[")]';return this.format(c+d+e+f)}function kc(b){b||(b=this.isUtc()?a.defaultFormatUtc:a.defaultFormat);var c=X(this,b);return this.localeData().postformat(c)}function lc(a,b){return this.isValid()&&(s(a)&&a.isValid()||tb(a).isValid())?Sb({to:this,from:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function mc(a){return this.from(tb(),a)}function nc(a,b){return this.isValid()&&(s(a)&&a.isValid()||tb(a).isValid())?Sb({from:this,to:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function oc(a){return this.to(tb(),a)}function pc(a){var b;return void 0===a?this._locale._abbr:(b=bb(a),null!=b&&(this._locale=b),this)}function qc(){return this._locale}function rc(a){switch(a=K(a)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":case"date":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a&&this.weekday(0),"isoWeek"===a&&this.isoWeekday(1),"quarter"===a&&this.month(3*Math.floor(this.month()/3)),this}function sc(a){return a=K(a),void 0===a||"millisecond"===a?this:("date"===a&&(a="day"),this.startOf(a).add(1,"isoWeek"===a?"week":a).subtract(1,"ms"))}function tc(){return this._d.valueOf()-6e4*(this._offset||0)}function uc(){return Math.floor(this.valueOf()/1e3)}function vc(){return new Date(this.valueOf())}function wc(){var a=this;return[a.year(),a.month(),a.date(),a.hour(),a.minute(),a.second(),a.millisecond()]}function xc(){var a=this;return{years:a.year(),months:a.month(),date:a.date(),hours:a.hours(),minutes:a.minutes(),seconds:a.seconds(),milliseconds:a.milliseconds()}}function yc(){return this.isValid()?this.toISOString():null}function zc(){return o(this)}function Ac(){
return k({},n(this))}function Bc(){return n(this).overflow}function Cc(){return{input:this._i,format:this._f,locale:this._locale,isUTC:this._isUTC,strict:this._strict}}function Dc(a,b){U(0,[a,a.length],0,b)}function Ec(a){return Ic.call(this,a,this.week(),this.weekday(),this.localeData()._week.dow,this.localeData()._week.doy)}function Fc(a){return Ic.call(this,a,this.isoWeek(),this.isoWeekday(),1,4)}function Gc(){return xa(this.year(),1,4)}function Hc(){var a=this.localeData()._week;return xa(this.year(),a.dow,a.doy)}function Ic(a,b,c,d,e){var f;return null==a?wa(this,d,e).year:(f=xa(a,d,e),b>f&&(b=f),Jc.call(this,a,b,c,d,e))}function Jc(a,b,c,d,e){var f=va(a,b,c,d,e),g=ta(f.year,0,f.dayOfYear);return this.year(g.getUTCFullYear()),this.month(g.getUTCMonth()),this.date(g.getUTCDate()),this}function Kc(a){return null==a?Math.ceil((this.month()+1)/3):this.month(3*(a-1)+this.month()%3)}function Lc(a){var b=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==a?b:this.add(a-b,"d")}function Mc(a,b){b[ke]=u(1e3*("0."+a))}function Nc(){return this._isUTC?"UTC":""}function Oc(){return this._isUTC?"Coordinated Universal Time":""}function Pc(a){return tb(1e3*a)}function Qc(){return tb.apply(null,arguments).parseZone()}function Rc(a){return a}function Sc(a,b,c,d){var e=bb(),f=l().set(d,b);return e[c](f,a)}function Tc(a,b,c){if(g(a)&&(b=a,a=void 0),a=a||"",null!=b)return Sc(a,b,c,"month");var d,e=[];for(d=0;d<12;d++)e[d]=Sc(a,d,c,"month");return e}function Uc(a,b,c,d){"boolean"==typeof a?(g(b)&&(c=b,b=void 0),b=b||""):(b=a,c=b,a=!1,g(b)&&(c=b,b=void 0),b=b||"");var e=bb(),f=a?e._week.dow:0;if(null!=c)return Sc(b,(c+f)%7,d,"day");var h,i=[];for(h=0;h<7;h++)i[h]=Sc(b,(h+f)%7,d,"day");return i}function Vc(a,b){return Tc(a,b,"months")}function Wc(a,b){return Tc(a,b,"monthsShort")}function Xc(a,b,c){return Uc(a,b,c,"weekdays")}function Yc(a,b,c){return Uc(a,b,c,"weekdaysShort")}function Zc(a,b,c){return Uc(a,b,c,"weekdaysMin")}function $c(){var a=this._data;return this._milliseconds=df(this._milliseconds),this._days=df(this._days),this._months=df(this._months),a.milliseconds=df(a.milliseconds),a.seconds=df(a.seconds),a.minutes=df(a.minutes),a.hours=df(a.hours),a.months=df(a.months),a.years=df(a.years),this}function _c(a,b,c,d){var e=Sb(b,c);return a._milliseconds+=d*e._milliseconds,a._days+=d*e._days,a._months+=d*e._months,a._bubble()}function ad(a,b){return _c(this,a,b,1)}function bd(a,b){return _c(this,a,b,-1)}function cd(a){return a<0?Math.floor(a):Math.ceil(a)}function dd(){var a,b,c,d,e,f=this._milliseconds,g=this._days,h=this._months,i=this._data;return f>=0&&g>=0&&h>=0||f<=0&&g<=0&&h<=0||(f+=864e5*cd(fd(h)+g),g=0,h=0),i.milliseconds=f%1e3,a=t(f/1e3),i.seconds=a%60,b=t(a/60),i.minutes=b%60,c=t(b/60),i.hours=c%24,g+=t(c/24),e=t(ed(g)),h+=e,g-=cd(fd(e)),d=t(h/12),h%=12,i.days=g,i.months=h,i.years=d,this}function ed(a){return 4800*a/146097}function fd(a){return 146097*a/4800}function gd(a){if(!this.isValid())return NaN;var b,c,d=this._milliseconds;if(a=K(a),"month"===a||"year"===a)return b=this._days+d/864e5,c=this._months+ed(b),"month"===a?c:c/12;switch(b=this._days+Math.round(fd(this._months)),a){case"week":return b/7+d/6048e5;case"day":return b+d/864e5;case"hour":return 24*b+d/36e5;case"minute":return 1440*b+d/6e4;case"second":return 86400*b+d/1e3;case"millisecond":return Math.floor(864e5*b)+d;default:throw new Error("Unknown unit "+a)}}function hd(){return this.isValid()?this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*u(this._months/12):NaN}function id(a){return function(){return this.as(a)}}function jd(a){return a=K(a),this.isValid()?this[a+"s"]():NaN}function kd(a){return function(){return this.isValid()?this._data[a]:NaN}}function ld(){return t(this.days()/7)}function md(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function nd(a,b,c){var d=Sb(a).abs(),e=uf(d.as("s")),f=uf(d.as("m")),g=uf(d.as("h")),h=uf(d.as("d")),i=uf(d.as("M")),j=uf(d.as("y")),k=e<=vf.ss&&["s",e]||e<vf.s&&["ss",e]||f<=1&&["m"]||f<vf.m&&["mm",f]||g<=1&&["h"]||g<vf.h&&["hh",g]||h<=1&&["d"]||h<vf.d&&["dd",h]||i<=1&&["M"]||i<vf.M&&["MM",i]||j<=1&&["y"]||["yy",j];return k[2]=b,k[3]=+a>0,k[4]=c,md.apply(null,k)}function od(a){return void 0===a?uf:"function"==typeof a&&(uf=a,!0)}function pd(a,b){return void 0!==vf[a]&&(void 0===b?vf[a]:(vf[a]=b,"s"===a&&(vf.ss=b-1),!0))}function qd(a){if(!this.isValid())return this.localeData().invalidDate();var b=this.localeData(),c=nd(this,!a,b);return a&&(c=b.pastFuture(+this,c)),b.postformat(c)}function rd(){if(!this.isValid())return this.localeData().invalidDate();var a,b,c,d=wf(this._milliseconds)/1e3,e=wf(this._days),f=wf(this._months);a=t(d/60),b=t(a/60),d%=60,a%=60,c=t(f/12),f%=12;var g=c,h=f,i=e,j=b,k=a,l=d,m=this.asSeconds();return m?(m<0?"-":"")+"P"+(g?g+"Y":"")+(h?h+"M":"")+(i?i+"D":"")+(j||k||l?"T":"")+(j?j+"H":"")+(k?k+"M":"")+(l?l+"S":""):"P0D"}var sd,td;td=Array.prototype.some?Array.prototype.some:function(a){for(var b=Object(this),c=b.length>>>0,d=0;d<c;d++)if(d in b&&a.call(this,b[d],d,b))return!0;return!1};var ud=td,vd=a.momentProperties=[],wd=!1,xd={};a.suppressDeprecationWarnings=!1,a.deprecationHandler=null;var yd;yd=Object.keys?Object.keys:function(a){var b,c=[];for(b in a)j(a,b)&&c.push(b);return c};var zd,Ad=yd,Bd={sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},Cd={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},Dd="Invalid date",Ed="%d",Fd=/\d{1,2}/,Gd={future:"in %s",past:"%s ago",s:"a few seconds",ss:"%d seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},Hd={},Id={},Jd=/(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,Kd=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,Ld={},Md={},Nd=/\d/,Od=/\d\d/,Pd=/\d{3}/,Qd=/\d{4}/,Rd=/[+-]?\d{6}/,Sd=/\d\d?/,Td=/\d\d\d\d?/,Ud=/\d\d\d\d\d\d?/,Vd=/\d{1,3}/,Wd=/\d{1,4}/,Xd=/[+-]?\d{1,6}/,Yd=/\d+/,Zd=/[+-]?\d+/,$d=/Z|[+-]\d\d:?\d\d/gi,_d=/Z|[+-]\d\d(?::?\d\d)?/gi,ae=/[+-]?\d+(\.\d{1,3})?/,be=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,ce={},de={},ee=0,fe=1,ge=2,he=3,ie=4,je=5,ke=6,le=7,me=8;zd=Array.prototype.indexOf?Array.prototype.indexOf:function(a){var b;for(b=0;b<this.length;++b)if(this[b]===a)return b;return-1};var ne=zd;U("M",["MM",2],"Mo",function(){return this.month()+1}),U("MMM",0,0,function(a){return this.localeData().monthsShort(this,a)}),U("MMMM",0,0,function(a){return this.localeData().months(this,a)}),J("month","M"),M("month",8),Z("M",Sd),Z("MM",Sd,Od),Z("MMM",function(a,b){return b.monthsShortRegex(a)}),Z("MMMM",function(a,b){return b.monthsRegex(a)}),ba(["M","MM"],function(a,b){b[fe]=u(a)-1}),ba(["MMM","MMMM"],function(a,b,c,d){var e=c._locale.monthsParse(a,d,c._strict);null!=e?b[fe]=e:n(c).invalidMonth=a});var oe=/D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,pe="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),qe="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),re=be,se=be;U("Y",0,0,function(){var a=this.year();return a<=9999?""+a:"+"+a}),U(0,["YY",2],0,function(){return this.year()%100}),U(0,["YYYY",4],0,"year"),U(0,["YYYYY",5],0,"year"),U(0,["YYYYYY",6,!0],0,"year"),J("year","y"),M("year",1),Z("Y",Zd),Z("YY",Sd,Od),Z("YYYY",Wd,Qd),Z("YYYYY",Xd,Rd),Z("YYYYYY",Xd,Rd),ba(["YYYYY","YYYYYY"],ee),ba("YYYY",function(b,c){c[ee]=2===b.length?a.parseTwoDigitYear(b):u(b)}),ba("YY",function(b,c){c[ee]=a.parseTwoDigitYear(b)}),ba("Y",function(a,b){b[ee]=parseInt(a,10)}),a.parseTwoDigitYear=function(a){return u(a)+(u(a)>68?1900:2e3)};var te=O("FullYear",!0);U("w",["ww",2],"wo","week"),U("W",["WW",2],"Wo","isoWeek"),J("week","w"),J("isoWeek","W"),M("week",5),M("isoWeek",5),Z("w",Sd),Z("ww",Sd,Od),Z("W",Sd),Z("WW",Sd,Od),ca(["w","ww","W","WW"],function(a,b,c,d){b[d.substr(0,1)]=u(a)});var ue={dow:0,doy:6};U("d",0,"do","day"),U("dd",0,0,function(a){return this.localeData().weekdaysMin(this,a)}),U("ddd",0,0,function(a){return this.localeData().weekdaysShort(this,a)}),U("dddd",0,0,function(a){return this.localeData().weekdays(this,a)}),U("e",0,0,"weekday"),U("E",0,0,"isoWeekday"),J("day","d"),J("weekday","e"),J("isoWeekday","E"),M("day",11),M("weekday",11),M("isoWeekday",11),Z("d",Sd),Z("e",Sd),Z("E",Sd),Z("dd",function(a,b){return b.weekdaysMinRegex(a)}),Z("ddd",function(a,b){return b.weekdaysShortRegex(a)}),Z("dddd",function(a,b){return b.weekdaysRegex(a)}),ca(["dd","ddd","dddd"],function(a,b,c,d){var e=c._locale.weekdaysParse(a,d,c._strict);null!=e?b.d=e:n(c).invalidWeekday=a}),ca(["d","e","E"],function(a,b,c,d){b[d]=u(a)});var ve="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),we="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),xe="Su_Mo_Tu_We_Th_Fr_Sa".split("_"),ye=be,ze=be,Ae=be;U("H",["HH",2],0,"hour"),U("h",["hh",2],0,Ra),U("k",["kk",2],0,Sa),U("hmm",0,0,function(){return""+Ra.apply(this)+T(this.minutes(),2)}),U("hmmss",0,0,function(){return""+Ra.apply(this)+T(this.minutes(),2)+T(this.seconds(),2)}),U("Hmm",0,0,function(){return""+this.hours()+T(this.minutes(),2)}),U("Hmmss",0,0,function(){return""+this.hours()+T(this.minutes(),2)+T(this.seconds(),2)}),Ta("a",!0),Ta("A",!1),J("hour","h"),M("hour",13),Z("a",Ua),Z("A",Ua),Z("H",Sd),Z("h",Sd),Z("k",Sd),Z("HH",Sd,Od),Z("hh",Sd,Od),Z("kk",Sd,Od),Z("hmm",Td),Z("hmmss",Ud),Z("Hmm",Td),Z("Hmmss",Ud),ba(["H","HH"],he),ba(["k","kk"],function(a,b,c){var d=u(a);b[he]=24===d?0:d}),ba(["a","A"],function(a,b,c){c._isPm=c._locale.isPM(a),c._meridiem=a}),ba(["h","hh"],function(a,b,c){b[he]=u(a),n(c).bigHour=!0}),ba("hmm",function(a,b,c){var d=a.length-2;b[he]=u(a.substr(0,d)),b[ie]=u(a.substr(d)),n(c).bigHour=!0}),ba("hmmss",function(a,b,c){var d=a.length-4,e=a.length-2;b[he]=u(a.substr(0,d)),b[ie]=u(a.substr(d,2)),b[je]=u(a.substr(e)),n(c).bigHour=!0}),ba("Hmm",function(a,b,c){var d=a.length-2;b[he]=u(a.substr(0,d)),b[ie]=u(a.substr(d))}),ba("Hmmss",function(a,b,c){var d=a.length-4,e=a.length-2;b[he]=u(a.substr(0,d)),b[ie]=u(a.substr(d,2)),b[je]=u(a.substr(e))});var Be,Ce=/[ap]\.?m?\.?/i,De=O("Hours",!0),Ee={calendar:Bd,longDateFormat:Cd,invalidDate:Dd,ordinal:Ed,dayOfMonthOrdinalParse:Fd,relativeTime:Gd,months:pe,monthsShort:qe,week:ue,weekdays:ve,weekdaysMin:xe,weekdaysShort:we,meridiemParse:Ce},Fe={},Ge={},He=/^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Ie=/^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,Je=/Z|[+-]\d\d(?::?\d\d)?/,Ke=[["YYYYYY-MM-DD",/[+-]\d{6}-\d\d-\d\d/],["YYYY-MM-DD",/\d{4}-\d\d-\d\d/],["GGGG-[W]WW-E",/\d{4}-W\d\d-\d/],["GGGG-[W]WW",/\d{4}-W\d\d/,!1],["YYYY-DDD",/\d{4}-\d{3}/],["YYYY-MM",/\d{4}-\d\d/,!1],["YYYYYYMMDD",/[+-]\d{10}/],["YYYYMMDD",/\d{8}/],["GGGG[W]WWE",/\d{4}W\d{3}/],["GGGG[W]WW",/\d{4}W\d{2}/,!1],["YYYYDDD",/\d{7}/]],Le=[["HH:mm:ss.SSSS",/\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss,SSSS",/\d\d:\d\d:\d\d,\d+/],["HH:mm:ss",/\d\d:\d\d:\d\d/],["HH:mm",/\d\d:\d\d/],["HHmmss.SSSS",/\d\d\d\d\d\d\.\d+/],["HHmmss,SSSS",/\d\d\d\d\d\d,\d+/],["HHmmss",/\d\d\d\d\d\d/],["HHmm",/\d\d\d\d/],["HH",/\d\d/]],Me=/^\/?Date\((\-?\d+)/i,Ne=/^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;a.createFromInputFallback=x("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",function(a){a._d=new Date(a._i+(a._useUTC?" UTC":""))}),a.ISO_8601=function(){},a.RFC_2822=function(){};var Oe=x("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var a=tb.apply(null,arguments);return this.isValid()&&a.isValid()?a<this?this:a:p()}),Pe=x("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",function(){var a=tb.apply(null,arguments);return this.isValid()&&a.isValid()?a>this?this:a:p()}),Qe=function(){return Date.now?Date.now():+new Date},Re=["year","quarter","month","week","day","hour","minute","second","millisecond"];Db("Z",":"),Db("ZZ",""),Z("Z",_d),Z("ZZ",_d),ba(["Z","ZZ"],function(a,b,c){c._useUTC=!0,c._tzm=Eb(_d,a)});var Se=/([\+\-]|\d\d)/gi;a.updateOffset=function(){};var Te=/^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,Ue=/^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;Sb.fn=Ab.prototype,Sb.invalid=zb;var Ve=Wb(1,"add"),We=Wb(-1,"subtract");a.defaultFormat="YYYY-MM-DDTHH:mm:ssZ",a.defaultFormatUtc="YYYY-MM-DDTHH:mm:ss[Z]";var Xe=x("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(a){return void 0===a?this.localeData():this.locale(a)});U(0,["gg",2],0,function(){return this.weekYear()%100}),U(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Dc("gggg","weekYear"),Dc("ggggg","weekYear"),Dc("GGGG","isoWeekYear"),Dc("GGGGG","isoWeekYear"),J("weekYear","gg"),J("isoWeekYear","GG"),M("weekYear",1),M("isoWeekYear",1),Z("G",Zd),Z("g",Zd),Z("GG",Sd,Od),Z("gg",Sd,Od),Z("GGGG",Wd,Qd),Z("gggg",Wd,Qd),Z("GGGGG",Xd,Rd),Z("ggggg",Xd,Rd),ca(["gggg","ggggg","GGGG","GGGGG"],function(a,b,c,d){b[d.substr(0,2)]=u(a)}),ca(["gg","GG"],function(b,c,d,e){c[e]=a.parseTwoDigitYear(b)}),U("Q",0,"Qo","quarter"),J("quarter","Q"),M("quarter",7),Z("Q",Nd),ba("Q",function(a,b){b[fe]=3*(u(a)-1)}),U("D",["DD",2],"Do","date"),J("date","D"),M("date",9),Z("D",Sd),Z("DD",Sd,Od),Z("Do",function(a,b){return a?b._dayOfMonthOrdinalParse||b._ordinalParse:b._dayOfMonthOrdinalParseLenient}),ba(["D","DD"],ge),ba("Do",function(a,b){b[ge]=u(a.match(Sd)[0],10)});var Ye=O("Date",!0);U("DDD",["DDDD",3],"DDDo","dayOfYear"),J("dayOfYear","DDD"),M("dayOfYear",4),Z("DDD",Vd),Z("DDDD",Pd),ba(["DDD","DDDD"],function(a,b,c){c._dayOfYear=u(a)}),U("m",["mm",2],0,"minute"),J("minute","m"),M("minute",14),Z("m",Sd),Z("mm",Sd,Od),ba(["m","mm"],ie);var Ze=O("Minutes",!1);U("s",["ss",2],0,"second"),J("second","s"),M("second",15),Z("s",Sd),Z("ss",Sd,Od),ba(["s","ss"],je);var $e=O("Seconds",!1);U("S",0,0,function(){return~~(this.millisecond()/100)}),U(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),U(0,["SSS",3],0,"millisecond"),U(0,["SSSS",4],0,function(){return 10*this.millisecond()}),U(0,["SSSSS",5],0,function(){return 100*this.millisecond()}),U(0,["SSSSSS",6],0,function(){return 1e3*this.millisecond()}),U(0,["SSSSSSS",7],0,function(){return 1e4*this.millisecond()}),U(0,["SSSSSSSS",8],0,function(){return 1e5*this.millisecond()}),U(0,["SSSSSSSSS",9],0,function(){return 1e6*this.millisecond()}),J("millisecond","ms"),M("millisecond",16),Z("S",Vd,Nd),Z("SS",Vd,Od),Z("SSS",Vd,Pd);var _e;for(_e="SSSS";_e.length<=9;_e+="S")Z(_e,Yd);for(_e="S";_e.length<=9;_e+="S")ba(_e,Mc);var af=O("Milliseconds",!1);U("z",0,0,"zoneAbbr"),U("zz",0,0,"zoneName");var bf=r.prototype;bf.add=Ve,bf.calendar=Zb,bf.clone=$b,bf.diff=fc,bf.endOf=sc,bf.format=kc,bf.from=lc,bf.fromNow=mc,bf.to=nc,bf.toNow=oc,bf.get=R,bf.invalidAt=Bc,bf.isAfter=_b,bf.isBefore=ac,bf.isBetween=bc,bf.isSame=cc,bf.isSameOrAfter=dc,bf.isSameOrBefore=ec,bf.isValid=zc,bf.lang=Xe,bf.locale=pc,bf.localeData=qc,bf.max=Pe,bf.min=Oe,bf.parsingFlags=Ac,bf.set=S,bf.startOf=rc,bf.subtract=We,bf.toArray=wc,bf.toObject=xc,bf.toDate=vc,bf.toISOString=ic,bf.inspect=jc,bf.toJSON=yc,bf.toString=hc,bf.unix=uc,bf.valueOf=tc,bf.creationData=Cc,bf.year=te,bf.isLeapYear=ra,bf.weekYear=Ec,bf.isoWeekYear=Fc,bf.quarter=bf.quarters=Kc,bf.month=ka,bf.daysInMonth=la,bf.week=bf.weeks=Ba,bf.isoWeek=bf.isoWeeks=Ca,bf.weeksInYear=Hc,bf.isoWeeksInYear=Gc,bf.date=Ye,bf.day=bf.days=Ka,bf.weekday=La,bf.isoWeekday=Ma,bf.dayOfYear=Lc,bf.hour=bf.hours=De,bf.minute=bf.minutes=Ze,bf.second=bf.seconds=$e,bf.millisecond=bf.milliseconds=af,bf.utcOffset=Hb,bf.utc=Jb,bf.local=Kb,bf.parseZone=Lb,bf.hasAlignedHourOffset=Mb,bf.isDST=Nb,bf.isLocal=Pb,bf.isUtcOffset=Qb,bf.isUtc=Rb,bf.isUTC=Rb,bf.zoneAbbr=Nc,bf.zoneName=Oc,bf.dates=x("dates accessor is deprecated. Use date instead.",Ye),bf.months=x("months accessor is deprecated. Use month instead",ka),bf.years=x("years accessor is deprecated. Use year instead",te),bf.zone=x("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",Ib),bf.isDSTShifted=x("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",Ob);var cf=C.prototype;cf.calendar=D,cf.longDateFormat=E,cf.invalidDate=F,cf.ordinal=G,cf.preparse=Rc,cf.postformat=Rc,cf.relativeTime=H,cf.pastFuture=I,cf.set=A,cf.months=fa,cf.monthsShort=ga,cf.monthsParse=ia,cf.monthsRegex=na,cf.monthsShortRegex=ma,cf.week=ya,cf.firstDayOfYear=Aa,cf.firstDayOfWeek=za,cf.weekdays=Fa,cf.weekdaysMin=Ha,cf.weekdaysShort=Ga,cf.weekdaysParse=Ja,cf.weekdaysRegex=Na,cf.weekdaysShortRegex=Oa,cf.weekdaysMinRegex=Pa,cf.isPM=Va,cf.meridiem=Wa,$a("en",{dayOfMonthOrdinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(a){var b=a%10,c=1===u(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),a.lang=x("moment.lang is deprecated. Use moment.locale instead.",$a),a.langData=x("moment.langData is deprecated. Use moment.localeData instead.",bb);var df=Math.abs,ef=id("ms"),ff=id("s"),gf=id("m"),hf=id("h"),jf=id("d"),kf=id("w"),lf=id("M"),mf=id("y"),nf=kd("milliseconds"),of=kd("seconds"),pf=kd("minutes"),qf=kd("hours"),rf=kd("days"),sf=kd("months"),tf=kd("years"),uf=Math.round,vf={ss:44,s:45,m:45,h:22,d:26,M:11},wf=Math.abs,xf=Ab.prototype;return xf.isValid=yb,xf.abs=$c,xf.add=ad,xf.subtract=bd,xf.as=gd,xf.asMilliseconds=ef,xf.asSeconds=ff,xf.asMinutes=gf,xf.asHours=hf,xf.asDays=jf,xf.asWeeks=kf,xf.asMonths=lf,xf.asYears=mf,xf.valueOf=hd,xf._bubble=dd,xf.get=jd,xf.milliseconds=nf,xf.seconds=of,xf.minutes=pf,xf.hours=qf,xf.days=rf,xf.weeks=ld,xf.months=sf,xf.years=tf,xf.humanize=qd,xf.toISOString=rd,xf.toString=rd,xf.toJSON=rd,xf.locale=pc,xf.localeData=qc,xf.toIsoString=x("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",rd),xf.lang=Xe,U("X",0,0,"unix"),U("x",0,0,"valueOf"),Z("x",Zd),Z("X",ae),ba("X",function(a,b,c){c._d=new Date(1e3*parseFloat(a,10))}),ba("x",function(a,b,c){c._d=new Date(u(a))}),a.version="2.18.1",b(tb),a.fn=bf,a.min=vb,a.max=wb,a.now=Qe,a.utc=l,a.unix=Pc,a.months=Vc,a.isDate=h,a.locale=$a,a.invalid=p,a.duration=Sb,a.isMoment=s,a.weekdays=Xc,a.parseZone=Qc,a.localeData=bb,a.isDuration=Bb,a.monthsShort=Wc,a.weekdaysMin=Zc,a.defineLocale=_a,a.updateLocale=ab,a.locales=cb,a.weekdaysShort=Yc,a.normalizeUnits=K,a.relativeTimeRounding=od,a.relativeTimeThreshold=pd,a.calendarFormat=Yb,a.prototype=bf,a});
//! moment-timezone.js
//! version : 0.5.13
//! Copyright (c) JS Foundation and other contributors
//! license : MIT
//! github.com/moment/moment-timezone
!function(a,b){"use strict";"function"==typeof define&&define.amd?define(["moment"],b):"object"==typeof module&&module.exports?module.exports=b(require("moment")):b(a.moment)}(this,function(a){"use strict";function b(a){return a>96?a-87:a>64?a-29:a-48}function c(a){var c,d=0,e=a.split("."),f=e[0],g=e[1]||"",h=1,i=0,j=1;for(45===a.charCodeAt(0)&&(d=1,j=-1),d;d<f.length;d++)c=b(f.charCodeAt(d)),i=60*i+c;for(d=0;d<g.length;d++)h/=60,c=b(g.charCodeAt(d)),i+=c*h;return i*j}function d(a){for(var b=0;b<a.length;b++)a[b]=c(a[b])}function e(a,b){for(var c=0;c<b;c++)a[c]=Math.round((a[c-1]||0)+6e4*a[c]);a[b-1]=1/0}function f(a,b){var c,d=[];for(c=0;c<b.length;c++)d[c]=a[b[c]];return d}function g(a){var b=a.split("|"),c=b[2].split(" "),g=b[3].split(""),h=b[4].split(" ");return d(c),d(g),d(h),e(h,g.length),{name:b[0],abbrs:f(b[1].split(" "),g),offsets:f(c,g),untils:h,population:0|b[5]}}function h(a){a&&this._set(g(a))}function i(a){var b=a.toTimeString(),c=b.match(/\([a-z ]+\)/i);c&&c[0]?(c=c[0].match(/[A-Z]/g),c=c?c.join(""):void 0):(c=b.match(/[A-Z]{3,5}/g),c=c?c[0]:void 0),"GMT"===c&&(c=void 0),this.at=+a,this.abbr=c,this.offset=a.getTimezoneOffset()}function j(a){this.zone=a,this.offsetScore=0,this.abbrScore=0}function k(a,b){for(var c,d;d=6e4*((b.at-a.at)/12e4|0);)c=new i(new Date(a.at+d)),c.offset===a.offset?a=c:b=c;return a}function l(){var a,b,c,d=(new Date).getFullYear()-2,e=new i(new Date(d,0,1)),f=[e];for(c=1;c<48;c++)b=new i(new Date(d,c,1)),b.offset!==e.offset&&(a=k(e,b),f.push(a),f.push(new i(new Date(a.at+6e4)))),e=b;for(c=0;c<4;c++)f.push(new i(new Date(d+c,0,1))),f.push(new i(new Date(d+c,6,1)));return f}function m(a,b){return a.offsetScore!==b.offsetScore?a.offsetScore-b.offsetScore:a.abbrScore!==b.abbrScore?a.abbrScore-b.abbrScore:b.zone.population-a.zone.population}function n(a,b){var c,e;for(d(b),c=0;c<b.length;c++)e=b[c],I[e]=I[e]||{},I[e][a]=!0}function o(a){var b,c,d,e=a.length,f={},g=[];for(b=0;b<e;b++){d=I[a[b].offset]||{};for(c in d)d.hasOwnProperty(c)&&(f[c]=!0)}for(b in f)f.hasOwnProperty(b)&&g.push(H[b]);return g}function p(){try{var a=Intl.DateTimeFormat().resolvedOptions().timeZone;if(a){var b=H[r(a)];if(b)return b;z("Moment Timezone found "+a+" from the Intl api, but did not have that data loaded.")}}catch(c){}var d,e,f,g=l(),h=g.length,i=o(g),k=[];for(e=0;e<i.length;e++){for(d=new j(t(i[e]),h),f=0;f<h;f++)d.scoreOffsetAt(g[f]);k.push(d)}return k.sort(m),k.length>0?k[0].zone.name:void 0}function q(a){return D&&!a||(D=p()),D}function r(a){return(a||"").toLowerCase().replace(/\//g,"_")}function s(a){var b,c,d,e;for("string"==typeof a&&(a=[a]),b=0;b<a.length;b++)d=a[b].split("|"),c=d[0],e=r(c),F[e]=a[b],H[e]=c,d[5]&&n(e,d[2].split(" "))}function t(a,b){a=r(a);var c,d=F[a];return d instanceof h?d:"string"==typeof d?(d=new h(d),F[a]=d,d):G[a]&&b!==t&&(c=t(G[a],t))?(d=F[a]=new h,d._set(c),d.name=H[a],d):null}function u(){var a,b=[];for(a in H)H.hasOwnProperty(a)&&(F[a]||F[G[a]])&&H[a]&&b.push(H[a]);return b.sort()}function v(a){var b,c,d,e;for("string"==typeof a&&(a=[a]),b=0;b<a.length;b++)c=a[b].split("|"),d=r(c[0]),e=r(c[1]),G[d]=e,H[d]=c[0],G[e]=d,H[e]=c[1]}function w(a){s(a.zones),v(a.links),A.dataVersion=a.version}function x(a){return x.didShowError||(x.didShowError=!0,z("moment.tz.zoneExists('"+a+"') has been deprecated in favor of !moment.tz.zone('"+a+"')")),!!t(a)}function y(a){return!(!a._a||void 0!==a._tzm)}function z(a){"undefined"!=typeof console&&"function"==typeof console.error&&console.error(a)}function A(b){var c=Array.prototype.slice.call(arguments,0,-1),d=arguments[arguments.length-1],e=t(d),f=a.utc.apply(null,c);return e&&!a.isMoment(b)&&y(f)&&f.add(e.parse(f),"minutes"),f.tz(d),f}function B(a){return function(){return this._z?this._z.abbr(this):a.call(this)}}function C(a){return function(){return this._z=null,a.apply(this,arguments)}}var D,E="0.5.13",F={},G={},H={},I={},J=a.version.split("."),K=+J[0],L=+J[1];(K<2||2===K&&L<6)&&z("Moment Timezone requires Moment.js >= 2.6.0. You are using Moment.js "+a.version+". See momentjs.com"),h.prototype={_set:function(a){this.name=a.name,this.abbrs=a.abbrs,this.untils=a.untils,this.offsets=a.offsets,this.population=a.population},_index:function(a){var b,c=+a,d=this.untils;for(b=0;b<d.length;b++)if(c<d[b])return b},parse:function(a){var b,c,d,e,f=+a,g=this.offsets,h=this.untils,i=h.length-1;for(e=0;e<i;e++)if(b=g[e],c=g[e+1],d=g[e?e-1:e],b<c&&A.moveAmbiguousForward?b=c:b>d&&A.moveInvalidForward&&(b=d),f<h[e]-6e4*b)return g[e];return g[i]},abbr:function(a){return this.abbrs[this._index(a)]},offset:function(a){return this.offsets[this._index(a)]}},j.prototype.scoreOffsetAt=function(a){this.offsetScore+=Math.abs(this.zone.offset(a.at)-a.offset),this.zone.abbr(a.at).replace(/[^A-Z]/g,"")!==a.abbr&&this.abbrScore++},A.version=E,A.dataVersion="",A._zones=F,A._links=G,A._names=H,A.add=s,A.link=v,A.load=w,A.zone=t,A.zoneExists=x,A.guess=q,A.names=u,A.Zone=h,A.unpack=g,A.unpackBase60=c,A.needsOffset=y,A.moveInvalidForward=!0,A.moveAmbiguousForward=!1;var M=a.fn;a.tz=A,a.defaultZone=null,a.updateOffset=function(b,c){var d,e=a.defaultZone;void 0===b._z&&(e&&y(b)&&!b._isUTC&&(b._d=a.utc(b._a)._d,b.utc().add(e.parse(b),"minutes")),b._z=e),b._z&&(d=b._z.offset(b),Math.abs(d)<16&&(d/=60),void 0!==b.utcOffset?b.utcOffset(-d,c):b.zone(d,c))},M.tz=function(b){return b?(this._z=t(b),this._z?a.updateOffset(this):z("Moment Timezone has no data for "+b+". See http://momentjs.com/timezone/docs/#/data-loading/."),this):this._z?this._z.name:void 0},M.zoneName=B(M.zoneName),M.zoneAbbr=B(M.zoneAbbr),M.utc=C(M.utc),a.tz.setDefault=function(b){return(K<2||2===K&&L<9)&&z("Moment Timezone setDefault() requires Moment.js >= 2.9.0. You are using Moment.js "+a.version+"."),a.defaultZone=b?t(b):null,a};var N=a.momentProperties;return"[object Array]"===Object.prototype.toString.call(N)?(N.push("_z"),N.push("_a")):N&&(N._z=null),w({version:"2017b",zones:["Africa/Abidjan|LMT GMT|g.8 0|01|-2ldXH.Q|48e5","Africa/Accra|LMT GMT +0020|.Q 0 -k|012121212121212121212121212121212121212121212121|-26BbX.8 6tzX.8 MnE 1BAk MnE 1BAk MnE 1BAk MnE 1C0k MnE 1BAk MnE 1BAk MnE 1BAk MnE 1C0k MnE 1BAk MnE 1BAk MnE 1BAk MnE 1C0k MnE 1BAk MnE 1BAk MnE 1BAk MnE 1C0k MnE 1BAk MnE 1BAk MnE 1BAk MnE 1C0k MnE 1BAk MnE 1BAk MnE|41e5","Africa/Nairobi|LMT EAT +0230 +0245|-2r.g -30 -2u -2J|01231|-1F3Cr.g 3Dzr.g okMu MFXJ|47e5","Africa/Algiers|PMT WET WEST CET CEST|-9.l 0 -10 -10 -20|0121212121212121343431312123431213|-2nco9.l cNb9.l HA0 19A0 1iM0 11c0 1oo0 Wo0 1rc0 QM0 1EM0 UM0 DA0 Imo0 rd0 De0 9Xz0 1fb0 1ap0 16K0 2yo0 mEp0 hwL0 jxA0 11A0 dDd0 17b0 11B0 1cN0 2Dy0 1cN0 1fB0 1cL0|26e5","Africa/Lagos|LMT WAT|-d.A -10|01|-22y0d.A|17e6","Africa/Bissau|LMT -01 GMT|12.k 10 0|012|-2ldWV.E 2xonV.E|39e4","Africa/Maputo|LMT CAT|-2a.k -20|01|-2GJea.k|26e5","Africa/Cairo|EET EEST|-20 -30|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-1bIO0 vb0 1ip0 11z0 1iN0 1nz0 12p0 1pz0 10N0 1pz0 16p0 1jz0 s3d0 Vz0 1oN0 11b0 1oO0 10N0 1pz0 10N0 1pb0 10N0 1pb0 10N0 1pb0 10N0 1pz0 10N0 1pb0 10N0 1pb0 11d0 1oL0 11d0 1pb0 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 1oL0 11d0 1WL0 rd0 1Rz0 wp0 1pb0 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 1qL0 Xd0 1oL0 11d0 1oL0 11d0 1pb0 11d0 1oL0 11d0 1oL0 11d0 1ny0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 WL0 1qN0 Rb0 1wp0 On0 1zd0 Lz0 1EN0 Fb0 c10 8n0 8Nd0 gL0 e10 mn0|15e6","Africa/Casablanca|LMT WET WEST CET|u.k 0 -10 -10|0121212121212121213121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2gMnt.E 130Lt.E rb0 Dd0 dVb0 b6p0 TX0 EoB0 LL0 gnd0 rz0 43d0 AL0 1Nd0 XX0 1Cp0 pz0 dEp0 4mn0 SyN0 AL0 1Nd0 wn0 1FB0 Db0 1zd0 Lz0 1Nf0 wM0 co0 go0 1o00 s00 dA0 vc0 11A0 A00 e00 y00 11A0 uM0 e00 Dc0 11A0 s00 e00 IM0 WM0 mo0 gM0 LA0 WM0 jA0 e00 Rc0 11A0 e00 e00 U00 11A0 8o0 e00 11A0 11A0 5A0 e00 17c0 1fA0 1a00 1a00 1fA0 17c0 1io0 14o0 1lc0 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1lc0 14o0 1fA0|32e5","Africa/Ceuta|WET WEST CET CEST|0 -10 -10 -20|010101010101010101010232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-25KN0 11z0 drd0 18p0 3HX0 17d0 1fz0 1a10 1io0 1a00 1y7o0 LL0 gnd0 rz0 43d0 AL0 1Nd0 XX0 1Cp0 pz0 dEp0 4VB0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|85e3","Africa/El_Aaiun|LMT -01 WET WEST|Q.M 10 0 -10|01232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-1rDz7.c 1GVA7.c 6L0 AL0 1Nd0 XX0 1Cp0 pz0 1cBB0 AL0 1Nd0 wn0 1FB0 Db0 1zd0 Lz0 1Nf0 wM0 co0 go0 1o00 s00 dA0 vc0 11A0 A00 e00 y00 11A0 uM0 e00 Dc0 11A0 s00 e00 IM0 WM0 mo0 gM0 LA0 WM0 jA0 e00 Rc0 11A0 e00 e00 U00 11A0 8o0 e00 11A0 11A0 5A0 e00 17c0 1fA0 1a00 1a00 1fA0 17c0 1io0 14o0 1lc0 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1lc0 14o0 1fA0|20e4","Africa/Johannesburg|SAST SAST SAST|-1u -20 -30|012121|-2GJdu 1Ajdu 1cL0 1cN0 1cL0|84e5","Africa/Khartoum|LMT CAT CAST EAT|-2a.8 -20 -30 -30|01212121212121212121212121212121213|-1yW2a.8 1zK0a.8 16L0 1iN0 17b0 1jd0 17b0 1ip0 17z0 1i10 17X0 1hB0 18n0 1hd0 19b0 1gp0 19z0 1iN0 17b0 1ip0 17z0 1i10 18n0 1hd0 18L0 1gN0 19b0 1gp0 19z0 1iN0 17z0 1i10 17X0 yGd0|51e5","Africa/Monrovia|MMT MMT GMT|H.8 I.u 0|012|-23Lzg.Q 28G01.m|11e5","Africa/Ndjamena|LMT WAT WAST|-10.c -10 -20|0121|-2le10.c 2J3c0.c Wn0|13e5","Africa/Tripoli|LMT CET CEST EET|-Q.I -10 -20 -20|012121213121212121212121213123123|-21JcQ.I 1hnBQ.I vx0 4iP0 xx0 4eN0 Bb0 7ip0 U0n0 A10 1db0 1cN0 1db0 1dd0 1db0 1eN0 1bb0 1e10 1cL0 1c10 1db0 1dd0 1db0 1cN0 1db0 1q10 fAn0 1ep0 1db0 AKq0 TA0 1o00|11e5","Africa/Tunis|PMT CET CEST|-9.l -10 -20|0121212121212121212121212121212121|-2nco9.l 18pa9.l 1qM0 DA0 3Tc0 11B0 1ze0 WM0 7z0 3d0 14L0 1cN0 1f90 1ar0 16J0 1gXB0 WM0 1rA0 11c0 nwo0 Ko0 1cM0 1cM0 1rA0 10M0 zuM0 10N0 1aN0 1qM0 WM0 1qM0 11A0 1o00|20e5","Africa/Windhoek|+0130 SAST SAST CAT WAT WAST|-1u -20 -30 -20 -10 -20|012134545454545454545454545454545454545454545454545454545454545454545454545454545454545454545|-2GJdu 1Ajdu 1cL0 1SqL0 9NA0 11D0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 11B0 1nX0 11B0|32e4","America/Adak|NST NWT NPT BST BDT AHST HST HDT|b0 a0 a0 b0 a0 a0 a0 90|012034343434343434343434343434343456767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676|-17SX0 8wW0 iB0 Qlb0 52O0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 cm0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|326","America/Anchorage|AST AWT APT AHST AHDT YST AKST AKDT|a0 90 90 a0 90 90 90 80|012034343434343434343434343434343456767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676|-17T00 8wX0 iA0 Qlb0 52O0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 cm0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|30e4","America/Port_of_Spain|LMT AST|46.4 40|01|-2kNvR.U|43e3","America/Araguaina|LMT -03 -02|3c.M 30 20|0121212121212121212121212121212121212121212121212121|-2glwL.c HdKL.c 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 dMN0 Lz0 1zd0 Rb0 1wN0 Wn0 1tB0 Rb0 1tB0 WL0 1tB0 Rb0 1zd0 On0 1HB0 FX0 ny10 Lz0|14e4","America/Argentina/Buenos_Aires|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232323232323232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wp0 Rb0 1wp0 TX0 A4p0 uL0 1qN0 WL0","America/Argentina/Catamarca|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232323132321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wq0 Ra0 1wp0 TX0 rlB0 7B0 8zb0 uL0","America/Argentina/Cordoba|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232323132323232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wq0 Ra0 1wp0 TX0 A4p0 uL0 1qN0 WL0","America/Argentina/Jujuy|CMT -04 -03 -02|4g.M 40 30 20|012121212121212121212121212121212121212121232323121323232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1ze0 TX0 1ld0 WK0 1wp0 TX0 A4p0 uL0","America/Argentina/La_Rioja|CMT -04 -03 -02|4g.M 40 30 20|012121212121212121212121212121212121212121232323231232321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Qn0 qO0 16n0 Rb0 1wp0 TX0 rlB0 7B0 8zb0 uL0","America/Argentina/Mendoza|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232312121321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1u20 SL0 1vd0 Tb0 1wp0 TW0 ri10 Op0 7TX0 uL0","America/Argentina/Rio_Gallegos|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232323232321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wp0 Rb0 1wp0 TX0 rlB0 7B0 8zb0 uL0","America/Argentina/Salta|CMT -04 -03 -02|4g.M 40 30 20|012121212121212121212121212121212121212121232323231323232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wq0 Ra0 1wp0 TX0 A4p0 uL0","America/Argentina/San_Juan|CMT -04 -03 -02|4g.M 40 30 20|012121212121212121212121212121212121212121232323231232321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Qn0 qO0 16n0 Rb0 1wp0 TX0 rld0 m10 8lb0 uL0","America/Argentina/San_Luis|CMT -04 -03 -02|4g.M 40 30 20|012121212121212121212121212121212121212121232323121212321212|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 XX0 1q20 SL0 AN0 vDb0 m10 8lb0 8L0 jd0 1qN0 WL0 1qN0","America/Argentina/Tucuman|CMT -04 -03 -02|4g.M 40 30 20|0121212121212121212121212121212121212121212323232313232123232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wq0 Ra0 1wp0 TX0 rlB0 4N0 8BX0 uL0 1qN0 WL0","America/Argentina/Ushuaia|CMT -04 -03 -02|4g.M 40 30 20|01212121212121212121212121212121212121212123232323232321232|-20UHH.c pKnH.c Mn0 1iN0 Tb0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 1C10 LX0 1C10 LX0 1C10 LX0 1C10 Mn0 MN0 2jz0 MN0 4lX0 u10 5Lb0 1pB0 Fnz0 u10 uL0 1vd0 SL0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 zvd0 Bz0 1tB0 TX0 1wp0 Rb0 1wp0 Rb0 1wp0 TX0 rkN0 8p0 8zb0 uL0","America/Curacao|LMT -0430 AST|4z.L 4u 40|012|-2kV7o.d 28KLS.d|15e4","America/Asuncion|AMT -04 -03|3O.E 40 30|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212|-1x589.k 1DKM9.k 3CL0 3Dd0 10L0 1pB0 10n0 1pB0 10n0 1pB0 1cL0 1dd0 1db0 1dd0 1cL0 1dd0 1cL0 1dd0 1cL0 1dd0 1db0 1dd0 1cL0 1dd0 1cL0 1dd0 1cL0 1dd0 1db0 1dd0 1cL0 1lB0 14n0 1dd0 1cL0 1fd0 WL0 1rd0 1aL0 1dB0 Xz0 1qp0 Xb0 1qN0 10L0 1rB0 TX0 1tB0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 1cL0 WN0 1qL0 11B0 1nX0 1ip0 WL0 1qN0 WL0 1qN0 WL0 1tB0 TX0 1tB0 TX0 1tB0 19X0 1a10 1fz0 1a10 1fz0 1cN0 17b0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0|28e5","America/Atikokan|CST CDT CWT CPT EST|60 50 50 50 50|0101234|-25TQ0 1in0 Rnb0 3je0 8x30 iw0|28e2","America/Bahia|LMT -03 -02|2y.4 30 20|01212121212121212121212121212121212121212121212121212121212121|-2glxp.U HdLp.U 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 1EN0 Lz0 1C10 IL0 1HB0 Db0 1HB0 On0 1zd0 On0 1zd0 Lz0 1zd0 Rb0 1wN0 Wn0 1tB0 Rb0 1tB0 WL0 1tB0 Rb0 1zd0 On0 1HB0 FX0 l5B0 Rb0|27e5","America/Bahia_Banderas|LMT MST CST PST MDT CDT|71 70 60 80 60 50|0121212131414141414141414141414141414152525252525252525252525252525252525252525252525252525252|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 otX0 gmN0 P2N0 13Vd0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nW0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|84e3","America/Barbados|LMT BMT AST ADT|3W.t 3W.t 40 30|01232323232|-1Q0I1.v jsM0 1ODC1.v IL0 1ip0 17b0 1ip0 17b0 1ld0 13b0|28e4","America/Belem|LMT -03 -02|3d.U 30 20|012121212121212121212121212121|-2glwK.4 HdKK.4 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0|20e5","America/Belize|LMT CST -0530 CDT|5Q.M 60 5u 50|01212121212121212121212121212121212121212121212121213131|-2kBu7.c fPA7.c Onu 1zcu Rbu 1wou Rbu 1wou Rbu 1zcu Onu 1zcu Onu 1zcu Rbu 1wou Rbu 1wou Rbu 1wou Rbu 1zcu Onu 1zcu Onu 1zcu Rbu 1wou Rbu 1wou Rbu 1zcu Onu 1zcu Onu 1zcu Onu 1zcu Rbu 1wou Rbu 1wou Rbu 1zcu Onu 1zcu Onu 1zcu Rbu 1wou Rbu 1f0Mu qn0 lxB0 mn0|57e3","America/Blanc-Sablon|AST ADT AWT APT|40 30 30 30|010230|-25TS0 1in0 UGp0 8x50 iu0|11e2","America/Boa_Vista|LMT -04 -03|42.E 40 30|0121212121212121212121212121212121|-2glvV.k HdKV.k 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 smp0 WL0 1tB0 2L0|62e2","America/Bogota|BMT -05 -04|4U.g 50 40|0121|-2eb73.I 38yo3.I 2en0|90e5","America/Boise|PST PDT MST MWT MPT MDT|80 70 70 60 60 60|0101023425252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252|-261q0 1nX0 11B0 1nX0 8C10 JCL0 8x20 ix0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 Dd0 1Kn0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|21e4","America/Cambridge_Bay|-00 MST MWT MPT MDDT MDT CST CDT EST|0 70 60 60 50 60 60 50 50|0123141515151515151515151515151515151515151515678651515151515151515151515151515151515151515151515151515151515151515151515151|-21Jc0 RO90 8x20 ix0 LCL0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11A0 1nX0 2K0 WQ0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|15e2","America/Campo_Grande|LMT -04 -03|3C.s 40 30|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212|-2glwl.w HdLl.w 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 1EN0 Lz0 1C10 IL0 1HB0 Db0 1HB0 On0 1zd0 On0 1zd0 Lz0 1zd0 Rb0 1wN0 Wn0 1tB0 Rb0 1tB0 WL0 1tB0 Rb0 1zd0 On0 1HB0 FX0 1C10 Lz0 1Ip0 HX0 1zd0 On0 1HB0 IL0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1zd0 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0|77e4","America/Cancun|LMT CST EST EDT CDT|5L.4 60 50 40 50|0123232341414141414141414141414141414141412|-1UQG0 2q2o0 yLB0 1lb0 14p0 1lb0 14p0 Lz0 xB0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 Dd0|63e4","America/Caracas|CMT -0430 -04|4r.E 4u 40|01212|-2kV7w.k 28KM2.k 1IwOu kqo0|29e5","America/Cayenne|LMT -04 -03|3t.k 40 30|012|-2mrwu.E 2gWou.E|58e3","America/Panama|CMT EST|5j.A 50|01|-2uduE.o|15e5","America/Chicago|CST CDT EST CWT CPT|60 50 50 50 50|01010101010101010101010101010101010102010101010103401010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261s0 1nX0 11B0 1nX0 1wp0 TX0 WN0 1qL0 1cN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 11B0 1Hz0 14p0 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 RB0 8x30 iw0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|92e5","America/Chihuahua|LMT MST CST CDT MDT|74.k 70 60 50 60|0121212323241414141414141414141414141414141414141414141414141414141414141414141414141414141|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 2zQN0 1lb0 14p0 1lb0 14q0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|81e4","America/Costa_Rica|SJMT CST CDT|5A.d 60 50|0121212121|-1Xd6n.L 2lu0n.L Db0 1Kp0 Db0 pRB0 15b0 1kp0 mL0|12e5","America/Creston|MST PST|70 80|010|-29DR0 43B0|53e2","America/Cuiaba|LMT -04 -03|3I.k 40 30|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212|-2glwf.E HdLf.E 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 1EN0 Lz0 1C10 IL0 1HB0 Db0 1HB0 On0 1zd0 On0 1zd0 Lz0 1zd0 Rb0 1wN0 Wn0 1tB0 Rb0 1tB0 WL0 1tB0 Rb0 1zd0 On0 1HB0 FX0 4a10 HX0 1zd0 On0 1HB0 IL0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1zd0 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0|54e4","America/Danmarkshavn|LMT -03 -02 GMT|1e.E 30 20 0|01212121212121212121212121212121213|-2a5WJ.k 2z5fJ.k 19U0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 DC0|8","America/Dawson|YST YDT YWT YPT YDDT PST PDT|90 80 80 80 70 80 70|0101023040565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565|-25TN0 1in0 1o10 13V0 Ser0 8x00 iz0 LCL0 1fA0 jrA0 fNd0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|13e2","America/Dawson_Creek|PST PDT PWT PPT MST|80 70 70 70 70|0102301010101010101010101010101010101010101010101010101014|-25TO0 1in0 UGp0 8x10 iy0 3NB0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 ML0|12e3","America/Denver|MST MDT MWT MPT|70 60 60 60|01010101023010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261r0 1nX0 11B0 1nX0 11B0 1qL0 WN0 mn0 Ord0 8x20 ix0 LCN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|26e5","America/Detroit|LMT CST EST EWT EPT EDT|5w.b 60 50 40 40 40|01234252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252|-2Cgir.N peqr.N 156L0 8x40 iv0 6fd0 11z0 Jy10 SL0 dnB0 1cL0 s10 1Vz0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|37e5","America/Edmonton|LMT MST MDT MWT MPT|7x.Q 70 60 60 60|01212121212121341212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2yd4q.8 shdq.8 1in0 17d0 hz0 2dB0 1fz0 1a10 11z0 1qN0 WL0 1qN0 11z0 IGN0 8x20 ix0 3NB0 11z0 LFB0 1cL0 3Cp0 1cL0 66N0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|10e5","America/Eirunepe|LMT -05 -04|4D.s 50 40|0121212121212121212121212121212121|-2glvk.w HdLk.w 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 dPB0 On0 yTd0 d5X0|31e3","America/El_Salvador|LMT CST CDT|5U.M 60 50|012121|-1XiG3.c 2Fvc3.c WL0 1qN0 WL0|11e5","America/Tijuana|LMT MST PST PDT PWT PPT|7M.4 70 80 70 70 70|012123245232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-1UQE0 4PX0 8mM0 8lc0 SN0 1cL0 pHB0 83r0 zI0 5O10 1Rz0 cOO0 11A0 1o00 11A0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 BUp0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 U10 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|20e5","America/Fort_Nelson|PST PDT PWT PPT MST|80 70 70 70 70|01023010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010104|-25TO0 1in0 UGp0 8x10 iy0 3NB0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0|39e2","America/Fort_Wayne|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|010101023010101010101010101040454545454545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 QI10 Db0 RB0 8x30 iw0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 5Tz0 1o10 qLb0 1cL0 1cN0 1cL0 1qhd0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Fortaleza|LMT -03 -02|2y 30 20|0121212121212121212121212121212121212121|-2glxq HdLq 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 nsp0 WL0 1tB0 5z0 2mN0 On0|34e5","America/Glace_Bay|LMT AST ADT AWT APT|3X.M 40 30 30 30|012134121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2IsI0.c CwO0.c 1in0 UGp0 8x50 iu0 iq10 11z0 Jg10 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|19e3","America/Godthab|LMT -03 -02|3q.U 30 20|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2a5Ux.4 2z5dx.4 19U0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|17e3","America/Goose_Bay|NST NDT NST NDT NWT NPT AST ADT ADDT|3u.Q 2u.Q 3u 2u 2u 2u 40 30 20|010232323232323245232323232323232323232323232323232323232326767676767676767676767676767676767676767676768676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676|-25TSt.8 1in0 DXb0 2HbX.8 WL0 1qN0 WL0 1qN0 WL0 1tB0 TX0 1tB0 WL0 1qN0 WL0 1qN0 7UHu itu 1tB0 WL0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1tB0 WL0 1ld0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 S10 g0u 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14n1 1lb0 14p0 1nW0 11C0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zcX Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|76e2","America/Grand_Turk|KMT EST EDT AST|57.b 50 40 40|0121212121212121212121212121212121212121212121212121212121212121212121212123|-2l1uQ.N 2HHBQ.N 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|37e2","America/Guatemala|LMT CST CDT|62.4 60 50|0121212121|-24KhV.U 2efXV.U An0 mtd0 Nz0 ifB0 17b0 zDB0 11z0|13e5","America/Guayaquil|QMT -05 -04|5e 50 40|0121|-1yVSK 2uILK rz0|27e5","America/Guyana|LMT -0345 -03 -04|3Q.E 3J 30 40|0123|-2dvU7.k 2r6LQ.k Bxbf|80e4","America/Halifax|LMT AST ADT AWT APT|4e.o 40 30 30 30|0121212121212121212121212121212121212121212121212134121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2IsHJ.A xzzJ.A 1db0 3I30 1in0 3HX0 IL0 1E10 ML0 1yN0 Pb0 1Bd0 Mn0 1Bd0 Rz0 1w10 Xb0 1w10 LX0 1w10 Xb0 1w10 Lz0 1C10 Jz0 1E10 OL0 1yN0 Un0 1qp0 Xb0 1qp0 11X0 1w10 Lz0 1HB0 LX0 1C10 FX0 1w10 Xb0 1qp0 Xb0 1BB0 LX0 1td0 Xb0 1qp0 Xb0 Rf0 8x50 iu0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 3Qp0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 3Qp0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 6i10 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|39e4","America/Havana|HMT CST CDT|5t.A 50 40|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1Meuu.o 72zu.o ML0 sld0 An0 1Nd0 Db0 1Nd0 An0 6Ep0 An0 1Nd0 An0 JDd0 Mn0 1Ap0 On0 1fd0 11X0 1qN0 WL0 1wp0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 14n0 1ld0 14L0 1kN0 15b0 1kp0 1cL0 1cN0 1fz0 1a10 1fz0 1fB0 11z0 14p0 1nX0 11B0 1nX0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 14n0 1ld0 14n0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 1a10 1in0 1a10 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 17c0 1o00 11A0 1qM0 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 11A0 6i00 Rc0 1wo0 U00 1tA0 Rc0 1wo0 U00 1wo0 U00 1zc0 U00 1qM0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0|21e5","America/Hermosillo|LMT MST CST PST MDT|7n.Q 70 60 80 60|0121212131414141|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 otX0 gmN0 P2N0 13Vd0 1lb0 14p0 1lb0 14p0 1lb0|64e4","America/Indiana/Knox|CST CDT CWT CPT EST|60 50 50 50 50|0101023010101010101010101010101010101040101010101010101010101010101010101010101010101010141010101010101010101010101010101010101010101010101010101010101010|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 3NB0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 11z0 1o10 11z0 1o10 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 3Cn0 8wp0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 z8o0 1o00 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Marengo|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|0101023010101010101010104545454545414545454545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 dyN0 11z0 6fd0 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 jrz0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1VA0 LA0 1BX0 1e6p0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Petersburg|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|01010230101010101010101010104010101010101010101010141014545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 njX0 WN0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 3Fb0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 19co0 1o00 Rd0 1zb0 Oo0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Tell_City|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|01010230101010101010101010101010454541010101010101010101010101010101010101010101010101010101010101010|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 1o10 11z0 g0p0 11z0 1o10 11z0 1qL0 WN0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 WL0 1qN0 1cL0 1cN0 1cL0 1cN0 caL0 1cL0 1cN0 1cL0 1qhd0 1o00 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Vevay|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|010102304545454545454545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 kPB0 Awn0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1lnd0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Vincennes|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|01010230101010101010101010101010454541014545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 1o10 11z0 g0p0 11z0 1o10 11z0 1qL0 WN0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 WL0 1qN0 1cL0 1cN0 1cL0 1cN0 caL0 1cL0 1cN0 1cL0 1qhd0 1o00 Rd0 1zb0 Oo0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Indiana/Winamac|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|01010230101010101010101010101010101010454541054545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 jrz0 1cL0 1cN0 1cL0 1qhd0 1o00 Rd0 1za0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Inuvik|-00 PST PDDT MST MDT|0 80 60 70 60|0121343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343|-FnA0 tWU0 1fA0 wPe0 2pz0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|35e2","America/Iqaluit|-00 EWT EPT EST EDDT EDT CST CDT|0 40 40 50 30 40 60 50|01234353535353535353535353535353535353535353567353535353535353535353535353535353535353535353535353535353535353535353535353|-16K00 7nX0 iv0 LCL0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11C0 1nX0 11A0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|67e2","America/Jamaica|KMT EST EDT|57.b 50 40|0121212121212121212121|-2l1uQ.N 2uM1Q.N 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0|94e4","America/Juneau|PST PWT PPT PDT YDT YST AKST AKDT|80 70 70 70 80 90 90 80|01203030303030303030303030403030356767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676|-17T20 8x10 iy0 Vo10 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cM0 1cM0 1cL0 1cN0 1fz0 1a10 1fz0 co0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|33e3","America/Kentucky/Louisville|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|0101010102301010101010101010101010101454545454545414545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 3Fd0 Nb0 LPd0 11z0 RB0 8x30 iw0 Bb0 10N0 2bB0 8in0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 xz0 gso0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1VA0 LA0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Kentucky/Monticello|CST CDT CWT CPT EST EDT|60 50 50 50 50 40|0101023010101010101010101010101010101010101010101010101010101010101010101454545454545454545454545454545454545454545454545454545454545454545454545454|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 SWp0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11A0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/La_Paz|CMT BOST -04|4w.A 3w.A 40|012|-1x37r.o 13b0|19e5","America/Lima|LMT -05 -04|58.A 50 40|0121212121212121|-2tyGP.o 1bDzP.o zX0 1aN0 1cL0 1cN0 1cL0 1PrB0 zX0 1O10 zX0 6Gp0 zX0 98p0 zX0|11e6","America/Los_Angeles|PST PDT PWT PPT|80 70 70 70|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261q0 1nX0 11B0 1nX0 SgN0 8x10 iy0 5Wp1 1VaX 3dA0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1a00 1fA0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|15e6","America/Maceio|LMT -03 -02|2m.Q 30 20|012121212121212121212121212121212121212121|-2glxB.8 HdLB.8 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 dMN0 Lz0 8Q10 WL0 1tB0 5z0 2mN0 On0|93e4","America/Managua|MMT CST EST CDT|5J.c 60 50 50|0121313121213131|-1quie.M 1yAMe.M 4mn0 9Up0 Dz0 1K10 Dz0 s3F0 1KH0 DB0 9In0 k8p0 19X0 1o30 11y0|22e5","America/Manaus|LMT -04 -03|40.4 40 30|01212121212121212121212121212121|-2glvX.U HdKX.U 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 dPB0 On0|19e5","America/Martinique|FFMT AST ADT|44.k 40 30|0121|-2mPTT.E 2LPbT.E 19X0|39e4","America/Matamoros|LMT CST CDT|6E 60 50|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1UQG0 2FjC0 1nX0 i6p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 U10 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|45e4","America/Mazatlan|LMT MST CST PST MDT|75.E 70 60 80 60|0121212131414141414141414141414141414141414141414141414141414141414141414141414141414141414141|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 otX0 gmN0 P2N0 13Vd0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|44e4","America/Menominee|CST CDT CWT CPT EST|60 50 50 50 50|01010230101041010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 1o10 11z0 LCN0 1fz0 6410 9Jb0 1cM0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|85e2","America/Merida|LMT CST EST CDT|5W.s 60 50 50|0121313131313131313131313131313131313131313131313131313131313131313131313131313131313131|-1UQG0 2q2o0 2hz0 wu30 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|11e5","America/Metlakatla|PST PWT PPT PDT AKST AKDT|80 70 70 70 90 80|0120303030303030303030303030303030454545454545454545454545454545454545454545454|-17T20 8x10 iy0 Vo10 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1hU10 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|14e2","America/Mexico_City|LMT MST CST CDT CWT|6A.A 70 60 50 50|012121232324232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 gEn0 TX0 3xd0 Jb0 6zB0 SL0 e5d0 17b0 1Pff0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|20e6","America/Miquelon|LMT AST -03 -02|3I.E 40 30 20|012323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-2mKkf.k 2LTAf.k gQ10 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|61e2","America/Moncton|EST AST ADT AWT APT|50 40 30 30 30|012121212121212121212134121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2IsH0 CwN0 1in0 zAo0 An0 1Nd0 An0 1Nd0 An0 1Nd0 An0 1Nd0 An0 1Nd0 An0 1K10 Lz0 1zB0 NX0 1u10 Wn0 S20 8x50 iu0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 3Cp0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14n1 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 ReX 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|64e3","America/Monterrey|LMT CST CDT|6F.g 60 50|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1UQG0 2FjC0 1nX0 i6p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0|41e5","America/Montevideo|MMT -0330 -03 -02 -0230|3I.I 3u 30 20 2u|012121212121212121212121213232323232324242423243232323232323232323232323232323232323232|-20UIf.g 8jzJ.g 1cLu 1dcu 1cLu 1dcu 1cLu ircu 11zu 1o0u 11zu 1o0u 11zu 1qMu WLu 1qMu WLu 1qMu WLu 1qMu 11zu 1o0u 11zu NAu 11bu 2iMu zWu Dq10 19X0 pd0 jz0 cm10 19X0 1fB0 1on0 11d0 1oL0 1nB0 1fzu 1aou 1fzu 1aou 1fzu 3nAu Jb0 3MN0 1SLu 4jzu 2PB0 Lb0 3Dd0 1pb0 ixd0 An0 1MN0 An0 1wp0 On0 1wp0 Rb0 1zd0 On0 1wp0 Rb0 s8p0 1fB0 1ip0 11z0 1ld0 14n0 1o10 11z0 1o10 11z0 1o10 14n0 1ld0 14n0 1ld0 14n0 1o10 11z0 1o10 11z0 1o10 11z0|17e5","America/Toronto|EST EDT EWT EPT|50 40 40 40|01010101010101010101010101010101010101010101012301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-25TR0 1in0 11Wu 1nzu 1fD0 WJ0 1wr0 Nb0 1Ap0 On0 1zd0 On0 1wp0 TX0 1tB0 TX0 1tB0 TX0 1tB0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 4kM0 8x40 iv0 1o10 11z0 1nX0 11z0 1o10 11z0 1o10 1qL0 11D0 1nX0 11B0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|65e5","America/Nassau|LMT EST EDT|59.u 50 40|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2kNuO.u 26XdO.u 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|24e4","America/New_York|EST EDT EWT EPT|50 40 40 40|01010101010101010101010101010101010101010101010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261t0 1nX0 11B0 1nX0 11B0 1qL0 1a10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 RB0 8x40 iv0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|21e6","America/Nipigon|EST EDT EWT EPT|50 40 40 40|010123010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-25TR0 1in0 Rnb0 3je0 8x40 iv0 19yN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|16e2","America/Nome|NST NWT NPT BST BDT YST AKST AKDT|b0 a0 a0 b0 a0 90 90 80|012034343434343434343434343434343456767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676767676|-17SX0 8wW0 iB0 Qlb0 52O0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 cl0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|38e2","America/Noronha|LMT -02 -01|29.E 20 10|0121212121212121212121212121212121212121|-2glxO.k HdKO.k 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 nsp0 WL0 1tB0 2L0 2pB0 On0|30e2","America/North_Dakota/Beulah|MST MDT MWT MPT CST CDT|70 60 60 60 60 50|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101014545454545454545454545454545454545454545454545454545454|-261r0 1nX0 11B0 1nX0 SgN0 8x20 ix0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Oo0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/North_Dakota/Center|MST MDT MWT MPT CST CDT|70 60 60 60 60 50|010102301010101010101010101010101010101010101010101010101014545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-261r0 1nX0 11B0 1nX0 SgN0 8x20 ix0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14o0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/North_Dakota/New_Salem|MST MDT MWT MPT CST CDT|70 60 60 60 60 50|010102301010101010101010101010101010101010101010101010101010101010101010101010101454545454545454545454545454545454545454545454545454545454545454545454|-261r0 1nX0 11B0 1nX0 SgN0 8x20 ix0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14o0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","America/Ojinaga|LMT MST CST CDT MDT|6V.E 70 60 50 60|0121212323241414141414141414141414141414141414141414141414141414141414141414141414141414141|-1UQF0 deL0 8lc0 17c0 10M0 1dd0 2zQN0 1lb0 14p0 1lb0 14q0 1lb0 14p0 1nX0 11B0 1nX0 1fB0 WL0 1fB0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 U10 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|23e3","America/Pangnirtung|-00 AST AWT APT ADDT ADT EDT EST CST CDT|0 40 30 30 20 30 40 50 60 50|012314151515151515151515151515151515167676767689767676767676767676767676767676767676767676767676767676767676767676767676767|-1XiM0 PnG0 8x50 iu0 LCL0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1o00 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11C0 1nX0 11A0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|14e2","America/Paramaribo|LMT PMT PMT -0330 -03|3E.E 3E.Q 3E.A 3u 30|01234|-2nDUj.k Wqo0.c qanX.I 1yVXN.o|24e4","America/Phoenix|MST MDT MWT|70 60 60|01010202010|-261r0 1nX0 11B0 1nX0 SgN0 4Al1 Ap0 1db0 SWqX 1cL0|42e5","America/Port-au-Prince|PPMT EST EDT|4N 50 40|01212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-28RHb 2FnMb 19X0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14q0 1o00 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 14o0 1o00 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 i6n0 1nX0 11B0 1nX0 d430 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 3iN0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|23e5","America/Rio_Branco|LMT -05 -04|4v.c 50 40|01212121212121212121212121212121|-2glvs.M HdLs.M 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 NBd0 d5X0|31e4","America/Porto_Velho|LMT -04 -03|4f.A 40 30|012121212121212121212121212121|-2glvI.o HdKI.o 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0|37e4","America/Puerto_Rico|AST AWT APT|40 30 30|0120|-17lU0 7XT0 iu0|24e5","America/Punta_Arenas|SMT -05 -04 -03|4G.K 50 40 30|0102021212121212121232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323|-2q2jh.e fJAh.e 5knG.K 1Vzh.e jRAG.K 1pbh.e 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 nHX0 op0 blz0 ko0 Qeo0 WL0 1zd0 On0 1ip0 11z0 1o10 11z0 1qN0 WL0 1ld0 14n0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 1cL0 1cN0 11z0 1o10 11z0 1qN0 WL0 1fB0 19X0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1ip0 1fz0 1fB0 11z0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1o10 19X0 1fB0 1nX0 G10 1EL0 Op0 1zb0 Rd0 1wn0 Rd0 46n0 Ap0","America/Rainy_River|CST CDT CWT CPT|60 50 50 50|010123010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-25TQ0 1in0 Rnb0 3je0 8x30 iw0 19yN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|842","America/Rankin_Inlet|-00 CST CDDT CDT EST|0 60 40 50 50|012131313131313131313131313131313131313131313431313131313131313131313131313131313131313131313131313131313131313131313131|-vDc0 keu0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|26e2","America/Recife|LMT -03 -02|2j.A 30 20|0121212121212121212121212121212121212121|-2glxE.o HdLE.o 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 nsp0 WL0 1tB0 2L0 2pB0 On0|33e5","America/Regina|LMT MST MDT MWT MPT CST|6W.A 70 60 60 60 60|012121212121212121212121341212121212121212121212121215|-2AD51.o uHe1.o 1in0 s2L0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 66N0 1cL0 1cN0 19X0 1fB0 1cL0 1fB0 1cL0 1cN0 1cL0 M30 8x20 ix0 1ip0 1cL0 1ip0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 3NB0 1cL0 1cN0|19e4","America/Resolute|-00 CST CDDT CDT EST|0 60 40 50 50|012131313131313131313131313131313131313131313431313131313431313131313131313131313131313131313131313131313131313131313131|-SnA0 GWS0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|229","America/Santarem|LMT -04 -03|3C.M 40 30|0121212121212121212121212121212|-2glwl.c HdLl.c 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 qe10 xb0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 NBd0|21e4","America/Santiago|SMT -05 -04 -03|4G.K 50 40 30|010202121212121212321232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323|-2q2jh.e fJAh.e 5knG.K 1Vzh.e jRAG.K 1pbh.e 11d0 1oL0 11d0 1oL0 11d0 1oL0 11d0 1pb0 11d0 nHX0 op0 9Bz0 jb0 1oN0 ko0 Qeo0 WL0 1zd0 On0 1ip0 11z0 1o10 11z0 1qN0 WL0 1ld0 14n0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 1cL0 1cN0 11z0 1o10 11z0 1qN0 WL0 1fB0 19X0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1ip0 1fz0 1fB0 11z0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1o10 19X0 1fB0 1nX0 G10 1EL0 Op0 1zb0 Rd0 1wn0 Rd0 46n0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0|62e5","America/Santo_Domingo|SDMT EST EDT -0430 AST|4E 50 40 4u 40|01213131313131414|-1ttjk 1lJMk Mn0 6sp0 Lbu 1Cou yLu 1RAu wLu 1QMu xzu 1Q0u xXu 1PAu 13jB0 e00|29e5","America/Sao_Paulo|LMT -03 -02|36.s 30 20|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212|-2glwR.w HdKR.w 1cc0 1e10 1bX0 Ezd0 So0 1vA0 Mn0 1BB0 ML0 1BB0 zX0 pTd0 PX0 2ep0 nz0 1C10 zX0 1C10 LX0 1C10 Mn0 H210 Rb0 1tB0 IL0 1Fd0 FX0 1EN0 FX0 1HB0 Lz0 1EN0 Lz0 1C10 IL0 1HB0 Db0 1HB0 On0 1zd0 On0 1zd0 Lz0 1zd0 Rb0 1wN0 Wn0 1tB0 Rb0 1tB0 WL0 1tB0 Rb0 1zd0 On0 1HB0 FX0 1C10 Lz0 1Ip0 HX0 1zd0 On0 1HB0 IL0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1zd0 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0 On0 1zd0 On0 1zd0 On0 1C10 Lz0 1C10 Lz0 1C10 Lz0 1C10 On0 1zd0 Rb0 1wp0 On0 1C10 Lz0 1C10 On0 1zd0|20e6","America/Scoresbysund|LMT -02 -01 +00|1r.Q 20 10 0|0121323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-2a5Ww.8 2z5ew.8 1a00 1cK0 1cL0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|452","America/Sitka|PST PWT PPT PDT YST AKST AKDT|80 70 70 70 90 90 80|01203030303030303030303030303030345656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565|-17T20 8x10 iy0 Vo10 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 co0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|90e2","America/St_Johns|NST NDT NST NDT NWT NPT NDDT|3u.Q 2u.Q 3u 2u 2u 2u 1u|01010101010101010101010101010101010102323232323232324523232323232323232323232323232323232323232323232323232323232323232323232323232323232326232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-28oit.8 14L0 1nB0 1in0 1gm0 Dz0 1JB0 1cL0 1cN0 1cL0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1fB0 1cL0 1cN0 1cL0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1fB0 1cL0 1fB0 19X0 1fB0 19X0 10O0 eKX.8 19X0 1iq0 WL0 1qN0 WL0 1qN0 WL0 1tB0 TX0 1tB0 WL0 1qN0 WL0 1qN0 7UHu itu 1tB0 WL0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1tB0 WL0 1ld0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14n1 1lb0 14p0 1nW0 11C0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zcX Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|11e4","America/Swift_Current|LMT MST MDT MWT MPT CST|7b.k 70 60 60 60 60|012134121212121212121215|-2AD4M.E uHdM.E 1in0 UGp0 8x20 ix0 1o10 17b0 1ip0 11z0 1o10 11z0 1o10 11z0 isN0 1cL0 3Cp0 1cL0 1cN0 11z0 1qN0 WL0 pMp0|16e3","America/Tegucigalpa|LMT CST CDT|5M.Q 60 50|01212121|-1WGGb.8 2ETcb.8 WL0 1qN0 WL0 GRd0 AL0|11e5","America/Thule|LMT AST ADT|4z.8 40 30|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2a5To.Q 31NBo.Q 1cL0 1cN0 1cL0 1fB0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|656","America/Thunder_Bay|CST EST EWT EPT EDT|60 50 40 40 40|0123141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141|-2q5S0 1iaN0 8x40 iv0 XNB0 1cL0 1cN0 1fz0 1cN0 1cL0 3Cp0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|11e4","America/Vancouver|PST PDT PWT PPT|80 70 70 70|0102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-25TO0 1in0 UGp0 8x10 iy0 1o10 17b0 1ip0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|23e5","America/Whitehorse|YST YDT YWT YPT YDDT PST PDT|90 80 80 80 70 80 70|0101023040565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565656565|-25TN0 1in0 1o10 13V0 Ser0 8x00 iz0 LCL0 1fA0 3NA0 vrd0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|23e3","America/Winnipeg|CST CDT CWT CPT|60 50 50 50|010101023010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aIi0 WL0 3ND0 1in0 Jap0 Rb0 aCN0 8x30 iw0 1tB0 11z0 1ip0 11z0 1o10 11z0 1o10 11z0 1rd0 10L0 1op0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 1cL0 1cN0 11z0 6i10 WL0 6i10 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1a00 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1a00 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 14o0 1lc0 14o0 1o00 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 14o0 1o00 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1o00 11A0 1o00 11A0 1o00 14o0 1lc0 14o0 1lc0 14o0 1o00 11A0 1o00 11A0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|66e4","America/Yakutat|YST YWT YPT YDT AKST AKDT|90 80 80 80 90 80|01203030303030303030303030303030304545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-17T10 8x00 iz0 Vo10 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 cn0 10q0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|642","America/Yellowknife|-00 MST MWT MPT MDDT MDT|0 70 60 60 50 60|012314151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151515151|-1pdA0 hix0 8x20 ix0 LCL0 1fA0 zgO0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|19e3","Antarctica/Casey|-00 +08 +11|0 -80 -b0|0121212|-2q00 1DjS0 T90 40P0 KL0 blz0|10","Antarctica/Davis|-00 +07 +05|0 -70 -50|01012121|-vyo0 iXt0 alj0 1D7v0 VB0 3Wn0 KN0|70","Antarctica/DumontDUrville|-00 +10|0 -a0|0101|-U0o0 cfq0 bFm0|80","Antarctica/Macquarie|AEST AEDT -00 +11|-a0 -b0 0 -b0|0102010101010101010101010101010101010101010101010101010101010101010101010101010101010101013|-29E80 19X0 4SL0 1ayy0 Lvs0 1cM0 1o00 Rc0 1wo0 Rc0 1wo0 U00 1wo0 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1qM0 WM0 1qM0 Oo0 1zc0 Oo0 1zc0 Oo0 1wo0 WM0 1tA0 WM0 1tA0 U00 1tA0 U00 1tA0 11A0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 11A0 1o00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1cM0 1cM0 1cM0|1","Antarctica/Mawson|-00 +06 +05|0 -60 -50|012|-CEo0 2fyk0|60","Pacific/Auckland|NZMT NZST NZST NZDT|-bu -cu -c0 -d0|01020202020202020202020202023232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323|-1GCVu Lz0 1tB0 11zu 1o0u 11zu 1o0u 11zu 1o0u 14nu 1lcu 14nu 1lcu 1lbu 11Au 1nXu 11Au 1nXu 11Au 1nXu 11Au 1nXu 11Au 1qLu WMu 1qLu 11Au 1n1bu IM0 1C00 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1qM0 14o0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1io0 17c0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1io0 17c0 1io0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00|14e5","Antarctica/Palmer|-00 -03 -04 -02|0 30 40 20|0121212121213121212121212121212121212121212121212121212121212121212121212121212121|-cao0 nD0 1vd0 SL0 1vd0 17z0 1cN0 1fz0 1cN0 1cL0 1cN0 asn0 Db0 jsN0 14N0 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 1cL0 1cN0 11z0 1o10 11z0 1qN0 WL0 1fB0 19X0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1ip0 1fz0 1fB0 11z0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1o10 19X0 1fB0 1nX0 G10 1EL0 Op0 1zb0 Rd0 1wn0 Rd0 46n0 Ap0|40","Antarctica/Rothera|-00 -03|0 30|01|gOo0|130","Antarctica/Syowa|-00 +03|0 -30|01|-vs00|20","Antarctica/Troll|-00 +00 +02|0 0 -20|01212121212121212121212121212121212121212121212121212121212121212121|1puo0 hd0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|40","Antarctica/Vostok|-00 +06|0 -60|01|-tjA0|25","Europe/Oslo|CET CEST|-10 -20|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2awM0 Qm0 W6o0 5pf0 WM0 1fA0 1cM0 1cM0 1cM0 1cM0 wJc0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1qM0 WM0 zpc0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|62e4","Asia/Riyadh|LMT +03|-36.Q -30|01|-TvD6.Q|57e5","Asia/Almaty|LMT +05 +06 +07|-57.M -50 -60 -70|012323232323232323232321232323232323232323232323232|-1Pc57.M eUo7.M 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0|15e5","Asia/Amman|LMT EET EEST|-2n.I -20 -30|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1yW2n.I 1HiMn.I KL0 1oN0 11b0 1oN0 11b0 1pd0 1dz0 1cp0 11b0 1op0 11b0 fO10 1db0 1e10 1cL0 1cN0 1cL0 1cN0 1fz0 1pd0 10n0 1ld0 14n0 1hB0 15b0 1ip0 19X0 1cN0 1cL0 1cN0 17b0 1ld0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1So0 y00 1fc0 1dc0 1co0 1dc0 1cM0 1cM0 1cM0 1o00 11A0 1lc0 17c0 1cM0 1cM0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 4bX0 Dd0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0|25e5","Asia/Anadyr|LMT +12 +13 +14 +11|-bN.U -c0 -d0 -e0 -b0|01232121212121212121214121212121212121212121212121212121212141|-1PcbN.U eUnN.U 23CL0 1db0 2q10 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 2sp0 WM0|13e3","Asia/Aqtau|LMT +04 +05 +06|-3l.4 -40 -50 -60|012323232323232323232123232312121212121212121212|-1Pc3l.4 eUnl.4 24PX0 2pX0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0|15e4","Asia/Aqtobe|LMT +04 +05 +06|-3M.E -40 -50 -60|0123232323232323232321232323232323232323232323232|-1Pc3M.E eUnM.E 23CL0 3Db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0|27e4","Asia/Ashgabat|LMT +04 +05 +06|-3R.w -40 -50 -60|0123232323232323232323212|-1Pc3R.w eUnR.w 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0|41e4","Asia/Atyrau|LMT +03 +05 +06 +04|-3r.I -30 -50 -60 -40|01232323232323232323242323232323232324242424242|-1Pc3r.I eUor.I 24PW0 2pX0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 2sp0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0","Asia/Baghdad|BMT +03 +04|-2V.A -30 -40|012121212121212121212121212121212121212121212121212121|-26BeV.A 2ACnV.A 11b0 1cp0 1dz0 1dd0 1db0 1cN0 1cp0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1de0 1dc0 1dc0 1dc0 1cM0 1dc0 1cM0 1dc0 1cM0 1dc0 1dc0 1dc0 1cM0 1dc0 1cM0 1dc0 1cM0 1dc0 1dc0 1dc0 1cM0 1dc0 1cM0 1dc0 1cM0 1dc0 1dc0 1dc0 1cM0 1dc0 1cM0 1dc0 1cM0 1dc0|66e5","Asia/Qatar|LMT +04 +03|-3q.8 -40 -30|012|-21Jfq.8 27BXq.8|96e4","Asia/Baku|LMT +03 +04 +05|-3j.o -30 -40 -50|01232323232323232323232123232323232323232323232323232323232323232|-1Pc3j.o 1jUoj.o WCL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 1cM0 9Je0 1o00 11z0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|27e5","Asia/Bangkok|BMT +07|-6G.4 -70|01|-218SG.4|15e6","Asia/Barnaul|LMT +06 +07 +08|-5z -60 -70 -80|0123232323232323232323212323232321212121212121212121212121212121212|-21S5z pCnz 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 p90 LE0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3rd0","Asia/Beirut|EET EEST|-20 -30|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-21aq0 1on0 1410 1db0 19B0 1in0 1ip0 WL0 1lQp0 11b0 1oN0 11b0 1oN0 11b0 1pd0 11b0 1oN0 11b0 q6N0 En0 1oN0 11b0 1oN0 11b0 1oN0 11b0 1pd0 11b0 1oN0 11b0 1op0 11b0 dA10 17b0 1iN0 17b0 1iN0 17b0 1iN0 17b0 1vB0 SL0 1mp0 13z0 1iN0 17b0 1iN0 17b0 1jd0 12n0 1a10 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0|22e5","Asia/Bishkek|LMT +05 +06 +07|-4W.o -50 -60 -70|012323232323232323232321212121212121212121212121212|-1Pc4W.o eUnW.o 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2e00 1tX0 17b0 1ip0 17b0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1cPu 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0|87e4","Asia/Brunei|LMT +0730 +08|-7D.E -7u -80|012|-1KITD.E gDc9.E|42e4","Asia/Kolkata|HMT +0630 IST|-5R.k -6u -5u|01212|-18LFR.k 1unn.k HB0 7zX0|15e6","Asia/Chita|LMT +08 +09 +10|-7x.Q -80 -90 -a0|012323232323232323232321232323232323232323232323232323232323232312|-21Q7x.Q pAnx.Q 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3re0|33e4","Asia/Choibalsan|LMT +07 +08 +10 +09|-7C -70 -80 -a0 -90|0123434343434343434343434343434343434343434343424242|-2APHC 2UkoC cKn0 1da0 1dd0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 6hD0 11z0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 3Db0 h1f0 1cJ0 1cP0 1cJ0|38e3","Asia/Shanghai|CST CDT|-80 -90|01010101010101010|-1c1I0 LX0 16p0 1jz0 1Myp0 Rb0 1o10 11z0 1o10 11z0 1qN0 11z0 1o10 11z0 1o10 11z0|23e6","Asia/Colombo|MMT +0530 +06 +0630|-5j.w -5u -60 -6u|01231321|-2zOtj.w 1rFbN.w 1zzu 7Apu 23dz0 11zu n3cu|22e5","Asia/Dhaka|HMT +0630 +0530 +06 +07|-5R.k -6u -5u -60 -70|0121343|-18LFR.k 1unn.k HB0 m6n0 2kxbu 1i00|16e6","Asia/Damascus|LMT EET EEST|-2p.c -20 -30|01212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-21Jep.c Hep.c 17b0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1xRB0 11X0 1oN0 10L0 1pB0 11b0 1oN0 10L0 1mp0 13X0 1oN0 11b0 1pd0 11b0 1oN0 11b0 1oN0 11b0 1oN0 11b0 1pd0 11b0 1oN0 11b0 1oN0 11b0 1oN0 11b0 1pd0 11b0 1oN0 Nb0 1AN0 Nb0 bcp0 19X0 1gp0 19X0 3ld0 1xX0 Vd0 1Bz0 Sp0 1vX0 10p0 1dz0 1cN0 1cL0 1db0 1db0 1g10 1an0 1ap0 1db0 1fd0 1db0 1cN0 1db0 1dd0 1db0 1cp0 1dz0 1c10 1dX0 1cN0 1db0 1dd0 1db0 1cN0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1db0 1cN0 1db0 1cN0 19z0 1fB0 1qL0 11B0 1on0 Wp0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0|26e5","Asia/Dili|LMT +08 +09|-8m.k -80 -90|01212|-2le8m.k 1dnXm.k 1nfA0 Xld0|19e4","Asia/Dubai|LMT +04|-3F.c -40|01|-21JfF.c|39e5","Asia/Dushanbe|LMT +05 +06 +07|-4z.c -50 -60 -70|012323232323232323232321|-1Pc4z.c eUnz.c 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2hB0|76e4","Asia/Famagusta|LMT EET EEST +03|-2f.M -20 -30 -30|01212121212121212121212121212121212121212121212121212121212121212121212121212121212123|-1Vc2f.M 2a3cf.M 1cL0 1qp0 Xz0 19B0 19X0 1fB0 1db0 1cp0 1cL0 1fB0 19X0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1o30 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 15U0","Asia/Gaza|EET EEST IST IDT|-20 -30 -20 -30|010101010101010101010101010101012323232323232323232323232320101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-1c2q0 5Rb0 10r0 1px0 10N0 1pz0 16p0 1jB0 16p0 1jx0 pBd0 Vz0 1oN0 11b0 1oO0 10N0 1pz0 10N0 1pb0 10N0 1pb0 10N0 1pb0 10N0 1pz0 10N0 1pb0 10N0 1pb0 11d0 1oL0 dW0 hfB0 Db0 1fB0 Rb0 npB0 11z0 1C10 IL0 1s10 10n0 1o10 WL0 1zd0 On0 1ld0 11z0 1o10 14n0 1o10 14n0 1nd0 12n0 1nd0 Xz0 1q10 12n0 M10 C00 17c0 1io0 17c0 1io0 17c0 1o00 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 17c0 1io0 18N0 1bz0 19z0 1gp0 1610 1iL0 11z0 1o10 14o0 1lA1 SKX 1xd1 MKX 1AN0 1a00 1fA0 1cL0 1cN0 1nX0 1210 1nz0 1220 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0|18e5","Asia/Hebron|EET EEST IST IDT|-20 -30 -20 -30|01010101010101010101010101010101232323232323232323232323232010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-1c2q0 5Rb0 10r0 1px0 10N0 1pz0 16p0 1jB0 16p0 1jx0 pBd0 Vz0 1oN0 11b0 1oO0 10N0 1pz0 10N0 1pb0 10N0 1pb0 10N0 1pb0 10N0 1pz0 10N0 1pb0 10N0 1pb0 11d0 1oL0 dW0 hfB0 Db0 1fB0 Rb0 npB0 11z0 1C10 IL0 1s10 10n0 1o10 WL0 1zd0 On0 1ld0 11z0 1o10 14n0 1o10 14n0 1nd0 12n0 1nd0 Xz0 1q10 12n0 M10 C00 17c0 1io0 17c0 1io0 17c0 1o00 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 17c0 1io0 18N0 1bz0 19z0 1gp0 1610 1iL0 12L0 1mN0 14o0 1lc0 Tb0 1xd1 MKX bB0 cn0 1cN0 1a00 1fA0 1cL0 1cN0 1nX0 1210 1nz0 1220 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0|25e4","Asia/Ho_Chi_Minh|LMT PLMT +07 +08 +09|-76.E -76.u -70 -80 -90|0123423232|-2yC76.E bK00.a 1h7b6.u 5lz0 18o0 3Oq0 k5b0 aW00 BAM0|90e5","Asia/Hong_Kong|LMT HKT HKST JST|-7A.G -80 -90 -90|0121312121212121212121212121212121212121212121212121212121212121212121|-2CFHA.G 1sEP6.G 1cL0 ylu 93X0 1qQu 1tX0 Rd0 1In0 NB0 1cL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1kL0 14N0 1nX0 U10 1tz0 U10 1wn0 Rd0 1wn0 U10 1tz0 U10 1tz0 U10 1tz0 U10 1wn0 Rd0 1wn0 Rd0 1wn0 U10 1tz0 U10 1tz0 17d0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 s10 1Vz0 1cN0 1cL0 1cN0 1cL0 6fd0 14n0|73e5","Asia/Hovd|LMT +06 +07 +08|-66.A -60 -70 -80|012323232323232323232323232323232323232323232323232|-2APG6.A 2Uko6.A cKn0 1db0 1dd0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 6hD0 11z0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 kEp0 1cJ0 1cP0 1cJ0|81e3","Asia/Irkutsk|IMT +07 +08 +09|-6V.5 -70 -80 -90|01232323232323232323232123232323232323232323232323232323232323232|-21zGV.5 pjXV.5 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|60e4","Europe/Istanbul|IMT EET EEST +04 +03|-1U.U -20 -30 -40 -30|012121212121212121212121212121212121212121212121212121234343434342121212121212121212121212121212121212121212121212121212121212124|-2ogNU.U dzzU.U 11b0 8tB0 1on0 1410 1db0 19B0 1in0 3Rd0 Un0 1oN0 11b0 zSp0 CL0 mN0 1Vz0 1gN0 1pz0 5Rd0 1fz0 1yp0 ML0 1kp0 17b0 1ip0 17b0 1fB0 19X0 1jB0 18L0 1ip0 17z0 qdd0 xX0 3S10 Tz0 dA10 11z0 1o10 11z0 1qN0 11z0 1ze0 11B0 WM0 1qO0 WI0 1nX0 1rB0 10L0 11B0 1in0 17d0 1in0 2pX0 19E0 1fU0 16Q0 1iI0 16Q0 1iI0 1Vd0 pb0 3Kp0 14o0 1de0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1a00 1fA0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WO0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 Xc0 1qo0 WM0 1qM0 11A0 1o00 1200 1nA0 11A0 1tA0 U00 15w0|13e6","Asia/Jakarta|BMT +0720 +0730 +09 +08 WIB|-77.c -7k -7u -90 -80 -70|01232425|-1Q0Tk luM0 mPzO 8vWu 6kpu 4PXu xhcu|31e6","Asia/Jayapura|LMT +09 +0930 WIT|-9m.M -90 -9u -90|0123|-1uu9m.M sMMm.M L4nu|26e4","Asia/Jerusalem|JMT IST IDT IDDT|-2k.E -20 -30 -40|01212121212132121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-26Bek.E SyMk.E 5Rb0 10r0 1px0 10N0 1pz0 16p0 1jB0 16p0 1jx0 3LB0 Em0 or0 1cn0 1dB0 16n0 10O0 1ja0 1tC0 14o0 1cM0 1a00 11A0 1Na0 An0 1MP0 AJ0 1Kp0 LC0 1oo0 Wl0 EQN0 Db0 1fB0 Rb0 npB0 11z0 1C10 IL0 1s10 10n0 1o10 WL0 1zd0 On0 1ld0 11z0 1o10 14n0 1o10 14n0 1nd0 12n0 1nd0 Xz0 1q10 12n0 1hB0 1dX0 1ep0 1aL0 1eN0 17X0 1nf0 11z0 1tB0 19W0 1e10 17b0 1ep0 1gL0 18N0 1fz0 1eN0 17b0 1gq0 1gn0 19d0 1dz0 1c10 17X0 1hB0 1gn0 19d0 1dz0 1c10 17X0 1kp0 1dz0 1c10 1aL0 1eN0 1oL0 10N0 1oL0 10N0 1oL0 10N0 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0 10N0 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0 10N0 1oL0 10N0 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0 10N0 1rz0 W10 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0|81e4","Asia/Kabul|+04 +0430|-40 -4u|01|-10Qs0|46e5","Asia/Kamchatka|LMT +11 +12 +13|-ay.A -b0 -c0 -d0|012323232323232323232321232323232323232323232323232323232323212|-1SLKy.A ivXy.A 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 2sp0 WM0|18e4","Asia/Karachi|LMT +0530 +0630 +05 PKT PKST|-4s.c -5u -6u -50 -50 -60|012134545454|-2xoss.c 1qOKW.c 7zX0 eup0 LqMu 1fy00 1cL0 dK10 11b0 1610 1jX0|24e6","Asia/Urumqi|LMT +06|-5O.k -60|01|-1GgtO.k|32e5","Asia/Kathmandu|LMT +0530 +0545|-5F.g -5u -5J|012|-21JhF.g 2EGMb.g|12e5","Asia/Khandyga|LMT +08 +09 +10 +11|-92.d -80 -90 -a0 -b0|0123232323232323232323212323232323232323232323232343434343434343432|-21Q92.d pAp2.d 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 qK0 yN0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 17V0 7zD0|66e2","Asia/Krasnoyarsk|LMT +06 +07 +08|-6b.q -60 -70 -80|01232323232323232323232123232323232323232323232323232323232323232|-21Hib.q prAb.q 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|10e5","Asia/Kuala_Lumpur|SMT +07 +0720 +0730 +09 +08|-6T.p -70 -7k -7u -90 -80|0123435|-2Bg6T.p 17anT.p l5XE 17bO 8Fyu 1so1u|71e5","Asia/Kuching|LMT +0730 +08 +0820 +09|-7l.k -7u -80 -8k -90|0123232323232323242|-1KITl.k gDbP.k 6ynu AnE 1O0k AnE 1NAk AnE 1NAk AnE 1NAk AnE 1O0k AnE 1NAk AnE pAk 8Fz0|13e4","Asia/Macau|LMT CST CDT|-7y.k -80 -90|012121212121212121212121212121212121212121|-2le7y.k 1XO34.k 1wn0 Rd0 1wn0 R9u 1wqu U10 1tz0 TVu 1tz0 17gu 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cJu 1cL0 1cN0 1fz0 1cN0 1cOu 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cJu 1cL0 1cN0 1fz0 1cN0 1cL0|57e4","Asia/Magadan|LMT +10 +11 +12|-a3.c -a0 -b0 -c0|012323232323232323232321232323232323232323232323232323232323232312|-1Pca3.c eUo3.c 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3Cq0|95e3","Asia/Makassar|LMT MMT +08 +09 WITA|-7V.A -7V.A -80 -90 -80|01234|-21JjV.A vfc0 myLV.A 8ML0|15e5","Asia/Manila|+08 +09|-80 -90|010101010|-1kJI0 AL0 cK10 65X0 mXB0 vX0 VK10 1db0|24e6","Asia/Nicosia|LMT EET EEST|-2d.s -20 -30|01212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1Vc2d.s 2a3cd.s 1cL0 1qp0 Xz0 19B0 19X0 1fB0 1db0 1cp0 1cL0 1fB0 19X0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1o30 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|32e4","Asia/Novokuznetsk|LMT +06 +07 +08|-5M.M -60 -70 -80|012323232323232323232321232323232323232323232323232323232323212|-1PctM.M eULM.M 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 2sp0 WM0|55e4","Asia/Novosibirsk|LMT +06 +07 +08|-5v.E -60 -70 -80|0123232323232323232323212323212121212121212121212121212121212121212|-21Qnv.E pAFv.E 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 ml0 Os0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 4eN0|15e5","Asia/Omsk|LMT +05 +06 +07|-4R.u -50 -60 -70|01232323232323232323232123232323232323232323232323232323232323232|-224sR.u pMLR.u 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|12e5","Asia/Oral|LMT +03 +05 +06 +04|-3p.o -30 -50 -60 -40|01232323232323232424242424242424242424242424242|-1Pc3p.o eUop.o 23CK0 3Db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1fA0 1cM0 1cM0 IM0 1EM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0|27e4","Asia/Pontianak|LMT PMT +0730 +09 +08 WITA WIB|-7h.k -7h.k -7u -90 -80 -80 -70|012324256|-2ua7h.k XE00 munL.k 8Rau 6kpu 4PXu xhcu Wqnu|23e4","Asia/Pyongyang|LMT KST JST KST|-8n -8u -90 -90|01231|-2um8n 97XR 1lTzu 2Onc0|29e5","Asia/Qyzylorda|LMT +04 +05 +06|-4l.Q -40 -50 -60|0123232323232323232323232323232323232323232323|-1Pc4l.Q eUol.Q 23CL0 3Db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 3ao0 1EM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0|73e4","Asia/Rangoon|RMT +0630 +09|-6o.E -6u -90|0121|-21Jio.E SmnS.E 7j9u|48e5","Asia/Sakhalin|LMT +09 +11 +12 +10|-9u.M -90 -b0 -c0 -a0|01232323232323232323232423232323232424242424242424242424242424242|-2AGVu.M 1BoMu.M 1qFa0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 2pB0 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3rd0|58e4","Asia/Samarkand|LMT +04 +05 +06|-4r.R -40 -50 -60|01232323232323232323232|-1Pc4r.R eUor.R 23CL0 3Db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0|36e4","Asia/Seoul|LMT KST JST KST KDT KDT|-8r.Q -8u -90 -90 -9u -a0|0123141414141414135353|-2um8r.Q 97XV.Q 1m1zu kKo0 2I0u OL0 1FB0 Rb0 1qN0 TX0 1tB0 TX0 1tB0 TX0 1tB0 TX0 2ap0 12FBu 11A0 1o00 11A0|23e6","Asia/Srednekolymsk|LMT +10 +11 +12|-ae.Q -a0 -b0 -c0|01232323232323232323232123232323232323232323232323232323232323232|-1Pcae.Q eUoe.Q 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|35e2","Asia/Taipei|CST JST CDT|-80 -90 -90|01020202020202020202020202020202020202020|-1iw80 joM0 1yo0 Tz0 1ip0 1jX0 1cN0 11b0 1oN0 11b0 1oN0 11b0 1oN0 11b0 10N0 1BX0 10p0 1pz0 10p0 1pz0 10p0 1db0 1dd0 1db0 1cN0 1db0 1cN0 1db0 1cN0 1db0 1BB0 ML0 1Bd0 ML0 uq10 1db0 1cN0 1db0 97B0 AL0|74e5","Asia/Tashkent|LMT +05 +06 +07|-4B.b -50 -60 -70|012323232323232323232321|-1Pc4B.b eUnB.b 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0|23e5","Asia/Tbilisi|TBMT +03 +04 +05|-2X.b -30 -40 -50|0123232323232323232323212121232323232323232323212|-1Pc2X.b 1jUnX.b WCL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 1cK0 1cL0 1cN0 1cL0 1cN0 2pz0 1cL0 1fB0 3Nz0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 An0 Os0 WM0|11e5","Asia/Tehran|LMT TMT +0330 +04 +05 +0430|-3p.I -3p.I -3u -40 -50 -4u|01234325252525252525252525252525252525252525252525252525252525252525252525252525252525252525252525252|-2btDp.I 1d3c0 1huLT.I TXu 1pz0 sN0 vAu 1cL0 1dB0 1en0 pNB0 UL0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 64p0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0|14e6","Asia/Thimphu|LMT +0530 +06|-5W.A -5u -60|012|-Su5W.A 1BGMs.A|79e3","Asia/Tokyo|JST JDT|-90 -a0|010101010|-QJH0 QL0 1lB0 13X0 1zB0 NX0 1zB0 NX0|38e6","Asia/Tomsk|LMT +06 +07 +08|-5D.P -60 -70 -80|0123232323232323232323212323232323232323232323212121212121212121212|-21NhD.P pxzD.P 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 co0 1bB0 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3Qp0|10e5","Asia/Ulaanbaatar|LMT +07 +08 +09|-77.w -70 -80 -90|012323232323232323232323232323232323232323232323232|-2APH7.w 2Uko7.w cKn0 1db0 1dd0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 6hD0 11z0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 kEp0 1cJ0 1cP0 1cJ0|12e5","Asia/Ust-Nera|LMT +08 +09 +12 +11 +10|-9w.S -80 -90 -c0 -b0 -a0|012343434343434343434345434343434343434343434343434343434343434345|-21Q9w.S pApw.S 23CL0 1d90 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 17V0 7zD0|65e2","Asia/Vladivostok|LMT +09 +10 +11|-8L.v -90 -a0 -b0|01232323232323232323232123232323232323232323232323232323232323232|-1SJIL.v itXL.v 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|60e4","Asia/Yakutsk|LMT +08 +09 +10|-8C.W -80 -90 -a0|01232323232323232323232123232323232323232323232323232323232323232|-21Q8C.W pAoC.W 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|28e4","Asia/Yekaterinburg|LMT PMT +04 +05 +06|-42.x -3J.5 -40 -50 -60|012343434343434343434343234343434343434343434343434343434343434343|-2ag42.x 7mQh.s qBvJ.5 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|14e5","Asia/Yerevan|LMT +03 +04 +05|-2W -30 -40 -50|0123232323232323232323212121212323232323232323232323232323232|-1Pc2W 1jUnW WCL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 2pB0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 4RX0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0|13e5","Atlantic/Azores|HMT -02 -01 +00 WET|1S.w 20 10 0 0|01212121212121212121212121212121212121212121232123212321232121212121212121212121212121212121212121232323232323232323232323232323234323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-2ldW5.s aPX5.s Sp0 LX0 1vc0 Tc0 1uM0 SM0 1vc0 Tc0 1vc0 SM0 1vc0 6600 1co0 3E00 17c0 1fA0 1a00 1io0 1a00 1io0 17c0 3I00 17c0 1cM0 1cM0 3Fc0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Dc0 1tA0 1cM0 1dc0 1400 gL0 IM0 s10 U00 dX0 Rc0 pd0 Rc0 gL0 Oo0 pd0 Rc0 gL0 Oo0 pd0 14o0 1cM0 1cP0 1cM0 1cM0 1cM0 1cM0 1cM0 3Co0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 qIl0 1cM0 1fA0 1cM0 1cM0 1cN0 1cL0 1cN0 1cM0 1cM0 1cM0 1cM0 1cN0 1cL0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cL0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|25e4","Atlantic/Bermuda|LMT AST ADT|4j.i 40 30|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1BnRE.G 1LTbE.G 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|65e3","Atlantic/Canary|LMT -01 WET WEST|11.A 10 0 -10|01232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-1UtaW.o XPAW.o 1lAK0 1a10 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|54e4","Atlantic/Cape_Verde|LMT -02 -01|1y.4 20 10|01212|-2xomp.U 1qOMp.U 7zX0 1djf0|50e4","Atlantic/Faroe|LMT WET WEST|r.4 0 -10|01212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2uSnw.U 2Wgow.U 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|49e3","Atlantic/Madeira|FMT -01 +00 +01 WET WEST|17.A 10 0 -10 0 -10|01212121212121212121212121212121212121212121232123212321232121212121212121212121212121212121212121454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-2ldWQ.o aPWQ.o Sp0 LX0 1vc0 Tc0 1uM0 SM0 1vc0 Tc0 1vc0 SM0 1vc0 6600 1co0 3E00 17c0 1fA0 1a00 1io0 1a00 1io0 17c0 3I00 17c0 1cM0 1cM0 3Fc0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Dc0 1tA0 1cM0 1dc0 1400 gL0 IM0 s10 U00 dX0 Rc0 pd0 Rc0 gL0 Oo0 pd0 Rc0 gL0 Oo0 pd0 14o0 1cM0 1cP0 1cM0 1cM0 1cM0 1cM0 1cM0 3Co0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 qIl0 1cM0 1fA0 1cM0 1cM0 1cN0 1cL0 1cN0 1cM0 1cM0 1cM0 1cM0 1cN0 1cL0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|27e4","Atlantic/Reykjavik|LMT -01 +00 GMT|1s 10 0 0|012121212121212121212121212121212121212121212121212121212121212121213|-2uWmw mfaw 1Bd0 ML0 1LB0 Cn0 1LB0 3fX0 C10 HrX0 1cO0 LB0 1EL0 LA0 1C00 Oo0 1wo0 Rc0 1wo0 Rc0 1wo0 Rc0 1zc0 Oo0 1zc0 14o0 1lc0 14o0 1lc0 14o0 1o00 11A0 1lc0 14o0 1o00 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1o00 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1o00 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1lc0 14o0 1o00 14o0|12e4","Atlantic/South_Georgia|-02|20|0||30","Atlantic/Stanley|SMT -04 -03 -02|3P.o 40 30 20|012121212121212323212121212121212121212121212121212121212121212121212|-2kJw8.A 12bA8.A 19X0 1fB0 19X0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1fB0 Cn0 1Cc10 WL0 1qL0 U10 1tz0 2mN0 WN0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1tz0 U10 1tz0 WN0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1tz0 WN0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qL0 WN0 1qN0 U10 1wn0 Rd0 1wn0 U10 1tz0 U10 1tz0 U10 1tz0 U10 1tz0 U10 1wn0 U10 1tz0 U10 1tz0 U10|21e2","Australia/Sydney|AEST AEDT|-a0 -b0|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-293lX xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 14o0 1o00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 U00 1qM0 WM0 1tA0 WM0 1tA0 U00 1tA0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 11A0 1o00 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 14o0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|40e5","Australia/Adelaide|ACST ACDT|-9u -au|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-293lt xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 U00 1qM0 WM0 1tA0 WM0 1tA0 U00 1tA0 U00 1tA0 Oo0 1zc0 WM0 1qM0 Rc0 1zc0 U00 1tA0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 14o0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|11e5","Australia/Brisbane|AEST AEDT|-a0 -b0|01010101010101010|-293lX xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 H1A0 Oo0 1zc0 Oo0 1zc0 Oo0|20e5","Australia/Broken_Hill|ACST ACDT|-9u -au|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-293lt xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 14o0 1o00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 U00 1qM0 WM0 1tA0 WM0 1tA0 U00 1tA0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 14o0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|18e3","Australia/Currie|AEST AEDT|-a0 -b0|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-29E80 19X0 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1qM0 WM0 1qM0 Oo0 1zc0 Oo0 1zc0 Oo0 1wo0 WM0 1tA0 WM0 1tA0 U00 1tA0 U00 1tA0 11A0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 11A0 1o00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|746","Australia/Darwin|ACST ACDT|-9u -au|010101010|-293lt xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0|12e4","Australia/Eucla|+0845 +0945|-8J -9J|0101010101010101010|-293kI xcX 10jd0 yL0 1cN0 1cL0 1gSp0 Oo0 l5A0 Oo0 iJA0 G00 zU00 IM0 1qM0 11A0 1o00 11A0|368","Australia/Hobart|AEST AEDT|-a0 -b0|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-29E80 19X0 10jd0 yL0 1cN0 1cL0 1fB0 19X0 VfB0 1cM0 1o00 Rc0 1wo0 Rc0 1wo0 U00 1wo0 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1qM0 WM0 1qM0 Oo0 1zc0 Oo0 1zc0 Oo0 1wo0 WM0 1tA0 WM0 1tA0 U00 1tA0 U00 1tA0 11A0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 11A0 1o00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|21e4","Australia/Lord_Howe|AEST +1030 +1130 +11|-a0 -au -bu -b0|0121212121313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313131313|raC0 1zdu Rb0 1zd0 On0 1zd0 On0 1zd0 On0 1zd0 TXu 1qMu WLu 1tAu WLu 1tAu TXu 1tAu Onu 1zcu Onu 1zcu Onu 1zcu Rbu 1zcu Onu 1zcu Onu 1zcu 11zu 1o0u 11zu 1o0u 11zu 1o0u 11zu 1qMu WLu 11Au 1nXu 1qMu 11zu 1o0u 11zu 1o0u 11zu 1qMu WLu 1qMu 11zu 1o0u WLu 1qMu 14nu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1fAu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1fAu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1fzu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1fAu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1fAu 1cLu 1cMu 1cLu 1cMu|347","Australia/Lindeman|AEST AEDT|-a0 -b0|010101010101010101010|-293lX xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 H1A0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0|10","Australia/Melbourne|AEST AEDT|-a0 -b0|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-293lX xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 U00 1qM0 WM0 1qM0 11A0 1tA0 U00 1tA0 U00 1tA0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 11A0 1o00 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 14o0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|39e5","Australia/Perth|AWST AWDT|-80 -90|0101010101010101010|-293jX xcX 10jd0 yL0 1cN0 1cL0 1gSp0 Oo0 l5A0 Oo0 iJA0 G00 zU00 IM0 1qM0 11A0 1o00 11A0|18e5","CET|CET CEST|-10 -20|01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 1cM0 1cM0 16M0 1gMM0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00","CST6CDT|CST CDT CWT CPT|60 50 50 50|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261s0 1nX0 11B0 1nX0 SgN0 8x30 iw0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","Pacific/Easter|EMT -07 -06 -05|7h.s 70 60 50|012121212121212121212121212123232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323|-1uSgG.w 1s4IG.w WL0 1zd0 On0 1ip0 11z0 1o10 11z0 1qN0 WL0 1ld0 14n0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 2pA0 11z0 1o10 11z0 1qN0 WL0 1qN0 WL0 1qN0 1cL0 1cN0 11z0 1o10 11z0 1qN0 WL0 1fB0 19X0 1qN0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1ip0 1fz0 1fB0 11z0 1qN0 WL0 1qN0 WL0 1qN0 WL0 1qN0 11z0 1o10 11z0 1o10 11z0 1qN0 WL0 1qN0 17b0 1ip0 11z0 1o10 19X0 1fB0 1nX0 G10 1EL0 Op0 1zb0 Rd0 1wn0 Rd0 46n0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Dd0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1Nb0 Ap0|30e2","EET|EET EEST|-20 -30|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|hDB0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00","EST|EST|50|0|","EST5EDT|EST EDT EWT EPT|50 40 40 40|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261t0 1nX0 11B0 1nX0 SgN0 8x40 iv0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","Europe/Dublin|DMT IST GMT BST IST|p.l -y.D 0 -10 -10|01232323232324242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242424242|-2ax9y.D Rc0 1fzy.D 14M0 1fc0 1g00 1co0 1dc0 1co0 1oo0 1400 1dc0 19A0 1io0 1io0 WM0 1o00 14o0 1o00 17c0 1io0 17c0 1fA0 1a00 1lc0 17c0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1cM0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1a00 1io0 1qM0 Dc0 g5X0 14p0 1wn0 17d0 1io0 11A0 1o00 17c0 1fA0 1a00 1fA0 1cM0 1fA0 1a00 17c0 1fA0 1a00 1io0 17c0 1lc0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1a00 1a00 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1tA0 IM0 90o0 U00 1tA0 U00 1tA0 U00 1tA0 U00 1tA0 WM0 1qM0 WM0 1qM0 WM0 1tA0 U00 1tA0 U00 1tA0 11z0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 14o0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5","Etc/GMT+0|GMT|0|0|","Etc/GMT+1|-01|10|0|","Etc/GMT+10|-10|a0|0|","Etc/GMT+11|-11|b0|0|","Etc/GMT+12|-12|c0|0|","Etc/GMT+3|-03|30|0|","Etc/GMT+4|-04|40|0|","Etc/GMT+5|-05|50|0|","Etc/GMT+6|-06|60|0|","Etc/GMT+7|-07|70|0|","Etc/GMT+8|-08|80|0|","Etc/GMT+9|-09|90|0|","Etc/GMT-1|+01|-10|0|","Pacific/Port_Moresby|+10|-a0|0||25e4","Pacific/Pohnpei|+11|-b0|0||34e3","Pacific/Tarawa|+12|-c0|0||29e3","Etc/GMT-13|+13|-d0|0|","Etc/GMT-14|+14|-e0|0|","Etc/GMT-2|+02|-20|0|","Etc/GMT-3|+03|-30|0|","Etc/GMT-4|+04|-40|0|","Etc/GMT-5|+05|-50|0|","Etc/GMT-6|+06|-60|0|","Indian/Christmas|+07|-70|0||21e2","Etc/GMT-8|+08|-80|0|","Pacific/Palau|+09|-90|0||21e3","Etc/UCT|UCT|0|0|","Etc/UTC|UTC|0|0|","Europe/Amsterdam|AMT NST +0120 +0020 CEST CET|-j.w -1j.w -1k -k -20 -10|010101010101010101010101010101010101010101012323234545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545|-2aFcj.w 11b0 1iP0 11A0 1io0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1co0 1io0 1yo0 Pc0 1a00 1fA0 1Bc0 Mo0 1tc0 Uo0 1tA0 U00 1uo0 W00 1s00 VA0 1so0 Vc0 1sM0 UM0 1wo0 Rc0 1u00 Wo0 1rA0 W00 1s00 VA0 1sM0 UM0 1w00 fV0 BCX.w 1tA0 U00 1u00 Wo0 1sm0 601k WM0 1fA0 1cM0 1cM0 1cM0 16M0 1gMM0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|16e5","Europe/Andorra|WET CET CEST|0 -10 -20|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-UBA0 1xIN0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|79e3","Europe/Astrakhan|LMT +03 +04 +05|-3c.c -30 -40 -50|012323232323232323212121212121212121212121212121212121212121212|-1Pcrc.c eUMc.c 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1fA0 1cM0 3Co0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3rd0","Europe/Athens|AMT EET EEST CEST CET|-1y.Q -20 -30 -20 -10|012123434121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2a61x.Q CNbx.Q mn0 kU10 9b0 3Es0 Xa0 1fb0 1dd0 k3X0 Nz0 SCp0 1vc0 SO0 1cM0 1a00 1ao0 1fc0 1a10 1fG0 1cg0 1dX0 1bX0 1cQ0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|35e5","Europe/London|GMT BST BDST|0 -10 -20|0101010101010101010101010101010101010101010101010121212121210101210101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2axa0 Rc0 1fA0 14M0 1fc0 1g00 1co0 1dc0 1co0 1oo0 1400 1dc0 19A0 1io0 1io0 WM0 1o00 14o0 1o00 17c0 1io0 17c0 1fA0 1a00 1lc0 17c0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1cM0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1a00 1io0 1qM0 Dc0 2Rz0 Dc0 1zc0 Oo0 1zc0 Rc0 1wo0 17c0 1iM0 FA0 xB0 1fA0 1a00 14o0 bb0 LA0 xB0 Rc0 1wo0 11A0 1o00 17c0 1fA0 1a00 1fA0 1cM0 1fA0 1a00 17c0 1fA0 1a00 1io0 17c0 1lc0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1a00 1a00 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1tA0 IM0 90o0 U00 1tA0 U00 1tA0 U00 1tA0 U00 1tA0 WM0 1qM0 WM0 1qM0 WM0 1tA0 U00 1tA0 U00 1tA0 11z0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 14o0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|10e6","Europe/Belgrade|CET CEST|-10 -20|01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-19RC0 3IP0 WM0 1fA0 1cM0 1cM0 1rc0 Qo0 1vmo0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5","Europe/Berlin|CET CEST CEMT|-10 -20 -30|01010101010101210101210101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 1cM0 1cM0 kL0 Nc0 m10 WM0 1ao0 1cp0 dX0 jz0 Dd0 1io0 17c0 1fA0 1a00 1ehA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|41e5","Europe/Prague|CET CEST|-10 -20|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 16M0 1lc0 1tA0 17A0 11c0 1io0 17c0 1io0 17c0 1fc0 1ao0 1bNc0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|13e5","Europe/Brussels|WET CET CEST WEST|0 -10 -20 -10|0121212103030303030303030303030303030303030303030303212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2ehc0 3zX0 11c0 1iO0 11A0 1o00 11A0 my0 Ic0 1qM0 Rc0 1EM0 UM0 1u00 10o0 1io0 1io0 17c0 1a00 1fA0 1cM0 1cM0 1io0 17c0 1fA0 1a00 1io0 1a30 1io0 17c0 1fA0 1a00 1io0 17c0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Dc0 y00 5Wn0 WM0 1fA0 1cM0 16M0 1iM0 16M0 1C00 Uo0 1eeo0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|21e5","Europe/Bucharest|BMT EET EEST|-1I.o -20 -30|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1xApI.o 20LI.o RA0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1Axc0 On0 1fA0 1a10 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cK0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cL0 1cN0 1cL0 1fB0 1nX0 11E0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|19e5","Europe/Budapest|CET CEST|-10 -20|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1ip0 17b0 1op0 1tb0 Q2m0 3Ne0 WM0 1fA0 1cM0 1cM0 1oJ0 1dc0 1030 1fA0 1cM0 1cM0 1cM0 1cM0 1fA0 1a00 1iM0 1fA0 8Ha0 Rb0 1wN0 Rb0 1BB0 Lz0 1C20 LB0 SNX0 1a10 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|17e5","Europe/Zurich|CET CEST|-10 -20|01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-19Lc0 11A0 1o00 11A0 1xG10 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|38e4","Europe/Chisinau|CMT BMT EET EEST CEST CET MSK MSD|-1T -1I.o -20 -30 -20 -10 -30 -40|012323232323232323234545467676767676767676767323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232|-26jdT wGMa.A 20LI.o RA0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 27A0 2en0 39g0 WM0 1fA0 1cM0 V90 1t7z0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 gL0 WO0 1cM0 1cM0 1cK0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1nX0 11D0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|67e4","Europe/Copenhagen|CET CEST|-10 -20|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2azC0 Tz0 VuO0 60q0 WM0 1fA0 1cM0 1cM0 1cM0 S00 1HA0 Nc0 1C00 Dc0 1Nc0 Ao0 1h5A0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5","Europe/Gibraltar|GMT BST BDST CET CEST|0 -10 -20 -10 -20|010101010101010101010101010101010101010101010101012121212121010121010101010101010101034343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343|-2axa0 Rc0 1fA0 14M0 1fc0 1g00 1co0 1dc0 1co0 1oo0 1400 1dc0 19A0 1io0 1io0 WM0 1o00 14o0 1o00 17c0 1io0 17c0 1fA0 1a00 1lc0 17c0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1cM0 1io0 17c0 1fA0 1a00 1io0 17c0 1io0 17c0 1fA0 1a00 1io0 1qM0 Dc0 2Rz0 Dc0 1zc0 Oo0 1zc0 Rc0 1wo0 17c0 1iM0 FA0 xB0 1fA0 1a00 14o0 bb0 LA0 xB0 Rc0 1wo0 11A0 1o00 17c0 1fA0 1a00 1fA0 1cM0 1fA0 1a00 17c0 1fA0 1a00 1io0 17c0 1lc0 17c0 1fA0 10Jz0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|30e3","Europe/Helsinki|HMT EET EEST|-1D.N -20 -30|0121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-1WuND.N OULD.N 1dA0 1xGq0 1cM0 1cM0 1cM0 1cN0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5","Europe/Kaliningrad|CET CEST CET CEST MSK MSD EEST EET +03|-10 -20 -20 -30 -30 -40 -30 -20 -30|0101010101010232454545454545454546767676767676767676767676767676767676767676787|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 1cM0 Am0 Lb0 1en0 op0 1pNz0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|44e4","Europe/Kiev|KMT EET MSK CEST CET MSD EEST|-22.4 -20 -30 -20 -10 -40 -30|0123434252525252525252525256161616161616161616161616161616161616161616161616161616161616161616161616161616161616161616161|-1Pc22.4 eUo2.4 rnz0 2Hg0 WM0 1fA0 da0 1v4m0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 Db0 3220 1cK0 1cL0 1cN0 1cL0 1cN0 1cL0 1cQ0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|34e5","Europe/Kirov|LMT +03 +04 +05|-3i.M -30 -40 -50|01232323232323232321212121212121212121212121212121212121212121|-22WM0 qH90 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1fA0 1cM0 3Co0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|48e4","Europe/Lisbon|LMT WET WEST WEMT CET CEST|A.J 0 -10 -20 -10 -20|012121212121212121212121212121212121212121212321232123212321212121212121212121212121212121212121214121212121212121212121212121212124545454212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2ldXn.f aPWn.f Sp0 LX0 1vc0 Tc0 1uM0 SM0 1vc0 Tc0 1vc0 SM0 1vc0 6600 1co0 3E00 17c0 1fA0 1a00 1io0 1a00 1io0 17c0 3I00 17c0 1cM0 1cM0 3Fc0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Dc0 1tA0 1cM0 1dc0 1400 gL0 IM0 s10 U00 dX0 Rc0 pd0 Rc0 gL0 Oo0 pd0 Rc0 gL0 Oo0 pd0 14o0 1cM0 1cP0 1cM0 1cM0 1cM0 1cM0 1cM0 3Co0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 pvy0 1cM0 1cM0 1fA0 1cM0 1cM0 1cN0 1cL0 1cN0 1cM0 1cM0 1cM0 1cM0 1cN0 1cL0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|27e5","Europe/Luxembourg|LMT CET CEST WET WEST WEST WET|-o.A -10 -20 0 -10 -20 -10|0121212134343434343434343434343434343434343434343434565651212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2DG0o.A t6mo.A TB0 1nX0 Up0 1o20 11A0 rW0 CM0 1qP0 R90 1EO0 UK0 1u20 10m0 1ip0 1in0 17e0 19W0 1fB0 1db0 1cp0 1in0 17d0 1fz0 1a10 1in0 1a10 1in0 17f0 1fA0 1a00 1io0 17c0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Dc0 vA0 60L0 WM0 1fA0 1cM0 17c0 1io0 16M0 1C00 Uo0 1eeo0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|54e4","Europe/Madrid|WET WEST WEMT CET CEST|0 -10 -20 -10 -20|010101010101010101210343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343|-25Td0 19B0 1cL0 1dd0 b1z0 18p0 3HX0 17d0 1fz0 1a10 1io0 1a00 1in0 17d0 iIn0 Hd0 1cL0 bb0 1200 2s20 14n0 5aL0 Mp0 1vz0 17d0 1in0 17d0 1in0 17d0 1in0 17d0 6hX0 11B0 XHX0 1a10 1fz0 1a10 19X0 1cN0 1fz0 1a10 1fC0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|62e5","Europe/Malta|CET CEST|-10 -20|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2arB0 Lz0 1cN0 1db0 1410 1on0 Wp0 1qL0 17d0 1cL0 M3B0 5M20 WM0 1fA0 1co0 17c0 1iM0 16m0 1de0 1lc0 14m0 1lc0 WO0 1qM0 GTW0 On0 1C10 LA0 1C00 LA0 1EM0 LA0 1C00 LA0 1zc0 Oo0 1C00 Oo0 1co0 1cM0 1lA0 Xc0 1qq0 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1o10 11z0 1iN0 19z0 1fB0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|42e4","Europe/Minsk|MMT EET MSK CEST CET MSD EEST +03|-1O -20 -30 -20 -10 -40 -30 -30|01234343252525252525252525261616161616161616161616161616161616161617|-1Pc1O eUnO qNX0 3gQ0 WM0 1fA0 1cM0 Al0 1tsn0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 3Fc0 1cN0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0|19e5","Europe/Monaco|PMT WET WEST WEMT CET CEST|-9.l 0 -10 -20 -10 -20|01212121212121212121212121212121212121212121212121232323232345454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-2nco9.l cNb9.l HA0 19A0 1iM0 11c0 1oo0 Wo0 1rc0 QM0 1EM0 UM0 1u00 10o0 1io0 1wo0 Rc0 1a00 1fA0 1cM0 1cM0 1io0 17c0 1fA0 1a00 1io0 1a00 1io0 17c0 1fA0 1a00 1io0 17c0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Df0 2RV0 11z0 11B0 1ze0 WM0 1fA0 1cM0 1fa0 1aq0 16M0 1ekn0 1cL0 1fC0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|38e3","Europe/Moscow|MMT MMT MST MDST MSD MSK +05 EET EEST MSK|-2u.h -2v.j -3v.j -4v.j -40 -30 -50 -20 -30 -40|012132345464575454545454545454545458754545454545454545454545454545454545454595|-2ag2u.h 2pyW.W 1bA0 11X0 GN0 1Hb0 c4v.j ik0 3DA0 dz0 15A0 c10 2q10 iM10 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cN0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|16e6","Europe/Paris|PMT WET WEST CEST CET WEMT|-9.l 0 -10 -20 -10 -20|0121212121212121212121212121212121212121212121212123434352543434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434343434|-2nco8.l cNb8.l HA0 19A0 1iM0 11c0 1oo0 Wo0 1rc0 QM0 1EM0 UM0 1u00 10o0 1io0 1wo0 Rc0 1a00 1fA0 1cM0 1cM0 1io0 17c0 1fA0 1a00 1io0 1a00 1io0 17c0 1fA0 1a00 1io0 17c0 1cM0 1cM0 1a00 1io0 1cM0 1cM0 1a00 1fA0 1io0 17c0 1cM0 1cM0 1a00 1fA0 1io0 1qM0 Df0 Ik0 5M30 WM0 1fA0 1cM0 Vx0 hB0 1aq0 16M0 1ekn0 1cL0 1fC0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|11e6","Europe/Riga|RMT LST EET MSK CEST CET MSD EEST|-1A.y -2A.y -20 -30 -20 -10 -40 -30|010102345454536363636363636363727272727272727272727272727272727272727272727272727272727272727272727272727272727272727272727272|-25TzA.y 11A0 1iM0 ko0 gWm0 yDXA.y 2bX0 3fE0 WM0 1fA0 1cM0 1cM0 4m0 1sLy0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cN0 1o00 11A0 1o00 11A0 1qM0 3oo0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|64e4","Europe/Rome|CET CEST|-10 -20|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2arB0 Lz0 1cN0 1db0 1410 1on0 Wp0 1qL0 17d0 1cL0 M3B0 5M20 WM0 1fA0 1cM0 16M0 1iM0 16m0 1de0 1lc0 14m0 1lc0 WO0 1qM0 GTW0 On0 1C10 LA0 1C00 LA0 1EM0 LA0 1C00 LA0 1zc0 Oo0 1C00 Oo0 1C00 LA0 1zc0 Oo0 1C00 LA0 1C00 LA0 1zc0 Oo0 1C00 Oo0 1zc0 Oo0 1fC0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|39e5","Europe/Samara|LMT +03 +04 +05|-3k.k -30 -40 -50|0123232323232323232121232323232323232323232323232323232323212|-22WM0 qH90 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1fA0 2y10 14m0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 2sp0 WM0|12e5","Europe/Saratov|LMT +03 +04 +05|-34.i -30 -40 -50|012323232323232321212121212121212121212121212121212121212121212|-22WM0 qH90 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1cM0 1cM0 1fA0 1cM0 3Co0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 5810","Europe/Simferopol|SMT EET MSK CEST CET MSD EEST MSK|-2g -20 -30 -20 -10 -40 -30 -40|012343432525252525252525252161616525252616161616161616161616161616161616172|-1Pc2g eUog rEn0 2qs0 WM0 1fA0 1cM0 3V0 1u0L0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1Q00 4eL0 1cL0 1cN0 1cL0 1cN0 dX0 WL0 1cN0 1cL0 1fB0 1o30 11B0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11z0 1nW0|33e4","Europe/Sofia|EET CET CEST EEST|-20 -10 -20 -30|01212103030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030|-168L0 WM0 1fA0 1cM0 1cM0 1cN0 1mKH0 1dd0 1fb0 1ap0 1fb0 1a20 1fy0 1a30 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cK0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 1nX0 11E0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5","Europe/Stockholm|CET CEST|-10 -20|01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2azC0 TB0 2yDe0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|15e5","Europe/Tallinn|TMT CET CEST EET MSK MSD EEST|-1D -10 -20 -20 -30 -40 -30|012103421212454545454545454546363636363636363636363636363636363636363636363636363636363636363636363636363636363636363636363|-26oND teD 11A0 1Ta0 4rXl KSLD 2FX0 2Jg0 WM0 1fA0 1cM0 18J0 1sTX0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o10 11A0 1qM0 5QM0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|41e4","Europe/Tirane|LMT CET CEST|-1j.k -10 -20|01212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2glBj.k 14pcj.k 5LC0 WM0 4M0 1fCK0 10n0 1op0 11z0 1pd0 11z0 1qN0 WL0 1qp0 Xb0 1qp0 Xb0 1qp0 11z0 1lB0 11z0 1qN0 11z0 1iN0 16n0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|42e4","Europe/Ulyanovsk|LMT +03 +04 +05 +02|-3d.A -30 -40 -50 -20|01232323232323232321214121212121212121212121212121212121212121212|-22WM0 qH90 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1fA0 2pB0 IM0 rX0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0 3rd0","Europe/Uzhgorod|CET CEST MSK MSD EET EEST|-10 -20 -30 -40 -20 -30|010101023232323232323232320454545454545454545454545454545454545454545454545454545454545454545454545454545454545454545454|-1cqL0 6i00 WM0 1fA0 1cM0 1ml0 1Cp0 1r3W0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1Q00 1Nf0 2pw0 1cL0 1cN0 1cL0 1cN0 1cL0 1cQ0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|11e4","Europe/Vienna|CET CEST|-10 -20|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 3KM0 14o0 LA00 6i00 WM0 1fA0 1cM0 1cM0 1cM0 400 2qM0 1a00 1cM0 1cM0 1io0 17c0 1gHa0 19X0 1cP0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|18e5","Europe/Vilnius|WMT KMT CET EET MSK CEST MSD EEST|-1o -1z.A -10 -20 -30 -20 -40 -30|012324525254646464646464646473737373737373737352537373737373737373737373737373737373737373737373737373737373737373737373|-293do 6ILM.o 1Ooz.A zz0 Mfd0 29W0 3is0 WM0 1fA0 1cM0 LV0 1tgL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11B0 1o00 11A0 1qM0 8io0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|54e4","Europe/Volgograd|LMT +03 +04 +05|-2V.E -30 -40 -50|01232323232323232121212121212121212121212121212121212121212121|-21IqV.E psLV.E 23CL0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 2pB0 1cM0 1cM0 1cM0 1fA0 1cM0 3Co0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 8Hz0|10e5","Europe/Warsaw|WMT CET CEST EET EEST|-1o -10 -20 -20 -30|012121234312121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121|-2ctdo 1LXo 11d0 1iO0 11A0 1o00 11A0 1on0 11A0 6zy0 HWP0 5IM0 WM0 1fA0 1cM0 1dz0 1mL0 1en0 15B0 1aq0 1nA0 11A0 1io0 17c0 1fA0 1a00 iDX0 LA0 1cM0 1cM0 1C00 Oo0 1cM0 1cM0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1C00 LA0 uso0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cN0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|17e5","Europe/Zaporozhye|+0220 EET MSK CEST CET MSD EEST|-2k -20 -30 -20 -10 -40 -30|01234342525252525252525252526161616161616161616161616161616161616161616161616161616161616161616161616161616161616161616161|-1Pc2k eUok rdb0 2RE0 WM0 1fA0 8m0 1v9a0 1db0 1cN0 1db0 1cN0 1db0 1dd0 1cO0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cK0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cQ0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|77e4","HST|HST|a0|0|","Indian/Chagos|LMT +05 +06|-4N.E -50 -60|012|-2xosN.E 3AGLN.E|30e2","Indian/Cocos|+0630|-6u|0||596","Indian/Kerguelen|-00 +05|0 -50|01|-MG00|130","Indian/Mahe|LMT +04|-3F.M -40|01|-2yO3F.M|79e3","Indian/Maldives|MMT +05|-4S -50|01|-olgS|35e4","Indian/Mauritius|LMT +04 +05|-3O -40 -50|012121|-2xorO 34unO 14L0 12kr0 11z0|15e4","Indian/Reunion|LMT +04|-3F.Q -40|01|-2mDDF.Q|84e4","Pacific/Kwajalein|+11 -12 +12|-b0 c0 -c0|012|-AX0 W9X0|14e3","MET|MET MEST|-10 -20|01010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-2aFe0 11d0 1iO0 11A0 1o00 11A0 Qrc0 6i00 WM0 1fA0 1cM0 1cM0 1cM0 16M0 1gMM0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00","MST|MST|70|0|","MST7MDT|MST MDT MWT MPT|70 60 60 60|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261r0 1nX0 11B0 1nX0 SgN0 8x20 ix0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","Pacific/Chatham|+1215 +1245 +1345|-cf -cJ -dJ|012121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212121212|-WqAf 1adef IM0 1C00 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1qM0 14o0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1io0 17c0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1lc0 14o0 1lc0 14o0 1lc0 17c0 1io0 17c0 1io0 17c0 1io0 17c0 1io0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00|600","PST8PDT|PST PDT PWT PPT|80 70 70 70|010102301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|-261q0 1nX0 11B0 1nX0 SgN0 8x10 iy0 QwN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1cN0 1cL0 1cN0 1cL0 s10 1Vz0 LB0 1BX0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1fz0 1a10 1fz0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0","Pacific/Apia|LMT -1130 -11 -10 +14 +13|bq.U bu b0 a0 -e0 -d0|01232345454545454545454545454545454545454545454545454545454|-2nDMx.4 1yW03.4 2rRbu 1ff0 1a00 CI0 AQ0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1io0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00|37e3","Pacific/Bougainville|+10 +09 +11|-a0 -90 -b0|0102|-16Wy0 7CN0 2MQp0|18e4","Pacific/Efate|LMT +11 +12|-bd.g -b0 -c0|0121212121212121212121|-2l9nd.g 2Szcd.g 1cL0 1oN0 10L0 1fB0 19X0 1fB0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1cN0 1cL0 1fB0 Lz0 1Nd0 An0|66e3","Pacific/Enderbury|-12 -11 +13|c0 b0 -d0|012|nIc0 B8n0|1","Pacific/Fakaofo|-11 +13|b0 -d0|01|1Gfn0|483","Pacific/Fiji|LMT +12 +13|-bT.I -c0 -d0|0121212121212121212121212121212121212121212121212121212121212121|-2bUzT.I 3m8NT.I LA0 1EM0 IM0 nJc0 LA0 1o00 Rc0 1wo0 Ao0 1Nc0 Ao0 1Q00 xz0 1SN0 uM0 1SM0 uM0 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0|88e4","Pacific/Galapagos|LMT -05 -06|5W.o 50 60|01212|-1yVS1.A 2dTz1.A gNd0 rz0|25e3","Pacific/Gambier|LMT -09|8X.M 90|01|-2jof0.c|125","Pacific/Guadalcanal|LMT +11|-aD.M -b0|01|-2joyD.M|11e4","Pacific/Guam|GST ChST|-a0 -a0|01|1fpq0|17e4","Pacific/Honolulu|HST HDT HST|au 9u a0|010102|-1thLu 8x0 lef0 8Pz0 46p0|37e4","Pacific/Kiritimati|-1040 -10 +14|aE a0 -e0|012|nIaE B8nk|51e2","Pacific/Kosrae|+11 +12|-b0 -c0|010|-AX0 1bdz0|66e2","Pacific/Majuro|+11 +12|-b0 -c0|01|-AX0|28e3","Pacific/Marquesas|LMT -0930|9i 9u|01|-2joeG|86e2","Pacific/Pago_Pago|LMT SST|bm.M b0|01|-2nDMB.c|37e2","Pacific/Nauru|LMT +1130 +09 +12|-b7.E -bu -90 -c0|01213|-1Xdn7.E PvzB.E 5RCu 1ouJu|10e3","Pacific/Niue|-1120 -1130 -11|bk bu b0|012|-KfME 17y0a|12e2","Pacific/Norfolk|+1112 +1130 +1230 +11|-bc -bu -cu -b0|01213|-Kgbc W01G On0 1COp0|25e4","Pacific/Noumea|LMT +11 +12|-b5.M -b0 -c0|01212121|-2l9n5.M 2EqM5.M xX0 1PB0 yn0 HeP0 Ao0|98e3","Pacific/Pitcairn|-0830 -08|8u 80|01|18Vku|56","Pacific/Rarotonga|-1030 -0930 -10|au 9u a0|012121212121212121212121212|lyWu IL0 1zcu Onu 1zcu Onu 1zcu Rbu 1zcu Onu 1zcu Onu 1zcu Onu 1zcu Onu 1zcu Onu 1zcu Rbu 1zcu Onu 1zcu Onu 1zcu Onu|13e3","Pacific/Tahiti|LMT -10|9W.g a0|01|-2joe1.I|18e4","Pacific/Tongatapu|+1220 +13 +14|-ck -d0 -e0|0121212121212121212121212121212121212121212121212121|-1aB0k 2n5dk 15A0 1wo0 xz0 1Q10 xz0 zWN0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0 1VA0 s00 1VA0 s00 1VA0 uM0 1SM0 uM0 1SM0 uM0 1SM0 uM0|75e3","WET|WET WEST|0 -10|010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010|hDB0 1a00 1fA0 1cM0 1cM0 1cM0 1fA0 1a00 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00"],
links:["Africa/Abidjan|Africa/Bamako","Africa/Abidjan|Africa/Banjul","Africa/Abidjan|Africa/Conakry","Africa/Abidjan|Africa/Dakar","Africa/Abidjan|Africa/Freetown","Africa/Abidjan|Africa/Lome","Africa/Abidjan|Africa/Nouakchott","Africa/Abidjan|Africa/Ouagadougou","Africa/Abidjan|Africa/Sao_Tome","Africa/Abidjan|Africa/Timbuktu","Africa/Abidjan|Atlantic/St_Helena","Africa/Cairo|Egypt","Africa/Johannesburg|Africa/Maseru","Africa/Johannesburg|Africa/Mbabane","Africa/Khartoum|Africa/Juba","Africa/Lagos|Africa/Bangui","Africa/Lagos|Africa/Brazzaville","Africa/Lagos|Africa/Douala","Africa/Lagos|Africa/Kinshasa","Africa/Lagos|Africa/Libreville","Africa/Lagos|Africa/Luanda","Africa/Lagos|Africa/Malabo","Africa/Lagos|Africa/Niamey","Africa/Lagos|Africa/Porto-Novo","Africa/Maputo|Africa/Blantyre","Africa/Maputo|Africa/Bujumbura","Africa/Maputo|Africa/Gaborone","Africa/Maputo|Africa/Harare","Africa/Maputo|Africa/Kigali","Africa/Maputo|Africa/Lubumbashi","Africa/Maputo|Africa/Lusaka","Africa/Nairobi|Africa/Addis_Ababa","Africa/Nairobi|Africa/Asmara","Africa/Nairobi|Africa/Asmera","Africa/Nairobi|Africa/Dar_es_Salaam","Africa/Nairobi|Africa/Djibouti","Africa/Nairobi|Africa/Kampala","Africa/Nairobi|Africa/Mogadishu","Africa/Nairobi|Indian/Antananarivo","Africa/Nairobi|Indian/Comoro","Africa/Nairobi|Indian/Mayotte","Africa/Tripoli|Libya","America/Adak|America/Atka","America/Adak|US/Aleutian","America/Anchorage|US/Alaska","America/Argentina/Buenos_Aires|America/Buenos_Aires","America/Argentina/Catamarca|America/Argentina/ComodRivadavia","America/Argentina/Catamarca|America/Catamarca","America/Argentina/Cordoba|America/Cordoba","America/Argentina/Cordoba|America/Rosario","America/Argentina/Jujuy|America/Jujuy","America/Argentina/Mendoza|America/Mendoza","America/Atikokan|America/Coral_Harbour","America/Chicago|US/Central","America/Curacao|America/Aruba","America/Curacao|America/Kralendijk","America/Curacao|America/Lower_Princes","America/Denver|America/Shiprock","America/Denver|Navajo","America/Denver|US/Mountain","America/Detroit|US/Michigan","America/Edmonton|Canada/Mountain","America/Fort_Wayne|America/Indiana/Indianapolis","America/Fort_Wayne|America/Indianapolis","America/Fort_Wayne|US/East-Indiana","America/Halifax|Canada/Atlantic","America/Havana|Cuba","America/Indiana/Knox|America/Knox_IN","America/Indiana/Knox|US/Indiana-Starke","America/Jamaica|Jamaica","America/Kentucky/Louisville|America/Louisville","America/Los_Angeles|US/Pacific","America/Los_Angeles|US/Pacific-New","America/Manaus|Brazil/West","America/Mazatlan|Mexico/BajaSur","America/Mexico_City|Mexico/General","America/New_York|US/Eastern","America/Noronha|Brazil/DeNoronha","America/Panama|America/Cayman","America/Phoenix|US/Arizona","America/Port_of_Spain|America/Anguilla","America/Port_of_Spain|America/Antigua","America/Port_of_Spain|America/Dominica","America/Port_of_Spain|America/Grenada","America/Port_of_Spain|America/Guadeloupe","America/Port_of_Spain|America/Marigot","America/Port_of_Spain|America/Montserrat","America/Port_of_Spain|America/St_Barthelemy","America/Port_of_Spain|America/St_Kitts","America/Port_of_Spain|America/St_Lucia","America/Port_of_Spain|America/St_Thomas","America/Port_of_Spain|America/St_Vincent","America/Port_of_Spain|America/Tortola","America/Port_of_Spain|America/Virgin","America/Regina|Canada/East-Saskatchewan","America/Regina|Canada/Saskatchewan","America/Rio_Branco|America/Porto_Acre","America/Rio_Branco|Brazil/Acre","America/Santiago|Chile/Continental","America/Sao_Paulo|Brazil/East","America/St_Johns|Canada/Newfoundland","America/Tijuana|America/Ensenada","America/Tijuana|America/Santa_Isabel","America/Tijuana|Mexico/BajaNorte","America/Toronto|America/Montreal","America/Toronto|Canada/Eastern","America/Vancouver|Canada/Pacific","America/Whitehorse|Canada/Yukon","America/Winnipeg|Canada/Central","Asia/Ashgabat|Asia/Ashkhabad","Asia/Bangkok|Asia/Phnom_Penh","Asia/Bangkok|Asia/Vientiane","Asia/Dhaka|Asia/Dacca","Asia/Dubai|Asia/Muscat","Asia/Ho_Chi_Minh|Asia/Saigon","Asia/Hong_Kong|Hongkong","Asia/Jerusalem|Asia/Tel_Aviv","Asia/Jerusalem|Israel","Asia/Kathmandu|Asia/Katmandu","Asia/Kolkata|Asia/Calcutta","Asia/Kuala_Lumpur|Asia/Singapore","Asia/Kuala_Lumpur|Singapore","Asia/Macau|Asia/Macao","Asia/Makassar|Asia/Ujung_Pandang","Asia/Nicosia|Europe/Nicosia","Asia/Qatar|Asia/Bahrain","Asia/Rangoon|Asia/Yangon","Asia/Riyadh|Asia/Aden","Asia/Riyadh|Asia/Kuwait","Asia/Seoul|ROK","Asia/Shanghai|Asia/Chongqing","Asia/Shanghai|Asia/Chungking","Asia/Shanghai|Asia/Harbin","Asia/Shanghai|PRC","Asia/Taipei|ROC","Asia/Tehran|Iran","Asia/Thimphu|Asia/Thimbu","Asia/Tokyo|Japan","Asia/Ulaanbaatar|Asia/Ulan_Bator","Asia/Urumqi|Asia/Kashgar","Atlantic/Faroe|Atlantic/Faeroe","Atlantic/Reykjavik|Iceland","Atlantic/South_Georgia|Etc/GMT+2","Australia/Adelaide|Australia/South","Australia/Brisbane|Australia/Queensland","Australia/Broken_Hill|Australia/Yancowinna","Australia/Darwin|Australia/North","Australia/Hobart|Australia/Tasmania","Australia/Lord_Howe|Australia/LHI","Australia/Melbourne|Australia/Victoria","Australia/Perth|Australia/West","Australia/Sydney|Australia/ACT","Australia/Sydney|Australia/Canberra","Australia/Sydney|Australia/NSW","Etc/GMT+0|Etc/GMT","Etc/GMT+0|Etc/GMT-0","Etc/GMT+0|Etc/GMT0","Etc/GMT+0|Etc/Greenwich","Etc/GMT+0|GMT","Etc/GMT+0|GMT+0","Etc/GMT+0|GMT-0","Etc/GMT+0|GMT0","Etc/GMT+0|Greenwich","Etc/UCT|UCT","Etc/UTC|Etc/Universal","Etc/UTC|Etc/Zulu","Etc/UTC|UTC","Etc/UTC|Universal","Etc/UTC|Zulu","Europe/Belgrade|Europe/Ljubljana","Europe/Belgrade|Europe/Podgorica","Europe/Belgrade|Europe/Sarajevo","Europe/Belgrade|Europe/Skopje","Europe/Belgrade|Europe/Zagreb","Europe/Chisinau|Europe/Tiraspol","Europe/Dublin|Eire","Europe/Helsinki|Europe/Mariehamn","Europe/Istanbul|Asia/Istanbul","Europe/Istanbul|Turkey","Europe/Lisbon|Portugal","Europe/London|Europe/Belfast","Europe/London|Europe/Guernsey","Europe/London|Europe/Isle_of_Man","Europe/London|Europe/Jersey","Europe/London|GB","Europe/London|GB-Eire","Europe/Moscow|W-SU","Europe/Oslo|Arctic/Longyearbyen","Europe/Oslo|Atlantic/Jan_Mayen","Europe/Prague|Europe/Bratislava","Europe/Rome|Europe/San_Marino","Europe/Rome|Europe/Vatican","Europe/Warsaw|Poland","Europe/Zurich|Europe/Busingen","Europe/Zurich|Europe/Vaduz","Indian/Christmas|Etc/GMT-7","Pacific/Auckland|Antarctica/McMurdo","Pacific/Auckland|Antarctica/South_Pole","Pacific/Auckland|NZ","Pacific/Chatham|NZ-CHAT","Pacific/Easter|Chile/EasterIsland","Pacific/Guam|Pacific/Saipan","Pacific/Honolulu|Pacific/Johnston","Pacific/Honolulu|US/Hawaii","Pacific/Kwajalein|Kwajalein","Pacific/Pago_Pago|Pacific/Midway","Pacific/Pago_Pago|Pacific/Samoa","Pacific/Pago_Pago|US/Samoa","Pacific/Palau|Etc/GMT-9","Pacific/Pohnpei|Etc/GMT-11","Pacific/Pohnpei|Pacific/Ponape","Pacific/Port_Moresby|Etc/GMT-10","Pacific/Port_Moresby|Pacific/Chuuk","Pacific/Port_Moresby|Pacific/Truk","Pacific/Port_Moresby|Pacific/Yap","Pacific/Tarawa|Etc/GMT-12","Pacific/Tarawa|Pacific/Funafuti","Pacific/Tarawa|Pacific/Wake","Pacific/Tarawa|Pacific/Wallis"]}),a});
!function(e){"use strict";if("function"==typeof define&&define.amd)define(["jquery","moment"],e);else if("object"==typeof exports)module.exports=e(require("jquery"),require("moment"));else{if("undefined"==typeof jQuery)throw"bootstrap-datetimepicker requires jQuery to be loaded first";if("undefined"==typeof moment)throw"bootstrap-datetimepicker requires Moment.js to be loaded first";e(jQuery,moment)}}(function(e,t){"use strict";if(!t)throw new Error("bootstrap-datetimepicker requires Moment.js to be loaded first");var a=function(a,n){var r,i,o,s,d,l,p,c={},u=!0,f=!1,m=!1,h=0,y=[{clsName:"days",navFnc:"M",navStep:1},{clsName:"months",navFnc:"y",navStep:1},{clsName:"years",navFnc:"y",navStep:10},{clsName:"decades",navFnc:"y",navStep:100}],w=["days","months","years","decades"],b=["top","bottom","auto"],g=["left","right","auto"],v=["default","top","bottom"],k={up:38,38:"up",down:40,40:"down",left:37,37:"left",right:39,39:"right",tab:9,9:"tab",escape:27,27:"escape",enter:13,13:"enter",pageUp:33,33:"pageUp",pageDown:34,34:"pageDown",shift:16,16:"shift",control:17,17:"control",space:32,32:"space",t:84,84:"t",delete:46,46:"delete"},D={},C=function(){return void 0!==t.tz&&void 0!==n.timeZone&&null!==n.timeZone&&""!==n.timeZone},x=function(e){var a;return a=void 0===e||null===e?t():t.isDate(e)||t.isMoment(e)?t(e):C()?t.tz(e,l,n.useStrict,n.timeZone):t(e,l,n.useStrict),C()&&a.tz(n.timeZone),a},T=function(e){if("string"!=typeof e||e.length>1)throw new TypeError("isEnabled expects a single character string parameter");switch(e){case"y":return-1!==d.indexOf("Y");case"M":return-1!==d.indexOf("M");case"d":return-1!==d.toLowerCase().indexOf("d");case"h":case"H":return-1!==d.toLowerCase().indexOf("h");case"m":return-1!==d.indexOf("m");case"s":return-1!==d.indexOf("s");default:return!1}},M=function(){return T("h")||T("m")||T("s")},S=function(){return T("y")||T("M")||T("d")},O=function(){var t=e("<thead>").append(e("<tr>").append(e("<th>").addClass("prev").attr("data-action","previous").append(e("<i>").addClass(n.icons.previous))).append(e("<th>").addClass("picker-switch").attr("data-action","pickerSwitch").attr("colspan",n.calendarWeeks?"6":"5")).append(e("<th>").addClass("next").attr("data-action","next").append(e("<i>").addClass(n.icons.next)))),a=e("<tbody>").append(e("<tr>").append(e("<td>").attr("colspan",n.calendarWeeks?"8":"7")));return[e("<div>").addClass("datepicker-days").append(e("<table>").addClass("table-condensed").append(t).append(e("<tbody>"))),e("<div>").addClass("datepicker-months").append(e("<table>").addClass("table-condensed").append(t.clone()).append(a.clone())),e("<div>").addClass("datepicker-years").append(e("<table>").addClass("table-condensed").append(t.clone()).append(a.clone())),e("<div>").addClass("datepicker-decades").append(e("<table>").addClass("table-condensed").append(t.clone()).append(a.clone()))]},P=function(){var t=e("<tr>"),a=e("<tr>"),r=e("<tr>");return T("h")&&(t.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.incrementHour}).addClass("btn").attr("data-action","incrementHours").append(e("<i>").addClass(n.icons.up)))),a.append(e("<td>").append(e("<span>").addClass("timepicker-hour").attr({"data-time-component":"hours",title:n.tooltips.pickHour}).attr("data-action","showHours"))),r.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.decrementHour}).addClass("btn").attr("data-action","decrementHours").append(e("<i>").addClass(n.icons.down))))),T("m")&&(T("h")&&(t.append(e("<td>").addClass("separator")),a.append(e("<td>").addClass("separator").html(":")),r.append(e("<td>").addClass("separator"))),t.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.incrementMinute}).addClass("btn").attr("data-action","incrementMinutes").append(e("<i>").addClass(n.icons.up)))),a.append(e("<td>").append(e("<span>").addClass("timepicker-minute").attr({"data-time-component":"minutes",title:n.tooltips.pickMinute}).attr("data-action","showMinutes"))),r.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.decrementMinute}).addClass("btn").attr("data-action","decrementMinutes").append(e("<i>").addClass(n.icons.down))))),T("s")&&(T("m")&&(t.append(e("<td>").addClass("separator")),a.append(e("<td>").addClass("separator").html(":")),r.append(e("<td>").addClass("separator"))),t.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.incrementSecond}).addClass("btn").attr("data-action","incrementSeconds").append(e("<i>").addClass(n.icons.up)))),a.append(e("<td>").append(e("<span>").addClass("timepicker-second").attr({"data-time-component":"seconds",title:n.tooltips.pickSecond}).attr("data-action","showSeconds"))),r.append(e("<td>").append(e("<a>").attr({href:"#",tabindex:"-1",title:n.tooltips.decrementSecond}).addClass("btn").attr("data-action","decrementSeconds").append(e("<i>").addClass(n.icons.down))))),s||(t.append(e("<td>").addClass("separator")),a.append(e("<td>").append(e("<button>").addClass("btn btn-primary").attr({"data-action":"togglePeriod",tabindex:"-1",title:n.tooltips.togglePeriod}))),r.append(e("<td>").addClass("separator"))),e("<div>").addClass("timepicker-picker").append(e("<table>").addClass("table-condensed").append([t,a,r]))},E=function(){var t=e("<div>").addClass("timepicker-hours").append(e("<table>").addClass("table-condensed")),a=e("<div>").addClass("timepicker-minutes").append(e("<table>").addClass("table-condensed")),n=e("<div>").addClass("timepicker-seconds").append(e("<table>").addClass("table-condensed")),r=[P()];return T("h")&&r.push(t),T("m")&&r.push(a),T("s")&&r.push(n),r},H=function(){var t=[];return n.showTodayButton&&t.push(e("<td>").append(e("<a>").attr({"data-action":"today",title:n.tooltips.today}).append(e("<i>").addClass(n.icons.today)))),!n.sideBySide&&S()&&M()&&t.push(e("<td>").append(e("<a>").attr({"data-action":"togglePicker",title:n.tooltips.selectTime}).append(e("<i>").addClass(n.icons.time)))),n.showClear&&t.push(e("<td>").append(e("<a>").attr({"data-action":"clear",title:n.tooltips.clear}).append(e("<i>").addClass(n.icons.clear)))),n.showClose&&t.push(e("<td>").append(e("<a>").attr({"data-action":"close",title:n.tooltips.close}).append(e("<i>").addClass(n.icons.close)))),e("<table>").addClass("table-condensed").append(e("<tbody>").append(e("<tr>").append(t)))},I=function(){var t=e("<div>").addClass("bootstrap-datetimepicker-widget dropdown-menu"),a=e("<div>").addClass("datepicker").append(O()),r=e("<div>").addClass("timepicker").append(E()),i=e("<ul>").addClass("list-unstyled"),o=e("<li>").addClass("picker-switch"+(n.collapse?" accordion-toggle":"")).append(H());return n.inline&&t.removeClass("dropdown-menu"),s&&t.addClass("usetwentyfour"),T("s")&&!s&&t.addClass("wider"),n.sideBySide&&S()&&M()?(t.addClass("timepicker-sbs"),"top"===n.toolbarPlacement&&t.append(o),t.append(e("<div>").addClass("row").append(a.addClass("col-md-6")).append(r.addClass("col-md-6"))),"bottom"===n.toolbarPlacement&&t.append(o),t):("top"===n.toolbarPlacement&&i.append(o),S()&&i.append(e("<li>").addClass(n.collapse&&M()?"collapse show":"").append(a)),"default"===n.toolbarPlacement&&i.append(o),M()&&i.append(e("<li>").addClass(n.collapse&&S()?"collapse":"").append(r)),"bottom"===n.toolbarPlacement&&i.append(o),t.append(i))},Y=function(){var t,r=(f||a).position(),i=(f||a).offset(),o=n.widgetPositioning.vertical,s=n.widgetPositioning.horizontal;if(n.widgetParent)t=n.widgetParent.append(m);else if(a.is("input"))t=a.after(m).parent();else{if(n.inline)return void(t=a.append(m));t=a,a.children().first().after(m)}if("auto"===o&&(o=i.top+1.5*m.height()>=e(window).height()+e(window).scrollTop()&&m.height()+a.outerHeight()<i.top?"top":"bottom"),"auto"===s&&(s=t.width()<i.left+m.outerWidth()/2&&i.left+m.outerWidth()>e(window).width()?"right":"left"),"top"===o?m.addClass("top").removeClass("bottom"):m.addClass("bottom").removeClass("top"),"right"===s?m.addClass("pull-right"):m.removeClass("pull-right"),"static"===t.css("position")&&(t=t.parents().filter(function(){return"static"!==e(this).css("position")}).first()),0===t.length)throw new Error("datetimepicker component should be placed within a non-static positioned container");m.css({top:"top"===o?"auto":r.top+a.outerHeight(),bottom:"top"===o?t.outerHeight()-(t===a?0:r.top):"auto",left:"left"===s?t===a?0:r.left:"auto",right:"left"===s?"auto":t.outerWidth()-a.outerWidth()-(t===a?0:r.left)})},q=function(e){"dp.change"===e.type&&(e.date&&e.date.isSame(e.oldDate)||!e.date&&!e.oldDate)||a.trigger(e)},B=function(e){"y"===e&&(e="YYYY"),q({type:"dp.update",change:e,viewDate:i.clone()})},j=function(e){m&&(e&&(p=Math.max(h,Math.min(3,p+e))),m.find(".datepicker > div").hide().filter(".datepicker-"+y[p].clsName).show())},A=function(){var t=e("<tr>"),a=i.clone().startOf("w").startOf("d");for(!0===n.calendarWeeks&&t.append(e("<th>").addClass("cw").text("#"));a.isBefore(i.clone().endOf("w"));)t.append(e("<th>").addClass("dow").text(a.format("dd"))),a.add(1,"d");m.find(".datepicker-days thead").append(t)},F=function(e){return!0===n.disabledDates[e.format("YYYY-MM-DD")]},L=function(e){return!0===n.enabledDates[e.format("YYYY-MM-DD")]},W=function(e){return!0===n.disabledHours[e.format("H")]},z=function(e){return!0===n.enabledHours[e.format("H")]},N=function(t,a){if(!t.isValid())return!1;if(n.disabledDates&&"d"===a&&F(t))return!1;if(n.enabledDates&&"d"===a&&!L(t))return!1;if(n.minDate&&t.isBefore(n.minDate,a))return!1;if(n.maxDate&&t.isAfter(n.maxDate,a))return!1;if(n.daysOfWeekDisabled&&"d"===a&&-1!==n.daysOfWeekDisabled.indexOf(t.day()))return!1;if(n.disabledHours&&("h"===a||"m"===a||"s"===a)&&W(t))return!1;if(n.enabledHours&&("h"===a||"m"===a||"s"===a)&&!z(t))return!1;if(n.disabledTimeIntervals&&("h"===a||"m"===a||"s"===a)){var r=!1;if(e.each(n.disabledTimeIntervals,function(){if(t.isBetween(this[0],this[1]))return r=!0,!1}),r)return!1}return!0},V=function(){for(var t=[],a=i.clone().startOf("y").startOf("d");a.isSame(i,"y");)t.push(e("<span>").attr("data-action","selectMonth").addClass("month").text(a.format("MMM"))),a.add(1,"M");m.find(".datepicker-months td").empty().append(t)},Z=function(){var t=m.find(".datepicker-months"),a=t.find("th"),o=t.find("tbody").find("span");a.eq(0).find("span").attr("title",n.tooltips.prevYear),a.eq(1).attr("title",n.tooltips.selectYear),a.eq(2).find("span").attr("title",n.tooltips.nextYear),t.find(".disabled").removeClass("disabled"),N(i.clone().subtract(1,"y"),"y")||a.eq(0).addClass("disabled"),a.eq(1).text(i.year()),N(i.clone().add(1,"y"),"y")||a.eq(2).addClass("disabled"),o.removeClass("active"),r.isSame(i,"y")&&!u&&o.eq(r.month()).addClass("active"),o.each(function(t){N(i.clone().month(t),"M")||e(this).addClass("disabled")})},R=function(){var e=m.find(".datepicker-years"),t=e.find("th"),a=i.clone().subtract(5,"y"),o=i.clone().add(6,"y"),s="";for(t.eq(0).find("span").attr("title",n.tooltips.prevDecade),t.eq(1).attr("title",n.tooltips.selectDecade),t.eq(2).find("span").attr("title",n.tooltips.nextDecade),e.find(".disabled").removeClass("disabled"),n.minDate&&n.minDate.isAfter(a,"y")&&t.eq(0).addClass("disabled"),t.eq(1).text(a.year()+"-"+o.year()),n.maxDate&&n.maxDate.isBefore(o,"y")&&t.eq(2).addClass("disabled");!a.isAfter(o,"y");)s+='<span data-action="selectYear" class="year'+(a.isSame(r,"y")&&!u?" active":"")+(N(a,"y")?"":" disabled")+'">'+a.year()+"</span>",a.add(1,"y");e.find("td").html(s)},Q=function(){var e,a=m.find(".datepicker-decades"),o=a.find("th"),s=t({y:i.year()-i.year()%100-1}),d=s.clone().add(100,"y"),l=s.clone(),p=!1,c=!1,u="";for(o.eq(0).find("span").attr("title",n.tooltips.prevCentury),o.eq(2).find("span").attr("title",n.tooltips.nextCentury),a.find(".disabled").removeClass("disabled"),(s.isSame(t({y:1900}))||n.minDate&&n.minDate.isAfter(s,"y"))&&o.eq(0).addClass("disabled"),o.eq(1).text(s.year()+"-"+d.year()),(s.isSame(t({y:2e3}))||n.maxDate&&n.maxDate.isBefore(d,"y"))&&o.eq(2).addClass("disabled");!s.isAfter(d,"y");)e=s.year()+12,p=n.minDate&&n.minDate.isAfter(s,"y")&&n.minDate.year()<=e,c=n.maxDate&&n.maxDate.isAfter(s,"y")&&n.maxDate.year()<=e,u+='<span data-action="selectDecade" class="decade'+(r.isAfter(s)&&r.year()<=e?" active":"")+(N(s,"y")||p||c?"":" disabled")+'" data-selection="'+(s.year()+6)+'">'+(s.year()+1)+" - "+(s.year()+12)+"</span>",s.add(12,"y");u+="<span></span><span></span><span></span>",a.find("td").html(u),o.eq(1).text(l.year()+1+"-"+s.year())},U=function(){var t,a,o,s=m.find(".datepicker-days"),d=s.find("th"),l=[],p=[];if(S()){for(d.eq(0).find("span").attr("title",n.tooltips.prevMonth),d.eq(1).attr("title",n.tooltips.selectMonth),d.eq(2).find("span").attr("title",n.tooltips.nextMonth),s.find(".disabled").removeClass("disabled"),d.eq(1).text(i.format(n.dayViewHeaderFormat)),N(i.clone().subtract(1,"M"),"M")||d.eq(0).addClass("disabled"),N(i.clone().add(1,"M"),"M")||d.eq(2).addClass("disabled"),t=i.clone().startOf("M").startOf("w").startOf("d"),o=0;o<42;o++)0===t.weekday()&&(a=e("<tr>"),n.calendarWeeks&&a.append('<td class="cw">'+t.week()+"</td>"),l.push(a)),p=["day"],t.isBefore(i,"M")&&p.push("old"),t.isAfter(i,"M")&&p.push("new"),t.isSame(r,"d")&&!u&&p.push("active"),N(t,"d")||p.push("disabled"),t.isSame(x(),"d")&&p.push("today"),0!==t.day()&&6!==t.day()||p.push("weekend"),q({type:"dp.classify",date:t,classNames:p}),a.append('<td data-action="selectDay" data-day="'+t.format("L")+'" class="'+p.join(" ")+'">'+t.date()+"</td>"),t.add(1,"d");s.find("tbody").empty().append(l),Z(),R(),Q()}},G=function(){var t=m.find(".timepicker-hours table"),a=i.clone().startOf("d"),n=[],r=e("<tr>");for(i.hour()>11&&!s&&a.hour(12);a.isSame(i,"d")&&(s||i.hour()<12&&a.hour()<12||i.hour()>11);)a.hour()%4==0&&(r=e("<tr>"),n.push(r)),r.append('<td data-action="selectHour" class="hour'+(N(a,"h")?"":" disabled")+'">'+a.format(s?"HH":"hh")+"</td>"),a.add(1,"h");t.empty().append(n)},J=function(){for(var t=m.find(".timepicker-minutes table"),a=i.clone().startOf("h"),r=[],o=e("<tr>"),s=1===n.stepping?5:n.stepping;i.isSame(a,"h");)a.minute()%(4*s)==0&&(o=e("<tr>"),r.push(o)),o.append('<td data-action="selectMinute" class="minute'+(N(a,"m")?"":" disabled")+'">'+a.format("mm")+"</td>"),a.add(s,"m");t.empty().append(r)},K=function(){for(var t=m.find(".timepicker-seconds table"),a=i.clone().startOf("m"),n=[],r=e("<tr>");i.isSame(a,"m");)a.second()%20==0&&(r=e("<tr>"),n.push(r)),r.append('<td data-action="selectSecond" class="second'+(N(a,"s")?"":" disabled")+'">'+a.format("ss")+"</td>"),a.add(5,"s");t.empty().append(n)},X=function(){var e,t,a=m.find(".timepicker span[data-time-component]");s||(e=m.find(".timepicker [data-action=togglePeriod]"),t=r.clone().add(r.hours()>=12?-12:12,"h"),e.text(r.format("A")),N(t,"h")?e.removeClass("disabled"):e.addClass("disabled")),a.filter("[data-time-component=hours]").text(r.format(s?"HH":"hh")),a.filter("[data-time-component=minutes]").text(r.format("mm")),a.filter("[data-time-component=seconds]").text(r.format("ss")),G(),J(),K()},$=function(){m&&(U(),X())},_=function(e){var t=u?null:r;if(!e)return u=!0,o.val(""),a.data("date",""),q({type:"dp.change",date:!1,oldDate:t}),void $();if(e=e.clone().locale(n.locale),C()&&e.tz(n.timeZone),1!==n.stepping)for(e.minutes(Math.round(e.minutes()/n.stepping)*n.stepping).seconds(0);n.minDate&&e.isBefore(n.minDate);)e.add(n.stepping,"minutes");N(e)?(i=(r=e).clone(),o.val(r.format(d)),a.data("date",r.format(d)),u=!1,$(),q({type:"dp.change",date:r.clone(),oldDate:t})):(n.keepInvalid?q({type:"dp.change",date:e,oldDate:t}):o.val(u?"":r.format(d)),q({type:"dp.error",date:e,oldDate:t}))},ee=function(){var t=!1;return m?(m.find(".collapse").each(function(){var a=e(this).data("collapse");return!a||!a.transitioning||(t=!0,!1)}),t?c:(f&&f.hasClass("btn")&&f.toggleClass("active"),m.hide(),e(window).off("resize",Y),m.off("click","[data-action]"),m.off("mousedown",!1),m.remove(),m=!1,q({type:"dp.hide",date:r.clone()}),o.blur(),i=r.clone(),c)):c},te=function(){_(null)},ae=function(e){return void 0===n.parseInputDate?(!t.isMoment(e)||e instanceof Date)&&(e=x(e)):e=n.parseInputDate(e),e},ne={next:function(){var e=y[p].navFnc;i.add(y[p].navStep,e),U(),B(e)},previous:function(){var e=y[p].navFnc;i.subtract(y[p].navStep,e),U(),B(e)},pickerSwitch:function(){j(1)},selectMonth:function(t){var a=e(t.target).closest("tbody").find("span").index(e(t.target));i.month(a),p===h?(_(r.clone().year(i.year()).month(i.month())),n.inline||ee()):(j(-1),U()),B("M")},selectYear:function(t){var a=parseInt(e(t.target).text(),10)||0;i.year(a),p===h?(_(r.clone().year(i.year())),n.inline||ee()):(j(-1),U()),B("YYYY")},selectDecade:function(t){var a=parseInt(e(t.target).data("selection"),10)||0;i.year(a),p===h?(_(r.clone().year(i.year())),n.inline||ee()):(j(-1),U()),B("YYYY")},selectDay:function(t){var a=i.clone();e(t.target).is(".old")&&a.subtract(1,"M"),e(t.target).is(".new")&&a.add(1,"M"),_(a.date(parseInt(e(t.target).text(),10))),M()||n.keepOpen||n.inline||ee()},incrementHours:function(){var e=r.clone().add(1,"h");N(e,"h")&&_(e)},incrementMinutes:function(){var e=r.clone().add(n.stepping,"m");N(e,"m")&&_(e)},incrementSeconds:function(){var e=r.clone().add(1,"s");N(e,"s")&&_(e)},decrementHours:function(){var e=r.clone().subtract(1,"h");N(e,"h")&&_(e)},decrementMinutes:function(){var e=r.clone().subtract(n.stepping,"m");N(e,"m")&&_(e)},decrementSeconds:function(){var e=r.clone().subtract(1,"s");N(e,"s")&&_(e)},togglePeriod:function(){_(r.clone().add(r.hours()>=12?-12:12,"h"))},togglePicker:function(t){var a,r=e(t.target),i=r.closest("ul"),o=i.find(".show"),s=i.find(".collapse:not(.show)");if(o&&o.length){if((a=o.data("collapse"))&&a.transitioning)return;o.collapse?(o.collapse("hide"),s.collapse("show")):(o.removeClass("show"),s.addClass("show")),r.is("i")?r.toggleClass(n.icons.time+" "+n.icons.date):r.find("i").toggleClass(n.icons.time+" "+n.icons.date)}},showPicker:function(){m.find(".timepicker > div:not(.timepicker-picker)").hide(),m.find(".timepicker .timepicker-picker").show()},showHours:function(){m.find(".timepicker .timepicker-picker").hide(),m.find(".timepicker .timepicker-hours").show()},showMinutes:function(){m.find(".timepicker .timepicker-picker").hide(),m.find(".timepicker .timepicker-minutes").show()},showSeconds:function(){m.find(".timepicker .timepicker-picker").hide(),m.find(".timepicker .timepicker-seconds").show()},selectHour:function(t){var a=parseInt(e(t.target).text(),10);s||(r.hours()>=12?12!==a&&(a+=12):12===a&&(a=0)),_(r.clone().hours(a)),ne.showPicker.call(c)},selectMinute:function(t){_(r.clone().minutes(parseInt(e(t.target).text(),10))),ne.showPicker.call(c)},selectSecond:function(t){_(r.clone().seconds(parseInt(e(t.target).text(),10))),ne.showPicker.call(c)},clear:te,today:function(){var e=x();N(e,"d")&&_(e)},close:ee},re=function(t){return!e(t.currentTarget).is(".disabled")&&(ne[e(t.currentTarget).data("action")].apply(c,arguments),!1)},ie=function(){var t,a={year:function(e){return e.month(0).date(1).hours(0).seconds(0).minutes(0)},month:function(e){return e.date(1).hours(0).seconds(0).minutes(0)},day:function(e){return e.hours(0).seconds(0).minutes(0)},hour:function(e){return e.seconds(0).minutes(0)},minute:function(e){return e.seconds(0)}};return o.prop("disabled")||!n.ignoreReadonly&&o.prop("readonly")||m?c:(void 0!==o.val()&&0!==o.val().trim().length?_(ae(o.val().trim())):u&&n.useCurrent&&(n.inline||o.is("input")&&0===o.val().trim().length)&&(t=x(),"string"==typeof n.useCurrent&&(t=a[n.useCurrent](t)),_(t)),m=I(),A(),V(),m.find(".timepicker-hours").hide(),m.find(".timepicker-minutes").hide(),m.find(".timepicker-seconds").hide(),$(),j(),e(window).on("resize",Y),m.on("click","[data-action]",re),m.on("mousedown",!1),f&&f.hasClass("btn")&&f.toggleClass("active"),Y(),m.show(),n.focusOnShow&&!o.is(":focus")&&o.focus(),q({type:"dp.show"}),c)},oe=function(){return m?ee():ie()},se=function(e){var t,a,r,i,o=null,s=[],d={},l=e.which;D[l]="p";for(t in D)D.hasOwnProperty(t)&&"p"===D[t]&&(s.push(t),parseInt(t,10)!==l&&(d[t]=!0));for(t in n.keyBinds)if(n.keyBinds.hasOwnProperty(t)&&"function"==typeof n.keyBinds[t]&&(r=t.split(" ")).length===s.length&&k[l]===r[r.length-1]){for(i=!0,a=r.length-2;a>=0;a--)if(!(k[r[a]]in d)){i=!1;break}if(i){o=n.keyBinds[t];break}}o&&(o.call(c,m),e.stopPropagation(),e.preventDefault())},de=function(e){D[e.which]="r",e.stopPropagation(),e.preventDefault()},le=function(t){var a=e(t.target).val().trim(),n=a?ae(a):null;return _(n),t.stopImmediatePropagation(),!1},pe=function(){o.off({change:le,blur:blur,keydown:se,keyup:de,focus:n.allowInputToggle?ee:""}),a.is("input")?o.off({focus:ie}):f&&(f.off("click",oe),f.off("mousedown",!1))},ce=function(t){var a={};return e.each(t,function(){var e=ae(this);e.isValid()&&(a[e.format("YYYY-MM-DD")]=!0)}),!!Object.keys(a).length&&a},ue=function(t){var a={};return e.each(t,function(){a[this]=!0}),!!Object.keys(a).length&&a},fe=function(){var e=n.format||"L LT";d=e.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,function(e){return(r.localeData().longDateFormat(e)||e).replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,function(e){return r.localeData().longDateFormat(e)||e})}),(l=n.extraFormats?n.extraFormats.slice():[]).indexOf(e)<0&&l.indexOf(d)<0&&l.push(d),s=d.toLowerCase().indexOf("a")<1&&d.replace(/\[.*?\]/g,"").indexOf("h")<1,T("y")&&(h=2),T("M")&&(h=1),T("d")&&(h=0),p=Math.max(h,p),u||_(r)};if(c.destroy=function(){ee(),pe(),a.removeData("DateTimePicker"),a.removeData("date")},c.toggle=oe,c.show=ie,c.hide=ee,c.disable=function(){return ee(),f&&f.hasClass("btn")&&f.addClass("disabled"),o.prop("disabled",!0),c},c.enable=function(){return f&&f.hasClass("btn")&&f.removeClass("disabled"),o.prop("disabled",!1),c},c.ignoreReadonly=function(e){if(0===arguments.length)return n.ignoreReadonly;if("boolean"!=typeof e)throw new TypeError("ignoreReadonly () expects a boolean parameter");return n.ignoreReadonly=e,c},c.options=function(t){if(0===arguments.length)return e.extend(!0,{},n);if(!(t instanceof Object))throw new TypeError("options() options parameter should be an object");return e.extend(!0,n,t),e.each(n,function(e,t){if(void 0===c[e])throw new TypeError("option "+e+" is not recognized!");c[e](t)}),c},c.date=function(e){if(0===arguments.length)return u?null:r.clone();if(!(null===e||"string"==typeof e||t.isMoment(e)||e instanceof Date))throw new TypeError("date() parameter must be one of [null, string, moment or Date]");return _(null===e?null:ae(e)),c},c.format=function(e){if(0===arguments.length)return n.format;if("string"!=typeof e&&("boolean"!=typeof e||!1!==e))throw new TypeError("format() expects a string or boolean:false parameter "+e);return n.format=e,d&&fe(),c},c.timeZone=function(e){if(0===arguments.length)return n.timeZone;if("string"!=typeof e)throw new TypeError("newZone() expects a string parameter");return n.timeZone=e,c},c.dayViewHeaderFormat=function(e){if(0===arguments.length)return n.dayViewHeaderFormat;if("string"!=typeof e)throw new TypeError("dayViewHeaderFormat() expects a string parameter");return n.dayViewHeaderFormat=e,c},c.extraFormats=function(e){if(0===arguments.length)return n.extraFormats;if(!1!==e&&!(e instanceof Array))throw new TypeError("extraFormats() expects an array or false parameter");return n.extraFormats=e,l&&fe(),c},c.disabledDates=function(t){if(0===arguments.length)return n.disabledDates?e.extend({},n.disabledDates):n.disabledDates;if(!t)return n.disabledDates=!1,$(),c;if(!(t instanceof Array))throw new TypeError("disabledDates() expects an array parameter");return n.disabledDates=ce(t),n.enabledDates=!1,$(),c},c.enabledDates=function(t){if(0===arguments.length)return n.enabledDates?e.extend({},n.enabledDates):n.enabledDates;if(!t)return n.enabledDates=!1,$(),c;if(!(t instanceof Array))throw new TypeError("enabledDates() expects an array parameter");return n.enabledDates=ce(t),n.disabledDates=!1,$(),c},c.daysOfWeekDisabled=function(e){if(0===arguments.length)return n.daysOfWeekDisabled.splice(0);if("boolean"==typeof e&&!e)return n.daysOfWeekDisabled=!1,$(),c;if(!(e instanceof Array))throw new TypeError("daysOfWeekDisabled() expects an array parameter");if(n.daysOfWeekDisabled=e.reduce(function(e,t){return(t=parseInt(t,10))>6||t<0||isNaN(t)?e:(-1===e.indexOf(t)&&e.push(t),e)},[]).sort(),n.useCurrent&&!n.keepInvalid){for(var t=0;!N(r,"d");){if(r.add(1,"d"),31===t)throw"Tried 31 times to find a valid date";t++}_(r)}return $(),c},c.maxDate=function(e){if(0===arguments.length)return n.maxDate?n.maxDate.clone():n.maxDate;if("boolean"==typeof e&&!1===e)return n.maxDate=!1,$(),c;"string"==typeof e&&("now"!==e&&"moment"!==e||(e=x()));var t=ae(e);if(!t.isValid())throw new TypeError("maxDate() Could not parse date parameter: "+e);if(n.minDate&&t.isBefore(n.minDate))throw new TypeError("maxDate() date parameter is before options.minDate: "+t.format(d));return n.maxDate=t,n.useCurrent&&!n.keepInvalid&&r.isAfter(e)&&_(n.maxDate),i.isAfter(t)&&(i=t.clone().subtract(n.stepping,"m")),$(),c},c.minDate=function(e){if(0===arguments.length)return n.minDate?n.minDate.clone():n.minDate;if("boolean"==typeof e&&!1===e)return n.minDate=!1,$(),c;"string"==typeof e&&("now"!==e&&"moment"!==e||(e=x()));var t=ae(e);if(!t.isValid())throw new TypeError("minDate() Could not parse date parameter: "+e);if(n.maxDate&&t.isAfter(n.maxDate))throw new TypeError("minDate() date parameter is after options.maxDate: "+t.format(d));return n.minDate=t,n.useCurrent&&!n.keepInvalid&&r.isBefore(e)&&_(n.minDate),i.isBefore(t)&&(i=t.clone().add(n.stepping,"m")),$(),c},c.defaultDate=function(e){if(0===arguments.length)return n.defaultDate?n.defaultDate.clone():n.defaultDate;if(!e)return n.defaultDate=!1,c;"string"==typeof e&&(e="now"===e||"moment"===e?x():x(e));var t=ae(e);if(!t.isValid())throw new TypeError("defaultDate() Could not parse date parameter: "+e);if(!N(t))throw new TypeError("defaultDate() date passed is invalid according to component setup validations");return n.defaultDate=t,(n.defaultDate&&n.inline||""===o.val().trim())&&_(n.defaultDate),c},c.locale=function(e){if(0===arguments.length)return n.locale;if(!t.localeData(e))throw new TypeError("locale() locale "+e+" is not loaded from moment locales!");return n.locale=e,r.locale(n.locale),i.locale(n.locale),d&&fe(),m&&(ee(),ie()),c},c.stepping=function(e){return 0===arguments.length?n.stepping:(e=parseInt(e,10),(isNaN(e)||e<1)&&(e=1),n.stepping=e,c)},c.useCurrent=function(e){var t=["year","month","day","hour","minute"];if(0===arguments.length)return n.useCurrent;if("boolean"!=typeof e&&"string"!=typeof e)throw new TypeError("useCurrent() expects a boolean or string parameter");if("string"==typeof e&&-1===t.indexOf(e.toLowerCase()))throw new TypeError("useCurrent() expects a string parameter of "+t.join(", "));return n.useCurrent=e,c},c.collapse=function(e){if(0===arguments.length)return n.collapse;if("boolean"!=typeof e)throw new TypeError("collapse() expects a boolean parameter");return n.collapse===e?c:(n.collapse=e,m&&(ee(),ie()),c)},c.icons=function(t){if(0===arguments.length)return e.extend({},n.icons);if(!(t instanceof Object))throw new TypeError("icons() expects parameter to be an Object");return e.extend(n.icons,t),m&&(ee(),ie()),c},c.tooltips=function(t){if(0===arguments.length)return e.extend({},n.tooltips);if(!(t instanceof Object))throw new TypeError("tooltips() expects parameter to be an Object");return e.extend(n.tooltips,t),m&&(ee(),ie()),c},c.useStrict=function(e){if(0===arguments.length)return n.useStrict;if("boolean"!=typeof e)throw new TypeError("useStrict() expects a boolean parameter");return n.useStrict=e,c},c.sideBySide=function(e){if(0===arguments.length)return n.sideBySide;if("boolean"!=typeof e)throw new TypeError("sideBySide() expects a boolean parameter");return n.sideBySide=e,m&&(ee(),ie()),c},c.viewMode=function(e){if(0===arguments.length)return n.viewMode;if("string"!=typeof e)throw new TypeError("viewMode() expects a string parameter");if(-1===w.indexOf(e))throw new TypeError("viewMode() parameter must be one of ("+w.join(", ")+") value");return n.viewMode=e,p=Math.max(w.indexOf(e),h),j(),c},c.toolbarPlacement=function(e){if(0===arguments.length)return n.toolbarPlacement;if("string"!=typeof e)throw new TypeError("toolbarPlacement() expects a string parameter");if(-1===v.indexOf(e))throw new TypeError("toolbarPlacement() parameter must be one of ("+v.join(", ")+") value");return n.toolbarPlacement=e,m&&(ee(),ie()),c},c.widgetPositioning=function(t){if(0===arguments.length)return e.extend({},n.widgetPositioning);if("[object Object]"!=={}.toString.call(t))throw new TypeError("widgetPositioning() expects an object variable");if(t.horizontal){if("string"!=typeof t.horizontal)throw new TypeError("widgetPositioning() horizontal variable must be a string");if(t.horizontal=t.horizontal.toLowerCase(),-1===g.indexOf(t.horizontal))throw new TypeError("widgetPositioning() expects horizontal parameter to be one of ("+g.join(", ")+")");n.widgetPositioning.horizontal=t.horizontal}if(t.vertical){if("string"!=typeof t.vertical)throw new TypeError("widgetPositioning() vertical variable must be a string");if(t.vertical=t.vertical.toLowerCase(),-1===b.indexOf(t.vertical))throw new TypeError("widgetPositioning() expects vertical parameter to be one of ("+b.join(", ")+")");n.widgetPositioning.vertical=t.vertical}return $(),c},c.calendarWeeks=function(e){if(0===arguments.length)return n.calendarWeeks;if("boolean"!=typeof e)throw new TypeError("calendarWeeks() expects parameter to be a boolean value");return n.calendarWeeks=e,$(),c},c.showTodayButton=function(e){if(0===arguments.length)return n.showTodayButton;if("boolean"!=typeof e)throw new TypeError("showTodayButton() expects a boolean parameter");return n.showTodayButton=e,m&&(ee(),ie()),c},c.showClear=function(e){if(0===arguments.length)return n.showClear;if("boolean"!=typeof e)throw new TypeError("showClear() expects a boolean parameter");return n.showClear=e,m&&(ee(),ie()),c},c.widgetParent=function(t){if(0===arguments.length)return n.widgetParent;if("string"==typeof t&&(t=e(t)),null!==t&&"string"!=typeof t&&!(t instanceof e))throw new TypeError("widgetParent() expects a string or a jQuery object parameter");return n.widgetParent=t,m&&(ee(),ie()),c},c.keepOpen=function(e){if(0===arguments.length)return n.keepOpen;if("boolean"!=typeof e)throw new TypeError("keepOpen() expects a boolean parameter");return n.keepOpen=e,c},c.focusOnShow=function(e){if(0===arguments.length)return n.focusOnShow;if("boolean"!=typeof e)throw new TypeError("focusOnShow() expects a boolean parameter");return n.focusOnShow=e,c},c.inline=function(e){if(0===arguments.length)return n.inline;if("boolean"!=typeof e)throw new TypeError("inline() expects a boolean parameter");return n.inline=e,c},c.clear=function(){return te(),c},c.keyBinds=function(e){return 0===arguments.length?n.keyBinds:(n.keyBinds=e,c)},c.getMoment=function(e){return x(e)},c.debug=function(e){if("boolean"!=typeof e)throw new TypeError("debug() expects a boolean parameter");return n.debug=e,c},c.allowInputToggle=function(e){if(0===arguments.length)return n.allowInputToggle;if("boolean"!=typeof e)throw new TypeError("allowInputToggle() expects a boolean parameter");return n.allowInputToggle=e,c},c.showClose=function(e){if(0===arguments.length)return n.showClose;if("boolean"!=typeof e)throw new TypeError("showClose() expects a boolean parameter");return n.showClose=e,c},c.keepInvalid=function(e){if(0===arguments.length)return n.keepInvalid;if("boolean"!=typeof e)throw new TypeError("keepInvalid() expects a boolean parameter");return n.keepInvalid=e,c},c.datepickerInput=function(e){if(0===arguments.length)return n.datepickerInput;if("string"!=typeof e)throw new TypeError("datepickerInput() expects a string parameter");return n.datepickerInput=e,c},c.parseInputDate=function(e){if(0===arguments.length)return n.parseInputDate;if("function"!=typeof e)throw new TypeError("parseInputDate() sholud be as function");return n.parseInputDate=e,c},c.disabledTimeIntervals=function(t){if(0===arguments.length)return n.disabledTimeIntervals?e.extend({},n.disabledTimeIntervals):n.disabledTimeIntervals;if(!t)return n.disabledTimeIntervals=!1,$(),c;if(!(t instanceof Array))throw new TypeError("disabledTimeIntervals() expects an array parameter");return n.disabledTimeIntervals=t,$(),c},c.disabledHours=function(t){if(0===arguments.length)return n.disabledHours?e.extend({},n.disabledHours):n.disabledHours;if(!t)return n.disabledHours=!1,$(),c;if(!(t instanceof Array))throw new TypeError("disabledHours() expects an array parameter");if(n.disabledHours=ue(t),n.enabledHours=!1,n.useCurrent&&!n.keepInvalid){for(var a=0;!N(r,"h");){if(r.add(1,"h"),24===a)throw"Tried 24 times to find a valid date";a++}_(r)}return $(),c},c.enabledHours=function(t){if(0===arguments.length)return n.enabledHours?e.extend({},n.enabledHours):n.enabledHours;if(!t)return n.enabledHours=!1,$(),c;if(!(t instanceof Array))throw new TypeError("enabledHours() expects an array parameter");if(n.enabledHours=ue(t),n.disabledHours=!1,n.useCurrent&&!n.keepInvalid){for(var a=0;!N(r,"h");){if(r.add(1,"h"),24===a)throw"Tried 24 times to find a valid date";a++}_(r)}return $(),c},c.viewDate=function(e){if(0===arguments.length)return i.clone();if(!e)return i=r.clone(),c;if(!("string"==typeof e||t.isMoment(e)||e instanceof Date))throw new TypeError("viewDate() parameter must be one of [string, moment or Date]");return i=ae(e),B(),c},a.is("input"))o=a;else if(0===(o=a.find(n.datepickerInput)).length)o=a.find("input");else if(!o.is("input"))throw new Error('CSS class "'+n.datepickerInput+'" cannot be applied to non input element');if(a.hasClass("input-group")&&(f=0===a.find(".datepickerbutton").length?a.find(".input-group-addon"):a.find(".datepickerbutton")),!n.inline&&!o.is("input"))throw new Error("Could not initialize DateTimePicker without an input element");return r=x(),i=r.clone(),e.extend(!0,n,function(){var t,r={};return(t=a.is("input")||n.inline?a.data():a.find("input").data()).dateOptions&&t.dateOptions instanceof Object&&(r=e.extend(!0,r,t.dateOptions)),e.each(n,function(e){var a="date"+e.charAt(0).toUpperCase()+e.slice(1);void 0!==t[a]&&(r[e]=t[a])}),r}()),c.options(n),fe(),o.on({change:le,blur:n.debug?"":ee,keydown:se,keyup:de,focus:n.allowInputToggle?ie:""}),a.is("input")?o.on({focus:ie}):f&&(f.on("click",oe),f.on("mousedown",!1)),o.prop("disabled")&&c.disable(),o.is("input")&&0!==o.val().trim().length?_(ae(o.val().trim())):n.defaultDate&&void 0===o.attr("placeholder")&&_(n.defaultDate),n.inline&&ie(),c};return e.fn.datetimepicker=function(t){t=t||{};var n,r=Array.prototype.slice.call(arguments,1),i=!0,o=["destroy","hide","show","toggle"];if("object"==typeof t)return this.each(function(){var n,r=e(this);r.data("DateTimePicker")||(n=e.extend(!0,{},e.fn.datetimepicker.defaults,t),r.data("DateTimePicker",a(r,n)))});if("string"==typeof t)return this.each(function(){var a=e(this).data("DateTimePicker");if(!a)throw new Error('bootstrap-datetimepicker("'+t+'") method was called on an element that is not using DateTimePicker');n=a[t].apply(a,r),i=n===a}),i||e.inArray(t,o)>-1?this:n;throw new TypeError("Invalid arguments for DateTimePicker: "+t)},e.fn.datetimepicker.defaults={timeZone:"",format:!1,dayViewHeaderFormat:"MMMM YYYY",extraFormats:!1,stepping:1,minDate:!1,maxDate:!1,useCurrent:!0,collapse:!0,locale:t.locale(),defaultDate:!1,disabledDates:!1,enabledDates:!1,icons:{time:"fa fa-clock-o",date:"fa fa-calendar",up:"fa fa-chevron-up",down:"fa fa-chevron-down",previous:"fa fa-chevron-left",next:"fa fa-chevron-right",today:"fa fa-crosshairs",clear:"fa fa-trash-o",close:"fa fa-times"},tooltips:{today:"Go to today",clear:"Clear selection",close:"Close the picker",selectMonth:"Select Month",prevMonth:"Previous Month",nextMonth:"Next Month",selectYear:"Select Year",prevYear:"Previous Year",nextYear:"Next Year",selectDecade:"Select Decade",prevDecade:"Previous Decade",nextDecade:"Next Decade",prevCentury:"Previous Century",nextCentury:"Next Century",pickHour:"Pick Hour",incrementHour:"Increment Hour",decrementHour:"Decrement Hour",pickMinute:"Pick Minute",incrementMinute:"Increment Minute",decrementMinute:"Decrement Minute",pickSecond:"Pick Second",incrementSecond:"Increment Second",decrementSecond:"Decrement Second",togglePeriod:"Toggle Period",selectTime:"Select Time"},useStrict:!1,sideBySide:!1,daysOfWeekDisabled:!1,calendarWeeks:!1,viewMode:"days",toolbarPlacement:"default",showTodayButton:!1,showClear:!1,showClose:!1,widgetPositioning:{horizontal:"auto",vertical:"auto"},widgetParent:null,ignoreReadonly:!1,keepOpen:!1,focusOnShow:!0,inline:!1,keepInvalid:!1,datepickerInput:".datepickerinput",keyBinds:{up:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")?this.date(t.clone().subtract(7,"d")):this.date(t.clone().add(this.stepping(),"m"))}},down:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")?this.date(t.clone().add(7,"d")):this.date(t.clone().subtract(this.stepping(),"m"))}else this.show()},"control up":function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")?this.date(t.clone().subtract(1,"y")):this.date(t.clone().add(1,"h"))}},"control down":function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")?this.date(t.clone().add(1,"y")):this.date(t.clone().subtract(1,"h"))}},left:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")&&this.date(t.clone().subtract(1,"d"))}},right:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")&&this.date(t.clone().add(1,"d"))}},pageUp:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")&&this.date(t.clone().subtract(1,"M"))}},pageDown:function(e){if(e){var t=this.date()||this.getMoment();e.find(".datepicker").is(":visible")&&this.date(t.clone().add(1,"M"))}},enter:function(){this.hide()},escape:function(){this.hide()},"control space":function(e){e&&e.find(".timepicker").is(":visible")&&e.find('.btn[data-action="togglePeriod"]').click()},t:function(){this.date(this.getMoment())},delete:function(){this.clear()}},debug:!1,allowInputToggle:!1,disabledTimeIntervals:!1,disabledHours:!1,enabledHours:!1,viewDate:!1},e.fn.datetimepicker});
/*
    Redactor
    Version 3.1.1
    Updated: August 12, 2018

    http://imperavi.com/redactor/

    Copyright (c) 2009-2018, Imperavi Ltd.
    License: http://imperavi.com/redactor/license/
*/
(function() {
var Ajax = {};

Ajax.settings = {};
Ajax.post = function(options) { return new AjaxRequest('post', options); };
Ajax.get = function(options) { return new AjaxRequest('get', options); };

var AjaxRequest = function(method, options)
{
    var defaults = {
        method: method,
        url: '',
        before: function() {},
        success: function() {},
        error: function() {},
        data: false,
        async: true,
        headers: {}
    };

    this.p = this.extend(defaults, options);
    this.p = this.extend(this.p, Ajax.settings);
    this.p.method = this.p.method.toUpperCase();

    this.prepareData();

    this.xhr = new XMLHttpRequest();
    this.xhr.open(this.p.method, this.p.url, this.p.async);

    this.setHeaders();

    var before = (typeof this.p.before === 'function') ? this.p.before(this.xhr) : true;
    if (before !== false)
    {
        this.send();
    }
};

AjaxRequest.prototype = {
    extend: function(obj1, obj2)
    {
        if (obj2) for (var name in obj2) { obj1[name] = obj2[name]; }
        return obj1;
    },
    prepareData: function()
    {
        if (this.p.method === 'POST' && !this.isFormData()) this.p.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof this.p.data === 'object' && !this.isFormData()) this.p.data = this.toParams(this.p.data);
        if (this.p.method === 'GET') this.p.url = (this.p.data) ? this.p.url + '?' + this.p.data : this.p.url;
    },
    setHeaders: function()
    {
        this.xhr.setRequestHeader('X-Requested-With', this.p.headers['X-Requested-With'] || 'XMLHttpRequest');
        for (var name in this.p.headers)
        {
            this.xhr.setRequestHeader(name, this.p.headers[name]);
        }
    },
    isFormData: function()
    {
        return (typeof window.FormData !== 'undefined' && this.p.data instanceof window.FormData);
    },
    isComplete: function()
    {
        return !(this.xhr.status < 200 || this.xhr.status >= 300 && this.xhr.status !== 304);
    },
    send: function()
    {
        if (this.p.async)
        {
            this.xhr.onload = this.loaded.bind(this);
            this.xhr.send(this.p.data);
        }
        else
        {
            this.xhr.send(this.p.data);
            this.loaded.call(this);
        }
    },
    loaded: function()
    {
        if (this.isComplete())
        {
            var response = this.xhr.response;
            var json = this.parseJson(response);
            response = (json) ? json : response;

            if (typeof this.p.success === 'function') this.p.success(response, this.xhr);
        }
        else
        {
            if (typeof this.p.error === 'function') this.p.error(this.xhr.statusText);
        }
    },
    parseJson: function(str)
    {
        try {
            var o = JSON.parse(str);
            if (o && typeof o === 'object')
            {
                return o;
            }

        } catch (e) {}

        return false;
    },
    toParams: function (obj)
    {
        return Object.keys(obj).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }
        ).join('&');
    }
};
var DomCache = [0];
var DomExpando = 'data' + new Date();
var DomDisplayCache = {};

var Dom = function(selector, context)
{
    return this.parse(selector, context);
};

Dom.ready = function(fn)
{
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
};

Dom.prototype = {
    get dom()
    {
        return true;
    },
    get length()
    {
        return this.nodes.length;
    },
    parse: function(selector, context)
    {
        var nodes;
        var reHtmlTest = /^\s*<(\w+|!)[^>]*>/;

        if (!selector)
        {
            nodes = [];
        }
        else if (selector.dom)
        {
            this.nodes = selector.nodes;
            return selector;
        }
        else if (typeof selector !== 'string')
        {
            if (selector.nodeType && selector.nodeType === 11)
            {
                nodes = selector.childNodes;
            }
            else
            {
                nodes = (selector.nodeType || selector === window) ? [selector] : selector;
            }
        }
        else if (reHtmlTest.test(selector))
        {
            nodes = this.create(selector);
        }
        else
        {
            nodes = this._query(selector, context);
        }

        this.nodes = this._slice(nodes);
    },
    create: function(html)
    {
        if (/^<(\w+)\s*\/?>(?:<\/\1>|)$/.test(html))
        {
            return [document.createElement(RegExp.$1)];
        }

        var elements = [];
        var container = document.createElement('div');
        var children = container.childNodes;

        container.innerHTML = html;

        for (var i = 0, l = children.length; i < l; i++)
        {
            elements.push(children[i]);
        }

        return elements;
    },

    // add
    add: function(nodes)
    {
        this.nodes = this.nodes.concat(this._toArray(nodes));
    },

    // get
    get: function(index)
    {
        return this.nodes[(index || 0)] || false;
    },
    getAll: function()
    {
        return this.nodes;
    },
    eq: function(index)
    {
        return new Dom(this.nodes[index]);
    },
    first: function()
    {
        return new Dom(this.nodes[0]);
    },
    last: function()
    {
        return new Dom(this.nodes[this.nodes.length - 1]);
    },
    contents: function()
    {
        return this.get().childNodes;
    },

    // loop
    each: function(callback)
    {
        var len = this.nodes.length;
        for (var i = 0; i < len; i++)
        {
            callback.call(this, (this.nodes[i].dom) ? this.nodes[i].get() : this.nodes[i], i);
        }

        return this;
    },

    // traversing
    is: function(selector)
    {
        return (this.filter(selector).length > 0);
    },
    filter: function (selector)
    {
        var callback;
        if (selector === undefined)
        {
            return this;
        }
        else if (typeof selector === 'function')
        {
            callback = selector;
        }
        else
        {
            callback = function(node)
            {
                if (selector instanceof Node)
                {
                    return (selector === node);
                }
                else if (selector && selector.dom)
                {
                    return ((selector.nodes).indexOf(node) !== -1);
                }
                else
                {
                    node.matches = node.matches || node.msMatchesSelector || node.webkitMatchesSelector;
                    return (node.nodeType === 1) ? node.matches(selector || '*') : false;
                }
            };
        }

        return new Dom(this.nodes.filter(callback));
    },
    not: function(filter)
    {
        return this.filter(function(node)
        {
            return !new Dom(node).is(filter || true);
        });
    },
    find: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            var ns = this._query(selector || '*', node);
            for (var i = 0; i < ns.length; i++)
            {
                nodes.push(ns[i]);
            }
        });

        return new Dom(nodes);
    },
    children: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            if (node.children)
            {
                var ns = node.children;
                for (var i = 0; i < ns.length; i++)
                {
                    nodes.push(ns[i]);
                }
            }
        });

        return new Dom(nodes).filter(selector);
    },
    parent: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            if (node.parentNode) nodes.push(node.parentNode);
        });

        return new Dom(nodes).filter(selector);
    },
    parents: function(selector, context)
    {
        context = this._getContext(context);

        var nodes = [];
        this.each(function(node)
        {
            var parent = node.parentNode;
            while (parent && parent !== context)
            {
                if (selector)
                {
                    if (new Dom(parent).is(selector)) { nodes.push(parent); }
                }
                else
                {
                    nodes.push(parent);
                }

                parent = parent.parentNode;
            }
        });

        return new Dom(nodes);
    },
    closest: function(selector, context)
    {
        context = this._getContext(context);
        selector = (selector.dom) ? selector.get() : selector;

        var nodes = [];
        var isNode = (selector && selector.nodeType);
        this.each(function(node)
        {
            do {
                if ((isNode && node === selector) || new Dom(node).is(selector)) return nodes.push(node);
            } while ((node = node.parentNode) && node !== context);
        });

        return new Dom(nodes);
    },
    next: function(selector)
    {
         return this._getSibling(selector, 'nextSibling');
    },
    nextElement: function(selector)
    {
        return this._getSibling(selector, 'nextElementSibling');
    },
    prev: function(selector)
    {
        return this._getSibling(selector, 'previousSibling');
    },
    prevElement: function(selector)
    {
        return this._getSibling(selector, 'previousElementSibling');
    },

    // css
    css: function(name, value)
    {
        if (value === undefined && (typeof name !== 'object'))
        {
            var node = this.get();
            if (name === 'width' || name === 'height')
            {
                return (node.style) ? this._getHeightOrWidth(name, node, false) + 'px' : undefined;
            }
            else
            {
                return (node.style) ? getComputedStyle(node, null)[name] : undefined;
            }
        }

        // set
        return this.each(function(node)
        {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj)
            {
                if (node.style) node.style[key] = obj[key];
            }
        });
    },

    // attr
    attr: function(name, value, data)
    {
        data = (data) ? 'data-' : '';

        if (value === undefined && (typeof name !== 'object'))
        {
            var node = this.get();
            if (node && node.nodeType !== 3)
            {
                return (name === 'checked') ? node.checked : this._getBooleanFromStr(node.getAttribute(data + name));
            }
            else return;
        }

        // set
        return this.each(function(node)
        {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj)
            {
                if (node.nodeType !== 3)
                {
                    if (key === 'checked') node.checked = obj[key];
                    else node.setAttribute(data + key, obj[key]);
                }
            }
        });
    },
    data: function(name, value)
    {
        if (name === undefined)
        {
            var reDataAttr = /^data\-(.+)$/;
            var attrs = this.get().attributes;

            var data = {};
            var replacer = function (g) { return g[1].toUpperCase(); };

            for (var key in attrs)
            {
                if (reDataAttr.test(attrs[key].nodeName))
                {
                    var dataName = attrs[key].nodeName.match(reDataAttr)[1];
                    var val = attrs[key].value;
                    dataName = dataName.replace(/-([a-z])/g, replacer);

                    if (this._isObjectString(val)) val = this._toObject(val);
                    else val = (this._isNumber(val)) ? parseFloat(val) : this._getBooleanFromStr(val);

                    data[dataName] = val;
                }
            }

            return data;
        }

        return this.attr(name, value, true);
    },
    val: function(value)
    {
        if (value === undefined)
        {
            var el = this.get();
            if (el.type && el.type === 'checkbox') return el.checked;
            else return el.value;
        }

        return this.each(function(node)
        {
            node.value = value;
        });
    },
    removeAttr: function(value)
    {
        return this.each(function(node)
        {
            var rmAttr = function(name) { if (node.nodeType !== 3) node.removeAttribute(name); };
            value.split(' ').forEach(rmAttr);
        });
    },
    removeData: function(value)
    {
        return this.each(function(node)
        {
            var rmData = function(name) { if (node.nodeType !== 3) node.removeAttribute('data-' + name); };
            value.split(' ').forEach(rmData);
        });
    },

    // dataset/dataget
    dataset: function(key, value)
    {
        return this.each(function(node)
        {
            DomCache[this.dataindex(node)][key] = value;
        });
    },
    dataget: function(key)
    {
        return DomCache[this.dataindex(this.get())][key];
    },
    dataindex: function(el)
    {
        var cacheIndex = el[DomExpando];
        var nextCacheIndex = DomCache.length;

        if (!cacheIndex)
        {
            cacheIndex = el[DomExpando] = nextCacheIndex;
            DomCache[cacheIndex] = {};
        }

        return cacheIndex;
    },

    // class
    addClass: function(value)
    {
        return this._eachClass(value, 'add');
    },
    removeClass: function(value)
    {
        return this._eachClass(value, 'remove');
    },
    toggleClass: function(value)
    {
        return this._eachClass(value, 'toggle');
    },
    hasClass: function(value)
    {
        return this.nodes.some(function(node)
        {
            return (node.classList) ? node.classList.contains(value) : false;
        });
    },

    // html & text
    empty: function()
    {
        return this.each(function(node)
        {
            node.innerHTML = '';
        });
    },
    html: function(html)
    {
        return (html === undefined) ? (this.get().innerHTML || '') : this.empty().append(html);
    },
    text: function(text)
    {
        return (text === undefined) ? (this.get().textContent || '') : this.each(function(node) { node.textContent = text; });
    },

    // manipulation
    after: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string')
            {
                node.insertAdjacentHTML('afterend', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag).reverse();
                for (var i = 0; i < elms.length; i++)
                {
                    node.parentNode.insertBefore(elms[i], node.nextSibling);
                }
            }

            return node;

        });
    },
    before: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string')
            {
                node.insertAdjacentHTML('beforebegin', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++)
                {
                    node.parentNode.insertBefore(elms[i], node);
                }
            }

            return node;
        });
    },
    append: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string' || typeof frag === 'number')
            {
                node.insertAdjacentHTML('beforeend', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++)
                {
                    node.appendChild(elms[i]);
                }
            }

            return node;
        });
    },
    prepend: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string' || typeof frag === 'number')
            {
                node.insertAdjacentHTML('afterbegin', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag).reverse();
                for (var i = 0; i < elms.length; i++)
                {
                    node.insertBefore(elms[i], node.firstChild);
                }
            }

            return node;
        });
    },
    wrap: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            var wrapper = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag)[0] : (frag instanceof Node) ? frag : this._toArray(frag)[0];

            if (node.parentNode)
            {
                node.parentNode.insertBefore(wrapper, node);
            }

            wrapper.appendChild(node);

            return new Dom(wrapper);

        });
    },
    unwrap: function()
    {
        return this.each(function(node)
        {
            var $node = new Dom(node);

            return $node.replaceWith($node.contents());
        });
    },
    replaceWith: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            var docFrag = document.createDocumentFragment();
            var elms = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag) : (frag instanceof Node) ? [frag] : this._toArray(frag);

            for (var i = 0; i < elms.length; i++)
            {
                docFrag.appendChild(elms[i]);
            }

            var result = docFrag.childNodes[0];
            node.parentNode.replaceChild(docFrag, node);

            return result;

        });
    },
    remove: function()
    {
        return this.each(function(node)
        {
            if (node.parentNode) node.parentNode.removeChild(node);
        });
    },
    clone: function(events)
    {
        var nodes = [];
        this.each(function(node)
        {
            var copy = this._clone(node);
            if (events) copy = this._cloneEvents(node, copy);
            nodes.push(copy);
        });

        return new Dom(nodes);
    },

    // show/hide
    show: function()
    {
        return this.each(function(node)
        {
            if (node.style)
            {
                if (this._getRealDisplay(node) !== 'none') return;

                var old = node.getAttribute('displayOld');
                node.style.display = old || '';

                if (this._getRealDisplay(node) === 'none')
                {
                    var nodeName = node.nodeName, body = document.body, display;

                    if (DomDisplayCache[nodeName])
                    {
                        display = DomDisplayCache[nodeName];
                    }
                    else
                    {
                        var testElem = document.createElement(nodeName);
                        body.appendChild(testElem);
                        display = this._getRealDisplay(testElem);

                        if (display === 'none') display = 'block';

                        body.removeChild(testElem);
                        DomDisplayCache[nodeName] = display;
                    }

                    node.setAttribute('displayOld', display);
                    node.style.display = display;
                }
            }
        }.bind(this));
    },
    hide: function()
    {
        return this.each(function(node)
        {
            if (node.style)
            {
                if (!node.getAttribute('displayOld') && node.style.display !== '')
                {
                    node.setAttribute("displayOld", node.style.display);
                }

                node.style.display = 'none';
            }
        });
    },

    // dimensions
    scrollTop: function(value)
    {
        var node = this.get();
        var isWindow = (node === window);
        var isDocument = (node.nodeType === 9);
        var el = (isDocument) ? (document.scrollingElement || document.body.parentNode || document.body || document.documentElement) : node;

        if (value !== undefined)
        {
            if (isWindow) window.scrollTo(0, value);
            else el.scrollTop = value;
            return;
        }

        if (isDocument)
        {
            return (typeof window.pageYOffset != 'undefined') ? window.pageYOffset : ((document.documentElement.scrollTop) ? document.documentElement.scrollTop : ((document.body.scrollTop) ? document.body.scrollTop : 0));
        }
        else
        {
            return (isWindow) ? window.pageYOffset : el.scrollTop;
        }
    },
    offset: function()
    {
        return this._getDim('Offset');
    },
    position: function()
    {
        return this._getDim('Position');
    },
    width: function(value, adjust)
    {
        return this._getSize('width', 'Width', value, adjust);
    },
    height: function(value, adjust)
    {
        return this._getSize('height', 'Height', value, adjust);
    },
    outerWidth: function()
    {
        return this._getInnerOrOuter('width', 'outer');
    },
    outerHeight: function()
    {
        return this._getInnerOrOuter('height', 'outer');
    },
    innerWidth: function()
    {
        return this._getInnerOrOuter('width', 'inner');
    },
    innerHeight: function()
    {
        return this._getInnerOrOuter('height', 'inner');
    },

    // events
    click: function()
    {
        return this._triggerEvent('click');
    },
    focus: function()
    {
        return this._triggerEvent('focus');
    },
    trigger: function(names)
    {
        return this.each(function(node)
        {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++)
            {
                var ev;
                var opts = { bubbles: true, cancelable: true };

                try {
                    ev = new window.CustomEvent(events[i], opts);
                } catch(e) {
                    ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent(events[i], true, true);
                }

                node.dispatchEvent(ev);
            }
        });
    },
    on: function(names, handler, one)
    {
        return this.each(function(node)
        {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++)
            {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                handler = (one) ? this._getOneHandler(handler, names) : handler;
                node.addEventListener(event, handler);

                node._e = node._e || {};
                node._e[namespace] = node._e[namespace] || {};
                node._e[namespace][event] = node._e[namespace][event] || [];
                node._e[namespace][event].push(handler);
            }

        });
    },
    one: function(events, handler)
    {
        return this.on(events, handler, true);
    },
    off: function(names, handler)
    {
        var testEvent = function(name, key, event) { return (name === event); };
        var testNamespace = function(name, key, event, namespace) { return (key === namespace); };
        var testEventNamespace = function(name, key, event, namespace) { return (name === event && key === namespace); };
        var testPositive = function() { return true; };

        if (names === undefined)
        {
            // ALL
            return this.each(function(node)
            {
                this._offEvent(node, false, false, handler, testPositive);
            });
        }

        return this.each(function(node)
        {
            var events = names.split(' ');

            for (var i = 0; i < events.length; i++)
            {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                // 1) event without namespace
                if (namespace === '_events') this._offEvent(node, event, namespace, handler, testEvent);
                // 2) only namespace
                else if (!event && namespace !== '_events') this._offEvent(node, event, namespace, handler, testNamespace);
                // 3) event + namespace
                else this._offEvent(node, event, namespace, handler, testEventNamespace);
            }
        });
    },

    // form
    serialize: function(asObject)
    {
        var obj = {};
        var elms = this.get().elements;
        for (var i = 0; i < elms.length; i++)
        {
            var el = elms[i];
            if (/(checkbox|radio)/.test(el.type) && !el.checked) continue;
            if (!el.name || el.disabled || el.type === 'file') continue;

            if (el.type === 'select-multiple')
            {
                for (var z = 0; z < el.options.length; z++)
                {
                    var opt = el.options[z];
                    if (opt.selected) obj[el.name] = opt.value;
                }
            }

            obj[el.name] = el.value;
        }

        return (asObject) ? obj : this._toParams(obj);
    },
    ajax: function(success, error)
    {
        if (typeof AjaxRequest !== 'undefined')
        {
            var method = this.attr('method') || 'post';
            var options = {
                url: this.attr('action'),
                data: this.serialize(),
                success: success,
                error: error
            };

            return new AjaxRequest(method, options);
        }
    },

    // private
    _queryContext: function(selector, context)
    {
        context = this._getContext(context);

        return (context.nodeType !== 3 && typeof context.querySelectorAll === 'function') ? context.querySelectorAll(selector) : [];
    },
    _query: function(selector, context)
    {
        if (context)
        {
            return this._queryContext(selector, context);
        }
        else if (/^[.#]?[\w-]*$/.test(selector))
        {
            if (selector[0] === '#')
            {
                var element = document.getElementById(selector.slice(1));
                return element ? [element] : [];
            }

            if (selector[0] === '.')
            {
                return document.getElementsByClassName(selector.slice(1));
            }

            return document.getElementsByTagName(selector);
        }

        return document.querySelectorAll(selector);
    },
    _getContext: function(context)
    {
        context = (typeof context === 'string') ? document.querySelector(context) : context;

        return (context && context.dom) ? context.get() : (context || document);
    },
    _inject: function(html, fn)
    {
        var len = this.nodes.length;
        var nodes = [];
        while (len--)
        {
            var res = (typeof html === 'function') ? html.call(this, this.nodes[len]) : html;
            var el = (len === 0) ? res : this._clone(res);
            var node = fn.call(this, el, this.nodes[len]);

            if (node)
            {
                if (node.dom) nodes.push(node.get());
                else nodes.push(node);
            }
        }

        return new Dom(nodes);
    },
    _cloneEvents: function(node, copy)
    {
        var events = node._e;
        if (events)
        {
            copy._e = events;
            for (var name in events._events)
            {
                for (var i = 0; i < events._events[name].length; i++)
                {
                    copy.addEventListener(name, events._events[name][i]);
                }
            }
        }

        return copy;
    },
    _clone: function(node)
    {
        if (typeof node === 'undefined') return;
        if (typeof node === 'string') return node;
        else if (node instanceof Node) return node.cloneNode(true);
        else if ('length' in node)
        {
            return [].map.call(this._toArray(node), function(el) { return el.cloneNode(true); });
        }

        return node;
    },
    _slice: function(obj)
    {
        return (!obj || obj.length === 0) ? [] : (obj.length) ? [].slice.call(obj.nodes || obj) : [obj];
    },
    _eachClass: function(value, type)
    {
        return this.each(function(node)
        {
            if (value)
            {
                var setClass = function(name) { if (node.classList) node.classList[type](name); };
                value.split(' ').forEach(setClass);
            }
        });
    },
    _triggerEvent: function(name)
    {
        var node = this.get();
        if (node && node.nodeType !== 3) node[name]();
        return this;
    },
    _getOneHandler: function(handler, events)
    {
        var self = this;
        return function()
        {
            handler.apply(this, arguments);
            self.off(events);
        };
    },
    _getEventNamespace: function(event)
    {
        var arr = event.split('.');
        var namespace = (arr[1]) ? arr[1] : '_events';
        return (arr[2]) ? namespace + arr[2] : namespace;
    },
    _getEventName: function(event)
    {
        return event.split('.')[0];
    },
    _offEvent: function(node, event, namespace, handler, condition)
    {
        for (var key in node._e)
        {
            for (var name in node._e[key])
            {
                if (condition(name, key, event, namespace))
                {
                    var handlers = node._e[key][name];
                    for (var i = 0; i < handlers.length; i++)
                    {
                        if (typeof handler !== 'undefined' && handlers[i].toString() !== handler.toString())
                        {
                            continue;
                        }

                        node.removeEventListener(name, handlers[i]);
                        node._e[key][name].splice(i, 1);

                        if (node._e[key][name].length === 0) delete node._e[key][name];
                        if (Object.keys(node._e[key]).length === 0) delete node._e[key];
                    }
                }
            }
        }
    },
    _getInnerOrOuter: function(method, type)
    {
        return this[method](undefined, type);
    },
    _getDocSize: function(node, type)
    {
        var body = node.body, html = node.documentElement;
        return Math.max(body['scroll' + type], body['offset' + type], html['client' + type], html['scroll' + type], html['offset' + type]);
    },
    _getSize: function(type, captype, value, adjust)
    {
        if (value === undefined)
        {
            var el = this.get();
            if (el.nodeType === 3)      value = 0;
            else if (el.nodeType === 9) value = this._getDocSize(el, captype);
            else if (el === window)     value = window['inner' + captype];
            else                        value = this._getHeightOrWidth(type, el, adjust || 'normal');

            return Math.round(value);
        }

        return this.each(function(node)
        {
            value = parseFloat(value);
            value = value + this._adjustResultHeightOrWidth(type, node, adjust || 'normal');

            new Dom(node).css(type, value + 'px');

        }.bind(this));
    },
    _getHeightOrWidth: function(type, el, adjust)
    {
        var name = type.charAt(0).toUpperCase() + type.slice(1);
        var style = getComputedStyle(el, null);
        var $el = new Dom(el);
        var result = 0;
        var $targets = $el.parents().filter(function(node)
        {
            return (getComputedStyle(node, null).display === 'none') ? node : false;
        });

        if (style.display === 'none') $targets.add(el);
        if ($targets.length !== 0)
        {
            var fixStyle = 'visibility: hidden !important; display: block !important;';
            var tmp = [];

            $targets.each(function(node)
            {
                var $node = new Dom(node);
                var thisStyle = $node.attr('style');
                if (thisStyle !== null) tmp.push(thisStyle);
                $node.attr('style', (thisStyle !== null) ? thisStyle + ';' + fixStyle : fixStyle);
            });

            result = $el.get()['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);

            $targets.each(function(node, i)
            {
                var $node = new Dom(node);
                if (tmp[i] === undefined) $node.removeAttr('style');
                else $node.attr('style', tmp[i]);
            });
        }
        else
        {
            result = el['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);
        }

        return result;
    },
    _adjustResultHeightOrWidth: function(type, el, adjust)
    {
        if (!el || adjust === false) return 0;

        var fix = 0;
        var style = getComputedStyle(el, null);
        var isBorderBox = (style.boxSizing === "border-box");

        if (type === 'height')
        {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox))
            {
                fix += (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        }
        else
        {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox))
            {
                fix += (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
        }

        return fix;
    },
    _getDim: function(type)
    {
        var node = this.get();
        return (node.nodeType === 3) ? { top: 0, left: 0 } : this['_get' + type](node);
    },
    _getPosition: function(node)
    {
        return { top: node.offsetTop, left: node.offsetLeft };
    },
    _getOffset: function(node)
    {
        var rect = node.getBoundingClientRect();
        var doc = node.ownerDocument;
		var docElem = doc.documentElement;
		var win = doc.defaultView;

		return {
			top: rect.top + win.pageYOffset - docElem.clientTop,
			left: rect.left + win.pageXOffset - docElem.clientLeft
		};
    },
    _getSibling: function(selector, method)
    {
        selector = (selector && selector.dom) ? selector.get() : selector;

        var isNode = (selector && selector.nodeType);
        var sibling;

        this.each(function(node)
        {
            while (node = node[method])
            {
                if ((isNode && node === selector) || new Dom(node).is(selector))
                {
                    sibling = node;
                    return;
                }
            }
        });

        return new Dom(sibling);
    },
    _toArray: function(obj)
    {
        if (obj instanceof NodeList)
        {
            var arr = [];
            for (var i = 0; i < obj.length; i++)
            {
                arr[i] = obj[i];
            }

            return arr;
        }
        else if (obj === undefined) return [];
        else
        {
            return (obj.dom) ? obj.nodes : obj;
        }
    },
    _toParams: function(obj)
    {
        var params = '';
        for (var key in obj)
        {
            params += '&' + this._encodeUri(key) + '=' + this._encodeUri(obj[key]);
        }

        return params.replace(/^&/, '');
    },
    _toObject: function(str)
    {
        return (new Function("return " + str))();
    },
    _encodeUri: function(str)
    {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    _isNumber: function(str)
    {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    _isObjectString: function(str)
    {
        return (str.search(/^{/) !== -1);
    },
    _getBooleanFromStr: function(str)
    {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    },
    _getRealDisplay: function(elem)
    {
        if (elem.currentStyle) return elem.currentStyle.display;
        else if (window.getComputedStyle)
        {
            var computedStyle = window.getComputedStyle(elem, null);
            return computedStyle.getPropertyValue('display');
        }
    }
};
// Unique ID
var uuid = 0;

// Wrapper
var $R = function(selector, options)
{
    return RedactorApp(selector, options, [].slice.call(arguments, 2));
};

// Globals
$R.version = '3.1.1';
$R.options = {};
$R.modules = {};
$R.services = {};
$R.classes = {};
$R.plugins = {};
$R.mixins = {};
$R.modals = {};
$R.lang = {};
$R.dom = function(selector, context) { return new Dom(selector, context); };
$R.ajax = Ajax;
$R.Dom = Dom;
$R.keycodes = {
	BACKSPACE: 8,
	DELETE: 46,
	UP: 38,
	DOWN: 40,
	ENTER: 13,
	SPACE: 32,
	ESC: 27,
	TAB: 9,
	CTRL: 17,
	META: 91,
	SHIFT: 16,
	ALT: 18,
	RIGHT: 39,
	LEFT: 37
};
$R.env = {
    'plugin': 'plugins',
    'module': 'modules',
    'service': 'services',
    'class': 'classes',
    'mixin': 'mixins'
};

// jQuery Wrapper
/*eslint-env jquery*/
if (typeof jQuery !== 'undefined')
{
    (function($) { $.fn.redactor = function(options) { return RedactorApp(this.toArray(), options, [].slice.call(arguments, 1)); }; })(jQuery);
}

// Class
var RedactorApp = function(selector, options, args)
{
    var namespace = 'redactor';
    var nodes = (Array.isArray(selector)) ? selector : (selector && selector.nodeType) ? [selector] : document.querySelectorAll(selector);
    var isApi = (typeof options === 'string' || typeof options === 'function');
    var value = [];
    var instance;

    for (var i = 0; i < nodes.length; i++)
    {
        var el = nodes[i];
        var $el = $R.dom(el);

        instance = $el.dataget(namespace);
        if (!instance && !isApi)
        {
            // Initialization
            $el.dataset(namespace, (instance = new App(el, options, uuid)));
            uuid++;
        }

        // API
        if (instance && isApi)
        {
            var isDestroy = (options === 'destroy');
            options = (isDestroy) ? 'stop' : options;

            var methodValue;
            if (typeof options === 'function')
            {
                methodValue = options.apply(instance, args);
            }
            else
            {
                args.unshift(options);
                methodValue = instance.api.apply(instance, args);
            }
            if (methodValue !== undefined) value.push(methodValue);

            if (isDestroy) $el.dataset(namespace, false);
        }
    }

    return (value.length === 0 || value.length === 1) ? ((value.length === 0) ? instance : value[0]) : value;
};

// add
$R.add = function(type, name, obj)
{
    if (typeof $R.env[type] === 'undefined') return;

    // translations
    if (obj.translations)
    {
        $R.lang = $R.extend(true, {}, $R.lang, obj.translations);
    }

    // modals
    if (obj.modals)
    {
        $R.modals = $R.extend(true, {}, $R.modals, obj.modals);
    }

    // mixin
    if (type === 'mixin')
    {
        $R[$R.env[type]][name] = obj;
    }
    else
    {
        // prototype
        var F = function() {};
        F.prototype = obj;

        // mixins
        if (obj.mixins)
        {
            for (var i = 0; i < obj.mixins.length; i++)
            {
                $R.inherit(F, $R.mixins[obj.mixins[i]]);
            }
        }

        $R[$R.env[type]][name] = F;
    }
};

// add lang
$R.addLang = function(lang, obj)
{
    if (typeof $R.lang[lang] === 'undefined')
    {
        $R.lang[lang] = {};
    }

    $R.lang[lang] = $R.extend($R.lang[lang], obj);
};

// create
$R.create = function(name)
{
    var arr = name.split('.');
    var args = [].slice.call(arguments, 1);

    var type = 'classes';
    if (typeof $R.env[arr[0]] !== 'undefined')
    {
        type = $R.env[arr[0]];
        name = arr.slice(1).join('.');
    }

    // construct
    var instance = new $R[type][name]();

    // init
    if (instance.init)
    {
        var res = instance.init.apply(instance, args);

        return (res) ? res : instance;
    }

    return instance;
};

// inherit
$R.inherit = function(current, parent)
{
    var F = function () {};
    F.prototype = parent;
    var f = new F();

    for (var prop in current.prototype)
    {
        if (current.prototype.__lookupGetter__(prop)) f.__defineGetter__(prop, current.prototype.__lookupGetter__(prop));
        else f[prop] = current.prototype[prop];
    }

    current.prototype = f;
    current.prototype.super = parent;

    return current;
};

// error
$R.error = function(exception)
{
    throw exception;
};

// extend
$R.extend = function()
{
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    if (Object.prototype.toString.call( arguments[0] ) === '[object Boolean]')
    {
        deep = arguments[0];
        i++;
    }

    var merge = function(obj)
    {
        for (var prop in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, prop))
            {
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') extended[prop] = $R.extend(true, extended[prop], obj[prop]);
                else extended[prop] = obj[prop];
            }
        }
    };

    for (; i < length; i++ )
    {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};
$R.opts = {
    animation: true,
    lang: 'en',
    direction: 'ltr',
    spellcheck: true,
    structure: false,
    scrollTarget: false,
    styles: true,
    stylesClass: 'redactor-styles',
    placeholder: false,

    source: true,
    showSource: false,

    inline: false,

    breakline: false,
    markup: 'p',
    enterKey: true,

    clickToEdit: false,
    clickToSave: false,
    clickToCancel: false,

    focus: false,
    focusEnd: false,

    minHeight: false, // string, '100px'
    maxHeight: false, // string, '100px'
    maxWidth: false, // string, '700px'

    plugins: [], // array
    callbacks: {},

    // pre & tab
    preClass: false, // string
    preSpaces: 4, // or false
    tabindex: false, // int
    tabAsSpaces: false, // true or number of spaces
    tabKey: true,

    // autosave
    autosave: false, // false or url
    autosaveName: false,
    autosaveData: false,

    // toolbar
    toolbar: true,
    toolbarFixed: true,
    toolbarFixedTarget: document,
    toolbarFixedTopOffset: 0, // pixels
    toolbarExternal: false, // ID selector
    toolbarContext: true,

    // air
    air: false,

    // formatting
    formatting: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    formattingAdd: false,
    formattingHide: false,

    // buttons
    buttons: ['html', 'format', 'bold', 'italic', 'deleted', 'lists', 'image', 'file', 'link'],
    // + 'line', 'redo', 'undo', 'underline', 'ol', 'ul', 'indent', 'outdent'
    buttonsTextLabeled: false,
    buttonsAdd: [],
    buttonsAddFirst: [],
    buttonsAddAfter: false,
    buttonsAddBefore: false,
    buttonsHide: [],
    buttonsHideOnMobile: [],

    // image
    imageUpload: false,
    imageUploadParam: 'file',
    imageData: false,
    imageEditable: true,
    imageCaption: true,
    imagePosition: false,
    imageResizable: false,
    imageFloatMargin: '10px',
    imageFigure: true,

    // file
    fileUpload: false,
    fileUploadParam: 'file',
    fileData: false,
    fileAttachment: false,

    // upload opts
    uploadData: false,
    dragUpload: true,
    multipleUpload: true,
    clipboardUpload: true,
    uploadBase64: false,

    // link
    linkTarget: false,
    linkTitle: false,
    linkNewTab: false,
    linkNofollow: false,
    linkSize: 30,
    linkValidation: true,

    // clean
    cleanOnEnter: true,
    cleanInlineOnEnter: false,
    paragraphize: true,
    removeScript: true,
    removeNewLines: false,
    removeComments: true,
    replaceTags: {
        'b': 'strong',
        'i': 'em',
        'strike': 'del'
    },

    // paste
    pastePlainText: false,
    pasteLinkTarget: false,
    pasteImages: true,
    pasteLinks: true,
    pasteClean: true,
    pasteKeepStyle: [],
    pasteKeepClass: [],
    pasteKeepAttrs: ['td', 'th'],
    pasteBlockTags: ['pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tbody', 'thead', 'tfoot', 'th', 'tr', 'td', 'ul', 'ol', 'li', 'blockquote', 'p', 'figure', 'figcaption'],
    pasteInlineTags: ['a', 'img', 'br', 'strong', 'ins', 'code', 'del', 'span', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'b', 'u', 'em', 'i', 'abbr'],

    // active buttons
    activeButtons: {
        b: 'bold',
        strong: 'bold',
        i: 'italic',
        em: 'italic',
        del: 'deleted',
        strike: 'deleted',
        u: 'underline'
    },
    activeButtonsAdd: {},
    activeButtonsObservers: {},

    // autoparser
    autoparse: true,
    autoparseStart: true,
    autoparsePaste: true,
    autoparseLinks: true,
    autoparseImages: true,
    autoparseVideo: true,

    // shortcodes
    shortcodes: {
        'p.': { format: 'p' },
        'quote.': { format: 'blockquote' },
        'pre.': { format: 'pre' },
        'h1.': { format: 'h1' },
        'h2.': { format: 'h2' },
        'h3.': { format: 'h3' },
        'h4.': { format: 'h4' },
        'h5.': { format: 'h5' },
        'h6.': { format: 'h6' },
        '1.': { format: 'ol' },
        '*.': { format: 'ul' }
    },
    shortcodesAdd: false, // object

    // shortcuts
    shortcuts: {
        'ctrl+shift+m, meta+shift+m': { api: 'module.inline.clearformat' },
        'ctrl+b, meta+b': { api: 'module.inline.format', args: 'b' },
        'ctrl+i, meta+i': { api: 'module.inline.format', args: 'i' },
        'ctrl+u, meta+u': { api: 'module.inline.format', args: 'u' },
        'ctrl+h, meta+h': { api: 'module.inline.format', args: 'sup' },
        'ctrl+l, meta+l': { api: 'module.inline.format', args: 'sub' },
        'ctrl+k, meta+k': { api: 'module.link.open' },
        'ctrl+alt+0, meta+alt+0': { api: 'module.block.format', args: 'p' },
        'ctrl+alt+1, meta+alt+1': { api: 'module.block.format', args: 'h1' },
        'ctrl+alt+2, meta+alt+2': { api: 'module.block.format', args: 'h2' },
        'ctrl+alt+3, meta+alt+3': { api: 'module.block.format', args: 'h3' },
        'ctrl+alt+4, meta+alt+4': { api: 'module.block.format', args: 'h4' },
        'ctrl+alt+5, meta+alt+5': { api: 'module.block.format', args: 'h5' },
        'ctrl+alt+6, meta+alt+6': { api: 'module.block.format', args: 'h6' },
        'ctrl+shift+7, meta+shift+7': { api: 'module.list.toggle', args: 'ol' },
        'ctrl+shift+8, meta+shift+8': { api: 'module.list.toggle', args: 'ul' }
    },
    shortcutsAdd: false, // object

    // misc
    grammarly: true,

    // private
    bufferLimit: 100,
    emptyHtml: '<p></p>',
    markerChar: '\ufeff',
    imageTypes: ['image/png', 'image/jpeg', 'image/gif'],
    inlineTags: ['a', 'span', 'strong', 'strike', 'b', 'u', 'em', 'i', 'code', 'del', 'ins', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'abbr'],
    blockTags: ['pre', 'ul', 'ol', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',  'dl', 'dt', 'dd', 'div', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'output', 'figcaption', 'figure', 'address', 'section', 'header', 'footer', 'aside', 'article', 'iframe'],
    regex: {
        youtube: /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi,
        vimeo: /(http|https)?:\/\/(?:www.|player.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_-]+)?/gi,
        imageurl: /((https?|www)[^\s]+\.)(jpe?g|png|gif)(\?[^\s-]+)?/gi,
        url: /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
    },
    input: true,
    zindex: false,
    modes: {
        "inline": {
            pastePlainText: true,
            pasteImages: false,
            enterKey: false,
            toolbar: false,
            autoparse: false,
            source: false,
            showSource: false,
            styles: false,
            air: false
        },
        "original": {
            styles: false
        }
    }
};
$R.lang['en'] = {
    "format": "Format",
    "image": "Image",
    "file": "File",
    "link": "Link",
    "bold": "Bold",
    "italic": "Italic",
    "deleted": "Strikethrough",
    "underline": "Underline",
    "superscript": "Superscript",
    "subscript": "Subscript",
    "bold-abbr": "B",
    "italic-abbr": "I",
    "deleted-abbr": "S",
    "underline-abbr": "U",
    "superscript-abbr": "Sup",
    "subscript-abbr": "Sub",
    "lists": "Lists",
    "link-insert": "Insert Link",
    "link-edit": "Edit Link",
    "link-in-new-tab": "Open link in new tab",
    "unlink": "Unlink",
    "cancel": "Cancel",
    "close": "Close",
    "insert": "Insert",
    "save": "Save",
    "delete": "Delete",
    "text": "Text",
    "edit": "Edit",
    "title": "Title",
    "paragraph": "Normal text",
    "quote": "Quote",
    "code": "Code",
    "heading1": "Heading 1",
    "heading2": "Heading 2",
    "heading3": "Heading 3",
    "heading4": "Heading 4",
    "heading5": "Heading 5",
    "heading6": "Heading 6",
    "filename": "Name",
    "optional": "optional",
    "unorderedlist": "Unordered List",
    "orderedlist": "Ordered List",
    "outdent": "Outdent",
    "indent": "Indent",
    "horizontalrule": "Line",
    "upload": "Upload",
    "upload-label": "Drop files here or click to upload",
    "accessibility-help-label": "Rich text editor",
    "caption": "Caption",
    "bulletslist": "Bullets",
    "numberslist": "Numbers",
    "image-position": "Position",
    "none": "None",
    "left": "Left",
    "right": "Right",
    "center": "Center",
    "undo": "Undo",
    "redo": "Redo"
};
$R.buttons = {
    html: {
        title: 'HTML',
        icon: true,
        api: 'module.source.toggle'
    },
    undo: {
        title: '## undo ##',
        icon: true,
        api: 'module.buffer.undo'
    },
    redo: {
        title: '## redo ##',
        icon: true,
        api: 'module.buffer.redo'
    },
    format: {
        title: '## format ##',
        icon: true,
        dropdown: {
            p: {
                title: '## paragraph ##',
                api: 'module.block.format',
                args: {
                    tag: 'p'
                }
            },
            blockquote: {
                title: '## quote ##',
                api: 'module.block.format',
                args: {
                    tag: 'blockquote'
                }
            },
            pre: {
                title: '## code ##',
                api: 'module.block.format',
                args: {
                    tag: 'pre'
                }
            },
            h1: {
                title: '## heading1 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h1'
                }
            },
            h2: {
                title: '## heading2 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h2'
                }
            },
            h3: {
                title: '## heading3 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h3'
                }
            },
            h4: {
                title: '## heading4 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h4'
                }
            },
            h5: {
                title: '## heading5 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h5'
                }
            },
            h6: {
                title: '## heading6 ##',
                api: 'module.block.format',
                args: {
                    tag: 'h6'
                }
            }
        }
    },
    bold: {
        title: '## bold-abbr ##',
        icon: true,
        tooltip: '## bold ##',
        api: 'module.inline.format',
        args: {
            tag: 'b'
        }
    },
    italic: {
        title: '## italic-abbr ##',
        icon: true,
        tooltip: '## italic ##',
        api: 'module.inline.format',
        args: {
            tag: 'i'
        }
    },
    deleted: {
        title: '## deleted-abbr ##',
        icon: true,
        tooltip: '## deleted ##',
        api: 'module.inline.format',
        args: {
            tag: 'del'
        }
    },
    underline: {
        title: '## underline-abbr ##',
        icon: true,
        tooltip: '## underline ##',
        api: 'module.inline.format',
        args: {
            tag: 'u'
        }
    },
    sup: {
        title: '## superscript-abbr ##',
        icon: true,
        tooltip: '## superscript ##',
        api: 'module.inline.format',
        args: {
            tag: 'sup'
        }
    },
    sub: {
        title: '## subscript-abbr ##',
        icon: true,
        tooltip: '## subscript ##',
        api: 'module.inline.format',
        args: {
            tag: 'sub'
        }
    },
    lists: {
        title: '## lists ##',
        icon: true,
        observe: 'list',
        dropdown: {
            observe: 'list',
            unorderedlist: {
                title: '&bull; ## unorderedlist ##',
                api: 'module.list.toggle',
                args: 'ul'
            },
            orderedlist: {
                title: '1. ## orderedlist ##',
                api: 'module.list.toggle',
                args: 'ol'
            },
            outdent: {
                title: '< ## outdent ##',
                api: 'module.list.outdent'
            },
            indent: {
                title: '> ## indent ##',
                api: 'module.list.indent'
            }
        }
    },
    ul: {
        title: '&bull; ## bulletslist ##',
        icon: true,
        api: 'module.list.toggle',
        observe: 'list',
        args: 'ul'
    },
    ol: {
        title: '1. ## numberslist ##',
        icon: true,
        api: 'module.list.toggle',
        observe: 'list',
        args: 'ol'
    },
    outdent: {
        title: '## outdent ##',
        icon: true,
        api: 'module.list.outdent',
        observe: 'list'
    },
    indent: {
        title: '## indent ##',
        icon: true,
        api: 'module.list.indent',
        observe: 'list'
    },
    image: {
        title: '## image ##',
        icon: true,
        api: 'module.image.open'
    },
    file: {
        title: '## file ##',
        icon: true,
        api: 'module.file.open'
    },
    link: {
        title: '## link ##',
        icon: true,
        observe: 'link',
        dropdown: {
            observe: 'link',
            link: {
                title: '## link-insert ##',
                api: 'module.link.open'
            },
            unlink: {
                title: '## unlink ##',
                api: 'module.link.unlink'
            }
        }
    },
    line: {
        title: '## horizontalrule ##',
        icon: true,
        api: 'module.line.insert'
    }
};
var App = function(element, options, uuid)
{
    this.module = {};
    this.plugin = {};
    this.instances = {};

    // start/stop
    this.started = false;
    this.stopped = false;

    // environment
    this.uuid = uuid;
    this.rootElement = element;
    this.rootOpts = options;
    this.dragInside = false;
    this.dragComponentInside = false;
    this.keycodes = $R.keycodes;
    this.namespace = 'redactor';
    this.$win = $R.dom(window);
    this.$doc = $R.dom(document);
    this.$body = $R.dom('body');
    this.editorReadOnly = false;

    // core services
    this.opts = $R.create('service.options', options, element);
    this.lang = $R.create('service.lang', this);

    // build
    this.buildServices();
    this.buildModules();
    this.buildPlugins();

    // start
    this.start();
};

App.prototype = {
    start: function()
    {
        // start
        this.stopped = false;
        this.broadcast('start');
        this.broadcast('startcode');

        if (this.opts.clickToEdit)
        {
            this.broadcast('startclicktoedit');
        }
        else
        {
            this.broadcast('enable');
            if (this.opts.showSource) this.broadcast('startcodeshow');
            this.broadcast('enablefocus');
        }

        // started
        this.broadcast('started');
        this.started = true;
    },
    stop: function()
    {
        this.started = false;
        this.stopped = true;

        this.broadcast('stop');
        this.broadcast('disable');
        this.broadcast('stopped');
    },

    // started & stopped
    isStarted: function()
    {
        return this.started;
    },
    isStopped: function()
    {
        return this.stopped;
    },

    // build
    buildServices: function()
    {
        var core = ['options', 'lang'];
        var bindable = ['uuid', 'keycodes', 'opts', 'lang', '$win', '$doc', '$body'];
        var services = [];
        for (var name in $R.services)
        {
            if (core.indexOf(name) === -1)
            {
                this[name] = $R.create('service.' + name, this);
                services.push(name);
                bindable.push(name);
            }
        }

        // binding
        for (var i = 0; i < services.length; i++)
        {
            var service = services[i];
            for (var z = 0; z < bindable.length; z++)
            {
                var inj = bindable[z];
                if (service !== inj)
                {
                    this[service][inj] = this[inj];
                }
            }
        }
    },
    buildModules: function()
    {
        for (var name in $R.modules)
        {
            this.module[name] = $R.create('module.' + name, this);
            this.instances[name] = this.module[name];
        }
    },
    buildPlugins: function()
    {
        var plugins = this.opts.plugins;
        for (var i = 0; i < plugins.length; i++)
        {
            var name = plugins[i];
            if (typeof $R.plugins[name] !== 'undefined')
            {
                this.plugin[name] = $R.create('plugin.' + name, this);
                this.instances[name] = this.plugin[name];
            }
        }
    },

    // draginside
    isDragInside: function()
    {
        return this.dragInside;
    },
    setDragInside: function(dragInside)
    {
        this.dragInside = dragInside;
    },
    isDragComponentInside: function()
    {
        return this.dragComponentInside;
    },
    setDragComponentInside: function(dragInside)
    {
        this.dragComponentInside = dragInside;
    },
    getDragComponentInside: function()
    {
        return this.dragComponentInside;
    },

    // readonly
    isReadOnly: function()
    {
        return this.editorReadOnly;
    },
    enableReadOnly: function()
    {
        this.editorReadOnly = true;
        this.broadcast('enablereadonly');
        this.component.clearActive();
        this.toolbar.disableButtons();
    },
    disableReadOnly: function()
    {
        this.editorReadOnly = false;
        this.broadcast('disablereadonly');
        this.toolbar.enableButtons();
    },

    // messaging
    callMessageHandler: function(instance, name, args)
    {
        var arr = name.split('.');
        if (arr.length === 1)
        {
            if (typeof instance['on' + name] === 'function')
            {
                instance['on' + name].apply(instance, args);
            }
        }
        else
        {
            arr[0] = 'on' + arr[0];

            var func = this.utils.checkProperty(instance, arr);
            if (typeof func === 'function')
            {
                func.apply(instance, args);
            }
        }
    },
    broadcast: function(name)
    {
        var args = [].slice.call(arguments, 1);
        for (var moduleName in this.instances)
        {
            this.callMessageHandler(this.instances[moduleName], name, args);
        }

        // callback
        return this.callback.trigger(name, args);
    },

    // callback
    on: function(name, func)
    {
        this.callback.add(name, func);
    },
    off: function(name, func)
    {
        this.callback.remove(name, func);
    },

    // api
    api: function(name)
    {
        if (!this.isStarted() && name !== 'start') return;
        if (this.isReadOnly() && name !== 'disableReadOnly') return;

        this.broadcast('state');

        var args = [].slice.call(arguments, 1);
        var arr = name.split('.');

        var isApp = (arr.length === 1);
        var isCallback = (arr[0] === 'on' || arr[0] === 'off');
        var isService = (!isCallback && arr.length === 2);
        var isPlugin = (arr[0] === 'plugin');
        var isModule = (arr[0] === 'module');

        // app
        if (isApp)
        {
            if (typeof this[arr[0]] === 'function')
            {
                return this.callInstanceMethod(this, arr[0], args);
            }
        }
        // callback
        else if (isCallback)
        {
            return (arr[0] === 'on') ? this.on(arr[1], args[0]) : this.off(arr[1], args[0] || undefined);
        }
        // service
        else if (isService)
        {
            if (this.isInstanceExists(this, arr[0]))
            {
                return this.callInstanceMethod(this[arr[0]], arr[1], args);
            }
            else
            {
                $R.error(new Error('Service "' + arr[0] + '" not found'));
            }
        }
        // plugin
        else if (isPlugin)
        {
            if (this.isInstanceExists(this.plugin, arr[1]))
            {
                return this.callInstanceMethod(this.plugin[arr[1]], arr[2], args);
            }
            else
            {
                $R.error(new Error('Plugin "' + arr[1] + '" not found'));
            }
        }
        // module
        else if (isModule)
        {
            if (this.isInstanceExists(this.module, arr[1]))
            {
                return this.callInstanceMethod(this.module[arr[1]], arr[2], args);
            }
            else
            {
                $R.error(new Error('Module "' + arr[1] + '" not found'));
            }
        }

    },
    isInstanceExists: function(obj, name)
    {
        return (typeof obj[name] !== 'undefined');
    },
    callInstanceMethod: function(instance, method, args)
    {
        if (typeof instance[method] === 'function')
        {
            return instance[method].apply(instance, args);
        }
    }
};
$R.add('mixin', 'formatter', {

    // public
    buildArgs: function(args)
    {
        this.args = {
            'class': args['class'] || false,
            'style': args['style'] || false,
            'attr': args['attr'] || false
        };

        if (!this.args['class'] && !this.args['style'] && !this.args['attr'])
        {
            this.args = false;
        }
    },
    applyArgs: function(nodes, selection)
    {
        if (this.args)
        {
            nodes = this[this.type](this.args, false, nodes, selection);
        }
        else
        {
            nodes = this._clearAll(nodes, selection);
        }

        return nodes;
    },
    clearClass: function(tags, nodes)
    {
        this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags, true);
        $elements.removeAttr('class');

        nodes = this._unwrapSpanWithoutAttr($elements.getAll());

        this.selection.restore();

        return nodes;
    },
    clearStyle: function(tags, nodes)
    {
        this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags, true);
        $elements.removeAttr('style');

        nodes = this._unwrapSpanWithoutAttr($elements.getAll());

        this.selection.restore();

        return nodes;
    },
    clearAttr: function(tags, nodes)
    {
        this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags, true);
        this._removeAllAttr($elements);

        nodes = this._unwrapSpanWithoutAttr($elements.getAll());

        this.selection.restore();

        return nodes;
    },
    set: function(args, tags, nodes, selection)
    {
        if (selection !== false) this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags);

        if (args['class'])
        {
            $elements.removeAttr('class');
            $elements.addClass(args['class']);
        }

        if (args['style'])
        {
            $elements.removeAttr('style');
            $elements.css(args['style']);
            $elements.each(function(node)
            {
                var $node = $R.dom(node);
                $node.attr('data-redactor-style-cache', $node.attr('style'));
            });
        }

        if (args['attr'])
        {
            this._removeAllAttr($elements);
            $elements.attr(args['attr']);
        }

        if (selection !== false) this.selection.restore();

        return $elements.getAll();
    },
    toggle: function(args, tags, nodes, selection)
    {
        if (selection !== false) this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags);

        if (args['class'])
        {
            $elements.toggleClass(args['class']);
            $elements.each(function(node)
            {
                if (node.className === '') node.removeAttribute('class');
            });
        }

        var params;
        if (args['style'])
        {
            params = args['style'];
            $elements.each(function(node)
            {
                var $node = $R.dom(node);
                for (var key in params)
                {
                    var newVal = params[key];
                    var oldVal = $node.css(key);

                    oldVal = (this.utils.isRgb(oldVal)) ? this.utils.rgb2hex(oldVal) : oldVal.replace(/"/g, '');
                    newVal = (this.utils.isRgb(newVal)) ? this.utils.rgb2hex(newVal) : newVal.replace(/"/g, '');

                    oldVal = this.utils.hex2long(oldVal);
                    newVal = this.utils.hex2long(newVal);

                    var compareNew = (typeof newVal === 'string') ? newVal.toLowerCase() : newVal;
                    var compareOld = (typeof oldVal === 'string') ? oldVal.toLowerCase() : oldVal;

                    if (compareNew === compareOld) $node.css(key, '');
                    else $node.css(key, newVal);
                }

                this._convertStyleQuotes($node);
                if (this.utils.removeEmptyAttr(node, 'style'))
                {
                    $node.removeAttr('data-redactor-style-cache');
                }
                else
                {
                    $node.attr('data-redactor-style-cache', $node.attr('style'));
                }

            }.bind(this));
        }

        if (args['attr'])
        {
            params = args['attr'];
            $elements.each(function(node)
            {
                var $node = $R.dom(node);
                for (var key in params)
                {
                    if ($node.attr(key)) $node.removeAttr(key);
                    else $node.attr(key, params[key]);
                }
            });

        }

        if (selection !== false) this.selection.restore();

        return $elements.getAll();
    },
    add: function(args, tags, nodes, selection)
    {
        if (selection !== false) this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags);

        if (args['class'])
        {
            $elements.addClass(args['class']);
        }

        if (args['style'])
        {
            var params = args['style'];
            $elements.each(function(node)
            {
                var $node = $R.dom(node);
                $node.css(params);
                $node.attr('data-redactor-style-cache', $node.attr('style'));

                this._convertStyleQuotes($node);

            }.bind(this));
        }

        if (args['attr'])
        {
            $elements.attr(args['attr']);
        }

        if (selection !== false) this.selection.restore();

        return $elements.getAll();
    },
    remove: function(args, tags, nodes, selection)
    {
        if (selection !== false) this.selection.save();

        var $elements = (nodes) ? $R.dom(nodes) : this.getElements(tags);

        if (args['class'])
        {
            $elements.removeClass(args['class']);
            $elements.each(function(node)
            {
                if (node.className === '') node.removeAttribute('class');
            });
        }

        if (args['style'])
        {
            var name = args['style'];
            $elements.each(function(node)
            {
                var $node = $R.dom(node);
                $node.css(name, '');

                if (this.utils.removeEmptyAttr(node, 'style'))
                {
                    $node.removeAttr('data-redactor-style-cache');
                }
                else
                {
                    $node.attr('data-redactor-style-cache', $node.attr('style'));
                }

            }.bind(this));
        }

        if (args['attr'])
        {
            $elements.removeAttr(args['attr']);
        }

        nodes = this._unwrapSpanWithoutAttr($elements.getAll());

        if (selection !== false) this.selection.restore();

        return nodes;
    },

    // private
    _removeAllAttr: function($elements)
    {
        $elements.each(function(node)
        {
            for (var i = node.attributes.length; i-->0;)
            {
                var nodeAttr = node.attributes[i];
                var name = nodeAttr.name;
                if (name !== 'style' && name !== 'class')
                {
                    node.removeAttributeNode(nodeAttr);
                }
            }
        });
    },
    _convertStyleQuotes: function($node)
    {
        var style = $node.attr('style');
        if (style) $node.attr('style', style.replace(/"/g, '\''));
    },
    _clearAll: function(nodes, selection)
    {
        if (selection !== false) this.selection.save();

        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            while (node.attributes.length > 0)
            {
                node.removeAttribute(node.attributes[0].name);
            }
        }

        nodes = this._unwrapSpanWithoutAttr(nodes);

        if (selection !== false) this.selection.restore();

        return nodes;
    },
    _unwrapSpanWithoutAttr: function(nodes)
    {
        var finalNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            var len = node.attributes.length;
            if (len <= 0 && node.nodeType !== 3 && node.tagName === 'SPAN')
            {
                $R.dom(node).unwrap();
            }
            else
            {
                finalNodes.push(node);
            }
        }

        return finalNodes;
    }
});
$R.add('mixin', 'dom', $R.Dom.prototype);
$R.add('mixin', 'component', {
    get cmnt()
    {
        return true;
    }
});
$R.add('service', 'options', {
    init: function(options, element)
    {
        var $el = $R.dom(element);
        var opts = $R.extend({}, $R.opts, (element) ? $el.data() : {}, $R.options);
        opts = $R.extend(true, opts, options);

        return opts;
    }
});
$R.add('service', 'lang', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;

        // build
        this.vars = this._build(this.opts.lang);
    },

    // public
    rebuild: function(lang)
    {
        this.opts.lang = lang;
        this.vars = this._build(lang);
    },
    extend: function(obj)
    {
        this.vars = $R.extend(this.vars, obj);
    },
    parse: function(str)
    {
        if (str === undefined)
        {
            return '';
        }

        var matches = str.match(/## (.*?) ##/g);
        if (matches)
        {
            for (var i = 0; i < matches.length; i++)
            {
                var key = matches[i].replace(/^##\s/g, '').replace(/\s##$/g, '');
                str = str.replace(matches[i], this.get(key));
            }
        }

        return str;
    },
    get: function(name)
    {
        var str = '';
        if (typeof this.vars[name] !== 'undefined')
        {
            str = this.vars[name];
        }
        else if (this.opts.lang !== 'en' && typeof $R.lang['en'][name] !== 'undefined')
        {
            str = $R.lang['en'][name];
        }

        return str;
    },

    // private
    _build: function(lang)
    {
        var vars = $R.lang['en'];
        if (lang !== 'en')
        {
            vars = ($R.lang[lang] !== undefined) ? $R.lang[lang] : vars;
        }

        return vars;
    }
});
$R.add('service', 'callback', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;

        // local
        this.callbacks = {};

        // build
        if (this.opts.callbacks)
        {
            this._set(this.opts.callbacks, '');
        }
    },
    stop: function()
    {
        this.callbacks = {};
    },
    add: function(name, handler)
    {
        if (!this.callbacks[name]) this.callbacks[name] = [];
        this.callbacks[name].push(handler);
    },
    remove: function(name, handler)
    {
        if (handler === undefined)
        {
            delete this.callbacks[name];
        }
        else
        {
            for (var i = 0; i < this.callbacks[name].length; i++)
            {
                this.callbacks[name].splice(i, 1);
            }

            if (Object.keys(this.callbacks[name]).length === 0) delete this.callbacks[name];
        }
    },
    trigger: function(name, args)
    {
        var value = this._loop(name, args, this.callbacks);
        return (typeof value === 'undefined' && args && args[0] !== false) ? args[0] : value;
    },

    // private
    _set: function(obj, name)
    {
        for (var key in obj)
        {
            var path = (name === '') ? key : name + '.' + key;
            if (typeof obj[key] === 'object')
            {
                this._set(obj[key], path);
            }
            else
            {
                this.callbacks[path] = [];
                this.callbacks[path].push(obj[key]);
            }
        }
    },
    _loop: function(name, args, obj)
    {
        var value;
        for (var key in obj)
        {
            if (name === key)
            {
                for (var i = 0; i < obj[key].length; i++)
                {
                    value = obj[key][i].apply(this.app, args);
                }
            }
        }

        return value;
    }
});
$R.add('service', 'animate', {
    init: function(app)
    {
        this.animationOpt = app.opts.animation;
    },
    start: function(element, animation, options, callback)
    {
        var defaults = {
            duration: false,
            iterate: false,
            delay: false,
            timing: false,
            prefix: 'redactor-'
        };

        defaults = (typeof options === 'function') ? defaults : $R.extend(defaults, options);
        callback = (typeof options === 'function') ? options : callback;

        // play
        return new $R.AnimatePlay(element, animation, defaults, callback, this.animationOpt);
    },
    stop: function(element)
    {
        this.$el = $R.dom(element);
        this.$el.removeClass('redactor-animated');

        var effect = this.$el.attr('redactor-animate-effect');
        this.$el.removeClass(effect);

        this.$el.removeAttr('redactor-animate-effect');
        var hide = this.$el.attr('redactor-animate-hide');
        if (hide)
        {
            this.$el.addClass(hide).removeAttr('redactor-animate-hide');
        }

        this.$el.off('animationend webkitAnimationEnd');
    }
});

$R.AnimatePlay = function(element, animation, defaults, callback, animationOpt)
{
    this.hidableEffects = ['fadeOut', 'flipOut', 'slideUp', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];
    this.prefixes = ['', '-webkit-'];

    this.$el = $R.dom(element);
    this.$body = $R.dom('body');
    this.callback = callback;
    this.animation = (!animationOpt) ? this.buildAnimationOff(animation) : animation;
    this.defaults = defaults;

    if (this.animation === 'slideUp')
    {
        this.$el.height(this.$el.height());
    }

    // animate
    return (this.isInanimate()) ? this.inanimate() : this.animate();
};

$R.AnimatePlay.prototype = {
    buildAnimationOff: function(animation)
    {
        return (this.isHidable(animation)) ? 'hide' : 'show';
    },
    buildHideClass: function()
    {
        return 'redactor-animate-hide';
    },
    isInanimate: function()
    {
        return (this.animation === 'show' || this.animation === 'hide');
    },
    isAnimated: function()
    {
        return this.$el.hasClass('redactor-animated');
    },
    isHidable: function(effect)
    {
        return (this.hidableEffects.indexOf(effect) !== -1);
    },
    inanimate: function()
    {
        this.defaults.timing = 'linear';

        var hide;
        if (this.animation === 'show')
        {
            hide = this.buildHideClass();
            this.$el.attr('redactor-animate-hide', hide);
            this.$el.removeClass(hide);
        }
        else
        {
            hide = this.$el.attr('redactor-animate-hide');
            this.$el.addClass(hide).removeAttr('redactor-animate-hide');
        }

        if (typeof this.callback === 'function') this.callback(this);

        return this;
    },
    animate: function()
    {
        var delay = (this.defaults.delay) ? this.defaults.delay : 0;
        setTimeout(function()
        {
            this.$body.addClass('no-scroll-x');
            this.$el.addClass('redactor-animated');
            if (!this.$el.attr('redactor-animate-hide'))
            {
                var hide = this.buildHideClass();
                this.$el.attr('redactor-animate-hide', hide);
                this.$el.removeClass(hide);
            }

            this.$el.addClass(this.defaults.prefix + this.animation);
            this.$el.attr('redactor-animate-effect', this.defaults.prefix + this.animation);

            this.set(this.defaults.duration + 's', this.defaults.iterate, this.defaults.timing);
            this.complete();

        }.bind(this), delay * 1000);

        return this;
    },
    set: function(duration, iterate, timing)
    {
        var len = this.prefixes.length;

        while (len--)
        {
            if (duration !== false || duration === '') this.$el.css(this.prefixes[len] + 'animation-duration', duration);
            if (iterate !== false || iterate === '') this.$el.css(this.prefixes[len] + 'animation-iteration-count', iterate);
            if (timing !== false || timing === '') this.$el.css(this.prefixes[len] + 'animation-timing-function', timing);
        }
    },
    clean: function()
    {
        this.$body.removeClass('no-scroll-x');
        this.$el.removeClass('redactor-animated');
        this.$el.removeClass(this.defaults.prefix + this.animation);
        this.$el.removeAttr('redactor-animate-effect');

        this.set('', '', '');
    },
    complete: function()
    {
        this.$el.one('animationend webkitAnimationEnd', function()
        {
            if (this.$el.hasClass(this.defaults.prefix + this.animation)) this.clean();
            if (this.isHidable(this.animation))
            {
                var hide = this.$el.attr('redactor-animate-hide');
                this.$el.addClass(hide).removeAttr('redactor-animate-hide');
            }

            if (this.animation === 'slideUp') this.$el.height('');
            if (typeof this.callback === 'function') this.callback(this.$el);

        }.bind(this));
    }
};
$R.add('service', 'caret', {
    init: function(app)
    {
        this.app = app;
    },

    // set
    setStart: function(el)
    {
        this._setCaret('Start', el);
    },
    setEnd: function(el)
    {
        this._setCaret('End', el);
    },
    setBefore: function(el)
    {
        this._setCaret('Before', el);
    },
    setAfter: function(el)
    {
        this._setCaret('After', el);
    },

    // is
    isStart: function(el)
    {
        return this._isStartOrEnd(el, 'First');
    },
    isEnd: function(el)
    {
        return this._isStartOrEnd(el, 'Last');
    },

    // set side
    setAtEnd: function(node)
    {
        var data = this.inspector.parse(node);
        var tag = data.getTag();
        var range = document.createRange();
        if (this._isInPage(node))
        {
            if (tag === 'a')
            {
                var textNode = this.utils.createInvisibleChar();
                node.appendChild(textNode);

                range.setStartBefore(textNode);
                range.collapse(true);
            }
            else
            {
                range.selectNodeContents(node);
                range.collapse(false);
            }

            this.selection.setRange(range);
        }
    },
    setAtStart: function(node)
    {
		var range = document.createRange();
		var data = this.inspector.parse(node);
        if (this._isInPage(node))
        {
            range.setStart(node, 0);
            range.collapse(true);

            if (data.isInline() || this.utils.isEmpty(node))
            {
                var textNode = this.utils.createInvisibleChar();
                range.insertNode(textNode);
                range.selectNodeContents(textNode);
                range.collapse(false);
            }

            this.selection.setRange(range);
        }
    },
    setAtBefore: function(node)
    {
        var data = this.inspector.parse(node);
        var range = document.createRange();
        if (this._isInPage(node))
        {
            range.setStartBefore(node);
            range.collapse(true);

            if (data.isInline())
            {
                var textNode = this.utils.createInvisibleChar();
                node.parentNode.insertBefore(textNode, node);
                range.selectNodeContents(textNode);
                range.collapse(false);
            }

            this.selection.setRange(range);
        }
    },
    setAtAfter: function(node)
    {

        var range = document.createRange();
        if (this._isInPage(node))
        {
            range.setStartAfter(node);
            range.collapse(true);

            var textNode = this.utils.createInvisibleChar();
            range.insertNode(textNode);
            range.selectNodeContents(textNode);
            range.collapse(false);

            this.selection.setRange(range);
        }
    },
    setAtPrev: function(node)
    {
        var prev = node.previousSibling;
        if (prev)
        {
            prev = (prev.nodeType === 3 && this._isEmptyTextNode(prev)) ? prev.previousElementSibling : prev;
            if (prev) this.setEnd(prev);
        }
    },
    setAtNext: function(node)
    {
        var next = node.nextSibling;
        if (next)
        {
            next = (next.nodeType === 3 && this._isEmptyTextNode(next)) ? next.nextElementSibling : next;
            if (next) this.setStart(next);
        }
    },

    // private
    _setCaret: function(type, el)
    {
        var data = this.inspector.parse(el);
        var node = data.getNode();

        if (node)
        {
            this.component.clearActive();
            this['_set' + type](node, data, data.getTag());
        }
    },
    _setStart: function(node, data, tag)
    {
        // 1. text
        if (data.isText())
        {
            this.editor.focus();
            return this.setAtStart(node);
        }
        // 2. ul, ol
        else if (tag === 'ul' || tag === 'ol')
        {
            node = data.findFirstNode('li');

            var item = this.utils.getFirstElement(node);
            var dataItem = this.inspector.parse(item);
            if (item && dataItem.isComponent())
            {
                return this.setStart(dataItem.getComponent());
            }
        }
        // 3. dl
        else if (tag === 'dl')
        {
            node = data.findFirstNode('dt');
        }
        // 4. br / hr
        else if (tag === 'br' || tag === 'hr')
        {
            return this.setBefore(node);
        }
        // 5. th, td
        else if (tag === 'td' || tag === 'th')
        {
            var el = data.getFirstElement(node);
            if (el)
            {
                return this.setStart(el);
            }
        }
        // 6. table
        else if (tag === 'table' || tag === 'tr')
        {
            return this.setStart(data.findFirstNode('th, td'));
        }
        // 7. figure code
        else if (data.isComponentType('code') && !data.isFigcaption())
        {
            var code = data.findLastNode('pre, code');

            this.editor.focus();
            return this.setAtStart(code);
        }
        // 8. table component
        else if (tag === 'figure' && data.isComponentType('table'))
        {
            var table = data.getTable();
            var tableData = this.inspector.parse(table);

            return this.setStart(tableData.findFirstNode('th, td'));
        }
        // 9. non editable components
        else if (!data.isComponentType('table') && data.isComponent() && !data.isFigcaption())
        {
            return this.component.setActive(node);
        }

        this.editor.focus();

        // set
        if (!this._setInline(node, 'Start'))
        {
            this.setAtStart(node);
        }
    },
    _setEnd: function(node, data, tag)
    {
        // 1. text
        if (data.isText())
        {
            this.editor.focus();
            return this.setAtEnd(node);
        }
        // 2. ul, ol
        else if (tag === 'ul' || tag === 'ol')
        {
            node = data.findLastNode('li');

            var item = this.utils.getLastElement(node);
            var dataItem = this.inspector.parse(item);
            if (item && dataItem.isComponent())
            {
                return this.setEnd(dataItem.getComponent());
            }
        }
        // 3. dl
        else if (tag === 'dl')
        {
            node = data.findLastNode('dd');
        }
        // 4. br / hr
        else if (tag === 'br' || tag === 'hr')
        {
            return this.setAfter(node);
        }
        // 5. th, td
        else if (tag === 'td' || tag === 'th')
        {
            var el = data.getLastElement();
            if (el)
            {
                return this.setEnd(el);
            }
        }
        // 6. table
        else if (tag === 'table' || tag === 'tr')
        {
            return this.setEnd(data.findLastNode('th, td'));
        }
        // 7. figure code
        else if (data.isComponentType('code') && !data.isFigcaption())
        {
            var code = data.findLastNode('pre, code');

            this.editor.focus();
            return this.setAtEnd(code);
        }
        // 8. table component
        else if (tag === 'figure' && data.isComponentType('table'))
        {
            var table = data.getTable();
            var tableData = this.inspector.parse(table);

            return this.setEnd(tableData.findLastNode('th, td'));
        }
        // 9. non editable components
        else if (!data.isComponentType('table') && data.isComponent() && !data.isFigcaption())
        {
            return this.component.setActive(node);
        }

        this.editor.focus();

        // set
        if (!this._setInline(node, 'End'))
        {
            // is element empty
            if (this.utils.isEmpty(node))
            {
                return this.setStart(node);
            }

            this.setAtEnd(node);
        }
    },
    _setBefore: function(node, data, tag)
    {
        // text
        if (node.nodeType === 3)
        {
            return this.setAtBefore(node);
        }
        // inline
        else if (data.isInline())
        {
            return this.setAtBefore(node);
        }
        // td / th
        else if (data.isFirstTableCell())
        {
            return this.setAtPrev(data.getComponent());
        }
        else if (tag === 'td' || tag === 'th')
        {
            return this.setAtPrev(node);
        }
        // li
        else if (data.isFirstListItem())
        {
            return this.setAtPrev(data.getList());
        }
        // figcaption
        else if (data.isFigcaption())
        {
            return this.setStart(data.getComponent());
        }
        // component
        else if (!data.isComponentType('table') && data.isComponent())
        {
            return this.setAtPrev(data.getComponent());
        }
        // block
        else if (data.isBlock())
        {
            return this.setAtPrev(node);
        }

        this.editor.focus();
        this.setAtBefore(node);

    },
    _setAfter: function(node, data, tag)
    {
        // text
        if (node.nodeType === 3)
        {
            return this.setAtAfter(node);
        }
        // inline
        else if (data.isInline())
        {
            return this.setAtAfter(node);
        }
        // td / th
        else if (data.isLastTableCell())
        {
            return this.setAtNext(data.getComponent());
        }
        else if (tag === 'td' || tag === 'th')
        {
            return this.setAtNext(node);
        }
        // li
        else if (data.isFirstListItem())
        {
            return this.setAtNext(data.getList());
        }
        // component
        else if (!data.isComponentType('table') && data.isComponent())
        {
            return this.setAtNext(data.getComponent());
        }
        // block
        else if (data.isBlock())
        {
            return this.setAtNext(node);
        }

        this.editor.focus();
        this.setAtAfter(node);
    },
    _setInline: function(node, type)
    {
        // is first element inline (FF only)
        var inline = this._hasInlineChild(node, (type === 'Start') ? 'first' : 'last');
        if (inline)
        {
            if (type === 'Start')
            {
                this.setStart(inline);
            }
            else
            {
                this.setEnd(inline);
            }

            return true;
        }
    },
    _isStartOrEnd: function(el, type)
    {
        var node = this.utils.getNode(el);
        if (!node) return false;

        var data = this.inspector.parse(node);
        node = this._getStartEndNode(node, data, type);

        if (node && (node.nodeType !== 3 && node.tagName !== 'LI'))
        {
            var html = (node.nodeType === 3) ? node.textContent : node.innerHTML;
            html = this.utils.trimSpaces(html);
            if (html === '') return true;
        }

        if (!data.isFigcaption() && data.isComponent() && !data.isComponentEditable())
        {
            return true;
        }

        var offset = this.offset.get(node, true);
        if (offset)
        {
            return (type === 'First') ? (offset.start === 0) : (offset.end === this.offset.size(node, true));
        }
        else
        {
            return false;
        }
    },
    _isInPage: function(node)
    {
        if (node && node.nodeType)
        {
            return (node === document.body) ? false : document.body.contains(node);
        }
        else
        {
            return false;
        }
    },
    _hasInlineChild: function(el, pos)
    {
        var data = this.inspector.parse(el);
        var node = (pos === 'first') ? data.getFirstNode() : data.getLastNode();
        var $node = $R.dom(node);

        if (node && node.nodeType !== 3
            && this.inspector.isInlineTag(node.tagName)
            && !$node.hasClass('redactor-component')
             && !$node.hasClass('non-editable'))
        {
            return node;
        }
    },
    _isEmptyTextNode: function(node)
    {
        var text = node.textContent.trim().replace(/\n/, '');
        text = this.utils.removeInvisibleChars(text);

        return (text === '');
    },
    _getStartEndNode: function(node, data, type)
    {
        if (data.isFigcaption())
        {
            node = data.getFigcaption();
        }
        else if (data.isTable())
        {
            node = data['find' + type + 'Node']('th, td');
        }
        else if (data.isList())
        {
            node = data['find' + type + 'Node']('li');
        }
        else if (data.isComponentType('code'))
        {
            node = data.findLastNode('pre, code');
        }

        return node;
    }
});
$R.add('service', 'selection', {
    init: function(app)
    {
        this.app = app;
    },
    // is
    is: function()
    {
        var sel = this.get();
        if (sel)
        {
            var node = sel.anchorNode;
            var data = this.inspector.parse(node);

            return (data.isInEditor() || data.isEditor());
        }

        return false;
    },
    isCollapsed: function()
    {
        var sel = this.get();
        var range = this.getRange();

        if (sel && sel.isCollapsed) return true;
        else if (range && range.toString().length === 0) return true;

        return false;
    },
    isBackwards: function()
    {
        var backwards = false;
        var sel = this.get();

        if (sel && !sel.isCollapsed)
        {
            var range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            backwards = range.collapsed;
            range.detach();
        }

        return backwards;
    },
    isIn: function(el)
    {
        var node = $R.dom(el).get();
        var current = this.getCurrent();

        return (current && node) ? node.contains(current) : false;
    },
    isText: function()
    {
        var sel = this.get();
        if (sel)
        {
            var el = sel.anchorNode;
            var block = this.getBlock(el);
            var blocks = this.getBlocks();

            // td, th or hasn't block
            if ((block && this.inspector.isTableCellTag(block.tagName)) || (block === false && blocks.length === 0))
            {
                return true;
            }
        }

        return false;
    },
    isAll: function(el)
    {
        var node = this.utils.getNode(el);
        if (!node) return false;

        var isEditor = this.editor.isEditor(node);
        var data = this.inspector.parse(node);

        // component
        if (!data.isFigcaption() && this.component.isNonEditable(node) && this.component.isActive(node))
        {
            return true;
        }

        if (isEditor)
        {
            var $editor = this.editor.getElement();
            var output = $editor.html().replace(/<p><\/p>$/i, '');
            var htmlLen = this.getHtml(false).length;
            var outputLen = output.length;

            if (htmlLen !== outputLen)
            {
                return false;
            }
        }

        // editor empty or collapsed
        if ((isEditor && this.editor.isEmpty()) || this.isCollapsed())
        {
            return false;
        }

        // all
        var offset = this.offset.get(node, true);
        var size = this.offset.size(node, true);

        // pre, table, or pre/code in figure
        if (!isEditor && data.isComponentType('code'))
        {
            size = this.getText().trim().length;
        }

        if (offset && offset.start === 0 && offset.end === size)
        {
            return true;
        }

        return false;
    },

    // has
    hasNonEditable: function()
    {
        var selected = this.getHtml();
        var $wrapper = $R.dom('<div>').html(selected);

        return (!this.isCollapsed() && $wrapper.find('.non-editable').length !== 0);
    },

    // set
    setRange: function(range)
    {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    },
    setAll: function(el)
    {
        var node = this.utils.getNode(el);
        if (!node) return;

        var data = this.inspector.parse(node);

        this.component.clearActive();

        this.editor.focus();
        this.editor.saveScroll();
        this.editor.disableNonEditables();

        if (node && node.tagName === 'TABLE')
        {
            var first = data.findFirstNode('td, th');
            var last = data.findLastNode('td, th');

            $R.dom(first).prepend(this.marker.build('start'));
            $R.dom(last).append(this.marker.build('end'));

            this.restoreMarkers();
        }
        else if (!data.isFigcaption() && this.component.isNonEditable(node))
        {
            this.component.setActive(node);
        }
        else
        {
            if (data.isComponentType('code'))
            {
                node = data.getComponentCodeElement();
                node.focus();
            }

            var range = document.createRange();
            range.selectNodeContents(node);

            this.setRange(range);
        }

        this.editor.enableNonEditables();
        this.editor.restoreScroll();
    },

    // get
    get: function()
    {
        var sel = window.getSelection();
        return (sel.rangeCount > 0) ? sel : null;
    },
    getRange: function()
    {
        var sel = this.get();
        return (sel) ? ((sel.getRangeAt(0)) ? sel.getRangeAt(0) : null) : null;
    },
    getTextBeforeCaret: function(num)
    {
        num = (typeof num === 'undefined') ? 1 : num;

        var el = this.editor.getElement().get();
        var range = this.getRange();
        var text = false;
        if (range)
        {
            range = range.cloneRange();
            range.collapse(true);
            range.setStart(el, 0);
            text = range.toString().slice(-num);
        }

        return text;
    },
    getTextAfterCaret: function(num)
    {
        num = (typeof num === 'undefined') ? 1 : num;

        var el = this.editor.getElement().get();
        var range = this.getRange();
        var text = false;
        if (range)
        {
            var clonedRange = range.cloneRange();
            clonedRange.selectNodeContents(el);
            clonedRange.setStart(range.endContainer, range.endOffset);

            text = clonedRange.toString().slice(0, num);
        }

        return text;
    },
    getPosition: function()
    {
        var range = this.getRange();
        var pos = { top: 0, left: 0, width: 0, height: 0 };
        if (window.getSelection && range.getBoundingClientRect)
        {
            range = range.cloneRange();
            var offset = (range.startOffset-1);
            range.setStart(range.startContainer, (offset < 0) ? 0 : offset);
            var rect = range.getBoundingClientRect();
            pos = { top: rect.top, left: rect.left, width: (rect.right - rect.left) , height: (rect.bottom - rect.top) };
        }

        return pos;
    },
    getCurrent: function()
    {
        var node = false;
        var sel = this.get();
        var component = this.component.getActive();

        if (component)
        {
            node = component;
        }
        else if (sel && this.is())
        {
            var data = this.inspector.parse(sel.anchorNode);
            node = (!data.isEditor()) ? sel.anchorNode : false;
        }

        return node;
    },
    getParent: function()
    {
        var node = false;
        var current = this.getCurrent();
        if (current)
        {
            var parent = current.parentNode;
            var data = this.inspector.parse(parent);

            node = (!data.isEditor()) ? parent : false;
        }

        return node;
    },
    getElement: function(el)
    {
        var node = el || this.getCurrent();
        while (node)
        {
            var data = this.inspector.parse(node);
            if (data.isElement() && data.isInEditor())
            {
                return node;
            }

            node = node.parentNode;
        }

        return false;
    },
    getInline: function(el)
    {
        var node = el || this.getCurrent();
        var inline = false;
        while (node)
        {
            if (this._isInlineNode(node))
            {
                inline = node;
            }

            node = node.parentNode;
        }

        return inline;
    },
    getInlineFirst: function(el)
    {
        var node = el || this.getCurrent();
        while (node)
        {
            if (this._isInlineNode(node))
            {
                return node;
            }

            node = node.parentNode;
        }

        return false;
    },
    getInlineAll: function(el)
    {
        var node = el || this.getCurrent();
        var inlines = [];
        while (node)
        {
            if (this._isInlineNode(node))
            {
                inlines.push(node);
            }

            node = node.parentNode;
        }

        return inlines;
    },
    getBlock: function(el)
    {
        var node = el || this.getCurrent();
        while (node)
        {
            var data = this.inspector.parse(node);
            var isBlock = this.inspector.isBlockTag(node.tagName);

            if (isBlock && data.isInEditor(node))
            {
                return node;
            }

            node = node.parentNode;
        }

        return false;
    },
    getInlinesAllSelected: function(options)
    {
        if (this.isAll()) return [];

        var inlines = this.getInlines({ all: true });
        var textNodes = this.getNodes({ textnodes: true, inline: false });
        var selected = this.getText().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        var finalNodes = [];

        if (textNodes.length !== 0)
        {
            return finalNodes;
        }

        if (selected === '')
        {
            finalNodes = inlines;
        }
        else if (inlines.length > 1)
        {
            for (var i = 0; i < inlines.length; i++)
            {
                if (this._isTextSelected(inlines[i], selected))
                {
                    finalNodes.push(inlines[i]);
                }
            }
        }
        else if (inlines.length === 1)
        {
            if (this._isTextSelected(inlines[0], selected))
            {
                finalNodes = inlines;
            }
        }

        finalNodes = (options && options.tags) ? this._filterNodesByTags(finalNodes, options.tags) : finalNodes;

        return finalNodes;
    },
    getInlines: function(options)
    {
        var nodes = this.getNodes();
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var node;
            if (options && options.all)
            {
                node = nodes[i];
                while (node)
                {
                    if (this._isInlineNode(node) && !this._isInNodesArray(filteredNodes, node))
                    {
                        filteredNodes.push(node);
                    }

                    node = node.parentNode;
                }
            }
            else
            {
                node = this.getInline(nodes[i]);
                if (node && !this._isInNodesArray(filteredNodes, node))
                {
                    filteredNodes.push(node);
                }
            }
        }

        // filter
        filteredNodes = (options && options.tags) ? this._filterNodesByTags(filteredNodes, options.tags) : filteredNodes;
        filteredNodes = (options && options.inside) ? this._filterInlinesInside(filteredNodes, options) : filteredNodes;

        return filteredNodes;
    },
    getBlocks: function(options)
    {
        var nodes = this.getNodes();
        var block = this.getBlock();
        nodes = (nodes.length === 0 && block) ? [block] : nodes;

        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var node = this.getBlock(nodes[i]);
            if (node && !this._isInNodesArray(filteredNodes, node))
            {
                filteredNodes.push(node);
            }
        }

        // filter
        filteredNodes = (options && options.tags) ? this._filterNodesByTags(filteredNodes, options.tags) : filteredNodes;
        filteredNodes = (options && options.first) ? this._filterBlocksFirst(filteredNodes, options) : filteredNodes;

        return filteredNodes;
    },
    getElements: function(options)
    {
        var nodes = this.getNodes({ textnodes: false });
        var block = this.getBlock();
        nodes = (nodes.length === 0 && block) ? [block] : nodes;

        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            if (!this._isInNodesArray(filteredNodes, nodes[i]))
            {
                filteredNodes.push(nodes[i]);
            }
        }

        // filter
        filteredNodes = (options && options.tags) ? this._filterNodesByTags(filteredNodes, options.tags) : filteredNodes;

        return filteredNodes;
    },
    getNodes: function(options)
    {
        var nodes = [];
        var activeComponent = this.component.getActive();
        if (activeComponent)
        {
            nodes = this._getNodesComponent(activeComponent);
        }
        else if (this.isCollapsed())
        {
            var current = this.getCurrent();
            nodes = (current) ? [current] : [];
        }
        else if (this.is() && !activeComponent)
        {
            nodes = this._getRangeSelectedNodes();
        }

        // filter
        nodes = this._filterServicesNodes(nodes);
        nodes = this._filterEditor(nodes);

        // options
        nodes = (options && options.tags) ? this._filterNodesByTags(nodes, options.tags) : nodes;
        nodes = (options && options.textnodes) ? this._filterNodesTexts(nodes, options) : nodes;
        nodes = (options && !options.textnodes) ? this._filterNodesElements(nodes) : nodes;

        return nodes;
    },

    // text & html
    getText: function()
    {
        var sel = this.get();
        return (sel) ? this.utils.removeInvisibleChars(sel.toString()) : '';
    },
    getHtml: function(clean)
    {
        var html = '';
        var sel = this.get();
        if (sel)
        {
            var container = document.createElement('div');
            var len = sel.rangeCount;
            for (var i = 0; i < len; ++i)
            {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }

            html = container.innerHTML;
            html = (clean !== false) ? this.cleaner.output(html) : html;
            html = html.replace(/<p><\/p>$/i, '');
        }

        return html;
    },

    // clear
    clear: function()
    {
        this.component.clearActive();
        this.get().removeAllRanges();
    },

    // collapse
    collapseToStart: function()
    {
        var sel = this.get();
        if (sel && !sel.isCollapsed) sel.collapseToStart();
    },
    collapseToEnd: function()
    {
        var sel = this.get();
        if (sel && !sel.isCollapsed) sel.collapseToEnd();
    },

    // save
    saveActiveComponent: function()
    {
        var activeComponent = this.component.getActive();
        if (activeComponent)
        {
            this.savedComponent = activeComponent;
            return true;
        }

        return false;
    },
    restoreActiveComponent: function()
    {
        if (this.savedComponent)
        {
            this.component.setActive(this.savedComponent);
            return true;
        }

        return false;
    },
    save: function()
    {
        this._clearSaved();

        var el = this.getElement();
        if (el && (el.tagName === 'TD' || el.tagName === 'TH') && el.innerHTML === '')
        {
            this.savedElement = el;
        }
        else if (!this.saveActiveComponent())
        {
            this.saved = this.offset.get();
        }
    },
    restore: function()
    {
        if (!this.saved && !this.savedComponent && !this.savedElement) return;

        this.editor.saveScroll();

        if (this.savedElement)
        {
            this.caret.setStart(this.savedElement);
        }
        else if (!this.restoreActiveComponent())
        {
            this.offset.set(this.saved);
        }

        this._clearSaved();
        this.editor.restoreScroll();
    },
    saveMarkers: function()
    {
        this._clearSaved();

        if (!this.saveActiveComponent())
        {
            this.marker.insert();
        }
    },
    restoreMarkers: function()
    {
        this.editor.saveScroll();

        if (!this.restoreActiveComponent())
        {
            this.marker.restore();
        }

        this._clearSaved();
        this.editor.restoreScroll();
    },

    // private
    _getNextNode: function(node)
    {
        if (node.hasChildNodes()) return node.firstChild;

        while (node && !node.nextSibling)
        {
            node = node.parentNode;
        }

        if (!node) return null;

        return node.nextSibling;
    },
    _getNodesComponent: function(component)
    {
        var current = this.getCurrent();
        var data = this.inspector.parse(current);

        return (data.isFigcaption()) ? [data.getFigcaption()] : [component];
    },
    _getRangeSelectedNodes: function()
    {
        var nodes = [];
        var range = this.getRange();
        var node = range.startContainer;
        var startNode = range.startContainer;
        var endNode = range.endContainer;
        var $editor = this.editor.getElement();

        // editor
        if (startNode === $editor.get() && this.isAll())
        {
            nodes = this.utils.getChildNodes($editor);
        }
        // single node
        else if (node == endNode)
        {
            nodes = [node];
        }
        else
        {
            while (node && node != endNode)
            {
                nodes.push(node = this._getNextNode(node));
            }

            node = range.startContainer;
            while (node && node != range.commonAncestorContainer)
            {
                nodes.unshift(node);
                node = node.parentNode;
            }
        }

        return nodes;
    },
    _isInNodesArray: function(nodes, node)
    {
        return (nodes.indexOf(node) !== -1);
    },
    _filterEditor: function(nodes)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var data = this.inspector.parse(nodes[i]);
            if (data.isInEditor())
            {
                filteredNodes.push(nodes[i]);
            }
        }

        return filteredNodes;
    },
    _filterServicesNodes: function(nodes)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var $el = $R.dom(nodes[i]);
            var skip = false;

            if (nodes[i] && nodes[i].nodeType === 3 && this.utils.isEmpty(nodes[i])) skip = true;
            if ($el.hasClass('redactor-script-tag')
                || $el.hasClass('redactor-component-caret')
                || $el.hasClass('redactor-selection-marker')
                || $el.hasClass('non-editable')) skip = true;

            if (!skip)
            {
                filteredNodes.push(nodes[i]);
            }
        }

        return filteredNodes;
    },
    _filterNodesTexts: function(nodes, options)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            if (nodes[i].nodeType === 3 || (options.keepbr && nodes[i].tagName === 'BR'))
            {
                var inline = this.getInline(nodes[i]);
                var isInline = (inline && options && options.inline === false);
                if (!isInline)
                {
                    filteredNodes.push(nodes[i]);
                }
            }
        }

        return filteredNodes;
    },
    _filterNodesElements: function(nodes)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            if (nodes[i].nodeType !== 3)
            {
                filteredNodes.push(nodes[i]);
            }
        }

        return filteredNodes;
    },
    _filterNodesByTags: function(nodes, tags, passtexts)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            if (passtexts && nodes[i].nodeType === 3)
            {
                filteredNodes.push(nodes[i]);
            }
            else if (nodes[i].nodeType !== 3)
            {
                var nodeTag = nodes[i].tagName.toLowerCase();
                if (tags.indexOf(nodeTag.toLowerCase()) !== -1)
                {
                    filteredNodes.push(nodes[i]);
                }
            }
        }

        return filteredNodes;
    },
    _filterBlocksFirst: function(nodes)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var $node = $R.dom(nodes[i]);
            var parent = $node.parent().get();
            var isFirst = ($node.parent().hasClass('redactor-in'));
            var isCellParent = (parent && (parent.tagName === 'TD' || parent.tagName === 'TH'));
            if (isFirst || isCellParent)
            {
                filteredNodes.push(nodes[i]);
            }
        }

        return filteredNodes;
    },
    _filterInlinesInside: function(nodes)
    {
        var filteredNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            if (window.getSelection().containsNode(nodes[i], true))
            {
                filteredNodes.push(nodes[i]);
            }
        }

        return filteredNodes;
    },
    _isTextSelected: function(node, selected)
    {
        var text = this.utils.removeInvisibleChars(node.textContent);

        return (
            selected === text
            || text.search(selected) !== -1
            || selected.search(new RegExp('^' + text)) !== -1
            || selected.search(new RegExp(text + '$')) !== -1
        );
    },
    _isInlineNode: function(node)
    {
        var data = this.inspector.parse(node);

        return (this.inspector.isInlineTag(node.tagName) && data.isInEditor());
    },
    _clearSaved: function()
    {
        this.saved = false;
        this.savedComponent = false;
        this.savedElement = false;
    }
});
$R.add('service', 'element', {
    init: function(app)
    {
        this.app = app;
        this.rootElement = app.rootElement;

        // local
        this.$element = {};
        this.type = 'inline';
    },
    start: function()
    {
        this._build();
        this._buildType();
    },

    // public
    isType: function(type)
    {
        return (type === this.type);
    },
    getType: function()
    {
        return this.type;
    },
    getElement: function()
    {
        return this.$element;
    },

    // private
    _build: function()
    {
        this.$element = $R.dom(this.rootElement);
    },
    _buildType: function()
    {
        var tag = this.$element.get().tagName;

        this.type = (tag === 'TEXTAREA') ? 'textarea' : this.type;
        this.type = (tag === 'DIV') ? 'div' : this.type;
        this.type = (this.opts.inline) ? 'inline' : this.type;
    }
});
$R.add('service', 'editor', {
    init: function(app)
    {
        this.app = app;

        // local
        this.scrolltop = false;
        this.pasting = false;
    },

    // start
    start: function()
    {
        this._build();
    },

    // focus
    focus: function()
    {
        if (!this.isFocus() && !this._isContenteditableFocus())
        {
            this.saveScroll();
            this.$editor.focus();
            this.restoreScroll();
        }
    },
    startFocus: function()
    {
        this.caret.setStart(this.getFirstNode());
    },
    endFocus: function()
    {
        this.caret.setEnd(this.getLastNode());
    },

    // pasting
    isPasting: function()
    {
        return this.pasting;
    },
    enablePasting: function()
    {
        this.pasting = true;
    },
    disablePasting: function()
    {
        this.pasting = false;
    },

    // scroll
    saveScroll: function()
    {
        this.scrolltop = this._getScrollTarget().scrollTop();
    },
    restoreScroll: function()
    {
        if (this.scrolltop !== false)
        {
            this._getScrollTarget().scrollTop(this.scrolltop);
            this.scrolltop = false;
        }
    },

    // non editables
    disableNonEditables: function()
    {
        this.$noneditables = this.$editor.find('[contenteditable=false]');
        this.$noneditables.attr('contenteditable', true);
    },
    enableNonEditables: function()
    {
        if (this.$noneditables)
        {
            setTimeout(function() { this.$noneditables.attr('contenteditable', false); }.bind(this), 1);
        }
    },

    // nodes
    getFirstNode: function()
    {
        return this.$editor.contents()[0];
    },
    getLastNode: function()
    {
        var nodes = this.$editor.contents();

        return nodes[nodes.length-1];
    },

    // utils
    isSourceMode: function()
    {
        var $source = this.source.getElement();

        return $source.hasClass('redactor-source-open');
    },
    isEditor: function(el)
    {
        var node = $R.dom(el).get();

        return (node === this.$editor.get());
    },
    isEmpty: function(keeplists)
    {
        return this.utils.isEmptyHtml(this.$editor.html(), false, keeplists);
    },
    isFocus: function()
    {
        var $active = $R.dom(document.activeElement);
        var isComponentSelected = (this.$editor.find('.redactor-component-active').length !== 0);

        return (isComponentSelected || $active.closest('.redactor-in-' + this.uuid).length !== 0);
    },
    setEmpty: function()
    {
        this.$editor.html(this.opts.emptyHtml);
    },

    // element
    getElement: function()
    {
        return this.$editor;
    },

    // private
    _build: function()
    {
        var $element = this.element.getElement();
        var editableElement = (this.element.isType('textarea')) ? '<div>' : $element.get();

        this.$editor = $R.dom(editableElement);
    },
    _getScrollTarget: function()
    {
        return (this.opts.scrollTarget) ? $R.dom(this.opts.scrollTarget) : this.$doc;
    },
    _isContenteditableFocus: function()
    {
        var block = this.selection.getBlock();
        var $blockParent = (block) ? $R.dom(block).closest('[contenteditable=true]').not('.redactor-in') : [];

        return ($blockParent.length !== 0);
    }
});
$R.add('service', 'container', {
    init: function(app)
    {
        this.app = app;
    },
    // public
    start: function()
    {
        this._build();
    },
    getElement: function()
    {
        return this.$container;
    },

    // private
    _build: function()
    {
        var tag = (this.element.isType('inline')) ? '<span>' : '<div>';
        this.$container = $R.dom(tag);
    }
});
$R.add('service', 'source', {
    init: function(app)
    {
        this.app = app;

        // local
        this.$source = {};
        this.content = '';
    },
    // public
    start: function()
    {
        this._build();
        this._buildName();
        this._buildStartedContent();
    },
    getElement: function()
    {
        return this.$source;
    },
    getCode: function()
    {
        return this.$source.val();
    },
    getName: function()
    {
        return this.$source.attr('name');
    },
    getStartedContent: function()
    {
        return this.content;
    },
    setCode: function(html)
    {
        return this.insertion.set(html, true, false);
    },
    isNameGenerated: function()
    {
        return (this.name);
    },

    // private
    _build: function()
    {
        var $element = this.element.getElement();
        var isTextarea = this.element.isType('textarea');
        var sourceElement = (isTextarea) ? $element.get() : '<textarea>';

        this.$source = $R.dom(sourceElement);
    },
    _buildName: function()
    {
        var $element = this.element.getElement();

        this.name = $element.attr('name');
        this.$source.attr('name', (this.name) ? this.name : 'content-' + this.uuid);
    },
    _buildStartedContent: function()
    {
        var $element = this.element.getElement();
        var content = (this.element.isType('textarea')) ? $element.val() : $element.html();

        this.content = content.trim();
    }
});
$R.add('service', 'statusbar', {
    init: function(app)
    {
        this.app = app;

        // local
        this.$statusbar = {};
        this.items = [];
    },
    // public
    start: function()
    {
        this.$statusbar = $R.dom('<ul>');
        this.$statusbar.attr('dir', this.opts.direction);
    },
    add: function(name, html)
    {
        return this.update(name, html);
    },
    update: function(name, html)
    {
        var $item;
        if (typeof this.items[name] !== 'undefined')
        {
            $item = this.items[name];
        }
        else
        {
            $item = $R.dom('<li>');
            this.$statusbar.append($item);
            this.items[name] = $item;
        }

        return $item.html(html);
    },
    get: function(name)
    {
        return (this.items[name]) ? this.items[name] : false;
    },
    remove: function(name)
    {
        if (this.items[name])
        {
            this.items[name].remove();
            delete this.items[name];
        }
    },
    getItems: function()
    {
        return this.items;
    },
    removeItems: function()
    {
        this.items = {};
        this.$statusbar.html('');
    },
    getElement: function()
    {
        return this.$statusbar;
    }
});
$R.add('service', 'toolbar', {
    init: function(app)
    {
        this.app = app;

        // local
        this.buttons = [];
        this.dropdownOpened = false;
        this.buttonsObservers = {};
    },
    // public
    start: function()
    {
        if (this.is())
        {
            this.opts.activeButtons = (this.opts.activeButtonsAdd) ? this._extendActiveButtons() : this.opts.activeButtons;
            this.create();
        }
    },
    stopObservers: function()
    {
        this.buttonsObservers = {};
    },
    create: function()
    {
        this.$wrapper = $R.dom('<div>');
        this.$toolbar = $R.dom('<div>');
    },
    observe: function()
    {
        if (!this.is()) return;

        this.setButtonsInactive();

        var button, observer;

        // observers
        for (var name in this.buttonsObservers)
        {
            observer = this.buttonsObservers[name];
            button = this.getButton(name);
            this.app.broadcast('button.' + observer + '.observe', button);
        }

        // inline buttons
        var buttons = this.opts.activeButtons;
        var inlines = this.selection.getInlinesAllSelected();
        var current = this.selection.getInline();
        if (this.selection.isCollapsed() && current)
        {
            inlines.push(current);
        }

        var tags = this._inlinesToTags(inlines);
        for (var key in buttons)
        {
            if (tags.indexOf(key) !== -1)
            {
                button = this.getButton(buttons[key]);
                button.setActive();
            }

        }
    },

    // is
    is: function()
    {
        return !(!this.opts.toolbar || (this.detector.isMobile() && this.opts.air));
    },
    isAir: function()
    {
        return (this.is()) ? this.$toolbar.hasClass('redactor-air') : false;
    },
    isFixed: function()
    {
        return (this.is()) ? this.$toolbar.hasClass('redactor-toolbar-fixed') : false;
    },
    isContextBar: function()
    {
        var $bar = this.$body.find('#redactor-context-toolbar-' + this.uuid);
        return $bar.hasClass('open');
    },
    isTarget: function()
    {
        return (this.opts.toolbarFixedTarget !== document);
    },

    // get
    getElement: function()
    {
        return this.$toolbar;
    },
    getWrapper: function()
    {
        return this.$wrapper;
    },
    getDropdown: function()
    {
        return this.dropdownOpened;
    },
    getTargetElement: function()
    {
        return $R.dom(this.opts.toolbarFixedTarget);
    },
    getButton: function(name)
    {
        var $btn = this._findButton('.re-' + name);

        return ($btn.length !== 0) ? $btn.dataget('data-button-instance') : false;
    },
    getButtonByIndex: function(index)
    {
        var $btn = this.$toolbar.find('.re-button').eq(index);

        return ($btn.length !== 0) ? $btn.dataget('data-button-instance') : false;
    },
    getButtons: function()
    {
        var buttons = [];
        this._findButtons().each(function(node)
        {
            var $node = $R.dom(node);
            buttons.push($node.dataget('data-button-instance'));
        });

        return buttons;
    },
    getButtonsKeys: function()
    {
        var keys = [];
        this._findButtons().each(function(node)
        {
            var $node = $R.dom(node);
            keys.push($node.attr('data-re-name'));
        });

        return keys;
    },

    // add
    addButton: function(name, btnObj, position, $el, start)
    {
        position = position || 'end';

        var index = this._getButtonIndex(name);
        var $button = $R.create('toolbar.button', this.app, name, btnObj);

        if (btnObj.observe)
        {
            this.opts.activeButtonsObservers[name] = { observe: btnObj.observe, button: $button };
        }

        // api added
        if (start !== true)
        {
            if (index === 0) position = 'first';
            else if (index !== -1)
            {
                var $elm = this.getButtonByIndex(index-1);
                if ($elm)
                {
                    position = 'after';
                    $el = $elm;
                }
            }
        }

        if (this.is())
        {
            if (position === 'first') this.$toolbar.prepend($button);
            else if (position === 'after') $el.after($button);
            else if (position === 'before') $el.before($button);
            else this.$toolbar.append($button);
        }

        return $button;
    },
    addButtonFirst: function(name, btnObj)
    {
        return this.addButton(name, btnObj, 'first');
    },
    addButtonAfter: function(after, name, btnObj)
    {
        var $btn = this.getButton(after);

        return ($btn) ? this.addButton(name, btnObj, 'after', $btn) : this.addButton(name, btnObj);
    },
    addButtonBefore: function(before, name, btnObj)
    {
        var $btn = this.getButton(before);

        return ($btn) ? this.addButton(name, btnObj, 'before', $btn) : this.addButton(name, btnObj);
    },
    addButtonObserver: function(name, observer)
    {
        this.buttonsObservers[name] = observer;
    },

    // set
    setButtons: function(buttons)
    {
        this.buttons = buttons;
    },
    setDropdown: function(dropdown)
    {
        this.dropdownOpened = dropdown;
    },
    setButtonsInactive: function()
    {
        var $buttons = this.getButtons();
        for (var i = 0; i < $buttons.length; i++)
        {
            $buttons[i].setInactive();
        }
    },
    setButtonsActive: function()
    {
        var $buttons = this.getButtons();
        for (var i = 0; i < $buttons.length; i++)
        {
            $buttons[i].setActive();
        }
    },

    // disable & enable
    disableButtons: function()
    {
        var $buttons = this.getButtons();
        for (var i = 0; i < $buttons.length; i++)
        {
            $buttons[i].disable();
        }
    },
    enableButtons: function()
    {
        var $buttons = this.getButtons();
        for (var i = 0; i < $buttons.length; i++)
        {
            $buttons[i].enable();
        }

    },

    // private
    _getButtonIndex: function(name)
    {
        var index = this.buttons.indexOf(name);

        return (index === -1) ? false : index;
    },
    _findButton: function(selector)
    {
        return (this.is()) ? this.$toolbar.find(selector) : $R.dom();
    },
    _findButtons: function()
    {
        return (this.is()) ? this.$toolbar.find('.re-button') : $R.dom();
    },
    _extendActiveButtons: function()
    {
        return $R.extend({}, this.opts.activeButtons, this.opts.activeButtonsAdd);
    },
    _inlinesToTags: function(inlines)
    {
        var tags = [];
        for (var i = 0; i < inlines.length; i++)
        {
            tags.push(inlines[i].tagName.toLowerCase());
        }

        return tags;
    }
});
$R.add('class', 'toolbar.button', {
    mixins: ['dom'],
    init: function(app, name, btnObj)
    {
        this.app = app;
        this.opts = app.opts;
        this.lang = app.lang;
        this.$body = app.$body;
        this.toolbar = app.toolbar;
        this.detector = app.detector;

        // local
        this.obj = btnObj;
        this.name = name;
        this.dropdown = false;
        this.tooltip = false;

        // init
        this._init();
    },
    // is
    isActive: function()
    {
        return this.hasClass('redactor-button-active');
    },
    isDisabled: function()
    {
        return this.hasClass('redactor-button-disabled');
    },

    // has
    hasIcon: function()
    {
        return (this.obj.icon && !this.opts.buttonsTextLabeled);
    },

    // set
    setDropdown: function(dropdown)
    {
        this.obj.dropdown = dropdown;
        this.obj.message = false;
        this.dropdown = $R.create('toolbar.dropdown', this.app, this.name, this.obj.dropdown);
        this.attr('data-dropdown', true);
    },
    setMessage: function(message, args)
    {
        this.obj.message = message;
        this.obj.args = args;
        this.obj.dropdown = false;
    },
    setApi: function(api, args)
    {
        this.obj.api = api;
        this.obj.args = args;
        this.obj.dropdown = false;
    },
    setTitle: function(title)
    {
        this.obj.title = this.lang.parse(title);
        this.obj.tooltip = this.obj.title;

        this.attr({ 'alt': this.obj.tooltip, 'aria-label': this.obj.tooltip });
        if (!this.attr('data-re-icon')) this.html(this.obj.title);
    },
    setTooltip: function(tooltip)
    {
        this.obj.tooltip = this.lang.parse(tooltip);
        this.attr({ 'alt': this.obj.tooltip, 'aria-label': this.obj.tooltip });
    },
    setIcon: function(icon)
    {
        if (this.opts.buttonsTextLabeled) return;

        this.obj.icon = true;
        this.$icon = $R.dom(icon);

        this.html('');
        this.append(this.$icon);
        this.attr('data-re-icon', true);
        this.addClass('re-button-icon');
        this.setTooltip(this.obj.title);
        this._buildTooltip();
    },
    setActive: function()
    {
        this.addClass('redactor-button-active');
    },
    setInactive: function()
    {
        this.removeClass('redactor-button-active');
    },

    // hide
    hideTooltip: function()
    {
        this.$body.find('.re-button-tooltip').remove();
    },

    // get
    getDropdown: function()
    {
        return this.dropdown;
    },

    // enable & disable
    disable: function()
    {
        this.addClass('redactor-button-disabled');
    },
    enable: function()
    {
        this.removeClass('redactor-button-disabled');
    },

    // toggle
    toggle: function(e)
    {
        if (e) e.preventDefault();
        if (this.isDisabled()) return;

        if (this.obj.dropdown)
        {
            this.dropdown.toggle(e);
        }
        else if (this.obj.api)
        {
            // broadcast
            this.app.api(this.obj.api, this.obj.args, this.name);
        }
        else if (this.obj.message)
        {
            // broadcast
            this.app.broadcast(this.obj.message, this.obj.args, this.name);
        }

        this.hideTooltip();
    },

    // private
    _init: function()
    {
        // parse
        this._parseTitle();
        this._parseTooltip();

        // build
        this._build();
        this._buildCallback();
        this._buildAttributes();
        this._buildObserver();

        if (this.hasIcon())
        {
            this._buildIcon();
            this._buildTooltip();
        }
        else
        {
            this.html(this.obj.title);
        }
    },
    _parseTooltip: function()
    {
        this.obj.tooltip = (this.obj.tooltip) ? this.lang.parse(this.obj.tooltip) : this.obj.title;
    },
    _parseTitle: function()
    {
        this.obj.title = this.lang.parse(this.obj.title);
    },
    _build: function()
    {
        this.parse('<a>');
        this.addClass('re-button re-' + this.name);
        this.attr('data-re-name', this.name);
        this.dataset('data-button-instance', this);

        if (this.obj.dropdown) this.setDropdown(this.obj.dropdown);
    },
    _buildCallback: function()
    {
        this.on('click', this.toggle.bind(this));
    },
    _buildAttributes: function()
    {
        var attrs = {
            'href': '#',
            'alt': this.obj.tooltip,
            'rel': this.name,
            'role': 'button',
            'aria-label': this.obj.tooltip,
            'tabindex': '-1'
        };

        this.attr(attrs);
    },
    _buildObserver: function()
    {
        if (typeof this.obj.observe !== 'undefined')
        {
            this.toolbar.addButtonObserver(this.name, this.obj.observe);
        }
    },
    _buildIcon: function()
    {
        var icon = this.obj.icon;
        var isHtml = (/(<([^>]+)>)/ig.test(icon));

        this.$icon = (isHtml) ? $R.dom(icon) : $R.dom('<i>');
        if (!isHtml) this.$icon.addClass('re-icon-' + this.name);

        this.append(this.$icon);
        this.attr('data-re-icon', true);
        this.addClass('re-button-icon');
    },
    _buildTooltip: function()
    {
        if (this.detector.isDesktop())
        {
            this.tooltip = $R.create('toolbar.button.tooltip', this.app, this);
        }
    }
});
$R.add('class', 'toolbar.button.tooltip', {
    mixins: ['dom'],
    init: function(app, $button)
    {
        this.app = app;
        this.opts = app.opts;
        this.$body = app.$body;
        this.toolbar = app.toolbar;

        // local
        this.$button = $button;
        this.created = false;

        // init
        this._init();
    },
    open: function()
    {
        if (this.$button.hasClass('redactor-button-disabled') || this.$button.hasClass('redactor-button-active')) return;

        this.created = true;
        this.parse('<span>');
        this.addClass('re-button-tooltip');
        this.$body.append(this);
        this.html(this.$button.attr('alt'));

        var offset = this.$button.offset();
        var position = 'absolute';
        var height = this.$button.height();
        var width = this.$button.width();
        var arrowOffset = 4;

        this.css({
            top: (offset.top + height + arrowOffset) + 'px',
            left: (offset.left + width/2 - this.width()/2) + 'px',
            position: position
        });

        this.show();
    },
    close: function()
    {
        if (!this.created || this.$button.hasClass('redactor-button-disabled')) return;

        this.remove();
        this.created = false;
    },

    // private
    _init: function()
    {
        this.$button.on('mouseover', this.open.bind(this));
        this.$button.on('mouseout', this.close.bind(this));
    }
});
$R.add('class', 'toolbar.dropdown', {
    mixins: ['dom'],
    init: function(app, name, items)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.$win = app.$win;
        this.$doc = app.$doc;
        this.$body = app.$body;
        this.animate = app.animate;
        this.toolbar = app.toolbar;

        // local
        this.name = name;
        this.started = false;
        this.items = items;
        this.$items = [];
    },
    // public
    toggle: function(e)
    {
        if (!this.started)
        {
            this._build();
        }

        // toggle
        if (this.isOpened() && this.isActive())
        {
            this.close(false);
        }
        else
        {
            this.open(e);
        }
    },
    isOpened: function()
    {
        var $dropdown = this.$body.find('.redactor-dropdown-' + this.uuid + '.open');

        return ($dropdown.length !== 0 && $dropdown.attr('data-re-name') === this.name);
    },
    isActive: function()
    {
        var $dropdown = this.$body.find('#redactor-dropdown-' + this.uuid + '-' + this.name + '.open');
        return ($dropdown.length !== 0);
    },
    getName: function()
    {
        return this.attr('data-re-name');
    },
    getItem: function(name)
    {
        return this.$items[name];
    },
    getItemsByClass: function(classname)
    {
        var result = [];
        for (var key in this.$items)
        {
            if (typeof this.$items[key] === 'object' && this.$items[key].hasClass(classname))
            {
                result.push(this.$items[key]);
            }
        }

        return result;
    },
    open: function(e)
    {
        this._closeAll();

        this.$btn = this.toolbar.getButton(this.name);
        this.app.broadcast('dropdown.open', e, this, this.$btn);
        this.toolbar.setDropdown(this);

        this.show();
        this.removeClass('redactor-animate-hide');
        this.addClass('open');
        this._observe();

        this.$btn.hideTooltip();
        this.$btn.setActive();

        this.$doc.on('keyup.redactor.dropdown-' + this.uuid, this._handleKeyboard.bind(this));
        this.$doc.on('click.redactor.dropdown-' + this.uuid + ' touchstart.redactor.dropdown-' + this.uuid, this.close.bind(this));

        this.updatePosition();
        this.app.broadcast('dropdown.opened', e, this, this.$btn);

    },
    close: function(e, animate)
    {
        if (e)
        {
            var $el = $R.dom(e.target);
            if (this._isButton(e) || $el.hasClass('redactor-dropdown-not-close') || $el.hasClass('redactor-dropdown-item-disabled'))
            {
                e.preventDefault();
                return;
            }
        }

        this.app.broadcast('dropdown.close', this, this.$btn);
        this.toolbar.setDropdown(false);

        this.$btn.setInactive();
        if (animate === false)
        {
            this._close();
        }
        else
        {
            this.animate.start(this, 'fadeOut', this._close.bind(this));
        }
    },
    updatePosition: function()
    {
        var isFixed = this.toolbar.isFixed();
        var pos = this.$btn.offset();
        pos.top = (isFixed) ? this.$btn.position().top : pos.top;

        var btnHeight = this.$btn.height();
        var btnWidth = this.$btn.width();
        var position = (isFixed) ? 'fixed' : 'absolute';
        var topOffset = 2;
        var leftOffset = 0;
        var left = (pos.left + leftOffset);
        var width = parseFloat(this.css('width'));
        var leftFix = (this.$win.width() < (left + width)) ? (width - btnWidth) : 0;

        this.css({ position: position, top: (pos.top + btnHeight + topOffset) + 'px', left: (left - leftFix) + 'px' });
    },

    // private
    _build: function()
    {
        this.parse('<div>');
        this.attr('dir', this.opts.direction);
        this.attr('id', 'redactor-dropdown-' + this.uuid + '-' + this.name);
        this.attr('data-re-name', this.name);

        this.addClass('redactor-dropdown redactor-dropdown-' + this.uuid + ' redactor-dropdown-' + this.name);
        this.dataset('data-dropdown-instance', this);
        var isDom = (this.items.dom || typeof this.items === 'string');

        if (isDom) this._buildDom();
        else this._buildItems();

        this.$body.append(this);
        this.started = true;
    },
    _buildDom: function()
    {
        this.html('').append($R.dom(this.items));
    },
    _buildItems: function()
    {
        this.items = (this.name === 'format') ? this._buildFormattingItems() : this.items;

        for (var key in this.items)
        {
            var obj = this.items[key];

            if (key === 'observe')
            {
                this.attr('data-observe', this.items[key]);
            }
            else
            {
                var $item = $R.create('toolbar.dropdown.item', this.app, key, obj, this);

                this.$items[key] = $item;
                this.append($item);
            }
        }
    },
    _buildFormattingItems: function()
    {
        // build the format set
        for (var key in this.items)
        {
            if (this.opts.formatting.indexOf(key) === -1) delete this.items[key];
        }

        // remove from the format set
        if (this.opts.formattingHide)
        {
            for (var key in this.items)
            {
                if (this.opts.formattingHide.indexOf(key) !== -1) delete this.items[key];
            }
        }

        // add to the format set
        if (this.opts.formattingAdd)
        {
            for (var key in this.opts.formattingAdd)
            {
                this.items[key] = this.opts.formattingAdd[key];
            }
        }

        return this.items;
    },
    _handleKeyboard: function(e)
    {
        if (e.which === 27) this.close();
    },
    _isButton: function(e)
    {
        var $el = $R.dom(e.target);
        var $btn = $el.closest('.re-button');

        return ($btn.get() === this.$btn.get());
    },
    _close: function()
    {
        this.$btn.setInactive();
        this.$doc.off('.redactor.dropdown-' + this.uuid);
        this.removeClass('open');
        this.addClass('redactor-animate-hide');
        this.app.broadcast('dropdown.closed', this, this.$btn);
    },
    _closeAll: function()
    {
        this.$body.find('.redactor-dropdown-' + this.uuid + '.open').each(function(node)
        {
            var $node = $R.dom(node);
            var instance =  $node.dataget('data-dropdown-instance');
            instance._close();
        });
    },
    _observe: function()
    {
        var observer = this.attr('data-observe');
        if (observer)
        {
            this.app.broadcast('dropdown.' + observer + '.observe', this);
        }
    }
});
$R.add('class', 'toolbar.dropdown.item', {
    mixins: ['dom'],
    init: function(app, name, obj, dropdown)
    {
        this.app = app;
        this.lang = app.lang;

        // local
        this.dropdown = dropdown;
        this.name = name;
        this.obj = obj;

        // init
        this._init();
    },
    setTitle: function(html)
    {
        this.$span.html(html);
    },
    getTitle: function()
    {
        return this.$span.html();
    },
    enable: function()
    {
        this.removeClass('redactor-dropdown-item-disabled');
    },
    disable: function()
    {
        this.addClass('redactor-dropdown-item-disabled');
    },
    toggle: function(e)
    {
        if (e) e.preventDefault();
        if (this.hasClass('redactor-dropdown-item-disabled')) return;

        if (this.obj.message)
        {
            // broadcast
            this.app.broadcast(this.obj.message, this.obj.args, this.name);
        }
        else if (this.obj.api)
        {
            this.app.api(this.obj.api, this.obj.args, this.name);
        }
    },

    // private
    _init: function()
    {
        this.parse('<a>');
        this.attr('href', '#');
        this.addClass('redactor-dropdown-item-' + this.name);

        if (this.obj.classname)
        {
            this.addClass(this.obj.classname);
        }

        this.attr('data-re-name', this.name);
        this.on('click', this.toggle.bind(this));

        this.$span = $R.dom('<span>');
        this.append(this.$span);
        this.setTitle(this.lang.parse(this.obj.title));
    }
});
$R.add('service', 'cleaner', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;

        // local
        this.storedComponents = [];
        this.storedImages = [];
        this.storedLinks = [];
        this.deniedTags = ['font', 'html', 'head', 'link', 'title', 'body', 'meta', 'applet'];
        this.convertRules = {};
        this.unconvertRules = {};

        // regex
        this.reComments = /<!--[\s\S]*?-->/g;
        this.reSpacedEmpty = /^(||\s||<br\s?\/?>||&nbsp;)$/i;
        this.reScriptTag = /<script(.*?[^>]?)>([\w\W]*?)<\/script>/gi;
    },
    // public
    addConvertRules: function(name, func)
    {
        this.convertRules[name] = func;
    },
    addUnconvertRules: function(name, func)
    {
        this.unconvertRules[name] = func;
    },
    input: function(html, paragraphize, started)
    {
        // pre/code
        html = this.encodePreCode(html);

        // converting entity
        html = html.replace(/\$/g, '&#36;');
        html = html.replace(/&amp;/g, '&');

        // convert to figure
        var converter = $R.create('cleaner.figure', this.app);
        html = converter.convert(html, this.convertRules);

        // store components
        html = this.storeComponents(html);

        // clean
        html = this.replaceTags(html, this.opts.replaceTags);
        html = this._setSpanAttr(html);
        html = this._setStyleCache(html);
        html = this.removeTags(html, this.deniedTags);
        html = (this.opts.removeScript) ? this._removeScriptTag(html) : this._replaceScriptTag(html);
        html = (this.opts.removeComments) ? this.removeComments(html) : html;
        html = (this._isSpacedEmpty(html)) ? this.opts.emptyHtml : html;

        // restore components
        html = this.restoreComponents(html);

        // clear wrapped components
        html = this._cleanWrapped(html);

        // paragraphize
        html = (paragraphize) ? this.paragraphize(html) : html;

        return html;
    },
    output: function(html, removeMarkers)
    {
        html = this.removeInvisibleSpaces(html);

        // empty
        if (this._isSpacedEmpty(html)) return '';
        if (this._isParagraphEmpty(html)) return '';

        html = this.removeServiceTagsAndAttrs(html, removeMarkers);

        // store components
        html = this.storeComponents(html);

        html = this.removeSpanWithoutAttributes(html);
        html = this.removeFirstBlockBreaklineInHtml(html);

        html = (this.opts.removeScript) ? html : this._unreplaceScriptTag(html);
        html = (this.opts.preClass) ? this._setPreClass(html) : html;
        html = (this.opts.linkNofollow) ? this._setLinkNofollow(html) : html;
        html = (this.opts.removeNewLines) ? this.cleanNewLines(html) : html;

        // restore components
        html = this.restoreComponents(html);

        // convert to figure
        var converter = $R.create('cleaner.figure', this.app);
        html = converter.unconvert(html, this.unconvertRules);

        // final clean up
        html = this.removeEmptyAttributes(html, ['style', 'class', 'rel', 'alt', 'title']);
        html = this.cleanSpacesInPre(html);
        html = this.tidy(html);

        // converting entity
        html = html.replace(/&amp;/g, '&');

        // check whitespaces
        html = (html.replace(/\n/g, '') === '') ? '' : html;

        return html;
    },
    paste: function(html)
    {
        // store components
        html = this.storeComponents(html);

        // remove tags
        var deniedTags = this.deniedTags.concat(['iframe']);
        html = this.removeTags(html, deniedTags);

        // remove doctype tag
        html = html.replace(new RegExp("<\!doctype([\\s\\S]+?)>", 'gi'), '');

        // remove style tag
        html = html.replace(new RegExp("<style([\\s\\S]+?)</style>", 'gi'), '');

        // remove br between
        html = html.replace(new RegExp("</p><br /><p", 'gi'), '</p><p');

        // gdocs & word
        var isMsWord = this._isHtmlMsWord(html);

        html = this._cleanGDocs(html);
        html = (isMsWord) ? this._cleanMsWord(html) : html;

        // do not clean
        if (!this.opts.pasteClean)
        {
            // restore components
            html = this.restoreComponents(html);

            return html;
        }

        // plain text
        if (this.opts.pastePlainText)
        {
            // restore components
            html = this.restoreComponents(html);

            return this.pastePlainText(html);
        }

        // remove tags
        var exceptedTags = this.opts.pasteBlockTags.concat(this.opts.pasteInlineTags);
        html = this.removeTagsExcept(html, exceptedTags);


        // links & images
        html = (this.opts.pasteLinks) ? html : this.removeTags(html, ['a']);
        html = (this.opts.pasteImages) ? html : this.removeTags(html, ['img']);

        // build wrapper
        var $wrapper = this.utils.buildWrapper(html);

        // clean attrs
        var $elms = $wrapper.find('*');

        // remove style
        var filterStyle = (this.opts.pasteKeepStyle.length !== 0) ? ',' + this.opts.pasteKeepStyle.join(',') : '';
        $elms.not('[data-redactor-style-cache]' + filterStyle).removeAttr('style');

        // remove class
        var filterClass = (this.opts.pasteKeepClass.length !== 0) ? ',' + this.opts.pasteKeepClass.join(',') : '';
        $elms.not('[data-redactor-style-cache]' + filterClass).removeAttr('class');

        // remove attrs
        var filterAttrs = (this.opts.pasteKeepAttrs.length !== 0) ? ',' + this.opts.pasteKeepAttrs.join(',') : '';
        $elms.not('img, a, [data-redactor-style-cache]' + filterAttrs).each(function(node)
        {
            while(node.attributes.length > 0)
            {
                node.removeAttribute(node.attributes[0].name);
            }
        });

        // paste link target
        if (this.opts.pasteLinks && this.opts.pasteLinkTarget !== false)
        {
            $wrapper.find('a').attr('target', this.opts.pasteLinkTarget);
        }

        // keep style
        $wrapper.find('[data-redactor-style-cache]').each(function(node)
        {
            var style = node.getAttribute('data-redactor-style-cache');
            node.setAttribute('style', style);
        });

        // remove empty span
        $wrapper.find('span').each(function(node)
        {
            if (node.attributes.length === 0)
            {
                $R.dom(node).unwrap();
            }
        });

        // remove empty inline
        $wrapper.find(this.opts.inlineTags.join(',')).each(function(node)
        {
            if (node.attributes.length === 0 && this.utils.isEmptyHtml(node.innerHTML))
            {
                $R.dom(node).unwrap();
            }

        }.bind(this));

        // place ul/ol into li
        $wrapper.find('ul, ol').each(function(node)
        {
            var prev = node.previousSibling;
            if (prev && prev.tagName === 'LI')
            {
                var $li = $R.dom(prev);
                $li.find('p').unwrap();
                $li.append(node);
            }
        });

        // get wrapper
        html = this.utils.getWrapperHtml($wrapper);

        // remove paragraphs form lists (google docs bug)
        html = html.replace(/<li><p>/gi, '<li>');
        html = html.replace(/<\/p><\/li>/gi, '</li>');

        // clean empty p
        html = html.replace(/<p>&nbsp;<\/p>/gi, '<p></p>');
        html = html.replace(/<p><br\s?\/?><\/p>/gi, '<p></p>');

        if (isMsWord)
        {
            html = html.replace(/<p><\/p>/gi, '');
            html = html.replace(/<p>\s<\/p>/gi, '');
        }

        // restore components
        html = this.restoreComponents(html);

        return html;
    },
    pastePlainText: function(html)
    {
        html = (this.opts.pasteLinks) ? this.storeLinks(html) : html;
        html = (this.opts.pasteImages) ? this.storeImages(html) : html;

        html = this.getPlainText(html);
        html = this._replaceNlToBr(html);

        html = (this.opts.pasteLinks) ? this.restoreLinks(html) : html;
        html = (this.opts.pasteImages) ? this.restoreImages(html) : html;

        return html;
    },
    tidy: function(html)
    {
        return html;
    },
    paragraphize: function(html)
    {
        var paragraphize = $R.create('cleaner.paragraphize', this.app);

        return paragraphize.convert(html);
    },

    // get
    getFlatText: function(html)
    {
        var $div = $R.dom('<div>');

        if (!html.nodeType && !html.dom)
        {
            html = html.toString();
            html = html.trim();
            $div.html(html);
        }
        else
        {
            $div.append(html);
        }

        html = $div.get().textContent || $div.get().innerText || '';

        return (html === undefined) ? '' : html;
    },
	getPlainText: function(html)
	{
		html = html.replace(/<!--[\s\S]*?-->/gi, '');
		html = html.replace(/<style[\s\S]*?style>/gi, '');
        html = html.replace(/<p><\/p>/g, '');
		html = html.replace(/<\/div>|<\/li>|<\/td>/gi, '\n');
		html = html.replace(/<\/p>/gi, '\n\n');
		html = html.replace(/<\/H[1-6]>/gi, '\n\n');

		var tmp = document.createElement('div');
		tmp.innerHTML = html;

		html = tmp.textContent || tmp.innerText;

		return html.trim();
	},

    // replace
    replaceTags: function(html, tags)
    {
        if (tags)
        {
            var self = this;
            var keys = Object.keys(tags);
            var $wrapper = this.utils.buildWrapper(html);
            $wrapper.find(keys.join(',')).each(function(node)
            {
                self.utils.replaceToTag(node, tags[node.tagName.toLowerCase()]);
            });

            html = this.utils.getWrapperHtml($wrapper);
        }

        return html;
    },
    replaceNbspToSpaces: function(html)
    {
        return html.replace('&nbsp;', ' ');
    },
    replaceBlocksToBr: function(html)
    {
        html = html.replace(/<\/div>|<\/li>|<\/td>|<\/p>|<\/H[1-6]>/gi, '<br>');

        return html;
    },

    // clean
    cleanNewLines: function(html)
    {
        return html.replace(/\r?\n/g, "");
    },
    cleanSpacesInPre: function(html)
    {
        return html.replace('&nbsp;&nbsp;&nbsp;&nbsp;', '    ');
    },

    // remove
    removeInvisibleSpaces: function(html)
    {
        html = this.utils.removeInvisibleChars(html);
        html = html.replace(/&#65279;/gi, '');

        return html;
    },
    removeNl: function(html)
    {
        html = html.replace(/\n/g, " ");
        html = html.replace(/\s+/g, "\s");

        return html;
    },
    removeBrAtEnd: function(html)
    {
        html = html.replace(/<br\s?\/?>$/gi, ' ');
        html = html.replace(/<br\s?\/?><li/gi, '<li');

        return html;
    },
    removeTags: function(input, denied)
    {
        var re = (denied) ? /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi : /(<([^>]+)>)/gi;
        var replacer = (!denied) ? '' : function ($0, $1)
        {
            return denied.indexOf($1.toLowerCase()) === -1 ? $0 : '';
        };

        return input.replace(re, replacer);
    },
    removeTagsExcept: function(input, except)
    {
        if (except === undefined) return input.replace(/(<([^>]+)>)/gi, '');

        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        return input.replace(tags, function($0, $1)
        {
            return except.indexOf($1.toLowerCase()) === -1 ? '' : $0;
        });
    },
    removeComments: function(html)
    {
        return html.replace(this.reComments, '');
    },
    removeServiceTagsAndAttrs: function(html, removeMarkers)
    {
        var $wrapper = this.utils.buildWrapper(html);
        var self = this;
        if (removeMarkers !== false)
        {
            $wrapper.find('.redactor-selection-marker').each(function(node)
            {
                var $el = $R.dom(node);
                var text = self.utils.removeInvisibleChars($el.text());

                return (text === '') ? $el.remove() : $el.unwrap();
            });
        }

        $wrapper.find('[data-redactor-style-cache]').removeAttr('data-redactor-style-cache');

        return this.utils.getWrapperHtml($wrapper);
    },
    removeSpanWithoutAttributes: function(html)
    {
        var $wrapper = this.utils.buildWrapper(html);
        $wrapper.find('span').removeAttr('data-redactor-span data-redactor-style-cache').each(function(node)
        {
            if (node.attributes.length === 0) $R.dom(node).unwrap();
        });

        return this.utils.getWrapperHtml($wrapper);
    },
    removeFirstBlockBreaklineInHtml: function(html)
    {
        return html.replace(new RegExp('</li><br\\s?/?>', 'gi'), '</li>');
    },
    removeEmptyAttributes: function(html, attrs)
    {
        var $wrapper = this.utils.buildWrapper(html);
        for (var i = 0; i < attrs.length; i++)
        {
            $wrapper.find('[' + attrs[i] + '=""]').removeAttr(attrs[i]);
        }

        return this.utils.getWrapperHtml($wrapper);
    },

    // encode / decode
    encodeHtml: function(html)
    {
        html = html.replace(/<br\s?\/?>/g, "\n");
        html = html.replace(/&nbsp;/g, ' ');
        html = html.replace(/”/g, '"');
        html = html.replace(/“/g, '"');
        html = html.replace(/‘/g, '\'');
        html = html.replace(/’/g, '\'');
        html = this.encodeEntities(html);
        html = html.replace(/\$/g, '&#36;');

        if (this.opts.preSpaces)
        {
            html = html.replace(/\t/g, new Array(this.opts.preSpaces + 1).join(' '));
        }

        return html;
    },
    encodePreCode: function(html)
    {
        var matched = html.match(new RegExp('<code(.*?)>(.*?)<pre(.*?)>(.*?)</pre>(.*?)</code>', 'gi'));
        if (matched !== null)
        {
            for (var i = 0; i < matched.length; i++)
            {
                var arr = matched[i].match(new RegExp('<pre(.*?)>([\\w\\W]*?)</pre>', 'i'));
                html = html.replace(arr[0], this.encodeEntities(arr[0]));
            }
        }

        var $wrapper = this.utils.buildWrapper(html);

        $wrapper.find('code code').replaceWith(this._encodeOuter.bind(this));
        $wrapper.find('code pre').replaceWith(this._encodeOuter.bind(this));
        $wrapper.find('pre pre').replaceWith(this._encodeOuter.bind(this));
        $wrapper.find('code, pre').each(this._encodePreCodeLine.bind(this));

        html = this.utils.getWrapperHtml($wrapper);

        // restore markers
        html = this._decodeMarkers(html);

        return html;
    },
    encodeEntities: function(str)
    {
        str = this.decodeEntities(str);
        str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        return str;
    },
    encodePhpCode: function(html)
    {
        html = html.replace('<?php', '&lt;?php');
        html = html.replace('<?', '&lt;?');
        html = html.replace('?>', '?&gt;');

        return html;
    },
    decodeEntities: function(str)
    {
        return String(str).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    },

    // store / restore
    storeComponents: function(html)
    {
        var matched = this.utils.getElementsFromHtml(html, 'figure', 'table');

        return this._storeMatched(html, matched, 'Components', 'figure');
    },
    restoreComponents: function(html)
    {
        return this._restoreMatched(html, 'Components', 'figure');
    },
    storeLinks: function(html)
    {
        var matched = this.utils.getElementsFromHtml(html, 'a');

        return this._storeMatched(html, matched, 'Links', 'a');
    },
    storeImages: function(html)
    {
        var matched = this.utils.getElementsFromHtml(html, 'img');

        return this._storeMatched(html, matched, 'Images', 'img');
    },
    restoreLinks: function(html)
    {
        return this._restoreMatched(html, 'Links', 'a');
    },
    restoreImages: function(html)
    {
        return this._restoreMatched(html, 'Images', 'img');
    },

    // PRIVATE

    // clean
    _cleanWrapped: function(html)
    {
        html = html.replace(new RegExp('<p><figure([\\w\\W]*?)</figure></p>', 'gi'), '<figure$1</figure>');

        return html;
    },
    _cleanGDocs: function(html)
    {
        // remove google docs markers
        html = html.replace(/<b\sid="internal-source-marker(.*?)">([\w\W]*?)<\/b>/gi, "$2");
        html = html.replace(/<b(.*?)id="docs-internal-guid(.*?)">([\w\W]*?)<\/b>/gi, "$3");

        html = html.replace(/<span[^>]*(font-style: italic; font-weight: bold|font-weight: bold; font-style: italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$2</i></b>');
        html = html.replace(/<span[^>]*(font-style: italic; font-weight: 700|font-weight: 700; font-style: italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$2</i></b>');
        html = html.replace(/<span[^>]*font-style: italic[^>]*>([\w\W]*?)<\/span>/gi, '<i>$1</i>');
        html = html.replace(/<span[^>]*font-weight: bold[^>]*>([\w\W]*?)<\/span>/gi, '<b>$1</b>');
        html = html.replace(/<span[^>]*font-weight: 700[^>]*>([\w\W]*?)<\/span>/gi, '<b>$1</b>');

        return html;
    },
    _cleanMsWord: function(html)
    {
        html = html.replace(/<!--[\s\S]+?-->/gi, '');
        html = html.replace(/<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|img|meta|link|style|\w:\w+)(?=[\s\/>]))[^>]*>/gi, '');
        html = html.replace(/<(\/?)s>/gi, "<$1strike>");
        html = html.replace(/&nbsp;/gi, ' ');
        html = html.replace(/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi, function(str, spaces) {
            return (spaces.length > 0) ? spaces.replace(/./, " ").slice(Math.floor(spaces.length/2)).split("").join("\u00a0") : '';
        });

        // build wrapper
        var $wrapper = this.utils.buildWrapper(html);

        $wrapper.find('p').each(function(node)
        {
            var $node = $R.dom(node);
            var str = $node.attr('style');
            var matches = /mso-list:\w+ \w+([0-9]+)/.exec(str);
            if (matches)
            {
                $node.data('_listLevel',  parseInt(matches[1], 10));
            }
        });

        // parse Lists
        this._parseWordLists($wrapper);

        $wrapper.find('[style]').removeAttr('style');
        $wrapper.find('[align]').removeAttr('align');
        $wrapper.find('[name]').removeAttr('name');
        $wrapper.find('span').unwrap();
        $wrapper.find("[class^='Mso']").removeAttr('class');
        $wrapper.find('a').filter(function(node) { return !node.hasAttribute('href'); }).unwrap();

        // get wrapper
        html = this.utils.getWrapperHtml($wrapper);
        html = html.replace(/<p[^>]*><\/p>/gi, '');
        html = html.replace(/<li>·/gi, '<li>');
        html = html.trim();

        // remove spaces between
        html = html.replace(/\/(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)>\s+<(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)/gi, '/$1>\n<$2');

        var result = '';
        var lines = html.split(/\n/);
        for (var i = 0; i < lines.length; i++)
        {
            var space = (lines[i] !== '' && lines[i].search(/>$/) === -1) ? ' ' : '\n';

            result += lines[i] + space;
        }

        return result;
    },
    _parseWordLists: function($wrapper)
    {
        var lastLevel = 0;
        var pnt = null;

        $wrapper.find('p').each(function(node)
        {
            var $node = $R.dom(node);
            var currentLevel = $node.data('_listLevel');
            if (currentLevel !== null)
            {
                var txt = $node.text();
                var listTag = '<ul></ul>';
                if (/^\s*\w+\./.test(txt))
                {
                    var matches = /([0-9])\./.exec(txt);
                    if (matches)
                    {
                        var start = parseInt(matches[1], 10);
                        listTag = (start > 1) ? '<ol start="' + start + '"></ol>' : '<ol></ol>';
                    }
                    else
                    {
                        listTag = '<ol></ol>';
                    }
                }

                if (currentLevel > lastLevel)
                {
                    if (lastLevel === 0)
                    {
                        $node.before(listTag);
                        pnt = $node.prev();
                    }
                    else
                    {
                        var $list = $R.dom(listTag);
                        pnt.append($list);
                    }
                }

                if (currentLevel < lastLevel)
                {
                    for (var i = 0; i < (lastLevel - currentLevel); i++)
                    {
                        pnt = pnt.parent();
                    }
                }

                $node.find('span').first().unwrap();
                pnt.append('<li>' + $node.html() + '</li>');
                $node.remove();
                lastLevel = currentLevel;
            }
            else
            {
                lastLevel = 0;
            }
        });
    },

    // is
    _isSpacedEmpty: function(html)
    {
        return (html.search(this.reSpacedEmpty) !== -1);
    },
    _isParagraphEmpty: function(html)
    {
        return (html.search(/^<p><\/p>$/i) !== -1);
    },
    _isHtmlMsWord: function(html)
    {
        return html.match(/class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i);
    },

    // set
    _setSpanAttr: function(html)
    {
        var $wrapper = this.utils.buildWrapper(html);
        $wrapper.find('span').attr('data-redactor-span', true);

        return this.utils.getWrapperHtml($wrapper);
    },
    _setStyleCache: function(html)
    {
        var $wrapper = this.utils.buildWrapper(html);
        $wrapper.find('[style]').each(function(node)
        {
            var $el = $R.dom(node);
            $el.attr('data-redactor-style-cache', $el.attr('style'));
        });

        return this.utils.getWrapperHtml($wrapper);
    },
    _setPreClass: function(html)
    {
        var $wrapper = this.utils.buildWrapper(html);
        $wrapper.find('pre').addClass(this.opts.preClass);

        return this.utils.getWrapperHtml($wrapper);
    },
    _setLinkNofollow: function(html)
    {
        var $wrapper = this.utils.buildWrapper(html);
        $wrapper.find('a').attr('rel', 'nofollow');

        return this.utils.getWrapperHtml($wrapper);
    },

    // replace
    _replaceScriptTag: function(html)
    {
        return html.replace(this.reScriptTag, '<pre class="redactor-script-tag" $1>$2</pre>');
    },
    _unreplaceScriptTag: function(html)
    {
        return html.replace(/<pre class="redactor-script-tag"(.*?[^>]?)>([\w\W]*?)<\/pre>/gi, '<script$1>$2</script>');
    },
	_replaceNlToBr: function(html)
	{
		return html.replace(/\n/g, '<br />');
	},

    // remove
    _removeScriptTag: function(html)
    {
        return html.replace(this.reScriptTag, '');
    },

    // private
    _storeMatched: function(html, matched, stored, name)
    {
        this['stored' + stored] = [];
        if (matched)
        {
            for (var i = 0; i < matched.length; i++)
            {
                this['stored' + stored][i] = matched[i];
                html = html.replace(matched[i], '####' + name + i + '####');
            }
        }

        return html;
    },
    _restoreMatched: function(html, stored, name)
    {
        if (this['stored' + stored])
        {
            for (var i = 0; i < this['stored' + stored].length; i++)
            {
                html = html.replace('####' + name + i + '####', this['stored' + stored][i]);
            }
        }

        return html;
    },
    _decodeMarkers: function(html)
    {
        var decodedMarkers = '<span id="selection-marker-$1" class="redactor-selection-marker">​</span>';
        return html.replace(/&lt;span\sid="selection-marker-(start|end)"\sclass="redactor-selection-marker"&gt;(.*?[^>]?)&lt;\/span&gt;/g, decodedMarkers);
    },
    _encodeOuter: function(node)
    {
        return this.encodeEntities(node.outerHTML);
    },
    _encodePreCodeLine: function(node)
    {
        var first = node.firstChild;
        if (node.tagName == 'PRE' && (first && first.tagName === 'CODE')) return;

        var encoded = this.decodeEntities(node.innerHTML);
        encoded = encoded.replace(/&nbsp;/g, ' ').replace(/<br\s?\/?>/g, '\n');
        encoded = (this.opts.preSpaces) ? encoded.replace(/\t/g, new Array(this.opts.preSpaces + 1).join(' ')) : encoded;

        node.textContent = encoded;
    }
});
$R.add('class', 'cleaner.figure', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
    },
    // public
    convert: function(html, rules)
    {
        var $wrapper = this.utils.buildWrapper(html);

        // convert
        $wrapper.find('img').each(this._convertImage.bind(this));
        $wrapper.find('hr').each(this._convertLine.bind(this));
        $wrapper.find('iframe').each(this._convertIframe.bind(this));
        $wrapper.find('table').each(this._convertTable.bind(this));
        $wrapper.find('form').each(this._convertForm.bind(this));
        $wrapper.find('figure pre').each(this._convertCode.bind(this));

        // variables
        $wrapper.find('[data-redactor-type=variable]').addClass('redactor-component');

        // widgets
        $wrapper.find('figure').not('.redactor-component, .redactor-figure-code').each(this._convertWidget.bind(this));

        // contenteditable
        $wrapper.find('figure pre').each(this._setContenteditableCode.bind(this));
        $wrapper.find('.redactor-component, .non-editable').attr('contenteditable', false);

        $wrapper.find('figcaption, td, th').attr('contenteditable', true);
        $wrapper.find('.redactor-component, figcaption').attr('tabindex', '-1');

        // extra rules
        this._acceptExtraRules($wrapper, rules);

        return this.utils.getWrapperHtml($wrapper);
    },
    unconvert: function(html, rules)
    {
        var $wrapper = this.utils.buildWrapper(html);

        // contenteditable
        $wrapper.find('th, td, figcaption, figure, pre, code, .redactor-component').removeAttr('contenteditable tabindex');

        // remove class
        $wrapper.find('figure').removeClass('redactor-component redactor-component-active redactor-uploaded-figure');

        // unconvert
        $wrapper.find('[data-redactor-type=variable]').removeClass('redactor-component');
        $wrapper.find('figure[data-redactor-type=line]').unwrap();
        $wrapper.find('figure[data-redactor-type=widget]').each(this._unconvertWidget.bind(this));
        $wrapper.find('figure[data-redactor-type=form]').each(this._unconvertForm.bind(this));
        $wrapper.find('figure[data-redactor-type=table]').each(this._unconvertTable.bind(this));
        $wrapper.find('figure[data-redactor-type=image]').removeAttr('rel').each(this._unconvertImages.bind(this));

        $wrapper.find('img').removeAttr('data-redactor-type').removeClass('redactor-component');
        $wrapper.find('.non-editable').removeAttr('contenteditable');

        // remove types
        $wrapper.find('figure').each(this._removeTypes.bind(this));

        // remove caret
        $wrapper.find('span.redactor-component-caret').remove();

        if (this.opts.breakline)
        {
            $wrapper.find('[data-redactor-tag="br"]').each(function(node)
            {
                if (node.lastChild && node.lastChild.tagName !== 'BR')
                {
                    node.appendChild(document.createElement('br'));
                }
            }).unwrap();
        }

        // extra rules
        this._acceptExtraRules($wrapper, rules);

        html = this.utils.getWrapperHtml($wrapper);
        html = html.replace(/<br\s?\/?>$/, '');

        return html;
    },

    // private
    _convertImage: function(node)
    {
        var $node = $R.dom(node);
        if (this._isNonEditable($node)) return;

        // set id
        if (!$node.attr('data-image'))
        {
            $node.attr('data-image', this.utils.getRandomId());
        }

        var $link = $node.closest('a');
        var $figure = $node.closest('figure');
        var isImage = ($figure.children().not('a, img, br, figcaption').length === 0);
        if (!isImage) return;

        if ($figure.length === 0)
        {
            $figure = ($link.length !== 0) ? $link.wrap('<figure>') : $node.wrap('<figure>');
        }
        else
        {
            if ($figure.hasClass('redactor-uploaded-figure'))
            {
                $figure.removeClass('redactor-uploaded-figure');
            }
            else
            {
                $figure.addClass('redactor-keep-figure');
            }
        }

        this._setFigure($figure, 'image');
    },
    _convertTable: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $figure = this._wrapFigure(node);
        this._setFigure($figure, 'table');
    },
    _convertLine: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $figure = this._wrapFigure(node);
        this._setFigure($figure, 'line');
    },
    _convertForm: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $figure = this.utils.replaceToTag(node, 'figure');
        this._setFigure($figure, 'form');
    },
    _convertIframe: function(node)
    {
        if (this._isNonEditable(node)) return;

        var src = node.getAttribute('src');
        var isVideo = (src && (src.match(this.opts.regex.youtube) || src.match(this.opts.regex.vimeo)));
        var $figure = this._wrapFigure(node);

        if (isVideo)
        {
            this._setFigure($figure, 'video');
        }
    },
    _convertCode: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $figure = this._wrapFigure(node);
        this._setFigure($figure, 'code');
    },
    _convertWidget: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $node = $R.dom(node);
        $node.addClass('redactor-component');
        $node.attr('data-redactor-type', 'widget');
        $node.attr('data-widget-code', encodeURI(node.innerHTML.trim()));
    },

    // unconvert
    _unconvertForm: function(node)
    {
        this.utils.replaceToTag(node, 'form');
    },
    _unconvertTable: function(node)
    {
        var $node = $R.dom(node);
        $node.unwrap();
    },
    _unconvertWidget: function(node)
    {
        var $node = $R.dom(node);
        $node.html(decodeURI($node.attr('data-widget-code')));
        $node.removeAttr('data-widget-code');
    },
    _unconvertImages: function(node)
    {
        var $node = $R.dom(node);
        $node.removeClass('redactor-component');

        var isList = ($node.closest('li').length !== 0);
        var isTable = ($node.closest('table').length !== 0);
        var hasFigcaption = ($node.find('figcaption').length !== 0);

        var style = $node.attr('style');
        var hasStyle = !(style === null || style === '');
        var hasClass = ($node.attr('class') !== '');

        if (isList || (isTable && !hasFigcaption && !hasStyle && !hasClass))
        {
            $node.unwrap();
        }
    },
    _removeTypes: function(node)
    {
        var $node = $R.dom(node);
        var type = $node.attr('data-redactor-type');
        var removed = ['image', 'widget', 'line', 'video', 'code', 'form', 'table'];
        if (type && removed.indexOf(type) !== -1)
        {
            $node.removeAttr('data-redactor-type');
        }

        // keep figure
        if ($node.hasClass('redactor-keep-figure'))
        {
            $node.removeClass('redactor-keep-figure');
        }
        // unwrap figure
        else if (this.opts.imageFigure === false)
        {
            var hasFigcaption = ($node.find('figcaption').length !== 0);
            if (!hasFigcaption)
            {
                $node.unwrap();
            }
        }
    },

    // wrap
    _wrapFigure: function(node)
    {
        var $node = $R.dom(node);
        var $figure = $node.closest('figure');

        return ($figure.length === 0) ? $node.wrap('<figure>') : $figure;
    },

    // set
    _setFigure: function($figure, type)
    {
        $figure.addClass('redactor-component');
        $figure.attr('data-redactor-type', type);
    },
    _setContenteditableCode: function(node)
    {
        if (this._isNonEditable(node)) return;

        var $node = $R.dom(node);
        var $code = $node.children('code').first();

        var $el = ($code.length !== 0) ? $code : $node;
        $el.attr('contenteditable', true).attr('tabindex', '-1');
    },

    // utils
    _acceptExtraRules: function($wrapper, rules)
    {
        for (var key in rules)
        {
            if (typeof rules[key] === 'function')
            {
                rules[key]($wrapper);
            }
        }
    },
    _isNonEditable: function(node)
    {
        return ($R.dom(node).closest('.non-editable').length !== 0);
    }
});
$R.add('class', 'cleaner.paragraphize', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.element = app.element;

        // local
        this.stored = [];
        this.remStart = '#####replace';
        this.remEnd = '#####';
        this.paragraphizeTags = ['table', 'div', 'pre', 'form', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'blockquote', 'figcaption',
                'address', 'section', 'header', 'footer', 'aside', 'article', 'object', 'style', 'script', 'iframe', 'select', 'input', 'textarea',
                'button', 'option', 'map', 'area', 'math', 'hr', 'fieldset', 'legend', 'hgroup', 'nav', 'figure', 'details', 'menu', 'summary', 'p'];
    },
    // public
    convert: function(html)
    {
        var value = this._isConverted(html);

        return (value === true) ? this._convert(html) : value;
    },

    // private
    _convert: function(html)
    {
        // build markup tag
        var markupTag = (this.opts.breakline) ? 'sdivtag' : this.opts.markup;

        // store tags
        html = this._storeTags(html);

        // remove new lines
        html = html.trim();

        if (this.opts.breakline)
        {
            html = html.replace(new RegExp('\\n#####', 'gi'), 'xnonbreakmarkerz#####');
            html = html.replace(new RegExp('#####\\n\\n', 'gi'), "#####\nxnonbreakmarkerz");
            html = html.replace(new RegExp('#####\\n', 'gi'), "#####xnonbreakmarkerz");
            html = html.replace(/<br\s?\/?>\n/gi, "<br>");
            html = html.replace(/\n/g, "<br>");
            html = html.replace(/xnonbreakmarkerz/gi, "\n");
        }
        else
        {
            html = html.replace(/[\n]+/g, "\n");
        }

        html = this._trimEmptyLines(html);

        // paragraph and break markers
        html = (this.opts.breakline) ? html : html.replace(/<br\s?\/?>\n/gi, "xbreakmarkerz\n");
        html = html.replace(/(?:\r\n|\r|\n)/g, "xparagraphmarkerz");

        // replace markers
        html = html.replace(/xparagraphmarkerz/gi, "</" + markupTag + ">\n<" + markupTag + ">");
        html = (this.opts.breakline) ? html : html.replace(/xbreakmarkerz/gi, "<br>");

        // wrap all
        html = '<' + markupTag + '>' + html + '</' + markupTag + '>';

        // clean
        html = html.replace(new RegExp('<' + markupTag + '>#####', 'gi'), '#####');
        html = html.replace(new RegExp('#####</' + markupTag + '>', 'gi'), '#####');

        // restore tags
        html = this._restoreTags(html);

        // clean restored
        html = (this.opts.breakline) ? html : html.replace(new RegExp('<' + markupTag + '><br\\s?/?></' + markupTag + '>', 'gi'), '<' + markupTag + '></' + markupTag + '>');
        html = html.replace(new RegExp('<sdivtag>', 'gi'), '<div data-redactor-tag="br">');
        html = html.replace(new RegExp('sdivtag', 'gi'), 'div');

        return html;
    },
    _storeTags: function(html)
    {
        var self = this;
        var $wrapper = this.utils.buildWrapper(html);

        if (this.opts.breakline)
        {
            $wrapper.find('p').each(function(node)
            {
                var $node = $R.dom(node);
                var isUnwrap = ($node.closest('figure[data-redactor-type=widget],figure[data-redactor-type=form],.non-editable').length === 0);

                if (isUnwrap)
                {
                    $node.append('<br><br>');
                    $node.unwrap();
                }
            });
        }

        $wrapper.find(this.paragraphizeTags.join(', ')).each(function(node, i)
        {
            var replacement = document.createTextNode("\n" + self.remStart + i + self.remEnd + "\n");
            self.stored.push(node.outerHTML);
            node.parentNode.replaceChild(replacement, node);
        });

        return this.utils.getWrapperHtml($wrapper);
    },
    _restoreTags: function(html)
    {
        for (var i = 0; i < this.stored.length; i++)
        {
            this.stored[i] = this.stored[i].replace(/\$/g, '&#36;');
            html = html.replace(this.remStart + i + this.remEnd, this.stored[i]);
        }

        return html;
    },
    _trimEmptyLines: function(html)
    {
        var str = '';
        var arr = html.split("\n");
        for (var i = 0; i < arr.length; i++)
        {
            if (arr[i].trim() !== '')
            {
                str += arr[i] + "\n";
            }
        }

        return str.replace(/\n$/, '');
    },
    _isConverted: function(html)
    {
        if (this._isDisabled(html)) return html;
        else if (this._isEmptyHtml(html)) return this.opts.emptyHtml;
        else return true;
    },
    _isDisabled: function()
    {
        return (this.opts.paragraphize === false || this.element.isType('inline'));
    },
    _isEmptyHtml: function(html)
    {
        return (html === '' || html === '<p></p>' || html === '<div></div>');
    }
});
$R.add('service', 'detector', {
    init: function(app)
    {
        this.app = app;

        // local
        this.userAgent = navigator.userAgent.toLowerCase();
    },
	isWebkit: function()
	{
		return /webkit/.test(this.userAgent);
	},
	isFirefox: function()
	{
		return (this.userAgent.indexOf('firefox') > -1);
	},
	isIe: function(v)
	{
        if (document.documentMode || /Edge/.test(navigator.userAgent)) return 'edge';

		var ie;
		ie = RegExp('msie' + (!isNaN(v)?('\\s'+v):''), 'i').test(navigator.userAgent);
		if (!ie) ie = !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);

		return ie;
	},
	isMobile: function()
	{
		return /(iPhone|iPod|Android)/.test(navigator.userAgent);
	},
	isDesktop: function()
	{
		return !/(iPhone|iPod|iPad|Android)/.test(navigator.userAgent);
	},
	isIpad: function()
	{
		return /iPad/.test(navigator.userAgent);
	}
});
$R.add('service', 'offset', {
    init: function(app)
    {
        this.app = app;
    },
    get: function(el, trimmed)
    {
        var offset = { start: 0, end: 0, newline: false };
        var node = this.utils.getNode(el);
        if (!node) return false;

        var isEditor = this.editor.isEditor(node);
        var isIn = (isEditor) ? true : this.selection.isIn(node);
        var range = this.selection.getRange();

        if (!isEditor && !isIn)
        {
            offset = false;
        }
        else if (this.selection.is() && isIn)
        {
            var $startNode = $R.dom(range.startContainer);
            var fix = ($startNode.hasClass('redactor-component')) ? range.startOffset : 0;
            var clonedRange = range.cloneRange();

            clonedRange.selectNodeContents(node);
            clonedRange.setEnd(range.startContainer, range.startOffset);

            var selection = this._getString(range, trimmed);

            offset.newline = (selection.search(/^\n/) !== -1 && selection.trim() === '');
            offset.start = this._getString(clonedRange, trimmed).length - fix;
            offset.end = offset.start + selection.length + fix;
        }

        return offset;
    },
    set: function(offset, el)
    {
        if (this._setComponentOffset(el)) return;

        this.component.clearActive();
        var node = this.utils.getNode(el);
        if (!node) return;

        var size = this.size(node);
        var charIndex = 0, range = document.createRange();

        offset.newline = (typeof offset.newline === 'undefined') ? false : offset.newline;
        offset.end = (offset.end > size) ? size : offset.end;

        range.setStart(node, 0);
        range.collapse(true);

        var nodeStack = [node], foundStart = false, stop = false;
        while (!stop && (node = nodeStack.pop()))
        {
            if (node.nodeType == 3)
            {
                var nextCharIndex = charIndex + node.length;
                var isNewLineStr = (node.nodeValue.search(/^\n/) !== -1 && node.nodeValue.trim() === '');

                if (!foundStart && !this._isFigcaptionNext(node)
                    && (offset.newline === false && !isNewLineStr)
                    && offset.start >= charIndex && offset.start <= nextCharIndex)
                {
                    range.setStart(node, offset.start - charIndex);
                    foundStart = true;
                }

                if (foundStart && offset.end >= charIndex && offset.end <= nextCharIndex)
                {
                    range.setEnd(node, offset.end - charIndex);
                    stop = true;
                }

                charIndex = nextCharIndex;
            }
            else
            {
                var i = node.childNodes.length;
                while (i--)
                {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        this.selection.setRange(range);
    },
    size: function(el, trimmed)
    {
        var node = this.utils.getNode(el);
        if (node)
        {
            var range = document.createRange();

            var clonedRange = range.cloneRange();
            clonedRange.selectNodeContents(node);

            return this._getString(clonedRange, trimmed).length;
        }

        return 0;
    },

    // private
    _getString: function(obj, trimmed)
    {
        var str = obj.toString();
        str = (this.editor.isEmpty()) ? str.replace(/\uFEFF/g, '') : str;
        str = (trimmed) ? str.trim() : str;

        return str;
    },
    _setComponentOffset: function(el)
    {
        return (this.component.isNonEditable(el)) ? this.component.setActive(el) : false;
    },
    _isFigcaptionNext: function(node)
    {
        var next = node.nextSibling;
        return (node.nodeValue.trim() === '' && next && next.tagName === 'FIGCAPTION');
    }
});
$R.add('service', 'inspector', {
    init: function(app)
    {
        this.app = app;
    },
    // parse
    parse: function(el)
    {
        return $R.create('inspector.parser', this.app, this, el);
    },

    // text detection
    isText: function(el)
    {
        if (typeof el === 'string' && !/^\s*<(\w+|!)[^>]*>/.test(el))
        {
            return true;
        }

        var node = $R.dom(el).get();
        return (node && node.nodeType === 3); //  && !this.selection.getBlock(el)
    },

    // tag detection
    isInlineTag: function(tag, extend)
    {
        var tags = this._extendTags(this.opts.inlineTags, extend);

        return (this._isTag(tag) && tags.indexOf(tag.toLowerCase()) !== -1);
    },
    isBlockTag: function(tag, extend)
    {
        var tags = this._extendTags(this.opts.blockTags, extend);

        return (this._isTag(tag) && tags.indexOf(tag.toLowerCase()) !== -1);
    },
    isTableCellTag: function(tag)
    {
        return (['td', 'th'].indexOf(tag.toLowerCase()) !== -1);
    },
    isHeadingTag: function(tag)
    {
        return (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(tag.toLowerCase()) !== -1);
    },


    _isTag: function(tag)
    {
        return (tag !== undefined && tag);
    },
    _extendTags: function(tags, extend)
    {
        tags = tags.concat(tags);

        if (extend)
        {
            for (var i = 0 ; i < extend.length; i++)
            {
                tags.push(extend[i]);
            }
        }

        return tags;
    }
});
$R.add('class', 'inspector.parser', {
    init: function(app, inspector, el)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.utils = app.utils;
        this.editor = app.editor;
        this.selection = app.selection;
        this.inspector = inspector;

        // local
        this.el = el;
        this.$el = $R.dom(this.el);
        this.node = this.$el.get();
        this.$component = this.$el.closest('.redactor-component', '.redactor-in');
    },
    // is
    isEditor: function()
    {
        return (this.node === this.editor.getElement().get());
    },
    isInEditor: function()
    {
        return (this.$el.parents('.redactor-in-' + this.uuid).length !== 0);
    },
    isComponent: function()
    {
        return (this.$component.length !== 0);
    },
    isComponentType: function(type)
    {
        return (this.getComponentType() === type);
    },
    isComponentActive: function()
    {
        return (this.isComponent() && this.$component.hasClass('redactor-component-active'));
    },
    isComponentEditable: function()
    {
        var types = ['code', 'table'];
        var type = this.getComponentType();

        return (this.isComponent() && types.indexOf(type) !== -1);
    },
    isFigcaption: function()
    {
        return this.getFigcaption();
    },
    isPre: function()
    {
        return this.getPre();
    },
    isCode: function()
    {
        var $code = this.$el.closest('code');
        var $parent = $code.parent('pre');

        return ($code.length !== 0 && $parent.length === 0);
    },
    isList: function()
    {
        return this.getList();
    },
    isFirstListItem: function()
    {
        return this._getLastOrFirstListItem('first');
    },
    isLastListItem: function()
    {
        return this._getLastOrFirstListItem('last');
    },
    isFirstTableCell: function()
    {
        return this._getLastOrFirstTableCell('first');
    },
    isLastTableCell: function()
    {
        return this._getLastOrFirstTableCell('last');
    },
    isTable: function()
    {
        return (this.isComponentType('table') || this.getTable());
    },
    isHeading: function()
    {
        return this.getHeading();
    },
    isBlockquote: function()
    {
        return this.getBlockquote();
    },
    isDl: function()
    {
        return this.getDl();
    },
    isParagraph: function()
    {
        return this.getParagraph();
    },
    isLink: function()
    {
        return this.getLink();
    },
    isFile: function()
    {
        return this.getFile();
    },
    isText: function()
    {
        return this.inspector.isText(this.el);
    },
    isInline: function()
    {
        var tags = this.opts.inlineTags;

        return (this.isElement()) ? (tags.indexOf(this.node.tagName.toLowerCase()) !== -1) : false;
    },
    isBlock: function()
    {
        var tags = this.opts.blockTags;

        return (this.isElement()) ? (tags.indexOf(this.node.tagName.toLowerCase()) !== -1) : false;
    },
    isElement: function()
    {
        return (this.node && this.node.nodeType && this.node.nodeType !== 3);
    },

    // has
    hasParent: function(tags)
    {
        return (this.$el.closest(tags.join(',')).length !== 0);
    },

    // get
    getNode: function()
    {
        return this.node;
    },
    getTag: function()
    {
        return (this.isElement()) ? this.node.tagName.toLowerCase() : false;
    },
    getComponent: function()
    {
        return (this.isComponent()) ? this.$component.get() : false;
    },
    getComponentType: function()
    {
        return (this.isComponent()) ? this.$component.attr('data-redactor-type') : false;
    },
    getFirstNode: function()
    {
        return this.utils.getFirstNode(this.node);
    },
    getLastNode: function()
    {
        return this.utils.getLastNode(this.node);
    },
    getFirstElement: function()
    {
        return this.utils.getFirstElement(this.node);
    },
    getLastElement: function()
    {
        return this.utils.getLastElement(this.node);
    },
    getFigcaption: function()
    {
        return this._getClosestNode('figcaption');
    },
    getPre: function()
    {
        return this._getClosestNode('pre');
    },
    getCode: function()
    {
        return this._getClosestNode('code');
    },
    getList: function()
    {
        return this._getClosestNode('ul, ol');
    },
    getParentList: function()
    {
        return this._getClosestUpNode('ul, ol');
    },
    getListItem: function()
    {
        return this._getClosestNode('li');
    },
    getTable: function()
    {
        if (this.getComponentType('table'))
        {
            return this.$component.find('table').get();
        }
        else
        {
            return this._getClosestNode('table');
        }
    },
    getTableCell: function()
    {
        var $td = this.$el.closest('td, th');

        return ($td.length !== 0) ? $td.get() : false;
    },
    getComponentCodeElement: function()
    {
        return (this.isComponentType('code')) ? this.$component.find('pre code, pre').last().get() : false;
    },
    getImageElement: function()
    {
        return (this.isComponentType('image')) ? this.$component.find('img').get() : false;
    },
    getParagraph: function()
    {
        return this._getClosestNode('p');
    },
    getHeading: function()
    {
        return this._getClosestNode('h1, h2, h3, h4, h5, h6');
    },
    getDl: function()
    {
        return this._getClosestNode('dl');
    },
    getBlockquote: function()
    {
        return this._getClosestNode('blockquote');
    },
    getLink: function()
    {
        var isComponent = (this.isComponent() && !this.isFigcaption());
        var isTable = this.isComponentType('table');

        if (isTable || !isComponent)
        {
            var $el = this._getClosestElement('a');

            return ($el && !$el.attr('data-file')) ? $el.get() : false;
        }

        return false;
    },
    getFile: function()
    {
        var isComponent = this.isComponent();
        var isTable = this.isComponentType('table');

        if (isTable || !isComponent)
        {
            var $el = this._getClosestElement('a');

            return ($el && $el.attr('data-file')) ? $el.get() : false;
        }

        return false;
    },

    // find
    findFirstNode: function(selector)
    {
        return this.$el.find(selector).first().get();
    },
    findLastNode: function(selector)
    {
        return this.$el.find(selector).last().get();
    },

    // private
    _getLastOrFirstListItem: function(type)
    {
        var list = this.getList();
        var tag = this.getTag();
        if (list && tag === 'li')
        {
            var item = $R.dom(list).find('li')[type]().get();
            if (item && this.node === item)
            {
                return true;
            }
        }

        return false;
    },
    _getLastOrFirstTableCell: function(type)
    {
        var table = this.getTable();
        var tag = this.getTag();
        if (table && (tag === 'td' || tag === 'th'))
        {
            var item = $R.dom(table).find('td, th')[type]().get();
            if (item && this.node === item)
            {
                return true;
            }
        }

        return false;
    },
    _getClosestUpNode: function(selector)
    {
        var $el = this.$el.parents(selector, '.redactor-in').last();

        return ($el.length !== 0) ? $el.get() : false;
    },
    _getClosestNode: function(selector)
    {
        var $el = this.$el.closest(selector, '.redactor-in');

        return ($el.length !== 0) ? $el.get() : false;
    },
    _getClosestElement: function(selector)
    {
        var $el = this.$el.closest(selector, '.redactor-in');

        return ($el.length !== 0) ? $el : false;
    }
});
$R.add('service', 'marker', {
    init: function(app)
    {
        this.app = app;
    },
    build: function(pos, html)
    {
        var marker = document.createElement('span');

        marker.id = 'selection-marker-' + this._getPos(pos);
        marker.className = 'redactor-selection-marker';
        marker.innerHTML = this.opts.markerChar;

        return (html) ? marker.outerHTML : marker;
    },
    buildHtml: function(pos)
    {
        return this.build(pos, true);
    },
    insert: function(side)
    {
        this.remove();

        var atStart = (side !== 'both' && (side === 'start' || this.selection.isCollapsed()));

        if (!this.selection.is()) this.editor.focus();

        var range = this.selection.getRange();
        if (range)
        {
            var start = this.build('start');
            var end = this.build('end');

            var cloned = range.cloneRange();

            if (!atStart)
            {
                cloned.collapse(false);
                cloned.insertNode(end);
            }

            cloned.setStart(range.startContainer, range.startOffset);
            cloned.collapse(true);
            cloned.insertNode(start);

            range.setStartAfter(start);

            if (!atStart)
            {
                range.setEndBefore(end);
            }

            this.selection.setRange(range);

            return start;
        }
    },
    find: function(pos, $context)
    {
        var $editor = this.editor.getElement();
        var $marker = ($context || $editor).find('span#selection-marker-' + this._getPos(pos));

        return ($marker.length !== 0) ? $marker.get() : false;
    },
    restore: function()
    {
        var start = this.find('start');
        var end = this.find('end');

        var range = this.selection.getRange();
        if (!range || !this.selection.is())
        {
            this.editor.focus();
            range = document.createRange();
        }

        if (start)
        {
            var prev = (end) ? end.previousSibling : false;
            var next = start.nextSibling;
            next = (next && next.nodeType === 3 && next.textContent.replace(/[\n\t]/g, '') === '') ? false : next;

            if (!end)
            {
                if (next)
                {
                    range.selectNodeContents(next);
                    range.collapse(true);
                }
                else
                {
                    this._restoreInject(range, start);
                }
            }
            else if (next && next.id === 'selection-marker-end')
            {
                this._restoreInject(range, start);
            }
            else
            {
                if (prev && next)
                {
                    range.selectNodeContents(prev);
                    range.collapse(false);
                    range.setStart(next, 0);
                }
                else if (prev && !next)
                {
                    range.selectNodeContents(prev);
                    range.collapse(false);
                    range.setStartAfter(start);
                }
                else
                {
                    range.setStartAfter(start);
                    range.setEndBefore(end);
                }
            }

            this.selection.setRange(range);

            if (start) start.parentNode.removeChild(start);
            if (end) end.parentNode.removeChild(end);
        }
    },
    remove: function()
    {
        var start = this.find('start');
        var end = this.find('end');

        if (start) start.parentNode.removeChild(start);
        if (end) end.parentNode.removeChild(end);
    },

    // private
    _getPos: function(pos)
    {
        return (pos === undefined) ? 'start' : pos;
    },
    _restoreInject: function(range, start)
    {
        var textNode = this.utils.createInvisibleChar();
        $R.dom(start).after(textNode);

        range.selectNodeContents(textNode);
        range.collapse(false);
    }
});
$R.add('service', 'component', {
    init: function(app)
    {
        this.app = app;

        // local
        this.activeClass = 'redactor-component-active';
    },
    create: function(type, el)
    {
        return $R.create(type + '.component', this.app, el);
    },
    build: function(el)
    {
        var $el = $R.dom(el);
        var component;
        var type = $el.attr('data-redactor-type');
        if (type)
        {
            component = this.create(type, el);
        }

        return (component) ? component : el;
    },
    remove: function(el, caret)
    {
        var $component = $R.dom(el).closest('.redactor-component');
        var type = $component.attr('data-redactor-type');
        var current = $component.parent();
        var data = this.inspector.parse(current);
        var prev = this.utils.findSiblings($component, 'prev');
        var next = this.utils.findSiblings($component, 'next');
        var stop = this.app.broadcast(type + '.delete', $component);
        if (stop !== false)
        {
            $component.remove();

            // callback
            this.app.broadcast(type + '.deleted', $component);
            this.app.broadcast('contextbar.close');
            this.app.broadcast('imageresizer.stop');

            if (caret !== false)
            {
                var cell = data.getTableCell();
                if (cell && this.utils.isEmptyHtml(cell.innerHTML))
                {
                    this.caret.setStart(cell);
                }
                else if (next) this.caret.setStart(next);
                else if (prev) this.caret.setEnd(prev);
                else
                {
                    this.editor.startFocus();
                }
            }

            // is empty
            if (this.editor.isEmpty())
            {
                this.editor.setEmpty();
                this.editor.startFocus();
                this.app.broadcast('empty');
            }
        }
    },
    isNonEditable: function(el)
    {
        var data = this.inspector.parse(el);
        return (data.isComponent() && !data.isComponentEditable());
    },
    isActive: function(el)
    {
        var $component;
        if (el)
        {
            var data = this.inspector.parse(el);
            $component = $R.dom(data.getComponent());

            return $component.hasClass(this.activeClass);
        }
        else
        {
            $component = this._find();

            return ($component.length !== 0);
        }
    },
    getActive: function(dom)
    {
        var $component = this._find();

        return ($component.length !== 0) ? ((dom) ? $component : $component.get()) : false;
    },
    setActive: function(el)
    {
        this.clearActive();
        this.editor.focus();

        var data = this.inspector.parse(el);
        var component = data.getComponent();
        var $component = $R.dom(component);

        if (!data.isFigcaption())
        {
            var $caret = $component.find('.redactor-component-caret');
            if ($caret.length === 0)
            {
                $caret = this._buildCaret();
                $component.prepend($caret);
            }

            this.caret.setAtStart($caret.get());
        }

        $component.addClass(this.activeClass);
    },
    clearActive: function()
    {
        var $component = this._find();

        $component.removeClass(this.activeClass);
        $component.find('.redactor-component-caret').remove();

        this.app.broadcast('imageresizer.stop');
    },
    setOnEvent: function(e, contextmenu)
    {
        this.clearActive();

        var data = this.inspector.parse(e.target);
        if (data.isFigcaption() || data.isComponentEditable())
        {
            return;
        }

        // component
        if (data.isComponent())
        {
            this.setActive(e.target);
            if (contextmenu !== true) e.preventDefault();
        }
    },
    executeScripts: function()
    {
        var $editor = this.editor.getElement();
        var scripts = $editor.find('[data-redactor-type]').find("script").getAll();

        for (var i = 0; i < scripts.length; i++)
        {
            if (scripts[i].src !== '')
            {
                var src = scripts[i].src;
                this.$doc.find('head script[src="' + src + '"]').remove();

                var $script = $R.dom('<script>');
                $script.attr('src', src);
                $script.attr('async defer');

                if (src.search('instagram') !== -1) $script.attr('onload', 'window.instgrm.Embeds.process()');

                var head = document.getElementsByTagName('head')[0];
                if (head) head.appendChild($script.get());
            }
            else
            {
                eval(scripts[i].innerHTML);
            }
        }
    },

    // private
    _find: function()
    {
        return this.editor.getElement().find('.' + this.activeClass);
    },
    _buildCaret: function()
    {
        var $caret = $R.dom('<span>');
        $caret.addClass('redactor-component-caret');
        $caret.attr('contenteditable', true);

        return $caret;
    }
});
$R.add('service', 'insertion', {
    init: function(app)
    {
        this.app = app;
    },
    set: function(html, clean, focus)
    {
        html = (clean !== false) ? this.cleaner.input(html) : html;
        html = (clean !== false) ? this.cleaner.paragraphize(html) : html;

        // set html
        var $editor = this.editor.getElement();
        $editor.html(html);

        // set focus at the end
        if (focus !== false) this.editor.endFocus();

        return html;
    },
    insertNode: function(node, caret)
    {
        this.editor.focus();
        var fragment = (this.utils.isFragment(node)) ? node : this.utils.createFragment(node);

        this._collapseSelection();
        this._insertFragment(fragment);
        this._setCaret(caret, fragment);

        return this._sendNodes(fragment.nodes);
    },
    insertBreakLine: function()
    {
        return this.insertNode(document.createElement('br'), 'after');
    },
    insertNewline: function()
    {
        return this.insertNode(document.createTextNode('\n'), 'after');
    },
    insertText: function(text)
    {
        return this.insertHtml(this.cleaner.getFlatText(text));
    },
    insertChar: function(charhtml)
    {
        return this.insertNode(charhtml, 'after');
    },
    insertRaw: function(html)
    {
        return this.insertHtml(html, false);
    },
    insertToEnd: function(lastNode, type)
    {
        if (!lastNode) return;
        if (lastNode.nodeType === 3 && lastNode.nodeValue.search(/^\n/) !== -1)
        {
            lastNode = lastNode.previousElementSibling;
        }

        var $lastNode = $R.dom(lastNode);
        if ($lastNode.attr('data-redactor-type') === type)
        {
            var tag = (this.opts.breakline) ? '<br>' : '<p>';
            var $newNode = $R.dom(tag);

            $lastNode.after($newNode);
            this.caret.setStart($newNode);
        }
    },
    insertPoint: function(e)
    {
        var range, data;
        var marker = this.marker.build('start');
        var markerInserted = false;
        var x = e.clientX, y = e.clientY;

        if (document.caretPositionFromPoint)
        {
            var pos = document.caretPositionFromPoint(x, y);
            var sel = document.getSelection();

            data = this.inspector.parse(pos.offsetNode);
            if (data.isInEditor())
            {
                range = sel.getRangeAt(0);
                range.setStart(pos.offsetNode, pos.offset);
                range.collapse(true);
                range.insertNode(marker);
                markerInserted = true;
            }
        }
        else if (document.caretRangeFromPoint)
        {
            range = document.caretRangeFromPoint(x, y);

            data = this.inspector.parse(range.startContainer);
            if (data.isInEditor())
            {
                range.insertNode(marker);
                markerInserted = true;
            }
        }

        return markerInserted;
    },
    insertToPoint: function(e, html, point)
    {
        var pointInserted = (point === true) ? true : this.insertPoint(e);
        if (!pointInserted)
        {
            var lastNode = this.editor.getLastNode();
            $R.dom(lastNode).after(this.marker.build('start'));
        }

        this.component.clearActive();
        this.selection.restoreMarkers();

        return this.insertHtml(html);
    },
    insertToOffset: function(start, html)
    {
        this.offset.set({ start: start, end: start });

        return this.insertHtml(html);
    },
    insertHtml: function(html, clean)
    {
        if (!this.opts.input) return;

        // parse
        var parsedInput = this.utils.parseHtml(html);

        // all selection
        if (this.selection.isAll())
        {
            return this._insertToAllSelected(parsedInput);
        }

        // there is no selection
        if (!this.selection.is())
        {
            var $el = $R.dom('<p>');
            var $editor = this.editor.getElement();

            $editor.append($el);
            this.caret.setStart($el);
        }

        // environment
        var isCollapsed = this.selection.isCollapsed();
        var isText = this.selection.isText();
        var current = this.selection.getCurrent();
        var dataCurrent = this.inspector.parse(current);

        // collapse air
        this._collapseSelection();

        // clean
        parsedInput = this._getCleanedInput(parsedInput, dataCurrent, clean);

        // input is figure or component span
        var isFigure = this._isFigure(parsedInput.html);
        var isComponentSpan = this._isComponentSpan(parsedInput.html);
        var isInsertedText = this.inspector.isText(parsedInput.html);
        var fragment, except;

        // empty editor
        if (this.editor.isEmpty())
        {
            return this._insertToEmptyEditor(parsedInput.html);
        }
        // to component
        else if (dataCurrent.isComponent() && !dataCurrent.isComponentEditable())
        {
            return this._insertToWidget(current, dataCurrent, parsedInput.html);
        }
        // component span
        else if (isComponentSpan)
        {
            return this.insertNode(parsedInput.nodes, 'end');
        }
        // inserting figure & split node
        else if (isFigure && !isText && !dataCurrent.isList())
        {
            if (dataCurrent.isInline())
            {
                return this._insertToInline(current, parsedInput);
            }

            fragment = this.utils.createFragment(parsedInput.html);

            this.utils.splitNode(current, fragment);
            this.caret.setEnd(fragment.last);

            return this._sendNodes(fragment.nodes);
        }
        // to code
        else if (dataCurrent.isCode())
        {
            return this._insertToCode(parsedInput, current, clean);
        }
        // to pre
        else if (dataCurrent.isPre())
        {
            return this._insertToPre(parsedInput, clean);
        }
        // to h1-h6 & figcaption
        else if (dataCurrent.isHeading() || dataCurrent.isFigcaption())
        {
            parsedInput.html = (clean !== false) ? this.cleaner.removeTagsExcept(parsedInput.html, ['a']) : parsedInput.html;
            parsedInput.html = (clean !== false) ? this.cleaner.replaceNbspToSpaces(parsedInput.html) : parsedInput.html;

            fragment = this.utils.createFragment(parsedInput.html);

            return this.insertNode(fragment, 'end');
        }
        // text inserting
        else if (isInsertedText)
        {
            if (!isText && this.opts.markup !== 'br' && this._hasBlocksAndImages(parsedInput.nodes))
            {
                parsedInput.html = (clean !== false) ? this.cleaner.paragraphize(parsedInput.html) : parsedInput.html;

                fragment = this.utils.createFragment(parsedInput.html);

                this.utils.splitNode(current, fragment);
                this.caret.setEnd(fragment.last);

                return this._sendNodes(fragment.nodes);
            }

            parsedInput.html = (clean !== false) ? parsedInput.html.replace(/\n/g, '<br>') : parsedInput.html;
            fragment = this.utils.createFragment(parsedInput.html);

            return this.insertNode(fragment.nodes, 'end');
        }
        // uncollapsed
        else if (!isCollapsed && !isFigure)
        {
            parsedInput.html = (clean !== false) ? this.cleaner.paragraphize(parsedInput.html) : parsedInput.html;

            fragment = this.utils.createFragment(parsedInput.html);

            return this.insertNode(fragment, 'end');
        }
        // to inline tag
        else if (dataCurrent.isInline() && !this._isPlainHtml(parsedInput.html))
        {
            return this._insertToInline(current, parsedInput);
        }
        // to blockquote or dt, dd
        else if (dataCurrent.isBlockquote() || dataCurrent.isDl())
        {
            except = this.opts.inlineTags;
            except.concat(['br']);

            parsedInput.html = (clean !== false) ? this.cleaner.replaceBlocksToBr(parsedInput.html) : parsedInput.html;
            parsedInput.html = (clean !== false) ? this.cleaner.removeTagsExcept(parsedInput.html, except) : parsedInput.html;

            fragment = this.utils.createFragment(parsedInput.html);

            return this.insertNode(fragment, 'end');
        }
        // to p
        else if (dataCurrent.isParagraph())
        {
            if (this._isPlainHtml(parsedInput.html))
            {
                return this.insertNode(parsedInput.nodes, 'end');
            }

            parsedInput.html = (clean !== false) ? this.cleaner.paragraphize(parsedInput.html) : parsedInput.html;

            fragment = this.utils.createFragment(parsedInput.html);

            this.utils.splitNode(current, fragment);
            this.caret.setEnd(fragment.last);

            return this._sendNodes(fragment.nodes);
        }
        // to li
        else if (dataCurrent.isList())
        {
            except = this.opts.inlineTags;
            except = except.concat(['br', 'li', 'ul', 'ol', 'img']);

            parsedInput.html = (clean !== false) ? this.cleaner.replaceBlocksToBr(parsedInput.html) : parsedInput.html;
            parsedInput.html = (clean !== false) ? this.cleaner.removeTagsExcept(parsedInput.html, except) : parsedInput.html;
            parsedInput.html = (clean !== false) ? this.cleaner.removeBrAtEnd(parsedInput.html) : parsedInput.html;

            fragment = this.utils.createFragment(parsedInput.html);
            parsedInput.nodes = fragment.nodes;

            if (this._containsTags(parsedInput.html, ['ul', 'ol', 'li']))
            {
                var element = this.selection.getElement(current);
                if (element && element.tagName === 'LI' && this.caret.isStart(element))
                {
                    parsedInput.nodes = $R.dom(fragment.nodes).unwrap('ul, ol').getAll();
                    $R.dom(element).before(parsedInput.nodes);

                    var lastNode = parsedInput.nodes[parsedInput.nodes.length-1];
                    this.caret.setEnd(lastNode);

                    return this._sendNodes(parsedInput.nodes);
                }
                else if (this._isPlainHtml(parsedInput.html))
                {
                    return this.insertNode(fragment, 'end');
                }
                else
                {
                    fragment = this._buildList(parsedInput, element, fragment);

                    this.utils.splitNode(current, fragment, true);
                    this.caret.setEnd(fragment.last);

                    return this._sendNodes(fragment.nodes);
                }
            }
        }

        // other cases
        return this.insertNode(parsedInput.nodes, 'end');
    },

    // private
    _insertToAllSelected: function(parsedInput)
    {
        var insertedHtml = this.set(parsedInput.html);
        var dataInserted = this.utils.parseHtml(insertedHtml);

        return this._sendNodes(dataInserted.nodes);
    },
    _insertToEmptyEditor: function(html)
    {
        html = this.cleaner.paragraphize(html);

        var fragment = this.utils.createFragment(html);
        var $editor = this.editor.getElement();

        $editor.html('');
        $editor.append(fragment.frag);

        this.caret.setEnd($editor);

        return this._sendNodes(fragment.nodes);
    },
    _insertToInline: function(current, parsedInput)
    {
        var fragment = this.utils.createFragment(parsedInput.html);
        this.utils.splitNode(current, fragment, false, true);
        this.caret.setEnd(fragment.last);

        return this._sendNodes(fragment.nodes);
    },
    _insertToCode: function(parsedInput, current, clean)
    {
        parsedInput.html = (clean !== false) ? this.cleaner.encodeHtml(parsedInput.html) : parsedInput.html;
        parsedInput.html = (clean !== false) ? this.cleaner.removeNl(parsedInput.html) : parsedInput.html;

        var fragment = this.utils.createFragment(parsedInput.html);
        var nodes = this.insertNode(fragment, 'end');

        this.utils.normalizeTextNodes(current);

        return nodes;
    },
    _insertToPre: function(parsedInput, clean)
    {
        parsedInput.html = (clean !== false) ? this.cleaner.encodeHtml(parsedInput.html) : parsedInput.html;

        var fragment = this.utils.createFragment(parsedInput.html);

        return this.insertNode(fragment, 'end');
    },
    _insertToWidget: function(current, dataCurrent, html)
    {
        html = (this._isComponentSpan(html)) ? html : this.cleaner.paragraphize(html);

        var fragment = this.utils.createFragment(html);
        var component = dataCurrent.getComponent();
        var $component = $R.dom(component);

        $component.after(fragment.frag);
        $component.remove();

        this.caret.setEnd(fragment.last);

        return this._sendNodes(fragment.nodes);
    },
    _insertFragment: function(fragment)
    {
        var range = this.selection.getRange();
        if (range)
        {
            if (this.selection.isCollapsed())
            {
                var startNode = range.startContainer;
                if (startNode.nodeType !== 3 && startNode.tagName === 'BR')
                {
                    this.caret.setAfter(startNode);
                    startNode.parentNode.removeChild(startNode);
                }
            }
            else
            {
                range.deleteContents();
            }

            range.insertNode(fragment.frag);
        }
    },
    _sendNodes: function(nodes)
    {
        for (var i = 0; i < nodes.length; i++)
        {
            var el = nodes[i];
            var type = (el.nodeType !== 3 && typeof el.getAttribute === 'function') ? el.getAttribute('data-redactor-type') : false;
            if (type)
            {
                this.app.broadcast(type + '.inserted', this.component.build(el));
            }
        }

        // callback
        this.app.broadcast('inserted', nodes);

        // widget's scripts
        this.component.executeScripts();

        return nodes;
    },
    _setCaret: function(caret, fragment)
    {
        var isLastInline = this._isLastInline(fragment);

        if (caret)
        {
            caret = (isLastInline && caret === 'end') ? 'after' : caret;
            this.caret['set' + this.utils.ucfirst(caret)](fragment.last);
        }
        else if (caret !== false)
        {
            if (isLastInline) this.caret.setAfter(fragment.last);
        }
    },
    _isLastInline: function(fragment)
    {
        if (fragment.last)
        {
            var data = this.inspector.parse(fragment.last);

            return data.isInline();
        }

        return false;
    },
    _getCleanedInput: function(parsedInput, dataCurrent, clean)
    {
        var isPreformatted = (dataCurrent.isCode() || dataCurrent.isPre());

        parsedInput.html = (!isPreformatted && clean !== false) ? this.cleaner.input(parsedInput.html) : parsedInput.html;
        parsedInput = (!isPreformatted && clean !== false) ? this.utils.parseHtml(parsedInput.html) : parsedInput;

        return parsedInput;
    },
    _getContainer: function(nodes)
    {
        return $R.dom(this.utils.createTmpContainer(nodes));
    },
    _buildList: function(parsedInput, list, fragment)
    {
        var nodes = parsedInput.nodes;
        var first = nodes[0];

        if (first && first.nodeType !== 3 && first.tagName === 'li')
        {
            var $parent = $R.dom(list);
            var parentListTag = $parent.get().tagName.toLowerCase();
            var $list = $R.dom('<' + parentListTag + ' />');
            $list.append(fragment.nodes);

            return this.utils.createFragment($list.get().outerHTML);
        }

        return fragment;
    },
    _containsTags: function(html, tags)
    {
        return (this._getContainer(html).find(tags.join(',')).length !== 0);
    },
    _collapseSelection: function()
    {
        //if (this.app.isAirToolbar()) this.selection.collapseToEnd();
    },
    _hasFigureOrTable: function(nodes)
    {
        return (this._getContainer(nodes).find('figure, table').length !== 0);
    },
    _hasBlocks: function(nodes)
    {
        return (this._getContainer(nodes).find(this.opts.blockTags.join(',')).length !== 0);
    },
    _hasBlocksAndImages: function(nodes)
    {
        return (this._getContainer(nodes).find(this.opts.blockTags.join(',') + ',img').length !== 0);
    },
    _isPlainHtml: function(html)
    {
        return (this._getContainer(html).find(this.opts.blockTags.join(',') + ', img').length === 0);
    },
    _isFigure: function(html)
    {
        if (this._isHtmlString(html))
        {
            return ($R.dom(html).closest('figure').length !== 0);
        }
    },
    _isComponentSpan: function(html)
    {
        if (this._isHtmlString(html))
        {
            return ($R.dom(html).closest('span.redactor-component').length !== 0);
        }
    },
    _isHtmlString: function(html)
    {
        return !(typeof html === 'string' && !/^\s*<(\w+|!)[^>]*>/.test(html));
    }
});
$R.add('service', 'block', {
    mixins: ['formatter'],
    init: function(app)
    {
        this.app = app;
    },
    // public
    format: function(args)
    {
        // type of applying styles and attributes
        this.type = (args.type) ? args.type : 'set'; // add, remove, toggle

        // tag
        this.tag = (typeof args === 'string') ? args : args.tag;
        this.tag = this._prepareTag(this.tag);
        this.tag = this.tag.toLowerCase();

        if (typeof args === 'string') this.args = false;
        else this.buildArgs(args);

        // format
        return this._format();
    },
    getBlocks: function(tags)
    {
        return this.selection.getBlocks({ tags: tags || this._getTags(), first: true });
    },
    getElements: function(tags)
    {
        var block = this.selection.getBlock();
        if (!this.selection.isCollapsed() && block && (block.tagName === 'TD' || block.tagName === 'TH'))
        {
            return this._wrapInsideTable('div');
        }
        else
        {
            return $R.dom(this.getBlocks(tags));
        }
    },
    clearFormat: function(tags)
	{
		this.selection.save();

        var $elements = this.getElements(tags || this._getTags());
        $elements.each(function(node)
        {
            while(node.attributes.length > 0)
            {
                node.removeAttribute(node.attributes[0].name);
            }
        });

		this.selection.restore();

        return $elements.getAll();
	},

    // private
    _format: function()
    {
        this.selection.save();
        var blocks = this.getBlocks();
        var block = this.selection.getBlock();
        var nodes = [];
        var data, replacedTag, $wrapper, nextBr;

        // div break format
        if (blocks.length === 1 && blocks[0].tagName === 'DIV')
        {
            data = this._getTextNodesData();
            if (!data || data.nodes.length === 0)
            {
                nodes = this._replaceBlocks(blocks);
                nodes = this._sendNodes(nodes);

                setTimeout(function() { this.selection.restore(); }.bind(this), 0);

                return nodes;
            }

            replacedTag = this._getReplacedTag('set');
            $wrapper = $R.dom('<' + replacedTag + '>');

            nextBr = data.last.nextSibling;
            if (nextBr && nextBr.tagName === 'BR')
            {
                $R.dom(nextBr).remove();
            }

            for (var i = 0; i < data.nodes.length; i++)
            {
                $wrapper.append(data.nodes[i]);
            }

            this.utils.splitNode(blocks[0], [$wrapper.get()]);
            nodes = this._sendNodes([$wrapper.get()]);

            if (this.utils.isEmptyHtml($wrapper.html()))
            {
                this.caret.setStart($wrapper);
            }
            else
            {
                setTimeout(function() { this.selection.restore(); }.bind(this), 0);
            }

            return nodes;
        }
        // standard format
        else if (blocks.length > 0)
        {
            nodes = this._replaceBlocks(blocks);
            nodes = this._sendNodes(nodes);

            setTimeout(function() { this.selection.restore(); }.bind(this), 0);

            return nodes;
        }
        // td/th format uncollapsed
        else if (!this.selection.isCollapsed() && block && (block.tagName === 'TD' || block.tagName === 'TH'))
        {
            replacedTag = this._getReplacedTag('set');

            $wrapper = this._wrapInsideTable(replacedTag);

            this.selection.setAll($wrapper);

            return this._sendNodes([$wrapper.get()]);
        }
        // td/th format collapsed
        else if (this.selection.isCollapsed() && block && (block.tagName === 'TD' || block.tagName === 'TH'))
        {
            var textnodes = this._getChildTextNodes(block);

            replacedTag = this._getReplacedTag('set');
            var $wrapper = $R.dom('<' + replacedTag + '>');

            $R.dom(textnodes.first).before($wrapper);

            for (var i = 0; i < textnodes.nodes.length; i++)
            {
                $wrapper.append(textnodes.nodes[i]);
            }

            var nextBr = $wrapper.get().nextSibling;
            if (nextBr && nextBr.tagName === 'BR')
            {
                $R.dom(nextBr).remove();
            }

            return this._sendNodes([$wrapper.get()]);
        }

        return nodes;
    },
    _wrapInsideTable: function(replacedTag)
    {
        var data = this._getTextNodesData();
        var $wrapper = $R.dom('<' + replacedTag + '>');

        $R.dom(data.first).before($wrapper);

        for (var i = 0; i < data.nodes.length; i++)
        {
            $wrapper.append(data.nodes[i]);
        }

        var nextBr = $wrapper.get().nextSibling;
        if (nextBr && nextBr.tagName === 'BR')
        {
            $R.dom(nextBr).remove();
        }

        return $wrapper;
    },
    _prepareTag: function(tag)
    {
        return (typeof tag === 'undefined') ? this.opts.markup : tag;
    },
    _sendNodes: function(nodes)
    {
        if (nodes.length > 0)
        {
            // clean & appliyng styles and attributes
            nodes = this.applyArgs(nodes, false);
            nodes = this._combinePre(nodes);
            nodes = this._cleanBlocks(nodes);
        }

        return nodes;
    },
    _getTags: function()
    {
        return ['div', 'p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    },
    _replaceBlocks: function(blocks)
    {
        var nodes = [];
        var type = (this._isToggleFormatType(blocks)) ? 'toggle' : 'set';
        var replacedTag = this._getReplacedTag(type);

        for (var i = 0; i < blocks.length; i++)
        {
            var $node = this.utils.replaceToTag(blocks[i], replacedTag);
            nodes.push($node.get());
        }

        return nodes;
    },
    _getReplacedTag: function(type)
    {
        var replacedTag = (type === 'toggle') ? this.opts.markup : this.tag;

        return (this.opts.breakline && replacedTag === 'p') ? 'div' : replacedTag;
    },
    _getChildTextNodes: function(el)
    {
        var nodes = el.childNodes;
        var firstNode = nodes[0];
        var finalNodes = [];
        for (var i = 0; i <= nodes.length; i++)
        {
            var node = nodes[i];
            if (node && node.nodeType !== 3 && this.inspector.isBlockTag(node.tagName))
            {
                break;
            }

            finalNodes.push(node);
        }

        return {
            nodes: finalNodes,
            first: firstNode
        };
    },
    _getTextNodesData: function()
    {
        var nodes = this.selection.getNodes({ textnodes: true, keepbr: true });
        if (nodes.length === 0) return false;

        var firstNode = nodes[0];
        var lastNode = nodes[nodes.length-1];
        var node = lastNode;
        var stop = false;

        while (!stop)
        {
            var inline = this.selection.getInline(node);
            node = (inline) ? inline.nextSibling : node.nextSibling;
            if (!node)
            {
                stop = true;
            }
            else if (node.nodeType !== 3 && (node.tagName === 'BR' || this.inspector.isBlockTag(node.tagName)))
            {
                stop = true;
            }
            else
            {
                nodes.push(node);
            }
        }

        return {
            nodes: nodes,
            first: firstNode,
            last: lastNode
        };
    },
    _isToggleFormatType: function(blocks)
    {
        var count = 0;
        var len = blocks.length;
        for (var i = 0; i < len; i++)
        {
            if (blocks[i] && this.tag === blocks[i].tagName.toLowerCase()) count++;
        }

        return (count === len);
    },
    _combinePre: function(nodes)
    {
        var combinedNodes = [];
        for (var i = 0; i < nodes.length; i++)
        {
            var next = nodes[i].nextElementSibling;
            if (next && nodes[i].tagName === 'PRE' && next.tagName === 'PRE')
            {
                var $current = $R.dom(nodes[i]);
                var $next = $R.dom(next);
                var newline = document.createTextNode('\n');

                $current.append(newline);
                $current.append($next);
                $next.unwrap('pre');
            }

            combinedNodes.push(nodes[i]);
        }

        return combinedNodes;
    },
    _cleanBlocks: function(nodes)
    {
        var headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        var tags = this.opts.inlineTags;
        for (var i = 0; i < nodes.length; i++)
        {
            var tag = nodes[i].tagName.toLowerCase();
            var $node = $R.dom(nodes[i]);

            if (headings.indexOf(tag) !== - 1)
            {
                $node.find('span').not('.redactor-component, .non-editable, .redactor-selection-marker').unwrap();
            }
            else if (tag === 'pre')
            {
                $node.find(tags.join(',')).not('.redactor-selection-marker').unwrap();
            }

            // breakline attr
            if (this.opts.breakline && tag === 'div')
            {
                $node.attr('data-redactor-tag', 'br');
            }
            else
            {
                $node.removeAttr('data-redactor-tag');
            }

            this.utils.normalizeTextNodes(nodes[i]);
        }

        return nodes;
    }
});
$R.add('service', 'inline', {
    mixins: ['formatter'],
    init: function(app)
    {
        this.app = app;
    },
    // public
    format: function(args)
    {
        if (!this._isFormat()) return [];

        // type of applying styles and attributes
        this.type = (args.type) ? args.type : 'set'; // add, remove, toggle

        // tag
        this.tag = (typeof args === 'string') ? args : args.tag;
        this.tag = this.tag.toLowerCase();
        this.tag = this.arrangeTag(this.tag);

        if (typeof args === 'string') this.args = false;
        else this.buildArgs(args);

        // format
        var nodes = (this.selection.isCollapsed()) ? this.formatCollapsed() : this.formatUncollapsed();

        return nodes;
    },

    // private
    _isFormat: function()
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var isComponent = (data.isComponent() && !data.isComponentType('table') && !data.isFigcaption());

        if (!current || data.isPre() || data.isCode() || isComponent)
        {
            return false;
        }

        return true;
    },
    arrangeTag: function(tag)
    {
        var replaced = this.opts.replaceTags;
        for (var key in replaced)
        {
            if (tag === key) tag = replaced[key];
        }

        return tag;
    },
    formatCollapsed: function()
    {
        var nodes = [];
        var inline = this.selection.getInlineFirst();
        var inlines = this.selection.getInlines({ all: true });
        var $inline = $R.dom(inline);
        var $parent, parent, $secondPart, extractedContent;

        // 1) not inline
        if (!inline)
        {
            nodes = this.insertInline(nodes);
        }
        else
        {
            var dataInline = this.inspector.parse(inline);
            var isEmpty = this.utils.isEmptyHtml(inline.innerHTML);

            // 2) inline is empty
            if (isEmpty)
            {
                // 2.1) has same tag
                if (inline.tagName.toLowerCase() === this.tag)
                {
                    // 2.1.1) has same args or hasn't args
                    if (this.hasSameArgs(inline))
                    {
                        this.caret.setAfter(inline);
                        $inline.remove();

                        var el = this.selection.getElement();
                        this.utils.normalizeTextNodes(el);
                    }
                    // 2.1.2) has different args and it is span tag
                    else if (this.tag === 'span')
                    {
                        nodes = this.applyArgs([inline], false);
                        this.caret.setStart(inline);
                    }
                    // 2.1.3) has different args and it is not span tag
                    else
                    {
                       nodes = this.insertInline(nodes);
                    }

                }
                // 2.2) has another tag
                else
                {
                    // 2.2.1) has parent
                    if (dataInline.hasParent([this.tag]))
                    {
                        $parent = $inline.closest(this.tag);
                        parent = $parent.get();
                        if (this.hasSameArgs(parent))
                        {
                            $parent.unwrap();
                            this.caret.setStart(inline);
                        }
                        else
                        {
                            nodes = this.insertInline(nodes);
                        }
                    }
                    // 2.2.2) hasn't parent
                    else
                    {
                        nodes = this.insertInline(nodes);
                    }
                }
            }
            // 3) inline isn't empty
            else
            {
                // 3.1) has same tag
                if (inline.tagName.toLowerCase() === this.tag)
                {
                    // 3.1.1) has same args or hasn't args
                    if (this.hasSameArgs(inline))
                    {
                        // insert break
                        extractedContent = this.utils.extractHtmlFromCaret(inline);
                        $secondPart = $R.dom('<' + this.tag + ' />');
                        $secondPart = this.utils.cloneAttributes(inline, $secondPart);

                        $inline.after($secondPart.append(extractedContent));

                        this.caret.setAfter(inline);
                    }
                    else
                    {
                        nodes = this.insertInline(nodes);
                    }
                }
                // 3.2) has another tag
                else
                {
                    // 3.2.1) has parent
                    if (dataInline.hasParent([this.tag]))
                    {
                        $parent = $inline.closest(this.tag);
                        parent = $parent.get();
                        if (this.hasSameArgs(parent))
                        {
                            // insert break
                            extractedContent = this.utils.extractHtmlFromCaret(parent, parent);
                            $secondPart = $R.dom('<' + this.tag + ' />');
                            $secondPart = this.utils.cloneAttributes(parent, $secondPart);

                            var $breaked, $last;
                            var z = 0;
                            inlines = inlines.reverse();
                            for (var i = 0; i < inlines.length; i++)
                            {
                                if (inlines[i] !== parent)
                                {
                                    $last = $R.dom('<' + inlines[i].tagName.toLowerCase() + '>');
                                    if (z === 0)
                                    {
                                        $breaked = $last;
                                    }
                                    else
                                    {
                                        $breaked.append($last);
                                    }

                                    z++;
                                }
                            }

                            $parent.after($secondPart.append(extractedContent));
                            $parent.after($breaked);

                            this.caret.setStart($last);
                        }
                        else
                        {
                            nodes = this.insertInline(nodes);
                        }
                    }
                    // 3.2.2) hasn't parent
                    else
                    {
                        nodes = this.insertInline(nodes);
                    }
                }
            }
        }

        return nodes;
    },
    insertInline: function(nodes)
    {
        var node = document.createElement(this.tag);
        nodes = this.insertion.insertNode(node, 'start');

        return this.applyArgs(nodes, false);
    },
    hasSameArgs: function(inline)
    {
        if (inline.attributes.length === 0 && this.args === false)
        {
            return true;
        }
        else
        {
            var same = true;
            if (this.args)
            {
                var count = 0;
                for (var key in this.args)
                {
                    var $node = $R.dom(inline);
                    var args = (this.args[key]);
                    var value = this.utils.toParams(args);
                    var nodeAttrValue = $node.attr(key);

                    if (args)
                    {
                        if (key === 'style')
                        {
                            value = value.trim().replace(/;$/, '');

                            var origRules = this.utils.styleToObj($node.attr('style'));
                            var rules = value.split(';');
                            var innerCount = 0;

                            for (var i = 0; i < rules.length; i++)
                            {
                                var arr = rules[i].split(':');
                                var ruleName = arr[0].trim();
                                var ruleValue = arr[1].trim();

                                if (ruleName.search(/color/) !== -1)
                                {
                                    var val = $node.css(ruleName);
                                    if (val && (val === ruleValue || this.utils.rgb2hex(val) === ruleValue))
                                    {
                                        innerCount++;
                                    }
                                }
                                else if ($node.css(ruleName) === ruleValue)
                                {
                                    innerCount++;
                                }
                            }

                            if (innerCount === rules.length && Object.keys(origRules).length === rules.length)
                            {
                                count++;
                            }
                        }
                        else
                        {
                            if (nodeAttrValue === value)
                            {
                                count++;
                            }
                        }
                    }
                    else
                    {
                        if (!nodeAttrValue || nodeAttrValue === '')
                        {
                            count++;
                        }
                    }
                }

                same = (count === Object.keys(this.args).length);
            }

            return same;
        }
    },
    formatUncollapsed: function()
    {
        var inlines = this.selection.getInlines({ all: true, inside: true });

        this.selection.save();

        // convert del / u
        this._convertTags('u');
        this._convertTags('del');

        // convert target tags
        this._convertToStrike(inlines);

        this.selection.restore();

        // apply strike
        document.execCommand('strikethrough');

        // clear decoration
        this._clearDecoration();

        this.selection.save();

        // revert and set style
        var nodes = this._revertToInlines();
        nodes = this.applyArgs(nodes, false);

        // unwrap if attributes was removed
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            var tag = node.tagName.toLowerCase();
            var len = node.attributes.length;

            if (tag === this.tag && len === 0 && this.args)
            {
                $R.dom(node).unwrap();
                nodes.splice(i, 1);
            }
        }

        this.selection.restore();

        // clear and normalize
        this._clearEmptyStyle();
        nodes = this._normalizeBlocks(nodes);

        return nodes;
    },
    _convertTags: function(tag)
    {
        if (this.tag !== tag)
        {
            var $editor = this.editor.getElement();
            $editor.find(tag).each(function(node)
            {
                var $el = this.utils.replaceToTag(node, 'span');
                $el.addClass('redactor-convertable-' + tag);
            }.bind(this));
        }
    },
    _revertTags: function(tag)
    {
        var $editor = this.editor.getElement();

        $editor.find('span.redactor-convertable-' + tag).each(function(node)
        {
            var $el = this.utils.replaceToTag(node, tag);
            $el.removeClass('redactor-convertable-' + tag);
            if (this.utils.removeEmptyAttr($el, 'class')) $el.removeAttr('class');

        }.bind(this));
    },
    _convertToStrike: function(inlines)
    {
        var selected = this.selection.getText().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

        for (var i = 0; i < inlines.length; i++)
        {
            var tag = this.arrangeTag(inlines[i].tagName.toLowerCase());
            var inline = inlines[i];
            var $inline = $R.dom(inline);
            var hasSameArgs = this.hasSameArgs(inline);

            if (tag === this.tag)
            {
                if (this.tag === 'span' && this._isTextSelected(inline, selected))
                {
                    $inline.addClass('redactor-convertable-apply');
                }
                else if (hasSameArgs)
                {
                    this._replaceToStrike($inline);
                }
                else if (this.tag === 'span')
                {
                    $inline.addClass('redactor-unconvertable-apply');
                }
                else if (!hasSameArgs)
                {
                    $inline.addClass('redactor-convertable-apply');
                }
            }
        }
    },
    _replaceToStrike: function($el)
    {
        $el.replaceWith(function()
        {
            return $R.dom('<strike>').append($el.contents());
        });
    },
    _revertToInlines: function()
    {
        var nodes = [];
        var $editor = this.editor.getElement();

        if (this.tag !== 'u') $editor.find('u').unwrap();

        // span convertable
        $editor.find('.redactor-convertable-apply').each(function(node)
        {
            var $node = $R.dom(node);
            $node.find('strike').unwrap();

            this._forceRemoveClass($node, 'redactor-convertable-apply');
            nodes.push(node);

        }.bind(this));

        // span unconvertable
        $editor.find('span.redactor-unconvertable-apply').each(function(node)
        {
            var $node = $R.dom(node);
            this._forceRemoveClass($node, 'redactor-unconvertable-apply');

        }.bind(this));

        // strike
        $editor.find('strike').each(function(node)
        {
            var $node = this.utils.replaceToTag(node, this.tag);
            nodes.push($node.get());

        }.bind(this));


        this._revertTags('u');
        this._revertTags('del');

        return nodes;
    },
    _normalizeBlocks: function(nodes)
    {
        var tags = this.opts.inlineTags;
        var blocks = this.selection.getBlocks();
        if (blocks)
        {
            for (var i = 0; i < blocks.length; i++)
            {
                if (blocks[i].tagName === 'PRE')
                {
                    var $node = $R.dom(blocks[i]);
                    $node.find(tags.join(',')).not('.redactor-selection-marker').each(function(inline)
                    {
                        if (nodes.indexOf(inline) !== -1)
                        {
                            nodes = this.utils.removeFromArrayByValue(nodes, inline);
                        }

                        $R.dom(inline).unwrap();
                    }.bind(this));
                }
            }
        }

        return nodes;
    },
    _clearDecoration: function()
    {
        var $editor = this.editor.getElement();
        $editor.find(this.opts.inlineTags.join(',')).each(function(node)
        {
            if (node.style.textDecoration === 'line-through' || node.style.textDecorationLine === 'line-through')
            {
                var $el = $R.dom(node);
                $el.css('textDecorationLine', '');
                $el.css('textDecoration', '');
                $el.wrap('<strike>');
            }
        });
    },
    _clearEmptyStyle: function()
    {
        var inlines = this.getInlines();
        for (var i = 0; i < inlines.length; i++)
        {
            this._clearEmptyStyleAttr(inlines[i]);

            var childNodes = inlines[i].childNodes;
            if (childNodes)
            {
                for (var z = 0; z < childNodes.length; z++)
                {
                    this._clearEmptyStyleAttr(childNodes[z]);
                }
            }
        }
    },
    _clearEmptyStyleAttr: function(node)
    {
        if (node.nodeType !== 3 && this.utils.removeEmptyAttr(node, 'style'))
        {
            node.removeAttribute('style');
            node.removeAttribute('data-redactor-style-cache');
        }
    },
    _forceRemoveClass: function($node, classname)
    {
        $node.removeClass(classname);
        if (this.utils.removeEmptyAttr($node, 'class')) $node.removeAttr('class');
    },
    _isTextSelected: function(node, selected)
    {
        var text = this.utils.removeInvisibleChars(node.textContent);

        return (selected === text || selected.search(new RegExp('^' + this.utils.escapeRegExp(text) + '$')) !== -1);
    },

    getInlines: function(tags)
    {
        return (tags) ? this.selection.getInlines({ tags: tags, all: true }) : this.selection.getInlines({ all: true });
    },
    getElements: function(tags)
    {
        return $R.dom(this.getInlines(tags));
    },
    clearFormat: function()
    {
        this.selection.save();

        var nodes = this.selection.getInlines({ all: true });
        for (var i = 0; i < nodes.length; i++)
        {
            var $el = $R.dom(nodes[i]);
            var inline = this.selection.getInline(nodes[i]);
            if (inline)
            {
                $el.unwrap();
            }
        }

        this.selection.restore();
    }
});
$R.add('service', 'autoparser', {
    init: function(app)
    {
        this.app = app;
    },
    observe: function()
    {
        var $editor = this.editor.getElement();
        var $objects = $editor.find('.redactor-autoparser-object').each(function(node)
        {
           var $node = $R.dom(node);
           $node.removeClass('redactor-autoparser-object');
           if ($node.attr('class') === '') $node.removeAttr('class');
        });

        if ($objects.length > 0)
        {
            $objects.each(function(node)
            {
                var type;
                var $object = false;
                var tag = node.tagName;

                if (tag === 'A') type = 'link';
                else if (tag === 'IMG') type = 'image';
                else if (tag === 'IFRAME') type = 'video';

                if (type)
                {
                    $object = $R.create(type + '.component', this.app, node);
                    this.app.broadcast(type + '.inserted', $object);
                    this.app.broadcast('autoparse', type, $object);
                }

            }.bind(this));
        }
    },
    format: function(e, key)
    {
        if (this._isKey(key))
        {
            this._format(key === this.keycodes.ENTER);
        }
    },
    parse: function(html)
    {
        var tags = ['figure', 'pre', 'iframe', 'code', 'a', 'img'];
        var stored = [];
        var z = 0;

        // encode
        html = this.cleaner.encodePreCode(html);

        // store tags
        for (var i = 0; i < tags.length; i++)
        {
            var reTags = (tags[i] === 'img') ? '<' + tags[i] + '[^>]*>' : '<' + tags[i] + '([\\w\\W]*?)</' + tags[i] + '>';
            var matched = html.match(new RegExp(reTags, 'gi'));

            if (matched !== null)
            {
                for (var y = 0; y < matched.length; y++)
                {
                    html = html.replace(matched[y], '#####replaceparse' + z + '#####');
                    stored.push(matched[y]);
                    z++;
                }
            }
        }

        // images
        if (this.opts.autoparseImages && html.match(this.opts.regex.imageurl))
        {
            var imagesMatches = html.match(this.opts.regex.imageurl);
            for (var i = 0; i < imagesMatches.length; i++)
            {
                html = html.replace(imagesMatches[i], '<img class="redactor-autoparser-object" src="' + imagesMatches[i] + '">');
            }
        }

        // video
        if (this.opts.autoparseVideo && (html.match(this.opts.regex.youtube) || html.match(this.opts.regex.vimeo)))
        {
            var iframeStart = '<iframe width="500" height="281" src="';
            var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';

            var str, re;
            if (html.match(this.opts.regex.youtube))
            {
                str = '//www.youtube.com/embed/$1';
                re = this.opts.regex.youtube;
            }
            else if (html.match(this.opts.regex.vimeo))
            {
                str = '//player.vimeo.com/video/$2';
                re = this.opts.regex.vimeo;
            }

            var $video = this.component.create('video', iframeStart + str + iframeEnd);

            html = html.replace(re, $video.get().outerHTML);
        }

        // links
        if (this.opts.autoparseLinks && html.match(this.opts.regex.url))
        {
            html = this._formatLinks(html);
        }

        // restore
        html = this._restoreReplaced(stored, html);

        // repeat for nested tags
        html = this._restoreReplaced(stored, html);

        return html;
    },

    // private
    _isKey: function(key)
    {
        return (key === this.keycodes.ENTER || key === this.keycodes.SPACE);
    },
    _format: function(enter)
    {
        var parent = this.selection.getParent();
        var $parent = $R.dom(parent);

        var isNotFormatted = (parent && $parent.closest('figure, pre, code, img, a, iframe').length !== 0);
        if (isNotFormatted || !this.selection.isCollapsed())
        {
            return;
        }

        // add split marker
        var marker = this.utils.createInvisibleChar();
        var range = this.selection.getRange();
        range.insertNode(marker);

        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var $current = $R.dom(current);

        // remove split marker
        marker.parentNode.removeChild(marker);

        if (current && current.nodeType === 3)
        {
            var content = current.textContent;
            var type;

            // images
            if (this.opts.autoparseImages && content.match(this._convertToRegExp(this.opts.regex.imageurl)))
            {
                var isList = data.isList();
                var matches = content.match(this.opts.regex.imageurl);
                var el = (isList) ? undefined : '<figure><img></figure>';

                var $img = this.component.create('image', el);
                $img.setSrc(matches[0]);
                $img.addClass('redactor-autoparser-object');

                content = content.replace(matches[0], $img.get().outerHTML);
                type = 'image';
            }
            // video
            else if (this.opts.autoparseVideo && (content.match(this._convertToRegExp(this.opts.regex.youtube)) || content.match(this._convertToRegExp(this.opts.regex.vimeo))))
            {
                var iframeStart = '<iframe width="500" height="281" src="';
                var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';
                var str, re;

                if (content.match(this.opts.regex.youtube))
                {
                    str = '//www.youtube.com/embed/$1';
                    re = this.opts.regex.youtube;
                }
                else if (content.match(this.opts.regex.vimeo))
                {
                    str = '//player.vimeo.com/video/$2';
                    re = this.opts.regex.vimeo;
                }

                var $video = this.component.create('video', iframeStart + str + iframeEnd);
                $video.addClass('redactor-autoparser-object');

                content = content.replace(re, $video.get().outerHTML);
                type = 'video';
            }
            // links
            else if (this.opts.autoparseLinks && content.match(this._convertToRegExp(this.opts.regex.url)))
            {
                content = this._formatLinks(content, enter);
                type = 'link';
            }

            // replace
            if (type)
            {
                if (enter)
                {
                    this.selection.save();
                    $current.replaceWith(content);
                    this.selection.restore();
                }
                else
                {
                    $current.replaceWith(content);
                }

                // object
                var $editor = this.editor.getElement();
                var $object = $editor.find('.redactor-autoparser-object').removeClass('redactor-autoparser-object');
                $object = (type === 'link') ? $R.create('link.component', this.app, $object) : $object;

                // caret
                if (type === 'link')
                {
                    if (!enter) this.caret.setAfter($object);
                    this.app.broadcast('link.inserted', $object);
                }
                else
                {
                    this.caret.setAfter($object);

                    var $cloned = $object.clone();
                    $object.remove();
                    $object = this.insertion.insertHtml($cloned);
                    $object = this.component.build($object);
                }

                // callback
                this.app.broadcast('autoparse', type, $object);
            }
        }
    },
    _formatLinks: function(content, enter)
    {
        var matches = content.match(this.opts.regex.url);
        var obj = {};
        for (var i = 0; i < matches.length; i++)
        {
            if (enter && matches[i].search(/\.$/) !== -1)
            {
                matches[i] = matches[i].replace(/\.$/, '');
            }

            var href = matches[i], text = href;
            var linkProtocol = (href.match(/(https?|ftp):\/\//i) !== null) ? '' : 'http://';
            var regexB = (["/", "&", "="].indexOf(href.slice(-1)) !== -1) ? "" : "\\b";
            var target = (this.opts.pasteLinkTarget !== false) ? ' target="' + this.opts.pasteLinkTarget + '"' : '';

            text = (text.length > this.opts.linkSize) ? text.substring(0, this.opts.linkSize) + '...' : text;
            text = (text.search('%') === -1) ? decodeURIComponent(text) : text;

            // escaping url
            var regexp = '(' + href.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + regexB + ')';
            var classstr = ' class="redactor-autoparser-object"';

            obj[regexp] = '<a href="' + linkProtocol + href.trim() + '"' + target + classstr + '>' + text.trim() + '</a>';
        }

        // replace
        for (var key in obj)
        {
            content = content.replace(new RegExp(key, 'g'), obj[key]);
        }

        return content;
    },
    _restoreReplaced: function(stored, html)
    {
        for (var i = 0; i < stored.length; i++)
        {
            html = html.replace('#####replaceparse' + i + '#####', stored[i]);
        }

        return html;
    },
    _convertToRegExp: function(str)
    {
        return new RegExp(String(str).replace(/^\//, '').replace(/\/ig$/, '').replace(/\/gi$/, '') + '$', 'gi');
    }
});
$R.add('service', 'storage', {
    init: function(app)
    {
        this.app = app;

        // local
        this.data = [];
    },
    // public
    observeImages: function()
    {
        var $editor = this.editor.getElement();
        var $images = $editor.find('[data-image]');

        $images.each(this._addImage.bind(this));
    },
    observeFiles: function()
    {
        var $editor = this.editor.getElement();
        var $files = $editor.find('[data-file]');

		$files.each(this._addFile.bind(this));
    },
	setStatus: function(url, status)
	{
		this.data[url].status = status;
	},
    getChanges: function()
    {
        var $editor = this.editor.getElement();

        // check status
        for (var key in this.data)
		{
			var data = this.data[key];
			var $el = $editor.find('[data-' + data.type + '="' + data.id + '"]');

			this.setStatus(data.id, ($el.length === 0) ? false : true);
		}

        return this.data;
    },
	add: function(type, node)
	{
        var $node = $R.dom(node);
        var id = $node.attr('data-' + type);

        this.data[id] = { type: type, status: true, node: $node.get(), id: $node.attr('data-' + type) };
	},

    // private
    _addImage: function(node)
    {
        this.add('image', node);
    },
    _addFile: function(node)
    {
        this.add('file', node);
    }
});
$R.add('service', 'utils', {
    init: function(app)
    {
        this.app = app;
    },
    // empty
    isEmpty: function(el)
    {
        var isEmpty = false;
        el = $R.dom(el).get();
        if (el)
        {
            isEmpty = (el.nodeType === 3) ? (el.textContent.trim().replace(/\n/, '') === '') : (el.innerHTML === '');
        }

        return isEmpty;
    },
    isEmptyHtml: function(html, keepbr, keeplists)
    {
        html = this.removeInvisibleChars(html);
        html = html.replace(/&nbsp;/gi, '');
        html = html.replace(/<\/?br\s?\/?>/g, ((keepbr) ? 'br' : ''));
        html = html.replace(/\s/g, '');
        html = html.replace(/^<p>[^\W\w\D\d]*?<\/p>$/i, '');
        html = html.replace(/^<div>[^\W\w\D\d]*?<\/div>$/i, '');

        if (keeplists)
        {
            html = html.replace(/<ul(.*?[^>])>$/i, 'ul');
            html = html.replace(/<ol(.*?[^>])>$/i, 'ol');
        }

        html = html.replace(/<hr(.*?[^>])>$/i, 'hr');
        html = html.replace(/<iframe(.*?[^>])>$/i, 'iframe');
        html = html.replace(/<source(.*?[^>])>$/i, 'source');

        // remove empty tags
        html = html.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');
        html = html.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');

        // trim
        html = html.trim();

        return html === '';
    },
    trimSpaces: function(html)
    {
        return html = this.removeInvisibleChars(html.trim());
    },

    // invisible chars
    createInvisibleChar: function()
    {
        return document.createTextNode(this.opts.markerChar);
    },
    searchInvisibleChars: function(str)
    {
        return str.search(/^\uFEFF$/g);
    },
    removeInvisibleChars: function(html)
    {
        return html.replace(/\uFEFF/g, '');
    },
    trimInvisibleChars: function(direction)
    {
        if (!this.selection.isCollapsed()) return;

        var current = this.selection.getCurrent();
        var side = (direction === 'left') ? this.selection.getTextBeforeCaret() : this.selection.getTextAfterCaret();
        var isSpace = (current && current.nodeType === 3 && this.searchInvisibleChars(side) === 0);

        if (isSpace)
        {
            if (direction === 'left')
            {
                $R.dom(current).replaceWith(current.textContent.trim());
            }
            else
            {
                var offset = this.offset.get();
                this.offset.set({ start: offset.start + 1, end: offset.end + 1 });
            }
        }
    },

    // wrapper
    buildWrapper: function(html)
    {
        return $R.dom('<div>').html(html);
    },
    getWrapperHtml: function($wrapper)
    {
        var html = $wrapper.html();
        $wrapper.remove();

        return html;
    },

    // fragment
    createTmpContainer: function(html)
    {
        var $div = $R.dom('<div>');

        if (typeof html === 'string')
        {
            $div.html(html);
        }
        else
        {
            $div.append($R.dom(html).clone(true));
        }

        return $div.get();
    },
    createFragment: function(html)
    {
        var el = this.createTmpContainer(html);
        var frag = document.createDocumentFragment(), node, firstNode, lastNode;
        var nodes = [];
        var i = 0;
        while ((node = el.firstChild))
        {
            i++;
            var n = frag.appendChild(node);
            if (i === 1) firstNode = n;

            nodes.push(n);
            lastNode = n;
        }

        return { frag: frag, first: firstNode, last: lastNode, nodes: nodes };
    },
    isFragment: function(obj)
    {
        return (typeof obj === 'object' && obj.frag);
    },
    parseHtml: function(html)
    {
        var div = this.createTmpContainer(html);

        return { html: div.innerHTML, nodes: div.childNodes };
    },

    splitNode: function(current, nodes, isList, inline)
    {
        nodes = (this.isFragment(nodes)) ? nodes.frag : nodes;

        var element;
        if (inline)
        {
            element = (this.inspector.isInlineTag(current.tagName)) ? current : this.selection.getInline(current);
        }
        else
        {
            element = (this.inspector.isBlockTag(current.tagName)) ? current : this.selection.getBlock(current);
        }

        var $element = $R.dom(element);

        // replace is empty
        if (!inline && this.isEmptyHtml(element.innerHTML, true))
        {
            $element.after(nodes);
            $element.remove();

            return nodes;
        }

        var tag = $element.get().tagName.toLowerCase();
        var isEnd = this.caret.isEnd(element);
        var isStart = this.caret.isStart(element);

        if (!isEnd && !isStart)
        {
            var extractedContent = this.extractHtmlFromCaret(inline);

            var $secondPart = $R.dom('<' + tag + ' />');
            $secondPart = this.cloneAttributes(element, $secondPart);

            $element.after($secondPart.append(extractedContent));
        }

        if (isStart)
        {
            return $element.before(nodes);
        }
        else
        {
            if (isList)
            {
                return $element.append(nodes);
            }
            else
            {
                nodes = $element.after(nodes);

                var html = $element.html();
                html = this.removeInvisibleChars(html);
                html = html.replace(/&nbsp;/gi, '');

                if (html === '') $element.remove();

                return nodes;
            }
        }
    },
    extractHtmlFromCaret: function(inline, element)
    {
        var range = this.selection.getRange();
        if (range)
        {
            element = (element) ? element : ((inline) ? this.selection.getInline() : this.selection.getBlock());
            if (element)
            {
                var clonedRange = range.cloneRange();
                clonedRange.selectNodeContents(element);
                clonedRange.setStart(range.endContainer, range.endOffset);

                return clonedRange.extractContents();
            }
        }
    },
    createMarkup: function(el)
    {
        var markup = document.createElement(this.opts.markup);
        if (this.opts.breakline) markup.setAttribute('data-redactor-tag', 'br');

        var $el = $R.dom(el);

        $el.after(markup);
        this.caret.setStart(markup);
    },
    getNode: function(el)
    {
        var node = $R.dom(el).get();
        var editor = this.editor.getElement().get();

        return (typeof el === 'undefined') ? editor : ((node) ? node : false);
    },
    findSiblings: function(node, type)
    {
        node = $R.dom(node).get();
        type = (type === 'next') ? 'nextSibling' : 'previousSibling';

        while (node = node[type])
        {
            if ((node.nodeType === 3 && node.textContent.trim() === '') || node.tagName === 'BR')
            {
                continue;
            }

            return node;
        }

        return false;
    },
    getElementsFromHtml: function(html, selector, exclude)
    {
        var div = document.createElement("div");
        div.innerHTML = html;

        var elems = div.querySelectorAll(selector);

        // array map polyfill
        var mapping = function(callback, thisArg)
        {
            if (typeof this.length !== 'number') return;
            if (typeof callback !== 'function') return;

            var newArr = [];
            if (typeof this == 'object')
            {
                for (var i = 0; i < this.length; i++)
                {
                    if (i in this) newArr[i] = callback.call(thisArg || this, this[i], i, this);
                    else return;
                }
            }

            return newArr;
        };

        return mapping.call(elems, function(el)
        {
            var type = el.getAttribute('data-redactor-type');
            if (exclude && type && type === exclude) {}
            else return el.outerHTML;
        });
    },

    // childnodes
    getChildNodes: function(el, recursive, elements)
    {
        el = (el && el.nodeType && el.nodeType === 11) ? el : $R.dom(el).get();

        var nodes = el.childNodes;
        var result = [];
        if (nodes)
        {
            for (var i = 0; i < nodes.length; i++)
            {
                if (elements === true && nodes[i].nodeType === 3) continue;
                else if (nodes[i].nodeType === 3 && this.isEmpty(nodes[i])) continue;

                result.push(nodes[i]);

                if (recursive !== false)
                {
                    var nestedNodes = this.getChildNodes(nodes[i], elements);
                    if (nestedNodes.length > 0)
                    {
                        result = result.concat(nestedNodes);
                    }
                }
            }
        }

        return result;
    },
    getChildElements: function(el)
    {
        return this.getChildNodes(el, true, true);
    },
    getFirstNode: function(el)
    {
        return this._getFirst(this.getChildNodes(el, false));
    },
    getLastNode: function(el)
    {
        return this._getLast(this.getChildNodes(el, false));
    },
    getFirstElement: function(el)
    {
        return this._getFirst(this.getChildNodes(el, false, true));
    },
    getLastElement: function(el)
    {
        return this._getLast(this.getChildNodes(el, false, true));
    },

    // replace
    replaceToTag: function(node, tag)
    {
        var $node = $R.dom(node);
        return $node.replaceWith(function(node)
        {
            var $replaced = $R.dom('<' + tag + '>').append($R.dom(node).contents());
            if (node.attributes)
            {
                var attrs = node.attributes;
                for (var i = 0; i < attrs.length; i++)
                {
                    $replaced.attr(attrs[i].nodeName, attrs[i].value);
                }
            }

            return $replaced;

        });
    },

    // string
    ucfirst: function(str)
    {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // array
    removeFromArrayByValue: function(arr, value)
    {
        var a = arguments, len = a.length, ax;
        while (len > 1 && arr.length)
        {
            value = a[--len];
            while ((ax= arr.indexOf(value)) !== -1)
            {
                arr.splice(ax, 1);
            }
        }

        return arr;
    },

    // attributes
    removeEmptyAttr: function(el, attr)
    {
        var $el = $R.dom(el);

        if (typeof $el.attr(attr) === 'undefined' || $el.attr(attr) === null) return true;
        else if ($el.attr(attr) === '')
        {
            $el.removeAttr(attr);
            return true;
        }

        return false;
    },
    cloneAttributes: function(elFrom, elTo)
    {
        elFrom = $R.dom(elFrom).get();
        elTo = $R.dom(elTo);

        var attrs = elFrom.attributes;
        var len = attrs.length;
        while (len--)
        {
            var attr = attrs[len];
            elTo.attr(attr.name, attr.value);
        }

        return elTo;
    },

    // object
    toParams: function(obj)
    {
        if (typeof obj !== 'object') return obj;

        var keys = Object.keys(obj);
        if (!keys.length) return '';
        var result = '';

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];
            result += key + ':' + obj[key] + ';';
        }

        return result;
    },
    styleToObj: function(str)
    {
        var obj = {};

        if (str)
        {
            var style = str.replace(/;$/, '').split(';');
            for (var i = 0; i < style.length; i++)
            {
                var rule = style[i].split(':');
                obj[rule[0].trim()] = rule[1].trim();
            }
        }

        return obj;
    },
    checkProperty: function(obj)
    {
        var args = (arguments[1] && Array.isArray(arguments[1])) ? arguments[1] : [].slice.call(arguments, 1);

        for (var i = 0; i < args.length; i++)
        {
            if (!obj || (typeof obj[args[i]] === 'undefined'))
            {
                return false;
            }

            obj = obj[args[i]];
        }

        return obj;
    },

    // data
    extendData: function(data, obj)
    {
        for (var key in obj)
        {
            if (key === 'elements')
            {
                var $elms = $R.dom(obj[key]);
                $elms.each(function(node)
                {
                    var $node = $R.dom(node);
                    if (node.tagName === 'FORM')
                    {
                        var serializedData = $node.serialize(true);
                        for (var z in serializedData)
                        {
                            data = this._setData(data, z, serializedData[z]);
                        }
                    }
                    else
                    {
                        var name = ($node.attr('name')) ? $node.attr('name') : $node.attr('id');
                        data = this._setData(data, name, $node.val());
                    }
                }.bind(this));
            }
            else
            {
                data = this._setData(data, key, obj[key]);
            }
        }

        return data;
    },
    _setData: function(data, name, value)
    {
        if (data instanceof FormData) data.append(name, value);
        else data[name] = value;

        return data;
    },

    // normalize
    normalizeTextNodes: function(el)
    {
        el = $R.dom(el).get();
        if (el) el.normalize();
    },

    // color
    isRgb: function(str)
    {
        return (str.search(/^rgb/i) === 0);
    },
    rgb2hex: function(rgb)
    {
        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);

        return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
    },
    hex2long: function(val)
    {
        if (val.search(/^#/) !== -1 && val.length === 4)
        {
            val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
        }

        return val;
    },

    // escape
    escapeRegExp: function(s)
    {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    // random
    getRandomId: function()
    {
        var id = '';
        var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 12; i++)
        {
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return id;
    },

    // private
    _getFirst: function(nodes)
    {
        return (nodes.length !== 0) ? nodes[0] : false;
    },
    _getLast: function(nodes)
    {
        return (nodes.length !== 0) ? nodes[nodes.length-1] : false;
    }
});
$R.add('service', 'progress', {
    init: function(app)
    {
        this.app = app;

        // local
        this.$box = null;
        this.$bar = null;
    },

    // public
    show: function()
    {
        if (!this._is()) this._build();
        this.$box.show();
    },
    hide: function()
    {
        if (this._is())
        {
            this.animate.start(this.$box, 'fadeOut', this._destroy.bind(this));
        }
    },
    update: function(value)
    {
        this.show();
        this.$bar.css('width', value + '%');
    },

    // private
    _is: function()
    {
        return (this.$box !== null);
    },
    _build: function()
    {
        this.$bar = $R.dom('<span />');
        this.$box = $R.dom('<div id="redactor-progress" />');

        this.$box.append(this.$bar);
        this.$body.append(this.$box);
    },
    _destroy: function()
    {
        if (this._is()) this.$box.remove();

        this.$box = null;
        this.$bar = null;
    }
});
$R.add('module', 'starter', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.plugin = app.plugin;
        this.module = app.module;
    },
    // messages
    onstart: function()
    {
        var services = ['element', 'container', 'source', 'editor', 'statusbar', 'toolbar'];
        var modules = ['element', 'container', 'source', 'editor', 'statusbar', 'contextbar', 'input'];

        this._startStop('start', this.app, services);
        this._startStop('start', this.module, modules);
    },
    onstop: function()
    {
        var modules = ['observer', 'element', 'container', 'source', 'editor', 'contextbar'];

        this._startStop('stop', this.module, modules);
    },
    onenable: function()
    {
        var modules = ['observer', 'toolbar'];
        var plugins = this.opts.plugins;

        this._startStop('start', this.module, modules);
        this._startStop('start', this.plugin, plugins);
    },
    ondisable: function()
    {
        var modules = ['observer', 'toolbar'];
        var plugins = this.opts.plugins;

        this._startStop('stop', this.module, modules);
        this._startStop('stop', this.plugin, plugins);
    },

    // private
    _startStop: function(type, obj, arr)
    {
        for (var i = 0; i < arr.length; i++)
        {
            if (typeof obj[arr[i]] !== 'undefined')
            {
                this.app.callInstanceMethod(obj[arr[i]], type);
            }
        }
    }
});
$R.add('module', 'element', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.namespace = app.namespace;
        this.element = app.element;
        this.rootOpts = $R.extend({}, true, $R.options, app.rootOpts);
    },
    // public
    start: function()
    {
        this._build();
        this._buildModes();
        this._buildMarkup();
    },
    stop: function()
    {
        var $element = this.element.getElement();
        $element.removeData(this.namespace + '-uuid');
    },

    // private
    _build: function()
    {
        var $element = this.element.getElement();
        $element.data(this.namespace + '-uuid', this.uuid);
    },
    _buildModes: function()
    {
        var type = this.element.getType();

        if (type === 'inline') this._redefineOptions(this.opts.modes['inline']);
        if (type === 'div') this._redefineOptions(this.opts.modes['original']);

        if (type !== 'inline')
        {
            if (this._isRootOption('styles') && this.rootOpts.styles) this.opts.styles = true;
            if (this._isRootOption('source') && !this.rootOpts.source) this.opts.showSource = false;
        }
    },
    _buildMarkup: function()
    {
        var type = this.element.getType();

        if (type === 'inline')
        {
            this.opts.emptyHtml = '';
        }
        else if (this.opts.breakline)
        {
            this.opts.markup = 'div';
            this.opts.emptyHtml = '<div data-redactor-tag="br">' + this.opts.markerChar + '</div>';
        }
        else
        {
            this.opts.emptyHtml = '<' + this.opts.markup + '></' + this.opts.markup + '>';
        }
    },
    _redefineOptions: function(opts)
    {
        for (var key in opts)
        {
            this.opts[key] = opts[key];
        }
    },
    _isRootOption: function()
    {
        return (typeof this.rootOpts['styles'] !== 'undefined');
    }
});
$R.add('module', 'editor', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.editor = app.editor;
        this.source = app.source;
        this.element = app.element;
        this.component = app.component;
        this.container = app.container;
        this.inspector = app.inspector;
        this.autoparser = app.autoparser;

        // local
        this.placeholder = false;
        this.events = false;
    },
    // messages
    onenable: function()
    {
        this.enable();
    },
    ondisable: function()
    {
        this.disable();
    },
    onenablefocus: function()
    {
        this._enableFocus();
    },
    oncontextmenu: function(e)
    {
        this.component.setOnEvent(e, true);
    },
    onclick: function(e)
    {
        this.component.setOnEvent(e);
    },
    onkeyup: function(e)
    {
        var data = this.inspector.parse(e.target);
        if (!data.isComponent())
        {
            this.component.clearActive();
        }
    },
    onenablereadonly: function()
    {
        this._enableReadOnly();
    },
    ondisablereadonly: function()
    {
        this._disableReadOnly();
    },
    onautoparseobserve: function()
    {
        this.autoparser.observe();
    },
    onplaceholder: {
        build: function()
        {
            this._buildPlaceholder();
        },
        toggle: function()
        {
            this._togglePlacehodler();
        }
    },

    // public
    start: function()
    {
        this._build();
        this._buildEvents();
        this._buildOptions();
        this._buildAccesibility();
    },
    stop: function()
    {
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        var classesEditor = ['redactor-in', 'redactor-in-' + this.uuid, 'redactor-structure', 'redactor-placeholder', this.opts.stylesClass];
        var classesContainer = ['redactor-focus', 'redactor-blur', 'redactor-over', 'redactor-styles-on',
                                'redactor-styles-off', 'redactor-toolbar-on', 'redactor-text-labeled-on', 'redactor-source-view'];

        $editor.removeAttr('spellcheck');
        $editor.removeAttr('dir');
        $editor.removeAttr('contenteditable');
        $editor.removeAttr('placeholder');
        $editor.removeAttr('data-gramm_editor');
        $editor.removeClass(classesEditor.join(' '));

        $container.removeClass(classesContainer.join(' '));

        this._destroyEvents();

        if ($editor.get().classList.length === 0) $editor.removeAttr('class');
    },
    enable: function()
    {
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        $editor.addClass('redactor-in redactor-in-' + this.uuid);
        $editor.attr({ 'contenteditable': true });

        if (this.opts.structure)
        {
            $editor.addClass('redactor-structure');
        }

        if (this.opts.toolbar && !this.opts.air && !this.opts.toolbarExternal)
        {
            $container.addClass('redactor-toolbar-on');
        }

        // prevent editing
        this._disableBrowsersEditing();
    },
    disable: function()
    {
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        $editor.removeClass('redactor-in redactor-in-' + this.uuid);
        $editor.removeClass('redactor-structure');
        $editor.removeAttr('contenteditable');

        $container.addClass('redactor-toolbar-on');
    },

    // private
    _build: function()
    {
        var $editor = this.editor.getElement();
        var $element = this.element.getElement();
        var $container = this.container.getElement();

        $container.addClass('redactor-blur');

        if (!this.opts.grammarly)
        {
            $editor.attr('data-gramm_editor', false);
        }

        if (this.opts.styles)
        {
            $editor.addClass(this.opts.stylesClass);
            $container.addClass('redactor-styles-on');
        }
        else
        {
            $container.addClass('redactor-styles-off');
        }

        if (this.opts.buttonsTextLabeled)
        {
            $container.addClass('redactor-text-labeled-on');
        }

        if (this.element.isType('textarea')) $element.before($editor);
    },
    _buildEvents: function()
    {
        this.events = $R.create('editor.events', this.app);
    },
    _buildOptions: function()
    {
        var $editor = this.editor.getElement();

        $editor.attr('dir', this.opts.direction);

        if (this.opts.tabindex)  $editor.attr('tabindex', this.opts.tabindex);
        if (this.opts.minHeight) $editor.css('min-height', this.opts.minHeight);
        if (this.opts.maxHeight) $editor.css('max-height', this.opts.maxHeight);
        if (this.opts.maxWidth)  $editor.css({ 'max-width': this.opts.maxWidth, 'margin': 'auto' });
    },
    _buildAccesibility: function()
    {
        var $editor = this.editor.getElement();

        $editor.attr({ 'aria-labelledby': 'redactor-voice-' + this.uuid, 'role': 'presentation' });
    },
    _buildPlaceholder: function()
    {
        this.placeholder = $R.create('editor.placeholder', this.app);
    },
    _enableFocus: function()
    {
        if (this.opts.showSource) this._enableFocusSource();
        else this._enableFocusEditor();
    },
    _enableFocusSource: function()
    {
        var $source = this.source.getElement();

        if (this.opts.focus)
        {
            $source.focus();
            $source.get().setSelectionRange(0, 0);
        }
        else if (this.opts.focusEnd)
        {
            $source.focus();
        }
    },
    _enableFocusEditor: function()
    {
        if (this.opts.focus)
        {
            setTimeout(this.editor.startFocus.bind(this.editor), 100);
        }
        else if (this.opts.focusEnd)
        {
            setTimeout(this.editor.endFocus.bind(this.editor), 100);
        }
    },
    _togglePlacehodler: function()
    {
        if (this.placeholder) this.placeholder.toggle();
    },
    _disableBrowsersEditing: function()
    {
        try {
            // FF fix
            document.execCommand('enableObjectResizing', false, false);
            document.execCommand('enableInlineTableEditing', false, false);
            // IE prevent converting links
            document.execCommand("AutoUrlDetect", false, false);

            // IE disable image resizing
            var $editor = this.editor.getElement();
            var el = $editor.get();
            if (el.addEventListener) el.addEventListener('mscontrolselect', function(e) { e.preventDefault(); });
            else el.attachEvent('oncontrolselect', function(e) { e.returnValue = false; });

        } catch (e) {}
    },
    _destroyEvents: function()
    {
        if (this.events)
        {
            this.events.destroy();
        }
    },
    _enableReadOnly: function()
    {
        var $editor = this.editor.getElement();

        this._getEditables($editor).removeAttr('contenteditable');
        $editor.removeAttr('contenteditable');
        $editor.addClass('redactor-read-only');

        if (this.events) this.events.destroy();
    },
    _disableReadOnly: function()
    {
        var $editor = this.editor.getElement();

        this._getEditables($editor).attr({ 'contenteditable': true });
        $editor.removeClass('redactor-read-only');
        $editor.attr({ 'contenteditable': true });

        this._buildEvents();
    },
    _getEditables: function($editor)
    {
        return $editor.find('figcaption, td, th');
    }
});
$R.add('class', 'editor.placeholder', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.editor = app.editor;
        this.element = app.element;

        // build
        this.build();
    },
    build: function()
    {
        var $element = this.element.getElement();
        var $editor = this.editor.getElement();

        if (this.opts.placeholder !== false || $element.attr('placeholder'))
        {
            var text = (this.opts.placeholder !== false) ? this.opts.placeholder : $element.attr('placeholder');
            $editor.attr('placeholder', text);
            this.toggle();
        }
    },
    toggle: function()
    {
        return (this.editor.isEmpty(true)) ? this.show() : this.hide();
    },
    show: function()
    {
        var $editor = this.editor.getElement();
        $editor.addClass('redactor-placeholder');
    },
    hide: function()
    {
        var $editor = this.editor.getElement();
        $editor.removeClass('redactor-placeholder');
    }
});
$R.add('class', 'editor.events', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.$doc = app.$doc;
        this.uuid = app.uuid;
        this.source = app.source;
        this.editor = app.editor;
        this.cleaner = app.cleaner;
        this.container = app.container;
        this.insertion = app.insertion;
        this.inspector = app.inspector;
        this.selection = app.selection;
        this.component = app.component;

        // local
        this.blurNamespace = '.redactor-blur.' + this.uuid;
        this.eventsList = ['paste', 'click', 'contextmenu', 'keydown', 'keyup', 'mouseup', 'touchstart',
                           'cut', 'copy', 'dragenter', 'dragstart', 'drop', 'dragover', 'dragleave'];

        // init
        this._init();
    },
    destroy: function()
    {
        var $editor = this.editor.getElement();

        $editor.off('.redactor-focus');
        this.$doc.off('keyup' + this.blurNamespace + ' mousedown' + this.blurNamespace);

        // all events
        this._loop('off');
    },
    focus: function(e)
    {
        var $container = this.container.getElement();

        if (this.editor.isPasting() || $container.hasClass('redactor-focus')) return;

        $container.addClass('redactor-focus');
        $container.removeClass('redactor-blur');

        this.app.broadcast('observe', e);
        this.app.broadcast('focus', e);

        this.isFocused = true;
        this.isBlured = false;
    },
    blur: function(e)
    {
        var $container = this.container.getElement();
        var $target = $R.dom(e.target);
        var targets = ['.redactor-in-' + this.uuid,  '.redactor-toolbar', '.redactor-dropdown',
        '.redactor-context-toolbar', '#redactor-modal', '#redactor-image-resizer'];

        this.app.broadcast('originalblur', e);
        if (this.app.stopBlur) return;

        if (!this.app.isStarted() || this.editor.isPasting()) return;
        if ($target.closest(targets.join(',')).length !== 0) return;

        if (!this.isBlured && !$container.hasClass('redactor-blur'))
        {
            $container.removeClass('redactor-focus');
            $container.addClass('redactor-blur');
            this.app.broadcast('blur', e);

            this.isFocused = false;
            this.isBlured = true;
        }
    },
    cut: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        this.app.broadcast('state', e);

        if (this.component.isNonEditable(current))
        {
            this._passSelectionToClipboard(e, data, true);
            e.preventDefault();
        }
    },
    copy: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        this.app.broadcast('state', e);

        if (this.component.isNonEditable(current))
        {
            this._passSelectionToClipboard(e, data, false);
            e.preventDefault();
        }
    },
    drop: function(e)
    {
        e = e.originalEvent || e;
        e.stopPropagation();
        this._removeOverClass();

        if (this.opts.dragUpload === false)
        {
            e.preventDefault();
            return;
        }

        if (this.app.isDragComponentInside())
        {
            var $dragComponent = $R.dom(this.app.getDragComponentInside());
            var $component = $dragComponent.clone(true);
            this.insertion.insertToPoint(e, $component);

            $dragComponent.remove();

            this.app.setDragComponentInside(false);
            this.app.broadcast('state', e);
            this.app.broadcast('drop', e);
            this.app.broadcast('image.observe', e);

            e.preventDefault();

            return;
        }
        else if (this.app.isDragInside() && this.opts.input)
        {
            this.insertion.insertPoint(e);

            var dt = e.dataTransfer;
            var html = dt.getData('text/html');

            // clear selected
            var range = this.selection.getRange();
            if (range)
            {
                var blocks = this.selection.getBlocks();
                range.deleteContents();

                // remove empty blocks
                for (var i = 0; i < blocks.length; i++)
                {
                    if (blocks[i].innerHTML === '') $R.dom(blocks[i]).remove();
                }
            }

            // paste
            $R.create('input.paste', this.app, e, true, html, true);

            this.app.broadcast('state', e);
            this.app.broadcast('drop', e);

            this.app.setDragInside(false);
            e.preventDefault();

            return;
        }

        this.app.broadcast('state', e);
        this.app.broadcast('paste', e, e.dataTransfer);
        this.app.broadcast('drop', e);

    },
    dragenter: function(e)
    {
        e.preventDefault();
    },
    dragstart: function(e)
    {
        this.app.setDragComponentInside(false);
        this.app.setDragInside(false);

        var data = this.inspector.parse(e.target);
        if (data.isComponent() && !data.isComponentEditable() && !data.isFigcaption())
        {
            this.app.setDragComponentInside(data.getComponent());
        }
        else if (this.selection.is() && !this.selection.isCollapsed())
        {
            // drag starts inside editor
            this.app.setDragInside(true);
            this._setDragData(e);
        }

        this.app.broadcast('dragstart', e);
    },
    dragover: function(e)
    {
        this.app.broadcast('dragover', e);
    },
    dragleave: function(e)
    {
        this.app.broadcast('dragleave', e);
    },
    paste: function(e)
    {
        this.app.broadcast('paste', e);
    },
    contextmenu: function(e)
    {
        // chrome crashes fix
        this.editor.disableNonEditables();

        setTimeout(function()
        {
            this.editor.enableNonEditables();
            this.app.broadcast('contextmenu', e);

        }.bind(this), 0);
    },
    click: function(e)
    {
        // triple click selection
        if (e.detail === 3)
        {
            e.preventDefault();

            var block = this.selection.getBlock();
            var range = document.createRange();
            range.selectNodeContents(block);
            this.selection.setRange(range)
        }

        // observe bottom click
        var $target = $R.dom(e.target);
        if ($target.hasClass('redactor-in'))
        {
            var top = $target.offset().top;
            var pad = parseFloat($target.css('padding-bottom'));
            var height = $target.height();
            var posHeight = top + height - pad*2;

            if (posHeight < e.pageY)
            {
                this.app.broadcast('bottomclick', e);
            }
        }

        this.app.broadcast('state', e);
        this.app.broadcast('click', e);
    },
    keydown: function(e)
    {
        this.app.broadcast('state', e);
        var stop = this.app.broadcast('keydown', e);
        if (stop === false)
        {
            return e.preventDefault();
        }
    },
    keyup: function(e)
    {
        this.app.broadcast('keyup', e);
    },
    mouseup: function(e)
    {
        this.app.broadcast('observe', e);
        this.app.broadcast('state', e);
    },
    touchstart: function(e)
    {
        this.app.broadcast('observe', e);
        this.app.broadcast('state', e);
    },

    // private
    _init: function()
    {
        var $editor = this.editor.getElement();

        $editor.on('focus.redactor-focus click.redactor-focus', this.focus.bind(this));
        this.$doc.on('keyup' + this.blurNamespace + ' mousedown' + this.blurNamespace, this.blur.bind(this));

        // all events
        this._loop('on');
    },
    _removeOverClass: function()
    {
        var $editor = this.editor.getElement();
        $editor.removeClass('over');
    },
    _loop: function(func)
    {
        var $editor = this.editor.getElement();
        for (var i = 0; i < this.eventsList.length; i++)
        {
            var event = this.eventsList[i] + '.redactor-events';
            var method = this.eventsList[i];

            $editor[func](event, this[method].bind(this));
        }
    },
    _passAllToClipboard: function(e)
    {
        var clipboard = e.clipboardData;
        var content = this.source.getCode();

        clipboard.setData('text/html', content);
        clipboard.setData('text/plain', content.toString().replace(/\n$/, ""));
    },
    _passSelectionToClipboard: function(e, data, remove)
    {
        var clipboard = e.clipboardData;
        var node = data.getComponent();
        var $node = $R.dom(node);
        var $cloned = $node.clone();

        // clean
        $cloned.find('.redactor-component-caret').remove();
        $cloned.removeClass('redactor-component-active');
        $cloned.removeAttr('contenteditable');
        $cloned.removeAttr('tabindex');

        // html
        var content = $cloned.get().outerHTML;

        if (remove) this.component.remove(node);

        clipboard.setData('text/html', content);
        clipboard.setData('text/plain', content.toString().replace(/\n$/, ""));
    },
    _setDragData: function(e)
    {
        e = e.originalEvent || e;

        var dt = e.dataTransfer;
        dt.effectAllowed = 'move';
        dt.setData('text/Html', this.selection.getHtml());
    }
});
$R.add('module', 'container', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.lang = app.lang;
        this.element = app.element;
        this.container = app.container;
    },
    // public
    start: function()
    {
        this._build();
        this._buildAccesibility();
    },
    stop: function()
    {
        var $element = this.element.getElement();
        var $container = this.container.getElement();

        $container.after($element);
        $container.remove();
        $element.show();
    },

    // private
    _build: function()
    {
        var $element = this.element.getElement();
        var $container = this.container.getElement();

        $container.addClass('redactor-box');
        $container.attr('dir', this.opts.direction);

        if (this.element.isType('inline')) $container.addClass('redactor-inline');

        $element.after($container);
        $container.append($element);
    },
    _buildAccesibility: function()
    {
        var $container = this.container.getElement();
        var $label = $R.dom('<span />');

        $label.addClass('redactor-voice-label');
        $label.attr({ 'id': 'redactor-voice-' + this.uuid, 'aria-hidden': false });
        $label.html(this.lang.get('accessibility-help-label'));

        $container.prepend($label);
    }
});
$R.add('module', 'source', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.utils = app.utils;
        this.element = app.element;
        this.source = app.source;
        this.editor = app.editor;
        this.toolbar = app.toolbar;
        this.cleaner = app.cleaner;
        this.component = app.component;
        this.container = app.container;
        this.autoparser = app.autoparser;
        this.selection = app.selection;

        // local
        this.syncedHtml = '';
    },
    // messages
    onstartcode: function()
    {
        var sourceContent = this.source.getStartedContent();
        var $editor = this.editor.getElement();
        var $source = this.source.getElement();

        // autoparse
        if (this.opts.autoparse && this.opts.autoparseStart)
        {
            sourceContent = this.autoparser.parse(sourceContent);
        }

        // started content
        var startContent = this.cleaner.input(sourceContent, true, true);
        var syncContent = this.cleaner.output(startContent);

        // set content
        $editor.html(startContent);
        $source.val(syncContent);

        this.syncedHtml = syncContent;
        this.app.broadcast('placeholder.build');
        this.app.broadcast('autoparseobserve');

        // widget's scripts
        this.component.executeScripts();
    },
    onstartcodeshow: function()
    {
        this.show();
    },
    ontrytosync: function()
    {
        this.sync();
    },

    // public
    start: function()
    {
        this._build();
        this._buildClasses();
    },
    stop: function()
    {
        var $element = this.element.getElement();
        var $source = this.source.getElement();

        $element.removeClass('redactor-source redactor-source-open');
        $source.off('input.redactor-source');
        $source.removeAttr('data-gramm_editor');

        if ($source.get().classList.length === 0) $source.removeAttr('class');
        if (!this.source.isNameGenerated()) $element.removeAttr('name');
        if (!this.element.isType('textarea')) $source.remove();

    },
    getCode: function()
    {
        return this.source.getCode();
    },

    // public
    toggle: function()
    {
        if (!this.opts.source) return;

        var $source = this.source.getElement();

        return ($source.hasClass('redactor-source-open')) ? this.hide() : this.show();
    },
    show: function()
    {
        if (!this.opts.source) return;

        var $editor = this.editor.getElement();
        var $source = this.source.getElement();
        var $container = this.container.getElement();

        var html = $source.val();

        if (this.app.isStarted()) html = this.app.broadcast('source.open', html);

        // insert markers
        var sourceSelection = $R.create('source.selection', this.app);

        var editorHtml = sourceSelection.insertMarkersToEditor();
        editorHtml = this.cleaner.output(editorHtml, false);
        editorHtml = editorHtml.trim();

        // get height
        var editorHeight = $editor.height();

        $editor.hide();
        $source.height(editorHeight);
        $source.val(html.trim());
        $source.show();
        $source.addClass('redactor-source-open');
        $source.on('input.redactor-source-events', this._onChangedSource.bind(this));
        $source.on('keydown.redactor-source-events', this._onTabKey.bind(this));
        $source.on('focus.redactor-source-events', this._onFocus.bind(this));

        $container.addClass('redactor-source-view');

        // offset markers
        sourceSelection.setSelectionOffsetSource(editorHtml);

        // buttons
        setTimeout(function()
        {
            this._disableButtons();
            this._setActiveSourceButton();

        }.bind(this), 100);

        if (this.app.isStarted()) this.app.broadcast('source.opened');
    },
    hide: function()
    {
        if (!this.opts.source) return;

        var $editor = this.editor.getElement();
        var $source = this.source.getElement();
        var $container = this.container.getElement();

        var html = $source.val();

        // insert markers
        var sourceSelection = $R.create('source.selection', this.app);
        html = sourceSelection.insertMarkersToSource(html);

        // clean
        html = this.cleaner.input(html, true);
        html = (this.utils.isEmptyHtml(html)) ? this.opts.emptyHtml : html;
        html = this.app.broadcast('source.close', html);

        // buttons
        this._enableButtons();
        this._setInactiveSourceButton();

        $source.hide();
        $source.removeClass('redactor-source-open');
        $source.off('.redactor-source-events');
        $editor.show();
        $editor.html(html);

        $container.removeClass('redactor-source-view');

        setTimeout(function()
        {
            if (sourceSelection.isOffset()) this.selection.restoreMarkers();
            else if (sourceSelection.isOffsetEnd()) this.editor.endFocus();
            else this.editor.startFocus();

            // widget's scripts
            this.component.executeScripts();

        }.bind(this), 0);

        this.app.broadcast('source.closed');
    },
    sync: function()
    {
        var self = this;
        var $editor = this.editor.getElement();
        var html = $editor.html();

        html = this.app.broadcast('syncBefore', html);
        html = this.cleaner.output(html);

        if (this._isSync(html))
        {
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(function() { self._syncing(html); }, 200);
        }
    },

    // private
    _build: function()
    {
        var $source = this.source.getElement();
        var $element = this.element.getElement();

        $source.hide();

        if (!this.opts.grammarly)
        {
            $source.attr('data-gramm_editor', false);
        }

        if (!this.element.isType('textarea'))
        {
            $element.after($source);
        }
    },
    _buildClasses: function()
    {
        var $source = this.source.getElement();

        $source.addClass('redactor-source');
    },
    _syncing: function(html)
    {
        html = this.app.broadcast('syncing', html);

        var $source = this.source.getElement();
        $source.val(html);

        this.app.broadcast('synced', html);
        this.app.broadcast('changed', html);
    },
    _isSync: function(html)
    {
        if (this.syncedHtml !== html)
        {
            this.syncedHtml = html;
            return true;
        }

        return false;
    },
    _onChangedSource: function()
    {
        var $source = this.source.getElement();
        var html = $source.val();

        this.app.broadcast('changed', html);
        this.app.broadcast('source.changed', html);
    },
    _onTabKey: function(e)
    {
        if (e.keyCode !== 9) return true;

        e.preventDefault();

        var $source = this.source.getElement();
        var el = $source.get();
        var start = el.selectionStart;

        $source.val($source.val().substring(0, start) + "    " + $source.val().substring(el.selectionEnd));
        el.selectionStart = el.selectionEnd = start + 4;
    },
    _onFocus: function()
    {
        this.app.broadcast('sourcefocus');
    },
    _disableButtons: function()
    {
        this.toolbar.disableButtons();
    },
    _enableButtons: function()
    {
        this.toolbar.enableButtons();
    },
    _setActiveSourceButton: function()
    {
        var $btn = this.toolbar.getButton('html');
        $btn.enable();
        $btn.setActive();
    },
    _setInactiveSourceButton: function()
    {
        var $btn = this.toolbar.getButton('html');
        $btn.setInactive();
    }
});
$R.add('class', 'source.selection', {
    init: function(app)
    {
        this.app = app;
        this.utils = app.utils;
        this.source = app.source;
        this.editor = app.editor;
        this.marker = app.marker;
        this.component = app.component;
        this.selection = app.selection;

        // local
        this.markersOffset = false;
        this.markersOffsetEnd = false;
    },
    insertMarkersToEditor: function()
    {
        var $editor = this.editor.getElement();
        var start = this.marker.build('start');
        var end = this.marker.build('end');
        var component = this.component.getActive();
        if (component)
        {
            this.marker.remove();
            var $component = $R.dom(component);

            $component.after(end);
            $component.after(start);
        }
        else if (window.getSelection && this.selection.is())
        {
            this.marker.insert('both');
        }

        return this._getHtmlAndRemoveMarkers($editor);
    },
    setSelectionOffsetSource: function(editorHtml)
    {
        var start = 0;
        var end = 0;
        var $source = this.source.getElement();
        if (editorHtml !== '')
        {
            var startMarker = this.utils.removeInvisibleChars(this.marker.buildHtml('start'));
            var endMarker = this.utils.removeInvisibleChars(this.marker.buildHtml('end'));

            start = this._strpos(editorHtml, startMarker);
            end = this._strpos(editorHtml, endMarker) - endMarker.toString().length - 2;

            if (start === false)
            {
                start = 0;
                end = 0;
            }
        }

        $source.get().setSelectionRange(start, end);
        $source.get().scrollTop = 0;

        setTimeout(function() { $source.focus(); }.bind(this), 0);
    },
    isOffset: function()
    {
        return this.markersOffset;
    },
    isOffsetEnd: function()
    {
        return this.markersOffsetEnd;
    },
    insertMarkersToSource: function(html)
    {
        var $source = this.source.getElement();
        var markerStart = this.marker.buildHtml('start');
        var markerEnd = this.marker.buildHtml('end');

        var markerLength = markerStart.toString().length;
        var startOffset = this._enlargeOffset(html, $source.get().selectionStart);
        var endOffset = this._enlargeOffset(html, $source.get().selectionEnd);
        var sizeOffset = html.length;

        if (startOffset === sizeOffset)
        {
            this.markersOffsetEnd = true;
        }
        else if (startOffset !== 0 && endOffset !== 0)
        {
            this.markersOffset = true;

            html = html.substr(0, startOffset) + markerStart + html.substr(startOffset);
            html = html.substr(0, endOffset + markerLength) + markerEnd + html.substr(endOffset + markerLength);
        }
        else
        {
            this.markersOffset = false;
        }

        return html;
    },

    // private
    _getHtmlAndRemoveMarkers: function($editor)
    {
        var html = $editor.html();
        $editor.find('.redactor-selection-marker').remove();

        return html;
    },
    _strpos: function(haystack, needle, offset)
    {
        var i = haystack.indexOf(needle, offset);
        return i >= 0 ? i : false;
    },
    _enlargeOffset: function(html, offset)
    {
        var htmlLength = html.length;
        var c = 0;

        if (html[offset] === '>')
        {
            c++;
        }
        else
        {
            for(var i = offset; i <= htmlLength; i++)
            {
                c++;

                if (html[i] === '>')
                {
                    break;
                }
                else if (html[i] === '<' || i === htmlLength)
                {
                    c = 0;
                    break;
                }
            }
        }

        return offset + c;
    }
});
$R.add('module', 'observer', {
    init: function(app)
    {
        this.app = app;
        this.editor = app.editor;

        // local
        this.observerUnit = false;
    },
    // public
    start: function()
    {
        if (window.MutationObserver)
        {
            var $editor = this.editor.getElement();
            var el = $editor.get();
            this.observerUnit = this._build(el);
            this.observerUnit.observe(el, {
                 attributes: true,
                 subtree: true,
                 childList: true,
                 characterData: true,
                 characterDataOldValue: true
            });
        }
    },
    stop: function()
    {
        if (this.observerUnit) this.observerUnit.disconnect();
    },

    // private
    _build: function(el)
    {
        var self = this;
        return new MutationObserver(function(mutations)
        {
            self._observe(mutations[mutations.length-1], el);
        });
    },
    _observe: function(mutation, el)
    {
        if (this.app.isReadOnly() || (mutation.type === 'attributes' && mutation.target === el))
        {
            return;
        }

        this.app.broadcast('observe');
        this.app.broadcast('trytosync');
        this.app.broadcast('placeholder.toggle');
    }
});
$R.add('module', 'clicktoedit', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.source = app.source;
        this.editor = app.editor;
        this.container = app.container;
        this.selection = app.selection;
    },
    // messages
    onstartclicktoedit: function()
    {
        this.start();
    },
    onenablereadonly: function()
    {
        if (!this._isEnabled()) this.stop();
    },
    ondisablereadonly: function()
    {
        if (!this._isEnabled()) this.start();
    },
    onstop: function()
    {
        this.stop();
    },

    // public
    start: function()
    {
        this._build();
    },
    stop: function()
    {
        if (this.buttonSave) this.buttonSave.stop();
        if (this.buttonCancel) this.buttonCancel.stop();

        this._destroy();
        this.app.broadcast('disable');
    },
    enable: function()
    {
        this.app.broadcast('clickStart');

        var isEmpty = this.editor.isEmpty();
        if (!isEmpty) this.selection.saveMarkers();

        this._setFocus();
        this._destroy();
        this.app.broadcast('enable');
        this.buttonSave.enable();
        this.buttonCancel.enable();

        if (!isEmpty) this.selection.restoreMarkers();
        if (isEmpty) this.editor.focus();

        var $container = this.container.getElement();
        $container.addClass('redactor-clicktoedit-enabled');
    },
    save: function(e)
    {
        if (e) e.preventDefault();

        var html = this.source.getCode();

        this.app.broadcast('disable');
        this.app.broadcast('clickSave', html);
        this.app.broadcast('clickStop');
        this._build();
    },
    cancel: function(e)
    {
        if (e) e.preventDefault();

        var html = this.saved;
        var $editor = this.editor.getElement();
        $editor.html(html);

        this.saved = '';

        this.app.broadcast('disable');
        this.app.broadcast('clickCancel', html);
        this.app.broadcast('clickStop');
        this._build();
    },

    // private
    _build: function()
    {
        // buttons
        this.buttonSave = $R.create('clicktoedit.button', 'save', this.app, this);
        this.buttonCancel = $R.create('clicktoedit.button', 'cancel', this.app, this);

        this.buttonSave.stop();
        this.buttonCancel.stop();

        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        $editor.on('click.redactor-click-to-edit mouseup.redactor-click-to-edit', this.enable.bind(this));
        $container.addClass('redactor-over');
        $container.removeClass('redactor-clicktoedit-enabled');
    },
    _isEnabled: function()
    {
        return this.container.getElement().hasClass('redactor-clicktoedit-enabled');
    },
    _destroy: function()
    {
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        $editor.off('.redactor-click-to-edit');
        $container.removeClass('redactor-over redactor-clicktoedit-enabled');
    },
    _setFocus: function()
    {
        this.saved = this.source.getCode();

        this.buttonSave.start();
        this.buttonCancel.start();
    }
});
$R.add('class', 'clicktoedit.button', {
    init: function(type, app, context)
    {
        this.app = app;
        this.opts = app.opts;
        this.toolbar = app.toolbar;
        this.context = context;

        // local
        this.type = type;
        this.name = (type === 'save') ? 'clickToSave' : 'clickToCancel';
        this.objected = false;
        this.enabled = false;
        this.namespace = '.redactor-click-to-edit';

        // build
        this._build();
    },
    enable: function()
    {
        if (!this.objected) return;

        var data = this.opts[this.name];
        data.api = 'module.clicktoedit.' + this.type;

        this.toolbar.addButton(this.type, data);
        this.enabled = true;
    },
    start: function()
    {
        if (this.objected) return;

        this.$button.off(this.namespace);
        this.$button.show();
        this.$button.on('click' + this.namespace, this.context[this.type].bind(this.context));
    },
    stop: function()
    {
        if (this.objected || !this.enabled) return;

        this.$button.hide();
    },

    // private
    _build: function()
    {
        this.objected = (typeof this.opts[this.name] === 'object');

        if (!this.objected)
        {
            this.$button = $R.dom(this.opts[this.name]);
            this.enabled = true;
        }
    }
});
$R.add('module', 'statusbar', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.element = app.element;
        this.statusbar = app.statusbar;
        this.container = app.container;
    },
    // public
    start: function()
    {
        if (!this.element.isType('inline'))
        {
            var $statusbar = this.statusbar.getElement();
            var $container = this.container.getElement();

            $statusbar.addClass('redactor-statusbar');
            $container.append($statusbar);
        }
    }
});
$R.add('module', 'contextbar', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.uuid = app.uuid;
        this.$win = app.$win;
        this.$doc = app.$doc;
        this.$body = app.$body;
        this.editor = app.editor;
        this.toolbar = app.toolbar;
        this.detector = app.detector;

        // local
        this.$target = (this.toolbar.isTarget()) ? this.toolbar.getTargetElement() : this.$body;
    },
    // messages
    onenablereadonly: function()
    {
        this.stop();
    },
    ondisablereadonly: function()
    {
        this.start();
    },
    oncontextbar: {
        close: function()
        {
            this.close();
        }
    },

    // public
    start: function()
    {
        if (this.opts.toolbarContext)
        {
            var $editor = this.editor.getElement();

            this._build();
            $editor.on('click.redactor-context mouseup.redactor-context', this.open.bind(this));

            if (this.opts.scrollTarget)
            {
                $R.dom(this.opts.scrollTarget).on('scroll.redactor-context', this.close.bind(this));
            }
        }
    },
    stop: function()
    {
        var $editor = this.editor.getElement();
        $editor.off('.redactor-context');

        this.$doc.off('.redactor-context');
        this.$win.off('.redactor-context');

        if (this.$contextbar) this.$contextbar.remove();
        if (this.opts.scrollTarget)
        {
            $R.dom(this.opts.scrollTarget).off('.redactor-context');
        }
    },
    is: function()
    {
        return (this.$contextbar && this.$contextbar.hasClass('open'));
    },
    set: function(e, node, buttons, position)
    {
        this.$contextbar.html('');
        this.$el = $R.dom(node);

        // buttons
        for (var key in buttons)
        {
            var $btn = $R.create('contextbar.button', this.app, buttons[key]);
            if ($btn.html() !== '')
            {
                this.$contextbar.append($btn);
            }
        }

        // show
        var pos = this._buildPosition(e, this.$el, position);

        this.$contextbar.css(pos);
        this.$contextbar.show();
        this.$contextbar.addClass('open');
        this.$doc.on('click.redactor-context mouseup.redactor-context', this.close.bind(this));
        this.$win.on('resize.redactor-context', this.close.bind(this));
    },
    open: function(e)
    {
        setTimeout(function()
        {
            this.app.broadcast('contextbar', e, this);
        }.bind(this), 0);
    },
    close: function(e)
    {
        if (!this.$contextbar) return;
        if (e)
        {
            var $target = $R.dom(e.target);
            if (this.$el && $target.closest(this.$el).length !== 0)
            {
                return;
            }
        }

        this.$contextbar.hide();
        this.$contextbar.removeClass('open');
        this.$doc.off('.redactor.context');
    },

    // private
    _build: function()
    {
        this.$contextbar = $R.dom('<div>');
        this.$contextbar.attr('id', 'redactor-context-toolbar-' + this.uuid);
        this.$contextbar.attr('dir', this.opts.direction);
        this.$contextbar.addClass('redactor-context-toolbar');
        this.$contextbar.hide();

        this.$target.append(this.$contextbar);
    },
    _buildPosition: function(e, $el, position)
    {
        var top, left;
        var isTarget = this.toolbar.isTarget();
        var offset = (isTarget) ? $el.position() : $el.offset();
        var width = $el.width();
        var height = $el.height();

        var barWidth = this.$contextbar.width();
        var barHeight = this.$contextbar.height();
        var docScrollTop = (isTarget) ? (this.$target.scrollTop() + this.$doc.scrollTop()) : this.$doc.scrollTop();

        var targetOffset = this.$target.offset();
        var leftFix = (isTarget) ? targetOffset.left : 0;
        var topFix = (isTarget) ? targetOffset.top : 0;

        if (!position)
        {
            top = (e.clientY + docScrollTop - barHeight);
            left = (e.clientX - barWidth/2);
        }
        else if (position === 'top')
        {
            top = (offset.top - barHeight);
            left = (offset.left + width/2 - barWidth/2);
        }
        else if (position === 'bottom')
        {
            top = (offset.top + height);
            left = (offset.left + width/2 - barWidth/2);
        }

        if (left < 0) left = 0;

        return { top: (top - topFix) + 'px', left: (left - leftFix) + 'px' };
    }
});
$R.add('class', 'contextbar.button', {
    mixins: ['dom'],
    init: function(app, obj)
    {
        this.app = app;

        // local
        this.obj = obj;

        // init
        this._init();
    },
    // private
    _init: function()
    {
        this.parse('<a>');
        this.attr('href', '#');

        this._buildTitle();
        this._buildMessage();
    },
    _buildTitle: function()
    {
        this.html(this.obj.title);
    },
    _buildMessage: function()
    {
        if (typeof this.obj.message !== 'undefined' || typeof this.obj.api !== 'undefined')
        {
            this.on('click', this._toggle.bind(this));
        }
    },
    _toggle: function(e)
    {
        e.preventDefault();

        if (this.obj.message)
        {
            this.app.broadcast(this.obj.message, this.obj.args);
        }
        else if (this.obj.api)
        {
            this.app.api(this.obj.api, this.obj.args);
        }
    }
});
$R.add('module', 'toolbar', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.toolbar = app.toolbar;

        // local
        this.buttons = [];
        this.toolbarModule = false;
    },
    // messages
    onsource: {
        open: function()
        {
            if (!this.toolbar.isAir() && this.toolbar.isFixed())
            {
                this.toolbarModule.resetPosition();
            }
        },
        opened: function()
        {
            if (this.toolbar.isAir() && this.toolbarModule)
            {
                this.toolbarModule.createSourceHelper();
            }
        },
        close: function()
        {
            if (this.toolbar.isAir() && this.toolbarModule)
            {
                this.toolbarModule.destroySourceHelper();
            }
        },
        closed: function()
        {
            if (this.toolbar.is() && this.opts.air)
            {
                this.toolbarModule.openSelected();
            }
        }
    },
    onobserve: function()
    {
        if (this.toolbar.is())
        {
            this.toolbar.observe();
        }
    },
    onfocus: function()
    {
        this._setExternalOnFocus();
    },
    onsourcefocus: function()
    {
        this._setExternalOnFocus();
    },
    onempty: function()
    {
        if (this.toolbar.isFixed())
        {
            this.toolbarModule.resetPosition();
        }
    },
    onenablereadonly: function()
    {
        if (this.toolbar.isAir())
        {
            this.toolbarModule.close();
        }
    },

    // public
    start: function()
    {
        if (this.toolbar.is())
        {
            this._buildButtons();
            this._initToolbar();
            this._initButtons();
        }
    },
    stop: function()
    {
        if (this.toolbarModule)
        {
            this.toolbarModule.stop();
        }
    },

    // private
    _buildButtons: function()
    {
        this.buttons = this.opts.buttons.concat();

        this._buildImageButton();
        this._buildFileButton();
        this._buildSourceButton();
        this._buildAdditionalButtons();
        this._buildHiddenButtons();
    },
    _buildImageButton: function()
    {
        if (!this.opts.imageUpload) this.utils.removeFromArrayByValue(this.buttons, 'image');
    },
    _buildFileButton: function()
    {
        if (!this.opts.fileUpload) this.utils.removeFromArrayByValue(this.buttons, 'file');
    },
    _buildSourceButton: function()
    {
        if (!this.opts.source) this.utils.removeFromArrayByValue(this.buttons, 'html');
    },
    _buildAdditionalButtons: function()
    {
        // end
        if (this.opts.buttonsAdd.length !== 0)
        {
            this.opts.buttonsAdd = this._removeExistButtons(this.opts.buttonsAdd);
            this.buttons = this.buttons.concat(this.opts.buttonsAdd);
        }

        // beginning
        if (this.opts.buttonsAddFirst.length !== 0)
        {
            this.opts.buttonsAddFirst = this._removeExistButtons(this.opts.buttonsAddFirst);
            this.buttons.unshift(this.opts.buttonsAddFirst);
        }

        var index, btns;

        // after
        if (this.opts.buttonsAddAfter !== false)
        {
            index = this.buttons.indexOf(this.opts.buttonsAddAfter.after) + 1;
            btns = this.opts.buttonsAddAfter.buttons;
            for (var i = 0; i < btns.length; i++)
            {
                this.buttons.splice(index+i, 0, btns[i]);
            }
        }

        // before
        if (this.opts.buttonsAddBefore !== false)
        {
            index = this.buttons.indexOf(this.opts.buttonsAddBefore.before)+1;
            btns = this.opts.buttonsAddBefore.buttons;
            for (var i = 0; i < btns.length; i++)
            {
                this.buttons.splice(index-(1-i), 0, btns[i]);
            }
        }
    },
    _buildHiddenButtons: function()
    {
        if (this.opts.buttonsHide.length !== 0)
        {
            var buttons = this.opts.buttonsHide;
            for (var i = 0; i < buttons.length; i++)
            {
                this.utils.removeFromArrayByValue(this.buttons, buttons[i]);
            }
        }
    },
    _removeExistButtons: function(buttons)
    {
        for (var i = 0; i < buttons.length; i++)
        {
            if (this.opts.buttons.indexOf(buttons[i]) !== -1)
            {
                this.utils.removeFromArrayByValue(buttons, buttons[i]);
            }
        }

        return buttons;
    },
    _setExternalOnFocus: function()
    {
        if (!this.opts.air && this.opts.toolbarExternal)
        {
            this.toolbarModule.setExternal();
        }
    },
    _initToolbar: function()
    {
        this.toolbarModule = (this.opts.air) ? $R.create('toolbar.air', this.app) : $R.create('toolbar.standard', this.app);
    },
    _initButtons: function()
    {
        this.toolbar.setButtons(this.buttons);

        for (var i = 0; i < this.buttons.length; i++)
        {
            var name = this.buttons[i];
            if ($R.buttons[name])
            {
                this.toolbar.addButton(name, $R.buttons[name], false, false, true);
            }
        }
    }
});
$R.add('class', 'toolbar.air', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.$doc = app.$doc;
        this.$win = app.$win;
        this.utils = app.utils;
        this.editor = app.editor;
        this.animate = app.animate;
        this.toolbar = app.toolbar;
        this.container = app.container;
        this.inspector = app.inspector;
        this.selection = app.selection;

        // local
        this.clicks = 0;

        // init
        this._init();
    },
    // public
    stop: function()
    {
        var $wrapper = this.toolbar.getWrapper();
        $wrapper.remove();

        var $editor = this.editor.getElement();
        $editor.off('.redactor-air-trigger-' + this.uuid);

        this.$doc.off('.redactor-air-' + this.uuid);
        this.$doc.off('.redactor-air-trigger-' + this.uuid);

        this.toolbar.stopObservers();
    },
    createSourceHelper: function()
    {
        this.$airHelper = $R.dom('<span>');
        this.$airHelper.addClass('redactor-air-helper');
        this.$airHelper.html('<i class="re-icon-html"></i>');
        this.$airHelper.on('click', function(e)
        {
            e.preventDefault();
            this.app.api('module.source.hide');

        }.bind(this));

        var $container = this.container.getElement();
        $container.append(this.$airHelper);
    },
    destroySourceHelper: function()
    {
        if (this.$airHelper) this.$airHelper.remove();
    },
    openSelected: function()
    {
        setTimeout(function()
        {
            if (this._isSelection()) this._open(false);

        }.bind(this), 0);
    },
    close: function()
    {
        this.$doc.off('.redactor-air-' + this.uuid);

        var $toolbar = this.toolbar.getElement();
        $toolbar.removeClass('open');
        $toolbar.hide();
    },

    // private
    _init: function()
    {
        this.toolbar.create();

        var $wrapper = this.toolbar.getWrapper();
        var $toolbar = this.toolbar.getElement();
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();

        $wrapper.addClass('redactor-toolbar-wrapper-air');
        $toolbar.addClass('redactor-air');
        //$toolbar.addClass('redactor-animate-hide');
        $toolbar.hide();

        $wrapper.append($toolbar);
        $container.prepend($wrapper);

        // open selected
        this.openSelected();

        // events
        this.$doc.on('mouseup.redactor-air-trigger-' + this.uuid, this._open.bind(this));
        $editor.on('keyup.redactor-air-trigger-' + this.uuid, this._openCmd.bind(this));
    },
    _isSelection: function()
    {
        return (this.selection.is() && !this.selection.isCollapsed());
    },
    _isOpened: function()
    {
        var $toolbar = this.toolbar.getElement();

        return $toolbar.hasClass('open');
    },
    _open: function(e)
    {
        var target = (e) ? e.target : false;
        var $el = (e) ? $R.dom(e.target) : false;
        var dataTarget = this.inspector.parse(target);
        var isComponent = (dataTarget.isComponent() && !dataTarget.isComponentType('table'));
        var isFigcaption = (dataTarget.isFigcaption());
        var isModalTarget = ($el && $el.closest('.redactor-modal').length !== 0);
        var isButtonCall = (e && $el.closest('.re-button').length !== 0);
        var isDropdownCall = (e && $el.closest('.redactor-dropdown').length !== 0);

        if (isDropdownCall || isButtonCall || isModalTarget || isFigcaption || isComponent || this.toolbar.isContextBar() || !this._isSelection())
        {
            return;
        }

        var pos = this.selection.getPosition();

        setTimeout(function()
        {
            if (this.app.isReadOnly()) return;
            if (this._isSelection()) this._doOpen(pos);

        }.bind(this), 1);

    },
    _openCmd: function()
    {
        if (this.selection.isAll())
        {
            var $toolbar = this.toolbar.getElement();
            var pos = this.selection.getPosition();

            pos.top = (pos.top < 20) ? 0 : pos.top - $toolbar.height();
            pos.height = 0;

            this._doOpen(pos);
        }
    },
    _doOpen: function(pos)
    {
        var $wrapper = this.toolbar.getWrapper();
        var $toolbar = this.toolbar.getElement();
        var $container = this.container.getElement();
        var containerOffset = $container.offset();
        var leftFix = 0;
        var winWidth = this.$win.width();
        var toolbarWidth = $toolbar.width();

        if (winWidth < (pos.left + toolbarWidth))
        {
            var selPos = this.selection.getPosition();
            leftFix = toolbarWidth - selPos.width;
        }

        $wrapper.css({
            left: (pos.left - containerOffset.left - leftFix) + 'px',
            top: (pos.top - containerOffset.top + pos.height + this.$doc.scrollTop()) + 'px'
        });

        this.app.broadcast('airOpen');
        $toolbar.addClass('open');
        $toolbar.show();

        this.$doc.on('click.redactor-air-' + this.uuid, this._close.bind(this));
        this.$doc.on('keydown.redactor-air-' + this.uuid, this._close.bind(this));
        this.app.broadcast('airOpened');
    },
    _close: function(e)
    {
        var $el = (e) ? $R.dom(e.target) : false;
        var isDropdownCall = (e && $el.closest('[data-dropdown], .redactor-dropdown-not-close').length !== 0);
        var isButtonCall = (!isDropdownCall && e && $el.closest('.re-button').length !== 0);

        if (!isButtonCall && (isDropdownCall || !this._isOpened()))
        {
            return;
        }

        // close
        this.app.broadcast('airClose');

        this.close();
        this.app.broadcast('airClosed');
    }
});
$R.add('class', 'toolbar.fixed', {
    init: function(app)
    {
        this.app = app;
        this.uuid = app.uuid;
        this.opts = app.opts;
        this.$doc = app.$doc;
        this.$win = app.$win;
        this.editor = app.editor;
        this.toolbar = app.toolbar;
        this.detector = app.detector;
        this.container = app.container;

        // init
        this._init();
    },
    // public
    stop: function()
    {
        this.$fixedTarget.off('.redactor-toolbar-' + this.uuid);
        this.$win.off('.redactor-toolbar-' + this.uuid);
    },
    reset: function()
    {
        var $toolbar = this.toolbar.getElement();
        var $wrapper = this.toolbar.getWrapper();

        $wrapper.css('height', '');
        $toolbar.removeClass('redactor-toolbar-fixed');
        $toolbar.css({ position: '', top: '', left: '', width: '' });

        var dropdown = this.toolbar.getDropdown();
        if (dropdown) dropdown.updatePosition();
    },

    // private
    _init: function()
    {
        this.$fixedTarget = (this.toolbar.isTarget()) ? this.toolbar.getTargetElement() : this.$win;
        this._doFixed();

        if (this.toolbar.isTarget())
        {
            this.$win.on('scroll.redactor-toolbar-' + this.uuid, this._doFixed.bind(this));
            this.$win.on('resize.redactor-toolbar-' + this.uuid, this._doFixed.bind(this));
        }

        this.$fixedTarget.on('scroll.redactor-toolbar-' + this.uuid, this._doFixed.bind(this));
        this.$fixedTarget.on('resize.redactor-toolbar-' + this.uuid, this._doFixed.bind(this));
    },
    _doFixed: function()
    {
        var $editor = this.editor.getElement();
        var $container = this.container.getElement();
        var $toolbar = this.toolbar.getElement();
        var $wrapper = this.toolbar.getWrapper();

        var $targets = $container.parents().filter(function(node)
        {
            return (getComputedStyle(node, null).display === 'none') ? node : false;
        });

        // has hidden parent
        if ($targets.length !== 0) return;

        var isHeight = ($editor.height() < 100);
        var isEmpty = this.editor.isEmpty();

        if (isHeight || isEmpty || this.editor.isSourceMode()) return;

        var toolbarHeight = $toolbar.height();
        var toleranceEnd = 60;
        var containerOffset = $container.offset();
        var boxOffset = containerOffset.top;
        var boxEnd = boxOffset + $container.height() - toleranceEnd;
        var scrollOffset = this.$fixedTarget.scrollTop() + this.opts.toolbarFixedTopOffset;
        var top = (!this.toolbar.isTarget()) ? 0 : this.$fixedTarget.offset().top - this.$win.scrollTop();

        if (scrollOffset > boxOffset && scrollOffset < boxEnd)
        {
            var position = (this.detector.isDesktop()) ? 'fixed' : 'absolute';
            top = (this.detector.isDesktop()) ? top : (scrollOffset - boxOffset + this.opts.toolbarFixedTopOffset);

            if (this.detector.isMobile())
            {
                if (this.fixedScrollTimeout)
                {
                    clearTimeout(this.fixedScrollTimeout);
                }

                $toolbar.hide();
                this.fixedScrollTimeout = setTimeout(function()
                {
                    $toolbar.show();
                }, 250);
            }

            $wrapper.height(toolbarHeight);
            $toolbar.addClass('redactor-toolbar-fixed');
            $toolbar.css({
                position: position,
                top: (top + this.opts.toolbarFixedTopOffset) + 'px',
                width: $container.width() + 'px'
            });

            var dropdown = this.toolbar.getDropdown();
            if (dropdown) dropdown.updatePosition();

            this.app.broadcast('toolbar.fixed');
        }
        else
        {
            this.reset();
            this.app.broadcast('toolbar.unfixed');
        }
    }
});
$R.add('class', 'toolbar.standard', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.uuid = app.uuid;
        this.toolbar = app.toolbar;
        this.container = app.container;

        // local
        this.isExternalMultiple = false;
        this.toolbarFixed = false;

        // init
        this._init();
    },
    // public
    stop: function()
    {
        var $wrapper = this.toolbar.getWrapper();
        $wrapper.remove();

        if (this.toolbarFixed) this.toolbarFixed.stop();
        if (this.opts.toolbarExternal) this._findToolbars();

        this.toolbar.stopObservers();
    },
    setExternal: function()
    {
        this._findToolbars();
        if (this.isExternalMultiple)
        {
            this.$toolbars.hide();
            var $current = this.$external.find('.redactor-toolbar-external-' + this.uuid);
            $current.show();
        }
    },
    resetPosition: function()
    {
        if (this.toolbarFixed) this.toolbarFixed.reset();
    },

    // private
    _init: function()
    {
        this._build();

        if (this.opts.toolbarExternal)
        {
            this._buildExternal();
        }
        else
        {
            this._buildFixed();

            var $toolbar = this.toolbar.getElement();
            $toolbar.show();
        }
    },
    _build: function()
    {
        this.toolbar.create();

        var $wrapper = this.toolbar.getWrapper();
        var $toolbar = this.toolbar.getElement();

        $wrapper.addClass('redactor-toolbar-wrapper');
        $toolbar.addClass('redactor-toolbar');
        $toolbar.hide();
        $wrapper.append($toolbar);

        if (!this.opts.toolbarExternal)
        {
            var $container = this.container.getElement();
            $container.prepend($wrapper);
        }
    },
    _buildExternal: function()
    {
        this._initExternal();
        this._findToolbars();

        if (this.isExternalMultiple)
        {
            this._hideToolbarsExceptFirst();
        }
        else
        {
            var $toolbar = this.toolbar.getElement();
            $toolbar.show();
        }
    },
    _buildFixed: function()
    {
        if (this.opts.toolbarFixed)
        {
            this.toolbarFixed = $R.create('toolbar.fixed', this.app);
        }
    },
    _initExternal: function()
    {
        var $toolbar = this.toolbar.getElement();
        var $wrapper = this.toolbar.getElement();

        $toolbar.addClass('redactor-toolbar-external redactor-toolbar-external-' + this.uuid);

        this.$external = $R.dom(this.opts.toolbarExternal);
        this.$external.append($wrapper);

    },
    _findToolbars: function()
    {
        this.$toolbars = this.$external.find('.redactor-toolbar-external');
        this.isExternalMultiple = (this.$toolbars.length > 1);
    },
    _hideToolbarsExceptFirst: function()
    {
        this.$toolbars.hide();
        var $first = this.$toolbars.first();
        $first.show();
    }
});
$R.add('module', 'line', {
    init: function(app)
    {
        this.app = app;
        this.lang = app.lang;
        this.component = app.component;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
    },
    // messages
    oncontextbar: function(e, contextbar)
    {
        var data = this.inspector.parse(e.target);
        if (data.isComponentType('line'))
        {
            var node = data.getComponent();
            var buttons = {
                "remove": {
                    title: this.lang.get('delete'),
                    api: 'module.line.remove',
                    args: node
                }
            };

            contextbar.set(e, node, buttons, 'bottom');
        }

    },

    // public
    insert: function()
    {
        var line = this.component.create('line');
        this.insertion.insertRaw(line);
    },
    remove: function(node)
    {
        this.component.remove(node);
    }
});
$R.add('class', 'line.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },
    // private
    _init: function(el)
    {
        var wrapper, element;
        if (typeof el !== 'undefined')
        {
            var $node = $R.dom(el);
            var node = $node.get();

            if (node.tagName === 'HR') element = node;
            else if (node.tagName === 'FIGURE')
            {
                wrapper = node;
                element = $node.find('hr').get();
            }
        }

        this._buildWrapper(wrapper);
        this._buildElement(element);
        this._initWrapper();
    },
    _buildElement: function(node)
    {
        if (node)
        {
            this.$element = $R.dom(node);
        }
        else
        {
            this.$element = $R.dom('<hr>');
            this.append(this.$element);
        }
    },
    _buildWrapper: function(node)
    {
        node = node || '<figure>';

        this.parse(node);
    },
    _initWrapper: function()
    {
        this.addClass('redactor-component');
        this.attr({
            'data-redactor-type': 'line',
            'tabindex': '-1',
            'contenteditable': false
        });
    }
});
$R.add('module', 'link', {
    modals: {
        'link':
            '<form action=""> \
                <div class="form-item"> \
                    <label for="modal-link-url">URL <span class="req">*</span></label> \
                    <input type="text" id="modal-link-url" name="url"> \
                </div> \
                <div class="form-item"> \
                    <label for="modal-link-text">## text ##</label> \
                    <input type="text" id="modal-link-text" name="text"> \
                </div> \
                <div class="form-item form-item-title"> \
                    <label for="modal-link-title">## title ##</label> \
                    <input type="text" id="modal-link-title" name="title"> \
                </div> \
                <div class="form-item form-item-target"> \
                    <label class="checkbox"> \
                        <input type="checkbox" name="target"> ## link-in-new-tab ## \
                    </label> \
                </div> \
            </form>'
    },
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.lang = app.lang;
        this.caret = app.caret;
        this.utils = app.utils;
        this.inline = app.inline;
        this.editor = app.editor;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
        this.selection = app.selection;

        // local
        this.isCurrentLink = false;
        this.currentText = false;
    },
    // messages
    onmodal: {
        link: {
            open: function($modal, $form)
            {
                this._setFormData($form, $modal);
            },
            opened: function($modal, $form)
            {
                this._setFormFocus($form);
            },
            update: function($modal, $form)
            {
                var data = $form.getData();
                if (this._validateData($form, data))
                {
                    this._update(data);
                }
            },
            insert: function($modal, $form)
            {
                var data = $form.getData();
                if (this._validateData($form, data))
                {
                    this._insert(data);
                }
            },
            unlink: function()
            {
                this._unlink();
            }
        }
    },
    onbutton: {
        link: {
            observe: function(button)
            {
                this._observeButton(button);
            }
        }
    },
    ondropdown: {
        link: {
            observe: function(dropdown)
            {
                this._observeUnlink(dropdown);
                this._observeEdit(dropdown);
            }
        }
    },
    oncontextbar: function(e, contextbar)
    {
        var current = this._getCurrent();
        var data = this.inspector.parse(current);
        if (data.isLink())
        {
            var node = data.getLink();
            var $el = $R.dom(node);

            var $point = $R.dom('<a>');
            var url = $el.attr('href');

            $point.text(this._truncateText(url));
            $point.attr('href', url);
            $point.attr('target', '_blank');

            var buttons = {
                "link": {
                    title: $point
                },
                "edit": {
                    title: this.lang.get('edit'),
                    api: 'module.link.open'
                },
                "unlink": {
                    title: this.lang.get('unlink'),
                    api: 'module.link.unlink'
                }
            };

            contextbar.set(e, node, buttons, 'bottom');
        }
    },

    // public
    open: function()
    {
        this.$link = this._buildCurrent();
        this.app.api('module.modal.build', this._getModalData());
    },
    insert: function(data)
    {
        this._insert(data);
    },
    update: function(data)
    {
        this._update(data);
    },
    unlink: function()
    {
        this._unlink();
    },

    // private
    _observeButton: function(button)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        if (data.isPre() || data.isCode())
        {
            button.disable();
        }
        else
        {
            button.enable();
        }
    },
    _observeUnlink: function(dropdown)
    {
        var $item = dropdown.getItem('unlink');
        var links = this._getLinks();

        if (links.length === 0) $item.disable();
        else                    $item.enable();
    },
    _observeEdit: function(dropdown)
    {
        var current = this._getCurrent();
        var $item = dropdown.getItem('link');

        var data = this.inspector.parse(current);
        var title = (data.isLink()) ? this.lang.get('link-edit') : this.lang.get('link-insert');

        $item.setTitle(title);
    },
    _unlink: function()
    {
        this.app.api('module.modal.close');

        var elms = [];
        var nodes = this._getLinks();

        this.selection.save();
        for (var i = 0; i < nodes.length; i++)
        {
            var $link = $R.create('link.component', this.app, nodes[i]);
            elms.push(this.selection.getElement(nodes[i]));

            $link.unwrap();

            // callback
            this.app.broadcast('link.deleted', $link);
        }
        this.selection.restore();

        // normalize
        for (var i = 0; i < elms.length; i++)
        {
            var el = (elms[i]) ? elms[i] : this.editor.getElement();
            this.utils.normalizeTextNodes(el);
        }

        this._resetCurrent();
    },
    _update: function(data)
    {
        this.app.api('module.modal.close');

        var nodes = this._getLinks();
        this._setLinkData(nodes, data, 'updated');
        this._resetCurrent();
    },
    _insert: function(data)
    {
        this.app.api('module.modal.close');

        var links = this._getLinks();
        if (!this._insertSingle(links, data))
        {
            this._removeInSelection(links);
            this._insertMultiple(data);
        }

        this._resetCurrent();
    },
    _removeInSelection: function(links)
    {
        this.selection.save();
        for (var i = 0; i < links.length; i++)
        {
            var $link = $R.create('link.component', this.app, links[i]);
            var $clonedLink = $link.clone();
            $link.unwrap();

            // callback
            this.app.broadcast('link.deleted', $clonedLink);
        }
        this.selection.restore();
    },
    _insertMultiple: function(data)
    {
        var range = this.selection.getRange();
        if (range && this._isCurrentTextChanged(data))
        {
            this._deleteContents(range);
        }

        var nodes = this.inline.format({ tag: 'a' });

        this._setLinkData(nodes, data, 'inserted');
    },
    _insertSingle: function(links, data)
    {
        var inline = this.selection.getInline();
        if (links.length === 1 && (links[0].textContext === this.selection.getText()) || (inline && inline.tagName === 'A'))
        {
            var $link = $R.create('link.component', this.app, links[0]);

            $link.setData(data);
            this.caret.setAfter($link);

            // callback
            this.app.broadcast('link.inserted', $link);

            return true;
        }

        return false;
    },
    _setLinkData: function(nodes, data, type)
    {
        data.text = (data.text.trim() === '') ? this._truncateText(data.url) : data.text;

        var isTextChanged = (!this.currentText || this.currentText !== data.text);

        this.selection.save();
        for (var i = 0; i < nodes.length; i++)
        {
            var $link = $R.create('link.component', this.app, nodes[i]);
            var linkData = {};

            if (data.text && isTextChanged) linkData.text = data.text;
            if (data.url) linkData.url = data.url;
            if (data.title !== undefined) linkData.title = data.title;
            if (data.target !== undefined) linkData.target = data.target;

            $link.setData(linkData);

            // callback
            this.app.broadcast('link.' + type, $link);
        }

        setTimeout(this.selection.restore.bind(this.selection), 0);
    },
    _deleteContents: function(range)
    {
        var html = this.selection.getHtml();
        var parsed = this.utils.parseHtml(html);
        var first = parsed.nodes[0];

        if (first && first.nodeType !== 3)
        {
            var tag = first.tagName.toLowerCase();
            var container = document.createElement(tag);

            this.insertion.insertNode(container, 'start');
        }
        else
        {
            range.deleteContents();
        }
    },
    _getModalData: function()
    {
        var commands;
        if (this._isLink())
        {
           commands = {
                update: { title: this.lang.get('save') },
                unlink: { title: this.lang.get('unlink'), type: 'danger' },
                cancel: { title: this.lang.get('cancel') }
            };
        }
        else
        {
            commands = {
                insert: { title: this.lang.get('insert') },
                cancel: { title: this.lang.get('cancel') }
            };
        }

        var modalData = {
            name: 'link',
            title: (this._isLink()) ? this.lang.get('link-edit') : this.lang.get('link-insert'),
            handle: (this._isLink()) ? 'update' : 'insert',
            commands: commands
        };


        return modalData;
    },
    _isLink: function()
    {
        return this.currentLink;
    },
    _isCurrentTextChanged: function(data)
    {
        return (this.currentText && this.currentText !== data.text);
    },
    _buildCurrent: function()
    {
        var current = this._getCurrent();
        var data = this.inspector.parse(current);
        var $link;

        if (data.isLink())
        {
            this.currentLink = true;

            $link = data.getLink();
            $link = $R.create('link.component', this.app, $link);
        }
        else
        {
            this.currentLink = false;

            $link = $R.create('link.component', this.app);
            var linkData = {
                text: this.selection.getText()
            };

            $link.setData(linkData);
        }

        return $link;
    },
    _getCurrent: function()
    {
        return this.selection.getInlinesAllSelected({ tags: ['a'] })[0];
    },
    _getLinks: function()
    {
        var links = this.selection.getInlines({ all: true, tags: ['a'] });
        var arr = [];
        for (var i = 0; i < links.length; i++)
        {
            var data = this.inspector.parse(links[i]);
            if (data.isLink())
            {
                arr.push(links[i]);
            }
        }

        return arr;
    },
    _resetCurrent: function()
    {
        this.isCurrentLink = false;
        this.currentText = false;
    },
    _truncateText: function(url)
    {
        return (url && url.length > this.opts.linkSize) ? url.substring(0, this.opts.linkSize) + '...' : url;
    },
    _validateData: function($form, data)
    {
        return (data.url.trim() === '') ? $form.setError('url') : true;
    },
    _setFormFocus: function($form)
    {
        $form.getField('url').focus();
    },
    _setFormData: function($form, $modal)
    {
        var linkData = this.$link.getData();
        var data = {
            url: linkData.url,
            text: linkData.text,
            title: linkData.title,
            target: (this.opts.linkTarget || linkData.target)
        };

        if (!this.opts.linkNewTab) $modal.find('.form-item-target').hide();
        if (!this.opts.linkTitle) $modal.find('.form-item-title').hide();

        $form.setData(data);
        this.currentText = $form.getField('text').val();
    }
});
$R.add('class', 'link.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;
        this.opts = app.opts;

        // local
        this.reUrl = /^(?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

        // init
        return (el && el.cmnt !== undefined) ? el :  this._init(el);
    },

    // public
    setData: function(data)
    {
        for (var name in data)
        {
            this._set(name, data[name]);
        }
    },
    getData: function()
    {
        var names = ['url', 'text', 'target', 'title'];
        var data = {};

        for (var i = 0; i < names.length; i++)
        {
            data[names[i]] = this._get(names[i]);
        }

        return data;
    },

    // private
    _init: function(el)
    {
        var $el = $R.dom(el);
        if (el === undefined)
        {
            this.parse('<a>');
        }
        else
        {
            this.parse($el);
        }
    },
    _set: function(name, value)
    {
        this['_set_' + name](value);
    },
    _get: function(name)
    {
        return this['_get_' + name]();
    },
    _get_target: function()
    {
        return (this.attr('target')) ? this.attr('target') : false;
    },
    _get_url: function()
    {
        return this.attr('href');
    },
    _get_title: function()
    {
        return this.attr('title');
    },
    _get_text: function()
    {
        return this._getContext().text();
    },
    _getContext: function()
    {
        return this._findDeepestChild(this).element;
    },
    _set_target: function(target)
    {
        if (target === false) this.removeAttr('target');
        else if (target)
        {
            this.attr('target', (target === true) ? '_blank' : target);
        }
    },
    _set_text: function(text)
    {
        this._getContext().html(text);
    },
    _set_title: function(title)
    {
        if (!title || title === '') this.removeAttr('title');
        else this.attr('title', title);
    },
    _set_url: function(url)
    {
        if (this.opts.linkValidation)
        {
            url = this._cleanUrl(url);

            if (this._isMailto(url))
            {
                url = 'mailto:' + url.replace('mailto:', '');
            }
            else if (this._isUrl(url) && url.search(/^(ftp|https?)/i) === -1)
            {
                url = 'http://' + url.replace(/(ftp|https?):\/\//i, '');
            }
        }

        this.attr('href', url);
    },
    _isMailto: function(url)
    {
        return (url.search('@') !== -1 && /(ftp|https?):\/\//i.test(url) === false);
    },
    _isUrl: function(url)
    {
        return this.reUrl.test(url);
    },
    _cleanUrl: function(url)
    {
        return url.trim().replace(/[^\W\w\D\d+&\'@#/%?=~_|!:,.;\(\)]/gi, '');
    },
    _findDeepestChild: function(parent)
    {
        var result = {depth: 0, element: parent };

        parent.children().each(function(node)
        {
            var child = $R.dom(node);

            if (node.outerHTML !== parent.html())
            {
                return;
            }
            else
            {
                var childResult = this._findDeepestChild(child);
                if (childResult.depth + 1 > result.depth)
                {
                    result = {
                        depth: 1 + childResult.depth,
                        element: childResult.element
                    };
                }
            }
        }.bind(this));

        return result;
    }
});
$R.add('module', 'modal', {
    init: function(app)
    {
        this.app = app;
        this.lang = app.lang;
        this.$doc = app.$doc;
        this.$win = app.$win;
        this.$body = app.$body;
        this.animate = app.animate;
        this.detector = app.detector;
        this.selection = app.selection;

        // local
        this.$box = false;
        this.$modal = false;
        this.selectionMarkers = false;

        // defaults
        this.defaults = {
            name: false,
            url: false,
            title: false,
            width: '600px',
            height: false,
            handle: false,
            commands: false
        };
    },
    // public
    build: function(data)
    {
        this._open(data);
    },
    close: function()
    {
        this._close();
    },
    stop: function()
    {
        if (this.$box)
        {
            this.$box.remove();
            this.$box = false;
            this.$modal = false;

            this.$doc.off('.redactor.modal');
            this.$win.off('.redactor.modal');
        }

        if (this.$overlay)
        {
            this.$overlay.remove();
        }
    },
    resize: function()
    {
        this.$modal.setWidth(this.p.width);
        this.$modal.updatePosition();
    },

    // private
    _isOpened: function()
    {
        return (this.$modal && this.$modal.hasClass('open'));
    },
    _open: function(data)
    {
        this._buildDefaults(data);

        if (this.p.url) this._openUrl();
        else this._openTemplate();
    },
    _openUrl: function()
    {
        $R.ajax.post({
            url: this.p.url,
            success: this._doOpen.bind(this)
        });
    },
    _openTemplate: function()
    {
        if (typeof $R.modals[this.p.name] !== 'undefined')
        {
            var template = this.lang.parse($R.modals[this.p.name]);
            this._doOpen(template);
        }
    },
    _doOpen: function(template)
    {
        this.stop();

        if (this.selection.isCollapsed())
        {
            this.selection.save();
            this.selectionMarkers = false;
        }
        else
        {
            this.selection.saveMarkers();
            this.selectionMarkers = true;
        }

        if (!this.detector.isDesktop())
        {
            document.activeElement.blur();
        }

        this._createModal(template);

        this._buildModalBox();
        this._buildOverlay();
        this._buildModal();
        this._buildModalForm();
        this._buildModalCommands();

        this._broadcast('open');

        this.$modal.updatePosition();
        this._buildModalTabs();

        this.animate.start(this.$box, 'fadeIn', this._opened.bind(this));
        this.animate.start(this.$overlay, 'fadeIn');

    },
    _opened: function()
    {
        this.$modal.addClass('open');
        this.$box.on('mousedown.redactor.modal', this._close.bind(this));
        this.$doc.on('keyup.redactor.modal', this._handleEscape.bind(this));
        this.$win.on('resize.redactor.modal', this.resize.bind(this));
        this.$modal.getBody().find('input[type=text],input[type=url],input[type=email]').on('keydown.redactor.modal', this._handleEnter.bind(this));

        // fix bootstrap modal focus
        if (window.jQuery) jQuery(document).off('focusin.modal');

        this._broadcast('opened');
    },
    _close: function(e)
    {
        if (!this.$box || !this._isOpened()) return;

        if (e)
        {
            if (!this._needToClose(e.target))
            {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
        }

        if (this.selectionMarkers) this.selection.restoreMarkers();
        else this.selection.restore();

        this.selectionMarkers = false;

        this._broadcast('close');

        this.animate.start(this.$box, 'fadeOut', this._closed.bind(this));
        this.animate.start(this.$overlay, 'fadeOut');
    },
    _closed: function()
    {
        this.$modal.removeClass('open');
        this.$box.off('.redactor.modal');
        this.$doc.off('.redactor.modal');
        this.$win.off('.redactor.modal');

        this._broadcast('closed');
    },
    _createModal: function(template)
    {
        this.$modal = $R.create('modal.element', this.app, template);
    },
    _broadcast: function(message)
    {
        this.app.broadcast('modal.' + message, this.$modal, this.$modalForm);
        this.app.broadcast('modal.' + this.p.name + '.' + message, this.$modal, this.$modalForm);
    },
    _buildDefaults: function(data)
    {
         this.p = $R.extend({}, this.defaults, data);
    },
    _buildModalBox: function()
    {
        this.$box = $R.dom('<div>');
        this.$box.attr('id', 'redactor-modal');
        this.$box.addClass('redactor-animate-hide');
        this.$box.html('');
        this.$body.append(this.$box);
    },
    _buildOverlay: function()
    {
        this.$overlay = $R.dom('#redactor-overlay');
        if (this.$overlay.length === 0)
        {
            this.$overlay = $R.dom('<div>');
            this.$overlay.attr('id', 'redactor-overlay');
            this.$overlay.addClass('redactor-animate-hide');
            this.$body.prepend(this.$overlay);
        }
    },
    _buildModal: function()
    {
        this.$box.append(this.$modal);

        this.$modal.setTitle(this.p.title);
        this.$modal.setHeight(this.p.height);
        this.$modal.setWidth(this.p.width);
    },
    _buildModalCommands: function()
    {
        if (this.p.commands)
        {
            var commands = this.p.commands;
            var $footer = this.$modal.getFooter();
            for (var key in commands)
            {
                var $btn = $R.dom('<button>');

                $btn.html(commands[key].title);
                $btn.attr('data-command', key);

                // cancel
                if (key === 'cancel')
                {
                    $btn.attr('data-action', 'close');
                    $btn.addClass('redactor-button-unstyled');
                }

                // danger
                if (typeof commands[key].type !== 'undefined' && commands[key].type === 'danger')
                {
                    $btn.addClass('redactor-button-danger');
                }

                $btn.on('click', this._handleCommand.bind(this));

                $footer.append($btn);
            }
        }

    },
    _buildModalTabs: function()
    {
        var $body = this.$modal.getBody();
        var $tabs = $body.find('.redactor-modal-tab');
        var $box = $body.find('.redactor-modal-tabs');

        if ($tabs.length > 1)
        {
            $box = ($box.length === 0) ? $R.dom('<div>') : $box.html('');
            $box.addClass('redactor-modal-tabs');

            $tabs.each(function(node, i)
            {
                var $node = $R.dom(node);
                var $item = $R.dom('<a>');
                $item.attr('href', '#');
                $item.attr('rel', i);
                $item.text($node.attr('data-title'));
                $item.on('click', this._showTab.bind(this));

                if (i === 0)
                {
                    $item.addClass('active');
                }

                $box.append($item);

            }.bind(this));

            $body.prepend($box);
        }
    },
    _buildModalForm: function()
    {
        this.$modalForm = $R.create('modal.form', this.app, this.$modal.getForm());
    },
    _showTab: function(e)
    {
        e.preventDefault();

        var $el = $R.dom(e.target);
        var index = $el.attr('rel');
        var $body = this.$modal.getBody();
        var $tabs = $body.find('.redactor-modal-tab');

        $tabs.hide();
        $tabs.eq(index).show();

        $body.find('.redactor-modal-tabs a').removeClass('active');
        $el.addClass('active');

    },
    _needToClose: function(el)
    {
        var $target = $R.dom(el);
        if ($target.attr('data-action') === 'close' || this.$modal.isCloseNode(el) || $target.closest('.redactor-modal').length === 0)
        {
            return true;
        }

        return false;
    },
    _handleCommand: function(e)
    {
        var $btn = $R.dom(e.target).closest('button');
        var command = $btn.attr('data-command');

        if (command !== 'cancel') e.preventDefault();

        this._broadcast(command);

    },
    _handleEnter: function(e)
    {
        if (e.which === 13)
        {
            if (this.p.handle)
            {
                e.preventDefault();
                this._broadcast(this.p.handle);
            }
        }
    },
    _handleEscape: function(e)
    {
        if (e.which === 27) this._close();
    }
});
$R.add('class', 'modal.element', {
    mixins: ['dom'],
    init: function(app, template)
    {
        this.app = app;
        this.opts = app.opts;
        this.$win = app.$win;

        // init
        this._init(template);
    },

    // get
    getForm: function()
    {
        return this.find('form');
    },
    getHeader: function()
    {
        return this.$modalHeader;
    },
    getBody: function()
    {
        return this.$modalBody;
    },
    getFooter: function()
    {
        return this.$modalFooter;
    },

    // set
    setTitle: function(title)
    {
        if (title) this.$modalHeader.html(title);
    },
    setWidth: function(width)
    {
        width = (parseInt(width) >= this.$win.width()) ? '96%' : width;

        this.css('max-width', width);
    },
    setHeight: function(height)
    {
        if (height !== false) this.$modalBody.css('height', height);
    },

    // update
    updatePosition: function()
    {
        var width = this.width();
        this.css({ 'left': '50%', 'margin-left': '-' + (width/2) + 'px' });

        var windowHeight = this.$win.height();
        var height = this.height();
        var marginTop = (windowHeight/2 - height/2);

        if (height < windowHeight && marginTop !== 0)
        {
            this.css('margin-top', marginTop + 'px');
        }
    },

    // is
    isCloseNode: function(el)
    {
        return (el === this.$modalClose.get());
    },

    // private
    _init: function(template)
    {
        this._build();
        this._buildClose();
        this._buildHeader();
        this._buildBody();
        this._buildFooter();
        this._buildTemplate(template);
    },
    _build: function()
    {
        this.parse('<div>');
        this.addClass('redactor-modal');
        this.attr('dir', this.opts.direction);
    },
    _buildClose: function()
    {
        this.$modalClose = $R.dom('<span>');
        this.$modalClose.addClass('redactor-close');

        this.append(this.$modalClose);
    },
    _buildHeader: function()
    {
        this.$modalHeader = $R.dom('<div>');
        this.$modalHeader.addClass('redactor-modal-header');

        this.append(this.$modalHeader);
    },
    _buildBody: function()
    {
        this.$modalBody = $R.dom('<div>');
        this.$modalBody.addClass('redactor-modal-body');

        this.append(this.$modalBody);
    },
    _buildFooter: function()
    {
        this.$modalFooter = $R.dom('<div>');
        this.$modalFooter.addClass('redactor-modal-footer');

        this.append(this.$modalFooter);
    },
    _buildTemplate: function(template)
    {
        this.$modalBody.html(template);
    }
});
$R.add('class', 'modal.form', {
    mixins: ['dom'],
    init: function(app, element)
    {
        this.app = app;

        // build
        this.build(element);
    },

    // public
    build: function(element)
    {
        this.parse(element);
    },
    getData: function()
    {
        var data = {};
        this.find('[name]').each(function(node)
        {
            var $node = $R.dom(node);
            data[$node.attr('name')] = $node.val();
        });

        return data;
    },
    setData: function(data)
    {
        this.find('[name]').each(function(node)
        {
            var $node = $R.dom(node);
            var name = $node.attr('name');
            if (data.hasOwnProperty(name))
            {
                if (node.type && node.type === 'checkbox') node.checked = data[name];
                else $node.val(data[name]);
            }
        });
    },
    getField: function(name)
    {
        return this.find('[name=' + name + ']');
    },
    setError: function(name)
    {
        var $el = this.getField(name);

        $el.addClass('error');
        $el.one(this._getFieldEventName($el.get()), this._clearError);

        return false;
    },

    // private
    _clearError: function()
    {
        return $R.dom(this).removeClass('error');
    },
    _getFieldEventName: function(el)
    {
        return (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'keyup';
    }
});
$R.add('module', 'block', {
    init: function(app)
    {
        this.app = app;
        this.block = app.block;
    },
    // public
    format: function(args)
    {
        var nodes = this.block.format(args);

        // callback
        this.app.broadcast('format', 'block', nodes);
    },
    clearformat: function()
    {
        this.block.clearFormat();
    },
    clearstyle: function()
    {
        this.block.clearStyle();
    },
    clearclass: function()
    {
        this.block.clearClass();
    },
    clearattr: function()
    {
        this.block.clearAttr();
    },
    add: function(args, tags)
    {
        this.block.add(args, tags);
    },
    toggle: function(args, tags)
    {
        this.block.toggle(args, tags);
    },
    set: function(args, tags)
    {
        this.block.set(args, tags);
    },
    remove: function(args, tags)
    {
        this.block.remove(args, tags);
    }
});
$R.add('module', 'inline', {
    init: function(app)
    {
        this.app = app;
        this.inline = app.inline;
    },
    format: function(args)
    {
        var nodes = this.inline.format(args);

        // callback
        this.app.broadcast('format', 'inline', nodes);
    },
    clearformat: function()
    {
        this.inline.clearFormat();
    },
    clearstyle: function()
    {
        this.inline.clearStyle();
    },
    clearclass: function()
    {
        this.inline.clearClass();
    },
    clearattr: function()
    {
        this.inline.clearAttr();
    },
    add: function(args, tags)
    {
        this.inline.add(args, tags);
    },
    toggle: function(args, tags)
    {
        this.inline.toggle(args, tags);
    },
    set: function(args, tags)
    {
        this.inline.set(args, tags);
    },
    remove: function(args, tags)
    {
        this.inline.remove(args, tags);
    }
});
$R.add('module', 'autosave', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.source = app.source;
    },
    // messages
    onsynced: function()
    {
        if (this.opts.autosave)
        {
            this._send();
        }
    },

    // private
    _send: function()
    {
        var name = (this.opts.autosaveName) ? this.opts.autosaveName : this.source.getName();

        var data = {};
        data[name] = this.source.getCode();
        data = this.utils.extendData(data, this.opts.autosaveData);

        $R.ajax.post({
            url: this.opts.autosave,
            data: data,
            success: function(response)
            {
                this._complete(response, name, data);
            }.bind(this)
        });
    },
    _complete: function(response, name, data)
    {
        var callback = (response && response.error) ? 'autosaveError' : 'autosave';
        this.app.broadcast(callback, name, data, response);
    }
});
$R.add('module', 'input', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.editor = app.editor;
        this.keycodes = app.keycodes;
        this.element = app.element;
        this.selection = app.selection;
        this.insertion = app.insertion;
        this.inspector = app.inspector;
        this.autoparser = app.autoparser;

        // local
        this.lastShiftKey = false;
    },
    // messages
    onpaste: function(e, dataTransfer)
    {
        if (!this.opts.input) return;

        return $R.create('input.paste', this.app, e, dataTransfer);
    },
    onkeydown: function(e)
    {
        if (!this.opts.input) return;

        // key
        var key = e.which;

        // shortcuts
        var shortcut = $R.create('input.shortcut', this.app, e);
        if (shortcut.is()) return;

        // select all
        if ((e.ctrlKey || e.metaKey) && !e.altKey && key === 65)
        {
            e.preventDefault();
            return this._selectAll();
        }

        // set empty if all selected
        var keys = [this.keycodes.ENTER, this.keycodes.SPACE, this.keycodes.BACKSPACE, this.keycodes.DELETE];
        var isKeys = (keys.indexOf(key) !== -1);
        var isXKey = ((e.ctrlKey || e.metaKey) && key === 88); // x
        var isAlphaKeys = ((!e.ctrlKey && !e.metaKey) && ((key >= 48 && key <= 57) || (key >= 65 && key <= 90)));

        if (this.selection.isAll() && (isXKey || (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey)))
        {
            if (isXKey)
            {
                this.editor.disableNonEditables();
                this.app.broadcast('empty');
                return;
            }

            if (this._isArrowKey(key)) return true;
            if (isKeys) e.preventDefault();

            if (this.element.isType('inline'))
            {
                var $editor = this.editor.getElement();
                $editor.html('');

                this.editor.startFocus();
            }
            else
            {
                this.insertion.set(this.opts.emptyHtml);
            }

            if (isKeys) return;
            else this.app.broadcast('empty');
        }

        // autoparse
        if (this.opts.autoparse)
        {
            this.autoparser.format(e, key);
        }

        // a-z, 0-9 - non editable
        if (isAlphaKeys)
        {
            // has non-editable
            if (this.selection.hasNonEditable())
            {
                e.preventDefault();
                return;
            }
        }

        // enter, shift/ctrl + enter
        if (key === this.keycodes.ENTER)
        {
            return $R.create('input.enter', this.app, e, key);
        }
        // cmd + [
        else if (e.metaKey && key === 219)
        {
            e.preventDefault();
            this.app.api('module.list.outdent');
            return;
        }
        // tab or cmd + ]
        else if (key === this.keycodes.TAB || e.metaKey && key === 221)
        {
            return $R.create('input.tab', this.app, e, key);
        }
        // space
        else if (key === this.keycodes.SPACE)
        {
            return $R.create('input.space', this.app, e, key, this.lastShiftKey);
        }
        // backspace or delete
        else if (this._isDeleteKey(key))
        {
            return $R.create('input.delete', this.app, e, key);
        }
        else if (this._isArrowKey(key))
        {
            return $R.create('input.arrow', this.app, e, key);
        }
    },
    onkeyup: function(e)
    {
        if (!this.opts.input) return;

        // key
        var key = e.which;

        // shift key
        this.lastShiftKey = e.shiftKey;

        // hide context toolbar
        this.app.broadcast('contextbar.close');

        // shortcode
        var shortcode = $R.create('input.shortcode', this.app, e, key);
        if (shortcode.is()) return;

        // is empty
        if (key === this.keycodes.BACKSPACE)
        {
            var $editor = this.editor.getElement();
            var html = this.utils.trimSpaces($editor.html());
            html = html.replace(/<br\s?\/?>/g, '');
            html = html.replace(/<div><\/div>/, '');

            if (html === '')
            {
                e.preventDefault();
                this.editor.setEmpty();
                this.editor.startFocus();
                return;
            }
        }

        if (this.editor.isEmpty())
        {
            this.app.broadcast('empty');
        }
    },

    // public
    start: function()
    {
        // extend shortcuts
        if (this.opts.shortcutsAdd)
        {
            this.opts.shortcuts = $R.extend({}, true, this.opts.shortcuts, this.opts.shortcutsAdd);
        }
    },

    // private
    _selectAll: function()
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var el;

        if (data.isComponentType('table'))
        {
            el = data.getTable();
            this.selection.setAll(el);
            return;
        }
        else if (data.isComponentType('code'))
        {
            el = data.getComponentCodeElement();
            this.selection.setAll(el);
            return;
        }

        this.selection.setAll();
    },
    _isArrowKey: function(key)
    {
        return ([this.keycodes.UP, this.keycodes.DOWN, this.keycodes.RIGHT, this.keycodes.LEFT].indexOf(key) !== -1);
    },
    _isDeleteKey: function(key)
    {
        return (key === this.keycodes.BACKSPACE || key === this.keycodes.DELETE);
    }
});
$R.add('class', 'input.arrow', {
    init: function(app, e, key)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.caret = app.caret;
        this.offset = app.offset;
        this.marker = app.marker;
        this.editor = app.editor;
        this.keycodes = app.keycodes;
        this.component = app.component;
        this.inspector = app.inspector;
        this.selection = app.selection;

        // local
        this.key = key;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        if (this._isRightLeftKey() && this._isExitVariable(e)) return;

        if (this._isRightDownKey())
        {
            if (this._isExitOnDownRight(e)) return;
            if (this._selectComponent(e, 'End', 'next')) return;
        }

        if (this._isLeftUpKey())
        {
            if (this._isExitOnUpLeft(e)) return;
            if (this._selectComponent(e, 'Start', 'prev')) return;
        }

        if (this.key === this.keycodes.LEFT) this.utils.trimInvisibleChars('left');
        else if (this.key === this.keycodes.RIGHT) this.utils.trimInvisibleChars('right');

    },
    _isRightDownKey: function()
    {
        return ([this.keycodes.DOWN, this.keycodes.RIGHT].indexOf(this.key) !== -1);
    },
    _isLeftUpKey: function()
    {
        return ([this.keycodes.UP, this.keycodes.LEFT].indexOf(this.key) !== -1);
    },
    _isRightLeftKey: function()
    {
        return ([this.keycodes.RIGHT, this.keycodes.LEFT].indexOf(this.key) !== -1);
    },
    _isExitVariable: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var component = data.getComponent();
        if (data.isComponentType('variable') && data.isComponentActive())
        {
            e.preventDefault();
            var func = (this.key === this.keycodes.LEFT) ? 'setBefore' : 'setAfter';
            this.caret[func](component);
            return;
        }
    },
    _isExitOnUpLeft: function(e)
    {
        var current = this.selection.getCurrent();
        var block = this.selection.getBlock(current);
        var data = this.inspector.parse(current);
        var prev = block.previousElementSibling;
        var isStart = this.caret.isStart(block);

        // prev table
        if (isStart && prev && prev.tagName === 'TABLE')
        {
            e.preventDefault();
            this.caret.setEnd(prev);
            return true;
        }
        // figcaption
        else if (data.isFigcaption())
        {
            block = data.getFigcaption();
            isStart = this.caret.isStart(block);

            var $component = $R.dom(block).closest('.redactor-component');
            if (isStart && $component.length !== 0)
            {
                e.preventDefault();
                this.caret.setEnd($component);
                return true;
            }
        }
        // exit table
        else if (data.isTable() && isStart)
        {
            e.preventDefault();
            this.caret.setEnd(block.previousElementSibling);
            return true;
        }
        // component
        else if (!data.isComponentEditable() && data.isComponent() && !data.isComponentType('variable'))
        {
            var component = data.getComponent();
            if (component.previousElementSibling)
            {
                e.preventDefault();
                this.component.clearActive();
                this.caret.setEnd(component.previousElementSibling);
                return true;
            }
        }
    },
    _isExitOnDownRight: function(e)
    {
        var $editor = this.editor.getElement();
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var isEndEditor = this.caret.isEnd();
        var block, isEnd;

        // table
        if (data.isTable())
        {
            if (isEnd || isEndEditor)
            {
                return this._exitNextElement(e, data.getComponent());
            }
        }
        // figcaption
        else if (data.isFigcaption())
        {
            block = data.getFigcaption();
            isEnd = this.caret.isEnd(block);

            if (isEnd || isEndEditor)
            {
                return this._exitNextElement(e, data.getComponent());
            }
        }
        // figure/code
        else if (data.isComponentType('code'))
        {
            var component = data.getComponent();
            var pre = $R.dom(data.getComponentCodeElement()).closest('pre');

            isEnd = this.caret.isEnd(block);

            var isNext = (pre && pre.get().nextElementSibling);
            if (isEnd && !isNext)
            {
                return this._exitNextElement(e, component);
            }
        }
        // pre & blockquote & dl
        else if (data.isPre() || data.isBlockquote() || data.isDl())
        {
            if (isEndEditor)
            {
                if (data.isPre()) return this._exitNextElement(e, data.getPre());
                else if (data.isBlockquote()) return this._exitNextElement(e, data.getBlockquote());
                else if (data.isDl()) return this._exitNextElement(e, data.getDl());
            }
        }
        // li
        else if (data.isList())
        {
            var $list = $R.dom(current).parents('ul, ol', $editor).last();
            isEnd = this.caret.isEnd($list);

            if (isEnd || isEndEditor)
            {
                return this._exitNextElement(e, $list.get());
            }
        }
        // component
        else if (data.isComponent() && !data.isComponentType('variable') && data.getTag() !== 'span')
        {
            this.component.clearActive();
            return this._exitNextElement(e, data.getComponent());
        }
    },
    _exitNextElement: function(e, node)
    {
        e.preventDefault();

        if (node.nextElementSibling) this.caret.setStart(node.nextElementSibling);
        else this.utils.createMarkup(node);

        return true;
    },
    _selectComponent: function(e, caret, type)
    {
        var current = this.selection.getCurrent();
        var block = this.selection.getBlock(current);
        var sibling = this.utils.findSiblings(current, type);
        var siblingBlock = this.utils.findSiblings(block, type);

        if (sibling && this.caret['is' + caret](current))
        {
            this._selectComponentItem(e, sibling, caret);
        }
        else if (siblingBlock && this.caret['is' + caret](block))
        {
            this._selectComponentItem(e, siblingBlock, caret);
        }
    },
    _selectComponentItem: function(e, item, caret)
    {
        if (this.component.isNonEditable(item))
        {
            e.preventDefault();
            this.caret['set' + caret](item);
            return true;
        }
    }
});
$R.add('class', 'input.delete', {
    init: function(app, e, key)
    {
        this.app = app;
        this.opts = app.opts;
        this.caret = app.caret;
        this.utils = app.utils;
        this.editor = app.editor;
        this.marker = app.marker;
        this.keycodes = app.keycodes;
        this.component = app.component;
        this.inspector = app.inspector;
        this.selection = app.selection;

        // local
        this.key = key;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        if (this._removeActiveComponent(e)) return;
        if (this._removeAllSelectedTable(e)) return;

        // is empty
        if (this.key === this.keycodes.BACKSPACE)
        {
            var $editor = this.editor.getElement();
            var html = this.utils.trimSpaces($editor.html());

            if (html === this.opts.emptyHtml)
            {
                e.preventDefault();
                return;
            }
        }

        // variable or non editable prev/next or selection
        if (this._detectVariableOrNonEditable() || this.selection.hasNonEditable())
        {
            e.preventDefault();
            return;
        }

        // collapsed
        if (this.selection.isCollapsed())
        {
            // next / prev
            if (this.key === this.keycodes.BACKSPACE) this._traverseBackspace(e);
            else if (this.key === this.keycodes.DELETE) this._traverseDelete(e);
        }

        if (this.key === this.keycodes.BACKSPACE) this.utils.trimInvisibleChars('left');

        this._removeUnwantedStyles();
        this._removeEmptySpans();
        this._removeSpanTagsInHeadings();
        this._removeInlineTagsInPre();
    },
    _detectVariableOrNonEditable: function()
    {
        var block = this.selection.getBlock();
        var isBlockStart = this.caret.isStart(block);
        var isBlockEnd = this.caret.isEnd(block);
        var el;

        // backspace
        if (this.key === this.keycodes.BACKSPACE && isBlockStart)
        {
            el = block.previousSibling;
            if (this._isNonEditable(el)) return true;
        }
        // delete
        else if (this.key === this.keycodes.DELETE && isBlockEnd)
        {
            el = block.nextSibling;
            if (this._isNonEditable(el)) return true;
        }

        var current = this.selection.getCurrent();
        var isCurrentStart = this.caret.isStart(current);
        var isCurrentEnd = this.caret.isEnd(current);
        var isCurrentStartSpace = (this.selection.getTextBeforeCaret().trim() === '');
        var isCurrentEndSpace = (this.selection.getTextAfterCaret().trim() === '');

        // backspace
        if (this.key === this.keycodes.BACKSPACE && isCurrentStart && !isCurrentStartSpace)
        {
            el = current.previousSibling;
            if (this._isVariable(el))
            {
                this.caret.setEnd(el);
                return true;
            }
            else if (this._isNonEditable(el)) return true;
        }
        // delete
        else if (this.key === this.keycodes.DELETE && isCurrentEnd && !isCurrentEndSpace)
        {
            el = current.nextSibling;
            if (this._isVariable(el))
            {
                this.caret.setStart(el);
                return true;
            }
            else if (this._isNonEditable(el)) return true;
        }
    },
    _isVariable: function(node)
    {
        return ($R.dom(node).closest('[data-redactor-type="variable"]').length !== 0);
    },
    _isNonEditable: function(node)
    {
        return ($R.dom(node).closest('.non-editable').length !== 0);
    },
    _getBlock: function()
    {
        var $editor = this.editor.getElement();
        var block = this.selection.getBlock();
        var data = this.inspector.parse(block);

        block = (data.isList()) ? $R.dom(block).parents('ul, ol', $editor).last().get() : block;
        block = (data.isDl()) ? data.getDl() : block;
        block = (data.isTable()) ? data.getTable() : block;

        return block;
    },
    _traverseDelete: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var block, isEnd, $next;

        // figcaption
        if (data.isFigcaption())
        {
            block = data.getFigcaption();
            isEnd = this.caret.isEnd(block);

            if (isEnd)
            {
                e.preventDefault();
                return;
            }
        }
        // figure/code
        else if (data.isComponentType('code'))
        {
            block = data.getComponent();
            isEnd = this.caret.isEnd(block);

            if (isEnd)
            {
                e.preventDefault();
                return;
            }
        }

        // next
        block = this._getBlock();
        var next = this.utils.findSiblings(block, 'next');
        if (!next) return;

        isEnd = this.caret.isEnd(block);
        var dataNext = this.inspector.parse(next);
        var isNextBlock = (next.tagName === 'P' || next.tagName === 'DIV');

        // figure/code or table
        if (isEnd && dataNext.isComponentEditable())
        {
            e.preventDefault();
            this.component.remove(next, false);
            return;
        }
        // component
        else if (isEnd && dataNext.isComponent())
        {
            e.preventDefault();

            // select component
            this.caret.setStart(next);

            // remove current if empty
            if (this.utils.isEmptyHtml(block.innerHTML))
            {
                $R.dom(block).remove();
            }

            return;
        }
        // combine list
        else if (isEnd && dataNext.isList())
        {
            var $currentList = $R.dom(block);
            $next = $R.dom(next);

            // current list
            if (data.isList())
            {
                e.preventDefault();

                $currentList.append($next);
                $next.unwrap();

                return;
            }
            else
            {
                var $first = $next.children('li').first();
                var $lists = $first.find('ul, ol');

                if ($lists.length !== 0)
                {
                    e.preventDefault();

                    $next.prepend($lists);
                    $lists.unwrap();

                    $currentList.append($first);
                    $first.unwrap();

                    return;
                }
            }
        }
        // block
        else if (isEnd && !data.isList() && !data.isTable() && isNextBlock && !this.utils.isEmptyHtml(block.innerHTML))
        {
            e.preventDefault();

            var $current = $R.dom(block);
            $next = $R.dom(next);

            $current.append($next);
            $next.unwrap();

            return;
        }
    },
    _traverseBackspace: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var block, isStart, $prev, $currentList;

        // figcaption
        if (data.isFigcaption())
        {
            block = data.getFigcaption();
            isStart = this.caret.isStart(block);

            if (isStart)
            {
                e.preventDefault();
                return;
            }
        }
        // figure/code
        else if (data.isComponentType('code'))
        {
            block = data.getComponent();
            isStart = this.caret.isStart(block);

            if (isStart && block.previousElementSibling)
            {
                e.preventDefault();
                this.caret.setEnd(block.previousElementSibling);
                return true;
            }
        }

        // prev
        block = this._getBlock();
        var prev = this.utils.findSiblings(block, 'prev');

        if (!prev)
        {
            setTimeout(this._replaceBlock.bind(this), 1);
            return;
        }

        isStart = this.caret.isStart(block);
        var dataPrev = this.inspector.parse(prev);
        var isPrevBlock = (prev.tagName === 'P' || prev.tagName === 'DIV');

        // figure/code or table
        if (isStart && dataPrev.isComponentEditable())
        {
            e.preventDefault();
            this.component.remove(prev, false);
            return;
        }
        // component
        else if (isStart && dataPrev.isComponent())
        {
            e.preventDefault();

            // select component
            this.caret.setStart(prev);

            // remove current if empty
            if (this.utils.isEmptyHtml(block.innerHTML))
            {
                $R.dom(block).remove();
            }

            return;
        }
        // lists
        else if (isStart && data.isList())
        {
            e.preventDefault();

            $currentList = $R.dom(block);
            $prev = $R.dom(prev);

            if (dataPrev.isList())
            {
                $currentList.children('li').first().prepend(this.marker.build('start'));
                $prev.append($currentList);
                $currentList.unwrap();

                this.selection.restoreMarkers();
            }
            else
            {
                var $first = $currentList.children('li').first();
                var first = $first.get();
                var $lists = $first.find('ul, ol');

                var $newnode = this.utils.replaceToTag(first, this.opts.markup);
                if (this.opts.breakline) $newnode.attr('data-redactor-tag', 'br');
                $currentList.before($newnode);
                this.caret.setStart($newnode);

                if ($lists.length !== 0)
                {
                    $currentList.prepend($lists);
                    $lists.unwrap();
                }
            }

            return;
        }
        // block
        else if (isStart && isPrevBlock)
        {
            e.preventDefault();

            var textNode = this.utils.createInvisibleChar();
            var $current = $R.dom(block);
            $prev = $R.dom(prev);

            this.caret.setEnd($prev);

            $current.prepend(textNode);
            $prev.append($current.contents());
            $current.remove();

            return;
        }
    },
    _replaceBlock: function()
    {
        var block = this.selection.getBlock();
        var $block = $R.dom(block);

        if (this.opts.markup === 'p' && block && this._isNeedToReplaceBlock(block))
        {
            var markup = document.createElement(this.opts.markup);

            $block.replaceWith(markup);
            this.caret.setStart(markup);
        }

        if (this.opts.breakline && block && block.tagName === 'DIV')
        {
            $block.attr('data-redactor-tag', 'br');
        }
    },
    _isNeedToReplaceBlock: function(block)
    {
        return (block.tagName === 'DIV' && this.utils.isEmptyHtml(block.innerHTML));
    },
    _removeActiveComponent: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var component = data.getComponent();
        if (data.isComponent() && this.component.isActive(component))
        {
            e.preventDefault();
            this.component.remove(component);
            return true;
        }
    },
    _removeAllSelectedTable: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var table = data.getTable();
        if (table && this.selection.isAll(table))
        {
            e.preventDefault();
            this.component.remove(table);
            return true;
        }
    },
    _removeUnwantedStyles: function()
    {
        var $editor = this.editor.getElement();

        setTimeout(function()
        {
            var $tags = $editor.find('*[style]');
            $tags.not('img, figure, iframe, [data-redactor-style-cache], [data-redactor-span]').removeAttr('style');

        }, 0);
    },
    _removeEmptySpans: function()
    {
        var $editor = this.editor.getElement();

        setTimeout(function()
        {
            $editor.find('span').each(function(node)
            {
                if (node.attributes.length === 0)
                {
                    $R.dom(node).replaceWith(node.childNodes);
                }
            });

        }, 0);
    },
    _removeSpanTagsInHeadings: function()
    {
        var $editor = this.editor.getElement();

        setTimeout(function()
        {
            $editor.find('h1, h2, h3, h4, h5, h6').each(function(node)
            {
                var $node = $R.dom(node);
                if ($node.closest('figure').length === 0)
                {
                    $node.find('span').not('.redactor-component, .non-editable, .redactor-selection-marker, [data-redactor-style-cache], [data-redactor-span]').unwrap();
                }
            });

        }, 1);
    },
    _removeInlineTagsInPre: function()
    {
        var $editor = this.editor.getElement();
        var tags = this.opts.inlineTags;

        setTimeout(function()
        {
            $editor.find('pre').each(function(node)
            {
                var $node = $R.dom(node);
                if ($node.closest('figure').length === 0)
                {
                    $node.find(tags.join(',')).not('code, .redactor-selection-marker').unwrap();
                }
            });

        }, 1);
    }
});
$R.add('class', 'input.enter', {
    init: function(app, e)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.caret = app.caret;
        this.editor = app.editor;
        this.insertion = app.insertion;
        this.selection = app.selection;
        this.inspector = app.inspector;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        // turn off
        if (!this.opts.enterKey) return this._disable(e);

        // callback
        var stop = this.app.broadcast('enter', e);
        if (stop === false) return e.preventDefault();

        // has non-editable
        if (this.selection.hasNonEditable())
        {
            e.preventDefault();
            return;
        }

        // shift enter
        if (e.ctrlKey || e.shiftKey) return this._insertBreak(e);

        // enter & exit
        if (this._isExit(e)) return;

        // traverse
        this._traverse(e);
    },
    _disable: function(e)
    {
        e.preventDefault();
        var range = this.selection.getRange();
        if (range && !range.collapsed) range.deleteContents();
    },
    _insertBreak: function(e)
    {
        e.preventDefault();

        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        if ((data.isComponent() && !data.isComponentEditable()) || data.isCode()) return;
        else if (data.isPre()) this.insertion.insertNewline();
        else this.insertion.insertBreakLine();
    },
    _isExit: function(e)
    {
        var $editor = this.editor.getElement();
        var block = this.selection.getBlock();
        var data = this.inspector.parse(block);
        var isEnd = this.caret.isEnd(block);
        var current = this.selection.getCurrent();
        var prev = current.previousSibling;

        // blockquote
        if (data.isBlockquote())
        {
            var isParagraphExit = (isEnd && this._isExitableBlock(block, 'P'));
            var isBreaklineExit = (isEnd && this._isExitableDblBreak(prev));

            if (isParagraphExit || isBreaklineExit)
            {
                return this._exitFromElement(e, ((isBreaklineExit) ? prev : block), data.getBlockquote());
            }
        }
        // pre
        else if (!data.isComponentType('code') && data.isPre())
        {
            if (isEnd)
            {
                var html = block.innerHTML;
                html = this.utils.removeInvisibleChars(html);
                if (html.match(/(\n\n\n)$/) !== null)
                {
                    $R.dom(prev.previousSibling.previousSibling).remove();
                    return this._exitFromElement(e, prev, block);
                }
            }
        }
        // dl
        else if (data.isDl())
        {
            if (isEnd && this._isExitableBlock(block, 'DT'))
            {
                return this._exitFromElement(e, block, data.getDl());
            }
        }
        // li
        else if (data.isList())
        {
            var list = $R.dom(current).parents('ul, ol', $editor).last();

            isEnd = this.caret.isEnd(list);
            if (isEnd && this._isExitableBlock(block, 'LI'))
            {
                return this._exitFromElement(e, block, list);
            }
        }
        else if (data.isComponent() && data.isComponentActive() && !data.isFigcaption() && !data.isComponentEditable())
        {
            return this._exitFromElement(e, false, data.getComponent());
        }
    },
    _isExitableDblBreak: function(prev)
    {
        var next = (prev) ? prev.nextSibling : false;
        if (next)
        {
            var text = this.utils.removeInvisibleChars(next.textContent);

            return (next.nodeType === 3 && text.trim() === '');
        }
    },
    _isExitableBlock: function(block, tag)
    {
        return (block && block.tagName === tag && this.utils.isEmptyHtml(block.innerHTML));
    },
    _exitFromElement: function(e, prev, el)
    {
        e.preventDefault();
        if (prev) $R.dom(prev).remove();
        this.utils.createMarkup(el);

        return true;
    },
    _exitNextElement: function(e, node)
    {
        e.preventDefault();

        if (node.nextSibling) this.caret.setStart(node.nextSibling);
        else this.utils.createMarkup(node);

        return true;
    },
    _traverse: function(e)
    {
        var current = this.selection.getCurrent();
        var isText = this.selection.isText();
        var block = this.selection.getBlock();
        var data = this.inspector.parse(current);
        var blockTag = (block) ? block.tagName.toLowerCase() : false;

        // pre
        if (data.isPre())
        {
            e.preventDefault();
            return this.insertion.insertNewline();
        }
        // blockquote
        else if (data.isBlockquote())
        {
            block = this.selection.getBlock(current);
            if (block && block.tagName === 'BLOCKQUOTE')
            {
                e.preventDefault();
                return this.insertion.insertBreakLine();
            }
        }
        // figcaption
        else if (data.isFigcaption())
        {
            block = data.getFigcaption();
            var isEnd = this.caret.isEnd(block);
            var isEndEditor = this.caret.isEnd();
            if (isEnd || isEndEditor)
            {
                return this._exitNextElement(e, data.getComponent());
            }
            else
            {
                e.preventDefault();
                return;
            }
        }
        // dl
        else if (data.isDl())
        {
            e.preventDefault();
            return this._traverseDl(current);
        }
        // text
        else if (isText || (this.opts.breakline && blockTag === 'div'))
        {
            e.preventDefault();
            return this.insertion.insertBreakLine();
        }
        // div / p
        else
        {
            setTimeout(this._replaceBlock.bind(this), 1);
            return;
        }
    },
    _traverseDl: function(current)
    {
        var block = this.selection.getBlock(current);
        var data = this.inspector.parse(block);
        var tag = data.getTag();
        var $el = $R.dom(block);
        var next = $el.get().nextSibling || false;
        var $next = $R.dom(next);
        var nextDd = (next && $next.is('dd'));
        var nextDt = (next && $next.is('dt'));
        var isEnd = this.caret.isEnd(block);

        if (tag === 'dt' && !nextDd && isEnd)
        {
            var dd = document.createElement('dd');
            $el.after(dd);

            this.caret.setStart(dd);
            return;
        }
        else if (tag === 'dd' && !nextDt && isEnd)
        {
            var dt = document.createElement('dt');
            $el.after(dt);

            this.caret.setStart(dt);
            return;
        }

        return this.insertion.insertBreakLine();
    },
    _replaceBlock: function()
    {
        var block = this.selection.getBlock();
        var $block = $R.dom(block);

        if (this.opts.markup === 'p' && block && this._isNeedToReplaceBlock(block))
        {
            var markup = document.createElement(this.opts.markup);

            $block.replaceWith(markup);
            this.caret.setStart(markup);
        }
        else
        {
            if (block)
            {
                if (this.utils.isEmptyHtml(block.innerHTML))
                {
                    this._clearBlock($block, block);
                }
                else
                {
                    var first = this.utils.getFirstNode(block);
                    if (first && first.tagName === 'BR')
                    {
                        $R.dom(first).remove();
                        this.caret.setStart(block);
                    }
                }
            }
        }

        if (block && this._isNeedToCleanBlockStyle(block) && this.opts.cleanOnEnter)
        {
            $block.removeAttr('class style');
        }

        if (this.opts.breakline && block && block.tagName === 'DIV')
        {
            $block.attr('data-redactor-tag', 'br');
        }
    },
    _clearBlock: function($block, block)
    {
        if (this.opts.cleanInlineOnEnter || block.innerHTML === '<br>')
        {
            $block.html('');
        }

        this.caret.setStart(block);
    },
    _isNeedToReplaceBlock: function(block)
    {
        return (block.tagName === 'DIV' && this.utils.isEmptyHtml(block.innerHTML));
    },
    _isNeedToCleanBlockStyle: function(block)
    {
        return (block.tagName === 'P' && this.utils.isEmptyHtml(block.innerHTML));
    }
});
$R.add('class', 'input.paste', {
    init: function(app, e, dataTransfer, html, point)
    {
        this.app = app;
        this.opts = app.opts;
        this.editor = app.editor;
        this.cleaner = app.cleaner;
        this.container = app.container;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
        this.selection = app.selection;
        this.autoparser = app.autoparser;

        // local
        this.pasteHtml = html;
        this.pointInserted = point;
        this.dataTransfer = dataTransfer;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        var clipboard = this.dataTransfer || e.clipboardData;
        var current = this.selection.getCurrent();
        var dataCurrent = this.inspector.parse(current);

        this.dropPasted = this.dataTransfer;
        this.isRawCode = (dataCurrent.isPre() || dataCurrent.isCode());

        this.editor.enablePasting();
        this.editor.saveScroll();

        if (!this.dropPasted)
        {
            this.selection.saveMarkers();
        }

        if (this.isRawCode || !clipboard)
        {
            var text;
            if (!this.isRawCode && !clipboard && window.clipboardData)
            {
                text = window.clipboardData.getData("text");
            }
            else
            {
                text = clipboard.getData("text/plain");
            }

            e.preventDefault();
            this._insert(e, text);
            return;
        }
        else if (this.pasteHtml)
        {
            e.preventDefault();
            this._insert(e, this.pasteHtml);
        }
        else
        {
            // html / text
            var url = clipboard.getData('URL');
            var html = (this._isPlainText(clipboard)) ? clipboard.getData("text/plain") : clipboard.getData("text/html");

            // safari anchor links
            html = (!url || url === '') ? html : url;

            // file
            if (clipboard.files.length > 0 && html === '')
            {
                var files = [];
                for (var i = 0; i < clipboard.files.length; i++)
                {
                    var file = clipboard.files[i] || clipboard.items[i].getAsFile();
                    if (file) files.push(file);
                }

                if (files.length > 0)
                {
                    e.preventDefault();
                    this._insertFiles(e, files);
                    return;
                }
            }


            e.preventDefault();
            this._insert(e, html);
        }
    },
    _isPlainText: function(clipboard)
    {
        var text = clipboard.getData("text/plain");
        var html = clipboard.getData("text/html");

        if (text && html)
        {
            var element = document.createElement("div");
            element.innerHTML = html;

            if (element.textContent === text)
            {
                return !element.querySelector(":not(meta)");
            }
        }
        else
        {
            return (text !== null);
        }
    },
    _restoreSelection: function()
    {
        this.editor.restoreScroll();
        this.editor.disablePasting();
        if (!this.dropPasted)
        {
            this.selection.restoreMarkers();
        }
    },
    _insert: function(e, html)
    {
        // pasteBefore callback
        var returned = this.app.broadcast('pasteBefore', html);
        html = (returned === undefined) ? html : returned;

        // clean
        html = (this.isRawCode) ? html : this.cleaner.paste(html);
        html = (this.isRawCode) ? this.cleaner.encodePhpCode(html) : html;

        // paste callback
        returned = this.app.broadcast('pasting', html);
        html = (returned === undefined) ? html : returned;

        this._restoreSelection();

        // stop input
        if (!this.opts.input) return;

        // autoparse
        if (this.opts.autoparse && this.opts.autoparsePaste)
        {
            html = this.autoparser.parse(html);
        }

        var nodes = (this.dropPasted) ? this.insertion.insertToPoint(e, html, this.pointInserted) : this.insertion.insertHtml(html);

        // pasted callback
        this.app.broadcast('pasted', nodes);
        this.app.broadcast('autoparseobserve');
    },
    _insertFiles: function(e, files)
    {
        this._restoreSelection();

        // drop or clipboard
        var isImage = (this.opts.imageTypes.indexOf(files[0].type) !== -1);
        var isClipboard = (typeof this.dropPasted === 'undefined');

        if (isImage) this.app.broadcast('dropimage', e, files, isClipboard);
        else this.app.broadcast('dropfile', e, files, isClipboard);
    }
});
$R.add('class', 'input.shortcode', {
    init: function(app, e, key)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.marker = app.marker;
        this.keycodes = app.keycodes;
        this.selection = app.selection;

        // local
        this.worked = false;

        // init
        if (key === this.keycodes.SPACE) this._init();
    },
    // public
    is: function()
    {
        return this.worked;
    },
    // private
    _init: function()
    {
        var current = this.selection.getCurrent();
        if (current && current.nodeType === 3)
        {
            var text = this.utils.removeInvisibleChars(current.textContent);
            var shortcodes = this.opts.shortcodes;
            for (var name in shortcodes)
            {
                var re = new RegExp('^' + this.utils.escapeRegExp(name));
                var match = text.match(re);
                if (match !== null)
                {
                    if (typeof shortcodes[name].format !== 'undefined')
                    {
                        return this._format(shortcodes[name].format, current, re);
                    }
                }
            }
        }
    },
    _format: function(tag, current, re)
    {
        var marker = this.marker.insert('start');
        current = marker.previousSibling;

        var text = current.textContent;
        text = this.utils.trimSpaces(text);
        text = text.replace(re, '');
        current.textContent = text;

        var api = (tag === 'ul' || tag === 'ol') ? 'module.list.toggle' : 'module.block.format';

        this.app.api(api, tag);
        this.selection.restoreMarkers();

        this.worked = true;
    }
});
$R.add('class', 'input.shortcut', {
    init: function(app, e)
    {
        this.app = app;
        this.opts = app.opts;

        // local
        this.worked = false;

        // based on https://github.com/jeresig/jquery.hotkeys
        this.hotkeys = {
            8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
            20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
            37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 59: ";", 61: "=",
            96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
            104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
            112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
            120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 173: "-", 186: ";", 187: "=",
            188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "'"
        };

        this.hotkeysShiftNums = {
            "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
            "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
            ".": ">",  "/": "?",  "\\": "|"
        };

        // init
        this._init(e);
    },
    // public
    is: function()
    {
        return this.worked;
    },
    // private
    _init: function(e)
    {
        // disable browser's hot keys for bold and italic if shortcuts off
        if (this.opts.shortcuts === false)
        {
            if ((e.ctrlKey || e.metaKey) && (e.which === 66 || e.which === 73)) e.preventDefault();
            return;
        }

        // build
        for (var key in this.opts.shortcuts)
        {
            this._build(e, key, this.opts.shortcuts[key]);
        }
    },
    _build: function(e, str, command)
    {
        var keys = str.split(',');
        var len = keys.length;
        for (var i = 0; i < len; i++)
        {
            if (typeof keys[i] === 'string')
            {
                this._handler(e, keys[i].trim(), command);
            }
        }
    },
    _handler: function(e, keys, command)
    {
        keys = keys.toLowerCase().split(" ");

        var special = this.hotkeys[e.keyCode];
        var character = String.fromCharCode(e.which).toLowerCase();
        var modif = "", possible = {};
        var cmdKeys = ["alt", "ctrl", "meta", "shift"];

        for (var i = 0; i < cmdKeys.length; i++)
        {
            var specialKey = cmdKeys[i];
            if (e[specialKey + 'Key'] && special !== specialKey)
            {
                modif += specialKey + '+';
            }
        }

        if (special) possible[modif + special] = true;
        if (character)
        {
            possible[modif + character] = true;
            possible[modif + this.hotkeysShiftNums[character]] = true;

            // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
            if (modif === "shift+")
            {
                possible[this.hotkeysShiftNums[character]] = true;
            }
        }

        var len = keys.length;
        for (var i = 0; i < len; i++)
        {
            if (possible[keys[i]])
            {
                e.preventDefault();
                this.worked = true;

                if (command.message)
                {
                    this.app.broadcast(command.message, command.args);
                }
                else if (command.api)
                {
                    this.app.api(command.api, command.args);
                }

                return;
            }
        }
    }
});
$R.add('class', 'input.space', {
    init: function(app, e, key, lastShiftKey)
    {
        this.app = app;
        this.keycodes = app.keycodes;
        this.insertion = app.insertion;
        this.selection = app.selection;

        // local
        this.key = key;
        this.lastShiftKey = lastShiftKey;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        // has non-editable
        if (this.selection.hasNonEditable())
        {
            e.preventDefault();
            return;
        }

        // shift/ctrl + space
        if (!this.lastShiftKey && this.key === this.keycodes.SPACE && (e.ctrlKey || e.shiftKey) && !e.metaKey)
        {
            e.preventDefault();
            this.insertion.insertChar('&nbsp;');
            return;
        }
    }
});
$R.add('class', 'input.tab', {
    init: function(app, e)
    {
        this.app = app;
        this.opts = app.opts;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
        this.selection = app.selection;

        // init
        this._init(e);
    },
    // private
    _init: function(e)
    {
        // turn off tab
        if (!this.opts.tabKey) return;

        // callback
        var stop = this.app.broadcast('tab', e);
        if (stop === false) return e.preventDefault();

        // traverse
        this._traverse(e);
    },
    _traverse: function(e)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        // hard tab
        if (!data.isComponent() && e.shiftKey)
        {
            return this._insertHardTab(e, 4);
        }

        // list
        if (data.isList())
        {
            e.preventDefault();
            return this.app.api('module.list.indent');
        }
        // pre
        if (data.isPre() || (data.isComponentType('code') && !data.isFigcaption()))
        {
            return this._tabCode(e);
        }

        // tab as spaces
        if (this.opts.tabAsSpaces !== false)
        {
            return this._insertHardTab(e, this.opts.tabAsSpaces);
        }
    },
    _insertHardTab: function(e, num)
    {
        e.preventDefault();
        var node = document.createTextNode(Array(num + 1).join('\u00a0'));
        return this.insertion.insertNode(node, 'end');
    },
    _tabCode: function(e)
    {
        e.preventDefault();

        var node = (this.opts.preSpaces) ? document.createTextNode(Array(this.opts.preSpaces + 1).join('\u00a0')) : document.createTextNode('\t');

        return this.insertion.insertNode(node, 'end');
    }
});
$R.add('module', 'upload', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.lang = app.lang;
        this.utils = app.utils;
        this.editor = app.editor;
        this.progress = app.progress;

        // local
        this.defaults = {
            event: false,
            element: false,
            name: false,
            files: false,
            url: false,
            data: false,
            paramName: false
        };
    },
    // public
    build: function(options)
    {
        this.p = $R.extend(this.defaults, options);
        this.$el = $R.dom(this.p.element);

        if (this.$el.get().tagName === 'INPUT') this._buildInput();
        else                                    this._buildBox();
    },
    send: function(options)
    {
        this.p = $R.extend(this.defaults, options);
        this.$uploadbox = this.editor.getElement();
        this._send(this.p.event, this.p.files);
    },
    complete: function(response, e)
    {
        this._complete(response, e);
    },

    // private
    _buildInput: function()
    {
        this.box = false;
        this.prefix = '';

        this.$uploadbox = $R.dom('<div class="upload-box" />');

        this.$el.hide();
        this.$el.after(this.$uploadbox);

        if (this.opts.multipleUpload) this.$el.attr('multiple', 'multiple');
        else this.$el.removeAttr('multiple');

        this._buildPlaceholder();
        this._buildEvents();
    },
    _buildBox: function()
    {
        this.box = true;
        this.prefix = 'box-';

        this.$uploadbox = this.$el;
        this.$uploadbox.attr('ondragstart', 'return false;');

        // events
        this.$uploadbox.on('drop.redactor.upload', this._onDropBox.bind(this));
        this.$uploadbox.on('dragover.redactor.upload', this._onDragOver.bind(this));
        this.$uploadbox.on('dragleave.redactor.upload', this._onDragLeave.bind(this));
    },
    _buildPlaceholder: function()
    {
        this.$placeholder = $R.dom('<div class="upload-placeholder" />');
        this.$placeholder.html(this.lang.get('upload-label'));
        this.$uploadbox.append(this.$placeholder);
    },
    _buildEvents: function()
    {
        this.$el.on('change.redactor.upload', this._onChange.bind(this));
        this.$uploadbox.on('click.redactor.upload', this._onClick.bind(this));
        this.$uploadbox.on('drop.redactor.upload', this._onDrop.bind(this));
        this.$uploadbox.on('dragover.redactor.upload', this._onDragOver.bind(this));
        this.$uploadbox.on('dragleave.redactor.upload', this._onDragLeave.bind(this));
    },
    _onClick: function(e)
    {
        e.preventDefault();
        this.$el.click();
    },
    _onChange: function(e)
    {
        this._send(e, this.$el.get().files);
    },
    _onDrop: function(e)
    {
        e.preventDefault();

        this._clear();
        this._setStatusDrop();
        this._send(e);
    },
    _onDragOver: function(e)
    {
        e.preventDefault();
        this._setStatusHover();

        return false;
    },
    _onDragLeave: function(e)
    {
        e.preventDefault();
        this._removeStatusHover();

        return false;
    },
    _onDropBox: function(e)
    {
        e.preventDefault();

        this._clear();
        this._setStatusDrop();
        this._send(e);
    },
    _removeStatusHover: function()
    {
        this.$uploadbox.removeClass('upload-' + this.prefix + 'hover');
    },
    _setStatusDrop: function()
    {
        this.$uploadbox.addClass('upload-' + this.prefix + 'drop');
    },
    _setStatusHover: function()
    {
        this.$uploadbox.addClass('upload-' + this.prefix + 'hover');
    },
    _setStatusError: function()
    {
        this.$uploadbox.addClass('upload-' + this.prefix + 'error');
    },
    _setStatusSuccess: function()
    {
        this.$uploadbox.addClass('upload-' + this.prefix + 'success');
    },
    _clear: function()
    {
        var classes = ['drop', 'hover', 'error', 'success'];
        for (var i = 0; i < classes.length; i++)
        {
            this.$uploadbox.removeClass('upload-' + this.prefix + classes[i]);
        }

        this.$uploadbox.removeAttr('ondragstart');
    },
    _send: function(e, files)
    {
        e = e.originalEvent || e;

        files = (files) ? files : e.dataTransfer.files;

        var data = new FormData();
        var name = this._getUploadParam();

        data = this._buildData(name, files, data);
        data = this.utils.extendData(data, this.p.data);

        var stop = this.app.broadcast('upload.start', e, data, files);
        if (stop !== false)
        {
            this._sendData(data, files, e);
        }
    },
    _sendData: function(data, files, e)
    {
        this.progress.show();
        if (typeof this.p.url === 'function')
        {
            var res = this.p.url(data, files, e, this);
            if (!(res instanceof Promise))
            {
                this._complete(res, e);
            }
        }
        else
        {
            $R.ajax.post({
                url: this.p.url,
                data: data,
                before: function(xhr)
                {
                    return this.app.broadcast('upload.beforeSend', xhr);

                }.bind(this),
                success: function(response)
                {
                    this._complete(response, e);
                }.bind(this)
            });
        }
    },
    _getUploadParam: function()
    {
        return (this.p.paramName) ? this.p.paramName : 'file';
    },
    _buildData: function(name, files, data)
    {
        if (files.length === 1)
        {
            data.append(name + '[]', files[0]);
        }
        else if (files.length > 1 && this.opts.multipleUpload !== false)
        {
            for (var i = 0; i < files.length; i++)
            {
                data.append(name + '[]', files[i]);
            }
        }

        return data;
    },
    _complete: function(response, e)
    {
        this._clear();
        this.progress.hide();

        if (response && response.error)
        {
            this._setStatusError();

            this.app.broadcast('upload.' + this.p.name + '.error', response, e);
            this.app.broadcast('upload.error', response);
        }
        else
        {
            this._setStatusSuccess();

            this.app.broadcast('upload.' + this.p.name + '.complete', response, e);
            this.app.broadcast('upload.complete', response);

            setTimeout(this._clear.bind(this), 500);
        }
    }
});
$R.add('class', 'code.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },

    // private
   _init: function(el)
    {
        var $pre;
        if (typeof el !== 'undefined')
        {
            var $node = $R.dom(el);
            var $wrapper = $node.closest('figure');
            if ($wrapper.length !== 0)
            {
                this.parse($wrapper);
            }
            else
            {
                this.parse('<figure>');
                this.append(el);
            }

            $pre = this.find('pre code, pre').last();
        }
        else
        {
            $pre = $R.dom('<pre>');

            this.parse('<figure>');
            this.append($pre);
        }

        this._initElement($pre);
        this._initWrapper();
    },
    _initElement: function($pre)
    {
        $pre.attr({
            'tabindex': '-1',
            'contenteditable': true
        });
    },
    _initWrapper: function()
    {
        this.addClass('redactor-component');
        this.attr({
            'data-redactor-type': 'code',
            'tabindex': '-1',
            'contenteditable': false
        });
    }
});
$R.add('module', 'form', {
    init: function(app)
    {
        this.app = app;
        this.lang = app.lang;
        this.component = app.component;
        this.inspector = app.inspector;
    },
    // messages
    onform: {
        remove: function(node)
        {
            this._remove(node);
        }
    },
    oncontextbar: function(e, contextbar)
    {
        var data = this.inspector.parse(e.target);
        if (data.isComponentType('form'))
        {
            var node = data.getComponent();
            var buttons = {
                "remove": {
                    title: this.lang.get('delete'),
                    api: 'module.form.remove',
                    args: node
                }
            };

            contextbar.set(e, node, buttons, 'top');
        }

    },

    // private
    _remove: function(node)
    {
        this.component.remove(node);
    }
});
$R.add('class', 'form.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;
        this.utils = app.utils;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },
    // private
    _init: function(el)
    {
        if (typeof el !== 'undefined')
        {
            var $node = $R.dom(el);
            var $wrapper = $node.closest('form');
            if ($wrapper.length !== 0)
            {
                var $figure = this.utils.replaceToTag(el, 'figure');
                this.parse($figure);
            }
            else
            {
                this.parse('<figure>');
                this.append(el);
            }
        }
        else
        {
            this.parse('<figure>');
        }

        this._initWrapper();
    },
    _initWrapper: function()
    {
        this.addClass('redactor-component');
        this.attr({
            'data-redactor-type': 'form',
            'tabindex': '-1',
            'contenteditable': false
        });
    }
});
$R.add('module', 'image', {
    modals: {
        'image':
            '<div class="redactor-modal-tab" data-title="## upload ##"><form action=""> \
                <input type="file" name="file"> \
            </form></div>',
        'imageedit':
            '<div class="redactor-modal-group"> \
                <div id="redactor-modal-image-preview" class="redactor-modal-side"></div> \
                <form action="" class="redactor-modal-area"> \
                    <div class="form-item"> \
                        <label for="modal-image-title"> ## title ##</label> \
                        <input type="text" id="modal-image-title" name="title" /> \
                    </div> \
                    <div class="form-item"> \
                        <label for="modal-image-caption">## caption ##</label> \
                        <input type="text" id="modal-image-caption" name="caption" aria-label="## caption ##" /> \
                    </div> \
                    <div class="form-item form-item-align"> \
                        <label>## image-position ##</label> \
                        <select name="align" aria-label="## image-position ##"> \
                            <option value="none">## none ##</option> \
                            <option value="left">## left ##</option> \
                            <option value="center">## center ##</option> \
                            <option value="right">## right ##</option> \
                        </select> \
                    </div> \
                    <div class="form-item"> \
                        <label for="modal-image-url">## link ##</label> \
                        <input type="text" id="modal-image-url" name="url" aria-label="## link ##" /> \
                    </div> \
                    <div class="form-item"> \
                        <label class="checkbox"><input type="checkbox" name="target" aria-label="## link-in-new-tab ##"> ## link-in-new-tab ##</label> \
                    </div> \
                </form> \
            </div>'
    },
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.lang = app.lang;
        this.caret = app.caret;
        this.utils = app.utils;
        this.editor = app.editor;
        this.storage = app.storage;
        this.component = app.component;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
        this.selection = app.selection;

        // local
        this.justResized = false;
    },
    // messages
    oninsert: function()
    {
        this._observeImages();
    },
    onstarted: function()
    {
        // storage observe
        this.storage.observeImages();

        // resize
        if (this.opts.imageResizable)
        {
            this.resizer = $R.create('image.resize', this.app);
        }

        // observe
        this._observeImages();
    },
    ondropimage: function(e, files, clipboard)
    {
        if (!this.opts.imageUpload) return;

        var options = {
            url: this.opts.imageUpload,
            event: (clipboard) ? false : e,
            files: files,
            name: 'imagedrop',
            data: this.opts.imageData,
            paramName: this.opts.imageUploadParam
        };

        this.app.api('module.upload.send', options);
    },
    onstop: function()
    {
        if (this.resizer) this.resizer.stop();
    },
    onbottomclick: function()
    {
        this.insertion.insertToEnd(this.editor.getLastNode(), 'image');
    },
    onimageresizer: {
        stop: function()
        {
            if (this.resizer) this.resizer.hide();
        }
    },
    onsource: {
        open: function()
        {
            if (this.resizer) this.resizer.hide();
        },
        closed: function()
        {
            this._observeImages();
            if (this.resizer) this.resizer.rebuild();
        }
    },
    onupload: {
        complete: function()
        {
            this._observeImages();
        },
        image: {
            complete: function(response)
            {
                this._insert(response);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        },
        imageedit: {
            complete: function(response)
            {
                this._change(response);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        },
        imagedrop: {
            complete: function(response, e)
            {
                this._insert(response, e);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        },
        imagereplace: {
            complete: function(response)
            {
                this._change(response, false);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        }
    },
    onmodal: {
        image: {
            open: function($modal, $form)
            {
                this._setUpload($form);
            }
        },
        imageedit: {
            open: function($modal, $form)
            {
                this._setFormData($modal, $form);
            },
            opened: function($modal, $form)
            {
                this._setFormFocus($form);
            },
            remove: function()
            {
                this._remove(this.$image);
            },
            save: function($modal, $form)
            {
                this._save($modal, $form);
            }
        }
    },
    onimage: {
        observe: function()
        {
            this._observeImages();
        },
        resized: function()
        {
            this.justResized = true;
        }
    },
    oncontextbar: function(e, contextbar)
    {
        if (this.justResized)
        {
            this.justResized = false;
            return;
        }

        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        if (!data.isFigcaption() && data.isComponentType('image'))
        {
            var node = data.getComponent();
            var buttons = {
                "edit": {
                    title: this.lang.get('edit'),
                    api: 'module.image.open'
                },
                "remove": {
                    title: this.lang.get('delete'),
                    api: 'module.image.remove',
                    args: node
                }
            };

            contextbar.set(e, node, buttons);
        }
    },

    // public
    open: function()
    {
        this.$image = this._getCurrent();
        this.app.api('module.modal.build', this._getModalData());
    },
    insert: function(data)
    {
        this._insert(data);
    },
    remove: function(node)
    {
        this._remove(node);
    },

    // private
    _getModalData: function()
    {
        var modalData;
        if (this._isImage() && this.opts.imageEditable)
        {
            modalData = {
                name: 'imageedit',
                width: '800px',
                title: this.lang.get('edit'),
                handle: 'save',
                commands: {
                    save: { title: this.lang.get('save') },
                    remove: { title: this.lang.get('delete'), type: 'danger' },
                    cancel: { title: this.lang.get('cancel') }
                }
            };
        }
        else
        {
            modalData = {
                name: 'image',
                title: this.lang.get('image')
            };
        }

        return modalData;
    },
    _isImage: function()
    {
        return this.$image;
    },
    _getCurrent: function()
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);

        return (data.isComponentType('image') && data.isComponentActive()) ? this.component.create('image', data.getComponent()) : false;
    },
    _insert: function(response, e)
    {
        this.app.api('module.modal.close');

        if (Array.isArray(response))
        {
            var obj = {};
            for (var i = 0; i < response.length; i++)
            {
                obj = $R.extend(obj, response[i]);
            }

            response = obj;
        }
        else if (typeof response === 'string')
        {
            response = { "file": { url: response }};
        }

        if (typeof response === 'object')
        {
            var multiple = (Object.keys(response).length  > 1);
            if (multiple)
            {
                this._insertMultiple(response, e);
            }
            else
            {
                this._insertSingle(response, e);
            }
        }
    },
    _insertSingle: function(response, e)
    {
        for (var key in response)
        {
            var $img = this._createImageAndStore(response[key]);
            var inserted = (e) ? this.insertion.insertToPoint(e, $img) : this.insertion.insertHtml($img);

            this._removeSpaceBeforeFigure(inserted[0]);

            // set is active
            this.component.setActive(inserted[0]);
            this.app.broadcast('image.uploaded', inserted[0], response);
        }
    },
    _insertMultiple: function(response, e)
    {
        var z = 0;
        var inserted = [];
        var last;
        for (var key in response)
        {
            z++;

            var $img = this._createImageAndStore(response[key]);

            if (z === 1)
            {
                inserted = (e) ? this.insertion.insertToPoint(e, $img) : this.insertion.insertHtml($img);
            }
            else
            {
                var $inserted = $R.dom(inserted[0]);
                $inserted.after($img);
                inserted = [$img.get()];

                this.app.broadcast('image.inserted', $img);
            }

            last = inserted[0];

            this._removeSpaceBeforeFigure(inserted[0]);
            this.app.broadcast('image.uploaded', inserted[0], response);
        }

        // set last is active
        this.component.setActive(last);
    },
    _createImageAndStore: function(item)
    {
        var $img = this.component.create('image');

        $img.addClass('redactor-uploaded-figure');
        $img.setData({
            src: item.url,
            id: (item.id) ? item.id : this.utils.getRandomId()
        });

        // add to storage
        this.storage.add('image', $img.getElement());

        return $img;
    },
    _removeSpaceBeforeFigure: function(img)
    {
        if (!img) return;

        var prev = img.previousSibling;
        if (prev)
        {
            this._removeInvisibleSpace(prev);
            this._removeInvisibleSpace(prev.previousSibling);
        }
    },
    _removeInvisibleSpace: function(el)
    {
        if (el && el.nodeType === 3 && this.utils.searchInvisibleChars(el.textContent) !== -1)
        {
            el.parentNode.removeChild(el);
        }
    },
    _save: function($modal, $form)
    {
        var data = $form.getData();
        var imageData = {
            title: data.title,
            link: { url: data.url, target: data.target }
        };

        if (this.opts.imageCaption) imageData.caption = data.caption;
        if (this.opts.imagePosition) imageData.align = data.align;

        this.$image.setData(imageData);
        if (this.resizer) this.resizer.rebuild();

        this.app.broadcast('image.changed', this.$image);
        this.app.api('module.modal.close');
    },
    _change: function(response, modal)
    {
        if (typeof response === 'string')
        {
            response = { "file": { url: response }};
        }

        if (typeof response === 'object')
        {
            var $img;
            for (var key in response)
            {
                $img = $R.dom('<img>');
                $img.attr('src', response[key].url);

                this.$image.changeImage(response[key]);

                this.app.broadcast('image.changed', this.$image, response);
                this.app.broadcast('image.uploaded', this.$image, response);

                break;
            }

            if (modal !== false)
            {
                $img.on('load', function() { this.$previewBox.html($img); }.bind(this));
            }
        }
    },
    _uploadError: function(response)
    {
        this.app.broadcast('image.uploadError', response);
    },
    _remove: function(node)
    {
        this.app.api('module.modal.close');
        this.component.remove(node);
    },
    _observeImages: function()
    {
        var $editor = this.editor.getElement();
        var self = this;
        $editor.find('img').each(function(node)
        {
            var $node = $R.dom(node);

            $node.off('.drop-to-replace');
            $node.on('dragover.drop-to-replace dragenter.drop-to-replace', function(e)
            {
                e.preventDefault();
                return;
            });

            $node.on('drop.drop-to-replace', function(e)
            {
                if (!self.app.isDragComponentInside())
                {
                    return self._setReplaceUpload(e, $node);
                }
            });
        });
    },
    _setFormData: function($modal, $form)
    {
        this._buildPreview();
        this._buildPreviewUpload();

        var imageData = this.$image.getData();
        var data = {
            title: imageData.title
        };

        // caption
        if (this.opts.imageCaption) data.caption = imageData.caption;
        else $modal.find('.form-item-caption').hide();

        // position
        if (this.opts.imagePosition) data.align = imageData.align;
        else $modal.find('.form-item-align').hide();

        if (imageData.link)
        {
            data.url = imageData.link.url;
            if (imageData.link.target) data.target = true;
        }

        $form.setData(data);
    },
    _setFormFocus: function($form)
    {
        $form.getField('title').focus();
    },
    _setReplaceUpload: function(e, $node)
    {
        e = e.originalEvent || e;
        e.stopPropagation();
        e.preventDefault();

        if (!this.opts.imageUpload) return;

        this.$image = this.component.create('image', $node);

        var options = {
            url: this.opts.imageUpload,
            files: e.dataTransfer.files,
            name: 'imagereplace',
            data: this.opts.imageData,
            paramName: this.opts.imageUploadParam
        };

        this.app.api('module.upload.send', options);

        return;
    },
    _setUpload: function($form)
    {
        var options = {
            url: this.opts.imageUpload,
            element: $form.getField('file'),
            name: 'image',
            data: this.opts.imageData,
            paramName: this.opts.imageUploadParam
        };

        this.app.api('module.upload.build', options);
    },
    _buildPreview: function()
    {
        this.$preview = $R.dom('#redactor-modal-image-preview');

        var imageData = this.$image.getData();
        var $previewImg = $R.dom('<img>');
        $previewImg.attr('src', imageData.src);

        this.$previewBox = $R.dom('<div>');
        this.$previewBox.append($previewImg);

        this.$preview.html('');
        this.$preview.append(this.$previewBox);
    },
    _buildPreviewUpload: function()
    {
        if (!this.opts.imageUpload) return;

        var $desc = $R.dom('<div class="desc">');
        $desc.html(this.lang.get('upload-change-label'));

        this.$preview.append($desc);

        var options = {
            url: this.opts.imageUpload,
            element: this.$previewBox,
            name: 'imageedit',
            paramName: this.opts.imageUploadParam
        };

        this.app.api('module.upload.build', options);
    }
});
$R.add('class', 'image.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;
        this.opts = app.opts;
        this.selection = app.selection;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },
    setData: function(data)
    {
        for (var name in data)
        {
            this._set(name, data[name]);
        }
    },
    getData: function()
    {
        var names = ['src', 'title', 'caption', 'align', 'link', 'id'];
        var data = {};

        for (var i = 0; i < names.length; i++)
        {
            data[names[i]] = this._get(names[i]);
        }

        return data;
    },
    getElement: function()
    {
        return this.$element;
    },
    changeImage: function(data)
    {
        this.$element.attr('src', data.url);
    },


    // private
    _init: function(el)
    {
        var $el = $R.dom(el);
        var $figure = $el.closest('figure');

        if (el === undefined)
        {
            this.$element = $R.dom('<img>');
            this.parse('<figure>');
            this.append(this.$element);
        }
        else if ($figure.length === 0)
        {
            this.parse('<figure>');
            this.$element = $el;
            this.$element.wrap(this);
        }
        else
        {
            this.parse($figure);
            this.$element = this.find('img');
        }

        this._initWrapper();
    },
    _set: function(name, value)
    {
        this['_set_' + name](value);
    },
    _get: function(name)
    {
        return this['_get_' + name]();
    },
    _set_src: function(src)
    {
       this.$element.attr('src', src);
    },
    _set_id: function(id)
    {
       this.$element.attr('data-image', id);
    },
    _set_title: function(title)
    {
        title = title.trim().replace(/(<([^>]+)>)/ig,"");

        if (title === '')
        {
            this.$element.removeAttr('alt');
            this.$element.removeAttr('title');
        }
        else
        {
            this.$element.attr('alt', title);
            this.$element.attr('title', title);
        }

    },
    _set_caption: function(caption)
    {
        var $figcaption = this.find('figcaption');
        if ($figcaption.length === 0)
        {
            $figcaption = $R.dom('<figcaption>');
            $figcaption.attr('contenteditable', 'true');

            this.append($figcaption);
        }

        if (caption === '') $figcaption.remove();
        else $figcaption.html(caption);

        return $figcaption;
    },
    _set_align: function(align)
    {
        var imageFloat = '';
        var imageMargin = '';
        var textAlign = '';
        var $el = this;

        if (typeof this.opts.imagePosition === 'object')
        {
            var positions = this.opts.imagePosition;
            for (var key in positions)
            {
                $el.removeClass(positions[key]);
            }

            var alignClass = (typeof positions[align] !== 'undefined') ? positions[align] : false;
            if (alignClass)
            {
                $el.addClass(alignClass);
            }
        }
        else
        {
            switch (align)
            {
                case 'left':
                    imageFloat = 'left';
                    imageMargin = '0 ' + this.opts.imageFloatMargin + ' ' + this.opts.imageFloatMargin + ' 0';
                break;
                case 'right':
                    imageFloat = 'right';
                    imageMargin = '0 0 ' + this.opts.imageFloatMargin + ' ' + this.opts.imageFloatMargin;
                break;
                case 'center':
                    textAlign = 'center';
                break;
            }

            $el.css({ 'float': imageFloat, 'margin': imageMargin, 'text-align': textAlign });
            $el.attr('rel', $el.attr('style'));
        }
    },
    _set_link: function(data)
    {
        var $link = this._findLink();
        if (data.url === '')
        {
            if ($link) $link.unwrap();

            return;
        }

        if (!$link)
        {
            $link = $R.dom('<a>');
            this.$element.wrap($link);
        }

        $link.attr('href', data.url);

        if (data.target) $link.attr('target', data.target);
        else $link.removeAttr('target');

        return $link;
    },
    _get_src: function()
    {
        return this.$element.attr('src');
    },
    _get_id: function()
    {
        return this.$element.attr('data-image');
    },
    _get_title: function()
    {
        var alt = this.$element.attr('alt');
        var title = this.$element.attr('title');

        if (alt) return alt;
        else if (title) return title;
        else return '';
    },
    _get_caption: function()
    {
        var $figcaption = this.find('figcaption');

        if ($figcaption.length === 0)
        {
            return '';
        }
        else
        {
            return $figcaption.html();
        }
    },
    _get_align: function()
    {
        var align = '';
        if (typeof this.opts.imagePosition === 'object')
        {
            align = 'none';
            var positions = this.opts.imagePosition;
            for (var key in positions)
            {
                if (this.hasClass(positions[key]))
                {
                    align = key;
                    break;
                }
            }
        }
        else
        {
            align = (this.css('text-align') === 'center') ? 'center' : this.css('float');
        }

        return align;
    },
    _get_link: function()
    {
        var $link = this._findLink();
        if ($link)
        {
            var target = ($link.attr('target')) ? true : false;

            return {
                url: $link.attr('href'),
                target: target
            };
        }
    },
    _initWrapper: function()
    {
        this.addClass('redactor-component');
        this.attr({
            'data-redactor-type': 'image',
            'tabindex': '-1',
            'contenteditable': false
        });
    },
    _findLink: function()
    {
        var $link = this.find('a').filter(function(node)
        {
            return ($R.dom(node).closest('figcaption').length === 0);
        });

        if ($link.length !== 0)
        {
            return $link;
        }

        return false;
    }
});
$R.add('class', 'image.resize', {
    init: function(app)
    {
        this.app = app;
        this.$doc = app.$doc;
        this.$win = app.$win;
        this.$body = app.$body;
        this.editor = app.editor;
        this.toolbar = app.toolbar;
        this.inspector = app.inspector;

        // init
        this.$target = (this.toolbar.isTarget()) ? this.toolbar.getTargetElement() : this.$body;
        this._init();
    },
    // public
    rebuild: function()
    {
        this._setResizerPosition();
    },
    hide: function()
    {
        this.$target.find('#redactor-image-resizer').remove();
    },
    stop: function()
    {
        var $editor = this.editor.getElement();
        $editor.off('.redactor.image-resize');

        this.$doc.off('.redactor.image-resize');
        this.$win.off('resize.redactor.image-resize');
        this.hide();
    },

    // private
    _init: function()
    {
        var $editor = this.editor.getElement();
        $editor.on('click.redactor.image-resize', this._build.bind(this));

        this.$win.on('resize.redactor.image-resize', this._setResizerPosition.bind(this));
    },
    _build: function(e)
    {
        this.$target.find('#redactor-image-resizer').remove();

        var data = this.inspector.parse(e.target);
        var $editor = this.editor.getElement();

        if (data.isComponentType('image'))
        {
            this.$resizableBox = $editor;
            this.$resizableImage = $R.dom(data.getImageElement());

            this.$resizer = $R.dom('<span>');
            this.$resizer.attr('id', 'redactor-image-resizer');

            this.$target.append(this.$resizer);

            this._setResizerPosition();
            this.$resizer.on('mousedown touchstart', this._set.bind(this));
        }
    },
    _setResizerPosition: function()
    {
        if (this.$resizer)
        {
            var isTarget = this.toolbar.isTarget();
            var targetOffset = this.$target.offset();
            var offsetFix = 7;
            var topOffset = (isTarget) ? (offsetFix - targetOffset.top + this.$target.scrollTop()) : offsetFix;
            var leftOffset = (isTarget) ? (offsetFix - targetOffset.left) : offsetFix;
            var pos = this.$resizableImage.offset();
            var width = this.$resizableImage.width();
            var height = this.$resizableImage.height();
            var resizerWidth =  this.$resizer.width();
            var resizerHeight =  this.$resizer.height();

            this.$resizer.css({ top: (pos.top + height - resizerHeight + topOffset) + 'px', left: (pos.left + width - resizerWidth + leftOffset) + 'px' });
        }
    },
    _set: function(e)
    {
        e.preventDefault();

        this.resizeHandle = {
            x : e.pageX,
            y : e.pageY,
            el : this.$resizableImage,
            ratio: this.$resizableImage.width() / this.$resizableImage.height(),
            h: this.$resizableImage.height()
        };

        e = e.originalEvent || e;

        if (e.targetTouches)
        {
             this.resizeHandle.x = e.targetTouches[0].pageX;
             this.resizeHandle.y = e.targetTouches[0].pageY;
        }

        this.app.broadcast('contextbar.close');
        this.app.broadcast('image.resize', this.$resizableImage);
        this._start();
    },
    _start: function()
    {
        this.$doc.on('mousemove.redactor.image-resize touchmove.redactor.image-resize', this._move.bind(this));
        this.$doc.on('mouseup.redactor.image-resize touchend.redactor.image-resize', this._stop.bind(this));
    },
    _stop: function()
    {
        this.$doc.off('.redactor.image-resize');
        this.app.broadcast('image.resized', this.$resizableImage);
    },
    _move: function(e)
    {
        e.preventDefault();

        e = e.originalEvent || e;

        var height = this.resizeHandle.h;

        if (e.targetTouches) height += (e.targetTouches[0].pageY -  this.resizeHandle.y);
        else height += (e.pageY -  this.resizeHandle.y);

        var width = height * this.resizeHandle.ratio;

        if (height < 50 || width < 100) return;
        if (this._getResizableBoxWidth() <= width) return;

        this.resizeHandle.el.attr({width: width, height: height});
        this.resizeHandle.el.width(width);
        this.resizeHandle.el.height(height);
        this._setResizerPosition();
    },
    _getResizableBoxWidth: function()
    {
        var width = this.$resizableBox.width();
        return width - parseInt(this.$resizableBox.css('padding-left')) - parseInt(this.$resizableBox.css('padding-right'));
    }
});
$R.add('module', 'file', {
    modals: {
        'file':
            '<div class="redactor-modal-tab" data-title="## upload ##"><form action=""> \
                <div class="form-item form-item-title"> \
                    <label for="modal-file-title"> ## filename ## <span class="desc">(## optional ##)</span></label> \
                    <input type="text" id="modal-file-title" name="title" /> \
                </div> \
                <input type="file" name="file"> \
            </form></div>'
    },
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.lang = app.lang;
        this.caret = app.caret;
        this.utils = app.utils;
        this.storage = app.storage;
        this.component = app.component;
        this.inspector = app.inspector;
        this.insertion = app.insertion;
        this.selection = app.selection;
    },
    // messages
    onstarted: function()
    {
        // storage observe
        this.storage.observeFiles();
    },
    ondropfile: function(e, files, clipboard)
    {
        if (!this.opts.fileUpload) return;

        var options = {
            url: this.opts.fileUpload,
            event: (clipboard) ? false : e,
            files: files,
            name: 'filedrop',
            data: this.opts.fileData
        };

        this.app.api('module.upload.send', options);
    },
    onmodal: {
        file: {
            open: function($modal, $form)
            {
                this._setFormData($modal, $form);
                this._setUpload($form);
            },
            opened: function($modal, $form)
            {
                this._setFormFocus($form);

                this.$form = $form;
            }
        }
    },
    onupload: {
        file: {
            complete: function(response)
            {
                this._insert(response);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        },
        filedrop: {
            complete: function(response, e)
            {
                this._insert(response, e);
            },
            error: function(response)
            {
                this._uploadError(response);
            }
        }
    },
    oncontextbar: function(e, contextbar)
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        if (data.isFile())
        {
            var node = data.getFile();
            var buttons = {
                "remove": {
                    title: this.lang.get('delete'),
                    api: 'module.file.remove',
                    args: node
                }
            };

            contextbar.set(e, node, buttons, 'bottom');
        }

    },

    // public
    open: function()
    {
        this._open();
    },
    insert: function(data)
    {
        this._insert(data);
    },
    remove: function(node)
    {
        this._remove(node);
    },

    // private
    _open: function()
    {
        this.app.api('module.modal.build', this._getModalData());
    },
    _getModalData: function()
    {
        var modalData = {
            name: 'file',
            title: this.lang.get('file')
        };

        return modalData;
    },
    _insert: function(response, e)
    {
        this.app.api('module.modal.close');
        if (typeof response !== 'object') return;

        if (Array.isArray(response))
        {
            var obj = {};
            for (var i = 0; i < response.length; i++)
            {
                obj = $R.extend(obj, response[i]);
            }

            response = obj;
        }

        var multiple = (Object.keys(response).length  > 1);

        if (multiple)
        {
            this._insertMultiple(response, e);
        }
        else
        {
            this._insertSingle(response, e);
        }

        this.$form = false;
    },
    _insertSingle: function(response, e)
    {
        var inserted = [];
        for (var key in response)
        {
            var $file = this._createFileAndStore(response[key]);

            if (this.opts.fileAttachment)
            {
                inserted = this._insertAsAttachment($file);
            }
            else
            {
                inserted = (e) ? this.insertion.insertToPoint(e, $file) : this.insertion.insertRaw($file);
            }

            this.app.broadcast('file.uploaded', inserted[0], response);
        }
    },
    _insertMultiple: function(response, e)
    {
        var z = 0;
        var inserted = [];
        var $last;
        for (var key in response)
        {
            z++;

            var $file = this._createFileAndStore(response[key]);

            if (this.opts.fileAttachment)
            {
                inserted = this._insertAsAttachment($file, response);
            }
            else
            {
                if (z === 1)
                {
                    inserted = (e) ? this.insertion.insertToPoint(e, $file) : this.insertion.insertRaw($file);
                }
                else
                {
                    var $inserted = $R.dom(inserted[0]);
                    $inserted.after($file).after(' ');
                    inserted = [$file.get()];

                    this.app.broadcast('file.inserted', $file);
                }
            }

            $last = $file;
            this.app.broadcast('file.uploaded', inserted[0], response);
        }

        // set caret after last
        if (!this.opts.fileAttachment)
        {
            this.caret.setAfter($last);
        }
    },
    _insertAsAttachment: function($file, response)
    {
        var $box = $R.dom(this.opts.fileAttachment);
        var $wrapper = $file.wrapAttachment();
        $box.append($wrapper);

        var inserted = [$wrapper.get()];
        this.app.broadcast('file.appended', inserted[0], response);

        return inserted;
    },
    _createFileAndStore: function(item)
    {
        var modalFormData = (this.$form) ? this.$form.getData() : false;
        var name = (item.name) ? item.name : item.url;
        var title = (!this.opts.fileAttachment && modalFormData && modalFormData.title !== '') ? modalFormData.title : this._truncateUrl(name);

        var $file = this.component.create('file');
        $file.attr('href', item.url);
        $file.attr('data-file', (item.id) ? item.id : this.utils.getRandomId());
        $file.attr('data-name', item.name);
        $file.html(title);

        // add to storage
        this.storage.add('file', $file);

        return $file;
    },
    _remove: function(node)
    {
        this.selection.save();

        var $file = this.component.create('file', node);
        var stop = this.app.broadcast('file.delete', $file);
        if (stop !== false)
        {
            $file.unwrap();

            this.selection.restore();

            // callback
            this.app.broadcast('file.deleted', $file);
        }
        else
        {
            this.selection.restore();
        }
    },
    _truncateUrl: function(url)
    {
        return (url.search(/^http/) !== -1 && url.length > 20) ? url.substring(0, 20) + '...' : url;
    },
    _setUpload: function($form)
    {
        var options = {
            url: this.opts.fileUpload,
            element: $form.getField('file'),
            name: 'file',
            data: this.opts.fileData,
            paramName: this.opts.fileUploadParam
        };

        this.app.api('module.upload.build', options);
    },
    _setFormData: function($modal, $form)
    {
        if (this.opts.fileAttachment)
        {
            $modal.find('.form-item-title').hide();
        }
        else
        {
            $form.setData({ title: this.selection.getText() });
        }
    },
    _setFormFocus: function($form)
    {
        $form.getField('title').focus();
    },
    _uploadError: function(response)
    {
        this.app.broadcast('file.uploadError', response);
    }
});
$R.add('class', 'file.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;
        this.opts = app.opts;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },
    wrapAttachment: function()
    {
        this.$wrapper = $R.dom('<span class="redactor-file-item">');
        this.$remover = $R.dom('<span class="redactor-file-remover">');
        this.$remover.html('&times;');
        this.$remover.on('click', this.removeAttachment.bind(this));

        this.$wrapper.append(this);
        this.$wrapper.append(this.$remover);

        return this.$wrapper;
    },
    removeAttachment: function(e)
    {
        e.preventDefault();

        var stop = this.app.broadcast('file.delete', this, this.$wrapper);
        if (stop !== false)
        {
            this.$wrapper.remove();
            this.app.broadcast('file.deleted', this);
            this.app.broadcast('file.removeAttachment', this);
        }
    },

    // private
    _init: function(el)
    {
        if (el === undefined)
        {
            this.parse('<a>');
        }
        else
        {
            var $a = $R.dom(el).closest('a');
            this.parse($a);
        }
    }
});
$R.add('module', 'buffer', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.editor = app.editor;
        this.offset = app.offset;
        this.keycodes = app.keycodes;
        this.selection = app.selection;

        // local
        this.state = false;
        this.passed = false;
        this.keyPressed = false;
        this.savedHtml = false;
        this.savedOffset = false;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    // messages
    onkeydown: function(e)
    {
        this._listen(e);
    },
    onsyncing: function()
    {
        if (!this.keyPressed)
        {
            this.trigger();
        }

        this.keyPressed = false;
    },
    onstate: function(e, html, offset)
    {
        if ((e && (e.ctrlKey || e.metaKey)) || (e && (this._isUndo(e) || this._isRedo(e))))
        {
            return;
        }

        this.passed = false;
        this._saveState(html, offset);
    },
    onenable: function()
    {
        this.clear();
    },

    // public
    clear: function()
    {
        this.state = false;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    undo: function()
    {
        this._getUndo();
    },
    redo: function()
    {
        this._getRedo();
    },
    trigger: function()
    {
        if (this.state && this.passed === false) this._setUndo();
    },

    // private
    _saveState: function(html, offset)
    {
        var $editor = this.editor.getElement();

        this.state = {
            html: html || $editor.html(),
            offset: offset || this.offset.get()
        };
    },
    _listen: function(e)
    {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;
        var cmd = ctrl || e.shiftKey || e.altKey;
        var keys = [this.keycodes.SPACE, this.keycodes.ENTER, this.keycodes.BACKSPACE, this.keycodes.DELETE, this.keycodes.TAB,
                    this.keycodes.LEFT, this.keycodes.RIGHT, this.keycodes.UP, this.keycodes.DOWN];

        // undo
        if (this._isUndo(e)) // z key
        {
            e.preventDefault();
            this.undo();
            return;
        }
        // redo
        else if (this._isRedo(e))
        {
            e.preventDefault();
            this.redo();
            return;
        }
        // spec keys
        else if (!ctrl && keys.indexOf(key) !== -1)
        {
            cmd = true;
            this.trigger();
        }
        // cut & copy
        else if (ctrl && (key === 88 || key === 67))
        {
            cmd = true;
            this.trigger();
        }

        // empty buffer
        if (!cmd && !this._hasUndo())
        {
            this.trigger();
        }

        this.keyPressed = true;
    },
    _isUndo: function(e)
    {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && key === 90 && !e.shiftKey && !e.altKey);
    },
    _isRedo: function(e)
    {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && (key === 90 && e.shiftKey || key === 89 && !e.shiftKey) && !e.altKey);
    },
    _setUndo: function()
    {
        var last = this.undoStorage[this.undoStorage.length-1];
        if (typeof last === 'undefined' || last[0] !== this.state.html)
        {
            this.undoStorage.push([this.state.html, this.state.offset]);
            this._removeOverStorage();
        }
    },
    _setRedo: function()
    {
        var $editor = this.editor.getElement();
        var offset = this.offset.get();
        var html = $editor.html();

        this.redoStorage.push([html, offset]);
        this.redoStorage = this.redoStorage.slice(0, this.opts.bufferLimit);
    },
    _getUndo: function()
    {
        if (!this._hasUndo()) return;

        this.passed = true;

        var $editor = this.editor.getElement();
        var buffer = this.undoStorage.pop();

        this._setRedo();

        $editor.html(buffer[0]);
        this.offset.set(buffer[1]);
        this.selection.restore();

        this.app.broadcast('undo', buffer[0], buffer[1]);

    },
    _getRedo: function()
    {
        if (!this._hasRedo()) return;

        this.passed = true;

        var $editor = this.editor.getElement();
        var buffer = this.redoStorage.pop();

        this._setUndo();
        $editor.html(buffer[0]);
        this.offset.set(buffer[1]);

        this.app.broadcast('redo', buffer[0], buffer[1]);
    },
    _removeOverStorage: function()
    {
        if (this.undoStorage.length > this.opts.bufferLimit)
        {
            this.undoStorage = this.undoStorage.slice(0, (this.undoStorage.length - this.opts.bufferLimit));
        }
    },
    _hasUndo: function()
    {
        return (this.undoStorage.length !== 0);
    },
    _hasRedo: function()
    {
        return (this.redoStorage.length !== 0);
    }
});
$R.add('module', 'list', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;
        this.utils = app.utils;
        this.block = app.block;
        this.toolbar = app.toolbar;
        this.inspector = app.inspector;
        this.selection = app.selection;
    },
    // messages
    onbutton: {
        list: {
            observe: function(button)
            {
                this._observeButton(button);
            }
        }
    },
    ondropdown: {
        list: {
            observe: function(dropdown)
            {
                this._observeDropdown(dropdown);
            }
        }
    },

    // public
    toggle: function(type)
    {
        var nodes = this._getBlocks();
        var block = this.selection.getBlock();
        var $list = $R.dom(block).parents('ul, ol',  '.redactor-in').last();
        if (nodes.length === 0 && $list.length !== 0)
        {
            nodes = [$list.get()];
        }

        if (block && (block.tagName === 'TD' || block.tagName === 'TH'))
        {
            nodes = this.block.format('div');
        }

        this.selection.saveMarkers();

        nodes = (nodes.length !== 0 && this._isUnformat(type, nodes)) ? this._unformat(type, nodes) : this._format(type, nodes);

        this.selection.restoreMarkers();

        return nodes;
    },
    indent: function()
    {
        var isCollapsed = this.selection.isCollapsed();
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var item = (data.isList()) ? data.getListItem() : false;
        var $item = $R.dom(item);
        var $prev = $item.prevElement();
        var prev = $prev.get();
        var isIndent = (isCollapsed && item && prev && prev.tagName === 'LI');

        if (isIndent)
        {
            this.selection.saveMarkers();

            $prev = $R.dom(prev);
            var $prevChild = $prev.children('ul, ol');
            var $list = $item.closest('ul, ol');

            if ($prevChild.length !== 0)
            {
                $prevChild.append($item);
            }
            else
            {
                var listTag = $list.get().tagName.toLowerCase();
                var $newList = $R.dom('<' + listTag + '>');

                $newList.append($item);
                $prev.append($newList);
            }

            this.selection.restoreMarkers();
        }
    },
    outdent: function()
    {
        var isCollapsed = this.selection.isCollapsed();
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var item = (data.isList()) ? data.getListItem() : false;
        var $item = $R.dom(item);

        if (isCollapsed && item)
        {

            var $listItem = $item.parent();
            var $liItem = $listItem.closest('li', '.redactor-in');
            var $prev = $item.prevElement();
            var $next = $item.nextElement();
            var prev = $prev.get();
            var next = $next.get();
            var nextItems, nextList, $newList, $nextList;
            var isTop = (prev === false);
            var isMiddle = (prev !== false && next !== false);
            var isBottom = (!isTop && next === false);

            this.selection.saveMarkers();

            // out
            if ($liItem.length !== 0)
            {
                if (isMiddle)
                {
                    nextItems = this._getAllNext($item.get());
                    $newList = $R.dom('<' + $listItem.get().tagName.toLowerCase() + '>');

                    for (var i = 0; i < nextItems.length; i++)
                    {
                        $newList.append(nextItems[i]);
                    }

                    $liItem.after($item);
                    $item.append($newList);
                }
                else
                {
                    $liItem.after($item);

                    if ($listItem.children().length === 0)
                    {
                        $listItem.remove();
                    }
                    else
                    {
                        if (isTop) $item.append($listItem);
                    }
                }
            }
            // unformat
            else
            {
                var $container =  this._createUnformatContainer($item);
                var $childList = $container.find('ul, ol').first();

                if (isTop) $listItem.before($container);
                else if (isBottom) $listItem.after($container);
                else if (isMiddle)
                {
                    $newList = $R.dom('<' + $listItem.get().tagName.toLowerCase() + '>');
                    nextItems = this._getAllNext($item.get());

                    for (var i = 0; i < nextItems.length; i++)
                    {
                        $newList.append(nextItems[i]);
                    }

                    $listItem.after($container);
                    $container.after($newList);
                }

                if ($childList.length !== 0)
                {
                    $nextList = $container.nextElement();
                    nextList = $nextList.get();
                    if (nextList && nextList.tagName === $listItem.get().tagName)
                    {
                        $R.dom(nextList).prepend($childList);
                        $childList.unwrap();
                    }
                    else
                    {
                        $container.after($childList);
                    }
                }

                $item.remove();
            }

            this.selection.restoreMarkers();
        }
    },

    // private
    _getAllNext: function(next)
    {
        var nodes = [];

        while (next)
        {
            var $next = $R.dom(next).nextElement();
            next = $next.get();

            if (next) nodes.push(next);
            else return nodes;
        }

        return nodes;
    },
    _isUnformat: function(type, nodes)
    {
        var countLists = 0;
        for (var i = 0; i < nodes.length; i++)
        {
            if (nodes[i].nodeType !== 3)
            {
                var tag = nodes[i].tagName.toLowerCase();
                if (tag === type || tag === 'figure')
                {
                    countLists++;
                }
            }
        }

        return (countLists === nodes.length);
    },
    _format: function(type, nodes)
    {
        var tags = ['p', 'div', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol'];
        var blocks = this._uniteBlocks(nodes, tags);
        var lists = [];

        for (var key in blocks)
        {
            var items = blocks[key];
            var $list = this._createList(type, blocks[key]);

            for (var i = 0; i < items.length; i++)
            {
                var $item;

                // lists
                if (items[i].nodeType !== 3 && (items[i].tagName === 'UL' || items[i].tagName === 'OL'))
                {
                    var $oldList = $R.dom(items[i]);

                    $item = $oldList.contents();
                    $list.append($item);

                    // old is empty
                    if (this.utils.isEmpty($oldList)) $oldList.remove();
                }
                // other blocks or texts
                else
                {
                    $item = this._createListItem(items[i]);
                    this.utils.normalizeTextNodes($item);
                    $list.append($item);
                }
            }

            lists.push($list.get());
        }

        return lists;
    },
    _uniteBlocks: function(nodes, tags)
    {
        var z = 0;
        var blocks = { 0: [] };
        var lastcell = false;
        for (var i = 0; i < nodes.length; i++)
        {
            var $node = $R.dom(nodes[i]);
            var $cell = $node.closest('th, td');

            if ($cell.length !== 0)
            {
                if ($cell.get() !== lastcell)
                {
                    // create block
                    z++;
                    blocks[z] = [];
                }

                if (this._isUniteBlock(nodes[i], tags))
                {
                    blocks[z].push(nodes[i]);
                }
            }
            else
            {
                if (this._isUniteBlock(nodes[i], tags))
                {
                    blocks[z].push(nodes[i]);
                }
                else
                {
                    // create block
                    z++;
                    blocks[z] = [];
                }
            }

            lastcell = $cell.get();
        }

        return blocks;
    },
    _isUniteBlock: function(node, tags)
    {
        return (node.nodeType === 3 || tags.indexOf(node.tagName.toLowerCase()) !== -1);
    },
    _createList: function(type, blocks)
    {
        var last = blocks[blocks.length-1];
        var $last = $R.dom(last);
        var $list = $R.dom('<' + type + '>');
        $last.after($list);

        return $list;
    },
    _createListItem: function(item)
    {
        var $item = $R.dom('<li>');
        if (item.nodeType === 3)
        {
            $item.append(item);
        }
        else
        {
            var $el = $R.dom(item);
            $item.append($el.contents());
            $el.remove();
        }

        return $item;
    },
    _unformat: function(type, nodes)
    {
        if (nodes.length === 1)
        {
            // one list
            var $list = $R.dom(nodes[0]);
            var $items = $list.find('li');

            var selectedItems = this.selection.getNodes({ tags: ['li'] });
            var block = this.selection.getBlock();
            var $li = $R.dom(block).closest('li');
            if (selectedItems.length === 0 && $li.length !== 0)
            {
                selectedItems = [$li.get()];
            }


            // 1) entire
            if (selectedItems.length === $items.length)
            {
                return this._unformatEntire(nodes[0]);
            }

            var pos = this._getItemsPosition($items, selectedItems);

            // 2) top
            if (pos === 'Top')
            {
                return this._unformatAtSide('before', selectedItems, $list);
            }

            // 3) bottom
            else if (pos === 'Bottom')
            {
                selectedItems.reverse();
                return this._unformatAtSide('after', selectedItems, $list);
            }

            // 4) middle
            else if (pos === 'Middle')
            {
                var $last = $R.dom(selectedItems[selectedItems.length-1]);

                var ci = false;

                var $parent = false;
                var $secondList = $R.dom('<' + $list.get().tagName.toLowerCase() + '>');
                $items.each(function(node)
                {
                    if (ci)
                    {
                        var $node = $R.dom(node);
                        if ($node.closest('.redactor-split-item').length === 0 && ($parent === false || $node.closest($parent).length === 0))
                        {
                            $node.addClass('redactor-split-item');
                        }

                        $parent = $node;
                    }

                    if (node === $last.get())
                    {
                        ci = true;
                    }
                });

                $items.filter('.redactor-split-item').each(function(node)
                {
                    var $node = $R.dom(node);
                    $node.removeClass('redactor-split-item');
                    $secondList.append(node);
                });

                $list.after($secondList);

                selectedItems.reverse();
                for (var i = 0; i < selectedItems.length; i++)
                {
                    var $item = $R.dom(selectedItems[i]);
                    var $container = this._createUnformatContainer($item);

                    $list.after($container);
                    $container.find('ul, ol').remove();
                    $item.remove();
                }


                return;
            }

        }
        else
        {
            // unformat all
            for (var i = 0; i < nodes.length; i++)
            {
                if (nodes[i].nodeType !== 3 && nodes[i].tagName.toLowerCase() === type)
                {
                    this._unformatEntire(nodes[i]);
                }
            }
        }
    },
    _unformatEntire: function(list)
    {
        var $list = $R.dom(list);
        var $items = $list.find('li');
        $items.each(function(node)
        {
            var $item = $R.dom(node);
            var $container = this._createUnformatContainer($item);

            $item.remove();
            $list.before($container);

        }.bind(this));

        $list.remove();
    },
    _unformatAtSide: function(type, selectedItems, $list)
    {
        for (var i = 0; i < selectedItems.length; i++)
        {
            var $item = $R.dom(selectedItems[i]);
            var $container = this._createUnformatContainer($item);

            $list[type]($container);

            var $innerLists = $container.find('ul, ol').first();
            $item.append($innerLists);

            $innerLists.each(function(node)
            {
                var $node = $R.dom(node);
                var $parent = $node.closest('li');

                if ($parent.get() === selectedItems[i])
                {
                    $node.unwrap();
                    $parent.addClass('r-unwrapped');
                }

            });

            if (this.utils.isEmptyHtml($item.html())) $item.remove();
        }

        // clear empty
        $list.find('.r-unwrapped').each(function(node)
        {
            var $node = $R.dom(node);
            if ($node.html().trim() === '') $node.remove();
            else $node.removeClass('r-unwrapped');
        });
    },
    _getItemsPosition: function($items, selectedItems)
    {
        var pos = 'Middle';

        var sFirst = selectedItems[0];
        var sLast = selectedItems[selectedItems.length-1];

        var first = $items.first().get();
        var last = $items.last().get();

        if (first === sFirst && last !== sLast)
        {
            pos = 'Top';
        }
        else if (first !== sFirst && last === sLast)
        {
            pos = 'Bottom';
        }

        return pos;
    },
    _createUnformatContainer: function($item)
    {
        var $container = $R.dom('<' + this.opts.markup + '>');
        if (this.opts.breakline) $container.attr('data-redactor-tag', 'br');

        $container.append($item.contents());

        return $container;
    },
    _getBlocks: function()
    {
        return this.selection.getBlocks({ first: true });
    },
    _observeButton: function()
    {
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var isDisabled = (data.isPre() || data.isCode() || data.isFigcaption());

        this._observeButtonsList(isDisabled, ['lists', 'ul', 'ol', 'outdent', 'indent']);

        var itemOutdent = this.toolbar.getButton('outdent');
        var itemIndent = this.toolbar.getButton('indent');

        this._observeIndent(itemIndent, itemOutdent);
    },
    _observeDropdown: function(dropdown)
    {
        var itemOutdent = dropdown.getItem('outdent');
        var itemIndent = dropdown.getItem('indent');

        this._observeIndent(itemIndent, itemOutdent);
    },
    _observeIndent: function(itemIndent, itemOutdent)
    {
        var isCollapsed = this.selection.isCollapsed();
        var current = this.selection.getCurrent();
        var data = this.inspector.parse(current);
        var item = (data.isList()) ? data.getListItem() : false;
        var $item = $R.dom(item);
        var $prev = $item.prevElement();
        var prev = $prev.get();
        var isIndent = (isCollapsed && item && prev && prev.tagName === 'LI');

        if (itemOutdent)
        {
            if (item && isCollapsed) itemOutdent.enable();
            else itemOutdent.disable();
        }

        if (itemIndent)
        {
            if (item && isIndent) itemIndent.enable();
            else itemIndent.disable();
        }
    },
    _observeButtonsList: function(param, buttons)
    {
        for (var i = 0; i < buttons.length; i++)
        {
            var button = this.toolbar.getButton(buttons[i]);
            if (button)
            {
                if (param) button.disable();
                else button.enable();
            }
        }
    }
});
$R.add('class', 'video.component', {
    mixins: ['dom', 'component'],
    init: function(app, el)
    {
        this.app = app;

        // init
        return (el && el.cmnt !== undefined) ? el : this._init(el);
    },

    // private
    _init: function(el)
    {
        if (typeof el !== 'undefined')
        {
            var $node = $R.dom(el);
            var $wrapper = $node.closest('figure');
            if ($wrapper.length !== 0)
            {
                this.parse($wrapper);
            }
            else
            {
                this.parse('<figure>');
                this.append(el);
            }
        }
        else
        {
            this.parse('<figure>');
        }


        this._initWrapper();
    },
    _initWrapper: function()
    {
        this.addClass('redactor-component');
        this.attr({
            'data-redactor-type': 'video',
            'tabindex': '-1',
            'contenteditable': false
        });
    }
});


    window.Redactor = window.$R = $R;

    // Data attribute load
    window.addEventListener('load', function()
    {
        $R('[data-redactor]');
    });

}());
(function($R)
{
    $R.add('plugin', 'fileselector', {
        init: function(app)
        {
            // define app
            this.app = app;
            this.opts = app.opts;

            // define some services, for example
            this.caret = app.caret;
            this.selection = app.selection;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;
        },
        start: function () {
            var buttonData = {
                title: 'Insert File',
                api: 'plugin.fileselector.open'
            };
            var button = this.toolbar.addButton('fileselector', buttonData);
            button.setIcon('<i class="fa fa-archive"></i>');
        },
        modals: {
            'fileselector': '<section id="redactor-modal-fileselector">'
                + '<div class="input-group">'
                + '<input id="fileselector-filter" type="textbox" placeholder="Search" class="form-control">'
                + '<span class="input-group-btn">'
                + '<span class="btn btn-default"><span class="fa fa-search"></span></span>'
                + '</span>'
                + '</div>'
                + '<div id="fileselector-container" class="raw-block-400 cms-row raw-margin-top-24" style="overflow: scroll;">Loading your file collection...</div>'
                + '</section>'
        },
        open: function () {
            var options = {
                title: 'File Selector',
                width: '600px',
                name: 'fileselector'
            };

            this.app.api('module.modal.build', options);
        },
        onmodal: {
            fileselector: {
                opened: function($modal, $form)
                {
                    this.load();
                },
            },
        },
        load: function()
        {
            $.ajax({
                dataType: "json",
                cache: false,
                headers: {
                    Cms: _apiKey,
                    Authorization: 'Bearer '+_apiToken
                },
                url: this.opts.fileManagerJson,
                error: function(data){
                    console.log(data)
                },
                success: $.proxy(function(data)
                {
                    $('#fileselector-container').html('');

                    if (data.data.length > 0) {
                        $.each((data.data), $.proxy(function(key, val)
                        {
                            var file = $('<div class="list-row raw-left raw100"><div class="raw100 raw-left"><p><span class="fa fa-download"></span> <a class="file-link" href="#" data-url="/public-download/'+val.file_identifier +'">' + val.file_name + '</a></p></div>');
                            $('#fileselector-container').append(file);
                            $(file).click($.proxy(this.insert, this));
                        }, this));
                    } else {
                        $('#fileselector-container').append('You have not yet uploaded any files, visit the files tab to add some.');
                    }

                    $("#fileselector-filter").bind("keyup", function(){
                        $("#fileselector-container").find(".file-link").each(function(){
                            if ($(this).html().indexOf($("#fileselector-filter").val()) < 0) {
                                $(this).parent().parent().parent().hide();
                            } else {
                                $(this).parent().parent().parent().show();
                            }
                        });
                    })
                }, this)
            });
        },
        insert: function(e)
        {
            e.preventDefault();
            this.insertion.insertHtml('<a href="' + $(e.target).attr('data-url') + '">'+ $(e.target).html() +'</a>', false);
            this.app.api('module.modal.close');
        },
    });
})(Redactor);

(function($R)
{
    $R.add('plugin', 'fontcolor', {
        translations: {
            en: {
                "fontcolor": "Text Color",
                "text": "Text",
                "highlight": "Highlight"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;
            this.selection = app.selection;

            // local
    		this.colors = (this.opts.fontcolors) ? this.opts.fontcolors : [
    			'#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#ffff00',
    			'#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f0', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada', '#fff2ca',
    			'#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1d9', '#b7dde8', '#fbd5b5', '#ffe694',
    			'#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#b7dde8', '#fac08f', '#f2c314',
    			'#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76923c', '#5f497a', '#92cddc', '#e36c09', '#c09100',
    			'#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244061', '#632423', '#4f6128', '#3f3151', '#31859b',  '#974806', '#7f6000'
    		];
        },
        // messages
        onfontcolor: {
            set: function(rule, value)
            {
                this._set(rule, value);
            },
            remove: function(rule)
            {
                this._remove(rule);
            }
        },

        // public
        start: function()
        {
            var btnObj = {
                title: this.lang.get('fontcolor')
            };

            var $dropdown = this._buildDropdown();

            this.$button = this.toolbar.addButton('fontcolor', btnObj);
			this.$button.setIcon('<i class="re-icon-fontcolor"></i>');
			this.$button.setDropdown($dropdown);
        },

        // private
        _buildDropdown: function()
        {
            var $dropdown = $R.dom('<div class="redactor-dropdown-cells">');

            this.$selector = this._buildSelector();

            this.$selectorText = this._buildSelectorItem('text', this.lang.get('text'));
            this.$selectorText.addClass('active');

            this.$selectorBack = this._buildSelectorItem('back', this.lang.get('highlight'));

            this.$selector.append(this.$selectorText);
            this.$selector.append(this.$selectorBack);

            this.$pickerText = this._buildPicker('textcolor');
            this.$pickerBack = this._buildPicker('backcolor');

            $dropdown.append(this.$selector);
            $dropdown.append(this.$pickerText);
            $dropdown.append(this.$pickerBack);

            this._buildSelectorEvents();

            $dropdown.width(242);

            return $dropdown;
        },
        _buildSelector: function()
        {
            var $selector = $R.dom('<div>');
            $selector.addClass('redactor-dropdown-selector');

			return $selector;
        },
        _buildSelectorItem: function(name, title)
        {
            var $item = $R.dom('<span>');
            $item.attr('rel', name).html(title);
            $item.addClass('redactor-dropdown-not-close');

            return $item;
        },
        _buildSelectorEvents: function()
        {
			this.$selectorText.on('mousedown', function(e)
			{
				e.preventDefault();

                this.$selector.find('span').removeClass('active');
				this.$pickerBack.hide();
				this.$pickerText.show();
				this.$selectorText.addClass('active');

			}.bind(this));

			this.$selectorBack.on('mousedown', function(e)
			{
				e.preventDefault();

                this.$selector.find('span').removeClass('active');
				this.$pickerText.hide();
				this.$pickerBack.show();
				this.$selectorBack.addClass('active');

			}.bind(this));
        },
        _buildPicker: function(name)
		{
			var $box = $R.dom('<div class="re-dropdown-box-' + name + '">');
			var rule = (name == 'backcolor') ? 'background-color' : 'color';
			var len = this.colors.length;
			var self = this;
			var func = function(e)
			{
				e.preventDefault();

				var $el = $R.dom(e.target);
				self._set($el.data('rule'), $el.attr('rel'));
			};

			for (var z = 0; z < len; z++)
			{
				var color = this.colors[z];

				var $swatch = $R.dom('<span>');
				$swatch.attr({ 'rel': color, 'data-rule': rule });
				$swatch.css({ 'background-color': color, 'font-size': 0, 'border': '2px solid #fff', 'width': '22px', 'height': '22px' });
				$swatch.on('mousedown', func);

				$box.append($swatch);
			}

			var $el = $R.dom('<a>');
			$el.attr({ 'href': '#' });
			$el.css({ 'display': 'block', 'clear': 'both', 'padding': '8px 5px', 'font-size': '12px', 'line-height': 1 });
			$el.html(this.lang.get('none'));

			$el.on('click', function(e)
			{
				e.preventDefault();
				self._remove(rule);
			});

			$box.append($el);

			if (name == 'backcolor') $box.hide();

            return $box;
		},
		_set: function(rule, value)
		{
    		var style = {};
    		style[rule] = value;

    		var args = {
        	    tag: 'span',
        	    style: style,
        	    type: 'toggle'
    		};

			this.inline.format(args);
		},
		_remove: function(rule)
		{
			this.inline.remove({ style: rule });
		}
    });
})(Redactor);
(function($R)
{
    $R.add('plugin', 'alignment', {
        translations: {
    		en: {
    			"align": "Align",
    			"align-left": "Align Left",
    			"align-center": "Align Center",
    			"align-right": "Align Right",
    			"align-justify": "Align Justify"
    		}
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.block = app.block;
            this.toolbar = app.toolbar;
        },
        // public
        start: function()
        {
            var dropdown = {};

    		dropdown.left = { title: this.lang.get('align-left'), api: 'plugin.alignment.set', args: 'left' };
    		dropdown.center = { title: this.lang.get('align-center'), api: 'plugin.alignment.set', args: 'center' };
    		dropdown.right = { title: this.lang.get('align-right'), api: 'plugin.alignment.set', args: 'right' };
    		dropdown.justify = { title: this.lang.get('align-justify'), api: 'plugin.alignment.set', args: 'justify' };

            var $button = this.toolbar.addButton('alignment', { title: this.lang.get('align') });
            $button.setIcon('<i class="re-icon-alignment"></i>');
			$button.setDropdown(dropdown);
        },
        set: function(type)
		{
    		if (type === 'left' && this.opts.direction === 'ltr')
    		{
        		return this._remove();
    		}

    		var args = {
        	    style: { 'text-align': type }
    		};

			this.block.toggle(args);
		},

		// private
		_remove: function()
		{
		    this.block.remove({ style: 'text-align' });
		}
    });
})(Redactor);
(function($R)
{
    $R.add('plugin', 'imageselector', {
        init: function(app)
        {
            // define app
            this.app = app;
            this.opts = app.opts;

            // define some services, for example
            this.caret = app.caret;
            this.selection = app.selection;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;
        },
        start: function () {
            var buttonData = {
                title: 'Insert Image',
                api: 'plugin.imageselector.open'
            };
            var button = this.toolbar.addButton('imageselector', buttonData);
            button.setIcon('<i class="fa fa-image"></i>');
        },
        modals: {
            'imageselector': '<section id="redactor-modal-imageselector">'
            + '<div class="input-group">'
            + '<input id="imageselector-filter" type="textbox" placeholder="Search" class="form-control">'
            + '<span class="input-group-btn">'
            + '<span class="btn btn-default"><span class="fa fa-search"></span></span>'
            + '</span>'
            + '</div>'
            + '<div id="imageselector-container" class="raw-block-400 cms-row raw-margin-top-24" style="overflow: scroll;">Loading your image collection...</div>'
            + '</section>'
        },
        open: function () {
            var options = {
                title: 'Image Selector',
                width: '600px',
                name: 'imageselector'
            };

            this.app.api('module.modal.build', options);
        },
        onmodal: {
            imageselector: {
                opened: function($modal, $form)
                {
                    this.load();
                },
            },
        },
        load: function()
        {
            $.ajax({
                dataType: "json",
                cache: false,
                headers: {
                    Cms: _apiKey,
                    Authorization: 'Bearer '+_apiToken
                },
                url: this.opts.imageManagerJson,
                error: function(data){
                    console.log(data)
                },
                success: $.proxy(function(data)
                {
                    $('#imageselector-container').html('');

                    if (data.data.length > 0) {
                        $.each((data.data), $.proxy(function(key, val)
                        {
                            var thumbtitle = '';

                            if (typeof val.title_tag != 'undefined' && val.title_tag != null) {
                                thumbtitle = val.title_tag;
                            }

                            var img = $('<div class="raw25 float-left thumbnail-box"><div class="img cms-thumbnail-img" style="background-image: url(\'' + val.js_url + '\')" data-img-name="'+ val.js_url +'" src="' + val.js_url + '" rel="' + val.js_url + '" title="' + thumbtitle + '"></div></div>');
                            $('#imageselector-container').append(img);
                            $(img).click($.proxy(this.insert, this));
                        }, this));
                    } else {
                        $('#imageselector-container').append('You have not yet uploaded any images, visit the images tab to add some.');
                    }

                    $("#imageselector-filter").bind("keyup", function(){
                        $(".cms-thumbnail-img").each(function(){
                            console.log($(this).attr('title'))
                            if ($(this).attr('title').indexOf($("#imageselector-filter").val()) < 0) {
                                $(this).parent().hide();
                            } else {
                                $(this).parent().show();
                            }
                        });
                    })

                }, this)
            });
        },
        insert: function(e)
        {
            e.preventDefault();
            this.insertion.insertHtml('<img src="' + $(e.target).attr('rel') + '" alt="' + $(e.target).attr('title') + '" title="' + $(e.target).attr('title') + '">');
            this.app.api('module.modal.close');
        },
    });
})(Redactor);

(function($R)
{
    $R.add('plugin', 'stockimagemanager', {
        init: function(app)
        {
            // define app
            this.app = app;
            this.opts = app.opts;

            // define some services, for example
            this.caret = app.caret;
            this.selection = app.selection;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;
        },
        start: function () {
            var buttonData = {
                title: 'Insert Stock Image',
                api: 'plugin.stockimagemanager.open'
            };
            var button = this.toolbar.addButton('stockimagemanager', buttonData);
            button.setIcon('<i class="fa fa-camera-retro"></i>');
        },
        modals: {
            'stockimagemanager': '<section id="redactor-modal-stockimagemanager">'
                + '<div class="input-group stockimagemanager-search-box">'
                + '<input id="stockimagemanager-filter" type="textbox" placeholder="Search" class="form-control">'
                + '<span class="input-group-btn">'
                + '<button class="btn btn-default" type="button" id="stockimagemanager-search"><span class="fa fa-search"></span></button>'
                + '</span>'
                + '</div>'
                + '<div id="stockimagemanager-container" class="raw-block-300 cms-row raw-margin-top-24 raw-margin-bottom-24" style="overflow: scroll;"></div>'
                + '<div id="stockimagemanager-links" class="raw-block-20 cms-row"><button id="stockImgPrevBtn" class="btn btn-default float-left">Prev</button><button id="stockImgNextBtn" class="pull-right btn btn-default">Next</button></div>'
                + '<div><a href="https://pixabay.com/"><img class="raw100 raw-margin-top-24" src="https://pixabay.com/static/img/public/leaderboard_a.png" alt="Pixabay"> </a></div>'
                + '</section>'
        },
        open: function () {
            var options = {
                title: 'Stock Image Manager',
                width: '600px',
                name: 'stockimagemanager'
            };

            this.app.api('module.modal.build', options);
        },
        onmodal: {
            stockimagemanager: {
                opened: function($modal, $form)
                {
                    // this.modal.load('stockimagemanager', 'Insert Stock Images', 600);

                    // this.modal.show();

                    this.load();
                },
            },
        },
        load: function()
        {
            if (_pixabayKey == '') {
                $("#stockImgPrevBtn, #stockImgNextBtn, .stockimagemanager-search-box").hide();
                $('#stockimagemanager-container').html('<p class="text-center">In order to have an easy supply of stock images visit <a target="_blank" href="https://pixabay.com/api/docs/">Pixabay</a> to get an API key for your application.</p><p class="text-center">Then add the following to your .env file:<br> PIXABAY=yourApiKey</p>');
            } else {
                var _module = this;
                _module.search('null');
                $("#stockimagemanager-search").bind("click", function(){
                    var _val = $("#stockimagemanager-filter").val();
                    if (_val == '') {
                        _val = 'null';
                    };
                    _module.search(_val);
                });
                $("#stockImgPrevBtn, #stockImgNextBtn").bind("click", function() {
                    var _val = $("#stockimagemanager-filter").val();
                    if (_val == '') {
                        _val = 'null';
                    };
                    _module.search(_val, $(this).attr('data-page'));
                });
            }
        },
        search: function(_term, _page) {
            if (typeof _page == 'undefined') {
                _page = 1;
            };
            if (typeof _term != 'undefined' && _term != 'null' && _term != null) {
                _searchTerm = "&q=" + encodeURIComponent(_term);
            } else {
                _searchTerm = '';
            }

            $('#stockimagemanager-container').html('loading...');

            $.ajax({
                dataType: "json",
                cache: false,
                url: this.opts.stockImageManagerJson + "?key=" + _pixabayKey + _searchTerm + "&order=popular&page=" + _page,
                error: function(data){
                    console.log(data)
                },
                success: $.proxy(function(data)
                {
                    if (Math.floor(data.totalHits / 20) == _page) {
                        $("#stockImgNextBtn").hide();
                    } else  {
                        $("#stockImgNextBtn").show();
                    }

                    if (_page == 1) {
                        $("#stockImgPrevBtn").hide();
                    } else  {
                        $("#stockImgPrevBtn").show();
                    }

                    $("#stockImgNextBtn").attr('data-page', parseInt(_page) + 1);
                    $("#stockImgPrevBtn").attr('data-page', parseInt(_page) - 1);

                    $('#stockimagemanager-container').html("");
                    $.each((data.hits), $.proxy(function(key, val)
                    {
                        var img = $('<div class="raw25 float-left thumbnail-box"><img class="img-responsive" data-img-name="'+ val.previewURL +'" data-url="' + val.webformatURL + '" src="' + val.previewURL + '" rel="' + val.previewURL + '" style="cursor: pointer;" /></div>');
                        $('#stockimagemanager-container').append(img);
                        $(img).click($.proxy(this.insert, this));
                    }, this));

                }, this)
            });
        },
        insert: function(e)
        {
            var _imageURL = '';
            var _this = this;
            $.ajax({
                type: 'POST',
                dataType: "json",
                cache: false,
                data: {
                    _token: _token,
                    location: $(e.target).attr('data-url')
                },
                url: _url + '/cms/api/images/store',
                error: function(data){
                    console.log(data)
                },
                success: $.proxy(function(data) {
                    e.preventDefault();
                    _this.insertion.insertHtml('<img src="' + data.data.js_url + '" />');
                    _this.app.api('module.modal.close');
                }, this)
            });
        },
    });
})(Redactor);



(function($R)
{
    $R.add('plugin', 'specialchars', {
        translations: {
    		en: {
    			"specialchars": "Special Characters"
    		}
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;

            // local
            this.chars = [

                '&lsquo;', '&rsquo;', '&ldquo;', '&rdquo;', '&ndash;', '&mdash;', '&divide;', '&hellip;', '&trade;', '&bull;',
            	'&rarr;', '&asymp;', '$', '&euro;', '&cent;', '&pound;', '&yen;', '&iexcl;',
            	'&curren;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&raquo;', '&not;', '&reg;', '&macr;',
            	'&deg;', '&sup1;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;',  '&ordm;',
            	'&frac14;', '&frac12;', '&frac34;', '&iquest;', '&Agrave;', '&Aacute;', '&Acirc;', '&Atilde;', '&Auml;', '&Aring;',
            	'&AElig;', '&Ccedil;', '&Egrave;', '&Eacute;', '&Ecirc;', '&Euml;', '&Igrave;', '&Iacute;', '&Icirc;', '&Iuml;',
            	'&ETH;', '&Ntilde;', '&Ograve;', '&Oacute;', '&Ocirc;', '&Otilde;', '&Ouml;', '&times;', '&Oslash;', '&Ugrave;',
            	'&Uacute;', '&Ucirc;', '&Uuml;', '&Yacute;', '&THORN;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;',
            	'&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;',
            	'&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;',
            	'&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&OElig;', '&oelig;',
            	'&#372;', '&#374', '&#373', '&#375;'
            ];
        },
        // public
        start: function()
        {
            var btnObj = {
                title: this.lang.get('specialchars')
            };

            var $dropdown = this._buildDropdown();

            this.$button = this.toolbar.addButton('specialchars', btnObj);
			this.$button.setIcon('<i class="re-icon-specialcharacters"></i>');
			this.$button.setDropdown($dropdown);
        },

        // private
        _set: function(character)
        {
            this.insertion.insertChar(character);
        },
        _buildDropdown: function()
		{
    		var self = this;
            var $dropdown = $R.dom('<div class="redactor-dropdown-cells">');
            var func = function(e)
			{
				e.preventDefault();

				var $el = $R.dom(e.target);
				self._set($el.data('char'));
			};

            for (var i = 0; i < this.chars.length; i++)
            {
                var $el = $R.dom('<a>');
                $el.attr({ 'href': '#', 'data-char': this.chars[i] });
                $el.css({ 'line-height': '32px', 'width': '32px', 'height': '32px' });
                $el.html(this.chars[i]);
                $el.on('mousedown', func);

                $dropdown.append($el);
            }

            return $dropdown;
		}
    });
})(Redactor);
(function($R)
{
    $R.add('plugin', 'table', {
        translations: {
            en: {
        		"table": "Table",
        		"insert-table": "Insert table",
        		"insert-row-above": "Insert row above",
        		"insert-row-below": "Insert row below",
        		"insert-column-left": "Insert column left",
        		"insert-column-right": "Insert column right",
        		"add-head": "Add head",
        		"delete-head": "Delete head",
        		"delete-column": "Delete column",
        		"delete-row": "Delete row",
        		"delete-table": "Delete table"
        	}
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
            this.caret = app.caret;
            this.editor = app.editor;
            this.toolbar = app.toolbar;
            this.component = app.component;
            this.inspector = app.inspector;
            this.insertion = app.insertion;
            this.selection = app.selection;
        },
        // messages
        ondropdown: {
            table: {
                observe: function(dropdown)
                {
                    this._observeDropdown(dropdown);
                }
            }
        },
        onbottomclick: function()
        {
            this.insertion.insertToEnd(this.editor.getLastNode(), 'table');
        },

        // public
        start: function()
        {
			var dropdown = {
    			observe: 'table',
    			'insert-table': {
    				title: this.lang.get('insert-table'),
    				api: 'plugin.table.insert'
    			},
    			'insert-row-above': {
                    title: this.lang.get('insert-row-above'),
    				classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowAbove'
    			},
    			'insert-row-below': {
        			title: this.lang.get('insert-row-below'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowBelow'
    			},
    			'insert-column-left': {
        			title: this.lang.get('insert-column-left'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnLeft'
    			},
    			'insert-column-right': {
        			title: this.lang.get('insert-column-right'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnRight'
    			},
    			'add-head': {
        			title: this.lang.get('add-head'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addHead'
    			},
    			'delete-head': {
        			title: this.lang.get('delete-head'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteHead'
    			},
    			'delete-column': {
        			title: this.lang.get('delete-column'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteColumn'
    			},
    			'delete-row': {
        			title: this.lang.get('delete-row'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteRow'
    			},
    			'delete-table': {
        			title: this.lang.get('delete-table'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteTable'
    			}
			};
            var obj = {
                title: this.lang.get('table')
            };

			var $button = this.toolbar.addButtonBefore('link', 'table', obj);
			$button.setIcon('<i class="re-icon-table"></i>');
			$button.setDropdown(dropdown);
        },
		insert: function()
		{
            var rows = 2;
			var columns = 3;
			var $component = this.component.create('table');

			for (var i = 0; i < rows; i++)
			{
			    $component.addRow(columns);
			}

			$component =  this.insertion.insertHtml($component);
			this.caret.setStart($component);
		},
        addRowAbove: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'before');

                this.caret.setStart($row);
            }
        },
        addRowBelow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'after');

                this.caret.setStart($row);
            }
        },
        addColumnLeft: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'left');
                this.selection.restore();
            }
        },
        addColumnRight: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'right');
                this.selection.restore();
            }
        },
        addHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                this.selection.save();
                $component.addHead();
                this.selection.restore();
            }
        },
        deleteHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $head = $R.dom(current).closest('thead');
                if ($head.length !== 0)
                {
                    $component.removeHead();
                    this.caret.setStart($component);
                }
                else
                {
                    this.selection.save();
                    $component.removeHead();
                    this.selection.restore();
                }
            }
        },
        deleteColumn: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentCell = $R.dom(current).closest('td, th');
                var nextCell = $currentCell.nextElement().get();
                var prevCell = $currentCell.prevElement().get();

                $component.removeColumn(current);

                if (nextCell) this.caret.setStart(nextCell);
                else if (prevCell) this.caret.setEnd(prevCell);
                else this.deleteTable();
            }
        },
        deleteRow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentRow = $R.dom(current).closest('tr');
                var nextRow = $currentRow.nextElement().get();
                var prevRow = $currentRow.prevElement().get();

                $component.removeRow(current);

                if (nextRow) this.caret.setStart(nextRow);
                else if (prevRow) this.caret.setEnd(prevRow);
                else this.deleteTable();
            }
        },
        deleteTable: function()
        {
            var table = this._getTable();
            if (table)
            {
                this.component.remove(table);
            }
        },

        // private
        _getTable: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                return data.getTable();
            }
        },
        _getComponent: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                var table = data.getTable();

                return this.component.create('table', table);
            }
        },
        _observeDropdown: function(dropdown)
        {
            var table = this._getTable();
            var items = dropdown.getItemsByClass('redactor-table-item-observable');
            var tableItem = dropdown.getItem('insert-table');
            if (table)
            {
                this._observeItems(items, 'enable');
                tableItem.disable();
            }
            else
            {
                this._observeItems(items, 'disable');
                tableItem.enable();
            }
        },
        _observeItems: function(items, type)
        {
            for (var i = 0; i < items.length; i++)
            {
                items[i][type]();
            }
        }
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'table.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },

        // public
        addHead: function()
        {
			this.removeHead();

			var columns = this.$element.find('tr').first().children('td, th').length;
			var $head = $R.dom('<thead>');
            var $row = this._buildRow(columns, '<th>');

            $head.append($row);
            this.$element.prepend($head);
        },
        addRow: function(columns)
        {
            var $row = this._buildRow(columns);
            this.$element.append($row);

            return $row;
        },
        addRowTo: function(current, type)
        {
            return this._addRowTo(current, type);
        },
        addColumnTo: function(current, type)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
			{
				if (node === $currentCell.get()) index = i;
			});

			this.$element.find('tr').each(function(node)
			{
    			var $node = $R.dom(node);
				var origCell = $node.find('td, th').get(index);
				var $origCell = $R.dom(origCell);

				var $td = $origCell.clone();
				$td.html('');

				if (type === 'right') $origCell.after($td);
				else                  $origCell.before($td);
			});
        },
        removeHead: function()
        {
			var $head = this.$element.find('thead');
			if ($head.length !== 0) $head.remove();
        },
        removeRow: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');

            $currentRow.remove();
        },
        removeColumn: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
			{
				if (node === $currentCell.get()) index = i;
			});

			this.$element.find('tr').each(function(node)
			{
    			var $node = $R.dom(node);
				var origCell = $node.find('td, th').get(index);
				var $origCell = $R.dom(origCell);

				$origCell.remove();
			});
        },

        // private
        _init: function(el)
        {
            var wrapper, element;
            if (typeof el !== 'undefined')
            {
                var $node = $R.dom(el);
                var node = $node.get();
                var $figure = $node.closest('figure');
                if ($figure.length !== 0)
                {
                    wrapper = $figure;
                    element = $figure.find('table').get();
                }
                else if (node.tagName === 'TABLE')
                {
                    element = node;
                }
            }

            this._buildWrapper(wrapper);
            this._buildElement(element);
            this._initWrapper();
        },
        _addRowTo: function(current, position)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            if ($currentRow.length !== 0)
            {
                var columns = $currentRow.children('td, th').length;
                var $newRow = this._buildRow(columns);

                $currentRow[position]($newRow);

                return $newRow;
            }
        },
        _buildRow: function(columns, tag)
        {
            tag = tag || '<td>';

            var $row = $R.dom('<tr>');
            for (var i = 0; i < columns; i++)
            {
                var $cell = $R.dom(tag);
                $cell.attr('contenteditable', true);

                $row.append($cell);
            }

            return $row;
        },
        _buildElement: function(node)
        {
            if (node)
            {
                this.$element = $R.dom(node);
            }
            else
            {
                this.$element = $R.dom('<table>');
                this.append(this.$element);
            }
        },
        _buildWrapper: function(node)
        {
            node = node || '<figure>';

            this.parse(node);
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'table',
                'tabindex': '-1',
                'contenteditable': false
            });
        }
    });

})(Redactor);
(function($R)
{
    $R.add('plugin', 'video', {
        translations: {
            en: {
                "video": "Video",
                "video-html-code": "Video Embed Code or Youtube/Vimeo Link"
            }
        },
        modals: {
            'video':
                '<form action=""> \
                    <div class="form-item"> \
                        <label for="modal-video-input">## video-html-code ## <span class="req">*</span></label> \
                        <textarea id="modal-video-input" name="video" style="height: 160px;"></textarea> \
                    </div> \
                </form>'
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
            this.toolbar = app.toolbar;
            this.component = app.component;
            this.insertion = app.insertion;
            this.inspector = app.inspector;
        },
        // messages
        onmodal: {
            video: {
                opened: function($modal, $form)
                {
                    $form.getField('video').focus();
                },
                insert: function($modal, $form)
                {
                    var data = $form.getData();
                    this._insert(data);
                }
            }
        },
        oncontextbar: function(e, contextbar)
        {
            var data = this.inspector.parse(e.target)
            if (data.isComponentType('video'))
            {
                var node = data.getComponent();
                var buttons = {
                    "remove": {
                        title: this.lang.get('delete'),
                        api: 'plugin.video.remove',
                        args: node
                    }
                };

                contextbar.set(e, node, buttons, 'bottom');
            }

        },

        // public
        start: function()
        {
            var obj = {
                title: this.lang.get('video'),
                api: 'plugin.video.open'
            };

            var $button = this.toolbar.addButtonAfter('image', 'video', obj);
            $button.setIcon('<i class="re-icon-video"></i>');
        },
        open: function()
		{
            var options = {
                title: this.lang.get('video'),
                width: '600px',
                name: 'video',
                handle: 'insert',
                commands: {
                    insert: { title: this.lang.get('insert') },
                    cancel: { title: this.lang.get('cancel') }
                }
            };

            this.app.api('module.modal.build', options);
		},
        remove: function(node)
        {
            this.component.remove(node);
        },

        // private
		_insert: function(data)
		{
    		this.app.api('module.modal.close');

    		if (data.video.trim() === '')
    		{
        	    return;
    		}

            // parsing
            data.video = this._matchData(data.video);

            // inserting
            if (this._isVideoIframe(data.video))
            {
                var $video = this.component.create('video', data.video);
                this.insertion.insertHtml($video);
            }
		},

		_isVideoIframe: function(data)
		{
            return (data.match(/<iframe|<video/gi) !== null);
		},
		_matchData: function(data)
		{
			var iframeStart = '<iframe style="width: 500px; height: 281px;" src="';
			var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';

            if (this._isVideoIframe(data))
			{
				var allowed = ['iframe', 'video', 'source'];
				var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

			    data = data.replace(tags, function ($0, $1)
			    {
			        return (allowed.indexOf($1.toLowerCase()) === -1) ? '' : $0;
			    });
			}

			if (data.match(this.opts.regex.youtube))
			{
				data = data.replace(this.opts.regex.youtube, iframeStart + '//www.youtube.com/embed/$1' + iframeEnd);
			}
			else if (data.match(this.opts.regex.vimeo))
			{
				data = data.replace(this.opts.regex.vimeo, iframeStart + '//player.vimeo.com/video/$2' + iframeEnd);
			}


			return data;
		}
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'video.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },

        // private
        _init: function(el)
        {
            if (typeof el !== 'undefined')
            {
                var $node = $R.dom(el);
                var $wrapper = $node.closest('figure');
                if ($wrapper.length !== 0)
                {
                    this.parse($wrapper);
                }
                else
                {
                    this.parse('<figure>');
                    this.append(el);
                }
            }
            else
            {
                this.parse('<figure>');
            }


            this._initWrapper();
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'video',
                'tabindex': '-1',
                'contenteditable': false
            });
        }
    });
})(Redactor);