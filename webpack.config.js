const { CheckerPlugin } = require("awesome-typescript-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { optimize } = require("webpack");
const { join } = require("path");
const Dotenv = require('dotenv-webpack');
const prodPlugins = [];



if (process.env.NODE_ENV === "production") {
  prodPlugins.push(
    new optimize.AggressiveMergingPlugin(),
    new optimize.OccurrenceOrderPlugin()
  );
}
module.exports = {
  mode: process.env.NODE_ENV,
  node: {
    fs: "empty"
  },
  devtool: "inline-source-map",
  entry: {
    main: join(__dirname, "src/index.ts"),
    background: join(__dirname, "src/background.ts"),
  },
  output: {
    path: join(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts?$/,
        use: 'awesome-typescript-loader?{configFileName: "tsconfig.json"}'
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  },
  plugins: [
    new Dotenv(),
    new CheckerPlugin(),
    ...prodPlugins,
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
  resolve: {
    extensions: [".ts", ".js"]
  }
};
