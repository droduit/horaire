// Jours fériés / chomés
var publicHolidays = [
	'2019-01-01', '2019-01-02',
	'2019-03-19',
	'2019-04-19', '2019-04-22',
	'2019-05-30',
	'2019-06-10', '2019-06-20',
	'2019-08-01', '2019-08-15',
	'2019-11-01',
	'2019-12-25', '2019-12-26',

	'2020-01-01', '2020-01-02'
];

const timePattern = {
	delimiters: [':'],
	blocks: [2,2],
	numericOnly: true
};
const hourPattern = {
	time: true,
	timePattern: ['h', 'm']
};