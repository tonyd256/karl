const stage = process.env.NODE_ENV || 'development';

if (stage !== 'production') {
  require('dotenv').load();
}

const config = {
  common: {
    stage,
    appName: 'karl',
    logLevel: 'info'
  },
  development: {
    databaseURL: 'postgres://localhost/karl_db',
    port: 3030,
    apiUrl: 'http://localhost:3030'
  },
  production: {
    databaseURL: process.env.DATABASE_URL,
    port: process.env.PORT,
    apiUrl: process.env.API_URL
  }
};

export default Object.assign({}, config.common, config[stage]);
