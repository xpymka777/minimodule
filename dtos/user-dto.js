//как ресурс в laravel, чтобы отдавать только нужные данные, а не вообще все
module.exports = class UserDto{
    email;
    id;
    is_confirmed;

    constructor(model) {
        this.email = model.email;
        this.id = model.id;
        this.is_confirmed = model.is_confirmed;
    }

}
