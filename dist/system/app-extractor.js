System.register(["systemjs", "babel/polyfill", "path", "core-js"], function (_export) {
    "use strict";

    var System, path, corejs, Promise, AppExtractor;

    var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    return {
        setters: [function (_systemjs) {
            System = _systemjs["default"];
        }, function (_babelPolyfill) {}, function (_path) {
            path = _path;
        }, function (_coreJs) {
            corejs = _coreJs["default"];
        }],
        execute: function () {
            Promise = corejs.Promise;

            AppExtractor = (function () {
                function AppExtractor(rootArray) {
                    _classCallCheck(this, AppExtractor);

                    this.path = path.dirname(rootArray);

                    var _path$basename$split = path.basename(rootArray).split('.');

                    var _path$basename$split2 = _slicedToArray(_path$basename$split, 2);

                    this.module = _path$basename$split2[0];
                    this.array = _path$basename$split2[1];
                }

                _createClass(AppExtractor, [{
                    key: "getNavFromRoutes",
                    value: function getNavFromRoutes() {
                        var _this = this;

                        System.config({
                            "baseURL": "./",
                            "transpiler": 'babel',
                            "babelOptions": {
                                "stage": 0
                            },
                            "paths": {
                                "*": this.path + "/*.js"
                            }
                        });

                        return new Promise(function (resolve, reject) {
                            return System["import"](_this.module).then(function (m) {
                                var navRoutes = [];
                                for (var i = 0, l = m[_this.array].length; i < l; i++) {
                                    var route = m[_this.array][i];
                                    if (route.nav) navRoutes.push(route);
                                }
                                resolve(navRoutes);
                            });
                        });
                    }
                }]);

                return AppExtractor;
            })();

            _export("AppExtractor", AppExtractor);
        }
    };
});
//# sourceMappingURL=app-extractor.js.map
