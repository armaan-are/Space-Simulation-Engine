/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from '../engine/types';
import { generateBenchmarkBodies } from '../scenarios/benchmarks';
import { stepNBody } from '../physics/nbody';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type === 'step') {
    const started = performance.now();
    const bodies = stepNBody(request.bodies, request.deltaSeconds, request.config, request.trailsEnabled);
    const response: WorkerResponse = {
      type: 'stepped',
      bodies,
      simulationMs: performance.now() - started
    };
    ctx.postMessage(response);
    return;
  }

  const bodies = generateBenchmarkBodies(request.scenario);
  const directStarted = performance.now();
  const directNext = stepNBody(
    bodies,
    60,
    {
      ...request.config,
      collisionMerge: request.scenario.includeCollisions,
      gravitySolver: 'direct'
    },
    false
  );
  const directMs = performance.now() - directStarted;

  const barnesHutStarted = performance.now();
  const barnesHutNext = stepNBody(
    bodies,
    60,
    {
      ...request.config,
      collisionMerge: request.scenario.includeCollisions,
      gravitySolver: 'barnes-hut'
    },
    false
  );
  const barnesHutMs = performance.now() - barnesHutStarted;

  const response: WorkerResponse = {
    type: 'benchmarkResult',
    result: {
      scenarioId: request.scenario.id,
      bodyCount: request.scenario.bodyCount,
      directMs,
      barnesHutMs,
      speedup: directMs / Math.max(barnesHutMs, 0.001),
      mergedBodies: Math.max(request.scenario.bodyCount - directNext.length, request.scenario.bodyCount - barnesHutNext.length)
    }
  };
  ctx.postMessage(response);
};

export {};
