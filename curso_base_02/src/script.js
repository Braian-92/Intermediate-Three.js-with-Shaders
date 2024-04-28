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

async function dibujarLocalidadesDeArgentina() {
  const argentinaGeoJSON = await cargarGeoJSON('argentina.geojson')

  if (!argentinaGeoJSON) {
    console.error('No se pudo cargar el archivo GeoJSON de Argentina.')
    return
  }

  const group = new THREE.Group()

  argentinaGeoJSON.features.forEach((feature) => {
    if (feature.geometry.type === 'MultiPolygon') {
      const coordenadas = feature.geometry.coordinates

      const colores = [
        new THREE.Color(0x00ff00)
      ]

      coordenadas.forEach((poligono) => {
        let anilloExteriorXYZ = []
        poligono.forEach((anilloExterior) => {
          const anilloExteriorXYZ = anilloExterior.map(LATLONG => {
            const restXYZ = convertirCoordenadasGeograficasACartesianas({
              lat: LATLONG[1],
              long: LATLONG[0]
            })
            return { x: restXYZ.x, y: restXYZ.y, z: restXYZ.z }
          })

          const linea = crearLineasDePuntos(anilloExteriorXYZ, colores)
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
    const color = colores[colorIndex % cantidadColores] || new THREE.Color(0xffffff)
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

  return new THREE.Line(geometria, material)
}

dibujarLocalidadesDeArgentina()

//Resizing
window.addEventListener('resize', () => {
  // Actualizar tamaño del lienzo
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
})

// Función para animar el lienzo
const animate = () => {
  orbitControls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(animate)
}

animate()
