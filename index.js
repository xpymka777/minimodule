//Подключаем env config, для переменных среды разработки
require('dotenv').config();

//Для экземпляра приложения
const express = require('express');

//Корсы для запросов с браузера
const cors = require('cors');

//Парсер для работы с данными, которые нам приходят.
const cookieParser = require('cookie-parser');

//Для порта подключения сервера
const PORT = process.env.PORT || 5000;

//Подключение к БД
const pool = require('./db');

//models
const {User} = require('./models/user');
const {Token} = require('./models/token');

//Подключаем маршрутизатор
const router = require('./routs/routs');

const errorMiddleware = require('./middlewares/error-middleware');

//экземпляр приложения
const app = express();

//Используем всякое
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/api', router);
app.use(errorMiddleware);

//функция для включения сервера
const start = async () => {
    try{
        //Проверка соединения с БД
        await pool.query('SELECT NOW()', (err, res) => {
            if (err){
                console.error('Ошибка выполнения запроса');
            }else{
                console.log(`Результат запроса: ${res.rows[0]}`);
            }
        })
        app.listen(PORT, () => {
            console.log(`Сервер запущен. Порт: ${PORT}`);
        })
    }catch (e) {
        console.error(`Ошибка запуска сервера: ${e}`);
    }
}

//Запускаем сервер
start();