export default class EventStore {
	#commandBus;

	#token;

	constructor({ token, dependencies }) {
		if (!dependencies) throw new Error('Dependencies undefined');
		if (!dependencies.commandBus) throw new Error('Dependencies undefined');
		if (!token) throw new Error('Token undefined');
		this.#commandBus = dependencies.commandBus;
		this.#token = token;
	}

	async commit({ event }) {
		const res = await this.#commandBus.handle({
			name: 'commitEvent',
			handler: 'eventstore.commands',
			params: {
				event,
				token: this.#token,
			},
		});
		if (res.status !== 'success') throw new Error('Error in eventstore');
	}

	async getEventsByAggregateId({ aggregateId }) {
		const res = await this.#commandBus.handle({
			name: 'getEventsByAggregateId',
			handler: 'eventstore.queries',
			params: {
				aggregateId,
				token: this.#token,
			},
		});
		if (res.status !== 'success') throw new Error('Error in eventstore');
		return res.payload;
	}

	async getAllEvents() {
		const res = await this.#commandBus.handle({
			name: 'getAllEvents',
			handler: 'eventstore.queries',
			params: {
				token: this.#token,
			},
		});
		if (res.status !== 'success') throw new Error('Error in eventstore');
		return res.payload;
	}
}
