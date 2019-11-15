$(function(){
    const profilToFetchFrom = localStorage.getItem(localStorage.getItem("coupling-code-following") ? "coupling-code-following" : "coupling-code"); 

    $('body').on('click', '#page-picker .dropdown-item[data-id="timesheet"]', function(){
        loadTimesheet();
    });

    const loadTimesheet = () => {
        api.get('user-time/'+profilToFetchFrom+"/avg-time", (json) => {
            var body = "";
            for (var i = 0; i < json.length; i++) {
                var item = json[i];
                body += '<tr>'+
                    '<td>'+getLabelForInput(item.type1, item.type2)+'</td>'+
                    '<td class="text-center">'+item.samples+'</td>'+
                    '<td class="text-center">'+minsToTime(item.average)+'</td>'+
                '</tr>';
            }
            if (body.length > 0) {
                $('.dropdown-item[data-id="timesheet"]').removeClass("d-none");
                $('.page[data-id="timesheet"] #stats').show().find('table#avg-values tbody').html(body);
            } 
        }, () => {});

        api.get('user-time/'+profilToFetchFrom+"?date="+moment().add(-1, "days").format("YYYY-MM-DD"), (json) => {
            var body = "";
            for (var i = 0; i < json.length; i++) {
                var item = json[i];
                body += '<tr>'+
                    '<td>'+getLabelForInput(item.type1, item.type2)+'</td>'+
                    '<td class="text-center">'+item.value+'</td>'+
                '</tr>';
            }
            if (body.length > 0) {
                $('.dropdown-item[data-id="timesheet"]').removeClass("d-none");
                $('.page[data-id="timesheet"] #timbrages').show().find('table#yesterday tbody').html(body);
            } 
        }, () => {});
    };
    loadTimesheet();
});