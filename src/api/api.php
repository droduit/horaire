<?php
require_once dirname(__FILE__).'/../passwd.php';
require_once dirname(__FILE__).'/../db_connect.php';
require_once dirname(__FILE__).'/Controller/UserController.php';
require_once dirname(__FILE__).'/Controller/UserStorageController.php';

header("Access-Control-Allow-Origin: https://dominique.leroduit.com");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$requestMethod = $_GET['requestMethod'] ?? $_SERVER['REQUEST_METHOD'];
$endpointUri = isset($_GET['r']) ? explode("/", substr(@$_GET['r'], 1)) : array(null);
$queriesRaw = explode("&", $_SERVER['QUERY_STRING']);
array_shift($queriesRaw);
$queries = array();
foreach ($queriesRaw as $query) {
    $queryComponent = explode("=", $query);
    $queries[$queryComponent[0]] = $queryComponent[1];
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
        $controller = new UserController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;
	case "user-storage":
		$controller = new UserStorageController($mysqli, $requestMethod, $endpointUri, $queries);
        $controller->processRequest();
        break;
    default:
        header("HTTP/1.1 404 Not Found");
        exit();
        break;
}