const UserModel = require('../models/user');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {

    async registration(name,surname,middlename,email,username,password,is_confirmed){
        const candidate = await UserModel.findOne({email});
        if (candidate){
            throw ApiError.BadRequest(`Пользователь с почтовым адресом уже существует ${email}`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();

        const user = await UserModel.create({name, surname, middlename, email, username, password: hashPassword, is_confirmed, activationLink})

        await mailService.sendActivationMail(email, `${process.env.API_URL}api/activate/${activationLink}`);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id,tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    async activate(activationLink){
        const user =await UserModel.findOne({activationLink});
        if (!user){
            throw ApiError.BadRequest('Некорректная ссылка активации.');
        }
        user.is_confirmed = true;
        await user.save();
    }

    async login(email, password){

        const user = await UserModel.findOne({email});
        if(!user){
            throw ApiError.BadRequest('Пользователь с таким email не найден.')
        }
        const isPassEquals = await bcrypt.compare(password, user.password);

        if (!isPassEquals){
            throw ApiError.BadRequest('Неверный пароль')
        }

        const userDto = new UserDto(user);

        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id,tokens.refreshToken);

        return {...tokens, user: userDto};
    }

    async logout(refreshToken){
        return await tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken){
        if (!refreshToken){
            throw ApiError.UnauthorizedError('Refresh token is missing.');
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDB){
            throw ApiError.UnauthorizedError('User is not authorized or refresh token is invalid.');
        }

        const user = await UserModel.findByPk(userData.id);  // Add await here to correctly fetch the user
        const userDto = new UserDto(user);

        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto};
    }

}

module.exports = new UserService();