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
    url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c', 'd', 'e'],
  }),
});

viewer.camera.setView({
  destination: Cesium.Rectangle.fromDegrees(89.5, 20.4, 110.4, 61.2)
});

var ymax = 100;
var ymin = 0;

var geoData = [];

var dataSet = null;

changePopular();


function changePopular() {
  var xmax = Math.max.apply(Math, popular.map(function (o) {
    return o.popular
  }));
  var xmin = Math.min.apply(Math, popular.map(function (o) {
    return o.popular
  }));
  geoData = [];
  popular.forEach(pop => {
    var cityCenter = mapv.utilCityCenter.getCenterByCityName(pop.city);
    geoData.push({
      geometry: {
        type: 'Point',
        coordinates: [cityCenter.lng, cityCenter.lat]
      },
      count: ymin + (ymax - ymin) / (xmax - xmin) * (pop.popular - xmin), // 将数据归一化映射到任一区间
      // count: pop.popular, // 原始数据
      text: pop.city + ":" + pop.popular.toString()
    });
  });
  dataSet = new mapv.DataSet(geoData);
}

function changePrice() {
  var xmax = Math.max.apply(Math, price.map(function (o) {
    return o.price
  }));
  var xmin = Math.min.apply(Math, price.map(function (o) {
    return o.price
  }));
  geoData = [];
  price.forEach(pop => {
    geoData.push({
      geometry: {
        type: 'Point',
        coordinates: [pop.px, pop.py]
      },
      count: ymin + (ymax - ymin) / (xmax - xmin) * (pop.price - xmin), // 将数据归一化映射到任一区间
      // count: pop.popular, // 原始数据
      text: pop.name + ":" + pop.price.toString()
    });
  });
  dataSet = new mapv.DataSet(geoData);
}


var mapvLayer = null;

/**
 * 简单图
 */
function createSimple() {
  var options = {
    fillStyle: 'rgba(255, 50, 50, 0.6)',
    shadowColor: 'rgba(255, 50, 50, 1)',
    shadowBlur: 30,
    globalCompositeOperation: 'lighter',
    size: 10,
    draw: 'simple'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 分类图
 */
function createCategory() {
  var options = {
    splitList: [
      {start: 0, end: 20, value: '#ffffff'},
      {start: 20, end: 40, value: '#00ff00'},
      {start: 40, end: 60, value: '#0000ff'},
      {start: 60, end: 80, value: '#ff0000'},
      {start: 80, end: 100, value: '#aa33aa'}
    ],
    size: 10,
    max: 100,
    draw: 'choropleth'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 密度图
 */
function createIntensity() {
  var options = {
    gradient: {0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
    size: 10,
    max: 100,
    draw: 'intensity'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 热力图
 */
function createHeatMap() {
  var options = {
    size: 50,
    gradient: {0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
    max: 100,
    draw: 'heatmap'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 蜂窝图
 */
function createHoneycomb() {
  var options = {
    fillStyle: 'rgba(55, 50, 250, 0.8)',
    shadowColor: 'rgba(255, 250, 50, 1)',
    shadowBlur: 20,
    max: 100,
    size: 50,
    label: {
      show: true,
      fillStyle: 'white',
      // shadowColor: 'yellow',
      // font: '20px Arial',
      // shadowBlur: 10,
    },
    globalAlpha: 0.5,
    gradient: {0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
    draw: 'honeycomb'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 网格图
 */
function createGrid() {
  var options = {
    fillStyle: 'rgba(55, 50, 250, 0.8)',
    shadowColor: 'rgba(255, 250, 50, 1)',
    shadowBlur: 20,
    max: 100,
    size: 40,
    globalAlpha: 0.5,
    label: {
      show: true,
      fillStyle: 'white',
      // shadowColor: 'yellow',
      // font: '20px Arial',
      // shadowBlur: 10,
    },
    gradient: {0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
    draw: 'grid'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 气泡图
 */
function createBubble() {
  var options = {
    fillStyle: 'rgba(255, 50, 50, 0.6)',
    maxSize: 20,
    max: 100,
    draw: 'bubble'
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

/**
 * 文字图
 */
function createText() {
  var options = {
    draw: 'text',
    fillStyle: 'yellow',
    textAlign: 'center',
    shadowBlur: 10,
    size: 12,
    avoid: true, // 开启文本标注避让
    textBaseline: 'middle',
    offset: { // 文本便宜值
      x: 0,
      y: 0
    }
  };

  if (mapvLayer) {
    mapvLayer.remove();
  }
  mapvLayer = mapv.cesiumMapLayer(viewer, dataSet, options);
}

