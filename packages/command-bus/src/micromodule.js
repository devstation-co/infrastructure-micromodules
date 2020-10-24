import natsDep from 'nats';
import CircuitBreaker from 'opossum';

export default class CommandBusInfrastructureMicromodule {
	#nc;

	#password;

	#logger;

	constructor({ nats, dependencies }) {
		if (dependencies && dependencies.logger) {
			this.#logger = dependencies.logger;
		}
		this.host = nats.host;
		this.port = nats.port;
		this.username = nats.username;
		this.#password = nats.password;
	}

	async init() {
		return new Promise((resolve) => {
			this.#nc = natsDep.connect({
				url: `nats://${this.host}:${this.port}`,
				user: this.username,
				pass: this.#password,
				json: true,
				maxReconnectAttempts: -1,
				reconnectTimeWait: 3000,
				timeout: 5000,
				waitOnFirstConnect: true,
				pingInterval: 5000,
			});
			this.#nc.on('connect', () => {
				if (this.#logger)
					this.#logger.success({
						message: 'Command-bus connected to nats server',
					});
				resolve();
			});
			this.#nc.on('error', (err) => {
				if (this.#logger)
					this.#logger.error({
						message: `Error occured in command-bus nats server: ${err.message}`,
					});
			});
			this.#nc.on('disconnect', () => {
				if (this.#logger)
					this.#logger.info({
						message: 'Command-bus disconnected from nats server',
					});
			});
		});
	}

	subscribeToCommands = ({ commands, namespace }) => {
		commands.forEach((command) => {
			const { handler, name } = command;
			this.#subscribe({
				namespace,
				commandName: `${namespace}.${name}`,
				commandHandler: handler,
			});
		});
		return true;
	};

	#subscribe = ({ namespace, commandName, commandHandler }) => {
		this.#nc.subscribe(
			commandName,
			{ queue: namespace },
			async (receivedCommand, commandSenderName) => {
				try {
					const options = {
						timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
					};
					const breaker = new CircuitBreaker(commandHandler, options);
					const handlerResponse = await breaker.fire(receivedCommand);
					if (
						handlerResponse instanceof Error ||
						(handlerResponse?.stack && handlerResponse?.message)
					) {
						const error = {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'websocket-server',
								reasons:
									handlerResponse.name === 'VALIDATION_ERROR'
										? JSON.parse(handlerResponse.message)
										: [handlerResponse.message],
							},
						};
						this.#nc.publish(commandSenderName, error);
						return true;
					}
					this.#nc.publish(commandSenderName, handlerResponse);
					return true;
				} catch (error) {
					this.#nc.publish(commandSenderName, {
						status: 'error',
						timestamp: new Date(),
						payload: {
							source: 'command-bus',
							reasons: error.name === 'VALIDATION_ERROR' ? error.message : [error.message],
						},
					});
					return true;
				}
			},
		);
	};

	handle({ name, handler, params }) {
		return new Promise((resolve) => {
			this.#nc.request(`${handler}.${name}`, { name, params }, (msg) => {
				if (msg instanceof natsDep.NatsError && msg.code === natsDep.REQ_TIMEOUT) {
					throw new Error('Request timed out');
				} else {
					resolve(msg);
				}
			});
		});
	}
}
