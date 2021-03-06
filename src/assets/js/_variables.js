// Jours fériés / chomés
const
	publicHolidays = [
		'2020-01-01', '2020-01-02',
		'2020-03-19',
		'2020-04-10', '2020-04-13',
		'2020-05-21',
		'2020-06-01', '2020-06-11',
		'2020-08-01', '2020-08-15',
		'2020-11-01',
		'2020-12-08', {date:'2020-12-24', morning:false, afternoon:true},	'2020-12-25', {date:'2020-12-31', morning:false, afternoon:true}
	].map(item => item.hasOwnProperty('date') ? item : {date:item, morning:true, afternoon:true}),

	timePattern = {
		delimiters: [':'],
		blocks: [2,2],
		numericOnly: true
	},

	hourPattern = {
		time: true,
		timePattern: ['h', 'm']
	},

	random = {
		chars : [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ123456789"],
		getString : length => [...Array(length)].map(_ => random.chars[Math.random() * random.chars.length|0]).join('')
	},

	api = ( (baseUrl) => {
		'use strict';

		const request = (endpoint, method, body, callbackSuccess = null, callbackError = null) => {
			const fetchOptions = {};
			if (method != null) { fetchOptions.method = method; }
			if (body != null) { fetchOptions.body = JSON.stringify(body); }

			var request = $.ajax({
			  url: baseUrl+endpoint,
			  method: method,
			  data: fetchOptions.body,
			  processData: false,
			  contentType: 'application/json'
			});
			 
			request.done(text => {
				if (callbackSuccess == null || !(callbackSuccess instanceof Function)) {
					return;
				}
			  	try {
					callbackSuccess(JSON.parse(text));
				} catch (error) {
					callbackSuccess(text);
				}
			});
			 
			request.fail( (jqXHR, textStatus) => {
				if (callbackError != null && callbackError instanceof Function) {
					callbackError(textStatus);
				} else {
					if (callbackSuccess != null && callbackSuccess instanceof Function) {
						callbackSuccess(textStatus);
					}
				}
			});
		};	

		return {
			get 	: (endpoint, 		 callbackSuccess,    	 callbackError = null) => request(endpoint, "GET", null, callbackSuccess, callbackError),
			post 	: (endpoint, body, callbackSuccess = null, callbackError = null) => request(endpoint, "POST", body, callbackSuccess, callbackError),
			put 	: (endpoint, body, callbackSuccess = null, callbackError = null) => request(endpoint, "PUT", body, callbackSuccess, callbackError),
			delete  : (endpoint, 		 callbackSuccess = null, callbackError = null) => request(endpoint, "DELETE", null, callbackSuccess, callbackError)
		}

	})("src/call_api.php?endpoint="),
	
	getLabelForInput = (type1, type2) => {
		var label = "";
		switch (type1) {
			case "hour":
				label += "Timbrage";
				break;
			case "previousOvertime":
				label += "Solde horaire";
				break;
		}
		if (type2) {
			label += " "+type2;
		}
		return label;
	};
