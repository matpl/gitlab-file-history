const path = require('path');

module.exports = {
	mode: 'development',
	entry: {
		app: './index.ts'
	},
	output: {
		globalObject: 'self',
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
        publicPath: ''
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			},
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            }
		]
	}
};