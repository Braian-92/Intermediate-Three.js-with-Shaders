import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import './style.css'

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

// Crear esfera que representa al mundo
const geometry = new THREE.SphereGeometry(5, 32, 32)
const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 })
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)

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

  scene.add(group)
}

function convertirCoordenadasGeograficasACartesianas(coord) {
  const latitudeRad = (coord.lat / 180) * Math.PI
  const longitudeRad = (coord.long / 180) * Math.PI
  const radius = 5

  const x = radius * Math.cos(latitudeRad) * Math.sin(longitudeRad)
  const y = radius * Math.sin(latitudeRad)
  const z = radius * Math.cos(latitudeRad) * Math.cos(longitudeRad)

  return { x, y, z }
}

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
