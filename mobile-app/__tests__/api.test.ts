import { api, setAccessToken } from '../src/api';
describe('mobile API client', () => {
  beforeEach(() => { process.env.APP_ENV = 'local'; process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8080'; global.fetch = jest.fn() as jest.Mock; setAccessToken('access-token'); });
  it('sends an authenticated JSON request', async () => { (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 1 }) }); await api('/api/users/me'); expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/users/me'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) })); });
});
