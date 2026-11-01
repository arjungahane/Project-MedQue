import { MM1Metrics } from '../types';

/**
 * Calculates M/M/1 Queueing Theory parameters
 *
 * @param lambda Arrival Rate (patients arriving per hour)
 * @param mu Service Rate (patients that can be served per hour per channel)
 * @returns MM1Metrics with all mathematical indicators and safety checks
 */
export function calculateMM1Metrics(lambda: number, mu: number): MM1Metrics {
  // Guard against invalid non-positive numbers
  const safeLambda = Math.max(0.1, lambda);
  const safeMu = Math.max(0.1, mu);

  const rho = safeLambda / safeMu; // Traffic intensity
  const is_stable = rho < 1.0;

  if (!is_stable) {
    // Unstable queue: arrivals exceed or match service capacity
    return {
      lambda: safeLambda,
      mu: safeMu,
      rho: Number(rho.toFixed(4)),
      p0: 0,
      L: Infinity,
      Lq: Infinity,
      W: Infinity,
      Wq: Infinity,
      W_minutes: Infinity,
      Wq_minutes: Infinity,
      is_stable: false,
    };
  }

  // Stable M/M/1 queue calculations
  const p0 = 1 - rho; // Probability of zero customers in system
  const L = safeLambda / (safeMu - safeLambda); // Expected patients in system
  const Lq = (safeLambda * safeLambda) / (safeMu * (safeMu - safeLambda)); // Expected patients in queue
  const W = 1 / (safeMu - safeLambda); // Expected time in system (hours)
  const Wq = safeLambda / (safeMu * (safeMu - safeLambda)); // Expected wait time in queue (hours)

  return {
    lambda: Number(safeLambda.toFixed(2)),
    mu: Number(safeMu.toFixed(2)),
    rho: Number(rho.toFixed(4)),
    p0: Number(p0.toFixed(4)),
    L: Number(L.toFixed(2)),
    Lq: Number(Lq.toFixed(2)),
    W: Number(W.toFixed(3)),
    Wq: Number(Wq.toFixed(3)),
    W_minutes: Number((W * 60).toFixed(1)),
    Wq_minutes: Number((Wq * 60).toFixed(1)),
    is_stable: true,
  };
}

/**
 * Generates theoretical curve data for M/M/1 charts
 */
export function generateQueueCurveData(currentMu: number) {
  const points = [];
  const maxLambda = currentMu * 0.95;
  const step = maxLambda / 12;

  for (let l = 0.5; l <= maxLambda; l += step) {
    const metrics = calculateMM1Metrics(l, currentMu);
    points.push({
      arrivalRate: Number(l.toFixed(1)),
      trafficIntensity: Number((metrics.rho * 100).toFixed(1)),
      avgQueueLength: metrics.Lq,
      avgWaitMinutes: metrics.Wq_minutes,
    });
  }
  return points;
}
