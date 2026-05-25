import { proxyMainlandRequest } from '../_mainlandAuthProxy.js';

export default function handler(req: any, res: any) {
  return proxyMainlandRequest(req, res, '/api/auth/login', ['POST']);
}
