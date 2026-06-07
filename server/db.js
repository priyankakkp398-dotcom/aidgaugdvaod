const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kotakbankadmin_user:k7ECU4gjax3ae7K0wv7FDndrbSL2CB2t@dpg-d6tg6duuk2gs738qif1g-a.oregon-postgres.render.com/kotakbankadmin',
  ssl: {
    rejectUnauthorized: false
  }
})

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database')
})

module.exports = pool
