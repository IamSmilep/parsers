const Puppeteer = require('puppeteer')
const {Page} = require("puppeteer");


const sourceId = 3;
const sourceName = 'Aliexpress';
const baseUrl = 'https://aliexpress.ru/';

const AliexpressScrapper = {
    async getGoodInfo(urls) {
        const browser = await Puppeteer.launch({ headless: false, defaultViewport: { width: 1366, height: 768 } });
        const page = await browser.newPage();
        const prices = [];

        for (const url of urls) {
            prices.push(await this.getPrice(page, url));
            // Wait for 10 seconds between each getPrice() call
            await this.sleep(10000);
        }

        await browser.close();

        return prices.map(price => price.replace(/\D/g, ''));
    },

    async getPrice(page, url) {
        // aliexpress endless loading!
        try {
            await page.goto(url, {timeout: 15000});
        }
        catch(error) {
            console.log(error);
        }
        await page.waitForSelector('.HazeProductPrice_SnowPrice__mainS__k8qlm');
        return await page.$eval('.HazeProductPrice_SnowPrice__mainM__k8qlm', element => element.textContent);
    },

    // Function to sleep for a given number of milliseconds
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
module.exports = AliexpressScrapper;
