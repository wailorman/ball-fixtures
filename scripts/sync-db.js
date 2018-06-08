/* eslint-disable no-console */

const db = require('../models');

db.sequelize
  .sync({ force: true })
  .then(() => {
    console.log('Database synced');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
