const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  shouldAnimate: true,
  selectionIndicator: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  vrButton: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  creditContainer: null,
  infoBox: false,
  shadows: true,
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

viewer.scene.camera.setView({
  destination: new Cesium.Cartesian3(-2176042.689854955, 4389277.911332774, 4070588.1100211497),
  orientation: {
    heading: 1.6325362317272143,
    pitch: -0.44926908149976796,
    roll: 0.003660235426139913
  }
});

viewer.scene.postProcessStages.fxaa.enabled = true; // 启用抗锯齿

var position = Cesium.Cartesian3.fromDegrees(116.37351157351095, 39.912371192592026);

// 1、使用entity的方式显示一个模型
var entity = viewer.entities.add({
  position: position,
  model: {
    uri: "../../data/camera.gltf",
    minimumPixelSize : 128,
    maximumScale : 20000
  }
});
viewer.trackedEntity = entity;

// 2、更改模型姿态（旋转-缩放-平移）
var heading = Cesium.Math.toRadians(0);
var pitch = Cesium.Math.toRadians(30);
var roll = Cesium.Math.toRadians(0);
var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
var entity = viewer.entities.add({
  position: position,
  orientation: orientation,
  model: {
    scale: 1,
    uri: "../../data/camera.gltf",
    minimumPixelSize: 128,
    maximumScale: 20000
  }
});
viewer.trackedEntity = entity;

// 3、高亮模型
var entity = viewer.entities.add({
  position: position,
  model: {
    uri: "../../data/camera.gltf",
    minimumPixelSize : 128,
    maximumScale : 20000,
    color : Cesium.Color.RED.withAlpha(0.8),
    colorBlendMode : Cesium.ColorBlendMode.HIGHLIGHT
    // colorBlendMode : Cesium.ColorBlendMode.REPLACE,
    // colorBlendMode : Cesium.ColorBlendMode.MIX, // 当colorBlendMode为mix时，colorBlendAmount才启用
    // colorBlendAmount : 0.5
  }
});
viewer.trackedEntity = entity;

// 4、描边
var entity = viewer.entities.add({
  position: position,
  model: {
    uri: "../../data/camera.gltf",
    minimumPixelSize : 128,
    maximumScale : 20000,
    silhouetteColor : Cesium.Color.RED.withAlpha(0.8),
    silhouetteSize : 2
  }
});
viewer.trackedEntity = entity;


// 5、调整模型亮度
var entity = viewer.entities.add({
  position: position,
  model: {
    uri: "../../data/camera.gltf",
    minimumPixelSize: 128,
    maximumScale: 20000,
    imageBasedLightingFactor: new Cesium.Cartesian2(3.0, 3.0),
    lightColor: new Cesium.Cartesian3(0.6, 0.5, 0.2)
  }
});
viewer.trackedEntity = entity;

// 6、使用Primitive加载模型
var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
var model = viewer.scene.primitives.add(Cesium.Model.fromGltf({
  url: '../../data/camera.gltf',
  modelMatrix: modelMatrix
}));

// 高亮
model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT;
model.color = Cesium.Color.RED;

// 描边
model.silhouetteColor = Cesium.Color.GREEN;
model.silhouetteSize = 2;

// 亮度
model.luminanceAtZenith = 2;

// 7、大量模型展示
var treePositions = [
  [116.37937798457553, 39.90639040824304],
  [116.37926582917692, 39.90632075459136],
  [116.37902230222204, 39.90627035636522],
  [116.37874168213100, 39.90624505983880],
  [116.37839624963146, 39.90624213691231],
  [116.37800965182912, 39.90626670902176],
  [116.37768114079448, 39.90633733034571],
  [116.37738615012368, 39.90643827595204],
  [116.37714396744530, 39.90664020064128],
  [116.37702656426977, 39.90690185896333],
  [116.37691676096766, 39.90713735793378],
  [116.37676112017566, 39.90739588085289],
  [116.37660471013842, 39.90769132113983],
  [116.37648093160178, 39.90801243595588],
  [116.37639944789942, 39.90830783281876],
  [116.37634792909546, 39.90851918517514],
  [116.37630094953192, 39.90875318275520],
  [116.37627632693868, 39.90904659292468],
  [116.37631283784788, 39.90927689047142],
  [116.37636505735216, 39.90952063665825],
  [116.37646010780914, 39.90977652716742],
  [116.37653205545378, 39.90999202493399],
  [116.37663890464731, 39.91021699844651],
  [116.37675655122565, 39.91041505983138],
  [116.37693636288138, 39.91062711366520],
  [116.37711184490976, 39.91079693164669],
  [116.37734915101201, 39.91104959655934],
  [116.37762617328968, 39.91124931731126],
  [116.37796309339910, 39.91143141503311],
  [116.37834381214424, 39.91147258965331],
  [116.37870584447037, 39.91139434999892],
  [116.37901827977052, 39.91132185558158],
  [116.37934834323993, 39.91126027755811],
  [116.37961401596021, 39.91114196420710],
  [116.37987562286372, 39.91101271736782],
  [116.38021156552917, 39.91091166507005],
  [116.38049615788805, 39.91083991837978],
  [116.38077058997807, 39.91074270926281],
  [116.38102387627654, 39.91057988655767],
  [116.38127486946235, 39.91045944205129],
  [116.38141764232289, 39.91021316782793],
  [116.38159048041466, 39.90998599171584],
  [116.38180616741387, 39.90981308578803],
  [116.38204134994660, 39.90965132030571],
  [116.38241299318895, 39.90953697751146],
  [116.38277303558057, 39.90954609117454],
  [116.38313969993564, 39.90953008983445],
  [116.38324607041727, 39.90922271743221],
  [116.38318503708484, 39.90888404967813],
  [116.38312533235866, 39.90859218878813],
  [116.38304136977274, 39.90831398994884],
  [116.38299453082233, 39.90802566844725],
  [116.38290643275006, 39.90775805810271],
  [116.38270032497150, 39.90756879802651],
  [116.38242183593722, 39.90741070362514],
  [116.38223914677530, 39.90727942236957],
  [116.38198200991594, 39.90710888679515],
  [116.38166726038182, 39.90692864294513],
  [116.38137552838943, 39.90676365217722],
  [116.38111124848720, 39.90662335653065],
  [116.38077920842358, 39.90647630028647],
  [116.38047589658224, 39.90638505595656],
  [116.38014776906576, 39.90636007952050],
  [116.37999976519949, 39.90648310963331],
  [116.37970711338272, 39.90654195156783],
  [116.37940350726844, 39.90646839760907]
];
var instances = [];
for (var i = 0; i < treePositions.length; i++) {
  var position = Cesium.Cartesian3.fromDegrees(treePositions[i][0], treePositions[i][1], 0); // 定位
  var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, new Cesium.HeadingPitchRoll(0, 0, 0)); // 旋转
  Cesium.Matrix4.multiplyByUniformScale(modelMatrix, 0.2, modelMatrix); // 缩放
  instances.push({
    modelMatrix: modelMatrix
  });
}

var collection = viewer.scene.primitives.add(new Cesium.ModelInstanceCollection({
  url: "../../data/tree.gltf",
  instances: instances
}));

collection.readyPromise.then(function (collection) {
  var center = collection._boundingSphere.center;
  var radius = collection._boundingSphere.radius;
  var heading = Cesium.Math.toRadians(0.0);
  var pitch = Cesium.Math.toRadians(-20.0);
  viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, radius * 2));
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
});

