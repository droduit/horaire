$(function(){
	// Permet de servir les fichiers depuis le cache lors d'un appel ajax ($.get, $.post, $.getScript, ...)
	$.ajaxSetup({
	  cache: true
	});

	$('.localStorage').keyup(function(){
		if($(this).is('[data-min-length-localStorage]') && $(this).val().length >= parseInt($(this).attr("data-min-length-localStorage"))) {
			localStorage.setItem($(this).attr("id"), $(this).val());
		}
	}).each(function(){
		if(localStorage.getItem($(this).attr("id")) != null) {
			$(this).val(localStorage.getItem($(this).attr("id")));
		}
	});

	/**
	 * Gestion globale de la navigation par ancrages
	 */	
	$('body').on('click', '#page-picker .dropdown-item', function(){
		$('.dropdown-item.active').removeClass("active");
		$(this).addClass("active");
		$(this).closest('.dropdown').find('.dropdown-toggle').html($(this).text());
		nav.switchPage($(this).data("id"), "#"+$(this).data("id"), window.history.state);
	});

	$('#config').click(function(){
		nav.switchPage("config", "#config", {previousPage: "Home", currentPage:"Configuration"}, "btn-back-navbar");
	});

	$('.page[data-id="config"] #pills-tab a').click(function(){
		let state = {previousPage: "Configuration", currentPage:$(this).find("span").text()};
		nav.switchPage($(this).attr("href").replace("#", ""), $(this).attr("href"), state, "btn-back-navbar");
	});

	$('.previous-page').click(function(){
		window.history.go(-1);
	});

	if(document.location.hash.length > 1) {
		nav.loadPageFromHistory();
	} 

	/**
	 * IP detection - custom behaviors
	 */	
	if(!localStorage.getItem("ip")) {
		$.getJSON('https://api.ipify.org?format=jsonp&callback=?', function(data) {
			if(data.ip == "195.65.93.18") {
				localStorage.setItem("isGM", true);
				gm.triggerActions("call1");
			}
			localStorage.setItem("ip", data.ip);
		});
	} else {
		gm.triggerActions("call2");
	}
});

window.onpopstate = function(event) {
	nav.loadPageFromHistory();
};

const nav = {
	switchPage: function(idPage, pageToLoad, state, idNavToDisplay = "main-navbar", addStateInHistory = true) {
		idPage = idPage || "horaire";

		if(idPage == "holidayPlan") {
			loadHolidayCalendar();
		}

		$('.page').hide();
		$('.page[data-id="'+idPage+'"]').show();

		$('.navbar div[class^="buttons-"]').hide();
		$('.navbar .buttons-'+idPage).show();
		
		if(addStateInHistory) {
			if(pageToLoad != document.location.hash) {
				window.history.pushState(state, "", pageToLoad);
			}
		}
		nav.switchNav(idNavToDisplay, state);
		$('.popover:visible').popover("update");
	},
	switchNav: function(idNavToDisplay, state = null) {
		var navBar = $('.navbar#'+idNavToDisplay);
		if(state != null) {
			if("currentPage" in state && navBar.find('.title').length > 0) {
				navBar.find('.title').html(state.currentPage);
			}
			if("previousPage" in state && navBar.find('.previous-page .name').length > 0) {
				navBar.find('.previous-page .name').html(state.previousPage);
			}
		}
		$('.navbar').css("display", "none");
		navBar.css("display", "");
	},
	loadPageFromHistory: function() {
		var hash = document.location.hash;
		var pageId;
		if(hash.length > 1) {
			pageId = hash.replace("#", "");
			var idNavToDisplay = pageId.indexOf("config") > -1 ? "btn-back-navbar" : "main-navbar";
			nav.switchPage(pageId, hash, window.history.state, idNavToDisplay, false);
		} else {
			pageId = "horaire";
			nav.switchPage(pageId, "", window.history.state, "main-navbar", false);
		}

		if($('.dropdown-menu .dropdown-item[data-id="'+pageId+'"]').length > 0) {
			$('.dropdown-menu .dropdown-item').removeClass("active");
			$('.dropdown-menu .dropdown-item[data-id="'+pageId+'"]').addClass("active");
		}
	}
};

const gm = {
	triggerActions : function(context) {
		if(!localStorage.getItem("isGM")) {
			return;
		}
		if($('#page-picker .dropdown-item.gm').length <= 0) {
			gm.addMenuItems();
			gm.loadModules();
			gm.disableNotifications();
		}
	},
	addMenuItems: function() { 
		$('#page-picker .dropdown-menu').append('<button class="dropdown-item gm" data-id="prdptools" type="button" aria-label="Création d\'un fichier de connexion automatique">PeopleSoft - Connexion sans login</button>');
	},
	loadModules: function() {
		$('.module-area').append('<div class="page gm" data-id="prdptools"></div>');
		$.getScript( "src/prdptools/aes.js" ).done(function( script, textStatus ) {
			$.get('src/prdptools/index.php', null, function(html) {
				$('.page[data-id="prdptools"]').html(html);
			});
		});
	},
	disableNotifications: function() {
		var isFirefox = typeof InstallTrigger !== 'undefined';
		if(isFirefox) {
			return;
		}
		$('#enable_notifications')
			.addClass("disabled gm").removeClass("active")
			.before(
				'<i class="material-icons text-danger warning" data-toggle="popover" '+
				'title="Désactivé par le GM avec ce navigateur" data-content="<small>Le firewall du GM bloque les requêtes du service Google Cloud Messaging utilisé par l\'API webpush (Se voit en vérifiant le Connection State à l\'adresse chrome://gcm-internals/). Il faut alors utiliser <a href=\'https://www.mozilla.org/fr/firefox/new/\' target=\'_blank\'>Firefox</a> pour profiter de cette fonctionnalité (puisque les navigateurs utilisent des services de cloud messaging différents, et celui de Firefox n\'est pas bloqué).</small>" '+
				'data-trigger="hover" data-placement="bottom" data-container=".page[data-id=config-preferences]" '+
				'data-html="true">warning</i>')
			.closest('.item')
			.removeClass("active").addClass("disabled definitive-disabled");
		$('.warning').popover("show");
		$('#'+$(".warning").attr("aria-describedby")).css({maxWidth:"320px", zIndex:"9"});
	}
};