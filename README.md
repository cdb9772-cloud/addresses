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
- anything else -> uses JavaScript files in `dist/endpoints/*.js`

If you run `npm run dev` without setting `ENV=dev`, requests may return generic:
- `{"error":{"status":400,"message":"Bad Request"}}`

Use this for local testing:
- `ENV=dev npm run dev`

## Address Endpoints

- `POST /address/request`
- `POST /address/count`
- `POST /address/distance`

## Distance Feature (What Was Added)

The `distance()` function in `src/services/address.service.ts` was completed to calculate the distance between two geographic points using latitude and longitude.

### Inputs

`POST /address/distance` expects JSON:

```json
{
  "lat1": 43.1566,
  "lon1": -77.6088,
  "lat2": 42.8864,
  "lon2": -78.8784,
  "unit": "km"
}
```

Required fields:
- `lat1`, `lon1`, `lat2`, `lon2` (must be numeric)

Optional field:
- `unit` (must be `"km"` or `"mi"` if provided)

### Output Rules

If `unit` is omitted:
- Returns both units in one response object:
  - `{ "distance": { "kilometers": <number>, "miles": <number> } }`

If `unit` is `"km"`:
- Returns kilometers only:
  - `{ "distance": { "kilometers": <number> } }`

If `unit` is `"mi"`:
- Returns miles only:
  - `{ "distance": { "miles": <number> } }`

This follows the best-practice rule that multiple return types are grouped inside one response object.

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
  - when a new distance transaction starts
  - when distance calculation completes successfully
- `warning` logs:
  - when user-provided input is invalid but handled (missing/invalid coordinates, unsupported unit)
- `error` logs:
  - when an exception is thrown and caught during execution

## Unit and Integration Tests Added

### Service tests (`src/services/address.service.test.ts`)

Positive cases:
- Returns both kilometers and miles when `unit` is not provided
- Returns kilometers only for `"km"`
- Returns miles only for `"mi"`

Negative cases:
- Rejects when a coordinate is missing/null
- Rejects when `unit` is unsupported

Known error case:
- Simulated unexpected exception (throwing `body` getter) to ensure catch/log/reject path works

### Endpoint tests (`src/app.test.ts`)

Positive case:
- `POST /address/distance` returns `200` and valid distance object

Negative case:
- Invalid distance input returns `400` and failed response

## How To Test (Commands)

Run all tests:
- `npm test`

Run a single file:
- `npm test -- src/services/address.service.test.ts`
- `npm test -- src/app.test.ts`

Run tests in-band (useful for cleaner debug output):
- `npm test -- --runInBand`

## Manual API Testing Examples

### 1) Both units

```bash
curl -X POST http://localhost:3000/address/distance \
  -H "Content-Type: application/json" \
  -d '{"lat1":43.1566,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784}'
```

### 2) Kilometers only

```bash
curl -X POST http://localhost:3000/address/distance \
  -H "Content-Type: application/json" \
  -d '{"lat1":43.1566,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784,"unit":"km"}'
```

### 3) Miles only

```bash
curl -X POST http://localhost:3000/address/distance \
  -H "Content-Type: application/json" \
  -d '{"lat1":43.1566,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784,"unit":"mi"}'
```

### 4) Invalid input (expected failure)

```bash
curl -X POST http://localhost:3000/address/distance \
  -H "Content-Type: application/json" \
  -d '{"lat1":null,"lon1":-77.6088,"lat2":42.8864,"lon2":-78.8784}'
```

Expected behavior: HTTP `400` with failed response wrapper.

## Professor Defense Notes (Short Talking Points)

- Implemented distance using a standard geospatial formula (Haversine), not ad hoc math.
- Enforced strict input validation and null checks to prevent runtime faults.
- Followed layered exception handling:
  - service detects and throws/rejects
  - endpoint catches and converts to safe client response
- Added logging by severity (`info`, `warning`, `error`) according to event type.
- Added both unit and endpoint tests for:
  - positive behavior
  - invalid user input
  - known exception path
- Verified with `npm test` that all tests pass.