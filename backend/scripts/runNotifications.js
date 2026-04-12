const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { runLicenseExpiryCheck } = require('../cron/notifications');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Running expiry check...');
    const result = await runLicenseExpiryCheck();
    console.log('Result:', result);
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
