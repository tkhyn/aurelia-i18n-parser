"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _systemjs = require("systemjs");

var _systemjs2 = _interopRequireDefault(_systemjs);

require("babel/polyfill");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _coreJs = require("core-js");

var _coreJs2 = _interopRequireDefault(_coreJs);

var Promise = _coreJs2["default"].Promise;

var AppExtractor = (function () {
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

            _systemjs2["default"].config({
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
                return _systemjs2["default"]["import"](_this.module).then(function (m) {
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

exports.AppExtractor = AppExtractor;
//# sourceMappingURL=app-extractor.js.map
