const {User, validate} = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const authentication = require('../middleware/auth');

// Register User
router.post('/', upload.none(), async (req, res) => {
    
    const {error} = validate(req.body);
    if(error) return res.json({
        "success": false,
        "errors": error.details,
        "redirect": "/"
    });
    
    let user = await User.findOne({email: req.body.email});
    if(user) {
        req.flash('error', 'user already registered')
        return res.json({
            "success": false,
            "message": "user already registered",
            "redirect": "/"
        });
    }

    user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,

    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    const token = user.generateAuthToken();
    req.flash('success', 'User Registed Successfully!')
    res.json({
        "success": true,
        "message": "User Registed Successfully!",
        "redirect": "/"
    });
});

// Send friend request to user
router.post('/sendFriendRequest', authentication, async (req, res) => {
    
    // Auth User Detail
    let user_id = req.user._id;
    let currentUser = await User.findOne({_id: Object(user_id)});
    
    // Add Login friend detail when click friend
    let query = { _id: Object(req.body.userid) };
    let updateDocument = {
        $push: {
                "friends": {
                    "_id": Object(currentUser._id).toString(),
                    "name": currentUser.name,
                    "email": currentUser.email,
                    "sendByMe": "0",
                    "status": "pending",
                    "inbox": []
                }
            },
    };
    let result = await User.updateOne(query, updateDocument);

    let user_record = await User.findOne({_id: Object(req.body.userid)});
    let query1 = { _id: Object(user_id) };
    let updateDocument1 = {
        $push: {
                "friends": {
                    "_id": Object(user_record._id).toString(),
                    "name": user_record.name,
                    "email": user_record.email,
                    "sendByMe": "1",
                    "status": "pending",
                    "inbox": []
                }
            },
    };
    let result1 = await User.updateOne(query1, updateDocument1);
    req.flash('success', 'Friend Request Sent Successfully!')
    res.json([{'success': 'true', 'redirect': '/chat'}]);
});

// Accept friend request
router.post('/acceptFriendRequest', authentication, async (req, res) => {
    // Auth User Detail
    let user_id = req.user._id;
    let currentUser = await User.findOne({_id: Object(user_id)});
    
    // Add Login friend detail when click friend
    let query = { _id: Object(req.body.userid) };
    let updateDocument = {
        $push: {
                "notifications": {
                    "_id": Object(),
                    "type": "friend_request_accepted",
                    "content": currentUser.name+" accepted your friend request",
                    "createdAt": new Date().getTime()
                }
            },
    };
    let result = await User.updateOne(query, updateDocument);

    let query1 = {
        $and: [
            { _id: Object(req.body.userid) },
            { friends: { $elemMatch: {_id: user_id }}}
        ]
    };
    let updateDocument1 = {
        $set: {
            "friends.$.status": "accepted"
            },
    };
    let result1 = await User.updateOne(query1, updateDocument1);

    let query2 = {
        $and: [
            {_id: user_id},
            {friends: { $elemMatch: {_id: req.body.userid} }}
        ]
    };
    let updateDocument2 = {
        $set: {
            "friends.$.status": "accepted"
            },
    };
    let result2 = await User.updateOne(query2, updateDocument2);

    req.flash('success', 'Friend Request Accepted Successfully!')
    res.json([{'success': 'true', 'redirect': '/chat'}]);
});

// Unfriend request
router.post('/unFriend', authentication, async (req, res) => {
    // Auth User Detail
    let user_id = req.user._id;
    let query1 = {
        $and: [
            { _id: Object(req.body.userid) },
        ]
    };
    let updateDocument1 = {
        $pull: {
            "friends": {"_id": user_id }
            },
    };
    let result1 = await User.updateOne(query1, updateDocument1);

    let query2 = {
        $and: [{
            _id: user_id
        }]
    };
    let updateDocument2 = {
        $pull: {
            "friends": {"_id": req.body.userid}
            },
    };
    let result2 = await User.updateOne(query2, updateDocument2);

    req.flash('success', 'Friend has Been Removed!')
    res.json([{'success': 'true', 'redirect': '/chat'}]);
});

// Get accepted friends after login
router.get('/showfriends', authentication, async (req, res) => {
    // Auth User Detail
    let user_id = req.user._id;
    let users_result = await User.find({ _id: Object(user_id)}, { "friends": 1 });
    let response = {
        "success": true,
        "records": [],
        "user_id": user_id,
    }
    if(users_result[0]) {
        var j = 0;
        for(var i= 0; i < users_result[0].friends.length; i++) {
            if(users_result[0].friends[i].status == 'accepted') {
                response["records"][j] = users_result[0].friends[i];
                j++;
            }
        }
    }
    return res.json(response);
});

// Get accepted friends after login
router.get('/showfriendsrequests', authentication, async (req, res) => {
    // Auth User Detail
    let user_id = req.user._id;
    let users_result = await User.find({ _id: Object(user_id) }, { "friends": 1 });
    
    let response = {
        "success": true,
        "records": [],
        "user_id": user_id,
    }
    if(users_result[0]) {
        var j = 0;
        for(var i= 0; i < users_result[0].friends.length; i++) {
            if(users_result[0].friends[i].status == 'pending') {
                response["records"][j] = users_result[0].friends[i];
                j++;
            }
        }
    }
    return res.json(response);
});



// Get Messages By User
router.post('/getMessagesByUser', authentication, async (req, res) => {
    // Auth User Detail
    let user_id = req.user._id;
    let users_result = await User.findOne({_id: Object(user_id), "friends._id": req.body.userid}, { "friends.$": 1 });
    let response = {
        "success": true,
        "user_id": user_id,
    };
    if(users_result) {
        response["records"] = users_result.friends[0].inbox;
        response["auth"] = users_result.friends[0];
    }

    return res.json(response);
});


// Save messages
router.post('/sendMessage', authentication, async (req, res) => {
    let auth_id = req.user._id;
    let user_id = req.body.userid;
    let message = req.body.message;

    let query = {
        $and: [
            {_id: Object(auth_id)},
            {friends: { $elemMatch: {_id: user_id} }}
        ]
    };
    let updateDocument = {
        $push: {
                "friends.$.inbox": {
                    "_id": Object(),
                    "message": message,
                    "from": auth_id,
                    "createdAt": new Date().getTime()
                }
            },
    };
    let result = await User.updateOne(query, updateDocument);


    let query1 = {
        $and: [
            {_id: Object(user_id)},
            {friends: { $elemMatch: {_id: auth_id} }}
        ]
    };
    let updateDocument1 = {
        $push: {
                "friends.$.inbox": {
                    "_id": Object(),
                    "message": message,
                    "from": auth_id,
                    "createdAt": new Date().getTime()
                }
            },
    };
    let result1 = await User.updateOne(query1, updateDocument1);
    return res.json({
        "success": true,
    });
})

module.exports = router;
