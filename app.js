'use strict';
//botkit to manage bot conversation
const Botkit = require('botkit');
//request for API requests
const request = require('request');
//read/write local json file
const fs = require('fs');
// const google = require('google');

//initializing bot
const controller = Botkit.slackbot({
  debug: false
});

//initializing weather API URL path
var weatherURL = `http://api.openweathermap.org/data/2.5/weather?`;
var units = `&units=imperial`;
var weatherID = `&appid=efd6b2d346411d1198df74f3bd9b7365`;

//function for getting weather info and bot reply:
function getWeather(city, convo){
  var fullURL;
  if (city) {
    fullURL = weatherURL + `q=${city}` + units + weatherID;
  } else {
    //default city is Cheyenne, WY
    fullURL = weatherURL + 'q=Cheyenne' + units + weatherID;
  }
  //make the weather API request
  request(fullURL, function (error, response, body) {
    // Print the error if one occurred
    if (error) {
      console.log('error:', error);
      convo.say('There was an error with the request, try again later \n' + `Error: ${error.message}`);
      return;
    }

    //if city is not found
    if (response.statusCode === 404) {
      console.log(`error: status code ${response.statusCode}, city not found.`);
      convo.say(`I'm sorry, we couldn't find the city you're looking for.`);
    } else {
      //parse the return data and build reply msg into a string
      let weatherInfo = JSON.parse(body);
      console.log('statusCode:', response && response.statusCode);
      let replyMsg = `The current weather info in ${weatherInfo.name}: \n`;
      replyMsg += `Current temperature: ${weatherInfo.main.temp} F \n`;
      replyMsg += `Current humidty: ${weatherInfo.main.humidity}% \n`;

      let weatherCondition = [];
      weatherInfo.weather.forEach(element => {
        weatherCondition.push(element.description);
      });
      replyMsg += `Current condition: ${weatherCondition.join(', ')}`;

      //sends reply message to slack
      convo.say(replyMsg);
    }
  });
}
// connect the bot to a stream of messages
controller.spawn({
  token: JSON.parse(fs.readFileSync('token.json')).token, //use your own slackbot token here
}).startRTM();

//runs when bot receives dm's and mentions with keyword "weather"
controller.hears([/weather/], ['direct_message','direct_mention','mention'], function(bot,message) {
  console.log('message received!');
  bot.startConversation(message, function(err, convo){
    //asks user which city they want the weather info for
    convo.addQuestion("What's the city you want me to get weather info for (type in [City Name, Country Name])?", function(response, convo) {
      convo.say('Cool, you said ' + response.text);
      convo.say('Let me get that information for you...');
      //runs the getWeather funciton and sends weather info as reply
      getWeather(response.text, convo);
      convo.next();
    });
  });
});

// controller.hears([/[wW]hat.?s the weather/],    ['direct_message','direct_mention','mention'],function(bot,message) {
//   console.log('message received!');
//   var fullURL = weatherURL + city + units + weatherID;
//   request(fullURL, function (error, response, body) {
//     // Print the error if one occurred
//     if(error) {
//       console.log('error:', error);
//       bot.reply(message, 'There was an error with the request, try again later');
//       return;
//     }
//     let weatherInfo = JSON.parse(body);
//     console.log('statusCode:', response && response.statusCode);
//     console.log(weatherInfo.sys);
//     let replyMsg = `The current weather info in ${weatherInfo.name}: \n`;
//     replyMsg += `Temperature: ${weatherInfo.main.temp} F \n`;
//     replyMsg += `Today's high temp is ${weatherInfo.main.temp_max} F and and low temp is ${weatherInfo.main.temp_min} F`;
//
//     bot.reply(message, replyMsg);
//   });
// });
