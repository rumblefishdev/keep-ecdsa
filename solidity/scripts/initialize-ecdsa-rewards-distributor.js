/**
 * This script allocates rewards for the given merkle root (interval) based on
 * the `output-merkle-objects.json` generated by merkle distributor. Make sure
 * the file exists. You can generate this file on your own following the
 * `README.md` file in the `keep-ecdsa/staker-rewards` or running the
 * `generate-staker-rewards-input.js` script which generates a mock input for
 * merkle generator. This script was written to KEEP token dashboard testing
 * purposes.
 */

const fs = require("fs")
const ECDSARewardsDistributor = artifacts.require("./ECDSARewardsDistributor")
const KeepToken = artifacts.require(
  "@keep-network/keep-core/build/truffle/KeepToken"
)
const {KeepTokenAddress} = require("../migrations/external-contracts")

// Make sure the `output-merkle-objects.json` file exists generated by merkle distributor.
const distributorOutput =
  "../staker-rewards/distributor/output-merkle-objects.json"

module.exports = async function () {
  try {
    const accounts = await web3.eth.getAccounts()
    const keepToken = await KeepToken.at(KeepTokenAddress)
    const rewardsContract = await ECDSARewardsDistributor.deployed()
    if (!fs.existsSync(distributorOutput)) {
      throw new Error("The output file from merkle distributor doesn't exist")
    }

    const merkleJSON = JSON.parse(
      fs.readFileSync(distributorOutput, {encoding: "utf8"})
    )
    if (typeof merkleJSON !== "object") throw new Error("Invalid JSON")

    for (const [merkleRoot, value] of Object.entries(merkleJSON)) {
      const amount = web3.utils.toBN(value.tokenTotal).toString()
      // Allocating rewards for the given merkle root (interval).
      await keepToken.approve(rewardsContract.address, amount, {
        from: accounts[0],
      })
      await rewardsContract.allocate(merkleRoot, amount, {from: accounts[0]})
    }
  } catch (err) {
    console.error("unexpected error:", err)
    process.exit(1)
  }

  process.exit()
}
