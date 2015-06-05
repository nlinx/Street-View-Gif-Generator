angular.module("main", ["ngResource"])
.controller('streetImageCtrl', function($scope, $http, factory) {
  angular.extend($scope, factory);
})
.factory('factory', function($http, $resource, $q, $rootScope) {
  // var images = [];

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
      var params = {
        width: 400,
        height: 400,
        lat: data.lat,
        lng: data.lng,
        key: data.key
      }
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
    gifshot.createGIF({
      'images': images
    }, function(obj) {
      console.log("hi");
      console.log(obj);
    if (!obj.error) {
        var image = obj.image;
        animatedImage = document.createElement('img');
        animatedImage.src = image;
        console.log(animatedImage);
        document.getElementById("gif").appendChild(animatedImage);
    }
});
    // for (var i = 0; i < images.length; i++) {
    //   var image = images[i]
    //   animatedImage = document.createElement('img');
    //   animatedImage.src = image;
    //   document.getElementById("gif").appendChild(animatedImage);
    // }
      // gifshot.createGif({'images': images}, function(obj) {
      //   if(!obj.error) {
      //   }
      // });
}


var buildStreetUrl = function(lat, lng, heading, pitch, key) {
  var streetViewUrl = "http://maps.googleapis.com/maps/api/streetview?";
  var params = {
    width: 600,
    height: 600,
    heading: heading, // determine heading;
    pitch: pitch,
    lat: lat,
    lng: lng,
    key: key
  }
  streetViewUrl += "size=" + params.width + "x" + params.height;
  streetViewUrl += "&location=" + params.lat + "," + params.lng;
  streetViewUrl += "&heading=" + params.heading;
  streetViewUrl += "&pitch=" + params.pitch;
  streetViewUrl += "&key=" + params.key;
  return streetViewUrl;
}

  // returns a promise route
  var buildRoute = function(origin, end) {
    var latLng = getLatLng(origin, end);
    var images = [];
    return latLng.then(function(data) {
      var directionsService = new google.maps.DirectionsService();
      var originLatLng = new google.maps.LatLng(data.origin.lat, data.origin.lng);
      var endLatLng = new google.maps.LatLng(data.end.lat, data.end.lng);
      var key = data.key;
      return directionsService.route({
        origin: originLatLng,
        destination: endLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          var path = response.routes[0].overview_path;
          for (var i = 0; i < path.length; i++) {
            var lat = path[i].A;
            var lng = path[i].F;
            var location = new google.maps.LatLng(lat, lng);
            getPanoramaInfo(location, i).then(function(data) {
              var heading = data.heading;
              var pitch = data.pitch;
              var image = buildStreetUrl(data.location.A, data.location.F, heading, pitch, key);
              images.push({image: image, index: data.index});
              images.sort(function(a, b) {
                return a.index - b.index;
              });
              return images;
              // animatedImage = document.createElement('img');
              // animatedImage.src = image;
              // document.getElementById("gif").appendChild(animatedImage);
            }).then(function(data) {
              if (data.length === path.length - 1) {
                var gifImages = [];
                for (var i = 0; i < data.length; i++) {
                  gifImages.push(data[i].image);
                }
                buildGif(gifImages);
                // make gif out of data array;
                // for (var i = 0; i < data.length; i++) {
                //   var animatedImage = document.createElement('img');
                //   animatedImage.src = data[i].image;
                //   document.getElementById("gif").appendChild(animatedImage);
                // }
              }
            });
          }
          }
        });
    });
  }

  // gets panorama info so I don't have to calculate the heading and pitch
  var getPanoramaInfo = function(location, index) {
    var deferred = $q.defer();
    var streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanoramaByLocation(location, 50, function(result, status) {
      if (google.maps.StreetViewStatus.OK !== status) {
        deferred.reject({
          error: new Error('Unable to find location panorama'),
          status: status
        });
        return;
      }
      deferred.resolve({
        location: result.location.latLng,
        heading: result.tiles.centerHeading,
        pitch: result.tiles.originPitch,
        index: index
      });
    });
    return deferred.promise;
  }

  var test = function(origin ,end) {
    var holder = buildRoute(origin, end);
  }

  return {
    // images: images,
    buildGif: buildGif,
    buildStreetUrl: buildStreetUrl,
    buildStreetImage: buildStreetImage,
    getLatLng: getLatLng,
    buildRoute: buildRoute,
    getPanoramaInfo: getPanoramaInfo,
    test: test
  }
})



// get origin and end address; convert them to latitudes and longitudes
// get route data
// get images in the route <
// make gif out of images <- make sprite animation
// add a map where a person icon follows the street view gif