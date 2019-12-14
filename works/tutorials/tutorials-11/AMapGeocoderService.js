/**
 * 高德POI定位搜索（根据GeocoderService定义的接口结构）
 * @constructor
 */
function AMapGeocoderService(options) {
  if (Cesium.defined(options) && Cesium.defined(options.key)) {
    this.key = options.key;
  } else {
    console.log("key can not be empty...");
  }
}

AMapGeocoderService.prototype.geocode = function (input) {
  var endpoint = 'https://restapi.amap.com/v3/place/text?';
  var query = 'keywords=' + input;
  query += "&city=beijing";
  query += "&output=json";
  query += "&key=" + this.key;
  var requestString = endpoint + query;
  return Cesium.Resource.fetchJsonp({url: requestString}).then(function (results) {
    return results.pois.map(function (resultObject) {
      return {
        displayName: resultObject.name + "-" + resultObject.address,
        destination: Cesium.Cartesian3.fromDegrees(
          +resultObject.location.split(',')[0],
          +resultObject.location.split(',')[1]
        )
      };
    });
  });
};