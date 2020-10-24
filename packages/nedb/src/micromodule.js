import Datastore from 'nedb-promises';

export default class NedbInfrastructure {
	#logger;

	constructor({ dbPath, dependencies }) {
		if (dependencies && dependencies.logger) {
			this.#logger = dependencies.logger;
		}
		if (dbPath) {
			this.dbPath = dbPath;
			this.db = new Datastore({ filename: `${dbPath}database.db` });
		} else {
			this.dbPath = 'memory';
			this.db = new Datastore();
		}
		this.collections = {};
	}

	async createCollection({ collectionName }) {
		this.collections[`${collectionName}`] = new Datastore({
			filename: `${this.dbPath}${collectionName}.db`,
		});
		await this.collections[`${collectionName}`].load();
		if (this.#logger) this.#logger.info({ message: `Collection created: ${collectionName}` });
	}

	async insertMany({ collectionName, entities }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_insertMany({
				db: this.collections[`${collectionName}`],
				data: entities,
			});
			return res;
		}
		const res = await this.#_insertMany({ db: this.db, data: entities });
		return res;
	}

	async insertOne({ collectionName, entity }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_insert({ db: this.collections[`${collectionName}`], data: entity });
			return res;
		}
		const res = await this.#_insert({ db: this.db, data: entity });
		return res;
	}

	async find({ collectionName, filter }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_find({ db: this.collections[`${collectionName}`], filter });
			return res;
		}
		const res = await this.#_find({ db: this.db, filter });
		return res;
	}

	async findOne({ collectionName, filter }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_findOne({ db: this.collections[`${collectionName}`], filter });
			return res;
		}
		const res = await this.#_findOne({ db: this.db, filter });
		return res;
	}

	async findById({ collectionName, id }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_findOne({
				db: this.collections[`${collectionName}`],
				filter: { _id: id },
			});
			return res;
		}
		const res = await this.#_findOne({ db: this.db, filter: { _id: id } });
		return res;
	}

	async count({ collectionName, filter }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_count({ db: this.collections[`${collectionName}`], filter });
			return res;
		}
		const res = await this.#_count({ db: this.db, filter });
		return res;
	}

	async update({ collectionName, filter, update }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_update({
				db: this.collections[`${collectionName}`],
				filter,
				update,
			});
			return res;
		}
		const res = await this.#_update({ db: this.db, filter, update });
		return res;
	}

	async delete({ collectionName, filter }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_delete({ db: this.collections[`${collectionName}`], filter });
			return res;
		}
		const res = await this.#_delete({ db: this.db, filter });
		return res;
	}

	async deleteMany({ collectionName, filter }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_deleteMany({ db: this.collections[`${collectionName}`], filter });
			return res;
		}
		const res = await this.#_deleteMany({ db: this.db, filter });
		return res;
	}

	async deleteById({ collectionName, id }) {
		if (collectionName) {
			if (!this.collections[`${collectionName}`]) await this.createCollection({ collectionName });
			const res = await this.#_delete({
				db: this.collections[`${collectionName}`],
				filter: { _id: id },
			});
			return res;
		}
		const res = await this.#_delete({ db: this.db, filter: { _id: id } });
		return res;
	}

	#_delete = async ({ db, filter }) => {
		const numRemoved = await db.remove(filter, {});
		return numRemoved;
	};

	#_deleteMany = async ({ db, filter }) => {
		const numRemoved = await db.remove(filter, { multi: true });
		return numRemoved;
	};

	#_update = async ({ db, filter, update }) => {
		const numReplaced = await db.update(filter, update);
		return numReplaced;
	};

	#_count = async ({ db, filter }) => {
		const count = await db.count(filter);
		return count;
	};

	#_find = async ({ db, filter }) => {
		const docs = await db.find(filter);
		return docs;
	};

	#_findOne = async ({ db, filter }) => {
		const doc = await db.findOne(filter);
		return doc;
	};

	#_insert = async ({ db, data }) => {
		const newDoc = await db.insert(data);
		const res = {
			insertedId: newDoc._id,
		};
		return res;
	};

	#_insertMany = async ({ db, data }) => {
		const newDocs = await db.insert(data);
		const insertedIds = [];
		newDocs.forEach((doc) => {
			insertedIds.push(doc._id);
		});
		const res = {
			insertedIds,
		};
		return res;
	};

	async init() {
		await this.db.load();
		if (this.#logger) this.#logger.success({ message: `Database loaded from ${this.dbPath}` });
	}
}
