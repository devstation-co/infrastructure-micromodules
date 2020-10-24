module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	ignorePatterns: ['**/dist/*.js'],
	plugins: ['security'],
	extends: ['airbnb-base', 'prettier', 'plugin:security/recommended'],
	parser: '@babel/eslint-parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
		babelOptions: {
			configFile: `${__dirname}/babel.config.js`,
		},
	},
	rules: {
		'no-underscore-dangle': ['error', { allow: ['_id'] }],
	},
};
