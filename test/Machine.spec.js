const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectEvent } = require("openzeppelin-test-helpers");
  
describe('#constructor()', () => {
    it('should successfully initialize', async () => {
        const StorageFactory = await ethers.getContractFactory("Storage");
        const Storage = await StorageFactory.deploy(10);
        await Storage.deployed();

        const MachineFactory = await ethers.getContractFactory("Machine");
        const Machine = await MachineFactory.deploy(Storage.address);
        await Machine.deployed();

        expect(await Machine.s()).to.equal(Storage.address);
    });
  });

  describe('After initalize', () => {

        let Storage, Machine;

        beforeEach(async () => {
            const StorageFactory = await ethers.getContractFactory("Storage");
            Storage = await StorageFactory.deploy(10);
            await Storage.deployed();
    
            const MachineFactory = await ethers.getContractFactory("Machine");
            Machine = await MachineFactory.deploy(Storage.address);
            await Machine.deployed();  
           
        });

        describe('#saveValue()', () => {
            it('should successfully save value', async () => {
             const saveValue = await Machine.saveValue(54);
              expect(await Storage.val()).to.equal(54);
            });
        });

        describe('#addValuesWithDelegateCall()', () => {
            let Calculator;
            beforeEach(async () => {
                const CalculatorFactory = await ethers.getContractFactory("Calculator");
                Calculator = await CalculatorFactory.deploy();
                await Calculator.deployed();
            });
            it.only('should successfully add values with delegate call', async () => {
                const [owner] = await ethers.getSigners();

                Machine.on("AddedValuesByDelegateCall", (a, b, success) => {
                    console.log(a, b, success);
                });

                const result = await expect(Machine.addValuesWithDelegateCall(Calculator.address, 1, 2))
                .to.emit(Machine,'AddedValuesByDelegateCall').withArgs(1,2,true);

                // expect(result.from).to.equal(owner.address);
                // expect(result.to).to.equal(Machine.address);
                // Calculator storage DOES NOT CHANGE!
                expect(await Calculator.calculateResult()).to.equal(0);
                // Only calculateResult in Machine contract should be changed
                expect(await Machine.calculateResult()).to.equal(3);
                expect(await Machine.user()).to.equal(owner.address);
      
            });
          });

          describe('#addValuesWithCall()', () => {
            let Calculator;
            beforeEach(async () => {
                const CalculatorFactory = await ethers.getContractFactory("Calculator");
                Calculator = await CalculatorFactory.deploy();
                await Calculator.deployed();
            });
            it('should successfully add values with call', async () => {
              const result = await Machine.addValuesWithCall(Calculator.address, 1, 2);
      
              expectEvent.inLogs(result.logs, 'AddedValuesByCall', {
                a: 1,
                b: 2,
                success: true,
              });
      
              expect(result.receipt.from).to.equal(owner.toString().toLowerCase());
              expect(result.receipt.to).should.to.equal(Machine.address.toString().toLowerCase());
      
              // Calculator storage SHOULD CHANGE
              expect(await Calculator.calculateResult()).to.equal(3);
      
              expect(await Machine.calculateResult()).to.equal(0);
      
              expect(await Machine.user()).should.be.equal(constants.ZERO_ADDRESS);
              (await Calculator.user()).should.be.equal(Machine.address);
            });
          });

  });
