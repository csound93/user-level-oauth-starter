/**
 * dotenv gives us access to private variables held in a .env file
 * never expose this .env file publicly
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const database = require('./dbConfig');
const logger = require('./winston');
const zoomOauth = require('./routes/api/zoomOauth');
const zoomRest = require('./routes/api/zoomRest');

const app = express();

// Add global middlewares
app.use([
  cors(),
  express.json(),
  express.urlencoded({ extended: false }),
]);

app.options('*', cors());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 테스트 페이지 라우트
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

(async () => {
  try {
    await database.connect();
  } catch (error) {
    logger.error(error);
  }
})();

app.use('/', zoomOauth);
app.use('/zoom', zoomRest);

// Port must match ngrok for local development
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => console.log(`Listening on port ${[PORT]}!`));

// Graceful shutdown
const cleanup = () => {
  console.log('Closing HTTP server');
  database.end();
  console.log('Closing db connection');
  server.close(() => {
    console.log('HTTP server closed');
  });
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
