const userService = require('../service/user-service')
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error');
const UserModel = require('../models/user')
const bcrypt = require("bcrypt");//должно быть для того, чтобы сравнивать хеш паролей, но не работает
const uuid = require("uuid");
const mailService = require('../service/mail-service')

class UserController {

    async registration(req, res, next) {
        try {
            // Валидация данных при регистрации
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка валидации', errors.array()));
            }

            const { name, surname, middlename, email, username, password, is_confirmed } = req.body;
            const userData = await userService.registration(name, surname, middlename, email, username, password, is_confirmed);
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 15 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData);
        } catch (error) {
            // Обработка других ошибок
            return next(ApiError.BadRequest('Внутренняя ошибка сервера', error.message));
        }
    }

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
                },
            });

            if (user) {
                const isComparePasswords = bcrypt.compare(currentPassword, user.password);

                if (!isComparePasswords){

                    return next(ApiError.BadRequest('Неверный текущий пароль.'));

                }

            }

            // Генерация нового токена для сброса пароля
            const resetToken = uuid.v4();
            user.passwordResetToken = resetToken;
            await user.save();

            // Отправка email с ссылкой для сброса пароля
            const resetLink = `${process.env.API_URL}api/reset-password/${resetToken}`;
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

/**
 * @swagger
 * /api/user/registration:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *                 id: Автоматически заполняется(не указывается)
 *                 name: Mike,
 *                 surname: Vazovski,
 *                 middlename: Sally,
 *                 email: gumangu12@gmail.com,
 *                 username: mikeVazovski,
 *                 password: VeryStrongPassword123!
 *                 is_confirmed: false(default)
 *     responses:
 *       200:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             example:
 *               refreshToken: "your_refresh_token_here"
 *               user:
 *                 id: "user_id_here"
 *                 name: "user_name_here"
 *                 surname: "user_surname_here"
 *                 middlename: "user_middlename_here"
 *                 email: "user_email_here"
 *                 username: "user_username_here"
 *                 is_confirmed: true
 *       400:
 *         description: Ошибка в запросе
 *         content:
 *           application/json:
 *             example:
 *               message: "Ошибка валидации"
 *               errors: ["validation_error_1", "validation_error_2"]
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Вход пользователя
 *     tags:
 *       - User
 *     requestBody:
 *       description: Данные для входа пользователя
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             example:
 *               accessToken: "your_access_token_here"
 *               refreshToken: "your_refresh_token_here"
 *               user:
 *                 id: "user_id_here"
 *                 name: "user_name_here"
 *                 surname: "user_surname_here"
 *                 email: "user_email_here"
 *                 // Другие поля пользователя
 *       400:
 *         description: Ошибка входа (неверные учетные данные и т. д.)
 *         content:
 *           application/json:
 *             example:
 *               message: "Ошибка входа"
 *               error: "error_message_here"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */
/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Выход пользователя
 *     tags:
 *       - User
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Токен обновления пользователя (извлекается из cookie)
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             example:
 *               message: "Выход успешен."
 *       400:
 *         description: Ошибка выхода (например, отсутствует токен обновления)
 *         content:
 *           application/json:
 *             example:
 *               message: "Ошибка выхода"
 *               error: "error_message_here"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */
/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Обновление токена доступа
 *     tags:
 *       - User
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Токен обновления пользователя (извлекается из cookie)
 *     responses:
 *       200:
 *         description: Успешное обновление токена доступа
 *         content:
 *           application/json:
 *             example:
 *               accessToken: "your_new_access_token_here"
 *               refreshToken: "your_refresh_token_here"
 *               user:
 *                 id: "user_id_here"
 *                 name: "user_name_here"
 *                 surname: "user_surname_here"
 *                 email: "user_email_here"
 *                 // Другие поля пользователя
 *       401:
 *         description: Неавторизован (например, недействительный токен обновления)
 *         content:
 *           application/json:
 *             example:
 *               message: "Неавторизован"
 *               error: "unauthorized_error_message_here"
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */
/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Смена пароля пользователя
 *     tags:
 *       - User
 *     requestBody:
 *       description: Данные для смены пароля пользователя
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             required:
 *               - email
 *               - currentPassword
 *               - newPassword
 *     responses:
 *       200:
 *         description: Ссылка для сброса пароля отправлена на email пользователя
 *         content:
 *           application/json:
 *             example:
 *               message: "Ссылка для сброса пароля отправлена на ваш email."
 *               token: "your_reset_token_here"
 *       400:
 *         description: Неверный текущий пароль или отсутствие пользователя с указанным email
 *         content:
 *           application/json:
 *             example:
 *               message: "Неверный текущий пароль."
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */
/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Сброс пароля пользователя
 *     tags:
 *       - User
 *     requestBody:
 *       description: Данные для сброса пароля пользователя
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *             required:
 *               - token
 *               - newPassword
 *     responses:
 *       200:
 *         description: Пароль успешно сброшен
 *         content:
 *           application/json:
 *             example:
 *               message: "Пароль успешно сброшен."
 *       400:
 *         description: Неверный или просроченный токен сброса пароля
 *         content:
 *           application/json:
 *             example:
 *               message: "Неверный или просроченный токен сброса пароля."
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             example:
 *               message: "Внутренняя ошибка сервера"
 *               error: "internal_server_error_message"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string(от 2 до 255 символов)
 *         surname:
 *           type: string(от 2 до 255 символов)
 *         middlename:
 *           type: string(от 2 до 255 символов)
 *         email:
 *           type: string(email)
 *         username:
 *           type: string(от 2 до 15 символов)
 *         password:
 *           type: string(обязательно латинские буквы(обязательно 1 заглавная), цифры и 1 спецсимвол)
 *         is_confirmed:
 *           type: boolean(флаг подтверждения пользователя)
 *         activationLink:
 *           type: string(ссылка для активации аккаунта)
 *         passwordResetToken:
 *           type: string(токен для обновления пароля)
 */