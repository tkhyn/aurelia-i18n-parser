System.register(["through2", "gulp-util", "lodash", "graceful-fs", "jsdom", "jquery", "./helpers", "path", "vinyl", "./app-extractor", "core-js"], function (_export) {
    "use strict";

    var through, gutil, _, fs, jsdom, $, hashFromString, mergeHash, replaceEmpty, transformText, loadFromJSONFile, path, File, AppExtractor, corejs, Promise, PluginError, PLUGIN_NAME, OBJ_REGEXP, KEY_VALUE_REGEXP, KEY_VALUE_REGEXP_T, Parser;

    var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    _export("parse", parse);

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function parse(opts) {
        return new Parser(opts).parse();
    }

    return {
        setters: [function (_through2) {
            through = _through2["default"];
        }, function (_gulpUtil) {
            gutil = _gulpUtil["default"];
        }, function (_lodash) {
            _ = _lodash["default"];
        }, function (_gracefulFs) {
            fs = _gracefulFs["default"];
        }, function (_jsdom) {
            jsdom = _jsdom["default"];
        }, function (_jquery) {
            $ = _jquery["default"];
        }, function (_helpers) {
            hashFromString = _helpers.hashFromString;
            mergeHash = _helpers.mergeHash;
            replaceEmpty = _helpers.replaceEmpty;
            transformText = _helpers.transformText;
            loadFromJSONFile = _helpers.loadFromJSONFile;
        }, function (_path) {
            path = _path["default"];
        }, function (_vinyl) {
            File = _vinyl["default"];
        }, function (_appExtractor) {
            AppExtractor = _appExtractor.AppExtractor;
        }, function (_coreJs) {
            corejs = _coreJs["default"];
        }],
        execute: function () {
            Promise = corejs.Promise;
            PluginError = gutil.PluginError;
            PLUGIN_NAME = "aurelia-i18n-parser";
            OBJ_REGEXP = /^\s*\{\s*([\s\S]*)\s*\}\s*$/;
            KEY_VALUE_REGEXP = /\s*['"]?([\w]*)['"]?\s*:\s*(\{[\s\S]*\}|\[[\s\S]*\]|[^,]*)\s*,?\s*(?=$|["'\w]+)/g;
            KEY_VALUE_REGEXP_T = /('.*'|".*")\s*\|\s*t\s*:?\s*(.*?)\s*(?:\||$)/;

            Parser = (function () {
                function Parser(opts) {
                    _classCallCheck(this, Parser);

                    this.verbose = false;
                    this.defaultNamespace = 'translation';
                    this.functions = ['t'];
                    this.namespaceSeparator = ":";
                    this.translationAttribute = "data-i18n";
                    this.imageAttribute = "data-src";
                    this.keySeparator = ".";
                    this.functionsParamsExclude = ['key: string, options: any'];
                    this.localesPath = "src/locales";
                    this.routesArrayPath = null;
                    this.locales = ['en-US'];
                    this.defaultLocale = "en";
                    this.shortcutFunction = 'sprintf';
                    this.bindAttrs = ['bind', 'one-way', 'two-way', 'one-time'];
                    this.registry = [];
                    this.values = {};
                    this.nodes = {};

                    if (opts) Object.assign(this, opts);

                    if (this.routesArrayPath) {
                        this.extractor = new AppExtractor(this.routesArrayPath);
                    }
                }

                _createClass(Parser, [{
                    key: "parse",
                    value: function parse() {
                        return this.stream = through.obj(this.transformFile.bind(this), this.flush.bind(this));
                    }
                }, {
                    key: "parseTranslations",
                    value: function parseTranslations(path, data) {
                        var ext = this.getExtension(path);
                        switch (ext) {
                            case 'html':
                                if (this.verbose) gutil.log("parse HTML:", path);
                                return this.parseHTML(data, path);
                            default:
                                if (this.verbose) gutil.log("parse JS:", path);
                                return this.parseJavaScript(data, path);
                        }
                    }
                }, {
                    key: "parseKeyOptions",
                    value: function parseKeyOptions(keyOptions, path) {
                        var keys = [],
                            _this2 = this,
                            key,
                            options;

                        keyOptions.forEach(function (keyOption) {
                            var _keyOption = _slicedToArray(keyOption, 2);

                            key = _keyOption[0];
                            options = _keyOption[1];

                            try {
                                key = eval(key.replace(/this./g, ''));

                                keys.push(key);

                                if (!options) {
                                    return;
                                }

                                var defaultValue = undefined;
                                try {
                                    options = OBJ_REGEXP.exec(options);

                                    if (options === null) {
                                        if (this.shortcutFunction == 'defaultValue') {
                                            defaultValue = options;
                                            defaultValue = eval('(' + defaultValue + ')');
                                        }
                                    } else {
                                        var kv;
                                        while (kv = KEY_VALUE_REGEXP.exec(options[1])) {
                                            if (kv[1] == 'defaultValue') {
                                                defaultValue = kv[2];
                                                defaultValue = eval("(" + defaultValue + ")");
                                                break;
                                            }
                                        }
                                    }

                                    if (defaultValue) {
                                        _this2.values[key] = defaultValue;
                                    }
                                } catch (e) {
                                    console.warn("Unable to parse default value \"" + defaultValue + "\" for key \"" + key + "\" in file " + path + ". Error: " + e);
                                }
                            } catch (e) {
                                console.warn("Unable to parse key \"" + key + "\" in file " + path + ". Error: " + e);
                            }
                        });

                        return keys;
                    }
                }, {
                    key: "parseJavaScript",
                    value: function parseJavaScript(data, path) {
                        var fnPattern = '(?:' + this.functions.join('\\()|(?:').replace('.', '\\.') + '\\()';
                        var pattern = '[^a-zA-Z0-9_](?:' + fnPattern + ')([^);]*)';
                        var functionRegex = new RegExp(pattern, 'g');

                        var matches, keyOption;
                        var keyOptions = [];

                        while (matches = functionRegex.exec(data)) {
                            if (matches.length > 1) {
                                var argsMatch = matches[1];
                                var argsMatchTrim = argsMatch.replace(/ /g, '');
                                if (!this.functionsParamsExclude || this.functionsParamsExclude.map(function (item) {
                                    return item.replace(/ /g, '');
                                }).indexOf(argsMatchTrim) < 0) {

                                    keyOption = argsMatch.split(/,([\s\S]+)/);

                                    if (keyOption && keyOption[0]) {
                                        keyOptions.push(keyOption);
                                    }
                                }
                            }
                        }

                        return Promise.resolve(this.parseKeyOptions(keyOptions, path));
                    }
                }, {
                    key: "parseHTML",
                    value: function parseHTML(data, path) {
                        var _this = this;

                        return new Promise(function (resolve, reject) {
                            jsdom.env({
                                html: data,
                                done: function done(errors, window) {
                                    if (errors) {
                                        gutil.log(errors);
                                        reject(errors);
                                        return;
                                    }
                                    resolve(_this.parseAureliaBindings(data, path).concat(_this.parseDOM(window, $)));
                                }
                            });
                        });
                    }
                }, {
                    key: "parseAureliaBindings",
                    value: function parseAureliaBindings(html, path) {

                        var bindingsPattern = '(?:\\.(?:' + this.bindAttrs.join('|') + ')\\s*=\\s*(?:"(.*)"|\'(.*)\')|\\$\\{(.*)\\})',
                            bindingsRegex = new RegExp(bindingsPattern, 'g'),
                            keyOptions = [],
                            boundExpr,
                            keyOption;

                        while (boundExpr = bindingsRegex.exec(html)) {

                            keyOption = KEY_VALUE_REGEXP_T.exec(boundExpr[1]);

                            if (keyOption) {
                                keyOptions.push(keyOption.slice(1));
                            }
                        }

                        return this.parseKeyOptions(keyOptions, path);
                    }
                }, {
                    key: "parseDOM",
                    value: function parseDOM(window, $) {
                        var _this3 = this;

                        $ = $(window);
                        var keys = [];
                        var selector = "[" + this.translationAttribute + "]";
                        var nodes = $(selector);

                        nodes.each(function (i) {
                            var node = nodes.eq(i);
                            var value, key, m;

                            key = node.attr(_this3.translationAttribute);

                            var attr = "text";

                            if (node[0].nodeName === "IMG") attr = "src";

                            var re = /\[([a-z]*)]/g;

                            while ((m = re.exec(key)) !== null) {
                                if (m.index === re.lastIndex) {
                                    re.lastIndex++;
                                }
                                if (m) {
                                    key = key.replace(m[0], '');
                                    attr = m[1];
                                }
                            }

                            switch (node[0].nodeName) {
                                case "IMG":
                                    value = node.attr(_this3.imageAttribute);
                                    break;
                                default:
                                    switch (attr) {
                                        case 'text':
                                            value = node.text().trim();
                                            break;
                                        case 'prepend':
                                            value = node.html().trim();
                                            break;
                                        case 'append':
                                            value = node.html().trim();
                                            break;
                                        case 'html':
                                            value = node.html().trim();
                                            break;
                                        default:
                                            value = node.attr(attr);
                                            break;
                                    }
                            }

                            if (key.indexOf("${") > -1) {
                                return;
                            }

                            key = key.replace(/\\('|")/g, '$1');

                            key = key.replace(/\[[a-z]*]/g, '');

                            if (!key) key = value;
                            keys.push(key);
                            if (value) {
                                _this3.values[key] = value;
                            }
                            _this3.nodes[key] = node;
                        });

                        return keys;
                    }
                }, {
                    key: "addToRegistry",
                    value: function addToRegistry(keys) {
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var key = _step.value;

                                key = key.replace(/\\('|")/g, '$1');

                                if (key.indexOf(this.namespaceSeparator) === -1) {
                                    key = this.defaultNamespace + this.keySeparator + key;
                                } else {
                                    key = key.replace(this.namespaceSeparator, this.keySeparator);
                                }

                                this.registry.push(key);
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator["return"]) {
                                    _iterator["return"]();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    }
                }, {
                    key: "generateTranslation",
                    value: function generateTranslation(locale) {

                        var mergedTranslations, currentTranslations, oldTranslations, key;

                        this.registryHash = {};

                        for (var i = 0, l = this.registry.length; i < l; i++) {
                            key = this.registry[i];
                            this.registryHash = hashFromString(key, '', this.keySeparator, this.registryHash);
                        }

                        for (var namespace in this.registryHash) {
                            if (!this.registryHash.hasOwnProperty(namespace)) continue;

                            var namespacePath = namespace + '.json',
                                namespaceOldPath = namespace + '_old.json';

                            var basePath = this.localesPath + "/" + locale + "/";
                            if (this.verbose) gutil.log('basePath', basePath);

                            currentTranslations = loadFromJSONFile(basePath + namespacePath);
                            oldTranslations = loadFromJSONFile(basePath + namespaceOldPath);

                            mergedTranslations = mergeHash(currentTranslations, Object.assign({}, this.registryHash[namespace]));

                            mergedTranslations["new"] = replaceEmpty(oldTranslations, mergedTranslations["new"]);

                            var transform = null;

                            if (locale !== this.defaultLocale) transform = "uppercase";

                            mergedTranslations["new"] = this.getValuesFromHash(this.valuesHash, mergedTranslations["new"], transform, this.nodesHash, this.valuesHash);

                            mergedTranslations.old = _.extend(oldTranslations, mergedTranslations.old);

                            var mergedTranslationsFile = new File({
                                path: locale + "/" + namespacePath,
                                contents: new Buffer(JSON.stringify(mergedTranslations["new"], null, 2))
                            });
                            var mergedOldTranslationsFile = new File({
                                path: locale + "/" + namespaceOldPath,
                                contents: new Buffer(JSON.stringify(mergedTranslations.old, null, 2))
                            });

                            if (this.verbose) {
                                gutil.log('writing', locale + "/" + namespacePath);
                                gutil.log('writing', locale + "/" + namespaceOldPath);
                            }

                            this.stream.push(mergedTranslationsFile);
                            this.stream.push(mergedOldTranslationsFile);
                        }
                    }
                }, {
                    key: "generateAllTranslations",
                    value: function generateAllTranslations() {
                        this.updateHashes();

                        if (this.verbose) {
                            gutil.log('extracted registry:');
                            gutil.log(this.registry);
                        }

                        for (var i = 0, l = this.locales.length; i < l; i++) {
                            this.generateTranslation(this.locales[i]);
                        }
                    }
                }, {
                    key: "extractFromApp",
                    value: function extractFromApp() {
                        var _this4 = this;

                        return this.extractor.getNavFromRoutes().then(function (navRoutes) {
                            if (!navRoutes) return null;

                            for (var i = 0, l = navRoutes.length; i < l; i++) {
                                var item = navRoutes[i];
                                _this4.values[item.i18n] = item.title;
                                _this4.registry.push(_this4.defaultNamespace + _this4.keySeparator + item.i18n);
                            }

                            if (_this4.verbose) {
                                gutil.log('navRoutes found:');
                                gutil.log(navRoutes);
                            }

                            return null;
                        });
                    }
                }, {
                    key: "getValuesFromHash",
                    value: function getValuesFromHash(source, target, transform, nodesHash, valuesHash) {
                        var _this5 = this;

                        target = target || {};

                        Object.keys(source).forEach(function (key) {

                            var node = null;
                            if (nodesHash) node = nodesHash[key];
                            var value;

                            if (target[key] !== undefined) {
                                if (typeof source[key] === 'object') {
                                    target[key] = _this5.getValuesFromHash(source[key], target[key], transform, node, valuesHash ? valuesHash[key] : valuesHash);
                                } else if (target[key] === '') {
                                    if (!node) {
                                        if (valuesHash) value = valuesHash[key];
                                        if (transform === "uppercase") value = transformText(value);
                                    } else {
                                        value = source[key];
                                        if (transform === "uppercase" && node[0].nodeName !== "IMG") value = transformText(value);
                                    }
                                    target[key] = value;
                                }
                            }
                        });

                        return target;
                    }
                }, {
                    key: "getExtension",
                    value: function getExtension(path) {
                        return path.substr(path.lastIndexOf(".") + 1);
                    }
                }, {
                    key: "updateHashes",
                    value: function updateHashes() {

                        this.translationsHash = {};
                        this.valuesHash = {};
                        this.nodesHash = {};

                        var key;

                        this.translations = _.uniq(this.translations).sort();

                        for (key in this.values) {
                            if (!this.values.hasOwnProperty(key)) continue;
                            this.valuesHash = hashFromString(key, this.values[key], this.keySeparator, this.valuesHash);
                        }

                        for (key in this.nodes) {
                            if (!this.nodes.hasOwnProperty(key)) continue;
                            this.nodesHash = hashFromString(key, this.nodes[key], this.keySeparator, this.nodesHash);
                        }
                    }
                }, {
                    key: "transformFile",
                    value: function transformFile(file, encoding, cb) {
                        var _this6 = this;

                        var data, path;

                        if (file.isStream()) {
                            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                            return cb();
                        }

                        if (file.isNull()) {
                            path = file.path;
                            if (file.stat.isDirectory()) {
                                return cb();
                            } else if (path && fs.existsSync(path)) {
                                data = fs.readFileSync(path);
                            } else {
                                this.emit("error", new PluginError(PLUGIN_NAME, "File has no content and is not readable"));
                                return cb();
                            }
                        }

                        if (file.isBuffer()) {
                            path = file.path.replace(process.cwd() + "/", "");
                            data = file.contents.toString();
                        }

                        if (!data) return cb();

                        data = this.parseTranslations(path, data).then(function (keys) {
                            _this6.addToRegistry(keys);

                            cb();
                        });
                    }
                }, {
                    key: "flush",
                    value: function flush(cb) {
                        var _this7 = this;

                        if (this.extractor) {
                            this.extractFromApp().then(function () {
                                _this7.generateAllTranslations();
                                cb();
                            });
                        } else {
                            this.generateAllTranslations();
                            cb();
                        }
                    }
                }]);

                return Parser;
            })();

            _export("Parser", Parser);
        }
    };
});
//# sourceMappingURL=index.js.map
