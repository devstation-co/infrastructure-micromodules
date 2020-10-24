import Vuetify from 'vuetify/lib';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';

export default class PwaMaterialUiInfrastructure {
	#vuetify;

	#plugins;

	constructor({ theme }) {
		this.#vuetify = new Vuetify({
			theme: {
				options: {
					customProperties: true,
				},
				themes: theme,
			},
		});
		this.#plugins = [
			{
				plugin: Vuetify,
				settings: {},
			},
		];
	}

	getInstance() {
		return this.#vuetify;
	}

	getPluginsToInstall() {
		return this.#plugins;
	}
}
