import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { CelestialBody, GalaxyStar, PerformanceStats, SimulationState, Vector3 } from '../engine/types';
import { defaultRenderConfig } from '../physics/config';

type SpaceViewportProps = {
  galaxy: GalaxyStar[];
  simulation: SimulationState;
  selectedId?: string;
  onSelect: (body: CelestialBody | undefined) => void;
  onStarSelect: (star: GalaxyStar) => void;
  onStats: (stats: PerformanceStats) => void;
  onCamera: (position: Vector3) => void;
};

const bodyMaterial = (body: CelestialBody): THREE.Material => {
  if (body.type === 'black-hole') {
    return new THREE.MeshBasicMaterial({ color: '#000000' });
  }
  if (body.type === 'star') {
    return new THREE.MeshBasicMaterial({ color: body.color });
  }
  return new THREE.MeshStandardMaterial({
    color: body.color,
    roughness: 0.82,
    metalness: 0.04
  });
};

const toThree = (v: Vector3): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z);

const makeRoundStarTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const makeOrbitLine = (body: CelestialBody, parent?: CelestialBody): THREE.Line | undefined => {
  if (!body.orbit) return undefined;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 240; i += 1) {
    const phase = (i / 240) * Math.PI * 2;
    const distance = body.orbit.semiMajorAxis * (1 - body.orbit.eccentricity * body.orbit.eccentricity) / (1 + body.orbit.eccentricity * Math.cos(phase));
    points.push(new THREE.Vector3(Math.cos(phase) * distance, Math.sin(body.orbit.inclination) * distance * 0.12, Math.sin(phase) * distance));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: '#64748b', transparent: true, opacity: 0.28 })
  );
};

export const SpaceViewport = ({ galaxy, simulation, selectedId, onSelect, onStarSelect, onStats, onCamera }: SpaceViewportProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const trailGroupRef = useRef<THREE.Group | null>(null);
  const bodyMeshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const orbitLineMapRef = useRef<Map<string, THREE.Line>>(new Map());
  const asteroidInstancedRef = useRef<{ mesh: THREE.InstancedMesh; bodies: CelestialBody[] } | null>(null);
  const selectedMarkerRef = useRef<THREE.Mesh | null>(null);
  const starMeshRef = useRef<THREE.Points | null>(null);
  const galaxyRef = useRef<GalaxyStar[]>(galaxy);
  const simulationRef = useRef(simulation);
  const callbacksRef = useRef({ onSelect, onStarSelect, onStats, onCamera });
  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.1);
  const statsRef = useRef({ frames: 0, last: performance.now(), fps: 0 });

  useEffect(() => {
    galaxyRef.current = galaxy;
  }, [galaxy]);

  useEffect(() => {
    simulationRef.current = simulation;
    callbacksRef.current = { onSelect, onStarSelect, onStats, onCamera };
  }, [simulation, onSelect, onStarSelect, onStats, onCamera]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#02040a');
    scene.fog = new THREE.FogExp2('#02040a', 0.000018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth / mount.clientHeight, 0.1, 36000);
    camera.position.set(0, 180, 760);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = defaultRenderConfig.exposure;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const bodyGroup = new THREE.Group();
    const orbitGroup = new THREE.Group();
    const trailGroup = new THREE.Group();
    bodyGroupRef.current = bodyGroup;
    orbitGroupRef.current = orbitGroup;
    trailGroupRef.current = trailGroup;
    scene.add(orbitGroup, trailGroup, bodyGroup);

    const galaxyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(galaxy.length * 3);
    const colors = new Float32Array(galaxy.length * 3);
    const color = new THREE.Color();
    galaxy.forEach((star, index) => {
      positions[index * 3] = star.position.x;
      positions[index * 3 + 1] = star.position.y;
      positions[index * 3 + 2] = star.position.z;
      color.set(star.color);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });
    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const roundStarTexture = makeRoundStarTexture();
    const galaxyMaterial = new THREE.PointsMaterial({
      size: 7.5,
      sizeAttenuation: false,
      map: roundStarTexture,
      alphaTest: 0.02,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const starMesh = new THREE.Points(galaxyGeometry, galaxyMaterial);
    starMeshRef.current = starMesh;
    scene.add(starMesh);

    const starGlow = new THREE.Points(
      galaxyGeometry,
      new THREE.PointsMaterial({
        size: 22,
        sizeAttenuation: false,
        map: roundStarTexture,
        alphaTest: 0.01,
        vertexColors: true,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false
      })
    );
    scene.add(starGlow);

    scene.add(new THREE.AmbientLight('#94a3b8', 0.18));
    const keyLight = new THREE.PointLight('#fff7d6', 2.4, 2800, 1.25);
    keyLight.position.set(0, 0, 0);
    scene.add(keyLight);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const onKeyDown = (event: KeyboardEvent) => keysRef.current.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      yawRef.current -= event.movementX * 0.002;
      pitchRef.current = THREE.MathUtils.clamp(pitchRef.current - event.movementY * 0.002, -1.45, 1.45);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      renderer.domElement.requestPointerLock().catch(() => undefined);

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points = { threshold: 280 };
      raycaster.setFromCamera(mouse, camera);
      const bodyHits = raycaster.intersectObjects([...bodyMeshMapRef.current.values()], true);
      const bodyId = bodyHits[0]?.object.userData.bodyId ?? bodyHits[0]?.object.parent?.userData.bodyId;
      if (bodyId) {
        callbacksRef.current.onSelect(simulationRef.current.system.bodies.find((body) => body.id === bodyId));
        return;
      }
      const starHits = starMeshRef.current ? raycaster.intersectObject(starMeshRef.current) : [];
      if (starHits[0]?.index !== undefined) {
        callbacksRef.current.onStarSelect(galaxyRef.current[starHits[0].index]);
      }
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    let previous = performance.now();
    let animationId = 0;
    const animate = () => {
      const frameStart = performance.now();
      const delta = Math.min((frameStart - previous) / 1000, 0.05);
      previous = frameStart;

      const direction = new THREE.Vector3();
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0);
      const speed = keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight') ? 1150 : 360;
      if (keysRef.current.has('KeyW')) direction.add(forward);
      if (keysRef.current.has('KeyS')) direction.sub(forward);
      if (keysRef.current.has('KeyD')) direction.add(right);
      if (keysRef.current.has('KeyA')) direction.sub(right);
      if (keysRef.current.has('KeyE') || keysRef.current.has('Space')) direction.add(up);
      if (keysRef.current.has('KeyQ') || keysRef.current.has('ControlLeft')) direction.sub(up);
      if (direction.lengthSq() > 0) camera.position.add(direction.normalize().multiplyScalar(speed * delta));
      callbacksRef.current.onCamera({ x: camera.position.x, y: camera.position.y, z: camera.position.z });

      renderer.render(scene, camera);
      const renderMs = performance.now() - frameStart;
      statsRef.current.frames += 1;
      if (frameStart - statsRef.current.last >= 500) {
        statsRef.current.fps = (statsRef.current.frames * 1000) / (frameStart - statsRef.current.last);
        statsRef.current.frames = 0;
        statsRef.current.last = frameStart;
        callbacksRef.current.onStats({
          fps: statsRef.current.fps,
          bodyCount: simulationRef.current.system.bodies.length,
          simulationMs: 0,
          renderMs
        });
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const bodyGroup = bodyGroupRef.current;
    const orbitGroup = orbitGroupRef.current;
    const trailGroup = trailGroupRef.current;
    if (!bodyGroup || !orbitGroup || !trailGroup) return;

    bodyGroup.clear();
    orbitGroup.clear();
    trailGroup.clear();
    bodyMeshMapRef.current.clear();
    orbitLineMapRef.current.clear();
    asteroidInstancedRef.current = null;
    selectedMarkerRef.current = null;

    const asteroidBodies = simulation.system.bodies.filter((body) => body.type === 'asteroid');
    const regularBodies = simulation.system.bodies.filter((body) => body.type !== 'asteroid');

    regularBodies.forEach((body) => {
      const widthSegments = body.type === 'star' ? 32 : body.radius < 2 ? 12 : 20;
      const heightSegments = body.type === 'star' ? 16 : body.radius < 2 ? 8 : 12;
      const geometry = body.type === 'black-hole' ? new THREE.SphereGeometry(body.radius, 16, 10) : new THREE.SphereGeometry(body.radius, widthSegments, heightSegments);
      const mesh = new THREE.Mesh(geometry, bodyMaterial(body));
      mesh.position.copy(toThree(body.position));
      mesh.userData.bodyId = body.id;
      mesh.frustumCulled = true;
      bodyMeshMapRef.current.set(body.id, mesh);
      bodyGroup.add(mesh);

      if (body.hasAtmosphere) {
        const atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(body.radius * 1.08, 16, 10),
          new THREE.MeshBasicMaterial({ color: body.atmosphereColor ?? '#93c5fd', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending })
        );
        atmosphere.userData.bodyId = body.id;
        mesh.add(atmosphere);
      }

      if (body.hasRings) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(body.radius * 1.45, body.radius * 2.4, 48),
          new THREE.MeshBasicMaterial({ color: body.ringColor ?? '#a8a29e', transparent: true, opacity: 0.42, side: THREE.DoubleSide })
        );
        ring.rotation.x = Math.PI / 2.5;
        ring.userData.bodyId = body.id;
        mesh.add(ring);
      }
    });

    if (asteroidBodies.length > 0) {
      const geometry = new THREE.DodecahedronGeometry(1, 0);
      const material = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.95 });
      const instanced = new THREE.InstancedMesh(geometry, material, asteroidBodies.length);
      const matrix = new THREE.Matrix4();
      asteroidBodies.forEach((body, index) => {
        matrix.compose(toThree(body.position), new THREE.Quaternion(), new THREE.Vector3(body.radius, body.radius, body.radius));
        instanced.setMatrixAt(index, matrix);
      });
      instanced.instanceMatrix.needsUpdate = true;
      asteroidInstancedRef.current = { mesh: instanced, bodies: asteroidBodies };
      bodyGroup.add(instanced);
    }

    const bodyById = new Map(simulation.system.bodies.map((body) => [body.id, body]));
    simulation.system.bodies.forEach((body) => {
      const parent = body.orbit?.parentId ? bodyById.get(body.orbit.parentId) : undefined;
      const orbit = makeOrbitLine(body, parent);
      if (orbit) {
        if (parent) orbit.position.copy(toThree(parent.position));
        orbitLineMapRef.current.set(body.id, orbit);
        orbitGroup.add(orbit);
      }
    });

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 1.72, 72),
      new THREE.MeshBasicMaterial({ color: '#e2e8f0', transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    marker.visible = false;
    selectedMarkerRef.current = marker;
    bodyGroup.add(marker);
  }, [simulation.system.seed, simulation.system.bodies.length]);

  useEffect(() => {
    const trailGroup = trailGroupRef.current;
    if (!trailGroup) return;

    const cameraPosition = cameraRef.current ? toThree(cameraRef.current.position) : new THREE.Vector3(0, 0, 0);
    const cullingDistanceSq = defaultRenderConfig.cullingDistance * defaultRenderConfig.cullingDistance;
    const matrix = new THREE.Matrix4();
    const bodyById = new Map(simulation.system.bodies.map((body) => [body.id, body]));

    simulation.system.bodies.forEach((body) => {
      const mesh = bodyMeshMapRef.current.get(body.id);
      if (mesh) {
        mesh.position.copy(toThree(body.position));
        mesh.visible = body.type === 'star' || mesh.position.distanceToSquared(cameraPosition) <= cullingDistanceSq;
      }

      const orbit = orbitLineMapRef.current.get(body.id);
      const parent = body.orbit?.parentId ? bodyById.get(body.orbit.parentId) : undefined;
      if (orbit && parent) orbit.position.copy(toThree(parent.position));
    });

    const asteroidData = asteroidInstancedRef.current;
    if (asteroidData) {
      asteroidData.bodies.forEach((body, index) => {
        const current = bodyById.get(body.id) ?? body;
        matrix.compose(toThree(current.position), new THREE.Quaternion(), new THREE.Vector3(current.radius, current.radius, current.radius));
        asteroidData.mesh.setMatrixAt(index, matrix);
      });
      asteroidData.mesh.instanceMatrix.needsUpdate = true;
    }

    const selected = selectedId ? bodyById.get(selectedId) : undefined;
    const selectedMarker = selectedMarkerRef.current;
    if (selectedMarker && selected) {
      selectedMarker.visible = true;
      selectedMarker.position.copy(toThree(selected.position));
      selectedMarker.scale.setScalar(selected.radius * 1.15);
      selectedMarker.lookAt(cameraPosition);
    } else if (selectedMarker) {
      selectedMarker.visible = false;
    }

    trailGroup.clear();
    if (simulation.trailsEnabled) {
      simulation.system.bodies.forEach((body) => {
        if (!body.trail || body.trail.length <= 2 || body.type === 'asteroid') return;
        const trail = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(body.trail.map(toThree)),
          new THREE.LineBasicMaterial({ color: body.color, transparent: true, opacity: body.type === 'star' ? 0.15 : 0.45 })
        );
        trail.frustumCulled = true;
        trailGroup.add(trail);
      });
    }
  }, [simulation.system.bodies, simulation.trailsEnabled, selectedId]);

  return <div className="space-viewport" ref={mountRef} />;
};
