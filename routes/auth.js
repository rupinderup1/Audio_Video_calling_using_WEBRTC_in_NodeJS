const {User} = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();

router.post('/', upload.none(), async (req, res) => {
    const {error} = validate(req.body);
    if(error) return res.json({
        "success": false,
        "errors": error.details,
        "redirect": "/"
    });
    
    let user = await User.findOne({email: req.body.email});
    
    if(!user) {
        req.flash('error', 'Invalid email or password!')
        return res.json({
            "success": false,
            "message": "Invalid email or password",
            "redirect": "/"
        });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) {
        req.flash('error', 'Invalid email or password!')
        return res.json({
            "success": false,
            "message": "Invalid email or password",
            "redirect": "/"
        });
    }
    const token = user.generateAuthToken();
    req.session.isAuth = true;
    req.session.token = token;
    req.flash('success', 'Logged In Successfully!')
    res.json({
        "success": true,
        "message": "Logged In Successfully!",
        "redirect": "/chat"
    });
});

function validate(req) {
    const schema= Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });
    return schema.validate(req, {abortEarly: false});
}

module.exports = router;
