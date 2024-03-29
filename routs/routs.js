
// Импорт необходимых модулей
const Router = require('express').Router;
const userController = require('../controllers/UserController')
const {body} = require('express-validator');
const swaggerJSDoc = require('swagger-jsdoc');

// Создание экземпляра маршрутизатора
const router = new Router();

// Определение конфигурации Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Модуль регистрации',
            version: '1.0.0',
        },
    },
    apis: [__dirname + '/../controllers/UserController.js'], // Укажите путь к вашему контроллеру
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Определение маршрутов
router.post('/registration', [
    body('name').isLength({ min: 2, max: 255 }).withMessage('Имя должно содержать от 2 до 255 символов'),
    body('surname').isLength({ min: 2, max: 255 }).withMessage('Фамилия должна содержать от 2 до 255 символов'),
    body('middlename').isLength({ min: 2, max: 255 }).withMessage('Отчество должно содержать от 2 до 255 символов'),
    body('email').isEmail().withMessage('Некорректный формат почты').isLength({ min: 2, max: 255 }).withMessage('Email должен содержать от 2 до 255 символов'),
    body('username').isLength({ min: 2, max: 15 }).withMessage('Ник должен содержать от 2 до 15 символов'),
    body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/).withMessage('Пароль должен соответствовать указанным требованиям'),
], userController.registration);// Обработчик регистрации пользователя

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

// Добавление Swagger JSON в эндпоинт /swagger.json
router.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Экспорт маршрутизатора для использования в приложении
module.exports = router;
