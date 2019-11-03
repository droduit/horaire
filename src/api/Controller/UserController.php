<?php
require_once dirname(__FILE__).'/AbstractController.php';
require_once dirname(__FILE__).'/../TableGateway/UserGateway.php';

class UserController extends AbstractController {
	private $db;
	private $requestMethod;
	private $userId;

	private $userGateway;

	public function __construct($db, $requestMethod, $endpointUri, $queries) {
		$this->db = $db;
		$this->requestMethod = $requestMethod;
		$this->couplingCode = isset($endpointUri[1]) ? $endpointUri[1] : null;

		$this->userGateway = new UserGateway($db);
	}

	public function processRequest() {
		
		$response = $this->notFoundResponse();

		switch ($this->requestMethod) {
			case 'GET':
				if ($this->couplingCode) {
		        	$response = $this->getUser($this->couplingCode);
		    	}
		        break;

		    case 'POST':
		        $response = $this->insertUser(); 
		        break;

		    case 'PUT':
		        $response = $this->updateUser($this->couplingCode); 
		        break;

		    case 'DELETE':
		        $response = $this->deleteUser($this->couplingCode);
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

	private function getUser($couplingCode) {
		$result = $this->userGateway->get($couplingCode);
		if(!$result) {
			return $this->notFoundResponse();
		}
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode($result);
		return $response;
	} 

	private function insertUser() {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		if (isset($input['couplingCode'])) {
			$result = $this->userGateway->get($input['couplingCode']);
			if ($result) {
				return $this->updateUser($input['couplingCode']);
			}
		}

		if(!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->userGateway->insert($input);
		$response['status_code'] = "HTTP/1.1 201 Created";
		$response['body'] = json_encode(["id" => $result]);
		return $response;
	}

	private function updateUser($couplingCode) {
		$result = $this->userGateway->get($couplingCode);
		if (!$result) {
			return $this->insertUser();
			//return $this->notFoundResponse();
		}

		$input = (array) json_decode(file_get_contents("php://input"), true);
		if (!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->userGateway->update($couplingCode, $input);
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	private function deleteUser($couplingCode) {
		$result = $this->userGateway->get($couplingCode);
		if (!$result) {
			return $this->notFoundResponse();
		}
		$result = $this->userGateway->delete($couplingCode);
		$response['status_code'] = "HTTP/1.1 204 No Content";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	protected function validateInput($input) {
		if (!isset($input['couplingCode'])) {
			return false;
		}
		if (!isset($input['ipv4'])) {
			return false;
		}
		return true;
	}

	
}