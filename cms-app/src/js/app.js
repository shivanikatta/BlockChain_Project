App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    init: function() {
      $.getJSON('../categories.json', function(data) {
        var categoryRow = $('#categoryRow');
        var categoryTemplate = $('#categoryTemplate');
  
        for (i = 0; i < data.length; i ++) {
          categoryTemplate.find('.panel-title').text(data[i].name);
          categoryTemplate.find('img').attr('src', data[i].picture);
          categoryTemplate.find('.btn-catselect').attr('data-id', data[i].id);
  
          categoryRow.append(categoryTemplate.html());
          App.names.push(data[i].name);
        }
      });
      return App.initWeb3();
    },
  
    initWeb3: function() {
          // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider(App.url);
      }
      web3 = new Web3(App.web3Provider);
  
      ethereum.enable();
  
      App.populateAddress();
      return App.initContract();
    },
  
    initContract: function() {
        $.getJSON('CMS.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var cmsArtifact = data;
      App.contracts.cms = TruffleContract(cmsArtifact);
  
      // Set the provider for our contract
      App.contracts.cms.setProvider(App.web3Provider);
      //jQuery('#contract_address').text(App.address);
      
      App.getChairperson();
      App.checkRecepient();
      return App.bindEvents();
    });
    },

    bindEvents: function() {
        $(document).on('click', '#register', function(){ var ad = $('#enter_address1').val(); App.handleRegister(ad); });
        $(document).on('click', '#unregister', function(){ var ad = $('#enter_address2').val(); App.handleUnRegister(ad); });
        $(document).on('click', '#canmint', function(){ var ad = $('#enter_address3').val(); App.handleCanMint(ad); });
        $(document).on('click', '#submit-amount', App.fundRequest);
        $(document).on('click', '.btn-catselect', App.selectCategory);
        $(document).on('click', '#transfer-token', App.transferFund);
    },
    
      populateAddress : function(){
        new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
          web3.eth.defaultAccount=web3.eth.accounts[0]
          jQuery.each(accounts,function(i){
            if(web3.eth.coinbase != accounts[i]){
              var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
              jQuery('#enter_address1').append(optionElement); 
              jQuery('#enter_address2').append(optionElement);  
              jQuery('#enter_address3').append(optionElement);   
            }
          });
        });
      },
      getChairperson : function(){
        App.contracts.cms.deployed().then(function(instance) {
          return instance.admin();
        }).then(function(result) {
          App.chairPerson = result;
          App.currentAccount = web3.eth.coinbase;
          if(App.chairPerson != App.currentAccount){
            $(".onlyadmin").css("display", "none");
            $(".nonadmin").css("display", "block");
            //$(".receipentsonly").css("display", "block");
          }else{
            $(".onlyadmin").css("display", "block");
            $(".nonadmin").css("display", "none");
            //$(".receipentsonly").css("display", "none");
          }
        })
      },

      checkRecepient : function(){
        App.contracts.cms.deployed().then(function(instance) {
        App.currentAccount = web3.eth.coinbase;
        console.log("current account",App.currentAccount);
        console.log("key as current acc", instance.recipients(App.currentAccount));
        return instance.recipients(App.currentAccount);
        }).then(function(recipient) {
            console.log("no.of registered",recipient);
            if(recipient[2]){ // which stores the recipient status(registered/unregistered) and its boolean value
                $(".receipentsonly").css("display", "block");
                $(".nonadmin").css("display", "none");
            }
            else{
                $(".receipentsonly").css("display", "none");
            }

        })
      },


    
      handleRegister: function(addr){
        var cmsInstance;
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.cms.deployed().then(function(instance) {
          cmsInstance = instance;
          return cmsInstance.registerRecipient(addr, {from: account});
        }).then(function(result, err){
            if(result){
                if(parseInt(result.receipt.status) == 1)
                alert(addr + " registration of recepient done successfully")
                else
                alert(addr + " registration of recepientnot done successfully due to revert")
            } else {
                alert(addr + " registration of recepient failed")
            }    
        })
        })
    },

    handleUnRegister: function(addr){
        var cmsInstance;
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.cms.deployed().then(function(instance) {
          cmsInstance = instance;
          return cmsInstance.unRegisterRecipient(addr, {from: account});
        }).then(function(result, err){
            if(result){
                if(parseInt(result.receipt.status) == 1)
                alert(addr + " Unregister of recepient done successfully")
                else
                alert(addr + " Unregister of recepient not done successfully due to revert")
            } else {
                alert(addr + " Unregister of recepient failed")
            }   
        })
        })
    },

    handleCanMint: function(addr){
        var cmsInstance;
        var mintValue = $("#mint-value").val();
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.cms.deployed().then(function(instance) {
          cmsInstance = instance;
          return cmsInstance.canMint(addr,mintValue, {from: account});
        }).then(function(result, err){
            if(result){
                if(parseInt(result.receipt.status) == 1)
                alert(addr + " mint done successfully")
                else
                alert(addr + " mint not done successfully due to revert")
            } else {
                alert(addr + " mint failed")
            }   
        })
        })
    },


    fundRequest: function () {
        event.preventDefault();
        var cmsInstance;
        var amountValue = $("#amount-value").val();
        var categoryValue = $("#category-value").val();

        web3.eth.getAccounts(function(error, accounts) {
            var account = accounts[0];
      
            App.contracts.cms.deployed().then(function(instance) {
              cmsInstance = instance;
      
              return cmsInstance.raiseRequest(amountValue,categoryValue, {from: account});
            }).then(function(result, err){
                  if(result){
                      console.log(result)
                      console.log(result.receipt.status);
                      if(parseInt(result.receipt.status) == 1)
                      alert(account + " request raised successfully")
                      else
                      alert(account + " request not done successfully due to revert")
                  } else {
                      alert(account + " request failed")
                  }   
              });
          });
      },

      selectCategory: function(event) {
        event.preventDefault();
        var proposalId = parseInt($(event.target).data('id'));
        var cmsInstance;
    
    
          App.contracts.cms.deployed().then(function(instance) {
            cmsInstance = instance;
    
            return cmsInstance.SelectCategoryToDonate(proposalId);
          }).then(function(result, err){
                if(result){
                    var candidatesResults = $("#candidatesResults");
                    candidatesResults.empty();
                    console.log("selected catef",proposalId);
                    console.log("result",result);
                    console.log("result address",result[0]);
                    console.log("result amount",result[1]);
                    $(".tabledisplay").css("display", "block");
                    var radd = result[0];
                    var ramount = result[1];
                    var candidateTemplate = "<tr><th>" + radd + "</td><td>" + ramount + "</td></tr>"
                    candidatesResults.append(candidateTemplate);
                    console.log(result.receipt.status);
                    if(parseInt(result.receipt.status) == 1)
                    alert(account + " category selection done successfully")
                    else
                    alert(account + " category selection not done successfully due to revert")
                } else {
                    alert(account + " category selection failed")
                }   
            });
    
      },


      transferFund: function () {
        event.preventDefault();
        var cmsInstance;
        var rAddress = $("#raddress").val();
        var fundAmount = $("#fund-amount").val();
        var catSelected = $("#selected-cat").val();
  
        App.contracts.cms.deployed().then(function(instance) {
          cmsInstance = instance;
            return cmsInstance.FundTransfer(rAddress,fundAmount, catSelected);
            }).then(function(result, err){
                if(result){
                    console.log(result.receipt.status);
                    if(parseInt(result.receipt.status) == 1)
                    alert(account + " funds transfered successfully")
                    else
                    alert(account + " fund transfer not done successfully due to revert")
                } else {
                    alert(account + " fund transfer  failed")
                }   
            });
          
      },



  
};
  
$(function() {
  $(window).load(function() {
    App.init();
  });
});

// code for reloading the page on account change
window.ethereum.on('accountsChanged', function (){
    location.reload();
  })