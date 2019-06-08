<?php
require_once __DIR__ . '/../db_connect.php';
require __DIR__ . '/../vendor/autoload.php';
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// TODO - Fill keys 
define("WEBPUSH_KEYS", [
	"PUBLIC" => "Your public-key",
	"PRIVATE" => "Your private-key"
]);

$stmt = $mysqli->query(
	"SELECT s.* FROM endingTime t
	INNER JOIN subscriber s ON s.idSubscriber=t.idSubscriber
	WHERE DATE_FORMAT(time,'%d.%m.%Y %H:%i') = '".date('d.m.Y H:i')."'"
);

foreach($stmt as $item) {   
    sendNotification($item, date('H:i')." - Temps de travail accompli aujourd'hui.");
}

if (date('w') > 0 && date('w') < 6 && in_array(date('H:i'), array("08:30", "11:00", "14:00", "16:00")) ) {
	switch(date('H:i')) {
		case "08:30":
		case "14:00":
			$text = date('H:i')." = Début de la période bloquée";
			break;

		case "11:00":
		case "16:00":
			$text = date('H:i')." = Fin de la période bloquée";
			break;
		
		default:
			$text = null;
			break;
	}
	
	if( $text !== null ) {
		$stmt = $mysqli->query(
			"SELECT s.* FROM endingTime t
			INNER JOIN subscriber s ON s.idSubscriber=t.idSubscriber
			WHERE DATE_FORMAT(time,'%d.%m.%Y') = '".date('d.m.Y')."'"
		);
		foreach($stmt as $item) {   
			sendNotification($item, $text);
		}
	}
}

function sendNotification($item, $bodyMessage) {
	$subscription = Subscription::create($item);

    $auth = array(
        'VAPID' => array(
            'subject' => 'Horaire',
            'publicKey' => WEBPUSH_KEYS['PUBLIC'],
            'privateKey' => WEBPUSH_KEYS['PRIVATE'], 
        ),
    );

    $webPush = new WebPush($auth);

    $res = $webPush->sendNotification(
        $subscription,
        $bodyMessage
    );

    foreach ($webPush->flush() as $report) {
        $endpoint = $report->getRequest()->getUri()->__toString();

        if ($report->isSuccess()) {
            echo "<p>[v] Message sent successfully for subscription {$endpoint}.</p>";
        } else {
            echo "<p>[x] Message failed to sent for subscription {$endpoint}: {$report->getReason()}</p>";
        }
    }
}