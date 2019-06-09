/* 
 * Page Holiday Planner -----------------------------------------------------
 */
var picker = new Lightpick({
    field: document.getElementById('datepicker1'),
    singleDate: false,
    lang: 'fr',
    format: 'DD.MM.YYYY',
    numberOfMonths: 2,
    autoclose: false,
    minDate: new Date(),
    parentEl: '#containerCalendar',
    hideOnBodyClick: false,
    // minDays: 3,
	// maxDays: 7,
	// inline: true,
	disableDates: publicHolidays,
	hoveringTooltip: true,
	disableWeekends: true, 
    onSelect: function(start, end) {
    	if(start != null) {
    		localStorage.setItem("startHoliday", start.format("YYYY-MM-DD"));
    	}
    	if(end != null) {
    		localStorage.setItem("endHoliday", end.format("YYYY-MM-DD"));
    	}

    	if(start == null || end == null || end.isBefore(start)) {
    		$('#text-selection').hide();
    		$(popoversObjects).popover("hide");
    		return;
    	}

    	function getSelectedDaysCounters(start, end) {
    		let counterDays = { weekdays:0, weekenddays:0, publicHolidays:0 };  
			while (start <= end) {
				if(start.isoWeekday() < 6){
					counterDays.weekdays++;
				} else {
					counterDays.weekenddays++;
				}
				if(publicHolidays.includes(start.format('YYYY-MM-DD'))) {
					counterDays.publicHolidays++;
				}
				start = moment(start, 'YYYY-MM-DD').add(1, 'days'); 
			}
			return counterDays;
    	}

    	let counterDays = getSelectedDaysCounters(start, end);
    	let realTimeToTakeOnVacation = counterDays.weekdays - counterDays.publicHolidays;
    	let totalTimeInVacation = end.diff(start, 'days') + 1;

    	if($('#soldeVacances').val().length <= 0) {
    		$('#soldeVacances').attr("data-content", "Renseigner cette valeur").popover("show");
    		$('#text-selection').hide();
    		return;
    	}

        $('.startDateHoliday').html(start.format('D MMMM YYYY'));
        $('.endDateHoliday').html(end.format('D MMMM YYYY'));

        $('.daysToTakeOnBalance').html(realTimeToTakeOnVacation);
        $('.daysReallyInHolidays').html(totalTimeInVacation);

        if(Math.trunc(totalTimeInVacation / 7) > 0) {
        	$('.daysReallyInHolidays').attr("data-content", fromDaysToWeeksAndDays(totalTimeInVacation)).popover("show");
    	} else {
    		$('.daysReallyInHolidays').popover("hide");
    	}

        $('.diffDaysVacation .number').html(totalTimeInVacation - realTimeToTakeOnVacation);
    	$('.diffDaysVacation').toggle(parseInt($('.diffDaysVacation .number').text()) > 0);


    	$('#text-selection').css("margin-top", $('section.lightpick').outerHeight()+20+"px");    	
    	$('#text-selection').show();

    	$('.searchFlight').show();

    	if($('#soldeVacances').val().length >= 1) {
    		$('#soldeVacancesAvant').val(parseFloat($('#soldeVacances').val())+"j").attr("data-content", fromDaysToWeeksAndDays(parseFloat($('#soldeVacances').val()), 5)).popover("show");

    		var soldeVacancesRestant = parseFloat($('#soldeVacances').val()) + parseFloat($('#soldeHoraire').val()) - parseFloat(realTimeToTakeOnVacation+0.0);
    		$('#soldeVacancesRestant').val(soldeVacancesRestant+"j").attr("data-content", fromDaysToWeeksAndDays(soldeVacancesRestant, 5)).popover("show");
    		formatInputBg("#soldeVacancesRestant", soldeVacancesRestant);

    		var daysTakenOnSoldeHoraire = parseFloat($('#soldeHoraire').val());
    		if(realTimeToTakeOnVacation < daysTakenOnSoldeHoraire) {
    			daysTakenOnSoldeHoraire = realTimeToTakeOnVacation;
    		}
    		daysTakenOnSoldeHoraire = Math.abs(daysTakenOnSoldeHoraire);

    		var daysTakenOnSoldeVacances = realTimeToTakeOnVacation - daysTakenOnSoldeHoraire;
    		if(realTimeToTakeOnVacation < daysTakenOnSoldeHoraire) {
    			daysTakenOnSoldeVacances = 0;
    		}
    		daysTakenOnSoldeVacances = Math.abs(daysTakenOnSoldeVacances);

    		$('#soldeHoraireConsumed').val(daysTakenOnSoldeHoraire+"j");
    		$('#soldeVacancesConsumed').val(daysTakenOnSoldeVacances+"j").attr("data-content", fromDaysToWeeksAndDays(daysTakenOnSoldeVacances, 5)).popover("show");
    		
    		var soldeHoraireRestantTime = getTimeForValue($('#currentOvertime').val()) - daysTakenOnSoldeHoraire*getHoraireTime();
    		$('#soldeHoraireRestant').val((soldeHoraireRestantTime < 0 ? '-' : '') + minsToTime(Math.abs(soldeHoraireRestantTime)));
    		formatInputBg('#soldeHoraireRestant', soldeHoraireRestantTime);
    	} else {
    		$('#soldeVacances, .daysToTakeOnBalance').popover("hide");
    	}
    },
    onRenderCalendar: function() {
    	$('#text-selection').css("margin-top", $('section.lightpick').outerHeight()+20+"px");
    	$(popoversObjects).popover("update");
    }
});

var popoversObjects = '#soldeVacances, .daysReallyInHolidays, #soldeVacancesAvant, #soldeVacancesConsumed, #soldeVacancesRestant';

$(function(){
	moment.locale("fr-ch");

	var cleaveSoldeHoraireHP = new Cleave('#soldeHoraire', {
		delimiters: ['.'],
		blocks: [1,1],
		numericOnly: true
	});
	var cleaveSoldeVacancesHP = new Cleave('#soldeVacances', {
		numeral: true,
	    numeralDecimalMark: ['.'],
	    numeralPositiveOnly: true
	});

	$(popoversObjects).popover({
		trigger:"manual",
		html:true,
		container:".page[data-id=holidayPlan]",
		template:'<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-body p0"></div></div>',
		sanitize: false
	});

	if(localStorage.getItem("soldeVacances") != null) {
		$('#soldeVacances').val(localStorage.getItem("soldeVacances"));	
	}

	$('#soldeHoraire, #soldeVacances').keyup(function(){
		if($(this).val().length > 0) {
			var floatVal = parseFloat($(this).val());
			if( (floatVal - Math.trunc(floatVal)) % 0.5 > 0) {
				$(this).val(roundToHalf(floatVal));
			}
			picker.onSelect();
		}
	});
	$('#soldeVacances').on('keyup', function(){
		if(parseFloat($(this).val()) > 99) {
			$(this).val(99);
		} 
		
		if($(this).val().length == 0 ) {
			$('#soldeVacances').popover("hide");
		} else {
			$('#soldeVacancesAvant').val(parseFloat($(this).val())+"j");

			var content = "";
			if(parseFloat($(this).val()) >= 5) {
				content = fromDaysToWeeksAndDays(parseFloat($(this).val()),5);
			}
			$('#soldeVacances').attr("data-content", content).popover("show");
		}
	}).on('focusin', function(){
		$('#soldeVacances').trigger("keyup").popover("show");
	}).on('focusout', function(){
		$('#soldeVacances').popover("hide");
	});

	$('.searchFlight').click(function(){
		$('#bt-flight-content').toggle();
		$('#flight-origin').focus();
		$(popoversObjects).popover("update");
	});

	$('#flight-origin, #flight-dest').keyup(function(){
		if($(this).val().length > 1) {
			// https://docs.kiwi.com/#flights-flights-get
			$.get('https://api.skypicker.com/locations?term='+$(this).val(), null, function(json) {
				var locations = json.locations;
				var options = '';
				if(locations != null && locations.length > 0) {
					for(var loc of locations) {
						console.log(loc.name, loc.code);
						options += '<option value="'+loc.code+'">'+loc.name+'</option>';
					}
				}
				$('datalist#location').html(options);
			}); 
		}
	});

	$('#flight-search').submit(function(){
		var origin = $('#flight-origin').val();
		var dest = $('#flight-dest').val();
		window.open('https://www.momondo.ch/flight-search/'+origin+'-'+dest+'/'+localStorage.getItem("startHoliday")+'/'+localStorage.getItem("endHoliday")+'?sort=happinessScore_b');
		return false;
	});

});

function loadHolidayCalendar() {
	$('.navbar').removeClass("mb-5").addClass("mb-3");
	$('#soldeHoraire').val(getUsableOvertime());
	//$('#soldeVacances').trigger("keyup");

	var horaireAvantHourPart =  getTimeForValue($('#currentOvertime').val()) - (getUsableOvertime()*getHoraireTime()) ;
	if(horaireAvantHourPart > 0) {
		horaireAvantHourPart = "+ "+minsToTime(horaireAvantHourPart);
	} else {
		horaireAvantHourPart = '';
	}
	$('#soldeHoraireAvant').val(getUsableOvertime()+"j "+horaireAvantHourPart);
	
	if(localStorage.getItem("startHoliday") != null && localStorage.getItem("endHoliday") != null) {
		var invalidRange = parseInt(localStorage.getItem("startHoliday").replace(/-/g, "")) > parseInt(localStorage.getItem("endHoliday").replace(/-/g, ""));
		if(!invalidRange) {
			var start = moment(localStorage.getItem("startHoliday"), "YYYY-MM-DD");
			var end = moment(localStorage.getItem("endHoliday"), "YYYY-MM-DD");
			picker.setDateRange(start, end);

			$('.searchFlight').show();
		}
	}

	picker.show();
	setTimeout(function(){
		picker.resetPosition();
		picker.onSelect();
	}, 50);
}

function getUsableOvertime() {
	if (getHoraireTime() <= 0 || localStorage.getItem("signOvertimeNegative") == 1) 
		return 0;

	return roundToHalf( getTimeForValue($('#currentOvertime').val()) / getHoraireTime() );
}

function roundToHalf(daysFloat) {
	var daysWithHalfs = daysFloat;
	var intPart = Math.trunc(daysFloat);
	var floatPart = daysWithHalfs - intPart;
	daysWithHalfs = intPart;
	if(floatPart >= 0.5) {
		daysWithHalfs += 0.5;
	} else {
		daysWithHalfs = daysWithHalfs.toString()+".0";
	}
	return daysWithHalfs;
}

function fromDaysToWeeksAndDays(timeInDays, daysByWeek = 7) {
	var timeInWeeks = Math.trunc(timeInDays / daysByWeek);
	var remainingDays = timeInDays - (timeInWeeks * daysByWeek);

	var text = '';
	if(timeInWeeks > 0) {
		text += timeInWeeks+" sem.";
	}
	if(remainingDays > 0) {
		if(timeInWeeks > 0) {
			text += " et ";
		}
		text += remainingDays+" jours";
	}
	return text;
}

function formatInputBg(inputId, value) {
	$(inputId).toggleClass("bg-danger", value < 0).toggleClass("bg-success", value >= 0); 
}
