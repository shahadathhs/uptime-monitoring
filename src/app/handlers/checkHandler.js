import { maxChecks } from '../helpers/environments.js';
import { createRandomString, parseJSON } from '../helpers/utilities.js';
import data from '../lib/data.js';
import tokenHandler from './tokenHandler.js';

// helper to promisify callback data functions if needed
const dataRead = (dir, file) =>
  new Promise((resolve, reject) => {
    data.read(dir, file, (err, data) => (err ? reject(err) : resolve(data)));
  });

const dataCreate = (dir, file, obj) =>
  new Promise((resolve, reject) => {
    data.create(dir, file, obj, (err) => (err ? reject(err) : resolve()));
  });

const dataUpdate = (dir, file, obj) =>
  new Promise((resolve, reject) => {
    data.update(dir, file, obj, (err) => (err ? reject(err) : resolve()));
  });

const dataDelete = (dir, file) =>
  new Promise((resolve, reject) => {
    data.delete(dir, file, (err) => (err ? reject(err) : resolve()));
  });

// helper validation function
const validateCheckInput = ({
  protocol: p,
  url: u,
  method: m,
  successCodes: s,
  timeoutSeconds: t,
}) => {
  const protocol =
    typeof p === 'string' && ['http', 'https'].includes(p) ? p : false;

  const url = typeof u === 'string' && u.trim().length > 0 ? u.trim() : false;

  const method =
    typeof m === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE'].includes(m.toUpperCase())
      ? m.toUpperCase()
      : false;

  const successCodes = Array.isArray(s) && s.length > 0 ? s : false;

  const timeoutSeconds =
    typeof t === 'number' && Number.isInteger(t) && t >= 1 && t <= 5
      ? t
      : false;

  return { protocol, url, method, successCodes, timeoutSeconds };
};

const verifyToken = (token, phone) =>
  new Promise((resolve, reject) => {
    tokenHandler._token.verify(token, phone, (isValid) => {
      isValid ? resolve(true) : reject(new Error('Authentication failure'));
    });
  });

const checkHandler = {};

checkHandler.handler = (requestProperties, callback) => {
  const acceptedMethods = ['get', 'post', 'put', 'delete'];
  const method = requestProperties.method.toLowerCase();

  if (acceptedMethods.includes(method)) {
    checkHandler._check[method](requestProperties, callback);
  } else {
    callback(405);
  }
};

checkHandler._check = {};

checkHandler._check.post = async (requestProperties, callback) => {
  try {
    const { protocol, url, method, successCodes, timeoutSeconds } =
      validateCheckInput(requestProperties.body);

    if (!(protocol && url && method && successCodes && timeoutSeconds)) {
      return callback(400, { error: 'Invalid or missing inputs' });
    }

    const token =
      typeof requestProperties.headersObject.token === 'string'
        ? requestProperties.headersObject.token
        : false;

    if (!token) {
      return callback(403, { error: 'Missing token in headers' });
    }

    const tokenData = await dataRead('tokens', token);
    const tokenObj = parseJSON(tokenData);
    const userPhone = tokenObj.phone;

    const userData = await dataRead('users', userPhone);
    const userObject = parseJSON(userData);

    await verifyToken(token, userPhone);

    const userChecks = Array.isArray(userObject.checks)
      ? userObject.checks
      : [];

    if (userChecks.length >= maxChecks) {
      return callback(401, {
        error: 'User has already reached max check limit!',
      });
    }

    const checkId = createRandomString(20);
    const checkObject = {
      id: checkId,
      userPhone,
      protocol,
      url,
      method,
      successCodes,
      timeoutSeconds,
    };

    await dataCreate('checks', checkId, checkObject);

    userObject.checks = userChecks;
    userObject.checks.push(checkId);

    await dataUpdate('users', userPhone, userObject);

    callback(200, checkObject);
  } catch (err) {
    if (err.message.includes('Authentication')) {
      callback(403, { error: err.message });
    } else {
      callback(500, { error: 'Server error', details: err.message });
    }
  }
};

checkHandler._check.get = async (requestProperties, callback) => {
  try {
    const id =
      typeof requestProperties.queryStringObject.id === 'string' &&
      requestProperties.queryStringObject.id.trim().length === 20
        ? requestProperties.queryStringObject.id.trim()
        : false;

    if (!id) {
      return callback(400, { error: 'Missing or invalid check ID' });
    }

    const checkData = await dataRead('checks', id);
    const checkObject = parseJSON(checkData);

    const token =
      typeof requestProperties.headersObject.token === 'string'
        ? requestProperties.headersObject.token
        : false;

    if (!token) {
      return callback(403, { error: 'Missing token in headers' });
    }

    await verifyToken(token, checkObject.userPhone);

    callback(200, checkObject);
  } catch (err) {
    if (err.message.includes('Authentication')) {
      callback(403, { error: err.message });
    } else {
      callback(500, { error: 'Server error', details: err.message });
    }
  }
};

checkHandler._check.put = async (requestProperties, callback) => {
  try {
    const id =
      typeof requestProperties.body.id === 'string' &&
      requestProperties.body.id.trim().length === 20
        ? requestProperties.body.id.trim()
        : false;

    if (!id) {
      return callback(400, { error: 'Missing or invalid check ID' });
    }

    const { protocol, url, method, successCodes, timeoutSeconds } =
      validateCheckInput(requestProperties.body);

    if (!(protocol || url || method || successCodes || timeoutSeconds)) {
      return callback(400, {
        error: 'You must provide at least one field to update!',
      });
    }

    const checkData = await dataRead('checks', id);
    const checkObject = parseJSON(checkData);

    const token =
      typeof requestProperties.headersObject.token === 'string'
        ? requestProperties.headersObject.token
        : false;

    if (!token) {
      return callback(403, { error: 'Missing token in headers' });
    }

    await verifyToken(token, checkObject.userPhone);

    if (protocol) checkObject.protocol = protocol;
    if (url) checkObject.url = url;
    if (method) checkObject.method = method;
    if (successCodes) checkObject.successCodes = successCodes;
    if (timeoutSeconds) checkObject.timeoutSeconds = timeoutSeconds;

    await dataUpdate('checks', id, checkObject);

    callback(200);
  } catch (err) {
    if (err.message.includes('Authentication')) {
      callback(403, { error: err.message });
    } else {
      callback(500, { error: 'Server error', details: err.message });
    }
  }
};

checkHandler._check.delete = async (requestProperties, callback) => {
  try {
    const id =
      typeof requestProperties.queryStringObject.id === 'string' &&
      requestProperties.queryStringObject.id.trim().length === 20
        ? requestProperties.queryStringObject.id.trim()
        : false;

    if (!id) {
      return callback(400, { error: 'Missing or invalid check ID' });
    }

    const checkData = await dataRead('checks', id);
    const checkObject = parseJSON(checkData);

    const token =
      typeof requestProperties.headersObject.token === 'string'
        ? requestProperties.headersObject.token
        : false;

    if (!token) {
      return callback(403, { error: 'Missing token in headers' });
    }

    await verifyToken(token, checkObject.userPhone);

    await dataDelete('checks', id);

    const userData = await dataRead('users', checkObject.userPhone);
    const userObject = parseJSON(userData);

    const userChecks = Array.isArray(userObject.checks)
      ? userObject.checks
      : [];

    const checkPosition = userChecks.indexOf(id);

    if (checkPosition === -1) {
      return callback(500, {
        error: 'Check ID not found in user checks list',
      });
    }

    userChecks.splice(checkPosition, 1);
    userObject.checks = userChecks;

    await dataUpdate('users', userObject.phone, userObject);

    callback(200);
  } catch (err) {
    if (err.message.includes('Authentication')) {
      callback(403, { error: err.message });
    } else {
      callback(500, { error: 'Server error', details: err.message });
    }
  }
};

export default checkHandler;
