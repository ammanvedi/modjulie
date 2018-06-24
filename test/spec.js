const assert = require( 'assert' );
const modjulie = require( '../index.js' );
const axios = require( 'axios' );
const fs = require( 'fs' );

const validateStatus = status => status < 400;

describe( 'modjulie', async function() {

    const server = new modjulie( {
        maxAge: 5
    } );
    const served = await server.serve();

    const header = fs.readFileSync( './example/library/v2/headers/namespace.js', 'utf-8' );
    const headerTwo = fs.readFileSync( './example/library/v2/headers/init.js', 'utf-8' );
    const module = fs.readFileSync( './example/library/v2/modules/moduleA/module.js', 'utf-8' );
    const moduleC = fs.readFileSync( './example/library/v2/modules/moduleC/module.js', 'utf-8' );

    describe( 'module server', function() {

        it( 'should be accessible on a given port', async function() {
            const result = await axios.get( 'http://localhost:3000/v1/default?modules=moduleA,moduleB', { validateStatus } );
            assert( result.status === 200 );
        } );

        it( 'should put header modules at the start of the library', async function() {
            const result = await axios.get( 'http://localhost:3000/v1/default?modules=moduleA,moduleB', { validateStatus } );
            assert( result.data.startsWith( header ) );
        } );

        it( 'should handle multiple header modules', async function() {
            const result = await axios.get( 'http://localhost:3000/v2/default?modules=moduleA,moduleB', { validateStatus } );
            assert( result.data.startsWith( [ header, headerTwo ].join( '\n' ) ) );
        } );

        it( 'should handle no default requests', async function() {
            const result = await axios.get( 'http://localhost:3000/v2?modules=moduleA', { validateStatus } );
            assert( result.data === [ header, headerTwo, module ].join( '\n' ) );
        } );

        it( 'should handle duplication of query params', async function() {
            const result = await axios.get( 'http://localhost:3000/v2/default?modules=moduleC', { validateStatus } );
            assert( result.data === [ header, headerTwo, moduleC ].join( '\n' ) );
        } );

        it( 'should handle duplication of modules between query params and default sets', async function() {
            const result = await axios.get( 'http://localhost:3000/v2/default?modules=moduleC', { validateStatus } );
            assert( result.data === [ header, headerTwo, moduleC ].join( '\n' ) );
        } );

        it( 'should fail gracefully if a module is not found', async function() {
            try {
                const result = await axios.get( 'http://localhost:3000/v2/default?modules=moduleX', { validateStatus } );
                assert( false );
            } catch ( error ) {
                assert( true );
            }
        } );

        it( 'should cache requests', async function() {
            const result = await axios.get( 'http://localhost:3000/v2/cachetest', { validateStatus } );
            const resultCached = await axios.get( 'http://localhost:3000/v2/cachetest', { validateStatus } );
            assert( result.status === 200 );
            assert( result.headers[ 'x-module-from-cache' ] === 'false' );
            assert( resultCached.status === 200 );
            assert( resultCached.headers[ 'x-module-from-cache' ] === 'true' );
        } );

        after( function() {
            server.stop();
        } );

    } );

    run();


} );
