pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OnlyDAO is Ownable {

    address internal dao;

    constructor() {
        dao = address(0);
    }

    modifier onlyDAO() {
        require(msg.sender == dao, "This function used in DAO");
        _;
    }

    function setDAO(address _dao) public onlyOwner {
        dao = _dao;
    }

}
