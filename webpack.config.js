var path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

var config = {
  entry: {
    dist: './src/entries/dist.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'h5p-single-choice-set.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, 
        {
          loader: 'css-loader', // translates CSS into CommonJS modules
        },  
        {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        include: path.join(__dirname, 'src/fonts'),
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  },
  plugins: [new MiniCssExtractPlugin({
    filename: "h5p-single-choice-set.css"
  })
]
};

if(isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
