import Vue from 'vue';

export default class PwaEventBusInfrastructure {
	#transporter;

	constructor() {
		this.#transporter = new Vue();
	}

	subscribe({ events }) {
		events.forEach((event) => {
			this.#transporter.$on(event.name, async (receivedEvent) => {
				if (event.handlers) {
					const promises = [];
					event.handlers.forEach((h) => {
						promises.push(h());
					});
					await Promise.all(promises);
				} else if (event.handler) {
					await event.handler(receivedEvent);
				} else {
					throw new Error(`${event.name} handler undefined`);
				}
			});
		});
	}

	unsubscribe({ events }) {
		events.forEach((event) => {
			this.#transporter.$off(event);
		});
	}

	publish({ name, payload }) {
		this.#transporter.$emit(name, { name, payload });
	}
}
