pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm {
	// All code goes here...
	address public owner;
	string public name = "Dapp Token Farm";
    DappToken public dappToken;
    DaiToken public daiToken;


    address[] public stakers; 
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    //1. Stake tokens (Deposit)
    function stakeTokens(uint _amount) public {
        require(_amount > 0, "amount cannot be 0");
        //transfer mock dai tokens here
        //note: this must be approved first, done on client side later
        daiToken.transferFrom(msg.sender, address(this), _amount);

        //update stakingBalance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        // add users to stakers if haven't staked yet
        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;

    }

    //Issuing tokens
    function issueTokens() public {
        // only owner can call function
        require(msg.sender == owner, "caller must be the owner");

        //issue tokens to stakers
        for (uint i=0; i<stakers.length; i++) {
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0) {
                dappToken.transfer(recipient, balance); 
            }
            
        }
    }

    //Unstaking tokens (Withdraw) 
    function unstakeTokens() public {
        // fetch staking balance
        uint balance = stakingBalance[msg.sender];

        // require amount greater than 0
        require(balance > 0);

        //transfer Mock DAI tokens back to sender
        daiToken.transfer(msg.sender, balance);

        // reset staking balance
        stakingBalance[msg.sender] = 0;

        // set staking condition to false
        isStaking[msg.sender] = false;
    }
}
