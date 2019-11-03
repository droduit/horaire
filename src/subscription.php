<?php
require_once 'db_connect.php';

$bodyContent = json_decode(file_get_contents('php://input'), true);

$ipv4 = $bodyContent['ipv4'];
$couplingCode = $bodyContent['couplingCode'];
$subscription = $bodyContent['subscription'];

if (!isset($subscription['endpoint'])) {
    echo 'Error: not a subscription';
    return;
}

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

/* Search if a user exists. If doesn't, insert and get new inserted id */
$idUser = NULL;
$stmt1 = $mysqli->prepare("SELECT idUser FROM user WHERE couplingCode = ? and ipv4 = ?");
$stmt1->bind_param("ss", $couplingCode, $ipv4);
$stmt1->execute();
$stmt1->bind_result($idUser);
$stmt1->fetch();
$stmt1->close();
if($idUser == NULL) {
	$stmt = $mysqli->prepare("INSERT INTO user (couplingCode, ipv4) VALUES (?, ?)");
	$stmt->bind_param("ss", $couplingCode, $ipv4);
	$stmt->execute();
	$idUser = $mysqli->insert_id;
}

switch ($method) {
    case 'POST':
        $stmt = $mysqli->prepare("INSERT INTO subscriber (endpoint, authToken, publicKey, idUser) VALUES (?, ?, ?, ?)");
		$stmt->bind_param("sssi", $endpoint, $authToken, $publicKey, $idUser);

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
