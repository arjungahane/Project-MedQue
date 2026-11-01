import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

// Mock departments and operational data for serverless API endpoints
const departments = [
  { id: "aaaa1111-1111-1111-1111-111111111111", code: "CARD", name: "Cardiology", floor: "2nd Floor, Wing A", activeQueue: 4 },
  { id: "aaaa2222-2222-2222-2222-222222222222", code: "PED", name: "Pediatrics", floor: "1st Floor, Wing B", activeQueue: 3 },
  { id: "aaaa3333-3333-3333-3333-333333333333", code: "ORTH", name: "Orthopedics", floor: "3rd Floor, Wing C", activeQueue: 2 },
  { id: "aaaa4444-4444-4444-4444-444444444444", code: "GEN", name: "General Medicine", floor: "Ground Floor, Wing A", activeQueue: 6 },
  { id: "aaaa5555-5555-5555-5555-555555555555", code: "EMERG", name: "Emergency Triage", floor: "Ground Floor, ER Bay", activeQueue: 1 }
];

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const path = event.path.replace(/^\/api|\/\.netlify\/functions\/api/, "");
  const method = event.httpMethod;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Health check endpoint
  if (path === "/health" || path === "" || path === "/") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "healthy",
        service: "MedQueue Healthcare API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        active_algorithms: ["FIFO", "LIFO", "Priority-Scheduling"]
      })
    };
  }

  // Departments endpoint
  if (path === "/departments" && method === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: departments })
    };
  }

  // Queue Theory M/M/1 Calculator endpoint
  if (path === "/analytics/mm1" && method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const lambda = parseFloat(body.lambda || "8"); // arrival rate
      const mu = parseFloat(body.mu || "10"); // service rate

      if (mu <= lambda) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Queue is unstable! Service rate (μ) must be strictly greater than arrival rate (λ).",
            traffic_intensity: lambda / mu
          })
        };
      }

      const rho = lambda / mu; // Traffic intensity
      const p0 = 1 - rho; // Idle probability
      const L = lambda / (mu - lambda); // Avg number of patients in system
      const Lq = (lambda * lambda) / (mu * (mu - lambda)); // Avg patients in queue
      const W = 1 / (mu - lambda); // Avg time in system (hours)
      const Wq = lambda / (mu * (mu - lambda)); // Avg waiting time in queue (hours)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          model: "M/M/1 Queueing Model",
          lambda,
          mu,
          traffic_intensity_rho: Number(rho.toFixed(4)),
          idle_probability_p0: Number(p0.toFixed(4)),
          avg_patients_in_system_L: Number(L.toFixed(2)),
          avg_patients_in_queue_Lq: Number(Lq.toFixed(2)),
          avg_time_in_system_W_mins: Number((W * 60).toFixed(1)),
          avg_wait_in_queue_Wq_mins: Number((Wq * 60).toFixed(1))
        })
      };
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON input" })
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: "Endpoint not found", path })
  };
};
