import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { ATTACK, OK, RANGED_ATTACK, RANGED_ATTACK_DISTANCE_RATE, RANGED_ATTACK_POWER, ATTACK_POWER } from "game/constants";
import { CostMatrix, searchPath } from "game/path-finder";
import { Creep, GameObject, RoomPosition, Structure, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getDirection, getObjectsByPrototype, getRange, findInRange } from "game/utils";
import { Visual } from "game/visual";
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

        if (this.hps == 0)
        {
            this.updateStats();
        }

        if (!this.leader || !this.leader.creep.exists)
        {
            this.leader = this.creeps[0];
        }

        if (!this.leader.creep.body?.some(bp => bp.type == RANGED_ATTACK || bp.type == ATTACK))
        {
            this.leader = this.creeps.filter(roleCreep => roleCreep.creep.exists && roleCreep.creep.body.some(bp => bp.type == RANGED_ATTACK || bp.type == ATTACK))[0];
        }

        let outOfPos = this.getInFormation();
        if (outOfPos) { return; }

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
        if (closestToSpawn)
        {
            this.squadMove(closestToSpawn);
        }

        let distanceToClosestEnemy = 9999;
        for (let roleCreep of this.creeps)
        {
            if (!roleCreep.creep.exists) { continue; }

            roleCreep.run();

            switch (roleCreep.role)
            {
                case "RANGED_ATTACKER":
                    let rangedAttacker = roleCreep as RangedAttacker;
                    if (closestToSpawn)
                    {
                        if (getRange(rangedAttacker.creep, closestToSpawn) <= 3)
                        {
                            rangedAttacker.attackEnemies(enemies);
                        }
                    }
                    if (attackSpawn)
                    {
                        rangedAttacker.creep.rangedAttack(enemySpawn);
                        // this.squadMove(enemySpawn);
                    }

            }

            let creep = roleCreep.creep;
            let healthPercentage = creep.hits/creep.hitsMax;
            let closestEnemy = findClosestByPath(creep, enemies);
            let potentialNetHealthChange = this.hps - this.potentialDamageInRange(creep);

            // console.log(`${creep.id} potentialNetHealthChange: ${potentialNetHealthChange}, healthPercentage: ${healthPercentage}, enemiesInRange: ${this.enemiesInRangeOfPosition(creep).length}`);
            // let otherCreepClose = this.tooCloseToAnotherSquad(creep);
            // if (otherCreepClose != undefined)
            // {
            //     this.squadRetreat([otherCreepClose]);
            //     return;
            // }
            // console.log(closestEnemy && getRange(creep, closestEnemy) <= 2);

            if (healthPercentage < .45 && potentialNetHealthChange < 0 ||
                (closestEnemy && getRange(creep, closestEnemy) <= 2) ||
                potentialNetHealthChange < 0)
            {
                this.squadRetreat(enemies);
                return;
            }

        }
        this.visualize();
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

        for (let roleCreep of this.creeps)
        {
            let creep = roleCreep.creep;
            if (getRange(creep, this.leader.creep) > this.spread)
            {
                creep.moveTo(this.leader.creep);
                outOfPos = true;
            }
        }

        return outOfPos;
    }

    squadRetreat(enemies: Creep[], range=4): void
    {
        if (!this.leader?.creep.exists) { return; }

        let goals: { pos: RoomPosition; range: number; }[] = [];
        enemies.forEach(creep => goals.push({ "pos": creep, "range": range }));
        let fleePath = searchPath(this.leader.creep, goals, { "flee": true, "costMatrix": this.costMatrix });

        if (fleePath.path.length)
        {
            this.squadMove(fleePath.path[0]);
            new Visual().poly(fleePath.path);
        }
    }


    updateCostMatrix(): void
    {
        super.updateCostMatrix();
        this.locationsWeWereStuck?.forEach(loc => {
            this.costMatrix.set(loc.x, loc.y, 255)
        });
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
    tooCloseToAnotherSquad(position: RoomPosition): Creep | undefined
    {
        let squadIds = this.creeps.map(creep => (creep as Creep).id);
        let myCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my && !squadIds.includes(creep.id));

        let closestCreep = undefined;
        for (let creep of myCreeps)
        {
            if (getRange(creep, position) <= 3)
            {
                closestCreep = creep;
            }
        }

        return closestCreep;
    }

    squadMove(target: RoomPosition): void
    {
        if (!this.leader || !this.leader.creep.exists) { return; }

        let ret = searchPath(this.leader.creep, target);
        if (ret.path.length)
        {
            let direction = getDirection(ret.path[0].x - this.leader.creep.x, ret.path[0].y - this.leader.creep.y);
            for (let roleCreep of this.creeps)
            {
                if (!roleCreep.creep || !roleCreep.creep.exists) { continue; }
                // console.log(roleCreep.creep);
                let ret2 = roleCreep.creep.move(direction);
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

        if (this.leader && this.leader.creep.exists)
        {
            let creep = this.leader.creep
            let vis = new Visual(0, false);
            vis.circle(
                { 'x': creep.x, 'y': creep.y + 0.6 },
                {
                    opacity: .9,
                    radius: 0.1,
                    fill: "#ffffff"
                }
            );
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
