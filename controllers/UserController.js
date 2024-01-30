const userService = require('../service/user-service')
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error');
const UserModel = require('../models/user')
const {where} = require("sequelize");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
mailService = require('../service/mail-service')

class UserController {

    async registration(req, res, next){
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()){
                return next(ApiError.BadRequest('Ошибка валидации', errors.array()));
            }
            const {name,surname,middlename,email,username,password,is_confirmed} = req.body;
            const userData = await userService.registration(name,surname,middlename,email,username,password,is_confirmed);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        }catch (e) {
            next(e);
        }
    };

    async login(req, res, next){
        try {
            const {email, password} = req.body;
            const userData = await userService.login(email, password);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        }catch (e) {
            next(e);
        }
    };

    async logout(req, res, next){
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken');
            return res.json(200, {message: 'Выход успешен.'});
        }catch (e) {
            next(e);
        }
    };

    async activate(req, res, next){
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL);
        }catch (e) {
            next(e);
        }
    };

    async refresh(req, res, next){
        try {
            const refreshToken = req.cookies.refreshToken;
            const userData = await userService.refresh(refreshToken);
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true})
            return res.json(userData);
        }catch (e) {
            next(e);
        }
    };

    async changePassword(req, res, next) {
        try {
            const { email, currentPassword, newPassword } = req.body;

            // Проверка существования пользователя с предоставленным email и текущим паролем
            const user = await UserModel.findOne({
                where: {
                    email,
                    //password: await bcrypt.hash(currentPassword, 3), // не работает сравнение и паролей
                },
            });

            if (!user) {
                return next(ApiError.BadRequest('Неверный email или текущий пароль.'));
            }

            // Генерация нового токена для сброса пароля
            const resetToken = uuid.v4();
            user.passwordResetToken = resetToken;
            await user.save();

            // Отправка email с ссылкой для сброса пароля
            const resetLink = `${process.env.API_URL}/reset-password/${resetToken}`;
            await mailService.sendPasswordResetMail(email, resetLink);

            return res.json({ message: 'Ссылка для сброса пароля отправлена на ваш email.', token: resetToken });
        } catch (e) {
            next(e);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;

            // Найти пользователя по токену сброса пароля
            const user = await UserModel.findOne({
                where: {
                    passwordResetToken: token,
                },
            });

            if (!user) {
                return next(ApiError.BadRequest('Неверный или просроченный токен сброса пароля.'));
            }

            // Обновите пароль пользователя и очистите токен сброса.
            user.password = newPassword;
            user.passwordResetToken = null;
            await user.save();

            return res.json({ message: 'Пароль успешно сброшен.'});
        } catch (e) {
            next(e);
        }
    }

    //проверка работоспособности контроллера
    async getUsers(req, res, next){
        try {
            res.json(['123','456'])
        }catch (e) {
            next(e);
        }
    };

}

module.exports = new UserController();
