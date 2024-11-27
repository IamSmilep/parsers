const dotenv = require("dotenv")
dotenv.config()
TOKEN = process.env.TOKEN
const util = require('util');

let channelToSpam = null;

// discord js settingss
const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.login(TOKEN)
client.on("messageCreate", async (message) => {
    // Защита, чтобюы бот не отвечал самому себе
    if (message.author.bot) return;
    else if (message.content === "stop") {
        console.log("Someone said stop( " + message.author.tag)
        process.exit(2);
    }
    else if (message.content === "спамь сюда ♥") {
        await message.reply("Принято!");
        channelToSpam = message.channel;
    }
    else if (message.content === "цены") {
        const filePath = 'example.csv';
        const dynamics = await parseCSV(filePath); // Use the parseCSV() function
        const lastTenPrices = getLastTenPrices(dynamics);
        message.reply('Last Ten Prices:\n' + util.inspect(lastTenPrices, { depth: null, colors: false }))
            .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.error);
    }
    else if (message.content === 'проверка спам атаки ♥') {
        if (!channelToSpam) {
            await message.reply('Канал под спам еще не выбран. Выбери написав в чат кодовую фразу)');
            return;
        }
        channelToSpam.send("Проверка прошла успешно")
            .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.error);
    }
})

client.on("ready", async () => {
    console.log(`Entered as ${client.user.tag}`);
    console.log('Не забудь указать канал для спама!');
});


// Далее идет cron и чтение файла


const fs = require('fs');
const csv = require('csv-parser');
const cron = require('node-cron');

// Object to store prices of each link
var lastPrices = null;

// Function to read the CSV file and compare prices
async function readCSV() {
    try {
        const newPrices = await getLastPrices('example.csv');
        if (!lastPrices) {
            console.log('lastprices еще нул, заполняю')
            // If lastPrices doesn't exist (is null), initialize it with newPrices
            lastPrices = { ...newPrices };
            return;
        }
        // Iterate through the newPrices and compare with lastPrices
        for (const [link, newPrice] of Object.entries(newPrices)) {
            console.log('Итерация для ' + link)
            const oldPrice = lastPrices[link];
            console.log(oldPrice)
            console.log(newPrice)
            
            // If price has changed, log the product, new price, and old price

            if (oldPrice.Price !== newPrice.Price) {
                channelToSpam.send(`Price changed for ${link}. Old price: ${oldPrice.Price} New price: ${newPrice.Price}`)
                    .then(message => console.log(`Sent message: ${message.content}`))
                    .catch(console.error);
            }
            console.log('====')
        }

        // After comparison, update lastPrices with the newPrices
        lastPrices = { ...newPrices };
    } catch (error) {
        console.error('Error processing last ten prices:', error);
    }
}

// Schedule cron job to read CSV every minute
cron.schedule('* * * * *', async () => {
    await readCSV();
});


function parseCSV(filePath) {
    const priceDynamics = {};

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const link = row.Link;
                const price = parseFloat(row.Price);
                const date = new Date(row.Date);

                if (!priceDynamics[link]) {
                    priceDynamics[link] = [];
                }

                // Add the price record
                priceDynamics[link].push({ price, date });
            })
            .on('end', () => {
                const filteredDynamics = {};

                for (const link in priceDynamics) {
                    const priceHistory = priceDynamics[link];

                    // Sort by date
                    priceHistory.sort((a, b) => a.date - b.date);

                    // Filter out consecutive entries with the same price
                    filteredDynamics[link] = priceHistory.filter((entry, index, arr) => {
                        return index === 0 || entry.price !== arr[index - 1].price;
                    });
                }

                resolve(filteredDynamics);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function getLastTenPrices(priceDynamics) {
    const lastTenPrices = {};

    for (const link in priceDynamics) {
        const priceHistory = priceDynamics[link];

        // Take the last 10 entries, using slice
        lastTenPrices[link] = priceHistory.slice(-10);
    }

    return lastTenPrices;
}

// Function to parse CSV and return the latest price with date by link
function getLastPrices(filePath) {
    return new Promise((resolve, reject) => {
        const data = [];

        // Read and parse the CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Parse price and date as appropriate
                data.push({
                    Link: row.Link,
                    Price: parseFloat(row.Price),
                    Date: new Date(row.Date),  // Convert to Date object for comparison
                });
            })
            .on('end', () => {
                // Process the data to get the latest price and date for each link
                const latestPrices = {};

                // Sort data by date in descending order
                data.sort((a, b) => b.Date - a.Date);

                // Iterate through the sorted data and get the latest entry for each link
                for (const record of data) {
                    if (!latestPrices[record.Link]) {
                        latestPrices[record.Link] = {
                            Price: record.Price,
                            Date: record.Date,  // Save the date along with the price
                        };
                    }
                }

                resolve(latestPrices);
            })
            .on('error', reject);
    });
}
