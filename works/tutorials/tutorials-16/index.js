Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMDVjODczYy1kMzkxLTQ1OGUtYjAwOS01MDRlN2QzOTExYTgiLCJpZCI6NTM3Mywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MzE5NzM1NH0.RqX0BJWiIngpnINQpX5S7-4Gb16v85X2PPl6DfnGvCw';

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

var defaultTerrainProvider = viewer.terrainProvider;

var terrainLayer = Cesium.createWorldTerrain({
  requestVertexNormals: true,
  requestWaterMask: true
});

viewer.camera.setView({
  destination: Cesium.Rectangle.fromDegrees(89.5, 20.4, 110.4, 61.2)
});

function func_draw() {
  fetch("../../data/sub.geojson").then(response => response.json()).then(data => {
    var instances = [];
    data.features.forEach(feature => {
      var coordinates = feature.geometry.coordinates[0];
      var c = coordinates.map(item => {
        return Cesium.Cartesian3.fromDegrees(item[0], item[1]);
      });
      var volume = new Cesium.PolylineVolumeGeometry({
        polylinePositions: c,
        // shapePositions: computeCircle(10.0) // 面太多了，内存就狂飙，直接崩溃
        shapePositions: [new Cesium.Cartesian2(-10, -10),
          new Cesium.Cartesian2(10, -10),
          new Cesium.Cartesian2(10, 10),
          new Cesium.Cartesian2(-10, 10)], // 四边形
      });
      var geometry = Cesium.PolylineVolumeGeometry.createGeometry(volume);
      var instance = new Cesium.GeometryInstance({
        geometry: geometry,
        id: Math.random().toString(),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA.withAlpha(0.5))
        }
      });
      instances.push(instance);
    });

    var primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance(),
      cull: false
    });
    viewer.scene.primitives.add(primitive);
  })
}

function func_model() {

  var url = "http://data.marsgis.cn/3dtiles/max-piping2/tileset.json";
  var tileset = new Cesium.Cesium3DTileset({
    url: url
  });
  viewer.scene.primitives.add(tileset);
  tileset.readyPromise.then(function(tileset) {
    viewer.zoomTo(tileset);
  });

}

function func_excavation() {

}

function func_depthTest() {
  viewer.scene.globe.depthTestAgainstTerrain = document.getElementById("depthTest").checked;
}

function func_enableTerrain(){
  viewer.terrainProvider = document.getElementById("terrain").checked ? terrainLayer : defaultTerrainProvider;
}


function computeCircle(radius) {
  var positions = [];
  for (var i = 0; i < 360; i++) {
    var radians = Cesium.Math.toRadians(i);
    positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
  }
  return positions;
}


var viewModel = {
  cullDept: 50
};
var positions = [];

Cesium.knockout.track(viewModel);
var toolBar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolBar);

function addPoint(position) {
  viewer.entities.add({
    position: position,
    point: {
      color: Cesium.Color.GREEN,
      pixelSize: 10,
      scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0),
      translucencyByDistance: new Cesium.NearFarScalar(500, 1.0, 2000, 0.0)
    }
  });
};

function addLine(positions) {

  var dynamicPositions = new Cesium.CallbackProperty(function () {
    return positions;
  }, false);
  viewer.entities.add({
    polyline: {
      positions: dynamicPositions,
      width: 4,
      material: Cesium.Color.RED,
      depthFailMaterial: Cesium.Color.RED
    }
  });
};

function addPolyGon(positions) {
  var dynamicPositions = new Cesium.CallbackProperty(function () {
    return new Cesium.PolygonHierarchy(positions);
  }, false);
  viewer.entities.add({
    polygon: {
      hierarchy: dynamicPositions,
      material: Cesium.Color.RED.withAlpha(0.4),
    }
  });
};


function getLngLat(position) {
  var cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(position), viewer.scene);
  var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  var lat = Cesium.Math.toDegrees(cartographic.latitude);
  var lon = Cesium.Math.toDegrees(cartographic.longitude);
  return Cesium.Cartesian3.fromDegrees(lon, lat);
}

function draw() {
  var screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  screenSpaceEventHandler.setInputAction(function (clickEvent) {
    var point = getLngLat(clickEvent.position);
    positions.push(point);
    addPoint(point);
    if (positions.length == 2) {
      addLine(positions);
    } else if (positions.length == 3) {
      addPolyGon(positions);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  screenSpaceEventHandler.setInputAction(function (clickEvent) {
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    cull(positions);
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

function cull() {
  if (positions.length < 3) {
    window.alert("多边形至少需要3个点");
    return false;
  }
  var points = [];
  Object.assign(points, positions);
  if (judgeClockWise(points)) {
    points = points.reverse();
  }

  if (convex(points, points.length) != 1) {
    window.alert("多边形需要绘制凸多边形");
    return false;
  }

  var pointsLength = points.length;
  var clippingPlanes = [];
  for (var i = 0; i < pointsLength; ++i) {
    var nextIndex = (i + 1) % pointsLength;
    var midpoint = Cesium.Cartesian3.add(points[i], points[nextIndex], new Cesium.Cartesian3());
    midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);
    var up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
    var right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
    right = Cesium.Cartesian3.normalize(right, right);
    var normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
    normal = Cesium.Cartesian3.normalize(normal, normal);
    var originCenteredPlane = new Cesium.Plane(normal, 0.0);
    var distance = Cesium.Plane.getPointDistance(originCenteredPlane, midpoint);
    clippingPlanes.push(new Cesium.ClippingPlane(normal, distance));
  }
  viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
    planes: clippingPlanes,
    edgeWidth: 1.0,
    edgeColor: Cesium.Color.WHITE
  });

  points.push(points[0]);

  var maximumHeights = [];
  for (var i = 0; i < points.length; i++) {
    maximumHeights.push(0.01);
  }
  viewer.entities.add({
    wall: {
      positions: points,
      material: new Cesium.ImageMaterialProperty({
        image: "./ce.jpg",
        repeat: new Cesium.Cartesian2(points.length, 1.0)
      }),
      maximumHeights: maximumHeights,
      minimumHeights: new Cesium.CallbackProperty(function () {
        var minimumHeights = [];
        for (var i = 0; i < points.length; i++) {
          minimumHeights.push(-viewModel.cullDept);
        }
        return minimumHeights;
      }, false),
    }
  });

  viewer.entities.add({
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(points),
      material: new Cesium.ImageMaterialProperty({
        image: "./di.jpg",
        repeat: new Cesium.Cartesian2(points.length / 2, points.length / 2)
      }),
      closeTop: false,
      height: new Cesium.CallbackProperty(function () {
        return -viewModel.cullDept;
      }, false)
    }
  })
}

function reset() {
  viewer.scene.globe.clippingPlanes = undefined;
  viewer.entities.removeAll();
  positions = [];
}

function judgeClockWise() {
  var pointsC = [];
  Object.assign(pointsC, positions);
  pointsC.push(pointsC[0]);
  var s = 0;
  for (var i = 0; i < pointsC.length - 1; i++) {
    s += pointsC[i].x * pointsC[i + 1].y - pointsC[i + 1].x * pointsC[i].y;
  }
  return s < 0;
}

function convex(p, n) {
  var j, k, z;
  var flag = 0;
  if (n < 3) {
    return 0;
  }
  for (var i = 0; i < n; i++) {
    j = (i + 1) % n;
    k = (i + 2) % n;
    z = (p[j].x - p[i].x) * (p[k].y - p[j].y);
    z -= (p[j].y - p[i].y) * (p[k].x - p[j].x);
    if (z < 0) {
      flag |= 1;
    } else if (z > 0) {
      flag |= 2;
    }
    if (flag == 3) {
      return -1;
    }
  }
  if (flag != 0) {
    return 1;
  } else {
    return 0;
  }
}

