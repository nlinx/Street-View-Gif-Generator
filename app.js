angular.module("main", ["ngResource"])
.controller('streetImageCtrl', function($scope, $http, factory) {
  angular.extend($scope, factory);
})
.factory('factory', function($http, $resource, $q, $rootScope) {
  var images = [];

  // don't touch this
  // returns a promise with the origin and end latlngs and the api key
  var getLatLng = function(origin, end) {
    return $http({
      method: 'GET',
      url: '/api/latLng',
      params: {
        origin: origin,
        end: end
      }
    })
    .then(function(res) {
      return res.data
    }, function(error) {
      console.log('error in getLatLng');
    })
  }

  // intakes an address string;
  // returns a streetViewURL string promise
  var buildStreetUrl = function(address) {
    var address = address || '611 Mission St, San Francisco, CA';
    var streetViewUrl = "http://maps.googleapis.com/maps/api/streetview?";
    return getLatLng(address).then(function(data) {
      // console.log("data: ", data)
      var params = {
        width: 400,
        height: 400,
        lat: data.lat,
        lng: data.lng,
        key: data.key
      }
      // console.log(params)
      streetViewUrl += "size=" + params.width + "x" + params.height;
      streetViewUrl += "&location=" + params.lat + "," + params.lng;
      streetViewUrl += "&key=" + params.key;
      return streetViewUrl;
    })
  }

  // var buildRoute = function(origin, end) {
  //   var LatLng = getLatLng(origin, end);
  //   return $http({
  //     method: 'GET',
  //     url: '/api/route',
  //     params: {
  //       data: latLng
  //     }
  //   })
  //   .then(function(res) {
  //     return res.data;
  //   }, function(error) {
  //     console.log('error in buildRoute');
  //   })
  // }

  // do i even need this? won't the url be enough?
  // intakes an address string
  // pushes image html elements into the images array
  var buildStreetImage = function(address) {
    var streetViewUrl = buildStreetUrl(address);
    return streetViewUrl.then(function(url) {
      return $http({
        method: 'GET',
        url: '/api/images',
        params: {url: url}
      })
      .then(function(res) {
        return res.data
      }, function(error) {
        console.log('error in buildStreetImage');
      })
    })
  }

  // don't touch this
  var buildGif = function(images) {
    for (var i = 0; i < images.length; i++) {
      var image = images[i]
      animatedImage = document.createElement('img');
      animatedImage.src = image;
      document.getElementById("gif").appendChild(animatedImage);
    }
      // gifshot.createGif({'images': images}, function(obj) {
      //   if(!obj.error) {
      //   }
      // });
}


var buildStreetUrl = function(lat, lng, key) {
  var streetViewUrl = "http://maps.googleapis.com/maps/api/streetview?";
  var params = {
    width: 600,
    height: 600,
    heading: 0, // determine heading;
    lat: lat,
    lng: lng,
    key: key
  }
  streetViewUrl += "size=" + params.width + "x" + params.height;
  streetViewUrl += "&heading=" + params.heading;
  streetViewUrl += "&location=" + params.lat + "," + params.lng;
  streetViewUrl += "&key=" + params.key;
  return streetViewUrl;
}

  // returns a promise route
  var buildRoute = function(origin, end) {
    var latLng = getLatLng(origin, end);
    return latLng.then(function(data) {
      var directionsService = new google.maps.DirectionsService();
      return directionsService.route({
        origin: new google.maps.LatLng(data.origin.lat, data.origin.lng),
        destination: new google.maps.LatLng(data.end.lat, data.end.lng),
        travelMode: google.maps.TravelMode.DRIVING
      }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          var path = response.routes[0].overview_path;
          for (var i = 0; i < path.length; i++) {
            images.push(buildStreetUrl(path[i].A, path[i].F, data.key));
            var image = images[i]
            animatedImage = document.createElement('img');
            animatedImage.src = image;
            document.getElementById("gif").appendChild(animatedImage);
          }
            // build Gif out of images array and append to "#gif"
        }
      });
    });
  }

  var test = function(origin ,end) {
    var holder = buildRoute(origin, end);
  }

  return {
    images: images,
    buildGif: buildGif,
    buildStreetUrl: buildStreetUrl,
    buildStreetImage: buildStreetImage,
    getLatLng: getLatLng,
    buildRoute: buildRoute,
    test: test
  }
})



// get origin and end address; convert them to latitudes and longitudes
// get route data
// get images in the route <
// make gif out of images <- make sprite animation
// add a map where a person icon follows the street view gif