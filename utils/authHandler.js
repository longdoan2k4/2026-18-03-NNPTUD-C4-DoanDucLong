let jwt = require('jsonwebtoken')
let userModel = require('../schemas/users')
let fs = require('fs')
let path = require('path')
let { JWT_EXPIRES_IN, JWT_ALGORITHM, JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH } = require('./constant')

function normalizeMultilineKey(value) {
	if (!value) {
		return null;
	}
	return value.replace(/\\n/g, '\n');
}

function loadKeyFromPath(relativeKeyPath) {
	let fullPath = path.join(__dirname, '..', relativeKeyPath);
	if (!fs.existsSync(fullPath)) {
		return null;
	}
	return fs.readFileSync(fullPath, 'utf8');
}

function getPrivateKey() {
	return normalizeMultilineKey(process.env.JWT_PRIVATE_KEY) || loadKeyFromPath(JWT_PRIVATE_KEY_PATH);
}

function getPublicKey() {
	return normalizeMultilineKey(process.env.JWT_PUBLIC_KEY) || loadKeyFromPath(JWT_PUBLIC_KEY_PATH);
}

function getTokenFromRequest(req) {
	let authHeader = req.headers.authorization || '';
	if (authHeader.startsWith('Bearer ')) {
		return authHeader.slice(7);
	}
	return null;
}

module.exports = {
	generateToken: function (user) {
		let privateKey = getPrivateKey();
		if (!privateKey) {
			throw new Error('chua cau hinh JWT private key. Hay tao key RS256 2048-bit truoc khi dang nhap')
		}

		return jwt.sign(
			{
				id: user._id,
				username: user.username,
				role: user.role && user.role.name ? user.role.name : user.role
			},
			privateKey,
			{
				algorithm: JWT_ALGORITHM,
				expiresIn: JWT_EXPIRES_IN
			}
		)
	},

	authenticateToken: async function (req, res, next) {
		try {
			let publicKey = getPublicKey();
			if (!publicKey) {
				return res.status(500).send({ message: 'server chua cau hinh JWT public key' })
			}

			let token = getTokenFromRequest(req);
			if (!token) {
				return res.status(401).send({ message: 'ban chua dang nhap' })
			}

			let payload = jwt.verify(token, publicKey, {
				algorithms: [JWT_ALGORITHM]
			});
			let user = await userModel.findOne({
				_id: payload.id,
				isDeleted: false
			}).populate('role', 'name');

			if (!user) {
				return res.status(401).send({ message: 'token khong hop le' })
			}

			req.user = {
				id: user._id.toString(),
				username: user.username,
				email: user.email,
				role: user.role ? user.role.name : null
			};

			next();
		} catch (error) {
			return res.status(401).send({ message: 'token khong hop le' })
		}
	},

	authorizeRoles: function (...roles) {
		return function (req, res, next) {
			if (!req.user) {
				return res.status(401).send({ message: 'ban chua dang nhap' })
			}

			if (!roles.includes(req.user.role)) {
				return res.status(403).send({ message: 'ban khong co quyen truy cap' })
			}

			next();
		}
	},

	authorizeSelfOrRoles: function (idSelector, ...roles) {
		return function (req, res, next) {
			if (!req.user) {
				return res.status(401).send({ message: 'ban chua dang nhap' })
			}

			let targetId = idSelector(req);
			let isSelf = req.user.id === targetId;

			if (isSelf || roles.includes(req.user.role)) {
				return next();
			}

			return res.status(403).send({ message: 'ban khong co quyen truy cap' })
		}
	}
}
