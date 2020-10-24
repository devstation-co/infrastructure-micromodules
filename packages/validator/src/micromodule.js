import V from 'fastest-validator';

export default class Validator {
	constructor() {
		this.validator = new V();
	}

	async validate({ toValidate, schema }) {
		const validationResults = this.validator.validate(toValidate, schema);
		if (validationResults !== true) {
			const error = new Error(JSON.stringify(validationResults));
			error.name = 'VALIDATION_ERROR';
			throw error;
		}
		return true;
	}
}
