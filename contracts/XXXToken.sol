pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XXXToken is ERC20 {
    constructor() ERC20("XXX Coin", "XXX") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
