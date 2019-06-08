<?php 
// TODO - Fill keys  
define("WEBPUSH_KEYS", [
	"PUBLIC" => "Your public-key",
	"PRIVATE" => "Your private-key"
]);

if(isset($_GET['json'])) {
	header("Access-Control-Allow-Methods: GET");
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");

	http_response_code(200);
	echo json_encode(array("public" => WEBPUSH_KEYS['PUBLIC']), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
}