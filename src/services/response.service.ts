/**
 * Wraps a response body in a standardized envelope shape used across all endpoints.
 *
 * @param status - The result status (e.g. `"OK"`, `"ERROR"`).
 * @param event_type - The event type describing the operation (e.g. `"READ"`).
 * @param body - The response payload to wrap.
 * @returns A structured response object:
 *   ```json
 *   { "status": "<status>", "event": "<event_type>", "body": <body> }
 *   ```
 */
const responseWrapper = (status: string, event_type: string, body: unknown): { status: string; event: string; body: unknown } => {
    return { status: status, event: event_type, body };
}

export default responseWrapper;