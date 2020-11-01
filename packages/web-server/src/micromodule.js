import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

export default class WebServer {
	#validator;

	#server;

	#port;

	constructor({ port, dependencies }) {
		if (!dependencies) throw new Error('Dependencies undefined');
		if (!dependencies.validator) throw new Error('Validator undefinec');
		this.#validator = dependencies.validator;
		this.#port = port;
		this.#server = express();
		this.#server.use(bodyParser.urlencoded({ extended: false }));
		this.#server.use(bodyParser.json());
		this.#server.use(cors());
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
					if (route.params) {
						const schema = route.params;
						if (!schema.$$strict) schema.$$strict = 'remove';
						switch (route.method) {
							case 'post':
								await this.#validator.validate({ data: request.body, schema });
								break;
							case 'get':
								await this.#validator.validate({ data: request.params, schema });
								break;
							default:
								break;
						}
					}
					const response = await handler({ request });
					if (response instanceof Error || (response?.stack && response?.message)) {
						const error = {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'web-server',
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
							source: 'web-server',
							route: route.name,
							reasons: [error.name],
						},
					};
					return res.send(response);
				}
			};
			const routeMiddlewares = [];
			if (route.middlewares) {
				route.middlewares.forEach((middleware) => {
					const middlewareHandler = async (req, res, next) => {
						req.params = req.body;
						await middlewares[`${middleware}`]({ request: req, next });
					};
					routeMiddlewares.push(middlewareHandler);
				});
			}
			this.#server[route.method.toLowerCase()](route.path, routeMiddlewares, controller);
		});
	}

	run() {
		return new Promise((resolve) => {
			const port = this.#port;
			const successEvent = {
				status: 'success',
				timestamp: new Date(),
				payload: {
					port,
				},
			};
			this.#server.listen(port, () => {
				resolve(successEvent);
			});
		});
	}
}
