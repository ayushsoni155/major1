const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('connect', () => console.log('[Auth Service] Connected to Redis'));
redis.on('error', (err) => console.error('[Auth Service] Redis error:', err.message));
module.exports = redis;
