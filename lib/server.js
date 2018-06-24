const express = require( 'express' );
const logger = require( 'signale' );
const Builder = require( './builder.js' );

/**
 * Main library configuration format
 * @typedef {Object} LibraryConfiguration
 * @property {BuilderConfiguration} BuilderConfiguration
 * @property {integer} [port=3000]
 */

const DEFAULT_CONFIG = {
    builderConfiguration: {
        versionsDirectory: './example/library',
        moduleSourcesDirectory: 'modules',
        defaultHeaderSources: 'headers',
        presetConfigurationDirectory: 'presets'
    },
    port: 3000,
    maxAge: ( 60 * 60 ) * 24 // one day
};

const MODULE_SPLIT_CHAR = ',';

/**
 * Server to expose a http endpoint to
 * @class
 */
class Server {

    constructor( libraryConfig ) {

        this.config = { ...DEFAULT_CONFIG, ...libraryConfig };
        this.server = express();
        this.builder = new Builder( this.config.builderConfiguration );

        this.server.get( '/:version/:defaultFeatures?', ( request, response ) => {
            const { version, defaultFeatures } = request.params;
            const { modules } = request.query;
            const moduleArray = modules ? modules.split( MODULE_SPLIT_CHAR ) : [];
            this.builder.build( version, defaultFeatures, moduleArray )
                .then( module => {
                    response.status( 200 );
                    response.set( 'x-module-from-cache', module.cached.toString() );
                    response.set( 'cache-control', `public, max-age=${ this.config.maxAge }` )
                    response.set( 'content-type', 'text/javascript' );
                    response.send( module.source );
                } )
                .catch( error => {
                    response.status( 500 );
                    response.send( { error } );
                } );
        } );
    }

    serve() {

        return new Promise( ( resolve, reject ) => {
            this.http = this.server.listen( this.config.port, () => {
                resolve();
            } )
        } )
    }

    stop() {
        this.http.close();
    }
}


module.exports = Server;
