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
// api call for images at specific latitude and longitude
app.get('/api/images', function(req, res){
  var url = req.query.url
  request(url, function(error, response, body) {
    if (!error && res.statusCode === 200) {
      // console.log(body);
      res.json(body);
    } else {
      console.error(error);
    }
  });
});

app.get('/api/route', function(req, res){
  var origin = req.query.origin;
  var end = req.query.end;
  // http://maps.google.com/maps/api/directions/json?origin=27.111,45.222&destination=28.333,46.444&sensor=false
  var url = 'http://maps.google.com/maps/api/directions/json?origin='
  origin.then(function(data) {
    url += data.lat + "," + data.lng;
    end.then(function(data) {
      url += "&destination=" + data.lat + "," + data.lng;
      return url;
    }).then(function(url) {
      request(url, function(error, response, body) {
        if (!error && res.statusCode === 200) {
          console.log(body);
          res.json(body);
        } else {
          console.error(error);
        }
      });
    })
  })
});

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
          // console.log(results);
          res.json(results);
          // res.json(JSON.parse(body).results[0].geometry.location);
        } else {
          console.error(error);
        }
      });
      // res.json(JSON.parse(body).results[0].geometry.location);
    } else {
      console.error(error);
    }
  });
});

app.listen(port);
console.log('Listening on port ' + port);
