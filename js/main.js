var accounts = [];

create_addNewAccount();
load_cookies();

for(var accountName in accounts)
	addRounded(accountName);

if (!navigator.cookieEnabled) {
  alert( 'Enable cookie' );
}

function DEBUG(o){
	var res = '';
	for(var key in o){
		res += key + ' => ' + o[key] + '\n';
	}
	return res;
}

$('.button28').click(function(){
	if($('#login').val() == ""){
		$('#login').fadeTo(100, 0.1).fadeTo(200, 1.0);
		return;
	}
	if($('#password').val() == ""){
		$('#password').fadeTo(100, 0.1).fadeTo(200, 1.0);
		return;
	}
	
	$('.button28').hide();
	$('#login').attr('disabled', true);
	$('#password').attr('disabled', true);
	$('.notification').hide();
	doLogin(function(result){
		if(result.status == 'error'){
			$('.notification').show();
			var error_msg = result.err;
			if( result.err.indexOf('TypeError: Failed to fetch') !== -1 ||
				result.err.indexOf('Access-Control-Allow-Origin') !== -1 )
				error_msg = "Use https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi";
			$('.notification').html(error_msg);

			$('.button28').show();
			$('#login').attr('disabled', false);
			$('#password').attr('disabled', false);
			return;
		}

		if(result.status == 'ok'){
			accounts[$('#login').val()] = {password:$('#password').val(), sessionID: result.sessionID, cookie: result.cookies, steamguard: result.steamguard, steamid: result.steamid};
			if(getCookie('accounts') == undefined)
				setCookie('accounts', $('#login').val(), { expires: 3600*10 });
			else
				setCookie('accounts', getCookie('accounts') + ' ' + $('#login').val(), { expires: 3600*10 });
			setCookie($('#login').val(), JSON.stringify(accounts[$('#login').val()]), { expires: 3600*10 });

			addRounded($('#login').val());
		}

	}, $('#login').val(), $('#password').val());
	
	//$('#captcha').attr('src', 'https://thumbs.dreamstime.com/b/икона-123-693500.jpg');
	//$("#captcha").show();

	//$(".form_login").hide();
});

function create_addNewAccount(){
	$('.rounded').append('<li id="addnewaccount"><a href="#">ADD NEW ACCOUNT</a></li>');

	$("#addnewaccount").click(function(){
		$(".form_login").show();

		$('#login').val('');
		$('#password').val('');
		$('#captcha').hide();
		$('.notification').hide();
		$('.button28').show();
		$('#login').attr('disabled', false);
		$('#password').attr('disabled', false);
	});
}

function load_cookies(){
	var cookie_accounts = getCookie('accounts');
	if(cookie_accounts != undefined){
		var arr_cookie_acc = cookie_accounts.split(' ');
		for(var i = 0; i < arr_cookie_acc.length; i++){
			if(getCookie(arr_cookie_acc[i]) != undefined)
				accounts[arr_cookie_acc[i]] = JSON.parse( getCookie(arr_cookie_acc[i]) );
		}
	}
}

function addRounded(accountName){
	$('#addnewaccount').remove();
	$('.rounded').append('<li class="account"><a href="#"><div class="close"></div>'+accountName+'</br>'+accounts[accountName].steamid+'</a></li>');
	create_addNewAccount();

	$('.account').click(function(){
		$(".form_login").hide();
	});

	$('.close').click(function(){
		$(this).parent().parent().remove();
		deleteCookie($(this).parent().html().split('</div>')[1].split('<')[0]);
	});

}