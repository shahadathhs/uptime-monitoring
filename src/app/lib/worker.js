import http from 'http';
import https from 'https';
import url from 'url';
import { sendTwilioSms } from '../helpers/notifications.js';
import { parseJSON } from '../helpers/utilities.js';
import data from './data.js';

// Worker object
const worker = {
  async gatherAllChecks() {
    try {
      const checks = await new Promise((resolve, reject) =>
        data.list('checks', (err, files) =>
          err ? reject(err) : resolve(files),
        ),
      );

      if (!checks.length) {
        console.log('No checks found to process.');
        return;
      }

      for (const check of checks) {
        try {
          const raw = await new Promise((res, rej) =>
            data.read('checks', check, (err, data) =>
              err ? rej(err) : res(data),
            ),
          );
          const checkData = parseJSON(raw);
          worker.validateCheckData(checkData);
        } catch {
          console.error(`Error reading check data for ID: ${check}`);
        }
      }
    } catch {
      console.error('Failed to list checks.');
    }
  },

  validateCheckData(data) {
    if (!data || !data.id) {
      console.log('Invalid check data.');
      return;
    }

    const checkData = {
      ...data,
      state: ['up', 'down'].includes(data.state) ? data.state : 'down',
      lastChecked:
        typeof data.lastChecked === 'number' ? data.lastChecked : false,
    };

    worker.performCheck(checkData);
  },

  performCheck(originalCheckData) {
    const {
      protocol,
      url: siteUrl,
      method,
      timeoutSeconds,
    } = originalCheckData;

    const parsedUrl = url.parse(`${protocol}://${siteUrl}`, true);
    const { hostname, path } = parsedUrl;

    const options = {
      protocol: `${protocol}:`,
      hostname,
      method: method.toUpperCase(),
      path,
      timeout: timeoutSeconds * 1000,
    };

    const libToUse = protocol === 'http' ? http : https;

    let outcomeSent = false;
    let checkOutcome = { error: false, responseCode: false };

    const req = libToUse.request(options, (res) => {
      checkOutcome.responseCode = res.statusCode;
      if (!outcomeSent) {
        worker.processCheckOutcome(originalCheckData, checkOutcome);
        outcomeSent = true;
      }
    });

    req.on('error', (err) => {
      checkOutcome = { error: true, value: err };
      if (!outcomeSent) {
        worker.processCheckOutcome(originalCheckData, checkOutcome);
        outcomeSent = true;
      }
    });

    req.on('timeout', () => {
      checkOutcome = { error: true, value: 'timeout' };
      if (!outcomeSent) {
        worker.processCheckOutcome(originalCheckData, checkOutcome);
        outcomeSent = true;
      }
    });

    req.end();
  },

  processCheckOutcome(originalCheckData, checkOutcome) {
    const isUp =
      !checkOutcome.error &&
      checkOutcome.responseCode &&
      originalCheckData.successCodes.includes(checkOutcome.responseCode);

    const newState = isUp ? 'up' : 'down';
    const alertWanted = !!(
      originalCheckData.lastChecked && originalCheckData.state !== newState
    );

    const updatedData = {
      ...originalCheckData,
      state: newState,
      lastChecked: Date.now(),
    };

    data.update('checks', updatedData.id, updatedData, (err) => {
      if (!err) {
        if (alertWanted) {
          worker.alertUserToStatusChange(updatedData);
        } else {
          console.log('No state change. No alert needed.');
        }
      } else {
        console.error('Failed to update check data.');
      }
    });
  },

  alertUserToStatusChange(data) {
    const msg = `Alert: Your check for ${data.method.toUpperCase()} ${data.protocol}://${data.url} is currently ${data.state}`;

    sendTwilioSms(data.userPhone, msg, (err) => {
      if (!err) {
        console.log(`SMS sent: ${msg}`);
      } else {
        console.error('Failed to send SMS alert.');
      }
    });
  },

  loop() {
    setInterval(() => {
      worker.gatherAllChecks();
    }, 1000 * 60);
  },

  init() {
    worker.gatherAllChecks();
    worker.loop();
  },
};

export default worker;
