const logger = require( 'signale' );
const fs = require( 'fs' );
const path = require( 'path' );
const Cache = require( './cache.js' );
const sha = require( 'js-sha256' );

const JOIN_CHAR = '\n';
const MODULE_NAME = 'module.js';
const CACHE_HASH = 'crc32';

/**
 * Main library configuration format
 * @typedef {Object} BuilderConfiguration
 * @property {string} [root='./example']
 * @property {string} [versionsDirectory='./library']
 * @property {string} [moduleSourcesDirectory='modules']
 * @property {string} [defaultHeaderSources=[ 'headers' ]]
 * @property {string} [presetConfigurationDirectory='presets']
 */

/**
 * Module builder that will handle the generation of libraries
 * @class
 */
class Builder {

    _getHeaders( base, version ) {

        // cache headers per version
        const cacheKey = base;
        const cached = this.cache.get( cacheKey );
        if( cached ) {
            return cached;
        }

        const headerPath = path.join( base, this.config.defaultHeaderSources, 'loader.json' );
        const headerSources = JSON.parse( fs.readFileSync( headerPath, 'utf-8' ) );
        const source = headerSources.map( headerPath => {
            return fs.readFileSync( path.join( base, this.config.defaultHeaderSources, headerPath ), 'utf-8' );
        } ).join( JOIN_CHAR );

        this.cache.set( cacheKey, source );

        return source;

    };

    _readPreset( base, preset ) {

        if ( !preset ) {
            return [];
        }

        const presetModules = fs.readFileSync( path.join( base, this.config.presetConfigurationDirectory, `${preset}.json` ), 'utf-8' );
        return JSON.parse( presetModules );
    }

    _getModules( base, preset, extraModules ) {

        // use a set to make sure there are no duplicate items
        const moduleList = new Set( [ ...this._readPreset( base, preset ), ...extraModules ] );
        const asArray = [ ...moduleList ];
        const modules = [];
        for ( let i = 0; i < asArray.length; i++ ) {
            const moduleName = asArray[ i ];
            const module = path.join( base, this.config.moduleSourcesDirectory, moduleName, MODULE_NAME );
            try {
                const moduleContents = fs.readFileSync( module, 'utf-8' );
                modules.push( moduleContents );
            } catch ( error ) {
                throw new Error( `Could not find module with name ${ moduleName }` );
            }
        }

        return modules.join( JOIN_CHAR );
    }

    /**
     * Create a builder with the given directories ready to spit out library code
     * @param  {BuilderConfiguration} builderConfiguration confgi provideing paths
     */
    constructor( builderConfiguration ) {

        this.config = builderConfiguration;
        this.cache = new Cache();
        this.hash = sha.create();
    }

    /**
     * [generateCacheKey description]
     * @param  {string} version the version foledr to look up
     * @param  {string} presetName the name of the set of preset functions to build
     * @param  {Array.<string>} modules the list of modules to include on top of the preset
     * @return {string} an alphanumeric cache key for a given library build
     */
    _generateCacheKey( version, presetName, modules ) {
        // make sure you sort the modules to make sure diff order of query params still generates same hash
        const libraryString = `${ version }${ presetName }${ modules.sort().toString() }`;
        this.hash.update( libraryString );
        return sha( libraryString );
    };

    /**
     * Build a library from scratch given a default and some extras or fetch one from the cache
     * @param  {string} [version='v1'] the version foledr to look up
     * @param  {string} [presetName=''] the name of the set of preset functions to build
     * @param  {Array.<string>} [modules=[]] the list of modules to include on top of the preset
     * @return {Promise} resolves with module string or rejects
     */
    build( version = 'v1', presetName = '', modules = [] ) {

        return new Promise( ( resolve, reject ) => {

            //console.log( this.cache.cache );

            const cacheKey = this._generateCacheKey( version, presetName, modules );
            const cachedModule = this.cache.get( cacheKey );
            if( cachedModule ) {
                resolve( {
                    cached: true,
                    source: cachedModule
                } );
            }

            const versionBase = path.join( this.config.versionsDirectory, version );
            const headers = this._getHeaders( versionBase, version );
            let moduleSource = '';
            try {
                moduleSource = this._getModules( versionBase, presetName, modules );
            } catch ( error ) {
                reject( error.toString() );
            }

            const source = [ headers, moduleSource ].join( JOIN_CHAR );
            this.cache.set( cacheKey, source );

            resolve( {
                source,
                cached: false
            } );
        } );
    };
};

module.exports = Builder;
