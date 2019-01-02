const state = { 
  instanceID: Math.random().toString(36).substring(3)
};

exports.handler = (request, response) => {
  console.log(`[STATE]${JSON.stringify(state)}[ENDSTATE]`);

  setTimeout(() => response.status(200).send(`GCP_JSPause_${state.instanceID}`), 100);
};
