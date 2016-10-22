var builder = require('botbuilder');

var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);

var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=c564b0a7-bc68-4e0b-a45b-5b9deef4bc44&subscription-key=fe3cf5fde98f4dceb05b3fda0d3ca2ed&q=');

var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', dialog);

dialog.matches('Update station status', [
  function (session, args, next) {
    console.log(args);
    next();
  },
  function (session, results) {
    session.send('update');
  }
]);

dialog.matches('Get station status', [
  function (session, args, next) {
    console.log(args);
    next();
  },
  function (session, results) {
    session.send('get');
  }
]);

dialog.onDefault([
  function (session, args, next) {
    console.log(args)
    console.log('Sorry, didn\'t understand that!');
  }
]);
