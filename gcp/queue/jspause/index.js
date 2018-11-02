const state = { 
  instanceID: Math.random().toString(36).substring(3)
};

exports.handler = (event, callback) => {
    console.log(`[STATE]${JSON.stringify(state)}[ENDSTATE]`);

    const message = event.data;
    setTimeout(() => {
        callback();
    }, 500);  
};