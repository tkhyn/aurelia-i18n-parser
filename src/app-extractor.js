import System from "systemjs";

import "babel/polyfill";
import * as path from "path";
import corejs from "core-js";


var Promise = corejs.Promise;

export class AppExtractor {

    /**
     * Configure systemjs to work with the local application
     */
    constructor(rootArray) {

        this.path = path.dirname(rootArray);

        [this.module, this.array] = path.basename(rootArray).split('.');
    }

    /**
     * Gets the routes from a module.
     * The module should export the routes array as a variable.
     *
     * @returns {Promise}
     */
    getNavFromRoutes(){

        //prepare for use in windows
        System.config({
            "baseURL": "./",
            "transpiler": 'babel',
            "babelOptions": {
                "stage": 0
            },
            "paths":{
                "*": this.path + "/*.js"
            }
        });

        //get routes from the aurelia application
        return new Promise((resolve, reject) => {
            return System.import(this.module).then(m=>{
                var navRoutes = [];
                for(var i = 0, l = m[this.array].length; i < l; i++){
                    var route = m[this.array][i];
                    if(route.nav) navRoutes.push(route);
                }
                resolve(navRoutes);
            });
        });



    }
}
