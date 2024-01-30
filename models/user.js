// Импорт необходимых компонентов из библиотеки Sequelize
const {Sequelize, DataTypes} = require('sequelize');

// Создание объекта Sequelize для установления соединения с базой данных
const sequelize = new Sequelize('module', 'postgres', 'root', {
    host: 'localhost',
    dialect: 'postgres'
})

// Функция для проверки пароля
function checkStrongPassword(password) {
    // Проверка наличия латинских символов (минимум одна заглавная буква)
    const latinRegex = /[A-Z]/;
    // Проверка наличия цифр
    const digitRegex = /\d/;
    // Проверка наличия спецсимволов
    const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

    return latinRegex.test(password) && digitRegex.test(password) && specialCharRegex.test(password);
}

// Определение модели User
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 255],
        },
    },
    surname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 255],
        }
    },
    middlename: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [2, 255],
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            len: [2, 255],
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            len: [2, 255],
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            // Проверка силы пароля с использованием функции checkStrongPassword
            isStrongPassword(value) {
                if (!checkStrongPassword(value)) {
                    throw new Error('Пароль не соответствует требованиям.')
                }
            }
        }
    },
    is_confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    activationLink: {
        type: DataTypes.STRING,
    },
    passwordResetToken: { // Добавляем поле для хранения токена сброса пароля
        type: DataTypes.STRING,
    },
},{
    //отключаем временные метки
    timestamps: false

});

//синхронизация модели с базой данных
sequelize.sync().then(() => {
    console.log('Модели синхронизированы с базой данных')
}).catch((error) => {
    console.log(`Ошибка синхронизации с базой данных: ${error}`)
})

// Экспорт модели User для использования в других частях приложения
module.exports = User;