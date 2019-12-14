var viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  // selectionIndicator: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  creditContainer: null,
  // infoBox: false,
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

// poi图层控制显示/隐藏
function showBillboard(e, type) {
  poiDataSource[type].dataSource.show = e.checked;
}

// 构造数据对象
var poiDataSource = {

  // 数据类别：{对应的加载地址，icon显示的图片，icon的大小(相对于原始图片大小)}
  "4s": {url: "../../data/4s.geojson", pic: "../../images/4s.png", size: 0.5},
  "food": {url: "../../data/food.geojson", pic: "../../images/food.png", size: 0.5},
  "metro": {url: "../../data/metro.geojson", pic: "../../images/metro.png", size: 0.5},
  "station": {url: "../../data/station.geojson", pic: "../../images/station.png", size: 0.5},
  "supermarket": {url: "../../data/supermarket.geojson", pic: "../../images/supermarket.png", size: 0.5},
};


function loadJson() {
  var data = [
    {name: "门架名称1", id: "G18B1400135", lon: 116.33212434, lat: 40.04139569},
    {name: "门架名称2", id: "G18B1400136", lon: 117.33212434, lat: 41.04139569},
    {name: "门架名称3", id: "G18B1400137", lon: 116.33212434, lat: 42.04139569},
    {name: "门架名称4", id: "G18B1400138", lon: 115.33212434, lat: 43.04139569}
  ];
  var dataSource = new Cesium.CustomDataSource();
  dataSource.show = true;
  dataSource.clustering.enabled = true;
  dataSource.clustering.pixelRange = 100;
  dataSource.clustering.minimumClusterSize = 1;
  for (var i = 0; i < data.length; i++) {
    var entity = new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(data[i].lon, data[i].lat),
      billboard: {
        image: "../../images/4s.png",
        scale: 0.5
      }
    });
    dataSource.entities.add(entity);
  }
  viewer.dataSources.add(dataSource);
}

// 清除
function clear() {
  viewer.dataSources.removeAll();
}

// 直接用billboard添加所有的POI
function loadPoiDirectly() {
  clear();
  for (let key in poiDataSource) {
    // 遍历每一种poi分类
    let data = poiDataSource[key];
    // 使用GeoJsonDataSource接口进行加载
    Cesium.GeoJsonDataSource.load(data.url).then((dataSource) => {
      // 获取dataSource并绑定到数据对象中,用于poi图层控制显示/隐藏用
      data.dataSource = dataSource;
      // 根据页面上的控制状态设置（这里默认都不显示）
      dataSource.show = false;
      // 加载数据源到viewer中
      viewer.dataSources.add(dataSource).then(() => {
        var entities = dataSource.entities.values;
        for (var i = 0; i < entities.length; i++) {
          // 处理每个加载的entity,并设置billboard的image属性和scale属性
          var entity = entities[i];
          entity.billboard.image = data.pic;
          entity.billboard.scale = data.size;
        }
      });
    });
  }
}

// 使用群集来加载大量的POI
function loadLargePoiUseClustering() {
  clear();
  var pixelRange = 15; // 定义群集的屏幕像素尺寸(默认为80，自定义)
  var minimumClusterSize = 3; // 定义最少群集的个数(默认为2，自定义)
  var enabled = true; // 是否开启群集(默认不开启)

  for (let key in poiDataSource) {
    let data = poiDataSource[key];
    Cesium.GeoJsonDataSource.load(data.url).then((dataSource) => {
      data.dataSource = dataSource;
      dataSource.show = false;

      // 与直接加载的不同之处
      dataSource.clustering.enabled = enabled;
      dataSource.clustering.pixelRange = pixelRange;
      dataSource.clustering.minimumClusterSize = minimumClusterSize;

      // 使用PinBuilder来做群集的显示效果
      var pinBuilder = new Cesium.PinBuilder();

      // 定义分类（通过PinBuilder的方法函数fromText构造一个Canvas对象，可以转换为图片资源）
      var pin50 = pinBuilder.fromText('50+', Cesium.Color.RED, 48).toDataURL();
      var pin40 = pinBuilder.fromText('40+', Cesium.Color.ORANGE, 48).toDataURL();
      var pin30 = pinBuilder.fromText('30+', Cesium.Color.YELLOW, 48).toDataURL();
      var pin20 = pinBuilder.fromText('20+', Cesium.Color.GREEN, 48).toDataURL();
      var pin10 = pinBuilder.fromText('10+', Cesium.Color.BLUE, 48).toDataURL();

      // 定义在小于10大于3（这里的3是因为上面定义了最少群集的个数为3）
      var singleDigitPins = new Array(8);
      for (var i = 0; i < singleDigitPins.length; ++i) {
        singleDigitPins[i] = pinBuilder.fromText('' + (i + 2), Cesium.Color.VIOLET, 48).toDataURL();
      }

      // 定义相机在运动时，汇聚的动态改变事件
      dataSource.clustering.clusterEvent.addEventListener(function (entities, cluster) {

        // 不显示默认的label群集样式
        cluster.label.show = false;
        // 使用PinBuilder来做群集的显示效果
        cluster.billboard.show = true;

        // 根据汇聚的entity个数分类显示不同的图标
        if (entities.length >= 50) {
          cluster.billboard.image = pin50;
        } else if (entities.length >= 40) {
          cluster.billboard.image = pin40;
        } else if (entities.length >= 30) {
          cluster.billboard.image = pin30;
        } else if (entities.length >= 20) {
          cluster.billboard.image = pin20;
        } else if (entities.length >= 10) {
          cluster.billboard.image = pin10;
        } else {
          cluster.billboard.image = singleDigitPins[entities.length - 2];
        }
      });

      // 加载数据源
      viewer.dataSources.add(dataSource).then(() => {
        var entities = dataSource.entities.values;
        for (var i = 0; i < entities.length; i++) {
          var entity = entities[i];
          entity.billboard.image = data.pic;
          entity.billboard.scale = data.size;
        }
      });
    });
  }
}

// 自定义群集样式
function loadLargePoiUseClusteringSelfDefine() {
  clear();
  var minimumClusterSize = 5;
  var enabled = true;

  for (let key in poiDataSource) {
    let data = poiDataSource[key];
    Cesium.GeoJsonDataSource.load(data.url).then((dataSource) => {
      data.dataSource = dataSource;
      dataSource.show = false;
      dataSource.clustering.enabled = enabled;
      dataSource.clustering.minimumClusterSize = minimumClusterSize;
      dataSource.clustering.clusterEvent.addEventListener(function (entities, cluster) {

        cluster.label.show = false;
        cluster.billboard.show = true;
        cluster.billboard.scale = 0.3; // 统一设置一下自定义图片的大小

        // 配置自定义的汇聚图片
        if (entities.length >= 50) {
          cluster.billboard.image = "../../images/50.png";
        } else if (entities.length >= 40) {
          cluster.billboard.image = "../../images/40.png";
        } else if (entities.length >= 30) {
          cluster.billboard.image = "../../images/30.png";
        } else if (entities.length >= 20) {
          cluster.billboard.image = "../../images/20.png";
        } else if (entities.length >= 10) {
          cluster.billboard.image = "../../images/10.png";
        } else {
          cluster.billboard.image = "../../images/" + entities.length + ".png";
        }
      });

      viewer.dataSources.add(dataSource).then(() => {
        var entities = dataSource.entities.values;
        for (var i = 0; i < entities.length; i++) {
          var entity = entities[i];
          entity.billboard.image = data.pic;
          entity.billboard.scale = data.size;
        }
      });
    });
  }
}

