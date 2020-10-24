import { createToastInterface } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

export default class ToastInfrastructure {
	#toastr;

	constructor(options) {
		this.#toastr = createToastInterface(options);
	}

	success({ message }) {
		this.#toastr.success(message);
	}

	error({ message }) {
		this.#toastr.error(message);
	}
}
