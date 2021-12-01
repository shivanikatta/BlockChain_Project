App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    init: function() {
      $.getJSON('../proposals.json', function(data) {
        var proposalsRow = $('#proposalsRow');
        var proposalTemplate = $('#proposalTemplate');
  
        for (i = 0; i < data.length; i ++) {
          proposalTemplate.find('.panel-title').text(data[i].name);
          proposalTemplate.find('img').attr('src', data[i].picture);
          proposalTemplate.find('.btn-vote').attr('data-id', data[i].id);
  
          proposalsRow.append(proposalTemplate.html());
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
      var voteArtifact = data;
      App.contracts.vote = TruffleContract(voteArtifact);
  
      // Set the provider for our contract
      App.contracts.vote.setProvider(App.web3Provider);
      //jQuery('#contract_address').text(App.address);
      
      App.getChairperson();
      return App.bindEvents();
    });
    },

    bindEvents: function() {
        $(document).on('click', '#register', function(){ var ad = $('#enter_address1').val(); App.handleRegister(ad); });
        $(document).on('click', '#unregister', function(){ var ad = $('#enter_address2').val(); App.handleUnRegister(ad); });
        $(document).on('click', '#canmint', function(){ var ad = $('#enter_address3').val(); App.handleCanMint(ad); });
        $(document).on('click', '#submit-bid', App.fundRequest);
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
        App.contracts.vote.deployed().then(function(instance) {
          return instance.admin();
        }).then(function(result) {
          App.chairPerson = result;
          App.currentAccount = web3.eth.coinbase;
          if(App.chairPerson != App.currentAccount){
            $(".onlyadmin").css("display", "none");
            $(".nonadmin").css("display", "block");
            $(".receipentsonly").css("display", "block");
          }else{
            $(".onlyadmin").css("display", "block");
            $(".nonadmin").css("display", "none");
            $(".receipentsonly").css("display", "none");
          }
        })
      },

    
      handleRegister: function(addr){
        var voteInstance;
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
          return voteInstance.registerRecipient(addr, {from: account});
        }).then(function(result, err){
            if(result){
                if(parseInt(result.receipt.status) == 1)
                alert(addr + " registration done successfully")
                else
                alert(addr + " registration not done successfully due to revert")
            } else {
                alert(addr + " registration failed")
            }   
        })
        })
    },

    handleUnRegister: function(addr){
        var voteInstance;
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
          return voteInstance.unRegisterRecipient(addr, {from: account});
        }).then(function(result, err){
            if(result){
                if(parseInt(result.receipt.status) == 1)
                alert(addr + " Unregistration done successfully")
                else
                alert(addr + " Unregistration not done successfully due to revert")
            } else {
                alert(addr + " Unregistration failed")
            }   
        })
        })
    },

    handleCanMint: function(addr){
        var voteInstance;
        var mintValue = $("#mint-value").val();
        web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
          return voteInstance.canMint(addr,mintValue, {from: account});
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
        var voteInstance;
        var amountValue = $("#amount-value").val();
        var categoryValue = $("#category-value").val();

        web3.eth.getAccounts(function(error, accounts) {
            var account = accounts[0];
      
            App.contracts.vote.deployed().then(function(instance) {
              voteInstance = instance;
      
              return voteInstance.raiseRequest(amountValue,categoryValue, {from: account});
            }).then(function(result, err){
                  if(result){
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