// Импорт необходимых компонентов из библиотеки Sequelize
const {Sequelize,DataTypes} = require('sequelize');

// Создание объекта Sequelize для установления соединения с базой данных
const sequelize = new Sequelize('module','postgres','root',{
    host: 'localhost',
    dialect: 'postgres'
});

// Определение модели Token
const Token = sequelize.define('Token', {
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
},
    //отключаем временные метки
{
    timestamps: false
});

//синхронизация модели с базой данных
sequelize.sync().then(() => {
    console.log('Модели синхронизированы с базой данных')
}).catch((error) => {
    console.log(`Ошибка синхронизации с базой данных: ${error}`)
})

// Экспорт модели Token для использования в других частях приложения
module.exports = Token;