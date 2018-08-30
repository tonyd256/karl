import config from './config';
import restify from 'restify';
import bunyan from 'bunyan';
import { Pool, Client } from 'pg';
import corsMiddleware from 'restify-cors-middleware';

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
server.post('/slash', async (req, res, next) => {
  const { token, channel_id, user_id, command, text } = req.body;

  if (command !== '/attendance') {
    res.send(200, { text: "Sorry, I don't understand that command." });
    return next();
  }

  if (/^\s*$/.test(text)) {
    const result = await req.client.query('\
      SELECT "people_count"\
      FROM "attendance"\
      WHERE "channel_id" = $1\
      ORDER BY "day" DESC\
      LIMIT 1', [channel_id]);

    if (result.rows.length === 0) {
      res.send(200, {
        text: "No attendance has been recorded",
        response_type: 'in_channel'
      });
      return next();
    }

    const { people_count } = result.rows[0];
    res.send(200, {
      text: `Your last workout had ${people_count} people!`,
      response_type: 'in_channel'
    });
    return next();
  }

  const num = text.split(" ").map(s => parseInt(s, 10)).find( n => !isNaN(n));

  if (num) {
    await req.client.query('\
      INSERT INTO "attendance" ("channel_id", "user_id", "people_count")\
      VALUES ($1, $2, $3)', [channel_id, user_id, num]);

    res.send(200, {
      text: `Thanks <@${user_id}>! Wow, ${num} people. Great Work!`,
      response_type: 'in_channel'
    });
    return next();
  } else {
    res.send(200, { text: "Couldn't find the number of people. Try again?" });
    return next();
  }
});

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
