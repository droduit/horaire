<?php
require_once dirname(__FILE__).'/AbstractController.php';
require_once dirname(__FILE__).'/../TableGateway/UserGateway.php';

class UserController extends AbstractController {
	private $db;
	private $requestMethod;
	private $couplingCode;

	private $gateway;

	public function __construct($db, $requestMethod, $endpointUri, $queries) {
		$this->db = $db;
		$this->requestMethod = $requestMethod;
		$this->gateway = new UserGateway($db, $queries);

		$this->couplingCode = isset($endpointUri[1]) ? $endpointUri[1] : null;
	}

	public function processRequest() {
		
		$response = $this->notFoundResponse();

		switch ($this->requestMethod) {
			case 'GET':
				if ($this->couplingCode) {
		        	$response = $this->get($this->couplingCode);
		    	}
		        break;

		    case 'POST':
		        $response = $this->insert(); 
		        break;

		    case 'PUT':
		        $response = $this->update($this->couplingCode); 
		        break;

		    case 'DELETE':
		        $response = $this->delete($this->couplingCode);
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

	private function get($couplingCode) {
		$result = $this->gateway->get($couplingCode);
		if(!$result) {
			return $this->notFoundResponse();
		}
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode($result);
		return $response;
	} 

	private function insert() {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		if (isset($input['couplingCode'])) {
			$result = $this->gateway->get($input['couplingCode']);
			if ($result) {
				return $this->update($input['couplingCode']);
			}
		}

		if(!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->insert($input);
		$response['status_code'] = "HTTP/1.1 201 Created";
		$response['body'] = json_encode(["id" => $result]);
		return $response;
	}

	private function update($couplingCode) {
		$result = $this->gateway->get($couplingCode);
		if (!$result) {
			return $this->insert();
			//return $this->notFoundResponse();
		}

		$input = (array) json_decode(file_get_contents("php://input"), true);
		if (!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->update($couplingCode, $input);
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	private function delete($couplingCode) {
		$result = $this->gateway->get($couplingCode);
		if (!$result) {
			return $this->notFoundResponse();
		}
		$result = $this->gateway->delete($couplingCode);
		$response['status_code'] = "HTTP/1.1 204 No Content";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	protected function validateInput($input) {
		if (!isset($input['couplingCode'])) {
			return false;
		}
		return true;
	}

	
}