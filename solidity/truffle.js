/**
 * Use this file to configure your truffle project.
 *
 * More information about configuration can be found at:
 * truffleframework.com/docs/advanced/configuration
 *
 */

require("@babel/register")
require("@babel/polyfill")
const HDWalletProvider = require("@truffle/hdwallet-provider")

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. You can ask a truffle command to
   * use a specific network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    local: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8546,
      network_id: "*", // Any network (default: none)
      websockets: true,
    },
    sov: {
      provider: function () {
        return new HDWalletProvider(
          "2d61b31f93df83e90e78b61943019f3d03fd9f31901359a0e065a4c896eee23d",
          "https://testnet.sovryn.app/rpc"
        )
      },
      gas: 6700000,
      gasPrice: 80000000,
      skipDryRun: false,
      network_id: "*",
      timeoutBlocks: 50,
      deploymentPollingInterval: 1000,
    },
    // local: {
    //   provider: function () {
    //     return new HDWalletProvider(
    //       "4526476adb17c8f751fc4e71e23c4f5e7e2013cd62417b63825cb6cde8a42627",
    //       "HTTP://127.0.0.1:8545"
    //     )
    //   },
    //   gas: 6700000,
    //   gasPrice: 80000000,
    //   skipDryRun: false,
    //   network_id: "*",
    //   timeoutBlocks: 50,
    //   deploymentPollingInterval: 1000,
    // },
    keep_dev: {
      provider: function () {
        return new HDWalletProvider(
          process.env.CONTRACT_OWNER_ETH_ACCOUNT_PRIVATE_KEY,
          "http://localhost:8545"
        )
      },
      gas: 6721975,
      network_id: 1101,
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(
          process.env.CONTRACT_OWNER_ETH_ACCOUNT_PRIVATE_KEY,
          process.env.ETH_HOSTNAME
        )
      },
      gas: 8000000,
      network_id: 3,
      skipDryRun: true,
    },
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.17", // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
}
