import config from './config';
import restify from 'restify';
import bunyan from 'bunyan';
import { Pool, Client } from 'pg';
import corsMiddleware from 'restify-cors-middleware';
import commands from './commands';
import routes from './routes';

// Setup logging
const log = bunyan.createLogger({
  name: config.appName,
  streams: [
    {
      level: config.logLevel,
      stream: process.stderr
    },
    {
      level: 'debug',
      type: 'raw',
      stream: new restify.bunyan.RequestCaptureStream({
        level: bunyan.WARN,
        maxRecords: 100,
        maxRequestIds: 1000,
        stream: process.stderr
      })
    }
  ],
  serializers: restify.bunyan.serializers
});

const server = restify.createServer({ log: log });

const cors = corsMiddleware({
  origins: ['*']
});

// Setup common server middlewares
server.pre(restify.pre.sanitizePath());
server.pre(restify.pre.userAgentConnection());
server.pre(cors.preflight);
server.use(restify.plugins.requestLogger());

if (config.stage === 'production') {
  server.use(restify.plugins.throttle({ burst: 10, rate: 5, ip: true }));
}

server.use(cors.actual);
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.gzipResponse());
server.use(restify.plugins.bodyParser());

const pool = new Pool({ connectionString: config.databaseURL });

server.use(async (req, res, next) => {
  req.client = await pool.connect();
  next();
});

// Define routes
server.post('/slash', (req, res, next) => {
  const { token, command } = req.body;

  const func = commands[command];
  if (!func) {
    res.send(200, { text: "Sorry, I don't understand that command." });
    return next();
  }

  return func(req, res, next);
});

server.get('/charts/:channel/:date_text/image.png', routes.charts);

// Setup audit log
server.on('after', restify.plugins.auditLogger({
  event: 'after',
  log: bunyan.createLogger({
    level: 'info',
    name: `${config.appName}-audit`,
    stream: process.stdout
  })
}));

// Run server
server.listen(config.port, () => {
  console.log('%s listening at %s', server.name, server.url);
});

export default server;
