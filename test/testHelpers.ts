import { deployments, ethers } from 'hardhat';

export async function contractsReady(context:any) {
    return deployments.createFixture(async ({ deployments, ethers }, options) => {
        await deployments.fixture();

        const BasketballTeamEntrance = await ethers.getContract('BasketballTeam');
        const BasketballTeamTokenEntrance = await ethers.getContract('BasketballTeamToken');

        const deps = {
            BasketballTeam:BasketballTeamEntrance,
            BasketballTeamToken:BasketballTeamTokenEntrance,
        };

        // if (context && typeof context === 'object') {
        //     Object.keys(deps).forEach((key) => (context[key] = deps[key]));
        // }

        return deps;
    });
}