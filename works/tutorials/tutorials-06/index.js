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

// WMTS 服务
var url = 'http://localhost:8011/geoserver/gwc/service/wmts?layer=bj:metro&style=train&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG:900913:{TileMatrix}&TileCol={TileCol}&TileRow={TileRow}';
var image = new Cesium.WebMapTileServiceImageryProvider({
  url: url
});
viewer.imageryLayers.addImageryProvider(image);

// TMS 服务
// var urlTemplateImageryProvider = new Cesium.UrlTemplateImageryProvider({
//   url : "http://localhost:8011/geoserver/gwc/service/tms/1.0.0/bj:metro@EPSG:900913@png/{z}/{x}/{reverseY}.png"
// });
// viewer.imageryLayers.addImageryProvider(urlTemplateImageryProvider);
