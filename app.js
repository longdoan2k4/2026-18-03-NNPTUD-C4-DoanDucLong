var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NNPTUD-C4'

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
//localhost:3000/users
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/products', require('./routes/products'))
app.use('/api/v1/categories', require('./routes/categories'))
app.use('/api/v1/auth', require('./routes/auth'))
app.use('/api/v1/system', require('./routes/system'))


mongoose.connect(mongoUri);
mongoose.connection.on('connected', function () {
  console.log("MongoDB connected");
})
mongoose.connection.on('disconnected', function () {
  console.log("MongoDB disconnected");
})
mongoose.connection.on('disconnecting', function () {
  console.log("MongoDB disconnecting");
})
mongoose.connection.on('error', function (err) {
  console.log("MongoDB error:", err.message);
})
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  const statusCode = err.status || 500;
  const payload = {
    message: err.message || 'Internal Server Error'
  };

  if (req.app.get('env') === 'development') {
    payload.error = err;
  }

  res.status(statusCode).send(payload);
});

module.exports = app;
