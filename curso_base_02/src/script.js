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

function formatearNumero(numero) {
  // Convertir el número a una cadena y separar los números antes y después del punto decimal
  const partes = numero.toString().split(".");
  // Guardar la parte entera del número
  const parteEntera = partes[0];
  // Crear una expresión regular para agregar puntos cada tres dígitos
  const regex = /\B(?=(\d{3})+(?!\d))/g;
  // Formatear la parte entera del número
  const parteEnteraFormateada = parteEntera.replace(regex, ".");
  // Si hay parte decimal, añadirla al resultado
  const resultado = partes.length > 1 ? parteEnteraFormateada + "," + partes[1] : parteEnteraFormateada;
  // Devolver el resultado
  return resultado;
}

function buscarMaxMinPoblacion(paises) {
  // Inicializar valores máximos y mínimos con el primer país del array
  let maximo = paises[0].poblacion;
  let minimo = paises[0].poblacion;

  // Recorrer el array de países para buscar los valores máximos y mínimos
  paises.forEach(pais => {
    if (pais.poblacion > maximo) {
      maximo = pais.poblacion;
    }
    if (pais.poblacion < minimo) {
      minimo = pais.poblacion;
    }
  });

  // Devolver un objeto con los valores máximos y mínimos
  return { maximo, minimo };
}

function valorEquivalente(valor, minimo, maximo, escalaMin, escalaMax){
  const porcentaje = (valor - escalaMin) / (maximo - escalaMin);
  const extencionFinal = escalaMin + (porcentaje * (escalaMax - escalaMin));
  return extencionFinal;
}

function crearPunto(parametros, escalas){

  const extencionMin = 0.1;
  const extencionMax = 3;

  const extencion = valorEquivalente(parametros.poblacion, escalas.minimo, escalas.maximo, extencionMin, extencionMax)

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, extencion),
    new THREE.MeshBasicMaterial({
      color: '#3bf7ff',
      opacity: 0.4,
      transparent: true
    })
  );
  const latitudeRad = (parametros.lat / 180) * Math.PI
  const longitudeRad = (parametros.long / 180) * Math.PI
  const radius = 5
  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  box.position.x = x;
  box.position.y = y;
  box.position.z = z;
  box.attributos = parametros;

  box.lookAt(0, 0, 0)
  box.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -(extencion / 2) )
  )

  group.add(box);

  box.scale.z = 0;
  gsap.to(box.scale,{
    z: 1,
    duration: 2,
    // yoyo: true,
    // repeat: -1,
    ease: 'linear',
    delay: Math.random() * 2
  })
}



const paises = [
  {
    lat: -34.6037,
    long: -58.3816,
    nombre: 'Argentina - Buenos Aires',
    poblacion: 15400000
  },
  {
    lat: 40.7128,
    long: -74.0060,
    nombre: 'Estados Unidos - Nueva York',
    poblacion: 8398748
  },
  {
    lat: 51.5074,
    long: -0.1278,
    nombre: 'Reino Unido - Londres',
    poblacion: 8908081
  },
  {
    lat: 48.8566,
    long: 2.3522,
    nombre: 'Francia - París',
    poblacion: 2140526
  },
  {
    lat: 55.7558,
    long: 37.6176,
    nombre: 'Rusia - Moscú',
    poblacion: 12678079
  },
  {
    lat: 35.6895,
    long: 139.6917,
    nombre: 'Japón - Tokio',
    poblacion: 13929286
  },
  {
    lat: 39.9042,
    long: 116.4074,
    nombre: 'China - Pekín',
    poblacion: 21542000
  },
  {
    lat: 55.7558,
    long: 12.5918,
    nombre: 'Dinamarca - Copenhague',
    poblacion: 794128
  },
  {
    lat: 52.5200,
    long: 13.4050,
    nombre: 'Alemania - Berlín',
    poblacion: 3669491
  },
  {
    lat: 41.9028,
    long: 12.4964,
    nombre: 'Italia - Roma',
    poblacion: 2872800
  },
  {
    lat: -33.8688,
    long: 151.2093,
    nombre: 'Australia - Sídney',
    poblacion: 5312163
  },
  {
    lat: -22.9068,
    long: -43.1729,
    nombre: 'Brasil - Río de Janeiro',
    poblacion: 6718903
  },
  {
    lat: 19.4326,
    long: -99.1332,
    nombre: 'México - Ciudad de México',
    poblacion: 8918653
  },
  {
    lat: -4.4419,
    long: 15.2663,
    nombre: 'República Democrática del Congo - Kinshasa',
    poblacion: 13529000
  },
  {
    lat: 37.7749,
    long: -122.4194,
    nombre: 'Estados Unidos - San Francisco',
    poblacion: 883305
  },
  {
    lat: -33.9249,
    long: 18.4241,
    nombre: 'Sudáfrica - Ciudad del Cabo',
    poblacion: 433688
  },
  {
    lat: 35.6895,
    long: 51.3890,
    nombre: 'Irán - Teherán',
    poblacion: 8693706
  },
  {
    lat: 28.6139,
    long: 77.2090,
    nombre: 'India - Nueva Delhi',
    poblacion: 257803
  },
  {
    lat: 59.3293,
    long: 18.0686,
    nombre: 'Suecia - Estocolmo',
    poblacion: 975904
  },
  {
    lat: 39.9334,
    long: 32.8597,
    nombre: 'Turquía - Ankara',
    poblacion: 5445000
  },
  {
    lat: -30.0331,
    long: -51.23,
    nombre: 'Brasil - Porto Alegre',
    poblacion: 1484941
  },
  {
    lat: 31.2304,
    long: 121.4737,
    nombre: 'China - Shanghái',
    poblacion: 24150000
  },
  {
    lat: 37.5665,
    long: 126.9780,
    nombre: 'Corea del Sur - Seúl',
    poblacion: 9741381
  },
  {
    lat: -25.2866,
    long: -57.356,
    nombre: 'Paraguay - Asunción',
    poblacion: 525294
  },
  {
    lat: -12.0464,
    long: -77.0428,
    nombre: 'Perú - Lima',
    poblacion: 9498661
  },
  {
    lat: -36.8485,
    long: 174.7633,
    nombre: 'Nueva Zelanda - Auckland',
    poblacion: 1556880
  },
  {
    lat: 38.9072,
    long: -77.0369,
    nombre: 'Estados Unidos - Washington D.C.',
    poblacion: 702455
  },
  {
    lat: 59.9139,
    long: 10.7522,
    nombre: 'Noruega - Oslo',
    poblacion: 693494
  }
];
const minMaxPaises = buscarMaxMinPoblacion(paises);
console.log('minMaxPaises');
console.log(paises);
console.log(minMaxPaises);
paises.forEach(pais => {
  crearPunto(pais, minMaxPaises);
});

sphere.rotation.y = -Math.PI / 2


const popup = document.getElementById('popup');
const popup_texto_01 = document.getElementById("text1");
const popup_texto_02 = document.getElementById("text2");



// Función para mostrar el popup
function showPopup(x, y) {
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
}

// Evento para seguir el mouse y mostrar el popup
document.addEventListener('mousemove', function(event) {
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  showPopup(mouseX, mouseY);
});





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


  group.children.forEach(mesh => {
    mesh.material.opacity = 0.4
    
  })
  gsap.set(popup, {
    opacity: 0
  })

  for (let i = 0; i < intersects.length; i++) {
    console.log(intersects[i].object.attributos);
    popup_texto_01.textContent = intersects[i].object.attributos.nombre;
    popup_texto_02.textContent = formatearNumero(intersects[i].object.attributos.poblacion);
    intersects[i].object.material.opacity = 1
    gsap.set(popup, {
      opacity: 1
    })
  }

  //Renderer
  renderer.render(scene, camera);

  //RequestAnimationFrame
  window.requestAnimationFrame(animate);
};



animate();


