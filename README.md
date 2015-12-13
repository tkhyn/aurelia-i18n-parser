# aurelia-i18n-parser

Extracts i18n from html and js files.

Also tries to extract Aurelia specific values like the routes with a navigation.

## Installation

    npm install tkhyn/aurelia-i18n-parser
    
## Usage
    
    var gulp = require('gulp');
    var parse = require('aurelia-i18n-parser').parse;
    
    gulp.task('i18n', function() {
      gulp.src('src/**/*')
      .pipe(parse({
         appPath: 'src',
         routesModuleId: 'routes',    
         locales: ['en', 'fr'],       
         defaultLocale: 'en',
         functions:['t'],
         translationAttribute: 't',
       }))
      .pipe(gulp.dest('src/locales'));
    });
    
## Options and default values

- **verbose** `false`: enable verbose output
- **appPath** `null`: path to the aurelia application directory relative to the cwd
- **localesPath** `"src/locales"`: the path where the locale files must be stored
- **routesModuleId** `"routes"`: the module to extract routes from. This module should export the routes array
- **locales** `['en-US']`: translation files will be created for these locales
- **defaultLocale** `"en"`: the extracted default values will fill this locale's translation file
- **functions** `["t"]`: functions that are used in the JS code to translate values
- **functionsParamsExclude** `['key: string, options: any']`: if the functions above have these parameters, do not parse them (useful when you define overrides)
- **translationAttribute** `"data-i18n"`: html attribute used for translation keys
- **imageAttribute** `"data-src"`: html attribute for translated images locations
- **bindAttrs** `['bind', 'one-way', 'two-way', 'one-time']`: Aurelia's html bind attributes
- **shortcutFunction** `sprintf`: same use as in aurelia-i18n / i18next for default values
- **defaultNamespace** `'translation'`: the default namespace, should match aurelia-i18n / i18next's setting
- **namespaceSeparator** `":"`: the namespace separator, should match aurelia-i18n / i18next's setting
- **keySeparator** `"."`: the key separator, should match aurelia-i18n / i18next's setting


## Todo list

- log of added/changed keys
- option to generate hash keys (à la i18next-text):
  - texts in source code are translations for default language
  - i18next keys are hashes of source code texts
  - texts can be replaced by keys in compiled js
- translators comments
- discarded translations file for automatic translations
