import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default class Auth {
	#jwtSecret;

	#saltRound = 10;

	constructor({ jwtSecret, saltRound }) {
		this.#jwtSecret = jwtSecret;
		this.#saltRound = parseInt(saltRound, 10);
	}

	resolveToken({ token }) {
		return new Promise((resolve, reject) => {
			jwt.verify(token, this.#jwtSecret, (err, decoded) => {
				if (err) {
					return reject(new Error('Invalid token'));
				}
				return resolve(decoded);
			});
		});
	}

	static hash({ toHash, saltRound }) {
		return bcrypt.hash(toHash, saltRound);
	}

	hashPassword({ password }) {
		return bcrypt.hash(password, this.#saltRound);
	}

	// eslint-disable-next-line class-methods-use-this
	async comparePasswords({ password, compareTo }) {
		const res = await bcrypt.compare(password, compareTo);
		return res;
	}

	generateJwt({ payload, expiresIn }) {
		return new Promise((resolve, reject) => {
			jwt.sign(payload, this.#jwtSecret, { expiresIn }, (err, token) => {
				if (err) {
					this.logger.warn('JWT token generation error:', err);
					return reject(new Error('Unable to generate token'));
				}
				return resolve(token);
			});
		});
	}
}
