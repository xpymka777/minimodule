const userService = require('../service/user-service')
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error');
const UserModel = require('../models/user')
const {where} = require("sequelize");

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

            // Проверьте, существует ли пользователь с указанным адресом электронной почты и текущим паролем.
            const user = await UserModel.findOne({
                where: {
                    email,
                    password: currentPassword, // Обязательно хэшируйте это в производстве
                },
            });

            if (!user) {
                return next(ApiError.BadRequest('Неверный адрес электронной почты или текущий пароль.'));
            }

            // Создайте новый токен сброса пароля
            const resetToken = uuid.v4();
            user.passwordResetToken = resetToken;
            await user.save();

            // Отправьте электронное письмо со ссылкой для сброса пароля
            const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
            await mailService.sendPasswordResetMail(email, resetLink);

            return res.json({ message: 'Ссылка для сброса пароля отправлена на вашу электронную почту.' });
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

            return res.json({ message: 'Пароль успешно сброшен.' });
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

// Шаг 1. Добавьте в UserService новый метод для сравнения адреса электронной почты и пароля.

// Внутри класса UserService
// async compareEmailAndPassword(email, currentPassword) {
//     const user = await UserModel.findOne({ email });
//     if (!user) {
//         throw ApiError.BadRequest('User not found with the provided email');
//     }
//     const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
//     if (!isCurrentPasswordValid) {
//         throw ApiError.BadRequest('Current password does not match');
//     }
//     return user;
// }
//
// // Шаг 2. Отправьте электронное письмо со ссылкой для активации.
//
// // Внутри метода, в котором пользователь отправляет электронное письмо, текущий пароль и новый пароль.
// const user = await userService.compareEmailAndPassword(email, currentPassword);
// const newPasswordActivationLink = uuid.v4();  // Создайте уникальную ссылку
// // Сохраните ссылку в базе данных вместе с идентификатором пользователя.
// // Вы можете использовать метод, аналогичный созданию активации, в методе регистрации.
//
// // Отправьте ссылку активации на электронную почту пользователя
// await mailService.sendActivationMail(email, `${process.env.API_URL}api/activate/${newPasswordActivationLink}`);
//
// // Шаг 3. Реализация маршрута и логики для обновления пароля
//
// // Добавьте новый маршрут к роутеру для обновления пароля
// router.post('/update-password/:link', userController.updatePassword);
//
// // Внутри класса UserController
// async updatePassword(req, res, next) {
//     try {
//         const activationLink = req.params.link;
//         // Получить пользователя по ссылке активации
//         // Реализуйте логику для обновления пароля пользователя.
//         // Отправьте ответ, чтобы указать на успешное обновление пароля.
//     } catch (e) {
//         next(e);
//     }
// }
//
// // Шаг 4. Обновите пароль в базе данных
//
// // Внутри класса UserService
// async updatePassword(activationLink, newPassword) {
//     const user = await UserModel.findOne({ activationLink });
//     if (!user) {
//         throw ApiError.BadRequest('Invalid activation link');
//     }
//     //Обновите пароль пользователя, указав новый предоставленный пароль.
//     // Сохраните обновленный объект пользователя в базе данных.
// }