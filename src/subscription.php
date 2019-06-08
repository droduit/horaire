<?php
require_once 'db_connect.php';


$subscription = json_decode(base64_decode(file_get_contents('php://input')), true); // json_decode(file_get_contents('php://input'), true);

if (!isset($subscription['endpoint'])) {
    echo 'Error: not a subscription';
    return;
}

print_r($subscription);

$method = $_SERVER['REQUEST_METHOD'];

if ($method == "PUT") {
	$idSubscriber = 0;
	$endpoint = $subscription['endpoint'];
	$stmt = $mysqli->prepare("SELECT idSubscriber FROM subscriber WHERE endpoint = ?");
	$stmt->bind_param("s", $endpoint);
	$stmt->execute();
	$stmt->bind_result($idSubscriber);
	$stmt->fetch();
	$stmt->close();

	if($idSubscriber == 0) {
		$method = "POST";
	}
}

switch ($method) {
    case 'POST':
        $stmt = $mysqli->prepare("INSERT INTO subscriber (endpoint, authToken, publicKey) VALUES (?, ?, ?)");
		$stmt->bind_param("sss", $endpoint, $authToken, $publicKey);

		$endpoint = $subscription['endpoint'];
		$authToken = $subscription['keys']['auth'];
		$publicKey = $subscription['keys']['p256dh'];
		$stmt->execute();
        break;

    case 'PUT':
        $stmt = $mysqli->prepare("UPDATE subscriber SET authToken = ?, publicKey = ? WHERE endpoint = ?");
		$stmt->bind_param("sss", $authToken, $publicKey, $endpoint);

		$endpoint = $subscription['endpoint'];
		$authToken = $subscription['keys']['auth'];
		$publicKey = $subscription['keys']['p256dh'];
		$stmt->execute();
        break;

    case 'DELETE':
        $stmt = $mysqli->prepare("DELETE FROM subscriber WHERE endpoint=?");
        $stmt->bind_param("s", $subscription['endpoint']);
        $stmt->execute();
        break;

    default:
        echo "Error: method not handled";
        return;
}
