$(function(){
    if (localStorage.getItem("isGM")) {
        $('.timbrer').removeClass("d-none").on('click', () => {
            var bootboxTimbrer = bootbox.confirm({
                title: '<b class="text-dark">Confirmer le timbrage</b>',
                message: '<div class="text-center">Le timbrage sera ajouté sur PeopleSoft.<div class="actual-time mt-2 font-weight-bold lead text-dark"></div></div>',
                buttons: {
                    cancel: {
                        label: 'Annuler'
                    },
                    confirm: {
                        label: '<i class="material-icons mr-1" style="vertical-align:text-bottom">alarm_add</i> Timbrer',
                        className: 'btn-success'
                    }
                },
                callback: function (result) {
                    if (!result) {
                        return;
                    }

                    const url = 'https://mynet.groupemutuel.ch/plugins/PeopleSoftGroupeMutuelModule/jsp/peoplesoft/timbreuseVirtuelle/timbreuseVirtuelleModale.jsp';
                    bootbox.alert('<iframe id="frame-timbrage" src="'+url+'" style="width:100%; height:170px; border:none;"></iframe>');
                    $('#frame-timbrage').on('load', function() {
                        const timeTimbrage = moment().format('HH:mm');

                        function getFirstEmptyTimeInputId() {
                            var firstId = null;
                            $('input[idxtimeinput]').each(function(){
                                if (firstId == null && $(this).val() == "") {
                                    firstId = $(this).attr("id");  
                                }
                            });  
                            return firstId; 
                        }

                        var firstEmptyTimeInputId = getFirstEmptyTimeInputId();
                        if (firstEmptyTimeInputId != null) {
                            console.log("Timbrage ajouté", timeTimbrage);
                            $('#'+firstEmptyTimeInputId).val(timeTimbrage).trigger("keyup");
                        }
                    });
                }
            });
            bootboxTimbrer.init(function(){
                displayCurrentTime();
                setInterval(displayCurrentTime, 600);
            });
        });

        function displayCurrentTime() {
            $('.actual-time').html(moment().format('HH:mm:ss'));
        } 
    }
});