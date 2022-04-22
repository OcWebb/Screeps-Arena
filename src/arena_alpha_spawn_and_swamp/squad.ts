import { ATTACK, HEAL, RANGED_ATTACK, ERR_NOT_IN_RANGE } from "game/constants";
import { Creep, GameObject, Structure, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findInRange, findClosestByPath, getTicks } from "game/utils"
import { searchPath } from "game/path-finder"
import { Role, RoleName } from "./types"

export class Squad
{

    id: number;
    size: number;
    spread: number;
    creeps: Role[];
    composition: RoleName[];
    filled: boolean;

    constructor (size: number, composition: RoleName[])
    {
        this.id = getTicks();
        this.size = size;
        this.spread = 1;
        this.filled = false;
        this.composition = composition;
        this.creeps = [];
    }

    run()
    {
        // this.creeps = getObjectsByPrototype(Creep).filter(c => c.my && c.squadId == this.id) as RoleAttacker;

        if (this.creeps.length >= this.size)
        {
            this.filled = true;
        }
    }

    getNextToSpawn()
    {
        // for (let role of Object.keys(this.composition))
        // {
        //     let creepsWithThisRole = this.creeps.filter(creep => creep.role == role).length;
        //     if (creepsWithThisRole < this.composition[role])
        //     {
        //         return role;
        //     }
        // }
    }

    squadMove(target: GameObject)
    {
        let closestCreepToTarget = findClosestByPath(target, this.creeps);
        let creepsThatNeedToCatchUp = [];
        for (let squadMember of this.creeps)
        {
            let squadIsInRange = findInRange(squadMember, this.creeps, this.spread);
            // console.log(squadMember.id + " in range? " + squadIsInRange.length)
            if (squadIsInRange.length <= 1 && squadMember.id != closestCreepToTarget.id)
            {
                creepsThatNeedToCatchUp.push(squadMember);
            }
        }

        if (creepsThatNeedToCatchUp.length)
        {
            for (let squadMember of creepsThatNeedToCatchUp)
            {
                squadMember.moveTo(closestCreepToTarget);
            }
        }
        else
        {
            for (let squadMember of this.creeps)
            {
                // set costmatrix to prefer near squadmates, save every tick
                squadMember.moveTo(target);
            }
        }
    }

    squadAttack(target: Creep | Structure)
    {
        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let rangedCreeps = this.creeps.filter(creep => creep.body.some(p => p.type == RANGED_ATTACK));
        let meleeCreeps = this.creeps.filter(creep => creep.body.some(p => p.type == ATTACK));
        let healerCreeps = this.creeps.filter(creep => creep.body.some(p => p.type == HEAL));

        let enemyRangedPartCount = 0;
        let enemyAttackPartCount = 0;
        if ("body" in target)
        {
            for (let bodyPart of target.body)
            {
                if (bodyPart.type == RANGED_ATTACK) enemyRangedPartCount++;
                if (bodyPart.type == ATTACK) enemyAttackPartCount++;
                if (bodyPart.type == ATTACK) enemyAttackPartCount++;
            }
        }

        if (meleeCreeps.length)
        {
            for (let creep of meleeCreeps)
            {
                if (creep.attack(target) == ERR_NOT_IN_RANGE)
                {
                    // set costmatrix to prefer near squadmates
                    creep.moveTo(target);
                }
            }
        }

        if (rangedCreeps.length)
        {
            for (let creep of rangedCreeps)
            {
                let enemiesTooClose = findInRange(creep, enemyCreeps, 2);
                let enemiesInRange = findInRange(creep, enemyCreeps, 3);
                // count enemies in range and use ranged
                console.log("enemies to close to " + creep.id)
                if (enemiesTooClose.length)
                {

                    let goals: { pos: RoomPosition; range: number; }[] = []
                    enemiesTooClose.forEach(creep => goals.push({ "pos": creep, "range": 4 }));
                    let ret = searchPath(creep, goals, {flee: true});
                    if (ret.path.length)
                    {
                        creep.rangedAttack(target);
                        creep.moveTo(ret.path[1]);
                    }
                }
                else if (enemiesInRange.length >= 3)
                {
                    creep.rangedMassAttack();
                }
                else if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                {
                    // set costmatrix to prefer near squadmates
                    console.log("attacking spawn")
                    creep.moveTo(target);
                }
            }
        }

        if (healerCreeps.length)
        {
            for (let creep of healerCreeps)
            {
                let lowSquadCreeps = this.creeps.filter(i => i.my && i.hits < i.hitsMax);
                let creepToHeal = creep.findClosestByRange(lowSquadCreeps);
                let enemiesTooClose = findInRange(creep, enemyCreeps, 2);
                // count enemies in range and use ranged

                if (creepToHeal && creep.heal(creepToHeal) == ERR_NOT_IN_RANGE)
                {
                    // set costmatrix to prefer near squadmates
                    creep.rangedHeal(creepToHeal);
                    creep.moveTo(creepToHeal);
                }

                if (enemiesTooClose)
                {
                    let ret = searchPath(creep, target, {flee: true});
                    if (ret.path.length)
                    {
                        if (creepToHeal && creep.heal(creepToHeal) == ERR_NOT_IN_RANGE)
                        {
                            creep.rangedHeal(creepToHeal);
                        }
                        creep.moveTo(ret.path[0]);
                    }
                }
            }
        }
    }
}
