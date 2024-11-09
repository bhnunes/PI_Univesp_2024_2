const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Install this: npm install html-webpack-plugin 

module.exports = {
  entry: './static/script.js', // Your main JavaScript file
  output: {
    filename: 'bundle.js', // Output bundled file name
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Match JavaScript files
        exclude: /node_modules/, // Exclude node_modules
        use: {
          loader: 'babel-loader', // Use Babel for transpilation
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html', // Your HTML template
      filename: 'index.html', // Output HTML file name
    }),
  ],
};