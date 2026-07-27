import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import type * as THREE from 'three';

export function createWallRenderer(
  gl: ExpoWebGLRenderingContext,
): THREE.WebGLRenderer {
  return new Renderer({ gl }) as unknown as THREE.WebGLRenderer;
}