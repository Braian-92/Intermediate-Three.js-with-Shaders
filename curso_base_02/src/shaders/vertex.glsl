uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
attribute vec3 position;

varying vec2 vertexUV;
varying vec3 vertexNormal; // Agregamos vertexNormal

attribute vec2 uv;
attribute vec3 normal; // Cambiamos de vec2 a vec3 para normal

void main() {
   vertexUV = uv;
   vertexNormal = normal; // Pasamos el valor de normal a vertexNormal
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
