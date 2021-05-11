const axios = require('axios');
const Discord = require('discord.js');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')

require('dotenv').config();
dayjs.extend(customParseFormat);

const client = new Discord.Client();
const today = new Date().toLocaleDateString();
const districtId = 266
const endpoint = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${today}`;
const headers = {
  'accept': 'application/json',
  'Accept-Language': 'en_US',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
};
const config = {
  url: endpoint,
  method: 'get',
  headers: headers
}

const filterSessions = center => {
  const filteredSessionsArray = [];
  center.sessions.map((el) => {
    if(el.available_capacity > 0 && el.min_age_limit === 45) {
      filteredSessionsArray.push(el);
    }
  });
  return filteredSessionsArray;
}

const filterCenters = (centers) => {
  const filteredSlotsArray = [];
  centers.map((el) => {
    const filteredSessions = filterSessions(el);
    if(filteredSessions.length) {
      filteredSlotsArray.push(el);
    }
  });
  return filteredSlotsArray;
}

const fetchAvailableSlots = async() => {
  try {
    const response = await axios.request(config);
    return filterCenters(response.data.centers);
  } catch (error) {
    console.log(error);
  }
}

client.once('ready', () => {
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  const intervalId = setInterval(async() => {
    const availableCenters = await fetchAvailableSlots();
    availableCenters.map(el => {
      const embed = new Discord.MessageEmbed()
        .setTitle(':syringe: Vaccination Available')
        .setColor('#43b581')
        .addFields(
          { name: 'Name', value: el.name ? el.name : 'Name' },
          { name: 'Pincode', value: el.pincode ? el.pincode : 'Pincode' },
          { name: 'Fee', value: el.fee_type ? el.fee_type : 'Fee' }
        )
      el.sessions.map(el => {
        embed.addField(dayjs(el.date, 'DD-MM-YYYY').format('MMM DD'), el.available_capacity, true)
      });
      channel.send(embed);
    })
  }, 60000 * 3)
});
client.login(process.env.DISCORD_BOT_TOKEN);