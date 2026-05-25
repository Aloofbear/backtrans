import { ApiRequest, ApiResponse, proxyMainlandRequest } from '../_mainlandAuthProxy';

export default function handler(req: ApiRequest, res: ApiResponse) {
  return proxyMainlandRequest(req, res, '/api/auth/me', ['GET']);
}
