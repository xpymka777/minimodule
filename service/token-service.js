// Импорт библиотеки для работы с JSON Web Tokens (jwt)
const jwt = require('jsonwebtoken')
// Импорт модели для работы с токенами
const tokenModel = require('../models/token');

class TokenService {

    // Метод для генерации пары токенов (access и refresh) на основе переданного payload
    generateTokens(payload){
            const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn:'15m'});
            const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn:'15d'});
            return {
                accessToken,
                refreshToken
            }
    };

    // Метод для сохранения refresh токена в базе данных, привязанного к конкретному пользователю
    async saveToken(userId, refreshToken){
        const tokenData = await tokenModel.findOne({user: userId});

        if (tokenData){
            // Если токен уже существует, обновляем его значение
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }

        // Если токен не существует, создаем новую запись в базе данных
        return await tokenModel.create({user: userId, refreshToken});
    }

    // Метод для валидации access токена
    validateAccessToken(token){
        try{
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        }catch (e) {
            return null;
        }
    }

    // Метод для валидации refresh токена
    validateRefreshToken(token){
        try{
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        }catch (e) {
            return null;
        }
    }

    // Метод для удаления refresh токена из базы данных
    async removeToken(refreshToken){
        return await tokenModel.destroy({where: {refreshToken: refreshToken}});
    }

    // Метод для поиска информации о refresh токене в базе данных
    async findToken(refreshToken){
        return await tokenModel.findOne({refreshToken});
    }

}

// Экспорт экземпляра класса TokenService для использования в других частях приложения
module.exports = new TokenService();