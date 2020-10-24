import natsDep from 'nats';

export default class EventBusInfrastructureMicromodule {
	#nc;

	#password;

	#logger;

	constructor({ nats, dependencies }) {
		if (dependencies && dependencies.logger) {
			this.#logger = dependencies.logger;
		}
		this.host = nats.host;
		this.username = nats.username;
		this.#password = nats.password;
		this.port = nats.port;
	}

	init() {
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
						message: 'Event-bus connected to nats server',
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
						message: 'Event-bus Disconnected from nats server',
					});
			});
		});
	}

	subscribeToEvents = ({ events, namespace }) => {
		events.forEach((event) => {
			this.#subscribe({ type: event.type, handler: event.handler, namespace });
		});
		return true;
	};

	#subscribe = ({ type, handler, namespace }) => {
		this.#nc.subscribe(type, { queue: namespace }, async (event) => {
			await handler({ event });
		});
	};

	publish(event) {
		this.#nc.publish(event.type, event);
		return true;
	}
}
