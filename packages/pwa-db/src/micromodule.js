import Vue from 'vue';
import lodash from 'lodash';

export default class PwaDbInfrastructure {
	#store;

	constructor({ collections }) {
		this.state = {};
		this.getters = {};
		collections.forEach((collection) => {
			this.state[`${collection}`] = [];
		});
	}

	// eslint-disable-next-line class-methods-use-this
	filterArray(array, filters) {
		const filterKeys = Object.keys(filters);

		const filtredArray = array.filter((item) => {
			let flag = true;
			filterKeys.forEach((filter) => {
				if (item[`${filter}`] !== filters[`${filter}`]) {
					flag = false;
				}
			});
			return flag;
		});
		return filtredArray;
	}

	getState({ collectionName }) {
		return this.state[`${collectionName}`];
	}

	async findOne({ collectionName, filter }) {
		return this.filterArray(this.state[`${collectionName}`], filter)[0];
	}

	async find({ collectionName, filter }) {
		const res = this.filterArray(this.state[`${collectionName}`], filter);
		return res;
	}

	async search({ collectionName, filter }) {
		const filterKeys = Object.keys(filter);
		let flag = true;
		const res = this.state[`${collectionName}`].filter((item) => {
			filterKeys.forEach((f) => {
				if (typeof item[`${f}`] === 'string') {
					if (!item[`${f}`].toLowerCase().includes(filter[`${f}`])) flag = false;
				} else if (item[`${f}`] !== filter[`${f}`]) {
					flag = false;
				}
			});
			return flag;
		});
		return res;
	}

	async insertOne({ collectionName, entity }) {
		const searchResult = this.state[`${collectionName}`].find((e) => entity.id === e.id);
		if (!searchResult) {
			this.state[`${collectionName}`].push(entity);
			return {
				insertedId: entity.id,
				insertedCount: 1,
			};
		}
		return {
			insertedId: '',
			insertedCount: 0,
		};
	}

	async insertMany({ collectionName, entities }) {
		const insertOperations = [];
		const insertedIds = [];
		entities.forEach((entity) => {
			const searchResult = this.state[`${collectionName}`].find((e) => entity.id === e.id);
			if (!searchResult) {
				insertOperations.push(this.insertOne({ collectionName, entity }));
				insertedIds.push(entity.id);
			}
		});
		await Promise.all(insertOperations);
		return {
			insertedIds,
			insertedCount: insertedIds.length,
		};
	}

	async deleteMany({ collectionName, filter }) {
		const toDelete = [];
		const deletedIds = [];
		this.state[`${collectionName}`].forEach((entity) => {
			let flag = true;
			const filterFlags = { ...filter };
			Object.keys(filter).forEach((key) => {
				if (entity[`${key}`] === filter[`${key}`]) {
					filterFlags[`${key}`] = true;
				} else {
					filterFlags[`${key}`] = false;
				}
			});
			Object.keys(filterFlags).forEach((key) => {
				if (filterFlags[`${key}`] === false) flag = false;
			});
			if (flag) toDelete.push(entity);
		});
		const collection = this.state[`${collectionName}`];
		toDelete.forEach((entity) => {
			collection.splice(collection.indexOf(entity), 1);
			deletedIds.push(entity.id);
		});
		this.state[`${collectionName}`] = collection;
		const res = {
			deletedCount: deletedIds.length,
			deletedIds,
		};
		return res;
	}

	async deleteById({ collectionName, id }) {
		const currentLength = this.state[`${collectionName}`].length;
		this.state[`${collectionName}`] = this.state[`${collectionName}`].filter(
			(entity) => entity.id !== id,
		);
		const updatedLength = this.state[`${collectionName}`].length;
		const diff = currentLength - updatedLength;
		const res = { deletedCount: 0, deletedId: '' };
		if (diff === 1) {
			res.deletedCount = 1;
			res.deletedId = id;
		}
		return res;
	}

	async updateOne({ collectionName, filter, update }) {
		const toModify = this.state[`${collectionName}`].find((entity) => {
			let flag = true;
			const filterFlags = { ...filter };
			Object.keys(filter).forEach((key) => {
				if (key === 'id' && entity._id === filter.id) {
					filterFlags[`${key}`] = true;
				} else if (entity[`${key}`] === filter[`${key}`]) {
					filterFlags[`${key}`] = true;
				} else {
					filterFlags[`${key}`] = false;
				}
			});
			Object.keys(filterFlags).forEach((key) => {
				if (filterFlags[`${key}`] === false) flag = false;
			});
			return flag;
		});
		if (toModify) {
			Object.keys(update).forEach((key) => {
				if (key === '$set') {
					Object.keys(update.$set).forEach((setKey) => {
						lodash.set(toModify, setKey, lodash.get(update.$set, setKey));
					});
				} else if (key === '$push') {
					Object.keys(update.$push).forEach((pushKey) => {
						let arr = lodash.get(toModify, pushKey);
						if (!Array.isArray(arr)) arr = [];
						if (Array.isArray(update.$push[`${pushKey}`])) {
							update.$push[`${pushKey}`].forEach((pushItem) => {
								arr.push(pushItem);
							});
						} else {
							arr.push(update.$push[`${pushKey}`]);
						}
						lodash.set(toModify, pushKey, arr);
					});
				}
			});
			return {
				updatedCount: 1,
				updated: toModify,
			};
		}
		return {
			updatedCount: 0,
			updated: toModify,
		};
	}

	async init() {
		return new Vue({
			data: {
				$$state: this.state,
			},
		});
	}
}
