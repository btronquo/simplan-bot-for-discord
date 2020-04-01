/**
 * --> Simplan bot for Discord <--
 * @description: This bot create IFR flight plans with latest navigraph data
 * @author: Boris Tronquoy
 * @version: 20200401
 */

// ! this bot is intended to use in a French Discord, that's why all the content is only available in French

const Discord = require('discord.js');
const fetch = require('node-fetch');
global.Headers = fetch.Headers;

const client = new Discord.Client();

const config = require("./config.json");
const urlApi = "https://api.flightplandatabase.com/";

client.login(config.token);

client.on('ready', () => {
  client.user.setActivity("préparer des plans de vol")
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg=>{

  // ignore messages without prefix command and messages redacted by bots
  if (msg.content.indexOf(config.prefix) || (msg.author.bot)) return;

  const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (!args.length && command != "api") {
		return msg.reply(`Il manque des arguments! Tappez \`!simbrief aide\` pour avoir de l'aide!`);
  }

  if (command == "aide") {
    return msg.reply(`Ecrivez \`!simbrief plan LFLL LFPT\` en remplacent LFLL par le code OACI de votre aéroport de départ et LFPT par le code OACI de votre aéroport de destination`);
  }

  let response;
  let fplan;

  // try to send some data (post)
  if ((command == "plan") && args.length == 2) {

    let body = {
      "fromICAO": args[0],
      "toICAO": args[1]
    }

    // ------------- flight plan is created here but we need to fetch it after ---------------- //
    let flightPlanAsk = await fetch("https://api.flightplandatabase.com/auto/generate", {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json', 'Authorization': 'Basic qU2WMxodOG51NVghySCeTjUbTKqcUu35bFbl13a2'}
    })
      .then(res => res.json())
      .then(json => response = json)
      .catch((err) => { console.log(err); });

    // ------------- flight plan is now fetched here --------- //
    let flightPlanGenerated = await fetch("https://api.flightplandatabase.com/plan/" + response.id)
      .then(res => res.json())
      .then(json => fplan = json)
      .catch((err) => { console.log(err); });

    let route = " ";

    // decode the route
    fplan.route.nodes.forEach(function (arrayItem) {
      var x = arrayItem.ident;
      route += x + " ";
    });


    // global message for user
    let planMsg = `Voici votre **plan de vol généré**\n*Attention: Ce plan de vol est utilisable uniquement à des fin de simulations*\n-----------------\n**Départ:** ${body.fromICAO} (${response.fromName})\n**Arrivée:** ${body.fromICAO} (${response.toName})\n**Altitude de croisière:** ${response.maxAltitude} ft\n**Route:** ${route}\n`
    planMsg += `\n\nGénéré via flightplandatabase.com -> https://flightplandatabase.com/plan/${response.id}\nBot par Boris Tronquoy (btrn.fr)`;

    return msg.reply(planMsg);

  }

})

