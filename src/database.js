const mongoose = require('mongoose');
const URI =
    process.env.status === "PROD"
        ? process.env.DBURI_PROD
        : process.env.DBURI_DEV;

const db = mongoose.connection;

function connect() {
    mongoose.connect(URI, (err, res) => {
        if (err) {
           throw err;
        } else {
            console.log( `Connected to Database: ${URI} `);
            db.on('open', (_) => console.log('Database is connected to'));
            db.on('error', (error) => console.log('Error:', error));
        }
    });
};

mongoose.set('strictQuery', false);

connect();