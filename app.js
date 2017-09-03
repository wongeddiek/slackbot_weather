"use strict";

//botkit to manage bot conversation
const Botkit = require('botkit');
//request for API requests
const request = require('request');
//read/write local json file
// const fs = require('fs');
// const google = require('google');

//initializing bot
const controller = Botkit.slackbot({
  debug: false
});

//reading credentials.json file
// const credentials = JSON.parse(fs.readFileSync('credentials.json'));

//initializing weather API URL path
var weatherURL = `http://api.openweathermap.org/data/2.5/weather?`;
var units = `&units=imperial`;
var weatherID = `&appid=${process.env.WEATHER_APIID}`;  //use you own Open Weather Map API key here

//function for converting degrees to compass direction
function degToCompass(num) {
  var val = Math.floor((num / 22.5) + 0.5);
  var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

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
      convo.end();
      return;
    }

    //if city is not found
    if (response.statusCode === 404) {
      console.log(`error: status code ${response.statusCode}, city not found.`);
      convo.say(`I'm sorry, I couldn't find the city you're looking for.  Let's try again.`);
      convo.repeat();
    } else if (response.statusCode === 200) {
      //parse the return data and build reply msg into a string
      let weatherInfo = JSON.parse(body);
      console.log('statusCode:', response && response.statusCode);
      let replyMsg = `Weather information in ${weatherInfo.name}: \n`;

      //get all weather condition descriptions (multiple descriptions are stored in an array)
      let weatherCondition = [];
      weatherInfo.weather.forEach(element => {
        weatherCondition.push(element.description);
      });
      replyMsg += `current condition: ${weatherCondition.join(', ')} \n`;

      replyMsg += `current temperature: ${weatherInfo.main.temp} F \n`;
      replyMsg += `current humidty: ${weatherInfo.main.humidity}% \n`;
      replyMsg += `current wind: ${weatherInfo.wind.speed}mph, ${degToCompass(weatherInfo.wind.deg)} or ${weatherInfo.wind.deg} degrees.`;
      console.log(replyMsg);
      //sends reply message to slack
      convo.say(replyMsg);
      convo.next();
    } else {
      convo.say(`Beep boop, looks like the weatherman is slacking off.  Let's try again.`);
      convo.repeat();
    }
  });
}
// connect the bot to a stream of messages
controller.spawn({
  token: process.env.SLACK_API_TOKEN, //use your own slackbot token here
}).startRTM();

//runs when bot receives dm's and mentions with keyword "weather"
controller.hears([/weather/i], ['direct_message','direct_mention','mention'], function(bot,message) {
  console.log('message received!');
  bot.startConversation(message, function(err, convo){
    //asks user which city they want the weather info for
    convo.addQuestion("What's the city you want me to get weather info for (type in [City Name, Country Name])?", function(response, convo) {
      convo.say(`Cool, you said ${response.text}.  Let me get the weather info for you...`);
      //runs the getWeather funciton and sends weather info as reply
      getWeather(response.text, convo);
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
