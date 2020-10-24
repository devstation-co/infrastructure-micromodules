import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

export default class WebServerInfrastructureMicromodule {
	constructor({ port }) {
		this.port = port;
		this.server = express();
		this.server.use(bodyParser.urlencoded({ extended: false }));
		this.server.use(bodyParser.json());
		this.server.use(cors());
	}

	register({ routes, controllers }) {
		routes.forEach((route) => {
			this.server[route.method.toLowerCase()](route.path, controllers[route.controller]);
		});
	}

	run() {
		return new Promise((resolve) => {
			const { port } = this;
			const successEvent = {
				name: 'webServerInitialized',
				createdAt: new Date(),
				payload: {
					port,
				},
			};
			this.server.listen(port, () => {
				resolve(successEvent);
			});
		});
	}
}
