var viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true,
  animation: true,
  timeline: true,
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
  imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
    url: "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
  })
});

viewer.camera.setView({
  destination: new Cesium.Cartesian3(-2177490.048273732, 4390546.717502105, 4069796.05280667),
  orientation: {
    heading: 0.474606631055857,
    pitch: -0.44422761166134617,
    roll: 0.0016741921567087203
  }
});

var type = "cesium";

function selectType(name) {
  type = name;
}

// CESIUM使用的数据集合
var fireStationPointsOfCesium = [];
// TURF使用的数据集合
var fireStationPointsOfTurf = [];
for (var i = 0; i < data.length; i++) {
  fireStationPointsOfCesium.push(Cesium.Cartesian3.fromDegrees(+data[i].location.split(',')[0], +data[i].location.split(',')[1]));
  fireStationPointsOfTurf.push(turf.point([+data[i].location.split(',')[0], +data[i].location.split(',')[1]]));
}

for (var i = 0; i < data.length; i++) {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(+data[i].location.split(',')[0], +data[i].location.split(',')[1]),
    billboard: {
      image: '../../images/icon.png',
      scale: 0.5,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    },
    label: {
      font: "18px sans-serif",
      text: data[i].name,
      showBackground: true,
      scale: 0.6,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(20.0, -10.0)
    }
  })
}

// 模拟火灾发生地
var firePoint = new Cesium.Cartesian3(-2175206.1323744627, 4391857.0674818065, 4068066.5644894913);

// 模拟线路
var fireSampledPoints = [
  Cesium.Cartesian3.fromDegrees(116.348577, 39.868018),
  Cesium.Cartesian3.fromDegrees(116.348176, 39.897852),
  Cesium.Cartesian3.fromDegrees(116.356521, 39.898691),
  Cesium.Cartesian3.fromDegrees(116.356396, 39.907051),
  Cesium.Cartesian3.fromDegrees(116.435980, 39.908502),
  Cesium.Cartesian3.fromDegrees(116.434182, 39.933230),
  Cesium.Cartesian3.fromDegrees(116.408760, 39.933662),
  Cesium.Cartesian3.fromDegrees(116.407407, 39.968360)
];

// 火情模拟对象
var firePointEntity = null;

// 最近的点
var nearestPoint = new Cesium.Cartesian3(-2174737.328499536, 4390947.747206594, 4069290.7051094035);

function drawEntity() {
  viewer.entities.add({
    position: new Cesium.CallbackProperty(function () {
      return firePoint;
    }, false),
    ellipse: {
      semiMajorAxis: 100,
      semiMinorAxis: 100,
      material: Cesium.Color.ALICEBLUE.withAlpha(0.4)
    }
  });
  viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(function () {
        return [firePoint, nearestPoint];
      }, false),
      clampToGround: true,
      width: 5,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.YELLOW,
        dashLength: 10.0
      })
    }
  })
}

function rollbackRoute() {
  var start = Cesium.JulianDate.fromDate(new Date(), new Cesium.JulianDate()); // 开始时间
  var stop = Cesium.JulianDate.addSeconds(start, 180, new Cesium.JulianDate()); // 结束时间

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1;
  viewer.timeline.zoomTo(start, stop);

  function computeCircularTrack() {
    var property = new Cesium.SampledPositionProperty();
    for (var i = 0; i < fireSampledPoints.length; i++) {
      var time = Cesium.JulianDate.addSeconds(start, i * 180 / (fireSampledPoints.length - 1), new Cesium.JulianDate());
      var position = fireSampledPoints[i];
      property.addSample(time, position);
    }
    return property;
  }

  var position = computeCircularTrack();

  firePointEntity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: start,
      stop: stop
    })]),
    position: position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    point: {
      color: Cesium.Color.RED,
      pixelSize: 10
    },
    path: {
      show: true, // 显示轨迹
      resolution: 1,
      material: Cesium.Color.GREEN,
      width: 5
    }
  });

  // 指定轨迹插值算法
  firePointEntity.position.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.LinearApproximation
  });
}

function doAnimation() {
  rollbackRoute();
  drawEntity();
  viewer.clock.onTick.addEventListener(function () {
    firePoint = firePointEntity.position.getValue(viewer.clock.currentTime);

    if (type == "cesium") {
      nearestPoint = getNearestPointByCesium(firePoint, fireStationPointsOfCesium);
    } else if (type == "turf") {
      var carto = Cesium.Cartographic.fromCartesian(firePoint);
      var targetPoint = turf.point([Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]);
      var points = turf.featureCollection(fireStationPointsOfTurf);
      nearestPoint = getNearestPointByTurf(targetPoint, points);
    } else if (type == "grid") {
      var carto = Cesium.Cartographic.fromCartesian(firePoint);
      var targetPoint = [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
      nearestPoint = getNearestPointByGrid(targetPoint);
    }
  });
}


// 1、Cesium.js
function getNearestPointByCesium(point, points) {
  //============start time
  var start = new Date().getTime();
  //====================
  var maxLength = Number.MAX_VALUE, returnPoint = null;
  for (var i = 0; i < points.length; i++) {
    var distance = Cesium.Cartesian3.distance(point, points[i]);
    if (distance < maxLength) {
      maxLength = distance;
      returnPoint = points[i];
    }
  }
  //============end time
  var end = new Date().getTime();
  console.log("耗时 " + (end - start) + " ms");
  //====================
  return returnPoint;
}

// 2、turf.js
function getNearestPointByTurf(point, points) {
  //============start time
  var start = new Date().getTime();
  //====================
  var nearest = turf.nearestPoint(point, points);
  //============end time
  var end = new Date().getTime();
  console.log("耗时 " + (end - start) + " ms");
  //====================
  return Cesium.Cartesian3.fromDegrees(nearest.geometry.coordinates[0], nearest.geometry.coordinates[1]);
}

// 3、剖分预计算
// 首先，我们可以把整个城市的咖啡馆做一次“预处理”。比如，把一个城市分成若干个“格子(grid)”,
// 然后根据用户所在的位置把他放到某一个格子里，只对格子里的咖啡馆进行距离排序。
// 问题又来了，如果格子大小一样，那么绝大多数结果都可能出现在市中心的一个格子里，而郊区的格子里只有极少的结果。
// 在这种情况下，我们应该把市中心多分出几个格子。更进一步，格子应该是一个“树结构”，
// 最顶层是一个大格——整个城市，然后逐层下降，格子越来越小，
// 这样有利于用户进行精确搜索——如果在最底层的格子里搜索结果不多，用户可以逐级上升，放大搜索范围。

// 划分规则 剖分网格

// 归类

// 根据实际点计算所在那个网格内

// 在网格内计算

// 服务点很多，相对比较密集
// 矩形范围
var minLon = 116.20, minLat = 39.80, maxLon = 116.50, maxLat = 40.00;
// 矩形剖分大小
var pLon = 0.05, pLat = 0.05;
// 可视化
var instances = [];
for (var lon = minLon; lon <= maxLon; lon += pLon) {
  for (var lat = minLat; lat < maxLat; lat += pLat) {
    instances.push(new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(lon, lat, lon + pLon, lat + pLat),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({alpha: 0.5}))
      }
    }));
  }
}
viewer.scene.primitives.add(new Cesium.Primitive({
  geometryInstances: instances,
  appearance: new Cesium.PerInstanceColorAppearance()
}));

var width = Math.ceil(parseFloat(maxLon.sub(minLon)).div(pLon)); // 格子宽个数
var height = Math.ceil(parseFloat(maxLat.sub(minLat)).div(pLat)); // 格子高个数

var grid_data = {};

for (var i = 0; i < width; i++)
  for (var j = 0; j < height; j++) {
    grid_data["col_" + i + "_row_" + j] = [];
  }
for (var i = 0; i < data.length; i++) {

  var lon = +data[i].location.split(',')[0];
  var lat = +data[i].location.split(',')[1];

  var x = Math.ceil(parseFloat(lon.sub(minLon)).div(pLon)) - 1;
  var y = Math.ceil(parseFloat(lat.sub(minLat)).div(pLat)) - 1;

  grid_data["col_" + x + "_row_" + y].push(Cesium.Cartesian3.fromDegrees(+data[i].location.split(',')[0], +data[i].location.split(',')[1]));
}

function getNearestPointByGrid(point) {
  var x = Math.ceil(parseFloat(point[0].sub(minLon)).div(pLon)) - 1;
  var y = Math.ceil(parseFloat(point[1].sub(minLat)).div(pLat)) - 1;
  var points = grid_data["col_" + x + "_row_" + y];
  var targetPoint = Cesium.Cartesian3.fromDegrees(point[0], point[1]);
  if (points.length == 0){
    return targetPoint; // 返回自己，没有最有解
  }
  return getNearestPointByCesium(targetPoint, points);
}