/* 
 * Page Conversion de temps  ----------------------------------------------------------
 */
var cleaveCdDays = new Cleave('#cdDays', {numeral:true, numeralThousandsGroupStyle: 'thousand', delimiter:"'", numericOnly:true});
$('#cdDays').keyup(function(){
	if($(this).val().length > 0) {
		$(this).closest(".page").find("#cdHours").val(minsToTime(parseFloat($('#cdDays').val().replace("'", '')) * getHoraireTime()));
	}
}).val("1").trigger("keyup");

var cleaveCdHours = new Cleave('#cdHours', timePattern);
$('#cdHours').keyup(function(){
	if($(this).val().length > 0) {
		$(this).closest(".page").find("#cdDays").val(parseFloat( getTimeForInput('cdHours') /  getHoraireTime() ).toFixed(2));
	}
});