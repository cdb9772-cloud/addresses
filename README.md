# ISTE-422 - Address API

## Set Up Your Local Dev Environment and Run

1. Install dependencies:
   - `npm install`
2. Run in development (important: force dev env for route loading):
   - `ENV=dev npm run dev`
3. Run tests:
   - `npm test`

## Important Runtime Note (Why You Might See 400 Bad Request)

This project resolves endpoint files differently based on `ENV`:
- `ENV=dev` -> uses TypeScript files in `src/endpoints/*.ts`

- anything else -> uses JavaScript files in `dist/src/endpoints/*.js`

If you run `npm run dev` without setting `ENV=dev`, requests may return generic:
- `{"error":{"status":400,"message":"Bad Request"}}`

Use this for local testing:
- `ENV=dev npm run dev`

## Address Endpoints

- `POST /address/request`
- `POST /address/count`
- `POST /address/distance`
- `POST /address/zipcode`
- `POST /address/format`

# API Usage
 
All endpoints accept and return JSON. Set `Content-Type: application/json` on every request.
 
---
 
## `GET /health`
 
Returns the health status of the service.
 
**Response**
 
```json
OK
```
 
---
 
## `POST /address/request`
 
Looks up addresses matching the provided fields against the upstream address API.
 
**Body** — at least one field required:
 
```json
{
  "number": "<street number>",
  "street": "<street name>",
  "city": "<city>",
  "state": "<state>",
  "zipcode": "<zipcode>"
}
```
 
**Response** — array of matching raw address records from the upstream API.
 
```json
{
  "status": "OK",
  "event": "READ",
  "body": [
    {
      "number": "<street number>",
      "street": "<street name>",
      "city": "<city>",
      "state": "<state>",
      "zipcode": "<zipcode>",
      "plus4": "<plus4>",
      "country": "<country>",
      "latitude": "<latitude>",
      "longitude": "<longitude>"
    }
  ]
}
```
 
---
 
## `POST /address/format`
 
Same lookup as `/request` but returns a cleaned, human-readable formatted address with coordinates. At least one of the following fields is required: `number`, `street`, `city`, `state`, `zipcode`.
 
**Body**
 
```json
{
  "number": "<street number>",
  "street": "<street name>",
  "city": "<city>",
  "state": "<state>",
  "zipcode": "<zipcode>"
}
```
 
**Response**
 
```json
{
  "status": "OK",
  "event": "READ",
  "body": [
    {
      "latitude": "<latitude>",
      "longitude": "<longitude>",
      "formatted_address": "<street number> <street name>, <city>, <state> <zipcode>-<plus4>, <country>"
    }
  ]
}
```
 
---
 
## `POST /address/count`
 
Returns the number of address records matching the provided fields. Accepts the same fields as `/request`.
 
**Body** — at least one field required:
 
```json
{
  "number": "<street number>",
  "street": "<street name>",
  "city": "<city>",
  "state": "<state>",
  "zipcode": "<zipcode>"
}
```
 
**Response**
 
```json
{
  "status": "OK",
  "event": "READ",
  "body": {
    "count": "<number of matching records>"
  }
}
```
 
---
 
## `POST /address/distance`
 
Calculates the distance between two coordinates using the Haversine formula.
 
**Body**
 
```json
{
  "lat1": "<latitude>",
  "lon1": "<longitude>",
  "lat2": "<latitude>",
  "lon2": "<longitude>",
  "unit": "<km|mi>"
}
```
 
Required fields:
- `lat1`, `lon1`, `lat2`, `lon2` (must be numeric)
Optional field:
- `unit` (must be `"km"` or `"mi"` if provided)
### Output Rules
 
If `unit` is omitted — returns both units:
```json
{
  "status": "OK",
  "event": "READ",
  "body": { "distance": { "kilometers": "<number>", "miles": "<number>" } }
}
```
 
If `unit` is `"km"` — returns kilometers only:
```json
{
  "status": "OK",
  "event": "READ",
  "body": { "distance": { "kilometers": "<number>" } }
}
```
 
If `unit` is `"mi"` — returns miles only:
```json
{
  "status": "OK",
  "event": "READ",
  "body": { "distance": { "miles": "<number>" } }
}
```
 
---
 
## `POST /address/zipcode`
 
Returns the city name associated with a given ZIP code.
 
**Body**
 
```json
{ "zipcode": "<zipcode>" }
```
 
**Response**
 
```json
{
  "status": "OK",
  "event": "READ",
  "body": {
    "city": "<city>"
  }
}
```

## Algorithm Used

Distance is calculated with the Haversine formula:
- Converts degree inputs to radians
- Uses Earth radius in kilometers (`6371`)
- Converts kilometers to miles using `0.621371`
- Rounds returned values to 3 decimal places

## Null Checks and Validation

The service validates:
- Missing request object or missing request body
- Missing coordinate fields
- Null/empty coordinate values
- Non-numeric coordinate values
- Invalid `unit` values or invalid `unit` types

For invalid but handled input, the service throws validation errors that are caught and returned through endpoint handlers as user-safe failed responses.

## Exception Handling Strategy

### In the service layer (`address.service.ts`)

- Catches unexpected exceptions in `distance()`
- Logs an error message with context
- Rejects the promise so higher layers can format the response

### In the endpoint layer (`address.endpoint.ts`)

- `distance_post()` catches service rejections
- Returns `400` with wrapped failure response
- Prevents raw exceptions from being exposed directly to end users

## Logging Behavior

Implemented to align with assignment requirements:

- `info` logs:
  - when a transaction starts
  - when distance calculation completes successfully
- `warning` logs:
  - when user-provided input is invalid but handled
- `error` logs:
  - when an exception is thrown and caught during execution

# Deployment

Deployment is to RLES VM, as it can access the upstream API. To do so, we have a job in our CICD that will invoke a self-hosted runner on the VM to run the deployment.

## Getting Started

Ensure the VM has Node.js, pm2, and Github Actions runner installed.

Then run
```bash
git clone https://<YOUR_ACCESS_TOKEN>@github.com/cdb9772-cloud/addresses ~/addresses
cd ~/addresses
echo "ENV=prod" >> .env
echo "SERVER_PORT=4900" >> .env
npm ci --omit=dev
npm run build
pm2 start dist/src/server.js --name addresses
pm2 save
```

This will keep the process running on the VM through Process Manager (pm2) and will save it through reboots.

## Continuous Deployment

Assuming the Github Action Runner is configured to track jobs from this repository, you can just run

```bash
cd ~/actions-runner
nohup ./run.sh >> ~/actions-runner/runner.log 2>&1 &
```

And it will start listening for jobs. Whenever a deploy job is received, it will rebuild the artifact and redeploy it, reloading it through pm2.

