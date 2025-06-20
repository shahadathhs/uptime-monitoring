import { sendError } from '#utils/response.js';

export function validateUrlBody(body, res) {
  if (!body || typeof body.url !== 'string') {
    sendError(res, '`url` is required', 400);
    return false;
  }
  try {
    new URL(body.url);
    return true;
  } catch {
    sendError(res, '`url` must be a valid URL', 400);
    return false;
  }
}
