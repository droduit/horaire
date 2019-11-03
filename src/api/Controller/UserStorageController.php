<?php
require_once dirname(__FILE__).'/AbstractController.php';
require_once dirname(__FILE__).'/../TableGateway/UserStorageGateway.php';

class UserStorageController extends AbstractController {
	private $db;
	private $requestMethod;
	private $userId;
	
	private $username;
	private $property;

	private $gateway;

	public function __construct($db, $requestMethod, $endpointUri, $queries) {
		$this->db = $db;
		$this->requestMethod = $requestMethod;
		$this->username = isset($endpointUri[1]) ? $endpointUri[1] : null;
		$this->property  = isset($endpointUri[2]) ? $endpointUri[2] : null;

		$this->gateway = new UserStorageGateway($db, $queries);
	}

	public function processRequest() {
		
		$response = $this->notFoundResponse();

		switch ($this->requestMethod) {
			case 'GET':
				if ($this->username != null) {
		        	$response = $this->getStorage($this->username, $this->property);
		    	}
		        break;

		    case 'POST':
				if ($this->username != null) {
					$response = $this->insertStorage($this->username); 
				}
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

	private function getStorage($username, $property) {
		$result = $this->gateway->get($username, $property);
		if(!$result) {
			return $this->notFoundResponse();
		}
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode($result);
		return $response;
	} 

	private function insertStorage($username) {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		if (isset($input[0]) && is_array($input[0])) {
			$result = array();
			foreach ($input as $entry) {
				if(!$this->validateInput($entry)) {
					return $this->unprocessableEntityResponse();
				}
				$result[] = $this->gateway->insertOrReplace($username, $entry);
			}
		} else {
			if(!$this->validateInput($input)) {
				return $this->unprocessableEntityResponse();
			}
			$result = $this->gateway->insertOrReplace($username, $input);
		}
		
		$response['status_code'] = "HTTP/1.1 201 Created";
		$response['body'] = json_encode(["id" => $result]);
		return $response;
	}

	private function updateStorage($username, $property) {
		$result = $this->gateway->get($username, $property);
		if (!$result) {
			return $this->notFoundResponse();
		}
		$input = (array) json_decode(file_get_contents("php://input"), true);
		if (!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->update($username, $property, $input);

		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	private function deleteStorage($username, $property) {
		$result = $this->gateway->get($username, $property);
		if (!$result) {
			return $this->notFoundResponse();
		}
		$result = $this->gateway->delete($username);
		$response['status_code'] = "HTTP/1.1 204 No Content";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	public function validateInput($input) {
		if (!isset($input['property'])) {
			return false;
		}
		if (!isset($input['value'])) {
			return false;
		}
		return true;
	}

}