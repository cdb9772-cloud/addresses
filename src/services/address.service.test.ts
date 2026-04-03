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
