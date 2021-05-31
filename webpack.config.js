var path = require("path")
var webpack = require("webpack")

var cssResources = [
  "src/stylesheets/resources.scss"
];

module.exports = {
  entry: {
    app: ["babel-polyfill","./src/main.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    publicPath: "/dist/",
    filename: "build.js"
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          loaders: {
            "scss": ["css-loader","sass-loader",{
              loader: "sass-resources-loader",
              options: {
                resources: cssResources
              }
            }]
          }
        }
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg|woff|ttf|eot|woff2)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]?[hash]"
        }
      },
      {
        test: /\.(scss|css)$/,
        use: ["style-loader","css-loader","sass-loader",{
          loader: "sass-resources-loader",
          options: {
            resources: cssResources
          }
        }]
      }
    ]
  },
    plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    })
  ],
  resolve: {
    alias: {
      "vue$": "vue/dist/vue.esm.js"
    }
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  performance: {
    hints: false
  },
  devtool: "#eval-source-map"
}

if (process.env.NODE_ENV === "production") {
  module.exports.devtool = "#source-map"
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
