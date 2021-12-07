var CMS = artifacts.require("CMS");

module.exports = function(deployer) {
  deployer.deploy(CMS,"CMS","CMS");
};
