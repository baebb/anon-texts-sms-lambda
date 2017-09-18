const axios = require('axios');
const uuid = require('uuid/v1');

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioUsPhoneNumber = process.env.TWILIO_US_PHONE_NUMBER;
const twilioAuPhoneNumber = process.env.TWILIO_AU_PHONE_NUMBER;

const sentMessagesURL = 'https://becqd6a376.execute-api.us-east-1.amazonaws.com/dev/sentMessages';
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
  // logging
  const msgId = uuid();
  console.log(`NEW_SEND_MESSAGE ${eventData.to} ${msgId}`);
  // determine sending number
  const numbersByCountry = {
    US: twilioUsPhoneNumber,
    AU: twilioAuPhoneNumber
  };
  const numberPrefix = {
    US: '+1',
    AU: '+61'
  };
  const formattedNumber = numberPrefix[eventData.countryCode] + eventData.to;
  // set up message
  const sms = {
    to: formattedNumber,
    body: eventData.message || '',
    from: numbersByCountry[eventData.countryCode],
  };
  // use twilio SDK to send text message
  twilioClient.messages.create(sms, (error, data) => {
    // error
    if (error) {
      console.log(`TWILIO ERROR: ${msgId} ${error.status} ${error.message}`);
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
    console.log(`SEND_MESSAGE_SENT ${data.to} ${msgId}`);
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Text sent'
      }),
    };

    // save to sentMessages DB
    axios.post(sentMessagesURL,{
      number: formattedNumber,
      countryCode: eventData.countryCode,
      message: eventData.message,
      id: msgId
    }).then((res) => {
      console.log(`SEND_MESSAGE_SAVED_TO_DB ${data.to} ${msgId}`);
      callback(null, response);
    }).catch((error) => {
      console.log(`SAVE_TO_DB_ERROR ${msgId} ${data.to}`);
      console.log(error);
    });
  });
}
