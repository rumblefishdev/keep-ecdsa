pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract BondERC20 is ERC20Mintable, ERC20Detailed("BondERC20", "BRC", 18) {
    
}
