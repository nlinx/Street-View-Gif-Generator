angular.module("main", ["ngResource"])
.controller('streetImageCtrl', function($scope, $http, factory) {
  angular.extend($scope, factory);
})
.factory('factory', function($http, $resource, $q, $rootScope) {
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

  // builds the gif and appends it onto the page
  var buildGif = function(images) {
    console.log("just got into the buildGif function");
    var gifWrapper = document.getElementById("gifWrapper");
    var index = 0;
    setInterval(function() { // need to figure out how to deal with submitting twice
      if (index === images.length) {
        index = 0;
      }
      var image = document.getElementById("gif")
      image.src = images[index].image;
      console.log(index)
      index++;
    }, 200)
    // gifshot.createGIF({
    //   'images': images,
    //   'gifWidth': 600,
    //   'gifHeight': 600,
    //   'numWorkers': 25
    // }, function(obj) {
    //   if (!obj.error) {
        // animatedImage = document.createElement('img');
        // animatedImage.src = obj.image;
        // animatedImage.id = "gif"
        // var gifWrapper = document.getElementById("gifWrapper")
        // console.log("about to append gif");
        // gifWrapper.replaceChild(animatedImage, gifWrapper.childNodes[0]);
    //   }
    // });
  }

  // builds the street view image url; returns a string
  var buildStreetUrl = function(lat, lng, heading, pitch, key) {
    var streetViewUrl = "http://maps.googleapis.com/maps/api/streetview?";
    var params = {
      width: 600,
      height: 600,
      heading: heading,
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

  var runOnce = function(func) {
    var alreadyCalled = false;
    var result;
    return function() {
      if(!alreadyCalled) {
        result = func.apply(this, arguments);
        alreadyCalled = true;
      }
      return result;
    }
  }

  // returns a promise route
  var buildRouteGif = function(origin, end) {
    origin = origin || '2540 College Ave Berkeley, CA 94704';
    end = end || '1512 Shattuck Ave Berkeley, CA 94709';
    var latLng = getLatLng(origin, end);
    var images = [];
    var scalar = 3;
    var gifFunction = runOnce(buildGif);
    latLng.then(function(data) {
      var directionsService = new google.maps.DirectionsService();
      var originLatLng = new google.maps.LatLng(data.origin.lat, data.origin.lng);
      var endLatLng = new google.maps.LatLng(data.end.lat, data.end.lng);
      var key = data.key;
      directionsService.route({
        origin: originLatLng,
        destination: endLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          var path = response.routes[0].overview_path;
          path.forEach(function(val, index) {
            getPanoramaInfo(val, index)
            .then(function(data) {
              var heading = data.heading;
              var pitch = data.pitch;
              var image = buildStreetUrl(data.location.A, data.location.F, heading, pitch, key);
              for (var i = 0; i < scalar; i++) {
                images.push({image: image, index: index});
              }
              if (images.length === path.length * scalar) {
                console.log("about to run the gif making function", images.length)
                images.sort(function(a,b) {
                  return a.index - b.index;
                })
                // var img = document.getElementById("gif")
                // if (img.src) {
                //   newImage = document.createElement('img');
                //   newImage.id = "gif"
                //   var gifWrapper = document.getElementById("gifWrapper")
                //   console.log("about to append gif");
                //   gifWrapper.replaceChild(newImage, gifWrapper.childNodes[0]);
                // }
                gifFunction(images);
              }
              return images;
            });
          })
        }
      });
  });
  }

  // gets panorama info so I don't have to calculate the heading and pitch
  // returns a promise with the heading, pitch, index, and location
  var getPanoramaInfo = function(location, index) {
    var deferred = $q.defer();
    var streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanoramaByLocation(location, 25, function(result, status) {
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

  return {
    buildGif: buildGif,
    buildStreetUrl: buildStreetUrl,
    getLatLng: getLatLng,
    buildRouteGif: buildRouteGif,
    getPanoramaInfo: getPanoramaInfo,
  }
})



// get origin and end address; convert them to latitudes and longitudes
// get route data
// get images in the route <
// make gif out of images <- make sprite animation
// add a map where a person icon follows the street view gif