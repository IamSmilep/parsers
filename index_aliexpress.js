const links = [
    'https://aliexpress.ru/item/1005007383923208.html',
    'https://aliexpress.ru/item/1005007369756529.html'
]
const csvFile = 'example.csv';




const goods = []

const AliexpressScrapper = require('./sources/aliexpress');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Function to fetch data and append to CSV
function fetchDataAndAppend() {
    AliexpressScrapper.getGoodInfo(links)
        .then(res => {
            console.log("[" + new Date().toLocaleString() + "]" + res.toString())
            const goods = [];
            res.forEach((price, index) => {
                goods.push({
                    link: links[index],
                    price: price,
                    date: new Date().toLocaleString()
                });
            });
            console.log(goods);
            appendToCSV(csvFile, goods);
        })
        .catch(error => {
            console.error('Error occurred:', error);
        });
}

// Initial run
fetchDataAndAppend();

// Schedule subsequent runs every hour
const interval = 30 * 60 * 1000; // in milliseconds
setInterval(fetchDataAndAppend, interval);


// Append data to CSV file
function appendToCSV(file, newData) {
    const csvWriter = createCsvWriter({
        path: file,
        header: [
            { id: 'link', title: 'Link' },
            { id: 'price', title: 'Price' },
            { id: 'date', title: 'Date' }
        ],
        append: true
    });
    csvWriter.writeRecords(newData)
        .then(() => console.log('Data appended to CSV file successfully'));
}
