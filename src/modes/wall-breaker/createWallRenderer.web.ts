import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

export function createWallRenderer(
  gl: ExpoWebGLRenderingContext,
): THREE.WebGLRenderer {
  const context = gl as unknown as WebGLRenderingContext;
  const canvas = context.canvas as HTMLCanvasElement;

  return new THREE.WebGLRenderer({ canvas, context });
}