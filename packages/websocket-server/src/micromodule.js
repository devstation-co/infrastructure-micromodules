import express from 'express';
import cors from 'cors';
import http from 'http';
import socketIo from 'socket.io';
import socketIoRedis from 'socket.io-redis';
import Redis from 'ioredis';

export default class WebsocketServerInfrastructureMicromodule {
	#server;

	#io;

	constructor({ port, redis, namespace }) {
		this.port = port;
		const app = express();
		app.use(cors());
		this.#server = http.createServer(app);
		const io = socketIo(this.#server);
		const pub = new Redis(redis);
		const sub = new Redis(redis);
		io.adapter(
			socketIoRedis({
				pubClient: pub,
				subClient: sub,
			}),
		);
		if (namespace) {
			this.#io = io.of(`/${namespace}`);
		} else {
			this.#io = io;
		}
		this.requests = [];
	}

	#joinRoom = ({ socket }) => {
		return ({ room }) => {
			return new Promise((resolve) => {
				socket.join(room, () => {
					resolve(true);
				});
			});
		};
	};

	subscribeToRequests = ({ requests, middlewares }) => {
		this.#io.on('connection', (socket) => {
			const connectedSocket = socket;
			connectedSocket.joinRoom = this.#joinRoom({ socket });
			connectedSocket.use((packet, next) => {
				if (this.requests.indexOf(packet[0]) !== -1) return next();
				return next(new Error(`${packet[0]} request not registred`));
			});
			requests.forEach((request) => {
				if (request.middlewares) {
					request.middlewares.forEach((middleware) => {
						if (
							typeof middlewares[`${request.name.split('.')[0]}.${middleware}`] !== 'function' &&
							typeof middlewares[`${middleware}`] !== 'function'
						)
							throw new Error(`Middleware undefined in ${request.name}`);
						connectedSocket.use(async (packet, next) => {
							if (packet[0] === request.name) {
								await middlewares[`${middleware}`]({
									socket: connectedSocket,
									request: packet[1],
									next,
								});
							} else {
								next();
							}
						});
					});
				}
				connectedSocket.on(request.name, async (data, callback) => {
					try {
						const response = await request.controller({ socket: connectedSocket, request: data });
						if (response instanceof Error || (response?.stack && response?.message)) {
							const error = {
								status: 'error',
								timestamp: new Date(),
								payload: {
									source: 'websocket-server',
									reasons:
										response.name === 'VALIDATION_ERROR'
											? JSON.parse(response.message)
											: [response.message],
								},
							};
							return callback(error);
						}
						return callback(response);
					} catch (error) {
						const response = {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'websocket-server',
								reasons:
									error.name === 'VALIDATION_ERROR' ? JSON.parse(error.message) : [error.message],
							},
						};
						return callback(response);
					}
				});
				this.requests.push(request.name);
			});
		});
	};

	subscribeMiddlewares = ({ middlewares }) => {
		middlewares.forEach((middleware) => {
			this.#io.use((socket, next) => {
				middleware({ socket, next });
			});
		});
	};

	broadcast(request) {
		this.#io.emit(request.name, request);
	}

	broadcastIn(rooms, request) {
		rooms.forEach((room) => {
			this.#io.in(room).emit(request.name, request);
		});
	}

	emit(socketId, request) {
		this.#io.to(socketId).emit(request.name, request);
	}

	run() {
		return new Promise((resolve) => {
			const { port } = this;
			const successEvent = {
				name: 'websocketServerRunning',
				createdAt: new Date(),
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
