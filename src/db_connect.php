<?php 
include_once 'passwd.php';

define("DB_HOST", 		"localhost");   // hébergeur
define("DB_USER", 		$_SERVER['HTTP_HOST'] == "localhost" ? "root" : "remoteDBUser"); // TODO - fill DB user
define("DB_NAME", 		"webpush");  	// Le nom de la base de données.

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$mysqli->set_charset("utf8");