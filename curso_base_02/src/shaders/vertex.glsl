uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
attribute vec3 position;

varying vec2 vertexUV;
attribute vec2 uv;

void main() {
   vertexUV = uv;
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
