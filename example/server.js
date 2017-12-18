const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const favicon = require('serve-favicon');
const path = require('path');
const http = require('http');
var session = require('client-sessions');

const index = require('./src/routes');

const app = express();

// Middlewares
app.use(compression());
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** Sesssion */
app.use(session({
  cookieName: 'session',
  secret: 'wdsGD6HWcIXarvHc6N68f7Mz8hc2',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));
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
app.use('/', index.login);
app.use('/login', index.login);
app.use('/register', index.register);
app.use('/logout', index.logout);
app.use('/dashboard', index.dashboard);
app.use('/404', index.er404);
app.use('/posts', index.post);
app.use('/users', index.user);
app.use('/category', index.category);
app.use('/conversation', index.conversation);

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

app.use((req, res, next) => {
  res.redirect('/404');
});

// Error handler function
app.use((err, req, res) => {
  const error = app.get('env') === 'development' ? err : {};
  const status = err.status;
  res.status(status).json({
    error: {
      message: error.message
    }
  });
});

var server = http.createServer(app);
server.listen(8080, function () {
  console.log('Server API running at port 8080');
});
