const gulp = require( 'gulp' );
const watch = require( 'gulp-watch' );
const mocha = require( 'gulp-mocha' );

gulp.task( 'watch', () => {
    return watch( [ './lib/*.js', './test/spec.js' ], () => {

        gulp.src( './test/spec.js' )
            .pipe( mocha( {
                delay: 'delay'
            } ) );
    } );
} );
