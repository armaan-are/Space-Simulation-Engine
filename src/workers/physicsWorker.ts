/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from '../engine/types';
import { generateBenchmarkBodies } from '../scenarios/benchmarks';
import { stepNBody } from '../physics/nbody';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const started = performance.now();
  const request = event.data;

  if (request.type === 'step') {
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
  const next = stepNBody(
    bodies,
    60,
    {
      ...request.config,
      collisionMerge: request.scenario.includeCollisions
    },
    false
  );
  const response: WorkerResponse = {
    type: 'benchmarkResult',
    scenarioId: request.scenario.id,
    bodyCount: request.scenario.bodyCount,
    simulationMs: performance.now() - started,
    mergedBodies: request.scenario.bodyCount - next.length
  };
  ctx.postMessage(response);
};

export {};
