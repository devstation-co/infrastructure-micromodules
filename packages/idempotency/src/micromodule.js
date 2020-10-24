import LruCache from 'lru-cache';

export default class Idempotency {
	#cache;

	constructor({ maxAge }) {
		this.#cache = new LruCache({
			max: 500,
			length: (n, key) => {
				return n * 2 + key.length;
			},
			maxAge,
		});
	}

	async check({ key }) {
		const res = this.#cache.get(key);
		if (res) throw new Error('Duplicate request');
		await this.#cache.set(key, 1);
		return true;
	}
}
