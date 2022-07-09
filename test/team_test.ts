import { ethers, deployments,getUnnamedAccounts, getNamedAccounts} from 'hardhat';
import {contractsReady} from './testHelpers';
import {setupUser, setupUsers} from './setUser';
import {expect, use} from './chai-setup';

async function setup () {
    // it first ensure the deployment is executed and reset (use of evm_snaphost for fast test)
    await deployments.fixture(["BasketballTeam","BasketballTeamToken"]);
   // await deployments.fixture(["BasketballTeamToken"]);

    // we get an instantiated contract in teh form of a ethers.js Contract instance:
    const contracts = {
        BasketballTeamToken: (await ethers.getContract('BasketballTeamToken')),
        BasketballTeam: (await ethers.getContract('BasketballTeam')),
    };
  
    // we get the tokenOwner
    const {tokenOwner} = await getNamedAccounts();
    // get fet unnammedAccounts (which are basically all accounts not named in the config, useful for tests as you can be sure they do not have been given token for example)
    // we then use the utilities function to generate user object/
    // These object allow you to write things like `users[0].Token.transfer(....)`
    const users = await setupUsers(await getUnnamedAccounts(), contracts);
    // finally we return the whole object (including the tokenOwner setup as a User object)
    return {
      ...contracts,
      users,
      tokenOwner: await setupUser(tokenOwner, contracts),
    };
  }
  

describe("Farm contract", function () {
    // let contract:any;
    // beforeEach(async function () {
    //     contract = await contractsReady({});
    // });   

    it("deploys with total supply zero", async function () {  
        const {BasketballTeam} = await setup();
        expect(await BasketballTeam.totalSupply()).equal("0");
    });

    it("does not pass the game role", async () => {

        const {BasketballTeam,users,tokenOwner} = await setup();
    
        const result = await BasketballTeam.addGameRole(users[0].address);
    });

    it("passes the game role", async () => {
        const {BasketballTeam,users,tokenOwner} = await setup();

        // // Try mint without the game role
        await BasketballTeam.mint(users[0].address);
        expect(await BasketballTeam.totalSupply()).equal("1");

        // Give them the game role
        await BasketballTeam.addGameRole(users[1].address);

        // Try mint without the game role
        const result = await BasketballTeam.connect(users[1].address).mint(users[0].address);
        expect(await BasketballTeam.connect(users[1].address).totalSupply()).equal("2");

        // // Take away the game role
        await BasketballTeam.removeGameRole(users[1].address);

      });

      it("mints a farm", async () => {
        const {BasketballTeam,users,tokenOwner} = await setup();

        await BasketballTeam.mint(users[0].address);
    
        const newTeam = await BasketballTeam.getTeam(1);
    
        expect(await BasketballTeam.balanceOf(users[0].address)).equal("1");
        expect(await BasketballTeam.totalSupply()).equal("1");
    
        expect(newTeam[1]).equal(tokenOwner.address);
        expect(newTeam[2]).equal("1");
      });


  });

