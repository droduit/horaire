<?php
include_once dirname(__FILE__).'/passwd.php';
$_SERVER['PHP_AUTH_USER'] = array_keys(API_CREDENTIALS)[0];
$_SERVER['PHP_AUTH_PW'] = API_CREDENTIALS[$_SERVER['PHP_AUTH_USER']];

if (isset($_GET['endpoint'])) {
	$_GET['r'] = $_GET['endpoint'];
}

$_GET['r'] = "/".$_GET['r'];

include_once dirname(__FILE__).'/api/api.php'; 

