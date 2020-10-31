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
		this.router = express.Router();
	}

	register({ routes, controllers, middlewares }) {
		routes.forEach((route) => {
			let handler;
			if (typeof controllers[route.controller] === 'function') {
				handler = controllers[route.controller];
			} else if (!route.controller && typeof controllers[route.name] === 'function') {
				handler = controllers[route.name];
			} else {
				throw new Error(`${route.name} controller undefined`);
			}
			const controller = async (req, res) => {
				try {
					const request = req;
					request.params = req.body;
					const response = await handler({ request });
					if (response instanceof Error || (response?.stack && response?.message)) {
						const error = {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'http-api',
								route: route.name,
								reasons:
									response.name === 'VALIDATION_ERROR'
										? JSON.parse(response.message)
										: [response.message],
							},
						};
						return res.send(error);
					}
					return res.send(response);
				} catch (error) {
					const response = {
						status: 'error',
						timestamp: new Date(),
						payload: {
							source: 'http-api',
							route: route.name,
							reasons: [error.name],
						},
					};
					return res.send(response);
				}
			};

			this.router[route.method.toLowerCase()](route.path, controller);
			if (route.middlewares) {
				route.middlewares.forEach((middleware) => {
					this.router.use(async (req, res, next) => {
						await middlewares[`${middleware}`]({ request: req, next });
					});
				});
			}
			this.server.use('/', this.router);
		});
	}

	run() {
		return new Promise((resolve) => {
			const { port } = this;
			const successEvent = {
				status: 'success',
				timestamp: new Date(),
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
