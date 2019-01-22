const instance = `RAND:${Math.random().toString(36).substring(3)}`;
const memory = process.env.FUNCTION_MEMORY_MB;
let count = 0;

    
exports.handler = (request, response) => {
  count += 1;

  response
    .status(200)
    .set('Content-Type', 'text/plain')
    .set('X-CB-Name', `GCP_JSNoop_${memory}`)
    .set('X-CB-Count', count)
    .set('X-CB-Instance', instance)
    .send(`GCP_JSNoop_${memory}_${instance}`);
};
