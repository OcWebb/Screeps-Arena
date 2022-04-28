import { ATTACK, HEAL, RANGED_ATTACK, ERR_NOT_IN_RANGE, HEAL_POWER, ATTACK_POWER } from "game/constants";
import { Creep, GameObject, Structure, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findInRange, findClosestByPath, getTicks, getRange } from "game/utils"
import { CostMatrix, searchPath } from "game/path-finder"
import { Visual } from "game/visual"
import { Role, RoleName } from "../types"
import { RangedAttacker } from "../roles/RangedAttacker";

export class Squad
{

    id: number;
    size: number;
    spread: number;
    creeps: Role[];
    composition: RoleName[];
    filled: boolean;

    color: string;
    colors: string[] = ["#ff0000", "#00e5ff", "#fff600", "#ffa100", "#9400ff", "#0019ff", "#e05df4"]

    dps: number;
    hps: number;

    costMatrix: CostMatrix = new CostMatrix();

    static colorsInUse: string[] = [];

    constructor (size: number, composition: RoleName[])
    {
        this.id = getTicks();
        this.size = size;
        this.spread = 1;
        this.filled = false;
        this.composition = composition;
        this.creeps = [];

        let randomColorIdx = Math.floor(Math.random() * this.colors.length);
        let curColor = this.colors[randomColorIdx];
        let m = 0;
        while (Squad.colorsInUse.includes(curColor) && m++ < 12)
        {
            randomColorIdx = Math.floor(Math.random() * this.colors.length);
            curColor = this.colors[randomColorIdx];
        }

        this.color = curColor;
        Squad.colorsInUse.push(curColor);

        this.dps = 0;
        this.hps = 0;

        this.updateCostMatrix();
    }

    run()
    {
        this.updateCostMatrix();
        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        // pick target

        for (let roleCreep of this.creeps)
        {
            roleCreep.run();
            // switch (roleCreep.role)
            // {
            //     case "RANGED_ATTACKER":
            //         let rangedAttacker = roleCreep as RangedAttacker;
            // }
        }

    }


    addCreep(roleCreep: Role)
    {
        if (this.isFull())
        {
            return false;
        }

        this.creeps.push(roleCreep);
        roleCreep.squadId = this.id;
        this.updateStats();

        return true;
    }

    updateStats()
    {
        let damageOutput: number = 0;
        let healOutput: number = 0;
        for (let roleCreep of this.creeps)
        {
            if (!roleCreep.creep.exists) { continue; }

            // console.log(`${roleCreep.role}: ${JSON.stringify(roleCreep.creep.body)}`)
            for (let bodyPart of roleCreep.creep.body)
            {
                damageOutput +=
                    bodyPart.type == RANGED_ATTACK ? 10 :
                    bodyPart.type == ATTACK ? ATTACK_POWER : 0;

                healOutput += bodyPart.type == HEAL ? HEAL_POWER : 0;
            }

        }
        this.dps = damageOutput;
        this.hps = healOutput;
    }

    updateCostMatrix()
    {
        let cm = new CostMatrix();
        let structures = getObjectsByPrototype(Structure).filter(s => s.exists);
        structures.forEach(structure => cm.set(structure.x, structure.y, 255));

        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        enemyCreeps.forEach(creep => cm.set(creep.x, creep.y, 255));

        this.costMatrix = cm;
    }

    isFull()
    {
        let creepsNeeded = this.getNeededCreeps();
        this.filled = !creepsNeeded.length;
        return this.filled;
    }

    getNeededCreeps()
    {
        let expectedComposition = this.composition.slice(0);
        this.creeps.forEach(creep =>
        {
            //creep.role
            expectedComposition.forEach((roleName, idx) =>
            {
                if (roleName == creep.role)
                {
                    expectedComposition.splice(idx, 1);
                }
            })
        });

        return expectedComposition;
    }

    squadMove(target: RoomPosition)
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
        let rangedCreeps = this.creeps.filter(creep => creep.role === "RANGED_ATTACKER") as RangedAttacker[];
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

    visualize()
    {
        for (let roleCreep of this.creeps)
        {
            let creep = roleCreep.creep;
            if (!creep.exists) { continue; }

            let vis = new Visual(0, false);
            vis.circle(
                { 'x': creep.x, 'y': creep.y + 0.75 },
                {
                    opacity: .9,
                    radius: 0.3,
                    fill: this.color
                }
            );

            vis.text(
                this.id.toString(),
                { 'x': creep.x, 'y': creep.y + 0.85 },
                {
                    font: 0.2,
                    opacity: 1,
                }
            );
        }
    }

    logState()
    {
        console.log(`Squad ${this.id} - DPS: ${this.dps} | HPS: ${this.hps} | Target Composition ${this.composition} | RolesNeeded: ${this.getNeededCreeps()}\n`);
    }
}
