/**
 * Created by Administrator on 2016/8/3.
 */
var requirejs, require, define;
(function(global) {
    var req, s, head, baseElement, dataMain, src, interactiveScript, currentlyAddingScript, mainScript, subPath, version = "2.1.11", commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg, cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g, jsSuffixRegExp = /\.js$/, currDirRegExp = /^\.\//, op = Object.prototype, ostring = op.toString, hasOwn = op.hasOwnProperty, ap = Array.prototype, apsp = ap.splice, isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document), isWebWorker = !isBrowser && typeof importScripts !== "undefined", readyRegExp = isBrowser && navigator.platform === "PLAYSTATION 3" ? /^complete$/ : /^(complete|loaded)$/, defContextName = "_", isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]", contexts = {}, cfg = {}, globalDefQueue = [], useInteractive = false;
    function isFunction(it) {
        return ostring.call(it) === "[object Function]"
    }
    function isArray(it) {
        return ostring.call(it) === "[object Array]"
    }
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break
                }
            }
        }
    }
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break
                }
            }
        }
    }
    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop)
    }
    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop]
    }
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break
                }
            }
        }
    }
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function(value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === "object" && value && !isArray(value) && !isFunction(value) && !(value instanceof RegExp)) {
                        if (!target[prop]) {
                            target[prop] = {}
                        }
                        mixin(target[prop], value, force, deepStringMixin)
                    } else {
                        target[prop] = value
                    }
                }
            })
        }
        return target
    }
    function bind(obj, fn) {
        return function() {
            return fn.apply(obj, arguments)
        }
    }
    function scripts() {
        return document.getElementsByTagName("script")
    }
    function defaultOnError(err) {
        throw err
    }
    function getGlobal(value) {
        if (!value) {
            return value
        }
        var g = global;
        each(value.split("."), function(part) {
            g = g[part]
        });
        return g
    }
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + "\nhttp://requirejs.org/docs/errors.html#" + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err
        }
        return e
    }
    if (typeof define !== "undefined") {
        return
    }
    if (typeof requirejs !== "undefined") {
        if (isFunction(requirejs)) {
            return
        }
        cfg = requirejs;
        requirejs = undefined
    }
    if (typeof require !== "undefined" && !isFunction(require)) {
        cfg = require;
        require = undefined
    }
    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers, checkLoadedTimeoutId, config = {
            waitSeconds: 7,
            baseUrl: "./",
            paths: {},
            bundles: {},
            pkgs: {},
            shim: {},
            config: {}
        }, registry = {}, enabledRegistry = {}, undefEvents = {}, defQueue = [], defined = {}, urlFetched = {}, bundlesMap = {}, requireCounter = 1, unnormalizedCounter = 1;
        function trimDots(ary) {
            var i, part, length = ary.length;
            for (i = 0; i < length; i++) {
                part = ary[i];
                if (part === ".") {
                    ary.splice(i, 1);
                    i -= 1
                } else {
                    if (part === "..") {
                        if (i === 1 && (ary[2] === ".." || ary[0] === "..")) {
                            break
                        } else {
                            if (i > 0) {
                                ary.splice(i - 1, 2);
                                i -= 2
                            }
                        }
                    }
                }
            }
        }
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex, foundMap, foundI, foundStarMap, starI, baseParts = baseName && baseName.split("/"), normalizedBaseParts = baseParts, map = config.map, starMap = map && map["*"];
            if (name && name.charAt(0) === ".") {
                if (baseName) {
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = name.split("/");
                    lastIndex = name.length - 1;
                    if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                        name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "")
                    }
                    name = normalizedBaseParts.concat(name);
                    trimDots(name);
                    name = name.join("/")
                } else {
                    if (name.indexOf("./") === 0) {
                        name = name.substring(2)
                    }
                }
            }
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split("/");
                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join("/");
                    if (baseParts) {
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join("/"));
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop
                                }
                            }
                        }
                    }
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i
                    }
                }
                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI
                }
                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join("/")
                }
            }
            pkgMain = getOwn(config.pkgs, name);
            return pkgMain ? pkgMain : name
        }
        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function(scriptNode) {
                    if (scriptNode.getAttribute("data-requiremodule") === name && scriptNode.getAttribute("data-requirecontext") === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true
                    }
                })
            }
        }
        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                pathConfig.shift();
                context.require.undef(id);
                context.require([id]);
                return true
            }
        }
        function splitPrefix(name) {
            var prefix, index = name ? name.indexOf("!") : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length)
            }
            return [prefix, name]
        }
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts, prefix = null , parentName = parentModuleMap ? parentModuleMap.name : null , originalName = name, isDefine = true, normalizedName = "";
            if (!name) {
                isDefine = false;
                name = "_@r" + (requireCounter += 1)
            }
            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];
            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix)
            }
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        normalizedName = pluginModule.normalize(name, function(name) {
                            return normalize(name, parentName, applyMap)
                        })
                    } else {
                        normalizedName = normalize(name, parentName, applyMap)
                    }
                } else {
                    normalizedName = normalize(name, parentName, applyMap);
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;
                    url = context.nameToUrl(normalizedName)
                }
            }
            suffix = prefix && !pluginModule && !isNormalized ? "_unnormalized" + (unnormalizedCounter += 1) : "";
            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ? prefix + "!" + normalizedName : normalizedName) + suffix
            }
        }
        function getModule(depMap) {
            var id = depMap.id
                , mod = getOwn(registry, id);
            if (!mod) {
                mod = registry[id] = new context.Module(depMap)
            }
            return mod
        }
        function on(depMap, name, fn) {
            var id = depMap.id
                , mod = getOwn(registry, id);
            if (hasProp(defined, id) && (!mod || mod.defineEmitComplete)) {
                if (name === "defined") {
                    fn(defined[id])
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === "error") {
                    fn(mod.error)
                } else {
                    mod.on(name, fn)
                }
            }
        }
        function onError(err, errback) {
            var ids = err.requireModules
                , notified = false;
            if (errback) {
                errback(err)
            } else {
                each(ids, function(id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit("error", err)
                        }
                    }
                });
                if (!notified) {
                    req.onError(err)
                }
            }
        }
        function takeGlobalQueue() {
            if (globalDefQueue.length) {
                apsp.apply(defQueue, [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = []
            }
        }
        handlers = {
            require: function(mod) {
                if (mod.require) {
                    return mod.require
                } else {
                    return ( mod.require = context.makeRequire(mod.map))
                }
            },
            exports: function(mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return ( defined[mod.map.id] = mod.exports)
                    } else {
                        return ( mod.exports = defined[mod.map.id] = {})
                    }
                }
            },
            module: function(mod) {
                if (mod.module) {
                    return mod.module
                } else {
                    return ( mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function() {
                            return getOwn(config.config, mod.map.id) || {}
                        },
                        exports: mod.exports || (mod.exports = {})
                    })
                }
            }
        };
        function cleanRegistry(id) {
            delete registry[id];
            delete enabledRegistry[id]
        }
        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;
            if (mod.error) {
                mod.emit("error", mod.error)
            } else {
                traced[id] = true;
                each(mod.depMaps, function(depMap, i) {
                    var depId = depMap.id
                        , dep = getOwn(registry, depId);
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check()
                        } else {
                            breakCycle(dep, traced, processed)
                        }
                    }
                });
                processed[id] = true
            }
        }
        function checkLoaded() {
            var err, usingPathFallback, waitInterval = config.waitSeconds * 1000, expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(), noLoads = [], reqCalls = [], stillLoading = false, needCycleCheck = true;
            if (inCheckLoaded) {
                return
            }
            inCheckLoaded = true;
            eachProp(enabledRegistry, function(mod) {
                var map = mod.map
                    , modId = map.id;
                if (!mod.enabled) {
                    return
                }
                if (!map.isDefine) {
                    reqCalls.push(mod)
                }
                if (!mod.error) {
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true
                        } else {
                            noLoads.push(modId);
                            removeScript(modId)
                        }
                    } else {
                        if (!mod.inited && mod.fetched && map.isDefine) {
                            stillLoading = true;
                            if (!map.prefix) {
                                return ( needCycleCheck = false)
                            }
                        }
                    }
                }
            });
            if (expired && noLoads.length) {
                err = makeError("timeout", "Load timeout for modules: " + noLoads, null , noLoads);
                err.contextName = context.contextName;
                return onError(err)
            }
            if (needCycleCheck) {
                each(reqCalls, function(mod) {
                    breakCycle(mod, {}, {})
                })
            }
            if ((!expired || usingPathFallback) && stillLoading) {
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function() {
                        checkLoadedTimeoutId = 0;
                        checkLoaded()
                    }, 50)
                }
            }
            inCheckLoaded = false
        }
        Module = function(map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0
        }
        ;
        Module.prototype = {
            init: function(depMaps, factory, errback, options) {
                options = options || {};
                if (this.inited) {
                    return
                }
                this.factory = factory;
                if (errback) {
                    this.on("error", errback)
                } else {
                    if (this.events.error) {
                        errback = bind(this, function(err) {
                            this.emit("error", err)
                        })
                    }
                }
                this.depMaps = depMaps && depMaps.slice(0);
                this.errback = errback;
                this.inited = true;
                this.ignore = options.ignore;
                if (options.enabled || this.enabled) {
                    this.enable()
                } else {
                    this.check()
                }
            },
            defineDep: function(i, depExports) {
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports
                }
            },
            fetch: function() {
                if (this.fetched) {
                    return
                }
                this.fetched = true;
                context.startTime = (new Date()).getTime();
                var map = this.map;
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function() {
                        return map.prefix ? this.callPlugin() : this.load()
                    }))
                } else {
                    return map.prefix ? this.callPlugin() : this.load()
                }
            },
            load: function() {
                var url = this.map.url;
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url)
                }
            },
            check: function() {
                if (!this.enabled || this.enabling) {
                    return
                }
                var err, cjsModule, id = this.map.id, depExports = this.depExports, exports = this.exports, factory = this.factory;
                if (!this.inited) {
                    this.fetch()
                } else {
                    if (this.error) {
                        this.emit("error", this.error)
                    } else {
                        if (!this.defining) {
                            this.defining = true;
                            if (this.depCount < 1 && !this.defined) {
                                if (isFunction(factory)) {
                                    if ((this.events.error && this.map.isDefine) || req.onError !== defaultOnError) {
                                        try {
                                            exports = context.execCb(id, factory, depExports, exports)
                                        } catch (e) {
                                            err = e
                                        }
                                    } else {
                                        exports = context.execCb(id, factory, depExports, exports)
                                    }
                                    if (this.map.isDefine && exports === undefined) {
                                        cjsModule = this.module;
                                        if (cjsModule) {
                                            exports = cjsModule.exports
                                        } else {
                                            if (this.usingExports) {
                                                exports = this.exports
                                            }
                                        }
                                    }
                                    if (err) {
                                        err.requireMap = this.map;
                                        err.requireModules = this.map.isDefine ? [this.map.id] : null ;
                                        err.requireType = this.map.isDefine ? "define" : "require";
                                        return onError((this.error = err))
                                    }
                                } else {
                                    exports = factory
                                }
                                this.exports = exports;
                                if (this.map.isDefine && !this.ignore) {
                                    defined[id] = exports;
                                    if (req.onResourceLoad) {
                                        req.onResourceLoad(context, this.map, this.depMaps)
                                    }
                                }
                                cleanRegistry(id);
                                this.defined = true
                            }
                            this.defining = false;
                            if (this.defined && !this.defineEmitted) {
                                this.defineEmitted = true;
                                this.emit("defined", this.exports);
                                this.defineEmitComplete = true
                            }
                        }
                    }
                }
            },
            callPlugin: function() {
                var map = this.map
                    , id = map.id
                    , pluginMap = makeModuleMap(map.prefix);
                this.depMaps.push(pluginMap);
                on(pluginMap, "defined", bind(this, function(plugin) {
                    var load, normalizedMap, normalizedMod, bundleId = getOwn(bundlesMap, this.map.id), name = this.map.name, parentName = this.map.parentMap ? this.map.parentMap.name : null , localRequire = context.makeRequire(map.parentMap, {
                        enableBuildCallback: true
                    });
                    if (this.map.unnormalized) {
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function(name) {
                                    return normalize(name, parentName, true)
                                }) || ""
                        }
                        normalizedMap = makeModuleMap(map.prefix + "!" + name, this.map.parentMap);
                        on(normalizedMap, "defined", bind(this, function(value) {
                            this.init([], function() {
                                return value
                            }, null , {
                                enabled: true,
                                ignore: true
                            })
                        }));
                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            this.depMaps.push(normalizedMap);
                            if (this.events.error) {
                                normalizedMod.on("error", bind(this, function(err) {
                                    this.emit("error", err)
                                }))
                            }
                            normalizedMod.enable()
                        }
                        return
                    }
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return
                    }
                    load = bind(this, function(value) {
                        this.init([], function() {
                            return value
                        }, null , {
                            enabled: true
                        })
                    });
                    load.error = bind(this, function(err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];
                        eachProp(registry, function(mod) {
                            if (mod.map.id.indexOf(id + "_unnormalized") === 0) {
                                cleanRegistry(mod.map.id)
                            }
                        });
                        onError(err)
                    });
                    load.fromText = bind(this, function(text, textAlt) {
                        var moduleName = map.name
                            , moduleMap = makeModuleMap(moduleName)
                            , hasInteractive = useInteractive;
                        if (textAlt) {
                            text = textAlt
                        }
                        if (hasInteractive) {
                            useInteractive = false
                        }
                        getModule(moduleMap);
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id]
                        }
                        try {
                            req.exec(text)
                        } catch (e) {
                            return onError(makeError("fromtexteval", "fromText eval for " + id + " failed: " + e, e, [id]))
                        }
                        if (hasInteractive) {
                            useInteractive = true
                        }
                        this.depMaps.push(moduleMap);
                        context.completeLoad(moduleName);
                        localRequire([moduleName], load)
                    });
                    plugin.load(map.name, localRequire, load, config)
                }));
                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap
            },
            enable: function() {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;
                this.enabling = true;
                each(this.depMaps, bind(this, function(depMap, i) {
                    var id, mod, handler;
                    if (typeof depMap === "string") {
                        depMap = makeModuleMap(depMap, (this.map.isDefine ? this.map : this.map.parentMap), false, !this.skipMap);
                        this.depMaps[i] = depMap;
                        handler = getOwn(handlers, depMap.id);
                        if (handler) {
                            this.depExports[i] = handler(this);
                            return
                        }
                        this.depCount += 1;
                        on(depMap, "defined", bind(this, function(depExports) {
                            this.defineDep(i, depExports);
                            this.check()
                        }));
                        if (this.errback) {
                            on(depMap, "error", bind(this, this.errback))
                        }
                    }
                    id = depMap.id;
                    mod = registry[id];
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this)
                    }
                }));
                eachProp(this.pluginMaps, bind(this, function(pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this)
                    }
                }));
                this.enabling = false;
                this.check()
            },
            on: function(name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = []
                }
                cbs.push(cb)
            },
            emit: function(name, evt) {
                each(this.events[name], function(cb) {
                    cb(evt)
                });
                if (name === "error") {
                    delete this.events[name]
                }
            }
        };
        function callGetModule(args) {
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null , true)).init(args[1], args[2])
            }
        }
        function removeListener(node, func, name, ieName) {
            if (node.detachEvent && !isOpera) {
                if (ieName) {
                    node.detachEvent(ieName, func)
                }
            } else {
                node.removeEventListener(name, func, false)
            }
        }
        function getScriptData(evt) {
            var node = evt.currentTarget || evt.srcElement;
            removeListener(node, context.onScriptLoad, "load", "onreadystatechange");
            removeListener(node, context.onScriptError, "error");
            return {
                node: node,
                id: node && node.getAttribute("data-requiremodule")
            }
        }
        function intakeDefines() {
            var args;
            takeGlobalQueue();
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null ) {
                    return onError(makeError("mismatch", "Mismatched anonymous define() module: " + args[args.length - 1]))
                } else {
                    callGetModule(args)
                }
            }
        }
        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,
            configure: function(cfg) {
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== "/") {
                        cfg.baseUrl += "/"
                    }
                }
                var shim = config.shim
                    , objs = {
                    paths: true,
                    bundles: true,
                    config: true,
                    map: true
                };
                eachProp(cfg, function(value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {}
                        }
                        mixin(config[prop], value, true, true)
                    } else {
                        config[prop] = value
                    }
                });
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function(value, prop) {
                        each(value, function(v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop
                            }
                        })
                    })
                }
                if (cfg.shim) {
                    eachProp(cfg.shim, function(value, id) {
                        if (isArray(value)) {
                            value = {
                                deps: value
                            }
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value)
                        }
                        shim[id] = value
                    });
                    config.shim = shim
                }
                if (cfg.packages) {
                    each(cfg.packages, function(pkgObj) {
                        var location, name;
                        pkgObj = typeof pkgObj === "string" ? {
                            name: pkgObj
                        } : pkgObj;
                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location
                        }
                        config.pkgs[name] = pkgObj.name + "/" + (pkgObj.main || "main").replace(currDirRegExp, "").replace(jsSuffixRegExp, "")
                    })
                }
                eachProp(registry, function(mod, id) {
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id)
                    }
                });
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback)
                }
            },
            makeShimExports: function(value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments)
                    }
                    return ret || (value.exports && getGlobal(value.exports))
                }
                return fn
            },
            makeRequire: function(relMap, options) {
                options = options || {};
                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;
                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true
                    }
                    if (typeof deps === "string") {
                        if (isFunction(callback)) {
                            return onError(makeError("requireargs", "Invalid require call"), errback)
                        }
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id])
                        }
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire)
                        }
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;
                        if (!hasProp(defined, id)) {
                            return onError(makeError("notloaded", 'Module name "' + id + '" has not been loaded yet for context: ' + contextName + (relMap ? "" : ". Use require([])")))
                        }
                        return defined[id]
                    }
                    intakeDefines();
                    context.nextTick(function() {
                        intakeDefines();
                        requireMod = getModule(makeModuleMap(null , relMap));
                        requireMod.skipMap = options.skipMap;
                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });
                        checkLoaded()
                    });
                    return localRequire
                }
                mixin(localRequire, {
                    isBrowser: isBrowser,
                    toUrl: function(moduleNamePlusExt) {
                        var ext, index = moduleNamePlusExt.lastIndexOf("."), segment = moduleNamePlusExt.split("/")[0], isRelative = segment === "." || segment === "..";
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index)
                        }
                        return context.nameToUrl(normalize(moduleNamePlusExt, relMap && relMap.id, true), ext, true)
                    },
                    defined: function(id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id)
                    },
                    specified: function(id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id)
                    }
                });
                if (!relMap) {
                    localRequire.undef = function(id) {
                        takeGlobalQueue();
                        var map = makeModuleMap(id, relMap, true)
                            , mod = getOwn(registry, id);
                        removeScript(id);
                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1)
                            }
                        });
                        if (mod) {
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events
                            }
                            cleanRegistry(id)
                        }
                    }
                }
                return localRequire
            },
            enable: function(depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable()
                }
            },
            completeLoad: function(moduleName) {
                var found, args, mod, shim = getOwn(config.shim, moduleName) || {}, shExports = shim.exports;
                takeGlobalQueue();
                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null ) {
                        args[0] = moduleName;
                        if (found) {
                            break
                        }
                        found = true
                    } else {
                        if (args[0] === moduleName) {
                            found = true
                        }
                    }
                    callGetModule(args)
                }
                mod = getOwn(registry, moduleName);
                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return
                        } else {
                            return onError(makeError("nodefine", "No define call for " + moduleName, null , [moduleName]))
                        }
                    } else {
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn])
                    }
                }
                checkLoaded()
            },
            nameToUrl: function(moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url, parentPath, bundleId, pkgMain = getOwn(config.pkgs, moduleName);
                if (pkgMain) {
                    moduleName = pkgMain
                }
                bundleId = getOwn(bundlesMap, moduleName);
                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt)
                }
                if (req.jsExtRegExp.test(moduleName)) {
                    url = moduleName + (ext || "")
                } else {
                    paths = config.paths;
                    syms = moduleName.split("/");
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join("/");
                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0]
                            }
                            syms.splice(0, i, parentPath);
                            break
                        }
                    }
                    url = syms.join("/");
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? "" : ".js"));
                    url = (url.charAt(0) === "/" || url.match(/^[\w\+\.\-]+:/) ? "" : config.baseUrl) + url
                }
                return config.urlArgs ? url + ((url.indexOf("?") === -1 ? "?" : "&") + config.urlArgs) : url
            },
            load: function(id, url) {
                req.load(context, id, url)
            },
            execCb: function(name, callback, args, exports) {
                return callback.apply(exports, args)
            },
            onScriptLoad: function(evt) {
                if (evt.type === "load" || (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    interactiveScript = null ;
                    var data = getScriptData(evt);
                    context.completeLoad(data.id)
                }
            },
            onScriptError: function(evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError("scripterror", "Script error for: " + data.id, evt, [data.id]))
                }
            }
        };
        context.require = context.makeRequire();
        return context
    }
    req = requirejs = function(deps, callback, errback, optional) {
        var context, config, contextName = defContextName;
        if (!isArray(deps) && typeof deps !== "string") {
            config = deps;
            if (isArray(callback)) {
                deps = callback;
                callback = errback;
                errback = optional
            } else {
                deps = []
            }
        }
        if (config && config.context) {
            contextName = config.context
        }
        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName)
        }
        if (config) {
            context.configure(config)
        }
        return context.require(deps, callback, errback)
    }
    ;
    req.config = function(config) {
        return req(config)
    }
    ;
    req.nextTick = typeof setTimeout !== "undefined" ? function(fn) {
        setTimeout(fn, 4)
    }
        : function(fn) {
        fn()
    }
    ;
    if (!require) {
        require = req
    }
    req.version = version;
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };
    req({});
    each(["toUrl", "undef", "defined", "specified"], function(prop) {
        req[prop] = function() {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments)
        }
    });
    if (isBrowser) {
        head = s.head = document.getElementsByTagName("head")[0];
        baseElement = document.getElementsByTagName("base")[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode
        }
    }
    req.onError = defaultOnError;
    req.createNode = function(config, moduleName, url) {
        var node = config.xhtml ? document.createElementNS("http://www.w3.org/1999/xhtml", "html:script") : document.createElement("script");
        node.type = config.scriptType || "text/javascript";
        node.charset = "utf-8";
        node.async = true;
        return node
    }
    ;
    req.load = function(context, moduleName, url) {
        var config = (context && context.config) || {}, node;
        if (isBrowser) {
            node = req.createNode(config, moduleName, url);
            node.setAttribute("data-requirecontext", context.contextName);
            node.setAttribute("data-requiremodule", moduleName);
            if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf("[native code") < 0) && !isOpera) {
                useInteractive = true;
                node.attachEvent("onreadystatechange", context.onScriptLoad)
            } else {
                node.addEventListener("load", context.onScriptLoad, false);
                node.addEventListener("error", context.onScriptError, false)
            }
            node.src = url;
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement)
            } else {
                head.appendChild(node)
            }
            currentlyAddingScript = null ;
            return node
        } else {
            if (isWebWorker) {
                try {
                    importScripts(url);
                    context.completeLoad(moduleName)
                } catch (e) {
                    context.onError(makeError("importscripts", "importScripts failed for " + moduleName + " at " + url, e, [moduleName]))
                }
            }
        }
    }
    ;
    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === "interactive") {
            return interactiveScript
        }
        eachReverse(scripts(), function(script) {
            if (script.readyState === "interactive") {
                return ( interactiveScript = script)
            }
        });
        return interactiveScript
    }
    if (isBrowser && !cfg.skipDataMain) {
        eachReverse(scripts(), function(script) {
            if (!head) {
                head = script.parentNode
            }
            dataMain = script.getAttribute("data-main");
            if (dataMain) {
                mainScript = dataMain;
                if (!cfg.baseUrl) {
                    src = mainScript.split("/");
                    mainScript = src.pop();
                    subPath = src.length ? src.join("/") + "/" : "./";
                    cfg.baseUrl = subPath
                }
                mainScript = mainScript.replace(jsSuffixRegExp, "");
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain
                }
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];
                return true
            }
        })
    }
    define = function(name, deps, callback) {
        var node, context;
        if (typeof name !== "string") {
            callback = deps;
            deps = name;
            name = null
        }
        if (!isArray(deps)) {
            callback = deps;
            deps = null
        }
        if (!deps && isFunction(callback)) {
            deps = [];
            if (callback.length) {
                callback.toString().replace(commentRegExp, "").replace(cjsRequireRegExp, function(match, dep) {
                    deps.push(dep)
                });
                deps = (callback.length === 1 ? ["require"] : ["require", "exports", "module"]).concat(deps)
            }
        }
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute("data-requiremodule")
                }
                context = contexts[node.getAttribute("data-requirecontext")]
            }
        }
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback])
    }
    ;
    define.amd = {
        jQuery: true
    };
    req.exec = function(text) {
        return eval(text)
    }
    ;
    req(cfg)
}(this));
(function() {
    if (require && require.config) {
        var a = "";
        if (window.URLPrefix && window.URLPrefix.statics) {
            a = URLPrefix.statics
        } else {
            a = "http://image.yihaodianimg.com/front-homepage"
        }
        requirejs.config({
            baseUrl: a + "/global/js",
            paths: {
                qrcode: "libs/moduleLib/qrcode.min.js?v1.01",
                base_observer: "base/yhd.observer",
                common_impression: "common/biz/yhd.impression",
                central_ct_adContentTracker: "central/ct/adContentTracker",
                central_adExpTracker: "central/adExpTracker",
                header_province: "header/province_v3"
            }
        })
    }
})();
var loli = window.loli || (window.loli = {});
(function() {
    function c(z, C) {
        var x = /^[1-9]+[0-9]*]*$/;
        var B = 1;
        var N = 0;
        var O = "_";
        var M = N + O;
        var E = 10000000003;
        var b = 2654404609;
        var y = 1;
        var L = 0;
        var a = {};
        a.tag = null ;
        a.expParam = null ;
        function I(f) {
            var e = document.cookie;
            var i = e.split("; ");
            for (var g = 0; g < i.length;
                 g++) {
                var h = i[g].split("=");
                if (h[0] == f) {
                    return h[1]
                }
            }
            return null
        }
        function F(g, f) {
            if (g && g.length && g.length > 0) {
                var h = g.length;
                for (var e = 0; e < h; e++) {
                    if (g[e] == f) {
                        return true
                    }
                }
            }
            return false
        }
        function H(f) {
            var h = 0, g = 0, e;
            for (e = f.length - 1; e >= 0; e--) {
                g = f.charCodeAt(e);
                h = (h << 6 & 268435455) + g + (g << 14);
                g = h & 266338304;
                h = g != 0 ? h ^ g >> 21 : h
            }
            return h
        }
        function P(f) {
            var l = [];
            if (typeof (f) != "undefined" && f != null ) {
                f = $.trim(f);
                if (f != "") {
                    var j = f.split(",");
                    var k = j.length;
                    for (var m = 0; m < k; m++) {
                        var h = $.trim(j[m]);
                        if (h.indexOf("-") > 0) {
                            var g = h.split("-", 2);
                            var e = $.trim(g[0]);
                            var i = $.trim(g[1]);
                            if ((x.test(e) || (!isNaN(e) && e == 0)) && x.test(i)) {
                                e = parseInt(e, 10);
                                i = parseInt(i, 10);
                                for (var n = e; n <= i; n++) {
                                    l.push(n)
                                }
                            }
                        } else {
                            l.push(h)
                        }
                    }
                }
            }
            return l
        }
        function J(e) {
            if (x.test(e) || (!isNaN(e) && e == 0)) {
                return true
            } else {
                return false
            }
        }
        function D(h, l) {
            if (h && h.length && h.length > 0) {
                var j = h.length;
                for (var i = 0; i < j; i++) {
                    var f = h[i];
                    var k = f.bucketNum;
                    var g = f.validFlag;
                    if (g == B) {
                        var e = P(k);
                        if (F(e, l)) {
                            return f
                        }
                    }
                }
            }
            return null
        }
        function G(h, f, j, e) {
            var g = 0;
            var i = Math.abs((((h) * (f) * b) >> (64 - 16))) % j + 1;
            g = i + e;
            return g
        }
        function A() {
            var n = null ;
            var g = I("guid");
            var p = I("bucketNum");
            var t = z.glBase;
            var o = z.glExp;
            var h = z.bxBase;
            var w = z.bxExp;
            var e = P(t);
            var q = P(o);
            var s = P(h);
            var f = P(w);
            var v = e.length + q.length;
            var i = s.length + f.length;
            var l = v + i;
            if (J(p)) {
                bucketNum = parseInt(p)
            } else {
                if (typeof (g) != "undefined" && g != null  && l > 0) {
                    n = Math.abs(H(g));
                    bucketNum = (n % l) + 1
                } else {
                    return null
                }
            }
            a.tag = M + bucketNum;
            if (F(e, bucketNum)) {
                return
            } else {
                if (C && C.id && C.detailList) {
                    var r = C.id;
                    var m = C.detailList;
                    var j = C.isolationLevel;
                    if (j == y && v > 0 && F(q, bucketNum)) {
                        var u = D(m, bucketNum);
                        if (u != null ) {
                            var R = u.id;
                            a.expParam = u.expParam;
                            a.tag = r + O + bucketNum + O + R;
                            return
                        } else {
                            return
                        }
                    } else {
                        if (j == L && i > 0 && (F(f, bucketNum) || F(s, bucketNum))) {
                            var k = bucketNum;
                            if (!J(p) && typeof (g) != "undefined" && g != null ) {
                                k = G(n, r, i, v)
                            }
                            if (F(s, k)) {
                                a.tag = M + k;
                                return
                            } else {
                                if (F(f, k)) {
                                    var u = D(m, k);
                                    if (u != null ) {
                                        var R = u.id;
                                        a.expParam = u.expParam;
                                        a.tag = r + O + k + O + R;
                                        return
                                    } else {
                                        a.tag = r + O + k;
                                        return
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (z) {
            try {
                A()
            } catch (K) {}
        }
        return a
    }
    var d = window.loli;
    if (d) {
        d.abtest = {};
        d.abtest.getABTestExpResult = c
    }
    if (typeof define === "function" && define.amd) {
        define("global_abtest", [], function() {
            var a = {};
            a.getABTestExpResult = c;
            return a
        })
    }
})();
(function() {
    var e = window.loli || (window.loli = {});
    var f = e;
    var d = f.util = f.util || {};
    d.hashImgUrl = function(a) {
        var h = "http:\\/\\/d(\\\d{1,2})\\.";
        var c = new RegExp(h,"i");
        if (c.test(a)) {
            var b = d.toHash(a);
            return a.replace(c, "http://d" + (b % 4 + 6) + ".")
        } else {
            return a
        }
    }
    ;
    d.toHash = function(a) {
        var b = 0;
        for (var c = 0; c < a.length; c++) {
            if (a[c]) {
                b += a[c].charCodeAt()
            }
        }
        return b
    }
    ;
    d.isIE = function() {
        var a = window.navigator.userAgent.toLowerCase();
        var c = /msie ([\d\.]+)/;
        if (c.test(a)) {
            var b = parseInt(c.exec(a)[1]);
            return b
        }
        return 0
    }
    ;
    d.isIpad = function() {
        var a = window.navigator.userAgent;
        return a.indexOf("iPad") > 1
    }
    ;
    d.generateMixed = function(i) {
        var b = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "M", "N", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        var j = "";
        for (var a = 0; a < i; a++) {
            var c = Math.floor(Math.random() * 32);
            j += b[c]
        }
        return j
    }
    ;
    d.isExistArray = function(b, c) {
        var a = false;
        for (var h = 0; h < b.length; h++) {
            if (b[h] == c) {
                a = true;
                break
            }
        }
        return a
    }
})();
(function() {
    var g = window.loli || (window.loli = {});
    var h = g;
    var e = h.util = h.util || {};
    function f(a) {
        if (!a) {
            return true
        }
        for (var b in a) {
            return false
        }
        return true
    }
    e.url = {
        getParams: function(a) {
            a = $.trim(a);
            var c = this;
            var b = c.parseUrl(a);
            return b ? b.params : null
        },
        appendParams: function(l, d) {
            var k = this;
            if (f(d)) {
                return l
            }
            var b = k.parseUrl(l);
            if (!b) {
                return l
            }
            var c = b.params;
            for (var a in d) {
                if (d.hasOwnProperty(a) && (d[a] != null  && typeof d[a] !== "undefined" && $.trim(d[a]).length > 0)) {
                    c[a] = d[a]
                } else {
                    if (d.hasOwnProperty(a) && (d[a] == null  || typeof d[a] === "undefined" || $.trim(d[a]) == "")) {
                        delete c[a]
                    }
                }
            }
            b.params = c;
            return k.toCusString(b)
        },
        deleteParams: function(a, m) {
            var i = this;
            if (!m || m.length < 0) {
                return a
            }
            var d = i.parseUrl(a);
            if (!d) {
                return a
            }
            var c = d.params;
            for (var b = 0; b < m.length; b++) {
                var n = m[b];
                if (c.hasOwnProperty(n)) {
                    delete c[n]
                }
            }
            d.params = c;
            return i.toCusString(d)
        },
        parseUrl: function(B) {
            var E = "";
            var x = "";
            var D = "";
            var d = {};
            B = $.trim(B);
            if (B == "") {
                return null
            }
            var b = B.split("#");
            var C = b[0];
            if (b.length >= 2) {
                for (var y = 1, z = b.length; y < z; y++) {
                    E += "#" + b[y]
                }
            }
            var F = C.indexOf("?");
            var u = C.length;
            if (F > 0) {
                x = C.substring(0, F);
                D = C.substring(F + 1, u)
            } else {
                x = C
            }
            if (D) {
                var a = D.split("&");
                for (var y = 0, z = a.length; y < z; y++) {
                    var i = a[y].indexOf("=");
                    if (i == -1) {
                        continue
                    }
                    var A = a[y].substring(0, i);
                    var c = a[y].substring(i + 1);
                    d[A] = c
                }
            }
            var w = {
                loc: x,
                params: d,
                append: E
            };
            return w
        },
        toCusString: function(j) {
            var c = [];
            c.push(j.loc);
            var d = j.params;
            if (!f(d)) {
                c.push("?");
                var b = 0;
                for (var a in d) {
                    if (d.hasOwnProperty(a) && (d[a] != null  && typeof d[a] !== "undefined" && $.trim(d[a]).length > 0)) {
                        if (b) {
                            c.push("&")
                        }
                        c.push(a + "=" + d[a]);
                        b++
                    }
                }
            }
            if (j.append) {
                c.push(j.append)
            }
            return c.join("")
        },
        getCookie: function(b) {
            if (b) {
                var i = document.cookie;
                var d = i.split("; ");
                for (var a = 0; a < d.length; a++) {
                    var c = d[a].split("=");
                    if (c[0] == b) {
                        return c[1]
                    }
                }
            }
            return null
        },
        setCookie: function(b, d, l, c) {
            var a = c || 30;
            var k = new Date();
            k.setTime(k.getTime() + a * 60 * 1000);
            document.cookie = b + "=" + d + ";expires=" + k.toGMTString() + ";domain=" + l + ";path=/;"
        },
        addPosition: function(S, Q) {
            if (h.global.uid && h.util.generateMixed) {
                var c = this;
                var N = h.global.uid;
                if (N && N.indexOf("-") > 0) {
                    var E = N.split("-")[0];
                    if (E && S != null ) {
                        var C = "x" + S.xrate + "y" + S.yrate;
                        var V = "x:" + S.xrate + "|y:" + S.yrate;
                        var U = new Date();
                        var F = U.getMinutes();
                        var L = U.getSeconds();
                        var G = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
                        var P = G.split("");
                        var T = P[F];
                        var J = P[L];
                        var K = h.util.generateMixed(4) + T + J;
                        var R = K;
                        var a = E + "_" + R;
                        var M = false;
                        try {
                            var I = null ;
                            var H = no3wUrl || "yhd.com";
                            var O = /([\.\w]*)\.yihaodian\.com\.hk/;
                            var b = document.domain;
                            if (!O.test(b)) {
                                c.setCookie(a, V, H, 5);
                                I = c.getCookie(a);
                                if (I == V) {
                                    M = true
                                }
                            }
                        } catch (D) {}
                        var d = {
                            ti: R,
                            tps: ""
                        };
                        if (!M) {
                            d = {
                                ti: "",
                                tps: C
                            }
                        }
                        Q = c.appendParams(Q, d)
                    }
                }
            }
            return Q
        }
    }
})();
(function() {
    var g = window.loli || (window.loli = {});
    var i = g;
    i.config = i.config || {};
    var f = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ`^abcdefghijklmnopqrstuvwxyz";
    var j = f.split("");
    i.config.genUID = function() {
        var b = new Date().getTime();
        var a = i.config.hashClientInfo("11");
        return i.config.base64(b) + "-" + a
    }
    ;
    i.config.base64 = function(e) {
        var m = e;
        var c = [];
        var d = b(m);
        var n = d.length;
        for (var a = 0; a < n; a++) {
            c.push(j[parseInt(d[a], 2).toString(10)])
        }
        return c.join("");
        function b(u) {
            var l = parseInt(u).toString(2);
            var s = l.length;
            var t = [];
            var k = s % 6;
            if (k > 0) {
                t.push(l.substring(0, k))
            }
            var v = k;
            while (v < s) {
                t.push(l.substring(v, v + 6));
                v += 6
            }
            return t
        }
    }
    ;
    i.config.parseUID = function(c) {
        if (!c) {
            return null
        }
        var a = c.length;
        if (a != 7) {
            return null
        }
        var o = [];
        for (var e = 0; e < a; e++) {
            var n = c.charAt(e);
            var d = f.indexOf(n);
            if (d == -1) {
                return null
            }
            var b = d.toString(2);
            for (var p = 6; p > b.length; ) {
                b = "0" + b
            }
            o[e] = b
        }
        return parseInt(o.join(""), 2).toString(10)
    }
    ;
    i.config.isValidUID = function(b) {
        var c = b.split("-");
        if (c.length == 3) {
            var e = i.config.parseUID(c[0]);
            var a = new Date().getTime();
            if (!e || (a - e > 30 * 60 * 1000)) {
                return 0
            }
            var d = i.config.hashClientInfo(c[1]);
            if (!d) {
                return 0
            }
            d = d.split("-");
            if (d.length == 2 && d[1] != c[2]) {
                return 0
            }
        } else {
            return 0
        }
        return 1
    }
    ;
    i.config.hashClientInfo = function(d) {
        var b = window.navigator;
        var e = h("guid");
        b = b.appName + b.platform + b.userAgent;
        var c = "";
        if (e && e != "" && d[0] == 1) {
            b += e;
            c += "1"
        } else {
            c += "0"
        }
        var a = h("yihaodian_uid");
        if (a && a != "" && d[1] == 1) {
            b += a;
            c += "1"
        } else {
            c += "0"
        }
        return c + "-" + i.config.base64(i.config.hash(b))
    }
    ;
    i.config.hash = function(c) {
        var d = 0, a = 0, b;
        if (c) {
            for (b = c.length - 1; b >= 0; b--) {
                a = c.charCodeAt(b);
                d = (d << 6 & 268435455) + a + (a << 14);
                a = d & 266338304;
                d = a != 0 ? d ^ a >> 21 : d
            }
        }
        return d
    }
    ;
    function h(b) {
        var e = document.cookie;
        var d = e.split("; ");
        for (var a = 0; a < d.length; a++) {
            var c = d[a].split("=");
            if (c[0] == b) {
                return c[1]
            }
        }
        return null
    }
})();
loli.global = loli.global || {};
loli.global.uid = loli.config.genUID();
/*!
 * jQuery JavaScript Library v1.11.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-04-28T16:19Z
 */
(function(c, d) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = c.document ? d(c, true) : function(a) {
            if (!a.document) {
                throw new Error("jQuery requires a window with a document")
            }
            return d(a)
        }
    } else {
        d(c)
    }
}(typeof window !== "undefined" ? window : this, function(ed, ey) {
    var dV = [];
    var cX = dV.slice;
    var cY = dV.concat;
    var c7 = dV.push;
    var dt = dV.indexOf;
    var cn = {};
    var c9 = cn.toString;
    var b5 = cn.hasOwnProperty;
    var db = {};
    var c3 = "1.11.3"
        , dY = function(b, a) {
            return new dY.fn.init(b,a)
        }
        , ce = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
        , c0 = /^-ms-/
        , eJ = /-([\da-z])/gi
        , ez = function(b, a) {
            return a.toUpperCase()
        }
        ;
    dY.fn = dY.prototype = {
        jquery: c3,
        constructor: dY,
        selector: "",
        length: 0,
        toArray: function() {
            return cX.call(this)
        },
        get: function(a) {
            return a != null  ? (a < 0 ? this[a + this.length] : this[a]) : cX.call(this)
        },
        pushStack: function(b) {
            var a = dY.merge(this.constructor(), b);
            a.prevObject = this;
            a.context = this.context;
            return a
        },
        each: function(a, b) {
            return dY.each(this, a, b)
        },
        map: function(a) {
            return this.pushStack(dY.map(this, function(b, c) {
                return a.call(b, c, b)
            }))
        },
        slice: function() {
            return this.pushStack(cX.apply(this, arguments))
        },
        first: function() {
            return this.eq(0)
        },
        last: function() {
            return this.eq(-1)
        },
        eq: function(b) {
            var a = this.length
                , c = +b + (b < 0 ? a : 0);
            return this.pushStack(c >= 0 && c < a ? [this[c]] : [])
        },
        end: function() {
            return this.prevObject || this.constructor(null )
        },
        push: c7,
        sort: dV.sort,
        splice: dV.splice
    };
    dY.extend = dY.fn.extend = function() {
        var l, k, g, f, a, c, h = arguments[0] || {}, j = 1, d = arguments.length, b = false;
        if (typeof h === "boolean") {
            b = h;
            h = arguments[j] || {};
            j++
        }
        if (typeof h !== "object" && !dY.isFunction(h)) {
            h = {}
        }
        if (j === d) {
            h = this;
            j--
        }
        for (; j < d; j++) {
            if ((a = arguments[j]) != null ) {
                for (f in a) {
                    l = h[f];
                    g = a[f];
                    if (h === g) {
                        continue
                    }
                    if (b && g && (dY.isPlainObject(g) || (k = dY.isArray(g)))) {
                        if (k) {
                            k = false;
                            c = l && dY.isArray(l) ? l : []
                        } else {
                            c = l && dY.isPlainObject(l) ? l : {}
                        }
                        h[f] = dY.extend(b, c, g)
                    } else {
                        if (g !== undefined) {
                            h[f] = g
                        }
                    }
                }
            }
        }
        return h
    }
    ;
    dY.extend({
        expando: "jQuery" + (c3 + Math.random()).replace(/\D/g, ""),
        isReady: true,
        error: function(a) {
            throw new Error(a)
        },
        noop: function() {},
        isFunction: function(a) {
            return dY.type(a) === "function"
        },
        isArray: Array.isArray || function(a) {
            return dY.type(a) === "array"
        }
        ,
        isWindow: function(a) {
            return a != null  && a == a.window
        },
        isNumeric: function(a) {
            return !dY.isArray(a) && (a - parseFloat(a) + 1) >= 0
        },
        isEmptyObject: function(a) {
            var b;
            for (b in a) {
                return false
            }
            return true
        },
        isPlainObject: function(b) {
            var a;
            if (!b || dY.type(b) !== "object" || b.nodeType || dY.isWindow(b)) {
                return false
            }
            try {
                if (b.constructor && !b5.call(b, "constructor") && !b5.call(b.constructor.prototype, "isPrototypeOf")) {
                    return false
                }
            } catch (c) {
                return false
            }
            if (db.ownLast) {
                for (a in b) {
                    return b5.call(b, a)
                }
            }
            for (a in b) {}
            return a === undefined || b5.call(b, a)
        },
        type: function(a) {
            if (a == null ) {
                return a + ""
            }
            return typeof a === "object" || typeof a === "function" ? cn[c9.call(a)] || "object" : typeof a
        },
        globalEval: function(a) {
            if (a && dY.trim(a)) {
                (ed.execScript || function(b) {
                        ed["eval"].call(ed, b)
                    }
                )(a)
            }
        },
        camelCase: function(a) {
            return a.replace(c0, "ms-").replace(eJ, ez)
        },
        nodeName: function(a, b) {
            return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase()
        },
        each: function(f, a, h) {
            var b, g = 0, d = f.length, c = du(f);
            if (h) {
                if (c) {
                    for (; g < d; g++) {
                        b = a.apply(f[g], h);
                        if (b === false) {
                            break
                        }
                    }
                } else {
                    for (g in f) {
                        b = a.apply(f[g], h);
                        if (b === false) {
                            break
                        }
                    }
                }
            } else {
                if (c) {
                    for (; g < d; g++) {
                        b = a.call(f[g], g, f[g]);
                        if (b === false) {
                            break
                        }
                    }
                } else {
                    for (g in f) {
                        b = a.call(f[g], g, f[g]);
                        if (b === false) {
                            break
                        }
                    }
                }
            }
            return f
        },
        trim: function(a) {
            return a == null  ? "" : (a + "").replace(ce, "")
        },
        makeArray: function(b, c) {
            var a = c || [];
            if (b != null ) {
                if (du(Object(b))) {
                    dY.merge(a, typeof b === "string" ? [b] : b)
                } else {
                    c7.call(a, b)
                }
            }
            return a
        },
        inArray: function(b, d, c) {
            var a;
            if (d) {
                if (dt) {
                    return dt.call(d, b, c)
                }
                a = d.length;
                c = c ? c < 0 ? Math.max(0, a + c) : c : 0;
                for (; c < a; c++) {
                    if (c in d && d[c] === b) {
                        return c
                    }
                }
            }
            return -1
        },
        merge: function(a, d) {
            var c = +d.length
                , f = 0
                , b = a.length;
            while (f < c) {
                a[b++] = d[f++]
            }
            if (c !== c) {
                while (d[f] !== undefined) {
                    a[b++] = d[f++]
                }
            }
            a.length = b;
            return a
        },
        grep: function(g, f, a) {
            var d, c = [], j = 0, h = g.length, b = !a;
            for (; j < h; j++) {
                d = !f(g[j], j);
                if (d !== b) {
                    c.push(g[j])
                }
            }
            return c
        },
        map: function(h, g, f) {
            var d, a = 0, b = h.length, j = du(h), c = [];
            if (j) {
                for (; a < b; a++) {
                    d = g(h[a], a, f);
                    if (d != null ) {
                        c.push(d)
                    }
                }
            } else {
                for (a in h) {
                    d = g(h[a], a, f);
                    if (d != null ) {
                        c.push(d)
                    }
                }
            }
            return cY.apply([], c)
        },
        guid: 1,
        proxy: function(c, d) {
            var b, f, a;
            if (typeof d === "string") {
                a = c[d];
                d = c;
                c = a
            }
            if (!dY.isFunction(c)) {
                return undefined
            }
            b = cX.call(arguments, 2);
            f = function() {
                return c.apply(d || this, b.concat(cX.call(arguments)))
            }
            ;
            f.guid = c.guid = c.guid || dY.guid++;
            return f
        },
        now: function() {
            return +(new Date())
        },
        support: db
    });
    dY.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(b, a) {
        cn["[object " + a + "]"] = a.toLowerCase()
    });
    function du(c) {
        var a = "length" in c && c.length
            , b = dY.type(c);
        if (b === "function" || dY.isWindow(c)) {
            return false
        }
        if (c.nodeType === 1 && a) {
            return true
        }
        return b === "array" || a === 0 || typeof a === "number" && a > 0 && (a - 1) in c
    }
    var dv =
        /*!
         * Sizzle CSS Selector Engine v2.2.0-pre
         * http://sizzlejs.com/
         *
         * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
         * Released under the MIT license
         * http://jquery.org/license
         *
         * Date: 2014-12-16
         */
        (function(ax) {
            var z, az, a, m, l, U, an, aA, x, am, k, ap, ay, ae, ab, V, C, R, I, aw = "sizzle" + 1 * new Date(), aq = ax.document, K = 0, ac = 0, c = H(), F = H(), G = H(), A = function(aE, aF) {
                    if (aE === aF) {
                        k = true
                    }
                    return 0
                }
                , q = 1 << 31, r = ({}).hasOwnProperty, aB = [], N = aB.pop, u = aB.push, aj = aB.push, T = aB.slice, n = function(aH, aE) {
                    var aF = 0
                        , aG = aH.length;
                    for (; aF < aG; aF++) {
                        if (aH[aF] === aE) {
                            return aF
                        }
                    }
                    return -1
                }
                , d = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", ah = "[\\x20\\t\\r\\n\\f]", al = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", j = al.replace("w", "w#"), Q = "\\[" + ah + "*(" + al + ")(?:" + ah + "*([*^$|!~]?=)" + ah + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + j + "))|)" + ah + "*\\]", ak = ":(" + al + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + Q + ")*)|.*)\\)|)", aC = new RegExp(ah + "+","g"), O = new RegExp("^" + ah + "+|((?:^|[^\\\\])(?:\\\\.)*)" + ah + "+$","g"), J = new RegExp("^" + ah + "*," + ah + "*"), D = new RegExp("^" + ah + "*([>+~]|" + ah + ")" + ah + "*"), aD = new RegExp("=" + ah + "*([^\\]'\"]*?)" + ah + "*\\]","g"), h = new RegExp(ak), s = new RegExp("^" + j + "$"), Y = {
                    ID: new RegExp("^#(" + al + ")"),
                    CLASS: new RegExp("^\\.(" + al + ")"),
                    TAG: new RegExp("^(" + al.replace("w", "w*") + ")"),
                    ATTR: new RegExp("^" + Q),
                    PSEUDO: new RegExp("^" + ak),
                    CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + ah + "*(even|odd|(([+-]|)(\\d*)n|)" + ah + "*(?:([+-]|)" + ah + "*(\\d+)|))" + ah + "*\\)|)","i"),
                    bool: new RegExp("^(?:" + d + ")$","i"),
                    needsContext: new RegExp("^" + ah + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + ah + "*((?:-\\d)?\\d*)" + ah + "*\\)|)(?=[^-]|$)","i")
                }, p = /^(?:input|select|textarea|button)$/i, aa = /^h\d$/i, w = /^[^{]+\{\s*\[native \w/, at = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, Z = /[+~]/, t = /'|\\/g, M = new RegExp("\\\\([\\da-f]{1,6}" + ah + "?|(" + ah + ")|.)","ig"), W = function(aH, aE, aG) {
                    var aF = "0x" + aE - 65536;
                    return aF !== aF || aG ? aE : aF < 0 ? String.fromCharCode(aF + 65536) : String.fromCharCode(aF >> 10 | 55296, aF & 1023 | 56320)
                }
                , y = function() {
                    ap()
                }
                ;
            try {
                aj.apply((aB = T.call(aq.childNodes)), aq.childNodes);
                aB[aq.childNodes.length].nodeType
            } catch (E) {
                aj = {
                    apply: aB.length ? function(aE, aF) {
                        u.apply(aE, T.call(aF))
                    }
                        : function(aH, aE) {
                        var aG = aH.length
                            , aF = 0;
                        while ((aH[aG++] = aE[aF++]) ) {}
                        aH.length = aG - 1
                    }
                }
            }
            function S(aS, aL, aO, aJ) {
                var aN, aG, aF, aQ, aP, aH, aI, aM, aK, aR;
                if ((aL ? aL.ownerDocument || aL : aq) !== ay) {
                    ap(aL)
                }
                aL = aL || ay;
                aO = aO || [];
                aQ = aL.nodeType;
                if (typeof aS !== "string" || !aS || aQ !== 1 && aQ !== 9 && aQ !== 11) {
                    return aO
                }
                if (!aJ && ab) {
                    if (aQ !== 11 && (aN = at.exec(aS))) {
                        if ((aF = aN[1]) ) {
                            if (aQ === 9) {
                                aG = aL.getElementById(aF);
                                if (aG && aG.parentNode) {
                                    if (aG.id === aF) {
                                        aO.push(aG);
                                        return aO
                                    }
                                } else {
                                    return aO
                                }
                            } else {
                                if (aL.ownerDocument && (aG = aL.ownerDocument.getElementById(aF)) && I(aL, aG) && aG.id === aF) {
                                    aO.push(aG);
                                    return aO
                                }
                            }
                        } else {
                            if (aN[2]) {
                                aj.apply(aO, aL.getElementsByTagName(aS));
                                return aO
                            } else {
                                if ((aF = aN[3]) && az.getElementsByClassName) {
                                    aj.apply(aO, aL.getElementsByClassName(aF));
                                    return aO
                                }
                            }
                        }
                    }
                    if (az.qsa && (!V || !V.test(aS))) {
                        aM = aI = aw;
                        aK = aL;
                        aR = aQ !== 1 && aS;
                        if (aQ === 1 && aL.nodeName.toLowerCase() !== "object") {
                            aH = U(aS);
                            if ((aI = aL.getAttribute("id")) ) {
                                aM = aI.replace(t, "\\$&")
                            } else {
                                aL.setAttribute("id", aM)
                            }
                            aM = "[id='" + aM + "'] ";
                            aP = aH.length;
                            while (aP--) {
                                aH[aP] = aM + ad(aH[aP])
                            }
                            aK = Z.test(aS) && f(aL.parentNode) || aL;
                            aR = aH.join(",")
                        }
                        if (aR) {
                            try {
                                aj.apply(aO, aK.querySelectorAll(aR));
                                return aO
                            } catch (aE) {} finally {
                                if (!aI) {
                                    aL.removeAttribute("id")
                                }
                            }
                        }
                    }
                }
                return aA(aS.replace(O, "$1"), aL, aO, aJ)
            }
            function H() {
                var aE = [];
                function aF(aH, aG) {
                    if (aE.push(aH + " ") > a.cacheLength) {
                        delete aF[aE.shift()]
                    }
                    return ( aF[aH + " "] = aG)
                }
                return aF
            }
            function b(aE) {
                aE[aw] = true;
                return aE
            }
            function P(aG) {
                var aE = ay.createElement("div");
                try {
                    return !!aG(aE)
                } catch (aF) {
                    return false
                } finally {
                    if (aE.parentNode) {
                        aE.parentNode.removeChild(aE)
                    }
                    aE = null
                }
            }
            function au(aF, aH) {
                var aG = aF.split("|")
                    , aE = aF.length;
                while (aE--) {
                    a.attrHandle[aG[aE]] = aH
                }
            }
            function ag(aG, aH) {
                var aE = aH && aG
                    , aF = aE && aG.nodeType === 1 && aH.nodeType === 1 && (~aH.sourceIndex || q) - (~aG.sourceIndex || q);
                if (aF) {
                    return aF
                }
                if (aE) {
                    while ((aE = aE.nextSibling) ) {
                        if (aE === aH) {
                            return -1
                        }
                    }
                }
                return aG ? 1 : -1
            }
            function B(aE) {
                return function(aF) {
                    var aG = aF.nodeName.toLowerCase();
                    return aG === "input" && aF.type === aE
                }
            }
            function g(aE) {
                return function(aF) {
                    var aG = aF.nodeName.toLowerCase();
                    return (aG === "input" || aG === "button") && aF.type === aE
                }
            }
            function af(aE) {
                return b(function(aF) {
                    aF = +aF;
                    return b(function(aH, aI) {
                        var aK, aG = aE([], aH.length, aF), aJ = aG.length;
                        while (aJ--) {
                            if (aH[(aK = aG[aJ])]) {
                                aH[aK] = !(aI[aK] = aH[aK])
                            }
                        }
                    })
                })
            }
            function f(aE) {
                return aE && typeof aE.getElementsByTagName !== "undefined" && aE
            }
            az = S.support = {};
            l = S.isXML = function(aF) {
                var aE = aF && (aF.ownerDocument || aF).documentElement;
                return aE ? aE.nodeName !== "HTML" : false
            }
            ;
            ap = S.setDocument = function(aF) {
                var aH, aG, aE = aF ? aF.ownerDocument || aF : aq;
                if (aE === ay || aE.nodeType !== 9 || !aE.documentElement) {
                    return ay
                }
                ay = aE;
                ae = aE.documentElement;
                aG = aE.defaultView;
                if (aG && aG !== aG.top) {
                    if (aG.addEventListener) {
                        aG.addEventListener("unload", y, false)
                    } else {
                        if (aG.attachEvent) {
                            aG.attachEvent("onunload", y)
                        }
                    }
                }
                ab = !l(aE);
                az.attributes = P(function(aI) {
                    aI.className = "i";
                    return !aI.getAttribute("className")
                });
                az.getElementsByTagName = P(function(aI) {
                    aI.appendChild(aE.createComment(""));
                    return !aI.getElementsByTagName("*").length
                });
                az.getElementsByClassName = w.test(aE.getElementsByClassName);
                az.getById = P(function(aI) {
                    ae.appendChild(aI).id = aw;
                    return !aE.getElementsByName || !aE.getElementsByName(aw).length
                });
                if (az.getById) {
                    a.find.ID = function(aI, aJ) {
                        if (typeof aJ.getElementById !== "undefined" && ab) {
                            var aK = aJ.getElementById(aI);
                            return aK && aK.parentNode ? [aK] : []
                        }
                    }
                    ;
                    a.filter.ID = function(aI) {
                        var aJ = aI.replace(M, W);
                        return function(aK) {
                            return aK.getAttribute("id") === aJ
                        }
                    }
                } else {
                    delete a.find.ID;
                    a.filter.ID = function(aI) {
                        var aJ = aI.replace(M, W);
                        return function(aK) {
                            var aL = typeof aK.getAttributeNode !== "undefined" && aK.getAttributeNode("id");
                            return aL && aL.value === aJ
                        }
                    }
                }
                a.find.TAG = az.getElementsByTagName ? function(aJ, aI) {
                    if (typeof aI.getElementsByTagName !== "undefined") {
                        return aI.getElementsByTagName(aJ)
                    } else {
                        if (az.qsa) {
                            return aI.querySelectorAll(aJ)
                        }
                    }
                }
                    : function(aN, aJ) {
                    var aI, aK = [], aL = 0, aM = aJ.getElementsByTagName(aN);
                    if (aN === "*") {
                        while ((aI = aM[aL++]) ) {
                            if (aI.nodeType === 1) {
                                aK.push(aI)
                            }
                        }
                        return aK
                    }
                    return aM
                }
                ;
                a.find.CLASS = az.getElementsByClassName && function(aI, aJ) {
                        if (ab) {
                            return aJ.getElementsByClassName(aI)
                        }
                    }
                ;
                C = [];
                V = [];
                if ((az.qsa = w.test(aE.querySelectorAll)) ) {
                    P(function(aI) {
                        ae.appendChild(aI).innerHTML = "<a id='" + aw + "'></a><select id='" + aw + "-\f]' msallowcapture=''><option selected=''></option></select>";
                        if (aI.querySelectorAll("[msallowcapture^='']").length) {
                            V.push("[*^$]=" + ah + "*(?:''|\"\")")
                        }
                        if (!aI.querySelectorAll("[selected]").length) {
                            V.push("\\[" + ah + "*(?:value|" + d + ")")
                        }
                        if (!aI.querySelectorAll("[id~=" + aw + "-]").length) {
                            V.push("~=")
                        }
                        if (!aI.querySelectorAll(":checked").length) {
                            V.push(":checked")
                        }
                        if (!aI.querySelectorAll("a#" + aw + "+*").length) {
                            V.push(".#.+[+~]")
                        }
                    });
                    P(function(aI) {
                        var aJ = aE.createElement("input");
                        aJ.setAttribute("type", "hidden");
                        aI.appendChild(aJ).setAttribute("name", "D");
                        if (aI.querySelectorAll("[name=d]").length) {
                            V.push("name" + ah + "*[*^$|!~]?=")
                        }
                        if (!aI.querySelectorAll(":enabled").length) {
                            V.push(":enabled", ":disabled")
                        }
                        aI.querySelectorAll("*,:x");
                        V.push(",.*:")
                    })
                }
                if ((az.matchesSelector = w.test((R = ae.matches || ae.webkitMatchesSelector || ae.mozMatchesSelector || ae.oMatchesSelector || ae.msMatchesSelector))) ) {
                    P(function(aI) {
                        az.disconnectedMatch = R.call(aI, "div");
                        R.call(aI, "[s!='']:x");
                        C.push("!=", ak)
                    })
                }
                V = V.length && new RegExp(V.join("|"));
                C = C.length && new RegExp(C.join("|"));
                aH = w.test(ae.compareDocumentPosition);
                I = aH || w.test(ae.contains) ? function(aK, aL) {
                    var aI = aK.nodeType === 9 ? aK.documentElement : aK
                        , aJ = aL && aL.parentNode;
                    return aK === aJ || !!(aJ && aJ.nodeType === 1 && (aI.contains ? aI.contains(aJ) : aK.compareDocumentPosition && aK.compareDocumentPosition(aJ) & 16))
                }
                    : function(aI, aJ) {
                    if (aJ) {
                        while ((aJ = aJ.parentNode) ) {
                            if (aJ === aI) {
                                return true
                            }
                        }
                    }
                    return false
                }
                ;
                A = aH ? function(aJ, aK) {
                    if (aJ === aK) {
                        k = true;
                        return 0
                    }
                    var aI = !aJ.compareDocumentPosition - !aK.compareDocumentPosition;
                    if (aI) {
                        return aI
                    }
                    aI = (aJ.ownerDocument || aJ) === (aK.ownerDocument || aK) ? aJ.compareDocumentPosition(aK) : 1;
                    if (aI & 1 || (!az.sortDetached && aK.compareDocumentPosition(aJ) === aI)) {
                        if (aJ === aE || aJ.ownerDocument === aq && I(aq, aJ)) {
                            return -1
                        }
                        if (aK === aE || aK.ownerDocument === aq && I(aq, aK)) {
                            return 1
                        }
                        return am ? (n(am, aJ) - n(am, aK)) : 0
                    }
                    return aI & 4 ? -1 : 1
                }
                    : function(aO, aP) {
                    if (aO === aP) {
                        k = true;
                        return 0
                    }
                    var aI, aL = 0, aJ = aO.parentNode, aM = aP.parentNode, aN = [aO], aK = [aP];
                    if (!aJ || !aM) {
                        return aO === aE ? -1 : aP === aE ? 1 : aJ ? -1 : aM ? 1 : am ? (n(am, aO) - n(am, aP)) : 0
                    } else {
                        if (aJ === aM) {
                            return ag(aO, aP)
                        }
                    }
                    aI = aO;
                    while ((aI = aI.parentNode) ) {
                        aN.unshift(aI)
                    }
                    aI = aP;
                    while ((aI = aI.parentNode) ) {
                        aK.unshift(aI)
                    }
                    while (aN[aL] === aK[aL]) {
                        aL++
                    }
                    return aL ? ag(aN[aL], aK[aL]) : aN[aL] === aq ? -1 : aK[aL] === aq ? 1 : 0
                }
                ;
                return aE
            }
            ;
            S.matches = function(aE, aF) {
                return S(aE, null , null , aF)
            }
            ;
            S.matchesSelector = function(aF, aH) {
                if ((aF.ownerDocument || aF) !== ay) {
                    ap(aF)
                }
                aH = aH.replace(aD, "='$1']");
                if (az.matchesSelector && ab && (!C || !C.test(aH)) && (!V || !V.test(aH))) {
                    try {
                        var aG = R.call(aF, aH);
                        if (aG || az.disconnectedMatch || aF.document && aF.document.nodeType !== 11) {
                            return aG
                        }
                    } catch (aE) {}
                }
                return S(aH, ay, null , [aF]).length > 0
            }
            ;
            S.contains = function(aF, aE) {
                if ((aF.ownerDocument || aF) !== ay) {
                    ap(aF)
                }
                return I(aF, aE)
            }
            ;
            S.attr = function(aF, aH) {
                if ((aF.ownerDocument || aF) !== ay) {
                    ap(aF)
                }
                var aG = a.attrHandle[aH.toLowerCase()]
                    , aE = aG && r.call(a.attrHandle, aH.toLowerCase()) ? aG(aF, aH, !ab) : undefined;
                return aE !== undefined ? aE : az.attributes || !ab ? aF.getAttribute(aH) : (aE = aF.getAttributeNode(aH)) && aE.specified ? aE.value : null
            }
            ;
            S.error = function(aE) {
                throw new Error("Syntax error, unrecognized expression: " + aE)
            }
            ;
            S.uniqueSort = function(aE) {
                var aI, aH = [], aG = 0, aF = 0;
                k = !az.detectDuplicates;
                am = !az.sortStable && aE.slice(0);
                aE.sort(A);
                if (k) {
                    while ((aI = aE[aF++]) ) {
                        if (aI === aE[aF]) {
                            aG = aH.push(aF)
                        }
                    }
                    while (aG--) {
                        aE.splice(aH[aG], 1)
                    }
                }
                am = null ;
                return aE
            }
            ;
            m = S.getText = function(aH) {
                var aI, aF = "", aE = 0, aG = aH.nodeType;
                if (!aG) {
                    while ((aI = aH[aE++]) ) {
                        aF += m(aI)
                    }
                } else {
                    if (aG === 1 || aG === 9 || aG === 11) {
                        if (typeof aH.textContent === "string") {
                            return aH.textContent
                        } else {
                            for (aH = aH.firstChild; aH; aH = aH.nextSibling) {
                                aF += m(aH)
                            }
                        }
                    } else {
                        if (aG === 3 || aG === 4) {
                            return aH.nodeValue
                        }
                    }
                }
                return aF
            }
            ;
            a = S.selectors = {
                cacheLength: 50,
                createPseudo: b,
                match: Y,
                attrHandle: {},
                find: {},
                relative: {
                    ">": {
                        dir: "parentNode",
                        first: true
                    },
                    " ": {
                        dir: "parentNode"
                    },
                    "+": {
                        dir: "previousSibling",
                        first: true
                    },
                    "~": {
                        dir: "previousSibling"
                    }
                },
                preFilter: {
                    ATTR: function(aE) {
                        aE[1] = aE[1].replace(M, W);
                        aE[3] = (aE[3] || aE[4] || aE[5] || "").replace(M, W);
                        if (aE[2] === "~=") {
                            aE[3] = " " + aE[3] + " "
                        }
                        return aE.slice(0, 4)
                    },
                    CHILD: function(aE) {
                        aE[1] = aE[1].toLowerCase();
                        if (aE[1].slice(0, 3) === "nth") {
                            if (!aE[3]) {
                                S.error(aE[0])
                            }
                            aE[4] = +(aE[4] ? aE[5] + (aE[6] || 1) : 2 * (aE[3] === "even" || aE[3] === "odd"));
                            aE[5] = +((aE[7] + aE[8]) || aE[3] === "odd")
                        } else {
                            if (aE[3]) {
                                S.error(aE[0])
                            }
                        }
                        return aE
                    },
                    PSEUDO: function(aF) {
                        var aG, aE = !aF[6] && aF[2];
                        if (Y.CHILD.test(aF[0])) {
                            return null
                        }
                        if (aF[3]) {
                            aF[2] = aF[4] || aF[5] || ""
                        } else {
                            if (aE && h.test(aE) && (aG = U(aE, true)) && (aG = aE.indexOf(")", aE.length - aG) - aE.length)) {
                                aF[0] = aF[0].slice(0, aG);
                                aF[2] = aE.slice(0, aG)
                            }
                        }
                        return aF.slice(0, 3)
                    }
                },
                filter: {
                    TAG: function(aE) {
                        var aF = aE.replace(M, W).toLowerCase();
                        return aE === "*" ? function() {
                            return true
                        }
                            : function(aG) {
                            return aG.nodeName && aG.nodeName.toLowerCase() === aF
                        }
                    },
                    CLASS: function(aF) {
                        var aE = c[aF + " "];
                        return aE || (aE = new RegExp("(^|" + ah + ")" + aF + "(" + ah + "|$)")) && c(aF, function(aG) {
                                return aE.test(typeof aG.className === "string" && aG.className || typeof aG.getAttribute !== "undefined" && aG.getAttribute("class") || "")
                            })
                    },
                    ATTR: function(aE, aF, aG) {
                        return function(aI) {
                            var aH = S.attr(aI, aE);
                            if (aH == null ) {
                                return aF === "!="
                            }
                            if (!aF) {
                                return true
                            }
                            aH += "";
                            return aF === "=" ? aH === aG : aF === "!=" ? aH !== aG : aF === "^=" ? aG && aH.indexOf(aG) === 0 : aF === "*=" ? aG && aH.indexOf(aG) > -1 : aF === "$=" ? aG && aH.slice(-aG.length) === aG : aF === "~=" ? (" " + aH.replace(aC, " ") + " ").indexOf(aG) > -1 : aF === "|=" ? aH === aG || aH.slice(0, aG.length + 1) === aG + "-" : false
                        }
                    },
                    CHILD: function(aG, aL, aE, aK, aF) {
                        var aH = aG.slice(0, 3) !== "nth"
                            , aJ = aG.slice(-4) !== "last"
                            , aI = aL === "of-type";
                        return aK === 1 && aF === 0 ? function(aM) {
                            return !!aM.parentNode
                        }
                            : function(aX, aQ, aV) {
                            var aU, aR, aW, aS, aY, aN, aM = aH !== aJ ? "nextSibling" : "previousSibling", aT = aX.parentNode, aO = aI && aX.nodeName.toLowerCase(), aP = !aV && !aI;
                            if (aT) {
                                if (aH) {
                                    while (aM) {
                                        aW = aX;
                                        while ((aW = aW[aM]) ) {
                                            if (aI ? aW.nodeName.toLowerCase() === aO : aW.nodeType === 1) {
                                                return false
                                            }
                                        }
                                        aN = aM = aG === "only" && !aN && "nextSibling"
                                    }
                                    return true
                                }
                                aN = [aJ ? aT.firstChild : aT.lastChild];
                                if (aJ && aP) {
                                    aR = aT[aw] || (aT[aw] = {});
                                    aU = aR[aG] || [];
                                    aY = aU[0] === K && aU[1];
                                    aS = aU[0] === K && aU[2];
                                    aW = aY && aT.childNodes[aY];
                                    while ((aW = ++aY && aW && aW[aM] || (aS = aY = 0) || aN.pop()) ) {
                                        if (aW.nodeType === 1 && ++aS && aW === aX) {
                                            aR[aG] = [K, aY, aS];
                                            break
                                        }
                                    }
                                } else {
                                    if (aP && (aU = (aX[aw] || (aX[aw] = {}))[aG]) && aU[0] === K) {
                                        aS = aU[1]
                                    } else {
                                        while ((aW = ++aY && aW && aW[aM] || (aS = aY = 0) || aN.pop()) ) {
                                            if ((aI ? aW.nodeName.toLowerCase() === aO : aW.nodeType === 1) && ++aS) {
                                                if (aP) {
                                                    (aW[aw] || (aW[aw] = {}))[aG] = [K, aS]
                                                }
                                                if (aW === aX) {
                                                    break
                                                }
                                            }
                                        }
                                    }
                                }
                                aS -= aF;
                                return aS === aK || (aS % aK === 0 && aS / aK >= 0)
                            }
                        }
                    },
                    PSEUDO: function(aE, aF) {
                        var aH, aG = a.pseudos[aE] || a.setFilters[aE.toLowerCase()] || S.error("unsupported pseudo: " + aE);
                        if (aG[aw]) {
                            return aG(aF)
                        }
                        if (aG.length > 1) {
                            aH = [aE, aE, "", aF];
                            return a.setFilters.hasOwnProperty(aE.toLowerCase()) ? b(function(aK, aI) {
                                var aL, aM = aG(aK, aF), aJ = aM.length;
                                while (aJ--) {
                                    aL = n(aK, aM[aJ]);
                                    aK[aL] = !(aI[aL] = aM[aJ])
                                }
                            }) : function(aI) {
                                return aG(aI, 0, aH)
                            }
                        }
                        return aG
                    }
                },
                pseudos: {
                    not: b(function(aH) {
                        var aG = []
                            , aF = []
                            , aE = an(aH.replace(O, "$1"));
                        return aE[aw] ? b(function(aN, aI, aK, aM) {
                            var aJ, aO = aE(aN, null , aM, []), aL = aN.length;
                            while (aL--) {
                                if ((aJ = aO[aL]) ) {
                                    aN[aL] = !(aI[aL] = aJ)
                                }
                            }
                        }) : function(aI, aJ, aK) {
                            aG[0] = aI;
                            aE(aG, null , aK, aF);
                            aG[0] = null ;
                            return !aF.pop()
                        }
                    }),
                    has: b(function(aE) {
                        return function(aF) {
                            return S(aE, aF).length > 0
                        }
                    }),
                    contains: b(function(aE) {
                        aE = aE.replace(M, W);
                        return function(aF) {
                            return (aF.textContent || aF.innerText || m(aF)).indexOf(aE) > -1
                        }
                    }),
                    lang: b(function(aE) {
                        if (!s.test(aE || "")) {
                            S.error("unsupported lang: " + aE)
                        }
                        aE = aE.replace(M, W).toLowerCase();
                        return function(aF) {
                            var aG;
                            do {
                                if ((aG = ab ? aF.lang : aF.getAttribute("xml:lang") || aF.getAttribute("lang")) ) {
                                    aG = aG.toLowerCase();
                                    return aG === aE || aG.indexOf(aE + "-") === 0
                                }
                            } while ((aF = aF.parentNode) && aF.nodeType === 1);return false
                        }
                    }),
                    target: function(aF) {
                        var aE = ax.location && ax.location.hash;
                        return aE && aE.slice(1) === aF.id
                    },
                    root: function(aE) {
                        return aE === ae
                    },
                    focus: function(aE) {
                        return aE === ay.activeElement && (!ay.hasFocus || ay.hasFocus()) && !!(aE.type || aE.href || ~aE.tabIndex)
                    },
                    enabled: function(aE) {
                        return aE.disabled === false
                    },
                    disabled: function(aE) {
                        return aE.disabled === true
                    },
                    checked: function(aF) {
                        var aE = aF.nodeName.toLowerCase();
                        return (aE === "input" && !!aF.checked) || (aE === "option" && !!aF.selected)
                    },
                    selected: function(aE) {
                        if (aE.parentNode) {
                            aE.parentNode.selectedIndex
                        }
                        return aE.selected === true
                    },
                    empty: function(aE) {
                        for (aE = aE.firstChild; aE; aE = aE.nextSibling) {
                            if (aE.nodeType < 6) {
                                return false
                            }
                        }
                        return true
                    },
                    parent: function(aE) {
                        return !a.pseudos.empty(aE)
                    },
                    header: function(aE) {
                        return aa.test(aE.nodeName)
                    },
                    input: function(aE) {
                        return p.test(aE.nodeName)
                    },
                    button: function(aE) {
                        var aF = aE.nodeName.toLowerCase();
                        return aF === "input" && aE.type === "button" || aF === "button"
                    },
                    text: function(aE) {
                        var aF;
                        return aE.nodeName.toLowerCase() === "input" && aE.type === "text" && ((aF = aE.getAttribute("type")) == null  || aF.toLowerCase() === "text")
                    },
                    first: af(function() {
                        return [0]
                    }),
                    last: af(function(aF, aE) {
                        return [aE - 1]
                    }),
                    eq: af(function(aG, aE, aF) {
                        return [aF < 0 ? aF + aE : aF]
                    }),
                    even: af(function(aG, aE) {
                        var aF = 0;
                        for (; aF < aE; aF += 2) {
                            aG.push(aF)
                        }
                        return aG
                    }),
                    odd: af(function(aG, aE) {
                        var aF = 1;
                        for (; aF < aE; aF += 2) {
                            aG.push(aF)
                        }
                        return aG
                    }),
                    lt: af(function(aG, aH, aE) {
                        var aF = aE < 0 ? aE + aH : aE;
                        for (; --aF >= 0; ) {
                            aG.push(aF)
                        }
                        return aG
                    }),
                    gt: af(function(aG, aH, aE) {
                        var aF = aE < 0 ? aE + aH : aE;
                        for (; ++aF < aH; ) {
                            aG.push(aF)
                        }
                        return aG
                    })
                }
            };
            a.pseudos.nth = a.pseudos.eq;
            for (z in {
                radio: true,
                checkbox: true,
                file: true,
                password: true,
                image: true
            }) {
                a.pseudos[z] = B(z)
            }
            for (z in {
                submit: true,
                reset: true
            }) {
                a.pseudos[z] = g(z)
            }
            function o() {}
            o.prototype = a.filters = a.pseudos;
            a.setFilters = new o();
            U = S.tokenize = function(aH, aM) {
                var aJ, aG, aE, aN, aF, aK, aL, aI = F[aH + " "];
                if (aI) {
                    return aM ? 0 : aI.slice(0)
                }
                aF = aH;
                aK = [];
                aL = a.preFilter;
                while (aF) {
                    if (!aJ || (aG = J.exec(aF))) {
                        if (aG) {
                            aF = aF.slice(aG[0].length) || aF
                        }
                        aK.push((aE = []))
                    }
                    aJ = false;
                    if ((aG = D.exec(aF)) ) {
                        aJ = aG.shift();
                        aE.push({
                            value: aJ,
                            type: aG[0].replace(O, " ")
                        });
                        aF = aF.slice(aJ.length)
                    }
                    for (aN in a.filter) {
                        if ((aG = Y[aN].exec(aF)) && (!aL[aN] || (aG = aL[aN](aG)))) {
                            aJ = aG.shift();
                            aE.push({
                                value: aJ,
                                type: aN,
                                matches: aG
                            });
                            aF = aF.slice(aJ.length)
                        }
                    }
                    if (!aJ) {
                        break
                    }
                }
                return aM ? aF.length : aF ? S.error(aH) : F(aH, aK).slice(0)
            }
            ;
            function ad(aH) {
                var aE = 0
                    , aF = aH.length
                    , aG = "";
                for (; aE < aF; aE++) {
                    aG += aH[aE].value
                }
                return aG
            }
            function X(aJ, aF, aE) {
                var aH = aF.dir
                    , aI = aE && aH === "parentNode"
                    , aG = ac++;
                return aF.first ? function(aK, aL, aM) {
                    while ((aK = aK[aH]) ) {
                        if (aK.nodeType === 1 || aI) {
                            return aJ(aK, aL, aM)
                        }
                    }
                }
                    : function(aL, aN, aO) {
                    var aK, aM, aP = [K, aG];
                    if (aO) {
                        while ((aL = aL[aH]) ) {
                            if (aL.nodeType === 1 || aI) {
                                if (aJ(aL, aN, aO)) {
                                    return true
                                }
                            }
                        }
                    } else {
                        while ((aL = aL[aH]) ) {
                            if (aL.nodeType === 1 || aI) {
                                aM = aL[aw] || (aL[aw] = {});
                                if ((aK = aM[aH]) && aK[0] === K && aK[1] === aG) {
                                    return ( aP[2] = aK[2])
                                } else {
                                    aM[aH] = aP;
                                    if ((aP[2] = aJ(aL, aN, aO)) ) {
                                        return true
                                    }
                                }
                            }
                        }
                    }
                }
            }
            function ar(aE) {
                return aE.length > 1 ? function(aH, aI, aG) {
                    var aF = aE.length;
                    while (aF--) {
                        if (!aE[aF](aH, aI, aG)) {
                            return false
                        }
                    }
                    return true
                }
                    : aE[0]
            }
            function L(aF, aH, aI) {
                var aE = 0
                    , aG = aH.length;
                for (; aE < aG; aE++) {
                    S(aF, aH[aE], aI)
                }
                return aI
            }
            function ao(aL, aK, aJ, aI, aF) {
                var aH, aM = [], aG = 0, aE = aL.length, aN = aK != null ;
                for (; aG < aE; aG++) {
                    if ((aH = aL[aG]) ) {
                        if (!aJ || aJ(aH, aI, aF)) {
                            aM.push(aH);
                            if (aN) {
                                aK.push(aG)
                            }
                        }
                    }
                }
                return aM
            }
            function ai(aF, aG, aJ, aE, aI, aH) {
                if (aE && !aE[aw]) {
                    aE = ai(aE)
                }
                if (aI && !aI[aw]) {
                    aI = ai(aI, aH)
                }
                return b(function(aU, aL, aP, aV) {
                    var aW, aK, aQ, aO = [], aT = [], aR = aL.length, aS = aU || L(aG || "*", aP.nodeType ? [aP] : aP, []), aN = aF && (aU || !aG) ? ao(aS, aO, aF, aP, aV) : aS, aM = aJ ? aI || (aU ? aF : aR || aE) ? [] : aL : aN;
                    if (aJ) {
                        aJ(aN, aM, aP, aV)
                    }
                    if (aE) {
                        aW = ao(aM, aT);
                        aE(aW, [], aP, aV);
                        aK = aW.length;
                        while (aK--) {
                            if ((aQ = aW[aK]) ) {
                                aM[aT[aK]] = !(aN[aT[aK]] = aQ)
                            }
                        }
                    }
                    if (aU) {
                        if (aI || aF) {
                            if (aI) {
                                aW = [];
                                aK = aM.length;
                                while (aK--) {
                                    if ((aQ = aM[aK]) ) {
                                        aW.push((aN[aK] = aQ))
                                    }
                                }
                                aI(null , (aM = []), aW, aV)
                            }
                            aK = aM.length;
                            while (aK--) {
                                if ((aQ = aM[aK]) && (aW = aI ? n(aU, aQ) : aO[aK]) > -1) {
                                    aU[aW] = !(aL[aW] = aQ)
                                }
                            }
                        }
                    } else {
                        aM = ao(aM === aL ? aM.splice(aR, aM.length) : aM);
                        if (aI) {
                            aI(null , aL, aM, aV)
                        } else {
                            aj.apply(aL, aM)
                        }
                    }
                })
            }
            function av(aK) {
                var aE, aM, aO, aL = aK.length, aH = a.relative[aK[0].type], aG = aH || a.relative[" "], aN = aH ? 1 : 0, aJ = X(function(aP) {
                    return aP === aE
                }, aG, true), aI = X(function(aP) {
                    return n(aE, aP) > -1
                }, aG, true), aF = [function(aP, aQ, aR) {
                    var aS = (!aH && (aR || aQ !== x)) || ((aE = aQ).nodeType ? aJ(aP, aQ, aR) : aI(aP, aQ, aR));
                    aE = null ;
                    return aS
                }
                ];
                for (; aN < aL; aN++) {
                    if ((aM = a.relative[aK[aN].type]) ) {
                        aF = [X(ar(aF), aM)]
                    } else {
                        aM = a.filter[aK[aN].type].apply(null , aK[aN].matches);
                        if (aM[aw]) {
                            aO = ++aN;
                            for (; aO < aL; aO++) {
                                if (a.relative[aK[aO].type]) {
                                    break
                                }
                            }
                            return ai(aN > 1 && ar(aF), aN > 1 && ad(aK.slice(0, aN - 1).concat({
                                    value: aK[aN - 2].type === " " ? "*" : ""
                                })).replace(O, "$1"), aM, aN < aO && av(aK.slice(aN, aO)), aO < aL && av((aK = aK.slice(aO))), aO < aL && ad(aK))
                        }
                        aF.push(aM)
                    }
                }
                return ar(aF)
            }
            function v(aE, aF) {
                var aH = aF.length > 0
                    , aI = aE.length > 0
                    , aG = function(aJ, aR, aN, aU, aV) {
                        var aT, aP, aL, aS = 0, aK = "0", aO = aJ && [], aX = [], aY = x, aQ = aJ || aI && a.find.TAG("*", aV), aM = (K += aY == null  ? 1 : Math.random() || 0.1), aW = aQ.length;
                        if (aV) {
                            x = aR !== ay && aR
                        }
                        for (; aK !== aW && (aT = aQ[aK]) != null ; aK++) {
                            if (aI && aT) {
                                aP = 0;
                                while ((aL = aE[aP++]) ) {
                                    if (aL(aT, aR, aN)) {
                                        aU.push(aT);
                                        break
                                    }
                                }
                                if (aV) {
                                    K = aM
                                }
                            }
                            if (aH) {
                                if ((aT = !aL && aT) ) {
                                    aS--
                                }
                                if (aJ) {
                                    aO.push(aT)
                                }
                            }
                        }
                        aS += aK;
                        if (aH && aK !== aS) {
                            aP = 0;
                            while ((aL = aF[aP++]) ) {
                                aL(aO, aX, aR, aN)
                            }
                            if (aJ) {
                                if (aS > 0) {
                                    while (aK--) {
                                        if (!(aO[aK] || aX[aK])) {
                                            aX[aK] = N.call(aU)
                                        }
                                    }
                                }
                                aX = ao(aX)
                            }
                            aj.apply(aU, aX);
                            if (aV && !aJ && aX.length > 0 && (aS + aF.length) > 1) {
                                S.uniqueSort(aU)
                            }
                        }
                        if (aV) {
                            K = aM;
                            x = aY
                        }
                        return aO
                    }
                    ;
                return aH ? b(aG) : aG
            }
            an = S.compile = function(aH, aE) {
                var aJ, aF = [], aG = [], aI = G[aH + " "];
                if (!aI) {
                    if (!aE) {
                        aE = U(aH)
                    }
                    aJ = aE.length;
                    while (aJ--) {
                        aI = av(aE[aJ]);
                        if (aI[aw]) {
                            aF.push(aI)
                        } else {
                            aG.push(aI)
                        }
                    }
                    aI = G(aH, v(aG, aF));
                    aI.selector = aH
                }
                return aI
            }
            ;
            aA = S.select = function(aO, aF, aN, aK) {
                var aM, aH, aE, aG, aJ, aI = typeof aO === "function" && aO, aL = !aK && U((aO = aI.selector || aO));
                aN = aN || [];
                if (aL.length === 1) {
                    aH = aL[0] = aL[0].slice(0);
                    if (aH.length > 2 && (aE = aH[0]).type === "ID" && az.getById && aF.nodeType === 9 && ab && a.relative[aH[1].type]) {
                        aF = (a.find.ID(aE.matches[0].replace(M, W), aF) || [])[0];
                        if (!aF) {
                            return aN
                        } else {
                            if (aI) {
                                aF = aF.parentNode
                            }
                        }
                        aO = aO.slice(aH.shift().value.length)
                    }
                    aM = Y.needsContext.test(aO) ? 0 : aH.length;
                    while (aM--) {
                        aE = aH[aM];
                        if (a.relative[(aG = aE.type)]) {
                            break
                        }
                        if ((aJ = a.find[aG]) ) {
                            if ((aK = aJ(aE.matches[0].replace(M, W), Z.test(aH[0].type) && f(aF.parentNode) || aF)) ) {
                                aH.splice(aM, 1);
                                aO = aK.length && ad(aH);
                                if (!aO) {
                                    aj.apply(aN, aK);
                                    return aN
                                }
                                break
                            }
                        }
                    }
                }
                (aI || an(aO, aL))(aK, aF, !ab, aN, Z.test(aO) && f(aF.parentNode) || aF);
                return aN
            }
            ;
            az.sortStable = aw.split("").sort(A).join("") === aw;
            az.detectDuplicates = !!k;
            ap();
            az.sortDetached = P(function(aE) {
                return aE.compareDocumentPosition(ay.createElement("div")) & 1
            });
            if (!P(function(aE) {
                    aE.innerHTML = "<a href='#'></a>";
                    return aE.firstChild.getAttribute("href") === "#"
                })) {
                au("type|href|height|width", function(aF, aG, aE) {
                    if (!aE) {
                        return aF.getAttribute(aG, aG.toLowerCase() === "type" ? 1 : 2)
                    }
                })
            }
            if (!az.attributes || !P(function(aE) {
                    aE.innerHTML = "<input/>";
                    aE.firstChild.setAttribute("value", "");
                    return aE.firstChild.getAttribute("value") === ""
                })) {
                au("value", function(aF, aG, aE) {
                    if (!aE && aF.nodeName.toLowerCase() === "input") {
                        return aF.defaultValue
                    }
                })
            }
            if (!P(function(aE) {
                    return aE.getAttribute("disabled") == null
                })) {
                au(d, function(aG, aH, aE) {
                    var aF;
                    if (!aE) {
                        return aG[aH] === true ? aH.toLowerCase() : (aF = aG.getAttributeNode(aH)) && aF.specified ? aF.value : null
                    }
                })
            }
            return S
        })(ed);
    dY.find = dv;
    dY.expr = dv.selectors;
    dY.expr[":"] = dY.expr.pseudos;
    dY.unique = dv.uniqueSort;
    dY.text = dv.getText;
    dY.isXMLDoc = dv.isXML;
    dY.contains = dv.contains;
    var dS = dY.expr.match.needsContext;
    var dr = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);
    var d8 = /^.[^:#\[\.,]*$/;
    function c4(c, b, a) {
        if (dY.isFunction(b)) {
            return dY.grep(c, function(d, f) {
                return !!b.call(d, f, d) !== a
            })
        }
        if (b.nodeType) {
            return dY.grep(c, function(d) {
                return (d === b) !== a
            })
        }
        if (typeof b === "string") {
            if (d8.test(b)) {
                return dY.filter(b, c, a)
            }
            b = dY.filter(b, c)
        }
        return dY.grep(c, function(d) {
            return (dY.inArray(d, b) >= 0) !== a
        })
    }
    dY.filter = function(c, b, d) {
        var a = b[0];
        if (d) {
            c = ":not(" + c + ")"
        }
        return b.length === 1 && a.nodeType === 1 ? dY.find.matchesSelector(a, c) ? [a] : [] : dY.find.matches(c, dY.grep(b, function(f) {
            return f.nodeType === 1
        }))
    }
    ;
    dY.fn.extend({
        find: function(f) {
            var a, c = [], d = this, b = d.length;
            if (typeof f !== "string") {
                return this.pushStack(dY(f).filter(function() {
                    for (a = 0; a < b; a++) {
                        if (dY.contains(d[a], this)) {
                            return true
                        }
                    }
                }))
            }
            for (a = 0; a < b; a++) {
                dY.find(f, d[a], c)
            }
            c = this.pushStack(b > 1 ? dY.unique(c) : c);
            c.selector = this.selector ? this.selector + " " + f : f;
            return c
        },
        filter: function(a) {
            return this.pushStack(c4(this, a || [], false))
        },
        not: function(a) {
            return this.pushStack(c4(this, a || [], true))
        },
        is: function(a) {
            return !!c4(this, typeof a === "string" && dS.test(a) ? dY(a) : a || [], false).length
        }
    });
    var dL, eB = ed.document, eH = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, d6 = dY.fn.init = function(b, d) {
            var a, c;
            if (!b) {
                return this
            }
            if (typeof b === "string") {
                if (b.charAt(0) === "<" && b.charAt(b.length - 1) === ">" && b.length >= 3) {
                    a = [null , b, null ]
                } else {
                    a = eH.exec(b)
                }
                if (a && (a[1] || !d)) {
                    if (a[1]) {
                        d = d instanceof dY ? d[0] : d;
                        dY.merge(this, dY.parseHTML(a[1], d && d.nodeType ? d.ownerDocument || d : eB, true));
                        if (dr.test(a[1]) && dY.isPlainObject(d)) {
                            for (a in d) {
                                if (dY.isFunction(this[a])) {
                                    this[a](d[a])
                                } else {
                                    this.attr(a, d[a])
                                }
                            }
                        }
                        return this
                    } else {
                        c = eB.getElementById(a[2]);
                        if (c && c.parentNode) {
                            if (c.id !== a[2]) {
                                return dL.find(b)
                            }
                            this.length = 1;
                            this[0] = c
                        }
                        this.context = eB;
                        this.selector = b;
                        return this
                    }
                } else {
                    if (!d || d.jquery) {
                        return (d || dL).find(b)
                    } else {
                        return this.constructor(d).find(b)
                    }
                }
            } else {
                if (b.nodeType) {
                    this.context = this[0] = b;
                    this.length = 1;
                    return this
                } else {
                    if (dY.isFunction(b)) {
                        return typeof dL.ready !== "undefined" ? dL.ready(b) : b(dY)
                    }
                }
            }
            if (b.selector !== undefined) {
                this.selector = b.selector;
                this.context = b.context
            }
            return dY.makeArray(b, this)
        }
        ;
    d6.prototype = dY.fn;
    dL = dY(eB);
    var dG = /^(?:parents|prev(?:Until|All))/
        , cu = {
        children: true,
        contents: true,
        next: true,
        prev: true
    };
    dY.extend({
        dir: function(f, a, c) {
            var b = []
                , d = f[a];
            while (d && d.nodeType !== 9 && (c === undefined || d.nodeType !== 1 || !dY(d).is(c))) {
                if (d.nodeType === 1) {
                    b.push(d)
                }
                d = d[a]
            }
            return b
        },
        sibling: function(c, a) {
            var b = [];
            for (; c; c = c.nextSibling) {
                if (c.nodeType === 1 && c !== a) {
                    b.push(c)
                }
            }
            return b
        }
    });
    dY.fn.extend({
        has: function(b) {
            var c, d = dY(b, this), a = d.length;
            return this.filter(function() {
                for (c = 0; c < a; c++) {
                    if (dY.contains(this, d[c])) {
                        return true
                    }
                }
            })
        },
        closest: function(f, b) {
            var d, g = 0, h = this.length, c = [], a = dS.test(f) || typeof f !== "string" ? dY(f, b || this.context) : 0;
            for (; g < h; g++) {
                for (d = this[g]; d && d !== b; d = d.parentNode) {
                    if (d.nodeType < 11 && (a ? a.index(d) > -1 : d.nodeType === 1 && dY.find.matchesSelector(d, f))) {
                        c.push(d);
                        break
                    }
                }
            }
            return this.pushStack(c.length > 1 ? dY.unique(c) : c)
        },
        index: function(a) {
            if (!a) {
                return (this[0] && this[0].parentNode) ? this.first().prevAll().length : -1
            }
            if (typeof a === "string") {
                return dY.inArray(this[0], dY(a))
            }
            return dY.inArray(a.jquery ? a[0] : a, this)
        },
        add: function(b, a) {
            return this.pushStack(dY.unique(dY.merge(this.get(), dY(b, a))))
        },
        addBack: function(a) {
            return this.add(a == null  ? this.prevObject : this.prevObject.filter(a))
        }
    });
    function c5(a, b) {
        do {
            a = a[b]
        } while (a && a.nodeType !== 1);return a
    }
    dY.each({
        parent: function(a) {
            var b = a.parentNode;
            return b && b.nodeType !== 11 ? b : null
        },
        parents: function(a) {
            return dY.dir(a, "parentNode")
        },
        parentsUntil: function(c, a, b) {
            return dY.dir(c, "parentNode", b)
        },
        next: function(a) {
            return c5(a, "nextSibling")
        },
        prev: function(a) {
            return c5(a, "previousSibling")
        },
        nextAll: function(a) {
            return dY.dir(a, "nextSibling")
        },
        prevAll: function(a) {
            return dY.dir(a, "previousSibling")
        },
        nextUntil: function(c, a, b) {
            return dY.dir(c, "nextSibling", b)
        },
        prevUntil: function(c, a, b) {
            return dY.dir(c, "previousSibling", b)
        },
        siblings: function(a) {
            return dY.sibling((a.parentNode || {}).firstChild, a)
        },
        children: function(a) {
            return dY.sibling(a.firstChild)
        },
        contents: function(a) {
            return dY.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : dY.merge([], a.childNodes)
        }
    }, function(b, a) {
        dY.fn[b] = function(c, f) {
            var d = dY.map(this, a, c);
            if (b.slice(-5) !== "Until") {
                f = c
            }
            if (f && typeof f === "string") {
                d = dY.filter(f, d)
            }
            if (this.length > 1) {
                if (!cu[b]) {
                    d = dY.unique(d)
                }
                if (dG.test(b)) {
                    d = d.reverse()
                }
            }
            return this.pushStack(d)
        }
    });
    var eF = (/\S+/g);
    var di = {};
    function dM(a) {
        var b = di[a] = {};
        dY.each(a.match(eF) || [], function(c, d) {
            b[d] = true
        });
        return b
    }
    dY.Callbacks = function(a) {
        a = typeof a === "string" ? (di[a] || dM(a)) : dY.extend({}, a);
        var l, g, m, k, j, h, d = [], c = !a.once && [], f = function(n) {
            g = a.memory && n;
            m = true;
            j = h || 0;
            h = 0;
            k = d.length;
            l = true;
            for (; d && j < k; j++) {
                if (d[j].apply(n[0], n[1]) === false && a.stopOnFalse) {
                    g = false;
                    break
                }
            }
            l = false;
            if (d) {
                if (c) {
                    if (c.length) {
                        f(c.shift())
                    }
                } else {
                    if (g) {
                        d = []
                    } else {
                        b.disable()
                    }
                }
            }
        }
            , b = {
            add: function() {
                if (d) {
                    var n = d.length;
                    (function o(p) {
                        dY.each(p, function(r, s) {
                            var q = dY.type(s);
                            if (q === "function") {
                                if (!a.unique || !b.has(s)) {
                                    d.push(s)
                                }
                            } else {
                                if (s && s.length && q !== "string") {
                                    o(s)
                                }
                            }
                        })
                    })(arguments);
                    if (l) {
                        k = d.length
                    } else {
                        if (g) {
                            h = n;
                            f(g)
                        }
                    }
                }
                return this
            },
            remove: function() {
                if (d) {
                    dY.each(arguments, function(n, p) {
                        var o;
                        while ((o = dY.inArray(p, d, o)) > -1) {
                            d.splice(o, 1);
                            if (l) {
                                if (o <= k) {
                                    k--
                                }
                                if (o <= j) {
                                    j--
                                }
                            }
                        }
                    })
                }
                return this
            },
            has: function(n) {
                return n ? dY.inArray(n, d) > -1 : !!(d && d.length)
            },
            empty: function() {
                d = [];
                k = 0;
                return this
            },
            disable: function() {
                d = c = g = undefined;
                return this
            },
            disabled: function() {
                return !d
            },
            lock: function() {
                c = undefined;
                if (!g) {
                    b.disable()
                }
                return this
            },
            locked: function() {
                return !c
            },
            fireWith: function(n, o) {
                if (d && (!m || c)) {
                    o = o || [];
                    o = [n, o.slice ? o.slice() : o];
                    if (l) {
                        c.push(o)
                    } else {
                        f(o)
                    }
                }
                return this
            },
            fire: function() {
                b.fireWith(this, arguments);
                return this
            },
            fired: function() {
                return !!m
            }
        };
        return b
    }
    ;
    dY.extend({
        Deferred: function(f) {
            var a = [["resolve", "done", dY.Callbacks("once memory"), "resolved"], ["reject", "fail", dY.Callbacks("once memory"), "rejected"], ["notify", "progress", dY.Callbacks("memory")]]
                , d = "pending"
                , c = {
                state: function() {
                    return d
                },
                always: function() {
                    b.done(arguments).fail(arguments);
                    return this
                },
                then: function() {
                    var g = arguments;
                    return dY.Deferred(function(h) {
                        dY.each(a, function(l, j) {
                            var k = dY.isFunction(g[l]) && g[l];
                            b[j[1]](function() {
                                var m = k && k.apply(this, arguments);
                                if (m && dY.isFunction(m.promise)) {
                                    m.promise().done(h.resolve).fail(h.reject).progress(h.notify)
                                } else {
                                    h[j[0] + "With"](this === c ? h.promise() : this, k ? [m] : arguments)
                                }
                            })
                        });
                        g = null
                    }).promise()
                },
                promise: function(g) {
                    return g != null  ? dY.extend(g, c) : c
                }
            }
                , b = {};
            c.pipe = c.then;
            dY.each(a, function(j, k) {
                var g = k[2]
                    , h = k[3];
                c[k[1]] = g.add;
                if (h) {
                    g.add(function() {
                        d = h
                    }, a[j ^ 1][2].disable, a[2][2].lock)
                }
                b[k[0]] = function() {
                    b[k[0] + "With"](this === b ? c : this, arguments);
                    return this
                }
                ;
                b[k[0] + "With"] = g.fireWith
            });
            c.promise(b);
            if (f) {
                f.call(b, b)
            }
            return b
        },
        when: function(j) {
            var f = 0, h = cX.call(arguments), l = h.length, g = l !== 1 || (j && dY.isFunction(j.promise)) ? l : 0, a = g === 1 ? j : dY.Deferred(), k = function(m, o, n) {
                return function(p) {
                    o[m] = this;
                    n[m] = arguments.length > 1 ? cX.call(arguments) : p;
                    if (n === b) {
                        a.notifyWith(o, n)
                    } else {
                        if (!(--g)) {
                            a.resolveWith(o, n)
                        }
                    }
                }
            }
                , b, d, c;
            if (l > 1) {
                b = new Array(l);
                d = new Array(l);
                c = new Array(l);
                for (; f < l; f++) {
                    if (h[f] && dY.isFunction(h[f].promise)) {
                        h[f].promise().done(k(f, c, h)).fail(a.reject).progress(k(f, d, b))
                    } else {
                        --g
                    }
                }
            }
            if (!g) {
                a.resolveWith(c, h)
            }
            return a.promise()
        }
    });
    var b9;
    dY.fn.ready = function(a) {
        dY.ready.promise().done(a);
        return this
    }
    ;
    dY.extend({
        isReady: false,
        readyWait: 1,
        holdReady: function(a) {
            if (a) {
                dY.readyWait++
            } else {
                dY.ready(true)
            }
        },
        ready: function(a) {
            if (a === true ? --dY.readyWait : dY.isReady) {
                return
            }
            if (!eB.body) {
                return setTimeout(dY.ready)
            }
            dY.isReady = true;
            if (a !== true && --dY.readyWait > 0) {
                return
            }
            b9.resolveWith(eB, [dY]);
            if (dY.fn.triggerHandler) {
                dY(eB).triggerHandler("ready");
                dY(eB).off("ready")
            }
        }
    });
    function d4() {
        if (eB.addEventListener) {
            eB.removeEventListener("DOMContentLoaded", cF, false);
            ed.removeEventListener("load", cF, false)
        } else {
            eB.detachEvent("onreadystatechange", cF);
            ed.detachEvent("onload", cF)
        }
    }
    function cF() {
        if (eB.addEventListener || event.type === "load" || eB.readyState === "complete") {
            d4();
            dY.ready()
        }
    }
    dY.ready.promise = function(b) {
        if (!b9) {
            b9 = dY.Deferred();
            if (eB.readyState === "complete") {
                setTimeout(dY.ready)
            } else {
                if (eB.addEventListener) {
                    eB.addEventListener("DOMContentLoaded", cF, false);
                    ed.addEventListener("load", cF, false)
                } else {
                    eB.attachEvent("onreadystatechange", cF);
                    ed.attachEvent("onload", cF);
                    var c = false;
                    try {
                        c = ed.frameElement == null  && eB.documentElement
                    } catch (d) {}
                    if (c && c.doScroll) {
                        (function a() {
                            if (!dY.isReady) {
                                try {
                                    c.doScroll("left")
                                } catch (f) {
                                    return setTimeout(a, 50)
                                }
                                d4();
                                dY.ready()
                            }
                        })()
                    }
                }
            }
        }
        return b9.promise(b)
    }
    ;
    var b8 = typeof undefined;
    var cH;
    for (cH in dY(db)) {
        break
    }
    db.ownLast = cH !== "0";
    db.inlineBlockNeedsLayout = false;
    dY(function() {
        var d, c, b, a;
        b = eB.getElementsByTagName("body")[0];
        if (!b || !b.style) {
            return
        }
        c = eB.createElement("div");
        a = eB.createElement("div");
        a.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
        b.appendChild(a).appendChild(c);
        if (typeof c.style.zoom !== b8) {
            c.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1";
            db.inlineBlockNeedsLayout = d = c.offsetWidth === 3;
            if (d) {
                b.style.zoom = 1
            }
        }
        b.removeChild(a)
    });
    (function() {
        var b = eB.createElement("div");
        if (db.deleteExpando == null ) {
            db.deleteExpando = true;
            try {
                delete b.test
            } catch (a) {
                db.deleteExpando = false
            }
        }
        b = null
    })();
    dY.acceptData = function(c) {
        var a = dY.noData[(c.nodeName + " ").toLowerCase()]
            , b = +c.nodeType || 1;
        return b !== 1 && b !== 9 ? false : !a || a !== true && c.getAttribute("classid") === a
    }
    ;
    var er = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/
        , c2 = /([A-Z])/g;
    function eh(d, f, c) {
        if (c === undefined && d.nodeType === 1) {
            var a = "data-" + f.replace(c2, "-$1").toLowerCase();
            c = d.getAttribute(a);
            if (typeof c === "string") {
                try {
                    c = c === "true" ? true : c === "false" ? false : c === "null" ? null  : +c + "" === c ? +c : er.test(c) ? dY.parseJSON(c) : c
                } catch (b) {}
                dY.data(d, f, c)
            } else {
                c = undefined
            }
        }
        return c
    }
    function dD(a) {
        var b;
        for (b in a) {
            if (b === "data" && dY.isEmptyObject(a[b])) {
                continue
            }
            if (b !== "toJSON") {
                return false
            }
        }
        return true
    }
    function et(l, h, j, k) {
        if (!dY.acceptData(l)) {
            return
        }
        var c, g, b = dY.expando, a = l.nodeType, f = a ? dY.cache : l, d = a ? l[b] : l[b] && b;
        if ((!d || !f[d] || (!k && !f[d].data)) && j === undefined && typeof h === "string") {
            return
        }
        if (!d) {
            if (a) {
                d = l[b] = dV.pop() || dY.guid++
            } else {
                d = b
            }
        }
        if (!f[d]) {
            f[d] = a ? {} : {
                toJSON: dY.noop
            }
        }
        if (typeof h === "object" || typeof h === "function") {
            if (k) {
                f[d] = dY.extend(f[d], h)
            } else {
                f[d].data = dY.extend(f[d].data, h)
            }
        }
        g = f[d];
        if (!k) {
            if (!g.data) {
                g.data = {}
            }
            g = g.data
        }
        if (j !== undefined) {
            g[dY.camelCase(h)] = j
        }
        if (typeof h === "string") {
            c = g[h];
            if (c == null ) {
                c = g[dY.camelCase(h)]
            }
        } else {
            c = g
        }
        return c
    }
    function dH(g, h, a) {
        if (!dY.acceptData(g)) {
            return
        }
        var d, c, b = g.nodeType, j = b ? dY.cache : g, f = b ? g[dY.expando] : dY.expando;
        if (!j[f]) {
            return
        }
        if (h) {
            d = a ? j[f] : j[f].data;
            if (d) {
                if (!dY.isArray(h)) {
                    if (h in d) {
                        h = [h]
                    } else {
                        h = dY.camelCase(h);
                        if (h in d) {
                            h = [h]
                        } else {
                            h = h.split(" ")
                        }
                    }
                } else {
                    h = h.concat(dY.map(h, dY.camelCase))
                }
                c = h.length;
                while (c--) {
                    delete d[h[c]]
                }
                if (a ? !dD(d) : !dY.isEmptyObject(d)) {
                    return
                }
            }
        }
        if (!a) {
            delete j[f].data;
            if (!dD(j[f])) {
                return
            }
        }
        if (b) {
            dY.cleanData([g], true)
        } else {
            if (db.deleteExpando || j != j.window) {
                delete j[f]
            } else {
                j[f] = null
            }
        }
    }
    dY.extend({
        cache: {},
        noData: {
            "applet ": true,
            "embed ": true,
            "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        },
        hasData: function(a) {
            a = a.nodeType ? dY.cache[a[dY.expando]] : a[dY.expando];
            return !!a && !dD(a)
        },
        data: function(a, b, c) {
            return et(a, b, c)
        },
        removeData: function(a, b) {
            return dH(a, b)
        },
        _data: function(a, b, c) {
            return et(a, b, c, true)
        },
        _removeData: function(a, b) {
            return dH(a, b, true)
        }
    });
    dY.fn.extend({
        data: function(f, a) {
            var g, h, d, b = this[0], c = b && b.attributes;
            if (f === undefined) {
                if (this.length) {
                    d = dY.data(b);
                    if (b.nodeType === 1 && !dY._data(b, "parsedAttrs")) {
                        g = c.length;
                        while (g--) {
                            if (c[g]) {
                                h = c[g].name;
                                if (h.indexOf("data-") === 0) {
                                    h = dY.camelCase(h.slice(5));
                                    eh(b, h, d[h])
                                }
                            }
                        }
                        dY._data(b, "parsedAttrs", true)
                    }
                }
                return d
            }
            if (typeof f === "object") {
                return this.each(function() {
                    dY.data(this, f)
                })
            }
            return arguments.length > 1 ? this.each(function() {
                dY.data(this, f, a)
            }) : b ? eh(b, f, dY.data(b, f)) : undefined
        },
        removeData: function(a) {
            return this.each(function() {
                dY.removeData(this, a)
            })
        }
    });
    dY.extend({
        queue: function(d, a, c) {
            var b;
            if (d) {
                a = (a || "fx") + "queue";
                b = dY._data(d, a);
                if (c) {
                    if (!b || dY.isArray(c)) {
                        b = dY._data(d, a, dY.makeArray(c))
                    } else {
                        b.push(c)
                    }
                }
                return b || []
            }
        },
        dequeue: function(f, b) {
            b = b || "fx";
            var a = dY.queue(f, b)
                , d = a.length
                , g = a.shift()
                , c = dY._queueHooks(f, b)
                , h = function() {
                    dY.dequeue(f, b)
                }
                ;
            if (g === "inprogress") {
                g = a.shift();
                d--
            }
            if (g) {
                if (b === "fx") {
                    a.unshift("inprogress")
                }
                delete c.stop;
                g.call(f, h, c)
            }
            if (!d && c) {
                c.empty.fire()
            }
        },
        _queueHooks: function(c, a) {
            var b = a + "queueHooks";
            return dY._data(c, b) || dY._data(c, b, {
                    empty: dY.Callbacks("once memory").add(function() {
                        dY._removeData(c, a + "queue");
                        dY._removeData(c, b)
                    })
                })
        }
    });
    dY.fn.extend({
        queue: function(b, a) {
            var c = 2;
            if (typeof b !== "string") {
                a = b;
                b = "fx";
                c--
            }
            if (arguments.length < c) {
                return dY.queue(this[0], b)
            }
            return a === undefined ? this : this.each(function() {
                var d = dY.queue(this, b, a);
                dY._queueHooks(this, b);
                if (b === "fx" && d[0] !== "inprogress") {
                    dY.dequeue(this, b)
                }
            })
        },
        dequeue: function(a) {
            return this.each(function() {
                dY.dequeue(this, a)
            })
        },
        clearQueue: function(a) {
            return this.queue(a || "fx", [])
        },
        promise: function(h, g) {
            var j, d = 1, f = dY.Deferred(), b = this, c = this.length, a = function() {
                    if (!(--d)) {
                        f.resolveWith(b, [b])
                    }
                }
                ;
            if (typeof h !== "string") {
                g = h;
                h = undefined
            }
            h = h || "fx";
            while (c--) {
                j = dY._data(b[c], h + "queueHooks");
                if (j && j.empty) {
                    d++;
                    j.empty.add(a)
                }
            }
            a();
            return f.promise(g)
        }
    });
    var eg = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;
    var dn = ["Top", "Right", "Bottom", "Left"];
    var cc = function(a, b) {
            a = b || a;
            return dY.css(a, "display") === "none" || !dY.contains(a.ownerDocument, a)
        }
        ;
    var dx = dY.access = function(l, h, c, g, k, a, b) {
            var f = 0
                , j = l.length
                , d = c == null ;
            if (dY.type(c) === "object") {
                k = true;
                for (f in c) {
                    dY.access(l, h, f, c[f], true, a, b)
                }
            } else {
                if (g !== undefined) {
                    k = true;
                    if (!dY.isFunction(g)) {
                        b = true
                    }
                    if (d) {
                        if (b) {
                            h.call(l, g);
                            h = null
                        } else {
                            d = h;
                            h = function(n, o, m) {
                                return d.call(dY(n), m)
                            }
                        }
                    }
                    if (h) {
                        for (; f < j; f++) {
                            h(l[f], c, b ? g : g.call(l[f], f, h(l[f], c)))
                        }
                    }
                }
            }
            return k ? l : d ? h.call(l) : j ? h(l[0], c) : a
        }
        ;
    var da = (/^(?:checkbox|radio)$/i);
    (function() {
        var a = eB.createElement("input")
            , b = eB.createElement("div")
            , d = eB.createDocumentFragment();
        b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
        db.leadingWhitespace = b.firstChild.nodeType === 3;
        db.tbody = !b.getElementsByTagName("tbody").length;
        db.htmlSerialize = !!b.getElementsByTagName("link").length;
        db.html5Clone = eB.createElement("nav").cloneNode(true).outerHTML !== "<:nav></:nav>";
        a.type = "checkbox";
        a.checked = true;
        d.appendChild(a);
        db.appendChecked = a.checked;
        b.innerHTML = "<textarea>x</textarea>";
        db.noCloneChecked = !!b.cloneNode(true).lastChild.defaultValue;
        d.appendChild(b);
        b.innerHTML = "<input type='radio' checked='checked' name='t'/>";
        db.checkClone = b.cloneNode(true).cloneNode(true).lastChild.checked;
        db.noCloneEvent = true;
        if (b.attachEvent) {
            b.attachEvent("onclick", function() {
                db.noCloneEvent = false
            });
            b.cloneNode(true).click()
        }
        if (db.deleteExpando == null ) {
            db.deleteExpando = true;
            try {
                delete b.test
            } catch (c) {
                db.deleteExpando = false
            }
        }
    })();
    (function() {
        var c, a, b = eB.createElement("div");
        for (c in {
            submit: true,
            change: true,
            focusin: true
        }) {
            a = "on" + c;
            if (!(db[c + "Bubbles"] = a in ed)) {
                b.setAttribute(a, "t");
                db[c + "Bubbles"] = b.attributes[a].expando === false
            }
        }
        b = null
    })();
    var d7 = /^(?:input|select|textarea)$/i
        , ct = /^key/
        , cK = /^(?:mouse|pointer|contextmenu)|click/
        , ci = /^(?:focusinfocus|focusoutblur)$/
        , ck = /^([^.]*)(?:\.(.+)|)$/;
    function dp() {
        return true
    }
    function dP() {
        return false
    }
    function cD() {
        try {
            return eB.activeElement
        } catch (a) {}
    }
    dY.event = {
        global: {},
        add: function(n, r, l, d, m) {
            var a, g, f, c, k, s, h, o, j, q, b, p = dY._data(n);
            if (!p) {
                return
            }
            if (l.handler) {
                c = l;
                l = c.handler;
                m = c.selector
            }
            if (!l.guid) {
                l.guid = dY.guid++
            }
            if (!(g = p.events)) {
                g = p.events = {}
            }
            if (!(s = p.handle)) {
                s = p.handle = function(t) {
                    return typeof dY !== b8 && (!t || dY.event.triggered !== t.type) ? dY.event.dispatch.apply(s.elem, arguments) : undefined
                }
                ;
                s.elem = n
            }
            r = (r || "").match(eF) || [""];
            f = r.length;
            while (f--) {
                a = ck.exec(r[f]) || [];
                j = b = a[1];
                q = (a[2] || "").split(".").sort();
                if (!j) {
                    continue
                }
                k = dY.event.special[j] || {};
                j = (m ? k.delegateType : k.bindType) || j;
                k = dY.event.special[j] || {};
                h = dY.extend({
                    type: j,
                    origType: b,
                    data: d,
                    handler: l,
                    guid: l.guid,
                    selector: m,
                    needsContext: m && dY.expr.match.needsContext.test(m),
                    namespace: q.join(".")
                }, c);
                if (!(o = g[j])) {
                    o = g[j] = [];
                    o.delegateCount = 0;
                    if (!k.setup || k.setup.call(n, d, q, s) === false) {
                        if (n.addEventListener) {
                            n.addEventListener(j, s, false)
                        } else {
                            if (n.attachEvent) {
                                n.attachEvent("on" + j, s)
                            }
                        }
                    }
                }
                if (k.add) {
                    k.add.call(n, h);
                    if (!h.handler.guid) {
                        h.handler.guid = l.guid
                    }
                }
                if (m) {
                    o.splice(o.delegateCount++, 0, h)
                } else {
                    o.push(h)
                }
                dY.event.global[j] = true
            }
            n = null
        },
        remove: function(o, r, h, n, s) {
            var d, l, a, m, f, g, k, c, j, q, b, p = dY.hasData(o) && dY._data(o);
            if (!p || !(g = p.events)) {
                return
            }
            r = (r || "").match(eF) || [""];
            f = r.length;
            while (f--) {
                a = ck.exec(r[f]) || [];
                j = b = a[1];
                q = (a[2] || "").split(".").sort();
                if (!j) {
                    for (j in g) {
                        dY.event.remove(o, j + r[f], h, n, true)
                    }
                    continue
                }
                k = dY.event.special[j] || {};
                j = (n ? k.delegateType : k.bindType) || j;
                c = g[j] || [];
                a = a[2] && new RegExp("(^|\\.)" + q.join("\\.(?:.*\\.|)") + "(\\.|$)");
                m = d = c.length;
                while (d--) {
                    l = c[d];
                    if ((s || b === l.origType) && (!h || h.guid === l.guid) && (!a || a.test(l.namespace)) && (!n || n === l.selector || n === "**" && l.selector)) {
                        c.splice(d, 1);
                        if (l.selector) {
                            c.delegateCount--
                        }
                        if (k.remove) {
                            k.remove.call(o, l)
                        }
                    }
                }
                if (m && !c.length) {
                    if (!k.teardown || k.teardown.call(o, q, p.handle) === false) {
                        dY.removeEvent(o, j, p.handle)
                    }
                    delete g[j]
                }
            }
            if (dY.isEmptyObject(g)) {
                delete p.handle;
                dY._removeData(o, "events")
            }
        },
        trigger: function(l, g, n, m) {
            var f, o, a, q, c, h, j, p = [n || eB], b = b5.call(l, "type") ? l.type : l, k = b5.call(l, "namespace") ? l.namespace.split(".") : [];
            a = h = n = n || eB;
            if (n.nodeType === 3 || n.nodeType === 8) {
                return
            }
            if (ci.test(b + dY.event.triggered)) {
                return
            }
            if (b.indexOf(".") >= 0) {
                k = b.split(".");
                b = k.shift();
                k.sort()
            }
            o = b.indexOf(":") < 0 && "on" + b;
            l = l[dY.expando] ? l : new dY.Event(b,typeof l === "object" && l);
            l.isTrigger = m ? 2 : 3;
            l.namespace = k.join(".");
            l.namespace_re = l.namespace ? new RegExp("(^|\\.)" + k.join("\\.(?:.*\\.|)") + "(\\.|$)") : null ;
            l.result = undefined;
            if (!l.target) {
                l.target = n
            }
            g = g == null  ? [l] : dY.makeArray(g, [l]);
            c = dY.event.special[b] || {};
            if (!m && c.trigger && c.trigger.apply(n, g) === false) {
                return
            }
            if (!m && !c.noBubble && !dY.isWindow(n)) {
                q = c.delegateType || b;
                if (!ci.test(q + b)) {
                    a = a.parentNode
                }
                for (; a; a = a.parentNode) {
                    p.push(a);
                    h = a
                }
                if (h === (n.ownerDocument || eB)) {
                    p.push(h.defaultView || h.parentWindow || ed)
                }
            }
            j = 0;
            while ((a = p[j++]) && !l.isPropagationStopped()) {
                l.type = j > 1 ? q : c.bindType || b;
                f = (dY._data(a, "events") || {})[l.type] && dY._data(a, "handle");
                if (f) {
                    f.apply(a, g)
                }
                f = o && a[o];
                if (f && f.apply && dY.acceptData(a)) {
                    l.result = f.apply(a, g);
                    if (l.result === false) {
                        l.preventDefault()
                    }
                }
            }
            l.type = b;
            if (!m && !l.isDefaultPrevented()) {
                if ((!c._default || c._default.apply(p.pop(), g) === false) && dY.acceptData(n)) {
                    if (o && n[b] && !dY.isWindow(n)) {
                        h = n[o];
                        if (h) {
                            n[o] = null
                        }
                        dY.event.triggered = b;
                        try {
                            n[b]()
                        } catch (d) {}
                        dY.event.triggered = undefined;
                        if (h) {
                            n[o] = h
                        }
                    }
                }
            }
            return l.result
        },
        dispatch: function(l) {
            l = dY.event.fix(l);
            var j, h, a, g, k, b = [], c = cX.call(arguments), f = (dY._data(this, "events") || {})[l.type] || [], d = dY.event.special[l.type] || {};
            c[0] = l;
            l.delegateTarget = this;
            if (d.preDispatch && d.preDispatch.call(this, l) === false) {
                return
            }
            b = dY.event.handlers.call(this, l, f);
            j = 0;
            while ((g = b[j++]) && !l.isPropagationStopped()) {
                l.currentTarget = g.elem;
                k = 0;
                while ((a = g.handlers[k++]) && !l.isImmediatePropagationStopped()) {
                    if (!l.namespace_re || l.namespace_re.test(a.namespace)) {
                        l.handleObj = a;
                        l.data = a.data;
                        h = ((dY.event.special[a.origType] || {}).handle || a.handler).apply(g.elem, c);
                        if (h !== undefined) {
                            if ((l.result = h) === false) {
                                l.preventDefault();
                                l.stopPropagation()
                            }
                        }
                    }
                }
            }
            if (d.postDispatch) {
                d.postDispatch.call(this, l)
            }
            return l.result
        },
        handlers: function(k, d) {
            var f, b, g, h, c = [], j = d.delegateCount, a = k.target;
            if (j && a.nodeType && (!k.button || k.type !== "click")) {
                for (; a != this; a = a.parentNode || this) {
                    if (a.nodeType === 1 && (a.disabled !== true || k.type !== "click")) {
                        g = [];
                        for (h = 0; h < j; h++) {
                            b = d[h];
                            f = b.selector + " ";
                            if (g[f] === undefined) {
                                g[f] = b.needsContext ? dY(f, this).index(a) >= 0 : dY.find(f, this, null , [a]).length
                            }
                            if (g[f]) {
                                g.push(b)
                            }
                        }
                        if (g.length) {
                            c.push({
                                elem: a,
                                handlers: g
                            })
                        }
                    }
                }
            }
            if (j < d.length) {
                c.push({
                    elem: this,
                    handlers: d.slice(j)
                })
            }
            return c
        },
        fix: function(f) {
            if (f[dY.expando]) {
                return f
            }
            var h, a, d, g = f.type, c = f, b = this.fixHooks[g];
            if (!b) {
                this.fixHooks[g] = b = cK.test(g) ? this.mouseHooks : ct.test(g) ? this.keyHooks : {}
            }
            d = b.props ? this.props.concat(b.props) : this.props;
            f = new dY.Event(c);
            h = d.length;
            while (h--) {
                a = d[h];
                f[a] = c[a]
            }
            if (!f.target) {
                f.target = c.srcElement || eB
            }
            if (f.target.nodeType === 3) {
                f.target = f.target.parentNode
            }
            f.metaKey = !!f.metaKey;
            return b.filter ? b.filter(f, c) : f
        },
        props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(a, b) {
                if (a.which == null ) {
                    a.which = b.charCode != null  ? b.charCode : b.keyCode
                }
                return a
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(g, h) {
                var f, c, b, a = h.button, d = h.fromElement;
                if (g.pageX == null  && h.clientX != null ) {
                    c = g.target.ownerDocument || eB;
                    b = c.documentElement;
                    f = c.body;
                    g.pageX = h.clientX + (b && b.scrollLeft || f && f.scrollLeft || 0) - (b && b.clientLeft || f && f.clientLeft || 0);
                    g.pageY = h.clientY + (b && b.scrollTop || f && f.scrollTop || 0) - (b && b.clientTop || f && f.clientTop || 0)
                }
                if (!g.relatedTarget && d) {
                    g.relatedTarget = d === g.target ? h.toElement : d
                }
                if (!g.which && a !== undefined) {
                    g.which = (a & 1 ? 1 : (a & 2 ? 3 : (a & 4 ? 2 : 0)))
                }
                return g
            }
        },
        special: {
            load: {
                noBubble: true
            },
            focus: {
                trigger: function() {
                    if (this !== cD() && this.focus) {
                        try {
                            this.focus();
                            return false
                        } catch (a) {}
                    }
                },
                delegateType: "focusin"
            },
            blur: {
                trigger: function() {
                    if (this === cD() && this.blur) {
                        this.blur();
                        return false
                    }
                },
                delegateType: "focusout"
            },
            click: {
                trigger: function() {
                    if (dY.nodeName(this, "input") && this.type === "checkbox" && this.click) {
                        this.click();
                        return false
                    }
                },
                _default: function(a) {
                    return dY.nodeName(a.target, "a")
                }
            },
            beforeunload: {
                postDispatch: function(a) {
                    if (a.result !== undefined && a.originalEvent) {
                        a.originalEvent.returnValue = a.result
                    }
                }
            }
        },
        simulate: function(f, c, d, a) {
            var b = dY.extend(new dY.Event(), d, {
                type: f,
                isSimulated: true,
                originalEvent: {}
            });
            if (a) {
                dY.event.trigger(b, null , c)
            } else {
                dY.event.dispatch.call(c, b)
            }
            if (b.isDefaultPrevented()) {
                d.preventDefault()
            }
        }
    };
    dY.removeEvent = eB.removeEventListener ? function(a, b, c) {
        if (a.removeEventListener) {
            a.removeEventListener(b, c, false)
        }
    }
        : function(d, a, c) {
        var b = "on" + a;
        if (d.detachEvent) {
            if (typeof d[b] === b8) {
                d[b] = null
            }
            d.detachEvent(b, c)
        }
    }
    ;
    dY.Event = function(a, b) {
        if (!(this instanceof dY.Event)) {
            return new dY.Event(a,b)
        }
        if (a && a.type) {
            this.originalEvent = a;
            this.type = a.type;
            this.isDefaultPrevented = a.defaultPrevented || a.defaultPrevented === undefined && a.returnValue === false ? dp : dP
        } else {
            this.type = a
        }
        if (b) {
            dY.extend(this, b)
        }
        this.timeStamp = a && a.timeStamp || dY.now();
        this[dY.expando] = true
    }
    ;
    dY.Event.prototype = {
        isDefaultPrevented: dP,
        isPropagationStopped: dP,
        isImmediatePropagationStopped: dP,
        preventDefault: function() {
            var a = this.originalEvent;
            this.isDefaultPrevented = dp;
            if (!a) {
                return
            }
            if (a.preventDefault) {
                a.preventDefault()
            } else {
                a.returnValue = false
            }
        },
        stopPropagation: function() {
            var a = this.originalEvent;
            this.isPropagationStopped = dp;
            if (!a) {
                return
            }
            if (a.stopPropagation) {
                a.stopPropagation()
            }
            a.cancelBubble = true
        },
        stopImmediatePropagation: function() {
            var a = this.originalEvent;
            this.isImmediatePropagationStopped = dp;
            if (a && a.stopImmediatePropagation) {
                a.stopImmediatePropagation()
            }
            this.stopPropagation()
        }
    };
    dY.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        pointerenter: "pointerover",
        pointerleave: "pointerout"
    }, function(a, b) {
        dY.event.special[a] = {
            delegateType: b,
            bindType: b,
            handle: function(f) {
                var h, c = this, d = f.relatedTarget, g = f.handleObj;
                if (!d || (d !== c && !dY.contains(c, d))) {
                    f.type = g.origType;
                    h = g.handler.apply(this, arguments);
                    f.type = b
                }
                return h
            }
        }
    });
    if (!db.submitBubbles) {
        dY.event.special.submit = {
            setup: function() {
                if (dY.nodeName(this, "form")) {
                    return false
                }
                dY.event.add(this, "click._submit keypress._submit", function(b) {
                    var c = b.target
                        , a = dY.nodeName(c, "input") || dY.nodeName(c, "button") ? c.form : undefined;
                    if (a && !dY._data(a, "submitBubbles")) {
                        dY.event.add(a, "submit._submit", function(d) {
                            d._submit_bubble = true
                        });
                        dY._data(a, "submitBubbles", true)
                    }
                })
            },
            postDispatch: function(a) {
                if (a._submit_bubble) {
                    delete a._submit_bubble;
                    if (this.parentNode && !a.isTrigger) {
                        dY.event.simulate("submit", this.parentNode, a, true)
                    }
                }
            },
            teardown: function() {
                if (dY.nodeName(this, "form")) {
                    return false
                }
                dY.event.remove(this, "._submit")
            }
        }
    }
    if (!db.changeBubbles) {
        dY.event.special.change = {
            setup: function() {
                if (d7.test(this.nodeName)) {
                    if (this.type === "checkbox" || this.type === "radio") {
                        dY.event.add(this, "propertychange._change", function(a) {
                            if (a.originalEvent.propertyName === "checked") {
                                this._just_changed = true
                            }
                        });
                        dY.event.add(this, "click._change", function(a) {
                            if (this._just_changed && !a.isTrigger) {
                                this._just_changed = false
                            }
                            dY.event.simulate("change", this, a, true)
                        })
                    }
                    return false
                }
                dY.event.add(this, "beforeactivate._change", function(b) {
                    var a = b.target;
                    if (d7.test(a.nodeName) && !dY._data(a, "changeBubbles")) {
                        dY.event.add(a, "change._change", function(c) {
                            if (this.parentNode && !c.isSimulated && !c.isTrigger) {
                                dY.event.simulate("change", this.parentNode, c, true)
                            }
                        });
                        dY._data(a, "changeBubbles", true)
                    }
                })
            },
            handle: function(a) {
                var b = a.target;
                if (this !== b || a.isSimulated || a.isTrigger || (b.type !== "radio" && b.type !== "checkbox")) {
                    return a.handleObj.handler.apply(this, arguments)
                }
            },
            teardown: function() {
                dY.event.remove(this, "._change");
                return !d7.test(this.nodeName)
            }
        }
    }
    if (!db.focusinBubbles) {
        dY.each({
            focus: "focusin",
            blur: "focusout"
        }, function(c, b) {
            var a = function(d) {
                    dY.event.simulate(b, d.target, dY.event.fix(d), true)
                }
                ;
            dY.event.special[b] = {
                setup: function() {
                    var d = this.ownerDocument || this
                        , f = dY._data(d, b);
                    if (!f) {
                        d.addEventListener(c, a, true)
                    }
                    dY._data(d, b, (f || 0) + 1)
                },
                teardown: function() {
                    var d = this.ownerDocument || this
                        , f = dY._data(d, b) - 1;
                    if (!f) {
                        d.removeEventListener(c, a, true);
                        dY._removeData(d, b)
                    } else {
                        dY._data(d, b, f)
                    }
                }
            }
        })
    }
    dY.fn.extend({
        on: function(h, f, b, c, a) {
            var g, d;
            if (typeof h === "object") {
                if (typeof f !== "string") {
                    b = b || f;
                    f = undefined
                }
                for (g in h) {
                    this.on(g, f, b, h[g], a)
                }
                return this
            }
            if (b == null  && c == null ) {
                c = f;
                b = f = undefined
            } else {
                if (c == null ) {
                    if (typeof f === "string") {
                        c = b;
                        b = undefined
                    } else {
                        c = b;
                        b = f;
                        f = undefined
                    }
                }
            }
            if (c === false) {
                c = dP
            } else {
                if (!c) {
                    return this
                }
            }
            if (a === 1) {
                d = c;
                c = function(j) {
                    dY().off(j);
                    return d.apply(this, arguments)
                }
                ;
                c.guid = d.guid || (d.guid = dY.guid++)
            }
            return this.each(function() {
                dY.event.add(this, h, c, b, f)
            })
        },
        one: function(a, b, c, d) {
            return this.on(a, b, c, d, 1)
        },
        off: function(f, c, b) {
            var a, d;
            if (f && f.preventDefault && f.handleObj) {
                a = f.handleObj;
                dY(f.delegateTarget).off(a.namespace ? a.origType + "." + a.namespace : a.origType, a.selector, a.handler);
                return this
            }
            if (typeof f === "object") {
                for (d in f) {
                    this.off(d, c, f[d])
                }
                return this
            }
            if (c === false || typeof c === "function") {
                b = c;
                c = undefined
            }
            if (b === false) {
                b = dP
            }
            return this.each(function() {
                dY.event.remove(this, f, b, c)
            })
        },
        trigger: function(b, a) {
            return this.each(function() {
                dY.event.trigger(b, a, this)
            })
        },
        triggerHandler: function(b, c) {
            var a = this[0];
            if (a) {
                return dY.event.trigger(b, c, a, true)
            }
        }
    });
    function eD(b) {
        var c = cz.split("|")
            , a = b.createDocumentFragment();
        if (a.createElement) {
            while (c.length) {
                a.createElement(c.pop())
            }
        }
        return a
    }
    var cz = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video"
        , em = / jQuery\d+="(?:null|\d+)"/g
        , cp = new RegExp("<(?:" + cz + ")[\\s/>]","i")
        , e = /^\s+/
        , d3 = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi
        , dq = /<([\w:]+)/
        , cL = /<tbody/i
        , eo = /<|&#?\w+;/
        , d1 = /<(?:script|style|link)/i
        , dw = /checked\s*(?:[^=]|=\s*.checked.)/i
        , cT = /^$|\/(?:java|ecma)script/i
        , ca = /^true\/(.*)/
        , d5 = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g
        , dW = {
        option: [1, "<select multiple='multiple'>", "</select>"],
        legend: [1, "<fieldset>", "</fieldset>"],
        area: [1, "<map>", "</map>"],
        param: [1, "<object>", "</object>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>", "</tbody></table>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
        td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
        _default: db.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"]
    }
        , dj = eD(eB)
        , cb = dj.appendChild(eB.createElement("div"));
    dW.optgroup = dW.option;
    dW.tbody = dW.tfoot = dW.colgroup = dW.caption = dW.thead;
    dW.th = dW.td;
    function dQ(d, b) {
        var g, c, f = 0, a = typeof d.getElementsByTagName !== b8 ? d.getElementsByTagName(b || "*") : typeof d.querySelectorAll !== b8 ? d.querySelectorAll(b || "*") : undefined;
        if (!a) {
            for (a = [],
                     g = d.childNodes || d; (c = g[f]) != null ; f++) {
                if (!b || dY.nodeName(c, b)) {
                    a.push(c)
                } else {
                    dY.merge(a, dQ(c, b))
                }
            }
        }
        return b === undefined || b && dY.nodeName(d, b) ? dY.merge([d], a) : a
    }
    function eE(a) {
        if (da.test(a.type)) {
            a.defaultChecked = a.checked
        }
    }
    function ev(a, b) {
        return dY.nodeName(a, "table") && dY.nodeName(b.nodeType !== 11 ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a
    }
    function d2(a) {
        a.type = (dY.find.attr(a, "type") !== null ) + "/" + a.type;
        return a
    }
    function cU(a) {
        var b = ca.exec(a.type);
        if (b) {
            a.type = b[1]
        } else {
            a.removeAttribute("type")
        }
        return a
    }
    function cP(b, c) {
        var a, d = 0;
        for (; (a = b[d]) != null ; d++) {
            dY._data(a, "globalEval", !c || dY._data(c[d], "globalEval"))
        }
    }
    function cB(g, j) {
        if (j.nodeType !== 1 || !dY.hasData(g)) {
            return
        }
        var a, f, c, d = dY._data(g), b = dY._data(j, d), h = d.events;
        if (h) {
            delete b.handle;
            b.events = {};
            for (a in h) {
                for (f = 0,
                         c = h[a].length; f < c; f++) {
                    dY.event.add(j, a, h[a][f])
                }
            }
        }
        if (b.data) {
            b.data = dY.extend({}, b.data)
        }
    }
    function dl(c, a) {
        var b, d, f;
        if (a.nodeType !== 1) {
            return
        }
        b = a.nodeName.toLowerCase();
        if (!db.noCloneEvent && a[dY.expando]) {
            f = dY._data(a);
            for (d in f.events) {
                dY.removeEvent(a, d, f.handle)
            }
            a.removeAttribute(dY.expando)
        }
        if (b === "script" && a.text !== c.text) {
            d2(a).text = c.text;
            cU(a)
        } else {
            if (b === "object") {
                if (a.parentNode) {
                    a.outerHTML = c.outerHTML
                }
                if (db.html5Clone && (c.innerHTML && !dY.trim(a.innerHTML))) {
                    a.innerHTML = c.innerHTML
                }
            } else {
                if (b === "input" && da.test(c.type)) {
                    a.defaultChecked = a.checked = c.checked;
                    if (a.value !== c.value) {
                        a.value = c.value
                    }
                } else {
                    if (b === "option") {
                        a.defaultSelected = a.selected = c.defaultSelected
                    } else {
                        if (b === "input" || b === "textarea") {
                            a.defaultValue = c.defaultValue
                        }
                    }
                }
            }
        }
    }
    dY.extend({
        clone: function(f, j, k) {
            var g, d, a, h, c, b = dY.contains(f.ownerDocument, f);
            if (db.html5Clone || dY.isXMLDoc(f) || !cp.test("<" + f.nodeName + ">")) {
                a = f.cloneNode(true)
            } else {
                cb.innerHTML = f.outerHTML;
                cb.removeChild(a = cb.firstChild)
            }
            if ((!db.noCloneEvent || !db.noCloneChecked) && (f.nodeType === 1 || f.nodeType === 11) && !dY.isXMLDoc(f)) {
                g = dQ(a);
                c = dQ(f);
                for (h = 0; (d = c[h]) != null ; ++h) {
                    if (g[h]) {
                        dl(d, g[h])
                    }
                }
            }
            if (j) {
                if (k) {
                    c = c || dQ(f);
                    g = g || dQ(a);
                    for (h = 0; (d = c[h]) != null ; h++) {
                        cB(d, g[h])
                    }
                } else {
                    cB(f, a)
                }
            }
            g = dQ(a, "script");
            if (g.length > 0) {
                cP(g, !b && dQ(f, "script"))
            }
            g = c = d = null ;
            return a
        },
        buildFragment: function(m, q, g, a) {
            var f, l, h, b, o, c, p, j = m.length, n = eD(q), k = [], d = 0;
            for (; d < j; d++) {
                l = m[d];
                if (l || l === 0) {
                    if (dY.type(l) === "object") {
                        dY.merge(k, l.nodeType ? [l] : l)
                    } else {
                        if (!eo.test(l)) {
                            k.push(q.createTextNode(l))
                        } else {
                            b = b || n.appendChild(q.createElement("div"));
                            o = (dq.exec(l) || ["", ""])[1].toLowerCase();
                            p = dW[o] || dW._default;
                            b.innerHTML = p[1] + l.replace(d3, "<$1></$2>") + p[2];
                            f = p[0];
                            while (f--) {
                                b = b.lastChild
                            }
                            if (!db.leadingWhitespace && e.test(l)) {
                                k.push(q.createTextNode(e.exec(l)[0]))
                            }
                            if (!db.tbody) {
                                l = o === "table" && !cL.test(l) ? b.firstChild : p[1] === "<table>" && !cL.test(l) ? b : 0;
                                f = l && l.childNodes.length;
                                while (f--) {
                                    if (dY.nodeName((c = l.childNodes[f]), "tbody") && !c.childNodes.length) {
                                        l.removeChild(c)
                                    }
                                }
                            }
                            dY.merge(k, b.childNodes);
                            b.textContent = "";
                            while (b.firstChild) {
                                b.removeChild(b.firstChild)
                            }
                            b = n.lastChild
                        }
                    }
                }
            }
            if (b) {
                n.removeChild(b)
            }
            if (!db.appendChecked) {
                dY.grep(dQ(k, "input"), eE)
            }
            d = 0;
            while ((l = k[d++]) ) {
                if (a && dY.inArray(l, a) !== -1) {
                    continue
                }
                h = dY.contains(l.ownerDocument, l);
                b = dQ(n.appendChild(l), "script");
                if (h) {
                    cP(b)
                }
                if (g) {
                    f = 0;
                    while ((l = b[f++]) ) {
                        if (cT.test(l.type || "")) {
                            g.push(l)
                        }
                    }
                }
            }
            b = null ;
            return n
        },
        cleanData: function(m, b) {
            var l, c, g, k, j = 0, a = dY.expando, h = dY.cache, f = db.deleteExpando, d = dY.event.special;
            for (; (l = m[j]) != null ; j++) {
                if (b || dY.acceptData(l)) {
                    g = l[a];
                    k = g && h[g];
                    if (k) {
                        if (k.events) {
                            for (c in k.events) {
                                if (d[c]) {
                                    dY.event.remove(l, c)
                                } else {
                                    dY.removeEvent(l, c, k.handle)
                                }
                            }
                        }
                        if (h[g]) {
                            delete h[g];
                            if (f) {
                                delete l[a]
                            } else {
                                if (typeof l.removeAttribute !== b8) {
                                    l.removeAttribute(a)
                                } else {
                                    l[a] = null
                                }
                            }
                            dV.push(g)
                        }
                    }
                }
            }
        }
    });
    dY.fn.extend({
        text: function(a) {
            return dx(this, function(b) {
                return b === undefined ? dY.text(this) : this.empty().append((this[0] && this[0].ownerDocument || eB).createTextNode(b))
            }, null , a, arguments.length)
        },
        append: function() {
            return this.domManip(arguments, function(b) {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                    var a = ev(this, b);
                    a.appendChild(b)
                }
            })
        },
        prepend: function() {
            return this.domManip(arguments, function(b) {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                    var a = ev(this, b);
                    a.insertBefore(b, a.firstChild)
                }
            })
        },
        before: function() {
            return this.domManip(arguments, function(a) {
                if (this.parentNode) {
                    this.parentNode.insertBefore(a, this)
                }
            })
        },
        after: function() {
            return this.domManip(arguments, function(a) {
                if (this.parentNode) {
                    this.parentNode.insertBefore(a, this.nextSibling)
                }
            })
        },
        remove: function(c, a) {
            var b, f = c ? dY.filter(c, this) : this, d = 0;
            for (; (b = f[d]) != null ; d++) {
                if (!a && b.nodeType === 1) {
                    dY.cleanData(dQ(b))
                }
                if (b.parentNode) {
                    if (a && dY.contains(b.ownerDocument, b)) {
                        cP(dQ(b, "script"))
                    }
                    b.parentNode.removeChild(b)
                }
            }
            return this
        },
        empty: function() {
            var b, a = 0;
            for (; (b = this[a]) != null ; a++) {
                if (b.nodeType === 1) {
                    dY.cleanData(dQ(b, false))
                }
                while (b.firstChild) {
                    b.removeChild(b.firstChild)
                }
                if (b.options && dY.nodeName(b, "select")) {
                    b.options.length = 0
                }
            }
            return this
        },
        clone: function(a, b) {
            a = a == null  ? false : a;
            b = b == null  ? a : b;
            return this.map(function() {
                return dY.clone(this, a, b)
            })
        },
        html: function(a) {
            return dx(this, function(c) {
                var d = this[0] || {}
                    , f = 0
                    , g = this.length;
                if (c === undefined) {
                    return d.nodeType === 1 ? d.innerHTML.replace(em, "") : undefined
                }
                if (typeof c === "string" && !d1.test(c) && (db.htmlSerialize || !cp.test(c)) && (db.leadingWhitespace || !e.test(c)) && !dW[(dq.exec(c) || ["", ""])[1].toLowerCase()]) {
                    c = c.replace(d3, "<$1></$2>");
                    try {
                        for (; f < g; f++) {
                            d = this[f] || {};
                            if (d.nodeType === 1) {
                                dY.cleanData(dQ(d, false));
                                d.innerHTML = c
                            }
                        }
                        d = 0
                    } catch (b) {}
                }
                if (d) {
                    this.empty().append(c)
                }
            }, null , a, arguments.length)
        },
        replaceWith: function() {
            var a = arguments[0];
            this.domManip(arguments, function(b) {
                a = this.parentNode;
                dY.cleanData(dQ(this));
                if (a) {
                    a.replaceChild(b, this)
                }
            });
            return a && (a.length || a.nodeType) ? this : this.remove()
        },
        detach: function(a) {
            return this.remove(a, true)
        },
        domManip: function(g, a) {
            g = cY.apply([], g);
            var l, k, p, n, c, h, m = 0, o = this.length, d = this, b = o - 1, f = g[0], j = dY.isFunction(f);
            if (j || (o > 1 && typeof f === "string" && !db.checkClone && dw.test(f))) {
                return this.each(function(r) {
                    var q = d.eq(r);
                    if (j) {
                        g[0] = f.call(this, r, q.html())
                    }
                    q.domManip(g, a)
                })
            }
            if (o) {
                h = dY.buildFragment(g, this[0].ownerDocument, false, this);
                l = h.firstChild;
                if (h.childNodes.length === 1) {
                    h = l
                }
                if (l) {
                    n = dY.map(dQ(h, "script"), d2);
                    p = n.length;
                    for (; m < o; m++) {
                        k = h;
                        if (m !== b) {
                            k = dY.clone(k, true, true);
                            if (p) {
                                dY.merge(n, dQ(k, "script"))
                            }
                        }
                        a.call(this[m], k, m)
                    }
                    if (p) {
                        c = n[n.length - 1].ownerDocument;
                        dY.map(n, cU);
                        for (m = 0; m < p; m++) {
                            k = n[m];
                            if (cT.test(k.type || "") && !dY._data(k, "globalEval") && dY.contains(c, k)) {
                                if (k.src) {
                                    if (dY._evalUrl) {
                                        dY._evalUrl(k.src)
                                    }
                                } else {
                                    dY.globalEval((k.text || k.textContent || k.innerHTML || "").replace(d5, ""))
                                }
                            }
                        }
                    }
                    h = l = null
                }
            }
            return this
        }
    });
    dY.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(b, a) {
        dY.fn[b] = function(j) {
            var h, f = 0, g = [], c = dY(j), d = c.length - 1;
            for (; f <= d; f++) {
                h = f === d ? this : this.clone(true);
                dY(c[f])[a](h);
                c7.apply(g, h.get())
            }
            return this.pushStack(g)
        }
    });
    var eb, dd = {};
    function a7(c, b) {
        var a, f = dY(b.createElement(c)).appendTo(b.body), d = ed.getDefaultComputedStyle && (a = ed.getDefaultComputedStyle(f[0])) ? a.display : dY.css(f[0], "display");
        f.detach();
        return d
    }
    function ec(c) {
        var a = eB
            , b = dd[c];
        if (!b) {
            b = a7(c, a);
            if (b === "none" || !b) {
                eb = (eb || dY("<iframe frameborder='0' width='0' height='0'/>")).appendTo(a.documentElement);
                a = (eb[0].contentWindow || eb[0].contentDocument).document;
                a.write();
                a.close();
                b = a7(c, a);
                eb.detach()
            }
            dd[c] = b
        }
        return b
    }
    (function() {
        var a;
        db.shrinkWrapBlocks = function() {
            if (a != null ) {
                return a
            }
            a = false;
            var c, b, d;
            b = eB.getElementsByTagName("body")[0];
            if (!b || !b.style) {
                return
            }
            c = eB.createElement("div");
            d = eB.createElement("div");
            d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
            b.appendChild(d).appendChild(c);
            if (typeof c.style.zoom !== b8) {
                c.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1";
                c.appendChild(eB.createElement("div")).style.width = "5px";
                a = c.offsetWidth !== 3
            }
            b.removeChild(d);
            return a
        }
    })();
    var d9 = (/^margin/);
    var eA = new RegExp("^(" + eg + ")(?!px)[a-z%]+$","i");
    var dI, dh, cy = /^(top|right|bottom|left)$/;
    if (ed.getComputedStyle) {
        dI = function(a) {
            if (a.ownerDocument.defaultView.opener) {
                return a.ownerDocument.defaultView.getComputedStyle(a, null )
            }
            return ed.getComputedStyle(a, null )
        }
        ;
        dh = function(g, f, b) {
            var d, h, a, c, j = g.style;
            b = b || dI(g);
            c = b ? b.getPropertyValue(f) || b[f] : undefined;
            if (b) {
                if (c === "" && !dY.contains(g.ownerDocument, g)) {
                    c = dY.style(g, f)
                }
                if (eA.test(c) && d9.test(f)) {
                    d = j.width;
                    h = j.minWidth;
                    a = j.maxWidth;
                    j.minWidth = j.maxWidth = j.width = c;
                    c = b.width;
                    j.width = d;
                    j.minWidth = h;
                    j.maxWidth = a
                }
            }
            return c === undefined ? c : c + ""
        }
    } else {
        if (eB.documentElement.currentStyle) {
            dI = function(a) {
                return a.currentStyle
            }
            ;
            dh = function(g, h, a) {
                var b, f, d, j, c = g.style;
                a = a || dI(g);
                j = a ? a[h] : undefined;
                if (j == null  && c && c[h]) {
                    j = c[h]
                }
                if (eA.test(j) && !cy.test(h)) {
                    b = c.left;
                    f = g.runtimeStyle;
                    d = f && f.left;
                    if (d) {
                        f.left = g.currentStyle.left
                    }
                    c.left = h === "fontSize" ? "1em" : j;
                    j = c.pixelLeft + "px";
                    c.left = b;
                    if (d) {
                        f.left = d
                    }
                }
                return j === undefined ? j : j + "" || "auto"
            }
        }
    }
    function ep(b, a) {
        return {
            get: function() {
                var c = b();
                if (c == null ) {
                    return
                }
                if (c) {
                    delete this.get;
                    return
                }
                return (this.get = a).apply(this, arguments)
            }
        }
    }
    (function() {
        var g, a, h, b, j, f, d;
        g = eB.createElement("div");
        g.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
        h = g.getElementsByTagName("a")[0];
        a = h && h.style;
        if (!a) {
            return
        }
        a.cssText = "float:left;opacity:.5";
        db.opacity = a.opacity === "0.5";
        db.cssFloat = !!a.cssFloat;
        g.style.backgroundClip = "content-box";
        g.cloneNode(true).style.backgroundClip = "";
        db.clearCloneStyle = g.style.backgroundClip === "content-box";
        db.boxSizing = a.boxSizing === "" || a.MozBoxSizing === "" || a.WebkitBoxSizing === "";
        dY.extend(db, {
            reliableHiddenOffsets: function() {
                if (f == null ) {
                    c()
                }
                return f
            },
            boxSizingReliable: function() {
                if (j == null ) {
                    c()
                }
                return j
            },
            pixelPosition: function() {
                if (b == null ) {
                    c()
                }
                return b
            },
            reliableMarginRight: function() {
                if (d == null ) {
                    c()
                }
                return d
            }
        });
        function c() {
            var n, m, l, k;
            m = eB.getElementsByTagName("body")[0];
            if (!m || !m.style) {
                return
            }
            n = eB.createElement("div");
            l = eB.createElement("div");
            l.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px";
            m.appendChild(l).appendChild(n);
            n.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute";
            b = j = false;
            d = true;
            if (ed.getComputedStyle) {
                b = (ed.getComputedStyle(n, null ) || {}).top !== "1%";
                j = (ed.getComputedStyle(n, null ) || {
                        width: "4px"
                    }).width === "4px";
                k = n.appendChild(eB.createElement("div"));
                k.style.cssText = n.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0";
                k.style.marginRight = k.style.width = "0";
                n.style.width = "1px";
                d = !parseFloat((ed.getComputedStyle(k, null ) || {}).marginRight);
                n.removeChild(k)
            }
            n.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
            k = n.getElementsByTagName("td");
            k[0].style.cssText = "margin:0;border:0;padding:0;display:none";
            f = k[0].offsetHeight === 0;
            if (f) {
                k[0].style.display = "";
                k[1].style.display = "none";
                f = k[0].offsetHeight === 0
            }
            m.removeChild(l)
        }
    })();
    dY.swap = function(f, b, d, g) {
        var h, a, c = {};
        for (a in b) {
            c[a] = f.style[a];
            f.style[a] = b[a]
        }
        h = d.apply(f, g || []);
        for (a in b) {
            f.style[a] = c[a]
        }
        return h
    }
    ;
    var cO = /alpha\([^)]*\)/i
        , eu = /opacity\s*=\s*([^)]*)/
        , ef = /^(none|table(?!-c[ea]).+)/
        , c1 = new RegExp("^(" + eg + ")(.*)$","i")
        , cE = new RegExp("^([+-])=(" + eg + ")","i")
        , cW = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }
        , cZ = {
        letterSpacing: "0",
        fontWeight: "400"
    }
        , dK = ["Webkit", "O", "Moz", "ms"];
    function dy(c, f) {
        if (f in c) {
            return f
        }
        var a = f.charAt(0).toUpperCase() + f.slice(1)
            , b = f
            , d = dK.length;
        while (d--) {
            f = dK[d] + a;
            if (f in c) {
                return f
            }
        }
        return b
    }
    function cd(g, b) {
        var f, c, a, d = [], j = 0, h = g.length;
        for (; j < h; j++) {
            c = g[j];
            if (!c.style) {
                continue
            }
            d[j] = dY._data(c, "olddisplay");
            f = c.style.display;
            if (b) {
                if (!d[j] && f === "none") {
                    c.style.display = ""
                }
                if (c.style.display === "" && cc(c)) {
                    d[j] = dY._data(c, "olddisplay", ec(c.nodeName))
                }
            } else {
                a = cc(c);
                if (f && f !== "none" || !a) {
                    dY._data(c, "olddisplay", a ? f : dY.css(c, "display"))
                }
            }
        }
        for (j = 0; j < h; j++) {
            c = g[j];
            if (!c.style) {
                continue
            }
            if (!b || c.style.display === "none" || c.style.display === "") {
                c.style.display = b ? d[j] || "" : "none"
            }
        }
        return g
    }
    function dT(b, d, c) {
        var a = c1.exec(d);
        return a ? Math.max(0, a[1] - (c || 0)) + (a[2] || "px") : d
    }
    function dE(f, h, b, a, c) {
        var g = b === (a ? "border" : "content") ? 4 : h === "width" ? 1 : 0
            , d = 0;
        for (; g < 4; g += 2) {
            if (b === "margin") {
                d += dY.css(f, b + dn[g], true, c)
            }
            if (a) {
                if (b === "content") {
                    d -= dY.css(f, "padding" + dn[g], true, c)
                }
                if (b !== "margin") {
                    d -= dY.css(f, "border" + dn[g] + "Width", true, c)
                }
            } else {
                d += dY.css(f, "padding" + dn[g], true, c);
                if (b !== "padding") {
                    d += dY.css(f, "border" + dn[g] + "Width", true, c)
                }
            }
        }
        return d
    }
    function dN(f, a, c) {
        var g = true
            , b = a === "width" ? f.offsetWidth : f.offsetHeight
            , h = dI(f)
            , d = db.boxSizing && dY.css(f, "boxSizing", false, h) === "border-box";
        if (b <= 0 || b == null ) {
            b = dh(f, a, h);
            if (b < 0 || b == null ) {
                b = f.style[a]
            }
            if (eA.test(b)) {
                return b
            }
            g = d && (db.boxSizingReliable() || b === f.style[a]);
            b = parseFloat(b) || 0
        }
        return (b + dE(f, a, c || (d ? "border" : "content"), g, h)) + "px"
    }
    dY.extend({
        cssHooks: {
            opacity: {
                get: function(c, a) {
                    if (a) {
                        var b = dh(c, "opacity");
                        return b === "" ? "1" : b
                    }
                }
            }
        },
        cssNumber: {
            columnCount: true,
            fillOpacity: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            widows: true,
            zIndex: true,
            zoom: true
        },
        cssProps: {
            "float": db.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(g, l, b, f) {
            if (!g || g.nodeType === 3 || g.nodeType === 8 || !g.style) {
                return
            }
            var j, c, a, k = dY.camelCase(l), h = g.style;
            l = dY.cssProps[k] || (dY.cssProps[k] = dy(h, k));
            a = dY.cssHooks[l] || dY.cssHooks[k];
            if (b !== undefined) {
                c = typeof b;
                if (c === "string" && (j = cE.exec(b))) {
                    b = (j[1] + 1) * j[2] + parseFloat(dY.css(g, l));
                    c = "number"
                }
                if (b == null  || b !== b) {
                    return
                }
                if (c === "number" && !dY.cssNumber[k]) {
                    b += "px"
                }
                if (!db.clearCloneStyle && b === "" && l.indexOf("background") === 0) {
                    h[l] = "inherit"
                }
                if (!a || !("set" in a) || (b = a.set(g, b, f)) !== undefined) {
                    try {
                        h[l] = b
                    } catch (d) {}
                }
            } else {
                if (a && "get" in a && (j = a.get(g, false, f)) !== undefined) {
                    return j
                }
                return h[l]
            }
        },
        css: function(g, b, d, a) {
            var h, f, c, j = dY.camelCase(b);
            b = dY.cssProps[j] || (dY.cssProps[j] = dy(g.style, j));
            c = dY.cssHooks[b] || dY.cssHooks[j];
            if (c && "get" in c) {
                f = c.get(g, true, d)
            }
            if (f === undefined) {
                f = dh(g, b, a)
            }
            if (f === "normal" && b in cZ) {
                f = cZ[b]
            }
            if (d === "" || d) {
                h = parseFloat(f);
                return d === true || dY.isNumeric(h) ? h || 0 : f
            }
            return f
        }
    });
    dY.each(["height", "width"], function(b, a) {
        dY.cssHooks[a] = {
            get: function(d, f, c) {
                if (f) {
                    return ef.test(dY.css(d, "display")) && d.offsetWidth === 0 ? dY.swap(d, cW, function() {
                        return dN(d, a, c)
                    }) : dN(d, a, c)
                }
            },
            set: function(f, d, c) {
                var g = c && dI(f);
                return dT(f, d, c ? dE(f, a, c, db.boxSizing && dY.css(f, "boxSizing", false, g) === "border-box", g) : 0)
            }
        }
    });
    if (!db.opacity) {
        dY.cssHooks.opacity = {
            get: function(a, b) {
                return eu.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? (0.01 * parseFloat(RegExp.$1)) + "" : b ? "1" : ""
            },
            set: function(d, c) {
                var f = d.style
                    , a = d.currentStyle
                    , b = dY.isNumeric(c) ? "alpha(opacity=" + c * 100 + ")" : ""
                    , g = a && a.filter || f.filter || "";
                f.zoom = 1;
                if ((c >= 1 || c === "") && dY.trim(g.replace(cO, "")) === "" && f.removeAttribute) {
                    f.removeAttribute("filter");
                    if (c === "" || a && !a.filter) {
                        return
                    }
                }
                f.filter = cO.test(g) ? g.replace(cO, b) : g + " " + b
            }
        }
    }
    dY.cssHooks.marginRight = ep(db.reliableMarginRight, function(a, b) {
        if (b) {
            return dY.swap(a, {
                display: "inline-block"
            }, dh, [a, "marginRight"])
        }
    });
    dY.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(b, a) {
        dY.cssHooks[b + a] = {
            expand: function(d) {
                var f = 0
                    , g = {}
                    , c = typeof d === "string" ? d.split(" ") : [d];
                for (; f < 4; f++) {
                    g[b + dn[f] + a] = c[f] || c[f - 2] || c[0]
                }
                return g
            }
        };
        if (!d9.test(b)) {
            dY.cssHooks[b + a].set = dT
        }
    });
    dY.fn.extend({
        css: function(b, a) {
            return dx(this, function(f, j, d) {
                var g, k, c = {}, h = 0;
                if (dY.isArray(j)) {
                    g = dI(f);
                    k = j.length;
                    for (; h < k; h++) {
                        c[j[h]] = dY.css(f, j[h], false, g)
                    }
                    return c
                }
                return d !== undefined ? dY.style(f, j, d) : dY.css(f, j)
            }, b, a, arguments.length > 1)
        },
        show: function() {
            return cd(this, true)
        },
        hide: function() {
            return cd(this)
        },
        toggle: function(a) {
            if (typeof a === "boolean") {
                return a ? this.show() : this.hide()
            }
            return this.each(function() {
                if (cc(this)) {
                    dY(this).show()
                } else {
                    dY(this).hide()
                }
            })
        }
    });
    function cC(f, a, c, b, d) {
        return new cC.prototype.init(f,a,c,b,d)
    }
    dY.Tween = cC;
    cC.prototype = {
        constructor: cC,
        init: function(f, a, d, c, b, g) {
            this.elem = f;
            this.prop = d;
            this.easing = b || "swing";
            this.options = a;
            this.start = this.now = this.cur();
            this.end = c;
            this.unit = g || (dY.cssNumber[d] ? "" : "px")
        },
        cur: function() {
            var a = cC.propHooks[this.prop];
            return a && a.get ? a.get(this) : cC.propHooks._default.get(this)
        },
        run: function(c) {
            var a, b = cC.propHooks[this.prop];
            if (this.options.duration) {
                this.pos = a = dY.easing[this.easing](c, this.options.duration * c, 0, 1, this.options.duration)
            } else {
                this.pos = a = c
            }
            this.now = (this.end - this.start) * a + this.start;
            if (this.options.step) {
                this.options.step.call(this.elem, this.now, this)
            }
            if (b && b.set) {
                b.set(this)
            } else {
                cC.propHooks._default.set(this)
            }
            return this
        }
    };
    cC.prototype.init.prototype = cC.prototype;
    cC.propHooks = {
        _default: {
            get: function(a) {
                var b;
                if (a.elem[a.prop] != null  && (!a.elem.style || a.elem.style[a.prop] == null )) {
                    return a.elem[a.prop]
                }
                b = dY.css(a.elem, a.prop, "");
                return !b || b === "auto" ? 0 : b
            },
            set: function(a) {
                if (dY.fx.step[a.prop]) {
                    dY.fx.step[a.prop](a)
                } else {
                    if (a.elem.style && (a.elem.style[dY.cssProps[a.prop]] != null  || dY.cssHooks[a.prop])) {
                        dY.style(a.elem, a.prop, a.now + a.unit)
                    } else {
                        a.elem[a.prop] = a.now
                    }
                }
            }
        }
    };
    cC.propHooks.scrollTop = cC.propHooks.scrollLeft = {
        set: function(a) {
            if (a.elem.nodeType && a.elem.parentNode) {
                a.elem[a.prop] = a.now
            }
        }
    };
    dY.easing = {
        linear: function(a) {
            return a
        },
        swing: function(a) {
            return 0.5 - Math.cos(a * Math.PI) / 2
        }
    };
    dY.fx = cC.prototype.init;
    dY.fx.step = {};
    var co, ej, cr = /^(?:toggle|show|hide)$/, es = new RegExp("^(?:([+-])=|)(" + eg + ")([a-z%]*)$","i"), cx = /queueHooks$/, cR = [dB], dz = {
        "*": [function(k, h) {
            var a = this.createTween(k, h)
                , j = a.cur()
                , d = es.exec(h)
                , b = d && d[3] || (dY.cssNumber[k] ? "" : "px")
                , g = (dY.cssNumber[k] || b !== "px" && +j) && es.exec(dY.css(a.elem, k))
                , f = 1
                , c = 20;
            if (g && g[3] !== b) {
                b = b || g[3];
                d = d || [];
                g = +j || 1;
                do {
                    f = f || ".5";
                    g = g / f;
                    dY.style(a.elem, k, g + b)
                } while (f !== (f = a.cur() / j) && f !== 1 && --c)
            }
            if (d) {
                g = a.start = +g || +j || 0;
                a.unit = b;
                a.end = d[1] ? g + (d[1] + 1) * d[2] : +d[2]
            }
            return a
        }
        ]
    };
    function df() {
        setTimeout(function() {
            co = undefined
        });
        return ( co = dY.now())
    }
    function cl(d, a) {
        var c, b = {
            height: d
        }, f = 0;
        a = a ? 1 : 0;
        for (; f < 4; f += 2 - a) {
            c = dn[f];
            b["margin" + c] = b["padding" + c] = d
        }
        if (a) {
            b.opacity = b.width = d
        }
        return b
    }
    function cm(f, d, g) {
        var a, b = (dz[d] || []).concat(dz["*"]), c = 0, h = b.length;
        for (; c < h; c++) {
            if ((a = b[c].call(g, d, f)) ) {
                return a
            }
        }
    }
    function dB(o, r, d) {
        var j, l, m, g, f, h, a, k, n = this, q = {}, c = o.style, b = o.nodeType && cc(o), p = dY._data(o, "fxshow");
        if (!d.queue) {
            f = dY._queueHooks(o, "fx");
            if (f.unqueued == null ) {
                f.unqueued = 0;
                h = f.empty.fire;
                f.empty.fire = function() {
                    if (!f.unqueued) {
                        h()
                    }
                }
            }
            f.unqueued++;
            n.always(function() {
                n.always(function() {
                    f.unqueued--;
                    if (!dY.queue(o, "fx").length) {
                        f.empty.fire()
                    }
                })
            })
        }
        if (o.nodeType === 1 && ("height" in r || "width" in r)) {
            d.overflow = [c.overflow, c.overflowX, c.overflowY];
            a = dY.css(o, "display");
            k = a === "none" ? dY._data(o, "olddisplay") || ec(o.nodeName) : a;
            if (k === "inline" && dY.css(o, "float") === "none") {
                if (!db.inlineBlockNeedsLayout || ec(o.nodeName) === "inline") {
                    c.display = "inline-block"
                } else {
                    c.zoom = 1
                }
            }
        }
        if (d.overflow) {
            c.overflow = "hidden";
            if (!db.shrinkWrapBlocks()) {
                n.always(function() {
                    c.overflow = d.overflow[0];
                    c.overflowX = d.overflow[1];
                    c.overflowY = d.overflow[2]
                })
            }
        }
        for (j in r) {
            l = r[j];
            if (cr.exec(l)) {
                delete r[j];
                m = m || l === "toggle";
                if (l === (b ? "hide" : "show")) {
                    if (l === "show" && p && p[j] !== undefined) {
                        b = true
                    } else {
                        continue
                    }
                }
                q[j] = p && p[j] || dY.style(o, j)
            } else {
                a = undefined
            }
        }
        if (!dY.isEmptyObject(q)) {
            if (p) {
                if ("hidden" in p) {
                    b = p.hidden
                }
            } else {
                p = dY._data(o, "fxshow", {})
            }
            if (m) {
                p.hidden = !b
            }
            if (b) {
                dY(o).show()
            } else {
                n.done(function() {
                    dY(o).hide()
                })
            }
            n.done(function() {
                var s;
                dY._removeData(o, "fxshow");
                for (s in q) {
                    dY.style(o, s, q[s])
                }
            });
            for (j in q) {
                g = cm(b ? p[j] : 0, j, n);
                if (!(j in p)) {
                    p[j] = g.start;
                    if (b) {
                        g.end = g.start;
                        g.start = j === "width" || j === "height" ? 1 : 0
                    }
                }
            }
        } else {
            if ((a === "none" ? ec(o.nodeName) : a) === "inline") {
                c.display = a
            }
        }
    }
    function eI(g, f) {
        var h, a, b, d, c;
        for (h in g) {
            a = dY.camelCase(h);
            b = f[a];
            d = g[h];
            if (dY.isArray(d)) {
                b = d[1];
                d = g[h] = d[0]
            }
            if (h !== a) {
                g[a] = d;
                delete g[h]
            }
            c = dY.cssHooks[a];
            if (c && "expand" in c) {
                d = c.expand(d);
                delete g[a];
                for (h in d) {
                    if (!(h in g)) {
                        g[h] = d[h];
                        f[h] = b
                    }
                }
            } else {
                f[a] = b
            }
        }
    }
    function cM(h, g, b) {
        var a, m, k = 0, j = cR.length, c = dY.Deferred().always(function() {
            delete l.elem
        }), l = function() {
            if (m) {
                return false
            }
            var n = co || df()
                , q = Math.max(0, f.startTime + f.duration - n)
                , s = q / f.duration || 0
                , o = 1 - s
                , r = 0
                , p = f.tweens.length;
            for (; r < p; r++) {
                f.tweens[r].run(o)
            }
            c.notifyWith(h, [f, o, q]);
            if (o < 1 && p) {
                return q
            } else {
                c.resolveWith(h, [f]);
                return false
            }
        }
            , f = c.promise({
            elem: h,
            props: dY.extend({}, g),
            opts: dY.extend(true, {
                specialEasing: {}
            }, b),
            originalProperties: g,
            originalOptions: b,
            startTime: co || df(),
            duration: b.duration,
            tweens: [],
            createTween: function(n, p) {
                var o = dY.Tween(h, f.opts, n, p, f.opts.specialEasing[n] || f.opts.easing);
                f.tweens.push(o);
                return o
            },
            stop: function(o) {
                var p = 0
                    , n = o ? f.tweens.length : 0;
                if (m) {
                    return this
                }
                m = true;
                for (; p < n; p++) {
                    f.tweens[p].run(1)
                }
                if (o) {
                    c.resolveWith(h, [f, o])
                } else {
                    c.rejectWith(h, [f, o])
                }
                return this
            }
        }), d = f.props;
        eI(d, f.opts.specialEasing);
        for (; k < j; k++) {
            a = cR[k].call(f, h, d, f.opts);
            if (a) {
                return a
            }
        }
        dY.map(d, cm, f);
        if (dY.isFunction(f.opts.start)) {
            f.opts.start.call(h, f)
        }
        dY.fx.timer(dY.extend(l, {
            elem: h,
            anim: f,
            queue: f.opts.queue
        }));
        return f.progress(f.opts.progress).done(f.opts.done, f.opts.complete).fail(f.opts.fail).always(f.opts.always)
    }
    dY.Animation = dY.extend(cM, {
        tweener: function(a, c) {
            if (dY.isFunction(a)) {
                c = a;
                a = ["*"]
            } else {
                a = a.split(" ")
            }
            var d, b = 0, f = a.length;
            for (; b < f; b++) {
                d = a[b];
                dz[d] = dz[d] || [];
                dz[d].unshift(c)
            }
        },
        prefilter: function(a, b) {
            if (b) {
                cR.unshift(a)
            } else {
                cR.push(a)
            }
        }
    });
    dY.speed = function(d, c, a) {
        var b = d && typeof d === "object" ? dY.extend({}, d) : {
            complete: a || !a && c || dY.isFunction(d) && d,
            duration: d,
            easing: a && c || c && !dY.isFunction(c) && c
        };
        b.duration = dY.fx.off ? 0 : typeof b.duration === "number" ? b.duration : b.duration in dY.fx.speeds ? dY.fx.speeds[b.duration] : dY.fx.speeds._default;
        if (b.queue == null  || b.queue === true) {
            b.queue = "fx"
        }
        b.old = b.complete;
        b.complete = function() {
            if (dY.isFunction(b.old)) {
                b.old.call(this)
            }
            if (b.queue) {
                dY.dequeue(this, b.queue)
            }
        }
        ;
        return b
    }
    ;
    dY.fn.extend({
        fadeTo: function(b, c, d, a) {
            return this.filter(cc).css("opacity", 0).show().end().animate({
                opacity: c
            }, b, d, a)
        },
        animate: function(f, g, b, d) {
            var h = dY.isEmptyObject(f)
                , c = dY.speed(g, b, d)
                , a = function() {
                    var j = cM(this, dY.extend({}, f), c);
                    if (h || dY._data(this, "finish")) {
                        j.stop(true)
                    }
                }
                ;
            a.finish = a;
            return h || c.queue === false ? this.each(a) : this.queue(c.queue, a)
        },
        stop: function(d, a, b) {
            var c = function(g) {
                    var f = g.stop;
                    delete g.stop;
                    f(b)
                }
                ;
            if (typeof d !== "string") {
                b = a;
                a = d;
                d = undefined
            }
            if (a && d !== false) {
                this.queue(d || "fx", [])
            }
            return this.each(function() {
                var f = true
                    , j = d != null  && d + "queueHooks"
                    , g = dY.timers
                    , h = dY._data(this);
                if (j) {
                    if (h[j] && h[j].stop) {
                        c(h[j])
                    }
                } else {
                    for (j in h) {
                        if (h[j] && h[j].stop && cx.test(j)) {
                            c(h[j])
                        }
                    }
                }
                for (j = g.length; j--; ) {
                    if (g[j].elem === this && (d == null  || g[j].queue === d)) {
                        g[j].anim.stop(b);
                        f = false;
                        g.splice(j, 1)
                    }
                }
                if (f || !b) {
                    dY.dequeue(this, d)
                }
            })
        },
        finish: function(a) {
            if (a !== false) {
                a = a || "fx"
            }
            return this.each(function() {
                var g, c = dY._data(this), h = c[a + "queue"], b = c[a + "queueHooks"], d = dY.timers, f = h ? h.length : 0;
                c.finish = true;
                dY.queue(this, a, []);
                if (b && b.stop) {
                    b.stop.call(this, true)
                }
                for (g = d.length; g--; ) {
                    if (d[g].elem === this && d[g].queue === a) {
                        d[g].anim.stop(true);
                        d.splice(g, 1)
                    }
                }
                for (g = 0; g < f; g++) {
                    if (h[g] && h[g].finish) {
                        h[g].finish.call(this)
                    }
                }
                delete c.finish
            })
        }
    });
    dY.each(["toggle", "show", "hide"], function(c, a) {
        var b = dY.fn[a];
        dY.fn[a] = function(d, f, g) {
            return d == null  || typeof d === "boolean" ? b.apply(this, arguments) : this.animate(cl(a, true), d, f, g)
        }
    });
    dY.each({
        slideDown: cl("show"),
        slideUp: cl("hide"),
        slideToggle: cl("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(b, a) {
        dY.fn[b] = function(f, c, d) {
            return this.animate(a, f, c, d)
        }
    });
    dY.timers = [];
    dY.fx.tick = function() {
        var b, c = dY.timers, a = 0;
        co = dY.now();
        for (; a < c.length; a++) {
            b = c[a];
            if (!b() && c[a] === b) {
                c.splice(a--, 1)
            }
        }
        if (!c.length) {
            dY.fx.stop()
        }
        co = undefined
    }
    ;
    dY.fx.timer = function(a) {
        dY.timers.push(a);
        if (a()) {
            dY.fx.start()
        } else {
            dY.timers.pop()
        }
    }
    ;
    dY.fx.interval = 13;
    dY.fx.start = function() {
        if (!ej) {
            ej = setInterval(dY.fx.tick, dY.fx.interval)
        }
    }
    ;
    dY.fx.stop = function() {
        clearInterval(ej);
        ej = null
    }
    ;
    dY.fx.speeds = {
        slow: 600,
        fast: 200,
        _default: 400
    };
    dY.fn.delay = function(a, b) {
        a = dY.fx ? dY.fx.speeds[a] || a : a;
        b = b || "fx";
        return this.queue(b, function(d, f) {
            var c = setTimeout(d, a);
            f.stop = function() {
                clearTimeout(c)
            }
        })
    }
    ;
    (function() {
        var f, c, b, a, d;
        c = eB.createElement("div");
        c.setAttribute("className", "t");
        c.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
        a = c.getElementsByTagName("a")[0];
        b = eB.createElement("select");
        d = b.appendChild(eB.createElement("option"));
        f = c.getElementsByTagName("input")[0];
        a.style.cssText = "top:1px";
        db.getSetAttribute = c.className !== "t";
        db.style = /top/.test(a.getAttribute("style"));
        db.hrefNormalized = a.getAttribute("href") === "/a";
        db.checkOn = !!f.value;
        db.optSelected = d.selected;
        db.enctype = !!eB.createElement("form").enctype;
        b.disabled = true;
        db.optDisabled = !d.disabled;
        f = eB.createElement("input");
        f.setAttribute("value", "");
        db.input = f.getAttribute("value") === "";
        f.value = "t";
        f.setAttribute("type", "radio");
        db.radioValue = f.value === "t"
    })();
    var b7 = /\r/g;
    dY.fn.extend({
        val: function(d) {
            var c, a, b, f = this[0];
            if (!arguments.length) {
                if (f) {
                    c = dY.valHooks[f.type] || dY.valHooks[f.nodeName.toLowerCase()];
                    if (c && "get" in c && (a = c.get(f, "value")) !== undefined) {
                        return a
                    }
                    a = f.value;
                    return typeof a === "string" ? a.replace(b7, "") : a == null  ? "" : a
                }
                return
            }
            b = dY.isFunction(d);
            return this.each(function(h) {
                var g;
                if (this.nodeType !== 1) {
                    return
                }
                if (b) {
                    g = d.call(this, h, dY(this).val())
                } else {
                    g = d
                }
                if (g == null ) {
                    g = ""
                } else {
                    if (typeof g === "number") {
                        g += ""
                    } else {
                        if (dY.isArray(g)) {
                            g = dY.map(g, function(j) {
                                return j == null  ? "" : j + ""
                            })
                        }
                    }
                }
                c = dY.valHooks[this.type] || dY.valHooks[this.nodeName.toLowerCase()];
                if (!c || !("set" in c) || c.set(this, g, "value") === undefined) {
                    this.value = g
                }
            })
        }
    });
    dY.extend({
        valHooks: {
            option: {
                get: function(b) {
                    var a = dY.find.attr(b, "value");
                    return a != null  ? a : dY.trim(dY.text(b))
                }
            },
            select: {
                get: function(k) {
                    var f, d, a = k.options, h = k.selectedIndex, j = k.type === "select-one" || h < 0, b = j ? null  : [], g = j ? h + 1 : a.length, c = h < 0 ? g : j ? h : 0;
                    for (; c < g; c++) {
                        d = a[c];
                        if ((d.selected || c === h) && (db.optDisabled ? !d.disabled : d.getAttribute("disabled") === null ) && (!d.parentNode.disabled || !dY.nodeName(d.parentNode, "optgroup"))) {
                            f = dY(d).val();
                            if (j) {
                                return f
                            }
                            b.push(f)
                        }
                    }
                    return b
                },
                set: function(g, b) {
                    var f, a, h = g.options, d = dY.makeArray(b), c = h.length;
                    while (c--) {
                        a = h[c];
                        if (dY.inArray(dY.valHooks.option.get(a), d) >= 0) {
                            try {
                                a.selected = f = true
                            } catch (j) {
                                a.scrollHeight
                            }
                        } else {
                            a.selected = false
                        }
                    }
                    if (!f) {
                        g.selectedIndex = -1
                    }
                    return h
                }
            }
        }
    });
    dY.each(["radio", "checkbox"], function() {
        dY.valHooks[this] = {
            set: function(b, a) {
                if (dY.isArray(a)) {
                    return ( b.checked = dY.inArray(dY(b).val(), a) >= 0)
                }
            }
        };
        if (!db.checkOn) {
            dY.valHooks[this].get = function(a) {
                return a.getAttribute("value") === null  ? "on" : a.value
            }
        }
    });
    var ew, cI, cN = dY.expr.attrHandle, cJ = /^(?:checked|selected)$/i, dm = db.getSetAttribute, cA = db.input;
    dY.fn.extend({
        attr: function(b, a) {
            return dx(this, dY.attr, b, a, arguments.length > 1)
        },
        removeAttr: function(a) {
            return this.each(function() {
                dY.removeAttr(this, a)
            })
        }
    });
    dY.extend({
        attr: function(d, f, c) {
            var b, g, a = d.nodeType;
            if (!d || a === 3 || a === 8 || a === 2) {
                return
            }
            if (typeof d.getAttribute === b8) {
                return dY.prop(d, f, c)
            }
            if (a !== 1 || !dY.isXMLDoc(d)) {
                f = f.toLowerCase();
                b = dY.attrHooks[f] || (dY.expr.match.bool.test(f) ? cI : ew)
            }
            if (c !== undefined) {
                if (c === null ) {
                    dY.removeAttr(d, f)
                } else {
                    if (b && "set" in b && (g = b.set(d, c, f)) !== undefined) {
                        return g
                    } else {
                        d.setAttribute(f, c + "");
                        return c
                    }
                }
            } else {
                if (b && "get" in b && (g = b.get(d, f)) !== null ) {
                    return g
                } else {
                    g = dY.find.attr(d, f);
                    return g == null  ? undefined : g
                }
            }
        },
        removeAttr: function(f, d) {
            var c, b, g = 0, a = d && d.match(eF);
            if (a && f.nodeType === 1) {
                while ((c = a[g++]) ) {
                    b = dY.propFix[c] || c;
                    if (dY.expr.match.bool.test(c)) {
                        if (cA && dm || !cJ.test(c)) {
                            f[b] = false
                        } else {
                            f[dY.camelCase("default-" + c)] = f[b] = false
                        }
                    } else {
                        dY.attr(f, c, "")
                    }
                    f.removeAttribute(dm ? c : b)
                }
            }
        },
        attrHooks: {
            type: {
                set: function(b, a) {
                    if (!db.radioValue && a === "radio" && dY.nodeName(b, "input")) {
                        var c = b.value;
                        b.setAttribute("type", a);
                        if (c) {
                            b.value = c
                        }
                        return a
                    }
                }
            }
        }
    });
    cI = {
        set: function(a, c, b) {
            if (c === false) {
                dY.removeAttr(a, b)
            } else {
                if (cA && dm || !cJ.test(b)) {
                    a.setAttribute(!dm && dY.propFix[b] || b, b)
                } else {
                    a[dY.camelCase("default-" + b)] = a[b] = true
                }
            }
            return b
        }
    };
    dY.each(dY.expr.match.bool.source.match(/\w+/g), function(b, c) {
        var a = cN[c] || dY.find.attr;
        cN[c] = cA && dm || !cJ.test(c) ? function(h, j, d) {
            var f, g;
            if (!d) {
                g = cN[j];
                cN[j] = f;
                f = a(h, j, d) != null  ? j.toLowerCase() : null ;
                cN[j] = g
            }
            return f
        }
            : function(g, d, f) {
            if (!f) {
                return g[dY.camelCase("default-" + d)] ? d.toLowerCase() : null
            }
        }
    });
    if (!cA || !dm) {
        dY.attrHooks.value = {
            set: function(a, c, b) {
                if (dY.nodeName(a, "input")) {
                    a.defaultValue = c
                } else {
                    return ew && ew.set(a, c, b)
                }
            }
        }
    }
    if (!dm) {
        ew = {
            set: function(d, c, a) {
                var b = d.getAttributeNode(a);
                if (!b) {
                    d.setAttributeNode((b = d.ownerDocument.createAttribute(a)))
                }
                b.value = c += "";
                if (a === "value" || c === d.getAttribute(a)) {
                    return c
                }
            }
        };
        cN.id = cN.name = cN.coords = function(d, a, c) {
            var b;
            if (!c) {
                return (b = d.getAttributeNode(a)) && b.value !== "" ? b.value : null
            }
        }
        ;
        dY.valHooks.button = {
            get: function(c, a) {
                var b = c.getAttributeNode(a);
                if (b && b.specified) {
                    return b.value
                }
            },
            set: ew.set
        };
        dY.attrHooks.contenteditable = {
            set: function(a, c, b) {
                ew.set(a, c === "" ? false : c, b)
            }
        };
        dY.each(["width", "height"], function(b, a) {
            dY.attrHooks[a] = {
                set: function(c, d) {
                    if (d === "") {
                        c.setAttribute(a, "auto");
                        return d
                    }
                }
            }
        })
    }
    if (!db.style) {
        dY.attrHooks.style = {
            get: function(a) {
                return a.style.cssText || undefined
            },
            set: function(b, a) {
                return ( b.style.cssText = a + "")
            }
        }
    }
    var cS = /^(?:input|select|textarea|button|object)$/i
        , eq = /^(?:a|area)$/i;
    dY.fn.extend({
        prop: function(b, a) {
            return dx(this, dY.prop, b, a, arguments.length > 1)
        },
        removeProp: function(a) {
            a = dY.propFix[a] || a;
            return this.each(function() {
                try {
                    this[a] = undefined;
                    delete this[a]
                } catch (b) {}
            })
        }
    });
    dY.extend({
        propFix: {
            "for": "htmlFor",
            "class": "className"
        },
        prop: function(f, g, b) {
            var h, d, c, a = f.nodeType;
            if (!f || a === 3 || a === 8 || a === 2) {
                return
            }
            c = a !== 1 || !dY.isXMLDoc(f);
            if (c) {
                g = dY.propFix[g] || g;
                d = dY.propHooks[g]
            }
            if (b !== undefined) {
                return d && "set" in d && (h = d.set(f, b, g)) !== undefined ? h : (f[g] = b)
            } else {
                return d && "get" in d && (h = d.get(f, g)) !== null  ? h : f[g]
            }
        },
        propHooks: {
            tabIndex: {
                get: function(a) {
                    var b = dY.find.attr(a, "tabindex");
                    return b ? parseInt(b, 10) : cS.test(a.nodeName) || eq.test(a.nodeName) && a.href ? 0 : -1
                }
            }
        }
    });
    if (!db.hrefNormalized) {
        dY.each(["href", "src"], function(b, a) {
            dY.propHooks[a] = {
                get: function(c) {
                    return c.getAttribute(a, 4)
                }
            }
        })
    }
    if (!db.optSelected) {
        dY.propHooks.selected = {
            get: function(a) {
                var b = a.parentNode;
                if (b) {
                    b.selectedIndex;
                    if (b.parentNode) {
                        b.parentNode.selectedIndex
                    }
                }
                return null
            }
        }
    }
    dY.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function() {
        dY.propFix[this.toLowerCase()] = this
    });
    if (!db.enctype) {
        dY.propFix.enctype = "encoding"
    }
    var cV = /[\t\r\n\f]/g;
    dY.fn.extend({
        addClass: function(b) {
            var f, g, a, h, k, l, j = 0, d = this.length, c = typeof b === "string" && b;
            if (dY.isFunction(b)) {
                return this.each(function(m) {
                    dY(this).addClass(b.call(this, m, this.className))
                })
            }
            if (c) {
                f = (b || "").match(eF) || [];
                for (; j < d; j++) {
                    g = this[j];
                    a = g.nodeType === 1 && (g.className ? (" " + g.className + " ").replace(cV, " ") : " ");
                    if (a) {
                        k = 0;
                        while ((h = f[k++]) ) {
                            if (a.indexOf(" " + h + " ") < 0) {
                                a += h + " "
                            }
                        }
                        l = dY.trim(a);
                        if (g.className !== l) {
                            g.className = l
                        }
                    }
                }
            }
            return this
        },
        removeClass: function(b) {
            var f, g, a, h, k, l, j = 0, d = this.length, c = arguments.length === 0 || typeof b === "string" && b;
            if (dY.isFunction(b)) {
                return this.each(function(m) {
                    dY(this).removeClass(b.call(this, m, this.className))
                })
            }
            if (c) {
                f = (b || "").match(eF) || [];
                for (; j < d; j++) {
                    g = this[j];
                    a = g.nodeType === 1 && (g.className ? (" " + g.className + " ").replace(cV, " ") : "");
                    if (a) {
                        k = 0;
                        while ((h = f[k++]) ) {
                            while (a.indexOf(" " + h + " ") >= 0) {
                                a = a.replace(" " + h + " ", " ")
                            }
                        }
                        l = b ? dY.trim(a) : "";
                        if (g.className !== l) {
                            g.className = l
                        }
                    }
                }
            }
            return this
        },
        toggleClass: function(c, b) {
            var a = typeof c;
            if (typeof b === "boolean" && a === "string") {
                return b ? this.addClass(c) : this.removeClass(c)
            }
            if (dY.isFunction(c)) {
                return this.each(function(d) {
                    dY(this).toggleClass(c.call(this, d, this.className, b), b)
                })
            }
            return this.each(function() {
                if (a === "string") {
                    var f, g = 0, h = dY(this), d = c.match(eF) || [];
                    while ((f = d[g++]) ) {
                        if (h.hasClass(f)) {
                            h.removeClass(f)
                        } else {
                            h.addClass(f)
                        }
                    }
                } else {
                    if (a === b8 || a === "boolean") {
                        if (this.className) {
                            dY._data(this, "__className__", this.className)
                        }
                        this.className = this.className || c === false ? "" : dY._data(this, "__className__") || ""
                    }
                }
            })
        },
        hasClass: function(b) {
            var a = " " + b + " "
                , c = 0
                , d = this.length;
            for (; c < d; c++) {
                if (this[c].nodeType === 1 && (" " + this[c].className + " ").replace(cV, " ").indexOf(a) >= 0) {
                    return true
                }
            }
            return false
        }
    });
    dY.each(("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu").split(" "), function(b, a) {
        dY.fn[a] = function(d, c) {
            return arguments.length > 0 ? this.on(a, null , d, c) : this.trigger(a)
        }
    });
    dY.fn.extend({
        hover: function(b, a) {
            return this.mouseenter(b).mouseleave(a || b)
        },
        bind: function(b, c, a) {
            return this.on(b, null , c, a)
        },
        unbind: function(b, a) {
            return this.off(b, null , a)
        },
        delegate: function(b, a, c, d) {
            return this.on(a, b, c, d)
        },
        undelegate: function(b, a, c) {
            return arguments.length === 1 ? this.off(b, "**") : this.off(a, b || "**", c)
        }
    });
    var dk = dY.now();
    var cQ = (/\?/);
    var d0 = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;
    dY.parseJSON = function(b) {
        if (ed.JSON && ed.JSON.parse) {
            return ed.JSON.parse(b + "")
        }
        var c, d = null , a = dY.trim(b + "");
        return a && !dY.trim(a.replace(d0, function(g, j, h, f) {
            if (c && j) {
                d = 0
            }
            if (d === 0) {
                return g
            }
            c = h || j;
            d += !f - !h;
            return ""
        })) ? (Function("return " + a))() : dY.error("Invalid JSON: " + b)
    }
    ;
    dY.parseXML = function(c) {
        var a, d;
        if (!c || typeof c !== "string") {
            return null
        }
        try {
            if (ed.DOMParser) {
                d = new DOMParser();
                a = d.parseFromString(c, "text/xml")
            } else {
                a = new ActiveXObject("Microsoft.XMLDOM");
                a.async = "false";
                a.loadXML(c)
            }
        } catch (b) {
            a = undefined
        }
        if (!a || !a.documentElement || a.getElementsByTagName("parsererror").length) {
            dY.error("Invalid XML: " + c)
        }
        return a
    }
    ;
    var ea, cf, dU = /#.*$/, eG = /([?&])_=[^&]*/, dO = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, cs = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, cq = /^(?:GET|HEAD)$/, cw = /^\/\//, eC = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, a8 = {}, i = {}, ch = "*/".concat("*");
    try {
        cf = location.href
    } catch (dR) {
        cf = eB.createElement("a");
        cf.href = "";
        cf = cf.href
    }
    ea = eC.exec(cf.toLowerCase()) || [];
    function dA(a) {
        return function(c, b) {
            if (typeof c !== "string") {
                b = c;
                c = "*"
            }
            var g, f = 0, d = c.toLowerCase().match(eF) || [];
            if (dY.isFunction(b)) {
                while ((g = d[f++]) ) {
                    if (g.charAt(0) === "+") {
                        g = g.slice(1) || "*";
                        (a[g] = a[g] || []).unshift(b)
                    } else {
                        (a[g] = a[g] || []).push(b)
                    }
                }
            }
        }
    }
    function dc(f, h, d, g) {
        var a = {}
            , c = (f === i);
        function b(k) {
            var j;
            a[k] = true;
            dY.each(f[k] || [], function(n, l) {
                var m = l(h, d, g);
                if (typeof m === "string" && !c && !a[m]) {
                    h.dataTypes.unshift(m);
                    b(m);
                    return false
                } else {
                    if (c) {
                        return !(j = m)
                    }
                }
            });
            return j
        }
        return b(h.dataTypes[0]) || !a["*"] && b("*")
    }
    function el(f, d) {
        var c, a, b = dY.ajaxSettings.flatOptions || {};
        for (a in d) {
            if (d[a] !== undefined) {
                (b[a] ? f : (c || (c = {})))[a] = d[a]
            }
        }
        if (c) {
            dY.extend(true, f, c)
        }
        return f
    }
    function b6(a, b, j) {
        var k, d, f, h, g = a.contents, c = a.dataTypes;
        while (c[0] === "*") {
            c.shift();
            if (d === undefined) {
                d = a.mimeType || b.getResponseHeader("Content-Type")
            }
        }
        if (d) {
            for (h in g) {
                if (g[h] && g[h].test(d)) {
                    c.unshift(h);
                    break
                }
            }
        }
        if (c[0] in j) {
            f = c[0]
        } else {
            for (h in j) {
                if (!c[0] || a.converters[h + " " + c[0]]) {
                    f = h;
                    break
                }
                if (!k) {
                    k = h
                }
            }
            f = f || k
        }
        if (f) {
            if (f !== c[0]) {
                c.unshift(f)
            }
            return j[f]
        }
    }
    function ee(a, h, d, n) {
        var l, j, c, m, k, b = {}, f = a.dataTypes.slice();
        if (f[1]) {
            for (c in a.converters) {
                b[c.toLowerCase()] = a.converters[c]
            }
        }
        j = f.shift();
        while (j) {
            if (a.responseFields[j]) {
                d[a.responseFields[j]] = h
            }
            if (!k && n && a.dataFilter) {
                h = a.dataFilter(h, a.dataType)
            }
            k = j;
            j = f.shift();
            if (j) {
                if (j === "*") {
                    j = k
                } else {
                    if (k !== "*" && k !== j) {
                        c = b[k + " " + j] || b["* " + j];
                        if (!c) {
                            for (l in b) {
                                m = l.split(" ");
                                if (m[1] === j) {
                                    c = b[k + " " + m[0]] || b["* " + m[0]];
                                    if (c) {
                                        if (c === true) {
                                            c = b[l]
                                        } else {
                                            if (b[l] !== true) {
                                                j = m[0];
                                                f.unshift(m[1])
                                            }
                                        }
                                        break
                                    }
                                }
                            }
                        }
                        if (c !== true) {
                            if (c && a["throws"]) {
                                h = c(h)
                            } else {
                                try {
                                    h = c(h)
                                } catch (g) {
                                    return {
                                        state: "parsererror",
                                        error: c ? g : "No conversion from " + k + " to " + j
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return {
            state: "success",
            data: h
        }
    }
    dY.extend({
        active: 0,
        lastModified: {},
        etag: {},
        ajaxSettings: {
            url: cf,
            type: "GET",
            isLocal: cs.test(ea[1]),
            global: true,
            processData: true,
            async: true,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            accepts: {
                "*": ch,
                text: "text/plain",
                html: "text/html",
                xml: "application/xml, text/xml",
                json: "application/json, text/javascript"
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText",
                json: "responseJSON"
            },
            converters: {
                "* text": String,
                "text html": true,
                "text json": dY.parseJSON,
                "text xml": dY.parseXML
            },
            flatOptions: {
                url: true,
                context: true
            }
        },
        ajaxSetup: function(a, b) {
            return b ? el(el(a, dY.ajaxSettings), b) : el(dY.ajaxSettings, a)
        },
        ajaxPrefilter: dA(a8),
        ajaxTransport: dA(i),
        ajax: function(q, t) {
            if (typeof q === "object") {
                t = q;
                q = undefined
            }
            t = t || {};
            var j, g, y, a, n, u, f, s, o = dY.ajaxSetup({}, t), v = o.context || o, l = o.context && (v.nodeType || v.jquery) ? dY(v) : dY.event, w = dY.Deferred(), c = dY.Callbacks("once memory"), x = o.statusCode || {}, k = {}, b = {}, r = 0, p = "canceled", h = {
                readyState: 0,
                getResponseHeader: function(z) {
                    var A;
                    if (r === 2) {
                        if (!s) {
                            s = {};
                            while ((A = dO.exec(a)) ) {
                                s[A[1].toLowerCase()] = A[2]
                            }
                        }
                        A = s[z.toLowerCase()]
                    }
                    return A == null  ? null  : A
                },
                getAllResponseHeaders: function() {
                    return r === 2 ? a : null
                },
                setRequestHeader: function(A, B) {
                    var z = A.toLowerCase();
                    if (!r) {
                        A = b[z] = b[z] || A;
                        k[A] = B
                    }
                    return this
                },
                overrideMimeType: function(z) {
                    if (!r) {
                        o.mimeType = z
                    }
                    return this
                },
                statusCode: function(z) {
                    var A;
                    if (z) {
                        if (r < 2) {
                            for (A in z) {
                                x[A] = [x[A], z[A]]
                            }
                        } else {
                            h.always(z[h.status])
                        }
                    }
                    return this
                },
                abort: function(z) {
                    var A = z || p;
                    if (f) {
                        f.abort(A)
                    }
                    m(0, A);
                    return this
                }
            };
            w.promise(h).complete = c.add;
            h.success = h.done;
            h.error = h.fail;
            o.url = ((q || o.url || cf) + "").replace(dU, "").replace(cw, ea[1] + "//");
            o.type = t.method || t.type || o.method || o.type;
            o.dataTypes = dY.trim(o.dataType || "*").toLowerCase().match(eF) || [""];
            if (o.crossDomain == null ) {
                j = eC.exec(o.url.toLowerCase());
                o.crossDomain = !!(j && (j[1] !== ea[1] || j[2] !== ea[2] || (j[3] || (j[1] === "http:" ? "80" : "443")) !== (ea[3] || (ea[1] === "http:" ? "80" : "443"))))
            }
            if (o.data && o.processData && typeof o.data !== "string") {
                o.data = dY.param(o.data, o.traditional)
            }
            dc(a8, o, t, h);
            if (r === 2) {
                return h
            }
            u = dY.event && o.global;
            if (u && dY.active++ === 0) {
                dY.event.trigger("ajaxStart")
            }
            o.type = o.type.toUpperCase();
            o.hasContent = !cq.test(o.type);
            y = o.url;
            if (!o.hasContent) {
                if (o.data) {
                    y = (o.url += (cQ.test(y) ? "&" : "?") + o.data);
                    delete o.data
                }
                if (o.cache === false) {
                    o.url = eG.test(y) ? y.replace(eG, "$1_=" + dk++) : y + (cQ.test(y) ? "&" : "?") + "_=" + dk++
                }
            }
            if (o.ifModified) {
                if (dY.lastModified[y]) {
                    h.setRequestHeader("If-Modified-Since", dY.lastModified[y])
                }
                if (dY.etag[y]) {
                    h.setRequestHeader("If-None-Match", dY.etag[y])
                }
            }
            if (o.data && o.hasContent && o.contentType !== false || t.contentType) {
                h.setRequestHeader("Content-Type", o.contentType)
            }
            h.setRequestHeader("Accept", o.dataTypes[0] && o.accepts[o.dataTypes[0]] ? o.accepts[o.dataTypes[0]] + (o.dataTypes[0] !== "*" ? ", " + ch + "; q=0.01" : "") : o.accepts["*"]);
            for (g in o.headers) {
                h.setRequestHeader(g, o.headers[g])
            }
            if (o.beforeSend && (o.beforeSend.call(v, h, o) === false || r === 2)) {
                return h.abort()
            }
            p = "abort";
            for (g in {
                success: 1,
                error: 1,
                complete: 1
            }) {
                h[g](o[g])
            }
            f = dc(i, o, t, h);
            if (!f) {
                m(-1, "No Transport")
            } else {
                h.readyState = 1;
                if (u) {
                    l.trigger("ajaxSend", [h, o])
                }
                if (o.async && o.timeout > 0) {
                    n = setTimeout(function() {
                        h.abort("timeout")
                    }, o.timeout)
                }
                try {
                    r = 1;
                    f.send(k, m)
                } catch (d) {
                    if (r < 2) {
                        m(-1, d)
                    } else {
                        throw d
                    }
                }
            }
            function m(z, I, H, B) {
                var D, E, G, A, F, C = I;
                if (r === 2) {
                    return
                }
                r = 2;
                if (n) {
                    clearTimeout(n)
                }
                f = undefined;
                a = B || "";
                h.readyState = z > 0 ? 4 : 0;
                D = z >= 200 && z < 300 || z === 304;
                if (H) {
                    A = b6(o, h, H)
                }
                A = ee(o, A, h, D);
                if (D) {
                    if (o.ifModified) {
                        F = h.getResponseHeader("Last-Modified");
                        if (F) {
                            dY.lastModified[y] = F
                        }
                        F = h.getResponseHeader("etag");
                        if (F) {
                            dY.etag[y] = F
                        }
                    }
                    if (z === 204 || o.type === "HEAD") {
                        C = "nocontent"
                    } else {
                        if (z === 304) {
                            C = "notmodified"
                        } else {
                            C = A.state;
                            E = A.data;
                            G = A.error;
                            D = !G
                        }
                    }
                } else {
                    G = C;
                    if (z || !C) {
                        C = "error";
                        if (z < 0) {
                            z = 0
                        }
                    }
                }
                h.status = z;
                h.statusText = (I || C) + "";
                if (D) {
                    w.resolveWith(v, [E, C, h])
                } else {
                    w.rejectWith(v, [h, C, G])
                }
                h.statusCode(x);
                x = undefined;
                if (u) {
                    l.trigger(D ? "ajaxSuccess" : "ajaxError", [h, o, D ? E : G])
                }
                c.fireWith(v, [h, C]);
                if (u) {
                    l.trigger("ajaxComplete", [h, o]);
                    if (!(--dY.active)) {
                        dY.event.trigger("ajaxStop")
                    }
                }
            }
            return h
        },
        getJSON: function(b, a, c) {
            return dY.get(b, a, c, "json")
        },
        getScript: function(b, a) {
            return dY.get(b, undefined, a, "script")
        }
    });
    dY.each(["get", "post"], function(a, b) {
        dY[b] = function(c, f, d, g) {
            if (dY.isFunction(f)) {
                g = g || d;
                d = f;
                f = undefined
            }
            return dY.ajax({
                url: c,
                type: b,
                dataType: g,
                data: f,
                success: d
            })
        }
    });
    dY._evalUrl = function(a) {
        return dY.ajax({
            url: a,
            type: "GET",
            dataType: "script",
            async: false,
            global: false,
            "throws": true
        })
    }
    ;
    dY.fn.extend({
        wrapAll: function(b) {
            if (dY.isFunction(b)) {
                return this.each(function(c) {
                    dY(this).wrapAll(b.call(this, c))
                })
            }
            if (this[0]) {
                var a = dY(b, this[0].ownerDocument).eq(0).clone(true);
                if (this[0].parentNode) {
                    a.insertBefore(this[0])
                }
                a.map(function() {
                    var c = this;
                    while (c.firstChild && c.firstChild.nodeType === 1) {
                        c = c.firstChild
                    }
                    return c
                }).append(this)
            }
            return this
        },
        wrapInner: function(a) {
            if (dY.isFunction(a)) {
                return this.each(function(b) {
                    dY(this).wrapInner(a.call(this, b))
                })
            }
            return this.each(function() {
                var b = dY(this)
                    , c = b.contents();
                if (c.length) {
                    c.wrapAll(a)
                } else {
                    b.append(a)
                }
            })
        },
        wrap: function(b) {
            var a = dY.isFunction(b);
            return this.each(function(c) {
                dY(this).wrapAll(a ? b.call(this, c) : b)
            })
        },
        unwrap: function() {
            return this.parent().each(function() {
                if (!dY.nodeName(this, "body")) {
                    dY(this).replaceWith(this.childNodes)
                }
            }).end()
        }
    });
    dY.expr.filters.hidden = function(a) {
        return a.offsetWidth <= 0 && a.offsetHeight <= 0 || (!db.reliableHiddenOffsets() && ((a.style && a.style.display) || dY.css(a, "display")) === "none")
    }
    ;
    dY.expr.filters.visible = function(a) {
        return !dY.expr.filters.hidden(a)
    }
    ;
    var cG = /%20/g
        , dX = /\[\]$/
        , cv = /\r?\n/g
        , ex = /^(?:submit|button|image|reset|file)$/i
        , cg = /^(?:input|select|textarea|keygen)/i;
    function en(f, c, a, d) {
        var b;
        if (dY.isArray(c)) {
            dY.each(c, function(g, h) {
                if (a || dX.test(f)) {
                    d(f, h)
                } else {
                    en(f + "[" + (typeof h === "object" ? g : "") + "]", h, a, d)
                }
            })
        } else {
            if (!a && dY.type(c) === "object") {
                for (b in c) {
                    en(f + "[" + b + "]", c[b], a, d)
                }
            } else {
                d(f, c)
            }
        }
    }
    dY.param = function(c, f) {
        var d, a = [], b = function(h, g) {
                g = dY.isFunction(g) ? g() : (g == null  ? "" : g);
                a[a.length] = encodeURIComponent(h) + "=" + encodeURIComponent(g)
            }
            ;
        if (f === undefined) {
            f = dY.ajaxSettings && dY.ajaxSettings.traditional
        }
        if (dY.isArray(c) || (c.jquery && !dY.isPlainObject(c))) {
            dY.each(c, function() {
                b(this.name, this.value)
            })
        } else {
            for (d in c) {
                en(d, c[d], f, b)
            }
        }
        return a.join("&").replace(cG, "+")
    }
    ;
    dY.fn.extend({
        serialize: function() {
            return dY.param(this.serializeArray())
        },
        serializeArray: function() {
            return this.map(function() {
                var a = dY.prop(this, "elements");
                return a ? dY.makeArray(a) : this
            }).filter(function() {
                var a = this.type;
                return this.name && !dY(this).is(":disabled") && cg.test(this.nodeName) && !ex.test(a) && (this.checked || !da.test(a))
            }).map(function(a, c) {
                var b = dY(this).val();
                return b == null  ? null  : dY.isArray(b) ? dY.map(b, function(d) {
                    return {
                        name: c.name,
                        value: d.replace(cv, "\r\n")
                    }
                }) : {
                    name: c.name,
                    value: b.replace(cv, "\r\n")
                }
            }).get()
        }
    });
    dY.ajaxSettings.xhr = ed.ActiveXObject !== undefined ? function() {
        return !this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && dg() || dF()
    }
        : dg;
    var dZ = 0
        , ds = {}
        , c8 = dY.ajaxSettings.xhr();
    if (ed.attachEvent) {
        ed.attachEvent("onunload", function() {
            for (var a in ds) {
                ds[a](undefined, true)
            }
        })
    }
    db.cors = !!c8 && ("withCredentials" in c8);
    c8 = db.ajax = !!c8;
    if (c8) {
        dY.ajaxTransport(function(b) {
            if (!b.crossDomain || db.cors) {
                var a;
                return {
                    send: function(d, h) {
                        var g, f = b.xhr(), c = ++dZ;
                        f.open(b.type, b.url, b.async, b.username, b.password);
                        if (b.xhrFields) {
                            for (g in b.xhrFields) {
                                f[g] = b.xhrFields[g]
                            }
                        }
                        if (b.mimeType && f.overrideMimeType) {
                            f.overrideMimeType(b.mimeType)
                        }
                        if (!b.crossDomain && !d["X-Requested-With"]) {
                            d["X-Requested-With"] = "XMLHttpRequest"
                        }
                        for (g in d) {
                            if (d[g] !== undefined) {
                                f.setRequestHeader(g, d[g] + "")
                            }
                        }
                        f.send((b.hasContent && b.data) || null );
                        a = function(m, n) {
                            var o, j, l;
                            if (a && (n || f.readyState === 4)) {
                                delete ds[c];
                                a = undefined;
                                f.onreadystatechange = dY.noop;
                                if (n) {
                                    if (f.readyState !== 4) {
                                        f.abort()
                                    }
                                } else {
                                    l = {};
                                    o = f.status;
                                    if (typeof f.responseText === "string") {
                                        l.text = f.responseText
                                    }
                                    try {
                                        j = f.statusText
                                    } catch (k) {
                                        j = ""
                                    }
                                    if (!o && b.isLocal && !b.crossDomain) {
                                        o = l.text ? 200 : 404
                                    } else {
                                        if (o === 1223) {
                                            o = 204
                                        }
                                    }
                                }
                            }
                            if (l) {
                                h(o, j, l, f.getAllResponseHeaders())
                            }
                        }
                        ;
                        if (!b.async) {
                            a()
                        } else {
                            if (f.readyState === 4) {
                                setTimeout(a)
                            } else {
                                f.onreadystatechange = ds[c] = a
                            }
                        }
                    },
                    abort: function() {
                        if (a) {
                            a(undefined, true)
                        }
                    }
                }
            }
        })
    }
    function dg() {
        try {
            return new ed.XMLHttpRequest()
        } catch (a) {}
    }
    function dF() {
        try {
            return new ed.ActiveXObject("Microsoft.XMLHTTP")
        } catch (a) {}
    }
    dY.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /(?:java|ecma)script/
        },
        converters: {
            "text script": function(a) {
                dY.globalEval(a);
                return a
            }
        }
    });
    dY.ajaxPrefilter("script", function(a) {
        if (a.cache === undefined) {
            a.cache = false
        }
        if (a.crossDomain) {
            a.type = "GET";
            a.global = false
        }
    });
    dY.ajaxTransport("script", function(c) {
        if (c.crossDomain) {
            var b, a = eB.head || dY("head")[0] || eB.documentElement;
            return {
                send: function(f, d) {
                    b = eB.createElement("script");
                    b.async = true;
                    if (c.scriptCharset) {
                        b.charset = c.scriptCharset
                    }
                    b.src = c.url;
                    b.onload = b.onreadystatechange = function(g, h) {
                        if (h || !b.readyState || /loaded|complete/.test(b.readyState)) {
                            b.onload = b.onreadystatechange = null ;
                            if (b.parentNode) {
                                b.parentNode.removeChild(b)
                            }
                            b = null ;
                            if (!h) {
                                d(200, "success")
                            }
                        }
                    }
                    ;
                    a.insertBefore(b, a.firstChild)
                },
                abort: function() {
                    if (b) {
                        b.onload(undefined, true)
                    }
                }
            }
        }
    });
    var cj = []
        , ek = /(=)\?(?=&|$)|\?\?/;
    dY.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var a = cj.pop() || (dY.expando + "_" + (dk++));
            this[a] = true;
            return a
        }
    });
    dY.ajaxPrefilter("json jsonp", function(g, f, c) {
        var d, a, h, b = g.jsonp !== false && (ek.test(g.url) ? "url" : typeof g.data === "string" && !(g.contentType || "").indexOf("application/x-www-form-urlencoded") && ek.test(g.data) && "data");
        if (b || g.dataTypes[0] === "jsonp") {
            d = g.jsonpCallback = dY.isFunction(g.jsonpCallback) ? g.jsonpCallback() : g.jsonpCallback;
            if (b) {
                g[b] = g[b].replace(ek, "$1" + d)
            } else {
                if (g.jsonp !== false) {
                    g.url += (cQ.test(g.url) ? "&" : "?") + g.jsonp + "=" + d
                }
            }
            g.converters["script json"] = function() {
                if (!h) {
                    dY.error(d + " was not called")
                }
                return h[0]
            }
            ;
            g.dataTypes[0] = "json";
            a = ed[d];
            ed[d] = function() {
                h = arguments
            }
            ;
            c.always(function() {
                ed[d] = a;
                if (g[d]) {
                    g.jsonpCallback = f.jsonpCallback;
                    cj.push(d)
                }
                if (h && dY.isFunction(a)) {
                    a(h[0])
                }
                h = a = undefined
            });
            return "script"
        }
    });
    dY.parseHTML = function(c, f, d) {
        if (!c || typeof c !== "string") {
            return null
        }
        if (typeof f === "boolean") {
            d = f;
            f = false
        }
        f = f || eB;
        var a = dr.exec(c)
            , b = !d && [];
        if (a) {
            return [f.createElement(a[1])]
        }
        a = dY.buildFragment([c], f, b);
        if (b && b.length) {
            dY(b).remove()
        }
        return dY.merge([], a.childNodes)
    }
    ;
    var ei = dY.fn.load;
    dY.fn.load = function(h, g, b) {
        if (typeof h !== "string" && ei) {
            return ei.apply(this, arguments)
        }
        var f, j, c, d = this, a = h.indexOf(" ");
        if (a >= 0) {
            f = dY.trim(h.slice(a, h.length));
            h = h.slice(0, a)
        }
        if (dY.isFunction(g)) {
            b = g;
            g = undefined
        } else {
            if (g && typeof g === "object") {
                c = "POST"
            }
        }
        if (d.length > 0) {
            dY.ajax({
                url: h,
                type: c,
                dataType: "html",
                data: g
            }).done(function(k) {
                j = arguments;
                d.html(f ? dY("<div>").append(dY.parseHTML(k)).find(f) : k)
            }).complete(b && function(k, l) {
                    d.each(b, j || [k.responseText, l, k])
                }
            )
        }
        return this
    }
    ;
    dY.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function(a, b) {
        dY.fn[b] = function(c) {
            return this.on(b, c)
        }
    });
    dY.expr.filters.animated = function(a) {
        return dY.grep(dY.timers, function(b) {
            return a === b.elem
        }).length
    }
    ;
    var c6 = ed.document.documentElement;
    function de(a) {
        return dY.isWindow(a) ? a : a.nodeType === 9 ? a.defaultView || a.parentWindow : false
    }
    dY.offset = {
        setOffset: function(j, a, m) {
            var f, l, o, n, k, c, b, g = dY.css(j, "position"), h = dY(j), d = {};
            if (g === "static") {
                j.style.position = "relative"
            }
            k = h.offset();
            o = dY.css(j, "top");
            c = dY.css(j, "left");
            b = (g === "absolute" || g === "fixed") && dY.inArray("auto", [o, c]) > -1;
            if (b) {
                f = h.position();
                n = f.top;
                l = f.left
            } else {
                n = parseFloat(o) || 0;
                l = parseFloat(c) || 0
            }
            if (dY.isFunction(a)) {
                a = a.call(j, m, k)
            }
            if (a.top != null ) {
                d.top = (a.top - k.top) + n
            }
            if (a.left != null ) {
                d.left = (a.left - k.left) + l
            }
            if ("using" in a) {
                a.using.call(j, d)
            } else {
                h.css(d)
            }
        }
    };
    dY.fn.extend({
        offset: function(a) {
            if (arguments.length) {
                return a === undefined ? this : this.each(function(h) {
                    dY.offset.setOffset(this, a, h)
                })
            }
            var d, c, f = {
                top: 0,
                left: 0
            }, g = this[0], b = g && g.ownerDocument;
            if (!b) {
                return
            }
            d = b.documentElement;
            if (!dY.contains(d, g)) {
                return f
            }
            if (typeof g.getBoundingClientRect !== b8) {
                f = g.getBoundingClientRect()
            }
            c = de(b);
            return {
                top: f.top + (c.pageYOffset || d.scrollTop) - (d.clientTop || 0),
                left: f.left + (c.pageXOffset || d.scrollLeft) - (d.clientLeft || 0)
            }
        },
        position: function() {
            if (!this[0]) {
                return
            }
            var d, c, b = {
                top: 0,
                left: 0
            }, a = this[0];
            if (dY.css(a, "position") === "fixed") {
                c = a.getBoundingClientRect()
            } else {
                d = this.offsetParent();
                c = this.offset();
                if (!dY.nodeName(d[0], "html")) {
                    b = d.offset()
                }
                b.top += dY.css(d[0], "borderTopWidth", true);
                b.left += dY.css(d[0], "borderLeftWidth", true)
            }
            return {
                top: c.top - b.top - dY.css(a, "marginTop", true),
                left: c.left - b.left - dY.css(a, "marginLeft", true)
            }
        },
        offsetParent: function() {
            return this.map(function() {
                var a = this.offsetParent || c6;
                while (a && (!dY.nodeName(a, "html") && dY.css(a, "position") === "static")) {
                    a = a.offsetParent
                }
                return a || c6
            })
        }
    });
    dY.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(c, a) {
        var b = /Y/.test(a);
        dY.fn[c] = function(d) {
            return dx(this, function(j, f, g) {
                var h = de(j);
                if (g === undefined) {
                    return h ? (a in h) ? h[a] : h.document.documentElement[f] : j[f]
                }
                if (h) {
                    h.scrollTo(!b ? g : dY(h).scrollLeft(), b ? g : dY(h).scrollTop())
                } else {
                    j[f] = g
                }
            }, c, d, arguments.length, null )
        }
    });
    dY.each(["top", "left"], function(a, b) {
        dY.cssHooks[b] = ep(db.pixelPosition, function(d, c) {
            if (c) {
                c = dh(d, b);
                return eA.test(c) ? dY(d).position()[b] + "px" : c
            }
        })
    });
    dY.each({
        Height: "height",
        Width: "width"
    }, function(b, a) {
        dY.each({
            padding: "inner" + b,
            content: a,
            "": "outer" + b
        }, function(d, c) {
            dY.fn[c] = function(f, g) {
                var h = arguments.length && (d || typeof f !== "boolean")
                    , j = d || (f === true || g === true ? "margin" : "border");
                return dx(this, function(l, m, k) {
                    var n;
                    if (dY.isWindow(l)) {
                        return l.document.documentElement["client" + b]
                    }
                    if (l.nodeType === 9) {
                        n = l.documentElement;
                        return Math.max(l.body["scroll" + b], n["scroll" + b], l.body["offset" + b], n["offset" + b], n["client" + b])
                    }
                    return k === undefined ? dY.css(l, m, j) : dY.style(l, m, k, j)
                }, a, h ? f : undefined, h, null )
            }
        })
    });
    dY.fn.size = function() {
        return this.length
    }
    ;
    dY.fn.andSelf = dY.fn.addBack;
    if (typeof define === "function" && define.amd) {
        define("jquery", [], function() {
            return dY
        })
    }
    var dJ = ed.jQuery
        , dC = ed.$;
    dY.noConflict = function(a) {
        if (ed.$ === dY) {
            ed.$ = dC
        }
        if (a && ed.jQuery === dY) {
            ed.jQuery = dJ
        }
        return dY
    }
    ;
    if (typeof ey === b8) {
        ed.jQuery = ed.$ = dY
    }
    return dY
}));
/*!
 * jQuery Migrate - v1.2.1 - 2013-05-08
 * https://github.com/jquery/jquery-migrate
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors; Licensed MIT
 */
(function(ak, G, S) {
    ak.migrateMute = 1;
    var ac = {};
    ak.migrateWarnings = [];
    if (!ak.migrateMute && G.console && G.console.log) {
        G.console.log("JQMIGRATE: Logging is active")
    }
    if (ak.migrateTrace === S) {
        ak.migrateTrace = true
    }
    ak.migrateReset = function() {
        ac = {};
        ak.migrateWarnings.length = 0
    }
    ;
    function ae(a) {
        var b = G.console;
        if (!ac[a]) {
            ac[a] = true;
            ak.migrateWarnings.push(a);
            if (b && b.warn && !ak.migrateMute) {
                b.warn("JQMIGRATE: " + a);
                if (ak.migrateTrace && b.trace) {
                    b.trace()
                }
            }
        }
    }
    function I(d, b, e, c) {
        if (Object.defineProperty) {
            try {
                Object.defineProperty(d, b, {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        ae(c);
                        return e
                    },
                    set: function(f) {
                        ae(c);
                        e = f
                    }
                });
                return
            } catch (a) {}
        }
        ak._definePropertyBroken = true;
        d[b] = e
    }
    if (document.compatMode === "BackCompat") {
        ae("jQuery is not compatible with Quirks Mode")
    }
    var J = ak("<input/>", {
            size: 1
        }).attr("size") && ak.attrFn
        , aa = ak.attr
        , X = ak.attrHooks.value && ak.attrHooks.value.get || function() {
            return null
        }
        , Q = ak.attrHooks.value && ak.attrHooks.value.set || function() {
            return S
        }
        , ai = /^(?:input|button)$/i
        , Y = /^[238]$/
        , T = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i
        , K = /^(?:checked|selected)$/i;
    I(ak, "attrFn", J || {}, "jQuery.attrFn is deprecated");
    ak.attr = function(f, b, e, a) {
        var c = b.toLowerCase()
            , d = f && f.nodeType;
        if (a) {
            if (aa.length < 4) {
                ae("jQuery.fn.attr( props, pass ) is deprecated")
            }
            if (f && !Y.test(d) && (J ? b in J : ak.isFunction(ak.fn[b]))) {
                return ak(f)[b](e)
            }
        }
        if (b === "type" && e !== S && ai.test(f.nodeName) && f.parentNode) {
            ae("Can't change the 'type' of an input or button in IE 6/7/8")
        }
        if (!ak.attrHooks[c] && T.test(c)) {
            ak.attrHooks[c] = {
                get: function(i, j) {
                    var g, h = ak.prop(i, j);
                    return h === true || typeof h !== "boolean" && (g = i.getAttributeNode(j)) && g.nodeValue !== false ? j.toLowerCase() : S
                },
                set: function(i, g, j) {
                    var h;
                    if (g === false) {
                        ak.removeAttr(i, j)
                    } else {
                        h = ak.propFix[j] || j;
                        if (h in i) {
                            i[h] = true
                        }
                        i.setAttribute(j, j.toLowerCase())
                    }
                    return j
                }
            };
            if (K.test(c)) {
                ae("jQuery.fn.attr('" + c + "') may use property instead of attribute")
            }
        }
        return aa.call(ak, f, b, e)
    }
    ;
    ak.attrHooks.value = {
        get: function(c, a) {
            var b = (c.nodeName || "").toLowerCase();
            if (b === "button") {
                return X.apply(this, arguments)
            }
            if (b !== "input" && b !== "option") {
                ae("jQuery.fn.attr('value') no longer gets properties")
            }
            return a in c ? c.value : null
        },
        set: function(a, c) {
            var b = (a.nodeName || "").toLowerCase();
            if (b === "button") {
                return Q.apply(this, arguments)
            }
            if (b !== "input" && b !== "option") {
                ae("jQuery.fn.attr('value', val) no longer sets properties")
            }
            a.value = c
        }
    };
    var aj, W, U = ak.fn.init, M = ak.parseJSON, ag = /^([^<]*)(<[\w\W]+>)([^>]*)$/;
    ak.fn.init = function(b, c, d) {
        var a;
        if (b && typeof b === "string" && !ak.isPlainObject(c) && (a = ag.exec(ak.trim(b))) && a[0]) {
            if (b.charAt(0) !== "<") {
                ae("$(html) HTML strings must start with '<' character")
            }
            if (a[3]) {
                ae("$(html) HTML text after last tag is ignored")
            }
            if (a[0].charAt(0) === "#") {
                ae("HTML string cannot start with a '#' character");
                ak.error("JQMIGRATE: Invalid selector string (XSS)")
            }
            if (c && c.context) {
                c = c.context
            }
            if (ak.parseHTML) {
                return U.call(this, ak.parseHTML(a[2], c, true), c, d)
            }
        }
        return U.apply(this, arguments)
    }
    ;
    ak.fn.init.prototype = ak.fn;
    ak.parseJSON = function(a) {
        if (!a && a !== null ) {
            ae("jQuery.parseJSON requires a valid JSON string");
            return null
        }
        return M.apply(this, arguments)
    }
    ;
    ak.uaMatch = function(a) {
        a = a.toLowerCase();
        var b = /(chrome)[ \/]([\w.]+)/.exec(a) || /(webkit)[ \/]([\w.]+)/.exec(a) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a) || /(msie) ([\w.]+)/.exec(a) || a.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a) || [];
        return {
            browser: b[1] || "",
            version: b[2] || "0"
        }
    }
    ;
    if (!ak.browser) {
        aj = ak.uaMatch(navigator.userAgent);
        W = {};
        if (aj.browser) {
            W[aj.browser] = true;
            W.version = aj.version
        }
        if (W.chrome) {
            W.webkit = true
        } else {
            if (W.webkit) {
                W.safari = true
            }
        }
        ak.browser = W
    }
    I(ak, "browser", ak.browser, "jQuery.browser is deprecated");
    ak.sub = function() {
        function a(e, d) {
            return new a.fn.init(e,d)
        }
        ak.extend(true, a, this);
        a.superclass = this;
        a.fn = a.prototype = this();
        a.fn.constructor = a;
        a.sub = this.sub;
        a.fn.init = function b(e, d) {
            if (d && d instanceof ak && !(d instanceof a)) {
                d = a(d)
            }
            return ak.fn.init.call(this, e, d, c)
        }
        ;
        a.fn.init.prototype = a.fn;
        var c = a(document);
        ae("jQuery.sub() is deprecated");
        return a
    }
    ;
    ak.ajaxSetup({
        converters: {
            "text json": ak.parseJSON
        }
    });
    var ab = ak.fn.data;
    ak.fn.data = function(d) {
        var a, b, c = this[0];
        if (c && d === "events" && arguments.length === 1) {
            a = ak.data(c, d);
            b = ak._data(c, d);
            if ((a === S || a === b) && b !== S) {
                ae("Use of jQuery.fn.data('events') is deprecated");
                return b
            }
        }
        return ab.apply(this, arguments)
    }
    ;
    var H = /\/(java|ecma)script/i
        , R = ak.fn.andSelf || ak.fn.addBack;
    ak.fn.andSelf = function() {
        ae("jQuery.fn.andSelf() replaced by jQuery.fn.addBack()");
        return R.apply(this, arguments)
    }
    ;
    if (!ak.clean) {
        ak.clean = function(i, h, b, f) {
            h = h || document;
            h = !h.nodeType && h[0] || h;
            h = h.ownerDocument || h;
            ae("jQuery.clean() is deprecated");
            var e, g, d, a, c = [];
            ak.merge(c, ak.buildFragment(i, h).childNodes);
            if (b) {
                d = function(j) {
                    if (!j.type || H.test(j.type)) {
                        return f ? f.push(j.parentNode ? j.parentNode.removeChild(j) : j) : b.appendChild(j)
                    }
                }
                ;
                for (e = 0; (g = c[e]) != null ; e++) {
                    if (!(ak.nodeName(g, "script") && d(g))) {
                        b.appendChild(g);
                        if (typeof g.getElementsByTagName !== "undefined") {
                            a = ak.grep(ak.merge([], g.getElementsByTagName("script")), d);
                            c.splice.apply(c, [e + 1, 0].concat(a));
                            e += a.length
                        }
                    }
                }
            }
            return c
        }
    }
    var al = ak.event.add
        , O = ak.event.remove
        , Z = ak.event.trigger
        , P = ak.fn.toggle
        , N = ak.fn.live
        , af = ak.fn.die
        , ad = "ajaxStart|ajaxStop|ajaxSend|ajaxComplete|ajaxError|ajaxSuccess"
        , L = new RegExp("\\b(?:" + ad + ")\\b")
        , ah = /(?:^|\s)hover(\.\S+|)\b/
        , V = function(a) {
            if (typeof (a) !== "string" || ak.event.special.hover) {
                return a
            }
            if (ah.test(a)) {
                ae("'hover' pseudo-event is deprecated, use 'mouseenter mouseleave'")
            }
            return a && a.replace(ah, "mouseenter$1 mouseleave$1")
        }
        ;
    if (ak.event.props && ak.event.props[0] !== "attrChange") {
        ak.event.props.unshift("attrChange", "attrName", "relatedNode", "srcElement")
    }
    if (ak.event.dispatch) {
        I(ak.event, "handle", ak.event.dispatch, "jQuery.event.handle is undocumented and deprecated")
    }
    ak.event.add = function(c, e, d, b, a) {
        if (c !== document && L.test(e)) {
            ae("AJAX events should be attached to document: " + e)
        }
        al.call(this, c, V(e || ""), d, b, a)
    }
    ;
    ak.event.remove = function(b, d, c, a, e) {
        O.call(this, b, V(d) || "", c, a, e)
    }
    ;
    ak.fn.error = function() {
        var a = Array.prototype.slice.call(arguments, 0);
        ae("jQuery.fn.error() is deprecated");
        a.splice(0, 0, "error");
        if (arguments.length) {
            return this.bind.apply(this, a)
        }
        this.triggerHandler.apply(this, a);
        return this
    }
    ;
    ak.fn.toggle = function(f, b) {
        if (!ak.isFunction(f) || !ak.isFunction(b)) {
            return P.apply(this, arguments)
        }
        ae("jQuery.fn.toggle(handler, handler...) is deprecated");
        var c = arguments
            , d = f.guid || ak.guid++
            , a = 0
            , e = function(h) {
                var g = (ak._data(this, "lastToggle" + f.guid) || 0) % a;
                ak._data(this, "lastToggle" + f.guid, g + 1);
                h.preventDefault();
                return c[g].apply(this, arguments) || false
            }
            ;
        e.guid = d;
        while (a < c.length) {
            c[a++].guid = d
        }
        return this.click(e)
    }
    ;
    ak.fn.live = function(a, b, c) {
        ae("jQuery.fn.live() is deprecated");
        if (N) {
            return N.apply(this, arguments)
        }
        ak(this.context).on(a, this.selector, b, c);
        return this
    }
    ;
    ak.fn.die = function(b, a) {
        ae("jQuery.fn.die() is deprecated");
        if (af) {
            return af.apply(this, arguments)
        }
        ak(this.context).off(b, this.selector || "**", a);
        return this
    }
    ;
    ak.event.trigger = function(d, c, a, b) {
        if (!a && !L.test(d)) {
            ae("Global events are undocumented and deprecated")
        }
        return Z.call(this, d, c, a || document, b)
    }
    ;
    ak.each(ad.split("|"), function(a, b) {
        ak.event.special[b] = {
            setup: function() {
                var c = this;
                if (c !== document) {
                    ak.event.add(document, b + "." + ak.guid, function() {
                        ak.event.trigger(b, null , c, true)
                    });
                    ak._data(this, b, ak.guid++)
                }
                return false
            },
            teardown: function() {
                if (this !== document) {
                    ak.event.remove(document, b + "." + ak._data(this, b))
                }
                return false
            }
        }
    })
})(jQuery, window);
(function(b) {
    b.fn.bgIframe = b.fn.bgiframe = function(c) {
        if (b.browser.msie && parseInt(b.browser.version) <= 6) {
            c = b.extend({
                top: "auto",
                left: "auto",
                width: "auto",
                height: "auto",
                opacity: true,
                src: "javascript:false;"
            }, c || {});
            var d = function(f) {
                return f && f.constructor == Number ? f + "px" : f
            }
                , e = '<iframe class="bgiframe"frameborder="0"tabindex="-1"src="' + c.src + '"style="display:block;position:absolute;z-index:-1;' + (c.opacity !== false ? "filter:Alpha(Opacity='0');" : "") + "top:" + (c.top == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+'px')" : d(c.top)) + ";left:" + (c.left == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+'px')" : d(c.left)) + ";width:" + (c.width == "auto" ? "expression(this.parentNode.offsetWidth+'px')" : d(c.width)) + ";height:" + (c.height == "auto" ? "expression(this.parentNode.offsetHeight+'px')" : d(c.height)) + ';"/>';
            return this.each(function() {
                if (b("> iframe.bgiframe", this).length == 0) {
                    this.insertBefore(document.createElement(e), this.firstChild)
                }
            })
        }
        return this
    }
    ;
    if (!b.browser.version) {
        if (navigator.userAgent && navigator.userAgent.toLowerCase() && navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)) {
            var a = navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/);
            if (a && a.length == 2) {
                b.browser.version = a[1]
            }
        }
    }
})(jQuery);
/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.9
 *
 * Requires: jQuery 1.2.2+
 */
;(function(h) {
    var j = ["wheel", "mousewheel", "DOMMouseScroll", "MozMousePixelScroll"], d = ("onwheel" in document || document.documentMode >= 9) ? ["wheel"] : ["mousewheel", "DomMouseScroll", "MozMousePixelScroll"], b = Array.prototype.slice, c, g;
    if (h.event.fixHooks) {
        for (var k = j.length; k; ) {
            h.event.fixHooks[j[--k]] = h.event.mouseHooks
        }
    }
    var l = h.event.special.mousewheel = {
        version: "3.1.9",
        setup: function() {
            if (this.addEventListener) {
                for (var i = d.length; i; ) {
                    this.addEventListener(d[--i], e, false)
                }
            } else {
                this.onmousewheel = e
            }
            h.data(this, "mousewheel-line-height", l.getLineHeight(this));
            h.data(this, "mousewheel-page-height", l.getPageHeight(this))
        },
        teardown: function() {
            if (this.removeEventListener) {
                for (var i = d.length; i; ) {
                    this.removeEventListener(d[--i], e, false)
                }
            } else {
                this.onmousewheel = null
            }
        },
        getLineHeight: function(i) {
            return parseInt(h(i)["offsetParent" in h.fn ? "offsetParent" : "parent"]().css("fontSize"), 10)
        },
        getPageHeight: function(i) {
            return h(i).height()
        },
        settings: {
            adjustOldDeltas: true
        }
    };
    h.fn.extend({
        mousewheel: function(i) {
            return i ? this.bind("mousewheel", i) : this.trigger("mousewheel")
        },
        unmousewheel: function(i) {
            return this.unbind("mousewheel", i)
        }
    });
    function e(q) {
        var s = q || window.event
            , n = b.call(arguments, 1)
            , p = 0
            , i = 0
            , t = 0
            , m = 0;
        q = h.event.fix(s);
        q.type = "mousewheel";
        if ("detail" in s) {
            t = s.detail * -1
        }
        if ("wheelDelta" in s) {
            t = s.wheelDelta
        }
        if ("wheelDeltaY" in s) {
            t = s.wheelDeltaY
        }
        if ("wheelDeltaX" in s) {
            i = s.wheelDeltaX * -1
        }
        if ("axis" in s && s.axis === s.HORIZONTAL_AXIS) {
            i = t * -1;
            t = 0
        }
        p = t === 0 ? i : t;
        if ("deltaY" in s) {
            t = s.deltaY * -1;
            p = t
        }
        if ("deltaX" in s) {
            i = s.deltaX;
            if (t === 0) {
                p = i * -1
            }
        }
        if (t === 0 && i === 0) {
            return
        }
        if (s.deltaMode === 1) {
            var o = h.data(this, "mousewheel-line-height");
            p *= o;
            t *= o;
            i *= o
        } else {
            if (s.deltaMode === 2) {
                var r = h.data(this, "mousewheel-page-height");
                p *= r;
                t *= r;
                i *= r
            }
        }
        m = Math.max(Math.abs(t), Math.abs(i));
        if (!g || m < g) {
            g = m;
            if (f(s, m)) {
                g /= 40
            }
        }
        if (f(s, m)) {
            p /= 40;
            i /= 40;
            t /= 40
        }
        p = Math[p >= 1 ? "floor" : "ceil"](p / g);
        i = Math[i >= 1 ? "floor" : "ceil"](i / g);
        t = Math[t >= 1 ? "floor" : "ceil"](t / g);
        q.deltaX = i;
        q.deltaY = t;
        q.deltaFactor = g;
        q.deltaMode = 0;
        n.unshift(q, p, i, t);
        if (c) {
            clearTimeout(c)
        }
        c = setTimeout(a, 200);
        return (h.event.dispatch || h.event.handle).apply(this, n)
    }
    function a() {
        g = null
    }
    function f(m, i) {
        return l.settings.adjustOldDeltas && m.type === "mousewheel" && i % 120 === 0
    }
})(jQuery);
(function(c) {
    var d = window.loli || (window.loli = {});
    d.isMobile = function() {
        var p = navigator.userAgent.toLowerCase();
        var l = p.match(/ipad/i) == "ipad";
        var b = p.match(/iphone os/i) == "iphone os";
        var m = p.match(/midp/i) == "midp";
        var o = p.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
        var n = p.match(/ucweb/i) == "ucweb";
        var r = p.match(/android/i) == "android";
        var q = p.match(/windows ce/i) == "windows ce";
        var a = p.match(/windows mobile/i) == "windows mobile";
        if (l || b || m || o || n || r || q || a) {
            return true
        } else {
            return false
        }
    }
    ;
    d.getElementTopLeft = function(f) {
        var a = 0;
        var b = 0;
        while (f) {
            a += f.offsetTop;
            b += f.offsetLeft;
            f = f.offsetParent
        }
        return {
            top: a,
            left: b
        }
    }
    ;
    d.isVisual = function(j) {
        if (!j) {
            return false
        }
        var a = j.offsetHeight;
        var h = document.documentElement.clientHeight;
        var b = document.documentElement.scrollTop || document.body.scrollTop;
        var i = d.getElementTopLeft(j).top + a / 2;
        if (i < h + b && i > b) {
            return true
        } else {
            return false
        }
    }
    ;
    d.isVisualByTop = function(j) {
        if (!j) {
            return false
        }
        var h = d.getElementTopLeft(j).top;
        var b = document.documentElement.clientHeight;
        var i = h + j.offsetHeight;
        var a = document.documentElement.scrollTop || document.body.scrollTop;
        if ((h <= b + a && h >= a) || (h <= a && i >= a)) {
            return true
        } else {
            return false
        }
    }
    ;
    d.isSpider = function() {
        var o = navigator.userAgent.toLowerCase();
        var b = o.match(/baiduspider/i) == "baiduspider";
        var m = o.match(/360spider/i) == "360spider";
        var p = o.match(/sogou web spider/i) == "sogou web spider";
        var k = o.match(/sosospider/i) == "sosospider";
        var l = o.match(/yisouspider/i) == "yisouspider";
        var n = o.match(/googlebot/i) == "googlebot";
        var a = o.match(/bingbot/i) == "bingbot";
        if (b || m || p || k || l || n || a) {
            return true
        } else {
            return false
        }
    }
    ;
    d.getMousePos = function(u) {
        try {
            var r = u || window.event;
            if (r) {
                var s = document.body.scrollWidth;
                var a = document.body.scrollHeight;
                var b = document.documentElement.scrollLeft || document.body.scrollLeft;
                var e = document.documentElement.scrollTop || document.body.scrollTop;
                var o, p, t, v;
                o = r.pageX || r.clientX + b;
                p = r.pageY || r.clientY + e;
                if (o && p) {
                    t = o / s;
                    v = p / a;
                    return {
                        xrate: t.toFixed(5),
                        yrate: v.toFixed(5)
                    }
                }
            }
        } catch (q) {}
        return null
    }
})(jQuery);
(function() {
    var h = window.loli || (window.loli = {});
    var e = {};
    var g = ".";
    var f = {};
    e.checkTpPage = function(a) {
        if (!a) {
            a = $("meta[name=tp_page]").attr("content");
            if (!a) {
                return null
            }
        }
        var b = a.split(g);
        return b.length == 2 ? b : null
    }
    ;
    e.glSpmcodeToId = function(a, b) {
        if (!b) {
            return b
        }
        if (typeof (_globalSpmDataModelJson) != "undefined" && _globalSpmDataModelJson) {
            var c = 0;
            if (a) {
                c = _globalSpmDataModelJson[a] ? _globalSpmDataModelJson[a][b] : ""
            } else {
                c = _globalSpmDataModelJson[b]
            }
            if (c) {
                return c
            }
        }
        return b
    }
    ;
    e.getCurrPageInfo = function() {
        var a = e.checkTpPage();
        if (!a) {
            return null
        }
        return {
            pageType: e.glSpmcodeToId(null , a[0]),
            pageValue: a[1]
        }
    }
    ;
    e.getReferPageInfo = function() {
        var b = h.util.url.getParams(location.href) || {};
        var c = b.tp;
        if (c) {
            var a = c.split(".");
            if (h.config.isValidUID(a[5])) {
                return {
                    refPageType: a[0] || "",
                    refPageValue: a[1] || ""
                }
            }
        }
        return null
    }
    ;
    e.glABcodeToTag = function(a) {
        if (a && a.length > 0) {
            if (f[a]) {
                return f[a].tag
            } else {
                if (typeof (_globalABTestBucketWholeJson) != "undefined" && _globalABTestBucketWholeJson && _globalABTestBucketWholeJson.pc && typeof (_globalABTestExpDetailJson) != "undefined" && _globalABTestExpDetailJson && _globalABTestExpDetailJson[a] && h && h.abtest) {
                    var c = h.abtest.getABTestExpResult(_globalABTestBucketWholeJson.pc, _globalABTestExpDetailJson[a]);
                    f[a] = c;
                    return c.tag
                } else {
                    if (typeof (_globalABTestExpDataJson) != "undefined" && _globalABTestExpDataJson && _globalABTestExpDataJson[a]) {
                        var b = _globalABTestExpDataJson[a]["tag"];
                        f[a] = {};
                        f[a].tag = b;
                        return b
                    }
                }
            }
        }
        return ""
    }
    ;
    e.getABExpParam = function(b) {
        if (b && b.length > 0) {
            if (f[b]) {
                return f[b].expParam
            } else {
                if (typeof (_globalABTestBucketWholeJson) != "undefined" && _globalABTestBucketWholeJson && _globalABTestBucketWholeJson.pc && typeof (_globalABTestExpDetailJson) != "undefined" && _globalABTestExpDetailJson && _globalABTestExpDetailJson[b] && h && h.abtest) {
                    var c = h.abtest.getABTestExpResult(_globalABTestBucketWholeJson.pc, _globalABTestExpDetailJson[b]);
                    f[b] = c;
                    return c.expParam
                } else {
                    if (typeof (_globalABTestExpDataJson) != "undefined" && _globalABTestExpDataJson && _globalABTestExpDataJson[b]) {
                        var a = _globalABTestExpDataJson[b]["expParam"];
                        f[b] = {};
                        f[b].expParam = a;
                        return a
                    }
                }
            }
        }
        return ""
    }
    ;
    window.loli.page = e
})();
jQuery.cookie = function(q, v, s) {
    if (typeof v != "undefined") {
        s = s || {};
        if (v === null ) {
            v = "";
            s.expires = -1
        }
        var n = "";
        if (s.expires && (typeof s.expires == "number" || s.expires.toUTCString)) {
            var i;
            if (typeof s.expires == "number") {
                i = new Date();
                i.setTime(i.getTime() + (s.expires * 24 * 60 * 60 * 1000))
            } else {
                i = s.expires
            }
            n = "; expires=" + i.toUTCString()
        }
        var t = s.path ? "; path=" + (s.path) : "";
        var x = s.domain ? "; domain=" + (s.domain) : "";
        var r = s.secure ? "; secure" : "";
        document.cookie = [q, "=", encodeURIComponent(v), n, t, x, r].join("")
    } else {
        var o = null ;
        if (document.cookie && document.cookie != "") {
            var u = document.cookie.split(";");
            for (var w = 0; w < u.length; w++) {
                var p = jQuery.trim(u[w]);
                if (p.substring(0, q.length + 1) == (q + "=")) {
                    o = decodeURIComponent(p.substring(q.length + 1));
                    break
                }
            }
        }
        return o
    }
}
;
(function() {
    function b(f) {
        if (f && typeof (f) == "string") {
            return f.replace(/(^\s*)|(\s*$)/g, "")
        } else {
            return f
        }
    }
    function d() {
        if (typeof (localStorage) == "undefined") {
            return false
        }
        if (typeof (webPercent) == "undefined") {
            webPercent = 100
        }
        var f = parseInt(Math.random() * 100);
        try {
            if (localStorage.getItem("_webpPercent")) {
                f = localStorage.getItem("_webpPercent")
            } else {
                localStorage.setItem("_webpPercent", f)
            }
        } catch (g) {}
        return webPercent < f ? false : true
    }
    function c() {
        if (typeof (localStorage) == "undefined") {
            return false
        }
        var f = localStorage.getItem("webp");
        if (f) {
            return true
        }
        var g = document.createElement("canvas");
        if (!!(g.getContext && g.getContext("2d"))) {
            var h = g.toDataURL("image/webp").indexOf("data:image/webp") == 0;
            if (h) {
                localStorage.setItem("webp", true)
            }
            return h
        } else {
            return false
        }
    }
    var a = c();
    if (a) {
        a = d()
    }
    function e(g) {
        if (!a || !g) {
            return g
        }
        g = b(g);
        var h = /^(http|https):\/\/(d\d{1,2})/;
        if (g.search(h) == -1) {
            return g
        }
        var f = g.split(".");
        if (f.length > 1) {
            if (f[f.length - 1].toLowerCase() == "gif") {
                return g
            }
            f[f.length - 1] = "webp"
        }
        return f.join(".")
    }
    loli.webp = e
})();
define("base_observer", function() {
    var a = (function() {
        var e = {};
        function b(f, g) {
            if (!e[f]) {
                e[f] = []
            }
            e[f].push(g)
        }
        function c(g, j) {
            if (e[g]) {
                for (var h = 0, f = e[g].length; h < f; h++) {
                    e[g][h](j)
                }
            }
        }
        function d(f, g) {
            if (e[f]) {
                e[f].shift(e[f].indexOf(g))
            }
        }
        return {
            subscribe: b,
            fire: c,
            unsubscribe: d
        }
    })();
    return a
});
(function() {
    var c = {};
    var b = [];
    c.send = function(d) {
        b.push(d);
        c.run()
    }
    ;
    c.run = function(e) {
        if (e == null ) {
            e = 30
        }
        var g = b.length;
        if (g >= e) {
            var d = [];
            for (var f = 0; f < e; f++) {
                var h = b.shift();
                if (h) {
                    d.push(h)
                }
            }
            batchRecordTrackerInfo(d)
        }
    }
    ;
    setTimeout(function() {
        setInterval(function() {
            a()
        }, 500)
    }, 10000);
    $(window).unload(function() {
        a()
    });
    function a() {
        var f = b.length;
        var d = [];
        for (var e = 0; e < f; e++) {
            var g = b.shift();
            if (g) {
                d.push(g)
            }
        }
        batchRecordTrackerInfo(d)
    }
    window.loli = window.loli || {};
    window.loli.extTrackerSend = c
})();
define("abtestPv_tracker", ["base_observer"], function(b) {
    var a = {};
    var c = [];
    b.subscribe("abtestPvEvent", function(l) {
        if (l) {
            var g = l.data("abtestPvFlag");
            if (g != "1") {
                var k = window.loli || {};
                if (k && k.page && k.spm) {
                    var j = l.attr("data-abtest") || 0;
                    if (j) {
                        var f = k.page.glABcodeToTag(j);
                        if (f) {
                            var e = ".";
                            var i = "1";
                            var h = k.spm.getData(l);
                            j = i + e + f;
                            gotracker(2, "abtest-pv", "", h)
                        }
                    }
                }
                l.data("abtestPvFlag", 1)
            }
        }
    });
    a.run = function(e) {
        var f = 200
            , g = null ;
        if (e) {
            c = e
        }
        if (c.length < 1) {
            c = jQuery("[data-abtest]")
        }
        setTimeout(function() {
            d()
        }, 500);
        jQuery(document).bind("scroll", function() {
            g && clearTimeout(g);
            g = setTimeout(function() {
                d()
            }, f)
        })
    }
    ;
    function d() {
        if (typeof (b) == "object") {
            if (c.length > 0) {
                var e = 0;
                while (e < c.length) {
                    if (loli.isVisualByTop(c[e]) && c[e] && c[e].style && c[e].style.display != "none") {
                        b.fire("abtestPvEvent", jQuery(c[e]));
                        c.splice(e, 1)
                    } else {
                        e++
                    }
                }
            }
        }
    }
    return a
});
define("common_impression", ["base_observer"], function(b) {
    var a = {};
    var c = [];
    function e(f) {
        if (typeof (loli.page) == "undefined") {
            return
        }
        f = loli.page.checkTpPage(f);
        if (!f) {
            return
        }
        return loli.page.glSpmcodeToId(null , f[0])
    }
    b.subscribe("impressionEvent", function(h) {
        var i = h.attr("data-tpa");
        var r = document.documentElement.scrollTop || document.body.scrollTop;
        var n = jQuery("meta[name=tp_page]").attr("content");
        if (!n) {
            return
        }
        var k = e(n);
        if (!k && k != "0") {
            return
        }
        var f = n.split(".");
        var p = 0;
        if (f.length > 1) {
            p = f[1]
        }
        var m = h.attr("data-ctpa");
        if (m) {
            i = m
        }
        var q = {
            scrollTop: r,
            w_pt: k,
            w_pv: p,
            w_tpa: i
        };
        var l = k + "_" + p;
        if (h) {
            var j = h.data("extFlag");
            var o = h.attr("data-mrt") || 0;
            if (j != "1" && o == 0) {
                var g = window.loli || {};
                if (g && g.extTrackerSend) {
                    loli.extTrackerSend.send({
                        type: "1",
                        info: i,
                        others: "area.module",
                        extend: l,
                        paramObj: q
                    })
                } else {
                    recordTrackInfoWithType("1", i, "area.module", l, q)
                }
                h.data("extFlag", 1)
            }
        }
    });
    a.run = function(f) {
        var g = 200
            , h = null ;
        if (f) {
            c = f
        }
        if (c.length < 1) {
            c = jQuery("[data-tpa],[data-ctpa]")
        }
        setTimeout(function() {
            d()
        }, 500);
        jQuery(document).bind("scroll", function() {
            h && clearTimeout(h);
            h = setTimeout(function() {
                d()
            }, g)
        })
    }
    ;
    function d() {
        if (typeof (b) == "object") {
            var h = new Date().getTime();
            if (c.length > 0) {
                var g = [];
                var f = 0;
                while (f < c.length) {
                    if (loli.isVisual(c[f]) && c[f] && c[f].style && c[f].style.display != "none") {
                        b.fire("impressionEvent", jQuery(c[f]));
                        c.splice(f, 1)
                    } else {
                        f++
                    }
                }
            }
        }
    }
    return a
});
define("content_tracker_expo", ["base_observer"], function(g) {
    var c = {};
    var i = loli.page.getCurrPageInfo();
    var b = loli.page.getReferPageInfo();
    var f = {};
    if (i) {
        var d = i.pageType;
        var e = i.pageValue;
        f.w_pt = d;
        f.w_pv = e
    }
    if (b) {
        var h = b.refPageType;
        var a = b.refPageValue;
        f.w_rpt = h;
        f.w_rpv = a
    }
    c.run = function(k, n, m) {
        var l = new j(k,n,m);
        l.run()
    }
    ;
    function j(k, n, m) {
        var l = this;
        l.event = k;
        l.key = n;
        l.datas = m;
        l.subscribe()
    }
    j.prototype.run = function() {
        var l = this;
        var m = l.datas;
        var k = 200
            , n = null ;
        if (!m || m.length < 1) {
            l.datas = jQuery("[data-recordTracker]")
        }
        setTimeout(function() {
            l.scrollFire()
        }, 500);
        jQuery(document).bind("scroll", function() {
            n && clearTimeout(n);
            n = setTimeout(function() {
                l.scrollFire()
            }, k)
        })
    }
    ;
    j.prototype.scrollFire = function() {
        var o = this;
        var l = o.datas;
        var k = o.event;
        if (typeof (g) == "object") {
            if (l && l.length > 0) {
                var n = [];
                var m = 0;
                while (m < l.length) {
                    if (loli.isVisual(l[m]) && l[m] && l[m].style && l[m].style.display != "none") {
                        n.push(jQuery(l[m]));
                        l.splice(m, 1)
                    } else {
                        m++
                    }
                }
                g.fire(k, n);
                n = []
            }
        }
    }
    ;
    j.prototype.subscribe = function() {
        var l = this;
        var m = l.event;
        var k = l.key;
        g.subscribe(m, function(v) {
            if (!v) {
                return
            }
            if (typeof v instanceof $) {
                var w = v.attr("data-tc");
                var o = v.attr("data-tce");
                var t = o ? "exfield1=" + o : null ;
                var n = v.attr("data-recordTracker") || 0;
                var u = v.data("data-extFlag");
                if (w && u != "1" && n == "1") {
                    var s = window.loli || {};
                    if (s && s.extTrackerSend) {
                        loli.extTrackerSend.send({
                            type: "1",
                            info: w,
                            others: k,
                            extend: t,
                            paramObj: f
                        })
                    } else {
                        recordTrackInfoWithType("1", w, k, null , f)
                    }
                    v.data("data-extFlag", 1)
                }
            }
            if (v.constructor == Array) {
                for (var q = 0, r = v.length; q < r; q++) {
                    var p = $(v[q]);
                    var w = p.attr("data-tc");
                    var o = p.attr("data-tce");
                    var t = o ? "exfield1=" + o : null ;
                    var u = p.data("data-extFlag");
                    var n = p.attr("data-recordTracker") || 0;
                    if (w && u != "1" && n == "1") {
                        var s = window.loli || {};
                        if (s && s.extTrackerSend) {
                            loli.extTrackerSend.send({
                                type: "1",
                                info: w,
                                others: k,
                                extend: t,
                                paramObj: f
                            })
                        } else {
                            recordTrackInfoWithType("1", w, k, t, f)
                        }
                        p.data("data-extFlag", 1)
                    }
                }
            }
        })
    }
    ;
    return c
});
$(document).ready(function() {
    require(["common_impression"], function(a) {
        a.run()
    });
    require(["abtestPv_tracker"], function(a) {
        a.run()
    })
});
(function(b) {
    b.fn.jQFade = function(a) {
        var d = {
            start_opacity: "1",
            high_opacity: "1",
            low_opacity: ".8",
            timing: "500",
            baColor: "#333"
        };
        var a = b.extend(d, a);
        a.element = b(this);
        a.element.delegate("img", "mouseover mouseout", function(e) {
            if (e.type == "mouseover") {
                var c = b(this);
                a.element.css("background-color", a.baColor);
                c.stop().animate({
                    opacity: a.high_opacity
                }, a.timing);
                c.parent().siblings().find("img").stop().animate({
                    opacity: a.low_opacity
                }, a.timing)
            } else {
                var c = b(this);
                a.element.css("background-color", "");
                c.stop().animate({
                    opacity: a.start_opacity
                }, a.timing);
                c.parent().siblings().find("img").stop().animate({
                    opacity: a.start_opacity
                }, a.timing)
            }
        });
        return this
    }
})(jQuery);
var YHDOBJECT = {};
YHDOBJECT.Map = function() {
    var a = 0;
    this.entry = {};
    this.put = function(b, c) {
        if (!this.containsKey(b)) {
            a++
        }
        this.entry[b] = c
    }
    ;
    this.get = function(b) {
        if (this.containsKey(b)) {
            return this.entry[b]
        } else {
            return null
        }
    }
    ;
    this.remove = function(b) {
        if (delete this.entry[b]) {
            a--
        }
    }
    ;
    this.containsKey = function(b) {
        return ( b in this.entry)
    }
    ;
    this.containsValue = function(b) {
        for (var c in this.entry) {
            if (this.entry[c] == b) {
                return true
            }
        }
        return false
    }
    ;
    this.values = function() {
        var b = [];
        for (var c in this.entry) {
            b.push(this.entry[c])
        }
        return b
    }
    ;
    this.keys = function() {
        var b = new Array(a);
        for (var c in this.entry) {
            b.push(c)
        }
        return b
    }
    ;
    this.size = function() {
        return a
    }
    ;
    this.clear = function() {
        this.entry = {};
        this.size = 0
    }
}
;
YHDOBJECT.globalVariable = function() {
    try {
        var b = jQuery("#comParamId").data("globalComParam");
        if (b) {
            return b
        }
        jQuery("#comParamId").data("globalComParam", jQuery.parseJSON(jQuery("#comParamId").attr("data-param")));
        return jQuery("#comParamId").data("globalComParam")
    } catch (a) {
        if (window.console && console.log) {
            console.log(a)
        }
        return {}
    }
}
;
YHDOBJECT.callBackFunc = function(c) {
    var a = {};
    var b = [];
    if (typeof c.func != "undefined" && c.func) {
        a = c.func
    } else {
        return false
    }
    if (typeof c.args != "undefined" && c.args) {
        b = c.args
    }
    a.apply(this, b)
}
;
(function(n) {
    n.fn.jqm = function(f) {
        var e = {
            overlay: 50,
            overlayClass: "jqmOverlay",
            closeClass: "jqmClose",
            trigger: ".jqModal",
            ajax: g,
            ajaxP: g,
            ajaxText: "",
            target: g,
            modal: g,
            toTop: g,
            onShow: g,
            onHide: g,
            onLoad: g
        };
        return this.each(function() {
            if (this._jqm) {
                return d[this._jqm].c = n.extend({}, d[this._jqm].c, f)
            }
            h++;
            this._jqm = h;
            d[h] = {
                c: n.extend(e, n.jqm.params, f),
                a: g,
                w: n(this).addClass("jqmID" + h),
                s: h
            };
            if (e.trigger) {
                n(this).jqmAddTrigger(e.trigger)
            }
        })
    }
    ;
    n.fn.jqmAddClose = function(e) {
        return c(this, e, "jqmHide")
    }
    ;
    n.fn.jqmAddTrigger = function(e) {
        return c(this, e, "jqmShow")
    }
    ;
    n.fn.jqmShow = function(e) {
        return this.each(function() {
            e = e || window.event;
            n.jqm.open(this._jqm, e)
        })
    }
    ;
    n.fn.jqmHide = function(e) {
        return this.each(function() {
            e = e || window.event;
            n.jqm.close(this._jqm, e)
        })
    }
    ;
    n.jqm = {
        hash: {},
        open: function(i, f) {
            var e = d[i]
                , m = e.c
                , v = "." + m.closeClass
                , q = (parseInt(e.w.css("z-index")))
                , q = (q > 0) ? q : 3000
                , u = n("<div></div>").css({
                height: "100%",
                width: "100%",
                position: "fixed",
                left: 0,
                top: 0,
                "z-index": q - 1,
                opacity: m.overlay / 100
            });
            if (e.a) {
                return g
            }
            e.t = f;
            e.a = true;
            e.w.css("z-index", q);
            if (m.modal) {
                if (!j[0]) {
                    b("bind")
                }
                j.push(i)
            } else {
                if (m.overlay > 0) {
                    e.w.jqmAddClose(u)
                } else {
                    u = g
                }
            }
            e.o = (u) ? u.addClass(m.overlayClass).prependTo("body") : g;
            if (l) {
                n("html,body").css({
                    height: "100%",
                    width: "100%"
                });
                if (u) {
                    u = u.css({
                        position: "absolute"
                    })[0];
                    for (var r in {
                        Top: 1,
                        Left: 1
                    }) {
                        u.style.setExpression(r.toLowerCase(), "(_=(document.documentElement.scroll" + r + " || document.body.scroll" + r + "))+'px'")
                    }
                }
            }
            if (m.ajax) {
                var t = m.target || e.w
                    , s = m.ajax
                    , t = (typeof t == "string") ? n(t, e.w) : n(t)
                    , s = (s.substr(0, 1) == "@") ? n(f).attr(s.substring(1)) : s;
                t.html(m.ajaxText).load(s, m.ajaxP, function() {
                    if (m.onLoad) {
                        m.onLoad.call(this, e)
                    }
                    if (v) {
                        e.w.jqmAddClose(n(v, e.w))
                    }
                    a(e)
                })
            } else {
                if (v) {
                    e.w.jqmAddClose(n(v, e.w))
                }
            }
            if (m.toTop && e.o) {
                e.w.before('<span id="jqmP' + e.w[0]._jqm + '"></span>').insertAfter(e.o)
            }
            (m.onShow) ? m.onShow(e) : e.w.show();
            a(e);
            return g
        },
        close: function(f) {
            var e = d[f];
            if (!e.a) {
                return g
            }
            e.a = g;
            if (j[0]) {
                j.pop();
                if (!j[0]) {
                    b("unbind")
                }
            }
            if (e.c.toTop && e.o) {
                n("#jqmP" + e.w[0]._jqm).after(e.w).remove()
            }
            if (e.c.onHide) {
                e.c.onHide(e)
            } else {
                e.w.hide();
                if (e.o) {
                    e.o.remove()
                }
            }
            return g
        },
        params: {}
    };
    var h = 0
        , d = n.jqm.hash
        , j = []
        , l = n.browser.msie && (n.browser.version == "6.0")
        , g = false
        , o = n('<iframe src="javascript:false;document.write(\'\');" class="jqm"></iframe>').css({
        opacity: 0
    })
        , a = function(e) {
        if (l) {
            if (e.o) {
                e.o.html('<p style="width:100%;height:100%"/>').prepend(o)
            } else {
                if (!n("iframe.jqm", e.w)[0]) {
                    e.w.prepend(o)
                }
            }
        }
        p(e)
    }
        , p = function(f) {
        try {
            n(":input:visible", f.w)[0].focus()
        } catch (e) {}
    }
        , b = function(e) {
        n()[e]("keypress", k)[e]("keydown", k)[e]("mousedown", k)
    }
        , k = function(f) {
        var i = d[j[j.length - 1]]
            , e = (!n(f.target).parents(".jqmID" + i.s)[0]);
        if (e) {
            p(i)
        }
        return !e
    }
        , c = function(i, e, f) {
        return i.each(function() {
            var m = this._jqm;
            n(e).each(function() {
                if (!this[f]) {
                    this[f] = [];
                    n(this).click(function() {
                        for (var q in {
                            jqmShow: 1,
                            jqmHide: 1
                        }) {
                            for (var r in this[q]) {
                                if (d[this[q][r]]) {
                                    d[this[q][r]].w[q](this)
                                }
                            }
                        }
                        return g
                    })
                }
                this[f].push(m)
            })
        })
    }
})(jQuery);
jQuery(document).ready(function() {
    if (isIndex == null  || isIndex != 1) {
        jQuery("#yhd_pop_win").bgiframe()
    }
});
var YHD = {
    init: function() {
        if (jQuery("#yhd_pop_win").size() > 0) {
            jQuery("#yhd_pop_win").jqm({
                overlay: 50,
                overlayClass: "jqmOverlay",
                closeClass: "jqmClose",
                trigger: ".jqModal",
                ajax: false,
                ajaxP: false,
                ajaxText: "",
                target: false,
                modal: false,
                toTop: false,
                onShow: false,
                onHide: false,
                onLoad: false
            })
        }
    },
    initPosition: function(d, g, e, f, c) {
        var a = (g == null  ? d.width() : g);
        var i = (e == null  ? d.height() : e);
        jQuery(d).width(a).height(i);
        if (f && c) {
            jQuery(d).css({
                top: f,
                left: c
            })
        } else {
            if (f != null ) {
                jQuery(d).css({
                    top: f
                })
            } else {
                if (c != null ) {
                    jQuery(d).css({
                        left: c
                    })
                } else {
                    var b = (jQuery(window).width() - d.width()) / 2 + jQuery(window).scrollLeft() + "px";
                    var j = (jQuery(window).height() - d.height()) / 2 + jQuery(window).scrollTop() + "px";
                    jQuery(d).css("left", b).css("top", j)
                }
            }
        }
        if (g != null  && e != null ) {
            jQuery(d).jqm({
                onHide: function(h) {
                    h.w.width(0).height(0).hide();
                    if (h.o) {
                        h.o.remove()
                    }
                }
            })
        }
    },
    popwin: function(b, c, d, g, f, e) {
        YHD.init();
        var a = jQuery("#yhd_pop_win");
        if (b != null ) {
            jQuery(a).html(b)
        }
        YHD.initPosition(a, c, d, g, f);
        jQuery(a).jqm({
            overlay: 10,
            overlayClass: "pop_win_bg",
            modal: true,
            toTop: true
        }).jqmShow().jqmAddClose(".popwinClose");
        jQuery(".pop_win_bg").bgiframe()
    },
    popwinId: function(g, f, b, c, e, d) {
        var a = jQuery("#" + g);
        YHD.initPosition(a, b, c, e, d);
        a.css("height", "auto");
        a.css("z-index", "1000");
        a.show();
        if (!f) {
            f = "popwinClose"
        }
        jQuery("." + f, a).bind("click", function() {
            a.hide()
        })
    },
    popTitleWin: function(e, i, f, a, d, c, b) {
        var g = '<H3 class="pop_win_title" >' + e + '<img src="' + imagePath + '/icon_close.jpg" class="popwinClose"/></H3>';
        g += '<div class="pop_win_content" class="content">' + i + "</div>";
        g += '<div style="clear:both"></div>';
        YHD.popwin(g, f, a, d, c, b)
    },
    alert: function(d, c, e, a, b) {
        var f = '<div class="aptab" style="left: 0px; top: 0px;"><div class="aptab_header"><ul><li class="fl pl10">温馨提示</li><li class="popwinClose fr btn_close mr10"><img src="' + imagePath + '/popwin/icon_close.jpg"></li><li class="popwinClose fr mr5 color_white"><a href="###">关闭</a></li></ul> <div class="clear"></div></div>';
        f += '<div class="aptab_center" align="center"><p class="pt10">' + d + "</p>";
        f += '<p class="pt5"><input name="submit" class="pop_win_button popwinClose" id="pop_win_ok_btn" type="button"   value="确 定" /></p>';
        f += "</div>";
        f += '<div class="aptab_footer"><img src="' + imagePath + '/popwin/aptab_footer.jpg"></div></div>';
        if (e == null ) {
            e = 300
        }
        YHD.popwin(f, e, a, null , null , b);
        if (c) {
            jQuery("#pop_win_ok_btn").click(function() {
                c()
            })
        }
    },
    alertPrescriotion: function(k, b, f, d, g) {
        var a = "";
        if (k == null ) {
            a = ""
        } else {
            if (k == 14) {
                a = "本品为处方药，为了用药安全，已经将您的个人信息进行登记，谢谢配合！如需用药指导帮助请联系在线客服！"
            } else {
                if (k == 16 || k == 17 || k == 18) {
                    a = "本品为处方药，不能网络订购；如需购买，请到药店凭处方购买或咨询客服!"
                } else {
                    a = "本品为处方药,请在提交订单前上传处方,如需用药师指导帮助,请联系在线客服！"
                }
            }
        }
        var j = "确定";
        if (k != null  && (k == 16 || k == 17 || k == 18)) {
            j = "关闭"
        }
        var e = '<input name="submit" class="pop_win_button popwinClose fl" id="pop_win_ok_btn" type="button"   value="' + j + '" />';
        var c = '<a href="http://vipwebchat.tq.cn/sendmain.jsp?admiuin=8987730&uin=8987730&tag=call&ltype=1&rand=15214019897292372&iscallback=0&agentid=0&comtimes=48&preuin=8987730&buttonsflag=1010011111111&is_appraise=1&color=6&style=1&isSendPreWords=1&welcome_msg=%C4%FA%BA%C3%A3%A1%CE%D2%CA%C7%C6%BD%B0%B2%D2%A9%CD%F8%B5%C4%D6%B4%D0%D0%D2%A9%CA%A6%A3%AC%C7%EB%CE%CA%C4%FA%D0%E8%D2%AA%CA%B2%C3%B4%B0%EF%D6%FA%A3%BF&tq_right_infocard_url=' + imagePath + "/images/yaowang/v2/tq01.jpg&cp_title=%BB%B6%D3%AD%CA%B9%D3%C3%C6%BD%B0%B2%D2%A9%CD%F8%D4%DA%CF%DF%BD%D3%B4%FD%CF%B5%CD%B3&page=" + imagePath + "/&localurl=" + imagePath + "/channel/15694&spage=" + imagePath + '/&nocache=0.6430502517039929" class="pop_win_button fl" style="display:block;">咨询</a>';
        var i = '<div class="aptab" style="left: 0px; top: 0px;"><div class="aptab_header"><ul><li class="fl pl10">温馨提示</li><li class="popwinClose fr btn_close mr10"><img src="' + imagePath + '/popwin/icon_close.jpg"></li><li class="popwinClose fr mr5 color_white"><a href="###">关闭</a></li></ul> <div class="clear"></div></div>';
        i += '<div class="aptab_center" align="center"><p class="pt10">' + a + "</p>";
        i += '<div class="pt5" style="width:160px;">';
        if (k != null  && (k == 16 || k == 17 || k == 18)) {
            i += c;
            i += e
        } else {
            i += e;
            i += c
        }
        i += '<div class="clear"></div></div>';
        i += '<p class="pt10 mb10" style="color:#b00000;font-weight:bold;">免费客服热线:400-007-0958</p></div>';
        i += '<div class="aptab_footer"><img src="' + imagePath + '/popwin/aptab_footer.jpg"></div></div>';
        if (f == null ) {
            f = 300
        }
        YHD.popwin(i, f, d, null , null , g);
        if (b) {
            if (k != null  && k != 16 && k != 17 && k != 18) {
                jQuery("#pop_win_ok_btn").click(function() {
                    b()
                })
            }
        }
    },
    alertForLottery: function(d, c, e, a, b) {
        var f = '<div class="popbox"><div><h2><a href="#" class="popwinClose">关闭</a>温馨提示</h2><dl class="noaward">';
        f += "<dt>" + d + "</dt>";
        f += '</dl><p><button class="btn_go"  id="pop_win_ok_btn">确定</button></p></div></div>';
        if (e == null ) {
            e = 300
        }
        YHD.popwin(f, e, a, null , null , b);
        if (c) {
            jQuery("#pop_win_ok_btn").click(function() {
                c()
            })
        }
    },
    confirm: function(g, c, b, a, e, f) {
        var d = '<div class="aptab" style="left: 0px; top: 0px;"><div class="aptab_header"><ul><li class="fl pl10">温馨提示</li><li class="popwinClose fr btn_close mr10"><img src="' + imagePath + '/popwin/icon_close.jpg"></li><li class="popwinClose fr mr5 color_white"><a href="###">关闭</a></li></ul> <div class="clear"></div></div>';
        d += '<div class="aptab_center" align="center"><p class="pt10">' + g + "</p>";
        d += '<div align="center"><input name="submit" class="pop_win_button popwinClose" id="pop_win_ok_btn" type="button"   value="确 定" /><input name="submit"   class="pop_win_button popwinClose" type="button" id="pop_win_cancel_btn" value="返回购物车" /></div>';
        d += "</div>";
        d += '<div class="aptab_footer"><img src="' + imagePath + '/popwin/aptab_footer.jpg"></div></div>';
        if (a == null ) {
            a = 300
        }
        YHD.popwin(d, a, e, null , null , f);
        if (c) {
            jQuery("#pop_win_ok_btn").click(function() {
                c()
            })
        }
        if (b) {
            jQuery("#pop_win_cancel_btn").click(function() {
                b()
            })
        }
    },
    confirmToLottery: function(g, c, b, a, e, f) {
        var d = "" + g + "";
        if (a == null ) {
            a = 300
        }
        YHD.popwin(d, a, e, null , null , f);
        if (c) {
            jQuery("#pop_win_ok_btn").click(function() {
                c()
            })
        }
        if (b) {
            jQuery("#pop_win_cancel_btn").click(function() {
                b()
            })
        }
    },
    processBar: function(a, b) {
        if (a) {
            YHD.popwin('<img src="' + imagePath + '/loading.gif" />', null , null , null , null , b)
        } else {
            jQuery("#yhd_pop_win").jqmHide()
        }
    },
    ajax: function(d, c, g, e) {
        var a = jQuery("#yhd_pop_win");
        a.jqm({
            ajax: d,
            ajaxP: c,
            ajaxText: '<img src="' + imagePath + '/loading.gif" />',
            onLoad: g,
            modal: true,
            toTop: true,
            closeClass: "popwinClose"
        }).jqmShow();
        var f = (jQuery(window).width() - a.width()) / 2 + jQuery(window).scrollLeft() + "px";
        var b = (jQuery(window).height() - a.height()) / 2 + jQuery(window).scrollTop() + "px";
        jQuery(a).css("left", f).css("top", b)
    },
    ajaxPointAlert: function(d, c, g, e) {
        var a = jQuery("#yhd_pop_win");
        a.jqm({
            ajax: d,
            ajaxP: c,
            ajaxText: '<img src="' + imagePath + '/loading.gif" />',
            onLoad: g,
            modal: true,
            toTop: true,
            closeClass: "popwinClose"
        }).jqmShow();
        var f = "436.5px";
        var b = (jQuery(window).height() - a.height()) / 2 + jQuery(window).scrollTop() + "px";
        jQuery(a).css("left", f).css("top", b)
    },
    pageX: function(a) {
        a = a || window.event;
        return a.pageX || a.clientX + document.body.scrollLeft
    },
    pageY: function(a) {
        a = a || window.event;
        return a.pageY || a.clientY + document.body.scrollTop
    }
};
(function(b) {
    var a = window.loli || (window.loli = {});
    a.delay = function(k, i, g, c, j) {
        var e = "";
        var l = j || 200;
        var d = l - 50;
        var h;
        b(k)[i](function() {
            var m = b(this);
            var n = true;
            if (g) {
                var n = g.call(m)
            }
            if (!(n == false)) {
                h = setTimeout(function() {
                    f.call(m)
                }, l);
                e = new Date().getTime()
            }
        });
        function f() {
            if ((new Date().getTime() - e) >= d) {
                if (c) {
                    c.call(this)
                }
                e = new Date().getTime()
            }
        }
    }
})(jQuery);
(function() {
    var h = window.loli || (window.loli = {});
    var k = h.cookie = h.cookie || {};
    var j = (typeof globalSyncCookieFlag != "undefined" && globalSyncCookieFlag == "1") ? 1 : 0;
    var c = typeof globalSyncCookieKey != "undefined" ? globalSyncCookieKey : "";
    var g = "yhd.com";
    var d = "yihaodian.com.hk";
    if (h.cookie && h.cookie.set) {
        return
    }
    var f = function() {
            var n = document.domain;
            var m = /([\.\w]*)\.yhd\.com/;
            var l = /([\.\w]*)\.yihaodian\.com\.hk/;
            if (m.test(n)) {
                return g
            } else {
                if (l.test(n)) {
                    return d
                }
            }
            return n
        }
        ;
    var a = function() {
            var n = document.domain;
            var m = /([\.\w]*)\.yhd\.com/;
            var l = /([\.\w]*)\.yihaodian\.com\.hk/;
            if (m.test(n)) {
                return d
            } else {
                if (l.test(n)) {
                    return g
                }
            }
            return n
        }
        ;
    var e = function() {
            var n = document.domain;
            var m = /([\.\w]*)\.yhd\.com/;
            var l = /([\.\w]*)\.yihaodian\.com\.hk/;
            return m.test(n) || l.test(n)
        }
        ;
    var i = function() {
            var m = window.navigator.userAgent.toLowerCase();
            var n = /msie ([\d\.]+)/;
            if (n.test(m)) {
                var l = parseInt(n.exec(m)[1]);
                return l
            }
            return 0
        }
        ;
    var b = function() {
            var l = new Date();
            return (l.getYear() + 1900) + "" + (l.getMonth() + 1) + "" + l.getDate()
        }
        ;
    k.set = function(m, p, q, l, n) {
        var s = n || function() {}
            ;
        var o = f();
        var r = isNaN(l) ? null  : parseInt(l);
        if (typeof r == "number") {
            $.cookie(m, p, {
                domain: o,
                path: q || "/",
                expires: r
            })
        } else {
            $.cookie(m, p, {
                domain: o,
                path: q || "/"
            })
        }
        s({
            status: 1,
            name: m,
            value: p
        })
    }
    ;
    k.get = function(l, m) {
        var o = m || function() {}
            ;
        var n = $.cookie(l);
        o({
            status: 1,
            name: l,
            value: n
        });
        return n
    }
    ;
    k.sendJsonpAjax = function(t, m, p, r) {
        var s = t + "?callback=" + p;
        var n = [];
        for (var l in m) {
            n.push("&" + l + "=" + encodeURIComponent(m[l]))
        }
        s += n.join("");
        window[p] = function(u) {
            r(u);
            if (q) {
                q.removeChild(o)
            }
        }
        ;
        var q = document.getElementsByTagName("head")[0] || document.documentElement;
        var o = document.createElement("script");
        o.src = s;
        q.insertBefore(o, q.firstChild)
    }
    ;
    k.setFromDomain = function(z, B, D, s, r, y) {
        var p = r || function() {}
            ;
        var l = e();
        var A = f();
        var u = y || A;
        if (u == "yhd" || u == g) {
            u = g
        } else {
            if (u == "hk" || u == d) {
                u = d
            } else {
                u = A
            }
        }
        if (u == A) {
            k.set(z, B, D, s, r)
        } else {
            if (!j || !l) {
                p({
                    status: 1,
                    name: z,
                    value: B
                });
                return
            }
            if (!window.postMessage || !window.addEventListener) {
                var C = function(E) {
                        if (E && E.status == "1") {
                            p({
                                status: 1,
                                name: z,
                                value: B
                            })
                        }
                    }
                    ;
                B = (B == null  || typeof B == "undefined") ? "" : B;
                s = (s == null  || typeof s == "undefined") ? "" : s;
                var q = {
                    type: "single",
                    key: z + "|" + B + "|" + s
                };
                var w = "jsonp" + Math.round(Math.random() * 100000);
                var o = window.location.protocol + "//www." + A + (A == g ? "/header" : "/hkHeader") + "/syncCookie.do";
                k.sendJsonpAjax(o, q, w, C);
                return
            }
            var x = "globalCookieAdaptorForSet";
            var t = $("#" + x);
            if (t.size() == 0) {
                var o = window.location.protocol + "//www." + u + "/hkHeader/setCookie.html?v=" + b();
                var v = document.createElement("iframe");
                v.setAttribute("id", x);
                v.setAttribute("style", "display:none");
                v.setAttribute("src", o);
                document.body.appendChild(v);
                t = $("#" + x)
            }
            var m = function(E) {
                    var F = window.location.protocol + "//www." + u;
                    var G = {
                        name: z,
                        value: B,
                        path: D,
                        expires: s,
                        domain: u,
                        op: "cookie"
                    };
                    if (i() == 9) {
                        B = (B == null  || typeof B == "undefined") ? "" : B;
                        s = (s == null  || typeof s == "undefined") ? "" : s;
                        G = '{"name":"' + z + '", "value":"' + B + '", "path":"' + D + '", "expires":"' + s + '", "domain":"' + u + '", "op":"cookie"}'
                    }
                    E.postMessage(G, F);
                    p({
                        status: 1,
                        name: z,
                        value: B
                    })
                }
                ;
            if (t.attr("loaded")) {
                var n = t.get(0).contentWindow;
                m(n)
            } else {
                t.load(function() {
                    $(this).attr("loaded", "1");
                    var E = $(this).get(0).contentWindow;
                    m(E)
                })
            }
        }
    }
    ;
    k.getFromDomain = function(z, v, s) {
        var q = v || function() {}
            ;
        var l = e();
        var u = f();
        var w = s || u;
        if (w == "yhd" || w == g) {
            w = g
        } else {
            if (w == "hk" || w == d) {
                w = d
            } else {
                w = u
            }
        }
        if (w == u) {
            k.get(z, v)
        } else {
            if (!j || !l) {
                q({
                    status: 1,
                    name: z,
                    value: null
                });
                return
            }
            if (!window.postMessage || !window.addEventListener) {
                var B = function(D) {
                        if (D && D.status == "1") {
                            var E = D.result ? D.result[z] : null ;
                            q({
                                status: 1,
                                name: z,
                                value: E
                            })
                        }
                    }
                    ;
                var C = "jsonp" + Math.round(Math.random() * 100000);
                var A = window.location.protocol + "//www." + w + (w == g ? "/header" : "/hkHeader") + "/getCookie.do";
                k.sendJsonpAjax(A, {}, C, B);
                return
            }
            var t = window["yhd.cookie.get.callback"] || (window["yhd.cookie.get.callback"] = []);
            t.push(q);
            var o = t.length - 1;
            var y = "globalCookieAdaptorForGet";
            var r = $("#" + y);
            if (r.size() == 0) {
                var A = window.location.protocol + "//www." + w + "/hkHeader/getCookie.html?v=" + b();
                var x = document.createElement("iframe");
                x.setAttribute("id", y);
                x.setAttribute("style", "display:none");
                x.setAttribute("src", A);
                document.body.appendChild(x);
                r = $("#" + y)
            }
            var n = function(E) {
                    var F = window.location.protocol + "//www." + w;
                    var G = window.location.protocol + "//" + window.location.host;
                    var D = {
                        name: z,
                        host: G,
                        version: o,
                        op: "cookie"
                    };
                    if (i() == 9) {
                        D = '{"name":"' + z + '", "host":"' + G + '", "version":"' + o + '", "op":"cookie"}'
                    }
                    E.postMessage(D, F)
                }
                ;
            if (r.attr("loaded")) {
                var p = r.get(0).contentWindow;
                n(p)
            } else {
                r.load(function() {
                    $(this).attr("loaded", "1");
                    var D = $(this).get(0).contentWindow;
                    n(D)
                })
            }
            var m = function(E) {
                    var H = /^http[s]?:\/\/([\.\w]*)\.yhd\.com/i;
                    var G = /^http[s]?:\/\/([\.\w]*)\.yihaodian\.com\.hk/i;
                    if (H.test(E.origin) || G.test(E.origin)) {
                        var F = E.data;
                        if (F) {
                            if (typeof F == "string") {
                                F = $.parseJSON(F)
                            }
                            if (F.op != "cookie") {
                                return
                            }
                            var D = t[F.version];
                            if (D) {
                                D({
                                    status: 1,
                                    name: F.name,
                                    value: F.value
                                })
                            } else {
                                q({
                                    status: 1,
                                    name: F.name,
                                    value: F.value
                                })
                            }
                        }
                    }
                }
                ;
            if (!window["yhd.cookie.get.handler"]) {
                window.addEventListener("message", m);
                window["yhd.cookie.get.handler"] = m
            }
        }
    }
    ;
    k.setAllDomain = function(m, p, q, l, n) {
        k.set(m, p, q, l);
        if (e()) {
            var o = a();
            k.setFromDomain(m, p, q, l, n, o)
        }
    }
    ;
    k.processServerCookie = function(q) {
        var s = e();
        var m = typeof globalServerCookieKey != "undefined" ? globalServerCookieKey : "";
        var l = $.cookie("globalServerCookieKey") ? $.cookie("globalServerCookieKey") : "";
        var t = "";
        if (!j || !s) {
            return
        }
        if (q) {
            t = q
        } else {
            if (m == l) {
                t = m
            } else {
                if (m != "" && l != "") {
                    t = m + "," + l
                } else {
                    if (m == "" && l != "") {
                        t = l
                    } else {
                        if (m != "" && l == "") {
                            t = m
                        }
                    }
                }
            }
        }
        if (!t) {
            return
        }
        var o = t.split(",");
        for (var n = 0; n < o.length; n++) {
            var r = o[n];
            var p = r.split("|");
            if (p.length == 4) {
                k.setFromDomain(p[0], decodeURIComponent(p[1]), "/", p[2], null , p[3])
            }
        }
        k.set("globalServerCookieKey", null , "/")
    }
    ;
    k.processSyncCookie = function(n) {
        var x = n || c;
        var s = f();
        var p = a();
        var r = e();
        var l = $.cookie("globalSyncCookie");
        if (!j || !r) {
            return
        }
        if (!x || l) {
            return
        }
        if (s == g) {
            var t = x.split(",");
            for (var u = 0; u < t.length; u++) {
                var w = t[u].split("|");
                var v = w[0];
                var o = w[1];
                var m = $.cookie(v);
                if (m) {
                    if (o == "" || o == "-1" || isNaN(o)) {
                        k.setFromDomain(v, m, "/", null , null , p)
                    } else {
                        k.setFromDomain(v, m, "/", o, null , p)
                    }
                }
            }
            $.cookie("globalSyncCookie", "1", {
                domain: s,
                path: "/"
            });
            k.setFromDomain("globalSyncCookie", "1", "/", -1, null , p)
        } else {
            if (s == d) {
                var q = function(C) {
                        if (C.status == 1) {
                            if (C.value) {
                                var y = "";
                                var A = x.split(",");
                                for (var D = 0; D < A.length; D++) {
                                    var E = A[D].split("|");
                                    var z = E[0];
                                    var B = E[1];
                                    if (C.name == z) {
                                        y = B;
                                        break
                                    }
                                }
                                if (y == "" || y == "-1" || isNaN(y)) {
                                    k.set(C.name, C.value, "/")
                                } else {
                                    k.set(C.name, C.value, "/", y)
                                }
                            }
                        }
                    }
                    ;
                var t = x.split(",");
                for (var u = 0; u < t.length; u++) {
                    var w = t[u].split("|");
                    var v = w[0];
                    k.getFromDomain(v, q, p)
                }
                $.cookie("globalSyncCookie", "1", {
                    domain: s,
                    path: "/"
                });
                k.setFromDomain("globalSyncCookie", "1", "/", -1, null , p)
            }
        }
    }
    ;
    $(function() {
        var l = e();
        if (!j || !l) {
            return
        }
        k.processServerCookie();
        if (f() == g) {
            setTimeout(function() {
                k.processSyncCookie()
            }, 1500)
        } else {
            k.processSyncCookie()
        }
    })
})();
(function(h) {
    var f = ".";
    var b = "0";
    var k = "1";
    var m = {
        TPA: "data-tpa",
        TPC: "data-tpc",
        TPI: "tpi",
        TCS: "data-tcs",
        TCD: "data-tcd",
        TCI: "data-tci",
        PC: "data-pc",
        TP: "data-tp",
        TC: "data-tc",
        TCE: "data-tce",
        ABTEST: "data-abtest",
        EXPR_TAG: "a,area,button",
        TPA_CHILD_SIZE: "data-tpaChildSize",
        TPC_CHILD_SIZE: "data-tpcChildSize",
        TC_CHILD_SIZE: "data-tcChildSize",
        RESULT: {
            RESULT: "result",
            TP: "tp",
            TC: "tc",
            UNIID: "uniId",
            PAGETYPE: "pageType",
            PAGEID: "pageId"
        }
    };
    var n = null
        , o = null
        , e = 0;
    var l = window.loli || (window.loli = {});
    var d = l.global.uid;
    var i = {
        getData: function(s) {
            if (l.isSpider()) {
                return {}
            }
            j();
            if (e == -1 || e == 2) {
                return null
            }
            var r = new c(s);
            return r.getData()
        },
        getNewPageData: function() {
            j();
            var s = l.util.url.getParams(location.href) || {};
            var A = /^http[s]?:\/\/([\.\w]*)\.(yhd|yihaodian)\.com/i;
            if (!document.referrer || !A.test(document.referrer)) {
                s = {}
            }
            var y = s.tp;
            var u = s.tc;
            var v = s.tce;
            var z = s.abtest;
            var B = s.ti;
            var t = s.tps;
            var x = 0;
            var r = a();
            if (r && r.length > 0) {
                z = b + f + r;
                x = 1
            }
            var w = {
                tp: y,
                tc: u,
                tce: v,
                abtest: z,
                unValidAB: x,
                ti: B,
                tps: t
            };
            return q(w)
        },
        reloadPage: function(s) {
            var r = g(window.location.href, s);
            window.location.href = r
        },
        refreshPage: function(r, u, t) {
            var s = g(r, u, t);
            window.location.href = s
        },
        openPage: function(u, y, x, t, s) {
            var r = g(y, u, s);
            var v = "";
            if (typeof (x) != "undefined" && x) {
                v = x
            }
            var w = "";
            if (typeof (t) != "undefined" && t) {
                w = t
            }
            window.open(r, v, w)
        },
        getABExpParam: function(r) {
            var s = "";
            if (r && l && l.page && l.page.getABExpParam) {
                s = l.page.getABExpParam(r)
            }
            return s
        }
    };
    function g(v, B, t) {
        if (typeof (v) == "undefined" || !v) {
            return ""
        }
        var D = typeof (B);
        if (D == "undefined" || !B) {
            return v
        }
        var w = null ;
        if (D == "string") {
            var u = B;
            var C = B.indexOf("#");
            if (C == -1) {
                u = "#" + u
            }
            w = h(u)
        } else {
            if (D == "object") {
                w = B
            }
        }
        if (!w) {
            return v
        }
        var y = l.spm.getData(w);
        if (y) {
            var E = y.tp;
            var z = y.tc;
            var A = y.tce;
            var r = y.abtestValue;
            var s = {
                tp: E,
                tc: z,
                tce: A,
                abtest: r
            };
            v = l.util.url.appendParams(v, s)
        }
        if (l.getMousePos) {
            var x = l.getMousePos(t);
            if (x != null ) {
                v = l.util.url.addPosition(x, v)
            }
        }
        return v
    }
    function j() {
        var r = h("meta[name=tp_page]").attr("content");
        r = l.page.checkTpPage(r);
        if (!r) {
            e = -1;
            return
        }
        n = encodeURI(l.page.glSpmcodeToId(null , r[0]));
        o = encodeURI(r[1]);
        if (n && n == "0") {
            e = 2
        }
    }
    function a() {
        var s = h("meta[name=global-abtest]");
        if (s && s.length > 0) {
            var t = s.attr("content");
            if (t && l && l.page && l.page.glABcodeToTag) {
                var r = l.page.glABcodeToTag(t);
                return r
            }
        }
        return ""
    }
    function c(s) {
        var r = this;
        r._dom = s;
        r._opt = {};
        r.init()
    }
    c.prototype = {
        init: function() {
            var s = this
                , r = s._dom;
            if (!r) {
                s.set(m.RESULT.RESULT, 0);
                return
            }
            if (!(r instanceof h)) {
                r = h(r)
            }
            var t = r.data(m.PC);
            if (t == 1) {
                s.set(m.RESULT.RESULT, 1);
                return
            } else {
                if (t == -1) {
                    s.set(m.RESULT.RESULT, 0);
                    return
                }
            }
            var x = p(r, m.TPA);
            if (x.length < 1) {
                if (n) {
                    s.set(m.RESULT.RESULT, 1);
                    s.set(m.TPA, 0);
                    s.set(m.TPC, 0);
                    s.set(m.TPI, 0)
                } else {
                    s.set(m.RESULT.RESULT, 0)
                }
                return
            }
            s.set(m.TPA, x.attr(m.TPA));
            s.initTpaIndex(x);
            var w = r.data(m.TPI);
            if (!w) {
                s.initNewTpaIndex(r, x)
            }
            s.set(m.TPC, r.data(m.TPC));
            s.set(m.TPI, r.data(m.TPI));
            var y = p(r, m.TC);
            if (y && y.length > 0) {
                s.set(m.TC, y.attr(m.TC))
            } else {
                s.initTcdIndex(x);
                var u = p(r, m.TCS);
                var z = p(r, m.TCD);
                if (z.length > 0) {
                    if (!u.attr(m.TCD)) {
                        s.initNewTcdIndex(z, x)
                    }
                    s.set(m.TCS, u.attr(m.TCS));
                    s.set(m.TCD, z.attr(m.TCD));
                    s.set(m.TCI, z.data(m.TCI) || 1)
                }
            }
            var v = p(r, m.ABTEST);
            if (v && v.length > 0) {
                s.set(m.ABTEST, v.attr(m.ABTEST))
            }
            s.set(m.RESULT.RESULT, 1)
        },
        rebuildTP: function(u) {
            var t = u.split(f);
            var s = l.page.glSpmcodeToId("SPM_AREA", t[2]);
            var r = l.page.glSpmcodeToId("SPM_COM", t[3]);
            return (t[0] || "0") + f + (t[1] || "0") + f + (s || "0") + f + (r || "0") + f + (t[4] || "0") + f + (t[5] || "0")
        },
        rebuildTC: function(u) {
            if (!u) {
                return u
            }
            var s = u.split(f);
            var r = l.page.glSpmcodeToId("SPM_SYSTEM_TYPE", s[0] || "0");
            var t = l.page.glSpmcodeToId("SPM_DATA_TYPE", s[2] || "0");
            return r + f + (s[1] || "0") + f + (t || "0") + f + (s[3] || "0") + f + (s[4] || "1")
        },
        rebuildABTest: function(r) {
            return l.page.glABcodeToTag(r)
        },
        getData: function() {
            var L = this
                , K = h(L._dom);
            var x = L.get(m.RESULT.RESULT);
            if (!x) {
                K.data(m.PC, -1);
                return null
            }
            var G = K.data(m.PC);
            var t = "";
            var E = p(K, m.TCE);
            if (E && E.length > 0) {
                t = E.attr(m.TCE)
            }
            if (G == 1) {
                var y = K.data(m.TP);
                var F = K.data(m.TC);
                var w = K.data(m.ABTEST);
                var I = {
                    tp: y,
                    tc: F,
                    tce: t,
                    abtest: w
                };
                var J = q(I);
                return J
            }
            var v = L.get(m.TPA);
            var s = L.get(m.TPC);
            var z = L.get(m.TPI);
            var D = L.get(m.TCS);
            var H = L.get(m.TCD);
            var B = L.get(m.TCI);
            var F = L.get(m.TC);
            var r = n + f + o + f + v + f + s + f + z + f + d;
            var C = "";
            if (F) {
                C = F
            } else {
                if (h.trim(D) != "" || h.trim(H) != "") {
                    if (h.trim(D) != "") {
                        C += D + f
                    } else {
                        C += "0.0" + f
                    }
                    if (h.trim(H) != "") {
                        C += H + f
                    } else {
                        C += "0.0" + f
                    }
                    C += B
                }
            }
            r = this.rebuildTP(r);
            C = this.rebuildTC(C);
            var A = "";
            var w = L.get(m.ABTEST);
            if (w) {
                if (w.indexOf(b + f) < 0) {
                    var u = this.rebuildABTest(w);
                    if (u) {
                        A = k + f + u
                    }
                } else {
                    A = w
                }
            }
            K.data(m.TP, r);
            K.data(m.TC, C);
            K.data(m.ABTEST, A);
            K.data(m.PC, 1);
            var I = {
                tp: r,
                tc: C,
                tce: t,
                abtest: A
            };
            var J = q(I);
            return J
        },
        initTpaIndex: function(r) {
            var B = r.data(m.TPA_CHILD_SIZE);
            if (B) {
                return
            }
            var u = r.find(m.EXPR_TAG);
            B = 1;
            var v = {};
            for (var x = 0, t; t = u[x]; x++) {
                t = h(t);
                var s = p(t, m.TPC);
                var C = t.data(m.TPI);
                if (s.length < 1) {
                    if (!C) {
                        t.data(m.TPI, B)
                    }
                    t.data(m.TPC, 0);
                    B++
                } else {
                    var A = s.find(m.EXPR_TAG);
                    if (A.length == 0) {
                        A = s
                    }
                    var z = s.attr(m.TPC);
                    var y = v[z] || 1;
                    for (var w = 0, D; D = A[w]; w++) {
                        h(D).data(m.TPC, z);
                        if (h(D).data(m.TPI)) {
                            continue
                        }
                        h(D).data(m.TPI, y);
                        y++
                    }
                    v[z] = y;
                    s.data(m.TPC_CHILD_SIZE, v[z])
                }
            }
            r.data(m.TPA_CHILD_SIZE, B)
        },
        initNewTpaIndex: function(w, t) {
            var s = p(w, m.TPC);
            var u = w.data(m.TPI);
            if (s.length < 1) {
                var r = t.data(m.TPA_CHILD_SIZE);
                r++;
                w.data(m.TPC, 0);
                if (!u) {
                    w.data(m.TPI, r)
                }
                t.data(m.TPA_CHILD_SIZE, r)
            } else {
                var v = s.data(m.TPC_CHILD_SIZE) || 0;
                v++;
                w.data(m.TPC, s.attr(m.TPC));
                if (!u) {
                    w.data(m.TPI, v)
                }
                s.data(m.TPC_CHILD_SIZE, v)
            }
        },
        initTcdIndex: function(s) {
            var r = s.data(m.TC_CHILD_SIZE);
            if (r != null ) {
                return
            }
            var v = s.find("[data-tcd]");
            for (var t = 0, u; u = v[t]; t++) {
                u = h(u);
                u.data(m.TCI, t + 1)
            }
            s.data(m.TC_CHILD_SIZE, v.length)
        },
        initNewTcdIndex: function(t, s) {
            var r = s.data(m.TC_CHILD_SIZE);
            r++;
            s.data(m.TC_CHILD_SIZE, r);
            t.data(m.TCI, r)
        },
        get: function(r) {
            return this._opt[r]
        },
        set: function(s, r) {
            this._opt[s] = r
        }
    };
    function q(w) {
        var V = w.tce
            , T = w.abtest
            , r = w.unValidAB
            , t = w.ti
            , x = w.tps;
        var B = w.tp || "";
        var P = w.tc || "";
        var N = "";
        var X = "";
        var U = "";
        var R = "";
        var H = "";
        var z = "";
        var F = "";
        var J = "";
        var D = "";
        var L = "";
        var A = "";
        var C = "";
        var s = "";
        var y = "";
        if (B) {
            B = decodeURIComponent(B);
            var O = B.split(".");
            if (O.length >= 6 && l.config.isValidUID(O[5])) {
                N = O[2] || "0";
                X = O[3] || "0";
                U = O[4] || "0";
                D = O[0] || "0";
                L = O[5] || "0";
                A = O[1] || "0";
                if (P) {
                    var M = P.split(".");
                    R = M[0] || "0";
                    H = M[1] || "0";
                    z = M[2] || "0";
                    F = M[3] || "0";
                    J = M[4] || "1"
                }
                C = T;
                if (t) {
                    var Y = O[5].split("-")[0];
                    var Q = Y + "_" + t;
                    var W = h.cookie(Q);
                    if (W) {
                        var v = W.split("|");
                        if (v) {
                            for (var u = 0; u < v.length; u++) {
                                var K = v[u];
                                if (K && K.indexOf(":") > 0) {
                                    var E = K.split(":");
                                    var S = E[0];
                                    var I = E[1];
                                    if (S == "x") {
                                        s = I
                                    } else {
                                        if (S == "y") {
                                            y = I
                                        }
                                    }
                                }
                            }
                        }
                        h.cookie(Q, "", {
                            expires: -1,
                            path: "/",
                            domain: no3wUrl
                        })
                    }
                } else {
                    if (x && x.indexOf("x") == 0 && x.indexOf("y") > 1 && x.indexOf("y") != x.length - 1) {
                        var G = x.indexOf("y");
                        s = x.substring(1, G);
                        y = x.substring(G + 1)
                    }
                }
            }
        }
        if (!C && r) {
            C = T
        }
        return {
            tp: B,
            tc: P,
            tpa: N,
            tpc: X,
            tpi: U,
            tcs: R,
            tcsa: H,
            tcd: z,
            tcdt: F,
            tci: J,
            tce: V || "",
            abtestValue: C || "",
            pageTypeId: n,
            pageValue: o,
            unid: d,
            refPageTypeId: D,
            refUnid: L,
            refPageValue: A,
            eventXRate: s,
            eventYRate: y
        }
    }
    function p(r, s) {
        return r.closest("[" + s + "]")
    }
    l.spm = i
})(jQuery);
if (typeof no3wUrl == "undefined") {
    var no3wUrl = "yhd.com"
}
function getQueryStringRegExp(e) {
    var f = location.href;
    if (f && f.indexOf("#") > 0) {
        f = f.substring(0, f.indexOf("#"))
    }
    var d = new RegExp("(^|\\?|&)" + e + "=([^&]*)(\\s|&|$)","i");
    if (d.test(f)) {
        return unescape(RegExp.$2.replace(/\+/g, " "))
    } else {
        return ""
    }
}
var referrer = document.referrer ? document.referrer : "";
var referrerDomain = referrer.match(/http[s]?:\/\/([^\/]+)/);
var ref = getQueryStringRegExp("tracker_u");
var uid = getQueryStringRegExp("uid");
var websiteid = getQueryStringRegExp("website_id");
var utype = getQueryStringRegExp("tracker_type");
var adgroupKeywordID = getQueryStringRegExp("adgroupKeywordID");
var edmEmail = getQueryStringRegExp("emailId");
var expire_time_day = new Date((new Date()).getTime() + 1 * 24 * 3600000).toGMTString();
var expire_time_mouth = new Date((new Date()).getTime() + 30 * 24 * 3600000).toGMTString();
if (ref && !isNaN(ref)) {
    if (loli && loli.cookie && loli.cookie.setAllDomain) {
        loli.cookie.setAllDomain("unionKey", ref, "/", 1)
    } else {
        document.cookie = "unionKey=" + ref + ";expires=" + expire_time_day + ";domain=." + no3wUrl + ";path=/"
    }
    if (uid) {
        if (loli && loli.cookie && loli.cookie.setAllDomain) {
            loli.cookie.setAllDomain("uid", uid, "/", 1)
        } else {
            document.cookie = "uid=" + uid + ";expires=" + expire_time_day + ";domain=." + no3wUrl + ";path=/"
        }
    } else {
        if (loli && loli.cookie && loli.cookie.setAllDomain) {
            loli.cookie.setAllDomain("uid", "", "/", -1)
        } else {
            document.cookie = "uid=;expires=" + -1 + ";domain=." + no3wUrl + ";path=/"
        }
    }
    if (websiteid) {
        if (loli && loli.cookie && loli.cookie.setAllDomain) {
            loli.cookie.setAllDomain("websiteid", websiteid, "/", 1)
        } else {
            document.cookie = "websiteid=" + websiteid + ";expires=" + expire_time_day + ";domain=." + no3wUrl + ";path=/"
        }
    } else {
        if (loli && loli.cookie && loli.cookie.setAllDomain) {
            loli.cookie.setAllDomain("websiteid", "", "/", -1)
        } else {
            document.cookie = "websiteid=;expires=" + -1 + ";domain=." + no3wUrl + ";path=/"
        }
    }
}
if (adgroupKeywordID) {
    if (loli && loli.cookie && loli.cookie.setAllDomain) {
        loli.cookie.setAllDomain("adgroupKeywordID", adgroupKeywordID, "/", 1)
    } else {
        document.cookie = "adgroupKeywordID=" + adgroupKeywordID + ";expires=" + expire_time_day + ";domain=." + no3wUrl + ";path=/"
    }
}
if (utype) {
    if (loli && loli.cookie && loli.cookie.setAllDomain) {
        loli.cookie.setAllDomain("unionType", utype, "/", 30)
    } else {
        document.cookie = "unionType=" + utype + ";expires=" + expire_time_mouth + ";domain=." + no3wUrl + ";path=/"
    }
}
if (edmEmail) {
    if (loli && loli.cookie && loli.cookie.setAllDomain) {
        loli.cookie.setAllDomain("edmEmail", edmEmail, "/")
    } else {
        document.cookie = "edmEmail=" + edmEmail + ";domain=." + no3wUrl + ";path=/"
    }
}
Array.prototype.toTRACKERJSONString = function() {
    var d = "[";
    for (var c = 0; c < this.length; c++) {
        if (this[c] instanceof Parameter) {
            if (this[c].value instanceof Array) {
                d += "{" + this[c].key + "=" + this[c].value.toTRACKERJSONString() + "},"
            } else {
                d += this[c].toJSONString() + ","
            }
        }
    }
    if (d.indexOf(",") > 0) {
        d = d.substring(0, d.length - 1)
    }
    return d + "]"
}
;
function Parameter(d, c) {
    this.key = d;
    if (this.key == "internalKeyword") {
        this.value = encodeURIComponent(c)
    } else {
        this.value = c
    }
    this.toJSONString = function() {
        return "{" + this.key + "=" + this.value + "}"
    }
}
function addPublicParameter(s, n) {
    var l = location.href;
    s += "&w_url=" + encodeURIComponent(l);
    s += "&s_iev=" + navigator.userAgent || "";
    var o = "iPod|iTouch|iPhone";
    var v = /iPad/i;
    var r = "Android|BlackBerry|SymbianOS|SymbOS|Windows Phone OS|WAP|Kindle|pad|pod";
    var t = window.navigator.userAgent;
    var m = new RegExp(o,"i");
    var u = new RegExp(r,"i");
    if (m.test(t)) {
        s += "&s_plt=IOSSystem";
        s += "&s_ct=H5"
    } else {
        if (v.test(t)) {
            s += "&s_plt=iPad-PC";
            s += "&s_ct=" + navigator.platform || ""
        } else {
            if (u.test(t)) {
                s += "&s_plt=AndroidSystem";
                s += "&s_ct=H5"
            } else {
                s += "&s_plt=" + navigator.platform || ""
            }
        }
    }
    s += "&s_rst=" + window.screen.width + "*" + window.screen.height;
    var p = q("glTrueReffer");
    if (p && p.match(/http(s)?:\/\/.+/)) {
        s += "&w_rfu=" + encodeURIComponent(p)
    } else {
        s += "&w_rfu=" + encodeURIComponent(document.referrer || "")
    }
    return s;
    function q(a) {
        var b = location.href;
        if (b && b.indexOf("#") > 0) {
            b = b.substring(0, b.indexOf("#"))
        }
        var c = new RegExp("(^|\\?|&)" + a + "=([^&]*)(\\s|&|$)","i");
        if (c.test(b)) {
            return unescape(RegExp.$2.replace(/\+/g, " "))
        } else {
            return ""
        }
    }
}
var trackerSupportKey = new Object();
trackerSupportKey.infoPageId = "w_pif";
trackerSupportKey.tp = "w_tp";
trackerSupportKey.tc = "w_tc";
trackerSupportKey.guid = "guid";
trackerSupportKey.attachedInfo = "b_ai";
trackerSupportKey.tracker_u = "b_tu";
trackerSupportKey.tracker_type = "b_trt";
trackerSupportKey.ip = "u_ip";
trackerSupportKey.infoTrackerSrc = "w_ts";
trackerSupportKey.cookie = "w_ck";
trackerSupportKey.orderCode = "b_oc";
trackerSupportKey.endUserId = "u_uid";
trackerSupportKey.firstLink = "w_flk";
trackerSupportKey.productId = "b_pid";
trackerSupportKey.curMerchantId = "u_cm";
trackerSupportKey.provinceId = "u_pid";
trackerSupportKey.fee = "b_fee";
trackerSupportKey.edmActivity = "b_ea";
trackerSupportKey.edmEmail = "b_ee";
trackerSupportKey.edmJobId = "b_ejb";
trackerSupportKey.internalKeyword = "b_ik";
trackerSupportKey.resultSum = "b_rs";
trackerSupportKey.currentPage = "b_scp";
trackerSupportKey.linkPosition = "b_lp";
trackerSupportKey.buttonPosition = "b_bp";
trackerSupportKey.adgroupKeywordID = "b_ak";
trackerSupportKey.extField3 = "b_set";
trackerSupportKey.extField6 = "b_adt";
trackerSupportKey.extField7 = "b_pmi";
trackerSupportKey.extField8 = "b_tid";
trackerSupportKey.extField9 = "b_cid";
trackerSupportKey.extField10 = "s_and";
trackerSupportKey.pageTypeId = "w_pt";
trackerSupportKey.unid = "w_un";
trackerSupportKey.pageValue = "w_pv";
trackerSupportKey.refPageTypeId = "w_rpt";
trackerSupportKey.refUnid = "w_run";
trackerSupportKey.refPageValue = "w_rpv";
trackerSupportKey.eventId = "b_ei";
trackerSupportKey.labelId = "b_li";
trackerSupportKey.filterInfo = "b_fi";
trackerSupportKey.activityId = "b_aci";
trackerSupportKey.listCategoryId = "b_lci";
trackerSupportKey.pmStatusTypeId = "b_pms";
trackerSupportKey.container = "s_ct";
trackerSupportKey.containerVersion = "s_ctv";
trackerSupportKey.platVersion = "s_pv";
trackerSupportKey.phoneType = "s_pt";
trackerSupportKey.provider = "s_pro";
trackerSupportKey.netType = "s_nt";
trackerSupportKey.tpa = "w_tpa";
trackerSupportKey.tpc = "w_tpc";
trackerSupportKey.tpi = "w_tpi";
trackerSupportKey.tcs = "w_tcs";
trackerSupportKey.tcsa = "w_tca";
trackerSupportKey.tcdt = "w_tct";
trackerSupportKey.tcd = "w_tcd";
trackerSupportKey.tci = "w_tci";
trackerSupportKey.tce = "w_tce";
trackerSupportKey.positionTypeId = "b_pyi";
trackerSupportKey.scrollTop = "w_st";
trackerSupportKey.abtestValue = "b_abv";
trackerSupportKey.newUserFlag = "b_nu";
trackerSupportKey.clientTime = "b_clt";
trackerSupportKey.eventXRate = "b_exr";
trackerSupportKey.eventYRate = "b_eyr";
trackerSupportKey.serverTime = "b_svt";
function TrackerContainer(d) {
    var e = (typeof URLPrefix != "undefined" && URLPrefix.tracker) ? URLPrefix.tracker : "tracker.yhd.com";
    this.url = ("https:" == document.location.protocol ? "https://" : "http://") + e + "/tracker/newInfo.do?1=1";
    this.url = addPublicParameter(this.url, d);
    this.parameterArray = [];
    this.stockArray = [];
    this.commonAttached = [];
    this.addParameter = function(a) {
        this.parameterArray.push(a)
    }
    ;
    this.addStock = function(a, b) {
        this.stockArray.push(new Parameter(a,b))
    }
    ;
    this.addCommonAttached = function(b, a) {
        this.commonAttached.push(new Parameter(b,a))
    }
    ;
    this.buildAttached = function() {
        if (this.stockArray.length > 0) {
            this.commonAttached.push(new Parameter("1",this.stockArray))
        }
        if (this.commonAttached.length > 0) {
            this.addParameter(new Parameter("attachedInfo",this.commonAttached.toTRACKERJSONString("attachedInfo")))
        }
    }
    ;
    var f = trackerGetCookie("newUserFlag");
    if (f) {
        this.addParameter(new Parameter("newUserFlag",f))
    }
    this.toUrl = function() {
        this.buildAttached();
        var c = "&bd={";
        for (var a = 0; a < this.parameterArray.length; a++) {
            var b = trackerSupportKey[this.parameterArray[a].key];
            var h = this.parameterArray[a].value;
            if (b) {
                c += b + "=" + h;
                if (a < this.parameterArray.length - 1) {
                    c += "|"
                }
            }
        }
        c += "}";
        return this.url + c
    }
}
function addTrackPositionToCookie(d, c) {
    if (loli && loli.cookie && loli.cookie.setFromDomain) {
        loli.cookie.setFromDomain("linkPosition", encodeURIComponent(c), "/", null , null , no3wUrl)
    } else {
        document.cookie = "linkPosition=" + encodeURIComponent(c) + ";path=/;domain=." + no3wUrl + ";"
    }
}
function addPageMsgToCookie(b) {
    if (typeof (b) == "object" && b) {
        if (typeof (b.pmInfoId) != "undefined") {
            document.cookie = "pmInfoId=" + b.pmInfoId + ";path=/;domain=." + no3wUrl + ";"
        }
        if (typeof (b.productId) != "undefined") {
            document.cookie = "productId=" + b.productId + ";path=/;domain=." + no3wUrl + ";"
        }
    }
}
function trackerGetCookie(h) {
    var f = document.cookie;
    var j = f.split("; ");
    for (var g = 0; g < j.length; g++) {
        var i = j[g].split("=");
        if (i[0] == h) {
            return i[1]
        }
    }
    return null
}
function trackerClearCookieWithName(e, d) {
    var f = new Date();
    f.setTime(f.getTime() - 10000);
    document.cookie = e + "=" + d + ";path=/;domain=." + no3wUrl + ";expires=" + f.toGMTString()
}
var e1 = /exfield1=[^;]*;*/i;
var e2 = new RegExp("exfield2=[^;]*;*","i");
var e3 = new RegExp("exfield3=[^;]*;*","i");
var e4 = new RegExp("exfield4=[^;]*;*","i");
var e5 = new RegExp("exfield5=[^;]*;*","i");
function batchRecordTrackerInfo(j) {
    if (j && j.length > 0) {
        var k = ("https:" == document.location.protocol ? "https://" : "http://") + URLPrefix.tracker + "/related/newInfo.do?1=1";
        k = addPublicParameter(k);
        var g = [];
        for (var i = 0, l = j.length; i < l; i++) {
            var h = recordTrackerGroup(j[i]);
            g[i] = '{"bd":"{' + h + '}"}'
        }
        k += "&batchInfo=[" + g.join(",") + "]";
        sendImgUrl(k)
    }
}
function recordTrackInfoWithType(k, i, l, h, m) {
    var n = ("https:" == document.location.protocol ? "https://" : "http://") + URLPrefix.tracker + "/related/newInfo.do?1=1";
    n = addPublicParameter(n);
    var j = {
        type: k,
        info: i,
        others: l,
        extend: h,
        paramObj: m
    };
    sendImgUrl(n + "&bd={" + recordTrackerGroup(j) + "}")
}
function recordTrackerGroup(y) {
    if (!y) {
        return
    }
    var C = y.type;
    var D = y.info;
    var i = y.others;
    var u = y.extend;
    var B = y.paramObj;
    var z = {};
    if (B) {
        for (var A in B) {
            var w = trackerSupportKey[A];
            if (w) {
                z[w] = B[A]
            } else {
                z[A] = B[A]
            }
        }
    }
    if (trackerGetCookie("yihaodian_uid")) {
        z[trackerSupportKey.endUserId] = trackerGetCookie("yihaodian_uid")
    }
    if (C && D) {
        z.b_it = C;
        z.b_ri = encodeURIComponent(D) || "";
        z.b_ai = encodeURIComponent(i) || "";
        if (u) {
            var E = e1.exec(u);
            if (E) {
                z.b_e1 = encodeURIComponent(E[0].replace(/exfield1=/i, "").replace(";", ""))
            }
            var r = e2.exec(u);
            if (r) {
                z.b_e2 = encodeURIComponent(r[0].replace(/exfield2=/i, "").replace(";", ""))
            }
            var s = e3.exec(u);
            if (s) {
                z.b_e3 = encodeURIComponent(s[0].replace(/exfield3=/i, "").replace(";", ""))
            }
            var F = e4.exec(u);
            if (F) {
                z.b_e4 = encodeURIComponent(F[0].replace(/exfield4=/i, "").replace(";", ""))
            }
            var t = e5.exec(u);
            if (t) {
                z.b_e5 = encodeURIComponent(t[0].replace(/exfield5=/i, "").replace(";", ""))
            }
        }
        var v = "";
        for (var x in z) {
            if (v != "") {
                v += "|"
            }
            v += x + "=" + z[x]
        }
        return v
    }
}
function gotracker(p, x, s, o, y) {
    var u = new TrackerContainer("1");
    if (trackerGetCookie("yihaodian_uid")) {
        u.addParameter(new Parameter("endUserId",trackerGetCookie("yihaodian_uid")))
    }
    if (trackerGetCookie("provinceId")) {
        u.addParameter(new Parameter("provinceId",trackerGetCookie("provinceId")))
    }
    if (x) {
        u.addParameter(new Parameter("buttonPosition",x))
    } else {
        u.addParameter(new Parameter("buttonPosition","defaultButton"))
    }
    if (s) {
        u.addParameter(new Parameter("productId",s))
    }
    if (typeof (p) == "number" && (p > 2 || p < 0)) {
        u.addParameter(new Parameter("extField7",p))
    } else {
        if (typeof (p) == "string") {
            var w = Number(p);
            if (w > 2 || w < 0) {
                u.addParameter(new Parameter("extField7",w))
            }
        }
    }
    if (typeof (o) == "object" && o) {
        for (var A in o) {
            u.addParameter(new Parameter(A,o[A]))
        }
        if (!o.positionTypeId) {
            u.addParameter(new Parameter("positionTypeId","2"))
        }
        var t = window.loli || {};
        if (!o.pageTypeId && t && t.page) {
            var z = t.page.getCurrPageInfo();
            if (z) {
                var q = z.pageType;
                var v = z.pageValue;
                u.addParameter(new Parameter("pageTypeId",q));
                u.addParameter(new Parameter("pageValue",v));
                u.addParameter(new Parameter("refPageTypeId",q));
                u.addParameter(new Parameter("refPageValue",v))
            }
        }
        if (t && t.getMousePos) {
            var B = t.getMousePos(y);
            if (B != null ) {
                if (!o.eventXRate) {
                    u.addParameter(new Parameter("eventXRate",B.xrate))
                }
                if (!o.eventYRate) {
                    u.addParameter(new Parameter("eventYRate",B.yrate))
                }
            }
        }
    } else {
        var t = window.loli || {};
        if (t && t.page) {
            var z = t.page.getCurrPageInfo();
            if (z) {
                var q = z.pageType;
                var v = z.pageValue;
                u.addParameter(new Parameter("pageTypeId",q));
                u.addParameter(new Parameter("pageValue",v));
                u.addParameter(new Parameter("refPageTypeId",q));
                u.addParameter(new Parameter("refPageValue",v))
            }
        }
        if (t && t.getMousePos) {
            var B = t.getMousePos(y);
            if (B != null ) {
                u.addParameter(new Parameter("eventXRate",B.xrate));
                u.addParameter(new Parameter("eventYRate",B.yrate))
            }
        }
        u.addParameter(new Parameter("positionTypeId","2"))
    }
    var r = trackerGetCookie("edmEmail");
    if (r) {
        u.addParameter(new Parameter("edmEmail",r))
    }
    u.addParameter(new Parameter("clientTime",new Date().getTime()));
    sendImgUrl(u.toUrl())
}
function bindLinkClickTracker(f, d) {
    var e = jQuery("#" + f + " a");
    e.click(function() {
        var a = jQuery(this).text();
        a = d + "_" + encodeURIComponent(jQuery.trim(a));
        addTrackPositionToCookie("1", a)
    })
}
(function() {
    var b = trackerGetCookie("guid");
    if (!b) {
        document.cookie = "newUserFlag=" + 1 + ";domain=." + no3wUrl + ";path=/";
        if (loli && loli.cookie && loli.cookie.setAllDomain) {
            loli.cookie.setAllDomain("newUserFlag", 1, "/")
        }
    }
})();
function addParamsToTracker(k) {
    var m = trackerGetCookie("guid");
    if (m) {
        k.addParameter(new Parameter("guid",m))
    } else {
        var i = window.loli || {};
        if (i.util && i.util.generateMixed) {
            var n = new Date();
            n.setTime(n.getTime() + 50 * 365 * 24 * 60 * 60 * 1000);
            m = i.util.generateMixed(36);
            document.cookie = "guid=" + m + ";domain=." + no3wUrl + ";path=/;expires=" + n.toGMTString();
            if (i.cookie && i.cookie.setAllDomain) {
                i.cookie.setAllDomain("guid", m, "/", 50 * 365)
            }
            var l = trackerGetCookie("guid");
            if (l != m) {
                m = "guid_" + m
            }
            k.addParameter(new Parameter("guid",m))
        }
    }
    if (trackerGetCookie("unionKey")) {
        k.addParameter(new Parameter("tracker_u",trackerGetCookie("unionKey")))
    }
    if (trackerGetCookie("unionType")) {
        k.addParameter(new Parameter("tracker_type",trackerGetCookie("unionType")))
    }
    if (trackerGetCookie("adgroupKeywordID")) {
        k.addParameter(new Parameter("adgroupKeywordID",trackerGetCookie("adgroupKeywordID")))
    }
    if (trackerGetCookie("edmEmail")) {
        k.addParameter(new Parameter("edmEmail",trackerGetCookie("edmEmail")))
    }
    if (trackerGetCookie("yihaodian_uid")) {
        k.addParameter(new Parameter("endUserId",trackerGetCookie("yihaodian_uid")))
    }
    if (trackerGetCookie("abtest")) {
        k.addParameter(new Parameter("extField6",trackerGetCookie("abtest")))
    }
    if (trackerGetCookie("provinceId")) {
        k.addParameter(new Parameter("provinceId",trackerGetCookie("provinceId")))
    }
    if (trackerGetCookie("extField8")) {
        k.addParameter(new Parameter("extField8",trackerGetCookie("extField8")))
    }
    if (trackerGetCookie("extField9")) {
        k.addParameter(new Parameter("extField9",trackerGetCookie("extField9")))
    }
    if (trackerGetCookie("extField10")) {
        k.addParameter(new Parameter("extField10",trackerGetCookie("extField10")))
    }
    var o = "";
    if (trackerGetCookie("msessionid")) {
        o = "msessionid:" + trackerGetCookie("msessionid")
    }
    if (trackerGetCookie("uname")) {
        o += ",uname:" + trackerGetCookie("uname")
    }
    if (trackerGetCookie("unionKey")) {
        o += ",unionKey:" + trackerGetCookie("unionKey")
    }
    if (trackerGetCookie("unionType")) {
        o += ",unionType:" + trackerGetCookie("unionType")
    }
    if (trackerGetCookie("tracker")) {
        o += ",tracker:" + trackerGetCookie("tracker")
    }
    if (trackerGetCookie("LTINFO")) {
        o += ",LTINFO:" + trackerGetCookie("LTINFO")
    }
    if (o) {
        k.addParameter(new Parameter("cookie",o))
    }
    if (getQueryStringRegExp("tracker_src")) {
        k.addParameter(new Parameter("infoTrackerSrc",getQueryStringRegExp("tracker_src")))
    }
    if (getQueryStringRegExp("fee")) {
        k.addParameter(new Parameter("fee",getQueryStringRegExp("fee")))
    }
    k.addParameter(new Parameter("clientTime",new Date().getTime()));
    var p = j();
    if (p) {
        p = encodeURIComponent(p);
        k.addParameter(new Parameter("infoPageId",p))
    }
    function j() {
        var b = null ;
        try {
            if (parent !== window) {
                try {
                    b = parent.location.href
                } catch (a) {
                    b = document.referrer
                }
            }
        } catch (a) {}
        return b
    }
}
var trackerContainer = new TrackerContainer();
addParamsToTracker(trackerContainer);
function sendPvTracker(m) {
    if (!m) {
        var m = new TrackerContainer();
        addParamsToTracker(m)
    }
    var t = false;
    if (loli && loli.cookie && loli.cookie.getFromDomain) {
        var q = /([\.\w]*)\.yihaodian\.com\.hk/;
        var s = document.domain;
        if (q.test(s)) {
            t = true
        }
        loli.cookie.getFromDomain("linkPosition", function(b) {
            if (b && b.status == 1) {
                var a = b.value;
                if (a) {
                    m.addParameter(new Parameter("linkPosition",a));
                    loli.cookie.setFromDomain("linkPosition", "", "/", -1, null , no3wUrl)
                }
            }
        }, no3wUrl)
    } else {
        var n = trackerGetCookie("linkPosition");
        if (n) {
            m.addParameter(new Parameter("linkPosition",n));
            trackerClearCookieWithName("linkPosition", n)
        }
    }
    var p = window.loli || {};
    if (p && p.spm) {
        var o = p.spm.getNewPageData();
        if (o && typeof (o) == "object") {
            for (var l in o) {
                m.addParameter(new Parameter(l,o[l]))
            }
            if (!o.positionTypeId) {
                m.addParameter(new Parameter("positionTypeId","1"))
            }
        } else {
            m.addParameter(new Parameter("positionTypeId","1"))
        }
    }
    var r = trackerGetCookie("pmInfoId");
    if (r) {
        m.addParameter(new Parameter("extField7",r));
        trackerClearCookieWithName("pmInfoId", r)
    }
    var u = trackerGetCookie("productId");
    if (u) {
        m.addParameter(new Parameter("productId",u));
        trackerClearCookieWithName("productId", u)
    }
    if ($("#span_server_time_tracker").length > 0) {
        var v = $("#span_server_time_tracker").text();
        m.addParameter(new Parameter("serverTime",v))
    }
    sendImgUrl(m.toUrl(), t)
}
function sendImgUrl(f, e) {
    var d = "timg" + new Date().getTime();
    window[d] = new Image(1,1);
    if (e) {
        setTimeout(function() {
            window[d].src = f
        }, 1000)
    } else {
        window[d].src = f
    }
}
$(document).ready(function() {
    if (trackerContainer && trackerContainer.timeout) {
        var a = trackerContainer.timeout;
        setTimeout(function() {
            sendPvTracker(trackerContainer)
        }, a)
    } else {
        sendPvTracker(trackerContainer)
    }
});
(function() {
    var b = window.loli || (window.loli = {});
    var i = "localStorage"
        , k = "sessionStorage"
        , e = {}
        , h = {};
    e.set = function(n, m) {}
    ;
    e.get = function(m) {}
    ;
    e.remove = function(m) {}
    ;
    e.clear = function() {}
    ;
    h.set = function(n, m) {}
    ;
    h.get = function(m) {}
    ;
    h.remove = function(m) {}
    ;
    h.clear = function() {}
    ;
    function f(n) {
        try {
            return ( n in window && window[n])
        } catch (m) {
            return false
        }
    }
    function j(n, o) {
        var m = window[n];
        o.set = function(p, q) {
            if (q === undefined) {
                return m.remove(p)
            }
            m.setItem(p, q);
            return q
        }
        ;
        o.get = function(p) {
            return m.getItem(p)
        }
        ;
        o.remove = function(p) {
            m.removeItem(p)
        }
        ;
        o.clear = function() {
            m.clear()
        }
    }
    if (f(i)) {
        j(i, e)
    }
    if (f(k)) {
        j(k, h)
    }
    var a = function() {
            var p = false;
            var o = document.domain;
            var m = /([^\.]*)\.yhd\.com/;
            if (m.test(o)) {
                var n = m.exec(o)[1];
                if (n == "www") {
                    p = true
                }
            }
            return p
        }
        ;
    var d = function() {
            var o = window.navigator.userAgent.toLowerCase();
            var m = /msie ([\d\.]+)/;
            if (m.test(o)) {
                var n = parseInt(m.exec(o)[1]);
                return n
            }
            return 0
        }
        ;
    var g = function() {
            var m = new Date();
            return (m.getYear() + 1900) + "" + (m.getMonth() + 1) + "" + m.getDate()
        }
        ;
    var l = function(q, p, t, n) {
            var r = t || function() {}
                ;
            var w = (n && n == "session") ? h : e;
            if (a()) {
                var s = w.set(q, p);
                r({
                    status: 1,
                    key: q,
                    value: s
                })
            } else {
                if (!window.postMessage || !window.addEventListener) {
                    r({
                        status: 0,
                        key: q,
                        value: null
                    });
                    return
                }
                var m = "globalLocalStorageAdaptorForSet";
                var u = $("#" + m);
                if (u.size() == 0) {
                    var x = document.createElement("iframe");
                    x.setAttribute("id", m);
                    x.setAttribute("style", "display:none");
                    x.setAttribute("src", window.location.protocol + "//www.yhd.com/html/setLocalStorage.html?v=" + g());
                    document.body.appendChild(x);
                    u = $("#" + m)
                }
                var o = function(A) {
                        var y = window.location.protocol + "//www.yhd.com";
                        var z = {
                            key: q,
                            value: p,
                            type: n,
                            op: "storage"
                        };
                        if (d() == 9) {
                            z = '{"key":"' + q + '", "value":"' + p + '", "type":"' + n + '", "op":"storage"}'
                        }
                        A.postMessage(z, y);
                        r({
                            status: 1,
                            key: q,
                            value: p
                        })
                    }
                    ;
                if (u.attr("loaded")) {
                    var v = u.get(0).contentWindow;
                    o(v)
                } else {
                    u.load(function() {
                        $(this).attr("loaded", "1");
                        var y = $(this).get(0).contentWindow;
                        o(y)
                    })
                }
            }
        }
        ;
    var c = function(y, n, w) {
            var z = n || function() {}
                ;
            var q = (w && w == "session") ? h : e;
            if (a()) {
                var m = q.get(y);
                z({
                    status: 1,
                    key: y,
                    value: m
                })
            } else {
                if (!window.postMessage || !window.addEventListener) {
                    z({
                        status: 0,
                        key: y,
                        value: null
                    });
                    return
                }
                var u = window["yhd.storage.get.callback"] || (window["yhd.storage.get.callback"] = []);
                u.push(z);
                var s = u.length - 1;
                var v = "globalLocalStorageAdaptorForGet";
                var o = $("#" + v);
                if (o.size() == 0) {
                    var r = document.createElement("iframe");
                    r.setAttribute("id", v);
                    r.setAttribute("style", "display:none");
                    r.setAttribute("src", window.location.protocol + "//www.yhd.com/html/getLocalStorage.html?v=" + g());
                    document.body.appendChild(r);
                    o = $("#" + v)
                }
                var x = function(A) {
                        var B = window.location.protocol + "//www.yhd.com";
                        var C = window.location.protocol + "//" + window.location.host;
                        var D = {
                            key: y,
                            host: C,
                            version: s,
                            type: w,
                            op: "storage"
                        };
                        if (d() == 9) {
                            D = '{"key":"' + y + '", "host":"' + C + '", "version":"' + s + '", "type":"' + w + '", "op":"storage"}'
                        }
                        A.postMessage(D, B)
                    }
                    ;
                if (o.attr("loaded")) {
                    var p = o.get(0).contentWindow;
                    x(p)
                } else {
                    o.load(function() {
                        $(this).attr("loaded", "1");
                        var A = $(this).get(0).contentWindow;
                        x(A)
                    })
                }
                var t = function(B) {
                        var A = /^http[s]?:\/\/([\.\w]*)\.yhd\.com/i;
                        var E = /^http[s]?:\/\/([\.\w]*)\.yihaodian\.com\.hk/i;
                        if (A.test(B.origin) || E.test(B.origin)) {
                            var C = B.data;
                            if (C) {
                                if (typeof C == "string") {
                                    C = $.parseJSON(C)
                                }
                                if (C.op != "storage") {
                                    return
                                }
                                var D = u[C.version];
                                if (D) {
                                    D({
                                        status: 1,
                                        key: C.key,
                                        value: C.value
                                    })
                                } else {
                                    z({
                                        status: 1,
                                        key: C.key,
                                        value: C.value
                                    })
                                }
                            }
                        }
                    }
                    ;
                if (!window["yhd.storage.get.handler"]) {
                    window.addEventListener("message", t);
                    window["yhd.storage.get.handler"] = t
                }
            }
        }
        ;
    e.isRoot = a;
    e.isIE = d;
    e.setFromRoot = function(n, m, o) {
        l(n, m, o, "local")
    }
    ;
    e.getFromRoot = function(n, m) {
        c(n, m, "local")
    }
    ;
    h.setFromRoot = function(n, m, o) {
        l(n, m, o, "session")
    }
    ;
    h.getFromRoot = function(n, m) {
        c(n, m, "session")
    }
    ;
    b.yhdStore = e;
    b.yhdSessionStore = h
})();
function DrawImage(b, c, a) {
    var d = new Image();
    d.src = b.src;
    if (d.width > 0 && d.height > 0) {
        if (d.width / d.height >= c / a) {
            if (d.width > c) {
                b.width = c;
                b.height = (d.height * c) / d.width
            } else {
                b.width = d.width;
                b.height = d.height
            }
        } else {
            if (d.height > a) {
                b.height = a;
                b.width = (d.width * a) / d.height
            } else {
                b.width = d.width;
                b.height = d.height
            }
        }
    }
}
function switch_btn_img(a, b) {
    if (a != null  && b != null ) {
        jQuery(a).attr("src", b)
    }
}
function getProductPicByDefaultPic(d, f, a) {
    try {
        var e = /^(http|https):\/\/(d\d{1,2})\./;
        if (d && d.search(e) != -1) {
            f = f > 1000 ? 1000 : f;
            a = a > 1000 ? 1000 : a;
            var e = /_(\d{1,4}x\d{1,4})\.\w{3,5}$/;
            if (e.test(d)) {
                return d.replace(/_(\d{1,4}x\d{1,4})\./, "_" + f + "x" + a + ".")
            } else {
                var b = d.lastIndexOf(".");
                if (b > 0 && d.length - b <= 6) {
                    return d.substring(0, b) + "_" + f + "x" + a + d.substring(b)
                }
            }
        } else {
            if (d) {
                return d
            }
        }
        var c = 115;
        if (f < 80) {
            c = 40
        } else {
            if (f > 150) {
                c = 200
            }
        }
        return "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_" + c + "x" + c + ".jpg"
    } catch (g) {}
    return "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_115x115.jpg"
}
(function(d) {
    function b(j, h) {
        var l = null ;
        var i = j[h];
        var k = i != null  ? i : [];
        for (var n = 0; n < k.length; n++) {
            var m = k[n];
            if (m && m.commonScreenImgUrl) {
                l = m;
                break
            }
        }
        return l
    }
    function g(i, k) {
        if (i.attr("data-done") == "1") {
            return
        }
        var j = k.tc;
        var h = k.tc_ext;
        if (j) {
            i.attr("data-tc", j + ".1");
            if (h) {
                i.attr("data-tce", h)
            }
        }
        i.attr("href", k.landingPage).attr("title", k.text).attr("data-done", "1").attr("data-ref", k.ref);
        d("b", i).text(k.text);
        d("p", i).text(k.nameSubtitle)
    }
    function e(i, h) {
        if (i.attr("data-done") == "1") {
            return
        }
        i.attr("alt", h.text).attr("src", h.commonScreenImgUrl).attr("data-done", "1");
        if (i.attr("shortimg") != null ) {
            i.attr("shortimg", h.commonScreenImgUrl)
        }
        if (i.attr("wideimg") != null ) {
            i.attr("wideimg", h.commonScreenImgUrl)
        }
        if (i.attr("si") != null ) {
            i.attr("si", h.commonScreenImgUrl)
        }
        if (i.attr("wi") != null ) {
            i.attr("wi", h.commonScreenImgUrl)
        }
        if (i.attr("original") != null ) {
            i.attr("original", h.commonScreenImgUrl)
        }
    }
    function c(i, j) {
        if (i.size() == 0) {
            return
        }
        var r = i.data("advsData");
        var h = i.data("doneAdvCodes") != null  ? i.data("doneAdvCodes").split(",") : [];
        if (r != null ) {
            for (var n = 0; n < j.length; n++) {
                var k = b(r, j[n]);
                var q = false;
                for (var m = 0; m < h.length; m++) {
                    if (h[m] == j[n]) {
                        q = true;
                        break
                    }
                }
                if (!q && k != null ) {
                    var p = d("body a[data-advId=" + k.regionId + "]");
                    var o = d("body img[data-advId=" + k.regionId + "]");
                    if (p.size() > 0) {
                        for (var l = 0; l < p.size(); l++) {
                            g(p.eq(l), k);
                            e(o.eq(l), k)
                        }
                        h.push(j[n]);
                        i.data("doneAdvCodes", h.join(","))
                    }
                }
            }
        }
    }
    function f(k) {
        var p, l, j, h, i;
        var o = typeof isWidescreen != "undefined" ? isWidescreen : false;
        var m = function() {
                if (!k || k.size() == 0) {
                    return
                }
                p = k.val();
                l = (p && p.length > 0) ? p.split(",") : [];
                h = (typeof currSiteId == "undefined") ? 1 : currSiteId;
                j = d.cookie("provinceId");
                n()
            }
            ;
        var q = function(t, s) {
                var r = "http://p4p.yhd.com/advdolphin/external/saleTypeWeightAd?callback=?";
                var u = {
                    mcSiteId: h,
                    provinceId: j,
                    codes: t,
                    categoryIds: s,
                    screenType: o ? "1" : "2"
                };
                d.getJSON(r, u, function(v) {
                    if (v && v.status == 1) {
                        var w = v.value;
                        if (w) {
                            var x = k.data("advsData");
                            if (x == null ) {
                                k.data("advsData", w)
                            } else {
                                x = d.extend(x, w);
                                k.data("advsData", x)
                            }
                            c(k, l)
                        }
                    }
                })
            }
            ;
        var n = function() {
                var r = [];
                for (var s = 0; s < l.length; s++) {
                    r.push(l[s]);
                    if (r.length >= 20) {
                        q(r.join(","), "");
                        r = []
                    }
                }
                if (r.length > 0) {
                    q(r.join(","), "")
                }
            }
            ;
        m()
    }
    var a = window.loli || (window.loli = {});
    a.cpm = a.cpm || {};
    a.cpm.initAjaxReplaceAdvertise = function(h) {
        new f(h)
    }
})(jQuery);
(function(c) {
    var d = (function() {
        var o = 300;
        var m = function() {}
            ;
        var n = {
            rowSelector: "> li",
            submenuSelector: "*",
            submenuDirection: "right",
            tolerance: 75,
            over: m,
            out: m,
            active: m,
            deactive: m,
            exit: m
        };
        var p = []
            , b = null
            , a = null ;
        var k = false;
        var l = function(e, f) {
                return (f.y - e.y) / (f.x - e.x)
            }
            ;
        return function(j) {
            var g = c(this);
            var f = c.extend(n, j);
            var e = null ;
            var i = function() {
                    if (this == e) {
                        return
                    }
                    if (e) {
                        f.deactive.call(e)
                    }
                    f.active.call(this);
                    e = this
                }
                ;
            var r = function(q) {
                    var t = h();
                    if (t) {
                        a = setTimeout(function() {
                            i.call(q)
                        }, t)
                    } else {
                        i.call(q)
                    }
                }
                ;
            var h = function() {
                    if (!e || !c(e).is(f.submenuSelector)) {
                        return 200
                    }
                    var M = g.offset()
                        , E = {
                        x: M.left,
                        y: M.top - f.tolerance
                    }
                        , G = {
                        x: M.left + g.outerWidth(),
                        y: E.y
                    }
                        , q = {
                        x: M.left,
                        y: M.top + g.outerHeight() + f.tolerance
                    }
                        , L = {
                        x: M.left + g.outerWidth(),
                        y: q.y
                    }
                        , K = p[p.length - 1]
                        , H = p[0];
                    if (!K) {
                        return 0
                    }
                    if (!H) {
                        H = K
                    }
                    if (H.x < M.left || H.x > L.x || H.y < M.top || H.y > L.y) {
                        return 0
                    }
                    if (b && K.x == b.x && K.y == b.y) {
                        return 0
                    }
                    var I = G
                        , P = L;
                    if (f.submenuDirection == "left") {
                        I = q;
                        P = E
                    } else {
                        if (f.submenuDirection == "below") {
                            I = L;
                            P = q
                        } else {
                            if (f.submenuDirection == "above") {
                                I = E;
                                P = G
                            }
                        }
                    }
                    var O = l(K, I)
                        , J = l(K, P)
                        , F = l(H, I)
                        , N = l(H, P);
                    if (O < F && J > N) {
                        b = K;
                        return o
                    }
                    b = null ;
                    return 0
                }
                ;
            k === false && c(document).bind("mousemove.initMenu", function(q) {
                p.push({
                    x: q.pageX,
                    y: q.pageY
                });
                if (p.length > 3) {
                    p.shift()
                }
            });
            g.bind("mouseleave.initMenu", function() {
                a && clearTimeout(a);
                if (f.exit.call(this) === true) {
                    if (e) {
                        f.deactive.call(e)
                    }
                    e = null
                }
            }).find(f.rowSelector).bind("mouseenter.initMenu", function() {
                a && clearTimeout(a);
                f.over.call(this);
                r(this)
            }).bind("mouseleave.initMenu", function() {
                f.out.call(this)
            }).bind("click.initMenu", function() {
                i.call(this)
            })
        }
    })();
    c.fn.yhdMenu = function(a) {
        return this.each(function() {
            d.call(this, a)
        })
    }
})(jQuery);
(function(s) {
    function w(a, i) {
        var j = s(a);
        if (j.size() == 0) {
            return
        }
        var z = j.data("flag");
        if (z == 1) {
            return
        }
        j.data("flag", 1);
        var e = new Date().getTime();
        var f = j.find("div[categoryId]");
        var c = f.attr("categoryId");
        var g = f.attr("cindex");
        var k = "GLOBALLEFTMENU_" + c;
        var b = jQuery.cookie("provinceId");
        var l = typeof (currProvinceId) != "undefined" ? currProvinceId : (b ? b : 1);
        var d = {
            categoryId: c,
            cindex: g,
            leftMenuProvinceId: l,
            isFixTopNav: isFixTopNav
        };
        var h = function(I) {
                f.append(I.value);
                var F = j.find(".hd_show_sort");
                F.removeClass("global_loading");
                j.data("loaded", 1);
                if (j.hasClass("cur")) {
                    F.show();
                    if (typeof require != "undefined" && require) {
                        var y = j.find("[data-recordTracker]");
                        require(["base_observer"], function(A) {
                            A.fire("adContentTrackerEvent", y)
                        });
                        require(["base_observer"], function(A) {
                            j.attr("data-mrt", 0);
                            A.fire("impressionEvent", j)
                        })
                    }
                }
                var G = new Date().getTime();
                loli.timing.sendTimerTracker("LMT_" + (G - e));
                var H = f.find("div.hd_sort_spot img");
                var J = typeof isWidescreen != "undefined" ? isWidescreen : false;
                H.each(function(B, C) {
                    var A = s(C);
                    A.attr("src", J ? A.attr("wi") : A.attr("si"))
                });
                if (H.size() != 0 && (J)) {
                    if (typeof (loli) != "undefine" && loli.cpm) {
                        loli.cpm.initAjaxReplaceAdvertise(f.find("textarea"))
                    }
                    j.removeClass("hd_no_pic")
                }
            }
            ;
        s.ajax({
            url: i,
            data: d,
            dataType: "jsonp",
            timeout: 5000,
            jsonpCallback: k,
            cache: true,
            success: function(y) {
                if (y) {
                    h(y)
                }
            }
        })
    }
    function n() {
        var a = (isIndex == 1 && (typeof (indexFlag) != "undefined" && typeof (indexFlag) == "number" && indexFlag == 1));
        if (!a && typeof isMallIndex != "undefined" && isMallIndex == 1) {
            a = 1
        }
        var c = function() {
                var e = currDomain + "/header/ajaxGetGlobalLeftFloatMenuDataV12.do";
                if (typeof isMallIndex != "undefined" && isMallIndex == 1) {
                    e = currDomain + "/header/ajaxGetGlobalLeftFloatMenuDataV11.do"
                }
                var g = s("#j_allsort");
                var f = g.children();
                g.yhdMenu({
                    active: function() {
                        var h = s(this);
                        h.addClass("cur");
                        w(h, e);
                        var j = h.index();
                        for (var k = j + 1; k < j + 4; k++) {
                            if (f[k]) {
                                w(f[k], e)
                            }
                        }
                        for (var k = j - 3; k < j; k++) {
                            if (f[k]) {
                                w(f[k], e)
                            }
                        }
                        if (h.data("loaded") && typeof require != "undefined" && require) {
                            var i = h.find("[data-recordTracker]");
                            require(["content_tracker_expo"], function(l) {
                                l.run("adContentTrackerEvent", "ad.dolphin.bidding", i)
                            });
                            require(["base_observer"], function(l) {
                                h.attr("data-mrt", 0);
                                l.fire("impressionEvent", h)
                            })
                        }
                    },
                    deactive: function() {
                        s(this).removeClass("cur")
                    },
                    exit: function() {
                        return true
                    }
                })
            }
            ;
        if (a) {
            c();
            if (typeof isIndex != "undefined" && isIndex == 1 && typeof isFixTopNav != "undefined" && isFixTopNav == true) {
                var d = function() {
                        var e;
                        jQuery("#allSortOuterbox").hover(function() {
                            if (e) {
                                clearTimeout(e)
                            }
                            e = setTimeout(function() {
                                if (!s("#headerNav").hasClass("hd_nav_fixed")) {
                                    return
                                }
                                s("#allCategoryHeader").show();
                                s("#allSortOuterbox").addClass("hover")
                            }, 300)
                        }, function() {
                            if (e) {
                                clearTimeout(e)
                            }
                            e = setTimeout(function() {
                                if (!s("#headerNav").hasClass("hd_nav_fixed")) {
                                    return
                                }
                                s("#allSortOuterbox li.cur").removeClass("cur").children(".hd_show_sort").hide();
                                s("#allSortOuterbox").removeClass("hover");
                                s("#allCategoryHeader").hide()
                            }, 300)
                        })
                    }
                    ;
                d()
            }
            return
        }
        var b = function() {
                var g = currDomain + "/header/ajaxGetGlobalRootMenuV6.do?callback=?";
                var e = function(h) {
                        if (h.value) {
                            s("#allCategoryHeader").data("loaded", 1);
                            s("#allCategoryHeader").removeClass("global_loading").html(h.value).show();
                            s("#allSortOuterbox").addClass("hover");
                            c()
                        }
                    }
                    ;
                var f = {
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    version: 1,
                    provinceId: s.cookie("provinceId") || 1
                };
                s.ajax({
                    url: g,
                    data: f,
                    dataType: "jsonp",
                    timeout: 5000,
                    jsonpCallback: "GLOBALROOTMENU",
                    cache: true,
                    success: function(h) {
                        if (h) {
                            e(h)
                        }
                    }
                })
            }
            ;
        var d = function() {
                var e;
                jQuery("#allSortOuterbox").hover(function() {
                    if (e) {
                        clearTimeout(e)
                    }
                    e = setTimeout(function() {
                        s("#allCategoryHeader").show();
                        s("#allSortOuterbox").addClass("hover");
                        var f = s("#allCategoryHeader").data("loaded");
                        if (!f) {
                            b()
                        }
                    }, 300)
                }, function() {
                    if (e) {
                        clearTimeout(e)
                    }
                    e = setTimeout(function() {
                        jQuery("#allSortOuterbox li.cur").removeClass("cur").children(".hd_show_sort").hide();
                        jQuery("#allSortOuterbox").removeClass("hover");
                        jQuery("#allCategoryHeader").hide()
                    }, 300)
                })
            }
            ;
        d()
    }
    function m(h) {
        if (!s("#headerNav").hasClass("hd_nav_fixed")) {
            var f = s("#allCategoryHeader").offset().top;
            var g = h.offset().top - f;
            var a = h.find(".hd_show_sort");
            var b = document.documentElement.scrollTop || document.body.scrollTop;
            var d = g + a.height() + f - b;
            var e = s(window).height() - 30;
            var c = d - e;
            if (d > e) {
                if (h.offset().top - b + h.height() - e > -10) {
                    g = h.position().top - a.height() + h.height() - 2
                } else {
                    g = g - c - 10
                }
            }
            if (a.height() > e) {
                g = b - f
            }
            a.css({
                top: g
            })
        } else {
            h.find(".hd_show_sort").css({
                top: "0px"
            })
        }
    }
    function r(a) {
        var b = window.loli || (window.loli = {});
        var c = b.yhdStore;
        if (c) {
            c.getFromRoot("category_history", function(h) {
                if (h && h.status == 1) {
                    var i = h.value;
                    var j = [];
                    if (i) {
                        var z = i.split(",");
                        for (var g = 0; g < z.length; g++) {
                            var d = z[g];
                            if (d) {
                                var f = d.split("~");
                                var e = f[0];
                                var k = decodeURIComponent(f[1]);
                                var l = decodeURIComponent(f[2]);
                                j.push({
                                    cateId: e,
                                    cateName: k,
                                    cateUrl: l
                                })
                            }
                        }
                    }
                    if (typeof a == "function") {
                        a(j)
                    }
                }
            })
        }
    }
    function x(b) {
        var c = [];
        if (b && b.length > 0) {
            c.push("<div class='hd_sort_history clearfix'>历史记录");
            for (var a = b.length - 1; a >= 0; a--) {
                c.push("<a href='" + b[a].cateUrl + "' target='_blank' data-ref='YHD_GLOBAL_CatMenu_History_" + b[a].cateId + "'>" + b[a].cateName + "</a>")
            }
            c.push("<a href='javascript:void(0);' tk='YHD_GLOBAL_CatMenu_DeleteHistory' class='hd_clear_history'>清除记录</a>");
            c.push("</div>")
        }
        return c.join("")
    }
    function o() {
        s("#allCategoryHeader").delegate("div.hd_sort_list a", "click", function() {
            var c = s(this);
            var a = c.text();
            var d = c.attr("href");
            var b = c.attr("categoryId");
            var e = window.loli || (window.loli = {});
            var f = e.yhdStore;
            if (f) {
                f.getFromRoot("category_history", function(E) {
                    if (E && E.status == 1) {
                        var F = E.value;
                        var I = [];
                        if (F) {
                            I = F.split(",");
                            var i = false;
                            var j = 0;
                            for (var l = 0; l < I.length; l++) {
                                var J = I[l];
                                if (J) {
                                    var k = J.split("~");
                                    var g = k[0];
                                    var G = decodeURIComponent(k[1]);
                                    var H = decodeURIComponent(k[2]);
                                    if (b == g) {
                                        i = true;
                                        j = l;
                                        break
                                    }
                                }
                            }
                            if (!i) {
                                I.push(b + "~" + encodeURIComponent(a) + "~" + encodeURIComponent(d));
                                if (I.length > 10) {
                                    I.shift()
                                }
                            } else {
                                if (j != I.length - 1) {
                                    var h = I.splice(j, 1);
                                    I.push(h[0])
                                }
                            }
                        } else {
                            I.push(b + "~" + encodeURIComponent(a) + "~" + encodeURIComponent(d))
                        }
                        f.setFromRoot("category_history", I.join(","), q)
                    }
                })
            }
        });
        s("#allCategoryHeader").delegate("div.hd_sort_history a.hd_clear_history", "click", function() {
            var a = s(this).tk;
            gotracker(2, a);
            v()
        })
    }
    function v() {
        var a = window.loli || (window.loli = {});
        var b = a.yhdStore;
        if (b) {
            b.setFromRoot("category_history", "")
        }
        s("#allCategoryHeader div.hd_sort_history").remove()
    }
    function q() {
        var a = function(c) {
                var b = x(c);
                if (b.length > 0) {
                    s("#allCategoryHeader div.hd_sort_history").remove();
                    s("#allCategoryHeader div.hd_sort_list_wrap").append(b)
                }
            }
            ;
        r(a)
    }
    function p(b) {
        var a = function(d) {
                var c = x(d);
                if (c.length > 0) {
                    s("div.hd_sort_list_wrap", b).append(c)
                }
            }
            ;
        r(a)
    }
    function u() {
        var b = window.navigator.userAgent;
        var a = /(iPad|pad)/i;
        if (!a.test(b)) {
            return
        }
        jQuery("#j_allsort li").delegate("a", "click", function() {
            var d = jQuery(this);
            var e = d.closest("li");
            if (e.hasClass("cur")) {
                return true
            } else {
                return false
            }
        });
        var c = jQuery("#allSortOuterbox");
        if (c.hasClass("not_index")) {
            c.delegate(".hd_all_sort_link a", "click", function() {
                if (c.hasClass("hover")) {
                    jQuery("#allSortOuterbox li.cur").removeClass("cur").children(".hd_show_sort").hide();
                    c.children(".hd_allsort_out_box").hide();
                    c.removeClass("hover")
                } else {
                    c.children(".hd_allsort_out_box").show();
                    c.addClass("hover")
                }
                return false
            })
        }
    }
    function t() {
        var a;
        s("#allCategoryHeader,#mallCategoryHeader").delegate("div.hd_show_sort .hd_good_category", "mouseenter", function() {
            var j = s(this);
            a = j.parents(".hd_show_sort");
            var h = a.width();
            var d = j.attr("data-info");
            var g = s(this).position().left + s(this).outerWidth();
            var e = s(this).position().top - 10;
            s(".hd_good_category_hover span", a).text(d);
            var c = s(".hd_good_category_hover", a).width();
            var f = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
            if (f) {
                var i = 286;
                if (c > i) {
                    s(".hd_good_category_hover", a).width(i);
                    c = i
                } else {
                    s(".hd_good_category_hover", a).width("auto")
                }
            }
            if (c > h - g) {
                var b = h - g + s(this).outerWidth();
                s(".hd_good_category_hover", a).show().css({
                    left: "auto",
                    right: b,
                    top: e
                });
                s(".hd_good_category_hover b", a).css({
                    left: "auto",
                    right: "-1px",
                    "background-position": "0 -410px"
                })
            } else {
                s(".hd_good_category_hover", a).show().css({
                    left: g,
                    right: "auto",
                    top: e
                });
                s(".hd_good_category_hover b", a).css({
                    left: "-1px",
                    right: "auto",
                    "background-position": "0 -400px"
                })
            }
        });
        s("#allCategoryHeader,#mallCategoryHeader").delegate("div.hd_show_sort .hd_good_category", "mouseleave", function() {
            s(".hd_good_category_hover", a).hide()
        })
    }
    s(document).ready(function() {
        n();
        u();
        t()
    })
})(jQuery);
(function() {
    if ($.fn.bgiframe) {
        return false
    }
    var c = "";
    if (URLPrefix && URLPrefix.statics) {
        c = URLPrefix.statics
    } else {
        if (currSiteId && currSiteId == 2) {
            c = "http://image.111.com.cn/statics"
        } else {
            c = "http://image.yihaodianimg.com/statics"
        }
    }
    var d = document.createElement("script");
    d.setAttribute("type", "text/javascript");
    d.setAttribute("src", c + "/global/js/libs/jquery/jquery.bgiframe.js?" + currVersionNum);
    document.getElementsByTagName("head")[0].appendChild(d)
})();
var yhdLib = window.yhdLib || (window.yhdLib = {});
if (!yhdLib.hasOwnProperty("popwin")) {
    yhdLib.popwin = function(param) {
        var arg = param
            , tcBox = ".popGeneral"
            , sFun = arg.fun ? arg.fun : []
            , cTxt = arg.popcontentstr ? arg.popcontentstr : ""
            , popEvent = arg.popevent ? arg.popevent : "click"
            , autoClose = arg.autoclosetime;
        var fixed = typeof (arg.fix) == "undefined" || arg.fix ? true : false;
        var ieLower = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
        if (arg.clickid) {
            $(arg.clickid).bind(popEvent, function() {
                if ($(".popGeneral").length == 0) {
                    popMask()
                }
            })
        } else {
            if ($(".popGeneral").length == 0) {
                popMask()
            }
        }
        function popMask() {
            var dwidth = "100%"
                , dheight = $(document).height();
            if (ieLower) {
                $("select:visible", ".delivery").each(function(i) {
                    $(this).addClass("selectSjl").hide()
                })
            }
            var popBOX = !fixed ? '<div class="popGeneral" style="position:absolute;" ' : '<div class="popGeneral" ';
            if (arg.poptitle) {
                popBOX += '><div class="top_tcgeneral"><h4>' + arg.poptitle + '</h4><span class="close_tcg">关闭</span></div></div>'
            } else {
                popBOX += "></div>"
            }
            if (arg.mask || arg.mask == null ) {
                $('<div class="mask_tcdiv"></div>').appendTo($("body")).css({
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    zIndex: 100001,
                    width: dwidth + "",
                    height: dheight + "px",
                    background: "#000",
                    opacity: 0.4
                })
            }
            $(popBOX).appendTo($("body"));
            $(".mask_tcdiv").bgiframe();
            loli.scroll(function() {
                $(".mask_tcdiv").height($(document).height())
            });
            if (arg.popwidth) {
                $(".popGeneral").width(arg.popwidth)
            }
            if (arg.popheight) {
                $(".popGeneral").height(arg.popheight)
            }
            var apTxt = cTxt ? $(cTxt) : $(arg.popcontent).clone();
            apTxt.appendTo($(tcBox)).show();
            popPosition();
            for (var funI = sFun.length - 1; funI >= 0; funI--) {
                eval(sFun[funI] + "()")
            }
            return false
        }
        function popPosition() {
            var popwinTop = 0;
            $(window).resize(function() {
                var width = $(tcBox).width()
                    , height = $(tcBox).height() / 2
                    , windWidth = $(window).width()
                    , pLeft = (windWidth - width) / 2;
                $(tcBox).css({
                    left: pLeft,
                    top: "50%",
                    bottom: "auto",
                    marginTop: "-" + height + "px"
                });
                popwinTop = $(window).height() / 2 - height
            }).trigger("resize");
            if (ieLower && fixed) {
                $(window).scroll(function() {
                    $(tcBox).css({
                        top: popwinTop + $(window).scrollTop() + "px",
                        marginTop: 0
                    })
                }).trigger("scroll")
            }
            $(".close_tcg").click(function() {
                closeTc()
            });
            if (autoClose) {
                setTimeout(function() {
                    closeTc()
                }, autoClose)
            }
            if (arg.outareaclose) {
                $(".mask_tcdiv").click(function() {
                    closeTc()
                })
            }
            $(window).keydown(function(event) {
                if (event.keyCode == 27) {
                    closeTc()
                }
            });
            return false
        }
        function closeTc() {
            $(".popGeneral").remove();
            $(".mask_tcdiv").remove();
            if (ieLower) {
                $("select.selectSjl").each(function() {
                    $(this).removeClass("selectSjl").show()
                })
            }
        }
        return false
    }
}
if (!yhdLib.hasOwnProperty("popclose")) {
    yhdLib.popclose = function() {
        var b = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
        if (b) {
            $("select.selectSjl").each(function() {
                $(this).removeClass("selectSjl").show()
            })
        }
        $(".popGeneral,.mask_tcdiv").remove()
    }
}
if (!yhdLib.hasOwnProperty("popwinreload")) {
    yhdLib.popwinreload = function() {
        if ($("body > .popGeneral").length) {
            $(window).trigger("resize")
        }
    }
}
if (!yhdLib.hasOwnProperty("ratebox")) {
    yhdLib.ratebox = function(rateboxArgus) {
        var rateArg = rateboxArgus
            , rateObj = document.getElementById(rateArg.id)
            , rateDg = rateArg.ratedegree;
        if (rateArg.autorate) {
            var rtim = rateArg.ratetime ? rateArg.ratetime : 15
                , step = rateArg.step ? rateArg.step : 20;
            if (rateDg >= 0) {
                setInterval(function() {
                    rate(rateObj, (rateDg += step) >= 360 ? rateDg = 0 : rateDg);
                    return false
                }, rtim)
            } else {
                if (rateDg < 0) {
                    setInterval(function() {
                        rate(rateObj, (rateDg -= step) <= 0 ? rateDg = 360 : rateDg);
                        return false
                    }, rtim)
                }
            }
        } else {
            rate(rateObj, rateDg)
        }
        function rate(obj, degree) {
            var ST = obj.style;
            if (document.all) {
                var deg = degree * Math.PI / 180
                    , M11 = Math.cos(deg)
                    , M12 = -Math.sin(deg)
                    , M21 = Math.sin(deg)
                    , M22 = Math.cos(deg);
                obj.fw = obj.fw || obj.offsetWidth / 2;
                obj.fh = obj.fh || obj.offsetHeight / 2;
                var adr = (90 - degree % 90) * Math.PI / 180
                    , adp = Math.sin(adr) + Math.cos(adr);
                with (ST) {
                    filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" + M11 + ",M12=" + M12 + ",M21=" + M21 + ",M22=" + M22 + ",SizingMethod='auto expand');";
                    top = obj.fh * (1 - adp) + "px";
                    left = obj.fw * (1 - adp) + "px"
                }
            } else {
                var rotate = "rotate(" + degree + "deg)";
                with (ST) {
                    MozTransform = rotate;
                    WebkitTransform = rotate;
                    OTransform = rotate;
                    Transform = rotate
                }
            }
            return false
        }
        return false
    }
}
jQuery.yhdtool = yhdLib;
(function(a) {
    a(function() {
        var c = function() {
                var d = (typeof hideGlobalCookieCheckMsgFlag != "undefined" && hideGlobalCookieCheckMsgFlag == "1") ? 1 : 0;
                if (d) {
                    return
                }
                var f = "提示消息";
                var e = [];
                e.push("<div>");
                e.push("<style>");
                e.push(".no_cookie {height:150px;width:500px;text-align:center;padding:20px;font-size:20px;}");
                e.push(".no_cookie a:link,.no_cookie a:visited {color:blue; text-decoration: none;}");
                e.push(".no_cookie a:hover,.no_cookie a:active {color:blue; text-decoration: underline;}");
                e.push("</style>");
                e.push("<div class='no_cookie'>由于您使用的浏览器设置问题可能导致网页运行不正常。请您启用浏览器Cookie功能或更换浏览器。<br/><a href='http://cms.yhd.com/cms/view.do?topicId=24243' target='_blank'>如何启用Cookie？</a></div>");
                e.push("</div>");
                yhdLib.popwin({
                    poptitle: f,
                    popcontentstr: e.join("")
                })
            }
            ;
        if (!window.navigator.cookieEnabled) {
            c()
        } else {
            jQuery.cookie("test_cookie", "1");
            if (jQuery.cookie("test_cookie")) {
                var b = new Date();
                b.setTime(b.getTime() - 10000);
                document.cookie = "test_cookie=;path=;domain=;expires=" + b.toGMTString()
            } else {
                c()
            }
        }
    })
})(jQuery);
var YHDPROVINCE = {};
YHDPROVINCE.getCurentDomain = function() {
    return URLPrefix.central
}
;
YHDPROVINCE.getOppositeDomain = function() {
    return URLPrefix.central
}
;
YHDPROVINCE.proviceObj = {
    p_1: "上海",
    p_2: "北京",
    p_3: "天津",
    p_4: "河北",
    p_5: "江苏",
    p_6: "浙江",
    p_7: "重庆",
    p_8: "内蒙古",
    p_9: "辽宁",
    p_10: "吉林",
    p_11: "黑龙江",
    p_12: "四川",
    p_13: "安徽",
    p_14: "福建",
    p_15: "江西",
    p_16: "山东",
    p_17: "河南",
    p_18: "湖北",
    p_19: "湖南",
    p_20: "广东",
    p_21: "广西",
    p_22: "海南",
    p_23: "贵州",
    p_24: "云南",
    p_25: "西藏",
    p_26: "陕西",
    p_27: "甘肃",
    p_28: "青海",
    p_29: "新疆",
    p_30: "宁夏",
    p_32: "山西"
};
YHDPROVINCE.swithAddressCity = function(b, a) {
    provinceSwitchProvince(b, oldProvinceId, paramObj)
}
;
function setAddressCity(d, b) {
    var a = jQuery.cookie("provinceId");
    var c = {};
    if (b) {
        c.targetUrl = b
    }
    loli.cookie.setAllDomain("provinceId", d, "/", 800, function() {
        provinceSwitchProvince(d, a, c)
    })
}
function provinceSwitchProvince(a, b, c) {
    moveCartItem(a, b, c)
}
function setAddressCityback(c) {
    var e = null ;
    if (c && c.targetUrl) {
        e = c.targetUrl;
        window.location.href = e;
        return
    }
    var b = window.location.href;
    if (b.indexOf("merchantID=") != -1) {
        b = b.substring(0, b.indexOf("merchantID=") - 1);
        window.location.href = b;
        return
    }
    if (b.indexOf("merchant=") != -1) {
        b = b.substring(0, b.indexOf("merchant=") - 1);
        window.location.href = b;
        return
    }
    if (b.indexOf("/tuangou/") != -1) {
        if (b.indexOf("/tuangou/myGroupon.do") != -1) {
            window.location.href = b
        }
        return
    }
    if (b.indexOf("openProvincePage=") != -1) {
        b = b.substring(0, b.indexOf("openProvincePage=") - 1);
        window.location.href = b;
        return
    }
    if (b.indexOf("/cart/cart.do?action=view") != -1) {
        window.location.href = "/cart/cart.do?action=view";
        return
    }
    var h = /^\S*product\/\d+_?\d+/;
    if (b.match(h)) {
        if (b.indexOf("_") != -1) {
            b = b.substring(0, b.indexOf("_"))
        } else {
            if (b.indexOf("#") != -1) {
                var l = b.indexOf("#");
                b = b.substring(0, l)
            }
        }
        window.location.href = b;
        return
    }
    var s = /^(http:\/\/){0,1}([^\/]+\/)[0-9]+\/([^\/]*)$/;
    if (b.match(s)) {
        b = b.replace(s, "$1$2$3");
        var o = jQuery.cookie("provinceId");
        var j = jQuery("#p_" + o);
        loli.spm.refreshPage(b, j);
        return
    }
    var k = /^(http:\/\/){0,1}([^\/]+\/)([^\/]*)$/;
    if (b.match(k)) {
        var o = jQuery.cookie("provinceId");
        var j = jQuery("#p_" + o);
        loli.spm.refreshPage(b, j);
        return
    }
    var u = /^(http:\/\/){0,1}[^\/]+\/channel\/[0-9]+_[0-9]+\/$/;
    if (b.match(u)) {
        b = b.substring(0, b.lastIndexOf("_"));
        window.location.href = b;
        return
    }
    var a = /^(http:\/\/){0,1}[^\/]+\/cms\/view.do\?topicId=[0-9]+&merchant=[0-9]+$/;
    if (b.match(a)) {
        b = b.substring(0, b.lastIndexOf("&merchant"));
        var o = jQuery.cookie("provinceId");
        var j = jQuery("#p_" + o);
        loli.spm.refreshPage(b, j);
        return
    }
    var r = /^(http:\/\/){0,1}[^\/]+\/brand\/[0-9]+\/{0,1}(\?[^\/]+)*$/;
    if (b.match(r)) {
        window.location.href = b;
        return
    }
    var f = /^(http:\/\/){0,1}[^\/]+\/try\/[0-9]+\/{0,1}(\?[^\/]+)*$/;
    if (b.match(f)) {
        if (b.lastIndexOf("/") == b.length - 1) {
            b = b.substring(0, b.lastIndexOf("/"))
        }
        b = b.substring(0, b.lastIndexOf("/"));
        window.location.href = b;
        return
    }
    var n = /^(http:\/\/){0,1}[^\/]+\/try\/[0-9]+_[0-9]+\/{0,1}(\?[^\/]+)*$/;
    if (b.match(n)) {
        b = b.substring(0, b.lastIndexOf("_")) + "_0/";
        window.location.href = b;
        return
    }
    var w = /^(http:\/\/){0,1}[^\/]+\/S-theme\/[0-9]+\/{0,1}(\?[^\/]+)*$/;
    if (b.match(w)) {
        window.location.href = b;
        return
    }
    var t = /^(http:\/\/){0,1}[^\/]+\/s2\/c([0-9]*)-([^?^\/]*)\/([0-9]*)\/$/;
    var q = /^(http:\/\/){0,1}[^\/]+\/c([0-9]*)-([^?^\/]*)\/([0-9]*)\/$/;
    if (b.match(t) || b.match(q)) {
        if (b.lastIndexOf("/") == b.length - 1) {
            b = b.substring(0, b.lastIndexOf("/"))
        }
        b = b.substring(0, b.lastIndexOf("/") + 1);
        var o = jQuery.cookie("provinceId");
        var j = jQuery("#p_" + o);
        loli.spm.refreshPage(b, j);
        return
    }
    var v = /^(http:\/\/){0,1}search.[^\/]+\/c([0-9]*)-([^?^\/]*)\/k([^?^\/]*)\/([0-9]*)\/$/;
    if (b.match(v)) {
        if (b.lastIndexOf("/") == b.length - 1) {
            b = b.substring(0, b.lastIndexOf("/"))
        }
        b = b.substring(0, b.lastIndexOf("/") + 1);
        var o = jQuery.cookie("provinceId");
        var j = jQuery("#p_" + o);
        loli.spm.refreshPage(b, j);
        return
    }
    var i = /^(http:\/\/){0,1}channel\.[^\/]+\/[^\/^_^\.]+(\/[^\/^\.]+){0,1}\/[0-9]+\/{0,1}(\?[^\/]+){0,1}(#[^\/]+)*$/;
    if (b.match(i)) {
        if (b.indexOf("#") != -1) {
            b = b.substring(0, b.indexOf("#"))
        }
        if (b.indexOf("?") != -1) {
            var g = b.substring(b.indexOf("?"));
            var m = b.substring(0, b.indexOf("?"));
            if (b.lastIndexOf("/") == b.length - 1) {
                m = m.substring(0, m.lastIndexOf("/"));
                g = "/" + g
            }
            m = m.substring(0, m.lastIndexOf("/"));
            b = m + g
        } else {
            if (b.lastIndexOf("/") == b.length - 1) {
                b = b.substring(0, b.lastIndexOf("/"))
            }
            b = b.substring(0, b.lastIndexOf("/"))
        }
        window.location.href = b;
        return
    }
    if (b.indexOf("confirmOrder") != -1 && b.indexOf("saveOrder") != -1) {
        window.location.href = YHDPROVINCE.getCurentDomain();
        return
    }
    var p = URLPrefix.search + "/s/";
    if (b.substr(0, p.length) == p) {
        var h = /-p\d{0,3}/;
        if (b.match(h)) {
            b = b.replace(h, "-p1");
            var o = jQuery.cookie("provinceId");
            var j = jQuery("#p_" + o);
            loli.spm.refreshPage(b, j);
            return
        }
    }
    loli.spm.reloadPage(jQuery("#currProvince"))
}
function moveCartItem(g, c, b) {
    var f = 1;
    var a = {};
    var d = {};
    var h = [];
    if (typeof b != "undefined" && b) {
        if (typeof b.isSetAddress != "undefined" && b.isSetAddress) {
            if (b.isSetAddress == 0) {
                f = b.isSetAddress
            }
        }
        if (typeof b.callback != "undefined" && b.callback) {
            a = b.callback;
            if (typeof a.func != "undefined" && a.func) {
                d = a.func
            }
            if (typeof a.args != "undefined" && a.func) {
                h = a.args
            }
        }
    }
    var e = URLPrefix.cartDomain || "http://cart.yhd.com";
    jQuery.getJSON(e + "/cart/opt/switchProvince.do?provinceId=" + g + ((c) ? "&oldProvinceId=" + c : "") + "&timestamp=" + new Date().getTime() + "&callback=?", function(i) {
        if (typeof f != "undefined" && f != 0) {
            setAddressCityback(b)
        }
        if (typeof d != "undefined" && typeof d == "function") {
            d.apply(this, h)
        }
    })
}
function initProvince() {
    var b = jQuery.cookie("provinceId");
    if (b && b > 0) {
        jQuery("#currProvince").text(YHDPROVINCE.proviceObj["p_" + b]).show();
        var d = jQuery("#weibo");
        if (b == 2) {
            d.attr("href", "http://weibo.com/yihaodianbeijing")
        } else {
            if (b == 20) {
                d.attr("href", "http://weibo.com/yihaodianguangzhou")
            } else {
                d.attr("href", "http://weibo.com/yihaodian")
            }
        }
    } else {
        var a = (typeof hideGlobalCookieCheckMsgFlag != "undefined" && hideGlobalCookieCheckMsgFlag == "1") ? 1 : 0;
        if (a) {
            return
        }
        var c = (typeof globalShowProWin != "undefined" && globalShowProWin == "1") ? 1 : 0;
        if (c) {
            return
        }
        showProvincesV2()
    }
}
function showProvincesV2() {
    if (jQuery.cookie("provinceId")) {
        YHDPROVINCE.headerSelectProvince();
        return
    }
    var a = YHDPROVINCE.getCurentDomain();
    var b = a + "/header/selectProvinceboxV2.do?timestamp=" + new Date().getTime() + "&callback=?";
    jQuery.getJSON(b, function(c) {
        if (c && !c.ERROR) {
            YHDPROVINCE.processProvince(c)
        }
    })
}
YHDPROVINCE.processProvince = function(a) {
    if (!jQuery.cookie("provinceId")) {
        YHDPROVINCE.chooseProvincePop(a)
    }
}
;
YHDPROVINCE.getProvinceName = function(a) {
    jQuery("#currentProvinceName").html("<strong>" + jQuery("#p_" + a).text() + "站</strong> >>")
}
;
YHDPROVINCE.yhdCommonProvinceInfo = function(b, a) {
    a.push('<li>A<a id="p_13" isTrkCustom="1" href="javascript:void(0);">安徽</a></li>');
    a.push('<li>B<a id="p_2" isTrkCustom="1" href="javascript:void(0);">北京</a></li>');
    a.push('<li>C<a id="p_7" isTrkCustom="1" href="javascript:void(0);">重庆</a></li>');
    a.push('<li>G<a id="p_20" isTrkCustom="1" href="javascript:void(0);">广东</a><a id="p_21" isTrkCustom="1" href="javascript:void(0);">广西</a><a isTrkCustom="1" id="p_23" href="javascript:void(0);">贵州</a><a id="p_27" isTrkCustom="1" href="javascript:void(0);">甘肃</a></li>');
    a.push('<li>F<a id="p_14" isTrkCustom="1" href="javascript:void(0);">福建</a></li>');
    a.push('<li>H<a id="p_4" isTrkCustom="1" href="javascript:void(0);">河北</a><a id="p_11" isTrkCustom="1" href="javascript:void(0);">黑龙江</a><a id="p_22" isTrkCustom="1" href="javascript:void(0);">海南</a><a id="p_18" isTrkCustom="1" href="javascript:void(0);">湖北</a><a id="p_19" isTrkCustom="1" href="javascript:void(0);">湖南</a><a id="p_17" isTrkCustom="1" href="javascript:void(0);">河南</a></li>');
    a.push('<li>J<a id="p_5" isTrkCustom="1" href="javascript:void(0);">江苏</a><a id="p_10"  isTrkCustom="1" href="javascript:void(0);">吉林</a><a id="p_15" isTrkCustom="1" href="javascript:void(0);">江西</a></li>');
    a.push('<li>L<a id="p_9" isTrkCustom="1" href="javascript:void(0);">辽宁</a></li>');
    a.push('<li>N<a id="p_8" isTrkCustom="1" href="javascript:void(0);">内蒙古</a><a id="p_30" isTrkCustom="1" href="javascript:void(0);">宁夏</a></li>');
    a.push('<li>Q<a id="p_28" isTrkCustom="1" href="javascript:void(0);">青海</a></li>');
    a.push('<li>S<a id="p_1" isTrkCustom="1" href="javascript:void(0);">上海</a><a id="p_16" isTrkCustom="1" href="javascript:void(0);">山东</a><a id="p_32" isTrkCustom="1" href="javascript:void(0);">山西</a><a id="p_12" isTrkCustom="1" href="javascript:void(0);">四川</a><a id="p_26" isTrkCustom="1"  href="javascript:void(0);">陕西</a></li>');
    a.push('<li>T<a id="p_3" isTrkCustom="1" href="javascript:void(0);">天津</a></li>');
    a.push('<li>X<a id="p_25" isTrkCustom="1" href="javascript:void(0);">西藏</a><a id="p_29" isTrkCustom="1" href="javascript:void(0);">新疆</a></li>');
    a.push('<li>Y<a id="p_24" isTrkCustom="1" href="javascript:void(0);">云南</a></li>');
    a.push('<li>Z<a id="p_6" isTrkCustom="1" href="javascript:void(0);">浙江</a></li>')
}
;
var _defaultProvinceData = [{
    key: "华北",
    value: [{
        id: 2,
        name: "北京"
    }, {
        id: 3,
        name: "天津"
    }, {
        id: 4,
        name: "河北"
    }, {
        id: 32,
        name: "山西"
    }, {
        id: 8,
        name: "内蒙古"
    }]
}, {
    key: "华东",
    value: [{
        id: 1,
        name: "上海"
    }, {
        id: 5,
        name: "江苏"
    }, {
        id: 6,
        name: "浙江"
    }, {
        id: 13,
        name: "安徽"
    }, {
        id: 14,
        name: "福建"
    }, {
        id: 16,
        name: "山东"
    }]
}, {
    key: "华南",
    value: [{
        id: 20,
        name: "广东"
    }, {
        id: 21,
        name: "广西"
    }, {
        id: 22,
        name: "海南"
    }]
}, {
    key: "华中",
    value: [{
        id: 15,
        name: "江西"
    }, {
        id: 17,
        name: "河南"
    }, {
        id: 18,
        name: "湖北"
    }, {
        id: 19,
        name: "湖南"
    }]
}, {
    key: "西南",
    value: [{
        id: 7,
        name: "重庆"
    }, {
        id: 12,
        name: "四川"
    }, {
        id: 23,
        name: "贵州"
    }, {
        id: 24,
        name: "云南"
    }, {
        id: 25,
        name: "西藏"
    }]
}, {
    key: "西北",
    value: [{
        id: 26,
        name: "陕西"
    }, {
        id: 27,
        name: "甘肃"
    }, {
        id: 28,
        name: "青海"
    }, {
        id: 30,
        name: "宁夏"
    }, {
        id: 29,
        name: "新疆"
    }]
}, {
    key: "东北",
    value: [{
        id: 9,
        name: "辽宁"
    }, {
        id: 10,
        name: "吉林"
    }, {
        id: 11,
        name: "黑龙江"
    }]
}];
YHDPROVINCE.buildProvinceHtml = function() {
    var f = [];
    f.push("<dl class='hd_hot_city clearfix' data-tpc='1'>");
    f.push("<dt>热门省市</dt>");
    var g = jQuery("#headerAllProvince").attr("data-hot");
    if (g) {
        var e = g.split(",");
        for (var c = 0; c < e.length; c++) {
            var d = e[c].split(":");
            f.push('<dd><a data-value="' + d[0] + '" isTrkCustom="1" href="javascript:void(0);">' + d[1] + "</a></dd>")
        }
    }
    f.push("</dl>");
    f.push("<div class='hd_province_detail clearfix' data-tpc='2'>");
    for (var c = 0; c < _defaultProvinceData.length; c++) {
        var a = _defaultProvinceData[c].value;
        f.push("<dl class='clearfix'>");
        f.push("<dt>" + _defaultProvinceData[c].key + "：</dt>");
        for (var b = 0; b < a.length; b++) {
            f.push("<dd><a data-value='" + a[b].id + "'  href='javascript:;'>" + a[b].name + "</a></dd>")
        }
        f.push("</dl>")
    }
    f.push("</div>");
    return f.join("")
}
;
YHDPROVINCE.headerSelectProvince = function() {
    var a = $("#headerAllProvince")
        , c = $("#currProvince");
    if ($.trim(a.html()).length == 0) {
        YHDPROVINCE.yhdExistsProvinceInfo(a)
    }
    a.toggle();
    c.toggleClass("fold");
    $("#headerAllPvcClose").click(function() {
        b()
    });
    a.find("a").click(function() {
        b();
        c.text($(this).text());
        var d = $(this).attr("data-value");
        setAddressCity(d);
        return false
    });
    function b() {
        c.removeClass("fold");
        a.hide()
    }
}
;
YHDPROVINCE.yhdExistsProvinceInfo = function(b) {
    var a = YHDPROVINCE.buildProvinceHtml();
    b.html(a)
}
;
YHDPROVINCE.yhdExistProvinceHoverEvent = function() {
    if (jQuery("#headerSelectProvince")[0] && currSiteId == 1) {
        var a;
        jQuery("#headerSelectProvince").hover(function() {
            a = setTimeout(function() {
                showProvincesV2();
                jQuery("#currProvince").addClass("hd_fold");
                $("#headerSelectProvince").css("z-index", "1215")
            }, 200)
        }, function() {
            if (a) {
                clearTimeout(a)
            }
            var c = jQuery("#headerAllProvince")
                , b = jQuery("#currProvince");
            b.removeClass("fold");
            b.removeClass("hd_fold");
            c.hide();
            $("#headerSelectProvince").css("z-index", "1201")
        })
    }
}
;
YHDPROVINCE.yhdNoExistsProvinceInfo = function(b) {
    var a = [];
    a.push('<div class="province_box" id="provinceBox">');
    a.push('<div class="province_title">');
    a.push("<h4>欢迎来到1号店</h4>");
    a.push("<p>目前我们提供31个地区的配送服务,请根据您的收货地址选择站点。</p>");
    a.push("</div>");
    a.push('<div class="province_select">');
    a.push('<div class="province_input">');
    a.push('<div class="province_input_con">');
    a.push('<span id="selectProvince" class="notsure">请选择</span>');
    a.push('<ul id="allProvinceSelect" class="provinceList">');
    YHDPROVINCE.yhdCommonProvinceInfo(b, a);
    a.push("</ul>");
    a.push("送货至");
    a.push("</div>");
    a.push("您的商品将会：");
    a.push("</div>");
    a.push('<p><button id="startShopping" class="disabled">开始购物<span></span></button></p>');
    a.push("</div>");
    a.push("</div>");
    yhdLib.popwin({
        fix: false,
        popcontentstr: a.join(""),
        fun: ["globalChangeTop"]
    })
}
;
function globalChangeTop() {
    $(".popGeneral .notsure").click(function() {
        $(".popGeneral .provinceList").show();
        var b = $(window).height()
            , e = $(".popGeneral .province_box").height() + $(".popGeneral .provinceList").height() - 115
            , f = b - e
            , d = $(".popGeneral").offset().top;
        if (d > f) {
            if (e > b) {
                $(".popGeneral").stop().animate({
                    "margin-top": -b / 2
                }, 300)
            } else {
                var a = parseInt($(".popGeneral").css("margin-top"))
                    , c = d - f;
                $(".popGeneral").stop().animate({
                    "margin-top": a - c
                }, 300)
            }
        }
    })
}
YHDPROVINCE.chooseProvincePop = function(d) {
    YHDPROVINCE.yhdNoExistsProvinceInfo(d);
    var i = d.ipProvinceId ? d.ipProvinceId : "1";
    var e = d.ipProvinceIdStr ? d.ipProvinceIdStr : "上海";
    var h = -1;
    var j = false
        , f = $("#provinceboxDiv")
        , c = $("#selectProvince")
        , g = $("#allProvinceSelect")
        , a = $("#startShopping");
    function b(l, k) {
        h = l;
        c.removeClass("notsure fold").html(k);
        $("#currProvince").html(k).show();
        g.hide();
        a.removeClass("disabled")
    }
    if (i && e) {
        j = true;
        b(i, e)
    }
    if (!j) {
        c.addClass("notsure");
        a.addClass("disabled")
    }
    c.click(function() {
        var k = $(this);
        if (!k.hasClass("fold")) {
            k.addClass("notsure fold");
            g.show();
            return false
        }
    });
    g.click(function() {
        return false
    });
    g.find("a").click(function() {
        j = true;
        b($(this).attr("id").split("_")[1], $(this).text())
    });
    $("#provinceBox").click(function() {
        if (c.hasClass("fold")) {
            g.hide();
            c.removeClass("fold");
            if (j) {
                c.removeClass("notsure")
            }
        }
    });
    a.click(function() {
        if ($(this).hasClass("disabled")) {
            return
        }
        f.hide();
        if (h != -1) {
            setAddressCity(h)
        }
    })
}
;
jQuery(document).ready(function() {
    if (isIndex != 1) {
        var a = /([\.\w]*)\.yihaodian\.com\.hk/;
        if (a.test(document.domain)) {
            setTimeout(initProvince, 1500)
        } else {
            initProvince()
        }
    }
    YHDPROVINCE.yhdExistProvinceHoverEvent()
});
jQuery.easing.jswing = jQuery.easing.swing;
jQuery.extend(jQuery.easing, {
    def: "easeOutQuad",
    swing: function(j, i, b, c, d) {
        return jQuery.easing[jQuery.easing.def](j, i, b, c, d)
    },
    easeInQuad: function(j, i, b, c, d) {
        return c * (i /= d) * i + b
    },
    easeOutQuad: function(j, i, b, c, d) {
        return -c * (i /= d) * (i - 2) + b
    },
    easeInOutQuad: function(j, i, b, c, d) {
        if ((i /= d / 2) < 1) {
            return c / 2 * i * i + b
        }
        return -c / 2 * ((--i) * (i - 2) - 1) + b
    },
    easeInCubic: function(j, i, b, c, d) {
        return c * (i /= d) * i * i + b
    },
    easeOutCubic: function(j, i, b, c, d) {
        return c * ((i = i / d - 1) * i * i + 1) + b
    },
    easeInOutCubic: function(j, i, b, c, d) {
        if ((i /= d / 2) < 1) {
            return c / 2 * i * i * i + b
        }
        return c / 2 * ((i -= 2) * i * i + 2) + b
    },
    easeInQuart: function(j, i, b, c, d) {
        return c * (i /= d) * i * i * i + b
    },
    easeOutQuart: function(j, i, b, c, d) {
        return -c * ((i = i / d - 1) * i * i * i - 1) + b
    },
    easeInOutQuart: function(j, i, b, c, d) {
        if ((i /= d / 2) < 1) {
            return c / 2 * i * i * i * i + b
        }
        return -c / 2 * ((i -= 2) * i * i * i - 2) + b
    },
    easeInQuint: function(j, i, b, c, d) {
        return c * (i /= d) * i * i * i * i + b
    },
    easeOutQuint: function(j, i, b, c, d) {
        return c * ((i = i / d - 1) * i * i * i * i + 1) + b
    },
    easeInOutQuint: function(j, i, b, c, d) {
        if ((i /= d / 2) < 1) {
            return c / 2 * i * i * i * i * i + b
        }
        return c / 2 * ((i -= 2) * i * i * i * i + 2) + b
    },
    easeInSine: function(j, i, b, c, d) {
        return -c * Math.cos(i / d * (Math.PI / 2)) + c + b
    },
    easeOutSine: function(j, i, b, c, d) {
        return c * Math.sin(i / d * (Math.PI / 2)) + b
    },
    easeInOutSine: function(j, i, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * i / d) - 1) + b
    },
    easeInExpo: function(j, i, b, c, d) {
        return (i == 0) ? b : c * Math.pow(2, 10 * (i / d - 1)) + b
    },
    easeOutExpo: function(j, i, b, c, d) {
        return (i == d) ? b + c : c * (-Math.pow(2, -10 * i / d) + 1) + b
    },
    easeInOutExpo: function(j, i, b, c, d) {
        if (i == 0) {
            return b
        }
        if (i == d) {
            return b + c
        }
        if ((i /= d / 2) < 1) {
            return c / 2 * Math.pow(2, 10 * (i - 1)) + b
        }
        return c / 2 * (-Math.pow(2, -10 * --i) + 2) + b
    },
    easeInCirc: function(j, i, b, c, d) {
        return -c * (Math.sqrt(1 - (i /= d) * i) - 1) + b
    },
    easeOutCirc: function(j, i, b, c, d) {
        return c * Math.sqrt(1 - (i = i / d - 1) * i) + b
    },
    easeInOutCirc: function(j, i, b, c, d) {
        if ((i /= d / 2) < 1) {
            return -c / 2 * (Math.sqrt(1 - i * i) - 1) + b
        }
        return c / 2 * (Math.sqrt(1 - (i -= 2) * i) + 1) + b
    },
    easeInElastic: function(c, o, m, n, p) {
        var d = 1.70158;
        var a = 0;
        var b = n;
        if (o == 0) {
            return m
        }
        if ((o /= p) == 1) {
            return m + n
        }
        if (!a) {
            a = p * 0.3
        }
        if (b < Math.abs(n)) {
            b = n;
            var d = a / 4
        } else {
            var d = a / (2 * Math.PI) * Math.asin(n / b)
        }
        return -(b * Math.pow(2, 10 * (o -= 1)) * Math.sin((o * p - d) * (2 * Math.PI) / a)) + m
    },
    easeOutElastic: function(c, o, m, n, p) {
        var d = 1.70158;
        var a = 0;
        var b = n;
        if (o == 0) {
            return m
        }
        if ((o /= p) == 1) {
            return m + n
        }
        if (!a) {
            a = p * 0.3
        }
        if (b < Math.abs(n)) {
            b = n;
            var d = a / 4
        } else {
            var d = a / (2 * Math.PI) * Math.asin(n / b)
        }
        return b * Math.pow(2, -10 * o) * Math.sin((o * p - d) * (2 * Math.PI) / a) + n + m
    },
    easeInOutElastic: function(c, o, m, n, p) {
        var d = 1.70158;
        var a = 0;
        var b = n;
        if (o == 0) {
            return m
        }
        if ((o /= p / 2) == 2) {
            return m + n
        }
        if (!a) {
            a = p * (0.3 * 1.5)
        }
        if (b < Math.abs(n)) {
            b = n;
            var d = a / 4
        } else {
            var d = a / (2 * Math.PI) * Math.asin(n / b)
        }
        if (o < 1) {
            return -0.5 * (b * Math.pow(2, 10 * (o -= 1)) * Math.sin((o * p - d) * (2 * Math.PI) / a)) + m
        }
        return b * Math.pow(2, -10 * (o -= 1)) * Math.sin((o * p - d) * (2 * Math.PI) / a) * 0.5 + n + m
    },
    easeInBack: function(l, k, b, c, d, j) {
        if (j == undefined) {
            j = 1.70158
        }
        return c * (k /= d) * k * ((j + 1) * k - j) + b
    },
    easeOutBack: function(l, k, b, c, d, j) {
        if (j == undefined) {
            j = 1.70158
        }
        return c * ((k = k / d - 1) * k * ((j + 1) * k + j) + 1) + b
    },
    easeInOutBack: function(l, k, b, c, d, j) {
        if (j == undefined) {
            j = 1.70158
        }
        if ((k /= d / 2) < 1) {
            return c / 2 * (k * k * (((j *= (1.525)) + 1) * k - j)) + b
        }
        return c / 2 * ((k -= 2) * k * (((j *= (1.525)) + 1) * k + j) + 2) + b
    },
    easeInBounce: function(j, i, b, c, d) {
        return c - jQuery.easing.easeOutBounce(j, d - i, 0, c, d) + b
    },
    easeOutBounce: function(j, i, b, c, d) {
        if ((i /= d) < (1 / 2.75)) {
            return c * (7.5625 * i * i) + b
        } else {
            if (i < (2 / 2.75)) {
                return c * (7.5625 * (i -= (1.5 / 2.75)) * i + 0.75) + b
            } else {
                if (i < (2.5 / 2.75)) {
                    return c * (7.5625 * (i -= (2.25 / 2.75)) * i + 0.9375) + b
                } else {
                    return c * (7.5625 * (i -= (2.625 / 2.75)) * i + 0.984375) + b
                }
            }
        }
    },
    easeInOutBounce: function(j, i, b, c, d) {
        if (i < d / 2) {
            return jQuery.easing.easeInBounce(j, i * 2, 0, c, d) * 0.5 + b
        }
        return jQuery.easing.easeOutBounce(j, i * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b
    }
});
(function(c) {
    var h = window.loli || (window.loli = {});
    var a = null ;
    var e = 0;
    var d = new Date().getTime();
    var g = 10 * 60 * 1000;
    var f = [];
    var b = null ;
    h.globalCheckLogin = function(j) {
        k(j);
        function k(n) {
            if (!jQuery.cookie("seus")) {
                n({
                    result: "0",
                    userName: ""
                });
                return
            }
            var o = jQuery.cookie("seus");
            if (o != b) {
                e = 0
            }
            b = jQuery.cookie("seus");
            var m = (new Date()).getTime();
            if (m - d > g) {
                e = 0
            }
            if (e == 0) {
                l(n);
                d = new Date().getTime();
                return
            } else {
                if (e == 2) {
                    if (n && a) {
                        n(a)
                    }
                } else {
                    if (n) {
                        f.push(n)
                    }
                }
            }
        }
        function l(m) {
            e = 1;
            var n = URLPrefix.passport + "/publicPassport/isLogin.do?callback=?";
            jQuery.getJSON(n, function(o) {
                i(m, o)
            })
        }
        function i(m, p) {
            e = 2;
            d = (new Date()).getTime();
            if (p) {
                a = p;
                if (m) {
                    m(p)
                }
                var n = f.length;
                for (var o = 0; o < n; o++) {
                    var m = f.shift();
                    m(p)
                }
            }
        }
    }
})(jQuery);
(function(O) {
    var d = window.loli || (window.loli = {});
    var k = d.app = d.app || {};
    var G = d.app.minicart = d.app.minicart || {};
    G.addItemCallback = function(U, T) {}
    ;
    G.addItemFailback = function(U, T) {}
    ;
    G.removeItemCallback = function(U, T) {}
    ;
    G.removeItemFailback = function(U, T) {}
    ;
    G.updateItemCallback = function(U, T) {}
    ;
    G.updateItemFailback = function(U, T) {}
    ;
    G.chooseItemCallback = function(U, T) {}
    ;
    G.chooseItemFailback = function(U, T) {}
    ;
    G.changeItemCallback = function(U, T) {}
    ;
    G.changeAddressCallback = function(T) {}
    ;
    G.reloadCartCallback = function(T) {}
    ;
    G.errorCallback = function(V, U, T) {}
    ;
    G.getJSON = function(V, T, X, U, W) {
        if (W == null ) {
            W = 3000
        }
        jQuery.ajax({
            url: V,
            data: T,
            dataType: "jsonp",
            jsonp: "callback",
            jsonpCallback: "jsonp" + new Date().getTime(),
            cache: false,
            timeout: W,
            success: function(Y) {
                if (X) {
                    X(Y)
                }
            },
            error: function(Y, Z, aa) {
                if (U) {
                    U(Y, Z, aa)
                } else {
                    G.errorCallback(Y, Z, aa)
                }
            }
        })
    }
    ;
    var o = O.cookie("provinceId") || 1;
    var K = O.cookie("yihaodian_uid");
    var Q = URLPrefix.cartDomain || "http://cart.yhd.com";
    var a = O("#miniCart");
    var c = O("#showMiniCartDetail");
    var r = O("#in_cart_num");
    var y = function() {
            var T = window.navigator.userAgent.toLowerCase();
            var U = /msie ([\d\.]+)/;
            if (U.test(T)) {
                var V = parseInt(U.exec(T)[1]);
                return V
            }
            return 0
        }
        ;
    var H = function(T, Y, W) {
            var V = Y || 60;
            var X = W || 60;
            var U = /_\d+x\d+\.([a-zA-Z]+)$/;
            if (T) {
                if (U.test(T)) {
                    T = T.replace(U, "_" + V + "x" + X + ".$1")
                } else {
                    T = T.substring(0, T.lastIndexOf(".")) + "_" + V + "x" + X + T.substring(T.lastIndexOf("."))
                }
            } else {
                T = "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_" + V + "x" + X + ".jpg"
            }
            return T
        }
        ;
    var S = function(W, U, T, V) {
            O(W).data("lastTime", new Date().getTime());
            if (U) {
                var X = U.call(O(W));
                O(W).data("lastResult", X)
            }
            var Y = setTimeout(function() {
                var ab = O(W).data("lastTime") ? O(W).data("lastTime") : new Date().getTime();
                var Z = (typeof O(W).data("lastResult") == "undefined" || O(W).data("lastResult")) ? true : false;
                var aa = new Date().getTime();
                if (aa - ab >= (V - 50)) {
                    if (T && Z) {
                        T.call(O(W))
                    }
                }
            }, V)
        }
        ;
    var n = [{
        key: "华北",
        value: [{
            id: 2,
            name: "北京"
        }, {
            id: 3,
            name: "天津"
        }, {
            id: 4,
            name: "河北"
        }, {
            id: 32,
            name: "山西"
        }, {
            id: 8,
            name: "内蒙古"
        }]
    }, {
        key: "华东",
        value: [{
            id: 1,
            name: "上海"
        }, {
            id: 5,
            name: "江苏"
        }, {
            id: 6,
            name: "浙江"
        }, {
            id: 13,
            name: "安徽"
        }, {
            id: 14,
            name: "福建"
        }, {
            id: 16,
            name: "山东"
        }]
    }, {
        key: "华南",
        value: [{
            id: 20,
            name: "广东"
        }, {
            id: 21,
            name: "广西"
        }, {
            id: 22,
            name: "海南"
        }]
    }, {
        key: "华中",
        value: [{
            id: 15,
            name: "江西"
        }, {
            id: 17,
            name: "河南"
        }, {
            id: 18,
            name: "湖北"
        }, {
            id: 19,
            name: "湖南"
        }]
    }, {
        key: "西南",
        value: [{
            id: 7,
            name: "重庆"
        }, {
            id: 12,
            name: "四川"
        }, {
            id: 23,
            name: "贵州"
        }, {
            id: 24,
            name: "云南"
        }, {
            id: 25,
            name: "西藏"
        }]
    }, {
        key: "西北",
        value: [{
            id: 26,
            name: "陕西"
        }, {
            id: 27,
            name: "甘肃"
        }, {
            id: 28,
            name: "青海"
        }, {
            id: 30,
            name: "宁夏"
        }, {
            id: 29,
            name: "新疆"
        }]
    }, {
        key: "东北",
        value: [{
            id: 9,
            name: "辽宁"
        }, {
            id: 10,
            name: "吉林"
        }, {
            id: 11,
            name: "黑龙江"
        }]
    }];
    var E = function() {
            var U = jQuery.cookie("cart_num");
            var T = (U && !isNaN(U)) ? parseInt(U) : 0;
            if (T > 0) {
                r.text(T > 999 ? "999+" : T);
                r.show()
            } else {
                r.hide()
            }
        }
        ;
    var u = function() {
            var X = O.cookie("detail_yhdareas");
            var Z = [];
            var Y = [];
            var W = /([\d]+_[\d]+_[\d]+)_([\S^_]+_[\S^_]+_[\S^_]+)/;
            if (X && W.test(X)) {
                Z = W.exec(X)[1].split("_");
                Y = W.exec(X)[2].replace(/\<i\>\<\/i\>/g, "").split("_")
            } else {
                Z = [o];
                for (var V = 0; V < n.length; V++) {
                    var T = n[V].value;
                    for (var U = 0; U < T.length; U++) {
                        if (T[U].id == o) {
                            Y = [T[U].name];
                            break
                        }
                    }
                }
            }
            return [Z, Y]
        }
        ;
    var s = function(V) {
            if (!V || V.length != 2) {
                return
            }
            var U = V[0];
            var T = V[1];
            var W = U[0] + "_" + U[1] + "_" + U[2] + "_" + T[0] + "_" + T[1] + "_" + T[2];
            d.cookie.setAllDomain("provinceId", U[0], "/", 800);
            d.cookie.setAllDomain("detail_yhdareas", W, "/", 800);
            G.changeAddressCallback(V);
            setTimeout(function() {
                if (o != U[0]) {
                    setAddressCity(U[0])
                }
            }, 1500)
        }
        ;
    var D = function() {
            var W = [];
            var X = u();
            var Z = X[0];
            var Y = X[1];
            W.push("<div class='yhd_province clearfix'>");
            W.push("<div class='yhd_area_select'>");
            W.push("<div class='yhd_address'>");
            W.push("<span class='hd_val_text' data-value='" + Z.join("_") + "'>" + Y.join("|") + "</span>");
            W.push("<i></i>");
            W.push("</div>");
            W.push("<div class='yhd_tab_detail none'>");
            W.push("<div class='yhd_area_tab clearfix'>");
            W.push("<span data-value='" + Z[0] + "' class='yhd_on'><em>" + Y[0] + "</em></span>");
            W.push("<span data-value='" + (Z.length > 1 ? Z[1] : "") + "' class=''><em>" + (Y.length > 1 ? Y[1] : "请选择市") + "</em></span>");
            W.push("<span data-value='" + (Z.length > 2 ? Z[2] : "") + "' class=''><em>" + (Y.length > 2 ? Y[2] : "请选择区") + "</em></span>");
            W.push("</div>");
            W.push("<div class='yhd_area_box'>");
            W.push("<div class='yhd_item hd_first_area'>");
            for (var V = 0;
                 V < n.length; V++) {
                var T = n[V].value;
                W.push("<dl class='clearfix'>");
                W.push("<dt>" + n[V].key + "：</dt>");
                for (var U = 0; U < T.length; U++) {
                    W.push("<dd><a data-value='" + T[U].id + "' class='" + (Z[0] == T[U].id ? "hd_cart_cur" : "") + "' href='javascript:;'>" + T[U].name + "</a></dd>")
                }
                W.push("</dl>")
            }
            W.push("</div>");
            W.push("<div class='yhd_item yhd_second_area none'>");
            W.push("</div>");
            W.push("<div class='yhd_item yhd_third_area none' data-tpc='1'>");
            W.push("</div>");
            W.push("</div>");
            W.push("<span class='yhd_close_btn'>×</span>");
            W.push("</div>");
            W.push("</div>");
            W.push("</div>");
            return W.join("")
        }
        ;
    var g = function(Z, ah, ac, ag) {
            var ai = [];
            var X = H(Z.pic);
            var V = "http://item.yhd.com/item/" + Z.pmId;
            var aa = Z.name;
            var ad = Z.checked;
            var ae = Z.amount != null  ? Z.amount.money : 0;
            var ab = Z.amount != null  ? Z.amount.points : 0;
            var Y = "";
            var T = "";
            if (ab > 0) {
                Y += ab + "积分"
            }
            if (ae > 0) {
                Y += "+¥" + ae
            }
            if (Y.indexOf("+") == 0) {
                Y = Y.substring(1)
            }
            if (Y == "") {
                Y = "¥0"
            }
            if (ah) {
                ad = false;
                T = "商品无库存或当前区域不销售";
                if (Z.warningCode && ag.tips) {
                    for (var af = 0; af < ag.tips.length; af++) {
                        var U = ag.tips[af];
                        if (U.code == Z.warningCode) {
                            T = U.msg;
                            break
                        }
                    }
                }
            }
            if (Z.typeValue == 3) {
                ac = false;
                X = URLPrefix.statics + "/global/images/promotion_mix.jpg";
                V = URLPrefix.search + "/p/pt" + Z.promotion.promotionId + "-pl" + Z.promotion.promotionLevelId;
                aa = Z.promotion.title
            }
            if (Z.typeValue == 9) {
                var W = Z.promotion.promotionId;
                V = "http://item.yhd.com/item/lp/" + W + "_" + Z.pmId + "_" + o
            }
            ai.push("<div class='clearfix hd_cart_wrap'>");
            ai.push("<a data-tpc='4' class='hd_select_box " + (ad ? "hd_selected" : "") + "' href='javascript:;' cartItemId='" + Z.id + "'></a>");
            ai.push("<a class='hd_pro_img' data-tpc='5' href='" + V + "' target='_blank'><img src='" + X + "' alt=''/></a>");
            ai.push("<div class='hd_cart_detail'>");
            ai.push("<a class='hd_pro_name' data-tpc='6' href='" + V + "' target='_blank' title='" + aa + "'>" + aa + "</a>");
            ai.push("<p class='hd_subcode'></p>");
            ai.push("<div class='clearfix'>");
            ai.push("<em>" + Z.num + "</em>");
            ai.push("<span class='hd_sold_tips'>" + T + "</span>");
            if (ac) {
                ai.push("<div class='hd_num_box'>");
                ai.push("<a data-tpc='8' class='" + (Z.num > 1 ? "hd_minus" : "hd_minus_disable") + "' href='javascript:;'></a>");
                ai.push("<input type='text' name='itemNum' class='hd_minicart_num' value='" + Z.num + "' cartItemId='" + Z.id + "'>");
                ai.push("<a class='hd_plus' data-tpc='9' href='javascript:;'></a>");
                ai.push("</div>")
            }
            ai.push("<b>" + Y + "</b>");
            ai.push("</div>");
            ai.push("</div>");
            ai.push("<a class='hd_cart_del' data-tpc='7' href='javascript:;' cartItemId='" + Z.id + "'></a>");
            ai.push("<div class='hd_over_tips' style='display: none;'>");
            ai.push("<i></i><p></p>");
            ai.push("</div>");
            ai.push("</div>");
            return ai.join("")
        }
        ;
    var v = function(ad) {
            var an = [];
            if (!ad || !ad.summary) {
                return ""
            }
            for (var Z = 0; Z < ad.bags.length; Z++) {
                var ax = ad.bags[Z];
                var T = ax.summary.count;
                var al = ax.yhdMerchant == true ? "1号店" : ax.merchantName;
                var ak = ax.yhdMerchant == true ? "javascript:;" : "http://shop.yhd.com/merchantfront/accessAction.action?merchantId=" + ax.merchantIds[0] + "&siteId=1";
                var X = true;
                for (var V = 0; V < ax.itemGroups.length; V++) {
                    for (var aq = 0; aq < ax.itemGroups[V].items.length; aq++) {
                        if (!ax.itemGroups[V].items[aq].checked) {
                            X = false;
                            break
                        }
                    }
                }
                if (ax.itemGroups.length == 0) {
                    X = false
                }
                an.push("<dl>");
                an.push("<dt>");
                an.push("<span class='fr'>共<i>" + T + "</i>件商品</span>");
                an.push("<em class='hd_red_icon'></em>");
                an.push("<a data-tpc='3' class='hd_select_box " + (X ? "hd_selected" : "") + "' href='javascript:;'></a>");
                an.push("<a href='" + ak + "' " + (ax.yhdMerchant ? "" : "target='_blank'") + "><b>" + al + "</b></a>");
                an.push("</dt>");
                for (var V = 0; V < ax.itemGroups.length; V++) {
                    var ao = ax.itemGroups[V];
                    for (var aq = 0; aq < ao.items.length; aq++) {
                        var az = ao.items[aq];
                        var aB = (az.typeValue == 12 || az.typeValue == 11) ? false : true;
                        var aj = false;
                        if (az.typeValue == 3) {
                            aB = false
                        }
                        if (az.typeValue != 2) {
                            an.push("<dd class='hd_cart_cur " + (aB ? "hd_num_cur" : "") + "' disable='" + aj + "' editable='" + aB + "' productId='" + az.productId + "' pmId='" + az.pmId + "' cartItemId='" + az.id + "' parentCartItemId='" + az.id + "' itemNum='" + az.num + "' itemType='" + az.typeValue + "' productType='" + az.productType + "' checkoutType='" + (az.checkoutType ? az.checkoutType : 0) + "' promotionId='" + (az.promotion ? az.promotion.promotionId : "") + "' checked='" + az.checked + "'>");
                            an.push(g(az, aj, aB, ad));
                            for (var ab = 0; ab < az.nestedItems.length;
                                 ab++) {
                                var aw = az.nestedItems[ab];
                                var U = "http://item.yhd.com/item/" + aw.pmId;
                                var ac = "¥" + (aw.amount != null  ? aw.amount.money : 0);
                                var au = aw.name;
                                if (aw.typeValue == 10) {
                                    an.push("<p class='hd_gift'>");
                                    an.push("<span class='fr'>" + ac + "</span>");
                                    an.push("<em class='hd_extend'>延保</em>");
                                    an.push("<a href='" + U + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                    an.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aw.id + "'></a>");
                                    an.push("</p>")
                                } else {
                                    if (aw.typeValue == 11) {
                                        an.push("<p class='hd_gift'>");
                                        an.push("<span class='fr'>" + ac + "</span>");
                                        an.push("<em>搭售</em>");
                                        an.push("<a href='" + U + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                        an.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aw.id + "'></a>");
                                        an.push("</p>")
                                    }
                                }
                            }
                        } else {
                            for (var ab = 0; ab < az.nestedItems.length; ab++) {
                                var aw = az.nestedItems[ab];
                                an.push("<dd class='hd_cart_cur " + (aB ? "hd_num_cur" : "") + "' disable='" + aj + "' editable='" + aB + "' productId='" + aw.productId + "' pmId='" + aw.pmId + "' cartItemId='" + aw.id + "' parentCartItemId='" + az.id + "' itemNum='" + aw.num + "' itemType='" + az.typeValue + "' productType='" + az.productType + "' checkoutType='" + (az.checkoutType ? az.checkoutType : 0) + "' promotionId='" + (az.promotion ? az.promotion.promotionId : "") + "' checked='" + aw.checked + "'>");
                                an.push(g(aw, aj, aB, ad));
                                if (ab != az.nestedItems.length - 1) {
                                    an.push("</dd>")
                                }
                            }
                        }
                        if (aq == ao.items.length - 1) {
                            for (var Y = 0; Y < ao.gifts.length; Y++) {
                                var aa = ao.gifts[Y];
                                var U = "http://item.yhd.com/item/" + aa.pmId;
                                var ac = "¥" + aa.price.money;
                                var au = aa.name;
                                var ah = aa.typeValue == 14 ? "换购" : "赠品";
                                an.push("<p class='hd_gift'>");
                                if (aa.typeValue == 14) {
                                    an.push("<span class='fr'>" + ac + "</span>")
                                }
                                an.push("<em>" + ah + "</em>");
                                an.push("<a href='" + U + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                an.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aa.id + "'></a>");
                                an.push("</p>")
                            }
                        }
                        if (V == ax.itemGroups.length - 1 && aq == ao.items.length - 1) {
                            for (var W = 0; W < ax.gifts.length; W++) {
                                var aa = ax.gifts[W];
                                var U = "http://item.yhd.com/item/" + aa.pmId;
                                var ac = "¥" + aa.price.money;
                                var au = aa.name;
                                an.push("<p class='hd_gift'>");
                                an.push("<em>赠品</em>");
                                an.push("<a href='" + U + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                an.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aa.id + "'></a>");
                                an.push("</p>")
                            }
                            for (var at = 0; at < ax.redemptions.length; at++) {
                                var ai = ax.redemptions[at];
                                var ap = "http://item.yhd.com/item/" + ai.pmId;
                                var af = "¥" + ai.price.money;
                                var ae = ai.name;
                                an.push("<p class='hd_gift'>");
                                an.push("<span class='fr'>" + af + "</span>");
                                an.push("<em>换购</em>");
                                an.push("<a href='" + ap + "' target='_blank' title='" + ae + "'>" + ae + "</a>");
                                an.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + ai.id + "'></a>");
                                an.push("</p>")
                            }
                        }
                        an.push("</dd>")
                    }
                }
                for (var at = 0; at < ax.warningItems.length; at++) {
                    var am = ax.warningItems[at];
                    an.push("<dd class='hd_sold_out hd_cart_cur' disable='true' editable='false'>");
                    an.push(g(am, true, false, ad));
                    an.push("</dd>")
                }
                var ay = 0;
                var ar = [];
                for (var V = 0; V < ax.itemGroups.length; V++) {
                    var ao = ax.itemGroups[V];
                    var ag = ao.pricePromotions;
                    ay = ay + ag.length;
                    for (var ab = 0; ab < ag.length; ab++) {
                        ar.push(ag[ab].promotion.displayName)
                    }
                }
                ay = ay + ax.reductCashes.length;
                for (var aA = 0; aA < ax.reductCashes.length; aA++) {
                    ar.push(ax.reductCashes[aA].promotion.displayName)
                }
                an.push("<dd class='clearfix hd_min_sum'>");
                if (ay > 0) {
                    an.push("<div class='fl'>");
                    an.push("参加" + ay + "项促销，共节约<b>¥" + ax.summary.deduction + "</b><u></u>");
                    an.push("<div class='hd_sale_show'>");
                    an.push("<i></i>");
                    for (var av = 0; av < ar.length; av++) {
                        an.push("<p>" + ar[av] + "</p>")
                    }
                    an.push("</div>");
                    an.push("</div>")
                }
                if (ax.yhdMerchant == true) {
                    an.push("<em class='fr'>" + ax.summary.weight + "KG</em>")
                }
                an.push("</dd>");
                an.push("</dl>")
            }
            return an.join("")
        }
        ;
    var C = function(U) {
            var V = [];
            if (U) {
                if (!U.summary) {
                    var T = O.cookie("ut");
                    if (T) {
                        V.push("<div class='hd_none_tips'>");
                        V.push("<span class='hd_none_icon'></span>");
                        V.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~~</p>");
                        V.push("</div>")
                    } else {
                        V.push("<div class='hd_login_tips'>");
                        V.push("<p>登录才能看得到购物车里的商品哦~</p>");
                        V.push("<a href='javascript:void(0);' id='miniCartLogin'>登录</a>");
                        V.push("</div>")
                    }
                    return
                }
                V.push("<div class='hd_cart_scrollwrap'>");
                V.push(D());
                V.push("<div class='hd_cart_list'>");
                V.push(v(U));
                V.push("</div>");
                V.push("<p class='hd_feedback' data-tpc='11'>");
                V.push("<em></em><a class='blue_link' href='http://yihaodian.sojump.com/jq/5279459.aspx' target='_blank'>意见反馈</a>");
                V.push("</p>");
                V.push("</div>");
                V.push("<div class='hd_bottom_tips' style='display:none;'>");
                V.push("<i></i><em></em><u></u><p></p>");
                V.push("</div>");
                V.push("<div class='hd_total_pro' data-tpc='10'>");
                V.push("<div class='fl'>");
                V.push("<span class='hd_all_select'><a href='javascript:void(0);' class='hd_select_box' id='miniCartSeltAll'></a><i>全选</i></span>");
                V.push("合计<b><em></em></b><p class='hd_point_num'><u></u></p>");
                V.push("</div>");
                V.push("<a class='fr' href='javascript:void(0);' id='miniCartPaybtn'>立即结算</a>");
                V.push("</div>");
                V.push("<div class='hd_area_mask none'></div>");
                V.push("<form method='post' id='miniCartForm' style='display:none;'>");
                V.push("<input name='cart2Checkbox' type='hidden' value=''/>");
                V.push("<input name='cartSuppress' type='hidden' value=''/>");
                V.push("</form>")
            } else {
                var T = O.cookie("ut");
                if (T) {
                    V.push("<div class='hd_none_tips'>");
                    V.push("<span class='hd_none_icon'></span>");
                    V.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~~</p>");
                    V.push("</div>")
                } else {
                    V.push("<div class='hd_login_tips'>");
                    V.push("<p>登录才能看得到购物车里的商品哦~</p>");
                    V.push("<a href='javascript:void(0);' id='miniCartLogin'>登录</a>");
                    V.push("</div>")
                }
            }
            return V.join("")
        }
        ;
    var m = function(V, T) {
            var Z = URLPrefix.pms + "/pms/getRecommProductsByJson.do?callback=?";
            var X = 0;
            var aa = 0;
            var W = function() {
                    var ab = O("#addCartPopWin");
                    var af = O("a.hd_show_pre", ab);
                    var ac = O("a.hd_show_next", ab);
                    var ag = ab.find("div.hd_recommend_list ul");
                    var ad = ab.find("div.hd_recommend_list").width() + 15;
                    var aj = O("div.hd_recommend_list li", ab).size();
                    var ai = 4;
                    var ae = (aj % ai == 0) ? Math.floor(aj / ai) : Math.floor(aj / ai) + 1;
                    var ah = 1;
                    if (ae > 1) {
                        ac.show();
                        af.click(function() {
                            if (ah > 1) {
                                ag.animate({
                                    left: "-" + (ah - 2) * ad + "px"
                                }, function() {
                                    ah--;
                                    if (ah < ae) {
                                        ac.show()
                                    }
                                    if (ah == 1) {
                                        af.hide()
                                    }
                                })
                            } else {
                                af.hide();
                                ac.show()
                            }
                        });
                        ac.click(function() {
                            if (ah < ae) {
                                ag.animate({
                                    left: "-" + (ah) * ad + "px"
                                }, function() {
                                    ah++;
                                    if (ah > 1) {
                                        af.show()
                                    }
                                    if (ah == ae) {
                                        ac.hide()
                                    }
                                })
                            } else {
                                af.show();
                                ac.hide()
                            }
                        })
                    }
                }
                ;
            var Y = function(ad) {
                    if (X) {
                        clearTimeout(X)
                    }
                    if (aa) {
                        return
                    }
                    var af = [];
                    af.push("<div id='addCartPopWin' class='hd_cart_pop'>");
                    af.push("<div class='hd_pop_content'>");
                    af.push("<span class='hd_colse_btn' onclick='javascript:yhdLib.popclose();'></span>");
                    if (V.code == "00000000") {
                        af.push("<p class='hd_pop_tips'><i></i>已成功加入购物车</p>");
                        af.push("<div class='hd_pop_btn'>");
                        af.push("<a href='javascript:addTrackPositionToCookie(\"1\",\"product_popup_jxgw\");yhdLib.popclose();' class='hd_btn_l' data-ref='product_popup_jxgw'>继续购物</a>");
                        af.push("<a href='http://cart.yhd.com/cart/cart.do?action=view' class='hd_btn_r' data-ref='product_popup'>查看购物车</a>");
                        af.push("</div>")
                    } else {
                        af.push("<p class='hd_pop_tips'><i class='hd_error_icon'></i>加入购物车失败</p>");
                        af.push("<div class='hd_error_tips'>");
                        af.push(V.msg);
                        af.push("</div>")
                    }
                    if (ad) {
                        af.push("<div class='hd_recommend_wrap'>");
                        af.push("<p>更多商品推荐</p>");
                        af.push("<div class='hd_recommend_list'>");
                        af.push("<ul class='clearfix'>");
                        for (var ae = 0; ae < ad.length; ae++) {
                            var ab = ad[ae];
                            var ac = ab.linkUrl;
                            var ag = ab.trackerCode;
                            var ah = H(ab.picUrl, 85, 85);
                            var aj = ab.cnName;
                            var ai = ab.salePrice;
                            af.push("<li>");
                            af.push("<a href='" + ac + "' target='_blank' data-ref='" + ag + "' class='hd_pop_img'><img src='" + ah + "'></a>");
                            af.push("<a href='" + ac + "' target='_blank' data-ref='" + ag + "' class='hd_pop_name'>" + aj + "</a>");
                            af.push("<b class='hd_pop_price'>&yen;" + ai + "</b>");
                            af.push("</li>")
                        }
                        af.push("</ul>");
                        af.push("</div>");
                        af.push("<a href='javascript:void(0);' class='hd_show_pre none'></a>");
                        af.push("<a href='javascript:void(0);' class='hd_show_next none'></a>");
                        af.push("</div>")
                    }
                    af.push("</div>");
                    af.push("</div>");
                    yhdLib.popwin({
                        popcontentstr: af.join("")
                    });
                    aa = 1;
                    W()
                }
                ;
            var U = {
                currSiteId: currSiteId,
                provinceId: o,
                productid: T.productId,
                merchantId: T.merchantId,
                type: "html"
            };
            O.getJSON(Z, U, function(ab) {
                if (ab && ab.success == "1") {
                    Y(ab.value)
                } else {
                    Y(0)
                }
            });
            var X = setTimeout(function() {
                Y(0)
            }, 5 * 1000)
        }
        ;
    var e = function() {
            var V = O("#miniCart div.hd_cart_scrollwrap");
            var T = O(window).height()
                , X = O(window).scrollTop()
                , W = c.offset().top
                , U = T - (W - X) - O("#miniCart div.hd_total_pro").outerHeight();
            V.css("height", U)
        }
        ;
    var w = function(W, U) {
            var V = W.find("div.hd_over_tips");
            var T = W.find("div.hd_cart_wrap");
            V.find("p").text(U);
            V.slideDown(500);
            T.css("z-index", 1201);
            setTimeout(function() {
                V.slideUp(500);
                T.css("z-index", 1200)
            }, 3000)
        }
        ;
    var x = function(U) {
            var T = O("#miniCart div.hd_bottom_tips");
            T.find("p").html(U);
            T.show()
        }
        ;
    var A = function() {
            var ab = "http://buy.yhd.com/checkoutV3/index.do";
            var W = a.find("div.hd_cart_list dd[productId]");
            var X = 0;
            var ac = 0;
            var U = 0;
            var Y = 0;
            W.each(function() {
                var ad = O(this);
                var ae = false;
                if (ad.get(0).getAttribute("checked") == "true") {
                    ae = true
                }
                U++;
                if (ad.attr("productType") == 4 && ae && ad.attr("disable") == "false") {
                    X++
                }
                if ((ad.attr("checkoutType") == 2 || ad.attr("checkoutType") == 1) && ae && ad.attr("disable") == "false") {
                    ac++
                }
                if (ae) {
                    Y++
                }
            });
            if (X > 0 && ac == 0 && X < Y) {
                x("结算商品中包含礼品卡，需前往<a href='" + Q + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                return false
            }
            if (ac > 0 && X == 0 && ac < Y) {
                x("结算商品中包含海购商品，需前往<a href='" + Q + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                return false
            }
            if (X > 0 && ac > 0) {
                x("结算商品中包含海购商品和礼品卡，需前往<a href='" + Q + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                return false
            }
            if (Y == 0) {
                return false
            }
            var T = a.find("div.hd_cart_list dd a.hd_select_box");
            var aa = [];
            T.each(function() {
                var ad = O(this);
                var af = ad.parents("dd").attr("cartItemId");
                var ae = ad.hasClass("hd_selected") ? 1 : 0;
                aa.push(af + "=" + ae)
            });
            var Z = O("#miniCartForm").get(0);
            Z.action = ab;
            Z.cart2Checkbox.value = aa.join(",");
            var V = function(ad) {
                    if (ad.result == 1) {
                        Z.submit()
                    } else {
                        if (yhdPublicLogin) {
                            var ae = URLPrefix.passport;
                            yhdPublicLogin.showLoginDivNone(ae, false, "", function(af) {
                                if (af == 0) {
                                    O("#miniCartForm").submit()
                                }
                            })
                        }
                    }
                }
                ;
            d.globalCheckLogin(V)
        }
        ;
    var i = function(T, X) {
            if (!T) {
                return
            }
            var U = Q + "/cart/opt/getCitysByProvince.do?callback=?";
            var V = function(ad) {
                    var Z = [];
                    Z.push("<dl class='clearfix'>");
                    for (var aa = 0; aa < ad.length; aa++) {
                        var Y = ad[aa];
                        Z.push("<dd><a data-value='" + Y.id + "' href='javascript:;'>" + Y.name + "</a></dd>")
                    }
                    Z.push("</dl>");
                    var ab = a.find("div.yhd_province div.yhd_area_tab span:eq(1)");
                    var ac = a.find("div.yhd_province div.yhd_area_box div.yhd_second_area");
                    ac.html(Z.join(""));
                    ab.attr("data-loaded", 1);
                    if (X) {
                        X(ad)
                    }
                }
                ;
            var W = {
                provinceId: T
            };
            O.getJSON(U, W, function(Y) {
                if (Y && Y.code == "00000000") {
                    V(Y.data)
                }
            })
        }
        ;
    var I = function(T, X) {
            if (!T) {
                return
            }
            var V = Q + "/cart/opt/getCountysByCity.do?callback=?";
            var U = function(ad) {
                    var Z = [];
                    Z.push("<dl class='clearfix'>");
                    for (var aa = 0; aa < ad.length; aa++) {
                        var Y = ad[aa];
                        Z.push("<dd><a data-value='" + Y.id + "' href='javascript:;'>" + Y.name + "</a></dd>")
                    }
                    Z.push("</dl>");
                    var ab = a.find("div.yhd_province div.yhd_area_tab span:eq(2)");
                    var ac = a.find("div.yhd_province div.yhd_area_box div.yhd_third_area");
                    ac.html(Z.join(""));
                    ab.attr("data-loaded", 1);
                    if (X) {
                        X(ad)
                    }
                }
                ;
            var W = {
                cityId: T
            };
            O.getJSON(V, W, function(Y) {
                if (Y && Y.code == "00000000") {
                    U(Y.data)
                }
            })
        }
        ;
    var M = function(U) {
            var T = Q + "/cart/info/minicart.do?callback=?";
            O.getJSON(T, function(V) {
                if (V && V.code == "00000000") {
                    a.data("miniCartData", V.data);
                    U(V.data)
                } else {
                    U(null )
                }
            })
        }
        ;
    var l = function(V, ae, Y) {
            if (!V || V.productId == null  || V.amount == null ) {
                return
            }
            var W = V.amount;
            var ai = V.isFloat;
            var ad = V.merchantId;
            var T = V.productId;
            var aa = V.pmId || "";
            var U = V.ybPmIds || "";
            var ah = V.showPrice || "";
            var X = V.needTip || "";
            var Z = V.linkPosition || "";
            var ac = V.referrer || encodeURIComponent(document.referrer);
            var af = Q + "/cart/opt/add.do?callback=?";
            var ab = function(ak) {
                    if (ai) {
                        S(a, null , function() {
                            B()
                        }, 200)
                    } else {
                        if (!V.isDeleteNewDiv) {
                            m(ak, V)
                        }
                        a.data("cart-item-loaded", 0)
                    }
                    if (ae) {
                        ae(ak)
                    }
                    G.addItemCallback(V, ak);
                    G.changeItemCallback(V, ak)
                }
                ;
            var ag = function(ak) {
                    if (ak && ak.code) {
                        var an = ak.code;
                        if (an == "300010801005") {
                            var al = ak.data;
                            if (al && al.indexOf("http") == 0) {
                                window.location.href = al
                            } else {
                                window.location.href = currDomain + al
                            }
                        } else {
                            if (an == "300010800001") {
                                var am = URLPrefix.passport;
                                yhdPublicLogin.showLoginDivNone(am, false, "", function(ao) {
                                    if (ao == 0) {
                                        yhdPublicLogin.showTopLoginInfo()
                                    }
                                })
                            } else {
                                m(ak, V)
                            }
                        }
                    }
                    if (Y) {
                        Y(ak)
                    }
                    G.addItemFailback(V, ak)
                }
                ;
            var aj = {
                productId: T,
                merchantId: ad,
                num: W,
                pmId: aa,
                ybPmIds: U,
                showPrice: ah,
                needTip: X,
                pageRef: ac,
                linkPosition: Z
            };
            G.getJSON(af, aj, function(ak) {
                if (ak && ak.code == "00000000") {
                    ab(ak)
                } else {
                    ag(ak)
                }
            })
        }
        ;
    var N = function(ab, W, U) {
            if (!ab || ab.productId == null ) {
                return
            }
            var aa = ab.productId;
            var V = ab.merchantId;
            var ac = ab.ybPmIds;
            var X = Q + "/cart/phone/isContractProduct.do?callback=?";
            var T = function(ad) {
                    if (W) {
                        W(ad)
                    }
                }
                ;
            var Y = function(ad) {
                    if (U) {
                        U(ad)
                    }
                }
                ;
            var Z = {
                productId: aa,
                merchantId: V,
                ybPmIds: ac ? ac : ""
            };
            G.getJSON(X, Z, function(ad) {
                if (ad.ERROR) {
                    Y(ad)
                } else {
                    T(ad)
                }
            })
        }
        ;
    var q = function(Z, T, X) {
            if (!Z || Z.itemIds == null ) {
                return
            }
            var aa = Q + "/cart/info/minicartDeleteItem.do?callback=?";
            var V = Z.itemIds.join(",");
            var W = function(ab) {
                    if (a.data("cart-item-loaded")) {
                        M(p)
                    }
                    if (T) {
                        T(ab)
                    }
                    G.removeItemCallback(Z, ab);
                    G.changeItemCallback(Z, ab)
                }
                ;
            var Y = function(ac) {
                    var ab = a.find("div.hd_cart_list dd[cartItemId='" + Z.itemId + "']");
                    var ad = ac.msg;
                    if (ab.size() > 0) {
                        ad = ad.replace("[" + ab.find("a.hd_pro_name").text() + "]", "");
                        w(ab, ad)
                    }
                    if (X) {
                        X(ac)
                    }
                    G.removeItemFailback(Z, ac)
                }
                ;
            var U = {
                deleteId: V
            };
            G.getJSON(aa, U, function(ab) {
                if (ab && ab.code == "00000000") {
                    W(ab)
                } else {
                    Y(ab)
                }
            })
        }
        ;
    var h = function(W, Z, T) {
            if (!W || W.itemId == null  || W.pmId == null  || W.num == null  || W.itemType == null ) {
                return
            }
            var U = Q + "/cart/info/minicartEditNum.do?callback=?";
            if (W.itemType == 10) {
                U = Q + "/cart/info/minicartEditPointNum.do?callback=?"
            } else {
                if (W.itemType == 9) {
                    U = Q + "/cart/info/minicartEditLandingNum.do?callback=?"
                }
            }
            var V = function(aa) {
                    if (a.data("cart-item-loaded")) {
                        M(p)
                    }
                    if (Z) {
                        Z(aa)
                    }
                    G.updateItemCallback(W, aa);
                    G.changeItemCallback(W, aa)
                }
                ;
            var Y = function(ab) {
                    var aa = a.find("div.hd_cart_list dd[cartItemId='" + W.itemId + "']");
                    var ad = ab.msg;
                    ad = ad.replace("[" + aa.find("a.hd_pro_name").text() + "]", "");
                    w(aa, ad);
                    var ac = aa.find("div.hd_num_box input");
                    ac.val(aa.attr("itemNum"));
                    if (T) {
                        T(ab)
                    }
                    G.updateItemFailback(W, ab)
                }
                ;
            var X = {
                cartItemVoId: W.itemId,
                pmInfoId: W.pmId,
                num: W.num
            };
            if (W.itemType == 9) {
                X.promotionId = W.promotionId
            }
            G.getJSON(U, X, function(aa) {
                if (aa && aa.code == "00000000") {
                    V(aa)
                } else {
                    Y(aa)
                }
            })
        }
        ;
    var b = function(U, Z, W) {
            if (!U || U.length == 0) {
                return
            }
            var aa = Q + "/cart/info/minicart.do?callback=?";
            var Y = [];
            for (var V = 0; V < U.length; V++) {
                Y.push(U[V].itemId + "=" + U[V].checked)
            }
            var ab = function(ac) {
                    if (a.data("cart-item-loaded")) {
                        a.data("miniCartData", ac.data);
                        p(ac.data)
                    }
                    if (Z) {
                        Z(ac)
                    }
                    G.chooseItemCallback(U, ac);
                    G.changeItemCallback(U, ac)
                }
                ;
            var X = function(ac) {
                    if (a.data("cart-item-loaded")) {
                        M(p)
                    }
                    if (W) {
                        W(ac)
                    }
                    G.chooseItemFailback(U, result)
                }
                ;
            var T = {
                checkboxStr: Y.join(",")
            };
            G.getJSON(aa, T, function(ac) {
                if (ac && ac.code == "00000000") {
                    ab(ac)
                } else {
                    X(ac)
                }
            })
        }
        ;
    var F = function(Y, Z, T) {
            if (!Y || Y.productIds == null  || Y.productIds.length == 0) {
                return
            }
            var V = Q + "/cart/opt/getSubProductSerialAttr.do?callback=?";
            var U = function(aa) {
                    if (aa.data && aa.data.subProductIdToAttributeValueMap) {
                        var ae = aa.data.subProductIdToAttributeValueMap;
                        for (var ad = 0; ad < Y.productIds.length; ad++) {
                            var ag = a.find("div.hd_cart_list dd[productId='" + Y.productIds[ad] + "'] p.hd_subcode");
                            var ab = ae[Y.productIds[ad]];
                            if (ag.size() > 0 && ab) {
                                var af = "";
                                for (var ac = 0; ac < ab.length; ac++) {
                                    af += "<span>" + ab[ac].attributeValueAlias + "</span>&nbsp;"
                                }
                                ag.html(af)
                            }
                        }
                    }
                    if (Z) {
                        Z(aa)
                    }
                }
                ;
            var X = function(aa) {
                    if (T) {
                        T(aa)
                    }
                }
                ;
            for (var W = 0; W < Y.productIds.length; W++) {
                V += "&subProductIds=" + Y.productIds[W]
            }
            O.getJSON(V, null , function(aa) {
                if (aa && aa.code == "00000000") {
                    U(aa)
                } else {
                    X(aa)
                }
            })
        }
        ;
    var z = function(T) {
            if (!T || !T.summary) {
                return
            }
            var V = [];
            for (var X = 0; X < T.bags.length; X++) {
                var Z = T.bags[X];
                for (var Y = 0; Y < Z.itemGroups.length; Y++) {
                    var U = Z.itemGroups[Y];
                    for (var W = 0; W < U.items.length; W++) {
                        var aa = U.items[W];
                        if (aa.productType == 2) {
                            V.push(aa.productId)
                        }
                    }
                }
            }
            F({
                productIds: V
            })
        }
        ;
    var R = function(ag) {
            O("div.hd_bottom_tips", a).hide();
            if (!ag || !ag.summary) {
                r.hide();
                a.find("div.hd_total_pro span.hd_all_select a").removeClass("hd_selected");
                a.find("div.hd_total_pro a.fr").text("立即结算(0)");
                a.find("div.hd_total_pro div.fl em").text("¥0");
                a.find("div.hd_total_pro div.fl u").text("");
                a.find("div.hd_total_pro").removeClass("hd_has_point");
                return
            }
            var aj = parseInt(ag.summary.count);
            if (aj > 0) {
                r.text(aj > 999 ? "999+" : aj);
                r.show()
            } else {
                r.hide()
            }
            if (aj > 0) {
                d.cookie.setAllDomain("cart_num", aj, "/", 15)
            }
            var ai = 0;
            for (var ab = 0; ab < ag.bags.length; ab++) {
                var ah = ag.bags[ab];
                for (var aa = 0; aa < ah.itemGroups.length; aa++) {
                    var af = ah.itemGroups[aa];
                    for (var Z = 0; Z < af.items.length; Z++) {
                        var ad = af.items[Z];
                        if (ad.checked) {
                            ai = ai + ad.num
                        }
                        for (var am = 0; am < ad.nestedItems.length; am++) {
                            var V = ad.nestedItems[am];
                            if (V.typeValue == 10 || V.typeValue == 11) {
                                ai += V.num
                            }
                        }
                    }
                    for (var X = 0; X < af.gifts.length;
                         X++) {
                        var W = af.gifts[X];
                        ai = ai + W.num
                    }
                }
                for (var T = 0; T < ah.gifts.length; T++) {
                    var W = ah.gifts[T];
                    ai = ai + W.num
                }
                for (var an = 0; an < ah.redemptions.length; an++) {
                    var ak = ah.redemptions[an];
                    ai = ai + ak.num
                }
            }
            var Y = parseFloat(ag.summary.amount.money);
            var ac = parseFloat(ag.summary.amount.points);
            if (Y % 1 > 0) {
                Y = Y.toFixed(2)
            }
            if (ac % 1 > 0) {
                ac = ac.toFixed(2)
            }
            var al = "";
            if (Y > 0) {
                al = "¥" + Y
            } else {
                al = "¥0"
            }
            if (ac > 0) {
                var U = "+" + ac + "积分";
                a.find("div.hd_total_pro").addClass("hd_has_point");
                a.find("div.hd_total_pro div.fl u").text(U)
            } else {
                a.find("div.hd_total_pro").removeClass("hd_has_point");
                a.find("div.hd_total_pro div.fl u").text("")
            }
            a.find("div.hd_total_pro a.fr").text("立即结算(" + ai + ")");
            a.find("div.hd_total_pro div.fl em").text(al);
            if (ai > 0) {
                O("#miniCartPaybtn", a).addClass("hd_pay_btn")
            } else {
                O("#miniCartPaybtn", a).removeClass("hd_pay_btn")
            }
            var ae = true;
            if (ag.bags.length == 0) {
                ae = false
            } else {
                for (var ab = 0; ab < ag.bags.length; ab++) {
                    var ah = ag.bags[ab];
                    for (var aa = 0; aa < ah.itemGroups.length; aa++) {
                        var af = ah.itemGroups[aa];
                        for (var Z = 0; Z < af.items.length; Z++) {
                            var ad = af.items[Z];
                            if (!ad.checked) {
                                ae = false;
                                break
                            }
                        }
                    }
                }
            }
            if (ae && ai > 0) {
                O("#miniCartSeltAll", a).addClass("hd_selected")
            } else {
                O("#miniCartSeltAll", a).removeClass("hd_selected")
            }
        }
        ;
    var f = function(U) {
            var T = C(U);
            c.html(T);
            R(U);
            z(U);
            e();
            G.reloadCartCallback(U)
        }
        ;
    var p = function(U) {
            if (!U || !U.summary) {
                f(U);
                return
            }
            var T = v(U);
            c.find("div.hd_cart_list").html(T);
            R(U);
            z(U);
            G.reloadCartCallback(U)
        }
        ;
    var B = function() {
            var U = 0;
            var T = function(V) {
                    if (a.data("cart-item-loaded")) {
                        if (a.find("div.hd_none_tips").size() > 0 || a.find("div.hd_login_tips").size() > 0) {
                            f(V);
                            a.data("cart-item-loaded", 1)
                        } else {
                            p(V)
                        }
                    } else {
                        f(V);
                        a.data("cart-item-loaded", 1)
                    }
                    var W = function() {
                            if (U) {
                                clearTimeout(U);
                                U = 0
                            }
                        }
                        ;
                    W();
                    O("#showMiniCartDetail").show();
                    O("#hdPrismWrap div.hd_prism").removeClass("hd_cur");
                    U = setTimeout(function() {
                        O("#showMiniCartDetail").hide(1000);
                        W()
                    }, 2000);
                    O("#showMiniCartDetail").mouseenter(W)
                }
                ;
            M(T)
        }
        ;
    var P = function() {
            var ab = a.find("div.yhd_province div.yhd_address");
            var T = a.find("div.yhd_province div.yhd_tab_detail");
            var ac = a.find("div.hd_area_mask");
            var aa = a.find("div.yhd_province div.yhd_area_tab span");
            var Y = a.find("div.yhd_province div.yhd_area_box div.yhd_item");
            if (ab.hasClass("select")) {
                return
            }
            var V = O(aa[0]).attr("data-value");
            var W = O(aa[1]).attr("data-value");
            var Z = O(aa[2]).attr("data-value");
            var X = O(aa[1]).attr("data-loaded");
            var U = O(aa[2]).attr("data-loaded");
            if (W != "" && X != 1) {
                i(V)
            }
            if (Z != "" && U != 1) {
                I(W)
            }
            ab.addClass("select");
            T.slideDown();
            ac.show();
            var ad = O("div.hd_cart_scrollwrap", a).outerHeight();
            if (ad > O("div.hd_cart_list", a).height() + O("div.yhd_province", a).outerHeight()) {
                T.css("width", "334px")
            } else {
                T.css("width", "317px")
            }
            O("div.hd_cart_scrollwrap", a).css("position", "static")
        }
        ;
    var t = function() {
            var U = a.find("div.yhd_province div.yhd_address");
            var V = a.find("div.yhd_province div.yhd_tab_detail");
            var T = a.find("div.hd_area_mask");
            U.removeClass("select");
            V.slideUp();
            T.hide();
            O("div.hd_cart_scrollwrap", a).css("position", "relative")
        }
        ;
    var j = function(X, W, T, Y) {
            var V = function() {
                    var Z = /^[1-9]\d{0,2}$/g;
                    if (!Z.test(Y.val())) {
                        w(X, "输入的数量有误,应为[1-999]");
                        Y.val(X.attr("itemNum"));
                        return false
                    }
                    var aa = parseInt(Y.val());
                    if (aa > 1) {
                        W.removeClass("hd_minus_disable").addClass("hd_minus")
                    }
                    if (aa >= 999) {
                        T.removeClass("hd_plus").addClass("hd_plus_disable")
                    }
                    if (aa <= 1) {
                        W.removeClass("hd_minus").addClass("hd_minus_disable")
                    }
                    if (aa < 999) {
                        T.removeClass("hd_plus_disable").addClass("hd_plus")
                    }
                    return true
                }
                ;
            var U = function() {
                    var ab = X.attr("itemType");
                    var Z = Y.val();
                    if (ab == 2) {
                        Z = 0;
                        var aa = a.find("div.hd_cart_list dd[parentCartItemId='" + X.attr("parentCartItemId") + "']");
                        aa.each(function() {
                            var ac = O(this).find("input.hd_minicart_num");
                            Z = Z + parseInt(ac.val())
                        })
                    }
                    h({
                        itemId: X.attr("cartItemId"),
                        pmId: X.attr("pmId"),
                        itemType: X.attr("itemType"),
                        promotionId: X.attr("promotionId"),
                        num: Z
                    })
                }
                ;
            S(O(this), V, U, 500)
        }
        ;
    var J = function(T) {
            var U = function(V) {
                    var W = parseInt(V.code);
                    if (W == 1) {
                        if (O("#validateProductId").length > 0) {
                            O("#validateProductId").attr("value", productId)
                        }
                        if (O.cookie("prompt_flag") == null  && O("#buyPromptDiv").length > 0) {
                            YHD.popwinId("buyPromptDiv");
                            O("#validate").bind("click", function() {
                                window.location.href = URLPrefix.productDetailHost + "/product/" + T.productId + "_" + T.merchantId
                            })
                        } else {
                            window.location.href = URLPrefix.productDetailHost + "/product/" + T.productId + "_" + T.merchantId
                        }
                    } else {
                        if (O("#validateProductId").length > 0) {
                            O("#validateProductId").attr("value", productId)
                        }
                        if (O.cookie("prompt_flag") == null  && O("#buyPromptDiv").length > 0) {
                            YHD.popwinId("buyPromptDiv", "popwinClose");
                            O("#validate").bind("click", function() {
                                l(T, function() {
                                    YHDOBJECT.callBackFunc(T)
                                })
                            })
                        } else {
                            l(T, function() {
                                YHDOBJECT.callBackFunc(T)
                            })
                        }
                    }
                }
                ;
            N(T, U)
        }
        ;
    var L = function() {
            var T, U;
            a.mouseenter(function() {
                if (U) {
                    clearTimeout(U)
                }
                T = setTimeout(function() {
                    c.show();
                    O("#hdPrismWrap div.hd_prism").removeClass("hd_cur");
                    if (!a.data("cart-item-loaded")) {
                        M(f);
                        a.data("cart-item-loaded", 1)
                    } else {
                        e();
                        O("div.hd_cart_list dd div.hd_over_tips", a).hide();
                        O("div.hd_bottom_tips", a).hide()
                    }
                }, 200)
            });
            a.mouseleave(function() {
                if (T) {
                    clearTimeout(T)
                }
                U = setTimeout(function() {
                    c.hide()
                }, 200)
            });
            a.delegate("div.hd_cart_scrollwrap", "mousewheel", function(X, V) {
                var Y = O(this).scrollTop();
                var W = O(this).outerHeight();
                var Z = O("#miniCart .yhd_province").outerHeight() + O("#miniCart .hd_cart_list").outerHeight() + O("#miniCart .hd_feedback").outerHeight();
                if (W > Z) {
                    X.preventDefault()
                }
                if (Y == 0 && (V > 0)) {
                    X.preventDefault()
                } else {
                    if (Y == Z - W && (V < 0)) {
                        X.preventDefault()
                    }
                }
            });
            a.delegate("div.hd_total_pro", "mousewheel", function(V, W) {
                V.preventDefault()
            });
            a.delegate("div.hd_area_mask,div.yhd_tab_detail", "mousewheel", function(V, W) {
                V.preventDefault()
            });
            a.delegate("div.yhd_province dd", "mouseenter", function() {
                O(this).addClass("hd_cart_cur")
            });
            a.delegate("div.yhd_province dd", "mouseleave", function() {
                O(this).removeClass("hd_cart_cur")
            });
            a.delegate("p.hd_gift", "mouseenter", function() {
                O(this).addClass("hd_gift_cur")
            });
            a.delegate("p.hd_gift", "mouseleave", function() {
                O(this).removeClass("hd_gift_cur")
            });
            a.delegate("div.hd_cart_list dd.hd_min_sum .fl", "mouseenter", function() {
                O(this).addClass("hd_sale_cur");
                var W = O(this).position().top + 60
                    , V = O("div.hd_cart_scrollwrap", a).scrollTop()
                    , Y = O("div.hd_cart_scrollwrap", a).outerHeight(true)
                    , Z = O(this).find(".hd_sale_show").outerHeight(true)
                    , X = Y - (W - V);
                if (X < Z) {
                    O(this).find(".hd_sale_show").addClass("hd_sale_showup")
                } else {
                    O(this).find(".hd_sale_show").attr("class", "hd_sale_show")
                }
            });
            a.delegate("div.hd_cart_list dd.hd_min_sum .fl", "mouseleave", function() {
                O(this).removeClass("hd_sale_cur")
            });
            a.delegate("div.hd_cart_list a.hd_cart_del", "click", function() {
                S(O(this), null , function() {
                    var V = O(this).attr("cartItemId");
                    q({
                        itemIds: [V]
                    })
                }, 500);
                return false
            });
            a.delegate("div.hd_cart_list a.hd_gift_del", "click", function() {
                S(O(this), null , function() {
                    var V = O(this).attr("cartItemId");
                    q({
                        itemIds: [V]
                    })
                }, 500);
                return false
            });
            a.delegate("div.hd_cart_list a.hd_plus", "click", function() {
                var W = O(this).parents("dd");
                var V = W.find("div.hd_num_box a:eq(0)");
                var Y = W.find("div.hd_num_box a:eq(1)");
                var X = W.find("div.hd_num_box input");
                var Z = parseInt(X.val());
                if (Z >= 999) {
                    Z = 999
                } else {
                    Z = Z + 1
                }
                X.val(Z);
                j(W, V, Y, X);
                return false
            });
            a.delegate("div.hd_cart_list a.hd_minus", "click", function() {
                var W = O(this).parents("dd");
                var V = W.find("div.hd_num_box a:eq(0)");
                var Y = W.find("div.hd_num_box a:eq(1)");
                var X = W.find("div.hd_num_box input");
                var Z = parseInt(X.val());
                if (Z <= 1) {
                    Z = 1
                } else {
                    Z = Z - 1
                }
                X.val(Z);
                j(W, V, Y, X);
                return false
            });
            a.delegate("div.hd_cart_list input.hd_minicart_num", "blur", function() {
                var X = O(this).parents("dd");
                var W = X.find("div.hd_num_box a:eq(0)");
                var V = X.find("div.hd_num_box a:eq(1)");
                var Y = X.find("div.hd_num_box input");
                j(X, W, V, Y);
                return false
            });
            a.delegate("div.hd_cart_list input.hd_minicart_num", "keyup", function(V) {
                var Z = O(this).parents("dd");
                var X = Z.find("div.hd_num_box a:eq(0)");
                var W = Z.find("div.hd_num_box a:eq(1)");
                var aa = Z.find("div.hd_num_box input");
                var Y = V.keyCode;
                if (Y == "13") {
                    aa.blur()
                }
                return false
            });
            a.delegate("div.hd_cart_list dd a.hd_select_box", "click", function() {
                var X = O(this).parents("dd");
                var Y = O(this);
                if (X.attr("disable") == "true") {
                    return false
                }
                var W = function() {
                        var Z = Y.hasClass("hd_selected") ? 1 : 0;
                        if (Z) {
                            Y.removeClass("hd_selected")
                        } else {
                            Y.addClass("hd_selected")
                        }
                        if (X.attr("itemType") == 2) {
                            var aa = a.find("div.hd_cart_list dd[parentCartItemId='" + X.attr("parentCartItemId") + "']");
                            aa.each(function() {
                                var ab = O(this).find("a.hd_select_box");
                                if (O(this).attr("cartItemId") != X.attr("cartItemId")) {
                                    if (Z) {
                                        ab.removeClass("hd_selected")
                                    } else {
                                        ab.addClass("hd_selected")
                                    }
                                }
                            })
                        }
                    }
                    ;
                var V = function() {
                        var Z = a.find("div.hd_cart_list dd a.hd_select_box");
                        var aa = [];
                        Z.each(function() {
                            var ab = O(this);
                            var ad = ab.parents("dd").attr("parentCartItemId");
                            var ac = ab.hasClass("hd_selected") ? 1 : 0;
                            aa.push({
                                itemId: ad,
                                checked: ac
                            })
                        });
                        b(aa)
                    }
                    ;
                S(O(this), W, V, 500);
                return false
            });
            a.delegate("div.hd_cart_list dt a.hd_select_box", "click", function() {
                var Y = O(this);
                var X = O(this).parents("dl").find("dd");
                var W = function() {
                        var Z = Y.hasClass("hd_selected") ? 1 : 0;
                        if (Z) {
                            Y.removeClass("hd_selected")
                        } else {
                            Y.addClass("hd_selected")
                        }
                        X.each(function(aa, ab) {
                            if (O(ab).attr("disable") != "true") {
                                if (Z) {
                                    O(ab).find("a.hd_select_box").removeClass("hd_selected")
                                } else {
                                    O(ab).find("a.hd_select_box").addClass("hd_selected")
                                }
                            }
                        })
                    }
                    ;
                var V = function() {
                        var Z = a.find("div.hd_cart_list dd a.hd_select_box");
                        var aa = [];
                        Z.each(function() {
                            var ab = O(this);
                            var ad = ab.parents("dd").attr("parentCartItemId");
                            var ac = ab.hasClass("hd_selected") ? 1 : 0;
                            aa.push({
                                itemId: ad,
                                checked: ac
                            })
                        });
                        b(aa)
                    }
                    ;
                S(O(this), W, V, 500);
                return false
            });
            a.delegate("div.hd_total_pro #miniCartSeltAll", "click", function() {
                var Y = O(this);
                var X = a.find("div.hd_cart_list dd[productId]");
                var W = function() {
                        var Z = Y.hasClass("hd_selected") ? 1 : 0;
                        if (Z) {
                            Y.removeClass("hd_selected")
                        } else {
                            Y.addClass("hd_selected")
                        }
                        X.each(function(aa, ab) {
                            if (O(ab).attr("disable") != "true") {
                                if (Z) {
                                    O(ab).find("a.hd_select_box").removeClass("hd_selected")
                                } else {
                                    O(ab).find("a.hd_select_box").addClass("hd_selected")
                                }
                            }
                        });
                        a.find("div.hd_cart_list dt a.hd_select_box").each(function() {
                            if (Z) {
                                O(this).removeClass("hd_selected")
                            } else {
                                O(this).addClass("hd_selected")
                            }
                        })
                    }
                    ;
                var V = function() {
                        var Z = a.find("div.hd_cart_list dd a.hd_select_box");
                        var aa = [];
                        Z.each(function() {
                            var ab = O(this);
                            var ad = ab.parents("dd").attr("parentCartItemId");
                            var ac = ab.hasClass("hd_selected") ? 1 : 0;
                            aa.push({
                                itemId: ad,
                                checked: ac
                            })
                        });
                        b(aa)
                    }
                    ;
                S(O(this), W, V, 500);
                return false
            });
            c.delegate(".hd_bottom_tips u", "click", function() {
                O(this).parents(".hd_bottom_tips").hide()
            });
            a.delegate("div.hd_total_pro #miniCartPaybtn", "click", function() {
                A();
                return false
            });
            a.delegate("div.yhd_province div.yhd_address", "click", function() {
                P();
                return false
            });
            a.delegate("div.yhd_province span.yhd_close_btn", "click", function() {
                t();
                return false
            });
            a.delegate("div.yhd_province div.yhd_area_tab span", "click", function() {
                var V = a.find("div.yhd_province div.yhd_area_tab span");
                var W = a.find("div.yhd_province div.yhd_area_box div.yhd_item");
                var X = O(this).index();
                V.eq(X).addClass("yhd_on").siblings().removeClass("yhd_on");
                W.hide().eq(X).show();
                return false
            });
            a.delegate("div.yhd_province div.hd_first_area dd a", "click", function() {
                var V = O(this).attr("data-value");
                var W = O(this).text();
                var X = function() {
                        var Z = a.find("div.yhd_province div.yhd_area_tab span");
                        var Y = a.find("div.yhd_province div.yhd_area_box div.yhd_item");
                        O(Z[0]).attr("data-value", V);
                        O(Z[0]).find("em").text(W);
                        Z.eq(1).addClass("yhd_on").siblings().removeClass("yhd_on");
                        Y.hide().eq(1).show();
                        O(Z[1]).attr("data-value", "");
                        O(Z[1]).find("em").text("请选择市");
                        O(Z[2]).attr("data-value", "");
                        O(Z[2]).find("em").text("请选择区");
                        O(Y[2]).html("")
                    }
                    ;
                i(V, X);
                return false
            });
            a.delegate("div.yhd_province div.yhd_second_area dd a", "click", function() {
                var V = O(this).attr("data-value");
                var W = O(this).text();
                var X = function() {
                        var Z = a.find("div.yhd_province div.yhd_area_tab span");
                        var Y = a.find("div.yhd_province div.yhd_area_box div.yhd_item");
                        O(Z[1]).attr("data-value", V);
                        O(Z[1]).find("em").text(W);
                        Z.eq(2).addClass("yhd_on").siblings().removeClass("yhd_on");
                        Y.hide().eq(2).show()
                    }
                    ;
                I(V, X);
                return false
            });
            a.delegate("div.yhd_province div.yhd_third_area dd a", "click", function() {
                var V = a.find("div.yhd_province div.yhd_area_tab span");
                var W = O(this).attr("data-value");
                var X = O(this).text();
                O(V[2]).attr("data-value", W).find("em").text(X);
                var Z = [O(V[0]).attr("data-value"), O(V[1]).attr("data-value"), O(V[2]).attr("data-value")];
                var aa = [O(V[0]).find("em").text(), O(V[1]).find("em").text(), O(V[2]).find("em").text()];
                var Y = a.find("div.yhd_province div.yhd_address span");
                Y.attr("data-value", Z.join("_"));
                Y.text(aa.join("|"));
                s([Z, aa]);
                t()
            });
            a.delegate("#miniCartLogin", "click", function() {
                if (yhdPublicLogin) {
                    yhdPublicLogin.showLoginDiv()
                }
            })
        }
        ;
    G.initCart = function() {
        if (a.data("cart-num-loaded")) {
            return
        }
        a.data("cart-num-loaded", 1);
        E();
        L()
    }
    ;
    G.resetCart = function() {
        c.hide();
        a.data("cart-item-loaded", 0);
        E()
    }
    ;
    G.reloadCart = function() {
        if (a.data("cart-item-loaded")) {
            M(f)
        }
    }
    ;
    G.reloadCartItems = function() {
        if (a.data("cart-item-loaded")) {
            M(p)
        }
    }
    ;
    G.reloadCartFloat = function() {
        B()
    }
    ;
    G.addItem = function(T) {
        J(T)
    }
    ;
    G.removeItem = function(T, U, V) {
        q(T, U, V)
    }
    ;
    G.updateItem = function(T, U, V) {
        h(T, U, V)
    }
    ;
    G.chooseItem = function(T, U, V) {
        b(T, U, V)
    }
    ;
    G.changeAddress = function(U) {
        if (!U || U.length != 2) {
            return
        }
        var X = U[0];
        var W = U[1];
        var T = a.find("div.yhd_province div.yhd_address span");
        T.attr("data-value", X.join("_"));
        T.text(W.join("|"));
        var V = a.find("div.yhd_province div.yhd_area_tab span");
        O(V[0]).attr("data-loaded", 0).attr("data-value", X[0]).find("em").text(W[0]);
        O(V[1]).attr("data-loaded", 0).attr("data-value", X[1]).find("em").text(W[1]);
        O(V[2]).attr("data-loaded", 0).attr("data-value", X[2]).find("em").text(W[2]);
        s([X, W])
    }
    ;
    G.initCart()
})(jQuery);
function addToCart(e, d, g, b, a, f) {
    var c = {};
    c.amount = b;
    c.isFloat = a;
    c.linkPosition = f;
    c.merchantId = g;
    addToCartNew(e, d, c)
}
function addToCartNew(a, c, b) {
    b.productId = c;
    loli.app.minicart.addItem(b)
}
function initAllMiniCart() {}
function loadMiniCart() {
    loli.app.minicart.reloadCart()
}
function reloadMiniCart() {
    loli.app.minicart.reloadCart()
}
(function(r) {
    var x = (typeof isSearchKeyWords != "undefined" && isSearchKeyWords == "1") ? 1 : 0;
    var q = (typeof isIndex != "undefined" && isIndex == 1) ? 1 : 0;
    var y = (typeof globalSearchSelectFlag != "undefined" && globalSearchSelectFlag == "0") ? 0 : 1;
    var v = (typeof globalSearchHotkeywordsFlag != "undefined" && globalSearchHotkeywordsFlag == "0") ? 0 : 1;
    var A = r("#keyword");
    var s = r("#searchSuggest");
    var t = r("#fix_keyword");
    var p = r("#fix_searchSuggest");
    var u = r("#leaf");
    var B = r("#hdSearchTab");
    var C = window.loli || (window.loli = {});
    var z = C.app = C.app || {};
    var w = C.app.search = C.app.search || {};
    var D = URLPrefix.search_keyword || "http://search.yhd.com";
    w.delayCall = function(c, e, f, d) {
        r(c).data("lastTime", new Date().getTime());
        if (e) {
            var b = e.call(r(c));
            r(c).data("lastResult", b)
        }
        var a = setTimeout(function() {
            var g = r(c).data("lastTime") ? r(c).data("lastTime") : new Date().getTime();
            var h = (typeof r(c).data("lastResult") == "undefined" || r(c).data("lastResult")) ? true : false;
            var i = new Date().getTime();
            if (i - g >= (d - 50)) {
                if (f && h) {
                    f.call(r(c))
                }
            }
        }, d)
    }
    ;
    w.filterXml = function(a) {
        if (a != null  && a != "") {
            a = a.replace(/\&/g, "");
            a = a.replace(/\</g, "");
            a = a.replace(/\>/g, "");
            a = a.replace(/\\/g, "");
            a = a.replace(/\'/g, "");
            a = a.replace(/\"/g, "")
        }
        return a
    }
    ;
    w.showHistory = function(a, e) {
        if (!y) {
            return
        }
        var c = u.size() > 0 ? u.val() : "0";
        var f = a.val();
        var g = a.attr("original");
        var d = C.yhdStore;
        var b = function() {
                var h = D + "/get_new_keywords.do?keyword=&leaf=" + c + "&flag=v1&hotSearchFlag=new&localStorageFlag=new&callback=?";
                r.getJSON(h, function(j) {
                    if (j.ERROR) {
                        return
                    } else {
                        e.html(j.value);
                        var k;
                        if (d) {
                            d.getFromRoot("search_keyword_history", function(n) {
                                if (n && n.status == 1) {
                                    var H = n.value;
                                    if (H) {
                                        k = H.split(",")
                                    }
                                    var J = "";
                                    if (typeof (k) != "undefined" && k.length > 0) {
                                        J += '<dt><a id="hd_clear_history_record" href="javascript:void(0);" onclick="clearRecord(this);gotracker(\'2\',\'clear_record\',0);">清除</a>历史记录</dt>';
                                        for (var I = k.length - 1; I >= 0; I--) {
                                            var o = w.filterXml(decodeURIComponent(decodeURIComponent(k[I])));
                                            if (o != null  && o.length > 0) {
                                                J += "<dd>";
                                                J += '<a roll="true" href="javascript:void(0);" onclick="searchMe(\'' + o + "');addTrackPositionToCookie('1','search_history');\">" + o + "</a></dd>"
                                            }
                                        }
                                    } else {
                                        J = "<dt>历史记录</dt>"
                                    }
                                } else {
                                    J = "<dt>历史记录</dt>"
                                }
                                e.find(".hd_s_history").html(J)
                            })
                        } else {
                            var i = "<dt>历史记录</dt>";
                            e.find(".hd_s_history").html(i)
                        }
                        e.addClass("hd_search_history");
                        if (typeof (k) == "undefined" || k.length == 0) {
                            r("#hd_clear_history_record", e).hide()
                        }
                        e.show();
                        try {
                            var m = [];
                            e.find("a").each(function() {
                                m.push(r(this)[0])
                            });
                            require(["content_tracker_expo"], function(n) {
                                n.run("search_smartbox_event", "search_smartbox", m)
                            })
                        } catch (l) {}
                    }
                })
            }
            ;
        if (f == "" || r.trim(f) == "" || r.trim(f) == "请输入关键词" || (r.trim(f) == g && !x)) {
            b()
        }
    }
    ;
    w.showSuggest = function(g, d) {
        if (!y) {
            return
        }
        var b = u.size() > 0 ? u.val() : "0";
        var e = g.val();
        var f = g.attr("original");
        var a = function() {
                var h = D + "/get_new_keywords.do?keyword=" + encodeURIComponent(encodeURIComponent(e)) + "&leaf=" + b + "&flag=v1&hotSearchFlag=new&newSmartBoxFlag=new&callback=?";
                r.getJSON(h, function(k) {
                    if (k.ERROR) {
                        return
                    } else {
                        d.html(k.value);
                        d.removeClass("hd_search_history");
                        var j = d.find("ul>li");
                        var i = false;
                        j.each(function() {
                            if (r(this).hasClass("haslist")) {
                                i = true
                            }
                        });
                        if (i) {
                            d.children("ul").css("height", "336px")
                        }
                        c(g, d);
                        d.show();
                        try {
                            var m = [];
                            d.find("a").each(function() {
                                m.push(r(this)[0])
                            });
                            require(["content_tracker_expo"], function(n) {
                                n.run("search_smartbox_event", "search_smartbox", m)
                            })
                        } catch (l) {}
                    }
                })
            }
            ;
        var c = function(i, h) {
                var j = h.find("ul>li");
                h.data("suggestLength", j.length);
                h.data("curSuggestIndex", -1);
                j.mouseenter(function() {
                    var k = j.index(this);
                    if (r(this).hasClass("haslist")) {
                        r(this).addClass("select_haslist").siblings().removeClass("select_haslist select")
                    } else {
                        r(this).addClass("select").siblings().removeClass("select_haslist select")
                    }
                    h.data("curSuggestIndex", k)
                });
                j.mouseleave(function() {
                    r(this).removeClass("select select_haslist")
                });
                h.delegate("#choose_list dd", "mouseover", function() {
                    r(this).find("#s_cart_btn").show();
                    return false
                });
                h.delegate("#choose_list dd", "mouseout", function() {
                    r(this).find("#s_cart_btn").hide();
                    return false
                });
                r("a[id=s_cart_btn]").hide()
            }
            ;
        if ((e != "" && r.trim(e) != "" && r.trim(e) != "请输入关键词" && r.trim(e) != f) || (r.trim(e) == f && x)) {
            a()
        }
    }
    ;
    w.registerGlobalEvent = function() {
        r("#site_header").find(".hd_search_wrap").bind("mouseleave", function() {
            s.hide()
        });
        r(document).bind("click", function(e) {
            var f = e.target;
            if (f.id == "hd_clear_history_record" || f.className == "keywordInput" || f.className == "fl") {
                return
            }
            s.hide();
            p.hide()
        });
        var d = function(m, h, j) {
                m = m || window.event;
                var f = m.keyCode;
                var e = j.find("ul>li");
                var k = e.length;
                var l = (j.data("curSuggestIndex") != null ) ? j.data("curSuggestIndex") : -1;
                j.data("suggestLength", k);
                if (k > 0) {
                    if (f == "38") {
                        if (l <= 0) {
                            l = k - 1
                        } else {
                            l = l - 1
                        }
                        j.data("curSuggestIndex", l)
                    } else {
                        if (f == "40") {
                            if (l >= (k - 1)) {
                                l = 0
                            } else {
                                l = l + 1
                            }
                            j.data("curSuggestIndex", l)
                        }
                    }
                    if (f == "38" || f == "40") {
                        var i = e.eq(l);
                        if (i.hasClass("haslist")) {
                            i.addClass("select_haslist").siblings().removeClass("select_haslist select")
                        } else {
                            i.addClass("select").siblings().removeClass("select_haslist select")
                        }
                        if (i.attr("id")) {
                            h.val(e.eq(0).children("a").text());
                            if (i.attr("id") == "recom1") {
                                r("#recommendId", j).val(r("#recom1Id", j).val());
                                r("#recommendName", j).val(r("#recom1Name", j).val())
                            }
                            if (i.attr("id") == "recom2") {
                                r("#recommendId", j).val(r("#recom2Id", j).val());
                                r("#recommendName", j).val(r("#recom2Name", j).val())
                            }
                        } else {
                            h.val(i.children("a").text());
                            r("#recommendId", j).val("");
                            r("#recommendName", j).val("")
                        }
                        if (q) {
                            h.siblings("label").hide()
                        }
                    }
                    if (f == "13") {
                        var g = r("#hdSearchTab");
                        if (g.size() > 0 && g.attr("data-type") == "2") {
                            searchMe(h.val(), "0", "0", 1);
                            return
                        }
                        var i = e.eq(l);
                        if (i.attr("id")) {
                            searchMe(h.val(), r("#recommendId", j).val(), r("#recommendName", j).val())
                        } else {
                            searchMe(h.val(), "0", "0")
                        }
                    }
                } else {
                    if (f == "13") {
                        var g = r("#hdSearchTab");
                        if (g.size() > 0 && g.attr("data-type") == "2") {
                            searchMe(h.val(), "0", "0", 1);
                            return
                        }
                        searchMe(h.val(), "0", "0")
                    }
                }
            }
            ;
        var a = function(j, g, h) {
                j = j || window.event;
                var i = j.keyCode;
                if (i == "116" || i == "16" || i == "17" || i == "18" || i == "38" || i == "40" || i == "13") {
                    return
                }
                var e = g.val();
                var f = g.attr("original");
                if (e == "" || r.trim(e) == "" || r.trim(e) == "请输入关键词" || (r.trim(e) == f && !x)) {
                    w.delayCall(g, null , function() {
                        w.showHistory(g, h)
                    }, 200)
                } else {
                    w.delayCall(g, null , function() {
                        w.showSuggest(g, h)
                    }, 200)
                }
            }
            ;
        var b = function(l, f, j) {
                l = l || window.event;
                if (l) {
                    var k = document.createElement("input").webkitSpeech === undefined;
                    if (!k) {
                        var m = l.pageX;
                        var i = f.outerWidth();
                        var g = f.offset().left;
                        var e = g + i - 25;
                        var h = g + i;
                        if (m >= e && m <= h) {
                            return
                        }
                    }
                }
                a(l, f, j)
            }
            ;
        A.keydown(function(e) {
            d(e, A, s)
        });
        A.keyup(function(e) {
            a(e, A, s)
        });
        A.click(function(e) {
            b(e, A, s)
        });
        if (typeof isIndex != "undefined" && isIndex == 1) {
            t.keydown(function(f) {
                f = f || window.event;
                var e = f.keyCode;
                if (e == "13") {
                    searchMe(t.val(), "0", "0")
                }
            })
        } else {
            t.keydown(function(e) {
                d(e, t, p)
            });
            t.keyup(function(e) {
                a(e, t, p)
            });
            t.click(function(e) {
                b(e, t, p)
            })
        }
        B.mouseenter(function() {
            r(this).addClass("hd_serach_tab_hover")
        });
        B.mouseleave(function() {
            r(this).removeClass("hd_serach_tab_hover")
        });
        B.delegate("a", "click", function() {
            var e = r(this).index();
            if (e !== 0) {
                r(this).prependTo(B);
                B.attr("data-type", r(this).attr("data-type"));
                B.removeClass("hd_serach_tab_hover");
                if (B.attr("data-type") == "2") {
                    B.next().attr("data-tpa", "YHD_GLOBAl_HEADER_SEARCHSHOP").removeAttr("data-tc")
                } else {
                    B.next().attr("data-tpa", "YHD_GLOBAl_HEADER_SEARCH").removeAttr("data-tc")
                }
            }
        });
        var c = function(g, f) {
                var e = C.yhdStore;
                e.setFromRoot("search_keyword_history", "");
                g.hide();
                r(".hd_s_history dd", f).remove()
            }
            ;
        s.delegate("#hd_clear_history_record", "click", function() {
            var e = r(this);
            c(e, s)
        });
        p.delegate("#hd_clear_history_record", "click", function() {
            var e = r(this);
            c(e, p)
        })
    }
    ;
    w.loadHotKeywords = function() {
        var c = A.val();
        var b = A.attr("original");
        if (r("#hotKeywordsShow").size() == 0) {
            return
        }
        if (!v) {
            return
        }
        var d = function(j) {
                var h = 1;
                var f = 1;
                var i = URLPrefix.search_keyword + "/recommend/headHotKeywordRecommendSuper.do?threshold=10&mcSiteId=" + h + "&siteType=" + f;
                if ((typeof (c) != "undefined" && c != "" && r.trim(c) != b) || (r.trim(c) == b && x)) {
                    i += "&keyword=" + encodeURIComponent(encodeURIComponent(c))
                }
                var g = jQuery("#curCategoryIdToGlobal").val();
                if (typeof (g) != "undefined") {
                    i += "&categoryId=" + g
                }
                if (j) {
                    i += "&historyKeywords=" + j
                }
                var k = r("#hotKeywordsShow");
                if (k.data("isLoaded") == "1") {
                    return
                }
                k.data("isLoaded", "1");
                var l = function(G) {
                        if (q == 1) {
                            var o = k.attr("data-specialHotword");
                            var n = (typeof globalSpecialHotwordFlag != "undefined" && globalSpecialHotwordFlag == "0") ? 0 : 1;
                            if (n && o) {
                                var H = r.parseJSON(o);
                                if (H && H.text && H.linkUrl) {
                                    var m = "<a title='" + H.text + "' href='" + H.linkUrl + "' target='_blank' data-tc='" + (H.tc || "") + "' data-tce='" + (H.tce || "") + "'  data-ref='" + H.perTracker + "'>" + H.text + "</a>";
                                    G = m + G
                                }
                            }
                        }
                        return G
                    }
                    ;
                try {
                    jQuery.ajax({
                        url: i,
                        dataType: "jsonp",
                        jsonp: "callback",
                        jsonpCallback: "keywordRecommendCallback",
                        cache: true,
                        timeout: 3000,
                        success: function(Z) {
                            if (Z && Z.headhotkeywords && Z.headhotkeywords.length > 0) {
                                var o = Z.headhotkeywords;
                                var m = [];
                                for (var X = 0; X < o.length;
                                     X++) {
                                    var Q = o[X];
                                    var T = Q.relateword;
                                    var n = Q.sceneTag;
                                    var V = Q.remark;
                                    var W = Q.identifier;
                                    var U = null ;
                                    var Y = null ;
                                    var R = "";
                                    var S = "";
                                    if (V && n && n == "1" && !isNaN(V)) {
                                        U = "http://list.yhd.com/themeBuy.do?themeId=" + V;
                                        Y = "SEARCH.0.33.shkw_" + encodeURIComponent(T) + "." + (X + 1);
                                        R = 'class="hot_link_red"'
                                    } else {
                                        if (W) {
                                            U = "http://list.yhd.com/k_" + W
                                        } else {
                                            U = URLPrefix.search_keyword + "/c0-0/k" + encodeURIComponent(T) + "/" + jQuery.cookie("provinceId") + "/"
                                        }
                                        Y = "SEARCH.0.KEYWORD.shkw_" + encodeURIComponent(T) + "." + (X + 1)
                                    }
                                    S = "<a " + R + '  title="' + T + '" target="_blank" href="' + U + '" data-ref="shkw_' + encodeURIComponent(T) + '" data-tc="' + Y + '">' + T + "</a>";
                                    m.push(S)
                                }
                                var P = l(m.join(" "));
                                k.append(P);
                                k.data("searchKeyLoaded", "1")
                            }
                        }
                    })
                } catch (e) {}
            }
            ;
        var a = C.yhdStore;
        if (a) {
            a.getFromRoot("search_keyword_history", function(e) {
                if (e && e.status == 1) {
                    d(e.value)
                } else {
                    d("")
                }
            })
        } else {
            d("")
        }
    }
    ;
    w.changeTab = function(c) {
        if (typeof c == "undefined" || isNaN(c) || a == c || (c != "1" && c != "2")) {
            return
        }
        var a = B.attr("data-type");
        var b = B.find("a[data-type='" + c + "']");
        b.prependTo(B);
        B.attr("data-type", b.attr("data-type"));
        B.removeClass("hd_serach_tab_hover");
        if (B.attr("data-type") == "2") {
            B.next().attr("data-tpa", "YHD_GLOBAl_HEADER_SEARCHSHOP").removeAttr("data-tc")
        } else {
            B.next().attr("data-tpa", "YHD_GLOBAl_HEADER_SEARCH").removeAttr("data-tc")
        }
    }
    ;
    r(document).ready(function() {
        w.registerGlobalEvent();
        w.loadHotKeywords()
    })
})(jQuery);
function findNames() {}
function _goSearch() {}
function goSearch() {}
function findNamesByDiv() {}
function _goSearchByDiv() {}
function goSearchByDiv() {}
function loadComplete_findNames() {}
function searchListHover() {}
function clearRecord() {}
function roll() {}
function hotKeywords_onDocumentReady() {}
function reloadKeyWordsData() {}
function addKeywordHistory() {}
function selectSearchCategory() {}
function readAdv_hotKeywords_onDocumentReady() {}
function indexReadAdv_hotKeywords_onDocumentReady() {}
function getHotkeywordHtml() {}
function searchKeywords_onDocumentReady() {}
function searchFocus() {}
function searchRecommend(b) {
    if (b != null  && b != "") {
        window.location = b
    }
}
function cutString(d, c) {
    if (d == null  || d.length <= c) {
        return d
    }
    return d.substring(0, c)
}
function emptySearchBar(g) {
    if (!g) {
        g = "#keyword"
    }
    var f = jQuery(g);
    var j = f.parent("div").find("label");
    var i = f.attr("original");
    var h = f.val();
    if (f.val() != "" && j.size() > 0) {
        j.hide();
        f.trigger("click");
        return
    }
    if (h.indexOf(i) == 0) {
        f.val(h.substring(i.length));
        f.css("color", "#333333")
    }
    if (f.val() != "") {
        f.trigger("click")
    }
}
function searchMe(C, r, s, v) {
    var y = null ;
    var w = document.getElementById("recommendId");
    if (w) {
        y = w.value
    }
    var q = null ;
    var x = document.getElementById("recommendName");
    if (x) {
        q = x.value
    }
    var z = jQuery("#keyword");
    if (!C) {
        C = z.val()
    } else {
        if (C instanceof jQuery) {
            z = C;
            C = z.val()
        }
    }
    if (C != null  && C != "") {
        var u = z.attr("original");
        if (u != null  && u != "" && u != "请输入关键词") {
            if (u == C) {
                var A = z.attr("url");
                if (A != null  && A != "") {
                    loli.spm.refreshPage(A, z);
                    return
                }
            }
        }
    } else {
        if ((isIndex == 1 && (typeof (indexFlag) != "undefined" && typeof (indexFlag) == "number" && indexFlag == 1)) ) {
            var D = z.parent("div").find("label");
            if (D.size() > 0 && (D.css("display") == "block" || D.css("display") == "inline")) {
                var A = z.attr("url");
                if (A != null  && A != "") {
                    loli.spm.refreshPage(A, z);
                    return
                }
            }
        }
    }
    if (!C || C == "请输入关键词") {
        return
    }
    C = C.replace(/\//gi, " ");
    var B = "0";
    if (jQuery("#leaf").size() > 0) {
        B = jQuery("#leaf").val()
    }
    if (v) {
        var t = URLPrefix.search_keyword + "/c0-0-0/b/a-s1-v2-p1-price-d0-f0b-m1-rt0-pid-mid0-k" + encodeURIComponent(encodeURIComponent(C)) + "/";
        loli.spm.refreshPage(t, z);
        return
    }
    var p = jQuery.cookie("provinceId");
    if (r != null  && r != "0") {
        var t = URLPrefix.search_keyword + "/c" + r + "-" + s + "/k" + encodeURIComponent(encodeURIComponent(C)) + "/" + p + "/";
        loli.spm.refreshPage(t, z)
    } else {
        if (y != null  && y != "") {
            var t = URLPrefix.search_keyword + "/c" + y + "-" + q + "/k" + encodeURIComponent(encodeURIComponent(C)) + "/" + p + "/";
            loli.spm.refreshPage(t, z)
        } else {
            var t = URLPrefix.search_keyword + "/c" + B + "-0/k" + encodeURIComponent(encodeURIComponent(C)) + "/" + p + "/";
            loli.spm.refreshPage(t, z)
        }
    }
}
function searchMeForBrand() {
    var d = jQuery("#keyword");
    var c = d.val();
    if (c == "" || c == "商品、品牌") {
        return
    }
    searchMe()
}
function searchMeForClick() {
    var b = $("#hdSearchTab");
    if (b.size() > 0 && b.attr("data-type") == "2") {
        searchMe(null , null , null , 1);
        return
    }
    searchMe()
}
function searchInputFocus(g) {
    var h = jQuery("#keyword");
    if (g) {
        h = jQuery(g)
    }
    if (h.size() == 0) {
        return
    }
    var i = h.attr("original");
    var j = h.val();
    var f = (typeof isSearchKeyWords != "undefined" && isSearchKeyWords == "1") ? 1 : 0;
    if (j == null  || j == "") {
        if (i == null  || i == "") {
            i = "请输入关键词";
            h.attr("original", i)
        }
        h.val(i);
        j = i
    }
    if (!f) {
        h.css("color", "#999999");
        h.bind("focus", function() {
            if (this.value == i) {
                this.value = "";
                this.style.color = "#333333"
            }
        }).bind("blur", function() {
            if (this.value == "") {
                this.value = i;
                this.style.color = "#999999"
            }
        })
    } else {
        h.css("color", "#333333");
        h.bind("blur", function() {
            if (this.value == "") {
                this.value = i
            }
        })
    }
}
function indexSearchInputFocus() {
    var e = jQuery("#keyword").attr("original");
    var d = jQuery("#keyword").val();
    var f = jQuery("#keyword").parent("div").find("label");
    if (f.size() == 0) {
        return
    }
    if (d == e || d == "") {
        f.css({
            display: "block"
        });
        jQuery("#keyword").css("color", "#333333")
    }
    jQuery("#keyword").bind("focus", function() {
        f.css({
            color: "#CCCCCC"
        });
        if (this.value == e) {
            this.style.color = "#CCCCCC"
        } else {
            this.style.color = "#333333"
        }
    }).bind("blur", function() {
        if (this.value == "" || this.value == e || this.value == "请输入关键词") {
            f.css({
                color: "#666666",
                display: "block"
            });
            jQuery("#keyword").val("")
        }
    }).bind("keydown", function() {
        if (this.value == "" || this.value == e) {
            f.hide()
        }
    })
}
jQuery(document).ready(function() {
    if (typeof isIndex != "undefined" && isIndex == 1) {
        indexSearchInputFocus();
        if (typeof isFixTopNav != "undefined" && isFixTopNav == true) {
            searchInputFocus("#fix_keyword")
        }
    } else {
        searchInputFocus();
        if (typeof isFixTopNav != "undefined" && isFixTopNav == true) {
            searchInputFocus("#fix_keyword");
            if (typeof headerType != "undefined" && headerType == "search") {
                $("#fix_keyword").bind("focus", function() {
                    $(this).removeClass("hd_ipt_corner").addClass("focus_ipt")
                });
                $("#fix_keyword").bind("blur", function() {
                    $(this).addClass("hd_ipt_corner").removeClass("focus_ipt")
                })
            }
        }
    }
});
var Class = {
    create: function() {
        return function() {
            this.initialize.apply(this, arguments)
        }
    }
};
var Extend = function(c, b) {
        for (var a in b) {
            c[a] = b[a]
        }
    }
    ;
function stopDefault(a) {
    if (a && a.preventDefault) {
        a.preventDefault()
    } else {
        window.event.returnValue = false
    }
    return false
}
var Stars = Class.create();
Stars.prototype = {
    initialize: function(d, m) {
        this.SetOptions(m);
        var g = 999;
        var o = (document.all) ? true : false;
        var h = document.getElementById(d).getElementsByTagName("a");
        var j = document.getElementById(this.options.Input) || document.getElementById(d + "-input");
        var e = document.getElementById(this.options.Tips) || document.getElementById(d + "-tips");
        var n = " " + this.options.nowClass;
        var l = this.options.tipsTxt;
        var b = h.length;
        for (a = 0; a < b; a++) {
            h[a].value = a;
            h[a].onclick = function(c) {
                stopDefault(c);
                this.className = this.className + n;
                g = this.value;
                j.value = this.getAttribute("star:value");
                e.innerHTML = l[this.value]
            }
            ;
            h[a].onmouseover = function() {
                if (g < 999) {
                    var c = RegExp(n, "g");
                    h[g].className = h[g].className.replace(c, "")
                }
            }
            ;
            h[a].onmouseout = function() {
                if (g < 999) {
                    h[g].className = h[g].className + n
                }
            }
        }
        if (o) {
            var k = document.getElementById(d).getElementsByTagName("li");
            for (var a = 0, b = k.length; a < b; a++) {
                var f = k[a];
                if (f) {
                    f.className = f.getElementsByTagName("a")[0].className
                }
            }
        }
    },
    SetOptions: function(a) {
        this.options = {
            Input: "",
            Tips: "",
            nowClass: "current-rating",
            tipsTxt: ["1分-很不满意", "2分-不满意", "3分-一般", "4分-满意", "5分-非常满意"]
        };
        Extend(this.options, a || {})
    }
};
function setHomepage() {
    if (document.all) {
        document.body.style.behavior = "url(#default#homepage)";
        document.body.setHomePage(httpUrl)
    } else {
        if (window.sidebar) {
            if (window.netscape) {
                try {
                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect")
                } catch (b) {
                    alert("该操作被浏览器拒绝，如果想启用该功能，请在地址栏内输入 about:config,然后将项 signed.applets.codebase_principal_support 值该为true")
                }
            }
            var a = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
            a.setCharPref("browser.startup.homepage", httpUrl)
        }
    }
}
function globalLogoff() {}
function bookmark() {
    var a;
    var c = /^http{1}s{0,1}:\/\/([a-z0-9_\\-]+\.)+(yihaodian|1mall|111|yhd){1}\.(com|com\.cn){1}\?(.+)+$/;
    if (c.test(httpUrl)) {
        a = "&ref=favorite"
    } else {
        a = "?ref=favorite"
    }
    var b = httpUrl + a;
    var f = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
    if (f) {
        b = httpUrl
    }
    try {
        if (document.all) {
            window.external.AddFavorite(b, favorite)
        } else {
            try {
                window.sidebar.addPanel(favorite, b, "")
            } catch (d) {
                alert("抱歉，您所使用的浏览器无法完成此操作。\n\n加入收藏失败，请使用Ctrl+D进行添加")
            }
        }
    } catch (d) {
        alert("抱歉，您所使用的浏览器无法完成此操作。\n\n加入收藏失败，请使用Ctrl+D进行添加")
    }
}
function writeHeaderContent() {
    var b = jQuery("#global_login");
    var c = window.loli || (window.loli = {});
    if (b.size() > 0) {
        if (b.attr("data-type") != null ) {
            var a = c.app = c.app || {};
            var d = c.app.account = c.app.account || {};
            if (d.showUserInfo) {
                c.globalCheckLogin(d.showUserInfo)
            }
            return
        }
        c.globalCheckLogin(globalInitYhdLoginInfo)
    }
}
function globalInitYhdLoginInfo(g) {
    if (g && g.result && g.userName) {
        var h = g.result;
        var f = g.userName;
        var e = jQuery("#global_login");
        var d = jQuery("#global_unlogin");
        var b = jQuery("#logout");
        if (h == "1") {
            e.show();
            b.show();
            d.hide();
            var a = jQuery.cookie("uname");
            if (a && jQuery.trim(a) != "") {
                jQuery("#user_name").text(a)
            } else {
                jQuery("#user_name").text(f)
            }
            if (g.memberGrade) {
                var c = g.memberGrade;
                if (c == "1" || c == "2" || c == "3") {
                    jQuery("#global_member_grade").removeClass("hd_vip0").addClass("hd_vip" + c)
                }
            }
        }
    }
}
function cutUsername(a) {
    return a
}
function bothSiteLogoutJsonp() {
    jQuery.getJSON(URLPrefix.passport + "/passport/logoutJsonp.do?timestamp=" + new Date().getTime() + "&callback=?", function(b) {
        if (b && b.code == "0") {
            var a = (typeof globalSyncCookieFlag != "undefined" && globalSyncCookieFlag == "1") ? 1 : 0;
            if (a) {
                jQuery.getJSON("https://passport.yihaodian.com.hk/passport/logoutJsonp.do?timestamp=" + new Date().getTime() + "&callback=?", function(c) {
                    if (c && c.code == "0") {
                        location.href = currDomain
                    }
                });
                setTimeout(function() {
                    location.href = currDomain
                }, 3000)
            } else {
                location.href = currDomain
            }
        }
    })
}
function pingan_quit() {}
function kx001_onlogout() {}
function hightLightMenu(c, b) {
    var d = jQuery(c);
    var a = location.href;
    d.each(function(h) {
        if (h == 0) {
            return true
        }
        var g = jQuery(this).find("a");
        var f = g.attr("href");
        var e = g.attr("hl");
        var j = false;
        j = (a.indexOf(f) > -1);
        if (!j) {
            if (e) {
                j = (a.indexOf(e) > -1)
            }
        }
        if (!j) {
            j = (a.indexOf("point2channel.do") > -1) && (f.indexOf("/point2/pointIndex.do") > -1)
        }
        if (j) {
            if (h) {
                if (e != null  && e.length > 0) {
                    d.eq(0).removeClass("cur");
                    g.parent().addClass("cur")
                }
            }
            return false
        }
    })
}
function initHeader() {
    try {
        writeHeaderContent()
    } catch (a) {}
    hightLightMenu("#global_menu li", null )
}
function headNavFixed() {
    var c = $("#headerNav").offset().top;
    var a = jQuery("#headerNav");
    jQuery(window).scroll(function() {
        var d = $(this).scrollTop();
        if (d > c) {
            a.addClass("hd_nav_fixed");
            if (jQuery("#headerNav_box").length == 0) {
                a.after('<p class="headerNav_box" id="headerNav_box"></p>')
            }
        } else {
            jQuery("#headerNav_box").remove();
            a.removeClass("hd_nav_fixed");
            jQuery("#fix_keyword").blur()
        }
    });
    var b = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
    if (b) {
        $(window).scroll(function() {
            var d = $(this).scrollTop();
            if (d > c) {
                a.addClass("hd_fixed_ie6");
                var e = $("#headerNav_ifm").length;
                if (e == 0) {
                    $('<iframe class=headerNav_ifm id="headerNav_ifm"></iframe>').insertBefore("#headerNav .wrap")
                }
                a.css("top", d)
            } else {
                a.removeClass("hd_fixed_ie6");
                $("#headerNav_ifm").remove();
                a.css("top", "0px");
                jQuery("#fix_keyword").blur()
            }
        })
    }
}
function searchHeadNavFixed() {
    var c = $("#rankOpDiv").size() > 0 ? $("#rankOpDiv").offset().top : $("#headerNav").offset().top;
    var a = jQuery("#headerNav");
    jQuery(window).scroll(function() {
        var d = $(this).scrollTop();
        if (d > c) {
            a.addClass("hd_nav_fixed").addClass("hd_search_fix");
            if (jQuery("#headerNav_box").length == 0) {
                a.after('<p class="headerNav_box" id="headerNav_box"></p>')
            }
        } else {
            jQuery("#headerNav_box").remove();
            a.removeClass("hd_nav_fixed").removeClass("hd_search_fix");
            jQuery("#fix_keyword").blur()
        }
    });
    var b = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
    if (b) {
        $(window).scroll(function() {
            var d = $(this).scrollTop();
            if (d > c) {
                a.addClass("hd_fixed_ie6").addClass("hd_search_fix");
                var e = $("#headerNav_ifm").length;
                if (e == 0) {
                    $('<iframe class=headerNav_ifm id="headerNav_ifm"></iframe>').insertBefore("#headerNav .wrap")
                }
                a.css("top", d)
            } else {
                a.removeClass("hd_fixed_ie6").removeClass("hd_search_fix");
                $("#headerNav_ifm").remove();
                a.css("top", "0px");
                jQuery("#fix_keyword").blur()
            }
        })
    }
}
function indexHeadNavFixed() {
    var c = $("#headerNav").offset().top + 398;
    var a = jQuery("#headerNav");
    jQuery(window).scroll(function() {
        var d = $(this).scrollTop();
        if (d > c) {
            a.addClass("hd_nav_fixed");
            if (jQuery("#headerNav_box").length == 0) {
                a.after('<p class="headerNav_box" id="headerNav_box"></p>')
            }
            if (typeof isIndex != "undefined" && isIndex == 1) {
                $("#allSortOuterbox li.cur").removeClass("cur").children(".hd_show_sort").hide();
                $("#allSortOuterbox").removeClass("hover");
                $("#allCategoryHeader").hide()
            }
        } else {
            jQuery("#headerNav_box").remove();
            a.removeClass("hd_nav_fixed");
            jQuery("#fix_keyword").blur();
            if (typeof isIndex != "undefined" && isIndex == 1) {
                $("#allCategoryHeader").show()
            }
        }
    });
    var b = /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6;
    if (b) {
        $(window).scroll(function() {
            var d = $(this).scrollTop();
            if (d > c) {
                a.addClass("hd_fixed_ie6");
                var e = $("#headerNav_ifm").length;
                if (e == 0) {
                    $('<iframe class=headerNav_ifm id="headerNav_ifm"></iframe>').insertBefore("#headerNav .wrap")
                }
                a.css("top", d)
            } else {
                a.removeClass("hd_fixed_ie6");
                $("#headerNav_ifm").remove();
                a.css("top", "0px");
                jQuery("#fix_keyword").blur()
            }
        })
    }
}
var yhdToolKit = window.yhdToolKit = window.yhdToolKit || {};
yhdToolKit.loadMobileAdv = function() {
    var a = $("#glKeHuDuan");
    a.find(".hd_iconfont").click(function() {
        var b = loli.spm.getData(this);
        gotracker("2", "wirelessClick", null , b)
    });
    $("#glKeHuDuan").lazyImg()
}
;
yhdToolKit.getProductPicByDefaultPic = window.getProductPicByDefaultPic;
jQuery(document).ready(function() {
    if (isIndex != 1) {
        initHeader()
    }
    if (typeof isFixTopNav != "undefined" && isFixTopNav == true) {
        if (typeof headerType != "undefined" && headerType == "search") {
            searchHeadNavFixed()
        } else {
            if (typeof isIndex != "undefined" && isIndex == 1) {
                indexHeadNavFixed()
            } else {
                headNavFixed()
            }
        }
    }
    jQuery("#footerServiceLinkId").lazyDom({
        load: false,
        flushPrice: false,
        indexLoad: true,
        callback: function() {}
    });
    yhdToolKit.loadMobileAdv();
    $("#footerQRcode,#footerIcon,#footer").lazyImg()
});
function newTopslider(u) {
    var s = jQuery(u);
    if (s.length < 1) {
        return
    }
    var r = null ;
    var v = jQuery("#site_header");
    var m = v.css("padding-top");
    if (m && m.indexOf("px") >= 0) {
        m = m.replace("px", "")
    }
    if (v.attr("data-hfix")) {
        r = v.attr("data-hfix")
    }
    var q = s.find(".index_topbanner_fold");
    var p = s.find(".big_topbanner");
    var x = jQuery("#smallTopBanner");
    var t = typeof isWidescreen != "undefined" ? isWidescreen : false;
    q.click(function() {
        var a = $(this);
        if (a.hasClass("index_topbanner_unfold")) {
            a.removeClass("index_topbanner_unfold");
            a.html("展开<s></s>");
            p.slideUp();
            x.slideDown();
            if (r) {
                v.animate({
                    "padding-top": m + "px"
                })
            }
        } else {
            a.addClass("index_topbanner_unfold");
            a.html("收起<s></s>");
            p.slideDown();
            x.slideUp();
            if (r) {
                v.animate({
                    "padding-top": (m - r) + "px"
                })
            }
        }
    });
    var o = p.find("img");
    if (o && o.length > 0) {
        o.attr("src", o.attr(t ? "wideimg" : "shortimg")).removeAttr("wideimg").removeAttr("shortimg")
    }
    var n = function(a) {
            var b = setTimeout(function() {
                var c = a;
                if (c.hasClass("index_topbanner_unfold")) {
                    c.removeClass("index_topbanner_unfold");
                    c.html("展开<s></s>");
                    p.slideUp();
                    x.slideDown();
                    if (r) {
                        v.animate({
                            "padding-top": m + "px"
                        })
                    }
                }
            }, 5000);
            a.click(function() {
                clearInterval(b)
            })
        }
        ;
    o.eq(0).load(function() {
        var a = window.navigator.userAgent.toLowerCase();
        var d = /msie ([\d\.]+)/;
        if (d.test(a)) {
            var b = parseInt(d.exec(a)[1]);
            if (b <= 6) {
                var c = $(this).height();
                if (c > 450) {
                    $(this).css("height", 450)
                }
            }
        }
        if (r) {
            v.animate({
                "padding-top": (m - r) + "px"
            })
        }
        s.slideDown();
        q.addClass("index_topbanner_unfold");
        n(q)
    });
    var w = x.find("img");
    w.each(function(a, b) {
        jQuery(b).attr("src", jQuery(b).attr(t ? "wideimg" : "shortimg")).removeAttr("wideimg").removeAttr("shortimg")
    })
}
runfunctions([], [initHeader, initProvince, initAllMiniCart, searchKeywords_onDocumentReady], this);
function runfunctions(i, j, n) {
    if (!(j && j.length)) {
        return
    }
    n = n || window;
    for (var e = 0; e < j.length; e++) {
        var k = j[e];
        var l = (i && i.length > e) ? i[e] : [];
        if (typeof k == "function") {
            try {
                k.apply(n, l)
            } catch (m) {}
        }
    }
}
(function() {
    function b(a) {
        this.option = {
            container: null ,
            content: null ,
            trigger: null ,
            pageButton: [],
            steps: 1,
            effect: "visible",
            autoPlay: false,
            interval: 3000,
            activeClass: "on",
            speed: 300,
            eventType: "mouseover",
            delay: 0,
            index: 0
        };
        $.extend(this.option, a);
        this.timer = 0;
        this.handlers = {};
        this.index = this.option.index;
        this.box = $(this.option.container);
        if (this.box.length == 0) {
            return false
        }
        this.sprite = this.box.find(this.option.content);
        if (this.sprite.length == 0) {
            return false
        }
        this.trig = this.box.find(this.option.trigger).children();
        this.btnLast = this.box.find(this.option.pageButton[0]);
        this.btnNext = this.box.find(this.option.pageButton[1]);
        this.items = this.sprite.children();
        if (this.items.length == 0) {
            return false
        }
        this.total = this.items.length;
        if (this.total <= this.option.steps) {
            return false
        }
        this.page = Math.ceil(this.total / this.option.steps);
        this.width = this.items.eq(0).outerWidth(true);
        this.height = this.items.eq(0).outerHeight(true);
        this.init()
    }
    b.prototype = {
        init: function() {
            this.initStyle();
            this.cutover(0);
            this.bindUI();
            this.autoPlay()
        },
        on: function(d, a) {
            if (typeof this.handlers[d] == "undefined") {
                this.handlers[d] = []
            }
            this.handlers[d].push(a);
            return this
        },
        fire: function(h, g) {
            if (this.handlers[h] instanceof Array) {
                var j = this.handlers[h];
                for (var i = 0, a = j.length; i < a; i++) {
                    j[i](g)
                }
            }
        },
        initStyle: function() {
            var a = function(c) {
                    for (var d = 0; d < c.option.steps; d++) {
                        c.items.eq(c.total - (d + 1)).clone().prependTo(c.sprite);
                        c.items.eq(d).clone().appendTo(c.sprite)
                    }
                }
                ;
            switch (this.option.effect) {
                case "scrollx":
                    a(this);
                    this.sprite.css({
                        width: this.sprite.children().length * this.width,
                        left: -this.option.steps * this.width
                    });
                    this.sprite.children().css("float", "left");
                    break;
                case "scrolly":
                    a(this);
                    this.sprite.css({
                        top: -this.option.steps * this.height
                    });
                    break;
                case "fade":
                    this.items.css({
                        position: "absolute",
                        zIndex: 0
                    }).eq(this.index).css({
                        zIndex: 1
                    });
                    break;
                case "visible":
                    this.items.css({
                        display: "none"
                    }).eq(this.index).css({
                        display: "block"
                    });
                    break
            }
            var e = this;
            var f = setTimeout(function() {
                clearTimeout(f);
                e.fire("init")
            }, 30)
        },
        cutover: function(i) {
            var h = (i == null ) ? this.option.speed : 0;
            var g = this.index != this.page ? this.index : 0;
            this.trig.eq(g).addClass(this.option.activeClass).siblings().removeClass(this.option.activeClass);
            switch (this.option.effect) {
                case "visible":
                    this.items.css({
                        display: "none"
                    }).eq(g).css({
                        display: "block"
                    });
                    break;
                case "fade":
                    this.items.css({
                        position: "absolute",
                        zIndex: 0
                    }).fadeOut(h);
                    this.items.eq(g).css({
                        zIndex: 1
                    }).fadeIn(h);
                    break;
                case "scrollx":
                    var a = this.width * this.option.steps;
                    this.sprite.stop().animate({
                        left: -a * this.index - a
                    }, h);
                    break;
                case "scrolly":
                    var j = this.height * this.option.steps;
                    this.sprite.stop().animate({
                        top: -j * this.index - j
                    }, h);
                    break
            }
            this.fire("cutover", g)
        },
        bindUI: function() {
            var e = this;
            var f = 0;
            this.trig.bind(this.option.eventType, function() {
                var c = this;
                if (e.option.eventType == "mouseover" || e.option.eventType == "mouseenter") {
                    if (e.index == $(c).index()) {
                        return
                    }
                    clearTimeout(f);
                    f = setTimeout(function() {
                        e.index = $(c).index();
                        e.cutover();
                        clearTimeout(f)
                    }, e.option.delay)
                } else {
                    e.index = $(this).index();
                    e.cutover()
                }
            });
            this.btnLast.click(function() {
                e.lastPage()
            });
            this.btnNext.click(function() {
                e.nextPage()
            });
            function a(r, p, q, c) {
                var m = 0
                    , d = 0
                    , n = 0
                    , o = 0;
                r.off("touchstart touchend").on({
                    touchstart: function(g) {
                        var h = g.originalEvent.changedTouches[0];
                        m = h.pageX;
                        d = h.pageY;
                        if (c) {
                            c(m, d)
                        }
                    },
                    touchmove: function(g) {
                        var h = g.originalEvent.changedTouches[0];
                        n = h.pageX;
                        o = h.pageY;
                        if (Math.abs(n - m) > Math.abs(o - d)) {
                            if (q) {
                                q(n - m, o - d)
                            }
                            g.preventDefault()
                        }
                    },
                    touchend: function(g) {
                        var h = g.originalEvent.changedTouches[0];
                        n = h.pageX;
                        o = h.pageY;
                        if (Math.abs(n - m) > Math.abs(o - d)) {
                            if (n - m > 0) {
                                if (p) {
                                    p("right")
                                }
                            } else {
                                p("left")
                            }
                        } else {
                            if (o - d > 0) {
                                p("down")
                            } else {
                                p("up")
                            }
                        }
                    }
                })
            }
            a(this.box, function(c) {
                if (c == "right") {
                    e.lastPage();
                    clearInterval(e.timer);
                    e.autoPlay()
                }
                if (c == "left") {
                    e.nextPage();
                    clearInterval(e.timer);
                    e.autoPlay()
                }
            });
            this.box.bind({
                mouseenter: function() {
                    e.btnLast.show();
                    e.btnNext.show();
                    clearInterval(e.timer)
                },
                mouseleave: function() {
                    e.btnLast.hide();
                    e.btnNext.hide();
                    e.autoPlay()
                }
            })
        },
        lastPage: function() {
            this.index--;
            if (this.index < -1) {
                this.index = this.page - 1;
                this.cutover(0);
                this.index = this.page - 2
            }
            this.cutover()
        },
        nextPage: function() {
            this.index++;
            if (this.index > this.page) {
                this.index = 0;
                this.cutover(0);
                this.index = 1
            }
            this.cutover()
        },
        autoPlay: function() {
            var a = this;
            if (!this.option.autoPlay) {
                return false
            }
            clearInterval(this.timer);
            this.timer = setInterval(function() {
                a.nextPage()
            }, this.option.interval)
        }
    };
    window.Switchable = b
})();
(function(b) {
    YHD.HomePage = new function() {
        this.init = function() {
            a("#hd_head_skin");
            $("body").delegate("a", "click", function() {
                $(this).css("outline", "none")
            })
        }
        ;
        function a(i) {
            var g = b(i);
            if (g.length > 0) {
                if (g.attr("data-promt") == "1") {
                    $("#logo_areaID img").hide();
                    $("#logo_areaID span").hide();
                    $("#headerNav").addClass("hd_no_redline")
                } else {
                    g.css("bottom", "auto")
                }
                $("#index_menu_carousel").attr("lunboBackgroudFlag", "0");
                var h = "";
                var j = [];
                if (typeof isWidescreen != "undefined" && isWidescreen) {
                    h = $.parseJSON(g.attr("data-wi"))
                } else {
                    h = $.parseJSON(g.attr("data-si"))
                }
                $.each(h, function(d, c) {
                    j.push('<div style="background: url(&quot;' + c.url + "&quot;) no-repeat scroll center top; height: " + c.height + 'px;"></div>')
                });
                if (j.length > 0) {
                    g.prepend(j.join(""))
                }
            }
        }
    }
})(jQuery);
function getAjaxProductPrice(h) {
    if (!jQuery.cookie("provinceId") && !$(h)) {
        return
    }
    var i = URLPrefix.busystock ? URLPrefix.busystock : "http://gps.yhd.com";
    var j = "?mcsite=" + currBsSiteId + "&provinceId=" + jQuery.cookie("provinceId");
    var f = $(h).find("[productid]");
    jQuery.each(f, function(a, b) {
        var c = $(b).attr("productid");
        if (c != null  && c != "") {
            j += "&productIds=" + c
        }
    });
    var g = i + "/busystock/restful/truestock";
    jQuery.getJSON(g + j + "&callback=?", function(a) {
        if (a == null  || a == "") {
            return
        }
        jQuery.each(a, function(c, e) {
            var d = $(h).find("[productid='" + e.productId + "']");
            if (d) {
                var b = "¥" + e.productPrice + "</strong>";
                d.html(b).removeAttr("productid")
            }
        })
    })
}
function reflushGrouponData(j) {
    var m = jQuery(j);
    if (m.length < 1) {
        return
    }
    var n = jQuery.cookie("provinceId");
    if (!n) {
        return
    }
    var h = m.find("[data-grouponId]");
    if (!h || h.length < 1) {
        return
    }
    var l = [];
    jQuery.each(h, function(a, b) {
        var c = $(b).attr("data-grouponId");
        l.push("grouponIds=" + c)
    });
    var k = URLPrefix.busystock ? URLPrefix.busystock : "http://gps.yihaodian.com";
    var i = k + "/restful/groupon?provinceId=" + n + "&" + l.join("&") + "&callback=?";
    jQuery.getJSON(i, function(e) {
        if (e == null  || e == "" || e.length < 1) {
            return
        }
        for (var f = 0, c = e.length; f < c; f++) {
            var d = e[f];
            var a = d.grouponId;
            if (d.code == 1) {
                var b = m.find("[data-grouponId='" + a + "']");
                if (b) {
                    b.html("<em><i>" + d.soldNum + "</i>人已购买</em>¥<b>" + d.currentPrice + "</b><span>参考价:</span><del style='text-decoration:none;'>¥" + d.marketPrice + "</del>");
                    b.removeAttr("data-grouponId")
                }
            }
        }
    })
}
function getGrouponBrandData(g) {
    var j = jQuery(g);
    if (j.length < 1) {
        return
    }
    var h = j.find("[data-grouponBrandId]");
    if (!h || h.length < 1) {
        return
    }
    var i = [];
    jQuery.each(h, function(a, b) {
        var c = $(b).attr("data-grouponBrandId");
        i.push(c)
    });
    var f = currDomain + "/homepage/grouponBrand.do?brandIds=" + i.join(",");
    jQuery.getJSON(f, function(a) {
        if (a == null  || a == "" || a.length < 1) {
            return
        }
        for (var c in a) {
            var d = a[c];
            var c = d.brandId;
            var b = j.find("[data-grouponBrandId='" + c + "']");
            if (b) {
                b.append("<span><b>" + (d.rebate || 0) + "</b>折起</span><em><i>" + (d.peopleNumber || 0) + "</i>人已购买</em>");
                b.removeAttr("data-grouponId")
            }
        }
    })
}
function getShanData(h) {
    var j = jQuery(h);
    if (j.length < 1) {
        return
    }
    var f = j.find("[data-shanActivityId]");
    if (!f || f.length < 1) {
        return
    }
    var i = [];
    jQuery.each(f, function(c, b) {
        var a = $(b).attr("data-shanActivityId");
        i.push(a)
    });
    var g = currDomain + "/homepage/shanActivityData.do?activityIds=" + i.join(",");
    jQuery.getJSON(g, function(r) {
        if (!r || r.status == 0 || !r.result) {
            return true
        }
        var e = r.result;
        for (var a in e) {
            var s = e[a];
            if (s) {
                var t = s.id;
                var c = s.discountInfo;
                var q = s.discountType;
                var p = j.find("[data-shanActivityId='" + t + "']");
                if (p) {
                    if (q == 1) {
                        p.append("<u><b>" + (c || 0) + "</b>折起</u>")
                    } else {
                        if (q == 2) {
                            p.append("<u><b>" + (c || 0) + "</b>折封顶</u>")
                        }
                    }
                    p.removeAttr("data-shanActivityId")
                }
                var d = s.remainTime;
                var b = p.parent().find("p");
                countdownTime(b, d)
            }
        }
    })
}
function countdownTime(j, k) {
    if (k && k >= 0) {
        var m = k / 1000;
        var l = Math.floor(m % 60);
        var p = Math.floor((m / 60) % 60);
        var o = Math.floor((m / 3600) % 24);
        var n = Math.floor(m / (24 * 3600));
        var i = "<i></i>剩余<span><em>" + n + "</em>天</span>";
        if (n < 1) {
            i = "<i></i>剩余<span><em>" + o + "</em>小时<em>" + p + "</em>分<em>" + l + "</em>秒</span>";
            setTimeout(function() {
                countdownTime(j, k - 1000)
            }, 1000)
        }
        j.html(i)
    }
}
function scrollToTop() {
    var f = $(".floor_left_box")
        , d = f
        , e = $(window).height();
    loli.delay(window, "scroll", null , function() {
        if (loli.util.isIE() && loli.util.isIE() <= 6) {
            f.css("top", (e - 480 - 30 + $(window).scrollTop()) + "px")
        }
    });
    $(".toTop", d).click(function() {
        $("body,html").stop().animate({
            scrollTop: 0
        });
        return false
    });
    $(".fixedRight").delegate(".fanli_code_wrap", "mouseenter", function() {
        $(".fanli_code", this).show()
    });
    $(".fixedRight").delegate(".fanli_code_wrap", "mouseleave", function() {
        $(".fanli_code", this).hide()
    })
}
function getProvinceName() {
    var b = jQuery.cookie("provinceId");
    if (!b) {
        b = 1
    }
    return YHDPROVINCE.proviceObj["p_" + b]
}
YHD.HomePage.Tools = YHD.HomePage.Tools || {};
YHD.HomePage.Tools.getNowTime = function() {
    var d;
    if (typeof (nowTime) == "undefined" || nowTime == undefined) {
        var c = new Date();
        d = new Array(c.getFullYear(),c.getMonth() + 1,c.getDate(),c.getHours(),c.getMinutes(),c.getSeconds())
    } else {
        d = nowTime.split("-")
    }
    return new Date(d[0],d[1] - 1,d[2],d[3],d[4],d[5])
}
;
YHD.HomePage.Tools.touchEvent = function(j, n, o, p) {
    var i = 0
        , k = 0
        , l = 0
        , m = 0;
    n = n || function() {}
    ;
    j.off("touchstart touchend").on({
        touchstart: function(a) {
            var b = a.originalEvent.changedTouches[0];
            i = b.pageX;
            k = b.pageY;
            if (p) {
                p(i, k)
            }
        },
        touchmove: function(a) {
            var b = a.originalEvent.changedTouches[0];
            l = b.pageX;
            m = b.pageY;
            if (Math.abs(l - i) > Math.abs(m - k)) {
                if (o) {
                    o(l - i, m - k)
                }
                a.preventDefault()
            }
        },
        touchend: function(a) {
            var b = a.originalEvent.changedTouches[0];
            l = b.pageX;
            m = b.pageY;
            if (Math.abs(l - i) > Math.abs(m - k)) {
                if (l - i > 0) {
                    n("right")
                } else {
                    n("left")
                }
            } else {
                if (m - k > 0) {
                    n("down")
                } else {
                    n("up")
                }
            }
        }
    })
}
;
YHD.HomePage.initIE6UpdateMsg = function() {
    var f = window.navigator.userAgent.toLowerCase();
    var j = /msie ([\d.]+)/;
    if (j.test(f)) {
        var i = parseInt(j.exec(f)[1]);
        var g = $.cookie("ie6Update");
        if (i <= 6 && "1" != g) {
            var h = [];
            h.push("<div class='ie6_upgrade clearfix' id='ie6_upgrade'>");
            h.push("<div class='ie6_upgrade_wrap'>");
            h.push("<span class='ie6_upgrade_sad'></span>");
            h.push("<span class='ie6_upgrade_text'>温馨提示：您当前使用的浏览器版本过低，兼容性和安全性较差，1号店建议您升级：</span>");
            h.push("<a href='http://windows.microsoft.com/zh-cn/internet-explorer/download-ie' target='_blank' class='ie6_upgrade_ie' tk='global_ie6_upgrade_ie8'>IE8浏览器</a>");
            h.push("<span class='ie6_upgrade_text'>或</span>");
            h.push("<a href='http://chrome.360.cn/' target='_blank' class='ie6_upgrade_360' tk='global_ie6_upgrade_360'>360极速浏览器</a>");
            h.push("</div>");
            h.push("<a href='javascript:void(0);' class='ie6_upgrade_close' title='关闭' tk='global_ie6_upgrade_close'>关闭提示</a>");
            h.push("</div>");
            $(document.body).prepend(h.join(""));
            $("#ie6_upgrade").show();
            $("#ie6_upgrade a.ie6_upgrade_close").click(function() {
                $("#ie6_upgrade").slideUp();
                loli.cookie.setAllDomain("ie6Update", "1", "/", 7);
                var a = $(this).attr("tk");
                gotracker("2", a)
            });
            $("#ie6_upgrade>div>a").click(function() {
                var a = $(this).attr("tk");
                gotracker("2", a)
            })
        }
    }
}
;
YHD.HomePage.tabHover = function() {
    $(".mod_iframe_app .tabs").delegate("a", "mouseenter", function() {
        var i = $(this).index();
        $(this).addClass("cur").siblings("a").removeClass("cur");
        var j = $(".content_detail").eq(i);
        var h = j.attr("data-url");
        j.show().siblings(".content_detail").hide();
        var f = function() {
                var a = new Date();
                return (a.getYear() + 1900) + "" + (a.getMonth() + 1) + "" + a.getDate()
            }
            ;
        if (h && !j.data("iframeLoaded")) {
            if (h.indexOf("?") == -1) {
                h = h + "?randid=" + f()
            } else {
                h = h + "&randid=" + f()
            }
            if (i == 0 || i == 1) {
                var g = "<iframe src='" + h + "' width='240' height='280' frameborder='0' scrolling='no'></iframe>";
                j.html(g);
                j.data("iframeLoaded", "1")
            }
        }
        return false
    })
}
;
YHD.HomePage.vipShow = function() {
    var f = $("#index_digit");
    var e = $("#yhd_zhuanxiang");
    var d = null ;
    if (f.size() == 0) {
        return
    }
    $("li.tab_link", e).on("mouseenter", function() {
        var a = $(this);
        if (d) {
            clearTimeout(d)
        }
        d = setTimeout(function() {
            var b = a.attr("data-index");
            f.find(".tabs a").eq(b - 4).addClass("cur").siblings("a").removeClass("cur");
            $(".tabs_content", f).find(".content_detail").eq(b - 4).show().siblings().hide();
            f.show();
            f.stop().animate({
                top: "0"
            }, function() {
                $(".colse_btn", e).show();
                e.addClass("mod_vip_show")
            })
        }, 200)
    });
    $("li.tab_link a", e).on("mouseleave", function() {
        if (d) {
            clearTimeout(d)
        }
    });
    e.delegate(".colse_btn", "click", function() {
        $(".colse_btn", e).hide();
        e.removeClass("mod_vip_show");
        f.stop().animate({
            top: "190"
        }, function() {
            f.hide()
        })
    });
    $(document).bind("click", function(a) {
        var b = $(a.target);
        if (b.closest(".mod_iframe_app").length == 0) {
            $(".colse_btn", e).hide();
            e.removeClass("mod_vip_show");
            f.stop().animate({
                top: "190"
            }, function() {
                f.hide()
            })
        }
    })
}
;
YHD.HomePage.initPreloadAdvertise = function() {
    if ($("#preloadAdvsData").size() == 0) {
        return
    }
    var y = $("#preloadAdvsData").val();
    var u = (y && y.length > 2) ? $.parseJSON(y) : null ;
    var r = function() {
            if ($("#topCurtain").size() > 0 && $("#smallTopBanner img").size() > 1) {
                return 4
            }
            if ($("#topCurtain").size() > 0 && $("#smallTopBanner img").size() == 1) {
                return 3
            }
            if ($("#topbanner").size() > 0 && $("#topbanner img").size() > 1) {
                return 2
            }
            if ($("#topbanner").size() > 0 && $("#topbanner img").size() == 1) {
                return 1
            }
            return 0
        }
        ;
    var q = function(d, b) {
            var a = false;
            var c = YHD.HomePage.Tools.getNowTime().getTime();
            if (c >= d && c <= b) {
                a = true
            }
            return a
        }
        ;
    var B = function(f, a) {
            var d = null ;
            var g = f[a];
            var e = g != null  ? g : [];
            for (var b = 0; b < e.length; b++) {
                var c = e[b];
                if (q(c.startTime, c.endTime) && (c.imgPath != null  || c.imgWidePath != null )) {
                    d = c;
                    break
                }
            }
            return d
        }
        ;
    var A = function(k) {
            if (!k) {
                return {
                    type: 0,
                    data: null
                }
            }
            var h = B(k, "INDEX_TOP_ZNQSYLAMU_ZHANKAI", 1);
            var e = B(k, "INDEX_TOP_ZNQSYLAMU_SHOUQIZUO", 1);
            var f = B(k, "INDEX_TOP_ZNQSYLAMU_SHOUQIZHONG", 1);
            var g = B(k, "INDEX_TOP_ZNQSYLAMU_SHOUQIYOU", 1);
            var i = B(k, "INDEX_TOP_CURTAINAD_OPEN", 1);
            var c = B(k, "INDEX_TOP_CURTAINAD_CLOSE", 1);
            var j = B(k, "INDEX_TOP_ZNQSYHENGFU_ZUOTU", 1);
            var a = B(k, "INDEX_TOP_ZNQSYHENGFU_ZHONGTU", 1);
            var b = B(k, "INDEX_TOP_ZNQSYHENGFU_YOUTU", 1);
            var d = B(k, "INDEX_TOP_TOPBANNER_DEFAULT", 1);
            if (h != null  && e != null  && f != null  && g != null ) {
                return {
                    type: 4,
                    data: {
                        open: h,
                        close1: e,
                        close2: f,
                        close3: g
                    }
                }
            }
            if (i != null  && c != null ) {
                return {
                    type: 3,
                    data: {
                        open: i,
                        close: c
                    }
                }
            }
            if (j != null  && a != null  && b != null ) {
                return {
                    type: 2,
                    data: {
                        adv1: j,
                        adv2: a,
                        adv3: b
                    }
                }
            }
            if (d != null ) {
                return {
                    type: 1,
                    data: {
                        adv: d
                    }
                }
            }
            return {
                type: 0,
                data: null
            }
        }
        ;
    var C = function() {
            var a = $("#smallTopBanner");
            if (a.length < 1) {
                a = $("#topbanner").find(".small_topbanner3")
            }
            if (a.length < 1) {
                return
            }
            a.delegate("a", "mouseover", function() {
                $(this).siblings("a").find("u").show()
            });
            a.delegate("a", "mouseout", function() {
                $(this).siblings("a").find("u").hide()
            })
        }
        ;
    var z = function(b, c) {
            if (b.attr("data-done") == "1") {
                return
            }
            b.attr("href", c.imgJumpLinkUrl).attr("title", c.title).attr("data-ref", c.perTracker);
            var a = c.tc;
            if (a) {
                b.attr("data-tc", a)
            }
        }
        ;
    var x = function(a, b) {
            if (a.attr("data-done") == "1") {
                return
            }
            a.attr("alt", b.title).attr("src", isWidescreen ? b.imgWidePath : b.imgPath);
            if (a.attr("shortimg") != null ) {
                a.attr("shortimg", b.imgPath)
            }
            if (a.attr("wideimg") != null ) {
                a.attr("wideimg", b.imgWidePath)
            }
            if (a.attr("si") != null ) {
                a.attr("si", b.imgPath)
            }
            if (a.attr("wi") != null ) {
                a.attr("wi", b.imgWidePath)
            }
        }
        ;
    var s = function(e, a) {
            var b = e == 1;
            var f = $("#topbanner");
            var d = a.adv;
            if (b) {
                if (!f.data("preloadFlag")) {
                    f.data("preloadFlag", 1);
                    z($("#topbanner a"), d);
                    x($("#topbanner img"), d)
                }
            } else {
                if (e > 0) {
                    $("#topbanner").remove();
                    $("#topCurtain").remove()
                }
                var c = [];
                c.push("<div id='topbanner' class='wrap'>");
                c.push("<div class='banner_img'>");
                c.push("<a href='" + d.imgJumpLinkUrl + "' title='" + d.title + "' data-ref='" + d.perTracker + "' target='_blank'>");
                c.push("<img alt='" + d.title + "' src='" + (isWidescreen ? d.imgWidePath : d.imgPath) + "'/>");
                c.push("</a>");
                c.push("</div>");
                c.push("</div>");
                $("#global_top_bar").after(c.join(""));
                $("#topbanner").data("preloadFlag", 1)
            }
        }
        ;
    var t = function(f, a) {
            var b = f == 3;
            var g = $("#topCurtain");
            var c = a.open;
            var d = a.close;
            if (b) {
                if (!g.data("preloadFlag")) {
                    g.data("preloadFlag", 1);
                    z($(".big_topbanner", g), c);
                    x($(".big_topbanner img", g), c);
                    z($("#smallTopBanner", g), d);
                    x($("#smallTopBanner img", g), d)
                }
            } else {
                if (f > 0) {
                    $("#topbanner").remove();
                    $("#topCurtain").remove()
                }
                var e = [];
                e.push("<div id='topCurtain' style='display:none;' class='wrap index_topbanner'>");
                e.push("<a class='big_topbanner' href='" + c.imgJumpLinkUrl + "' title='" + c.title + "' data-ref='" + c.perTracker + "' target='_blank'>");
                e.push("<img alt='" + c.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + c.imgPath + "' wideimg='" + c.imgWidePath + "'/>");
                e.push("</a>");
                e.push("<a style='display:none;' id='smallTopBanner' class='small_topbanner' href='" + d.imgJumpLinkUrl + "' title='" + d.title + "' data-ref='" + d.perTracker + "' target='_blank'>");
                e.push("<img alt='" + d.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + d.imgPath + "' wideimg='" + d.imgWidePath + "'/>");
                e.push("</a>");
                e.push("<span title='点击-展开' class='index_topbanner_fold index_topbanner_unfold'>收起<s></s></span>");
                e.push("</div>");
                $("#global_top_bar").after(e.join(""));
                $("#topCurtain").data("preloadFlag", 1)
            }
        }
        ;
    var E = function(h, b) {
            var c = h == 2;
            var a = $("#topbanner");
            var e = b.adv1;
            var f = b.adv2;
            var g = b.adv3;
            if (c) {
                if (!a.data("preloadFlag")) {
                    a.data("preloadFlag", 1);
                    z($("#topbanner a").eq(0), e);
                    x($("#topbanner img").eq(0), e);
                    z($("#topbanner a").eq(1), f);
                    x($("#topbanner img").eq(1), f);
                    z($("#topbanner a").eq(2), g);
                    x($("#topbanner img").eq(2), g)
                }
            } else {
                if (h > 0) {
                    $("#topbanner").remove();
                    $("#topCurtain").remove()
                }
                var d = [];
                d.push("<div id='topbanner' class='wrap'>");
                d.push("<div class='small_topbanner3'>");
                d.push("<a class='small_topbanner3_side' href='" + e.imgJumpLinkUrl + "' title='" + e.title + "' data-ref='" + e.perTracker + "' target='_blank'>");
                d.push("<img alt='" + e.title + "' src='" + (isWidescreen ? e.imgWidePath : e.imgPath) + "'/>");
                d.push("<u style='display: none;'></u>");
                d.push("</a>");
                d.push("<a class='small_topbanner3_m' href='" + f.imgJumpLinkUrl + "' title='" + f.title + "' data-ref='" + f.perTracker + "' target='_blank'>");
                d.push("<img alt='" + f.title + "' src='" + (isWidescreen ? f.imgWidePath : f.imgPath) + "'/>");
                d.push("<u style='display: none;'></u>");
                d.push("</a>");
                d.push("<a class='small_topbanner3_side' href='" + g.imgJumpLinkUrl + "' title='" + g.title + "' data-ref='" + g.perTracker + "' target='_blank'>");
                d.push("<img alt='" + g.title + "' src='" + (isWidescreen ? g.imgWidePath : g.imgPath) + "'/>");
                d.push("<u style='display: none;'></u>");
                d.push("</a>");
                d.push("</div>");
                d.push("</div>");
                $("#global_top_bar").after(d.join(""));
                $("#topbanner").data("preloadFlag", 1)
            }
        }
        ;
    var F = function(e, h) {
            var f = e == 4;
            var i = $("#topCurtain");
            var a = h.open;
            var b = h.close1;
            var c = h.close2;
            var d = h.close3;
            if (f) {
                if (!i.data("preloadFlag")) {
                    i.data("preloadFlag", 1);
                    z($(".big_topbanner", i), a);
                    x($(".big_topbanner img", i), a);
                    z($("#smallTopBanner a", i).eq(0), b);
                    x($("#smallTopBanner img", i).eq(0), b);
                    z($("#smallTopBanner a", i).eq(1), c);
                    x($("#smallTopBanner img", i).eq(1), c);
                    z($("#smallTopBanner a", i).eq(2), d);
                    x($("#smallTopBanner img", i).eq(2), d)
                }
            } else {
                if (e > 0) {
                    $("#topbanner").remove();
                    $("#topCurtain").remove()
                }
                var g = [];
                g.push("<div style='display:none;' id='topCurtain' class='wrap index_topbanner'>");
                g.push("<a class='big_topbanner' href='" + a.imgJumpLinkUrl + "' title='" + a.title + "' data-ref='" + a.perTracker + "' target='_blank'>");
                g.push("<img alt='" + a.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + a.imgPath + "' wideimg='" + a.imgWidePath + "'/>");
                g.push("</a>");
                g.push("<div id='smallTopBanner' class='small_topbanner3' style='display: none;'>");
                g.push("<a class='small_topbanner3_side' href='" + b.imgJumpLinkUrl + "' title='" + b.title + "' data-ref='" + b.perTracker + "' target='_blank'>");
                g.push("<img alt='" + b.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + b.imgPath + "' wideimg='" + b.imgWidePath + "'/>");
                g.push("<u style='display: none;'></u>");
                g.push("</a>");
                g.push("<a class='small_topbanner3_m' href='" + c.imgJumpLinkUrl + "' title='" + c.title + "' data-ref='" + c.perTracker + "' target='_blank'>");
                g.push("<img alt='" + c.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + c.imgPath + "' wideimg='" + c.imgWidePath + "'/>");
                g.push("<u style='display: none;'></u>");
                g.push("</a>");
                g.push("<a class='small_topbanner3_side' href='" + d.imgJumpLinkUrl + "' title='" + d.title + "' data-ref='" + d.perTracker + "' target='_blank'>");
                g.push("<img alt='" + d.title + "' src='" + (URLPrefix.statics + "/global/images/blank.gif") + "' shortimg='" + d.imgPath + "' wideimg='" + d.imgWidePath + "'/>");
                g.push("<u style='display: none;'></u>");
                g.push("</a>");
                g.push("</div>");
                g.push("<span class='index_topbanner_fold'>收起<s></s></span>");
                g.push("</div>");
                $("#global_top_bar").after(g.join(""));
                $("#topCurtain").data("preloadFlag", 1)
            }
        }
        ;
    var D = function(a, c) {
            var d = "INDEX2_LUNBO_PIC" + a + "_DEFAULT";
            var b = B(c, d, 1);
            if (b != null ) {
                return {
                    big: b
                }
            }
            return null
        }
        ;
    var w = function(b, g) {
            var f = $("#promo_show");
            var c = $(".promo_wrapper ol li[flag=" + b + "]", f);
            if (c != null  && c.size() > 0) {
                for (var a = 0; a < c.size(); a++) {
                    var e = $(c[a]);
                    if (e.data("preloadFlag")) {
                        return
                    }
                    e.data("preloadFlag", 1);
                    var d = g.big;
                    if (d != null ) {
                        z(e.children("a"), d);
                        x(e.children("a").find("img"), d)
                    }
                }
            }
        }
        ;
    var v = function() {
            var e = $("#preloadAdvsData").data("advsData");
            if (e != null ) {
                var d = r();
                var c = A(e);
                if (c.type != 0 && c.data != null ) {
                    if (c.type == 4) {
                        F(d, c.data)
                    } else {
                        if (c.type == 3) {
                            t(d, c.data)
                        } else {
                            if (c.type == 2) {
                                E(d, c.data)
                            } else {
                                if (c.type == 1) {
                                    s(d, c.data)
                                }
                            }
                        }
                    }
                }
                for (var b = 1; b <= 10; b++) {
                    var a = D(b, e);
                    if (a != null ) {
                        w(b, a)
                    }
                }
            }
        }
        ;
    if (u != null ) {
        $("#preloadAdvsData").data("advsData", u);
        v()
    }
}
;
YHD.HomePage.initAjaxReplaceAdvertise = function() {
    var w = $("#ajaxReplaceAdvCodesData2");
    var t = w ? w.val() : "";
    var y = t ? t.split(",") : [];
    var r = (typeof currSiteId == "undefined") ? 1 : currSiteId;
    var o = $.cookie("provinceId");
    var q = "";
    var v = function(f, a) {
            var d = null ;
            var g = f.sourceList;
            var e = g != null  ? g : [];
            for (var b = 0; b < e.length; b++) {
                var c = e[b];
                if (c && c.advertiseRegionalCode == a) {
                    d = c;
                    d.regionId = c.advertiseRegionalId;
                    d.adBgColor = c.reserved;
                    d.text = c.displayContent;
                    d.nameSubtitle = c.displayTitle;
                    d.landingPage = c.linkUrl;
                    d.tc = c.tc;
                    if (isWidescreen) {
                        d.commonScreenImgUrl = c.imageUrlWide
                    } else {
                        d.commonScreenImgUrl = c.imageUrl
                    }
                    break
                }
            }
            return d
        }
        ;
    var u = function(c, a) {
            if (c.attr("data-done") == "1") {
                return
            }
            var b = a.tc;
            var d = a.tc_ext;
            if (b) {
                c.attr("data-tc", b + ".1");
                if (d) {
                    c.attr("data-tce", d)
                }
            }
            c.attr("href", a.landingPage).attr("title", a.text).attr("data-done", "1").attr("data-ref", a.ref);
            $("h3", c).text(a.text);
            $("h4", c).text(a.nameSubtitle)
        }
        ;
    var s = function(a, b) {
            if (a.attr("data-done") == "1") {
                return
            }
            a.attr("alt", b.text).attr("src", b.commonScreenImgUrl).attr("data-done", "1");
            if (a.attr("shortimg") != null ) {
                a.attr("shortimg", loli.util.hashImgUrl(b.commonScreenImgUrl))
            }
            if (a.attr("wideimg") != null ) {
                a.attr("wideimg", loli.util.hashImgUrl(b.commonScreenImgUrl))
            }
            if (a.attr("si") != null ) {
                a.attr("si", loli.util.hashImgUrl(b.commonScreenImgUrl))
            }
            if (a.attr("wi") != null ) {
                a.attr("wi", loli.util.hashImgUrl(b.commonScreenImgUrl))
            }
            if (a.attr("original") != null ) {
                a.attr("original", loli.util.hashImgUrl(b.commonScreenImgUrl))
            }
        }
        ;
    var A = function() {
            if (y.length > 0) {
                z()
            }
        }
        ;
    function z() {
        var b = w.data("advsData");
        var a = w.data("doneAdvCodes") != null  ? w.data("doneAdvCodes").split(",") : [];
        if (b != null ) {
            for (var e = 0; e < y.length; e++) {
                var h = v(b, y[e]);
                var d = false;
                for (var f = 0; f < a.length; f++) {
                    if (a[f] == y[e]) {
                        d = true;
                        break
                    }
                }
                if (!d && h != null ) {
                    var i = $("body a[data-advId=" + h.regionId + "]");
                    var c = $("body img[data-advId=" + h.regionId + "]");
                    if (i.size() > 0) {
                        for (var g = 0; g < i.size(); g++) {
                            u(i.eq(g), h);
                            s(c.eq(g), h)
                        }
                        a.push(y[e]);
                        w.data("doneAdvCodes", a.join(","))
                    }
                }
            }
        }
    }
    var B = function(b) {
            var a = $("#chuchuang_banner_top,#index_chuchuang,#loucengBanner");
            if (b) {
                a = $(b)
            }
            a.find("a[data-nsf='1']").each(function() {
                var e = $(this).parent();
                var d = $(this);
                if (d.attr("data-nsf") == "1" && d.attr("data-ajax") == "2" && d.attr("data-done") != "1") {
                    d.remove();
                    if (e.attr("data-singlemodule") == 1) {
                        e.remove()
                    } else {
                        if (e.hasClass("img_box")) {
                            var c = e.children().length;
                            if (c == 0) {
                                e.next(".trig_box").find("li>a").remove()
                            } else {
                                e.next(".trig_box").find("li>a:gt(" + (c - 1) + ")").remove()
                            }
                        }
                    }
                }
            })
        }
        ;
    var p = function(g, b, e) {
            var a = $.cookie("yihaodian_uid");
            var c = "http://gemini.yhd.com/libraService/exactNormalAdServe?callback=?";
            var d = jQuery.cookie("guid");
            var f = {
                mcSiteId: r,
                provinceId: o,
                codes: g,
                categoryIds: b,
                guId: d,
                userId: a
            };
            $.getJSON(c, f, function(j) {
                if (j && j.status == 1) {
                    var i = j.value;
                    if (i) {
                        var h = w.data("advsData");
                        if (h == null ) {
                            w.data("advsData", i)
                        } else {
                            h = $.extend(h, i);
                            w.data("advsData", h)
                        }
                        z()
                    }
                }
                if (e) {
                    B()
                }
            })
        }
        ;
    YHD.HomePage.runAjaxReplaceAdvertise = A;
    YHD.HomePage.delBlankAjaxAD = function(a) {
        B(a)
    }
    ;
    var x = function() {
            var c = false;
            var a = [];
            for (var b = 0; b < y.length; b++) {
                a.push(y[b]);
                if (b == y.length - 1) {
                    c = true
                }
                if (a.length >= 20) {
                    p(a.join(","), q, c);
                    a = []
                }
            }
            if (a.length > 0) {
                p(a.join(","), q, c)
            }
        }
        ;
    x()
}
;
YHD.HomePage.initLunbo = function() {
    if ($("#index_menu_carousel>ol>li").size() == 0) {
        return
    }
    var n = $("#promo_show");
    var j = $("#index_menu_carousel");
    var k = $("#lunboNum");
    var o = function() {
            if (!j.data("loaded")) {
                j.data("loaded", 1);
                var c = j.attr("data-init") != "" ? j.attr("data-init") : 0;
                var d = $("#index_menu_carousel>ol>li:eq(" + c + ")");
                var a = $("img", d);
                var b = j.attr("lunboBackgroudFlag");
                if (b == "1") {
                    $("#index_menu_carousel>ol>li").each(function() {
                        $(this).css("backgroundColor", $(this).attr("data-bgcolor"))
                    })
                }
                j.lazyImg({
                    indexLoad: true,
                    wideAttr: isWidescreen ? "wi" : "si"
                });
                d.show();
                k.show();
                k.delegate("li", "mouseover", function() {
                    var f = $(this).attr("flag");
                    var e = "lunbo_tab_" + f;
                    gotracker("2", e)
                });
                i(c);
                m(d)
            }
        }
        ;
    if (typeof lunboAjaxReplaceAdvCodes != "undefined" && lunboAjaxReplaceAdvCodes != "") {
        if (n.attr("data-ajax-done") != "1") {
            setTimeout(function() {
                o()
            }, 2000)
        } else {
            o()
        }
    } else {
        setTimeout(function() {
            o()
        }, 2000)
    }
    function p(a, c) {
        a = $(a);
        var b = l();
        var d = a.attr(b);
        if (d) {
            a.load(function() {
                var e = a.data("callbackFlag");
                if (c && !e) {
                    c.call(this);
                    a.data("callbackFlag", 1)
                }
            });
            a.attr("src", d);
            a.removeAttr(b)
        }
    }
    function l() {
        var a = "si";
        if (window.isWidescreen) {
            a = "wi"
        }
        return a
    }
    function i(a) {
        var b = new Switchable({
            container: "#promo_show",
            content: ".promo_wrapper ol",
            trigger: ".mod_promonum_show ol",
            effect: "fade",
            activeClass: "cur",
            interval: 4000,
            autoPlay: true,
            pageButton: [".show_pre", ".show_next"],
            index: a
        });
        b.on("cutover", function(c) {
            var d = $("#index_menu_carousel>ol>li:eq(" + c + ")");
            m(d)
        })
    }
    function m(c) {
        var a = jQuery.cookie("provinceId");
        if (!a) {
            a = 0
        }
        if (a != 0) {
            var d = c.find("a");
            var b = [];
            b.push(d);
            require(["base_observer"], function(e) {
                e.fire("adContentTrackerEvent", b)
            })
        }
        if (typeof (extTracker) === "object") {
            extTracker.sendTrackByTrigger(c)
        }
    }
}
;
YHD.HomePage.selectionActivity = function() {
    function k(e) {
        if (!loli.util || !loli.util.url || !loli.util.url.deleteParams) {
            return e
        }
        var d = [];
        $("#slider a,#topCurtain a").each(function(f, p) {
            if (p.href) {
                var o = loli.util.url.deleteParams(p.href, ["tp", "tc", "ti"]);
                d.push(o)
            }
        });
        var c = [];
        for (var b = 0; b < e.length; b++) {
            var a = e[b];
            if (a.linkUrl && !loli.util.isExistArray(d, a.linkUrl)) {
                c.push(a)
            }
        }
        return c
    }
    function g(c) {
        var b = [];
        for (var a = 0; a < c.length; a++) {
            var d = c[a];
            if (d.imageUrl) {
                b.push(d)
            }
        }
        return b
    }
    function h(d) {
        var b = d.match(/\d+/g);
        if (!b || b.length == 0) {
            return d
        }
        var a = d.split("");
        var e = 0;
        for (var c = 0; c < a.length; c++) {
            if (isNaN(a[c])) {
                if (c > 0 && e == 1) {
                    if (a[c] != "." || isNaN(a[c + 1])) {
                        a[c] = "</em>" + a[c];
                        e = 0
                    }
                }
            } else {
                if (e != 1) {
                    a[c] = "<em>" + a[c];
                    e = 1
                }
            }
        }
        if (e == 1) {
            a[a.length] = "</em>"
        }
        return a.join("")
    }
    var i = function(a) {
            var c = a.sourceList;
            c = g(c);
            if (c.length > 8) {
                c = k(c)
            }
            var q = c.length;
            if (q < 4) {
                $("#selectActivityWrap").hide();
                return
            }
            if (q < 8) {
                q = 4
            }
            var s = [];
            var r = 0;
            for (var t = 0; t < q; t++) {
                var e = c[t];
                r++;
                if (r > 8) {
                    break
                }
                var f = e.displayContent;
                try {
                    f = h(e.displayContent)
                } catch (b) {}
                var d = loli.webp(e.imageUrl);
                s.push('<li style="width:auto;">');
                s.push('<a href="' + e.linkUrl + '" class="clearfix" data-recordtracker="1" target="_blank" data-tc="' + e.tc + '" data-tce="' + (e.tc_ext || "") + '">');
                if (e.activityType == 2) {
                    s.push('<div class="activ_left' + (t % 4 == 0 ? " no_boder_left" : "") + '">');
                    s.push("<p>" + e.name + "</p>");
                    s.push("<b>" + f + "</b>");
                    s.push("</div>");
                    s.push('<img width="120" height="150" src="' + getProductPicByDefaultPic(d, 120, 150) + '" alt="' + e.name + '"/>')
                } else {
                    s.push('<div class="activ_left' + (t % 4 == 0 ? " no_boder_left" : "") + '">');
                    s.push("<p>" + e.name + "</p>");
                    s.push("<b>" + e.displayTitle + "</b>");
                    s.push("<b>" + f + "</b>");
                    s.push("</div>");
                    s.push('<img width="120" height="150" src="' + d + '" alt="' + e.name + '"/>')
                }
                s.push("</a>");
                s.push("</li>")
            }
            $("#selectActivity").append(s.join(""));
            l()
        }
        ;
    var j = function() {
            var a = $.cookie("yihaodian_uid");
            var b = "http://gemini.yhd.com/libraService/exactNormalAdServe?callback=?";
            var c = $.cookie("guid");
            var d = $.cookie("provinceId") || 1;
            var e = {
                mcSiteId: 1,
                provinceId: d,
                codes: "INDEX2_LBXF_JZH_MR",
                categoryIds: "",
                guId: c,
                userId: a
            };
            $.ajax({
                url: b,
                dataType: "jsonp",
                data: e,
                jsonpCallback: "getActivityAdHander",
                success: function(f) {
                    if (f && f.status == 1) {
                        var n = f.value;
                        if (n && n.sourceList && n.sourceList.length > 0) {
                            i(n)
                        } else {
                            $("#selectActivityWrap").hide()
                        }
                    } else {
                        $("#selectActivityWrap").hide()
                    }
                },
                error: function(n, f) {
                    $("#selectActivityWrap").hide()
                }
            })
        }
        ;
    function l() {
        var r = $("#selectActivityWrap");
        var e = $("a.prev_btn", r);
        var q = $("a.next_btn", r);
        var d = r.find("div.selection_activity_list ul");
        var p = r.find("div.selection_activity_list").width();
        var a = $("div.selection_activity_list li", r).size();
        var b = 4;
        var f = (a % b == 0) ? Math.floor(a / b) : Math.floor(a / b) + 1;
        var c = 1;
        if (f > 1) {
            e.click(function() {
                if (c > 1) {
                    d.animate({
                        left: "-" + (c - 2) * p + "px"
                    }, function() {
                        c--;
                        if (c < f) {
                            q.show()
                        }
                        if (c == 1) {
                            e.hide()
                        }
                    })
                } else {
                    e.hide();
                    q.show()
                }
            });
            q.click(function() {
                if (c < f) {
                    d.animate({
                        left: "-" + (c) * p + "px"
                    }, function() {
                        c++;
                        if (c > 1) {
                            e.show()
                        }
                        if (c == f) {
                            q.hide()
                        }
                    })
                } else {
                    e.show();
                    q.hide()
                }
            })
        }
        r.hover(function() {
            if (c < f) {
                q.show()
            } else {
                q.hide()
            }
            if (c == 1) {
                e.hide()
            } else {
                e.show()
            }
        }, function() {
            e.hide();
            q.hide()
        });
        YHD.HomePage.Tools.touchEvent(r, function(m) {
            if (m == "right") {
                if (c > 1) {
                    d.animate({
                        left: "-" + (c - 2) * p + "px"
                    }, function() {
                        c--
                    })
                }
            }
            if (m == "left") {
                if (c < f) {
                    d.animate({
                        left: "-" + (c) * p + "px"
                    }, function() {
                        c++
                    })
                }
            }
        })
    }
    if ($("#selectActivityWrap").length > 0) {
        j()
    }
}
;
YHD.HomePage.initChuchuang = function() {
    $("#chuchuang_banner_top img").each(function() {
        var a = $(this).attr(isWidescreen ? "wideimg" : "shortimg");
        if (a) {
            $(this).attr("src", a)
        }
    });
    var b = $("#index_chuchuang");
    if (b.size() == 0) {
        return
    }
    $(".small_pic a", b).hover(function() {
        $(this).find("img").stop().animate({
            "margin-left": -10
        }, 300)
    }, function() {
        $(this).find("img").stop().animate({
            "margin-left": 0
        }, 300)
    });
    b.lazyImg({
        indexLoad: true
    })
}
;
YHD.HomePage.initFloorBanner = function() {
    $("#loucengBanner img").each(function() {
        var b = $(this).attr(isWidescreen ? "wideimg" : "shortimg");
        if (b) {
            $(this).attr("src", b)
        }
    })
}
;
YHD.HomePage.sliderIndexAd = function(c) {
    function d(D) {
        if (!D || D.size() == 0) {
            return
        }
        var u = D.find(".img_box");
        var r = D.find(".trig_box li");
        var t = u.children();
        var z = r.children();
        var w = t.length;
        var s = t.eq(0).width();
        var C = 0;
        var B = 0;
        var A = 5000;
        if (w <= 1) {
            D.find(".trig_box").hide();
            return
        }
        u.find("a").attr("data-mrt", 1);
        D.find(".trig_box li a:gt(0) span").width(0);
        z.bind("mouseenter", function() {
            C = $(this).index();
            y();
            x();
            require(["base_observer"], function(e) {
                e.fire("impressionEvent", u.find("a").eq(C))
            })
        });
        D.bind({
            mouseenter: function() {
                clearInterval(B);
                x()
            },
            mouseleave: function() {
                a();
                v()
            }
        });
        function y() {
            u.stop().animate({
                left: -C * s
            });
            z.removeClass("cur").eq(C).addClass("cur");
            u.find("a").attr("data-mrt", 1).eq(C).attr("data-mrt", 0);
            if (loli.isVisual(u.find("a").eq(C)[0])) {
                require(["base_observer"], function(e) {
                    e.fire("impressionEvent", u.find("a").eq(C))
                })
            }
        }
        function a() {
            B = setInterval(function() {
                C++;
                if (C > w - 1) {
                    C = 0
                }
                y();
                v()
            }, A)
        }
        function v() {
            var e = D.find(".trig_box li a.cur");
            D.find(".trig_box li a span").stop().css("width", 0);
            e.find("span").width(0).animate({
                width: "30px"
            }, A, function() {
                $(this).width(0)
            })
        }
        function x() {
            var e = D.find(".trig_box li a.cur");
            D.find(".trig_box li a span").stop().css("width", 0);
            e.find("span").stop().width("100%")
        }
        function b() {
            clearInterval(B);
            x();
            a();
            v()
        }
        YHD.HomePage.Tools.touchEvent(D, function(e) {
            if (e == "right") {
                C--;
                if (C < 0) {
                    C = w - 1
                }
                y();
                b()
            }
            if (e == "left") {
                C++;
                if (C > w - 1) {
                    C = 0
                }
                y();
                b()
            }
        });
        a();
        v()
    }
    d(c)
}
;
YHD.HomePage.sliderFloorTab = function() {
    $(".sg_tabcontent").delegate(".sg_banner", "mouseenter", function() {
        $(this).addClass("sg_cur")
    });
    $(".sg_tabcontent").delegate(".sg_banner", "mouseleave", function() {
        $(this).removeClass("sg_cur")
    });
    $(".sg_tab").delegate("li", "mouseenter", function() {
        var a = $("li", ".sg_tab").index(this);
        $(this).addClass("cur").siblings("li").removeClass("cur");
        $(".tab_arrow").stop().animate({
            left: 30 + 68 * a
        });
        $(".sg_tabcontent").eq(a).show().siblings(".sg_tabcontent").hide();
        $(".sg_tabcontent").eq(a).lazyImg({
            indexLoad: true
        })
    });
    var c = $("li", ".sg_tab").length;
    var d = null ;
    $(".sgwrap").hover(function() {
        clearInterval(d)
    }, function() {
        d = setInterval(function() {
            var a = $("li", ".sg_tab").index($("li.cur", ".sg_tab"));
            a < c - 1 ? a++ : a = 0;
            $("li", ".sg_tab").eq(a).addClass("cur").siblings("li").removeClass("cur");
            $(".tab_arrow").stop().animate({
                left: 30 + 68 * a
            });
            $(".sg_tabcontent").eq(a).show().siblings(".sg_tabcontent").hide();
            $(".sg_tabcontent").eq(a).lazyImg({
                indexLoad: true
            })
        }, 8000)
    }).trigger("mouseout")
}
;
YHD.HomePage.sliderFloorNav = function() {
    var m = loli.util.isIpad();
    if (m) {
        return
    }
    var r = loli.util.isIE() && loli.util.isIE() <= 6;
    var p = $(window).height();
    if (r) {
        $(".floor_left_box").css("top", p - $(".floor_left_box").height() - 100)
    }
    $(window).scroll(function() {
        var b = $(this).scrollTop();
        if (r) {
            var a = b + $(window).height() - $(".floor_left_box").height() - 100;
            $(".floor_left_box").css("top", a)
        }
    });
    var n = $(".mod_index_floor");
    var q = $(".floor_left_box");
    var f = [];
    var l = 0;
    var k = q.find("a");
    function o() {
        f = [];
        for (var a = 0; a < n.length; a++) {
            f.push(n.eq(a).offset().top)
        }
    }
    q.delegate("a", "click", function() {
        o();
        l = $(this).index();
        $("body,html").stop().animate({
            scrollTop: f[l] - 60
        })
    });
    $(window).scroll(function() {
        var a = $(".ft_service_link").offset().top - 60;
        var b = $(window).scrollTop();
        o();
        if (b < f[0] - 200 || b > a) {
            q.fadeOut();
            k.removeClass("cur")
        } else {
            q.fadeIn()
        }
        if (b > f[l]) {
            l++
        }
        if (b < f[l - 1]) {
            l--
        }
        k.eq(l).addClass("cur").siblings().removeClass("cur");
        $(".floor_subtitle_wrap", ".mod_floor_title").removeClass("floor_subtitle_cur");
        $(".mod_floor_title").eq(l).find(".floor_subtitle_wrap").addClass("floor_subtitle_cur")
    })
}
;
YHD.HomePage.sliderBrand = function(c) {
    function d(s) {
        if (!s || s.size() == 0) {
            return
        }
        var b = s.find(".img_box ul");
        var r = s.find(".img_box li");
        var t = s.find(".btn_prev");
        var x = s.find(".btn_next");
        var A = r.length;
        var B = 1;
        var z = 0;
        var y = 5000;
        var q = r.eq(0).width();
        var v = r.eq(0).clone();
        var u = r.eq(A - 1).clone();
        r.eq(0).before(u);
        r.eq(A - 1).after(v);
        b.css("left", -q);
        if (A > 1) {
            t.click(function() {
                B--;
                if (B < 0) {
                    B = A;
                    b.css({
                        left: -B * q
                    });
                    B = A - 1
                }
                w()
            });
            x.click(function() {
                B++;
                if (B > A) {
                    B = 0;
                    b.css({
                        left: -B * q
                    });
                    B = 1
                }
                w()
            });
            function w() {
                b.stop().animate({
                    left: -B * q
                })
            }
            function a() {
                z = setInterval(function() {
                    B++;
                    if (B > A) {
                        B = 0;
                        b.css({
                            left: -B * q
                        });
                        B = 1
                    }
                    w()
                }, y)
            }
            a();
            s.bind({
                mouseover: function() {
                    clearInterval(z)
                },
                mouseout: function() {
                    a()
                }
            })
        }
    }
    d(c)
}
;
YHD.HomePage.loadWalmartAdv = function() {
    var f = $.cookie("provinceId");
    if (f != 20) {
        return
    }
    var h = URLPrefix.central + "/homepage/ajaxFindWalmartAdv.do?callback=?";
    var e = function(b) {
            if (b) {
                var c = b.INDEX2_WALMART_LPIC_DEFAULT;
                var a = c != null  ? c[0] : null ;
                if (a) {
                    $("#floorCustom_INDEX2_FLOOR7 div.d_con a").attr("data-ref", a.perTracker).attr("href", a.imgJumpLinkUrl).attr("title", a.name);
                    $("#floorCustom_INDEX2_FLOOR7 div.d_con a img").attr("src", a.imgPath).attr("alt", a.name)
                }
            }
        }
        ;
    var g = {
        currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
        currSiteType: 1,
        provinceId: $.cookie("provinceId")
    };
    $.getJSON(h, g, function(b) {
        if (b) {
            if (b.status == 1) {
                var a = b.data;
                e(a)
            }
        }
    })
}
;
YHD.HomePage.payAjaxAdvFee = function(m) {
    var n = $(m);
    var k = $("a[data-ajax='1']", n);
    var h = [];
    k.each(function(a, c) {
        var b = $(c);
        if (b.attr("data-fee") != "" && b.attr("data-payed") != "1") {
            h.push(b.attr("data-fee"))
        }
    });
    var j = function(a, b) {
            var d = "http://p4p.yhd.com/advdolphin/external/cpmAdService?act=cpmDeduction&callback=?";
            var c = {
                reqAds: a.join(",")
            };
            $.getJSON(d, c, function(e) {
                if (b) {
                    k.each(function(p, g) {
                        var f = $(g);
                        if (f.attr("data-fee") != "" && f.attr("data-payed") != "1") {
                            f.attr("data-payed", "1")
                        }
                    })
                }
            })
        }
        ;
    var l = [];
    for (var i = 0; i < h.length; i++) {
        l.push(h[i]);
        if (i == h.length - 1) {
            sendLastReq = true
        }
        if (l.length >= 20) {
            j(l, sendLastReq);
            l = []
        }
    }
    if (l.length > 0) {
        j(l, sendLastReq)
    }
}
;
YHD.HomePage.loadFirstTabAdv = function() {
    var j = (typeof firstTabAdvFlag != "undefined" && firstTabAdvFlag == "1") ? 1 : 0;
    var l = $.cookie("provinceId");
    var h = $.cookie("yihaodian_uid");
    if (j && l && h) {
        var i = URLPrefix.central + "/homepage/ajaxFindUserTab.do?callback=?";
        var k = function(b) {
                if (b) {
                    var c = b;
                    var a = c != null  ? c[0] : null ;
                    if (a) {
                        $("#global_menu li:first a").attr("data-tcd", "AD." + a.perTracker).attr("data-ref", a.perTracker).attr("href", a.imgJumpLinkUrl).attr("target", "_blank").text(a.name)
                    }
                }
            }
            ;
        var g = {
            currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
            currSiteType: 1,
            provinceId: l,
            userId: h
        };
        $.getJSON(i, g, function(b) {
            if (b && b.status == 1) {
                var a = b.data;
                k(a)
            }
        })
    }
}
;
jQuery(function() {
    YHD.HomePage.initPreloadAdvertise();
    YHD.HomePage.initAjaxReplaceAdvertise();
    YHD.HomePage.init();
    require(["content_tracker_expo"], function() {
        YHD.HomePage.initLunbo()
    });
    YHD.HomePage.selectionActivity();
    YHD.HomePage.initChuchuang();
    YHD.HomePage.initFloorBanner();
    YHD.HomePage.sliderFloorNav();
    scrollToTop();
    YHD.HomePage.vipShow();
    YHD.HomePage.tabHover();
    YHD.HomePage.initIE6UpdateMsg();
    YHD.HomePage.payAjaxAdvFee("#chuchuang_banner_top,#index_chuchuang,#loucengBanner");
    YHD.HomePage.loadFirstTabAdv()
});
$(document).ready(function() {
    require(["content_tracker_expo"], function(b) {
        b.run("adContentTrackerEvent", "ad.dolphin.bidding")
    })
});
if (trackerGetCookie("gla")) {
    trackerContainer.addParameter(new Parameter("attachedInfo",trackerGetCookie("gla")))
}
if (typeof abtestId != "undefined" && abtestId) {
    trackerContainer.addParameter(new Parameter("abtestValue",abtestId))
}
(function(c) {
    var d = window.loli || (window.loli = {});
    d.scroll = function(j, l) {
        var b = "";
        var a = l || 200;
        var i = a - 20;
        c(window).scroll(function() {
            setTimeout(function() {
                k()
            }, a);
            b = new Date().getTime()
        });
        function k() {
            if ((new Date().getTime() - b) >= i) {
                j();
                b = new Date().getTime()
            }
        }
    }
})(jQuery);
(function(a) {
    var c = function(e) {
            var d = e
                , f = {
                lazyImg: {
                    ltime: "2000",
                    lnum: "5",
                    load: true,
                    indexLoad: false,
                    scrollLoad: true,
                    attr: "original",
                    wideAttr: null ,
                    hfix: 100
                }
            };
            a.extend(f, d);
            this.param = f
        }
        ;
    c.prototype = {
        constructor: c,
        isBusy: false,
        doc: document,
        imgArray: [],
        wideAttr: null ,
        lazyImg: function(f, d) {
            var e = this, h = e.param.lazyImg, i, g = f;
            if (d) {
                e.param.lazyImg = a.extend(h, d)
            }
            if (g instanceof a) {
                i = g
            } else {
                if (a.isArray(g)) {
                    g = a(g.join(","))
                } else {
                    g = a(g) || a("body")
                }
            }
            if (h.wideAttr) {
                wideAttr = h.wideAttr;
                e.imgArray = g.find("img[" + h.attr + "],img[" + wideAttr + "]")
            } else {
                e.imgArray = g.find("img[" + h.attr + "]")
            }
            if (h.indexLoad) {
                e._lazyImg(e.imgArray, h)
            }
            if (h.scrollLoad) {
                e._iniLazy(function() {
                    if (e.imgArray.length == 0) {
                        return i
                    }
                    e._lazyImg(e.imgArray, h)
                })
            }
            if (h.load) {
                e._loadImg(g)
            }
            return f
        },
        _loadImg: function(h) {
            var f = this
                , e = f.param.lazyImg
                , d = e.attr
                , i = e.ltime
                , g = e.lnum;
            (function(m, j, l, k, o) {
                var n = setInterval(function() {
                    if (m.isBusy) {
                        return false
                    }
                    var p = m.imgArray;
                    var q = p.length;
                    if (q > o) {
                        m._imgLoad(p, 0, o, l)
                    } else {
                        if (q > 0) {
                            m._imgLoad(p, 0, q, l)
                        } else {
                            clearInterval(n)
                        }
                    }
                }, k)
            })(f, h, d, i, g)
        },
        _lazyImg: function(i, g) {
            var e = g.attr
                , d = i.length
                , k = this
                , h = 0
                , f = 1;
            k.isBusy = true;
            var j = k._pageTop();
            k._imgLoad(k.imgArray, h, d, e, j, g.hfix);
            k.isBusy = false
        },
        _imgLoad: function(n, d, h, l, g, j) {
            var f = this;
            if (g) {
                for (var m = d; m < h; m++) {
                    var o = a(n[m]);
                    var k = jQuery(window).height() + j;
                    if (o.offset().top < (g + j) && (g - o.offset().top) < k) {
                        f._renderImg(o, l);
                        delete n[m]
                    }
                }
            } else {
                for (var m = d; m < h; m++) {
                    var o = a(n[m]);
                    f._renderImg(o, l);
                    delete n[m]
                }
            }
            var e = new Array();
            for (var m = 0; m < n.length; m++) {
                if (n[m] != null ) {
                    e.push(n[m])
                }
            }
            f.imgArray = e
        },
        _renderImg: function(d, f) {
            var e = d;
            if (typeof wideAttr != "undefined" && wideAttr != null  && e.attr(wideAttr)) {
                e.attr("src", loli.webp(e.attr(wideAttr)));
                e.removeAttr(f)
            } else {
                e.attr("src", loli.webp(e.attr(f)));
                e.removeAttr(f)
            }
        },
        _iniLazy: function(d) {
            var e = this;
            loli.delay(window, "scroll", function() {
                if (!e.isBusy) {
                    e.isBusy = true;
                    return true
                } else {
                    return false
                }
            }, function() {
                d()
            }, 50)
        },
        _pageTop: function() {
            var e = this
                , d = e.doc
                , f = d.documentElement;
            return f.clientHeight + Math.max(f.scrollTop, d.body.scrollTop)
        },
        _hashImgUrl: function(d) {
            if (loli && loli.util) {
                return loli.util.hashImgUrl(d)
            }
            return d
        }
    };
    var b = new c();
    a.fn.extend({
        lazyImg: function(e) {
            var d = new c();
            return d.lazyImg(this, e)
        }
    })
})(jQuery);
(function(b) {
    var a = function(d) {
            var f = d
                , c = URLPrefix.busystock ? URLPrefix.busystock : "http://gps.yhd.com"
                , e = "/busystock/restful/truestock";
            _setting = {
                attr: "productid",
                busystock_url: c + e,
                busystockAttr: "productIds",
                lazyLoadDelay: 500,
                priceCounter: 30,
                load: true,
                maxNum: 200,
                oneOffLoad: false,
                indexLoad: false,
                scrollLoad: true,
                hfix: 100,
                callbackHtml: null
            };
            b.extend(_setting, f);
            this.param = _setting
        }
        ;
    a.prototype = {
        constructor: a,
        isBusy: false,
        doc: document,
        priceArray: [],
        lazyPrice: function(d, i) {
            var f = this
                , h = f.param;
            if (i) {
                f.param = b.extend(h, i)
            }
            var c = d
                , g = h.attr
                , j = h.busystock_url
                , e = h.maxNum;
            if (c instanceof b) {
                f.priceArray = d.find("[" + g + "]").get()
            } else {
                if (b.isArray(c)) {
                    f.priceArray = c
                } else {
                    f.priceArray = b(d).find("[" + g + "]").get()
                }
            }
            if (h.oneOffLoad) {
                f._flushPrice(f.priceArray, g, j, h.busystockAttr, e);
                return d
            }
            if (h.indexLoad) {
                f._lazyPrice(f.imgArray, h)
            }
            if (h.scrollLoad) {
                f._iniLazy(function() {
                    if (f.priceArray.length == 0) {
                        return d
                    }
                    f._lazyPrice(f.priceArray, h)
                })
            }
            if (h.load) {
                f._loadPrice()
            }
            return d
        },
        _loadPrice: function() {
            var i = this
                , d = i.param
                , c = d.attr
                , f = d.busystock_url
                , g = d.busystockAttr
                , h = d.maxNum
                , e = d.lazyLoadDelay
                , j = d.priceCounter;
            (function(o, m, n, k, r, q, l) {
                var p = setInterval(function() {
                    if (o.isBusy) {
                        return false
                    }
                    var s = o.priceArray;
                    var t = s.length;
                    if (t > l) {
                        o._priceLoad(s, m, n, k, 0, l, r)
                    } else {
                        if (t > 0) {
                            o._priceLoad(s, m, n, k, 0, t, r)
                        } else {
                            clearInterval(p)
                        }
                    }
                }, q)
            })(i, c, f, g, h, e, j)
        },
        _lazyPrice: function(d, l) {
            var c = l.attr
                , g = d.length
                , j = l.busystock_url
                , i = l.busystockAttr
                , k = l.maxNum
                , e = this
                , f = 0;
            e.isBusy = true;
            var h = e._pageTop() + l.hfix;
            e._priceLoad(d, c, j, i, f, g, k, h);
            e.isBusy = false
        },
        _priceLoad: function(e, o, c, n, p, k, d, l) {
            var g = this
                , j = e.length;
            if (j == 0) {
                return
            }
            var f = new Array();
            if (l) {
                for (var h = p; h < k; h++) {
                    var m = b(e[h]);
                    if (m.offset().top < l) {
                        f.push(m);
                        delete e[h]
                    }
                }
            } else {
                for (var h = p; h < k; h++) {
                    var m = b(e[h]);
                    f.push(m);
                    delete e[h]
                }
            }
            g._flushPrice(f, o, c, n, d);
            var q = new Array();
            for (var h = 0; h < e.length; h++) {
                if (e[h] != null ) {
                    q.push(e[h])
                }
            }
            g.priceArray = q
        },
        _iniLazy: function(c) {
            var d = this;
            window.scrollTo(0, 0);
            b(window).bind("scroll", function() {
                if (!d.isBusy) {
                    c()
                } else {}
            })
        },
        _pageTop: function() {
            var d = this
                , c = d.doc
                , e = c.documentElement;
            return e.clientHeight + Math.max(e.scrollTop, c.body.scrollTop)
        },
        _flushPrice: function(c, p, o, t, s) {
            var r = this
                , w = r.param
                , q = w.callbackHtml;
            if (c && c.length > 0) {
                var m = c.length, v = 0, x, n = 1;
                if (m < s) {
                    x = m
                } else {
                    n = (m - 1) / s + 1
                }
                var k = jQuery.cookie("provinceId");
                if (!k) {
                    return
                }
                var h = "?mcsite=" + currBsSiteId + "&provinceId=" + k;
                var l = {};
                for (var f = 0; f < n; f++) {
                    if (f > 0) {
                        v = s * f;
                        x = v + s;
                        if (x > m) {
                            x = m
                        }
                    }
                    l = {};
                    for (var g = v; g < x; g++) {
                        var d = jQuery(c[g]);
                        h += "&" + t + "=" + d.attr(p);
                        if (!l[d.attr(p)]) {
                            l[d.attr(p)] = []
                        }
                        l[d.attr(p)].push(d)
                    }
                    try {
                        jQuery.getJSON(o + h + "&callback=?", function(e) {
                            if (e == null  || e == "") {
                                return
                            }
                            jQuery.each(e, function(i, j) {
                                var y = l[j.productId];
                                if (y) {
                                    jQuery.each(y, function(A, z) {
                                        if (q) {
                                            jQuery(z).html(q(j, z)).removeAttr(p)
                                        } else {
                                            if (currSiteId == 2) {
                                                jQuery(z).text("¥" + j.productPrice).removeAttr(p)
                                            } else {
                                                if (y) {
                                                    if (globalShowMarketPrice == 1) {
                                                        var B = "<strong>¥" + j.productPrice + "</strong>";
                                                        B += "<del>¥" + j.marketPrice + "</del>";
                                                        jQuery(z).html(B).removeAttr(p)
                                                    } else {
                                                        var B = "<strong>¥" + j.productPrice + "</strong>";
                                                        if (j.curPriceType && j.curPriceType == 2 && j.yhdPrice) {
                                                            B += "<del>¥" + j.yhdPrice + "</del>"
                                                        }
                                                        jQuery(z).html(B).removeAttr(p)
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            })
                        })
                    } catch (u) {}
                }
            }
        }
    };
    b.fn.extend({
        lazyPrice: function(d) {
            var c = new a();
            return c.lazyPrice(this, d)
        }
    })
})(jQuery);
(function(b) {
    var a = function(d) {
            var c = d
                , e = {
                activeLoadTime: 2000,
                load: true,
                activeLoadNum: 1,
                hfix: 100,
                callback: null ,
                attr: "lazyLoad_textarea",
                flushPrice: true,
                flushPriceAttr: "productid",
                indexLoad: false,
                scrollLoad: true
            };
            b.extend(e, c);
            this.param = e
        }
        ;
    a.prototype = {
        constructor: a,
        doc: document,
        areaArray: [],
        lazyDom: function(d, c) {
            var f = this
                , g = f.param
                , e = d;
            if (c) {
                f.param = b.extend(g, c)
            }
            f.areaArray = f._getJqueryDomArray(e, g);
            if (g.indexLoad) {
                f._domScrollLoad(f.areaArray, g)
            }
            if (g.scrollLoad) {
                f._loadScrollDom(function() {
                    if (f.areaArray.length == 0) {
                        return
                    }
                    f._domScrollLoad(f.areaArray, g)
                })
            }
            if (g.load) {
                f._loadActiveDom(f.areaArray, g)
            }
        },
        _loadActiveDom: function(d, f) {
            var g = this
                , h = f
                , c = h.activeLoadTime
                , i = d;
            var e = setInterval(function() {
                var j = i.length;
                if (j == 0) {
                    clearInterval(e);
                    return
                }
                g._domActiveLoad(i, h)
            }, c)
        },
        _loadScrollDom: function(c) {
            loli.scroll(function() {
                c()
            }, 50)
        },
        _domScrollLoad: function(d, j) {
            var g = this
                , j = g.param
                , h = [];
            for (var c = 0, f = d.length; c < f; c++) {
                var e = g._getJqueryDom(d[c]);
                if (g.isInCurrScreen(e)) {
                    g._rendDom(e, j)
                } else {
                    h.push(e)
                }
            }
            g.areaArray = h
        },
        _domActiveLoad: function(j, d) {
            var f = this
                , c = d
                , g = j
                , k = g.length
                , h = Math.min(c.activeLoadNum, k);
            for (var e = 0; e < h; e++) {
                f._rendDom(f._getJqueryDom(g.shift()), c)
            }
        },
        _rendDom: function(k, d) {
            var i = k
                , f = d
                , e = f.attr
                , h = i.attr(e)
                , j = b("#" + h)
                , g = f.flushPrice
                , c = f.flushPriceAttr;
            if (j.size() > 0) {
                i.html(j.val())
            }
            i.removeAttr(e);
            if (g) {
                i.lazyPrice({
                    attr: c,
                    oneOffLoad: true
                })
            }
            if (f.callback) {
                f.callback.call(i)
            }
        },
        isInCurrScreen: function(f) {
            var h = this
                , i = f
                , c = h.doc
                , j = c.documentElement
                , g = h.param
                , d = g.hfix
                , e = Math.max(j.scrollTop, c.body.scrollTop)
                , k = j.clientHeight + e;
            if (i) {
                return (i.offset().top < k + d) && (i.offset().top > e - d)
            }
            return false
        },
        _getJqueryDomArray: function(d, c) {
            var e = []
                , f = c.attr;
            if (d instanceof b) {
                e = d.find("[" + f + "]").get()
            } else {
                if (b.isArray(d)) {
                    e = d;
                    return e
                } else {
                    d = b(d);
                    e = d.find("[" + f + "]").get()
                }
            }
            if (e.length == 0) {
                if (d.attr(f)) {
                    e.push(d)
                }
            }
            return e
        },
        _getJqueryDom: function(c) {
            if (!c) {
                return c
            }
            if (c instanceof b) {
                return c
            }
            return b(c)
        }
    };
    b.fn.extend({
        lazyDom: function(d) {
            var c = new a();
            return c.lazyDom(this, d)
        }
    })
})(jQuery);
jQuery(function() {
    jQuery("body").lazyImg({
        indexLoad: true,
        load: false,
        wideAttr: isWidescreen ? "wideimg" : "shortimg"
    });
    jQuery("#needLazyLoad").lazyDom({
        load: false,
        hfix: 500,
        flushPrice: false,
        indexLoad: true,
        callback: function() {
            var f = $(this);
            YHD.HomePage.runAjaxReplaceAdvertise();
            YHD.HomePage.delBlankAjaxAD("#needLazyLoad");
            f.find("img").each(function() {
                var a = $(this).attr("original");
                if (a) {
                    if (loli.webp) {
                        a = loli.webp(a)
                    }
                    $(this).attr("src", a).removeAttr("original")
                }
            });
            var e = f.find("div.slider_index_ad");
            YHD.HomePage.sliderIndexAd(e);
            var d = f.find("div.brands");
            YHD.HomePage.sliderBrand(d);
            if (f.attr("id") == "floorShan") {
                YHD.HomePage.sliderFloorTab();
                getShanData("#floorShan")
            }
            if (f.attr("id") == "floorGroup") {
                reflushGrouponData("#floorGroup");
                getGrouponBrandData("#floorGroup");
                getAjaxProductPrice("#floorGroup")
            }
            if (f.attr("id") == "floor3c") {
                getAjaxProductPrice("#floor3c")
            }
            if (f.attr("id") == "floorCustom_INDEX2_FLOOR7") {
                YHD.HomePage.loadWalmartAdv()
            }
            YHD.HomePage.payAjaxAdvFee(f);
            require(["content_tracker_expo"], function(a) {
                a.run("adContentTrackerEvent", "ad.dolphin.bidding")
            })
        }
    })
});
function addTrackerToEvent(a, b) {
    var c = "tk";
    if (b) {
        c = b
    }
    if (a instanceof jQuery) {
        a.find("a[" + c + "]").click(function() {
            var e = $(this)
                , d = e.attr(c);
            if (d) {
                addTrackPositionToCookie("1", d)
            }
        })
    } else {
        $(a + " a[" + c + "]").each(function(d) {
            var e = this;
            $(e).click(function() {
                addTrackPositionToCookie("1", $(e).attr(c))
            })
        })
    }
}
var yhdHead = window.yhdHead = window.yhdHead || {};
yhdHead.topMenuImgLazyLoad = function() {
    jQuery("#wideScreenTabShowID li img").each(function() {
        jQuery(this).attr("src", function() {
            return jQuery(this).attr("original")
        }).removeAttr("original")
    });
    jQuery("#allCategoryHeader ul li h3 img").each(function() {
        jQuery(this).attr("src", function() {
            return jQuery(this).attr("original")
        }).removeAttr("original")
    })
}
;
yhdHead.newTopTabShow = function(b, a) {
    if (b > a) {
        jQuery("#wideScreenTabShowID li").each(function(c) {
            if (c == a - 1) {
                jQuery(this).addClass("kf")
            }
            if (c > a - 1) {
                jQuery(this).remove()
            }
        })
    }
}
;
yhdHead.oldTopTabShow = function(b, a) {
    if (b > a) {
        jQuery("#global_menu span").each(function(c) {
            if (c > a - 1) {
                jQuery(this).remove()
            }
        })
    }
}
;
yhdHead.dealWideNarrowScreen = function() {
    var c = typeof isWidescreen != "undefined" ? isWidescreen : false;
    if (currSiteId == 1) {
        var b = jQuery("#wideScreenTabShowID li").length;
        var a = jQuery("#global_menu span").length;
        if (!c) {
            yhdHead.newTopTabShow(b, 10);
            yhdHead.oldTopTabShow(a, 7)
        } else {
            if (isIndex) {
                if (isIndex == 1) {
                    yhdHead.newTopTabShow(b, 10)
                } else {
                    yhdHead.newTopTabShow(b, 10)
                }
            } else {
                yhdHead.newTopTabShow(b, 10)
            }
            yhdHead.oldTopTabShow(a, 7)
        }
    }
}
;
yhdHead.topMenuTrackInit = function() {
    jQuery("#wideScreenTabShowID li a[tk]").click(function() {
        var b = $(this)
            , a = b.attr("tk");
        if (a) {
            addTrackPositionToCookie("1", a)
        }
    });
    jQuery("#global_menu span a[tk]").click(function() {
        var b = $(this)
            , a = b.attr("tk");
        if (a) {
            addTrackPositionToCookie("1", a)
        }
    })
}
;
jQuery(function() {
    yhdHead.topMenuImgLazyLoad();
    yhdHead.topMenuTrackInit()
});
jQuery(function() {
    var b = location.search;
    if (b.indexOf("isAdvStatistics=1") > -1 && b.indexOf("advParams=") > -1) {
        $.getScript("http://adbackend.yihaodian.com/js/adv/advertising.js", function() {
            var d = document.createElement("link");
            d.type = "text/css";
            d.rel = "stylesheet";
            d.href = "http://adbackend.yihaodian.com/css/adv/tk.css";
            var a = document.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(d, a)
        })
    }
});
var returnUrl = document.location.href;
var yhdPublicLogin = yhdPublicLogin || {};
var URLPrefix_passport = URLPrefix.passport;
yhdPublicLogin.checkLogin = function() {
    if (yhdPublicLogin.getCookie("ut")) {
        return true
    } else {
        return false
    }
}
;
yhdPublicLogin.getCookie = function(f) {
    var e = document.cookie.split(";");
    for (var g = 0; g < e.length; g++) {
        var h = e[g].split("=");
        if (h[0].replace(/(^\s*)|(\s*$)/g, "") == f) {
            return h[1]
        }
    }
    return ""
}
;
yhdPublicLogin.loadCssAndJs = function(h, f) {
    var e = "";
    var g = 0;
    if (typeof currVersionNum != "undefined") {
        g = currVersionNum
    }
    if (f == "js") {
        e = document.createElement("script");
        e.setAttribute("type", "text/javascript");
        e.setAttribute("charset", "UTF-8");
        e.setAttribute("src", h + "?" + g)
    } else {
        if (f == "css") {
            e = document.createElement("link");
            e.setAttribute("rel", "stylesheet");
            e.setAttribute("type", "text/css");
            e.setAttribute("href", h + "?" + g)
        }
    }
    if (typeof e != "undefined") {
        document.getElementsByTagName("head")[0].appendChild(e)
    }
}
;
yhdPublicLogin.showLoginDiv = function(q, o, m) {
    if (o && yhdPublicLogin.checkLogin()) {
        return
    }
    if (q) {
        var p = "";
        if (q.toLowerCase().indexOf("http") < 0) {
            var k = window.location.protocol;
            var j = window.location.host;
            var l = k + "//" + j;
            p = l
        }
        var r = p + q;
        returnUrl = r
    }
    try {
        passportLoginFrame(URLPrefix_passport, null , function(b) {
            try {
                if (returnUrl) {
                    window.location.href = returnUrl
                } else {
                    window.location.reload(true)
                }
            } catch (a) {}
        }, m)
    } catch (n) {}
}
;
yhdPublicLogin.showLoginDivNone = function(e, l, i, j, h) {
    if (l && yhdPublicLogin.checkLogin()) {
        return
    }
    try {
        passportLoginFrame(e, i, j, h)
    } catch (k) {}
}
;
yhdPublicLogin.showTopLoginInfo = function() {
    try {
        writeHeaderContent()
    } catch (b) {}
}
;
jQuery(document).ready(function() {
    var b = "";
    if (URLPrefix && URLPrefix.statics) {
        b = URLPrefix.statics
    } else {
        if (currSiteId && currSiteId == 2) {
            b = "http://image.111.com.cn/statics"
        } else {
            b = "http://image.yihaodianimg.com/statics"
        }
    }
    yhdPublicLogin.loadCssAndJs(b + "/global/css/global_yhdLib.css", "css");
    yhdPublicLogin.loadCssAndJs(b + "/global/js/global_yhdLib.js", "js");
    yhdPublicLogin.loadCssAndJs(URLPrefix_passport + "/front-passport/passport/js/login_frame_client.js", "js")
});
var jsTopbarFed = {
    ieLower: /msie ([\d\.]+)/.test(window.navigator.userAgent.toLowerCase()) && parseInt(/msie ([\d\.]+)/.exec(window.navigator.userAgent.toLowerCase())[1]) <= 6,
    isWide: typeof isWidescreen != "undefined" ? isWidescreen : false,
    maxHeight: function(f, e) {
        if (jsTopbarFed.ieLower) {
            var g = $(f).height();
            var h = parseInt(e);
            if (g > h) {
                $(f).height(h)
            }
        }
    },
    userNameMax: function() {
        if (jsTopbarFed.ieLower) {
            var d = jQuery("#user_name");
            var c = d.width();
            if (jsTopbarFed.isWide) {
                if (c > 215) {
                    d.css("width", "215")
                }
            } else {
                if (c > 138) {
                    d.css("width", "138")
                }
            }
        }
    },
    bindHoverEvent: function() {
        jQuery("#global_top_bar").delegate("[data-addClass]", "mouseenter", function() {
            var d = jQuery(this);
            var a = d.attr("data-addClass");
            d.addClass(a);
            b(d)
        });
        jQuery("#glWangZhanDaoHang").delegate("a", "click", function() {
            var a = loli.spm.getData(this);
            gotracker("2", "wangzhanDaohangClick", null , a)
        });
        function b(e) {
            var f = e.attr("id");
            if (f == "glKeHuDuan" || f == "shoujiVD") {
                e.lazyImg({
                    indexLoad: true
                })
            }
            if (e.has(".hd_weixin_show").length) {
                jsTopbarFed.weixinTextMax();
                e.lazyImg({
                    indexLoad: true
                })
            }
            if (e.has(".hd_fav_num").length) {
                var a = e.outerWidth() - 1;
                e.find("em", ".hd_favorites").css("width", a)
            }
            if (e.has(".hd_favorites").length) {
                jsTopbarFed.maxHeight(".hd_favorites dl", "300")
            }
        }
    },
    weixinTextMax: function() {
        if (jsTopbarFed.ieLower) {
            var d = $("p", ".hd_weixin_show").height()
                , c = 36;
            if (d > c) {
                $("p", ".hd_weixin_show").css("height", c)
            }
        }
    },
    bindHoverOutEvent: function() {
        jQuery("#global_top_bar").delegate("[data-addClass]", "mouseleave", function() {
            var c = jQuery(this);
            var d = c.attr("data-addClass");
            c.removeClass(d)
        })
    },
    setNoticeTop: function(e) {
        var d = jQuery(e);
        if (d[0] && jQuery("#hd_head_skin")[0]) {
            var f = jQuery("#topbanner");
            if (f[0]) {
                f.find("img").load(function() {
                    d.css("top", f.height())
                })
            } else {
                if (!jQuery("#topCurtain")[0]) {
                    d.css("top", 0)
                }
            }
        }
    },
    smallTopBannerHover: function() {
        if (typeof headerType != "undefined" && headerType == "search" && typeof isBigWidescreen != "undefined" && isBigWidescreen) {
            $("#topbanner").remove();
            return
        }
        var b = $("#smallTopBanner");
        if (b.length < 1) {
            b = $("#topbanner").find(".small_topbanner3")
        }
        if (b.length < 1) {
            return
        }
        b.delegate("a", "mouseover", function() {
            $(this).siblings("a").find("u").show()
        });
        b.delegate("a", "mouseout", function() {
            $(this).siblings("a").find("u").hide()
        })
    },
    closeNotice: function(b) {
        $("#hd_header_notice").delegate(".hd_notice_close", "click", function() {
            $(this).parents(".hd_header_notice").slideUp()
        })
    },
    loadFun: function() {
        jsTopbarFed.bindHoverEvent();
        jsTopbarFed.bindHoverOutEvent();
        jsTopbarFed.smallTopBannerHover();
        jsTopbarFed.closeNotice()
    },
    noticeShow: function() {
        if ($("li", "#hd_header_notice").length > 1) {
            var b;
            $("#hd_header_notice").hover(function() {
                if (b) {
                    clearInterval(b)
                }
            }, function() {
                b = setInterval(function() {
                    var d = $("#hd_header_notice ul:first");
                    var a = d.find("li:first").height();
                    d.animate({
                        marginTop: -a + "px"
                    }, 500, function() {
                        d.css({
                            marginTop: 0
                        }).find("li:first").appendTo(d)
                    })
                }, 5000)
            }).trigger("mouseleave")
        }
    }
};
jQuery(document).ready(function() {
    jsTopbarFed.userNameMax();
    jsTopbarFed.loadFun();
    jsTopbarFed.noticeShow()
});
(function(b) {
    var a = window.loli || (window.loli = {});
    a.timing = {
        timeToStr: function(f, d) {
            var c = [];
            for (var e in f) {
                if (f[e].value == -1 || f[e].value >= 3 * 60 * 1000) {
                    continue
                }
                c.push(f[e].name + "_" + f[e].value)
            }
            if (d) {
                c.push(d)
            }
            return ( c.join("-"))
        },
        basicTime: function(c) {
            if (!window.performance) {
                return
            }
            var e = window.performance
                , h = e.timing
                , d = e.navigation
                , g = {
                redirectCount: {
                    name: "RDTT",
                    value: d.redirectCount
                },
                redirectTime: {
                    name: "RDTM",
                    value: h.redirectEnd - h.redirectStart
                },
                domainLookupTime: {
                    name: "DMLKT",
                    value: h.domainLookupEnd - h.domainLookupStart
                },
                connectTime: {
                    name: "CONTT",
                    value: h.connectEnd - h.connectStart
                },
                requestTime: {
                    name: "REQT",
                    value: h.responseStart - (h.requestStart || h.responseStart + 1)
                },
                responseTime: {
                    name: "RSPT",
                    func: function() {
                        var i = h.responseEnd - h.responseStart;
                        if (h.domContentLoadedEventStart) {
                            if (i < 0) {
                                i = 0
                            }
                        } else {
                            i = -1
                        }
                        return i
                    },
                    value: -1
                },
                domParsingTime: {
                    name: "DMPT",
                    func: function() {
                        return h.domContentLoadedEventStart ? h.domInteractive - h.domLoading : -1
                    },
                    value: -1
                },
                domLoadedTime: {
                    name: "DMLT",
                    func: function() {
                        if (h.loadEventStart) {
                            return h.loadEventStart - h.domInteractive
                        }
                        return h.domComplete ? h.domComplete - h.domInteractive : -1
                    },
                    value: -1
                },
                winOnLoadTime: {
                    name: "ONLOADT",
                    func: function() {
                        return h.loadEventEnd ? h.loadEventEnd - h.loadEventStart : -1
                    },
                    value: -1
                },
                pageLoadTime: {
                    name: "PAGET",
                    func: function() {
                        if (h.loadEventStart) {
                            return h.loadEventStart - h.fetchStart
                        }
                        return h.domComplete ? h.domComplete - h.fetchStart : -1
                    },
                    value: -1
                },
                allLoadTime: {
                    name: "ALLT",
                    func: function() {
                        if (h.loadEventEnd) {
                            return h.loadEventEnd - h.navigationStart
                        }
                        return h.domComplete ? h.domComplete - h.navigationStart : -1
                    },
                    value: -1
                },
                firstPaintTime: {
                    name: "FPAINTT",
                    func: function() {
                        var i = h.firstPaint || h.msFirstPaint || h.mozFirstPaint || h.webkitFirstPaint || h.oFirstPaint;
                        return i ? i - h.navigationStart : -1
                    },
                    value: -1
                },
                beforeDomLoadingTime: {
                    name: "BEFDMLT",
                    func: function() {
                        return h.domLoading ? h.domLoading - h.navigationStart : -1
                    },
                    value: -1
                },
                resourcesLoadedTime: {
                    name: "RESLOADT",
                    func: function() {
                        if (h.loadEventStart) {
                            return h.loadEventStart - h.domLoading
                        }
                        return h.domComplete ? h.domComplete - h.domLoading : -1
                    },
                    value: -1
                },
                scriptRunTime: {
                    name: "SCRIPTT",
                    func: function() {
                        var i = h.domContentLoadedEventEnd - h.domContentLoadedEventStart;
                        return i > 0 ? i : -1
                    },
                    value: -1
                },
                customInteractTime: {
                    name: "CINTT",
                    func: function() {
                        var j = window.global || (window.global = {});
                        var k = j.vars = (j.vars || {});
                        var i = j.vars.customInteractTime;
                        if (i) {
                            return i - window.performance.timing.navigationStart
                        } else {
                            return -1
                        }
                    },
                    value: -1
                },
                interactTime: {
                    name: "INTT",
                    func: function() {
                        if (h.domContentLoadedEventStart) {
                            return h.domContentLoadedEventStart - h.navigationStart
                        }
                        return -1
                    },
                    value: -1
                }
            };
            for (var f in g) {
                if (g[f].value == -1 && typeof g[f].func == "function") {
                    g[f].value = g[f].func()
                }
            }
            return this.timeToStr(g, c)
        },
        eventHandleTime: function(h) {
            try {
                var g = [];
                if (typeof h == "undefined") {
                    return false
                } else {
                    if (h instanceof Array) {
                        var f = false;
                        for (var d = 0; d < h.length; d++) {
                            var c = h[d];
                            if (typeof c == "object") {
                                if (typeof c.name == "undefined" || c.endTime == "undefined" || c.startTime == "undefined") {
                                    console.log("data format is wrong! propeties should have name or endTime or startTime ");
                                    continue
                                } else {
                                    if (typeof c.endTime != "number" || typeof c.startTime != "number") {
                                        console.log(" endTime or startTime of " + c.name + "Object is not number type");
                                        continue
                                    } else {
                                        g.push(c.name + "_" + (c.endTime - c.startTime));
                                        f = true
                                    }
                                }
                            } else {
                                console.log("data format of Array is wrong! should be single Object");
                                continue
                            }
                        }
                        if (f) {
                            a.timing.sendTimerTracker(g.join("|"));
                            return true
                        }
                    } else {
                        if (typeof h == "object") {
                            if (typeof h.name == "undefined" || h.startTime == "undefined" || h.endTime == "undefined") {
                                console.log("data format is wrong! propeties should be name and startTime ");
                                return false
                            } else {
                                if (typeof h.startTime != "number" || typeof h.endTime != "number") {
                                    console.log(" startTime of " + h.name + "Object is not number type");
                                    return false
                                }
                                a.timing.sendTimerTracker(h.name + "_" + (h.endTime - h.startTime));
                                return true
                            }
                        } else {
                            return false
                        }
                    }
                }
            } catch (j) {}
        },
        sendTimerTracker: function(e) {
            if (e && b.trim(e) != "") {
                var d = a.page.getCurrPageInfo();
                if (!d) {
                    recordTrackInfoWithType("2", e);
                    return
                }
                var c = {
                    w_pt: d.pageType,
                    w_pv: d.pageValue
                };
                recordTrackInfoWithType("2", e, null , null , c)
            }
        },
        loadBaseTime: function() {
            if (!window.performance) {
                return
            }
            if (typeof stopGlobalTimingLoadFlag == "undefined") {
                a.timing.sendTimerTracker(a.timing.basicTime())
            }
        }
    }
})(jQuery);
jQuery(window).load(function() {
    setTimeout(function() {
        loli.timing.loadBaseTime()
    }, 3000)
});
var YHDREF = YHDREF || {};
(function($) {
    var refParseFunc = null ;
    YHDREF.defineGlobalRefParse = function(getRefAttrFunc) {
        refParseFunc = getRefAttrFunc
    }
    ;
    $(function() {
        var head = "gl."
            , prevTk = "["
            , afterTk = "]";
        var util = loli.util.url;
        var getPrevPageFlag = function() {
                var _location = location;
                var href = _location.href;
                var params = util.getParams(href);
                if (!params || !params.ref) {
                    return 0
                }
                var ref = params.ref;
                if (checkRef(ref)) {
                    return ref.substring(ref.lastIndexOf(".") + 1)
                }
                return 0
            }
            ;
        var checkRef = function(ref) {
                if (ref.indexOf(head) != 0 || ref.indexOf(prevTk) <= 0 || ref.indexOf(afterTk) <= 0) {
                    return false
                }
                var reg = /gl\.\d\.\d\.\w+\.\[[\S]+\]\.[\S]+\.[\S]+$/;
                var result = reg.exec(ref);
                return result ? true : false
            }
            ;
        var prevPageFlag = getPrevPageFlag();
        var currentPageFlag = loli.global.uid;
        var checkDataRef = function(dataRef) {
                return ( typeof (dataRef) != "undefined" && (dataRef instanceof Array) && dataRef.length >= 1)
            }
            ;
        function isLinkRef(link) {
            if (typeof (link) == "undefined" || !link || link == "#" || link.indexOf("#") == 0 || link == "###" || link.toLowerCase().indexOf("javascript") >= 0) {
                return false
            }
            return true
        }
        var eventType = "mousedown";
        if (loli.isMobile()) {
            eventType = "click"
        }
        $("body").delegate("a, area", eventType, function(e) {
            var _this = $(this);
            var isTrkCustom = jQuery.trim(_this.attr("isTrkCustom"));
            if (typeof (isTrkCustom) != "undefined" && isTrkCustom && isTrkCustom == "1") {
                return
            }
            var dataRef = _this.data("data-tracker2cookie");
            if (!dataRef) {
                var data_ref = _this.attr("data-ref");
                if (data_ref && data_ref.indexOf("[") == 0 && data_ref.indexOf("]") == data_ref.length - 1) {
                    eval("dataRef = " + data_ref)
                } else {
                    if (data_ref) {
                        data_ref = "['" + data_ref + "']";
                        eval("dataRef = " + data_ref)
                    }
                }
            }
            if (!dataRef && refParseFunc) {
                dataRef = refParseFunc(_this);
                if (checkDataRef(dataRef)) {
                    _this.data("data-tracker2cookie", dataRef)
                }
            }
            var link = jQuery.trim(_this.attr("href"));
            var spmData = loli.spm.getData(_this);
            var posObj = null ;
            if (loli.getMousePos) {
                posObj = loli.getMousePos(e);
                if (posObj != null ) {
                    spmData = spmData || {};
                    spmData.eventXRate = posObj.xrate;
                    spmData.eventYRate = posObj.yrate
                }
            }
            if (isLinkRef(link)) {
                if (checkDataRef(dataRef)) {
                    addTrackPositionToCookie.apply(window, [1].concat(dataRef))
                } else {
                    if (jQuery.trim(dataRef) != "") {
                        addTrackPositionToCookie(1, dataRef)
                    }
                }
                var _rewrite = _this.data("data-globalRewrite");
                if (_rewrite && _rewrite == 1) {
                    if (spmData && spmData.tp && spmData.pageTypeId) {
                        var rewriteLink = util.addPosition(posObj, link);
                        if (rewriteLink != link) {
                            _this.attr("href", rewriteLink)
                        }
                    }
                    return
                }
                if (spmData) {
                    var tc = spmData.tc;
                    var tp = spmData.tp;
                    var tce = spmData.tce;
                    var abtest = spmData.abtestValue;
                    var params = {
                        tc: tc,
                        tp: tp,
                        tce: tce,
                        abtest: abtest
                    };
                    link = util.appendParams(link, params);
                    if (spmData.tp && spmData.pageTypeId) {
                        link = util.addPosition(posObj, link)
                    }
                }
                _this.attr("href", link);
                _this.data("data-globalRewrite", 1);
                var trackerCode = _this.attr("data-event");
                if (trackerCode && trackerCode == "add_cart") {
                    var pmid = _this.attr("data-pmid") || 2;
                    var proid = _this.attr("data-proid");
                    spmData.positionTypeId = "4";
                    gotracker(pmid, trackerCode, proid, spmData)
                } else {
                    if (trackerCode) {
                        gotracker(2, trackerCode, null , spmData)
                    }
                }
            } else {
                var isTrkCustom = jQuery.trim(_this.attr("isTrkCustom"));
                if (typeof (isTrkCustom) != "undefined" && isTrkCustom && isTrkCustom == "1") {
                    return
                } else {
                    if (checkDataRef(dataRef)) {
                        var pmId = dataRef[2] ? dataRef[2] : 2;
                        var tk = dataRef[0];
                        var productId = dataRef[1] ? dataRef[1] : null ;
                        gotracker(pmId, tk, productId, spmData)
                    } else {
                        var trackerCode = _this.attr("data-event");
                        if (trackerCode && trackerCode == "add_cart") {
                            var pmid = _this.attr("data-pmid") || 2;
                            var proid = _this.attr("data-proid");
                            spmData.positionTypeId = "4";
                            gotracker(pmid, trackerCode, proid, spmData)
                        } else {
                            if (trackerCode) {
                                gotracker(2, trackerCode, null , spmData)
                            } else {
                                if (spmData) {
                                    gotracker(2, "buttonPosition", null , spmData)
                                }
                            }
                        }
                    }
                }
            }
        })
    })
})(jQuery);
(function(f) {
    var e = {
        urlMap: [],
        resultMap: [],
        loadedCount: 0,
        config: {},
        cdnConfig: function(c) {
            e.config = c;
            var b = e.config.random;
            if (b) {
                var a = Math.floor(Math.random() * 100 + 1);
                if (a <= b) {
                    e.config.canDetection = true
                }
            }
        },
        canDetection: function() {
            var a = window.navigator.userAgent.indexOf("Chrome") !== -1;
            if (a && window.performance && e.config.canDetection) {
                return true
            }
            return false
        },
        cdnAddObject: function(a, b) {
            if (!e.canDetection()) {
                return
            }
            e.urlMap.push({
                key: a,
                url: b + "?r=" + Math.random()
            })
        },
        cdnDetection: function(b) {
            if (!e.canDetection()) {
                return
            }
            var j = e.urlMap
                , c = j.length;
            for (var a = 0; a < c; a++) {
                var i = j[a];
                this.loadResource(i)
            }
        },
        loaded: function() {
            var b = e;
            if (b.urlMap.length == b.loadedCount) {
                var a = b.config.callback;
                a();
                return
            }
        },
        loadResource: function(a) {
            var b = new Image();
            b.onload = function() {
                try {
                    var h = window.performance.getEntriesByName(a.url);
                    if (h == null  || h.length < 1) {
                        return
                    }
                    e.loadedCount++;
                    a.costTime = Math.round(h[0].responseEnd - h[0].startTime);
                    e.resultMap.push(a);
                    e.loaded()
                } catch (c) {}
            }
            ;
            b.src = a.url
        }
    };
    var d = window.loli || (window.loli = {});
    d.cdnDetection = e;
    jQuery(document).ready(function() {
        var c = f("body").attr("data-cdnDetection");
        if (c == "-1" || c == null ) {
            return
        }
        c = jQuery.parseJSON(c);
        if (!c.random || !c.child) {
            return
        }
        var b = c.child
            , a = b.length;
        if (a < 1) {
            return
        }
        var h = d.cdnDetection;
        h.cdnConfig({
            random: c.random,
            callback: function() {
                var z = h.resultMap
                    , B = "http://opsdev.yhd.com/trace/?time=" + new Date().getTime();
                var x = "d=";
                var C = z.length;
                for (var g = 0; g < C; g++) {
                    var t = z[g];
                    var v = t.key;
                    var w = "0.0.0.0";
                    var y = 0;
                    var A = t.costTime;
                    x += v + "," + w + "," + y + "," + A;
                    if (g < C - 1) {
                        x = x + ";"
                    }
                }
                var u = new Image();
                u.src = B + "&" + x
            }
        });
        setTimeout(function() {
            for (var k = 0; k < a; k++) {
                var g = b[k];
                h.cdnAddObject(g.key, g.url)
            }
            h.cdnDetection()
        }, 10000)
    })
})(jQuery);
var glaCookieHandler = {};
(function(b) {
    var f = function(n) {
            var p = document.cookie;
            var q = p.split("; ");
            for (var o = 0; o < q.length; o++) {
                var r = q[o].split("=");
                if (r[0] == n) {
                    return r[1]
                }
            }
            return null
        }
        ;
    var a = "gla";
    var b = b || {}
        , c = f("provinceId")
        , e = f(a);
    var m = {
        p_1: "-10",
        p_2: "-20",
        p_3: "-30",
        p_4: "25",
        p_5: "37",
        p_6: "50",
        p_7: "-40",
        p_8: "62",
        p_9: "75",
        p_10: "88",
        p_11: "97",
        p_12: "111",
        p_13: "133",
        p_14: "150",
        p_15: "159",
        p_16: "170",
        p_17: "187",
        p_18: "205",
        p_19: "222",
        p_20: "237",
        p_21: "258",
        p_22: "274",
        p_23: "294",
        p_24: "303",
        p_25: "320",
        p_26: "327",
        p_27: "337",
        p_28: "351",
        p_29: "359",
        p_30: "377",
        p_32: "387"
    };
    function g() {
        var n = h();
        if (n && n.provinceId) {
            return n.provinceId
        } else {
            return c
        }
    }
    function l() {
        var n = h();
        if (n && n.cityId) {
            return n.provinceId
        }
        return null
    }
    function d() {
        var n = false;
        var o = h();
        if (c && o && o.provinceId && o.provinceId == c) {
            n = true
        }
        return n
    }
    function h() {
        if (!e) {
            return null
        }
        var n = {};
        var o = e.split("_");
        var p = o[0].split(".");
        if (p.length < 2) {
            return null
        }
        n.provinceId = p[0];
        n.cityId = p[1];
        n.hasUnionSite = false;
        if (o.length > 1 && o[1] != "0") {
            n.hasUnionSite = true;
            n.unionSiteDomain = o[1]
        }
        n.willingToUnionSite = 1;
        if (o.length > 2 && o[2] == "0") {
            n.willingToUnionSite = 0
        }
        if (o.length > 3 && o[3] == "1") {
            n.isMain = 1
        }
        return n
    }
    function k(n) {
        if (!n || !n.provinceId) {
            return
        }
        if (!n.cityId) {
            n.cityId = m["p_" + n.provinceId]
        }
        var p = [];
        p.push(n.provinceId + "." + n.cityId);
        if (n.unionSiteDomain) {
            p.push(n.unionSiteDomain);
            if (n.willingToUnionSite && n.willingToUnionSite != "0") {
                p.push(1)
            } else {
                p.push(0)
            }
        } else {
            p.push(0)
        }
        if (n.isMain) {
            p.push(1)
        } else {
            p.push(0)
        }
        var o = new Date();
        o.setTime(new Date().getTime() + 5 * 24 * 60 * 60 * 1000);
        document.cookie = a + "=" + p.join("_") + ";path=/;domain=." + no3wUrl + ";expires=" + o.toGMTString()
    }
    function i(n) {
        if (!n || !n.provinceId) {
            return
        }
        k(n);
        var o = new Date();
        o.setTime(new Date().getTime() + 800 * 24 * 60 * 60 * 1000);
        document.cookie = "provinceId=" + n.provinceId + ";path=/;domain=." + no3wUrl + ";expires=" + o.toGMTString()
    }
    function j() {
        var n = "";
        if (d()) {
            var o = h();
            if (o && o.unionSiteDomain && o.willingToUnionSite) {
                n = o.unionSiteDomain
            }
        }
        return n
    }
    b.glaCookieKey = a;
    b.defaultCityObj = m;
    b.analysisGla = h;
    b.genGlaCookie = k;
    b.gotoUnionSite = j;
    b.getCookie = f;
    b.check2ProvinceIsSame = d;
    b.resetGlaAndProvinceCookie = i;
    b.getProvinceId = g
})(glaCookieHandler);
(function(c) {
    var i = window.loli || (window.loli = {});
    var a = i.app = i.app || {};
    var e = i.app.account = i.app.account || {};
    var d = c.cookie("provinceId");
    var f = c.cookie("yihaodian_uid");
    var j = (typeof globalTopPrismFlag != "undefined" && globalTopPrismFlag == "0") ? 0 : 1;
    var k = c("#global_login");
    var h = k.attr("data-mpIcon") != "" ? c.parseJSON(k.attr("data-mpIcon")) : null ;
    if (!f || !d) {
        return
    }
    var m = function() {
            var p = URLPrefix.central + "/homepage/ajaxFindPrismMemberUserInfo.do?callback=?";
            var o = function(q) {
                    var r = g(q);
                    k.html(r);
                    k.data("userInfo", q);
                    l()
                }
                ;
            var n = {
                userId: f,
                currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                currSiteType: 1,
                provinceId: d
            };
            c.getJSON(p, n, function(q) {
                var s = q;
                if (s) {
                    if (s.status == 1) {
                        var r = s.userInfo;
                        o(r)
                    }
                }
            })
        }
        ;
    var b = function(n) {
            if (n != null  && n != "") {
                n = n.replace(/\&/g, "&amp;");
                n = n.replace(/\</g, "&lt;");
                n = n.replace(/\>/g, "&gt;");
                n = n.replace(/\\/g, "&#92;");
                n = n.replace(/\'/g, "&#039;");
                n = n.replace(/\"/g, "&#034;")
            }
            return n
        }
        ;
    var g = function(C) {
            if (!C) {
                return
            }
            var I = URLPrefix.statics + "/global/images/top/peopleicon_01.gif";
            var G = URLPrefix.statics + "/global/images/top/peopleicon_02.gif";
            var F = "http://my.yhd.com/member/my.do";
            var u = "http://vip.yhd.com";
            var z = "http://jifen.yhd.com/pointshop/pointIndex.do";
            var x = "http://my.yhd.com/member/userinfo/editinfo.do";
            var r = "http://vip.yhd.com/badge-shop/index.html";
            var n = "http://edm.yhd.com/pcMsg/myMessage.action";
            var s = C.endUserCredit ? C.endUserCredit : 0;
            var t = C.exp ? C.exp : 0;
            var D = C.nextGradeExpNeed;
            var o = C.memberGrade ? C.memberGrade : 0;
            var B = C.endUserPic;
            var q = b(C.endUserName);
            var H = C.badgesNum ? C.badgesNum : 0;
            var p = C.msgsNum ? C.msgsNum : 0;
            var v = C.samFlag ? C.samFlag : 0;
            if (o == null  || o < 0 || o > 3) {
                o = 0
            }
            var w = 0;
            if (t < 1) {
                w = 0
            } else {
                if (t < 1000) {
                    w = t / 10
                } else {
                    if (t < 3000) {
                        w = t / 30
                    } else {
                        w = t >= 10000 ? 75 : t / 10000 * 0.75 * 100
                    }
                }
            }
            var E = "";
            if (h != null  && h.imgUrl != "") {
                E += "<img src='" + h.imgUrl + "' alt='" + (h.altName || "") + "'>"
            }
            var y = "当前成长值:" + t;
            if (o < 3) {
                y += ",差" + D + "可升级为V" + (o + 1)
            }
            var A = [];
            A.push("<div class='hd_login clearfix'>");
            A.push("<span class='hd_hi'>Hi,</span>");
            A.push("<a href='" + u + "' target='_blank' class='hd_vip " + ("hd_vip" + o) + "' data-ref='YHD_TOP_username_vip'></a>");
            A.push("<a href='" + F + "' target='_blank' class='hd_login_name fl' data-ref='YHD_TOP_myyihaodian'>" + q + "</a>");
            A.push("</div>");
            A.push("<div class='hd_user_center'>");
            A.push("<a href='javascript:bothSiteLogoutJsonp();' class='blue_link'>退出登录</a>");
            A.push("<div class='clearfix'>");
            A.push("<div class='fl'>");
            A.push("<a class='hd_avata_box' href='" + F + "' target='_blank' data-ref='YHD_TOP_userpic'>");
            A.push(B ? "<img src='" + B + "'>" : "");
            A.push("</a>");
            A.push("<a href='" + x + "' target='_blank' data-ref='YHD_TOP_userinfo'>个人资料</a>");
            A.push("</div>");
            A.push("<div class='hd_growth_box'>");
            A.push("<p><a class='hd_user_name' href='" + F + "' target='_blank' data-ref='YHD_TOP_myyihaodian'>" + q + "</a>&nbsp;");
            A.push("<a class='hd_vip " + ("hd_vip" + o) + "' href='" + u + "' target='_blank' data-ref='YHD_TOP_username_vip'></a>");
            if (v) {
                A.push("<a title='山姆会员' class='hd_sam_vip' href='javascript:;' data-ref='YHD_TOP_usersamicon'></a>")
            }
            A.push("</p>");
            A.push("<p><a href='" + u + "' target='_blank' data-ref='YHD_TOP_userexp'>" + y + "</a></p>");
            A.push("<div class='hd_growth_progress'><p class='hd_progress_bar' style='width:" + w + "%'><i></i></p></div>");
            A.push("</div>");
            A.push("</div>");
            A.push("<div class='hd_message'>");
            A.push("<a href='" + z + "' target='_blank' data-ref='YHD_TOP_userjifen'>");
            A.push("<b>" + s + "</b>");
            A.push("<span class='hd_point'>积分<em>" + E + "</em></span>");
            A.push("</a>");
            A.push("<a href='" + u + "' target='_blank' data-ref='YHD_TOP_userxunzhang'>");
            if (o == 0 || o == 3) {
                A.push("<b>0元</b>");
                A.push("<span>会员价</span>")
            } else {
                A.push("<b>19.9元</b>");
                A.push("<span>会员价</span>")
            }
            A.push("</a>");
            A.push("<a href='" + n + "' target='_blank' data-ref='YHD_TOP_usermsg'>");
            A.push("<b>" + p + "</b>");
            A.push("<span>消息</span>");
            A.push("</a>");
            A.push("</div>");
            A.push("</div>");
            A.push("<em class='hd_login_arrow'></em>");
            return A.join("")
        }
        ;
    var l = function() {
            var n = null ;
            k.hover(function() {
                if (n != null ) {
                    clearTimeout(n)
                }
                n = setTimeout(function() {
                    k.addClass("hd_login_hover")
                }, 200)
            }, function() {
                if (n != null ) {
                    clearTimeout(n)
                }
                n = setTimeout(function() {
                    k.removeClass("hd_login_hover")
                }, 200)
            });
            k.show();
            c("#global_unlogin").hide()
        }
        ;
    e.showUserInfo = function(o) {
        if (j) {
            if (o && o.result == 1) {
                m()
            }
        } else {
            if (o && o.result == 1) {
                var p = {
                    endUserName: o.userName,
                    endUserPic: o.endUserPic,
                    endUserSex: o.endUserSex,
                    memberGrade: o.memberGrade,
                    exp: 0,
                    nextGradeExpNeed: 0,
                    endUserCredit: 0,
                    badgesNum: 0,
                    msgsNum: 0
                };
                var n = g(p);
                k.html(n);
                k.data("userInfo", p);
                l()
            }
        }
    }
    ;
    if (k.size() > 0 && k.attr("data-type") != null ) {
        i.globalCheckLogin(e.showUserInfo)
    }
})(jQuery);
(function(b) {
    b(function() {
        var N = window.loli || (window.loli = {});
        var B = N.app = N.app || {};
        var I = N.app.coupon = N.app.coupon || {};
        var D = N.yhdStore;
        var A = b.cookie("provinceId");
        var J = b.cookie("yihaodian_uid");
        var y = "top_prism_coupon";
        var H = "top_prism_coupon_num_" + J;
        var F = (typeof globalTopPrismFlag != "undefined" && globalTopPrismFlag == "0") ? 0 : 1;
        var L = b("#hdPrismWrap");
        var a = b("#hdPrismCoupon");
        var x = b("#hdPrismCouponNum");
        var E = b("#hdPrismCouponList");
        if (!J || !A || !F) {
            return
        }
        var z = function() {
                if (D) {
                    var c = D.isIE();
                    if (c == 0 || c >= 9 || (c == 8 && D.isRoot())) {
                        D.getFromRoot(H, function(d) {
                            if (d && d.status == 1) {
                                var e = (d.value && !isNaN(d.value)) ? parseInt(d.value) : 0;
                                a.data("couponsNumData", e);
                                if (e > 0) {
                                    x.text(e <= 99 ? e : 99);
                                    x.show()
                                } else {
                                    if (isNaN(d.value) || d.value == null ) {
                                        w()
                                    }
                                }
                            } else {
                                w()
                            }
                        })
                    } else {
                        w()
                    }
                }
            }
            ;
        var w = function() {
                var d = URLPrefix.central + "/homepage/ajaxFindNewPrismCouponsNum.do?callback=?";
                var e = function(f) {
                        a.data("couponsNumData", f);
                        a.data("couponsNumLoaded", 1);
                        if (f > 0) {
                            x.text(f <= 99 ? f : 99);
                            x.show()
                        } else {
                            x.text("");
                            x.hide()
                        }
                        if (D) {
                            D.setFromRoot(H, f)
                        }
                    }
                    ;
                var c = {
                    userId: J,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: A
                };
                b.getJSON(d, c, function(h) {
                    var f = h;
                    if (f) {
                        if (f.status == 1) {
                            var g = f.nums;
                            e(g)
                        }
                    }
                })
            }
            ;
        var M = function() {
                var e = URLPrefix.central + "/homepage/ajaxFindNewPrismCoupons.do?callback=?";
                var c = a.data("couponsNumData");
                var f = function(h) {
                        a.data("couponsData", h);
                        var g = v(h);
                        E.removeClass("global_loading").html(g);
                        E.height("auto")
                    }
                    ;
                var d = {
                    userId: J,
                    total: c != null  ? c : 50,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: A
                };
                b.getJSON(e, d, function(h) {
                    var i = h;
                    if (i) {
                        if (i.status == 1) {
                            var g = i.coupons;
                            f(g)
                        }
                    }
                })
            }
            ;
        var v = function(d) {
                var f = "http://coupon.yhd.com/myCoupon";
                var l = [];
                if (d && d.length > 0) {
                    var h = false;
                    var i = false;
                    for (var c = 0; c < d.length; c++) {
                        var e = d[c];
                        if (e.timeType == 1) {
                            if (!h) {
                                l.push("<p class='hd_prism_tit'>即将到期</p>");
                                h = true
                            }
                        }
                        if (e.timeType != 1) {
                            if (!i) {
                                if (h) {
                                    l.push("<p class='hd_prism_tit'>其他抵用券</p>");
                                    i = true
                                } else {
                                    l.push("<p class='hd_prism_tit'>我的抵用券</p>");
                                    i = true
                                }
                            }
                        }
                        var j = e.timeType == 1 ? (e.endDateTimeStr + " 结束") : (e.startDateTimeStr + " 开始");
                        var m = "http://list.yhd.com/redirectCoupon/" + e.couponActiveDefId;
                        var k = y + "_" + e.couponNumber;
                        var g = e.timeType == 1 ? "hd_coupon_org" : (e.timeType == 2 ? "" : "hd_coupon_gray");
                        if (e.couponUserType == 0 || e.couponUserType == 5 || e.couponUserType == 6 || e.couponUserType == 7 || e.couponUserType == 8) {
                            m = f
                        }
                        if (e.timeType == 1) {
                            if (e.dateDiff == 0) {
                                j = "<b>今天</b>到期"
                            } else {
                                j = "还剩 <b>" + e.dateDiff + "</b>天 到期"
                            }
                        } else {
                            if (e.timeType == 2) {
                                j = e.startDateStr + " 至 " + e.endDateStr
                            } else {
                                if (e.timeType == 3) {
                                    j = e.startDateTimeStr + " 开始"
                                }
                            }
                        }
                        l.push("<a href='" + m + "' data-ref='" + k + "' target='_blank' title='" + e.couponInfo + "' class='hd_coupon " + g + "'>");
                        l.push("<div class='clearfix'>");
                        l.push("<b class='hd_coupon_price'>&yen;<em>" + e.amount + "</em></b>");
                        l.push("<span class='hd_coupon_sort'>" + e.couponInfo + "</span>");
                        l.push("</div>");
                        l.push("<p class='hd_coupon_timer'>" + j + "</p>");
                        l.push("</a>")
                    }
                    l.push("<a class='hd_more_btn' href='" + f + "' target='_blank' data-ref='" + y + "_more'>查看更多</a>")
                } else {
                    l.push("<div class='hd_none_tips'>");
                    l.push("<span class='hd_none_icon'></span>");
                    l.push("<p class='hd_none_text'>您还没有礼券哦~</p>");
                    l.push("</div>")
                }
                return l.join("")
            }
            ;
        var K = function() {
                var c = b("a.hd_prism_tab", a);
                c.attr("href", "javascript:void(0);");
                c.removeAttr("target");
                c.click(function() {
                    if (a.data("dataLoaded") == "1" && a.hasClass("hd_cur")) {
                        G(a);
                        return
                    }
                    if (!a.data("couponsNumLoaded")) {
                        w()
                    }
                    var d = function(e) {
                            if (e.result == 1) {
                                if (a.data("dataLoaded") == "1") {
                                    C(a)
                                } else {
                                    a.data("dataLoaded", "1");
                                    E.height("100");
                                    C(a);
                                    M();
                                    if (c.data("clicked") != 1) {
                                        gotracker("2", y);
                                        c.data("clicked", 1)
                                    }
                                }
                            } else {
                                if (yhdPublicLogin) {
                                    yhdPublicLogin.showLoginDiv()
                                }
                            }
                        }
                        ;
                    N.globalCheckLogin(d)
                });
                b(document.body).click(function(f) {
                    var d = b(this);
                    var e = f.target ? f.target : f.srcElement;
                    if (e) {
                        var g = b(e).parents("div.hd_prism_wrap").size();
                        if (g == 0 && a.hasClass("hd_cur")) {
                            a.removeClass("hd_cur")
                        }
                    }
                })
            }
            ;
        var C = function(c) {
                L.find("div.hd_prism,div.hd_mini_cart").removeClass("hd_cur");
                c.addClass("hd_cur")
            }
            ;
        var G = function(c) {
                c.removeClass("hd_cur")
            }
            ;
        I.showNum = function() {
            z();
            K()
        }
        ;
        window.topCouponTimeoutHandler = setTimeout(function() {
            if (a.size() > 0) {
                I.showNum()
            }
        }, 3 * 1000)
    })
})(jQuery);
(function(b) {
    b(function() {
        var R = window.loli || (window.loli = {});
        var z = R.app = R.app || {};
        var G = R.app.order = R.app.order || {};
        var a = R.yhdStore;
        var F = b.cookie("provinceId");
        var O = b.cookie("yihaodian_uid");
        var N = "top_prism_order";
        var E = "top_prism_order_num_" + O;
        var C = (typeof globalTopPrismFlag != "undefined" && globalTopPrismFlag == "0") ? 0 : 1;
        var Q = b("#hdPrismWrap");
        var H = b("#hdPrismOrder");
        var L = b("#hdPrismOrderNum");
        var M = b("#hdPrismOrderList");
        if (!O || !F || !C) {
            return
        }
        var B = function() {
                if (a) {
                    var c = a.isIE();
                    if (c == 0 || c >= 9 || (c == 8 && a.isRoot())) {
                        a.getFromRoot(E, function(d) {
                            if (d && d.status == 1) {
                                var e = (d.value && !isNaN(d.value)) ? parseInt(d.value) : 0;
                                H.data("ordersNumData", e);
                                if (e > 0) {
                                    L.text(e <= 99 ? e : 99);
                                    L.show()
                                } else {
                                    if (isNaN(d.value) || d.value == null ) {
                                        I()
                                    }
                                }
                            } else {
                                I()
                            }
                        })
                    } else {
                        I()
                    }
                }
            }
            ;
        var I = function() {
                var c = URLPrefix.central + "/homepage/ajaxFindTopPrismOrdersNum.do?callback=?";
                var e = function(f) {
                        H.data("ordersNumData", f);
                        H.data("ordersNumLoaded", 1);
                        if (f > 0) {
                            L.text(f <= 99 ? f : 99);
                            L.show()
                        } else {
                            L.text("");
                            L.hide()
                        }
                        if (a) {
                            a.setFromRoot(E, f)
                        }
                    }
                    ;
                var d = {
                    userId: O,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: F
                };
                b.getJSON(c, d, function(f) {
                    var g = f;
                    if (g) {
                        if (g.status == 1) {
                            var h = g.result;
                            e(h)
                        }
                    }
                })
            }
            ;
        var y = function() {
                var e = URLPrefix.central + "/homepage/ajaxFindTopPrismOrders.do?callback=?";
                var c = function(g) {
                        H.data("ordersData", g);
                        var f = x(g);
                        M.removeClass("global_loading").html(f);
                        M.height("auto")
                    }
                    ;
                var d = {
                    userId: O,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: F
                };
                b.getJSON(e, d, function(f) {
                    var g = f;
                    if (g) {
                        if (g.status == 1) {
                            var h = g.orders;
                            c(h)
                        }
                    }
                })
            }
            ;
        var x = function(aa) {
                var e = "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_60x60.jpg";
                var p = typeof URLPrefix.my != "undefined" ? URLPrefix.my : "http://my.yhd.com";
                var f = "http://my.yhd.com/order/myOrder.do";
                var c = "http://cms.yhd.com/cmsPage/show.do?pageId=65818";
                var g = [];
                if (aa && aa.length > 0) {
                    g.push("<p class='hd_order_tips'><a class='blue_link' href='" + c + "' target='_blank' data-ref='" + N + "_download'>下载手机客户端，轻松查询配送信息</a></p>");
                    for (var v = 0; v < aa.length; v++) {
                        var Y = aa[v];
                        var j = Y.status;
                        var s = Y.actionType;
                        var o = s == 1 ? "待付款" : (s == 2 ? "待收货" : (s == 3 ? "待评论" : ""));
                        var m = p + "/order/orderDetail.do?orderCode=" + Y.code;
                        var n = N + "_detail_" + Y.id;
                        var u = "http://e.yhd.com/front-pe/pe/orderProductExperience!orderProductExperience.do?soId=" + Y.id + "&userId=" + O + "&hasCommented=false&soType=0";
                        var q = N + "_comment_" + Y.id;
                        var l = "http://my.yhd.com/order/finishOrder.do?orderCode=" + Y.code;
                        var r = N + "_pay_" + Y.id;
                        var d = "http://e.yhd.com/front-pe/couriers/deliveryStaff!comment.do?soId=" + Y.id;
                        var w = N + "_commentExpress_" + Y.id;
                        if (!Y.hasSubOrders) {
                            g.push("<div class='hd_order_list'>");
                            g.push("<a href='" + m + "' target='_blank' data-ref='" + n + "' class='hd_order_num'>");
                            if (s == 3 && !Y.deliveryMsg) {
                                var ad = J(j);
                                if (ad) {
                                    g.push("<b><i></i>" + ad + "</b>")
                                }
                            }
                            g.push("订单号：" + Y.code);
                            g.push("</a>");
                            if (Y.deliveryMsg) {
                                g.push("<p class='hd_order_status'>" + Y.deliveryMsg + "</p>")
                            }
                            g.push("<div class='hd_pro_list'>");
                            g.push("<div class='clearfix'>");
                            for (var Z = 0; Z < Y.items.length; Z++) {
                                var ac = "http://item-home.yhd.com/item/snapshotShow.do?productId=" + Y.items[Z].productId + "&soItemId=" + Y.items[Z].soItemId + "&flag=1";
                                var i = P(Y.items[Z].productPicPath ? Y.items[Z].productPicPath : e);
                                var h = N + "_item_" + Y.items[Z].productMerchantId;
                                if (Z > 2) {
                                    break
                                }
                                g.push("<a href='" + ac + "' target='_blank' data-ref='" + h + "'><img src='" + R.util.hashImgUrl(i) + "' /></a>")
                            }
                            g.push("</div>");
                            g.push("</div>");
                            if (s == 1) {
                                g.push("<div class='hd_btn_wrap'><a href='" + l + "' target='_blank' data-ref='" + r + "' class='hd_pay_btn'>立即支付</a></div>")
                            } else {
                                if (s == 3) {
                                    if (1 == Y.hasCommentExpress) {
                                        g.push("<div class='hd_btn_wrap'>")
                                    } else {
                                        g.push("<div class='hd_btn_wrap hd_shop_order'>")
                                    }
                                    g.push("<a href='" + u + "' target='_blank' data-ref='" + q + "' class='hd_comment_btn'>立即评论");
                                    if (0 == Y.hasCommentGiftActivity) {
                                        if (1 == Y.commentActivityType) {
                                            g.push("<em class='hd_gift_icon'></em>")
                                        } else {
                                            if (2 == Y.commentActivityType) {
                                                g.push("<em class='hd_fanxian_icon'></em>")
                                            }
                                        }
                                    }
                                    g.push("</a>");
                                    if (1 == Y.hasCommentExpress) {
                                        g.push("<a class='hd_comment_express' href='" + d + "' target='_blank' data-ref='" + w + "'>评论快递小哥</a>")
                                    }
                                    g.push("</div>")
                                }
                            }
                            g.push("</div>")
                        } else {
                            u = "http://e.yhd.com/front-pe/pe/orderProductExperience!orderProductExperience.do?soId=" + Y.id + "&userId=" + O + "&hasCommented=false&soType=1";
                            g.push("<div class='hd_order_list'>");
                            g.push("<a href='" + m + "' target='_blank' data-ref='" + n + "' class='hd_order_num'>订单号：" + Y.code + "</a>");
                            for (var ab = 0; ab < Y.subOrders.length; ab++) {
                                var t = Y.subOrders[ab];
                                var k = "";
                                if (t.deliveryMsg) {
                                    k = t.deliveryMsg
                                }
                                if (s == 3 && !t.deliveryMsg) {
                                    k = J(t.status)
                                }
                                d = "http://e.yhd.com/front-pe/couriers/deliveryStaff!comment.do?soId=" + t.id;
                                w = N + "_commentExpress_" + t.id;
                                g.push("<p class='hd_order_status'><i>包裹" + (ab + 1) + "</i>" + k + "</p>");
                                g.push("<div class='hd_pro_list'>");
                                g.push("<div class='clearfix'>");
                                for (var Z = 0; Z < t.items.length; Z++) {
                                    var ac = "http://item-home.yhd.com/item/snapshotShow.do?productId=" + t.items[Z].productId + "&soItemId=" + t.items[Z].soItemId + "&flag=1";
                                    var i = P(t.items[Z].productPicPath ? t.items[Z].productPicPath : e);
                                    var h = N + "_item_" + t.items[Z].productMerchantId;
                                    if (Z > 2) {
                                        break
                                    }
                                    g.push("<a href='" + ac + "' target='_blank' title='" + t.items[Z].productName + "' data-ref='" + h + "'><img src='" + R.util.hashImgUrl(i) + "' title='" + t.items[Z].productName + "'/></a>")
                                }
                                g.push("</div>");
                                if (1 == t.hasCommentExpress) {
                                    g.push("<div class='hd_subbtn_wrap'>");
                                    g.push("<a class='hd_comment_express' href='" + d + "' target='_blank' data-ref='" + w + "'>评论快递小哥</a>");
                                    g.push("</div>")
                                }
                                g.push("</div>")
                            }
                            if (s == 1) {
                                g.push("<div class='hd_btn_wrap'><a href='" + l + "' target='_blank' data-ref='" + r + "' class='hd_pay_btn'>立即支付</a></div>")
                            } else {
                                if (s == 3) {
                                    g.push("<div class='hd_btn_wrap hd_shop_order'>");
                                    g.push("<a href='" + u + "' target='_blank' data-ref='" + q + "' class='hd_comment_btn'>立即评论</a>");
                                    if (0 == Y.hasCommentGiftActivity) {
                                        if (1 == Y.commentActivityType) {
                                            g.push("<em class='hd_gift_icon'></em>")
                                        } else {
                                            if (2 == Y.commentActivityType) {
                                                g.push("<em class='hd_fanxian_icon'></em>")
                                            }
                                        }
                                    }
                                    g.push("</div>")
                                }
                            }
                            g.push("</div>")
                        }
                    }
                    g.push("<a class='hd_more_btn' href='" + f + "' target='_blank' data-ref='" + N + "_more'>查看更多</a>")
                } else {
                    g.push("<div class='hd_none_tips'>");
                    g.push("<span class='hd_none_icon'></span>");
                    g.push("<p class='hd_none_text'>您还没有订单哦~</p>");
                    g.push("</div>")
                }
                return g.join("")
            }
            ;
        var P = function(c) {
                if (c) {
                    c = c.replace("_40x40.", "_60x60.")
                }
                return c
            }
            ;
        var J = function(d) {
                var c = "";
                if (d == 20) {
                    c = "已出库"
                } else {
                    if (d == 24) {
                        c = "已收货"
                    } else {
                        if (d == 35) {
                            c = "已完成"
                        }
                    }
                }
                return c
            }
            ;
        var A = function() {
                var c = b("a.hd_prism_tab", H);
                c.attr("href", "javascript:void(0);");
                c.removeAttr("target");
                c.click(function() {
                    if (H.data("dataLoaded") == "1" && H.hasClass("hd_cur")) {
                        K(H);
                        return
                    }
                    if (!H.data("ordersNumLoaded")) {
                        I()
                    }
                    var d = function(e) {
                            if (e.result == 1) {
                                if (H.data("dataLoaded") == "1") {
                                    D(H)
                                } else {
                                    H.data("dataLoaded", "1");
                                    M.height("100");
                                    D(H);
                                    y();
                                    if (c.data("clicked") != 1) {
                                        gotracker("2", N);
                                        c.data("clicked", 1)
                                    }
                                }
                            } else {
                                if (yhdPublicLogin) {
                                    yhdPublicLogin.showLoginDiv()
                                }
                            }
                        }
                        ;
                    R.globalCheckLogin(d)
                });
                b(document.body).click(function(g) {
                    var e = b(this);
                    var d = g.target ? g.target : g.srcElement;
                    if (d) {
                        var f = b(d).parents("div.hd_prism_wrap").size();
                        if (f == 0 && H.hasClass("hd_cur")) {
                            H.removeClass("hd_cur")
                        }
                    }
                })
            }
            ;
        var D = function(c) {
                Q.find("div.hd_prism,div.hd_mini_cart").removeClass("hd_cur");
                c.addClass("hd_cur")
            }
            ;
        var K = function(c) {
                c.removeClass("hd_cur")
            }
            ;
        G.showNum = function() {
            B();
            A()
        }
        ;
        window.topOrderTimeoutHandler = setTimeout(function() {
            if (H.size() > 0) {
                G.showNum()
            }
        }, 3 * 1000)
    })
})(jQuery);
(function(a) {
    a(function() {
        var e = a.cookie("provinceId");
        var g = a.cookie("yihaodian_uid");
        var i = (typeof globalTopPrismFlag != "undefined" && globalTopPrismFlag == "0") ? 0 : 1;
        if (!g || !e || !i) {
            return
        }
        var j = window.loli || (window.loli = {});
        var f = 0;
        var d = [];
        var h = {};
        if (a("#glShouCangChild").size() == 0) {
            return
        }
        var b = typeof URLPrefix.my != "undefined" ? URLPrefix.my : "http://my.yhd.com";
        j.globalCheckLogin(c);
        function c(l) {
            if (!l || !l.result || l.result != 1) {
                return
            }
            var o = b + "/member/myNewFavorite/myUserFavoriteInfo.do?callback=?";
            var m = {
                favoriteType: 0
            };
            a.getJSON(o, m, function(s) {
                var r = s;
                if (r) {
                    if (r.code == 0) {
                        var q = r.resultList;
                        p(q)
                    } else {}
                }
            });
            function p(s) {
                if (!s || s.length < 1) {
                    return
                }
                var q = [];
                for (var t = 0; t < s.length; t++) {
                    var r = s[t];
                    if (!r.price || !r.listPrice) {
                        continue
                    }
                    q.push(r);
                    h[r.pmInfoId] = r
                }
                n(q)
            }
            function n(x) {
                if (!x || x.length < 1) {
                    return
                }
                var u = [];
                var v = -1;
                for (var q = 0; q < x.length; q++) {
                    var w = x[q];
                    if (q % 10 == 0) {
                        v = v + 1;
                        if (!u[v]) {
                            u[v] = []
                        }
                        u[v].push(w.pmInfoId)
                    } else {
                        u[v].push(w.pmInfoId)
                    }
                }
                f = u.length;
                for (var r = 0; r < f; r++) {
                    k(u[r])
                }
                var s = setInterval(function() {
                    if (f <= 0) {
                        var F = d.length;
                        clearInterval(s);
                        var I = a("#glShouCangChild");
                        var y = [];
                        y.push('<em style="width: 86px;"></em>');
                        y.push("<dl>");
                        var C = [];
                        var E = 0;
                        for (var J = 0; J < F; J++) {
                            var D = d[J];
                            if (D == null  || D.pmInfoId == null  || D.productId == null  || !D.isPromotion || !D.promotionInfo || D.promotionInfo.length < 1) {
                                continue
                            }
                            E++;
                            var t = D.promotionInfo[0];
                            var z = h[D.pmInfoId];
                            G = "pms_191_prism_fav_pro_p_" + z.pmInfoId;
                            var M = "http://item.yhd.com/item/" + z.pmInfoId;
                            var A = getProductPicByDefaultPic(z.productUrl, 60, 60);
                            C.push("<dd>");
                            C.push('<a class="hd_pro_img" data-tpc="21" href="' + M + '" data-ref="' + G + '" target="_blank"><img src="' + j.util.hashImgUrl(A) + '"></a>');
                            C.push('<a class="hd_pro_name" data-tpc="22" href="' + M + '" data-ref="' + G + '" target="_blank">' + z.productName + "</a>");
                            C.push('<p class="hd_pro_price">¥' + z.price + "</p>");
                            if (t.type == 2 || t.type == 3) {
                                var N = "http://list.yhd.com/p/c0-b-a-s1-v0-p1-price-d0-pid" + z.productId + "-pt" + t.promotionId + "-pl" + t.levelId + "-m0";
                                var G = "pms_191_prism_fav_pro_l_" + t.promotionId;
                                C.push('<p class="hd_sale_tips"><i></i><a data-tpc="23" href="' + N + '" data-ref="' + G + '" target="_blank">' + t.promDesc + "</a></p>")
                            } else {
                                C.push('<p class="hd_sale_tips"><i></i><a>' + t.promDesc + "</a></p>")
                            }
                            C.push("</dd>")
                        }
                        if (E > 0) {
                            y.push("<dt>您收藏的商品中有<b>" + E + "</b>个商品正在促销</dt>")
                        } else {
                            return
                        }
                        y.push(C.join(" "));
                        y.push("</dl>");
                        var B = "http://my.yhd.com/member/myNewCollection/myFavorite.do?operType=0";
                        var K = "http://my.yhd.com/member/myNewCollection/myFavorite.do?operType=1";
                        y.push('<div class="hd_btn_wrap clearfix"><a data-tpc="24" href="' + B + '" data-ref="global_prism_fav_pro_more" target="_blank">我收藏的商品</a><a data-tpc="25" href="' + K + '"  data-ref="global_prism_fav_shop_more" target="_blank">我收藏的店铺</a></div>');
                        I.html(y.join(" "));
                        I.removeClass("hd_menu_list").addClass("hd_favorites");
                        var L = a("#glShouCang").find(".hd_menu");
                        var H = L.find("span");
                        H.html(H.html().replace(/&nbsp;/g, ""));
                        L.html(L.html() + '<u class="hd_fav_num">' + E + "</u>")
                    }
                }, 1000)
            }
            function k(r) {
                var v = "";
                for (var u = 0; u < r.length; u++) {
                    if (r[u] == "" || r[u] <= 0) {
                        continue
                    }
                    v += "&pmInfoIds=" + r[u]
                }
                if (!v) {
                    return
                }
                var t = URLPrefix.central + "/homepage/ajaxFindProductPromotions.do?callback=?";
                var q = {
                    mcsiteId: 1,
                    pmInfoIds: r.join(","),
                    provinceId: e
                };
                var s = 0;
                jQuery.getJSON(t, q, function(w) {
                    if (s == 1) {
                        return
                    }
                    s = 1;
                    f--;
                    if (!w || w.status != 1) {
                        return true
                    }
                    d = d.concat(w.result)
                });
                setTimeout(function() {
                    if (s = 0) {
                        s = 1;
                        f--
                    }
                }, 2000)
            }
        }
    })
})(jQuery);
(function(a) {
    a(function() {
        var b = window.loli || (window.loli = {});
        var l = b.app = b.app || {};
        var f = b.app.msg = b.app.msg || {};
        var q = a.cookie("provinceId");
        var e = a.cookie("yihaodian_uid");
        var r = (typeof r == "undefined") ? 1 : r;
        var m = 1;
        var w = a("#hdUserMsg");
        var o = w.size() > 0 ? w.attr("data-cfg") : 0;
        if (!e || !q || !o) {
            return
        }
        var t = function(x) {
                var z = new Date();
                z.setTime(x);
                var y = z.getMonth() + 1;
                var A = z.getDate();
                return y + "月" + A + "日"
            }
            ;
        var n = function(x) {
                if (x != null  && x != "") {
                    x = x.replace(/\&/g, "&amp;");
                    x = x.replace(/\</g, "&lt;");
                    x = x.replace(/\>/g, "&gt;");
                    x = x.replace(/\\/g, "&#92;");
                    x = x.replace(/\'/g, "&#039;");
                    x = x.replace(/\"/g, "&#034;")
                }
                return x
            }
            ;
        var c = function(x) {
                var y = URLPrefix.central + "/homepage/ajaxFindUserMsgsNum.do?callback=?";
                var z = {
                    userId: e,
                    currSiteId: r,
                    currSiteType: m,
                    provinceId: q
                };
                a.getJSON(y, z, function(A) {
                    if (A && A.status == 1) {
                        x(A.value)
                    } else {
                        x(0)
                    }
                })
            }
            ;
        var g = function(y) {
                var z = "http://webim.yhd.com/customer/offline.action";
                var x = function(B) {
                        var C = 0;
                        if (!isNaN(B)) {
                            C = parseInt(B)
                        }
                        if (C > 0) {
                            y(C)
                        } else {
                            y(0)
                        }
                    }
                    ;
                var A = {
                    userId: e,
                    currSiteId: r,
                    currSiteType: m,
                    provinceId: q
                };
                a.ajax({
                    url: z,
                    data: A,
                    dataType: "jsonp",
                    jsonp: "jsonpCallback",
                    success: function(B) {
                        if (B) {
                            x(B)
                        } else {
                            x(0)
                        }
                    }
                })
            }
            ;
        var u = function(x) {
                var y = URLPrefix.central + "/homepage/ajaxFindUserMsgs.do?callback=?";
                var z = {
                    userId: e,
                    currSiteId: r,
                    currSiteType: m,
                    provinceId: q
                };
                a.getJSON(y, z, function(A) {
                    if (A && A.status == 1) {
                        x(A.value)
                    } else {
                        x(null )
                    }
                })
            }
            ;
        var k = function(y, z) {
                var x = URLPrefix.central + "/homepage/ajaxUpdateUserMsgsStatus.do?callback=?";
                var A = {
                    userId: e,
                    msgIds: y.join(","),
                    currSiteId: r,
                    currSiteType: m,
                    provinceId: q
                };
                a.getJSON(x, A, function(B) {
                    if (B && B.status == 1) {
                        z(B.value)
                    } else {
                        z(null )
                    }
                })
            }
            ;
        var p = function(B, D) {
                var z = "http://edm.yhd.com/pcMsg/myMessage.action";
                var x = "http://webim.yhd.com/global/frontCheckPoint.action";
                var C = [];
                if (B == 0 && (!D || D.length == 0)) {
                    C.push("<div class='hd_none_notice'>");
                    C.push("<span class='hd_none_pic'></span>");
                    C.push("<p>无新消息</p>");
                    C.push("</div>");
                    return C.join("")
                }
                if (D && D.length > 0) {
                    C.push("<p class='hd_ntc_top clearfix' data-tpc='1'>");
                    C.push("<a class='fl' href='javascript:;'>全部标记为已读</a>");
                    C.push("<a class='blue_link fr' href='" + z + "' target='_blank'>查看更多</a>");
                    C.push("</p>")
                }
                C.push("<div class='hd_notice_detail'>");
                if (B > 0) {
                    C.push("<div class='hd_service clearfix' data-tpc='2'>");
                    C.push("<span class='fl'><i></i>客服消息</span>");
                    C.push("<a class='fr hd_delete_notc' href='javascript:;'>×</a>");
                    C.push("<a class='fr hd_notc_num' href='" + x + "' target='_blank'><u>" + B + "</u>条新消息</a>");
                    C.push("</div>")
                }
                if (D && D.length > 0) {
                    C.push("<div class='hd_notice_list' data-tpc='3'>");
                    for (var y = 0; y < D.length; y++) {
                        var A = D[y];
                        var E = A.link ? A.link : "javascript:;";
                        C.push("<dl data-msgId='" + A.msgId + "'>");
                        C.push("<dt class='clearfix'>");
                        C.push("<b class='fl'>" + A.title + "</b>");
                        C.push("<a class='fr hd_delete_notc' href='javascript:;'>×</a>");
                        C.push("<em class='fr'>" + t(A.createTime) + "</em>");
                        C.push("</dt>");
                        C.push("<dd>");
                        C.push("<a class='hd_notice_txt' href='" + E + "'" + (A.link ? " target='_blank'>" : ">") + n(A.content) + "</a>");
                        C.push("</dd>");
                        C.push("</dl>")
                    }
                    C.push("</div>")
                }
                C.push("</div>");
                return C.join("")
            }
            ;
        var h = function() {
                var z = w.data("customerMsgsNum") != null  ? w.data("customerMsgsNum") : 0;
                var y = w.data("userMsgsNum") != null  ? w.data("userMsgsNum") : 0;
                var x = z + y;
                if (x > 0) {
                    w.find("a.hd_notice_tit").html("<i></i>新消息(<span>" + (x >= 100 ? "99+" : x) + "</span>)");
                    w.addClass("hd_has_notice")
                } else {
                    w.find("a.hd_notice_tit").html("<i></i>新消息(<span>0</span>)");
                    w.removeClass("hd_has_notice")
                }
            }
            ;
        var j = function() {
                var A = 0;
                var x = 0;
                var B = null ;
                var y = function(C) {
                        x = C;
                        w.data("userMsgsNum", x);
                        w.show();
                        h();
                        v()
                    }
                    ;
                var z = function(C) {
                        if (B) {
                            clearTimeout(B)
                        }
                        A = C;
                        w.data("customerMsgsNum", A);
                        c(y)
                    }
                    ;
                g(z);
                B = setTimeout(function() {
                    w.data("customerMsgsNum", 0);
                    c(y)
                }, 1500)
            }
            ;
        var d = function() {
                var z = w.data("customerMsgsNum") != null  ? w.data("customerMsgsNum") : 0;
                var y = w.data("userMsgsNum") != null  ? w.data("userMsgsNum") : 0;
                var x = function(B) {
                        if (B && B.length > 0) {
                            y = B.length
                        } else {
                            y = 0
                        }
                        w.data("userMsgsNum", y);
                        h();
                        var A = p(z, B);
                        w.find("div.hd_notice").html(A);
                        w.addClass("hd_notice_hover")
                    }
                    ;
                u(x)
            }
            ;
        var s = function() {
                var y = [];
                var x = w.find("div.hd_notice_list dl");
                x.each(function() {
                    y.push(a(this).attr("data-msgId"))
                });
                k(y, function(A) {
                    if (A) {
                        var z = p(0, null );
                        w.find("div.hd_notice").html(z);
                        w.data("userMsgsNum", 0);
                        w.data("customerMsgsNum", 0);
                        w.find("a.hd_notice_tit").html("<i></i>新消息(<span>0</span>)");
                        w.removeClass("hd_has_notice")
                    }
                })
            }
            ;
        var i = function(x) {
                var y = [];
                y.push(x);
                var z = w.find("div.hd_notice_list dl[data-msgId='" + x + "']");
                k(y, function(A) {
                    if (A) {
                        d()
                    }
                })
            }
            ;
        var v = function() {
                var y, x;
                w.mouseenter(function() {
                    if (x) {
                        clearTimeout(x)
                    }
                    y = setTimeout(function() {
                        if (w.data("loaded")) {
                            w.addClass("hd_notice_hover");
                            return
                        }
                        w.data("loaded", 1);
                        d()
                    }, 200)
                });
                w.mouseleave(function() {
                    if (y) {
                        clearTimeout(y)
                    }
                    x = setTimeout(function() {
                        w.removeClass("hd_notice_hover")
                    }, 200)
                });
                w.delegate("p.hd_ntc_top a.fl", "click", function() {
                    s()
                });
                w.delegate("div.hd_notice_list a.hd_delete_notc", "click", function() {
                    var z = a(this).parents("dl").attr("data-msgId");
                    i(z)
                });
                w.delegate("div.hd_service a.hd_delete_notc", "click", function() {
                    w.data("customerMsgsNum", 0);
                    d()
                });
                w.delegate(".hd_notice_list dl", "mouseenter", function() {
                    a(this).addClass("hd_notc_cur")
                });
                w.delegate(".hd_notice_list dl", "mouseleave", function() {
                    a(this).removeClass("hd_notc_cur")
                });
                w.delegate(".hd_notice_detail", "mousewheel", function(A, D) {
                    var C = a(".hd_notice_detail", w).scrollTop();
                    var z = a(".hd_notice_detail", w).outerHeight();
                    var B = (a(".hd_service", w).outerHeight() ? a(".hd_service", w).outerHeight() : 0) + a(".hd_notice_list", w).outerHeight() - 1;
                    if (z > B) {
                        A.preventDefault()
                    }
                    if (C == B - z && (D < 0)) {
                        A.preventDefault()
                    }
                })
            }
            ;
        f.showMsgsNum = function() {
            if (w.size() > 0) {
                b.globalCheckLogin(function(x) {
                    if (x && x.result == 1) {
                        j()
                    }
                })
            }
        }
        ;
        f.showMsgs = function() {
            if (w.size() > 0) {
                b.globalCheckLogin(function(x) {
                    if (x && x.result == 1) {
                        d()
                    }
                })
            }
        }
        ;
        window.topMsgTimeoutHandler = setTimeout(function() {
            f.showMsgsNum()
        }, 1 * 1000)
    })
})(jQuery);
(function() {
    var i = [];
    var j = [];
    Array.prototype.Contains = function(a) {
        if (null  == a) {
            return
        }
        for (var b = 0; b < this.length; b++) {
            if (this[b] == a) {
                return true
            }
        }
        return false
    }
    ;
    var l = function(b) {
            var c = b.attr("data-extTrackUrl");
            if (i.length && i.Contains(c)) {
                return
            }
            if (c) {
                var a = new Image(1,1);
                a.src = c;
                b.attr("data-extTrackUrl", "")
            }
        }
        ;
    var k = function(b) {
            if (b.attr("data-extTrackUrl")) {
                l(b);
                return
            }
            var a = b.find("a[data-extTrackUrl],img[data-extTrackUrl]");
            a.each(function() {
                l(jQuery(this))
            })
        }
        ;
    var h = function() {
            var b = jQuery('[data-TrackType="initShow"]');
            var a = b.find("[data-extTrackUrl]");
            a.each(function() {
                l(jQuery(this))
            })
        }
        ;
    h();
    var g = {
        sendTrackByTrigger: k,
        sendTrack: l
    };
    window.extTracker = g;
    require(["common_impression"], function() {})
})();
(function(c) {
    Array.prototype.contains = function(a) {
        for (var b = 0; b < this.length; b++) {
            if (this[b] == c.trim(a)) {
                return true
            }
        }
        return false
    }
    ;
    var d = {
        getWhiteList: function() {
            var b;
            var f = c("#globalcookiewhitelist");
            if (!f || !f.val()) {
                return []
            }
            var a = f.val();
            b = a.split(",");
            return b
        },
        getGlobalCookie: function() {
            var a = document.cookie.split(";");
            return a
        },
        deleteCookie: function(b, a) {
            var f = new Date();
            f.setTime(f.getTime());
            document.cookie = b + "=" + a + ";expires=" + f.toGMTString() + ";domain=.yhd.com;path=/;"
        },
        handleBlackListCookie: function() {
            var j = this.getWhiteList();
            var a = this.getGlobalCookie();
            if (j.length == 0 || a.length == 0) {
                return
            }
            for (var h = 0; h < a.length; h++) {
                if (a[h] && a[h].split("=").length > 0) {
                    var i = c.trim(a[h].split("=")[0]);
                    var b = a[h].split("=")[1];
                    if (!contains(j, i)) {
                        this.deleteCookie(i, b)
                    }
                }
            }
        }
    };
    c(document).ready(function() {
        var a = c("#globalcookiewhitelist");
        if (!a || !a.val()) {
            return
        }
        setTimeout(function() {
            d.handleBlackListCookie()
        }, 3000)
    })
})(jQuery);
(function(a) {
    a(function() {
        var e = window.loli || (window.loli = {});
        var j = e.app = e.app || {};
        var s = e.app.user = e.app.user || {};
        var f = e.yhdStore;
        var p = e.yhdSessionStore;
        var m = (typeof popupNewUserFlag != "undefined" && popupNewUserFlag == "1") ? 1 : 0;
        var n = a.cookie("provinceId");
        var b = a.cookie("cityId");
        var d = a.cookie("yihaodian_uid");
        var g = a.cookie("guid");
        var i = a.cookie("unionKey");
        var c = (typeof c == "undefined") ? 1 : c;
        var l = 99;
        var r = "INDEX2_GLOBAL_DC_TP";
        var o = function() {
                var t = "http://gemini.yhd.com/libraService/exactNewCrowdAdServe?callback=?";
                var v = function(w) {
                        var x = h(w);
                        if (x != "") {
                            a("body").append(x);
                            require(["content_tracker_expo"], function(y) {
                                y.run("adContentTrackerEvent", "ad.dolphin.bidding", a("#newUserPopup a:eq(0)"))
                            });
                            e.cookie.setAllDomain("newUserPopupFlag", "1", "/");
                            q()
                        }
                    }
                    ;
                var u = {
                    mcSiteId: c,
                    provinceId: n,
                    cityId: b,
                    userId: d,
                    guId: g,
                    platformId: l,
                    trackerU: i,
                    codes: r
                };
                a.getJSON(t, u, function(w) {
                    if (w && w.status == 1 && w.value && w.value.sourceList) {
                        v(w.value.sourceList)
                    }
                })
            }
            ;
        var h = function(u) {
                var v = [];
                if (u.length > 0) {
                    var t = u[0];
                    if (t && t.imageUrl) {
                        if (t.imageUrl.substring(t.imageUrl.lastIndexOf(".") + 1).toLowerCase() == "png") {
                            v.push("<div class='advertisement_wrap' id='newUserPopup'>");
                            v.push("<div class='advertisement_pic' data-tpa='YHD_GLOBAl_TOP_USERPOPUP'>");
                            v.push("<a href='" + t.linkUrl + "' target='_blank' title='" + t.displayTitle + "' data-ref='" + t.ref + "' data-tc='" + t.tc + "' data-recordTracker='1'>");
                            v.push("<img src='" + t.imageUrl + "'>");
                            v.push("<a class='close_btn' href='javascript:void(0);'></a>");
                            v.push("</a>");
                            v.push("</div>");
                            v.push("</div>")
                        }
                    }
                }
                return v.join("")
            }
            ;
        var q = function() {
                a("#newUserPopup").find(".close_btn").click(function() {
                    a("#newUserPopup").fadeOut()
                })
            }
            ;
        var k = function(t) {
                var u = t || function() {}
                    ;
                if (a.cookie("newUserPopupFlag") == "1") {
                    u(0)
                } else {
                    if (d == "") {
                        u(1);
                        return
                    }
                    f.getFromRoot("top_prism_order_num_" + d, function(w) {
                        if (w && w.status == 1) {
                            var v = (w.value && !isNaN(w.value)) ? parseInt(w.value) : 0;
                            if (v > 0) {
                                u(0)
                            } else {
                                u(1)
                            }
                        }
                    })
                }
            }
            ;
        s.popupNewUserWin = function() {
            if (m) {
                k(function(t) {
                    if (t) {
                        if (a("body").data("newUserPopupFlag")) {
                            a("#newUserPopup").show();
                            return
                        }
                        a("body").data("newUserPopupFlag", 1);
                        o()
                    }
                })
            }
        }
        ;
        s.checkFlag = function(t) {
            k(t)
        }
        ;
        window.popupNewUserTimeoutHandler = setTimeout(function() {
            s.popupNewUserWin()
        }, 1000)
    })
})(jQuery);
(function() {
    var b = {
        start: function() {
            try {
                function m(c) {
                    return (typeof c !== "undefined") && c != null
                }
                function n(c) {
                    if (!c || c == null ) {
                        return ""
                    }
                    return c.replace(/(^\s*)|(\s*$)/g, "")
                }
                function j() {
                    var c = null ;
                    var g = document.getElementsByTagName("meta");
                    for (var d = 0; d < g.length; d++) {
                        if (g[d].getAttribute("name") == "tp_page") {
                            var f = g[d].getAttribute("content");
                            f = n(f);
                            var e = ".";
                            if (m(f)) {
                                if (f.indexOf(e) > 0) {
                                    c = f.split(e);
                                    if (c.length == 1) {
                                        c.push(0)
                                    }
                                } else {
                                    if (f.indexOf(e) != 0) {
                                        c = [f, 0]
                                    }
                                }
                            }
                            break
                        }
                    }
                    return c
                }
                function i(g) {
                    var h = location.href;
                    var q = null
                        , c = 0
                        , d = null
                        , r = null ;
                    r = g.attr("data-kcmdid");
                    if (r) {
                        q = g.attr("data-kcmf");
                        c = parseInt(g.attr("data-adnum"));
                        d = g.attr("data-kcmdtp");
                        var e = jQuery.cookie("provinceId");
                        if (!e) {
                            e = 1
                        }
                        var f = c;
                        if (m(q)) {
                            f = g.find(q).size()
                        } else {
                            f = g.find("img").size()
                        }
                        if (m(r) && (c - f) > 0) {
                            setTimeout(function() {
                                var o = [];
                                o.push(["setCustomVar", "logType", "blankAdv"]);
                                o.push(["setCustomVar", "kcmdid", r]);
                                o.push(["setCustomVar", "kcmdtp", d]);
                                o.push(["setCustomVar", "adnum", c]);
                                o.push(["setCustomVar", "leftAdnum", (c - f)]);
                                o.push(["setCustomVar", "kcmf", q]);
                                o.push(["setCustomVar", "url", h]);
                                o.push(["setCustomVar", "iev", navigator.userAgent || ""]);
                                o.push(["setCustomVar", "provinceId", e]);
                                var p = j();
                                if (m(p)) {
                                    o.push(["setCustomVar", "pageTypeId", p[0] || 0]);
                                    o.push(["setCustomVar", "pageValue", p[1] || 0])
                                } else {
                                    o.push(["setCustomVar", "pageTypeId", 0]);
                                    o.push(["setCustomVar", "pageValue", 0])
                                }
                                if (window.EventEntity && window.EventEntity.notifyLogSend) {
                                    if (!window.EventEntity.paramObj) {
                                        window.EventEntity.paramObj = {}
                                    }
                                    if (!window.EventEntity.paramObj.logSendEvent) {
                                        window.EventEntity.paramObj.logSendEvent = []
                                    }
                                    window.EventEntity.paramObj.logSendEvent.push(o);
                                    window.EventEntity.notifyLogSend()
                                }
                            }, 0)
                        }
                    }
                }
                function l() {
                    jQuery("[data-kcmdid]").each(function() {
                        var c = this;
                        if (loli.isVisual(c) && c && c.style && c.style.display != "none") {
                            i($(c))
                        }
                    })
                }
                function k() {
                    var c = 200
                        , d = null ;
                    setTimeout(function() {
                        l()
                    }, 500);
                    jQuery(window).bind("scroll", function() {
                        d && clearTimeout(d);
                        d = setTimeout(function() {
                            l()
                        }, c)
                    })
                }
                k()
            } catch (a) {}
        }
    };
    b.start()
})();
(function(a) {
    a(function() {
        var k = window.loli || (window.loli = {});
        var g = k.prism = k.prism || {};
        var d = g.functions = g.functions || {};
        var e = a.cookie("provinceId") || 1;
        var f = a.cookie("yihaodian_uid");
        var l = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!l) {
            return
        }
        if (k.util.isIE() && k.util.isIE() <= 7) {
            return
        }
        var h = (typeof globalPrismFeedbackURL != "undefined" && globalPrismFeedbackURL != "") ? globalPrismFeedbackURL : "http://www.yhd.com/survey/4/1/577.html";
        var j = [{
            id: "prismTopAdv",
            text: "大促广告",
            type: "adv",
            iconfont: "",
            position: "top",
            disable: false,
            expand: true,
            expandCss: "",
            tpc: 1,
            url: ""
        }, {
            id: "prismCart",
            text: "购物车",
            type: "cart",
            iconfont: "&#xe627;",
            position: "center",
            disable: false,
            expand: true,
            expandCss: "prism_cart_show",
            tpc: 10,
            url: ""
        }, {
            id: "prismOrder",
            text: "我的订单",
            type: "icon",
            iconfont: "&#xe621;",
            position: "center",
            disable: false,
            expand: true,
            expandCss: "prism_order_show",
            tpc: 20,
            url: "http://my.yhd.com/order/myOrder.do"
        }, {
            id: "prismCoupon",
            text: "抵用券",
            type: "icon",
            iconfont: "&#xe625;",
            position: "center",
            disable: false,
            expand: true,
            expandCss: "prism_coupon_show",
            tpc: 30,
            url: "http://coupon.yhd.com/myCoupon"
        }, {
            id: "prismFavorite",
            text: "收藏夹",
            type: "icon",
            iconfont: "&#xe626;",
            position: "center",
            disable: false,
            expand: true,
            expandCss: "prism_favor_show",
            tpc: 40,
            url: "http://my.yhd.com/member/myNewCollection/myFavorite.do"
        }, {
            id: "prismFeedback",
            text: "用户反馈",
            type: "icon",
            iconfont: "&#xe61f;",
            position: "bottom",
            disable: false,
            expand: false,
            expandCss: "",
            tpc: 50,
            url: h
        }, {
            id: "prismQRCode",
            text: "二维码",
            type: "icon",
            iconfont: "&#xe622;",
            position: "bottom",
            disable: false,
            expand: false,
            expandCss: "",
            tpc: 60,
            url: ""
        }, {
            id: "prismBacktop",
            text: "返回顶部",
            type: "icon",
            iconfont: "&#xe629;",
            position: "bottom",
            disable: false,
            expand: false,
            expandCss: "",
            tpc: 70,
            url: ""
        }];
        var b = function(n) {
                var p = [];
                if (n.length == 0) {
                    return j
                }
                for (var q = 0; q < j.length; q++) {
                    var s = j[q];
                    for (var o = 0; o < n.length; o++) {
                        var r = n[o];
                        if (s.id == r.id) {
                            s = a.extend(s, r);
                            break
                        }
                    }
                    p.push(s)
                }
                for (var o = 0; o < n.length; o++) {
                    var r = n[o];
                    var t = false;
                    for (var q = 0; q < j.length; q++) {
                        var s = j[q];
                        if (s.id == r.id) {
                            t = true;
                            break
                        }
                    }
                    if (!t) {
                        p.push(r)
                    }
                }
                return p
            }
            ;
        var i = function(p) {
                var o = [];
                var n = p.url ? p.url : "javascript:;";
                var q = p.url ? "target='_blank'" : "";
                if (p.type == "cart") {
                    o.push("<div class='prism_nav_tab prism_cart_wrap' data-type='" + p.type + "' data-tpc='" + p.tpc + "' id='" + p.id + "'>");
                    o.push("<a class='prism_cart_tab' href='" + n + "' " + q + ">");
                    o.push("<em class='prism_iconfont'>" + p.iconfont + "</em>");
                    o.push("<div class='prism_cart_text'>" + p.text + "</div>");
                    o.push("<p id='prismCartNum' class='prism_cart_num none'><u></u></p>");
                    o.push("</a>");
                    o.push("<div class='prism_tips_wrap prism_cart_recommend none' id='prismCartTips'>");
                    o.push("<em class='tips_arrow'></em>");
                    o.push("<p class='prism_cart_tips'><i></i>已成功加入购物车</p>");
                    o.push("</div>");
                    o.push("</div>")
                } else {
                    if (p.type == "icon") {
                        o.push("<div class='prism_nav_tab prism_icon_wrap' data-type='" + p.type + "' data-tpc='" + p.tpc + "' id='" + p.id + "'>");
                        o.push("<a href='" + n + "' " + q + ">");
                        o.push("<span class='prism_icon_tab'>");
                        o.push("<em class='prism_iconfont'>" + p.iconfont + "</em>");
                        o.push("</span>");
                        o.push("<u class='prism_icon_text'>" + p.text + "</u>");
                        o.push("</a>");
                        o.push("</div>")
                    } else {
                        if (p.type = "adv") {
                            o.push("<div class='prism_nav_tab' data-type='" + p.type + "' data-tpc='" + p.tpc + "' id='" + p.id + "'>");
                            o.push("</div>")
                        }
                    }
                }
                return o.join("")
            }
            ;
        var m = function(n) {
                var p = [];
                p.push("<div id='prismWrap' class='yhd_prism_wrap' data-tpa='YHD_GLOBAl_HEADER_PRISM'>");
                p.push("<div class='yhd_prism_nav'>");
                var s = ["top", "center", "bottom"];
                for (var r = 0; r < s.length; r++) {
                    if (s[r] == "top") {
                        p.push("<div class='prism_top_ad'>")
                    } else {
                        if (s[r] == "center") {
                            p.push("<div class='prism_nav_center'>")
                        } else {
                            if (s[r] == "bottom") {
                                p.push("<div class='prism_nav_btm'>")
                            }
                        }
                    }
                    for (var o = 0; o < n.length; o++) {
                        var q = n[o];
                        if (!q.disable && q.position == s[r]) {
                            p.push(i(q))
                        }
                    }
                    p.push("</div>")
                }
                p.push("</div>");
                p.push("<div class='yhd_prism_show'>");
                for (var o = 0; o < n.length; o++) {
                    var q = n[o];
                    if (!q.disable && q.expand) {
                        p.push("<div id='" + q.id + "Detail' data-tpc='" + (q.tpc * 100) + "' class='prism_show_item " + q.expandCss + "'>");
                        p.push("</div>")
                    }
                }
                p.push("</div>");
                p.push("</div>");
                return p.join("")
            }
            ;
        var c = function() {
                var n = a("#prismWrap .yhd_prism_nav");
                n.delegate("div.prism_icon_wrap", "mouseenter", function() {
                    a(this).addClass("prism_icon_hover")
                });
                n.delegate("div.prism_icon_wrap", "mouseleave", function() {
                    a(this).removeClass("prism_icon_hover")
                });
                n.delegate("#prismBacktop", "click", function() {
                    a("body,html").stop().animate({
                        scrollTop: 0
                    });
                    return false
                });
                a(document.body).click(function(p) {
                    var r = a(this);
                    var q = p.target ? p.target : p.srcElement;
                    if (q) {
                        var o = a(q).parents("div.yhd_prism_wrap").size();
                        if (o == 0 && a("#prismWrap").hasClass("yhd_prism_wrap_open")) {
                            g.functions.close()
                        }
                    }
                })
            }
            ;
        g.functions.init = function() {
            var n = (typeof customPrismConfig != "undefined") ? customPrismConfig : [];
            var o = b(n);
            g.config = o;
            var p = m(o);
            if (p != "") {
                a("body").append(p);
                c()
            }
        }
        ;
        g.functions.close = function() {
            var q = a("#prismWrap");
            var p = a("#prismWrap .yhd_prism_nav");
            var r = a(".prism_nav_tab", p);
            var o = a("#prismWrap .yhd_prism_show");
            var n = a(".prism_show_item", o);
            r.removeClass("prism_tab_select").data("item-opened", 0);
            q.removeClass("yhd_prism_wrap_open yhd_prism_wrap_wider")
        }
        ;
        g.functions.open = function(q) {
            var n = a("#prismWrap");
            var t = a("#prismWrap .yhd_prism_nav");
            var r = a(".prism_nav_tab", t);
            var u = a("#prismWrap .yhd_prism_show");
            var p = a(".prism_show_item", u);
            var v = q.attr("id");
            var o = v + "Detail";
            var s = q.attr("data-type");
            if (s == "cart") {
                n.addClass("yhd_prism_wrap_open yhd_prism_wrap_wider")
            } else {
                n.removeClass("yhd_prism_wrap_wider").addClass("yhd_prism_wrap_open")
            }
            r.removeClass("prism_tab_select").data("item-opened", 0);
            q.addClass("prism_tab_select").data("item-opened", 1);
            p.each(function() {
                var w = a(this);
                if (w.hasClass("prism_show_cur") && w.attr("id") != o) {
                    w.removeClass("prism_show_cur prism_show_cur_animate").addClass("prism_prev_hide")
                }
            });
            a("#" + o).removeClass("prism_prev_hide").addClass("prism_show_cur prism_show_cur_animate")
        }
        ;
        k.prism.functions.init()
    })
})(jQuery);
(function(a) {
    a(function() {
        var s = window.loli || (window.loli = {});
        var z = s.prism = s.prism || {};
        var C = z.functions = z.functions || {};
        var D = a.cookie("provinceId") || 1;
        var y = a.cookie("yihaodian_uid");
        var k = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!k) {
            return
        }
        if (s.util.isIE() && s.util.isIE() <= 7) {
            return
        }
        var u = (typeof globalPrismCartFlag != "undefined" && globalPrismCartFlag == "0") ? 0 : 1;
        if (!u) {
            return
        }
        var V = s.prism.minicart = s.prism.minicart || {};
        var i = s.app.minicart;
        var g = URLPrefix.cartDomain || "http://cart.yhd.com";
        V.addItemCallback = function(Y, X) {
            i.addItemCallback(Y, X)
        }
        ;
        V.addItemFailback = function(Y, X) {
            i.addItemFailback(Y, X)
        }
        ;
        V.removeItemCallback = function(Y, X) {
            i.removeItemCallback(Y, X)
        }
        ;
        V.removeItemFailback = function(Y, X) {
            i.removeItemFailback(Y, X)
        }
        ;
        V.updateItemCallback = function(Y, X) {
            i.updateItemCallback(Y, X)
        }
        ;
        V.updateItemFailback = function(Y, X) {
            i.updateItemFailback(Y, X)
        }
        ;
        V.chooseItemCallback = function(Y, X) {
            i.chooseItemCallback(Y, X)
        }
        ;
        V.chooseItemFailback = function(Y, X) {
            i.chooseItemFailback(Y, X)
        }
        ;
        V.changeItemCallback = function(Y, X) {
            i.resetCart()
        }
        ;
        V.changeAddressCallback = function(X) {
            i.resetCart()
        }
        ;
        V.reloadCartCallback = function(X) {
            i.resetCart()
        }
        ;
        V.errorCallback = function(X, Z, Y) {
            YHD.alert("目前购买人数过多,请稍后重试.")
        }
        ;
        V.getJSON = function(Y, ab, Z, X, aa) {
            if (aa == null ) {
                aa = 3000
            }
            jQuery.ajax({
                url: Y,
                data: ab,
                dataType: "jsonp",
                jsonp: "callback",
                jsonpCallback: "jsonp" + new Date().getTime(),
                cache: false,
                timeout: aa,
                success: function(ac) {
                    if (Z) {
                        Z(ac)
                    }
                },
                error: function(ac, ae, ad) {
                    if (X) {
                        X(ac, ae, ad)
                    } else {
                        V.errorCallback(ac, ae, ad)
                    }
                }
            })
        }
        ;
        var R = a("#prismCartDetail");
        var p = a("#prismCartDetail");
        var O = a("#prismCartNum");
        var x = function() {
                var Y = window.navigator.userAgent.toLowerCase();
                var Z = /msie ([\d\.]+)/;
                if (Z.test(Y)) {
                    var X = parseInt(Z.exec(Y)[1]);
                    return X
                }
                return 0
            }
            ;
        var r = function(Z, Y, ac) {
                var ab = Y || 60;
                var X = ac || 60;
                var aa = /_\d+x\d+\.([a-zA-Z]+)$/;
                if (Z) {
                    if (aa.test(Z)) {
                        Z = Z.replace(aa, "_" + ab + "x" + X + ".$1")
                    } else {
                        Z = Z.substring(0, Z.lastIndexOf(".")) + "_" + ab + "x" + X + Z.substring(Z.lastIndexOf("."))
                    }
                } else {
                    Z = "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_" + ab + "x" + X + ".jpg"
                }
                return Z
            }
            ;
        var A = function(ac, Z, aa, ab) {
                a(ac).data("lastTime", new Date().getTime());
                if (Z) {
                    var X = Z.call(a(ac));
                    a(ac).data("lastResult", X)
                }
                var Y = setTimeout(function() {
                    var af = a(ac).data("lastTime") ? a(ac).data("lastTime") : new Date().getTime();
                    var ae = (typeof a(ac).data("lastResult") == "undefined" || a(ac).data("lastResult")) ? true : false;
                    var ad = new Date().getTime();
                    if (ad - af >= (ab - 50)) {
                        if (aa && ae) {
                            aa.call(a(ac))
                        }
                    }
                }, ab)
            }
            ;
        var K = [{
            key: "华北",
            value: [{
                id: 2,
                name: "北京"
            }, {
                id: 3,
                name: "天津"
            }, {
                id: 4,
                name: "河北"
            }, {
                id: 32,
                name: "山西"
            }, {
                id: 8,
                name: "内蒙古"
            }]
        }, {
            key: "华东",
            value: [{
                id: 1,
                name: "上海"
            }, {
                id: 5,
                name: "江苏"
            }, {
                id: 6,
                name: "浙江"
            }, {
                id: 13,
                name: "安徽"
            }, {
                id: 14,
                name: "福建"
            }, {
                id: 16,
                name: "山东"
            }]
        }, {
            key: "华南",
            value: [{
                id: 20,
                name: "广东"
            }, {
                id: 21,
                name: "广西"
            }, {
                id: 22,
                name: "海南"
            }]
        }, {
            key: "华中",
            value: [{
                id: 15,
                name: "江西"
            }, {
                id: 17,
                name: "河南"
            }, {
                id: 18,
                name: "湖北"
            }, {
                id: 19,
                name: "湖南"
            }]
        }, {
            key: "西南",
            value: [{
                id: 7,
                name: "重庆"
            }, {
                id: 12,
                name: "四川"
            }, {
                id: 23,
                name: "贵州"
            }, {
                id: 24,
                name: "云南"
            }, {
                id: 25,
                name: "西藏"
            }]
        }, {
            key: "西北",
            value: [{
                id: 26,
                name: "陕西"
            }, {
                id: 27,
                name: "甘肃"
            }, {
                id: 28,
                name: "青海"
            }, {
                id: 30,
                name: "宁夏"
            }, {
                id: 29,
                name: "新疆"
            }]
        }, {
            key: "东北",
            value: [{
                id: 9,
                name: "辽宁"
            }, {
                id: 10,
                name: "吉林"
            }, {
                id: 11,
                name: "黑龙江"
            }]
        }];
        var w = function() {
                var ab = a.cookie("detail_yhdareas");
                var ad = [];
                var ac = [];
                var Z = /([\d]+_[\d]+_[\d]+)_([\S^_]+_[\S^_]+_[\S^_]+)/;
                if (ab && Z.test(ab)) {
                    ad = Z.exec(ab)[1].split("_");
                    ac = Z.exec(ab)[2].replace(/\<i\>\<\/i\>/g, "").split("_")
                } else {
                    ad = [D];
                    for (var aa = 0; aa < K.length; aa++) {
                        var X = K[aa].value;
                        for (var Y = 0; Y < X.length; Y++) {
                            if (X[Y].id == D) {
                                ac = [X[Y].name];
                                break
                            }
                        }
                    }
                }
                return [ad, ac]
            }
            ;
        var F = function(X) {
                if (!X || X.length != 2) {
                    return
                }
                var Z = X[0];
                var aa = X[1];
                var Y = Z[0] + "_" + Z[1] + "_" + Z[2] + "_" + aa[0] + "_" + aa[1] + "_" + aa[2];
                s.cookie.setAllDomain("provinceId", Z[0], "/", 800);
                s.cookie.setAllDomain("detail_yhdareas", Y, "/", 800);
                V.changeAddressCallback(X);
                setTimeout(function() {
                    if (D != Z[0]) {
                        setAddressCity(Z[0])
                    }
                }, 1500)
            }
            ;
        var H = function() {
                var Y = jQuery.cookie("cart_num");
                var X = (Y && !isNaN(Y)) ? parseInt(Y) : 0;
                if (X > 0) {
                    O.find("u").text(X > 999 ? "999+" : X);
                    O.show()
                } else {
                    O.hide()
                }
            }
            ;
        var o = function() {
                var Z = [];
                var ab = w();
                var ad = ab[0];
                var ac = ab[1];
                Z.push("<div class='yhd_province prism_province clearfix' data-tpc='1001'>");
                Z.push("<div class='yhd_area_select'>");
                Z.push("<div class='yhd_address'>");
                Z.push("<span class='hd_val_text' data-value='" + ad.join("_") + "'>" + ac.join("|") + "</span>");
                Z.push("<i></i>");
                Z.push("</div>");
                Z.push("<div class='yhd_tab_detail none'>");
                Z.push("<div class='yhd_area_tab clearfix'>");
                Z.push("<span data-value='" + ad[0] + "' class='yhd_on'><em>" + ac[0] + "</em></span>");
                Z.push("<span data-value='" + (ad.length > 1 ? ad[1] : "") + "' class=''><em>" + (ac.length > 1 ? ac[1] : "请选择市") + "</em></span>");
                Z.push("<span data-value='" + (ad.length > 2 ? ad[2] : "") + "' class=''><em>" + (ac.length > 2 ? ac[2] : "请选择区") + "</em></span>");
                Z.push("</div>");
                Z.push("<div class='yhd_area_box'>");
                Z.push("<div class='yhd_item hd_first_area'>");
                for (var aa = 0; aa < K.length; aa++) {
                    var X = K[aa].value;
                    Z.push("<dl class='clearfix'>");
                    Z.push("<dt>" + K[aa].key + "：</dt>");
                    for (var Y = 0; Y < X.length; Y++) {
                        Z.push("<dd><a data-value='" + X[Y].id + "' class='" + (ad[0] == X[Y].id ? "hd_cart_cur" : "") + "' href='javascript:;'>" + X[Y].name + "</a></dd>")
                    }
                    Z.push("</dl>")
                }
                Z.push("</div>");
                Z.push("<div class='yhd_item yhd_second_area none'>");
                Z.push("</div>");
                Z.push("<div class='yhd_item yhd_third_area none'>");
                Z.push("</div>");
                Z.push("</div>");
                Z.push("<span class='yhd_close_btn'>×</span>");
                Z.push("</div>");
                Z.push("</div>");
                Z.push("<a class='blue_link fr' data-tpc='1002' href='http://cart.yhd.com/cart/cart.do' target='_blank'>查看购物车</a>");
                Z.push("</div>");
                return Z.join("")
            }
            ;
        var I = function(ad, al, ag, ak) {
                var am = [];
                var ab = r(ad.pic);
                var Z = "http://item.yhd.com/item/" + ad.pmId;
                var ae = ad.name;
                var ah = ad.checked;
                var ai = ad.amount != null  ? ad.amount.money : 0;
                var af = ad.amount != null  ? ad.amount.points : 0;
                var ac = "";
                var X = "";
                if (af > 0) {
                    ac += af + "积分"
                }
                if (ai > 0) {
                    ac += "+¥" + ai
                }
                if (ac.indexOf("+") == 0) {
                    ac = ac.substring(1)
                }
                if (ac == "") {
                    ac = "¥0"
                }
                if (al) {
                    ah = false;
                    X = "商品无库存或当前区域不销售";
                    if (ad.warningCode && ak.tips) {
                        for (var aj = 0; aj < ak.tips.length; aj++) {
                            var Y = ak.tips[aj];
                            if (Y.code == ad.warningCode) {
                                X = Y.msg;
                                break
                            }
                        }
                    }
                }
                if (ad.typeValue == 3) {
                    ag = false;
                    ab = URLPrefix.statics + "/global/images/promotion_mix.jpg";
                    Z = URLPrefix.search + "/p/pt" + ad.promotion.promotionId + "-pl" + ad.promotion.promotionLevelId;
                    ae = ad.promotion.title
                }
                if (ad.typeValue == 9) {
                    var aa = ad.promotion.promotionId;
                    Z = "http://item.yhd.com/item/lp/" + aa + "_" + ad.pmId + "_" + D
                }
                am.push("<div class='clearfix hd_cart_wrap'>");
                am.push("<a class='hd_select_box " + (ah ? "hd_selected" : "") + "' href='javascript:;' cartItemId='" + ad.id + "'></a>");
                am.push("<a class='hd_pro_img' href='" + Z + "' target='_blank'><img src='" + ab + "' alt=''/></a>");
                am.push("<div class='hd_cart_detail'>");
                am.push("<a class='hd_pro_name' href='" + Z + "' target='_blank' title='" + ae + "'>" + ae + "</a>");
                am.push("<p class='hd_subcode'></p>");
                am.push("<div class='clearfix'>");
                am.push("<em>" + ad.num + "</em>");
                am.push("<span class='hd_sold_tips'>" + X + "</span>");
                if (ag) {
                    am.push("<div class='hd_num_box'>");
                    am.push("<a class='" + (ad.num > 1 ? "hd_minus" : "hd_minus_disable") + "' href='javascript:;'></a>");
                    am.push("<input type='text' name='itemNum' class='hd_minicart_num' value='" + ad.num + "' cartItemId='" + ad.id + "'>");
                    am.push("<a class='hd_plus' href='javascript:;'></a>");
                    am.push("</div>")
                }
                am.push("<b>" + ac + "</b>");
                am.push("</div>");
                am.push("</div>");
                am.push("<a class='hd_cart_del' href='javascript:;' cartItemId='" + ad.id + "'></a>");
                am.push("<div class='hd_over_tips' style='display: none;'>");
                am.push("<i></i><p></p>");
                am.push("</div>");
                am.push("</div>");
                return am.join("")
            }
            ;
        var T = function(az) {
                var ad = [];
                if (!az || !az.summary) {
                    return ""
                }
                for (var ak = 0; ak < az.bags.length; ak++) {
                    var at = az.bags[ak];
                    var Z = at.summary.count;
                    var aF = at.yhdMerchant == true ? "1号店" : at.merchantName;
                    var aD = at.yhdMerchant == true ? "javascript:;" : "http://shop.yhd.com/merchantfront/accessAction.action?merchantId=" + at.merchantIds[0] + "&siteId=1";
                    var ah = true;
                    for (var aj = 0; aj < at.itemGroups.length; aj++) {
                        for (var aC = 0; aC < at.itemGroups[aj].items.length; aC++) {
                            if (!at.itemGroups[aj].items[aC].checked) {
                                ah = false;
                                break
                            }
                        }
                    }
                    if (at.itemGroups.length == 0) {
                        ah = false
                    }
                    ad.push("<dl>");
                    ad.push("<dt>");
                    ad.push("<span class='fr'>共<i>" + Z + "</i>件商品</span>");
                    ad.push("<em class='hd_red_icon'></em>");
                    ad.push("<a class='hd_select_box " + (ah ? "hd_selected" : "") + "' href='javascript:;'></a>");
                    ad.push("<a href='" + aD + "' " + (at.yhdMerchant ? "" : "target='_blank'") + "><b>" + aF + "</b></a>");
                    ad.push("</dt>");
                    for (var aj = 0; aj < at.itemGroups.length; aj++) {
                        var aw = at.itemGroups[aj];
                        for (var aC = 0; aC < aw.items.length; aC++) {
                            var X = aw.items[aC];
                            var al = (X.typeValue == 12 || X.typeValue == 11) ? false : true;
                            var ar = false;
                            if (X.typeValue == 3) {
                                al = false
                            }
                            if (X.typeValue != 2) {
                                ad.push("<dd class='hd_cart_cur " + (al ? "hd_num_cur" : "") + "' disable='" + ar + "' editable='" + al + "' productId='" + X.productId + "' pmId='" + X.pmId + "' cartItemId='" + X.id + "' parentCartItemId='" + X.id + "' itemNum='" + X.num + "' itemType='" + X.typeValue + "' productType='" + X.productType + "' checkoutType='" + (X.checkoutType ? X.checkoutType : 0) + "' promotionId='" + (X.promotion ? X.promotion.promotionId : "") + "' checked='" + X.checked + "'>");
                                ad.push(I(X, ar, al, az));
                                for (var an = 0; an < X.nestedItems.length;
                                     an++) {
                                    var aB = X.nestedItems[an];
                                    var ai = "http://item.yhd.com/item/" + aB.pmId;
                                    var ap = "¥" + (aB.amount != null  ? aB.amount.money : 0);
                                    var au = aB.name;
                                    if (aB.typeValue == 10) {
                                        ad.push("<p class='hd_gift'>");
                                        ad.push("<span class='fr'>" + ap + "</span>");
                                        ad.push("<em class='hd_extend'>延保</em>");
                                        ad.push("<a href='" + ai + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                        ad.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aB.id + "'></a>");
                                        ad.push("</p>")
                                    } else {
                                        if (aB.typeValue == 11) {
                                            ad.push("<p class='hd_gift'>");
                                            ad.push("<span class='fr'>" + ap + "</span>");
                                            ad.push("<em>搭售</em>");
                                            ad.push("<a href='" + ai + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                            ad.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + aB.id + "'></a>");
                                            ad.push("</p>")
                                        }
                                    }
                                }
                            } else {
                                for (var an = 0; an < X.nestedItems.length; an++) {
                                    var aB = X.nestedItems[an];
                                    ad.push("<dd class='hd_cart_cur " + (al ? "hd_num_cur" : "") + "' disable='" + ar + "' editable='" + al + "' productId='" + aB.productId + "' pmId='" + aB.pmId + "' cartItemId='" + aB.id + "' parentCartItemId='" + X.id + "' itemNum='" + aB.num + "' itemType='" + X.typeValue + "' productType='" + X.productType + "' checkoutType='" + (X.checkoutType ? X.checkoutType : 0) + "' promotionId='" + (X.promotion ? X.promotion.promotionId : "") + "' checked='" + aB.checked + "'>");
                                    ad.push(I(aB, ar, al, az));
                                    if (an != X.nestedItems.length - 1) {
                                        ad.push("</dd>")
                                    }
                                }
                            }
                            if (aC == aw.items.length - 1) {
                                for (var aA = 0; aA < aw.gifts.length; aA++) {
                                    var ay = aw.gifts[aA];
                                    var ai = "http://item.yhd.com/item/" + ay.pmId;
                                    var ap = "¥" + ay.price.money;
                                    var au = ay.name;
                                    var ax = ay.typeValue == 14 ? "换购" : "赠品";
                                    ad.push("<p class='hd_gift'>");
                                    if (ay.typeValue == 14) {
                                        ad.push("<span class='fr'>" + ap + "</span>")
                                    }
                                    ad.push("<em>" + ax + "</em>");
                                    ad.push("<a href='" + ai + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                    ad.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + ay.id + "'></a>");
                                    ad.push("</p>")
                                }
                            }
                            if (aj == at.itemGroups.length - 1 && aC == aw.items.length - 1) {
                                for (var ao = 0; ao < at.gifts.length; ao++) {
                                    var ay = at.gifts[ao];
                                    var ai = "http://item.yhd.com/item/" + ay.pmId;
                                    var ap = "¥" + ay.price.money;
                                    var au = ay.name;
                                    ad.push("<p class='hd_gift'>");
                                    ad.push("<em>赠品</em>");
                                    ad.push("<a href='" + ai + "' target='_blank' title='" + au + "'>" + au + "</a>");
                                    ad.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + ay.id + "'></a>");
                                    ad.push("</p>")
                                }
                                for (var ab = 0; ab < at.redemptions.length; ab++) {
                                    var am = at.redemptions[ab];
                                    var aq = "http://item.yhd.com/item/" + am.pmId;
                                    var ag = "¥" + am.price.money;
                                    var af = am.name;
                                    ad.push("<p class='hd_gift'>");
                                    ad.push("<span class='fr'>" + ag + "</span>");
                                    ad.push("<em>换购</em>");
                                    ad.push("<a href='" + aq + "' target='_blank' title='" + af + "'>" + af + "</a>");
                                    ad.push("<a href='javascript:void(0);' class='hd_gift_del' cartItemId='" + am.id + "'></a>");
                                    ad.push("</p>")
                                }
                            }
                            ad.push("</dd>")
                        }
                    }
                    for (var ab = 0; ab < at.warningItems.length; ab++) {
                        var av = at.warningItems[ab];
                        ad.push("<dd class='hd_sold_out hd_cart_cur' disable='true' editable='false'>");
                        ad.push(I(av, true, false, az));
                        ad.push("</dd>")
                    }
                    var aa = 0;
                    var ae = [];
                    for (var aj = 0; aj < at.itemGroups.length; aj++) {
                        var aw = at.itemGroups[aj];
                        var ac = aw.pricePromotions;
                        aa = aa + ac.length;
                        for (var an = 0; an < ac.length; an++) {
                            ae.push(ac[an].promotion.displayName)
                        }
                    }
                    aa = aa + at.reductCashes.length;
                    for (var aE = 0; aE < at.reductCashes.length; aE++) {
                        ae.push(at.reductCashes[aE].promotion.displayName)
                    }
                    ad.push("<dd class='clearfix hd_min_sum'>");
                    if (aa > 0) {
                        ad.push("<div class='fl'>");
                        ad.push("参加" + aa + "项促销，共节约<b>¥" + at.summary.deduction + "</b><u></u>");
                        ad.push("<div class='hd_sale_show'>");
                        ad.push("<i></i>");
                        for (var Y = 0; Y < ae.length; Y++) {
                            ad.push("<p>" + ae[Y] + "</p>")
                        }
                        ad.push("</div>");
                        ad.push("</div>")
                    }
                    if (at.yhdMerchant == true) {
                        ad.push("<em class='fr'>" + at.summary.weight + "KG</em>")
                    }
                    ad.push("</dd>");
                    ad.push("</dl>")
                }
                return ad.join("")
            }
            ;
        var h = function(Z) {
                var X = [];
                if (Z) {
                    if (!Z.summary) {
                        var Y = a.cookie("ut");
                        if (Y) {
                            X.push("<div class='hd_none_tips'>");
                            X.push("<span class='hd_none_icon'></span>");
                            X.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~</p>");
                            X.push("</div>")
                        } else {
                            X.push("<div class='hd_none_tips'>");
                            X.push("<span class='hd_none_icon'></span>");
                            X.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~</p>");
                            X.push("<p class='hd_none_text'>如果您已添加过商品，登录后就可以查看哦~</p>");
                            X.push("<a class='prism_go_index' href='javascript:void(0);' data-tpc='1007' id='prismCartLogin'>登录</a>");
                            X.push("</div>")
                        }
                        return
                    }
                    X.push("<div class='hd_cart_scrollwrap'>");
                    X.push(o());
                    X.push("<div class='hd_cart_list' data-tpc='1003'>");
                    X.push(T(Z));
                    X.push("</div>");
                    X.push("<p class='hd_feedback' data-tpc='1004'>");
                    X.push("<em></em><a class='blue_link' href='http://yihaodian.sojump.com/jq/5279459.aspx' target='_blank'>意见反馈</a>");
                    X.push("</p>");
                    X.push("</div>");
                    X.push("<div class='hd_bottom_tips' style='display:none;'>");
                    X.push("<i></i><em></em><u></u><p></p>");
                    X.push("</div>");
                    X.push("<div class='hd_total_pro' data-tpc='1005'>");
                    X.push("<div class='fl'>");
                    X.push("<span class='hd_all_select'><a href='javascript:void(0);' class='hd_select_box' id='prismCartSeltAll'></a><i>全选</i></span>");
                    X.push("合计<b><em></em></b><p class='hd_point_num'><u></u></p>");
                    X.push("</div>");
                    X.push("<a class='fr' href='javascript:void(0);' data-tpc='1006' id='prismCartPaybtn'>立即结算</a>");
                    X.push("</div>");
                    X.push("<div class='hd_area_mask none'></div>");
                    X.push("<form method='post' id='prismCartForm' style='display:none;'>");
                    X.push("<input name='cart2Checkbox' type='hidden' value=''/>");
                    X.push("<input name='cartSuppress' type='hidden' value=''/>");
                    X.push("</form>")
                } else {
                    var Y = a.cookie("ut");
                    if (Y) {
                        X.push("<div class='hd_none_tips'>");
                        X.push("<span class='hd_none_icon'></span>");
                        X.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~</p>");
                        X.push("</div>")
                    } else {
                        X.push("<div class='hd_none_tips'>");
                        X.push("<span class='hd_none_icon'></span>");
                        X.push("<p class='hd_none_text'>您的购物车里还没有1号店的商品哦~</p>");
                        X.push("<p class='hd_none_text'>如果您已添加过商品，登录后就可以查看哦~</p>");
                        X.push("<a class='prism_go_index' href='javascript:void(0);' data-tpc='1007' id='prismCartLogin'>登录</a>");
                        X.push("</div>")
                    }
                }
                return X.join("")
            }
            ;
        var W = function(Y, ad) {
                var ab = URLPrefix.pms + "/pms/getRecommProductsByJson.do?callback=?";
                var Z = 0;
                var ac = 0;
                var X = function() {
                        var am = a("#addCartPopWin");
                        var ah = a("a.hd_show_pre", am);
                        var an = a("a.hd_show_next", am);
                        var ai = am.find("div.hd_recommend_list ul");
                        var af = am.find("div.hd_recommend_list").width() + 15;
                        var al = a("div.hd_recommend_list li", am).size();
                        var ak = 4;
                        var ag = (al % ak == 0) ? Math.floor(al / ak) : Math.floor(al / ak) + 1;
                        var aj = 1;
                        if (ag > 1) {
                            an.show();
                            ah.click(function() {
                                if (aj > 1) {
                                    ai.animate({
                                        left: "-" + (aj - 2) * af + "px"
                                    }, function() {
                                        aj--;
                                        if (aj < ag) {
                                            an.show()
                                        }
                                        if (aj == 1) {
                                            ah.hide()
                                        }
                                    })
                                } else {
                                    ah.hide();
                                    an.show()
                                }
                            });
                            an.click(function() {
                                if (aj < ag) {
                                    ai.animate({
                                        left: "-" + (aj) * af + "px"
                                    }, function() {
                                        aj++;
                                        if (aj > 1) {
                                            ah.show()
                                        }
                                        if (aj == ag) {
                                            an.hide()
                                        }
                                    })
                                } else {
                                    ah.show();
                                    an.hide()
                                }
                            })
                        }
                    }
                    ;
                var aa = function(af) {
                        if (Z) {
                            clearTimeout(Z)
                        }
                        if (ac) {
                            return
                        }
                        var ah = [];
                        ah.push("<div id='addCartPopWin' class='hd_cart_pop'>");
                        ah.push("<div class='hd_pop_content'>");
                        ah.push("<span class='hd_colse_btn' onclick='javascript:yhdLib.popclose();'></span>");
                        if (Y.code == "00000000") {
                            ah.push("<p class='hd_pop_tips'><i></i>已成功加入购物车</p>");
                            ah.push("<div class='hd_pop_btn'>");
                            ah.push("<a href='javascript:addTrackPositionToCookie(\"1\",\"product_popup_jxgw\");yhdLib.popclose();' class='hd_btn_l' data-ref='product_popup_jxgw'>继续购物</a>");
                            ah.push("<a href='http://cart.yhd.com/cart/cart.do?action=view' class='hd_btn_r' data-ref='product_popup'>查看购物车</a>");
                            ah.push("</div>")
                        } else {
                            ah.push("<p class='hd_pop_tips'><i class='hd_error_icon'></i>加入购物车失败</p>");
                            ah.push("<div class='hd_error_tips'>");
                            ah.push(Y.msg);
                            ah.push("</div>")
                        }
                        if (af) {
                            ah.push("<div class='hd_recommend_wrap'>");
                            ah.push("<p>更多商品推荐</p>");
                            ah.push("<div class='hd_recommend_list'>");
                            ah.push("<ul class='clearfix'>");
                            for (var ag = 0; ag < af.length; ag++) {
                                var am = af[ag];
                                var an = am.linkUrl;
                                var ai = am.trackerCode;
                                var aj = r(am.picUrl, 85, 85);
                                var al = am.cnName;
                                var ak = am.salePrice;
                                ah.push("<li>");
                                ah.push("<a href='" + an + "' target='_blank' data-ref='" + ai + "' class='hd_pop_img'><img src='" + aj + "'></a>");
                                ah.push("<a href='" + an + "' target='_blank' data-ref='" + ai + "' class='hd_pop_name'>" + al + "</a>");
                                ah.push("<b class='hd_pop_price'>&yen;" + ak + "</b>");
                                ah.push("</li>")
                            }
                            ah.push("</ul>");
                            ah.push("</div>");
                            ah.push("<a href='javascript:void(0);' class='hd_show_pre none'></a>");
                            ah.push("<a href='javascript:void(0);' class='hd_show_next none'></a>");
                            ah.push("</div>")
                        }
                        ah.push("</div>");
                        ah.push("</div>");
                        yhdLib.popwin({
                            popcontentstr: ah.join("")
                        });
                        ac = 1;
                        X()
                    }
                    ;
                var ae = {
                    currSiteId: currSiteId,
                    provinceId: D,
                    productid: ad.productId,
                    merchantId: ad.merchantId,
                    type: "html"
                };
                a.getJSON(ab, ae, function(af) {
                    if (af && af.success == "1") {
                        aa(af.value)
                    } else {
                        aa(0)
                    }
                });
                var Z = setTimeout(function() {
                    aa(0)
                }, 5 * 1000)
            }
            ;
        var G = function() {
                var Y = a("div.hd_cart_scrollwrap", R);
                var ab = a(window).height()
                    , Z = a(window).scrollTop()
                    , aa = p.offset().top
                    , X = ab - a("div.hd_total_pro", R).outerHeight();
                Y.css("height", X)
            }
            ;
        var L = function(Y, Z) {
                var X = Y.find("div.hd_over_tips");
                var aa = Y.find("div.hd_cart_wrap");
                X.find("p").text(Z);
                X.slideDown(500);
                aa.css("z-index", 1201);
                setTimeout(function() {
                    X.slideUp(500);
                    aa.css("z-index", 1200)
                }, 3000)
            }
            ;
        var U = function(Y) {
                var X = a("div.hd_bottom_tips", R);
                X.find("p").html(Y);
                X.show()
            }
            ;
        var P = function() {
                var ad = "http://buy.yhd.com/checkoutV3/index.do";
                var Y = R.find("div.hd_cart_list dd[productId]");
                var Z = 0;
                var ae = 0;
                var ag = 0;
                var aa = 0;
                Y.each(function() {
                    var ah = a(this);
                    var ai = false;
                    if (ah.get(0).getAttribute("checked") == "true") {
                        ai = true
                    }
                    ag++;
                    if (ah.attr("productType") == 4 && ai && ah.attr("disable") == "false") {
                        Z++
                    }
                    if ((ah.attr("checkoutType") == 2 || ah.attr("checkoutType") == 1) && ai && ah.attr("disable") == "false") {
                        ae++
                    }
                    if (ai) {
                        aa++
                    }
                });
                if (Z > 0 && ae == 0 && Z < aa) {
                    U("结算商品中包含礼品卡，需前往<a href='" + g + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                    return false
                }
                if (ae > 0 && Z == 0 && ae < aa) {
                    U("结算商品中包含海购商品，需前往<a href='" + g + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                    return false
                }
                if (Z > 0 && ae > 0) {
                    U("结算商品中包含海购商品和礼品卡，需前往<a href='" + g + "/cart/cart.do?action=view' class='blue_link'>购物车</a>分开结算");
                    return false
                }
                if (aa == 0) {
                    return false
                }
                var af = R.find("div.hd_cart_list dd a.hd_select_box");
                var ac = [];
                af.each(function() {
                    var ai = a(this);
                    var ah = ai.parents("dd").attr("cartItemId");
                    var aj = ai.hasClass("hd_selected") ? 1 : 0;
                    ac.push(ah + "=" + aj)
                });
                var ab = a("#prismCartForm").get(0);
                ab.action = ad;
                ab.cart2Checkbox.value = ac.join(",");
                var X = function(ah) {
                        if (ah.result == 1) {
                            ab.submit()
                        } else {
                            if (yhdPublicLogin) {
                                var ai = URLPrefix.passport;
                                yhdPublicLogin.showLoginDivNone(ai, false, "", function(aj) {
                                    if (aj == 0) {
                                        a("#prismCartForm").submit()
                                    }
                                })
                            }
                        }
                    }
                    ;
                s.globalCheckLogin(X)
            }
            ;
        var q = function(ab, Z) {
                if (!ab) {
                    return
                }
                var X = g + "/cart/opt/getCitysByProvince.do?callback=?";
                var Y = function(ah) {
                        var ae = [];
                        ae.push("<dl class='clearfix'>");
                        for (var ad = 0; ad < ah.length; ad++) {
                            var ac = ah[ad];
                            ae.push("<dd><a data-value='" + ac.id + "' href='javascript:;'>" + ac.name + "</a></dd>")
                        }
                        ae.push("</dl>");
                        var af = R.find("div.yhd_province div.yhd_area_tab span:eq(1)");
                        var ag = R.find("div.yhd_province div.yhd_area_box div.yhd_second_area");
                        ag.html(ae.join(""));
                        af.attr("data-loaded", 1);
                        if (Z) {
                            Z(ah)
                        }
                    }
                    ;
                var aa = {
                    provinceId: ab
                };
                a.getJSON(X, aa, function(ac) {
                    if (ac && ac.code == "00000000") {
                        Y(ac.data)
                    }
                })
            }
            ;
        var d = function(ab, Z) {
                if (!ab) {
                    return
                }
                var Y = g + "/cart/opt/getCountysByCity.do?callback=?";
                var X = function(ah) {
                        var ae = [];
                        ae.push("<dl class='clearfix'>");
                        for (var ad = 0; ad < ah.length; ad++) {
                            var ac = ah[ad];
                            ae.push("<dd><a data-value='" + ac.id + "' href='javascript:;'>" + ac.name + "</a></dd>")
                        }
                        ae.push("</dl>");
                        var af = R.find("div.yhd_province div.yhd_area_tab span:eq(2)");
                        var ag = R.find("div.yhd_province div.yhd_area_box div.yhd_third_area");
                        ag.html(ae.join(""));
                        af.attr("data-loaded", 1);
                        if (Z) {
                            Z(ah)
                        }
                    }
                    ;
                var aa = {
                    cityId: ab
                };
                a.getJSON(Y, aa, function(ac) {
                    if (ac && ac.code == "00000000") {
                        X(ac.data)
                    }
                })
            }
            ;
        var f = function(Y) {
                var X = g + "/cart/info/minicart.do?callback=?";
                a.getJSON(X, function(Z) {
                    if (Z && Z.code == "00000000") {
                        R.data("prismCartData", Z.data);
                        Y(Z.data)
                    } else {
                        Y(null )
                    }
                })
            }
            ;
        var v = function(al, ad, X) {
                if (!al || al.productId == null  || al.amount == null ) {
                    return
                }
                var am = al.amount;
                var ah = al.isFloat;
                var ac = al.merchantId;
                var aj = al.productId;
                var Z = al.pmId || "";
                var ak = al.ybPmIds || "";
                var ag = al.showPrice || "";
                var an = al.needTip || "";
                var Y = al.linkPosition || "";
                var ab = al.referrer || encodeURIComponent(document.referrer);
                var ae = g + "/cart/opt/add.do?callback=?";
                var aa = function(ao) {
                        if (ah) {
                            A(R, null , function() {
                                Q()
                            }, 200)
                        } else {
                            if (!al.isDeleteNewDiv) {
                                W(ao, al)
                            }
                            R.data("cart-item-loaded", 0)
                        }
                        if (ad) {
                            ad(ao)
                        }
                        V.addItemCallback(al, ao);
                        V.changeItemCallback(al, ao)
                    }
                    ;
                var af = function(ao) {
                        if (ao && ao.code) {
                            var ar = ao.code;
                            if (ar == "300010801005") {
                                var ap = ao.data;
                                if (ap && ap.indexOf("http") == 0) {
                                    window.location.href = ap
                                } else {
                                    window.location.href = currDomain + ap
                                }
                            } else {
                                if (ar == "300010800001") {
                                    var aq = URLPrefix.passport;
                                    yhdPublicLogin.showLoginDivNone(aq, false, "", function(at) {
                                        if (at == 0) {
                                            yhdPublicLogin.showTopLoginInfo()
                                        }
                                    })
                                } else {
                                    W(ao, al)
                                }
                            }
                        }
                        if (X) {
                            X(ao)
                        }
                        V.addItemFailback(al, ao)
                    }
                    ;
                var ai = {
                    productId: aj,
                    merchantId: ac,
                    num: am,
                    pmId: Z,
                    ybPmIds: ak,
                    showPrice: ag,
                    needTip: an,
                    pageRef: ab,
                    linkPosition: Y
                };
                V.getJSON(ae, ai, function(ao) {
                    if (ao && ao.code == "00000000") {
                        aa(ao)
                    } else {
                        af(ao)
                    }
                })
            }
            ;
        var B = function(ad, Y, ag) {
                if (!ad || ad.productId == null ) {
                    return
                }
                var ac = ad.productId;
                var X = ad.merchantId;
                var ae = ad.ybPmIds;
                var Z = g + "/cart/phone/isContractProduct.do?callback=?";
                var af = function(ah) {
                        if (Y) {
                            Y(ah)
                        }
                    }
                    ;
                var aa = function(ah) {
                        if (ag) {
                            ag(ah)
                        }
                    }
                    ;
                var ab = {
                    productId: ac,
                    merchantId: X,
                    ybPmIds: ae ? ae : ""
                };
                V.getJSON(Z, ab, function(ah) {
                    if (ah.ERROR) {
                        aa(ah)
                    } else {
                        af(ah)
                    }
                })
            }
            ;
        var N = function(ac, ae, Z) {
                if (!ac || ac.itemIds == null ) {
                    return
                }
                var ab = g + "/cart/info/minicartDeleteItem.do?callback=?";
                var X = ac.itemIds.join(",");
                var Y = function(af) {
                        if (R.data("cart-item-loaded")) {
                            f(e)
                        }
                        if (ae) {
                            ae(af)
                        }
                        V.removeItemCallback(ac, af);
                        V.changeItemCallback(ac, af)
                    }
                    ;
                var aa = function(ag) {
                        var af = R.find("div.hd_cart_list dd[cartItemId='" + ac.itemId + "']");
                        var ah = ag.msg;
                        if (af.size() > 0) {
                            ah = ah.replace("[" + af.find("a.hd_pro_name").text() + "]", "");
                            L(af, ah)
                        }
                        if (Z) {
                            Z(ag)
                        }
                        V.removeItemFailback(ac, ag)
                    }
                    ;
                var ad = {
                    deleteId: X
                };
                V.getJSON(ab, ad, function(af) {
                    if (af && af.code == "00000000") {
                        Y(af)
                    } else {
                        aa(af)
                    }
                })
            }
            ;
        var t = function(Z, ad, X) {
                if (!Z || Z.itemId == null  || Z.pmId == null  || Z.num == null  || Z.itemType == null ) {
                    return
                }
                var Y = g + "/cart/info/minicartEditNum.do?callback=?";
                if (Z.itemType == 10) {
                    Y = g + "/cart/info/minicartEditPointNum.do?callback=?"
                } else {
                    if (Z.itemType == 9) {
                        Y = g + "/cart/info/minicartEditLandingNum.do?callback=?"
                    }
                }
                var aa = function(ae) {
                        if (R.data("cart-item-loaded")) {
                            f(e)
                        }
                        if (ad) {
                            ad(ae)
                        }
                        V.updateItemCallback(Z, ae);
                        V.changeItemCallback(Z, ae)
                    }
                    ;
                var ac = function(af) {
                        var ae = R.find("div.hd_cart_list dd[cartItemId='" + Z.itemId + "']");
                        var ah = af.msg;
                        ah = ah.replace("[" + ae.find("a.hd_pro_name").text() + "]", "");
                        L(ae, ah);
                        var ag = ae.find("div.hd_num_box input");
                        ag.val(ae.attr("itemNum"));
                        if (X) {
                            X(af)
                        }
                        V.updateItemFailback(Z, af)
                    }
                    ;
                var ab = {
                    cartItemVoId: Z.itemId,
                    pmInfoId: Z.pmId,
                    num: Z.num
                };
                if (Z.itemType == 9) {
                    ab.promotionId = Z.promotionId
                }
                V.getJSON(Y, ab, function(ae) {
                    if (ae && ae.code == "00000000") {
                        aa(ae)
                    } else {
                        ac(ae)
                    }
                })
            }
            ;
        var c = function(ab, X, ad) {
                if (!ab || ab.length == 0) {
                    return
                }
                var Y = g + "/cart/info/minicart.do?callback=?";
                var af = [];
                for (var ac = 0; ac < ab.length; ac++) {
                    af.push(ab[ac].itemId + "=" + ab[ac].checked)
                }
                var Z = function(ag) {
                        if (R.data("cart-item-loaded")) {
                            R.data("prismCartData", ag.data);
                            e(ag.data)
                        }
                        if (X) {
                            X(ag)
                        }
                        V.chooseItemCallback(ab, ag);
                        V.changeItemCallback(ab, ag)
                    }
                    ;
                var ae = function(ag) {
                        if (R.data("cart-item-loaded")) {
                            f(e)
                        }
                        if (ad) {
                            ad(ag)
                        }
                        V.chooseItemFailback(ab, result)
                    }
                    ;
                var aa = {
                    checkboxStr: af.join(",")
                };
                V.getJSON(Y, aa, function(ag) {
                    if (ag && ag.code == "00000000") {
                        Z(ag)
                    } else {
                        ae(ag)
                    }
                })
            }
            ;
        var n = function(ac, ad, X) {
                if (!ac || ac.productIds == null  || ac.productIds.length == 0) {
                    return
                }
                var Z = g + "/cart/opt/getSubProductSerialAttr.do?callback=?";
                var Y = function(aj) {
                        if (aj.data && aj.data.subProductIdToAttributeValueMap) {
                            var ag = aj.data.subProductIdToAttributeValueMap;
                            for (var af = 0; af < ac.productIds.length; af++) {
                                var ai = R.find("div.hd_cart_list dd[productId='" + ac.productIds[af] + "'] p.hd_subcode");
                                var ak = ag[ac.productIds[af]];
                                if (ai.size() > 0 && ak) {
                                    var ah = "";
                                    for (var ae = 0; ae < ak.length; ae++) {
                                        ah += "<span>" + ak[ae].attributeValueAlias + "</span>&nbsp;"
                                    }
                                    ai.html(ah)
                                }
                            }
                        }
                        if (ad) {
                            ad(aj)
                        }
                    }
                    ;
                var ab = function(ae) {
                        if (X) {
                            X(ae)
                        }
                    }
                    ;
                for (var aa = 0; aa < ac.productIds.length; aa++) {
                    Z += "&subProductIds=" + ac.productIds[aa]
                }
                a.getJSON(Z, null , function(ae) {
                    if (ae && ae.code == "00000000") {
                        Y(ae)
                    } else {
                        ab(ae)
                    }
                })
            }
            ;
        var M = function(ad) {
                if (!ad || !ad.summary) {
                    return
                }
                var X = [];
                for (var Z = 0; Z < ad.bags.length; Z++) {
                    var ac = ad.bags[Z];
                    for (var aa = 0; aa < ac.itemGroups.length; aa++) {
                        var ae = ac.itemGroups[aa];
                        for (var Y = 0; Y < ae.items.length; Y++) {
                            var ab = ae.items[Y];
                            if (ab.productType == 2) {
                                X.push(ab.productId)
                            }
                        }
                    }
                }
                n({
                    productIds: X
                })
            }
            ;
        var b = function(al) {
                a("div.hd_bottom_tips", R).hide();
                if (!al || !al.summary) {
                    O.hide();
                    R.find("div.hd_total_pro span.hd_all_select a").removeClass("hd_selected");
                    R.find("div.hd_total_pro a.fr").text("立即结算(0)");
                    R.find("div.hd_total_pro div.fl em").text("¥0");
                    R.find("div.hd_total_pro div.fl u").text("");
                    R.find("div.hd_total_pro").removeClass("hd_has_point");
                    return
                }
                var ao = parseInt(al.summary.count);
                if (ao > 0) {
                    O.find("u").text(ao > 999 ? "999+" : ao);
                    O.show()
                } else {
                    O.hide()
                }
                if (ao > 0) {
                    s.cookie.setAllDomain("cart_num", ao, "/", 15)
                }
                var an = 0;
                for (var ag = 0; ag < al.bags.length; ag++) {
                    var am = al.bags[ag];
                    for (var af = 0; af < am.itemGroups.length; af++) {
                        var ak = am.itemGroups[af];
                        for (var ae = 0; ae < ak.items.length; ae++) {
                            var ai = ak.items[ae];
                            if (ai.checked) {
                                an = an + ai.num
                            }
                            for (var ar = 0; ar < ai.nestedItems.length; ar++) {
                                var aa = ai.nestedItems[ar];
                                if (aa.typeValue == 10 || aa.typeValue == 11) {
                                    an += aa.num
                                }
                            }
                        }
                        for (var ac = 0; ac < ak.gifts.length; ac++) {
                            var ab = ak.gifts[ac];
                            an = an + ab.num
                        }
                    }
                    for (var Y = 0; Y < am.gifts.length; Y++) {
                        var ab = am.gifts[Y];
                        an = an + ab.num
                    }
                    for (var X = 0; X < am.redemptions.length; X++) {
                        var ap = am.redemptions[X];
                        an = an + ap.num
                    }
                }
                var ad = parseFloat(al.summary.amount.money);
                var ah = parseFloat(al.summary.amount.points);
                if (ad % 1 > 0) {
                    ad = ad.toFixed(2)
                }
                if (ah % 1 > 0) {
                    ah = ah.toFixed(2)
                }
                var aq = "";
                if (ad > 0) {
                    aq = "¥" + ad
                } else {
                    aq = "¥0"
                }
                if (ah > 0) {
                    var Z = "+" + ah + "积分";
                    R.find("div.hd_total_pro").addClass("hd_has_point");
                    R.find("div.hd_total_pro div.fl u").text(Z)
                } else {
                    R.find("div.hd_total_pro").removeClass("hd_has_point");
                    R.find("div.hd_total_pro div.fl u").text("")
                }
                R.find("div.hd_total_pro a.fr").text("立即结算(" + an + ")");
                R.find("div.hd_total_pro div.fl em").text(aq);
                if (an > 0) {
                    a("#prismCartPaybtn", R).addClass("hd_pay_btn")
                } else {
                    a("#prismCartPaybtn", R).removeClass("hd_pay_btn")
                }
                var aj = true;
                if (al.bags.length == 0) {
                    aj = false
                } else {
                    for (var ag = 0; ag < al.bags.length; ag++) {
                        var am = al.bags[ag];
                        for (var af = 0; af < am.itemGroups.length; af++) {
                            var ak = am.itemGroups[af];
                            for (var ae = 0; ae < ak.items.length; ae++) {
                                var ai = ak.items[ae];
                                if (!ai.checked) {
                                    aj = false;
                                    break
                                }
                            }
                        }
                    }
                }
                if (aj && an > 0) {
                    a("#prismCartSeltAll", R).addClass("hd_selected")
                } else {
                    a("#prismCartSeltAll", R).removeClass("hd_selected")
                }
            }
            ;
        var S = function(Y) {
                var X = h(Y);
                p.html(X);
                b(Y);
                M(Y);
                G();
                V.reloadCartCallback(Y)
            }
            ;
        var e = function(Y) {
                if (!Y || !Y.summary) {
                    S(Y);
                    return
                }
                var X = T(Y);
                p.find("div.hd_cart_list").html(X);
                b(Y);
                M(Y);
                V.reloadCartCallback(Y)
            }
            ;
        var Q = function() {
                var Y = 0;
                var X = function(Z) {
                        if (R.data("cart-item-loaded")) {
                            if (R.find("div.hd_none_tips").size() > 0 || R.find("div.hd_login_tips").size() > 0) {
                                S(Z);
                                R.data("cart-item-loaded", 1)
                            } else {
                                e(Z)
                            }
                        } else {
                            S(Z);
                            R.data("cart-item-loaded", 1)
                        }
                        var aa = function() {
                                if (Y) {
                                    clearTimeout(Y);
                                    Y = 0
                                }
                            }
                            ;
                        aa();
                        a("#prismCartTips").show();
                        Y = setTimeout(function() {
                            a("#prismCartTips").hide()
                        }, 3000)
                    }
                    ;
                f(X)
            }
            ;
        var m = function() {
                var Y = R.find("div.yhd_province div.yhd_address");
                var ab = R.find("div.yhd_province div.yhd_tab_detail");
                var Z = R.find("div.hd_area_mask");
                var X = R.find("div.yhd_province div.yhd_area_tab span");
                var ag = R.find("div.yhd_province div.yhd_area_box div.yhd_item");
                if (Y.hasClass("select")) {
                    return
                }
                var ad = a(X[0]).attr("data-value");
                var ae = a(X[1]).attr("data-value");
                var ah = a(X[2]).attr("data-value");
                var af = a(X[1]).attr("data-loaded");
                var ac = a(X[2]).attr("data-loaded");
                if (ae != "" && af != 1) {
                    q(ad)
                }
                if (ah != "" && ac != 1) {
                    d(ae)
                }
                Y.addClass("select");
                ab.slideDown();
                Z.show();
                var aa = a("div.hd_cart_scrollwrap", R).outerHeight();
                if (aa > a("div.hd_cart_list", R).height() + a("div.yhd_province", R).outerHeight()) {
                    ab.css("width", "334px")
                } else {
                    ab.css("width", "317px")
                }
                a("div.hd_cart_scrollwrap", R).css("position", "static")
            }
            ;
        var E = function() {
                var Z = R.find("div.yhd_province div.yhd_address");
                var X = R.find("div.yhd_province div.yhd_tab_detail");
                var Y = R.find("div.hd_area_mask");
                Z.removeClass("select");
                X.slideUp();
                Y.hide();
                a("div.hd_cart_scrollwrap", R).css("position", "relative")
            }
            ;
        var J = function(X, ac, Z, Y) {
                var ab = function() {
                        var ad = /^[1-9]\d{0,2}$/g;
                        if (!ad.test(Y.val())) {
                            L(X, "输入的数量有误,应为[1-999]");
                            Y.val(X.attr("itemNum"));
                            return false
                        }
                        var ae = parseInt(Y.val());
                        if (ae > 1) {
                            ac.removeClass("hd_minus_disable").addClass("hd_minus")
                        }
                        if (ae >= 999) {
                            Z.removeClass("hd_plus").addClass("hd_plus_disable")
                        }
                        if (ae <= 1) {
                            ac.removeClass("hd_minus").addClass("hd_minus_disable")
                        }
                        if (ae < 999) {
                            Z.removeClass("hd_plus_disable").addClass("hd_plus")
                        }
                        return true
                    }
                    ;
                var aa = function() {
                        var af = X.attr("itemType");
                        var ae = Y.val();
                        if (af == 2) {
                            ae = 0;
                            var ad = R.find("div.hd_cart_list dd[parentCartItemId='" + X.attr("parentCartItemId") + "']");
                            ad.each(function() {
                                var ag = a(this).find("input.hd_minicart_num");
                                ae = ae + parseInt(ag.val())
                            })
                        }
                        t({
                            itemId: X.attr("cartItemId"),
                            pmId: X.attr("pmId"),
                            itemType: X.attr("itemType"),
                            promotionId: X.attr("promotionId"),
                            num: ae
                        })
                    }
                    ;
                A(a(this), ab, aa, 500)
            }
            ;
        var j = function(X) {
                var Y = function(Z) {
                        var aa = parseInt(Z.code);
                        if (aa == 1) {
                            if (a("#validateProductId").length > 0) {
                                a("#validateProductId").attr("value", productId)
                            }
                            if (a.cookie("prompt_flag") == null  && a("#buyPromptDiv").length > 0) {
                                YHD.popwinId("buyPromptDiv");
                                a("#validate").bind("click", function() {
                                    window.location.href = URLPrefix.productDetailHost + "/product/" + X.productId + "_" + X.merchantId
                                })
                            } else {
                                window.location.href = URLPrefix.productDetailHost + "/product/" + X.productId + "_" + X.merchantId
                            }
                        } else {
                            if (a("#validateProductId").length > 0) {
                                a("#validateProductId").attr("value", productId)
                            }
                            if (a.cookie("prompt_flag") == null  && a("#buyPromptDiv").length > 0) {
                                YHD.popwinId("buyPromptDiv", "popwinClose");
                                a("#validate").bind("click", function() {
                                    v(X, function() {
                                        YHDOBJECT.callBackFunc(X)
                                    })
                                })
                            } else {
                                v(X, function() {
                                    YHDOBJECT.callBackFunc(X)
                                })
                            }
                        }
                    }
                    ;
                B(X, Y)
            }
            ;
        var l = function() {
                var X = a("#prismCart");
                X.click(function() {
                    if (X.data("item-opened")) {
                        s.prism.functions.close();
                        X.data("item-opened", 0)
                    } else {
                        X.data("item-opened", 1);
                        s.prism.functions.open(X);
                        if (!R.data("cart-item-loaded")) {
                            f(S);
                            R.data("cart-item-loaded", 1)
                        } else {
                            G();
                            a("div.hd_cart_list dd div.hd_over_tips", R).hide();
                            a("div.hd_bottom_tips", R).hide()
                        }
                    }
                });
                a(window).resize(function() {
                    if (X.data("item-opened")) {
                        G()
                    }
                });
                R.delegate("div.hd_total_pro", "mousewheel", function(Y, Z) {
                    Y.preventDefault()
                });
                R.delegate("div.hd_area_mask,div.yhd_tab_detail", "mousewheel", function(Y, Z) {
                    Y.preventDefault()
                });
                R.delegate("div.yhd_province dd", "mouseenter", function() {
                    a(this).addClass("hd_cart_cur")
                });
                R.delegate("div.yhd_province dd", "mouseleave", function() {
                    a(this).removeClass("hd_cart_cur")
                });
                R.delegate("p.hd_gift", "mouseenter", function() {
                    a(this).addClass("hd_gift_cur")
                });
                R.delegate("p.hd_gift", "mouseleave", function() {
                    a(this).removeClass("hd_gift_cur")
                });
                R.delegate("div.hd_cart_list dd.hd_min_sum .fl", "mouseenter", function() {
                    a(this).addClass("hd_sale_cur");
                    var Y = a(this).position().top + 60
                        , ac = a("div.hd_cart_scrollwrap", R).scrollTop()
                        , Z = a("div.hd_cart_scrollwrap", R).outerHeight(true)
                        , ab = a(this).find(".hd_sale_show").outerHeight(true)
                        , aa = Z - (Y - ac);
                    if (aa < ab) {
                        a(this).find(".hd_sale_show").addClass("hd_sale_showup")
                    } else {
                        a(this).find(".hd_sale_show").attr("class", "hd_sale_show")
                    }
                });
                R.delegate("div.hd_cart_list dd.hd_min_sum .fl", "mouseleave", function() {
                    a(this).removeClass("hd_sale_cur")
                });
                R.delegate("div.hd_cart_list a.hd_cart_del", "click", function() {
                    A(a(this), null , function() {
                        var Y = a(this).attr("cartItemId");
                        N({
                            itemIds: [Y]
                        })
                    }, 500);
                    return false
                });
                R.delegate("div.hd_cart_list a.hd_gift_del", "click", function() {
                    A(a(this), null , function() {
                        var Y = a(this).attr("cartItemId");
                        N({
                            itemIds: [Y]
                        })
                    }, 500);
                    return false
                });
                R.delegate("div.hd_cart_list a.hd_plus", "click", function() {
                    var Y = a(this).parents("dd");
                    var ac = Y.find("div.hd_num_box a:eq(0)");
                    var Z = Y.find("div.hd_num_box a:eq(1)");
                    var aa = Y.find("div.hd_num_box input");
                    var ab = parseInt(aa.val());
                    if (ab >= 999) {
                        ab = 999
                    } else {
                        ab = ab + 1
                    }
                    aa.val(ab);
                    J(Y, ac, Z, aa);
                    return false
                });
                R.delegate("div.hd_cart_list a.hd_minus", "click", function() {
                    var Y = a(this).parents("dd");
                    var ac = Y.find("div.hd_num_box a:eq(0)");
                    var Z = Y.find("div.hd_num_box a:eq(1)");
                    var aa = Y.find("div.hd_num_box input");
                    var ab = parseInt(aa.val());
                    if (ab <= 1) {
                        ab = 1
                    } else {
                        ab = ab - 1
                    }
                    aa.val(ab);
                    J(Y, ac, Z, aa);
                    return false
                });
                R.delegate("div.hd_cart_list input.hd_minicart_num", "blur", function() {
                    var Y = a(this).parents("dd");
                    var ab = Y.find("div.hd_num_box a:eq(0)");
                    var Z = Y.find("div.hd_num_box a:eq(1)");
                    var aa = Y.find("div.hd_num_box input");
                    J(Y, ab, Z, aa);
                    return false
                });
                R.delegate("div.hd_cart_list input.hd_minicart_num", "keyup", function(ab) {
                    var Y = a(this).parents("dd");
                    var ad = Y.find("div.hd_num_box a:eq(0)");
                    var Z = Y.find("div.hd_num_box a:eq(1)");
                    var aa = Y.find("div.hd_num_box input");
                    var ac = ab.keyCode;
                    if (ac == "13") {
                        aa.blur()
                    }
                    return false
                });
                R.delegate("div.hd_cart_list dd a.hd_select_box", "click", function() {
                    var Y = a(this).parents("dd");
                    var Z = a(this);
                    if (Y.attr("disable") == "true") {
                        return false
                    }
                    var ab = function() {
                            var ad = Z.hasClass("hd_selected") ? 1 : 0;
                            if (ad) {
                                Z.removeClass("hd_selected")
                            } else {
                                Z.addClass("hd_selected")
                            }
                            if (Y.attr("itemType") == 2) {
                                var ac = R.find("div.hd_cart_list dd[parentCartItemId='" + Y.attr("parentCartItemId") + "']");
                                ac.each(function() {
                                    var ae = a(this).find("a.hd_select_box");
                                    if (a(this).attr("cartItemId") != Y.attr("cartItemId")) {
                                        if (ad) {
                                            ae.removeClass("hd_selected")
                                        } else {
                                            ae.addClass("hd_selected")
                                        }
                                    }
                                })
                            }
                        }
                        ;
                    var aa = function() {
                            var ac = R.find("div.hd_cart_list dd a.hd_select_box");
                            var ad = [];
                            ac.each(function() {
                                var ae = a(this);
                                var ag = ae.parents("dd").attr("parentCartItemId");
                                var af = ae.hasClass("hd_selected") ? 1 : 0;
                                ad.push({
                                    itemId: ag,
                                    checked: af
                                })
                            });
                            c(ad)
                        }
                        ;
                    A(a(this), ab, aa, 500);
                    return false
                });
                R.delegate("div.hd_cart_list dt a.hd_select_box", "click", function() {
                    var Z = a(this);
                    var Y = a(this).parents("dl").find("dd");
                    var ab = function() {
                            var ac = Z.hasClass("hd_selected") ? 1 : 0;
                            if (ac) {
                                Z.removeClass("hd_selected")
                            } else {
                                Z.addClass("hd_selected")
                            }
                            Y.each(function(ad, ae) {
                                if (a(ae).attr("disable") != "true") {
                                    if (ac) {
                                        a(ae).find("a.hd_select_box").removeClass("hd_selected")
                                    } else {
                                        a(ae).find("a.hd_select_box").addClass("hd_selected")
                                    }
                                }
                            })
                        }
                        ;
                    var aa = function() {
                            var ac = R.find("div.hd_cart_list dd a.hd_select_box");
                            var ad = [];
                            ac.each(function() {
                                var ae = a(this);
                                var ag = ae.parents("dd").attr("parentCartItemId");
                                var af = ae.hasClass("hd_selected") ? 1 : 0;
                                ad.push({
                                    itemId: ag,
                                    checked: af
                                })
                            });
                            c(ad)
                        }
                        ;
                    A(a(this), ab, aa, 500);
                    return false
                });
                R.delegate("div.hd_total_pro #prismCartSeltAll", "click", function() {
                    var Z = a(this);
                    var Y = R.find("div.hd_cart_list dd[productId]");
                    var ab = function() {
                            var ac = Z.hasClass("hd_selected") ? 1 : 0;
                            if (ac) {
                                Z.removeClass("hd_selected")
                            } else {
                                Z.addClass("hd_selected")
                            }
                            Y.each(function(ad, ae) {
                                if (a(ae).attr("disable") != "true") {
                                    if (ac) {
                                        a(ae).find("a.hd_select_box").removeClass("hd_selected")
                                    } else {
                                        a(ae).find("a.hd_select_box").addClass("hd_selected")
                                    }
                                }
                            });
                            R.find("div.hd_cart_list dt a.hd_select_box").each(function() {
                                if (ac) {
                                    a(this).removeClass("hd_selected")
                                } else {
                                    a(this).addClass("hd_selected")
                                }
                            })
                        }
                        ;
                    var aa = function() {
                            var ac = R.find("div.hd_cart_list dd a.hd_select_box");
                            var ad = [];
                            ac.each(function() {
                                var ae = a(this);
                                var ag = ae.parents("dd").attr("parentCartItemId");
                                var af = ae.hasClass("hd_selected") ? 1 : 0;
                                ad.push({
                                    itemId: ag,
                                    checked: af
                                })
                            });
                            c(ad)
                        }
                        ;
                    A(a(this), ab, aa, 500);
                    return false
                });
                p.delegate(".hd_bottom_tips u", "click", function() {
                    a(this).parents(".hd_bottom_tips").hide()
                });
                R.delegate("div.hd_total_pro #prismCartPaybtn", "click", function() {
                    P();
                    return false
                });
                R.delegate("div.yhd_province div.yhd_address", "click", function() {
                    m();
                    return false
                });
                R.delegate("div.yhd_province span.yhd_close_btn", "click", function() {
                    E();
                    return false
                });
                R.delegate("div.yhd_province div.yhd_area_tab span", "click", function() {
                    var Z = R.find("div.yhd_province div.yhd_area_tab span");
                    var Y = R.find("div.yhd_province div.yhd_area_box div.yhd_item");
                    var aa = a(this).index();
                    Z.eq(aa).addClass("yhd_on").siblings().removeClass("yhd_on");
                    Y.hide().eq(aa).show();
                    return false
                });
                R.delegate("div.yhd_province div.hd_first_area dd a", "click", function() {
                    var Z = a(this).attr("data-value");
                    var Y = a(this).text();
                    var aa = function() {
                            var ac = R.find("div.yhd_province div.yhd_area_tab span");
                            var ab = R.find("div.yhd_province div.yhd_area_box div.yhd_item");
                            a(ac[0]).attr("data-value", Z);
                            a(ac[0]).find("em").text(Y);
                            ac.eq(1).addClass("yhd_on").siblings().removeClass("yhd_on");
                            ab.hide().eq(1).show();
                            a(ac[1]).attr("data-value", "");
                            a(ac[1]).find("em").text("请选择市");
                            a(ac[2]).attr("data-value", "");
                            a(ac[2]).find("em").text("请选择区");
                            a(ab[2]).html("")
                        }
                        ;
                    q(Z, aa);
                    return false
                });
                R.delegate("div.yhd_province div.yhd_second_area dd a", "click", function() {
                    var Z = a(this).attr("data-value");
                    var Y = a(this).text();
                    var aa = function() {
                            var ac = R.find("div.yhd_province div.yhd_area_tab span");
                            var ab = R.find("div.yhd_province div.yhd_area_box div.yhd_item");
                            a(ac[1]).attr("data-value", Z);
                            a(ac[1]).find("em").text(Y);
                            ac.eq(2).addClass("yhd_on").siblings().removeClass("yhd_on");
                            ab.hide().eq(2).show()
                        }
                        ;
                    d(Z, aa);
                    return false
                });
                R.delegate("div.yhd_province div.yhd_third_area dd a", "click", function() {
                    var Z = R.find("div.yhd_province div.yhd_area_tab span");
                    var ab = a(this).attr("data-value");
                    var ad = a(this).text();
                    a(Z[2]).attr("data-value", ab).find("em").text(ad);
                    var aa = [a(Z[0]).attr("data-value"), a(Z[1]).attr("data-value"), a(Z[2]).attr("data-value")];
                    var Y = [a(Z[0]).find("em").text(), a(Z[1]).find("em").text(), a(Z[2]).find("em").text()];
                    var ac = R.find("div.yhd_province div.yhd_address span");
                    ac.attr("data-value", aa.join("_"));
                    ac.text(Y.join("|"));
                    F([aa, Y]);
                    E()
                });
                R.delegate("#prismCartLogin", "click", function() {
                    if (yhdPublicLogin) {
                        yhdPublicLogin.showLoginDiv()
                    }
                })
            }
            ;
        V.initCart = function() {
            if (R.data("cart-num-loaded")) {
                return
            }
            R.data("cart-num-loaded", 1);
            H();
            l()
        }
        ;
        V.resetCart = function() {
            R.data("cart-item-loaded", 0);
            H()
        }
        ;
        V.closeCart = function() {
            s.prism.functions.close();
            var X = a("#prismCart");
            X.data("item-opened", 0)
        }
        ;
        V.reloadCart = function() {
            if (R.data("cart-item-loaded")) {
                f(S)
            }
        }
        ;
        V.reloadCartItems = function() {
            if (R.data("cart-item-loaded")) {
                f(e)
            }
        }
        ;
        V.reloadCartFloat = function() {
            Q()
        }
        ;
        V.addItem = function(X) {
            j(X)
        }
        ;
        V.removeItem = function(Y, Z, X) {
            N(Y, Z, X)
        }
        ;
        V.updateItem = function(Y, Z, X) {
            t(Y, Z, X)
        }
        ;
        V.chooseItem = function(Y, Z, X) {
            c(Y, Z, X)
        }
        ;
        V.changeAddress = function(X) {
            if (!X || X.length != 2) {
                return
            }
            var Z = X[0];
            var aa = X[1];
            var ab = R.find("div.yhd_province div.yhd_address span");
            ab.attr("data-value", Z.join("_"));
            ab.text(aa.join("|"));
            var Y = R.find("div.yhd_province div.yhd_area_tab span");
            a(Y[0]).attr("data-loaded", 0).attr("data-value", Z[0]).find("em").text(aa[0]);
            a(Y[1]).attr("data-loaded", 0).attr("data-value", Z[1]).find("em").text(aa[1]);
            a(Y[2]).attr("data-loaded", 0).attr("data-value", Z[2]).find("em").text(aa[2]);
            F([Z, aa])
        }
        ;
        V.initCart();
        window.addToCart = function(ab, Z, ad, Y, X, ac) {
            var aa = {};
            aa.amount = Y;
            aa.isFloat = X;
            aa.linkPosition = ac;
            aa.merchantId = ad;
            addToCartNew(ab, Z, aa)
        }
        ;
        window.addToCartNew = function(Z, Y, X) {
            X.productId = Y;
            s.prism.minicart.addItem(X)
        }
        ;
        window.initAllMiniCart = function() {}
        ;
        window.loadMiniCart = function() {
            s.prism.minicart.reloadCart();
            i.resetCart()
        }
        ;
        window.reloadMiniCart = function() {
            s.prism.minicart.reloadCart();
            i.resetCart()
        }
        ;
        i.changeItemCallback = function(Y, X) {
            V.closeCart();
            V.resetCart()
        }
        ;
        i.changeAddressCallback = function(X) {
            V.closeCart();
            V.resetCart()
        }
        ;
        i.reloadCartCallback = function(X) {
            V.closeCart();
            V.resetCart()
        }
    })
})(jQuery);
(function(a) {
    a(function() {
        var c = window.loli || (window.loli = {});
        var u = c.prism = c.prism || {};
        var g = u.functions = u.functions || {};
        var l = a.cookie("provinceId") || 1;
        var o = a.cookie("yihaodian_uid");
        var f = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!f) {
            return
        }
        if (c.util.isIE() && c.util.isIE() <= 7) {
            return
        }
        var d = (typeof globalPrismTopAdvFlag != "undefined" && globalPrismTopAdvFlag == "0") ? 0 : 1;
        if (!d) {
            return
        }
        var j = a("#prismTopAdv");
        var s = a("#prismTopAdvDetail");
        var q = (typeof globalPrismPromoteCmsId != "undefined" && globalPrismPromoteCmsId != "") ? globalPrismPromoteCmsId : 0;
        var r = (typeof globalPrismPromoteModuleId != "undefined" && globalPrismPromoteModuleId != "") ? globalPrismPromoteModuleId : 0;
        var h = (typeof globalPrismPromoteAllowURLs != "undefined" && globalPrismPromoteAllowURLs != "") ? globalPrismPromoteAllowURLs.split(",") : [];
        var t = (typeof globalPrismPromoteForbiddenURLs != "undefined" && globalPrismPromoteForbiddenURLs != "") ? globalPrismPromoteForbiddenURLs.split(",") : [];
        var b = function() {
                var x = typeof isWidescreen != "undefined" && isWidescreen;
                var v = document.body.clientWidth;
                if (x) {
                    var w = (v - 1200) / 2;
                    if (w <= 194) {
                        x = false
                    }
                }
                return x
            }
            ;
        var p = function(v) {
                var w = [];
                var y = v.data.GENERAL_GLOBAL_LJDCRK_KT;
                var x = y ? y[0] : null ;
                if (x) {
                    var w = [];
                    if (q != 0 && r != 0) {
                        w.push("<a href='javascript:;'>")
                    } else {
                        w.push("<a href='" + x.linkUrl + "' target='_blank' title='" + x.displayContent + "' data-ref='" + x.perTracker + "' data-tc='" + x.tc + "'>")
                    }
                    w.push("<img src='" + (b() ? x.imageUrlWide : x.imageUrl) + "'>");
                    w.push("</a>")
                }
                return w.join("")
            }
            ;
        var k = function() {
                var v = URLPrefix.central + "/header/ajaxGetPrismAdvs.do?callback=?";
                var x = function(y) {
                        if (y.status == "1" && y.data) {
                            c.prism.advsData = y;
                            var z = p(y);
                            if (z != "") {
                                j.html(z);
                                if (b()) {
                                    j.addClass("prism_top_ad_big")
                                }
                            }
                        }
                    }
                    ;
                var w = {
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: l
                };
                a.ajax({
                    url: v,
                    data: w,
                    dataType: "jsonp",
                    timeout: 5000,
                    jsonpCallback: "GLOBALPRISMADVS",
                    cache: true,
                    success: function(y) {
                        if (y) {
                            x(y)
                        }
                    }
                })
            }
            ;
        var n = function() {
                var v = a("div.prism_scrollwrap", s);
                var w = a(window).height();
                v.css("height", w)
            }
            ;
        var m = function() {
                var w = [];
                w.push("http://www.yhd.com/");
                w.push("http://item.yhd.com/");
                w.push("http://list.yhd.com/");
                w.push("http://search.yhd.com/");
                w.push("http://s.yhd.com/");
                w.push("http://my.yhd.com/");
                w.push("http://1mall.yhd.com/");
                w.push("http://market.yhd.com/");
                w.push("http://3c.yhd.com/");
                w.push("http://fashion.yhd.com/");
                w.push("http://jifen.yhd.com/");
                w.push("http://vip.yhd.com/");
                w.push("http://t.yhd.com/");
                w.push("http://lady.yhd.com/");
                w.push("http://cms.yhd.com/sale/");
                for (var v = 0; v < h.length; v++) {
                    w.push(h[v])
                }
                var y = t;
                var x = false;
                for (var v = 0; v < w.length; v++) {
                    if (location.href.indexOf(w[v]) == 0) {
                        x = true;
                        break
                    }
                }
                var z = false;
                for (var v = 0; v < y.length; v++) {
                    if (location.href.indexOf(y[v]) == 0) {
                        z = true;
                        break
                    }
                }
                return x && !z
            }
            ;
        var i = function() {
                if (m()) {
                    jQuery.ajax({
                        url: "http://cms.yhd.com/cmsPage/getCmsMould.do?pageId=" + q + "&mouldId=" + r + "&provinceId=" + l,
                        dataType: "jsonp",
                        jsonp: "callback",
                        jsonpCallback: "celebrateFixNavCallback",
                        timeout: 2000,
                        cache: true,
                        success: function(v) {
                            if (v && v.code == 0) {
                                var w = a("#prismTopAdvDetail");
                                w.html("<div class='prism_scrollwrap'></div>");
                                if (v.html) {
                                    a("div.prism_scrollwrap", w).append(v.html)
                                }
                                if (v.js) {
                                    a("div.prism_scrollwrap", w).append(v.js)
                                }
                                n()
                            }
                        }
                    })
                }
            }
            ;
        var e = function() {
                if (!m()) {
                    return
                }
                a("a", j).attr("href", "javascript:void(0);");
                a("a", j).removeAttr("target");
                j.click(function() {
                    if (j.data("item-opened")) {
                        c.prism.functions.close();
                        j.data("item-opened", 0)
                    } else {
                        j.data("item-opened", 1);
                        c.prism.functions.open(j);
                        if (!s.data("item-loaded")) {
                            i();
                            s.data("item-loaded", 1)
                        } else {
                            n()
                        }
                    }
                });
                a(window).resize(function() {
                    if (j.data("item-opened")) {
                        n()
                    }
                })
            }
            ;
        k();
        if (q != 0 && r != 0) {
            e()
        }
    })
})(jQuery);
(function(a) {
    a(function() {
        var k = window.loli || (window.loli = {});
        var h = k.prism = k.prism || {};
        var d = h.functions = h.functions || {};
        var e = a.cookie("provinceId") || 1;
        var f = a.cookie("yihaodian_uid");
        var l = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!l) {
            return
        }
        if (k.util.isIE() && k.util.isIE() <= 7) {
            return
        }
        var j = (typeof globalPrismQRCodeFlag != "undefined" && globalPrismQRCodeFlag == "0") ? 0 : 1;
        if (!j) {
            return
        }
        var b = a("#prismQRCode");
        var g = function(p) {
                var q = [];
                var o = p.data.GENERAL_GLOBAL_EWM_TP;
                var n = o ? o[0] : null ;
                if (n) {
                    q.push("<div class='prism_tips_wrap prism_yhd_code none'>");
                    q.push("<p style='text-align:center;'>" + n.name + "<br/>" + n.displayTitle + "</p>");
                    q.push("<img src='" + n.imageUrl + "'>");
                    q.push("<em class='tips_arrow'></em>");
                    q.push("</div>")
                }
                return q.join("")
            }
            ;
        var c = function() {
                b.hover(function() {
                    a("div.prism_yhd_code", b).show()
                }, function() {
                    a("div.prism_yhd_code", b).hide()
                })
            }
            ;
        var i = function() {
                var n = URLPrefix.central + "/header/ajaxGetPrismAdvs.do?callback=?";
                var p = function(q) {
                        if (q.status == "1" && q.data) {
                            k.prism.advsData = q;
                            var r = g(q);
                            if (r != "") {
                                b.find(".prism_icon_text").remove();
                                b.append(r);
                                c()
                            }
                        }
                    }
                    ;
                var o = {
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: e
                };
                a.ajax({
                    url: n,
                    data: o,
                    dataType: "jsonp",
                    timeout: 5000,
                    jsonpCallback: "GLOBALPRISMADVS",
                    cache: true,
                    success: function(q) {
                        if (q) {
                            p(q)
                        }
                    }
                })
            }
            ;
        var m = setTimeout(function() {
            if (k.prism.advsData) {
                var n = g(k.prism.advsData);
                if (n != "") {
                    b.find(".prism_icon_text").remove();
                    b.append(n);
                    c()
                }
            } else {
                i()
            }
        }, 1500)
    })
})(jQuery);
(function(a) {
    a(function() {
        var j = window.loli || (window.loli = {});
        var k = j.prism = j.prism || {};
        var e = k.functions = k.functions || {};
        var f = a.cookie("provinceId") || 1;
        var g = a.cookie("yihaodian_uid");
        var q = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!q) {
            return
        }
        if (j.util.isIE() && j.util.isIE() <= 7) {
            return
        }
        var m = (typeof globalPrismOrderFlag != "undefined" && globalPrismOrderFlag == "0") ? 0 : 1;
        if (!m) {
            return
        }
        var c = a("#prismOrder");
        var l = a("#prismOrderDetail");
        var d = function(r) {
                if (r != null  && r != "") {
                    r = r.replace(/\&/g, "&amp;");
                    r = r.replace(/\</g, "&lt;");
                    r = r.replace(/\>/g, "&gt;");
                    r = r.replace(/\\/g, "&#92;");
                    r = r.replace(/\'/g, "&#039;");
                    r = r.replace(/\"/g, "&#034;")
                }
                return r
            }
            ;
        var i = function(r) {
                var s = new Date();
                if (typeof r == "number") {
                    s.setTime(r)
                }
                return (s.getYear() + 1900) + "-" + (s.getMonth() + 1) + "-" + s.getDate() + " " + s.getHours() + ":" + s.getMinutes() + ":" + s.getSeconds()
            }
            ;
        var p = function(s, y, v, u) {
                var A = "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_60x60.jpg";
                var B = typeof URLPrefix.my != "undefined" ? URLPrefix.my : "http://my.yhd.com";
                var r = B + "/order/orderDetail.do?orderCode=" + u;
                var x = [];
                x.push("<div class='prism_package' data-tpc='2012' orderCode='" + s.code + "'>");
                if (s.tracks && s.tracks.length > 0) {
                    x.push("<dl>");
                    if (y) {
                        x.push("<dt>包裹" + (v + 1) + "</dt>")
                    }
                    for (var w = 0; w < s.tracks.length; w++) {
                        var C = s.tracks[w];
                        x.push("<dd class='" + (w == 0 ? "cur" : "") + "'>");
                        x.push("<p title='" + d(C.content) + "'>" + d(C.content) + "</p>");
                        x.push("<p>" + i(C.createTime) + "</p>");
                        x.push("<em></em>");
                        x.push("</dd>")
                    }
                    x.push("</dl>")
                }
                x.push("<ul class='prism_pro_list clearfix'>");
                for (var v = 0; v < s.items.length; v++) {
                    var z = s.items[v];
                    var t = "http://item-home.yhd.com/item/snapshotShow.do?productId=" + z.productId + "&soItemId=" + z.soItemId + "&flag=1";
                    x.push("<li>");
                    x.push("<a href='" + t + "' target='_blank'>");
                    x.push("<img src='" + (z.productPicPath ? z.productPicPath : A) + "' alt='" + d(z.productName) + "' title='" + d(z.productName) + "' width='58' height='58'>");
                    x.push("</a>");
                    x.push("</li>");
                    if (v >= 4) {
                        break
                    }
                }
                if (s.items.length > 5) {
                    x.push("<li class='prism_total_pro'>");
                    x.push("<a href='" + r + "' target='_blank'>共" + s.items.length + "件</a>");
                    x.push("</li>")
                }
                x.push("</ul>");
                x.push("</div>");
                return x.join("")
            }
            ;
        var h = function(v) {
                var C = typeof URLPrefix.my != "undefined" ? URLPrefix.my : "http://my.yhd.com";
                var B = "http://my.yhd.com/order/myOrder.do";
                var z = [];
                if (v && v.length > 0) {
                    z.push("<div class='prism_show_tit clearfix' data-tpc='2001'>");
                    z.push("<a class='prism_all_order' href='" + B + "' target='_blank'>全部订单<em class='prism_iconfont'>&#xe62a;</em></a>");
                    z.push("<em class='prism_red_icon'></em>");
                    z.push("<span class='prism_tit'>我的订单</span>");
                    z.push("</div>");
                    for (var x = 0; x < v.length; x++) {
                        var u = v[x];
                        var s = u.status;
                        var t = u.actionType;
                        var r = C + "/order/orderDetail.do?orderCode=" + u.code;
                        var y = "http://my.yhd.com/order/finishOrder.do?orderCode=" + u.code;
                        var A = "http://e.yhd.com/front-pe/pe/orderProductExperience!orderProductExperience.do?soId=" + u.id + "&userId=" + g + "&soType=1";
                        z.push("<div class='prism_order_list' data-tpc='2010' orderStatus='" + s + "' actionType='" + t + "' orderCode='" + u.code + "'>");
                        z.push("<p class='prism_order_tit' data-tpc='2011'>");
                        if (t == 1) {
                            z.push("<a href='" + y + "' target='_blank' class='prism_not_pay' style='padding:0;' data-tpc='2002'><i>未支付</i><u>立即支付</u></a>")
                        } else {
                            if (t == 3) {
                                z.push("<a href='" + A + "' target='_blank' class='prism_not_pay' style='padding:0;' data-tpc='2003'><i>去评论</i><u>立即评论</u></a>")
                            }
                        }
                        z.push("<a href='" + r + "' target='_blank' data-tpc='2004'>订单号：" + u.code + "</a>");
                        z.push("</p>");
                        if (!u.hasSubOrders) {
                            z.push(p(u, false, 0, u.code))
                        } else {
                            for (var w = 0; w < u.subOrders.length; w++) {
                                var D = u.subOrders[w];
                                z.push(p(D, true, w, u.code))
                            }
                        }
                        z.push("</div>")
                    }
                } else {
                    z.push("<div class='hd_none_tips'>");
                    z.push("<span class='hd_none_icon'></span>");
                    z.push("<p class='hd_none_text'>您还没有下单哦~快去逛逛~</p>");
                    z.push("</div>")
                }
                return z.join("")
            }
            ;
        var o = function() {
                var s = URLPrefix.central + "/homepage/ajaxFindPrismOrders.do?callback=?";
                var r = function(u) {
                        j.prism.ordersData = u;
                        var w = h(u);
                        l.html("<div class='prism_scrollwrap'></div>");
                        a("div.prism_scrollwrap", l).append(w);
                        n();
                        var x = j.yhdStore;
                        var v = "top_prism_order_num_" + g;
                        if (x) {
                            x.setFromRoot(v, u.length)
                        }
                    }
                    ;
                var t = {
                    userId: g,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: f
                };
                a.getJSON(s, t, function(u) {
                    var w = u;
                    if (w) {
                        if (w.status == 1) {
                            var v = w.orders;
                            r(v)
                        }
                    }
                })
            }
            ;
        var n = function() {
                var r = a("div.prism_scrollwrap", l);
                var s = a(window).height();
                r.css("height", s)
            }
            ;
        var b = function() {
                a("a", c).attr("href", "javascript:void(0);");
                a("a", c).removeAttr("target");
                c.click(function() {
                    if (c.data("item-opened")) {
                        j.prism.functions.close();
                        c.data("item-opened", 0)
                    } else {
                        var r = function(s) {
                                if (s.result == 1) {
                                    c.data("item-opened", 1);
                                    j.prism.functions.open(c);
                                    if (!l.data("item-loaded")) {
                                        o();
                                        l.data("item-loaded", 1)
                                    } else {
                                        n()
                                    }
                                } else {
                                    if (yhdPublicLogin) {
                                        yhdPublicLogin.showLoginDiv()
                                    }
                                }
                            }
                            ;
                        j.globalCheckLogin(r)
                    }
                });
                a(window).resize(function() {
                    if (c.data("item-opened")) {
                        n()
                    }
                })
            }
            ;
        b()
    })
})(jQuery);
(function(a) {
    a(function() {
        var b = window.loli || (window.loli = {});
        var t = b.prism = b.prism || {};
        var m = t.functions = t.functions || {};
        var f = a.cookie("provinceId") || 1;
        var l = a.cookie("yihaodian_uid");
        var h = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!h) {
            return
        }
        if (b.util.isIE() && b.util.isIE() <= 7) {
            return
        }
        var c = (typeof globalPrismFavoriteFlag != "undefined" && globalPrismFavoriteFlag == "0") ? 0 : 1;
        if (!c) {
            return
        }
        var n = a("#prismFavorite");
        var d = a("#prismFavoriteDetail");
        var j = function(u) {
                if (u != null  && u != "") {
                    u = u.replace(/\&/g, "&amp;");
                    u = u.replace(/\</g, "&lt;");
                    u = u.replace(/\>/g, "&gt;");
                    u = u.replace(/\\/g, "&#92;");
                    u = u.replace(/\'/g, "&#039;");
                    u = u.replace(/\"/g, "&#034;")
                }
                return u
            }
            ;
        var r = function(u, z, v) {
                var x = z || 60;
                var y = v || 60;
                var w = /_\d+x\d+\.([a-zA-Z]+)$/;
                if (u) {
                    if (w.test(u)) {
                        u = u.replace(w, "_" + x + "x" + y + ".$1")
                    } else {
                        u = u.substring(0, u.lastIndexOf(".")) + "_" + x + "x" + y + u.substring(u.lastIndexOf("."))
                    }
                } else {
                    u = "http://image.yihaodianimg.com/front-homepage/global/images/defaultproduct_" + x + "x" + y + ".jpg"
                }
                return u
            }
            ;
        var i = function() {
                var u = a("div.prism_scrollwrap", d);
                var v = a(window).height();
                u.css("height", v)
            }
            ;
        var g = function(w) {
                var z = [];
                var v = "http://my.yhd.com/member/myNewCollection/myFavorite.do?operType=0";
                if (w && w.length > 0) {
                    z.push("<div class='favor_pro_list'>");
                    z.push("<ul>");
                    for (var y = 0; y < w.length; y++) {
                        var u = w[y];
                        var x = "http://item.yhd.com/item/" + u.pmInfoId;
                        var A = u.price ? true : false;
                        z.push("<li class='clearfix' productId='" + u.productId + "' pmInfoId='" + u.pmInfoId + "' merchantId='" + u.merchantId + "'>");
                        z.push("<a class='pro_img' href='" + x + "' target='_blank'>");
                        z.push("<img src='" + r(u.productUrl) + "' alt='" + j(u.productName) + "' title='" + j(u.productName) + "' width='68' height='68'>");
                        z.push("</a>");
                        z.push("<div class='pro_detail'>");
                        z.push("<a class='pro_name' href='" + x + "' title='" + j(u.productName) + "' target='_blank'>" + j(u.productName) + "</a>");
                        if (A) {
                            z.push("<p class='pro_price'>¥" + u.price + "</p>");
                            z.push("<p class='pro_sales'></p>")
                        } else {
                            z.push("<p class='pro_price'></p>");
                            z.push("<p class='pro_sales' style='color:#999;'>暂无库存</p>")
                        }
                        z.push("</div>");
                        if (A) {
                            z.push("<a class='prism_iconfont buy_cart_icon' href='javascript:;' data-tpc='4011' productId='" + u.productId + "' pmInfoId='" + u.pmInfoId + "' merchantId='" + u.merchantId + "'>&#xe62c;</a>");
                            z.push("<p class='success_tips none'></p>")
                        }
                        z.push("</li>")
                    }
                    z.push("</ul>");
                    z.push("<p class='view_more_btn'><a href='" + v + "' target='_blank' data-tpc='4012'>查看更多收藏商品<em class='prism_iconfont'>&#xe62a;</em></a></p>");
                    z.push("</div>")
                } else {
                    z.push("<div class='hd_none_tips'>");
                    z.push("<span class='hd_none_icon'></span>");
                    z.push("<p>还没有收藏的商品哦~</p>");
                    z.push("<p>收藏后，商品降价、促销时会提醒您哦~</p>");
                    z.push("</div>")
                }
                return z.join("")
            }
            ;
        var o = function(w) {
                var v = [];
                var x = "http://my.yhd.com/member/myNewCollection/myFavorite.do?operType=1";
                if (w && w.length > 0) {
                    v.push("<ul class='shop_favor'>");
                    for (var u = 0; u < w.length; u++) {
                        var z = w[u];
                        var y = "http://shop.yhd.com/m-" + z.merchantId + ".html";
                        v.push("<li class='clearfix'>");
                        v.push("<a class='pro_img' href='" + y + "' target='_blank'>");
                        v.push("<img width='90' height='90' src='" + r(z.logoUrl, 90, 90) + "' alt='" + z.merchantName + "'>");
                        v.push("</a>");
                        v.push("<div class='favor_shop_detail'>");
                        v.push("<div class='shop_detail_wrap'>");
                        v.push("<a class='pro_name' href='" + y + "' target='_blank'>" + z.merchantName + "</a>");
                        v.push("<p class='pro_sale'>&nbsp;</p>");
                        v.push("<a class='go_shop' href='" + y + "' target='_blank' data-tpc='4021'>进入店铺</a>");
                        v.push("</div>");
                        v.push("</div>");
                        v.push("</li>")
                    }
                    v.push("</ul>");
                    v.push("<p class='view_more_btn'><a href='" + x + "' target='_blank' data-tpc='4022'>查看更多收藏店铺<em class='prism_iconfont'>&#xe62a;</em></a></p>")
                } else {
                    v.push("<div class='hd_none_tips'>");
                    v.push("<span class='hd_none_icon'></span>");
                    v.push("<p>还没有收藏的店铺哦~</p>");
                    v.push("<p>收藏后，商品降价、促销时会提醒您哦~</p>");
                    v.push("</div>")
                }
                return v.join("")
            }
            ;
        var q = function() {
                var u = [];
                u.push("<div class='prism_scrollwrap'>");
                u.push("<div class='prism_show_tit' data-tpc='4001'>");
                u.push("<em class='prism_red_icon'></em>");
                u.push("<span class='prism_tit'>收藏夹</span>");
                u.push("</div>");
                u.push("<div class='prism_favor_tab clearfix' data-tpc='4002'>");
                u.push("<a class='cur' href='javascript:;'><span class='fr'>|</span>商品收藏<em></em></a><a href='javascript:;' class=''>店铺收藏<em></em></a>");
                u.push("</div>");
                u.push("<div class='favor_tab_detail' id='prismFavoriteProducts' data-tpc='4010'>");
                u.push("</div>");
                u.push("<div class='favor_tab_detail none' id='prismFavoriteShops' data-tpc='4020'>");
                u.push("</div>");
                u.push("</div>");
                return u.join("")
            }
            ;
        var s = function(v) {
                var u = "http://my.yhd.com/member/myNewFavorite/myUserFavoriteInfo.do?callback=?";
                var x = function(C) {
                        if (v == 0) {
                            var z = g(C);
                            a("#prismFavoriteProducts").append(z);
                            if (C && C.length > 0) {
                                var B = [];
                                for (var D = 0; D < C.length; D++) {
                                    var F = C[D];
                                    var A = F.price ? true : false;
                                    if (A) {
                                        B.push(F.pmInfoId)
                                    }
                                }
                                var E = false;
                                var y = [];
                                for (var D = 0; D < B.length; D++) {
                                    y.push(B[D]);
                                    if (D == B.length - 1) {
                                        E = true
                                    }
                                    if (y.length >= 10) {
                                        p(y, E);
                                        y = []
                                    }
                                }
                                if (y.length > 0) {
                                    p(y, E)
                                }
                            }
                        } else {
                            if (v == 1) {
                                var z = o(C);
                                a("#prismFavoriteShops").append(z)
                            }
                        }
                        if (C && C.length > 0) {
                            d.find("div.prism_favor_tab a:eq(" + v + ")").find("em").text("(" + (C.length > 99 ? "99+" : C.length) + ")")
                        }
                        i()
                    }
                    ;
                var w = {
                    userId: l,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: f,
                    favoriteType: v
                };
                a.getJSON(u, w, function(y) {
                    var A = y;
                    if (A) {
                        if (A.code == 0) {
                            var z = A.resultList;
                            x(z)
                        }
                    }
                })
            }
            ;
        var p = function(v) {
                var u = URLPrefix.central + "/homepage/ajaxFindProductPromotions.do?callback=?";
                var x = function(z) {
                        if (z && z.length > 0) {
                            for (var C = 0; C < z.length; C++) {
                                var D = z[C];
                                if (D.isPromotion) {
                                    var F = D.pmInfoId;
                                    var B = (D.promotionInfo && D.promotionInfo.length) ? D.promotionInfo[0] : null ;
                                    var E = d.find("div.favor_pro_list li[pmInfoId='" + F + "'] p.pro_sales");
                                    if (E.size() > 0 && B) {
                                        if (B.type == 2 || B.type == 3) {
                                            var y = "http://list.yhd.com/p/c0-b-a-s1-v0-p1-price-d0-pid" + D.productId + "-pt" + B.promotionId + "-pl" + B.levelId + "-m0";
                                            var A = "<em>促</em><a title='" + B.promDesc + "' href='" + y + "' target='_blank'>" + B.promDesc + "</a>";
                                            E.html(A)
                                        } else {
                                            var A = "<em>促</em>" + B.promDesc;
                                            E.html(A)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ;
                var w = {
                    mcsiteId: 1,
                    pmInfoIds: v.join(","),
                    provinceId: f
                };
                a.getJSON(u, w, function(y) {
                    var A = y;
                    if (A) {
                        if (A.status == 1) {
                            var z = A.result;
                            x(z)
                        }
                    }
                })
            }
            ;
        var e = function() {
                a("a", n).attr("href", "javascript:void(0);");
                a("a", n).removeAttr("target");
                n.click(function() {
                    if (n.data("item-opened")) {
                        b.prism.functions.close();
                        n.data("item-opened", 0)
                    } else {
                        var u = function(v) {
                                if (v.result == 1) {
                                    n.data("item-opened", 1);
                                    b.prism.functions.open(n);
                                    if (!d.data("item-loaded")) {
                                        s(0);
                                        d.data("item-loaded", 1)
                                    } else {
                                        i()
                                    }
                                } else {
                                    if (yhdPublicLogin) {
                                        yhdPublicLogin.showLoginDiv()
                                    }
                                }
                            }
                            ;
                        b.globalCheckLogin(u)
                    }
                });
                d.delegate("div.prism_favor_tab a", "click", function() {
                    var w = a(this);
                    var u = w.index();
                    var v = d.find("div.favor_tab_detail");
                    if (u == 1) {
                        if (!w.data("loaded")) {
                            s(1);
                            w.data("loaded", 1)
                        }
                    }
                    w.addClass("cur").siblings().removeClass("cur");
                    v.hide().eq(u).show();
                    return false
                });
                d.delegate("div.favor_pro_list ul li", "mouseenter", function() {
                    a(this).addClass("cur")
                });
                d.delegate("div.favor_pro_list ul li", "mouseleave", function() {
                    a(this).removeClass("cur")
                });
                d.delegate("div.favor_pro_list a.buy_cart_icon", "click", function(u) {
                    var v = a(this);
                    addToCartNew(u, v.attr("productId"), {
                        pmId: v.attr("pmInfoId"),
                        merchantId: v.attr("merchantId"),
                        amount: 1,
                        isFloat: false,
                        isDeleteNewDiv: true,
                        func: function() {
                            var w = v.siblings("p.success_tips");
                            w.text("商品成功加入购物车").show();
                            setTimeout(function() {
                                w.fadeOut(500)
                            }, 1500)
                        },
                        args: []
                    });
                    return false
                });
                a(window).resize(function() {
                    if (n.data("item-opened")) {
                        i()
                    }
                })
            }
            ;
        var k = q();
        d.html(k);
        e()
    })
})(jQuery);
(function(a) {
    a(function() {
        var d = window.loli || (window.loli = {});
        var p = d.prism = d.prism || {};
        var k = p.functions = p.functions || {};
        var l = a.cookie("provinceId") || 1;
        var n = a.cookie("yihaodian_uid");
        var g = (typeof globalPrismFlag != "undefined" && globalPrismFlag == "1") ? 1 : 0;
        if (!g) {
            return
        }
        if (d.util.isIE() && d.util.isIE() <= 7) {
            return
        }
        var e = (typeof globalPrismCouponFlag != "undefined" && globalPrismCouponFlag == "0") ? 0 : 1;
        if (!e) {
            return
        }
        var c = a("#prismCoupon");
        var b = a("#prismCouponDetail");
        var f = function() {
                var q = a("div.prism_scrollwrap", b);
                var r = a(window).height();
                q.css("height", r)
            }
            ;
        var m = (typeof curPageMerchantId != "undefined") ? curPageMerchantId : 0;
        var j = function(u) {
                if (!m) {
                    return u
                }
                var t = [];
                var s = [];
                if (u && u.length > 0) {
                    for (var r = 0; r < u.length; r++) {
                        var q = u[r];
                        if (q.useScope == 2 && q.merchantId == m && (q.timeType == 1 || q.timeType == 2)) {
                            t.push(q)
                        } else {
                            s.push(q)
                        }
                    }
                    return t.concat(s)
                }
                return u
            }
            ;
        var o = function(w) {
                w = j(w);
                var s = [];
                var u = "http://coupon.yhd.com/myCoupon";
                if (w && w.length > 0) {
                    s.push("<div class='prism_show_tit' data-tpc='3001'>");
                    s.push("<a class='prism_all_order' href='" + u + "' target='_blank'>全部抵用券<em class='prism_iconfont'>&#xe62a;</em></a>");
                    s.push("<em class='prism_red_icon'></em>");
                    s.push("<span class='prism_tit'>抵用券</span>");
                    s.push("</div>");
                    s.push("<dl class='prism_coupon_wrap prism_use_coupon' style='padding-top:10px;' data-tpc='3010'>");
                    for (var r = 0; r < w.length; r++) {
                        var q = w[r];
                        var t = "http://list.yhd.com/redirectCoupon/" + q.couponActiveDefId;
                        if (q.couponUserType == 0 || q.couponUserType == 5 || q.couponUserType == 6 || q.couponUserType == 7 || q.couponUserType == 8) {
                            t = u
                        }
                        if (q.useScope == 2 && q.merchantId) {
                            t = "http://shop.yhd.com/m-" + q.merchantId + ".html"
                        }
                        var v = "";
                        if (q.timeType == 1) {
                            if (q.dateDiff == 0) {
                                v = "今天到期"
                            } else {
                                v = "还剩" + q.dateDiff + "天到期"
                            }
                        } else {
                            v = "有效期:" + q.startDateStr + " 至 " + q.endDateStr
                        }
                        s.push("<dd>");
                        s.push("<p class='coupon_value'>¥<span>" + q.amount + "</span></p>");
                        if (q.timeType == 1 || q.timeType == 2) {
                            s.push("<p style='height:35px;width:110px;'>" + q.couponInfo + "</p>");
                            s.push("<div class='valid_date'>" + v + "</div>");
                            s.push("<a class='use_coupon' href='" + t + "' target='_blank' data-tpc='3011'>立即使用</a>")
                        } else {
                            s.push("<p style='height:35px;width:130px;'>" + q.couponInfo + "</p>");
                            s.push("<div class='valid_date'>" + v + "</div>");
                            s.push("<a class='use_coupon' href='" + t + "' target='_blank' data-tpc='3011'>查看</a>")
                        }
                        s.push("<em class='left_wave'></em>");
                        s.push("<i class='coupon_circle'></i>");
                        s.push("</dd>")
                    }
                    s.push("</dl>")
                } else {
                    s.push("<div class='hd_none_tips'>");
                    s.push("<span class='hd_none_icon'></span>");
                    s.push("<p class='hd_none_text'>您还没有抵用券哦~</p>");
                    s.push("</div>")
                }
                return s.join("")
            }
            ;
        var i = function() {
                var q = URLPrefix.central + "/homepage/ajaxFindPrismCoupons.do?callback=?";
                var s = function(t) {
                        d.prism.couponsData = t;
                        var u = o(t);
                        b.html("<div class='prism_scrollwrap'></div>");
                        a("div.prism_scrollwrap", b).append(u);
                        f();
                        var w = d.yhdStore;
                        var v = "top_prism_coupon_num_" + n;
                        if (w) {
                            w.setFromRoot(v, t.length)
                        }
                    }
                    ;
                var r = {
                    userId: n,
                    currSiteId: (typeof currSiteId == "undefined") ? 1 : currSiteId,
                    currSiteType: 1,
                    provinceId: l
                };
                a.getJSON(q, r, function(t) {
                    var v = t;
                    if (v) {
                        if (v.status == 1) {
                            var u = v.coupons;
                            s(u)
                        }
                    }
                })
            }
            ;
        var h = function() {
                a("a", c).attr("href", "javascript:void(0);");
                a("a", c).removeAttr("target");
                c.click(function() {
                    if (c.data("item-opened")) {
                        d.prism.functions.close();
                        c.data("item-opened", 0)
                    } else {
                        var q = function(r) {
                                if (r.result == 1) {
                                    c.data("item-opened", 1);
                                    d.prism.functions.open(c);
                                    if (!b.data("item-loaded")) {
                                        i();
                                        b.data("item-loaded", 1)
                                    } else {
                                        f()
                                    }
                                } else {
                                    if (yhdPublicLogin) {
                                        yhdPublicLogin.showLoginDiv()
                                    }
                                }
                            }
                            ;
                        d.globalCheckLogin(q)
                    }
                });
                a(window).resize(function() {
                    if (c.data("item-opened")) {
                        f()
                    }
                })
            }
            ;
        h()
    })
})(jQuery);
