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

    public async count(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            this.request(addressRequest)
                .then((response) => {
                    // Connor Bashaw: was `response.size()` — invalid on parsed JSON arrays.
                    resolve({
                        "count": AddressService.countItemsFromResponsePayload(response)
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    public async request(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
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
        // Complete this
    }

    // private async getDistance(lat1: string, lon1: string, lat2: string, lon2: string) {
    //     // Defining this function inside of this private method means it's
    //     // not accessible outside of it, which is perfect for encapsulation.
    //     const toRadians = (degrees: string) => {
    //         return degrees * (Math.PI / 180);
    //     }

    //     // Radius of the Earth in KM
    //     const R = 6371;

    //     // Convert Lat and Longs to Radians
    //     const dLat = toRadians(lat2 - lat1);
    //     const dLon = toRadians(lon2 - lon1);

    //     // Haversine Formula to calculate the distance between two locations
    //     // on a sphere.
    //     const a =
    //         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //         Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    //         Math.sin(dLon / 2) * Math.sin(dLon / 2);

    //     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //     // convert and return distance in KM
    //     return R * c;
    // }


    public async denormalize(addressRequest?: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const body = addressRequest?.body ?? {};
            const FIELDS = ['number', 'street', 'city', 'state', 'zipcode'];
 
            if (!(FIELDS.some( f => body[f] !== undefined && 
                                    body[f] !== null && 
                                    body[f] !== ''))) 
                return reject({ message: `Request body must include at least one of: ${FIELDS.join(', ')}.` });
            
 
            this.request(addressRequest)
                .then((response) => {
                    const results = Array.isArray(response) ? response : [];
                    // formatted address looks like:
                    // <num> <st1> <st2>, <city>, <state> <zip>-<plus4>, <country>
                    // Ex: 1 MIRACLE MILE DR # 590, ROCHESTER, NY 14623-5851, US
                    const denormalized = results.map(a => ({
                        latitude: a.latitude,
                        longitude: a.longitude,
                        formatted_address: [
                            [a.number, a.street, a.street2].filter(Boolean).join(' '),
                            a.city,
                            [a.state, [a.zipcode, a.plus4].filter(Boolean).join('-')].filter(Boolean).join(' '),
                            a.country
                        ].filter(Boolean).join(', ')
                    }));
                    resolve(denormalized);
                })
                .catch((err) => {
                    loggerService.error({ path: '/address/denormalize', message: `${(err as Error).message}` }).flush();
                    reject(err);
                });
        });
    }
 
}



// Connor Bashaw: named export is `AddressService`; default export is the singleton for endpoints/services.
const addressService = new AddressService();
export default addressService;