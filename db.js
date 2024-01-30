//Данные для подключения к БД
const {Pool} = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    database: 'module',
    port: '5432',
})

module.exports = pool;