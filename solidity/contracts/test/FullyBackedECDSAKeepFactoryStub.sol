pragma solidity 0.5.17;

import "../../contracts/fully-backed/FullyBackedECDSAKeepFactory.sol";

/// @title Fully Backed Bonded ECDSA Keep Factory Stub
/// @dev This contract is for testing purposes only.
contract FullyBackedECDSAKeepFactoryStub is FullyBackedECDSAKeepFactory {
    constructor(
        address _masterKeepAddress,
        address _sortitionPoolFactoryAddress,
        address _bondingAddress,
        address _randomBeaconAddress,
        address _bondTokenAddress
    )
        public
        FullyBackedECDSAKeepFactory(
            _masterKeepAddress,
            _sortitionPoolFactoryAddress,
            _bondingAddress,
            _randomBeaconAddress,
            _bondTokenAddress
        )
    {}

    function initialGroupSelectionSeed(uint256 _groupSelectionSeed) public {
        groupSelectionSeed = _groupSelectionSeed;
    }

    function getGroupSelectionSeed() public view returns (uint256) {
        return groupSelectionSeed;
    }
}
