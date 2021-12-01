var CMS = artifacts.require("CMS");

module.exports = function(deployer) {
  deployer.deploy(CMS,"ttoken","ttoken");
};
