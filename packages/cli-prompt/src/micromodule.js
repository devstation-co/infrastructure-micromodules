import inquirer from 'inquirer';

export default class CliPrompt {
	#prompter;

	constructor() {
		this.#prompter = inquirer.createPromptModule();
	}

	async prompt({ questions }) {
		const answers = await this.#prompter(questions);
		return answers;
	}
}
