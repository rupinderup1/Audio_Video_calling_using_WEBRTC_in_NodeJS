const Joi      = require('joi');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const config   = require('config');

const userSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    friends: {
        type: Array,
        default: []
    },
    notifications: {
        type: Array,
        default: []
    },
    sendByMe: {
        type: String,
        enum: ['0', '1'],
        default: '0'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted'],
        default : 'pending'
    }
});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({_id: this._id, name: this.name}, config.get('jwtprivateket'));
    return token;
}

const User = mongoose.model('User', userSchema);


function validateUser(user) {
    const schema= Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required(),
        confirmPassword: Joi.any().equal(Joi.ref('password'))
        .required()
        .label('Confirm password')
        .options({ messages: { 'any.only': '{{#label}} does not match'} })
    });
    return schema.validate(user, {abortEarly: false});
}

exports.User = User;
exports.validate = validateUser;