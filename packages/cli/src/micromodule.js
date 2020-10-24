/* eslint-disable no-console */
import { program } from 'commander';

export default class CLI {
	#cli;

	constructor({ name, version }) {
		if (!name) throw new Error('Cli name undefined');
		if (!version) throw new Error('Cli version undefined');
		this.name = name;
		this.version = version;
		this.#cli = program.name(name).version(version);
	}

	registerCommands = (commands) => {
		commands.forEach((c) => {
			const command = this.#cli
				.command(c.name)
				.description(c.description)
				.storeOptionsAsProperties(false)
				.action(async (cmd) => {
					// eslint-disable-next-line no-underscore-dangle
					await c.controller({ cmd, options: cmd._optionValues });
					return process.exit();
				});
			c.args.forEach((arg) => {
				const option = `-${arg.alias}, --${arg.name}`;
				command.option(option, arg.description, arg.default);
			});
		});
	};

	#registerDefaultCommands = () => {
		const { version } = this;
		this.#cli
			.command('version')
			.description('Print the cli current version')
			.action(() => {
				console.log(version);
				return true;
			});
	};

	init() {
		this.#registerDefaultCommands();
	}

	run() {
		return this.#cli.parse(process.argv);
	}
}
