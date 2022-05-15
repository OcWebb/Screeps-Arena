import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { getTerrainAt } from "game";
import { ATTACK, OK, RANGED_ATTACK, RANGED_ATTACK_DISTANCE_RATE, RANGED_ATTACK_POWER, ATTACK_POWER, TERRAIN_WALL } from "game/constants";
import { CostMatrix, searchPath } from "game/path-finder";
import { Creep, GameObject, RoomPosition, Structure, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getDirection, getObjectsByPrototype, getRange, findInRange } from "game/utils";
import { Visual } from "game/visual";
import { common } from "utils/common";
import { Role, RoleName } from "../../utils/types";
import { Squad } from "./squad"

export class TightSquad extends Squad
{
    leader: Role | undefined;
    enemySpawn: StructureSpawn;
    mySpawn: StructureSpawn;
    locationsWeWereStuck: RoomPosition[] = [];
    type: string = "TightSquad"

    constructor(composition: RoleName[])
    {
        super(composition);
        this.spread = 1;
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
    }

    run(): void
    {
        super.run();
        this.updateStats();

        if (!this.leader || !this.leader.creep.exists)
        {
            this.leader = this.roleCreeps[0];
        }
    }

    getInFormation(): boolean
    {
        let outOfPos = false;

        if (!this.leader?.creep.exists) { return outOfPos; }

        for (let roleCreep of this.roleCreeps)
        {
            let creep = roleCreep.creep;
            if (getRange(creep, this.leader.creep) > this.spread)
            {
                roleCreep.roleMoveTo(this.leader.creep);
                outOfPos = true;
            }
        }

        return outOfPos;
    }

    squadRetreat(enemies: Creep[], range=6): void
    {
        if (!this.leader?.creep.exists) { return; }

        this.squadMove(this.mySpawn, true);

        let goals: { pos: RoomPosition; range: number; }[] = [];
        enemies.forEach(creep => goals.push({ "pos": creep, "range": range }));
        // let fleePath = searchPath(this.leader.creep, goals, { "flee": true, "costMatrix": this.costMatrix });

        // if (fleePath.path.length)
        // {
        //     console.log("FLEEING TO");
        //     console.log(fleePath.path[fleePath.path.length-1]);
        //     this.squadMove(fleePath.path[fleePath.path.length-1], true);
        //     this.squadMove(this.mySpawn, true);
        // }
    }

    getPosition (): RoomPosition
    {
        return this.leader && this.leader.creep.exists ? this.leader.creep : { x: 0, y: 0 }
    }

    updateCostMatrix(): void
    {
        super.updateCostMatrix();

        let myCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my);
        let squadIds = this.roleCreeps.map(roleCreep => roleCreep.creep.id);

        for (let creep of myCreeps)
        {
            if (!creep.exists) { continue; }

            if (!squadIds.includes(creep.id))
            {
                // block off cells around creep
                for (let xoff = -2; xoff <= 2; xoff++)
                {
                    for (let yoff = -2; yoff <= 2; yoff++)
                    {
                        let currentX = creep.x + xoff;
                        let currentY = creep.y + yoff;
                        if (getRange({x: currentX, y: currentY}, creep) <= 1)
                        {
                            this.costMatrix.set(currentX, currentY, 255)
                        }
                        else
                        {
                            this.costMatrix.set(currentX, currentY, 20)
                        }

                        // new Visual().rect({ x: currentX-0.5, y: currentY-0.5 }, 1, 1, { fill: "#ff0000", opacity: .2 });
                    }
                }

                this.costMatrix.set(creep.x, creep.y, 255);
            }
        }

        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);

        for (let creep of enemyCreeps)
        {
            // block off cells around creep
            for (let xoff = -2; xoff <= 2; xoff++)
            {
                for (let yoff = -2; yoff <= 2; yoff++)
                {
                    let currentX = creep.x + xoff;
                    let currentY = creep.y + yoff;

                    (getRange({x: currentX, y: currentY}, creep) <= 1) ?
                        this.costMatrix.set(currentX, currentY, 20) :
                        this.costMatrix.set(currentX, currentY, 40)
                }
            }

            this.costMatrix.set(creep.x, creep.y, 255);
        }
    }

    squadMove(target: RoomPosition, retreat: boolean = false, range: number = 1)
    {
        if (!this.leader || !this.leader.creep.exists || !target) { return; }

        let ret = searchPath(this.leader.creep, target, { costMatrix: this.costMatrix, range: range });
        let direction = getDirection(ret.path[0]?.x - this.leader.creep.x, ret.path[0]?.y - this.leader.creep.y);
        let maxIterations = 4;
        let foundPath = false;
        let costMatrixCopy = this.costMatrix.clone();

        // console.log(`squad ${this.id} -> (${target.x}, ${target.y})`);
        while (maxIterations-- > 0 && !foundPath)
        {
            // console.log(`squad ${this.id} trying (${ret.path[0].x}, ${ret.path[0].y})`);
            if (!ret.path.length) { break; }

            direction = getDirection(ret.path[0].x - this.leader.creep.x, ret.path[0].y - this.leader.creep.y);
            let researchNeeded = false;
            for (let roleCreep of this.roleCreeps)
            {
                let creep = roleCreep.creep;
                if (!creep.exists) { continue; }


                let nextPosition = common.getPositionFromDirection(creep, direction);
                // console.log(`[${maxIterations}] creep ${creep.id} -> (${nextPosition.x}, ${nextPosition.y}) - cm: ${this.costMatrix.get(nextPosition.x, nextPosition.y)}, terrain: ${getTerrainAt(nextPosition)}`)
                if (this.costMatrix.get(nextPosition.x, nextPosition.y) >= 255 ||
                getTerrainAt(nextPosition) == TERRAIN_WALL)
                {
                    // console.log(`blocking: (${ret.path[0].x}, ${ret.path[0].y})`)
                    costMatrixCopy.set(ret.path[0].x, ret.path[0].y, 255);
                    ret = searchPath(this.leader.creep, target, { "costMatrix": costMatrixCopy });
                    researchNeeded = true;
                    break;
                }
            }

            if (!researchNeeded)
            {
                foundPath = true;
            }
        }

        if (ret.path.length)
        {
            for (let roleCreep of this.roleCreeps)
            {
                if (!roleCreep.creep || !roleCreep.creep.exists) { continue; }
                // console.log(roleCreep.creep);
                let ret2 = roleCreep.roleMove(direction);
                if(!retreat)
                {
                    new Visual().poly(ret.path, { stroke: "#00e21e", opacity: 0.5,  });
                }

                if (ret2 != OK)
                {
                    console.log(`Squad ${this.id} - creep ${roleCreep.creep.id} failed to move ${ret2}`);
                }
            }
        }
    }

    visualize()
    {
        super.visualize();

        if (this.leader && this.leader.creep.exists && this.leader.nextPosition)
        {
            let vis = new Visual(10, false);
            vis.circle(
                { 'x': this.leader.nextPosition.x, 'y': this.leader.nextPosition.y - 0.2 },
                {
                    opacity: .9,
                    radius: 0.1,
                    fill: "#ffffff"
                }
            );
        }
    }

    visualizeCostMatrix()
    {
        if (this.leader && this.leader.creep.exists)
        {
            common.visualizeCostMatrix(this.costMatrix, this.leader.creep);
        }
    }

    logState(): void
    {
        // console.log(`leader: ${this.leader?.creep.id}`);
    }
}
