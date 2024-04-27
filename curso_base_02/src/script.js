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
  //Update Size
  aspect.width = canvas.offsetWidth;
  aspect.height = canvas.offsetHeight;

  //New Aspect Ratio
  camera.aspect = aspect.width / aspect.height;
  camera.updateProjectionMatrix();

  //New RendererSize
  // renderer.setSize(aspect.width, aspect.height);
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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


const point = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 50, 50),
  new THREE.MeshBasicMaterial({
    color: '#ff0000'
  })
);
// -34.61315, -58.37723 buenos aires
// -23.6345 102.5528 mexico
// arg
const latitude = -34.61315
const longitude = -58.37723
// mex
// const latitude = 23.6345
// const longitude = -102.5528

const latitudeRad = (latitude / 180) * Math.PI
const longitudeRad = (longitude / 180) * Math.PI

const radius = 5

const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
const y = radius * Math.sin(latitudeRad)
const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

console.log({x, y, z});

point.position.x = x;
point.position.y = y;
point.position.z = z;

sphere.rotation.y = -Math.PI / 2


group.add(point);

const mouse = {
  x: undefined,
  y: undefined
};

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
  gsap.to(group.rotation, {
    x: -mouse.y * 2.5,
    y: mouse.x * 2.5,
    duration: 2
  })

  //Renderer
  renderer.render(scene, camera);

  //RequestAnimationFrame
  window.requestAnimationFrame(animate);
};



animate();


