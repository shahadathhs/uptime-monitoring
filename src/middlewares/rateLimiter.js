import { sendError } from '#utils/response.js';

const MAX_REQUESTS = 100;
const WINDOW_MS = 60_000;

const ipMap = new Map(); // * ip → { count, startTime }

export function rateLimiter(req, res) {
  const ip = req.socket.remoteAddress;
  const now = Date.now();
  const record = ipMap.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }

  ipMap.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    sendError(res, 'Too many requests', 429);
    return false;
  }
  return true;
}
