/* 
 * Page Configuration -----------------------------------------------------
 */
$(function(){

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
		$(this).html("En cours...")
		localStorage.clear();
		document.location = '';
	});

	// --- Config - Device coupling 
	if(!localStorage.getItem("coupling-code")) {
		localStorage.setItem("coupling-code", Math.random().toString(36).substring(4, 15));
	}
	$("#coupling-code").val(localStorage.getItem("coupling-code"));
	
	$('#renew-coupling-code').click(function(){
		localStorage.setItem("coupling-code", Math.random().toString(36).substring(4, 15));
		$("#coupling-code").val(localStorage.getItem("coupling-code"));
	});

	
});


