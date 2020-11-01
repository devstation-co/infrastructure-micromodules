import axios from 'axios';

export default class HttpClient {
	#client;

	constructor({ baseUrl, headers, timeout }) {
		if (!baseUrl) throw new Error('baseUrl undefined');
		this.#client = axios.create({
			baseURL: baseUrl,
			timeout: timeout || 1000,
			headers: headers || {},
		});
	}

	#convertParams = ({ params }) => {
		if (typeof params === 'object') {
			const convertedParams = Object.keys(params)
				.map((key) => {
					return `${encodeURIComponent(key)}=${encodeURIComponent(params[`${key}`])}`;
				})
				.join('&');
			return convertedParams;
		}
		return '';
	};

	async get({ path, params }) {
		const res = await this.#client.get(`${path}?${this.#convertParams({ params })}`);
		return res;
	}

	async post({ path, params }) {
		const res = await this.#client.post(path, params);
		return res;
	}

	async put({ path, params }) {
		const res = await this.#client.put(path, params);
		return res;
	}

	async delete({ path }) {
		const res = await this.#client.delete(path);
		return res;
	}
}
