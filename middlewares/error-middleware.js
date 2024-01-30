//Импорт класса ApiError
const ApiError = require('../exceptions/api-error');

//Экспорт функции, представляющей middleware для обработки ошибок в API
module.exports =    function (err, req, res, next) {
    // Вывод ошибки в консоль для отладки
    console.log(err);

    // Проверка, является ли ошибка экземпляром класса ApiError
    if (err instanceof ApiError){
        // Если да, то возвращается JSON-ответ с соответствующим статусом, сообщением и массивом ошибок
        return res.status(err.status).json({
            message: err.message,
            errors: err.errors,
        });
    }
    // Если ошибка не является экземпляром ApiError, возвращается стандартный JSON-ответ с кодом 500
    return res.status(500).json({message: 'Непредвиденная ошибка'})
}
