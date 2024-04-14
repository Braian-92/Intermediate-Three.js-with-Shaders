// Importar Three.js desde npm
import * as THREE from 'three';

// Inicializar Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Configurar la posición de la cámara
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x000000); // Negro
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);


const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.MeshBasicMaterial({
    color: 0xFF0000
  })
);

scene.add(sphere);

// Función de renderizado
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();