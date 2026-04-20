/**
 * Unit tests for the /count fix (BugFix-Count-Endpoint).
 *
 * Connor Bashaw:
 * - Tests `countItemsFromResponsePayload` in isolation (array length vs non-arrays).
 * - Mocks `global.fetch` so `count()` does not hit the real network; asserts the resolved
 *   `{ count: n }` matches the mocked array length and that fetch uses HTTPS + JSON headers.
 * - Failure-path test ensures errors from fetch still reject the promise (logger may run).
 *
 * Run: `npm test`
 */
import addressService, { AddressService } from './address.service';

describe('AddressService.countItemsFromResponsePayload', () => {
    it('returns array length for upstream JSON array', () => {
        expect(AddressService.countItemsFromResponsePayload([])).toBe(0);
        expect(AddressService.countItemsFromResponsePayload([{ a: 1 }])).toBe(1);
        expect(AddressService.countItemsFromResponsePayload([{ a: 1 }, { b: 2 }])).toBe(2);
    });

    it('returns 0 for non-array payloads', () => {
        expect(AddressService.countItemsFromResponsePayload(null)).toBe(0);
        expect(AddressService.countItemsFromResponsePayload({})).toBe(0);
        expect(AddressService.countItemsFromResponsePayload('x')).toBe(0);
    });
});

describe('AddressService.count', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('resolves with count equal to the number of addresses returned', async () => {
        const mockAddresses = [
            { zipcode: '14623', street: 'A' },
            { zipcode: '14623', street: 'B' },
        ];
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => mockAddresses,
        });

        const result = await addressService.count({
            body: { zipcode: '14623' },
        });

        expect(result).toEqual({ count: 2 });
        expect(global.fetch).toHaveBeenCalledWith(
            'https://address.nerdstacks.org/',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zipcode: '14623' }),
            })
        );
    });

    it('rejects when fetch fails', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));

        await expect(
            addressService.count({ body: { zipcode: '14623' } })
        ).rejects.toThrow('network error');
    });
});


describe('AddressService.format', () => {
    const originalFetch = global.fetch;
 
    const mockAddress = {
        number: '1',
        street: 'MIRACLE MILE DR',
        street2: '',
        city: 'ROCHESTER',
        state: 'NY',
        zipcode: '14623',
        plus4: '5851',
        country: 'US',
        latitude: 43.0846481,
        longitude: -77.6327362,
    };
 
    beforeEach(() => {
        global.fetch = jest.fn();
    });
 
    afterEach(() => {
        global.fetch = originalFetch;
    });
 
    it('rejects when no valid fields are provided', async () => {
        await expect(
            addressService.format({ body: {} })
        ).rejects.toMatchObject({ message: expect.stringContaining('at least one of') });
    });
 
    it('rejects when body is missing entirely', async () => {
        await expect(
            addressService.format({})
        ).rejects.toMatchObject({ message: expect.stringContaining('at least one of') });
    });
 
    it('resolves with formatted results for a valid query', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => [mockAddress],
        });
 
        const result = await addressService.format({ body: { street: 'MIRACLE MILE DR' } });
 
        expect(result).toEqual([{
            latitude: 43.0846481,
            longitude: -77.6327362,
            formatted_address: '1 MIRACLE MILE DR, ROCHESTER, NY 14623-5851, US',
        }]);
    });
 
    it('includes street2 in formatted_address when present', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => [{ ...mockAddress, street2: 'APT 2' }],
        });
 
        const result = await addressService.format({ body: { street: 'MIRACLE MILE DR' } });
 
        expect(result[0].formatted_address).toBe('1 MIRACLE MILE DR APT 2, ROCHESTER, NY 14623-5851, US');
    });
 
    it('omits plus4 from formatted_address when empty', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => [{ ...mockAddress, plus4: '' }],
        });
 
        const result = await addressService.format({ body: { zipcode: '14623' } });
 
        expect(result[0].formatted_address).toBe('1 MIRACLE MILE DR, ROCHESTER, NY 14623, US');
    });
 
    it('returns multiple results when upstream returns multiple', async () => {
        const second = { ...mockAddress, number: '2', latitude: 43.085, longitude: -77.633 };
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => [mockAddress, second],
        });
 
        const result = await addressService.format({ body: { street: 'MIRACLE MILE DR' } });
 
        expect(result).toHaveLength(2);
        expect(result[0].latitude).toBe(43.0846481);
        expect(result[1].latitude).toBe(43.085);
    });
 
    it('returns empty array when upstream returns no results', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => [],
        });
 
        const result = await addressService.format({ body: { zipcode: '00000' } });
 
        expect(result).toEqual([]);
    });
 
    it('rejects when fetch fails', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
 
        await expect(
            addressService.format({ body: { zipcode: '14623' } })
        ).rejects.toThrow('network error');
            });
});

describe('AddressService.distance', () => {
    it('returns both miles and kilometers when unit is not provided', async () => {
        const result = await addressService.distance({
            body: {
                lat1: 40.7128,
                lon1: -74.0060,
                lat2: 34.0522,
                lon2: -118.2437
            }
        });

        expect(result).toHaveProperty('distance.kilometers');
        expect(result).toHaveProperty('distance.miles');
        expect(result.distance.kilometers).toBeGreaterThan(3900);
        expect(result.distance.kilometers).toBeLessThan(4000);
        expect(result.distance.miles).toBeGreaterThan(2400);
        expect(result.distance.miles).toBeLessThan(2500);
    });

    it('returns kilometers only when unit is km', async () => {
        const result = await addressService.distance({
            body: {
                lat1: 43.1566,
                lon1: -77.6088,
                lat2: 42.8864,
                lon2: -78.8784,
                unit: 'km'
            }
        });

        expect(result).toEqual({
            distance: {
                kilometers: expect.any(Number)
            }
        });
        expect(result.distance).not.toHaveProperty('miles');
    });

    it('returns miles only when unit is mi', async () => {
        const result = await addressService.distance({
            body: {
                lat1: 43.1566,
                lon1: -77.6088,
                lat2: 42.8864,
                lon2: -78.8784,
                unit: 'mi'
            }
        });

        expect(result).toEqual({
            distance: {
                miles: expect.any(Number)
            }
        });
        expect(result.distance).not.toHaveProperty('kilometers');
    });

    it('rejects when a coordinate is null or missing', async () => {
        await expect(
            addressService.distance({
                body: {
                    lat1: null,
                    lon1: -77.6088,
                    lat2: 42.8864,
                    lon2: -78.8784
                }
            })
        ).rejects.toThrow('lat1 is required');
    });

    it('rejects when unit is unsupported', async () => {
        await expect(
            addressService.distance({
                body: {
                    lat1: 43.1566,
                    lon1: -77.6088,
                    lat2: 42.8864,
                    lon2: -78.8784,
                    unit: 'meters'
                }
            })
        ).rejects.toThrow("unit must be either 'km' or 'mi'");
    });

    it('rejects when an unexpected exception occurs while reading input', async () => {
        const requestWithThrowingBody = Object.defineProperty({}, 'body', {
            get() {
                throw new Error('body getter failed');
            }
        });

        await expect(
            addressService.distance(requestWithThrowingBody)
        ).rejects.toThrow('body getter failed');
    });
});
