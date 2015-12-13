import through from 'through2';
import gutil from "gulp-util";
import _ from "lodash";
import fs from "graceful-fs";
import jsdom from "jsdom";
import $ from "jquery";

import {hashFromString,mergeHash,replaceEmpty,transformText} from "./helpers";
import path from "path";
import File from "vinyl";
import {AppExtractor} from "./app-extractor";

import corejs from "core-js";
var Promise = corejs.Promise;

var PluginError = gutil.PluginError;

const PLUGIN_NAME = "aurelia-i18n-parser";

const OBJ_REGEXP = new RegExp(/^\s*\{\s*([\s\S]*)\s*\}\s*$/);
const KEY_VALUE_REGEXP = new RegExp(/\s*['"]?([\w]*)['"]?\s*:\s*(\{[\s\S]*\}|\[[\s\S]*\]|[^,]*)\s*,?\s*(?=$|["'\w]+)/g);
const KEY_VALUE_REGEXP_T = new RegExp(/('.*'|".*")\s*\|\s*t\s*:\s*(.*?)\s*(?:\||$)/)


export class Parser{

    verbose = false;
    defaultNamespace ='translation';
    functions = ['t'];
    namespaceSeparator = ":";
    translationAttribute = "data-i18n";
    imageAttribute = "data-src";
    keySeparator = ".";
    functionsParamsExclude = ['key: string, options: any'];
    appPath = null;
    localesPath = "src/locales";
    routesModuleId = "routes";
    locales = ['en-US'];
    defaultLocale = "en";
    shortcutFunction = 'sprintf';
    bindAttrs = ['bind', 'one-way', 'two-way', 'one-time'];

    registry = [];
    values = {};
    nodes = {};

    constructor(opts){
        if(opts) Object.assign(this,opts);

        if(this.appPath) this.extractor = new AppExtractor(this.appPath);
    }

    parse(){
        return this.stream = through.obj(this.transformFile.bind(this), this.flush.bind(this));
    }

    /**
     * Figures out how to parse the data based on file extension.
     *
     * @param path          path to the file
     * @param data          data of the file
     * @returns {Promise}   resolved when data has been parsed
     */
    parseTranslations(path,data){
        var ext = this.getExtension(path);
        switch(ext){
            case 'html':
                if(this.verbose) gutil.log("parse HTML:",path);
                return this.parseHTML(data, path);
            default:
                if(this.verbose) gutil.log("parse JS:",path);
                return this.parseJavaScript(data, path);
        }
    }

    /**
     * Extract translations from an array of (key, options) strings
     * @returns {Array}     the extracted translation keys
     */

    parseKeyOptions(keyOptions, path) {
        var keys = [],
            _this2 = this,
            namespace = this.getNamespace(path);

        var key, options;

        keyOptions.forEach(function(keyOption) {

            [key, options] = keyOption;

            try {
                key = eval(key.replace(/this./g, ''));

                keys.push(key);

                // try and extract default value from options
                if (options === undefined) {
                    return;
                }

                var defaultValue = undefined;
                try {
                    options = OBJ_REGEXP.exec(options)[1];

                    if (options === null) {
                        // we have a single value, possibly because
                        // i18next is used with shortcutFunction: 'defaultValue'
                        // and 'options' is a string that should be evaluated
                        if (this.shortcutFunction == 'defaultValue') {
                            defaultValue = options;
                            defaultValue = eval('(' + defaultValue + ')');
                        }
                    } else {
                        // options is an object, parse the keys
                        var kv;
                        while (kv = KEY_VALUE_REGEXP.exec(options)) {
                            if (kv[1] == 'defaultValue') {
                                defaultValue = kv[2];
                                defaultValue = eval(`(${defaultValue})`);
                                break;
                            }
                        }
                    }

                    if (defaultValue) {
                        _this2.values[key] = defaultValue;
                    }
                } catch (e) {
                    console.warn(`Unable to parse default value "${defaultValue}" for key "${key}" in file ${path}. Error: ${e}`);
                }
            } catch (e) {
                console.warn(`Unable to parse key "${key}" in file ${path}. Error: ${e}`);
            }

        });

        return keys;
    }


    /**
     * Extract translations from javascript code.
     *
     * @param data          javascript code as a string
     * @returns {Promise}   resolved when data has been parsed
     */
    parseJavaScript(data, path){
        var fnPattern = '(?:' + this.functions.join('\\()|(?:').replace('.', '\\.') + '\\()';
        var pattern = '[^a-zA-Z0-9_](?:'+ fnPattern +')([^);]*)';
        var functionRegex = new RegExp(pattern, 'g');

        var matches, keyOption;
        var keyOptions = [];

        while( matches = functionRegex.exec(data) ){
            // parameters pairs are always in third element of matches array
            if (matches.length > 1) {
                var argsMatch = matches[1]; //replace spaces with empty
                var argsMatchTrim = argsMatch.replace(/ /g, '');
                if (!this.functionsParamsExclude || this.functionsParamsExclude.map(function(item) {return item.replace(/ /g, '');}).indexOf(argsMatchTrim) < 0) {

                    keyOption = argsMatch.split( /,([\s\S]+)/);

                    if (keyOption && keyOption[0]) {
                        keyOptions.push(keyOption);
                    }
                }
            }
        }

        return Promise.resolve(this.parseKeyOptions(keyOptions, path));
    }

    /**
     * Extract translations from html markup.
     *
     * @param data          html markup as a string
     * @returns {Promise}   resolved when data has been parsed
     */
    parseHTML(data, path){
        return new Promise((resolve, reject) =>{
            jsdom.env({
                html: data,
                done: (errors, window)=>{
                    if(errors){
                        //throw new new PluginError(PLUGIN_NAME, 'Streams are not supported!');
                        gutil.log(errors);
                        reject(errors);
                        return;
                    }
                    resolve(this.parseAureliaBindings(data, path));
                    resolve(this.parseDOM(window,$));
                }
            });
        });
    }

    /**
    * Extract translations from aurelia bindnigs.
    *
    * @param window          a jsdom window
    * @param $               jquery
    * @returns {Array}       extracted keys
    */
    parseAureliaBindings(html, path) {

        var bindingsPattern = '(?:\\.(?:' + this.bindAttrs.join('|') + ')\\s*=\\s*(?:"(.*)"|\'(.*)\')|\\$\\{(.*)\\})',
            bindingsRegex = new RegExp(bindingsPattern, 'g'),
            keyOptions = [],
            boundExpr, keyOption;

        while(boundExpr = bindingsRegex.exec(html)) {

            keyOption = KEY_VALUE_REGEXP_T.exec(boundExpr[1]);

            if (keyOption) {
                keyOptions.push(keyOption.slice(1));
            }

        }

        return this.parseKeyOptions(keyOptions, path);
    }

    /**
     * Extract translations from html markup.
     *
     * @param window          a jsdom window
     * @param $               jquery
     * @returns {Array}       extracted keys
     */
    parseDOM(window,$){
        $ = $(window);
        var keys = [];
        var selector = `[${this.translationAttribute}]`;
        var nodes = $(selector);

        nodes.each(i=>{
            var node = nodes.eq(i);
            var value,key,m;

            key = node.attr(this.translationAttribute);

            var attr = "text";
            //set default attribute to src if this is an image node
            if(node[0].nodeName==="IMG") attr = "src";

            var re = /\[([a-z]*)]/g;
            //check if a attribute was specified in the key
            while ((m = re.exec(key)) !== null) {
                if (m.index === re.lastIndex) {
                    re.lastIndex++;
                }
                if(m){
                    key = key.replace(m[0],'');
                    attr = m[1];
                }
            }

            switch(node[0].nodeName){
                case "IMG":
                    value = node.attr(this.imageAttribute);
                    break;
                default:
                    switch(attr){
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
                        default: //custom attribute
                            value = node.attr(attr);
                            break;
                    }
            }

            //skip keys with interpolations
            if(key.indexOf("${") > -1){
                return;
            }

            // remove the backslash from escaped quotes
            key = key.replace(/\\('|")/g, '$1');

            // remove the optional attribute
            key = key.replace(/\[[a-z]*]/g, '');

            if(!key) key = value;
            keys.push(key);
            this.values[key] = value;
            this.nodes[key] = node;
        });

        return keys;
    }

    /**
     * Parse and add keys to the registry.
     * @param keys
     */
    addToRegistry(keys){
        for(let key of keys){
        // remove the backslash from escaped quotes
            key = key.replace(/\\('|")/g, '$1');

            if(key.indexOf(this.namespaceSeparator) === -1){
                key = this.defaultNamespace + this.keySeparator + key;
            }else{
                key = key.replace(this.namespaceSeparator, this.keySeparator);
            }

            this.registry.push(key);
        }
    }

    getNamespace(path) {
        var startInd = path.indexOf(this.projectFolderName) + this.projectFolderName.length + 1;
        var dotInd = path.indexOf('.');
        return path.substr(startInd, dotInd - startInd).replace(/\\/g, '.');
    }   

    /**
     * Generate translation files from the current registry entries.
     *
     * @param locale
     */
    generateTranslation(locale){

        var mergedTranslations, currentTranslations, oldTranslations, key;

        this.registryHash = {};

        // turn the array of keys
        // into an associative object
        // ==========================
        for(var i = 0, l = this.registry.length; i < l; i++){
            key = this.registry[i];
            this.registryHash = hashFromString(key, '', this.keySeparator, this.registryHash);
        }

        for(var namespace in this.registryHash){
            if(!this.registryHash.hasOwnProperty(namespace)) continue;

            // get previous version of the files
            var namespacePath = namespace + '.json';
            //var namespaceOldPath = namespace + '_old.json';

            var basePath = this.localesPath+"/"+locale+"/";
            if(this.verbose) gutil.log('basePath', basePath);

            if(fs.existsSync(basePath+namespacePath)){
                try{
                    currentTranslations = JSON.parse(fs.readFileSync(basePath+namespacePath));
                }catch(error){
                    this.emit('json_error', error.name, error.message);
                    currentTranslations = {};
                }
            }else{
                currentTranslations = {};
            }

            //if(fs.existsSync(basePath+namespaceOldPath)){
            //  try{
            //    oldTranslations = JSON.parse(fs.readFileSync(basePath+namespaceOldPath));
            //  }
            //  catch(error){
            //    this.emit('json_error', error.name, error.message);
            //    currentTranslations = {};
            //  }
            //}
            //else{
            //  oldTranslations = {};
            //}

            oldTranslations = {};

            // merges existing translations with the new ones
            mergedTranslations = mergeHash(currentTranslations, Object.assign({}, this.registryHash[namespace]));

            // restore old translations if the key is empty
            mergedTranslations.new = replaceEmpty(oldTranslations, mergedTranslations.new);

            var transform = null;
            //transform values found in the html to uppercase if this is not the default language
            if(locale !== this.defaultLocale) transform = "uppercase";

            mergedTranslations.new = this.getValuesFromHash(this.valuesHash, mergedTranslations.new,transform,this.nodesHash,this.valuesHash);

            // merges former old translations with the new ones
            mergedTranslations.old = _.extend(oldTranslations, mergedTranslations.new);

            // push files back to the stream
            var mergedTranslationsFile = new File({
                path: locale+"/"+namespacePath,
                //base: locale,
                contents: new Buffer(JSON.stringify(mergedTranslations.new, null, 2))
            });
            //var mergedOldTranslationsFile = new File({
            //  path: locale+"/"+namespaceOldPath,
            //  //base: locale,
            //  contents: new Buffer(JSON.stringify(mergedTranslations.old, null, 2))
            //});

            /*if(this.verbose){
              gutil.log('writing', locale+"/"+namespacePath);
              gutil.log('writing', locale+"/"+namespaceOldPath);
            }*/

            this.stream.push(mergedTranslationsFile);
            //this.stream.push(mergedOldTranslationsFile);
        }

    }

    /**
     * Generate translations for all locales from the registry
     */
    generateAllTranslations(){
        this.updateHashes();

        if(this.verbose) {
            gutil.log('extracted registry:');
            gutil.log(this.registry);
        }

        for(var i = 0, l = this.locales.length; i < l; i++){
            this.generateTranslation(this.locales[i]);
        }
    }

    /**
     * Extract translations from the Aurelia app.
     *
     * @returns {Promise}
     */
    extractFromApp(){
        return this.extractor.getNavFromRoutes(this.routesModuleId)
         .then(navRoutes=>{
             if(!navRoutes) return null;

             for(var i = 0, l = navRoutes.length; i < l; i++){
                 var item = navRoutes[i];
                 this.values[item.i18n] = item.title;
                 this.registry.push(this.defaultNamespace + this.keySeparator + item.i18n);
             }

             if(this.verbose){
                 gutil.log('navRoutes found:');
                 gutil.log(navRoutes)
             }

             return null;
         });
    }

    /**
     * Takes a `target` hash and replace its empty
     * values with the `source` hash ones if they exist
     *
     * @param source
     * @param target
     * @param transform
     * @param nodesHash
     * @param valuesHash
     * @returns {*|{}}
     */
    getValuesFromHash(source, target,transform,nodesHash,valuesHash){
        target = target || {};

        Object.keys(source).forEach((key)=>{

            var node = null;
            if(nodesHash) node = nodesHash[key];
            var value;

            if(target[key] !== undefined){
                if(typeof source[key] === 'object'){
                    target[key] = this.getValuesFromHash(source[key], target[key], transform, node,(valuesHash)? valuesHash[key] : valuesHash);
                }else if(target[key] === ''){
                    if(!node) {
                        //try to find in values
                        if(valuesHash)value = valuesHash[key];
                        if(transform === "uppercase") value = transformText(value);
                    }else{
                        value = source[key];
                        if(transform === "uppercase" && node[0].nodeName !== "IMG") value = transformText(value);
                    }
                    target[key] = value;
                }
            }
        });

        return target;
    }

    /**
     * Get the file extension from a filepath.
     *
     * @param path        path to analyze
     * @returns {string}  the extracted file extension
     */
    getExtension(path){
        return path.substr(path.lastIndexOf(".") + 1);
    }

    /**
     * Update hashes.
     */
    updateHashes(){

        this.translationsHash = {};
        this.valuesHash = {};
        this.nodesHash = {};

        var key;

        // remove duplicate keys
        this.translations = _.uniq(this.translations).sort();

        //create hash for values
        for(key in this.values){
            if(!this.values.hasOwnProperty(key)) continue;
            this.valuesHash = hashFromString(key, this.values[key], this.keySeparator, this.valuesHash);
        }
        //create hash for nodes
        for(key in this.nodes){
            if(!this.nodes.hasOwnProperty(key)) continue;
            this.nodesHash = hashFromString(key, this.nodes[key], this.keySeparator, this.nodesHash);
        }
    }

    //--------- Steam functions

    transformFile(file, encoding, cb) {

        var data,path;

        // we do not handle streams
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }

        //read the file manually if a filepath was passed.
        if(file.isNull()){
            path = file.path;
            if(file.stat.isDirectory()){
                return cb();
            }else if(path && fs.existsSync(path)){
                data = fs.readFileSync(path);
            }else{
                this.emit("error", new PluginError(PLUGIN_NAME, "File has no content and is not readable"));
                return cb();
            }
        }

        if (file.isBuffer()) {
            path = file.path.replace(process.cwd()+"/","");
            data = file.contents.toString();
        }

        //skip if no data was found
        if(!data) return cb();

        data = this.parseTranslations(path,data).then(keys=>{
            this.addToRegistry(keys);
            // tell the stream engine that we are done with this file
            cb();
        });

        // make sure the file goes through the next gulp plugin
        //this.push(file);
    }

    flush(cb){
        //extract values from the aurelia application where possible
        if(this.extractor){
            this.extractFromApp().then(()=>{
                this.generateAllTranslations();
                cb();
            });
        }else{
            this.generateAllTranslations();
            cb();
        }
    }
}

/**
 * The main plugin function
 *
 * @param opts
 * @returns {Stream}
 */
export function parse(opts) {
    return new Parser(opts).parse();
}
