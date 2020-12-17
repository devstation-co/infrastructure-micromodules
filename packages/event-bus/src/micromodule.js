/* eslint-disable no-await-in-loop */
import { Kafka } from 'kafkajs';

export default class EventBusInfrastructureMicromodule {
	#producer;

	#consumer;

	#logger;

	#validator;

	constructor({ kafka, dependencies }) {
		if (!dependencies) throw new Error('DependenciesUndefined');
		if (!dependencies.validator) throw new Error('ValidatorUndefined');
		if (!kafka) throw new Error('KafkaSettingsUndefined');
		if (dependencies.logger) this.#logger = dependencies.logger;
		this.#validator = dependencies.validator;
		this.brokers = kafka.brokers;
		this.clientId = kafka.clientId;
	}

	async init() {
		const kafka = new Kafka({
			clientId: this.clientId,
			brokers: this.brokers,
		});
		this.#producer = kafka.producer();
		this.#consumer = kafka.consumer({ groupId: this.clientId });
		await this.#producer.connect();
		await this.#consumer.connect();
		return true;
	}

	subscribeToEvents = async ({ events }) => {
		const topics = [];
		events.forEach((event) => {
			if (topics.indexOf(event.aggregate) === -1) topics.push(event.aggregate);
		});
		for (let index = 0; index < topics.length; index += 1) {
			const topic = topics[`${index}`];
			await this.#consumer.subscribe({ topic, fromBeginning: true });
		}
		const eventsMap = new Map();
		events.forEach((event) => {
			eventsMap.set(event.type, event);
		});
		await this.#consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				const receivedEvent = JSON.parse(message.value.toString());
				if (eventsMap.has(receivedEvent.type)) {
					const event = eventsMap.get(receivedEvent.type);
					if (event.payload) {
						const payloadSchema = event.payload;
						if (!payloadSchema.$$strict) payloadSchema.$$strict = 'remove';
						await this.#validator.validate({
							data: receivedEvent.payload,
							schema: payloadSchema,
						});
					}
					if (event.meta) {
						const metaSchema = event.meta;
						if (!metaSchema.$$strict) metaSchema.$$strict = 'remove';
						await this.#validator.validate({ data: receivedEvent.meta, schema: metaSchema });
					}
					await event.handler({ event: receivedEvent, topic, partition });
				}
			},
		});
		return true;
	};

	async publish({ event }) {
		await this.#producer.send({
			topic: event.aggregate.type,
			messages: [
				{
					key: event.aggregate.id,
					value: JSON.stringify(event),
				},
			],
		});
		return true;
	}
}
