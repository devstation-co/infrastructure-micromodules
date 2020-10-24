import Micromodule from '../src/micromodule';

const micromodule = new Micromodule({ collections: ['testEntities'] });

describe('TEST PWA DB INFRASTRUCTURE MICROMODULE', () => {
	test('insertOne', async () => {
		const res = await micromodule.insertOne({
			collectionName: 'testEntities',
			entity: {
				id: 1,
				string: 'entity 1',
				nestedObject: {
					string: 'test',
					nestedArray: [],
				},
			},
		});
		expect(res.insertedId).toBe(1);
		expect(res.insertedCount).toBe(1);
	});

	test('insertMany', async () => {
		const res = await micromodule.insertMany({
			collectionName: 'testEntities',
			entities: [
				{
					id: 2,
					string: 'entity 2',
				},
				{
					id: 3,
					string: 'entity 3',
				},
				{
					id: 4,
					string: 'entity',
				},
				{
					id: 5,
					string: 'entity',
				},
			],
		});
		expect(res.insertedCount).toBe(4);
		expect(res.insertedIds).toStrictEqual([2, 3, 4, 5]);
	});

	test('findOne', async () => {
		const res = await micromodule.findOne({
			collectionName: 'testEntities',
			filter: {
				string: 'entity 1',
			},
		});
		expect(res.id).toBe(1);
		expect(res.string).toBe('entity 1');
	});

	test('find', async () => {
		const res = await micromodule.find({
			collectionName: 'testEntities',
			filter: {
				string: 'entity 2',
			},
		});
		expect(res.length).toBe(1);
		expect(res[0].id).toBe(2);
		expect(res[0].string).toBe('entity 2');
	});

	test('search', async () => {
		const res = await micromodule.search({
			collectionName: 'testEntities',
			filter: {
				string: 'entity',
			},
		});
		expect(res.length).toBe(5);
	});

	test('updateOne', async () => {
		const res = await micromodule.updateOne({
			collectionName: 'testEntities',
			filter: {
				id: 1,
			},
			update: {
				$set: {
					string: 'updated string',
					'nestedObject.string': 'updated nested string',
				},
				$push: {
					'nestedObject.nestedArray': ['nested array item 1', 'nested array item 2'],
					array: 'array item 1',
				},
			},
		});
		expect(res.updatedCount).toBe(1);
		expect(res.updated.string).toBe('updated string');
		expect(res.updated.array[0]).toBe('array item 1');
		expect(res.updated.nestedObject.string).toBe('updated nested string');
		expect(res.updated.nestedObject.nestedArray.length).toBe(2);
	});

	test('deleteById', async () => {
		const res = await micromodule.deleteById({
			collectionName: 'testEntities',
			id: 1,
		});
		expect(res.deletedCount).toBe(1);
		expect(res.deletedId).toBe(1);
	});

	test('deleteMany', async () => {
		const res = await micromodule.deleteMany({
			collectionName: 'testEntities',
			filter: { string: 'entity' },
		});
		expect(res.deletedCount).toBe(2);
		expect(res.deletedIds).toEqual(expect.arrayContaining([4, 5]));
	});
});
