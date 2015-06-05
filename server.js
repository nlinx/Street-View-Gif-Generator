var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');
var secret = require('./apiKey.js')

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/"));

var port = process.env.PORT || 3000;

// API REQUESTS
// get geocode latlong data
app.get('/api/latLng', function(req, res) {
  var results = {};
  var origin = req.query.origin || '611 Mission St, San Francisco, CA';
  var end = req.query.end || '615 Mission St, San Francisco, CA';
  origin = origin.split(" ").join("+");
  end = end.split(" ").join("+");
  var startUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + origin + '&key=' + secret.apiKey;
  var endUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + end + '&key=' + secret.apiKey;
  results.key = secret.apiKey;
  request.get(startUrl, function(error, response, body) {
    if (!error && res.statusCode === 200) {
      results.origin = JSON.parse(body).results[0].geometry.location;
      request.get(endUrl, function(error, response, body) {
        if (!error && res.statusCode === 200) {
          results.end = JSON.parse(body).results[0].geometry.location;
          res.json(results);
        } else {
          console.error(error);
        }
      });
    } else {
      console.error(error);
    }
  });
});

app.listen(port);
console.log('Listening on port ' + port);
