<?php
require_once dirname(__FILE__).'/AbstractController.php';
require_once dirname(__FILE__).'/../TableGateway/UserTimeGateway.php';

class UserTimeController extends AbstractController {
	private $db;
	private $requestMethod;
	private $queries;
	private $gateway;

	private $couplingCode;
	private $level2;

	public function __construct($db, $requestMethod, $endpointUri, $queries) {
		$this->gateway = new UserTimeGateway($db);
		$this->db = $db;
		$this->requestMethod = $requestMethod;
		$this->queries = $queries;

		// /user-time/couplingCode?type1=...&type2=...&date=...
		$this->couplingCode = isset($endpointUri[1]) ? $endpointUri[1] : null; 
		$this->level2 = isset($endpointUri[2]) ? $endpointUri[2] : null;
	}

	public function processRequest() {
		
		$response = $this->notFoundResponse();

		switch ($this->requestMethod) {
			case 'GET':
				if ($this->couplingCode != null) {
					$response = $this->get($this->couplingCode, $this->level2, $this->queries);
		    	}
				break;
				
			case 'PUT':
				if ($this->couplingCode != null) {
					$response = $this->update($this->couplingCode);
				}
				break;

		    case 'POST':
				if ($this->couplingCode != null) {
					$response = $this->insert($this->couplingCode); 
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

	private function get($couplingCode, $level2, $queries) {
		$result = $this->gateway->get($couplingCode, $level2, $queries);
		if(!$result) {
			return $this->notFoundResponse();
		}
		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode($result);
		return $response;
	} 

	private function insert($couplingCode) {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		if (isset($input[0]) && is_array($input[0])) {
			$result = array();
			foreach ($input as $entry) {
				if(!$this->validateInput($entry)) {
					return $this->unprocessableEntityResponse();
				}
				$result[] = $this->gateway->insertOrReplace($couplingCode, $entry);
			}
		} else {
			if(!$this->validateInput($input)) {
				return $this->unprocessableEntityResponse();
			}
			$result = $this->gateway->insertOrReplace($couplingCode, $input);
		}
		
		$response['status_code'] = "HTTP/1.1 201 Created";
		$response['body'] = json_encode(["id" => $result]);
		return $response;
	}

	private function update($couplingCode) {
		$input = (array) json_decode(file_get_contents("php://input"), true);

		$result = $this->gateway->get($couplingCode, null, $input);
		if (!$result) {
			return $this->notFoundResponse();
		}
		
		if (!$this->validateInput($input)) {
			return $this->unprocessableEntityResponse();
		}
		$result = $this->gateway->update($couplingCode, $input);

		$response['status_code'] = "HTTP/1.1 200 OK";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	private function delete($couplingCode, $queries) {
		$result = $this->gateway->get($couplingCode, null, $queries);
		if (!$result) {
			return $this->notFoundResponse();
		}
		$result = $this->gateway->delete($couplingCode, $queries);
		$response['status_code'] = "HTTP/1.1 204 No Content";
		$response['body'] = json_encode(["affected_rows" => $result]);
		return $response;
	}

	public function validateInput($input) {
		if (!isset($input['type1'])) {
			return false;
		}
		if (!isset($input['value'])) {
			return false;
		}
		return true;
	}

}