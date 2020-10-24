import VueDep from 'vue';

export default class PwaInfrastructure {
	#vuetify;

	#Vue;

	constructor() {
		this.#Vue = VueDep;
	}

	usePlugin({ plugin, settings = {} }) {
		this.#Vue.use(plugin, settings);
	}

	registerInstanceProperty({ name, value }) {
		this.#Vue.prototype[`$${name}`] = value;
	}

	init({ plugins = [] }) {
		plugins.forEach((plugin) => {
			this.usePlugin(plugin);
		});
	}

	initApp({ app, materialUi, router }) {
		this.app = new this.#Vue({
			router,
			vuetify: materialUi,
			render: (h) => h(app),
		});
	}

	mountApp() {
		this.app.$mount('#app');
	}
}
