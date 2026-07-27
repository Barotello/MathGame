import {
  ExpoWebGLRenderingContext,
  GLView,
} from 'expo-gl';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { createWallRenderer } from './createWallRenderer';

type Props = {
  healthRatio: number;
  impactKey: number;
  paper: boolean;
};

type Particle = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
};

export function WallScene({
  healthRatio,
  impactKey,
  paper,
}: Props) {
  const healthRef = useRef(healthRatio);
  const impactKeyRef = useRef(impactKey);
  const impactAtRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    healthRef.current = healthRatio;
  }, [healthRatio]);

  useEffect(() => {
    impactKeyRef.current = impactKey;
    impactAtRef.current = Date.now();
  }, [impactKey]);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    [],
  );

  function handleContextCreate(gl: ExpoWebGLRenderingContext) {
    cleanupRef.current?.();
    const renderer = createWallRenderer(gl);
    renderer.setSize(
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
    );
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.35, 7.7);
    camera.lookAt(0, 0.2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));

    const keyLight = new THREE.DirectionalLight(
      paper ? 0xffead0 : 0xdfffb9,
      3.1,
    );
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(
      paper ? 0xb7a48f : 0x7ba4ff,
      1.8,
    );
    rimLight.position.set(5, 1, 3);
    scene.add(rimLight);

    const wall = new THREE.Group();
    scene.add(wall);

    const brickGeometry = new THREE.BoxGeometry(1.08, 0.54, 0.46);
    const brickMaterial = new THREE.MeshStandardMaterial({
      color: paper ? 0xa89784 : 0x718063,
      roughness: 0.82,
      metalness: 0.06,
    });
    const brickEdges = new THREE.EdgesGeometry(brickGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: paper ? 0x4a443f : 0xdce8cf,
      transparent: true,
      opacity: 0.55,
    });
    const bricks: THREE.Mesh[] = [];

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const brick = new THREE.Mesh(
          brickGeometry,
          brickMaterial,
        );
        brick.position.set(
          (column - 2.5) * 1.02 +
            (row % 2 === 0 ? 0 : 0.5),
          (row - 1.5) * 0.5,
          0,
        );
        brick.userData.baseX = brick.position.x;
        brick.userData.baseY = brick.position.y;
        brick.userData.phase = row * 6 + column;
        const edges = new THREE.LineSegments(
          brickEdges,
          edgeMaterial,
        );
        brick.add(edges);
        wall.add(brick);
        bricks.push(brick);
      }
    }

    const crackPatterns = [
      [
        [-2.55, 0.82],
        [-2.1, 0.56],
        [-2.28, 0.24],
        [-1.82, -0.08],
      ],
      [
        [-1.15, 1.02],
        [-0.92, 0.62],
        [-1.18, 0.32],
        [-0.76, -0.18],
        [-0.98, -0.7],
      ],
      [
        [0.15, 0.96],
        [0.42, 0.55],
        [0.18, 0.18],
        [0.62, -0.22],
        [0.36, -0.82],
      ],
      [
        [1.32, 0.78],
        [1.08, 0.42],
        [1.46, 0.08],
        [1.22, -0.34],
        [1.68, -0.72],
      ],
      [
        [2.58, 0.92],
        [2.24, 0.58],
        [2.46, 0.18],
        [2.06, -0.18],
        [2.34, -0.66],
      ],
      [
        [-0.35, 0.24],
        [-0.02, 0.02],
        [-0.26, -0.24],
        [0.08, -0.48],
      ],
    ] as const;
    const crackThresholds = [
      0,
      0.08,
      0.2,
      0.36,
      0.54,
      0.72,
    ];
    const cracks = crackPatterns.map((pattern, index) => {
      const geometry =
        new THREE.BufferGeometry().setFromPoints(
          pattern.map(
            ([x, y]) => new THREE.Vector3(x, y, 0.27),
          ),
        );
      const material = new THREE.LineBasicMaterial({
        color: paper ? 0x30251f : 0x111811,
        transparent: true,
        opacity: 0,
        depthTest: false,
      });
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 20;
      wall.add(line);

      return {
        geometry,
        material,
        threshold: crackThresholds[index]!,
      };
    });

    const particleGeometry = new THREE.IcosahedronGeometry(0.07, 0);
    const particleMaterial = new THREE.MeshStandardMaterial({
      color: paper ? 0xc9b59d : 0xb7c9a4,
      roughness: 1,
    });
    const particles: Particle[] = [];

    for (let index = 0; index < 20; index += 1) {
      const mesh = new THREE.Mesh(
        particleGeometry,
        particleMaterial,
      );
      mesh.visible = false;
      scene.add(mesh);
      particles.push({
        mesh,
        velocity: new THREE.Vector3(),
      });
    }

    let frame = 0;
    let handledImpact = impactKeyRef.current;
    let lastTime = Date.now();

    const render = () => {
      frame = requestAnimationFrame(render);
      const now = Date.now();
      const delta = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      const damage = 1 - healthRef.current;

      if (handledImpact !== impactKeyRef.current) {
        handledImpact = impactKeyRef.current;
        particles.forEach((particle, index) => {
          const angle =
            (index / particles.length) * Math.PI * 2;
          const speed = 1.1 + (index % 5) * 0.16;
          particle.mesh.visible = true;
          particle.mesh.position.set(
            ((index % 6) - 2.5) * 0.28,
            ((index % 4) - 1.5) * 0.16,
            0.45,
          );
          particle.velocity.set(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed + 0.8,
            0.5 + (index % 3) * 0.2,
          );
        });
      }

      const impactProgress = Math.min(
        1,
        (now - impactAtRef.current) / 420,
      );
      const shake =
        impactProgress < 1
          ? Math.sin(impactProgress * Math.PI * 7) *
            (1 - impactProgress) *
            0.13
          : 0;

      wall.rotation.y =
        Math.sin(now * 0.00055) * 0.045 + shake;
      wall.rotation.x = shake * 0.35;

      bricks.forEach((brick, index) => {
        const threshold = index / bricks.length;
        const loosen = Math.max(
          0,
          (damage - threshold * 0.72) * 1.6,
        );
        brick.position.x =
          brick.userData.baseX +
          Math.sin(index * 2.4) * loosen * 0.45;
        brick.position.y =
          brick.userData.baseY -
          loosen * (0.2 + (index % 3) * 0.16);
        brick.position.z =
          Math.sin(index * 1.7) * loosen * 0.42;
        brick.rotation.z =
          Math.sin(index * 2.1) * loosen * 0.18;
      });

      cracks.forEach((crack) => {
        crack.material.opacity =
          damage > crack.threshold
            ? Math.min(
                0.95,
                0.25 + (damage - crack.threshold) * 5,
              )
            : 0;
      });

      particles.forEach((particle) => {
        if (!particle.mesh.visible) return;
        particle.velocity.y -= 2.7 * delta;
        particle.mesh.position.addScaledVector(
          particle.velocity,
          delta,
        );
        particle.mesh.rotation.x += delta * 3;
        particle.mesh.rotation.y += delta * 2.2;

        if (particle.mesh.position.y < -2.4) {
          particle.mesh.visible = false;
        }
      });

      const baseColor = new THREE.Color(
        paper ? 0xa89784 : 0x718063,
      );
      const damageColor = new THREE.Color(
        paper ? 0x6c5545 : 0x384033,
      );
      brickMaterial.color
        .copy(baseColor)
        .lerp(damageColor, damage * 0.82);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();

    cleanupRef.current = () => {
      cancelAnimationFrame(frame);
      brickGeometry.dispose();
      brickEdges.dispose();
      brickMaterial.dispose();
      edgeMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      cracks.forEach((crack) => {
        crack.geometry.dispose();
        crack.material.dispose();
      });
      renderer.dispose();
    };
  }

  return (
    <View style={styles.container}>
      <GLView
        msaaSamples={4}
        onContextCreate={handleContextCreate}
        style={styles.gl}
        testID="wall-breaker-three-scene"
      />
      <View
        pointerEvents="none"
        style={[
          styles.vignette,
          paper && styles.vignettePaper,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  gl: {
    flex: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
  },
  vignettePaper: {
    borderColor: '#D8D0C8',
  },
});