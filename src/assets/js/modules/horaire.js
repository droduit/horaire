/* 
 * Page Horaire  ----------------------------------------------------------
 */
// Heure maximal de fin du travail
const END_WORKING_HOUR = 19;
const MIN_BREAK_TIME_MIN = 30;
const TIMESTAMP_EXPIRATION_INPUTS_HOURS = moment().endOf("day").add(3, "hours").valueOf();

var timerTimelapse = false;

$(function(){

	$('body').on('click', '.signOvertime', function(){
		$('.signOvertime').html($(this).hasClass("minus") ? "+" : "-").toggleClass("minus");
		localStorage.setItem("signOvertimeNegative", $(this).hasClass("minus") ? 1 : 0);

		fillCurrentOvertime();
		processOvertimeStats(getTimeForInput("previousOvertime"));
		processFinalTime();
		$('.hour._4').popover('update');
	});

	if(!localStorage.getItem('dailyWorkTime') && !localStorage.getItem('previousOvertime')) {
		askHoraire();
	} else {
		if(!localStorage.getItem('dailyWorkTime')) {
			askHoraire();
		}
		if(!localStorage.getItem('previousOvertime')) {
			askOvertime();
		}
	}
	
	$('.signOvertime')
		.html(localStorage.getItem('signOvertimeNegative') == "1" ? "-" : "+")
		.addClass(localStorage.getItem('signOvertimeNegative') == "1" ? "minus" : "plus");
	
	$('.chooseHoraire').click(function(){
		askHoraire();
	});
	$('.editOvertime').click(function(){
		askOvertime();
	});
	
	if (window.innerWidth >= 760) {
		$('#previousOvertime').popover({trigger:"focus", html:true, animation:false, content:"Reportez dans ce champ votre solde horaire chaque matin en arrivant."});
		$('body').popover({selector:'#overtime', trigger:"focus", html:true, animation:false, content:"Reportez dans ce champ votre solde horaire actuel. Les touches +/- pour un solde positif/négatif."});
	}

	$('.hour._4').popover({trigger:"manual", html:true, animation:false, content:"-", placement:"right", container:".page[data-id=horaire]", template:'<div class="popover timelapse" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'});

	$('.toast').toast({delay:3500});

	var cleaveH1 = new Cleave('.hour._1', hourPattern);
	var cleaveH2 = new Cleave('.hour._2', hourPattern);
	var cleaveH3 = new Cleave('.hour._3', hourPattern);
	var cleaveH4 = new Cleave('.hour._4', hourPattern);

	var cleaveCurrOvertime = new Cleave('#currentOvertime', timePattern);
	var cleavePrevOvertime = new Cleave('#previousOvertime', timePattern);
	
	var nbInput = $('input').length;
	var currentInputIdx = 0;
	$('input').each(function() {
		if(localStorage.getItem($(this).attr("id")) != null) {
			$(this).val(getLocalStorage($(this).attr("id")));
			if($(this).is("[data-val]")) {
				$(this).attr("data-val", getLocalStorage($(this).attr("id")));
			}
		}
		
		currentInputIdx++;
		if(currentInputIdx == nbInput) {

			if(isFilled("previousOvertime")) {
				if(!isFilled("currentOvertime")) {
					$('#currentOvertime').val($('#previousOvertime').val());
				}
				$('#currentOvertime').addClass("bg-"+(getTimeForInput("previousOvertime") >= 0 ? "success" : "danger"));
				processOvertimeStats(getTimeForInput("currentOvertime"));
			}
			
			if(isFilled('arr1') && isFilled('dep1')) { // Calculer première section 
				processGroup(1);
				if(isFilled('arr2')) { // Calculer Pause
					if(getBreakTime() < 30) {
						$('#arr2').val(minsToTime(getTimeForInput("dep1") + 30));
					}
					processBreakTime();
					if(isFilled('dep2')) { // Calculer deuxième section 
						processGroup(2);
						startTimerTimelapse();

						var expectedEndTime = getExpectedEndTime();
						var currentTime = getCurrentTime();
						if(expectedEndTime < currentTime && currentTime <= END_WORKING_HOUR*60) {
							$('#dep2').val(minsToTime(currentTime)).trigger("keyup");
						}
					}
				}
			}
		}
	});

	focusOnNextEmptyTimeInput();
	timeline.create();
	
	$('body')
	.on('keydown', 'input', function(e) {
		if ($(this).is(".hour") && !inputTime.isAcceptedKey(e)) {
			//e.preventDefault();
			return false;
		}
	})
	.on('keyup', 'input', function(e) {
		if ($(this).val().length == 5) {
			if ($(this).attr("id") == "dailyWorkTime" || $(this).attr("id") == "previousOvertime") {
				localStorage.setItem($(this).attr("id"), $(this).val());
			} else {
				setLocalStorage($(this).attr("id"), $(this).val(), TIMESTAMP_EXPIRATION_INPUTS_HOURS);
			}

			if ($(this).is(".hour")) {
				var groupId = $(this).closest(".group").data("group");
				if (typeof groupId == "undefined") {
					return;
				}

				if (keyboard.isNumber(e.keyCode)) {
					var nextIdxTimeInput = parseInt($(this).attr("idxTimeInput")) + 1;
					var nextTimeInput = $('.hour[idxTimeInput="'+nextIdxTimeInput+'"]');
					if (nextTimeInput.length > 0 && nextTimeInput.val().length == 0) {
						nextTimeInput.focus();
					}
				}

				if (isFilled("arr"+groupId) && isFilled("dep"+groupId) && getTimeForInput("dep"+groupId) < getTimeForInput("arr"+groupId)) {
					$('#dep'+groupId).val(minsToTime(getTimeForInput("arr"+groupId)+60));
				}

				processGroup(groupId);
				timeline.create();

				setTimeout(api.post('user-time/'+localStorage.getItem("coupling-code"), {
					type1: "hour",
					type2: $(this).attr("idxTimeInput"),
					value: $(this).val()
				}), 500);
			}
		}
	})
	.on('keyup', '#arr1', function(e) {
		if (isFilled("dep1") && isFilled("arr2") && isFilled("arr1")) {
			processBreakTime();
			processGroup(2);
			startTimerTimelapse();
		}
	})
	.on('keyup', '#arr2, #dep1', function(e) {
		if (isFilled("arr2") && isFilled("dep1")) {
			if (getBreakTime() < MIN_BREAK_TIME_MIN) {
				$('#arr2').val(minsToTime(getTimeForInput("dep1") + MIN_BREAK_TIME_MIN));
			}
			processBreakTime();
			startTimerTimelapse();
		}
	})
	.on('keyup', '#previousOvertime', function() {
		if (isFilled("previousOvertime")) {
			fillCurrentOvertime();
			processOvertimeStats(getTimeForInput("previousOvertime"));
			processFinalTime();

			api.post('user-time/'+localStorage.getItem("coupling-code"), {
				type1: "previousOvertime",
				value: localStorage.getItem("previousOvertime")
			});
		}
	}).on('keyup', '#currentOvertime', function() {
		if (isFilled("currentOvertime")) {
			processOvertimeStats(getTimeForInput("currentOvertime"));
		}
	});

	let inputTime = {
		isAcceptedKey: function(e) {
			return keyboard.isNumber(e.keyCode) || keyboard.isTab(e.keyCode) || keyboard.isArrowsX(e.keyCode) || keyboard.isBackspace(e.keyCode)
			|| keyboard.isCtrlA(e) || keyboard.isCtrlZ(e) || keyboard.isCtrlC(e) || keyboard.isCtrlV(e) || keyboard.isCtrlF5(e) || keyboard.isF5(e.keyCode)
		},
		isTriggerComputationKey: function(keyCode) {
			return keyboard.isNumber(keyCode) || keyboard.isTab(keyCode)
		}
	};

	let keyboard = {
		isNumber: function(keyCode) { return (keyCode > 95 && keyCode < 106) || (keyCode > 47 && keyCode < 58) },
		isTab: function(keyCode) { return keyCode == 9 },
		isF5: function(keyCode) { return keyCode == 116 },
		isArrowsX : function(keyCode) { return keyCode == 37 || keyCode == 39 },
		isBackspace: function(keyCode) { return keyCode == 8 },
		isCtrl : function(e) { return e.ctrlKey || e.metaKey },
		isCtrlA: function(e) { return keyboard.isCtrl(e) && e.keyCode == 65 },
		isCtrlZ: function(e) { return keyboard.isCtrl(e) && e.keyCode == 90 },
		isCtrlC: function(e) { return keyboard.isCtrl(e) && e.keyCode == 67 },
		isCtrlV: function(e) { return keyboard.isCtrl(e) && e.keyCode == 86 },
		isCtrlF5: function(e) { return keyboard.isCtrl(e) && keyboard.isF5(e.keyCode) }
	}


	function getPublicHolidaysComingSoon() {
		let comingPublicHolidays = [];
		for (var i = 1; i < 14; ++i) {
			let day = moment().add(i, 'days');
			if (publicHolidays.map(item => item.date).includes(day.format('YYYY-MM-DD'))) {
				comingPublicHolidays.push(day);
			}
		}
		return comingPublicHolidays;
	}

	var comingPublicHolidays = getPublicHolidaysComingSoon();
	if (comingPublicHolidays.length > 0) {
		var textHolidays = '';
		getPublicHolidaysComingSoon().forEach( day => textHolidays += '<a href="#" data-date="'+day.format('YYYY-MM-DD')+'" class="badge badge-danger ml-1 publicHoliday">'+day.format('dddd DD MMMM')+"</a>" );
		$('.page[data-id="horaire"]').append('<div id="box-holidays" class="alert alert-danger mt-2 mb-0 text-center p-2">Prochains congés '+textHolidays+'</div>');
	
		$('.page[data-id="horaire"]').on('click', '.publicHoliday', function(){
			var slctDay = $(this).data("date");
			bootbox.alert({
				title: "Congés à venir",
				message: '<ul class="list-group">' +
  					publicHolidays
	  					.filter(item => {
	  						let momentDay = moment(item.date);
	  						return momentDay.isAfter(moment()) && momentDay.isBefore(moment(moment().get('year')+'-01-03').add(1, 'years'));
	  					})
	  					.map(x => { 
	  						var remarque = '';
	  						if (!x.afternoon) {
	  							remarque = ' (Matin)';
	  						}
	  						if (!x.morning) {
	  							remarque = ' (Après-midi)';
	  						}
	  						return '<li class="list-group-item py-1 '+(moment(x.date).isSame(moment(slctDay)) ? 'active' : '')+'">'+
	  									moment(x.date).format("dddd, DD MMMM YYYY")+remarque
	  								'</li>';
	  					})
	  					.join("")
  					+ '</ul>',
				size: "medium",
				scrollable: true
			});
		});
	}

	displayTimelapseBeforeHolidays();


	// Affiche les timbrages peoplesoft s'ils existent
	if(localStorage.getItem("username")) {
		function getTimbragesFromDB() {
			api.get('user-storage/'+localStorage.getItem("coupling-code")+"?date="+moment().format("YYYY-MM-DD"),
			json => {
				console.log(json);
				if (json.timbrages) {
					json.timbrages.split(",").forEach( (timbrage, index) => {
						var hourElem = $('.hour[idxTimeInput="'+(++index)+'"]');
						if (hourElem.length > 0) {
							hourElem.val(timbrage).trigger("keyup");
						}
					});
				}
				if (json.soldes) {
					json.soldes.split(",").forEach( (solde, index) => {
						$('#previousOvertime').val(solde).trigger("keyup");
					});
				}
			});
		}
		getTimbragesFromDB();
		setInterval(getTimbragesFromDB, 30*1000);
	}

});

function focusOnNextEmptyTimeInput() {
	var i;
	for (i = 1; i <= parseInt($('.hour:last').attr("idxTimeInput")); ++i) {
		if($('.hour[idxTimeInput="'+i+'"]').val().length == 5) {
			continue;
		}
		break;
	}
	var inputToFocusOn = $('.hour[idxTimeInput="'+i+'"]');
	if (inputToFocusOn.length > 0) {
		inputToFocusOn.focus();
	}
}

function displayTimelapseBeforeHolidays() {
	if(localStorage.getItem("startHoliday") != null) {
		let textTimelapseBeforeHolidays = "";

		var holidaysStartingDay = moment(localStorage.getItem("startHoliday"));
		var holidaysEndingDay = moment(localStorage.getItem("endHoliday"));
		if(!moment().isAfter(holidaysStartingDay)) {
			let nbDaysBeforeHolidays = holidaysStartingDay.diff(moment(), 'days') + 1;
			let nbDaysBeforeEndingHolidays = holidaysEndingDay.diff(moment(), 'days') + 1;
			
			textTimelapseBeforeHolidays = 'Vos vacances commencent dans '+nbDaysBeforeHolidays+' jours et finissent dans '+nbDaysBeforeEndingHolidays+' jours.';
		} else {
			if(moment().isBefore(holidaysEndingDay)) {
				let nbDaysBeforeEndingHolidays = holidaysEndingDay.diff(moment(), 'days') + 1;
				textTimelapseBeforeHolidays = 'Vos vacances finissent dans '+nbDaysBeforeEndingHolidays+' jours.';
			}
		}

		if (textTimelapseBeforeHolidays != "") {
			if($('.timelapseBeforeHolidays').length <= 0) {
				$('.page[data-id="horaire"]').append('<div onclick="document.location=\'#holidayPlan\';" style="cursor:pointer" class="timelapseBeforeHolidays alert alert-success mt-2 text-center p-2"></div>');
			} 
			$('.timelapseBeforeHolidays').html(textTimelapseBeforeHolidays);
		}
	}
}

function askHoraire() {
	var dialog = bootbox.dialog({
		title: 'Horaire quotidien',
		message:
		'<div class="d-flex align-items-center justify-content-center">'+
		  '<input type="text" class="hour" id="dailyWorkTime" inputmode="tel" pattern="[0-9]*" '+
		  	'value="'+ (localStorage.getItem('dailyWorkTime') || "08:36") +'">'+
		'</div>',
		size: 'small',
		closeButton:false,
		animate:false,
		buttons: {
			confirm: {
				label: '<i class="material-icons" style="vertical-align:top">check</i>',
				callback: function() {
					if ($('#dailyWorkTime').val().length == 5 && getTimeForInput("dailyWorkTime") >= 60*1) {
						localStorage.setItem("dailyWorkTime", $('#dailyWorkTime').val());
						if (!localStorage.getItem('previousOvertime')) {
							askOvertime();
						} else {
							$('.hour[idxTimeInput=1]').focus();
						}
						processGroup(1);
						processBreakTime();
						processGroup(2);
						processOvertimeStats(getTimeForInput("currentOvertime"));
						timeline.create();
					} else {
						return false;
					}
				}
			}
		}
	});
	dialog.init(function(){
		setTimeout(function(){
			var cleaveDailyWorkTime = new Cleave('#dailyWorkTime', hourPattern);
			$('#dailyWorkTime').focus().select().keyup(function(e) {
				if(e.keyCode == 13)
					$('button.bootbox-accept').click();
			});
		}, 100);
	});
}

function askOvertime() {
	var dialog = bootbox.dialog({
		title: 'Solde Horaire',
		message:
		'<div class="d-flex align-items-center justify-content-center">'+
		  '<div class="signOvertime">+</div>'+
		  '<input type="text" class="time" id="overtime" inputmode="tel" pattern="[0-9]*" '+
		  	'value="'+ (localStorage.getItem('previousOvertime') || "00:00") +'">'+
		'</div>',
		size: 'small',
		animate:false,
		buttons: {
			confirm: { label: '<i class="material-icons" style="vertical-align:top">check</i>', callback: function() {
				if($('#overtime').val().length >= 5) {
					localStorage.setItem("signOvertimeNegative", $('.modal-body .signOvertime').text() == "-" ? 1 : 0);
					localStorage.setItem("previousOvertime", $('#overtime').val());
					localStorage.setItem("currentOvertime", $('#overtime').val());

					$('.signOvertimeCell').html($('.signOvertime').html());
					$('#previousOvertime, #currentOvertime').val($('#overtime').val());
					$('#currentOvertime').addClass("bg-"+(getTimeForInput("previousOvertime") >= 0 ? "success" : "danger"));
					processOvertimeStats(getTimeForInput("currentOvertime"));
					$('#arr1').focus();
				} else {
					return false;
				}
			}}
		}
	});
	dialog.init(function(){
		setTimeout(function(){
			var cleaveOvertime = new Cleave('#overtime', timePattern);
			$('#overtime').focus().select().keyup(function(e){
				if(e.keyCode == 13) { // [enter]
					$('button.bootbox-accept').click();
				} else if (e.keyCode == 109 || e.keyCode == 107) { // [minus]  || [plus]
					changeSignOvertime(e.keyCode);
					$('.signOvertime').fadeIn();
				} 
			});						
		}, 100);
	});
}

function changeSignOvertime(keyCode) {
	if (keyCode == 109) {
		$('.signOvertime').html("-").addClass("minus");
	} else if(keyCode == 107) {
		$('.signOvertime').html("+").removeClass("minus");
	}
	localStorage.setItem("signOvertimeNegative", $('.signOvertime').first().hasClass("minus") ? 1 : 0);
}

function processGroup(groupId) {
	if( isFilled('dep'+groupId) && isFilled('arr'+groupId) ) {
		var groupTime = getGroupTotalTime(groupId);

		var left = groupId == 1 ? '<div><b>Restant:</b> '+minsToTime(Math.max(0, getHoraireTime() - groupTime))+'</div>' : '';
		$('.group[data-group="'+groupId+'"] .inter').html('<div><b>Effectué:</b> '+minsToTime(groupTime)+'</div>'+left);
		
		processFinalTime();
	}
}

function processBreakTime() {
	if(isFilled("dep1") && isFilled("arr2")) {
		var currentTime = getCurrentTime();
		var expectedEndTime = getExpectedEndTime();

		if(expectedEndTime < currentTime && currentTime <= END_WORKING_HOUR*60) {
			expectedEndTime = currentTime;
		}
		
		$('#dep2').val(minsToTime(expectedEndTime)).trigger("keyup");
		$('#pauseMidi').html('<span class="badge badge-light position-absolute" style="left:16px; margin-top:3px">Pause de midi</span>'+minsToTime(getBreakTime())).show();
	}
}

function processFinalTime() {
	if( isFilled("arr1") && isFilled("dep1") && isFilled("arr2") && isFilled("dep2") ) {
		
		var totalTime = getTotalTimeWorked();
		
		var color = totalTime >= getHoraireTime() ? 'success' : 'danger';
		var sign = color == "success" ? '+' : '-';
		var comment = sign == "+" ? "Bonus" : "Malus";
		var hsuppTime = totalTime - getHoraireTime();
		var bonusMalus = minsToTime(Math.abs(hsuppTime));
		
		$('.bonusMalusSign').text(sign).removeClass("text-danger text-success").addClass("text-"+color);
		$('.bonusMalusText').text(comment).removeClass("text-danger text-success").addClass("text-"+color);
		$('#bonusMalus').val(bonusMalus).removeClass("text-danger text-success").addClass("text-"+color);

		comment = '<span class="badge badge-light">'+comment+"</span>";
		if(totalTime == getHoraireTime()) {
			sign == "";
			color = "primary";
			comment = "";
		}
		
		$(".final")
			.removeClass("bg-danger bg-success")
			.addClass("bg-"+color)
			.html('<span><b class="badge badge-light position-absolute" style="left:6px; margin-top:3px">Temps total</b> '+minsToTime(totalTime)+" = "+minsToTime(getHoraireTime()) + " <b>" + sign + bonusMalus+'</b> '+comment+'</span>')
			.show();
		
		var newHsupp = getTimeForInput("previousOvertime") + hsuppTime;
		var signHSupp = newHsupp >= 0 ? "" : "- ";

		$('#currentOvertime')
			.val(signHSupp+minsToTime(newHsupp, true))
			.removeClass("bg-danger bg-success")
			.addClass("bg-"+(newHsupp >= 0 ? "success" : "danger"));
		
		processOvertimeStats(newHsupp);
		
		if (getCurrentTime() <= getExpectedEndTime()) {
		 navigator.serviceWorker.ready
		  .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
		  .then(subscription => {
			if (!subscription) return;
			$.post("src/setEndingTime.php", {
				time: $('#dep2').val(),
				endpoint: subscription.endpoint
			}, function(ret) {
				//console.log(ret);
			});
		  });
		}
	}
}

function fillCurrentOvertime() {
	var newHsupp = getTimeForInput("previousOvertime") + getTimeForInput("bonusMalus");
	var signHSupp = newHsupp >= 0 ? "" : "- ";

	$('#currentOvertime')
		.val(signHSupp+minsToTime(newHsupp, true))
		.removeClass("bg-danger bg-success")
		.addClass("bg-"+(newHsupp >= 0 ? "success" : "danger"));

	localStorage.setItem("currentOvertime", $('#currentOvertime').val());
}

function processOvertimeStats(newHsupp) {
	var nbJours = Math.round(newHsupp / getHoraireTime());
	var timeLeftBeforeNextDay = nbJours * getHoraireTime() - newHsupp;
	
	while(timeLeftBeforeNextDay < 0) {
		nbJours += 1;
		timeLeftBeforeNextDay = nbJours * getHoraireTime() - newHsupp;
	}
	
	var minutesLeftWithoutDays = newHsupp - Math.trunc(newHsupp / getHoraireTime()) * getHoraireTime();
	var halfDay = "";
	if(minutesLeftWithoutDays >= (getHoraireTime() / 2)) {
		halfDay = " ½";
		minutesLeftWithoutDays -= getHoraireTime() / 2; 
	}
	
	var fullDaysOvertime = Math.trunc(newHsupp / getHoraireTime());
	if(fullDaysOvertime == 0 && halfDay != "") fullDaysOvertime = "";
	
	var showStats = true; // newHsupp > getHoraireTime();

	$('.overtimeDaysEqual, .hSuppToShow').toggle(showStats);
	$('.dayHsupp').html(getCommentAboutCurrentSituation(nbJours, timeLeftBeforeNextDay)).show();
	$('.nextDayInHour').html(getTextNextDayInHours(nbJours)).toggle(nbJours > 0);
	$('.overtimeDays').html(!showStats ? "" : fullDaysOvertime+halfDay+" jours et "+minsToTime(minutesLeftWithoutDays, true));
	$('.overtimeDays, .overtimeDaysEqual').toggle(nbJours != 0);
}

function getCommentAboutCurrentSituation(nbJours, timeLeftBeforeNextDay) {
	if(nbJours > 0) {
		return '<div>Il faut encore <b>'+minsToTime(timeLeftBeforeNextDay)+'</b> avant '+nbJours+' jours'+'</div>';
	} else {
		if(nbJours != 0 || timeLeftBeforeNextDay != 0) {
			return '<div class="text-danger font-weight-bold">Rattrapage du solde négatif</div>'+
			'<div class="mt-2"><i class="material-icons text-dark anim1" style="font-size: 2.6rem">sentiment_very_dissatisfied</i></div>';
		}
	}
	return '';
}

function getTextNextDayInHours(nbJours) {
	return '<div class="badge badge-secondary nextDayInHours">'+nbJours+' jours = '+minsToTime(nbJours * getHoraireTime())+'</div>'
}

function refreshTimelapse() {
	var expectedEndTime = getExpectedEndTime();
	var currentTime = getCurrentTime();

	if(isFilled("dep2") && expectedEndTime != getTimeForInput("dep2")) {
		expectedEndTime = getTimeForInput("dep2");
	}
	
	if(isFilled("arr1") && isFilled("dep1") && isFilled("arr2")) {
		var currentDate = new Date();
		var secondsNow = currentDate.getHours()*60*60 + currentDate.getMinutes()*60 + currentDate.getSeconds();
		var secondsExpectedEndTime = expectedEndTime*60;
		
		var timelapseInSeconds = secondsExpectedEndTime - secondsNow;
		$('.popover.timelapse .popover-body').html(secondsToTime(timelapseInSeconds, true));
		
		if(Math.abs(timelapseInSeconds) % 60 == 0 && expectedEndTime < currentTime && currentTime <= END_WORKING_HOUR*60) {
			if(timelapseInSeconds < 0) {
				$('.toast-body').html('+1 minute ajoutée au solde horaire !');
				$('.toast').toast({delay:3500}).toast("show");
			}

			$('#dep2').val(minsToTime(currentTime)).trigger("keyup");
			//processBreakTime();
			//processGroup(2);
			timeline.create();
		}
	} else { // Mise en pause du timer
		clearInterval(timerTimelapse);
		timerTimelapse = false;
		var iconName = 'pause'; //isFilled("arr1") && isFilled("dep1") && isFilled("arr2") ? 'play' : 'pause';
		var iconColor = 'danger'; //iconName == "play" ? 'info' : 'danger';
		var tooltipHTML = '';//iconName == "play" ? 'data-toggle="tooltip" data-placement="top" title="Rétablir"' : '';
		$('.popover.timelapse .popover-body').append('<div class="overlay"><i '+tooltipHTML+' class="material-icons text-'+iconColor+' timer-timelapse-action '+iconName+'">'+iconName+'_circle_filled</i></div>');
		
	}
}

function startTimerTimelapse() {
	if(isFilled("arr1") && isFilled("dep1") && isFilled("arr2")) {
		if(localStorage.getItem("display_timelapse") == "false") {
			$('.hour._4').popover("hide");
			if(timerTimelapse != false) clearInterval(timerTimelapse);
			timerTimelapse = false;
		} else {
			$('.hour._4').popover("show");
		}
		refreshTimelapse();		
		if(timerTimelapse == false) {
			timerTimelapse = setInterval(refreshTimelapse, 1000);
		}
	}
}

var timeline = {
	elem: $('#timeline'),
	pointElem : $('<div class="point"><div class="label-time"></div></div>'),
	progressionElem : $('<div class="progression progress-bar progress-bar-striped progress-bar-animated"></div>'),

	create: function() {
		if (localStorage.getItem("display_timeline") == "true") {
			this.clear();
			this.points.compute();
			this.progressions.compute();
			this.addListeners();
		} else {
			timeline.elem.removeClass("set");
		} 
	},
	// ------------------------------------
	clear: function() {
		this.elem.html("");
	},
	getTimeReference : function() {
		return getTimeForValue($('.hour[idxTimeInput=1]').val());
	},
	getWidthOfBreaksInPercent : function() {
		var lastIdxTimeInput = parseInt($('.hour[idxTimeInput]:last').attr("idxTimeInput"));
		var totalWidthInPercent = 0;
		for(var i = 2; i < lastIdxTimeInput; i += 2) {
			if ($('.hour[idxTimeInput="'+i+'"]').val().length == 5 && $('.hour[idxTimeInput="'+(i+1)+'"]').val().length == 5) {
				var timeEnd = getTimeForValue($('.hour[idxTimeInput="'+i+'"]').val());
				var timeRestart = getTimeForValue($('.hour[idxTimeInput="'+(i+1)+'"]').val());
				totalWidthInPercent += (timeRestart - timeEnd) / timeline.getWidth() * 100;
			}
		}
		return totalWidthInPercent;
	},
	getWidth: function() {
		return getHoraireTime() + Math.max(MIN_BREAK_TIME_MIN, getBreakTime());
	},
	addListeners: function() {
		timeline.elem.find('.point').hover(function(){
			$('.hour[idxTimeInput="'+$(this).attr("idxTimeInput")+'"]').toggleClass("highlight");
		});
	},
	// ------------------------------------
	points: {
		add: function(pos, text, idxTimeInput, prediction=false) {
			var firstIdxTimeInput = parseInt($('.hour[idxTimeInput]:first').attr("idxTimeInput"));
			var lastIdxTimeInput = parseInt($('.hour[idxTimeInput]:last').attr("idxTimeInput"));

			let newPoint = timeline.pointElem.clone()
				.attr("idxTimeInput", idxTimeInput)
				.css("left", pos+"%")
				.find('.label-time').html(text)
				.parent();

			if (prediction) {
				newPoint
					.addClass("prediction")
					.attr("data-toggle", "tooltip")
					.attr("data-placement", "bottom")
					.attr("title", "Prédiction avec pause de "+MIN_BREAK_TIME_MIN+" min.");
			}

			newPoint.appendTo(timeline.elem);

			if (pos > 5) {
				newPoint.css("margin-left", (-newPoint.width())+"px");
			}
			if (idxTimeInput != firstIdxTimeInput && idxTimeInput != lastIdxTimeInput) {
				newPoint.find('.label-time').css("left", ((idxTimeInput%2 == 0 ? -1 : 1) * newPoint.width()) + "px");
			}
		},
		addPrediction: function(pos, text, idxTimeInput) {
			timeline.points.add(pos, text, idxTimeInput, true);
		},

		compute: function() {
			var lastIdxTimeInput = parseInt($('.hour[idxTimeInput]:last').attr("idxTimeInput"));
			$('.hour[idxTimeInput]').each(function(){
				if ($(this).val().length == 5) {
					
					if ($(this).is("[idxTimeInput=1]")) {
						timeline.elem.addClass("set");
					} 

					var timeCurrent = getTimeForValue($(this).val());
					var xPos = (timeCurrent - timeline.getTimeReference()) / timeline.getWidth() * 100;
					var textLabelTime = $(this).val();

					timeline.points.add(Math.min(100, xPos), textLabelTime, $(this).attr("idxTimeInput")); 
				}
			});

			var nbOfPoints = timeline.elem.find('.point').length;
			if (nbOfPoints > 0 && nbOfPoints < 3) {
				var minEndingTime = getTimeForValue($('.hour[idxTimeInput=1]').val()) + getHoraireTime() + MIN_BREAK_TIME_MIN;
				timeline.points.addPrediction(100, minsToTime(minEndingTime), lastIdxTimeInput);
			}
		},
		getWidthInPercent: function() {
			return $('#timeline .point').first().width() / $('#timeline.set').width() * 100;
		}
	},
	// ------------------------------------
	progressions : {
		add : function(xStart, width, extraClasses = null) {
			let newProgression = timeline.progressionElem.clone();

			if (extraClasses != null) {
				newProgression.addClass(extraClasses);
				if (extraClasses == "break") {
					newProgression.removeClass("progress-bar-animated")
						.attr("title", "Pause");
				}
			} else {
				if (getCurrentTime() >= getExpectedEndTime()) {
					newProgression.addClass("bg-success");
				}
			}

			if (xStart > 0) {
				xStart -= timeline.points.getWidthInPercent();
				width += timeline.points.getWidthInPercent();
			}

			if (getCurrentTime() > END_WORKING_HOUR*60) {
				newProgression.removeClass("progress-bar-animated");
			}

			newProgression.css({ width: Math.min(100, width)+"%", left: Math.max(0, xStart)+"%" });
			newProgression.appendTo(timeline.elem);
		},
		addBreak: function(xFrom, xTo) {
			var width = xTo - xFrom;
			timeline.progressions.add(xFrom, width, "break");
		}, 
		compute: function() {
			var lastIdxTimeInput = parseInt($('.hour[idxTimeInput]:last').attr("idxTimeInput"));

			// Heure actuelle
			let width = ( getCurrentTime() - timeline.getTimeReference() ) / timeline.getWidth() * 100;
			if (width >= timeline.points.getWidthInPercent()) {
				timeline.progressions.add(0, width);
			}

			// Pauses
			for(var i = 2; i < lastIdxTimeInput; i += 2) {
				if ($('.hour[idxTimeInput="'+i+'"]').val().length == 5 && $('.hour[idxTimeInput="'+(i+1)+'"]').val().length == 5) {
					var timeEnd = getTimeForValue($('.hour[idxTimeInput="'+i+'"]').val());
					var timeRestart = getTimeForValue($('.hour[idxTimeInput="'+(i+1)+'"]').val());
					var xPosEnd = (timeEnd - timeline.getTimeReference()) / timeline.getWidth() * 100;
					var xPosRestart = (timeRestart - timeline.getTimeReference()) / timeline.getWidth() * 100; 
					
					timeline.progressions.addBreak(xPosEnd, xPosRestart);
				}
			}
		}
	}

};


// Helpers
function getTimeForInput(inputId) {
	var timeValue = getTimeForValue($('#'+inputId).val());
	return inputId == 'previousOvertime' || inputId == 'currentOvertime' ? getSignPreviousOvertime() * timeValue : timeValue;
}

function getTimeForValue(value) {
	if(value == null || value.indexOf(":") == -1 || value.length != 5) {
		return 0;
	}
	var values = value.split(":");
	return parseInt(values[0]) * 60 + parseInt(values[1]);
}

function getBreakTime() {
	return getTimeForInput("arr2") - getTimeForInput("dep1");
}

function getHoraireTime() {
	return getTimeForValue(localStorage.getItem("dailyWorkTime") || "08:36");
}

function getCurrentTime() {
	var currentDate = new Date();
	return getTimeForValue(format(parseInt(currentDate.getHours()))+":"+format(parseInt(currentDate.getMinutes())));
}

function getExpectedEndTime() {
	return getTimeForInput("arr2") + (getHoraireTime() - getGroupTotalTime(1));
}

function getTotalTimeWorked() {
	var timeWorked = 0;
	var lastIdxTimeInput = parseInt($('.hour[idxTimeInput]:last').attr("idxTimeInput"));
	for(var i = 1; i < lastIdxTimeInput; i += 2) {
		if ($('.hour[idxTimeInput="'+i+'"]').val().length == 5 && $('.hour[idxTimeInput="'+(i+1)+'"]').val().length == 5) {
			var interval = getTimeForValue($('.hour[idxTimeInput="'+(i+1)+'"]').val()) - getTimeForValue($('.hour[idxTimeInput="'+i+'"]').val());
			// console.log("["+(i+1)+"-"+i+"]", interval);
			timeWorked += interval;
		}
	}
	//console.log("total", timeWorked);
	return timeWorked;
}

function getGroupTotalTime(groupId) {
	return getTimeForInput("dep"+groupId) - getTimeForInput("arr"+groupId);
}

function isFilled(group) {
	return $('#'+group).val().length == 5;
}

function format(num) {
	return num < 10 ? "0"+num : num;
}

function minsToTime(mins, canBeNegative = false) {
	var h = Math.trunc(mins / 60);
	var m = Math.round(((mins / 60) - h) * 60);
	if(canBeNegative) {
		h = Math.abs(h);
		m = Math.abs(m);
	} else {
		if(h < 0 || m < 0) return "Erreur";
	}
	return format(h)+":"+format(m);
}

function secondsToTime(seconds, canBeNegative) {
	var h = Math.trunc(seconds / 3600);
	var m = Math.trunc( (seconds - (h * 3600)) / 60 );
	var s = seconds - (h*3600) - (m*60); 
	if(canBeNegative) {
		h = Math.abs(h);
		m = Math.abs(m);
		s = Math.abs(s);
	} else {
		if(h < 0 || m < 0 || s < 0) return "Erreur";
	}
	return format(h)+":"+format(m)+":"+format(s);
}

function getSignPreviousOvertime() {
	return localStorage.getItem('signOvertimeNegative') == "1" ? -1 : 1;
}
