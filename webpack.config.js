'use-strict'
const webpack = require('webpack');
/**
 * webpack-������
 */
module.exports = {
    output: {
        path: require("path").resolve("./sources/js"),
        filename: 'core.js'
    },
    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false
            }
        })
    ]
};