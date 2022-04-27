const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-ganache");


describe('Storage', accounts => {
    it("Should return the new greeting once it's changed", async function () {
        const StorageFactory = await ethers.getContractFactory("Storage");
        const Storage = await StorageFactory.deploy(10);
        await Storage.deployed();

        expect(await Storage.val()).to.equal(10);

        const setValue = await Storage.setValue(20);

        // wait until the transaction is mined
        await setValue.wait();

        expect(await Storage.val()).to.equal(20);

    });
});