import request from 'supertest';
import app from './app';

const mockFetchSuccess = (payload: any) => {
    global.fetch = jest.fn().mockResolvedValue({
        json: async () => payload,
    });
};

const mockFetchFailure = (message = 'network error') => {
    global.fetch = jest.fn().mockRejectedValue(new Error(message));
};


describe('200 OK', () => {
    const originalFetch = global.fetch;
    afterEach(() => { global.fetch = originalFetch; });

    it('POST /address/request returns a 200 with a valid body', async () => {
        mockFetchSuccess({city: 'New York'});

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.event).toBe('READ');
        expect(res.body.body).toBeDefined();
    });

    it('POST /address/count returns a 200 with a valid body', async () => {
        mockFetchSuccess([{ city: 'New York' }, { city: 'Rochester' }]);

        const res = await request(app)
            .post('/address/count')
            .send({ city: 'New York' });

        expect(res.status).toBe(200);
        expect(res.body.body).toEqual({ count: 2 });
    });
});

describe('400 Bad Request', () => {

    it('returns a 400 for a POST to a route that does not exist', async () => {
        const res = await request(app)
            .post('/dont')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns a 400 for a GET to a route that does not exist', async () => {
        const res = await request(app).get('/dont');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns a 400 when hitting the root path', async () => {
        const res = await request(app)
            .post('/')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a valid endpoint with an invalid sub-route', async () => {
        const res = await request(app)
            .post('/address/dont')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a GET to /address/request (only POST is supported)', async () => {
        const res = await request(app).get('/address/request');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a PUT to /address/request', async () => {
        const res = await request(app)
            .put('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a DELETE to /address/request', async () => {
        const res = await request(app).delete('/address/request');

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

describe('500 Internal Server Error', () => {
    const originalFetch = global.fetch;
    afterEach(() => { global.fetch = originalFetch; });

    it('returns 400 (and not 500) when the downstream API fails on /address/request', async () => {
        mockFetchFailure();

        const res = await request(app)
            .post('/address/request')
            .send({ city: 'New York' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('FAILED');
    });

    it('never returns 500 for invalid routes', async () => {
        const res = await request(app)
            .post('/dont')
            .send({ city: 'New York' });

        expect(res.status).not.toBe(500);
    });
});