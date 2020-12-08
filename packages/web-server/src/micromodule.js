import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

export default class WebServer {
	#validator;

	#server;

	#port;

	constructor({ port, dependencies }) {
		if (!dependencies) throw new Error('Dependencies undefined');
		if (!dependencies.validator) throw new Error('Validator undefined');
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
						const bodySchema = route.body;
						const paramsSchema = route.params;
						if (bodySchema && !bodySchema.$$strict) bodySchema.$$strict = 'remove';
						if (paramsSchema && !paramsSchema.$$strict) paramsSchema.$$strict = 'remove';
						switch (route.method) {
							case 'post':
								if (paramsSchema)
									await this.#validator.validate({ data: request.params, schema: paramsSchema });
								if (bodySchema)
									await this.#validator.validate({ data: request.body, schema: bodySchema });
								break;
							case 'get':
								if (paramsSchema)
									await this.#validator.validate({ data: request.params, schema: paramsSchema });
								break;
							case 'put':
								if (bodySchema)
									await this.#validator.validate({ data: request.body, schema: bodySchema });
								if (paramsSchema)
									await this.#validator.validate({ data: request.params, schema: paramsSchema });
								break;
							case 'delete':
								if (paramsSchema)
									await this.#validator.validate({ data: request.params, schema: paramsSchema });
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
							reasons:
								error.name === 'VALIDATION_ERROR' ? JSON.parse(error.message) : [error.message],
						},
					};
					return res.send(response);
				}
			};
			const routeMiddlewares = [];
			if (route.middlewares) {
				route.middlewares.forEach((middleware) => {
					const middlewareHandler = async (req, res, next) => {
						await middlewares[`${middleware}`]({ request: req, response: res, next });
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
