var mongoose = require("mongoose");

const UserModel = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    valid: String,
    recoverpass: String,
    services: [
        {
            name: String,
            name_business: String,
            email: String
        }
    ],
    scheduled_services: [
        {
            description: String,
            minutes: Number,
            servicer: String,
            servicerEmail: String,
            date: String,
            time: Number
        }
    ]
});

module.exports = UserModel;