module.exports = function babelConfig(api) {
	api.cache(true);
	return {
		presets: [
			[
				'@babel/preset-env',
				{
					targets: {
						esmodules: true,
					},
				},
			],
		],
		exclude: /node_modules/,
		plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-private-methods'],
	};
};
