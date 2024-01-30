const {Sequelize, DataTypes} = require('sequelize');

const sequelize = new Sequelize('module', 'postgres', 'root', {
    host: 'localhost',
    dialect: 'postgres'
})

function checkStrongPassword(password) {
    // Проверка наличия латинских символов (минимум одна заглавная буква)
    const latinRegex = /[A-Z]/;
    // Проверка наличия цифр
    const digitRegex = /\d/;
    // Проверка наличия спецсимволов (можете добавить или изменить символы по своему усмотрению)
    const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

    return latinRegex.test(password) && digitRegex.test(password) && specialCharRegex.test(password);
}

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

    timestamps: false

});

//синхронизация модели с базой данных
sequelize.sync().then(() => {
    console.log('Модели синхронизированы с базой данных')
}).catch((error) => {
    console.log(`Ошибка синхронизации с базой данных: ${error}`)
})

module.exports = User;