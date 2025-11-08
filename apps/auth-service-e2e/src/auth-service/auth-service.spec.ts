import axios from 'axios';

describe('Auth service health', () => {
  it('should return the health status', async () => {
    const res = await axios.get(`/api/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
  });
});
