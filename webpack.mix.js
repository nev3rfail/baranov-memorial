const mix = require('laravel-mix');

mix.js('res/main.js', 'dist')
    .sass('res/main.scss', 'dist')
    .options({
        postCss: [
            require('postcss-fixes')(),
            require('autoprefixer')(),
            require('cssnano')({
                'safe': true,
                'calc': false
            })
        ]
    });
