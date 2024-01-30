// Импорт библиотеки nodemailer для отправки электронных писем
const nodemailer = require('nodemailer');

// Класс, представляющий сервис отправки электронных писем
class MailService {

    // Конструктор класса, инициализирующий объект transporter для отправки писем
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // Не используется SSL
            auth:{
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    // Метод для отправки электронного письма с ссылкой на активацию аккаунта
    async sendActivationMail(to, link){
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: `Активация аккаунта на ${process.env.API_URL}`,
            text: '',
            html: ` <div> <h1> Для активации перейдите по ссылке </h1> <a href="${link}"> ${link} </a> </div> `
        })
    }

    // Метод для отправки электронного письма с ссылкой на сброс пароля
    async sendPasswordResetMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: 'Сброс пароля',
            text: `Для сброса пароля перейдите по следующей ссылке: ${link}`,
            html: `<div><h1>Сброс пароля</h1><p>Для сброса пароля перейдите по следующей ссылке:</p><a href="${link}">${link}</a></div>`,
        });
    }

}

// Экспорт экземпляра класса MailService для использования в других частях приложения
module.exports = new MailService();