const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('connect', () => console.log('[Analytics Service] Connected to Redis'));
redis.on('error', (err) => console.error('[Analytics Service] Redis error:', err.message));
module.exports = redis;
