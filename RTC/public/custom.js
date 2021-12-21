$(document).ready(function() {

    // Register form submit
    $('#registerForm').submit(function() {
        $.ajax({
            method: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
        })
        .done(function( data ) {
            $('.error').html('');
            if(!data.success) {
                if(data.errors) {
                    for(i = 0; i < data.errors.length; i++) {
                        $('input[name='+data.errors[i]['path'][0]+']').parent().find('.error').html(data.errors[i]['message']);
                    }
                } else {
                    window.location.href = data.redirect;
                }
            } else {
                window.location.href = data.redirect;
            }
        });
        return false;
    })

    // Login form submit
    $('#loginForm').submit(function() {
        $.ajax({
            method: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
        })
        .done(function( data ) {
            $('.error').html('');
            if(!data.success) {
                if(data.errors) {
                    for(i = 0; i < data.errors.length; i++) {
                        $('input[name='+data.errors[i]['path'][0]+']').parent().find('.error').html(data.errors[i]['message']);
                    }
                } else {
                    window.location.href = data.redirect;
                }
            } else {
                window.location.href = data.redirect;
            }
        });
        return false;
    })
})


// When click on search icon then redirect on search result page
function onSearch(button) {
    let query = $(button).parent().find('input').val();
    $.ajax({
        method: 'GET',
        url: '/api/search/'+query,
        data: {},
    })
    .done(function( data ) {
        $('#ajax_friends_search').html(data);
    });
    
    // window.location.href = "/search/"+$(button).parent().find('input').val();
}

// Send the friend request to user when click on Add Friend button
function sendFriendRequest(tags) {
    let user_id = $(tags).attr('data-id');

    $.ajax({
        method: 'POST',
        url: '/api/register/sendFriendRequest',
        data: {userid: user_id},
    })
    .done(function( data ) {
        window.location.reload();
    });
    return false;
}

// Accept the friend request
function doAccept(tags) {
    let user_id = $(tags).attr('data-id');

    $.ajax({
        method: 'POST',
        url: '/api/register/acceptFriendRequest',
        data: {userid: user_id},
    })
    .done(function( data ) {
        window.location.reload();
    });
    return false;
}

// Unfriend the friend
function doUnfriend(tags) {
    let user_id = $(tags).attr('data-id');

    $.ajax({
        method: 'POST',
        url: '/api/register/unFriend',
        data: {userid: user_id},
    })
    .done(function( data ) {
        window.location.reload();
    });
    return false;
}


// Get Friends List
function showFriends() {
    $.ajax({
        method: 'GET',
        url: '/api/register/showfriends',
        data: {},
    })
    .done(function( data ) {
        $html = '';
        for(i=0; i < data.records.length; i++) {
            $html += '<li class="clearfix friend_chat" data-id="'+data.records[i]._id+'" onClick="startChat(this)">';
                $html += '<img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="avatar">';
                $html += '<div class="about">';
                    $html += '<div class="name">'+data.records[i].name+'</div>';
                    //$html += '<div class="status"> <i class="fa fa-circle offline"></i> left 7 mins ago </div>';
                $html += '</div>';
                $html += '<div class="text-right">';
                    $html += '<a href="javascript:void(0)" class="btn btn-primary" data-id="'+data.records[i]._id+'" onClick="doUnfriend(this)"><i class="fa fa-user-times"></i></a>';
                $html += '</div>';
            $html += '</li>';
        }
        $('#ajax_friends').html($html);
    });
    return false;
}
// Get Friends List
function showFriendsRequests() {
    $.ajax({
        method: 'GET',
        url: '/api/register/showfriendsrequests',
        data: {},
    })
    .done(function( data ) {
        $html = '';
        for(i=0; i < data.records.length; i++) {
            $html += '<li class="clearfix friend_chat" data-id="'+data.records[i]._id+'" onClick="startChat(this)">';
                $html += '<img src="https://bootdey.com/img/Content/avatar/avatar1.png" alt="avatar">';
                $html += '<div class="about">';
                    $html += '<div class="name">'+data.records[i].name+'</div>';
                    //$html += '<div class="status"> <i class="fa fa-circle offline"></i> left 7 mins ago </div>';
                $html += '</div>';
                if(data.records[i].sendByMe == 0 && data.records[i].status == "pending") {
                    $html += '<div class="text-right">';
                        $html += '<a href="javascript:void(0)" class="btn btn-primary" data-id="'+data.records[i]._id+'" onClick="doAccept(this)">Accepted</a>';
                    $html += '</div>';
                }
            $html += '</li>';
        }
        $('#ajax_friends_requests').html($html);
    });
    return false;
}
$(document).ready(function() {
    $('.popup_close').click(function() {
        $('.view_detail_popup').hide();
    });
})