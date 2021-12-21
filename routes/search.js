const {User, validate} = require('../models/user');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authentication = require('../middleware/auth');

router.get('/', authentication, async (req, res) => {

    let user_id = req.user._id;
    let user_record = await User.findOne({_id: Object(user_id)});

    let user = await User.find();
    res.render('search', {userRecord: user, authDetail: user_record});
});
router.get('/:query', authentication, async (req, res) => {

    let user_id = req.user._id;
    let user_record = await User.findOne({_id: Object(user_id)});

    let query = req.params.query;
    let user = await User.find({name: { $regex: '.*' + query + '.*' } });
    res.render('search', {userRecord: user, authDetail: user_record});
});

module.exports = router;
