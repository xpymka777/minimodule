const UserModel = require('../models/user'); // Импорт модели пользователя
const bcrypt = require('bcrypt'); // Импорт bcrypt для хеширования паролей
const uuid = require('uuid'); // Импорт uuid для генерации уникальных активационных ссылок
const mailService = require('./mail-service'); // Импорт почтового сервиса для отправки активационных писем
const tokenService = require('./token-service'); // Импорт сервиса токенов для генерации и управления токенами
const UserDto = require('../dtos/user-dto'); // Импорт UserDto для создания объектов передачи данных о пользователе
const ApiError = require('../exceptions/api-error'); // Импорт ApiError для обработки ошибок API

class UserService {
    async registration(name, surname, middlename, email, username, password, is_confirmed) {
        const candidate = await UserModel.findOne({email}); // Проверка существования пользователя с указанным email
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом уже существует ${email}`);
        }
        const hashPassword = await bcrypt.hash(password, 3); // Хеширование пароля
        const activationLink = uuid.v4(); // Генерация уникальной активационной ссылки

        const user = await UserModel.create({ // Создание пользователя в базе данных
            name,
            surname,
            middlename,
            email,
            username,
            password: hashPassword,
            is_confirmed,
            activationLink
        });

        await mailService.sendActivationMail(email, `${process.env.API_URL}api/activate/${activationLink}`); // Отправка активационного письма
        const userDto = new UserDto(user); // Создание объекта передачи данных о пользователе
        const tokens = tokenService.generateTokens({...userDto}); // Генерация токенов
        await tokenService.saveToken(userDto.id, tokens.refreshToken); // Сохранение обновляющего токена в базе данных

        return {...tokens, user: userDto}; // Возвращение токенов и данных о пользователе
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({activationLink}); // Поиск пользователя по указанной активационной ссылке
        if (!user) {
            throw ApiError.BadRequest('Некорректная ссылка активации.');
        }
        user.is_confirmed = true; // Установка флага is_confirmed пользователя в true
        await user.save(); // Сохранение изменений пользователя
    }

    async login(email, password) {
        const user = await UserModel.findOne({email}); // Поиск пользователя по указанному email
        if (!user) {
            throw ApiError.BadRequest('Пользователь с таким email не найден.'); // Выброс ошибки, если пользователь не найден
        }
        const isPassEquals = await bcrypt.compare(password, user.password); // Сравнение паролей
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль'); // Выброс ошибки, если пароль неверен
        }
        const userDto = new UserDto(user); // Создание объекта передачи данных о пользователе
        const tokens = tokenService.generateTokens({...userDto}); // Генерация токенов доступа и обновления
        await tokenService.saveToken(userDto.id, tokens.refreshToken); // Сохранение обновляющего токена в базе данных

        return {...tokens, user: userDto}; // Возвращение токенов и данных о пользователе
    }

    async logout(refreshToken) {
        return await tokenService.removeToken(refreshToken); // Удаление токена из базы данных
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError('Отсутствует обновляющий токен.');
        }
        const userData = tokenService.validateRefreshToken(refreshToken); // Проверка валидности обновляющего токена
        const tokenFromDB = await tokenService.findToken(refreshToken); // Поиск обновляющего токена в базе данных
        if (!userData || !tokenFromDB) {
            throw ApiError.UnauthorizedError('Пользователь не авторизован или обновляющий токен недействителен.');
        }

        const user = await UserModel.findByPk(userData.id); // Поиск пользователя по ID
        const userDto = new UserDto(user); // Создание объекта передачи данных о пользователе
        const tokens = tokenService.generateTokens({...userDto}); // Генерация новых токенов
        await tokenService.saveToken(userDto.id, tokens.refreshToken); // Сохранение нового обновляющего токена в базе данных

        return {...tokens, user: userDto}; // Возвращение новых токенов и данных о пользователе
    }
}

module.exports = new UserService(); // Экспорт экземпляра UserService