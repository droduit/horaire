<?php
require_once dirname(__FILE__).'/../passwd.php';
require_once dirname(__FILE__).'/../db_connect.php';

header("Access-Control-Allow-Origin: https://dominique.leroduit.com");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$posLastQuestionMark = strripos($_SERVER['REQUEST_URI'], "?");
$requestMethod = $_GET['requestMethod'] ?? $_SERVER['REQUEST_METHOD'];
$endpointUri = isset($_GET['r']) ? explode("/", str_replace(substr($_SERVER['REQUEST_URI'], $posLastQuestionMark), "", substr(@$_GET['r'], 1))) : array(null);

$queriesRaw = $posLastQuestionMark === false ? array() : explode("&", substr($_SERVER['REQUEST_URI'], $posLastQuestionMark+1));
$queries = array();
foreach ($queriesRaw as $query) {
    $queryComponent = explode("=", $query);
	if ($queryComponent[0] != "endpoint") {
		$queries[$queryComponent[0]] = $queryComponent[1];
	}
}


// Authentication
$user = $_SERVER['PHP_AUTH_USER'];
$pass = $_SERVER['PHP_AUTH_PW'];

$authorized = in_array($user, array_keys(API_CREDENTIALS)) && ($pass == API_CREDENTIALS[$user]);

if (!$authorized) {
  header('WWW-Authenticate: Basic realm="Restricted area"');
  header('HTTP/1.0 401 Unauthorized');
  die (json_encode(["error" => "Not authorized"]));
}

switch ($endpointUri[0]) {
    case "users":
        require_once dirname(__FILE__).'/Controller/UserController.php';
        $controller = new UserController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;
    case "user-storage":
        require_once dirname(__FILE__).'/Controller/UserStorageController.php';
		$controller = new UserStorageController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;
    case "user-time":
        require_once dirname(__FILE__).'/Controller/UserTimeController.php';
        $controller = new UserTimeController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;

    case "push-subscription":
        require_once dirname(__FILE__).'/Controller/PushController.php';
        $controller = new PushController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;

    default:
        header("HTTP/1.1 404 Not Found");
        exit();
        break;
}