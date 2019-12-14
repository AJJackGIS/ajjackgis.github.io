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
    url: "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
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

var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
  url: "http://localhost:90/beijing_building/tileset.json"
}));

function reset() {
  viewer.dataSources.removeAll();
  viewer.entities.removeAll();
}

// 默认样式
function func_1() {
  var style = {};
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

// 纯色
function func_2() {
  var style = {
    color: "rgba(255,0,0,1)"
  };
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

// 透明
function func_3() {
  var style = {
    color: "rgba(0,0,255,0.2)"
  };
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

// 建筑高度
function func_4() {
  var style = {
    color: {
      conditions: [
        ["${height} >= 300", "rgba(45, 0, 75, 0.5)"],
        ["${height} >= 200", "rgba(102, 71, 151,0.5)"],
        ["${height} >= 100", "rgba(170, 162, 204,0.5)"],
        ["${height} >= 50", "rgba(224, 226, 238,0.5)"],
        ["${height} >= 25", "rgba(252, 230, 200,0.5)"],
        ["${height} >= 10", "rgba(248, 176, 87,0.5)"],
        ["${height} >= 5", "rgba(198, 106, 11,0.5)"],
        ["true", "rgba(127, 59, 8,0.5)"]
      ]
    }
  };
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

// 经度
function func_5() {
  var style = {
    color: {
      conditions: [
        ["${lng} >= 117.004261", "rgba(106,2,0, 0.5)"],
        ["${lng} >= 116.724998", "rgba(154,47,3,0.5)"],
        ["${lng} >= 116.511400", "rgba(180,97,22,0.5)"],
        ["${lng} >= 116.362656", "rgba(224,143,42,0.5)"],
        ["${lng} >= 116.281208", "rgba(249,177,55,0.5)"],
        ["${lng} >= 116.204001", "rgba(254,200,89,0.5)"],
        ["${lng} >= 116.070695", "rgba(254,227,95,0.5)"],
        ["true", "rgba(254,255,129,0.5)"]
      ]
    }
  };
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}

// 纬度
function func_6() {
  var style = {
    color: {
      conditions: [
        ["${lat} >= 40.508805", "rgba(106,2,0, 0.5)"],
        ["${lat} >= 40.340081", "rgba(154,47,3,0.5)"],
        ["${lat} >= 40.270650", "rgba(180,97,22,0.5)"],
        ["${lat} >= 40.235599", "rgba(224,143,42,0.5)"],
        ["${lat} >= 40.211809", "rgba(249,177,55,0.5)"],
        ["${lat} >= 40.188265", "rgba(254,200,89,0.5)"],
        ["${lat} >= 40.169140", "rgba(254,227,95,0.5)"],
        ["true", "rgba(254,255,129,0.5)"]
      ]
    }
  };
  tileset.style = new Cesium.Cesium3DTileStyle(style);
}