({
  host: '0.0.0.0',
  balancer: 8000,
  protocol: 'http',
  ports: [8010],
  nagle: false,
  timeouts: {
    bind: 2000,
    start: 30000,
    stop: 5000,
    request: 5000,
    watch: 1000,
  },
  queue: {
    concurrency: 1000,
    size: 2000,
    timeout: 3000,
  },
  scheduler: {
    concurrency: 10,
    size: 2000,
    timeout: 3000,
  },
  workers: {
    pool: 2,
    wait: 2000,
    timeout: 5000,
  },
  tls: {
    enabled: false,
    keyPath: '/etc/ssl/private/privkey.pem',
    certPath: '/etc/ssl/private/fullchain.pem',
    // caPath: '/etc/letsencrypt/live/example.com/chain.pem', // при необходимости
    // publicPort: 443, // если redirect делаем на 443
    redirectPort: 8000, // опционально: http-порт, который будет редиректить на https
    allowedOrigins: ['https://app.example.com'], // для CORS
  },
  cors: {
    // When true, any Origin on localhost / 127.0.0.1 / ::1 (any port) is allowed for CORS + WS.
    // Dev laptops hitting https://home.ts-int.digital from http://localhost:PORT — no need to list every port.
    allowLocalhostLoopback: true,
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'http://www.ts-int.digital',
      'http://ts-int.digital',
      'https://ts-int.digital',
      'https://www.ts-int.digital',
      'https://home.ts-int.digital',
      'https://localhost:3001',
      'http://localhost:5173',
      'https://localhost:5173',
      'http://localhost:5384',
      'https://localhost:5384',
      'http://localhost:8005',
      'http://localhost:8010',
      'http://100.69.109.45',
      'http://100.69.109.45:8010',
      'http://100.69.109.45:5050',
      // 127.0.0.1 is a distinct Origin from localhost — browsers send exactly what is in the address bar
      'http://127.0.0.1:8010',
      'http://127.0.0.1:5384',
    ],
    allowCredentials: true,
    maxAge: 86400,
  },
});
