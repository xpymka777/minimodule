const {Sequelize,DataTypes} = require('sequelize');

const sequelize = new Sequelize('module','postgres','root',{
    host: 'localhost',
    dialect: 'postgres'
});

const Token = sequelize.define('Token', {
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
},
{
    timestamps: false
});

//синхронизация модели с базой данных
sequelize.sync().then(() => {
    console.log('Модели синхронизированы с базой данных')
}).catch((error) => {
    console.log(`Ошибка синхронизации с базой данных: ${error}`)
})

module.exports = Token;