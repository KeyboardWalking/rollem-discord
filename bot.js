'use strict';

const Discord = require('discord.js');
const Rollem  = require('./rollem.js');
const client = new Discord.Client();

var token = process.env.DISCORD_BOT_USER_TOKEN

var mentionRegex = /$<@999999999999999999>/i;
var messageInterval = 60000;
var restartMessage = "Hello, World!";
var messages = [
  "http://rollem.rocks"
];

function cycleMessage()
{
  var message = messages.shift();
  messages.push(message);
//   console.log('Set status to: ' + message);
  client.user.setStatus("online", message);
}

client.on('disconnect', () => {
  console.log('logging back in');
  client.login(token);
  console.log('logged back in');
});

client.on('ready', () => {
  console.log('I am ready!');
  console.log('Set status to: ' + restartMessage);
  client.user.setStatus("online", restartMessage);
  console.log('username: ' + client.user.username);
  console.log('id: ' + client.user.id);
  setInterval(cycleMessage, messageInterval);
  var mentionRegex_s = '^<@' + client.user.id + '>\\s+';
  mentionRegex = new RegExp(mentionRegex_s);
});

client.on('message', message => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});

client.on('message', message => {
  if (message.author == client.user) { return; }

  // parse the whole string and check for dice
  var result = Rollem.tryParse(message.content);
  var response = buildMessage(result);
  if (response && result.depth > 1 && result.dice > 0) {
//     console.log('soft parse | ' + message + " -> " + response);
    process.stdout.write("r1");
    message.reply(response);
    return;
  }

  // ignore the dice requirement with prefixed strings
  if (message.content.startsWith('r') || message.content.startsWith('&')) {
    var subMessage = message.content.substring(1);
    var result = Rollem.tryParse(subMessage);
    var response = buildMessage(result, false);
    if (response) {
//       console.log('hard parse | ' + message + " -> " + result);
      process.stdout.write("r2");
      message.reply(response);
      return;
    }
  }

  // ignore the dice requirement with name prefixed strings
  var match = message.content.match(mentionRegex);
  if (match) {
    var subMessage = message.content.substring(match[0].length);
    var result = Rollem.tryParse(subMessage);
    var response = buildMessage(result, false);
    if (response) {
//       console.log('hard parse | ' + message + " -> " + result);
      process.stdout.write("r3");
      message.reply(response);
      return;
    }
  }

  // handle inline matches
  var last = null;
  var matches = [];
  var regex = /\[(.+?)\]/g;
  while (last = regex.exec(message.content)) { matches.push(last[1]); }

  if (matches && matches.length > 0) {
    var messages = matches.map(function(match) {
      var result = Rollem.tryParse(match);
      var response = buildMessage(result);
      return response;
    }).filter(function(x) { return x; });
    var fullMessage = messages.join('\n');
    if (fullMessage) {
//       console.log('line parse | ' + message + " -> " + fullMessage);
      process.stdout.write("r4");
      message.reply(fullMessage);
      return;
    }
  }
});

client.login(token);

function buildMessage(result, requireDice = true)
{
  if (result === false) { return false; }
  if (typeof(result) === "string") { return result; }
  if (result.depth <= 1) { return false; }
  if (requireDice && result.dice < 1) { return false;}

  var response = "";

  if (result.label && result.label != "") {
    response += "'" + result.label + "', ";
  }
  if (typeof(result.value) === "boolean")
  {
    result.value = result.value ? "**Success!**" : "**Failure!**";
  }

  response += result.value + ' ⟵ ' + result.pretties;

  return response;
}
