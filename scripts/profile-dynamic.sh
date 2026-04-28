#!/usr/bin/env bash
set -euo pipefail

# Dynamic profiling runner for local use and CI.
# - Builds project
# - Starts profiled server
# - Sends repeatable workload
# - Stops server and prints CPU hotspot summary

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

PORT="${PROFILE_PORT:-5001}"
ITERATIONS="${PROFILE_ITERATIONS:-40}"
OUT_CPU="${PROFILE_CPU_FILE:-ci.cpu.cpuprofile}"
OUT_HEAP="${PROFILE_HEAP_FILE:-ci.heap.heapprofile}"
SERVER_LOG="${PROFILE_SERVER_LOG:-profile-server.log}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill -INT "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "[profile] building project..."
npm run build >/dev/null

echo "[profile] removing previous profile artifacts..."
rm -f "${OUT_CPU}" "${OUT_HEAP}" "${SERVER_LOG}"

echo "[profile] starting profiled server on port ${PORT}..."
ENV=dev SERVER_PORT="${PORT}" node \
  --cpu-prof \
  --cpu-prof-name="${OUT_CPU}" \
  --heap-prof \
  --heap-prof-name="${OUT_HEAP}" \
  dist/src/server.js >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

# Give the server a moment to bind port.
sleep 1

echo "[profile] sending ${ITERATIONS} requests to /address/distance..."
for _ in $(seq 1 "${ITERATIONS}"); do
  curl -s -o /dev/null -X POST "http://localhost:${PORT}/address/distance" \
    -H "Content-Type: application/json" \
    -d '{"lat1":43.1566,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784,"unit":"km"}'
done

echo "[profile] stopping profiled server..."
kill -INT "${SERVER_PID}" >/dev/null 2>&1 || true
wait "${SERVER_PID}" >/dev/null 2>&1 || true
unset SERVER_PID

echo "[profile] CPU hotspot summary from ${OUT_CPU}:"
node -e 'const fs=require("fs");const file=process.argv[1];const p=JSON.parse(fs.readFileSync(file,"utf8"));const idMap=new Map((p.nodes||[]).map(n=>[n.id,n]));const counts=new Map();for(const id of (p.samples||[])){counts.set(id,(counts.get(id)||0)+1);}const total=(p.samples||[]).length||1;const rows=[...counts.entries()].map(([id,c])=>{const n=idMap.get(id)||{};const cf=n.callFrame||{};return {pct:(c/total*100),samples:c,name:(cf.functionName||"(anonymous)"),url:(cf.url||"")};}).sort((a,b)=>b.samples-a.samples).slice(0,10);console.log("TOTAL_SAMPLES="+total);for(const r of rows){console.log(`${r.pct.toFixed(2)}%\t${r.samples}\t${r.name}\t${r.url}`);}' "${OUT_CPU}"

echo "[profile] done."
echo "[profile] generated files: ${OUT_CPU}, ${OUT_HEAP}, ${SERVER_LOG}"
