export default class Database {
	#db;

	#dbSettings;

	#seed;

	#logger;

	constructor({ type, seed, dependencies }) {
		if (!dependencies[`${type}`]) throw new Error('DB undefined');
		if (dependencies.logger) {
			this.#logger = dependencies.logger;
		}
		this.#db = dependencies[`${type}`];
		this.#seed = seed;
	}

	async init() {
		await this.#db.init();
		if (this.#seed?.collection) await this.#seedDb();
		return true;
	}

	#seedDb = async () => {
		const count = await this.count({ collectionName: this.#seed.collection, filter: {} });
		if (count === 0) {
			await this.insertMany({
				collectionName: this.#seed.collection,
				entities: this.#seed.entities,
			});
			if (this.#logger) this.#logger.info({ message: 'Collection seeded' });
			return true;
		}
		if (this.#logger) this.#logger.info({ message: 'Database not empty, collection not seeded.' });
		return true;
	};

	count = async ({ collectionName, filter }) => {
		const res = await this.#db.count({ collectionName, filter });
		return res;
	};

	getState({ collectionName }) {
		return this.#db.getState({ collectionName });
	}

	async insertMany({ collectionName, entities }) {
		if (!entities || entities.length === 0) throw new Error('Entities undefined');
		const res = await this.#db.insertMany({ collectionName, entities });
		return res;
	}

	async insertOne({ collectionName, entity }) {
		if (!entity) throw new Error('Entity undefined');
		const res = await this.#db.insertOne({ collectionName, entity });
		return res;
	}

	async find({ collectionName, filter = {} }) {
		const res = await this.#db.find({ collectionName, filter });
		return res;
	}

	async findOne({ collectionName, filter }) {
		const res = await this.#db.findOne({ collectionName, filter });
		return res;
	}

	async findById({ collectionName, id }) {
		if (!id) throw new Error('Id undefined');
		const res = await this.#db.findOne({ collectionName, filter: { id } });
		return res;
	}

	async updateOne({ collectionName, filter, update }) {
		if (!update) throw new Error('Update statement undefined');
		const res = await this.#db.updateOne({ collectionName, filter, update });
		return res;
	}

	async updateMany({ collectionName, filter, update }) {
		if (!update) throw new Error('Update statement undefined');
		const res = await this.#db.update({ collectionName, filter, update });
		return res;
	}

	async deleteById({ collectionName, id }) {
		if (!id) throw new Error('Id undefined');
		const res = await this.#db.deleteById({ collectionName, id });
		return res;
	}

	async deleteMany({ collectionName, filter }) {
		const res = await this.#db.deleteMany({ collectionName, filter });
		return res;
	}

	async deleteOne({ collectionName, filter }) {
		const res = await this.#db.deleteOne({ collectionName, filter });
		return res;
	}
}
