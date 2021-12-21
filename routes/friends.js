const {User, validate} = require('../models/user');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const authentication = require('../middleware/auth');


// View Friends List
router.get('/', authentication, async (req, res) => {

    const user_record = await User.findOne({_id: Object(req.user._id)});
    res.render('friends', {friends_list: user_record.friends}) // Here render template
})

module.exports = router;
