import { getObjectsByPrototype, getRange, getTerrainAt } from "game/utils";
import { ATTACK, ATTACK_POWER, RANGED_ATTACK, RANGED_ATTACK_POWER, TERRAIN_SWAMP, TERRAIN_WALL } from "game/constants";
import { CostMatrix } from "game/path-finder";
import { Creep } from "game/prototypes";

export class SharedCostMatrix
{
    private static _costMatrix: CostMatrix;
    private static _damageAtPosition: number[] = [];

    constructor()
    {
        if (!SharedCostMatrix._costMatrix)
        {
            SharedCostMatrix._costMatrix = new CostMatrix();
        }
    }

    static update()
    {
        let costMatrix = new CostMatrix();
        SharedCostMatrix._costMatrix = costMatrix;
        SharedCostMatrix._damageAtPosition = Array(10000).fill(0);
        SharedCostMatrix.setEnemyCosts();

        // set swamp costs
        for(let x = 0; x < 100; x++)
        {
            for(let y = 0; y < 100; y++)
            {
                if (getTerrainAt({ x: x, y: y }) == TERRAIN_SWAMP)
                {
                    SharedCostMatrix.set(x, y, 3);
                }
            }
        }
    }

    static getCostMatrix(): CostMatrix
    {
        return SharedCostMatrix._costMatrix;
    }

    static getDamageAtPosition(x: number, y: number): number
    {
        // console.log(`${x} ${y} idx damange: ${x*100 + y}`)
        return SharedCostMatrix._damageAtPosition[x*100 + y] ?? 0;
    }

    static set(x: number, y: number, weight: number)
    {
        SharedCostMatrix._costMatrix.set(x, y, weight);
    }

    static get(x: number, y: number): number
    {
        return SharedCostMatrix._costMatrix.get(x, y);
    }

    static setEnemyCosts()
    {
        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);

        for(let creep of enemyCreeps)
        {
            let rangedAttackParts = creep.body.filter(bodyPart => bodyPart.type == RANGED_ATTACK && bodyPart.hits > 0);
            let attackParts = creep.body.filter(bodyPart => bodyPart.type == ATTACK && bodyPart.hits > 0);

            SharedCostMatrix.set(creep.x, creep.y, 255);

            let range = 4;
            if (rangedAttackParts.length || attackParts.length)
            {
                for (let xoff = -range; xoff <= range; xoff++)
                {
                    let currentX = creep.x + xoff;
                    if (currentX > 100 || currentX < 0) { continue; }

                    for (let yoff = -range; yoff <= range; yoff++)
                    {
                        let currentY = creep.y + yoff;

                        if(currentY > 100 || currentY < 0 || getTerrainAt({ x: currentX, y: currentY }) == TERRAIN_WALL) { continue; }

                        let currentRange = getRange(creep, { x: currentX, y: currentY });
                        let cost = SharedCostMatrix._damageAtPosition[currentX * 100 + currentY];

                        let attackPartDamage = 0;
                        if (currentRange <= 2)
                        {
                            attackPartDamage = ATTACK_POWER * attackParts.length;
                        }

                        let rangedAttackDamage = 0;

                        if (currentRange <= 4)
                        {
                            rangedAttackDamage = RANGED_ATTACK_POWER * rangedAttackParts.length;
                        }

                        cost += attackPartDamage + rangedAttackDamage;

                        // costMatrix.set(currentX, currentY, cost/4);
                        SharedCostMatrix._damageAtPosition[currentX * 100 + currentY] = cost;
                        // console.log(`RA (${rangedAttackDamage}) A (${attackPartDamage})`);
                        // console.log(`enemy (${creep.x},${creep.y}) pos (${currentX},${currentY}) range (${currentRange}) cm (${costMatrix.get(currentX, currentY) ?? 0}) cost (${cost})`);
                    }
                }
            }
        }
    }
}
