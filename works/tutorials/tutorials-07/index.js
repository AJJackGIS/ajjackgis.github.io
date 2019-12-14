var viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  selectionIndicator: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  creditContainer: null,
  infoBox: false,
  navigationHelpButton: false,
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: "http://www.google.cn/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}"
  })
});

viewer.imageryLayers.addImageryProvider(
  new Cesium.UrlTemplateImageryProvider({
    url: "http://t{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=9654e6de15fb2eb4aeb02a4191d9a712",
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7']
  })
);

viewer.camera.setView({
  destination: new Cesium.Cartesian3(-2177490.048273732, 4390546.717502105, 4069796.05280667),
  orientation: {
    heading: 0.474606631055857,
    pitch: -0.44422761166134617,
    roll: 0.0016741921567087203
  }
});

var startPoint = null;
var endPoint = null;

var startMarker = null;
var endMarker = null;

var dataSource = "baidu"; // 默认
var method = "driving"; // 默认

var pathEntity = null; // 路径

// 每种途径的url(只返回一条记录即可)
var routes = {
  "baidu": {
    "transit": "http://api.map.baidu.com/direction/v2/transit?origin={start}&destination={end}&coord_type=wgs84&page_size=1&ak=fEDcRKPxLwIkOamOx4trAivKm8TbaWHK",
    "driving": "http://api.map.baidu.com/direction/v2/driving?origin={start}&destination={end}&coord_type=wgs84&page_size=1&ak=fEDcRKPxLwIkOamOx4trAivKm8TbaWHK",
    "riding": "http://api.map.baidu.com/direction/v2/riding?origin={start}&destination={end}&coord_type=wgs84&page_size=1&ak=fEDcRKPxLwIkOamOx4trAivKm8TbaWHK"
  },
  "gaode": {
    "transit": "https://restapi.amap.com/v3/direction/transit/integrated?origin={start}&destination={end}&city=010&key=36368c04f9fed752c806765be07d385a",
    "driving": "https://restapi.amap.com/v3/direction/driving?origin={start}&destination={end}&key=36368c04f9fed752c806765be07d385a",
    "riding": "https://restapi.amap.com/v4/direction/bicycling?origin={start}&destination={end}&key=36368c04f9fed752c806765be07d385a"
  },
  "tengxun": {
    "transit": "https://apis.map.qq.com/ws/direction/v1/transit/?from={start}&to={end}&key=PEHBZ-U3VHG-NKCQJ-IAOXJ-TU4QQ-DOFYF&output=jsonp&callback=cb",
    "driving": "https://apis.map.qq.com/ws/direction/v1/driving/?from={start}&to={end}&key=PEHBZ-U3VHG-NKCQJ-IAOXJ-TU4QQ-DOFYF&output=jsonp&callback=cb",
    "riding": "https://apis.map.qq.com/ws/direction/v1/bicycling/?from={start}&to={end}&key=PEHBZ-U3VHG-NKCQJ-IAOXJ-TU4QQ-DOFYF&output=jsonp&callback=cb"
  }
};

function getPickPosition(callback) {
  // 注册点击事件
  viewer.screenSpaceEventHandler.setInputAction((clickEvent) => {
    // 拾取坐标点
    var position = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);
    position = Cesium.Cartographic.fromCartesian(position);
    // 转换为经纬度
    position = Cesium.Math.toDegrees(position.longitude) + "," + Cesium.Math.toDegrees(position.latitude);
    // 取消点击事件
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // 执行回调,返回position
    callback(position);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function addPositionMarker(position, imageUrl) {
  return viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(parseFloat(position.split(',')[0]), parseFloat(position.split(',')[1])),
    billboard: {
      image: imageUrl,
      scale: 0.5,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });
}

function setStartLocation() {
  getPickPosition((position) => {
    startPoint = position;
    if (startMarker != null) {
      viewer.entities.remove(startMarker);
    }
    startMarker = addPositionMarker(position, '../../images/start.png');
  });
}

function setEndLocation() {
  getPickPosition((position) => {
    endPoint = position;
    if (endMarker != null) {
      viewer.entities.remove(endMarker);
    }
    endMarker = addPositionMarker(position, '../../images/end.png');
  });
}

function setDataSource(type) {
  dataSource = type;
}

function setMethod(type) {
  method = type;
}

function formatPath(path) {
  var positions = [];
  var pathes = path.split(";");
  for (var i = 0; i < pathes.length; i++) {
    var lon = parseFloat(pathes[i].split(",")[0]);
    var lat = parseFloat(pathes[i].split(",")[1]);
    if (dataSource == "baidu") {
      var g = coordinateTransform.bd09togcj02(lon, lat);
      var w = coordinateTransform.gcj02towgs84(g[0], g[1]);
      positions.push(Cesium.Cartesian3.fromDegrees(w[0], w[1]));
    } else if (dataSource == "gaode" || dataSource == "tengxun") {
      var w = coordinateTransform.gcj02towgs84(lon, lat);
      positions.push(Cesium.Cartesian3.fromDegrees(w[0], w[1]));
    }
  }
  return positions;
}

function analyzeResponseB(data) {
  var allPath = "";
  var all_road_name = "";

  if (method == "driving" || method == "riding") {
    var steps = data.result.routes[0].steps;
    for (var i = 0; i < steps.length; i++) {
      var path = steps[i].path;
      allPath += path + ";";
      all_road_name += "<li>" + steps[i].road_name + "</li>";
    }
  } else if (method == "transit") {
    var steps = data.result.routes[0].steps;
    for (var i = 0; i < steps.length; i++) {
      var path = steps[i][0].path;
      allPath += path + ";";
      all_road_name += "<li>" + steps[i][0].instructions + "</li>";
    }
  }
  viewer.entities.remove(pathEntity);
  $(".routeInfo ol").html(all_road_name);

  pathEntity = viewer.entities.add({
    polyline: {
      positions: formatPath(allPath.substring(0, allPath.length - 1)),
      width: 5,
      material: Cesium.Color.GREEN.withAlpha(0.8),
      depthFailMaterial: Cesium.Color.GREEN.withAlpha(0.8)
    }
  });
}

function analyzeResponseA(data) {
  var allPath = "";
  var all_road_name = "";

  if (method == "driving") {
    var steps = data.route.paths[0].steps;
    for (var i = 0; i < steps.length; i++) {
      var path = steps[i].polyline;
      allPath += path + ";";
      all_road_name += "<li>" + steps[i].instruction + "</li>";
    }
  } else if (method == "riding") {
    var steps = data.data.paths[0].steps;
    for (var i = 0; i < steps.length; i++) {
      var path = steps[i].polyline;
      allPath += path + ";";
      all_road_name += "<li>" + steps[i].instruction + "</li>";
    }
  } else if (method == "transit") {
    var transits = data.route.transits;

    // 按照权重进行筛选
    // 价格：cost
    var cost = Math.min.apply(Math, transits.map(function (o) {
      return o.cost
    }));
    // // 时间：duration
    // var duration = Math.min.apply(Math, transits.map(function(o) {return o.duration}));
    // // 距离：distance
    // var distance = Math.min.apply(Math, transits.map(function(o) {return o.distance}));
    // // 步行：walking_distance
    // var walking_distance = Math.min.apply(Math, transits.map(function(o) {return o.walking_distance}));

    var steps = transits.filter(item => item.cost = cost)[0].segments;

    for (var i = 0; i < steps.length; i++) {
      var walking = steps[i].walking.steps;
      if (walking != undefined && walking.length > 0) {
        for (var k = 0; k < walking.length; k++) {
          var path = walking[k].polyline;
          allPath += path + ";";
          all_road_name += "<li>" + walking[k].instruction + "</li>";
        }
      }
      var bus = steps[i].bus.buslines;
      if (bus != undefined && bus.length > 0) {
        for (var k = 0; k < bus.length; k++) {
          var path = bus[k].polyline;
          allPath += path + ";";
          all_road_name += "<li>" + bus[k].name + "</li>";
        }
      }
    }
  }
  viewer.entities.remove(pathEntity);
  $(".routeInfo ol").html(all_road_name);
  pathEntity = viewer.entities.add({
    polyline: {
      positions: formatPath(allPath.substring(0, allPath.length - 1)),
      width: 5,
      material: Cesium.Color.GREEN.withAlpha(0.8),
      depthFailMaterial: Cesium.Color.GREEN.withAlpha(0.8)
    }
  });
}

function analyzeResponseT(data) {
  var allPath = "";
  var all_road_name = "";

  if (method == "driving" || method == "riding") {
    var path = data.result.routes[0].polyline;
    for (var i = 2; i < path.length; i++) {
      path[i] = path[i - 2] + path[i] / 1000000
    }
    for (var i = 0; i < path.length; i = i + 2) {
      allPath += path[i + 1] + "," + path[i] + ";";
    }
    var steps = data.result.routes[0].steps;
    for (var i = 0; i < steps.length; i++) {
      all_road_name += "<li>" + steps[i].instruction + "</li>";
    }
  } else if (method == "transit") {
    var transits = data.result.routes;

    // 按照权重进行筛选
    // 时间：duration
    var duration = Math.min.apply(Math, transits.map(function (o) {
      return o.duration
    }));
    // // 距离：distance
    // var distance = Math.min.apply(Math, transits.map(function(o) {return o.distance}));
    // // 步行：walking_distance
    // var walking_distance = Math.min.apply(Math, transits.map(function(o) {return o.walking_distance}));

    var steps = transits.filter(item => item.duration = duration)[0].steps;

    for (var i = 0; i < steps.length; i++) {
      if (steps[i].mode == "WALKING") {
        var path = steps[i].polyline;
        if (path != undefined && path.length > 0) {
          for (var k = 2; k < path.length; k++) {
            path[k] = path[k - 2] + path[k] / 1000000
          }
          for (var k = 0; k < path.length; k = k + 2) {
            allPath += path[k + 1] + "," + path[k] + ";";
          }
        }

        var walking = steps[i].steps;
        if (walking != undefined && walking.length > 0) {
          for (var k = 0; k < walking.length; k++) {
            all_road_name += "<li>" + walking[k].instruction + "</li>";
          }
        }
      } else if (steps[i].mode == "TRANSIT") {
        var lines = steps[i].lines;
        if (lines != undefined && lines.length > 0) {
          for (var k = 0; k < lines.length; k++) {
            var path = lines[k].polyline;
            for (var j = 2; j < path.length; j++) {
              path[j] = path[j - 2] + path[j] / 1000000
            }
            for (var j = 0; j < path.length; j = j + 2) {
              allPath += path[j + 1] + "," + path[j] + ";";
            }
            all_road_name += "<li>" + lines[k].title + "</li>";
          }
        }
      }
    }
  }

  viewer.entities.remove(pathEntity);
  $(".routeInfo ol").html(all_road_name);
  pathEntity = viewer.entities.add({
    polyline: {
      positions: formatPath(allPath.substring(0, allPath.length - 1)),
      width: 5,
      material: Cesium.Color.GREEN.withAlpha(0.8),
      depthFailMaterial: Cesium.Color.GREEN.withAlpha(0.8)
    }
  });
}

function startNavigate() {
  if (dataSource == "baidu") {
    // 调整坐标方向
    var startPointInverse = startPoint.split(",").reverse().join(",");
    var endPointInverse = endPoint.split(",").reverse().join(",");
    var url = routes[dataSource][method].replace("{start}", startPointInverse).replace("{end}", endPointInverse);
    Cesium.Resource.fetchJsonp({
      url: url
    }).then(data => {
      analyzeResponseB(data);
    })
  } else if (dataSource == "gaode") {
    var startPointA = startPoint.split(",");
    var endPointA = endPoint.split(",");
    var w = coordinateTransform.wgs84togcj02(startPointA[0], startPointA[1]);
    var g = coordinateTransform.wgs84togcj02(endPointA[0], endPointA[1]);
    var url = routes[dataSource][method].replace("{start}", w[0] + "," + w[1]).replace("{end}", g[0] + "," + g[1]);
    Cesium.Resource.fetchJsonp({
      url: url
    }).then(data => {
      analyzeResponseA(data);
    })
  } else if (dataSource == "tengxun") {
    var startPointA = startPoint.split(",");
    var endPointA = endPoint.split(",");
    var w = coordinateTransform.wgs84togcj02(startPointA[0], startPointA[1]);
    var g = coordinateTransform.wgs84togcj02(endPointA[0], endPointA[1]);

    // 调整坐标方向
    var startPointInverse = w.reverse().join(",");
    var endPointInverse = g.reverse().join(",");
    var url = routes[dataSource][method].replace("{start}", startPointInverse).replace("{end}", endPointInverse);
    Cesium.Resource.fetchJsonp({
      url: url
    }).then(data => {
      analyzeResponseT(data);
    })
  }
}
