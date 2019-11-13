/* 
 * Page Configuration -----------------------------------------------------
 */
$(function(){

	// Gestion de la version -----------------------------------
	const updateApp = (withFeedback = false) => {

		if (withFeedback) {
			bootbox.dialog({ 
			    message: '<div class="text-center"><img src="src/assets/img/loader-info.svg" width="24px"> Recherche d\'une version plus récente...</div>', 
			    closeButton: false 
			});
		}

		fetch("version", {cache: "no-cache"})
		.then(response => response.text())
		.then(version => {

			if (localStorage.getItem("appUpdated") == version) {
				showToastUpdate("done");
				localStorage.removeItem("appUpdated");
			}

			if (localStorage.getItem("version")) {
				if (version != localStorage.getItem("version")) {
					bootbox.hideAll();

					bootbox.dialog({ 
					    message: '<div class="text-center"><img src="src/assets/img/loader-info.svg" width="24px"> Mise à jour...</div>', 
					    closeButton: false 
					});

					caches.keys().then( keyList => keyList.map(key => caches.delete(key)));
					localStorage.setItem("version", version);
					localStorage.setItem("appUpdated", version);

					setTimeout(function(){
						document.location = '';
					}, 500);
				} else {
					if (withFeedback) {
						setTimeout(() => {
							bootbox.hideAll();
							bootbox.dialog({ 
							    message: '<div class="text-center"><i class="material-icons mr-1 text-success" style="vertical-align:bottom">check</i> Votre version est à jour.</div>'
							});
						}, 700);
					}
				}
			} else {
				localStorage.setItem("version", version);
			}

			$('#version span').html(localStorage.getItem("version"));
		});

	};
	updateApp();

	$('.update-version').click(_ => updateApp(true));
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

		switch ($(this).attr("id")) {
			case "display_timelapse":
				startTimerTimelapse();
				break;
			case "display_timeline":
				timeline.create();
				break;
			default:
				break;
		}
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
				api.delete('users/'+localStorage.getItem("coupling-code"), () => {
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
		localStorage.setItem("coupling-code", random.getString(10));
	}
	$("input.coupling-code").val(localStorage.getItem("coupling-code"));
	$("div.coupling-code").html(localStorage.getItem("coupling-code"));
	
	$('#renew-coupling-code').click(() => {
		$("input.coupling-code, #renew-coupling-code").attr("disabled", "disabled");
		const newCouplingCode = random.getString(10);
		api.put('users/'+localStorage.getItem("coupling-code"), {couplingCode : newCouplingCode}, () => {
			localStorage.setItem("coupling-code", newCouplingCode);
			$("input.coupling-code").val(localStorage.getItem("coupling-code"));
			$("div.coupling-code").html(localStorage.getItem("coupling-code"));
			$("input.coupling-code, #renew-coupling-code").removeAttr("disabled");
		}, () => {
			$("input.coupling-code, #renew-coupling-code").removeAttr("disabled");
			bootbox.alert("Echec de la mise à jour. Rééssayer");
		});
	});
	$('form#user-coupling').submit(() => {
		if ($('#user-coupling-code').val().length > 0) {
			if ($('#save-coupling').length > 0) {
				if ($('#user-coupling-code').val().length == 10) {
					if ($('#user-coupling-code').val() != localStorage.getItem("coupling-code")) { 
						api.get('users/'+$('#user-coupling-code').val(), () => {
							localStorage.setItem("coupling-code-following", $('#user-coupling-code').val());
							$('#user-coupling-code').val("");
							showToastUpdate("coupling-done");
							showCouplingParams();
							fetchCoupledProfil();
						}, () => {
							bootbox.alert("Le code entré ne correspond à aucun profil existant.");
						});
					} else {
						bootbox.alert("Le code entré correspond au profil actuel.");
					}
				} else {
					bootbox.alert("Le code entré est incorrect");
				}
			} else {
				localStorage.removeItem("coupling-code-following");
				showCouplingParams();
				fetchCoupledProfil();
			}
		}
		return false;
	});

	const showCouplingParams = () => {
		if (localStorage.getItem("coupling-code-following")) {
			$('#info-coupling').addClass("d-flex");
			$('#save-coupling').attr("id", "cancel-coupling").removeClass("btn-primary").addClass("btn-danger").html("Interrompre");
			$('.coupling-code-user').html(localStorage.getItem("coupling-code-following"));
			$('#user-coupling-code').val(localStorage.getItem("coupling-code-following")).attr("disabled", "disabled");
		} else {
			$('#info-coupling').removeClass("d-flex");
			$('#user-coupling-code').val("").removeAttr("disabled");
			$('#cancel-coupling').attr("id", "save-coupling").removeClass("btn-danger").addClass("btn-primary").html("Coupler");
		}
	};
	showCouplingParams();

	var timerFetchCoupledProfil = false;

	const fetchCoupledProfil = () => {
		if (localStorage.getItem("coupling-code-following")) {
			const fetchData = () => {
				api.get('user-time/'+localStorage.getItem("coupling-code-following"), json => {
					for (var i = 0; i < json.length; ++i) {
						$('input.'+json[i].type1+"[idxTimeInput='"+json[i].type2+"']").val(json[i].value).trigger("keyup");
					}
				});
			};
			fetchData();
			timerFetchCoupledProfil = setInterval(fetchData, 5000);
		} else {
			clearInterval(timerFetchCoupledProfil);
			timerFetchCoupledProfil = false;
		}
	};
	fetchCoupledProfil();

	// -- Config - Username
	if(localStorage.getItem("username")) {
		$('#config-username').addClass("d-flex").show();
		$('div.username').html(localStorage.getItem("username"));
	}
	
});

const showToastUpdate = (context) => {
    var idLink = (context == "sw") ? "update-sw" : "delete-cache";
    var content = '<div class="d-flex"><div class="mr-2">Nouvelle version disponible.</div> <a href="#" id="'+idLink+'" class="font-weight-bold">Mettre à jour</a></div>';
    var toastOptions = {autohide:false};

    if (context == "done") {
    	content = '<div class="d-flex"><div><i class="material-icons mr-2 text-success" style="vertical-align: bottom;">check_circle_outline</i>Mise à jour installée: <b>Version '+localStorage.getItem("version")+'</b></div></div>';
    	toastOptions = {delay:10000};
	} else if (context == "coupling-done") {
		content = '<div class="d-flex"><div><i class="material-icons mr-2 text-success" style="vertical-align: bottom;">check_circle_outline</i>Couplé avec le profil <b>'+localStorage.getItem("coupling-code-following")+'</b></div></div>';
	}

    $('.toast .toast-header').hide();
    $('.toast-body').html(content);
    $('.toast').toast(toastOptions);
    $('.toast').toast("show");
}


