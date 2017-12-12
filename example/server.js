const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const favicon = require('serve-favicon');
const path = require('path');
const http = require('http');

const index = require('./src/routes');

const app = express();

// Middlewares
app.use(compression());
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Load View Engine
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'pug');

// Point static path to public directory
app.use(express.static(path.join(__dirname, 'src', 'assets')));
app.use('/logs', express.static(path.join(__dirname, 'logs')));

// Favicon
app.use(
  favicon(path.join(__dirname, 'src', 'assets', 'images', 'favicon.png'))
);

// App routes
app.use('/', index.screen1);
app.use('/screen2', index.screen2);
app.use('/download', index.download);
app.use('/imp_emp', index.importEmp);
app.use('/export', index.exportExcel);

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// Catch 404 Errors and forward them to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;

  next(err);
});

// Error handler function
app.use((err, req, res) => {
  const error = app.get('env') === 'development' ? err : {};
  const status = err.status;

  // Response to the client
  res.status(status).json({
    error: {
      message: error.message
    }
  });
});

// Listen server
// app.listen(3000, () => {
//   console.log('Server API running at port 3000');
// });

var server = http.createServer(app);
server.setTimeout(600*60*1000); // 600 * 60 seconds * 1000 msecs
server.listen(3000, function () {
  console.log('Server API running at port 3000');
});
