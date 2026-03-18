var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send({
    message: 'NNPTUD-C4 API is running'
  });
});

module.exports = router;
