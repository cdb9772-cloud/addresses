/**
 * Address service — upstream integration and /count behavior.
 *
 * BugFix-Count-Endpoint (Connor Bashaw):
 * - The /count endpoint was broken because `count()` called `response.size()` on the
 *   value returned from `response.json()`. The nerdstacks API returns a JSON *array* of
 *   addresses; arrays use `.length`, not `.size()` (and Map/Set use `.size` as a property,
 *   not a method). That mismatch caused runtime errors or wrong behavior.
 * - Base URL was updated from http://address.nerdstacks.org:3000/ to
 *   https://address.nerdstacks.org/ to match the course spec (HTTPS, correct host).
 * - `request()` now sends `Content-Type: application/json` so the POST body is interpreted
 *   as JSON by the upstream server (same as a typical curl -H).
 * - The class is exported by name so unit tests can call the static helper; the default
 *   export remains the singleton instance used by the rest of the app.
 * 
 * 
 * feature/zipcode-endpoint (renny):
 * - add zipcode(), looks up a city name from a given zipcode from upstream API.
 * - rejects early with clear message if body or zipcode field is missing, instead of:
 *   letting fetch fire with undefined value 
 * - upstream API returns a JSON array extract first element's city field 
 *   empty array or missing city field both resolve to a rejected promise with a mesage instead of crashing
 */
import loggerService from "./logger.service";

export class AddressService {
    // Connor Bashaw: HTTPS URL per assignment; old http + :3000 was incorrect for production API.
    private static fetchUrl = 'https://address.nerdstacks.org/';

    constructor() { }

    /**
     * Connor Bashaw: Extracted for clarity and unit testing.
     * The upstream POST returns a JSON array of address records.
     * Count is the length of that array (or 0 if the payload is unexpected).
     */
    public static countItemsFromResponsePayload(data: unknown): number {
        return Array.isArray(data) ? data.length : 0;
    }
    
    private static readonly EARTH_RADIUS_KM = 6371;
    private static readonly KM_TO_MI = 0.621371;

    
    public async count(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            loggerService.info({ path: '/address/count',
                                 message: 'Count transaction occurred' })
                                 .flush();
            if (!addressRequest?.body) {
                loggerService.warning({ path: '/address/count', 
                                        message: 'Request body is missing or null' })
                                        .flush();
                return reject({ message: 'Request body is required.' });
            }
            this.request(addressRequest)
                .then((response) => {
                    // Connor Bashaw: was `response.size()` — invalid on parsed JSON arrays.
                    resolve({
                        "count": AddressService.countItemsFromResponsePayload(response)
                    });
                })
                .catch((err) => {
                    loggerService.error({ path: '/address/count', message: `${(err as Error).message}` }).flush();
                    reject(err);
                });
        });
    }

    public async request(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            loggerService.info({ path: '/address/request',
                                 message: 'Request transaction occurred' })
                                 .flush();
            if (!addressRequest?.body) {
                loggerService.warning({ path: '/address/request', 
                                        message: 'Request body is missing or null' })  
                                        .flush();
                return reject({ message: 'Request body is required.' });
            }
            fetch(AddressService.fetchUrl, {
                method: "POST",
                // Connor Bashaw: explicit JSON header for POST body (pairs with JSON.stringify below).
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(addressRequest.body)
            })
                .then(async (response) => {
                    resolve(await response.json());
                })
                .catch((err) => {
                    loggerService.error({ path: "/address/request", message: `${(err as Error).message}` }).flush();
                    reject(err);
                });
        });
    }

    public async distance(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                loggerService.info({ path: "/address/distance", message: "Distance transaction requested." }).flush();

                if (!addressRequest || !addressRequest.body) {
                    loggerService.warning({ path: "/address/distance", message: "Missing request body for distance calculation." }).flush();
                    reject(new Error("Invalid request. A request body is required."));
                    return;
                }

                const { lat1, lon1, lat2, lon2, unit } = addressRequest.body;
                const startLatitude = this.parseCoordinate(lat1, "lat1");
                const startLongitude = this.parseCoordinate(lon1, "lon1");
                const endLatitude = this.parseCoordinate(lat2, "lat2");
                const endLongitude = this.parseCoordinate(lon2, "lon2");

                const normalizedUnit = this.normalizeUnit(unit);
                const kilometers = this.getDistance(startLatitude, startLongitude, endLatitude, endLongitude);
                const miles = kilometers * AddressService.KM_TO_MI;

                const response: { kilometers?: number; miles?: number } = {};
                if (!normalizedUnit || normalizedUnit === "km") {
                    response.kilometers = Number(kilometers.toFixed(3));
                }

                if (!normalizedUnit || normalizedUnit === "mi") {
                    response.miles = Number(miles.toFixed(3));
                }

                loggerService.info({ path: "/address/distance", message: "Distance transaction completed." }).flush();
                resolve({ distance: response });
            } catch (err) {
                loggerService.error({ path: "/address/distance", message: `${(err as Error).message}` }).flush();
                reject(err);
            }
        });
    }

    private parseCoordinate(value: unknown, field: string): number {
        if (value === null || value === undefined || value === "") {
            loggerService.warning({ path: "/address/distance", message: `Missing coordinate parameter: ${field}.` }).flush();
            throw new Error(`Invalid request. ${field} is required.`);
        }

        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            loggerService.warning({ path: "/address/distance", message: `Invalid coordinate provided for ${field}: ${value}` }).flush();
            throw new Error(`Invalid request. ${field} must be a numeric value.`);
        }

        return parsed;
    }

    private normalizeUnit(value: unknown): "km" | "mi" | undefined {
        if (value === null || value === undefined || value === "") {
            return undefined;
        }

        if (typeof value !== "string") {
            loggerService.warning({ path: "/address/distance", message: "Distance unit was provided in an invalid format." }).flush();
            throw new Error("Invalid request. unit must be either 'km' or 'mi'.");
        }

        const normalized = value.trim().toLowerCase();
        if (normalized !== "km" && normalized !== "mi") {
            loggerService.warning({ path: "/address/distance", message: `Unsupported distance unit provided: ${value}` }).flush();
            throw new Error("Invalid request. unit must be either 'km' or 'mi'.");
        }

        return normalized as "km" | "mi";
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return AddressService.EARTH_RADIUS_KM * c;
    }



    public async format(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            loggerService.info({ path: '/address/format', 
                                 message: 'format transaction occurred'})
                                 .flush();
            const body = addressRequest?.body ?? {};
            const FIELDS = ['number', 'street', 'city', 'state', 'zipcode'];
            if (!addressRequest?.body) {
                loggerService.warning({ path: '/address/format',
                                        message: 'Request body is missing or null' })
                                        .flush();
                return reject({ message: `Request body must include at least one of: ${FIELDS.join(', ')}.` });
            }
 
            if (!(FIELDS.some( f => body[f] !== undefined && 
                                    body[f] !== null && 
                                    body[f] !== ''))){ 
                loggerService.warning({ path: '/address/format', 
                                        message: `Bad request: missing required fields.}` })
                                        .flush();
                return reject({ message: `Request body must include at least one of: ${FIELDS.join(', ')}.` });
            }
 
            this.request(addressRequest)
                .then((response) => {
                    if (!Array.isArray(response)) {
                        loggerService.warning({ 
                            path: '/address/format', 
                            message: 'Upstream returned a nonarray response. Empty fallback' })
                            .flush();
                    }
                    const results = Array.isArray(response) ? response : [];
                    // formatted address looks like:
                    // <num> <st1> <st2>, <city>, <state> <zip>-<plus4>, <country>
                    // Ex: 1 MIRACLE MILE DR # 590, ROCHESTER, NY 14623-5851, US
                    const formatted = results.map(a => ({
                        latitude: a.latitude,
                        longitude: a.longitude,
                        formatted_address: [
                            [a.number, a.street, a.street2].filter(Boolean).join(' '),
                            a.city,
                            [a.state, [a.zipcode, a.plus4].filter(Boolean).join('-')].filter(Boolean).join(' '),
                            a.country
                        ].filter(Boolean).join(', ')
                    }));
                    resolve(formatted);
                })
                .catch((err) => {
                    loggerService.error({ path: '/address/format', message: `${(err as Error).message}` }).flush();
                    reject(err);
                });
        });
    }

    /** renny: looks up city name associated with zipcode
    *POSTS zipcode to upstream address API an returns city field from first result if successful, otherwise rejects with a message
    * mirrors the pattern used by `request()` and `count()`
    */
    public async zipcode(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            // log someone calling endpoint
            loggerService.info({ path: '/address/zipcode', message: 'Looking up city for zipcode:' }).flush();

            // rejects if no body sent
            if (!addressRequest?.body) {
                loggerService.warning({ path: '/address/zipcode', message: 'No body included in request' }).flush();
                return reject({ message: 'Request body is required.' });
            }
            const zipcode = addressRequest.body.zipcode;

            // zipcode must be present in the body — the upstream API returns
            //all records if no filter is given, making the city result meaningless.
            if (!zipcode) {
            if (!zipcode) {
                loggerService.warning({ path: '/address/zipcode', message: 'zipcode is missing or empty' }).flush();
                return reject({ message: 'zipcode required!' });
            }

            fetch(AddressService.fetchUrl, {
                method: "POST",
                //explicit JSON header, same pattern as `request()`.
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zipcode: zipcode })
            })
            .then(async (response) => {
                const data = await response.json();

                // upstream returns a JSON array, and empty array means no address
                if (!Array.isArray(data) || data.length === 0) {
                    loggerService.warning({ path: '/address/zipcode', message: 'no results for zipcode' }).flush();
                    return reject({ message: 'no city found matching zipcode.' });
                }
                // get city and make sure exist
                const city = data[0].city;

                //guard against a malformed upstream record that has no city field
                if (!city) {
                    loggerService.warning({ path: '/address/zipcode', message: 'result has no city field' }).flush();
                    return reject({ message: 'no city found matching zipcode.' });
                }
                resolve({ city: city });
            })
            .catch((err) => {
                loggerService.error({ path: '/address/zipcode', message: (err as Error).message }).flush();
                reject(err);
            });

        });
    }
 
}



// Connor Bashaw: named export is `AddressService`; default export is the singleton for endpoints/services.
const addressService = new AddressService();
export default addressService;