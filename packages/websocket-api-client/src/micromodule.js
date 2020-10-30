import socketIoClient from 'socket.io-client';
import IdGenerator from '@devstation.co/id-generator.infrastructure.micromodule';

export default class WebsocketClient {
	#socket;

	#idGenerator;

	constructor({ url }) {
		this.url = url;
		this.#idGenerator = new IdGenerator({ type: 'uuid' });
	}

	async init() {
		this.#socket = socketIoClient(this.url);
		this.#socket.on('error', (error) => {
			// eslint-disable-next-line no-console
			console.log('ERROR: ', error);
		});
		return true;
	}

	onConnect({ handler, handlers }) {
		this.#socket.on('connect', async () => {
			if (handlers) {
				const promises = [];
				handlers.forEach((h) => {
					promises.push(h());
				});
				await Promise.all(promises);
			} else {
				await handler();
			}
			return true;
		});
		return true;
	}

	onDisconnect({ handler, handlers }) {
		this.#socket.on('disconnect', async () => {
			if (handlers) {
				const promises = [];
				handlers.forEach((h) => {
					promises.push(h());
				});
				await Promise.all(promises);
			} else {
				await handler();
			}
			return true;
		});
		return true;
	}

	isConnected() {
		return this.#socket.connected;
	}

	connect() {
		this.#socket.connect();
	}

	disconnect() {
		this.#socket.disconnect();
	}

	unsubscribe({ events }) {
		events.forEach((event) => {
			this.#socket.removeAllListeners(event);
		});
	}

	subscribe({ events }) {
		events.forEach((event) => {
			if (typeof event.handler !== 'function')
				throw new Error(`${event.type} event handler is not a function`);
			this.#socket.on(event.type, async (receivedEvent) => {
				if (event.handlers) {
					const promises = [];
					event.handlers.forEach((handler) => {
						promises.push(
							handler({
								params: {
									event: receivedEvent,
								},
							}),
						);
					});
					await Promise.all(promises);
				} else if (event.handler) {
					await event.handler({
						params: {
							event: receivedEvent,
						},
					});
				} else {
					throw new Error(`${event.type} handler undefined`);
				}
				return true;
			});
		});
	}

	handle({ name, token, handler, params }) {
		return new Promise((resolve) => {
			const requestParams = params;
			requestParams.idempotencyKey = this.#idGenerator.generate({ type: 'uuid' });
			const requestToSend = {
				name,
				params: requestParams,
			};
			if (token) {
				requestToSend.token = token;
			}
			this.#socket.emit(`${handler}.${name}`, requestToSend, async (data) => {
				await resolve(data);
			});
		});
	}

	publish({ type, payload }) {
		this.#socket.emit(type, payload);
	}
}
