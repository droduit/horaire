<?php
require_once 'db_connect.php';

$vars = $_POST; 

if (!isset($vars['endpoint']) || !isset($vars['time'])) {
    echo 'Error: request malformed';
    return;
}

$time = date('Y-m-d')." ".$vars['time'].":00";
$endpoint = $vars['endpoint'];

$idSubscriber = 0;
$stmt = $mysqli->prepare("SELECT idSubscriber FROM subscriber WHERE endpoint = ?");
$stmt->bind_param("s", $endpoint);
$stmt->execute();
$stmt->bind_result($idSubscriber);
$stmt->fetch();
$stmt->close();

if($idSubscriber == 0) {
	echo 'No subscriber found';
	return;
}

// Détermine si on doit mettre à jour ou faire une nouvelle entrée
$idEndingTime = 0;
$stmt = $mysqli->prepare(
	"SELECT idEndingTime FROM endingTime WHERE idSubscriber = ?"
);
$stmt->bind_param("i", $idSubscriber);
$stmt->execute();
$stmt->bind_result($idEndingTime);
$stmt->fetch();
$stmt->close();

$method = $idEndingTime == 0 ? "POST" : "PUT";

switch ($method) {
    case 'POST':
        $stmt = $mysqli->prepare("INSERT INTO endingTime (idSubscriber, time) VALUES (?, ?)");
		$stmt->bind_param("is", $idSubscriber, $time);
		$stmt->execute();
        break;

    case 'PUT':
        $stmt = $mysqli->prepare("UPDATE endingTime SET time = ? WHERE idSubscriber = ?");
		$stmt->bind_param("si", $time, $idSubscriber);
		$stmt->execute();
        break;

    default:
        echo "Error: method not handled";
        return;
}
