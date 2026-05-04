# Dynamic Profiling Script (Step-by-Step)

Copy/paste these commands in order from project root.

## 1) Build
```bash
cd /Users/connorbashaw/Desktop/iste422/addresses
npm run build
```

## 2) Start profiled server (Terminal A)
```bash
ENV=dev SERVER_PORT=5001 node --cpu-prof --cpu-prof-name=cpu.cpuprofile --heap-prof --heap-prof-name=heap.heapprofile dist/src/server.js
```

## 3) Run workload (Terminal B)
```bash
for i in $(seq 1 80); do
  curl -s -o /dev/null -X POST "http://localhost:5001/address/distance" -H "Content-Type: application/json" -d '{"lat1":43.1566,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784,"unit":"km"}'
  curl -s -o /dev/null -X POST "http://localhost:5001/address/request" -H "Content-Type: application/json" -d '{"number":"1","street":"MIRACLE MILE DR","city":"ROCHESTER","state":"NY","zipcode":"14623"}'
  curl -s -o /dev/null -X POST "http://localhost:5001/address/format" -H "Content-Type: application/json" -d '{"number":"1","street":"MIRACLE MILE DR","city":"ROCHESTER","state":"NY","zipcode":"14623"}'
  curl -s -o /dev/null -X POST "http://localhost:5001/address/count" -H "Content-Type: application/json" -d '{"city":"ROCHESTER","state":"NY"}'
  curl -s -o /dev/null -X POST "http://localhost:5001/address/zipcode" -H "Content-Type: application/json" -d '{"zipcode":"14623"}'
done
```

## 4) Stop profiled server (Terminal A)
Press `Ctrl + C`

## 5) Endpoint timing benchmark
```bash
ENV=dev SERVER_PORT=5002 node dist/src/server.js
```

In a second terminal:
```bash
node -e 'const {spawnSync}=require("child_process");const tests=[{name:"distance",path:"/address/distance",body:{lat1:43.1566,lon1:-77.6088,lat2:42.8864,lon2:-78.8784,unit:"km"}},{name:"request",path:"/address/request",body:{number:"1",street:"MIRACLE MILE DR",city:"ROCHESTER",state:"NY",zipcode:"14623"}},{name:"format",path:"/address/format",body:{number:"1",street:"MIRACLE MILE DR",city:"ROCHESTER",state:"NY",zipcode:"14623"}},{name:"count",path:"/address/count",body:{city:"ROCHESTER",state:"NY"}},{name:"zipcode",path:"/address/zipcode",body:{zipcode:"14623"}}];for(const t of tests){let sum=0,max=0;for(let i=0;i<10;i++){const args=["-s","-o","/dev/null","-w","%{time_total}","-X","POST",`http://localhost:5002${t.path}`,"-H","Content-Type: application/json","-d",JSON.stringify(t.body)];const r=spawnSync("curl",args,{encoding:"utf8"});const ms=parseFloat((r.stdout||"0").trim())*1000;sum+=ms;if(ms>max)max=ms;}console.log(`${t.name}\tavg_ms=${(sum/10).toFixed(2)}\tmax_ms=${max.toFixed(2)}`);}'
```

Stop the timing server with `Ctrl + C`.

## 6) CPU hotspot summary from profile
```bash
node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("cpu.cpuprofile","utf8"));const idMap=new Map((p.nodes||[]).map(n=>[n.id,n]));const counts=new Map();for(const id of (p.samples||[])){counts.set(id,(counts.get(id)||0)+1);}const total=(p.samples||[]).length||1;const rows=[...counts.entries()].map(([id,c])=>{const n=idMap.get(id)||{};const cf=n.callFrame||{};return {pct:c/total*100,samples:c,name:(cf.functionName||"(anonymous)"),url:(cf.url||"")};}).sort((a,b)=>b.samples-a.samples).slice(0,10);console.log("TOTAL_SAMPLES="+total);rows.forEach(r=>console.log(`${r.pct.toFixed(2)}%\t${r.samples}\t${r.name}\t${r.url}`));'
```

## 7) Isolated distance CPU profile
```bash
node --cpu-prof --cpu-prof-name=distance.cpu.cpuprofile --cpu-prof-interval=100 -e 'const {AddressService}=require("./dist/src/services/address.service.js");const s=new AddressService();let acc=0;for(let i=0;i<20000000;i++){acc+=s.getDistance(43.1566,-77.6088,42.8864,-78.8784);}console.log(acc.toFixed(2));'
```

## 8) Isolated distance memory footprint
```bash
/usr/bin/time -l node -e 'const {AddressService}=require("./dist/src/services/address.service.js");const s=new AddressService();let acc=0;for(let i=0;i<20000000;i++){acc+=s.getDistance(43.1566,-77.6088,42.8864,-78.8784);}console.log(acc.toFixed(2));'
```

## Output files produced
- `cpu.cpuprofile`
- `heap.heapprofile`
- `distance.cpu.cpuprofile`
- `endpoint timings` printed in terminal
- memory footprint printed in terminal
