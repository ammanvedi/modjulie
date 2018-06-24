# Modjulie
Modjulie is a server for building a library dynamically where required parts are added in the path and query string params of a http request. 

It is heavily inspired by the work done by the financial times [polyfill io service](https://polyfill.io/v2/docs/)

## Install
```
npm i modjulie --save
```

## Usage

### Quickstart
In order to get something serving you can use the example folder structure that has been set up and familiarise yourself with where everything goes before customising.

First create a symlink in your project directory to the example server folders

```
ln -s node_modules/modjulie/example/ ./example
```
create your server file

```
//index.js

const Modjulie = require( 'modjulie' );
const server = new Modjulie();
server.serve();

```

then run ```node index.js``` and you can access ```http://localhost:3000/v1/default?modules=moduleC``` to see the generated output

you can also take a look at ```example.index.html``` for how it is called from a script url in a page

### Customisation
Modjulie defines a folderstructure as follows

#### Structure

```
versionsDirectory
├── v1
│   ├── headers (defaultHeaderSources)
│   │   ├── loader.json
│   │   └── namespace.js
│   ├── modules (moduleSourcesDirectory)
│   │   ├── moduleA
│   │   │   └── module.js
│   │   ├── moduleB
│   │   │   └── module.js
│   │   └── moduleC
│   │       └── module.js
│   └── presets (presetConfigurationDirectory)
│       └── default.json

```

##### Headers
This directory contains files that are added to the library regardless of other config at all times, use this to set up namespaces or do other base configuration

##### Modules
The modules directory contains folders with a module name and a module.js file within that contains the module code

##### Presets
presets define sets of modules that can be aliased to a name 

these folders relate to the url structure as follows

```
/:version/:preset?modules=moduleA
```
where version is mandatory but the preset is optional

for example

```
/v1/default?modules=moduleA
```
#### Configs
The preset (presetConfigurationDirectory) json files each define a json array of module names that should be included as part of the package when the preset is used, for example;

```
[ "moduleA", "moduleB" ]
```

The headers (defaultHeaderSources) loader.json file works in a similar way but allows you to define the load order of your headers

```
[ "namespace.js", "init.js" ]
```