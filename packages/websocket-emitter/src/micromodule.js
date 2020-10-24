import socketIoEmitter from 'socket.io-emitter';
import Redis from 'ioredis';

export default class WebsocketEmitterInfrastructureMicromodule {
	#io;

	constructor({ redis }) {
		const redisInstance = new Redis(redis);
		this.#io = socketIoEmitter(redisInstance);
	}

	broadcast = ({ event }) => {
		this.#io.emit(event.type, event);
	};

	emit = ({ event, to }) => {
		this.#io.to(to).emit(event.type, event);
	};
}
