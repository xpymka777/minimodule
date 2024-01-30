// Подключаем конфигурацию переменных среды для разработки
require('dotenv').config();

// Импортируем Express для создания экземпляра приложения
const express = require('express');

// Импортируем Cors для обработки запросов с браузера
const cors = require('cors');

// Импортируем Cookie Parser для работы с данными, полученными из запросов
const cookieParser = require('cookie-parser');

// Задаем порт подключения сервера, используя переменную окружения или порт по умолчанию 5000
const PORT = process.env.PORT || 5000;

// Подключаемся к базе данных
const pool = require('./db');

// Импортируем модели пользователя и токена
const {User} = require('./models/user');
const {Token} = require('./models/token');

// Подключаем маршрутизатор
const router = require('./routs/routs');

// Подключаем обработчик ошибок
const errorMiddleware = require('./middlewares/error-middleware');

// Создаем экземпляр приложения Express
const app = express();

// Используем различные middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/api', router);
app.use(errorMiddleware);

// Функция для запуска сервера
const start = async () => {
    try {
        // Проверяем соединение с базой данных
        await pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('Ошибка выполнения запроса');
            } else {
                console.log(`Результат запроса: ${res.rows[0]}`);
            }
        });

        // Запускаем сервер на указанном порту
        app.listen(PORT, () => {
            console.log(`Сервер запущен. Порт: ${PORT}`);
        });
    } catch (e) {
        console.error(`Ошибка запуска сервера: ${e}`);
    }
};

// Запускаем сервер вызовом функции start
start();