const fs = require('fs');
const path = require('path');
const util = require('util');

const writeFile = util.promisify(fs.writeFile);

export async function writeAbiAddr(artifacts, addr, name, network){
    const dir = `deployments/dev/${network}/`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let artifact = await artifacts.readArtifact(name);
    const deployments  = {};
    deployments['contractName'] = artifact.contractName;
    deployments['address'] = addr;
    const deploymentDevPath = path.resolve(__dirname, `../deployments/dev/${network}/${deployments["contractName"]}.json`);
    await writeFile(deploymentDevPath, JSON.stringify(deployments, null, 2));

    const abis = {};
    abis["contractName"] = artifact.contractName;
    abis["abi"] = artifact.abi;
    const deploymentAbiPath = path.resolve(__dirname, `../deployments/abi/${abis["contractName"]}.json`);
    await writeFile(deploymentAbiPath, JSON.stringify(abis, null, 2));
}



export async function writeAbiAddrForAbi(artifact, addr, network){
    const dir = `deployments/dev/${network}/`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const deployments  = {};
    deployments['contractName'] = artifact.contractName;
    deployments['address'] = addr;
    const deploymentDevPath = path.resolve(__dirname, `../deployments/dev/${network}/${deployments["contractName"]}.json`);
    await writeFile(deploymentDevPath, JSON.stringify(deployments, null, 2));

    const abis = {};
    abis["contractName"] = artifact.contractName;
    abis["abi"] = artifact.abi;
    const deploymentAbiPath = path.resolve(__dirname, `../deployments/abi/${abis["contractName"]}.json`);
    await writeFile(deploymentAbiPath, JSON.stringify(abis, null, 2));
}