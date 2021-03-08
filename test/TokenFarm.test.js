const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
	return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

	before(async () => {
		// recreate migration
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)
	    
	    //transfer all dapp token to tokenfarm 
	    await dappToken.transfer(tokenFarm.address, tokens('1000000'))
   
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })

	//write tests here
	describe('Mock DAI deployment', async () => {
		it('has a name', async () => {
			const name = await daiToken.name()
			assert.equal(name, 'Mock DAI Token')
		})
		it('transferred mDAI to investor', async () => {
			const balance = await daiToken.balanceOf(investor)
			assert.equal(balance, tokens('100'))
		})
    })

	describe('Dapp deployment', async () => {
		it('has a name', async () => {
			const name = await dappToken.name()
			assert.equal(name, 'DApp Token')
		})
		it('currently has 0 tokens', async () => {
			const balance = await dappToken.balanceOf(dappToken.address)
			assert.equal(balance, tokens('0'))
		})
        	
	})

	describe('Token Farm deployment', async () => {
		it('has a name', async () => {
			const name = await tokenFarm.name()
			assert.equal(name, 'Dapp Token Farm')
		})
		it('transferred all Dapp to TokenFarm', async () => {
			let balance = await dappToken.balanceOf(tokenFarm.address)
			assert.equal(balance, tokens('1000000'))
		})
	})

    describe('Farming tokens', async () => {
    	it('rewards investors for staking', async () => {
    		let result

            // Check investor balance before staking
    		result = await daiToken.balanceOf(investor)
    		assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')

    		// stake mock dai tokens
    		await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
    		await tokenFarm.stakeTokens(tokens('100'), { from: investor })

    		// check staking result
    		result = await daiToken.balanceOf(investor)
    		assert.equal(result.toString(), tokens('0'), 'Investor Mock DAI wallet balance correct after staking')
    	
    	    result = await daiToken.balanceOf(tokenFarm.address)
    	    assert.equal(result.toString(), tokens('100'), 'Tokens from Mock DAI balance correct after staking')

    	    result = await tokenFarm.stakingBalance(investor)
    	    assert.equal(result.toString(), tokens('100'), 'Staking balance result is correct')

    	    result = await tokenFarm.isStaking(investor)
    	    assert.equal(result.toString(), 'true', 'investor is staking')

    	    //issue tokens
    	    await tokenFarm.issueTokens({ from: owner })

    	    //check balance after issuance
    	    result = await dappToken.balanceOf(investor)
    	    assert.equal(result.toString(), tokens('100'), 'investor DApp Token balance correct after issuance')

            //only owner can issue tokens
    	    await tokenFarm.issueTokens({ from: investor }).should.be.rejected; 

            //unstake tokens
            await tokenFarm.unstakeTokens({ from: investor })

            //check result after unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor DAI token balance should be restored')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'token farm balance should be 0')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance should be 0')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status should be false')
    	})

    })
})