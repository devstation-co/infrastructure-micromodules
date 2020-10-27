import FastestValidator from 'fastest-validator';

export default class Validator {
	constructor() {
		this.validator = new FastestValidator();
	}

	async validate({ data, schema }) {
		const validationResults = this.validator.validate(data, schema);
		if (validationResults !== true) {
			const error = new Error(JSON.stringify(validationResults));
			error.name = 'VALIDATION_ERROR';
			throw error;
		}
		return true;
	}
}
