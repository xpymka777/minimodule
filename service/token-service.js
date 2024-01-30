const jwt = require('jsonwebtoken')
const tokenModel = require('../models/token');
const {where} = require("sequelize");

class TokenService {

    generateTokens(payload){
            const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn:'15m'});
            const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn:'15d'});
            return {
                accessToken,
                refreshToken
            }
    };

    async saveToken(userId, refreshToken){
        const tokenData = await tokenModel.findOne({user: userId});

        if (tokenData){
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }

        return await tokenModel.create({user: userId, refreshToken});
    }

    validateAccessToken(token){
        try{
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        }catch (e) {
            return null;
        }
    }

    validateRefreshToken(token){
        try{
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        }catch (e) {
            return null;
        }
    }

    async removeToken(refreshToken){
        return await tokenModel.destroy({where: {refreshToken: refreshToken}});
    }

    async findToken(refreshToken){
        return await tokenModel.findOne({refreshToken});
    }

}

module.exports = new TokenService();