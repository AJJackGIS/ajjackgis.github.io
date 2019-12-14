var viewer = new Cesium.Viewer("cesiumContainer", {
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

var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
  url: "http://localhost:90/beijing_building/tileset.json"
}));

var routeList = [];


viewer.entities.add({
  polyline: {
    positions: new Cesium.CallbackProperty(function () {
      return routeList;
    }, false),
    width: 5,
    material: Cesium.Color.RED,
    depthFailMaterial: Cesium.Color.RED,
    clampToGround: true
  }
});

function collectPoint(position) {
  var cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(position), viewer.scene);
  routeList.push(cartesian); // 存储每次踩点的位置
}

function defineRoute() {
  viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
    collectPoint(clickEvent.position);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewer.screenSpaceEventHandler.setInputAction(function (moveEvent) {
    if (routeList.length >= 2) {
      routeList.pop();
      collectPoint(moveEvent.endPosition);
    } else if (routeList.length == 1) {
      collectPoint(moveEvent.endPosition);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  viewer.screenSpaceEventHandler.setInputAction(function (clickEvent) {
    routeList.pop();
    collectPoint(clickEvent.position);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

var entityFly = null;

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
    for (var i = 0; i < routeList.length; i++) {
      var time = Cesium.JulianDate.addSeconds(start, i * 180 / (routeList.length - 1), new Cesium.JulianDate());
      var position = routeList[i];
      property.addSample(time, position);
    }
    return property;
  }

  var position = computeCircularTrack();

  entityFly = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: start,
      stop: stop
    })]),
    position: position,
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: '../../data/car.glb', // 加载模型
      minimumPixelSize: 128 // 指定模型大小
    },
    path: {
      show: false, // 显示轨迹
      resolution: 1,
      material: Cesium.Color.GREEN,
      width: 5
    }
  });

  // 指定轨迹插值算法
  entityFly.position.setInterpolationOptions({
    interpolationDegree: 1,
    interpolationAlgorithm: Cesium.LinearApproximation
  });

  viewer.trackedEntity = entityFly;
}

function track() {
  var center = entityFly.position.getValue(viewer.clock.currentTime);
  var orientation = entityFly.orientation.getValue(viewer.clock.currentTime);
  var transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  transform = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(orientation), center);
  viewer.camera.lookAtTransform(transform, new Cesium.Cartesian3(-100.0, 0, 50));
}

function changeView() {
  if (viewer.trackedEntity == null) {
    viewer.clock.onTick.removeEventListener(track);
    viewer.trackedEntity = entityFly;
  } else {
    viewer.clock.onTick.addEventListener(track);
    viewer.trackedEntity = null;
  }
}

function clearRoute() {
  routeList = [];
  viewer.entities.remove(entityFly);
}