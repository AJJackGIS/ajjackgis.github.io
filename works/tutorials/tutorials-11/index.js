var AMAP_KEY = "36368c04f9fed752c806765be07d385a";

var viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  selectionIndicator: true,
  baseLayerPicker: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: new AMapGeocoderService({key: AMAP_KEY}),
  homeButton: false,
  sceneModePicker: false,
  creditContainer: null,
  infoBox: true,
  navigationHelpButton: false,
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: "http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    subdomains: ["1", "2", "3", "4"]
  })
});

viewer.geocoder._form.children[0].placeholder = "请输入关键字";

viewer.camera.setView({
  destination: new Cesium.Cartesian3(-2177490.048273732, 4390546.717502105, 4069796.05280667),
  orientation: {
    heading: 0.474606631055857,
    pitch: -0.44422761166134617,
    roll: 0.0016741921567087203
  }
});

var centerPoint = null;
var centerMarker = null;
var bufferEntity = null;
var bufferBillboards = new Cesium.EntityCollection();

var viewModel = {
  keyword: '酒店',
  radius: 1000,
  setCenter: function () {
    getPickPosition((position) => {
      centerPoint = position;
      if (centerMarker != null) {
        viewer.entities.remove(centerMarker);
      }
      centerMarker = addPositionMarker(position, '../../images/center.png');
    });
  },
  search: function () {
    searchBuffer();
  }
};

Cesium.knockout.track(viewModel);
var controls = document.getElementsByClassName('controls')[0];
Cesium.knockout.applyBindings(viewModel, controls);

function getPickPosition(callback) {
  // 注册点击事件
  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas); // 直接用viewer.screenSpaceEventHandler会覆盖原有的事件逻辑===注意
  handler.setInputAction((clickEvent) => {
    // 拾取坐标点
    var position = viewer.scene.globe.pick(viewer.camera.getPickRay(clickEvent.position), viewer.scene);
    position = Cesium.Cartographic.fromCartesian(position);
    // 转换为经纬度(高德API要求：经纬度小数点后不得超过6位)
    position = Cesium.Math.toDegrees(position.longitude).toFixed(6) + "," + Cesium.Math.toDegrees(position.latitude).toFixed(6);
    // 取消点击事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
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


function searchBuffer() {
  // 绘制缓冲区范围
  if (bufferEntity != null) {
    viewer.entities.remove(bufferEntity);
  }
  bufferEntity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(+centerPoint.split(',')[0], +centerPoint.split(',')[1]),
    ellipse: {
      semiMajorAxis: viewModel.radius,
      semiMinorAxis: viewModel.radius,
      material: Cesium.Color.RED.withAlpha(0.2)
    }
  });
  // 清空上次数据结果
  bufferBillboards.removeAll();
  results = [];
  // 执行本次操作
  fetchAll().then(promiseAll => {
    // 当所有page页数据都获取完成后
    Promise.all(promiseAll).then(() => {
      // 二维数据降维操作
      results = Array.prototype.concat.apply([], results);
      // 处理每个返回的结果
      var url = "";
      results.map(function (resultObject) {
        if ((Cesium.defined(resultObject.photos) && Cesium.defined(resultObject.photos[0]) && Cesium.defined(resultObject.photos[0].url))) {
          url = resultObject.photos[0].url;
        }else {
          url = "";
        }
        bufferBillboards.add(viewer.entities.add({
          // 自定义info显示内容
          description: "<table class=\"cesium-infoBox-defaultTable\"><tbody>" +
          "<tr><th>照片</th><td style='text-align: center'><img style='width: 300px; height: auto;' src='" + url + "'></td></tr>" +
          "<tr><th>编号</th><td>" + resultObject.id + "</td></tr>" +
          "<tr><th>名称</th><td>" + resultObject.name + "</td></tr>" +
          "<tr><th>类型</th><td>" + resultObject.type + "</td></tr>" +
          "<tr><th>地址</th><td>" + resultObject.address + "</td></tr>" +
          "<tr><th>省市</th><td>" + resultObject.pname + "</td></tr>" +
          "<tr><th>城市</th><td>" + resultObject.cityname + "</td></tr>" +
          "<tr><th>区域名称</th><td>" + resultObject.adname + "</td></tr>" +
          "</tbody></table>",
          position: Cesium.Cartesian3.fromDegrees(+resultObject.location.split(',')[0], +resultObject.location.split(',')[1]),
          billboard: {
            image: 'pin.png',
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
        }))
      });
    })
  })
}

var offset = 20; // 每次返回的条数
var page = 1; // 当前返回的页码数
var results = []; // 数据集合

// 获取当前page页的数据
function fetchPage(offset, page) {
  // 访问地址
  var endpoint = 'https://restapi.amap.com/v3/place/around?';
  var query = 'keywords=' + viewModel.keyword;
  query += "&location=" + centerPoint;
  query += "&radius=" + viewModel.radius; // 取值范围:0-50000
  query += "&city=beijing";
  query += "&offset=" + offset;
  query += "&page=" + page;
  query += "&output=json";
  query += "&key=" + AMAP_KEY;
  var requestString = endpoint + query;
  // 使用fetchJsonp构造一个promise对象
  return Cesium.Resource.fetchJsonp({
    url: requestString
  })
}

// 获取所有页的数据
function fetchAll() {
  var promiseAll = []; // 所有的请求
  return new Promise((resolve, reject) => {
    // 执行一次请求,得到总条数信息
    fetchPage(offset, page).then(result => {
      var count = +result.count; // 总数
      var pages = Math.ceil(count / offset); // 总页码数
      for (let i = 1; i <= pages; i++) {
        // 为每个page页构造一个promise对象
        promiseAll.push(fetchPage(offset, i).then(data => {
          results.push(data.pois);
        }));
      }
      resolve(promiseAll);
    })
  })
}

