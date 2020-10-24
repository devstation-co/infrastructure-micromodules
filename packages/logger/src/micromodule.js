import winston from 'winston';

export default class LoggerInfrastructureMicromodule {
	constructor({ env, source }) {
		if (!source) throw new Error('Source undefined');
		this.env = env;
		this.logger = this.#initWinston({ env, source });
	}

	#initWinston = ({ source, env }) => {
		const consoleFormatter = this.#consoleFormatter({ mainSource: source });
		const transports = [];
		if (env === 'dev') {
			transports.push(
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.timestamp(),
						consoleFormatter,
						winston.format.colorize(),
					),
				}),
			);
		} else {
			transports.push(
				new winston.transports.File({
					filename: '.log',
					format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
				}),
			);
		}
		winston.addColors({
			debug: 'yellow',
			info: 'blue',
			error: 'red',
			warn: 'cyan',
			success: 'green',
		});
		const logger = winston.createLogger({
			defaultMeta: {
				source,
			},
			levels: {
				error: 0,
				warning: 1,
				info: 2,
				success: 2,
				debug: 2,
			},
			transports,
		});
		return logger;
	};

	#consoleFormatter = ({ mainSource }) => {
		const formatter = winston.format.printf(({ level, message, source }) => {
			const colors = {
				yellow: '\u001b[33m',
				red: ' \u001b[31m',
				green: '\u001b[32m',
				cyan: '\u001b[36;1m',
				blue: '\u001b[34m',
			};
			let color = colors.yellow;
			switch (level) {
				case 'debug':
					color = colors.cyan;
					break;
				case 'error':
					color = colors.red;
					break;
				case 'info':
					color = colors.blue;
					break;
				case 'warning':
					color = colors.yellow;
					break;
				case 'success':
					color = colors.green;
					break;
				default:
					break;
			}
			let messageToshow = message;
			if (source?.service)
				messageToshow = `${message} | Service: ${source.service} | Module: ${source.module} | Layer type: ${source.layer.type} | Layer Name: ${source.layer.name} | Method name: ${source.method.name} | Method type: ${source.method.type}`;

			const output = `\u001b[30;1m${new Date()
				.toUTCString()
				.substring(17, 25)} [ ${mainSource} ]\u001b[0m ${color} ${messageToshow}\u001b[0m`;

			return output;
		});
		return formatter;
	};

	error({ message, source = {} }) {
		const toLog = { level: 'error', message, source };
		return this.logger.log(toLog);
	}

	info({ message, source = {} }) {
		const toLog = { level: 'info', message, source };
		return this.logger.log(toLog);
	}

	warn({ message, source = {} }) {
		const toLog = { level: 'warning', message, source };
		return this.logger.log(toLog);
	}

	debug(toDebug) {
		return this.logger.debug(toDebug);
	}

	success({ message, source = {} }) {
		const toLog = { level: 'success', message, source };
		return this.logger.log(toLog);
	}
}
