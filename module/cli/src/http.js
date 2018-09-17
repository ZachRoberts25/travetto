const url = require('url');
const http = require('http');

const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  css: 'text/css',
  html: 'text/html',
  txt: 'text/plain',
  js: 'text/javascript',
  json: 'application/json'
};

const CHECK_SCRIPT = `<head>
<script>
  let last_ts = undefined;
  setInterval(() => {
    const now = Date.now();
    fetch('/check', { method: 'POST' }).then(res => {
      res.json().then(({timestamp}) => {
        if (last_ts === undefined) {
          last_ts = timestamp;
        } else if (last_ts !== timestamp) {
          location.reload();
        }
      });
    });
  }, 500);
</script>
`;

exports.Server = function Server(handler, port) {

  let timestamp = Date.now();

  if (handler.onChange) {
    handler.onChange(() => timestamp = Date.now());
  }

  http.createServer(async (request, response) => {
    request.url = `http://localhost:${port}${request.url}`;
    const reqUrl = new url.URL(request.url);
    const ext = reqUrl.pathname.split('.').pop();

    let contentType;
    let content;

    try {
      if (reqUrl.pathname === '/check') {
        content = { timestamp };
        contentType = CONTENT_TYPES.json;
      } else {
        const res = await handler.resolve(request);
        content = res.content;

        if (res.contentType) {
          contentType = res.contentType;
        } else {
          contentType = CONTENT_TYPES[ext];
        }
      }

      if (contentType === CONTENT_TYPES.json && typeof content !== 'string') {
        content = JSON.stringify(content);
      } else if (contentType === CONTENT_TYPES.html && handler.onChange) {
        content = content.replace(/<head>/, CHECK_SCRIPT);
      }
    } catch (e) {
      content = new Error(e).stack;
      contentType = CONTENT_TYPES.txt;
    }

    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('Content-Type', contentType);
    response.write(content);
    response.end();
  }).listen(port);
};