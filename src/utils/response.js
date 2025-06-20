import { jsonContent } from '#helpers/helper.js';

export function sendSuccess(res, data, statusCode = 200) {
  res.writeHead(statusCode, jsonContent);
  res.end(JSON.stringify({ success: true, data }));
}

export function sendError(res, message, statusCode = 400) {
  res.writeHead(statusCode, jsonContent);
  res.end(JSON.stringify({ success: false, error: message }));
}
