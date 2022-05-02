import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { getTerrainAt } from "game";
import { ATTACK, OK, RANGED_ATTACK, RANGED_ATTACK_DISTANCE_RATE, RANGED_ATTACK_POWER, ATTACK_POWER, TERRAIN_WALL } from "game/constants";
import { CostMatrix, searchPath } from "game/path-finder";
import { Creep, GameObject, RoomPosition, Structure, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getDirection, getObjectsByPrototype, getRange, findInRange } from "game/utils";
import { Visual } from "game/visual";
import { utils } from "utils/Utils";
import { Role, RoleName } from "../types";
import { Squad } from "./squad"

export class DuoSquad extends Squad
{
    leader: Role | undefined;
    squadPositions: SquadPosition[] = [];

    creepToPosition: { key: Role, value: SquadPosition } | undefined;
    enemySpawn: StructureSpawn;
    locationsWeWereStuck: RoomPosition[] = [];

    constructor(composition: RoleName[])
    {
        super(3, composition);
        this.spread = 1;

        this.squadPositions.push(new SquadPosition(0,0));
        this.squadPositions.push(new SquadPosition(0,1));
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
    }

    run(): void
    {
        super.run();
        // this.visualizeCostMatrix();

        if (this.hps == 0)
        {
            this.updateStats();
        }

        if (!this.leader || !this.leader.creep.exists)
        {
            this.leader = this.roleCreeps[0];
        }

        if (!this.leader.creep.exists || !this.leader.creep.body?.some(bp => bp.type == RANGED_ATTACK || bp.type == ATTACK))
        {
            this.leader = this.roleCreeps.filter(roleCreep => roleCreep.creep.exists && roleCreep.creep.body.some(bp => bp.type == RANGED_ATTACK || bp.type == ATTACK))[0];
        }

        let outOfPos = this.getInFormation();
        if (outOfPos)
        {
            console.log(`squad ${this.id} out of position`);
            return;
        }

        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my)
        let enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        let attackSpawn = false;
        if (!enemies.length)
        {
            console.log("attacking spawn " + enemies.length);
            attackSpawn = true;
            this.squadMove(enemySpawn);
        }
        let closestToSpawn = findClosestByPath(this.enemySpawn, enemies);
        if (this.leader && closestToSpawn && getRange(this.leader.creep, closestToSpawn) > 3)
        {
            this.squadMove(closestToSpawn);
        }

        for (let roleCreep of this.roleCreeps)
        {
            if (!roleCreep.creep.exists) { continue; }

            roleCreep.run();

            switch (roleCreep.role)
            {
                case "RANGED_ATTACKER":
                    let rangedAttacker = roleCreep as RangedAttacker;
                    let enemiesInRange = findInRange(rangedAttacker.creep, enemies, 3);

                    if (enemiesInRange.length)
                    {
                        rangedAttacker.attackEnemies(enemies);
                    }

                    if (attackSpawn)
                    {
                        rangedAttacker.creep.rangedAttack(enemySpawn);
                    }

            }

            let creep = roleCreep.creep;
            let healthPercentage = creep.hits/creep.hitsMax;
            let closestEnemy = findClosestByPath(creep, enemies);
            let damageInRange = this.potentialDamageInRange(creep)
            let potentialNetHealthChange = this.hps - damageInRange;
            let weOverpower = this.dps > damageInRange;

            // console.log(`${creep.id} potentialNetHealthChange: ${potentialNetHealthChange}, healthPercentage: ${healthPercentage}, enemiesInRange: ${this.enemiesInRangeOfPosition(creep).length}, weOverpower: ${weOverpower}, this.dps: ${this.dps}, damageInRange: ${damageInRange}`);


            if (healthPercentage < .45 && potentialNetHealthChange < 0 ||
                (closestEnemy && getRange(creep, closestEnemy) < 2) ||
                !weOverpower)
            {
                console.log(`${this.id} retreating`);
                this.squadRetreat(enemies);
                return;
            }

        }
    }

    addCreep(creep: Role): boolean
    {
        let res = super.addCreep(creep);
        if (res)
        {
            for (let squadPosition of this.squadPositions)
            {
                if (!squadPosition.roleCreep)
                {
                    squadPosition.roleCreep = creep;
                    break;
                }
            }
        }

        return res;
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
                let ret = searchPath(creep, this.leader.creep, { costMatrix: this.costMatrix });
                console.log(ret.path);
                if (ret.path.length)
                {
                    let direction = getDirection(ret.path[0].x - creep.x, ret.path[0].y - creep.y);
                    roleCreep.roleMove(direction);
                }
                outOfPos = true;
            }
        }

        return outOfPos;
    }

    squadRetreat(enemies: Creep[], range=6): void
    {
        if (!this.leader?.creep.exists) { return; }

        let goals: { pos: RoomPosition; range: number; }[] = [];
        enemies.forEach(creep => goals.push({ "pos": creep, "range": range }));
        let fleePath = searchPath(this.leader.creep, goals, { "flee": true, "costMatrix": this.costMatrix });

        // console.log(fleePath);

        if (fleePath.path.length)
        {
            console.log("FLEEING TO");
            console.log(fleePath.path[fleePath.path.length-1]);
            this.squadMove(fleePath.path[fleePath.path.length-1], true);
        }
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
                        if (Math.abs(xoff) <= 1 && Math.abs(yoff) <= 1)
                        {
                            this.costMatrix.set(currentX, currentY, 20)
                        }
                        else
                        {
                            this.costMatrix.set(currentX, currentY, 40)
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

                    if (Math.abs(xoff) <= 1 && Math.abs(yoff) <= 1)
                    {
                        this.costMatrix.set(currentX, currentY, 20)
                    }
                    else
                    {
                        this.costMatrix.set(currentX, currentY, 40)
                    }
                }
            }

            this.costMatrix.set(creep.x, creep.y, 255);
        }
    }

    enemiesInRangeOfPosition(position: RoomPosition)
    {
        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my)
        let ranged = enemies.filter(creep => creep.body.some(bodyPart => bodyPart.type = RANGED_ATTACK));
        let melee = enemies.filter(creep => creep.body.some(bodyPart => bodyPart.type = ATTACK));
        let rangedEnemyCreepsInRange = findInRange(position, ranged, 3);
        let meleeEnemyCreepsInRange = findInRange(position, melee, 1);

        return rangedEnemyCreepsInRange.concat(meleeEnemyCreepsInRange);
    }

    potentialDamageInRange(position: RoomPosition): number
    {
        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my)
        let netDamage = 0;

        for (let enemyCreep of enemies)
        {
            let rangeToPosition = getRange(position, enemyCreep);

            let rangedAttackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === RANGED_ATTACK);
            if (rangeToPosition <= 4 && rangedAttackParts.length)
            {
                netDamage += (RANGED_ATTACK_POWER * RANGED_ATTACK_DISTANCE_RATE[rangedAttackParts.length]) * rangedAttackParts.length;
            }

            let attackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === ATTACK);
            // console.log("parts " + attackParts.length)
            if (rangeToPosition <= 2 && attackParts.length)
            {
                netDamage += ATTACK_POWER * attackParts.length;
            }
        }

        return netDamage;
    }

    // bring to squad manager
    // tooCloseToAnotherSquad(position: RoomPosition): Creep | undefined
    // {
    //     let squadIds = this.creeps.map(creep => (creep as Creep).id);
    //     let myCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my && !squadIds.includes(creep.id));

    //     let closestCreep = undefined;
    //     for (let creep of myCreeps)
    //     {
    //         if (getRange(creep, position) <= 3)
    //         {
    //             closestCreep = creep;
    //         }
    //     }

    //     return closestCreep;
    // }

    squadMove(target: RoomPosition, retreat: boolean = false)
    {
        if (!this.leader || !this.leader.creep.exists || !target) { return; }

        let ret = searchPath(this.leader.creep, target, { costMatrix: this.costMatrix });
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


                let nextPosition = utils.getPositionFromDirection(creep, direction);
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
                    new Visual().poly(ret.path, { stroke: "#00e21e", opacity: .5 });
                }

                if (ret2 != OK)
                {
                    console.log(`Squad ${this.id} - creep ${roleCreep.creep.id} failed to move ${ret2}`);
                }
            }
        }
    }

    samePosition(positionOne: RoomPosition, positionTwo: RoomPosition)
    {
        return  positionOne.x == positionTwo.x &&
                positionOne.y == positionTwo.y
    }

    visualize()
    {
        super.visualize();

        if (this.leader && this.leader.creep.exists && this.leader.nextPosition)
        {
            let vis = new Visual(10, false);
            console.log("VISUAL");
            console.log(this.leader.nextPosition);
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
            for (let xoff = -4; xoff <= 4; xoff++)
            {
                for (let yoff = -4; yoff <= 4; yoff++)
                {
                    let currentX = this.leader.nextPosition.x + xoff;
                    let currentY = this.leader.nextPosition.y + yoff;
                    let cost = this.costMatrix.get(currentX, currentY);
                    if (cost)
                    {
                        let color = cost <= 10 ? "#ffffff" : cost < 255 ? "#e0a400" : "#ff0000";
                        // new Visual().text(currentX + ", " + currentY, { x: currentX - 0.2, y: currentY - 0.2 }, { font: 0.25, align: 'left', color: color });
                        new Visual().text(cost.toString(), { x: currentX, y: currentY }, { font: 0.25, align: 'center', color: color });
                    }
                }
            }
        }
    }

    logState(): void
    {
        // console.log(`leader: ${this.leader?.creep.id}`);
    }
}

class SquadPosition
{
    xoffset: number;
    yoffset: number;
    roleCreep: Role | undefined;

    constructor(xoffset: number, yoffset: number, roleCreep? : Role)
    {
        this.xoffset = xoffset;
        this.yoffset = yoffset;
        this.roleCreep = roleCreep;
    }

    getWorldPos(position: RoomPosition): RoomPosition
    {
        return { x: position.x + this.xoffset, y: position.y + this.yoffset };
    }
}
