// dependencies
import { StringDecoder } from 'string_decoder';
import url from 'url';
import routes from '../../routes.js';
import { notFoundHandler } from './notFoundHandler.js';
import { parseJSON } from './utilities.js';

// module scaffolding
const reqResHandler = {};

reqResHandler.handler = (req, res) => {
  // parse url
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  const method = req.method.toLowerCase();
  const queryStringObject = parsedUrl.query;
  const headersObject = req.headers;

  const requestProperties = {
    parsedUrl,
    path,
    trimmedPath,
    method,
    queryStringObject,
    headersObject,
  };

  const decoder = new StringDecoder('utf-8');
  let realData = '';

  const chosenHandler = routes[trimmedPath] ?? notFoundHandler;

  req.on('data', (buffer) => {
    realData += decoder.write(buffer);
  });

  req.on('end', () => {
    realData += decoder.end();

    requestProperties.body = parseJSON(realData);

    chosenHandler(requestProperties, (statusCode = 500, payload = {}) => {
      const payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
};

export default reqResHandler;
