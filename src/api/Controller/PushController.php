<?php
require_once dirname(__FILE__).'/AbstractController.php';
require_once dirname(__FILE__).'/../TableGateway/PushGateway.php';

class PushController extends AbstractController {
	private $db;
	private $requestMethod;
	private $gateway;

	public function __construct($db, $requestMethod, $endpointUri, $queries) {
		$this->gateway = new PushGateway($db, $queries);

		$this->db = $db;
		$this->requestMethod = $requestMethod;
	}

	public function processRequest() {
		
		$response = $this->notFoundResponse();

		switch ($this->requestMethod) {

		    case 'POST':
		        $response = $this->insert(); 
		        break;

		    case 'PUT':
		        $response = $this->update(); 
		        break;

		    case 'DELETE':
		        $response = $this->delete();
		        break;

		    default:
		        $response = $this->notFoundResponse();
		        break;
		}

		header($response['status_code']);
		if($response['body']) {
			echo $response['body'];
		}
	}

	private function get() {
		$input = (array) json_decode(file_get_contents("php://input"), true);
		$result = $this->gateway->get($input);
		if(!$result) {
			return $this->notFoundResponse();
		}
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode($result);
		return $response;
	} 

	private function insert() {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		$result = $this->gateway->get($input);
		if ($result) {
			return $this->update();
		}
		
		if(!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->insert($input);
		$response['status_code'] = "HTTP/1.1 201 Created";
		$response['body'] = json_encode(["id" => $result]);
		return $response;
	}

	private function update() {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		$result = $this->gateway->get($input);
		if (!$result) {
			return $this->insert();
		}
		
		if (!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->update($input);
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	private function delete() {
		$input = (array) json_decode(file_get_contents("php://input"), true);
		$result = $this->gateway->get($input);
		if (!$result) {
			return $this->notFoundResponse();
		}

		$subscription = $input['subscription'];

		$result = $this->gateway->delete($subscription['endpoint']);
		$response['status_code'] = "HTTP/1.1 204 No Content";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	protected function validateInput($input) {
		if (!isset($input['subscription'])) {
			return false;
		}
		if (!isset($input['subscription']['endpoint'])) {
			return false;
		}
		return true;
	}

	
}