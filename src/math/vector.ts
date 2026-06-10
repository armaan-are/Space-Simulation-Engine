import type { Vector3 } from '../engine/types';

export const vec3 = (x = 0, y = 0, z = 0): Vector3 => ({ x, y, z });

export const add = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
});

export const subtract = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});

export const scale = (v: Vector3, s: number): Vector3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s
});

export const lengthSq = (v: Vector3): number => v.x * v.x + v.y * v.y + v.z * v.z;

export const length = (v: Vector3): number => Math.sqrt(lengthSq(v));

export const normalize = (v: Vector3): Vector3 => {
  const mag = length(v);
  return mag === 0 ? vec3() : scale(v, 1 / mag);
};

export const distance = (a: Vector3, b: Vector3): number => length(subtract(a, b));

export const cloneVector = (v: Vector3): Vector3 => ({ x: v.x, y: v.y, z: v.z });

export const rotateY = (v: Vector3, angle: number): Vector3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: v.x * c - v.z * s,
    y: v.y,
    z: v.x * s + v.z * c
  };
};
