const PROXY_CONFIG = [
  {
    context: ['/api/auth'],
    target: 'http://localhost:3331',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  },
  {
    context: ['/api'],
    target: 'http://localhost:3333',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
];

module.exports = PROXY_CONFIG;
