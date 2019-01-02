var bcrypt = require('bcryptjs');

const state = { 
  instanceID: Math.random().toString(36).substring(3)
};

exports.handler = (request, response) => {
  console.log(`[STATE]${JSON.stringify(state)}[ENDSTATE]`);

  const randomString = Math.random().toString(36).substring(7);
  var hash = bcrypt.hashSync(randomString, 9);

  response.status(200).send(`GCP_JSBcrypt_${state.instanceID}`);
};
