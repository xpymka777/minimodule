// Импорт необходимых модулей
const Router = require('express').Router;
const userController = require('../controllers/UserController')
const {body} = require('express-validator');

// Создание экземпляра маршрутизатора
const router = new Router();

// Определение маршрутов
router.post('/registration',
    body('name').isLength({min: 2, max: 255}),
    body('surname').isLength({min: 2, max: 255}),
    body('middlename').isLength({min: 2, max: 255}),
    body('email').isEmail(),
    body('username').isLength({min: 2, max: 15}),
    body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),// Проверка сильности пароля с помощью регулярного выражения(не работает)
    userController.registration);// Обработчик регистрации пользователя
router.post('/login', userController.login);// Обработчик входа пользователя
router.post('/logout', userController.logout);// Обработчик выхода пользователя
router.get('/activate/:link', userController.activate);// Обработчик активации учетной записи
router.get('/refresh', userController.refresh);// Обработчик обновления токена
router.get('/users', userController.getUsers);//проверка работоспособности контроллера

//обновление пароля
router.post('/change-password',
    body('email').isEmail(),
    userController.changePassword // Обработчик изменения пароля
);
router.post('/reset-password',
    body('token').notEmpty(),
    userController.resetPassword // Обработчик сброса пароля
);

// Экспорт маршрутизатора для использования в приложении
module.exports = router;
