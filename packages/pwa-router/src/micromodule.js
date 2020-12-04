import VueRouter from 'vue-router';

export default class PwaRouterInfrastructure {
	#plugins;

	#router;

	#previousRoute;

	constructor({ baseUrl }) {
		this.#router = new VueRouter({
			mode: 'history',
			baseUrl: baseUrl || '/',
			routes: [],
		});
		this.#plugins = [
			{
				plugin: VueRouter,
				settings: {},
			},
		];
	}

	init() {
		this.#router.beforeEach(async (to, from, next) => {
			this.#previousRoute = from;
			next();
		});
	}

	getRouter() {
		return this.#router;
	}

	registerMiddleware({ middleware }) {
		this.#router.beforeEach(async (to, from, next) => {
			await middleware({ to, from, next });
		});
		return true;
	}

	registerRoutes({ routes }) {
		this.#router.addRoutes(routes);
	}

	goTo({ name, path, params = {} }) {
		if (name) {
			this.#router.push({ name, params });
		} else if (path) {
			this.#router.push({ path, params });
		} else {
			throw new Error('Name or path undefined');
		}
		return true;
	}

	goBack() {
		this.#router.push({ path: this.#previousRoute.path });
		return true;
	}

	getCurrentRoute() {
		const { currentRoute } = this.#router;
		return currentRoute;
	}

	getPreviousRoute() {
		return this.#previousRoute;
	}

	getPluginsToInstall() {
		return this.#plugins;
	}
}
