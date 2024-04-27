import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

import vShader from "./shaders/vertex.glsl";
import fShader from "./shaders/fragment.glsl";

import at_vShader from "./shaders/atmosphere_vertex.glsl";
import at_fShader from "./shaders/atmosphere_fragment.glsl";

// npm run dev
const canvas = document.querySelector("#canvasContainer");

const scene = new THREE.Scene();

//Resizing
window.addEventListener("resize", () => {
  // Actualizar tamaño del lienzo
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

//Camera
const aspect = {
  width: canvas.offsetWidth,
  height: canvas.offsetHeight,
};
const camera = new THREE.PerspectiveCamera(
  75,
  aspect.width / aspect.height,
  0.01,
  10000
);
camera.position.z = 20;
scene.add(camera);



//Renderer

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setClearColor("2728#2c", 1.0);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

//OrbitControl
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;

const group = new THREE.Group();
scene.add(group);



const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.RawShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: {
      globeTexture : {
        value: new THREE.TextureLoader().load('./img/globe.jpg')
      }
    },
  })
);
group.add(sphere);


const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.RawShaderMaterial({
    vertexShader: at_vShader,
    fragmentShader: at_fShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
);

atmosphere.scale.set(1.1, 1.1, 1.1);

const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() * 2 - 1) * 2000; // Rango -2000 a 2000
  const y = (Math.random() * 2 - 1) * 2000; // Rango -2000 a 2000
  const z = (Math.random() * 2 - 1) * 2000; // Rango -2000 a 2000
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 2 // Tamaño de las estrellas
});

const stars = new THREE.Points(
  starGeometry,
  starMaterial
);

group.add(stars);



group.add(atmosphere);





//Clock Class
const clock = new THREE.Clock();

const sphereRotationSpeed = 0.3;

function crearPunto(latitude, longitude){
  const extencion = 0.8
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, extencion),
    new THREE.MeshBasicMaterial({
      color: '#3bf7ff'
    })
  );
  const latitudeRad = (latitude / 180) * Math.PI
  const longitudeRad = (longitude / 180) * Math.PI
  const radius = 5
  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  box.position.x = x;
  box.position.y = y;
  box.position.z = z;

  box.lookAt(0, 0, 0)
  box.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -(extencion / 2) )
  )

  group.add(box);

  gsap.to(box.scale,{
    z: 0,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: 'linear',
    delay: Math.random() * 2
  })
}
// Coordenadas para diferentes capitales de países
crearPunto(-34.6037, -58.3816);  // Argentina - Buenos Aires
crearPunto(40.7128, -74.0060);   // Estados Unidos - Nueva York
crearPunto(51.5074, -0.1278);    // Reino Unido - Londres
crearPunto(48.8566, 2.3522);     // Francia - París
crearPunto(55.7558, 37.6176);    // Rusia - Moscú
crearPunto(35.6895, 139.6917);   // Japón - Tokio
crearPunto(39.9042, 116.4074);   // China - Pekín
crearPunto(55.7558, 12.5918);    // Dinamarca - Copenhague
crearPunto(52.5200, 13.4050);    // Alemania - Berlín
crearPunto(41.9028, 12.4964);    // Italia - Roma
crearPunto(-33.8688, 151.2093);  // Australia - Sídney
crearPunto(-22.9068, -43.1729);  // Brasil - Río de Janeiro
crearPunto(19.4326, -99.1332);   // México - Ciudad de México
crearPunto(55.7558, 37.6176);    // Rusia - Moscú
crearPunto(-4.4419, 15.2663);    // República Democrática del Congo - Kinshasa
crearPunto(37.7749, -122.4194);  // Estados Unidos - San Francisco
crearPunto(-33.9249, 18.4241);   // Sudáfrica - Ciudad del Cabo
crearPunto(35.6895, 51.3890);    // Irán - Teherán
crearPunto(28.6139, 77.2090);    // India - Nueva Delhi
crearPunto(59.3293, 18.0686);    // Suecia - Estocolmo
crearPunto(39.9334, 32.8597);    // Turquía - Ankara
crearPunto(-30.0331, -51.23);    // Brasil - Porto Alegre
crearPunto(31.2304, 121.4737);   // China - Shanghái
crearPunto(55.7558, 37.6176);    // Rusia - Moscú
crearPunto(37.5665, 126.9780);   // Corea del Sur - Seúl
crearPunto(-25.2866, -57.356);   // Paraguay - Asunción
crearPunto(-12.0464, -77.0428);  // Perú - Lima
crearPunto(-36.8485, 174.7633);  // Nueva Zelanda - Auckland
crearPunto(38.9072, -77.0369);   // Estados Unidos - Washington D.C.
crearPunto(59.9139, 10.7522);    // Noruega - Oslo

sphere.rotation.y = -Math.PI / 2



const mouse = {
  x: undefined,
  y: undefined
};

const raycaster = new THREE.Raycaster()

addEventListener('mousemove', (event) =>{
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
});

const animate = () => {
  //getElapsedTime
  const elapsedTime = clock.getElapsedTime();

  //Update Controls
  orbitControls.update();

  // sphere.rotation.y = elapsedTime * sphereRotationSpeed;
  // group.rotation.y = mouse.x * 0.5;
  if(mouse.x){
    // console.log(mouse)
    // gsap.to(group.rotation, {
    //   x: -mouse.y * 2.5,
    //   y: mouse.x * 2.5,
    //   duration: 2
    // })
  }
  
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(group.children.filter(mesh => {
    return mesh.geometry.type === 'BoxGeometry'
  }))

  for (let i = 0; i < intersects.length; i++) {
    console.log('ok');
  }

  //Renderer
  renderer.render(scene, camera);

  //RequestAnimationFrame
  window.requestAnimationFrame(animate);
};



animate();


