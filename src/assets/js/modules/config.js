/* 
 * Page Configuration -----------------------------------------------------
 */
$(function(){

	// Gestion de la version -----------------------------------
	$.get('version', (version) => {
		const VERSION = version;

		if (localStorage.getItem("appUpdated") == VERSION) {
			showToastUpdate("done");
			localStorage.removeItem("appUpdated");
		}

		if (localStorage.getItem("version")) {
			if (VERSION != localStorage.getItem("version")) {

				bootbox.dialog({ 
				    message: '<div class="text-center"><img src="src/assets/img/loader-info.svg" width="24px"> Mise à jour...</div>', 
				    closeButton: false 
				});

				caches.keys().then( keyList => keyList.map(key => caches.delete(key)));
				localStorage.setItem("version", VERSION);
				localStorage.setItem("appUpdated", VERSION);

				setTimeout(function(){
					document.location = '';
				}, 500);
			}
		} else {
			localStorage.setItem("version", VERSION);
		}

		$('#version').html(localStorage.getItem("version"));
	});
	// ---------------------------------------------------------


	// --- Config - Preferences
	$('.settings .btn-toggle[default-value]')
	// Enregistre dans le stockage local les paramètres par défaut 
	// Update l'affichage des paramètres selon les valeurs enregistrées dans le stockage local 
	.each(function(){
		if(!localStorage.getItem($(this).attr("id"))) {
			localStorage.setItem($(this).attr("id"), $(this).attr("default-value"));
		} 
		if(localStorage.getItem($(this).attr("id")) == "true") {
			$(this).addClass("active");
		}
	})
	// Enregistre la valeur du paramètre dans le stockage local
	.click(function(){
		var isEnabled = !$(this).is(".active");
		localStorage.setItem($(this).attr("id"), isEnabled);
		startTimerTimelapse();
	});

	$('.settings .item').click(function(e){
		if (!$(e.target).is(".btn-toggle")) {
			$(this).find(".btn-toggle").trigger("click");
		}
	});

	// --- Config - Data cached
	$('#emptyCookies').click(function(){
		$('#emptyCookies .loader').show();
		bootbox.confirm("Les fichiers en cache et toutes les valeurs enregistrées seront effacées.", function(result){
			if (result) {
				api.delete('users/'+localStorage.getItem("coupling-code"),
					function() {
		  				caches.keys().then( keyList => keyList.map(key => caches.delete(key)));
		  				localStorage.clear();
		  				document.location = '';
		  			});
			} else {
				$('#emptyCookies .loader').hide();
			}
		});
	});

	// --- Config - Device coupling 
	if(!localStorage.getItem("coupling-code")) {
		localStorage.setItem("coupling-code", Math.random().toString(36).substring(4, 15));
	}
	$("input.coupling-code").val(localStorage.getItem("coupling-code"));
	$("div.coupling-code").html(localStorage.getItem("coupling-code"));
	
	$('#renew-coupling-code').click(function(){
		localStorage.setItem("coupling-code", Math.random().toString(36).substring(4, 15));
		$("input.coupling-code").val(localStorage.getItem("coupling-code"));
		$("div.coupling-code").html(localStorage.getItem("coupling-code"));
	});

	// -- Config - Username
	if(localStorage.getItem("username")) {
		$('#config-username').addClass("d-flex").show();
		$('div.username').html(localStorage.getItem("username"));
	}
	
});

function showToastUpdate(context) {
    var idLink = (context == "sw") ? "update-sw" : "delete-cache";
    var content = '<div class="d-flex"><div class="mr-2">Nouvelle version disponible.</div> <a href="#" id="'+idLink+'" class="font-weight-bold">Mettre à jour</a></div>';
    var toastOptions = {autohide:false};

    if (context == "done") {
    	content = '<div class="d-flex"><div><i class="material-icons mr-2 text-success" style="vertical-align: bottom;">check_circle_outline</i>Mise à jour installée: <b>Version '+localStorage.getItem("version")+'</b></div></div>';
    	toastOptions = {delay:10000};
    }

    $('.toast .toast-header').hide();
    $('.toast-body').html(content);
    $('.toast').toast(toastOptions);
    $('.toast').toast("show");
}


