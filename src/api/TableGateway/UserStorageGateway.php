<?php
declare(strict_types = 1);

require_once dirname(__FILE__).'/UserGateway.php';

class UserStorageGateway {

	const TABLENAME = "user_storage";

	private $db = null;
	private $queries = null;

	public function __construct($db, $queries) {
		$this->db = $db;
		$this->queries = $queries;
	}

	private function resolveQueries() {
		$queryStr = "";
		foreach ($this->queries as $condition => $value) {
			$colName = $this->db->real_escape_string($condition);
			if ($colName == "date") {
				$colName = "DATE(".$colName.")";
			}
			$queryStr .= " AND ".$colName." = '".$this->db->real_escape_string($value)."' ";
		}
		return $queryStr;
	}

	public function get(String $username, ?String $property) : ?Array {
        $stmt = "SELECT property, value FROM ".self::TABLENAME." WHERE idUser = ".UserGateway::QUERY_GET_ID_FROM_CODE;
        if ($property != null) {
        	$stmt .= " AND property=?";
        }
        $stmt .= $this->resolveQueries();

        if ($stmt = $this->db->prepare($stmt)) {
        	if ($property != null) {
        		$stmt->bind_param("ss", $username, $property);
        	} else {
        		$stmt->bind_param("s", $username);
        	}
            $stmt->execute();
			$stmt_result = $stmt->get_result();
			
			$set = array();
			if ($stmt_result->num_rows > 0) {
				for ($set = array (); $row = $stmt_result->fetch_assoc(); $set[] = $row);
			}

            $stmt->close();
        	
        	if (count($set) == 0) {
        		return null;
        	}

        	$combinedSet = array();
        	foreach ($set as $array) {
        		$combinedSet[$array['property']] = $array['value'];
        	}

           	return $property == null ? $combinedSet : array($property => $combinedSet[$property]);
        }
        return null;
    }

    public function insertOrReplace(String $username, Array $input) : int {
		if ($this->get($username, $input['property']) == null) {
			$stmt = "INSERT INTO ".self::TABLENAME." (idUser, property, value, date) VALUES ( (select idUser FROM user WHERE couplingCode = ? OR username=?), ?, ?, now())";
			
			if ($stmt = $this->db->prepare($stmt)) {
				$stmt->bind_param("ssss", $username, $username, $input['property'], $input['value']);
				$stmt->execute();  
				return $this->db->insert_id; 
			}
		} else {
			return $this->update($username, $input['property'], $input);
		}
		return 0;
    }

    public function update(String $username, String $property, Array $input) : int {
        $stmt = "UPDATE ".self::TABLENAME." SET value = ?, date=now() WHERE idUser=(SELECT idUser FROM user WHERE couplingCode = ? OR username=?) AND property=?";

        if ($stmt = $this->db->prepare($stmt)) {
			$stmt->bind_param("ssss", $input['value'], $username, $username, $property);
			$stmt->execute();  
			return $this->db->affected_rows;
		} 
		return 0;
    }

    public function delete(String $username, String $property) : int {
        $stmt = "DELETE FROM ".self::TABLENAME." WHERE userId=(SELECT idUser FROM user WHERE couplingCode = ? OR username=?) AND property=?";

        if ($stmt = $this->db->prepare($stmt)) {
	        $stmt->bind_param("sss", $username, $username, $property);
	        $stmt->execute();
    		return $this->db->affected_rows;	
    	}
    	return 0;
    }

}