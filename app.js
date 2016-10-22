var builder = require('botbuilder');
var algoliasearch = require('algoliasearch');
var secrets = require('./secrets.js');

var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=c564b0a7-bc68-4e0b-a45b-5b9deef4bc44&subscription-key=fe3cf5fde98f4dceb05b3fda0d3ca2ed&q=');

var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

var client = algoliasearch(secrets.algolia.applicationID, secrets.algolia.apiKey);
var index = client.initIndex('stations');

bot.dialog('/', dialog);

dialog.matches('Update station status', [
  searchFor,
  function (session, results) {
    if(results.station) {
      session.send('Update: ' + results.station);
      //TODO: this is where to put the post API call
    } else {
      session.send('Sorry, I didn\'t understand that station.');
    }
  }
]);

dialog.matches('Get station status', [
  searchFor,
  function (session, results) {
    if(results.station) {
      session.send('Get: ' + results.station);
      //TODO: this is where to put the get API call
    } else {
      session.send('Sorry, I didn\'t understand that station.');
    }
  }
]);

dialog.onDefault([
  function (session, args, next) {
    session.send('Sorry, didn\'t understand that!');
  }
]);

function searchFor(session, args, next) {
  var station = '';

  for (var i = 0; i < args.entities.length; i++) {
    if(args.entities[i].type == 'Station') {
      station = args.entities[i].entity;
      break;
    }
  }

  if(station) {
    index.search(station, function(err, content) {
      if(content.hits && content.hits.length) {
        next({ station: content.hits[0].crsCode });
      }
    });
  } else {
    next();
  }
}
