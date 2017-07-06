const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

module.exports.sendMessage = (event, context, callback) => {
  // console.log(event);
  sendSMS(event, callback);
};

function sendSMS (event, callback) {
  // convert stuff to json if needed
  let eventData;
  try {
    eventData = JSON.parse(event.body);
  } catch (e) {
    eventData = event.body;
  }
  // set up message
  const sms = {
    to: eventData.to,
    body: eventData.message || '',
    from: twilioPhoneNumber,
  };
  // use twilio SDK to send text message
  twilioClient.messages.create(sms, (error, data) => {
    // error
    if (error) {
      console.log(`error: ${error.status}`);
      console.log(`error msg: ${error.message}`);
      const errResponse = {
        statusCode: error.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: error.message,
          error: error
        }),
      };
      return callback(null, errResponse);
    }
  
    // text sent
    console.log('NEW_MESSAGE_SENT');
    console.log(`DATE_SENT: ${data.dateCreated}`);
    console.log(`TO: ${data.to}`);
    console.log(`FROM: ${data.from}`);
    console.log(`MESSAGE: ${data.body}`);
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Text sent'
      }),
    };

    callback(null, response);
  });
}
