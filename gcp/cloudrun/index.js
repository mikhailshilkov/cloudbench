const instance = `RAND:${Math.random().toString(36).substring(3)}`;
let count = 0;

const express = require('express');
const app = express();

app.get('/', (req, response) => {
  response
    .status(200)
    .set('Content-Type', 'text/plain')
    .set('X-CB-Name', `GCP_CloudRun`)
    .set('X-CB-Count', count)
    .set('X-CB-Instance', instance)
    .send(`GCP_CouldRun_${instance}`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('App listening on port', port);
});
