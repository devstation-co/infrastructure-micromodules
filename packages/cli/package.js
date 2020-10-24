/* eslint-disable global-require */
if (process.env.NODE_ENV === 'PROD') {
	module.exports = require('./dist/micromodule.js');
} else {
	module.exports = require('./src/micromodule.js');
}
