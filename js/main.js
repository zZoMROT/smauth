var accounts = [];
var escrow = [];

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
		res += key + ' => ' + o[key] + '<=';
	}
	return res;
}

$('#addAccountButton').click(function(){
	if($('#login').val() == ""){
		$('#login').fadeTo(100, 0.1).fadeTo(200, 1.0);
		return;
	}
	if($('#password').val() == ""){
		$('#password').fadeTo(100, 0.1).fadeTo(200, 1.0);
		return;
	}
	
	$('.form_get_escrow').hide();
	$('#addAccountButton').hide();
	$('#login').attr('disabled', true);
	$('#password').attr('disabled', true);
	$('.notification').hide();
	doLogin(function(result){
		if(result.status == 'error'){
			$('.notification').show();
			var error_msg = result.err;
			if(result.err.indexOf('Access-Control-Allow-Origin') !== -1)
				error_msg = "Use https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi";
			if(result.err.indexOf('TypeError: Failed to fetch') !== -1)
				error_msg = "Steam is not stable, retry";
			$('.notification').html(error_msg);

			$('#addAccountButton').show();
			$('#login').attr('disabled', false);
			$('#password').attr('disabled', false);
			return;
		}

		if(result.status == 'ok'){
			$(".form_login").hide();

			accounts[$('#login').val()] = { password:$('#password').val(), sessionID: result.sessionID, cookie: result.cookies, steamguard: result.steamguard, steamid: result.steamid,
											community: result.community };
			if(getCookie('accounts') == undefined)
				setCookie('accounts', $('#login').val() + ' ', { expires: 3600*10 });
			else
				setCookie('accounts', getCookie('accounts') + $('#login').val() + ' ', { expires: 3600*10 });

			var cookie_data = JSON.stringify( saveProto(accounts[$('#login').val()]), function(key, value) {
				if (typeof value === 'function') {
					return value.toString();
				} else {
					return value;
				}
			});
			localStorage.setItem($('#login').val(), cookie_data);
			localStorage.setItem($('#login').val() + "|request", DEBUG(accounts[$('#login').val()].community.request));
			
			addRounded($('#login').val());
		}

	}, $('#login').val(), $('#password').val());
	
	//$('#captcha').attr('src', 'https://thumbs.dreamstime.com/b/икона-123-693500.jpg');
	//$("#captcha").show();

	//$(".form_login").hide();
});

function saveProto(obj){
	for(var key in obj){
		if(obj[key] != undefined)
			if(obj[key].__proto__ != undefined){
				obj[key]['proto'] = obj[key].__proto__;
			}

		if(typeof obj[key] === 'object')
			saveProto(obj[key]);
	}
	return obj;
}

function unsaveProto(obj){
	for(var key in obj){
		if(obj[key] != undefined)
			if(obj[key].proto != undefined){
				obj[key]['__proto__'] = obj[key]['proto'];
				delete obj[key]['proto'];
			}

		if(typeof obj[key] === 'object')
			unsaveProto(obj[key]);
	}
	return obj;
}

var getEscrowButton_interval;
var geb_interval_count = 0;
$('#getEscrowButton').click(function(){
	$(this).hide();
	$("#gettingEscrowText").show();
	getEscrowButton_interval = setInterval(function(){
		geb_interval_count++;
		var dots = '';
		for(var i = 0; i < geb_interval_count%4; i++)
			dots += '. ';
		$('#gettingEscrowText').html('Getting ' + dots);
	}, 500); 

	var accountName = $('#fge_accountName').html().split(' ')[0];
	enableTwoFactor(accounts[accountName].community, function(result){
		clearInterval(getEscrowButton_interval);

		if(result.status == 'error'){
			$('.notification').show();
			var error_msg = result.err;
			if(result.err.indexOf('Malformed response') !== -1)
				error_msg = "Your account is limited. Check https://steamcommunity.com/chat to see it."
			$('.notification').html(error_msg);
			$('#getEscrowButton').show();
			$("#gettingEscrowText").hide();

			return;
		}
	});
});

function create_addNewAccount(){
	$('.rounded').append('<li id="addnewaccount"><a href="#">ADD NEW ACCOUNT</a></li>');

	$("#addnewaccount").click(function(){
		$(".form_login").show();
		$('.form_get_escrow').hide();

		$('#login').val('');
		$('#password').val('');
		$('#captcha').hide();
		$('.notification').hide();
		$('#addAccountButton').show();
		$('#login').attr('disabled', false);
		$('#password').attr('disabled', false);
	});
}

function load_cookies(){
	var cookie_accounts = getCookie('accounts');
	if(cookie_accounts != undefined){
		var arr_cookie_acc = cookie_accounts.split(' ');
		for(var i = 0; i < arr_cookie_acc.length; i++){
			if(localStorage.getItem(arr_cookie_acc[i]) != undefined){
				accounts[arr_cookie_acc[i]] = JSON.parse( localStorage.getItem(arr_cookie_acc[i]), function(key, val){
					if(typeof val === "string" && val.indexOf('function') === 0){
						return eval('('+val+')');
				    } else {
						return val;
				    } 
				} );
				
				var f_request_temp = localStorage.getItem(arr_cookie_acc[i] + "|request");
				var f_request = f_request_temp.split('<=');
				for(var j = 0; j < f_request.length - 1; j++)
					accounts[arr_cookie_acc[i]].community.request[f_request[j].split(' => ')[0]] = f_request[j].split(' => ')[1];
				accounts[arr_cookie_acc[i]] = unsaveProto(accounts[arr_cookie_acc[i]]);
			}
		}
	}
}

function addRounded(accountName){
	$('#addnewaccount').remove();
	$('.rounded').append('<li class="account"><a href="#"><div class="close"></div>'+accountName+'<br>'+accounts[accountName].steamid+'</a></li>');
	create_addNewAccount();

	$('.account').click(function(){
		$(".form_login").hide();
		$('.form_get_escrow').hide();
		clickAtAccount($(this));
	});

	$('.close').click(function(){
		$(".form_login").hide();
		$('.form_get_escrow').hide();
		var accountName = $(this).parent().html().split('</div>')[1].split('<')[0];
		localStorage.setItem(accountName, '');
		localStorage.setItem($('#login').val() + "|request", '');
		localStorage.removeItem(accountName);
		localStorage.removeItem($('#login').val() + "|request");
		setCookie("accounts", getCookie("accounts").replace(accountName+' ', ''), { expires: 3600*10 });
		$(this).parent().parent().remove();
	});

}