var restify = require('restify');
var builder = require('botbuilder');
var algoliasearch = require('algoliasearch');
var request = require('request');
var secrets = require('./secrets.js');

//var connector = new builder.ConsoleConnector().listen();

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID || secrets.microsoft.appId,
    appPassword: process.env.MICROSOFT_APP_PASSWORD || secrets.microsoft.appPassword
});

var bot = new builder.UniversalBot(connector);

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=c564b0a7-bc68-4e0b-a45b-5b9deef4bc44&subscription-key=fe3cf5fde98f4dceb05b3fda0d3ca2ed&q=');

var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

var client = algoliasearch(secrets.algolia.applicationID, secrets.algolia.apiKey);
var index = client.initIndex('stations');

var apiUrl = 'http://52.19.35.64:5000/api/v1.0';

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3000, function () {
   console.log('%s listening to %s', server.name, server.url);
});

server.post('/api/messages', connector.listen());

bot.dialog('/', dialog);

dialog.matches('Update station status', [
  searchForStation,
  postStatus,
  function (session, results) {
    if(results.station) {
      session.send('Thanks for the heads up!');
    } else {
      session.send(results.error);
    }
  }
]);

dialog.matches('Get station status', [
  searchForStation,
  getStatus,
  function (session, results) {
    if(results.station) {
      if(results.station[0].gate.status == 0) {
        session.send('The gates at ' + results.station[0].stationName + ' are reported to be closed');
      } else {
        session.send('The gates at ' + results.station[0].stationName + ' are reported to be open!');
      }
    } else {
      session.send(results.error);
    }
  }
]);

dialog.onDefault([
  function (session, args, next) {
    session.send('Sorry, I didn\'t understand that');
  }
]);

function searchForStation(session, args, next) {
  var station = '';
  var statusString = '';
  var status;

  for (var i = 0; i < args.entities.length; i++) {
    if(args.entities[i].type == 'Station') {
      station = args.entities[i].entity;
    } else if(args.entities[i].type == 'Gate status') {
      statusString = args.entities[i].entity;
    }
  }

  switch (statusString) {
    case 'closed':
      status = 0;
      break;
    case 'open':
      status = 1;
      break;
  }

  if(station) {
    index.search(station, function(err, content) {
      if(content.hits && content.hits.length) {
        next({ crsCode: content.hits[0].crsCode, status: status });
      }
    });
  } else {
    next({ error: 'Sorry, I didn\'t understand that station' });
  }
}

function getStatus(session, args, next) {
  if(args.crsCode) {
    request(apiUrl + '/status/' + args.crsCode, function(error, response, body) {
      if(!error && body) {
        next({ station: JSON.parse(body) });
      } else {
        next({ error: 'Something went wrong with the API...' });
      }
    });
  } else {
    next({ error: 'Something went wrong...' });
  }
}

function postStatus(session, args, next) {
  if(args.crsCode && typeof args.status == 'number') {
    request({
      url: apiUrl + '/status/',
      method: 'POST',
      json: {
        crsCode: args.crsCode,
        gate: {
          status: args.status
        }
      }
    }, function(error, response, body) {
      if(!error && body) {
        next({ station: JSON.parse(body) });
      } else {
        next({ error: 'Something went wrong with the API...' });
      }
    });
  } else {
    next({ error: 'Something went wrong...' });
  }
}
