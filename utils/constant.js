module.exports = {
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
	JWT_ALGORITHM: 'RS256',
	JWT_PRIVATE_KEY_PATH: process.env.JWT_PRIVATE_KEY_PATH || 'keys/jwtRS256.key',
	JWT_PUBLIC_KEY_PATH: process.env.JWT_PUBLIC_KEY_PATH || 'keys/jwtRS256.key.pub'
}
