import './style.css'

// https://restcountries.com/v3.1/all
import paisesJson from './paises.json'
console.log('paisesJson', paisesJson)

import * as THREE from 'three'
import * as Curves from 'three/examples/jsm/curves/CurveExtras.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import gsap from 'gsap'

import vShader from './shaders/vertex.glsl'
import fShader from './shaders/fragment.glsl'

import at_vShader from './shaders/atmosphere_vertex.glsl'
import at_fShader from './shaders/atmosphere_fragment.glsl'

// npm run dev
const canvas = document.querySelector('#canvasContainer')

const scene = new THREE.Scene()

//Resizing
window.addEventListener('resize', () => {
  // Actualizar tamaño del lienzo
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
})

//Camera
const aspect = {
  width: canvas.offsetWidth,
  height: canvas.offsetHeight
}
const camera = new THREE.PerspectiveCamera(
  75,
  aspect.width / aspect.height,
  0.01,
  10000
)
camera.position.z = 20
scene.add(camera)

//Renderer

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
})
renderer.setPixelRatio(window.devicePixelRatio)
// renderer.setClearColor("2728#2c", 1.0);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)

// //OrbitControl
// const orbitControls = new OrbitControls(camera, canvas)
// orbitControls.enableDamping = true

// Crear los controles de órbita
const orbitControls = new OrbitControls(camera, canvas)

// Habilitar el amortiguamiento para movimientos suaves
orbitControls.enableDamping = true

// Velocidad de amortiguamiento para los movimientos de la cámara (ajusta según sea necesario)
orbitControls.dampingFactor = 0.1

// Habilitar el límite del ángulo de inclinación vertical (evita la rotación excesiva hacia arriba o hacia abajo)
// orbitControls.maxPolarAngle = Math.PI / 2;

// Velocidad de rotación
orbitControls.rotateSpeed = 0.3

// Velocidad de acercamiento/alejamiento (ajusta según sea necesario)
orbitControls.zoomSpeed = 0.5

// Velocidad de desplazamiento (ajusta según sea necesario)
orbitControls.panSpeed = 0.5

const group = new THREE.Group()
scene.add(group)

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(5, 50, 50),
  new THREE.RawShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: {
      globeTexture: {
        value: new THREE.TextureLoader().load('./img/globe.jpg')
      }
    }
  })
)
group.add(sphere)

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(5.3, 50, 50),
  new THREE.RawShaderMaterial({
    vertexShader: at_vShader,
    fragmentShader: at_fShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  })
)

atmosphere.scale.set(1.1, 1.1, 1.1)

const starGeometry = new THREE.BufferGeometry()
const starVertices = []
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() * 2 - 1) * 2000 // Rango -2000 a 2000
  const y = (Math.random() * 2 - 1) * 2000 // Rango -2000 a 2000
  const z = (Math.random() * 2 - 1) * 2000 // Rango -2000 a 2000
  starVertices.push(x, y, z)
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
)

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 2 // Tamaño de las estrellas
})

const stars = new THREE.Points(starGeometry, starMaterial)

group.add(stars)

group.add(atmosphere)

//Clock Class
const clock = new THREE.Clock()

const sphereRotationSpeed = 0.3

function formatearNumero(numero) {
  // Convertir el número a una cadena y separar los números antes y después del punto decimal
  const partes = numero.toString().split('.')
  // Guardar la parte entera del número
  const parteEntera = partes[0]
  // Crear una expresión regular para agregar puntos cada tres dígitos
  const regex = /\B(?=(\d{3})+(?!\d))/g
  // Formatear la parte entera del número
  const parteEnteraFormateada = parteEntera.replace(regex, '.')
  // Si hay parte decimal, añadirla al resultado
  const resultado =
    partes.length > 1
      ? parteEnteraFormateada + ',' + partes[1]
      : parteEnteraFormateada
  // Devolver el resultado
  return resultado
}

function buscarMaxMinPoblacion(paises) {
  // Inicializar valores máximos y mínimos con el primer país del array
  let maximo = paises[0].poblacion
  let minimo = paises[0].poblacion

  // Recorrer el array de países para buscar los valores máximos y mínimos
  paises.forEach((pais) => {
    if (pais.poblacion > maximo) {
      maximo = pais.poblacion
    }
    if (pais.poblacion < minimo) {
      minimo = pais.poblacion
    }
  })

  // Devolver un objeto con los valores máximos y mínimos
  return { maximo, minimo }
}

function valorEquivalente(valor, minimo, maximo, escalaMin, escalaMax) {
  const porcentaje = (valor - escalaMin) / (maximo - escalaMin)
  const extencionFinal = escalaMin + porcentaje * (escalaMax - escalaMin)
  return extencionFinal
}

function crearPunto(parametros, escalas) {
  console.log('🚀 ~ crearPunto ~ escalas:', escalas)
  const extencionMin = 0.1
  const extencionMax = 3

  const extencion = valorEquivalente(
    parametros.poblacion,
    escalas.minimo,
    escalas.maximo,
    extencionMin,
    extencionMax
  )
  console.log('🚀 ~ crearPunto ~ extencion:', extencion)

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, extencion),
    new THREE.MeshBasicMaterial({
      color: '#3bf7ff',
      opacity: 0.4,
      transparent: true
    })
  )
  const latitudeRad = (parametros.lat / 180) * Math.PI
  const longitudeRad = (parametros.long / 180) * Math.PI
  const radius = 5
  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  box.position.x = x
  box.position.y = y
  box.position.z = z
  box.attributos = parametros

  box.lookAt(0, 0, 0)
  box.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -(extencion / 2))
  )

  group.add(box)

  box.scale.z = 0
  gsap.to(box.scale, {
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
    long: -74.006,
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
    lat: 52.52,
    long: 13.405,
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
    long: 51.389,
    nombre: 'Irán - Teherán',
    poblacion: 8693706
  },
  {
    lat: 28.6139,
    long: 77.209,
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
    long: 126.978,
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
]
const minMaxPaises = buscarMaxMinPoblacion(paises)
console.log('minMaxPaises')
console.log(paises)
console.log(minMaxPaises)
paises.forEach((pais) => {
  // crearPunto(pais, minMaxPaises);
})

let arrayPaisesV2 = []

function convertirCoordenadasGeograficasACartesianas(coord) {
  const latitudeRad = (coord.lat / 180) * Math.PI
  const longitudeRad = (coord.long / 180) * Math.PI
  const radius = 5

  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  return { x, y, z }
}
let curvaTestV3 = []
paisesJson.forEach((paisV2Json) => {
  const parametrosV2 = {
    lat: paisV2Json.latlng[0],
    long: paisV2Json.latlng[1],
    nombre: paisV2Json.name.common,
    poblacion: paisV2Json.population
  }
  arrayPaisesV2.push(parametrosV2)

  const restXYZ = convertirCoordenadasGeograficasACartesianas({
    lat: paisV2Json.latlng[0],
    long: paisV2Json.latlng[1]
  })

  curvaTestV3.push({ x: restXYZ.x, y: restXYZ.y, z: restXYZ.z })
})

const minMaxPaisesV2 = buscarMaxMinPoblacion(arrayPaisesV2)
arrayPaisesV2.forEach((paisesV2) => {
  crearPunto(paisesV2, minMaxPaisesV2)
})

sphere.rotation.y = -Math.PI / 2

//! proyecto geo
// Función para cargar y procesar el archivo GeoJSON
async function cargarGeoJSON(url) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al cargar el archivo GeoJSON:', error)
    return null
  }
}
//! realizado con este ejemplo
// https://threejs.org/examples/#webgl_lines_colors
// Función para dibujar las localidades de Argentina
async function dibujarLocalidadesDeArgentina() {
  // Cargar el archivo GeoJSON de Argentina
  const argentinaGeoJSON = await cargarGeoJSON('argentina.geojson')

  // Verificar si se cargó correctamente
  if (!argentinaGeoJSON) {
    console.error('No se pudo cargar el archivo GeoJSON de Argentina.')
    return
  }

  // Crear un grupo para almacenar las líneas de los polígonos de las localidades
  const group = new THREE.Group()

  // Iterar sobre las características (features) del GeoJSON
  argentinaGeoJSON.features.forEach((feature) => {
    console.log('🚀 ~ dibujarLocalidadesDeArgentina ~ feature:', feature)
    // Verificar si la característica es un polígono
    if (feature.geometry.type === 'MultiPolygon') {
      // Obtener las coordenadas de los polígonos
      const coordenadas = feature.geometry.coordinates

      // const colores = [
      //   new THREE.Color(0xff0000),
      //   // new THREE.Color(0x00ff00)
      // ];

      const colores = [
        // new THREE.Color(0xff0000),
        new THREE.Color(0x00ff00)
        // new THREE.Color(0x0000ff),
        // new THREE.Color(0xffff00)
      ]

      // Iterar sobre los polígonos
      coordenadas.forEach((poligono) => {
        // Iterar sobre los anillos exteriores de cada polígono
        poligono.forEach((anilloExterior) => {
          let anilloExteriorXYZ = []
          anilloExterior.forEach((LATLONG) => {
            const restXYZ = convertirCoordenadasGeograficasACartesianas({
              lat: LATLONG[1],
              long: LATLONG[0]
            })

            anilloExteriorXYZ.push({ x: restXYZ.x, y: restXYZ.y, z: restXYZ.z })
          })

          // Crear una línea para el anillo exterior y agregarla al grupo
          console.log('anilloExteriorXYZ', anilloExteriorXYZ)
          // debugger;
          const linea = crearLineasDePuntos(anilloExteriorXYZ, colores)
          group.add(linea)
        })

        // Iterar sobre los anillos interiores de cada polígono
        for (let i = 1; i < poligono.length; i++) {
          // Crear una línea para el anillo interior y agregarla al grupo
          console.log('poligono i', poligono[i])
          debugger
          // const linea = crearLineasDePuntos(poligono[i], colores);
          // group.add(linea);
        }
      })
    }
  })

  // Agregar el grupo al escena
  scene.add(group)
}

// Llamar a la función para dibujar las localidades de Argentina
dibujarLocalidadesDeArgentina()

function crearLineasDePuntos(puntos, colores) {
  const material = new THREE.LineBasicMaterial({ vertexColors: true })
  const geometria = new THREE.BufferGeometry()
  const vertices = []
  const colorArray = []
  const cantidadColores = colores.length

  for (let i = 0; i < puntos.length; i++) {
    const punto = puntos[i]
    vertices.push(punto.x, punto.y, punto.z)
    const colorIndex = Math.floor((i / puntos.length) * cantidadColores)
    const color =
      colores[colorIndex % cantidadColores] || new THREE.Color(0xffffff) // Si no se proporciona un color, se usa blanco
    colorArray.push(color.r, color.g, color.b)
  }

  geometria.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  )
  geometria.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colorArray, 3)
  )

  const linea = new THREE.Line(geometria, material)

  // Manejar el evento pointerover para resaltar la línea
  linea.addEventListener('pointerover', () => {
    materials.forEach((material) => {
      material.color.setHex(0xff0000) // Cambiar color a rojo
    })
  })

  // Manejar el evento pointerout para restaurar el color original de la línea
  linea.addEventListener('pointerout', () => {
    materials.forEach((material, index) => {
      material.color.set(colores[index]) // Restaurar color original
    })
  })
  return linea
}

// Ejemplo de uso:
const puntos = [
  { x: -1, y: -1, z: 0 },
  { x: 1, y: -1, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: -1, y: 1, z: 0 }
]
const colores = [
  new THREE.Color(0xff0000)
  // new THREE.Color(0x00ff00)
]
// const lineas = crearLineasDePuntos(curvaTestV3, colores);
// scene.add(lineas);

const popup = document.getElementById('popup')
const popup_texto_01 = document.getElementById('text1')
const popup_texto_02 = document.getElementById('text2')

// Función para mostrar el popup
function showPopup(x, y) {
  popup.style.left = x + 'px'
  popup.style.top = y + 'px'
}

// Evento para seguir el mouse y mostrar el popup
document.addEventListener('mousemove', function (event) {
  const mouseX = event.clientX
  const mouseY = event.clientY
  showPopup(mouseX, mouseY)
})

const mouse = {
  x: undefined,
  y: undefined
}

const raycaster = new THREE.Raycaster()

addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
})

const animate = () => {
  //getElapsedTime
  const elapsedTime = clock.getElapsedTime()

  //Update Controls
  orbitControls.update()

  // sphere.rotation.y = elapsedTime * sphereRotationSpeed;
  // group.rotation.y = mouse.x * 0.5;
  if (mouse.x) {
    // console.log(mouse)
    // gsap.to(group.rotation, {
    //   x: -mouse.y * 2.5,
    //   y: mouse.x * 2.5,
    //   duration: 2
    // })
  }

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => {
      return mesh.geometry.type === 'BoxGeometry'
    })
  )

  group.children.forEach((mesh) => {
    mesh.material.opacity = 0.4
  })
  gsap.set(popup, {
    opacity: 0
  })

  for (let i = 0; i < intersects.length; i++) {
    console.log(intersects[i].object.attributos)
    popup_texto_01.textContent = intersects[i].object.attributos.nombre
    popup_texto_02.textContent = formatearNumero(
      intersects[i].object.attributos.poblacion
    )
    intersects[i].object.material.opacity = 1
    gsap.set(popup, {
      opacity: 1
    })
  }

  //Renderer
  renderer.render(scene, camera)

  //RequestAnimationFrame
  window.requestAnimationFrame(animate)
}

animate()
