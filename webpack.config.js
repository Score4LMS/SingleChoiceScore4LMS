var path = require('path');
var nodeEnv = process.env.NODE_ENV || 'development';
var isDev = (nodeEnv !== 'production');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackBundleAnalyzer = require('webpack-bundle-analyzer')

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
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
          },
          "sass-loader"
        ]
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
  }
  ,
  plugins: [
    new MiniCssExtractPlugin({
    filename: "h5p-single-choice-set.css"
      }),
      new WebpackBundleAnalyzer.BundleAnalyzerPlugin()
    ]
};

if(isDev) {
  config.devtool = 'inline-source-map';
}

module.exports = config;
