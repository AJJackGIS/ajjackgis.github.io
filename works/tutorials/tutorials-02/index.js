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
  destination: Cesium.Rectangle.fromDegrees(89.5, 20.4, 110.4, 61.2)
});

function reset() {
  viewer.dataSources.removeAll();
  viewer.entities.removeAll();
}

// 默认样式
function func_1() {
  reset();
  viewer.dataSources.add(
    Cesium.GeoJsonDataSource.load("../../data/beijing.geojson")
  );
}


// 基础样式
function func_2() {
  reset();
  viewer.dataSources.add(
    Cesium.GeoJsonDataSource.load("../../data/beijing.geojson", {
      stroke: Cesium.Color.WHITE,
      fill: Cesium.Color.RED.withAlpha(0.5),
      strokeWidth: 5
    })
  );
}

// 注记标签
function func_3() {
  reset();
  Cesium.GeoJsonDataSource.load("../../data/beijing.geojson").then(function (dataSource) {
    viewer.dataSources.add(dataSource);
    var entities = dataSource.entities.values;
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      // 得到每块多边形的坐标集合
      var polyPositions = entity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now()
      ).positions;
      // 根据坐标集合构造BoundingSphere获取中心点坐标
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions)
        .center;
      // 将中心点拉回到地球表面
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
        polyCenter
      );
      viewer.entities.add({
        position: polyCenter,
        label: {
          font: "24px sans-serif",
          text: entity.properties.name,
          showBackground: true,
          scale: 0.6,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
      });
    }
  });
}

// 分色渲染
function func_4() {
  reset();
  Cesium.GeoJsonDataSource.load("../../data/beijing.geojson").then(function (dataSource) {
    viewer.dataSources.add(dataSource);
    var entities = dataSource.entities.values;
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var color = Cesium.Color.fromRandom({alpha: 0.6});
      entity.polygon.material = color;
      entity.polygon.outline = false;
    }
  });
}

// 标签+分色渲染
function func_5() {
  reset();
  Cesium.GeoJsonDataSource.load("../../data/beijing.geojson").then(function (dataSource) {
    viewer.dataSources.add(dataSource);
    var entities = dataSource.entities.values;
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var color = Cesium.Color.fromRandom({alpha: 0.6});
      entity.polygon.material = color;
      entity.polygon.outline = false;
      var polyPositions = entity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now()
      ).positions;
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions)
        .center;
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
        polyCenter
      );
      viewer.entities.add({
        position: polyCenter,
        label: {
          font: "24px sans-serif",
          text: entity.properties.name,
          showBackground: true,
          scale: 0.6,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
      });
    }
  });
}

// 渐变
function func_6() {
  reset();
  Cesium.GeoJsonDataSource.load("../../data/beijing.geojson").then(function (dataSource) {
    viewer.dataSources.add(dataSource);
    var entities = dataSource.entities.values;
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var persons = entity.properties.persons;
      var color = null;
      if (persons <= 5000) {
        color = Cesium.Color.fromCssColorString("#fff2d3").withAlpha(0.6);
      } else if (persons <= 1000) {
        color = Cesium.Color.fromCssColorString("#fed976").withAlpha(0.6);
      } else if (persons <= 15000) {
        color = Cesium.Color.fromCssColorString("#feb337").withAlpha(0.6);
      } else if (persons <= 20000) {
        color = Cesium.Color.fromCssColorString("#fe9914").withAlpha(0.6);
      } else if (persons <= 25000) {
        color = Cesium.Color.fromCssColorString("#e56213").withAlpha(0.6);
      } else {
        color = Cesium.Color.fromCssColorString("#cb2f11").withAlpha(0.6);
      }
      entity.polygon.material = color;
      entity.polygon.outline = true;
      var polyPositions = entity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now()
      ).positions;
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions)
        .center;
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
        polyCenter
      );
      viewer.entities.add({
        position: polyCenter,
        label: {
          font: "24px sans-serif",
          text: entity.properties.name + "人口（" + persons + "）",
          showBackground: true,
          scale: 0.6,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
      });
    }
  });
}

// 高度可视化
function func_7() {
  reset();
  Cesium.GeoJsonDataSource.load("../../data/beijing.geojson").then(function (dataSource) {
    viewer.dataSources.add(dataSource);
    var entities = dataSource.entities.values;
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var persons = entity.properties.persons;
      var color = null;
      if (persons <= 5000) {
        color = Cesium.Color.fromCssColorString("#fff2d3").withAlpha(0.6);
      } else if (persons <= 1000) {
        color = Cesium.Color.fromCssColorString("#fed976").withAlpha(0.6);
      } else if (persons <= 15000) {
        color = Cesium.Color.fromCssColorString("#feb337").withAlpha(0.6);
      } else if (persons <= 20000) {
        color = Cesium.Color.fromCssColorString("#fe9914").withAlpha(0.6);
      } else if (persons <= 25000) {
        color = Cesium.Color.fromCssColorString("#e56213").withAlpha(0.6);
      } else {
        color = Cesium.Color.fromCssColorString("#cb2f11").withAlpha(0.6);
      }
      entity.polygon.material = color;
      entity.polygon.outline = false;
      entity.polygon.extrudedHeight = entity.properties.persons;
      var polyPositions = entity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now()
      ).positions;
      var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions)
        .center;
      polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(
        polyCenter
      );
      polyCenter = Cesium.Cartographic.fromCartesian(polyCenter);
      polyCenter.height = entity.properties.persons + 10;
      polyCenter = Cesium.Cartographic.toCartesian(polyCenter);
      viewer.entities.add({
        position: polyCenter,
        label: {
          font: "24px sans-serif",
          text: entity.properties.name + " 人口（" + persons + "）",
          showBackground: true,
          scale: 0.6,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        }
      });
    }
  });
}