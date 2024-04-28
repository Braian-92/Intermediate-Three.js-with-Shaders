uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

attribute vec3 position;

varying vec2 vertexUV;
varying vec3 vertexNormal;

attribute vec2 uv;
attribute vec3 normal;

void main() {
   vertexUV = uv;
   vertexNormal = normalize(normalMatrix * normal);
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
