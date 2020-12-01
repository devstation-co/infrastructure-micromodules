import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

export default class Queuer {
	#redisConnection;

	#workers = {};

	#queues = {};

	#queueNames;

	#validator;

	#tasks = {};

	constructor({ redis, queues, dependencies }) {
		if (!redis) throw new Error('RedisSettingsUndefined');
		if (!dependencies.validator) throw new Error('ValidatorUndefined');
		this.#validator = dependencies.validator;
		this.#queueNames = queues;
		this.#redisConnection = new Redis(redis);
	}

	createWorker({ name, tasks }) {
		this.#workers[`${name}`] = new Worker(
			name,
			async (job) => {
				await this.#validator.validate({ data: job.data, schema: tasks[`${job.name}`].params });
				await tasks[`${job.name}`].controller({ params: job.data });
			},
			{
				connection: this.#redisConnection,
			},
		);
	}

	createQueue({ name }) {
		this.#queues[`${name}`] = new Queue(name, {
			connection: this.#redisConnection,
		});
	}

	getQueue({ name }) {
		return this.#queues[`${name}`];
	}

	async init() {
		if (Array.isArray(this.#queueNames))
			this.#queueNames.forEach((name) => {
				this.createQueue({ name });
			});
	}
}
