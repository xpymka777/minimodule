const Router = require('express').Router;
const userController = require('../controllers/UserController')
const {body} = require('express-validator');

const router = new Router();

router.post('/registration',
    body('name').isLength({min: 2, max: 255}),
    body('surname').isLength({min: 2, max: 255}),
    body('middlename').isLength({min: 2, max: 255}),
    body('email').isEmail(),
    body('username').isLength({min: 2, max: 15}),
    body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
    userController.registration);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/users', userController.getUsers);

//обновление пароля
router.post('/change-password',
    body('email').isEmail(),
    userController.changePassword
);
router.post('/reset-password',
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    userController.resetPassword
);

module.exports = router;
