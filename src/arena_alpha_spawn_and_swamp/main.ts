import { ATTACK, HEAL, RANGED_ATTACK, MOVE, CARRY, ERR_NOT_IN_RANGE, BODYPART_COST, RESOURCE_ENERGY, BodyPartConstant } from "game/constants";
import { Creep, GameObject, StructureContainer, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, findInRange, findClosestByPath, getRange, getTicks, findClosestByRange } from "game/utils"
import { RoleName, Role } from "./types";
import { Squad } from "./squad.js";
import { Transporter } from "./roles/transporter";
import { MeleeAttacker } from "./roles/meleeAttacker";
import { RangedAttacker } from "./roles/RangedAttacker";
import { Healer } from "./roles/Healer";

const SQUAD_SIZE = 4;

const ROLE_PARTS: { [key in RoleName]: BodyPartConstant[] } =
{
    "TRANSPORTER": [CARRY, MOVE, MOVE],
    "MELEE_ATTACKER": [ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
    "RANGED_ATTACKER": [MOVE, MOVE, MOVE, RANGED_ATTACK],
    "HEALER": [MOVE, MOVE, MOVE, HEAL],
}

const SQUAD_COMPOSITION : { [key in RoleName]?: number } =
{
    "RANGED_ATTACKER": 2,
    "MELEE_ATTACKER": 1,
    "HEALER": 1,
}

var containers: StructureContainer[];
var spawn: StructureSpawn
var enemySpawn: StructureSpawn;
var population: { [key in RoleName]: Creep[] } =
{
    "TRANSPORTER": [],
    "MELEE_ATTACKER": [],
    "RANGED_ATTACKER": [],
    "HEALER": [],
}

export var squads: Squad[] = [];

var transporters: Transporter[] = [];
var meleeAttackers: MeleeAttacker[] = [];
var rangedAttackers: RangedAttacker[] = [];
var healers: Healer[] = [];

export function loop()
{
    initMemory ();
    manageSpawning ();

    // let creeps = getObjectsByPrototype(Creep).filter(creep => creep.my)
    let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my)


    for (let creep of transporters)
    {
        creep.run();
    }

    for (let creep of meleeAttackers)
    {
        creep.run();
    }

    for (let creep of rangedAttackers)
    {
        creep.run();
    }

    for (let creep of healers)
    {
        creep.run();
    }

    // for (let squad of squads)
    // {
    //     if (squad.filled)
    //     {
    //         let enemiesNearSpawn = findInRange(spawn, enemyCreeps, 35);
    //         console.log(enemiesNearSpawn.length)
    //         if (getTicks() < 1000)
    //         {
    //             if (enemiesNearSpawn.length)
    //             {
    //                 let closestEnemy = findClosestByPath(spawn, enemyCreeps);
    //                 console.log(closestEnemy);
    //                 if (closestEnemy)
    //                 {
    //                     squad.squadAttack(closestEnemy);
    //                     squad.squadMove(closestEnemy);
    //                 }

    //             } else {
    //                 squad.squadMove(spawn);
    //             }
    //             continue;
    //         }

    //         if (enemyCreeps.length)
    //         {
    //             let closestEnemy = findClosestByPath(squad.creeps[0], enemyCreeps);
    //             if (getRange(squad.creeps[0], closestEnemy) <= 3)
    //             {
    //                 squad.squadAttack(closestEnemy);
    //             } else {
    //                 squad.squadMove(closestEnemy);
    //             }
    //         }
    //         else
    //         {
    //             if (getRange(squad.creeps[0], enemySpawn) <= 3)
    //             {
    //                 squad.squadAttack(enemySpawn);
    //             }
    //             else
    //             {
    //                 squad.squadMove(enemySpawn)
    //             }
    //         }
    //     }
    //     else
    //     {
    //         let enemiesNearSpawn = findInRange(spawn, enemyCreeps, 10);
    //         if (enemiesNearSpawn.length)
    //         {
    //             let target = findClosestByRange(spawn, enemyCreeps);
    //             for (let creep of squad.creeps)
    //             {
    //                 if (creep.attack(target) == ERR_NOT_IN_RANGE)
    //                 {
    //                     creep.moveTo(target);
    //                 }
    //             }
    //         }
    //     }
    // }
}

function initMemory()
{
    if (!spawn)
    {
        spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
    }

    if (!enemySpawn)
    {
        enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
    }

    if (!containers)
    {
        containers = getObjectsByPrototype(StructureContainer);
    }
}

function getCreepParts(maxEnergy: number, parts: BodyPartConstant[])
{
    let body: BodyPartConstant[] = [];
    let ratioCost = 0;

    for(let bodyPart of parts)
    {
        ratioCost += BODYPART_COST[bodyPart];
    }

    let partsMultiple = Math.floor(maxEnergy / ratioCost)
    for(let i = 0; i < parts.length; i++)
    {
        for(let j = 0; j < partsMultiple; j++)
        {
            body.push(parts[i]);
        }
    }

    return body;
}

function manageSpawning()
{
    if (transporters.length < 1 && (spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 500)
    {
        spawnRoleCreep("TRANSPORTER")
        return;
    }
    else if ((spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 900)
    {
        if (rangedAttackers.length > healers.length)
        {
            spawnRoleCreep("HEALER");
        }
        else
        {
            spawnRoleCreep("RANGED_ATTACKER");
        }

        return;
    }
}

function spawnRoleCreep (role: RoleName): boolean
{
    let creepParts = getCreepParts(spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0, ROLE_PARTS[role]);
    let spawnedCreep = spawn.spawnCreep(creepParts);
    let creep = spawnedCreep.object;

    if (!spawnedCreep.error && creep)
    {
        switch (role)
        {
            case "TRANSPORTER":
                transporters.push(new Transporter(creep));
                break;
            case "MELEE_ATTACKER":
                meleeAttackers.push(new MeleeAttacker(creep));
                break;
            case "RANGED_ATTACKER":
                rangedAttackers.push(new RangedAttacker(creep));
                break;
            case "HEALER":
                healers.push(new Healer(creep));
                break;
        }


        return true;
    }

    return false;
}
