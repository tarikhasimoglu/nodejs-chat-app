//LOGIN
$("#form").submit('click', function (event) {
    /* stop form from submitting normally */
    event.preventDefault();
    /* get some values from elements on the page: */
    var $form = $(this),
        //term = $form.find('input[name="s"]').val(),
        //url = $form.attr('action');
        username = $('*[placeholder="Username"]').val(),
        password = $('*[placeholder="Password"]').val(),
        url = 'http://localhost:8080/login';

    /* Send the data using post */
    var posting = $.post(url, {
        username: username,
        password: password
    });

    /* Put the results in a div */
    posting.done(function (data) {
        //var content = $(data).find('#content');
        $(".login-form").hide();
        //var text = "<p id='hi'>Hi</p>";
        //$("#form").empty().append(text);
        $('#form').hide();
        try {
            var jsonData = JSON.parse(data);
            for (var i = 0; i < jsonData.length; i++) {
                $('#receivedMsgs').prepend($('<h4>').text(
                    jsonData[i].time +
                    " " +
                    jsonData[i].sender +
                    ": " +
                    jsonData[i].msg
                ));
            }
        }
        catch (err) {
            $('#receivedMsgs').prepend($('<h4>').text(""));
        }
        var socket = io.connect('http://localhost:8080');
        $(".chatting").show();
        $("#welcome").text(username);
        $('#sendbutton').on('click', function () {
            if ($('#msginput').val() == "") {
                alert("Message box can't be empty !");
                return;
            }

            socket.emit('message', $('#msginput').val(), $('#dest').val(), $('#destuser').val());
            $('#msginput').val('');
            return false;
        });
        socket.on("message", function (rcvdMsg) {
            $('#receivedMsgs').prepend($('<h4>').text(rcvdMsg));
        });

        socket.on("disconnected", function () {
            window.location = "http://localhost:8080";
        });
        $('#joingroup').on('click', function () {
            var destgroup = $('#destgroup').val();
            if (destgroup == "") {
                alert("Group Name can't be empty!");
                return;
            }
            socket.emit('join', destgroup);
            $('#sendbutton').prop("disabled", false);
            //$('#receivedMsgs').prepend($('<p>').text("You're Now Connected To: " + destgroup));
        });

    });
    posting.error(function (error) {
        $('#warningMsgForm').text("Your username or password is incorrect !");
    })
});

$("#signupButton").on('click', function (event) {
    /* stop form from submitting normally */
    event.preventDefault();

    /* get some values from elements on the page: */
    var $form = $(this),
        //term = $form.find('input[name="s"]').val(),
        //url = $form.attr('action');
        username = $('*[placeholder="Username"]').val(),
        password = $('*[placeholder="Password"]').val(),
        url = 'http://localhost:8080/signup';

    /* Send the data using post */
    var posting = $.post(url, {
        username: username,
        password: password
    });

    /* Put the results in a div */
    posting.done(function (data) {
        //var content = $(data).find('#content');
        //$("#form").append(data);
        $('#warningMsgForm').text(data);
    });
});

$($('#msginput')).keypress(function (e) {
    var key = e.which;
    if (key == 13)  // the enter key code
    {
        $('#sendbutton').click();
        return false;
    }
});

$('#dest').on('change', function () {
    switch (this.value) {
        case "A User": {
            $('#sendbutton').prop("disabled", false);
            $('#destgroupdiv').hide();
            $('#destuserdiv').show();
            break;
        }
        case "All Connected Users": {
            $('#sendbutton').prop("disabled", false);
            $('#destgroupdiv').hide();
            $('#destuserdiv').hide();
            break;
        }
        case "A Group": {
            $('#destuserdiv').hide();
            $('#destgroupdiv').show();
            $('#sendbutton').prop("disabled", true);
            break;
        }
    }
});

$('#clearbutton').on('click', function () {
    $('#receivedMsgs').empty();
});

$('#destgroup').on('keydown', function () {
    $('#sendbutton').prop("disabled", true);
});