var request = require('request');


module.exports = {

  buildImages: function(address) {

  },
  toLatLong: function(address) {
    var geoURL = "https://maps.googleapis.com/maps/api/geocode/json?"; // hide key when you can
    address = address.split(" ").join("+");
    geoURL += "address=" + address;
    geoURL += "&key=AIzaSyCJoNxV951S3qeOsKPf0_t1wkPTINXSj0I"
  }
}