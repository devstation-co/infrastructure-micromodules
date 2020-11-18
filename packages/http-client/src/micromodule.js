import axios from 'axios';

export default class HttpClient {
	#client;

	#baseUrl;

	#timeout;

	#headers;

	constructor({ baseUrl, headers, timeout }) {
		if (!baseUrl) throw new Error('BaseUrlUndefined');
		this.#baseUrl = baseUrl;
		if (headers) this.#headers = headers;
		if (timeout) this.#timeout = timeout;
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

	setHeaders({ headers }) {
		if (!headers) throw Error('HeadersUndefined');
		this.#headers = headers;
		this.#client = axios.create({
			baseURL: this.#baseUrl,
			timeout: this.#timeout || 1000,
			headers,
		});
	}

	clearHeaders() {
		this.#headers = {};
		this.#client = axios.create({
			baseURL: this.#baseUrl,
			timeout: this.#timeout || 1000,
			headers: {},
		});
	}

	getHeaders() {
		return this.#headers;
	}

	getBaseUrl() {
		return this.#baseUrl;
	}

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
