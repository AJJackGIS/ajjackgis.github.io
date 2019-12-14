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

viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.logarithmicDepthBuffer = false;
viewer.scene.highDynamicRange = false;

var fireParticlePrimitive = null;
var waterParticlePrimitive = null;
var entity = null;
var emitterModelMatrix = new Cesium.Matrix4();
var translation = new Cesium.Cartesian3();
var rotation = new Cesium.Quaternion();
var hpr = new Cesium.HeadingPitchRoll();
var trs = new Cesium.TranslationRotationScale();
var gravityScratch = new Cesium.Cartesian3();

/**
 * 起火
 */
function startFire() {
  fireParticlePrimitive = viewer.scene.primitives.add(new Cesium.ParticleSystem({
    image: '../../images/fire.png',
    startColor: Cesium.Color.LIGHTSEAGREEN.withAlpha(0.7),
    endColor: Cesium.Color.WHITE.withAlpha(0.0),
    startScale: 1.0,
    endScale: 5.0,
    minimumParticleLife: 1.2,
    maximumParticleLife: 1.2,
    minimumSpeed: 1.0,
    maximumSpeed: 4.0,
    emissionRate: 40,
    lifetime: 16,
    imageSize: new Cesium.Cartesian2(40, 40),
    emitter: new Cesium.CircleEmitter(2.0),
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(116.37351157351095, 39.912371192592026, 60))
  }));
}

/**
 * 喷水
 */
function startWater() {
  entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.373109, 39.911445, 10)
  });

  waterParticlePrimitive = viewer.scene.primitives.add(new Cesium.ParticleSystem({
    image: '../../images/water.png',
    startColor: new Cesium.Color(1, 1, 1, 0.6),
    endColor: new Cesium.Color(0.80, 0.86, 1, 0.4),
    startScale: 1,
    endScale: 7,
    minimumParticleLife: 6,
    maximumParticleLife: 7,
    minimumSpeed: 26,
    maximumSpeed: 26,
    imageSize: new Cesium.Cartesian2(10, 10),
    emissionRate: 200,
    lifetime: 16.0,
    emitter: new Cesium.CircleEmitter(0.2),
    emitterModelMatrix: computeEmitterModelMatrix(),
    updateCallback: applyGravity
  }));
  viewer.scene.preUpdate.addEventListener(update);
}


function computeModelMatrix(entity, time) {
  return entity.computeModelMatrix(time, new Cesium.Matrix4());
}

function computeEmitterModelMatrix() {
  hpr = Cesium.HeadingPitchRoll.fromDegrees(110.0, 30.0, 0.0, hpr); // 倾斜角度
  trs.translation = Cesium.Cartesian3.fromElements(0, 0, 1, translation); // 发射高度
  trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr, rotation);
  return Cesium.Matrix4.fromTranslationRotationScale(trs, emitterModelMatrix);
}

function applyGravity(p, dt) {
  var position = p.position;
  Cesium.Cartesian3.normalize(position, gravityScratch);
  Cesium.Cartesian3.multiplyByScalar(gravityScratch, -4 * dt, gravityScratch);
  p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity);
}

function update(scene, time) {
  waterParticlePrimitive.modelMatrix = computeModelMatrix(entity, time);
  waterParticlePrimitive.emitterModelMatrix = computeEmitterModelMatrix();
}

/**
 * 开始施救
 */
function playAnimation() {
  console.log("开始动画");
  const i = setInterval(function () {
    console.log("火：" + fireParticlePrimitive.emissionRate);
    if (fireParticlePrimitive.emissionRate == 0) {
      viewer.scene.primitives.remove(fireParticlePrimitive);
      clearInterval(i);
      const j = setInterval(function () {
        console.log("水：" + waterParticlePrimitive.emissionRate);
        if (waterParticlePrimitive.emissionRate == 0) {
          viewer.scene.primitives.remove(waterParticlePrimitive);
          viewer.entities.remove(entity);
          viewer.scene.preUpdate.addEventListener(update);
          clearInterval(j);
        } else {
          waterParticlePrimitive.emissionRate -= 10;
        }
      }, 100)
    } else {
      fireParticlePrimitive.emissionRate -= 0.5;
    }
  }, 100);
}


function start() {
  startFire();
  setTimeout(function () {
    startWater();
  }, 3000);
  setTimeout(function () {
    playAnimation();
  }, 11000)
}


