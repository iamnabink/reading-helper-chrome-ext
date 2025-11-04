const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.js',
    background: './src/background.js',
    content: './src/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist-extension'),
    filename: '[name].js',
    clean: true
  },
  optimization: {
    minimize: true, // Enable minification for production
    usedExports: true,
    sideEffects: false
  },
  // mode will be set via --mode flag in package.json
  performance: {
    hints: false, // Disable performance hints for extension builds
    maxAssetSize: 5000000, // 5MB - increase limit for extension assets
    maxEntrypointSize: 5000000 // 5MB - increase limit for entry points
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { chrome: '88' } }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist-extension'),
    },
    compress: true,
    port: 3000,
    hot: true
  }
};

