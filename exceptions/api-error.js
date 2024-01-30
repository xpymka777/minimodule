//Экспорт класса ApiError, который расширяет базовый класс Error
module.exports = class ApiError extends Error{
    //поля класса: статус, массив ошибок
    status;
    errors;

    //конструктор, который принимает статус, сообщение и массив ошибок(опционален)
    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    //функция, которая возвращает ApiError со стандартным сообщением
    static UnauthorizedError(){
        return new ApiError(401,'Пользователь не авторизован');
    }

    //метод, который принимает и отдаёт статус ошибки, сообщение и массив ошибок
    static BadRequest(message, errors = []){
        return new ApiError(400, message, errors);
    }

}