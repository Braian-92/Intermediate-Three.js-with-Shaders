uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

attribute vec3 position;

varying vec3 vertexNormal; // Agregamos vertexNormal

attribute vec3 normal; // Cambiamos de vec2 a vec3 para normal

void main() {
   vertexNormal = normalize(normalMatrix * normal); // Pasamos el valor de normal a vertexNormal
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
