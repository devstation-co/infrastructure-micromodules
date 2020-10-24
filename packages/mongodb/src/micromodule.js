import mongodb from 'mongodb';

export default class MongoDbInfrastructure {
	#logger;

	#db;

	constructor({ username, password, host, port, db, dependencies }) {
		if (dependencies && dependencies.logger) {
			this.#logger = dependencies.logger;
		}
		this.url = `mongodb://${username}:${password}@${host}:${port}/${db}`;
		this.dbName = db;
	}

	#changeEntityId = ({ entity }) => {
		const modifiedEntity = entity;
		if (entity?._id) {
			modifiedEntity.id = entity._id;
			delete modifiedEntity._id;
		}
		return modifiedEntity;
	};

	#changeEntitiesId = ({ entities }) => {
		const modifiedEntities = entities.map((entity) => {
			const newEntity = entity;
			if (entity._id) {
				newEntity.id = newEntity._id;
				delete newEntity._id;
			}
			return newEntity;
		});
		return modifiedEntities;
	};

	#convertFilterId = ({ filter }) => {
		const convertedFilter = { ...filter };
		if (filter._id) {
			convertedFilter._id = new mongodb.ObjectId(filter._id);
		} else if (filter.id) {
			delete convertedFilter.id;
			convertedFilter._id = new mongodb.ObjectId(filter.id);
		}
		return convertedFilter;
	};

	async count({ collectionName, filter }) {
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.countDocuments(this.#convertFilterId({ filter }));
		return res;
	}

	async insertMany({ collectionName, entities }) {
		if (!entities || entities.length === 0) throw new Error('Entities undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.insertMany(entities);
		return res;
	}

	async insertOne({ collectionName, entity }) {
		const newEntity = entity;
		if (!entity) throw new Error('Entity undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		if (newEntity.id) {
			newEntity._id = mongodb.ObjectId(entity.id);
			delete newEntity.id;
		}
		const collection = this.#db.collection(collectionName);
		const dbRes = await collection.insertOne(entity);
		const res = {
			insertedCount: dbRes.insertedCount,
			insertedId: dbRes.insertedId,
		};
		return res;
	}

	async find({ collectionName, filter = {} }) {
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const convertedFilter = this.#convertFilterId({ filter });
		const entities = await collection.find(convertedFilter).toArray();
		const res = this.#changeEntitiesId({ entities });
		return res;
	}

	async findOne({ collectionName, filter }) {
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const convertedFilter = this.#convertFilterId({ filter });
		const entity = await collection.findOne(convertedFilter);
		const res = this.#changeEntityId({ entity });
		return res;
	}

	async findById({ collectionName, id }) {
		if (!id) throw new Error('Id undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const entity = await collection.findOne({ _id: mongodb.ObjectId(id) });
		const res = this.#changeEntityId({ entity });
		return res;
	}

	async updateOne({ collectionName, filter, update }) {
		if (!update) throw new Error('Update statement undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.updateOne(this.#convertFilterId({ filter }), update);
		return res;
	}

	async updateMany({ collectionName, filter, update }) {
		if (!update) throw new Error('Update statement undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.updateMany(this.#convertFilterId({ filter }), update);
		return res;
	}

	async deleteById({ collectionName, id }) {
		if (!id) throw new Error('Id undefined');
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.deleteOne({ _id: mongodb.ObjectId(id) });
		return res;
	}

	async deleteMany({ collectionName, filter }) {
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.deleteMany(this.#convertFilterId({ filter }));
		return res;
	}

	async deleteOne({ collectionName, filter }) {
		if (!collectionName) throw new Error('Collection name undefined');
		const collection = this.#db.collection(collectionName);
		const res = await collection.deleteOne(this.#convertFilterId({ filter }));
		return res;
	}

	async init() {
		const { MongoClient } = mongodb;
		const driver = await MongoClient.connect(this.url, { useUnifiedTopology: true });
		this.#db = driver.db();
		if (this.#logger) this.#logger.success({ message: `Connected to ${this.dbName}` });
	}
}
