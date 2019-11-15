<?php
declare(strict_types = 1);

require_once dirname(__FILE__).'/UserGateway.php';

class UserTimeGateway {

	const TABLENAME = "user_time";

	private $db = null;

	public function __construct($db) {
		$this->db = $db;
	}

	private function resolveQueries($queries) {
		if ($queries == null) {
			return "";
		}
		$queryStr = "";
		foreach ($queries as $condition => $value) {
			if (!$this->validateColumnForQuery($condition)) {
				continue;
			}

			$colName = $this->db->real_escape_string($condition);
			if ($colName == "date") {
				$colName = "DATE(".$colName.")";
			}
			$queryStr .= " AND ".$colName." = '".$this->db->real_escape_string($value)."' ";
		}
		return $queryStr;
	}

	private function validateColumnForQuery($colName) {
		$allowed = ["type1", "type2", "date"];
		return in_array($colName, $allowed);
	}

	public function get(String $couplingCode, ?Array $queries) : ?Array {
        $stmt = "SELECT type1, type2, date, value FROM ".self::TABLENAME." WHERE idUser = ".UserGateway::QUERY_GET_ID_FROM_CODE;
		$stmt .= $this->resolveQueries($queries);

        if ($stmt = $this->db->prepare($stmt)) {
        	$stmt->bind_param("s", $couplingCode);
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

           	return $set;
        }
        return null;
    }

    public function insertOrReplace(String $couplingCode, Array $input) : int {
		if ($this->get($couplingCode, $input) == null) {
			$stmt = "INSERT INTO ".self::TABLENAME." (idUser, type1, type2, value, date) VALUES ( ".UserGateway::QUERY_GET_ID_FROM_CODE.", ?, ?, ?, now())";
			
			if ($stmt = $this->db->prepare($stmt)) {
				$stmt->bind_param("ssss", $couplingCode, $input['type1'], $input['type2'], $input['value']);
				$stmt->execute();  
				return $this->db->insert_id; 
			}
		} else {
			return $this->update($couplingCode, $input);
		}
		return 0;
    }

    public function update(String $couplingCode, Array $input) : int {
		$stmt = "UPDATE ".self::TABLENAME." SET value = ?, date=now() WHERE idUser=".UserGateway::QUERY_GET_ID_FROM_CODE;
		$stmt.= $this->resolveQueries($input);

        if ($stmt = $this->db->prepare($stmt)) {
			$stmt->bind_param("ss", $input['value'], $couplingCode);
			$stmt->execute();  
			return $this->db->affected_rows;
		} 
		return 0;
    }

    public function delete(String $couplingCode, ?Array $queries) : int {
		$stmt = "DELETE FROM ".self::TABLENAME." WHERE userId=".UserGateway::QUERY_GET_ID_FROM_CODE;
		$stmt.= $this->resolveQueries($queries);

        if ($stmt = $this->db->prepare($stmt)) {
	        $stmt->bind_param("s", $couplingCode);
	        $stmt->execute();
    		return $this->db->affected_rows;	
    	}
    	return 0;
    }

}