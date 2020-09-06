const mix = require('laravel-mix')

mix.js('res/main.js', 'dist')
  .sass('res/main.scss', 'dist')
  .options({
    cssNano: {
      preset: 'advanced',
      discardComments: true,
      safe: true,
      calc: false
    },
    postCss: [
      require('postcss-preset-env')({ stage: 4 }),
      require('postcss-flexbugs-fixes'),
      require('postcss-fixes')({
        preset: 'enable-all'
      }),
      require('autoprefixer')(),
      require('css-mqpacker')()
    ],
    processCssUrls: false
  })
