import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// import * as TURF from 'turf-jsts/jsts.js'
import * as TURF from 'turf/turf.min.js'
import './style.css'

let archivosGeoJson = {};

const canvas = document.querySelector('#canvas')
const scene = new THREE.Scene()

let aspect = {
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

// Variables para el tamaño de la esfera del planeta
let planetRadius = 2.5 // Tamaño predeterminado
const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 32) // Crear esfera
const planetMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 })
const planet = new THREE.Mesh(planetGeometry, planetMaterial)
scene.add(planet)
planet.name = 'planeta'

// Crear esfera pequeña que seguirá al mouse
const pointerGeometry = new THREE.SphereGeometry(0.01, 16, 16) // Tamaño fijo para la esfera del puntero
const pointerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.3 })
const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial)
scene.add(pointer)
pointer.name = 'esferaPuntero'

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight)

const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true
orbitControls.dampingFactor = 0.1
orbitControls.rotateSpeed = 0.3
orbitControls.zoomSpeed = 0.5
orbitControls.panSpeed = 0.5

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function onMouseMove(event) {
  // Normalizar coordenadas del mouse
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Actualizar posición de la esfera pequeña
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(planet)
  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point
    pointer.position.copy(intersectPoint)
  }
}

document.addEventListener('mousemove', onMouseMove, false)

// Función para convertir coordenadas cartesianas a geográficas
function convertirCoordenadasCartesianasAGeograficas(coord) {
  const radius = Math.sqrt(coord.x * coord.x + coord.y * coord.y + coord.z * coord.z)
  const latitudeRad = Math.asin(coord.y / radius)
  const longitudeRad = Math.atan2(coord.x, coord.z)
  const latitude = (latitudeRad * 180) / Math.PI
  const longitude = (longitudeRad * 180) / Math.PI

  return { lat: latitude, long: longitude }
}

// Función para manejar el evento click
function onClick(event) {
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(planet)
  if (intersects.length > 0) {
    const intersectPoint = intersects[0].point
    const coordinates = convertirCoordenadasCartesianasAGeograficas(intersectPoint)
    console.log('Coordenadas latitud y longitud:', coordinates)
    verificarGeometriaGeoJSON(coordinates)
  }
}

document.addEventListener('click', onClick, false)

// Función para cargar archivos GeoJSON y dibujarlos
function cargarGeoJSON(url) {
  return fetch(url)
    .then(response => response.json())
    .catch(error => {
      console.error('Error al cargar el archivo GeoJSON:', error)
      return null
    })
}

async function dibujarGeojson(archivo, colores) {
  const geoJSON = await cargarGeoJSON(archivo)

  if (!geoJSON) {
    console.error(`No se pudo cargar el archivo GeoJSON: ${archivo}`)
    return
  }

  const group = new THREE.Group()

  
  geoJSON.features.forEach((feature) => {
    if (feature.geometry.type === 'MultiPolygon') {
      const coordenadas = feature.geometry.coordinates

      coordenadas.forEach((poligono) => {
        poligono.forEach((anilloExterior) => {
          const puntosXYZ = anilloExterior.map(LATLONG => {
            const { x, y, z } = convertirCoordenadasGeograficasACartesianas({
              lat: LATLONG[1],
              long: LATLONG[0]
            })
            return { x, y, z }
          })

          const linea = crearLineaDePuntos(puntosXYZ, colores)
          group.add(linea)
        })
      })
    }
  })
  archivosGeoJson[archivo] = geoJSON;

  scene.add(group)

  // Calcular el radio máximo
  const maxRadius = Math.max(...group.children.map(linea => {
    const positions = linea.geometry.attributes.position.array
    const radiusArray = []
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      radiusArray.push(Math.sqrt(x * x + y * y + z * z))
    }
    return Math.max(...radiusArray)
  }))

  // Ajustar el tamaño de la esfera del planeta
  planetRadius = maxRadius
  planet.geometry.dispose() // Limpiar geometría existente
  planet.geometry = new THREE.SphereGeometry(planetRadius, 32, 32) // Crear nueva geometría
}

// Convertir coordenadas geográficas a cartesianas
function convertirCoordenadasGeograficasACartesianas(coord) {
  const latitudeRad = (coord.lat / 180) * Math.PI
  const longitudeRad = (coord.long / 180) * Math.PI
  const radius = 5

  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  return { x, y, z }
}

// Función para verificar en qué geometría del GeoJSON se encuentra una coordenada
function verificarGeometriaGeoJSON(coordinates) {
  const point = TURF.point([coordinates.long, coordinates.lat]);

  // Recorrer las geometrías del GeoJSON y verificar la inclusión del punto
  for (const feature of archivosGeoJson['argentina.geojson'].features) {
    if (feature.geometry.type === 'Polygon') {
      const polygon = feature.geometry.coordinates[0]; // Obtener los vértices del polígono
      if (puntoEnPoligono(point, polygon)) {
        console.log('La coordenada está dentro del polígono:', feature.properties.name);
        return feature.geometry.coordinates;
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const coords of feature.geometry.coordinates) {
        const polygon = coords[0]; // Obtener los vértices del polígono
        if (puntoEnPoligono(point, polygon)) {
          console.log('La coordenada está dentro del polígono:', feature.properties.name);
          return coords;
        }
      }
    }
  }

  console.log('La coordenada no está dentro de ninguna geometría del GeoJSON.');
  return null;
}

// Función para verificar si un punto está dentro de un polígono
function puntoEnPoligono(point, polygon) {
  let intersect = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersecta = ((yi > point[1]) != (yj > point[1])) &&
                       (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersecta) intersect = !intersect;
  }
  return intersect;
}

// Crear línea de puntos para el GeoJSON
function crearLineaDePuntos(puntos, colores) {
  const material = new THREE.LineBasicMaterial({ vertexColors: true })
  const geometria = new THREE.BufferGeometry()
  const vertices = []
  const colorArray = []
  const cantidadColores = colores.length

  puntos.forEach((punto, i) => {
    vertices.push(punto.x, punto.y, punto.z)
    const color = colores[i % cantidadColores] || new THREE.Color(0xffffff)
    colorArray.push(color.r, color.g, color.b)
  })

  geometria.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  )
  geometria.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(colorArray, 3)
  )

  return new THREE.Line(geometria, material)
}

// Dibujar los archivos GeoJSON
const colores1 = [
  new THREE.Color(0xcccccc)
]
dibujarGeojson('continents.json', colores1)
const colores2 = [
  new THREE.Color(0x00ff00)
]
dibujarGeojson('argentina.geojson', colores2)

// Resizing
function onWindowResize() {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', onWindowResize)

// Función para animar el lienzo
function animate() {
  orbitControls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()
