/* eslint-disable global-require */
export default class IdGeneratorInfrastructureMicromodule {
	#generate;

	constructor({ type }) {
		if (type === 'uuid') {
			this.#generate = require('uuid').v4;
		} else {
			this.#generate = require('bson-objectid');
		}
	}

	generate() {
		return this.#generate();
	}
}
