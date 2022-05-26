import { ATTACK, RANGED_ATTACK, RESOURCE_ENERGY } from "game/constants";
import { Creep, StructureContainer, StructureSpawn } from "game/prototypes";
import { findInRange, getCpuTime, getObjectsByPrototype, getRange } from "game/utils"
import { Transporter } from "./roles/transporter";
import { common } from "utils/common";
import { TaskManager } from "./TaskManager";
import { Role } from "utils/types";
import { SharedCostMatrix } from "./SharedCostMatrix";
import { arenaInfo } from "game";

var spawn: StructureSpawn
var enemySpawn: StructureSpawn;
var transporters: Transporter[] = [];

var taskManager: TaskManager = new TaskManager();
var roleCreeps: Role[] = [];
var spawnContainers: StructureContainer[];

export function loop()
{
    initMemory ();

    let cpu1 = (arenaInfo.cpuTimeLimit - getCpuTime()) / 1000000;

    SharedCostMatrix.update();

    let cpu2 = cpu1 - (arenaInfo.cpuTimeLimit - getCpuTime()) / 1000000;
    console.log("cpuUsed" + cpu2);

    manageSpawning ();

    let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my && creep.exists && creep.body.some(bp => bp.type == RANGED_ATTACK || bp.type == ATTACK));
    // for (let creep of enemyCreeps)
    // {
    //     // common.visualizeCostMatrix(SharedCostMatrix.getCostMatrix(), creep, 5);
    //     common.visualizeDamageNearPosition(creep, 6);
    // }

    for (let creep of transporters)
    {
        creep.run();
    }

    for (let roleCreep of roleCreeps)
    {
        if (roleCreep.creep.exists && findInRange(roleCreep.creep, enemyCreeps, 6).length)
        {
            roleCreep.run();
            // common.visualizeCostMatrix(SharedCostMatrix.getCostMatrix(), roleCreep.creep, 4);
            common.visualizeDamageNearPosition(roleCreep.creep, 5);
        }
    }

    taskManager.run();
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

    if (!spawnContainers)
    {
        spawnContainers = getObjectsByPrototype(StructureContainer).filter(container => getRange(container, spawn) < 10);
    }
}

function manageSpawning()
{
    let energyReserves = 0;
    spawnContainers.forEach(container => energyReserves += container.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0);

    console.log(`Energy Reserves: ${energyReserves}`)

    if (energyReserves < 2000)
    {
        if (transporters.length < 5)
        {
            if ((spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 500)
            {
                let transporter = common.spawnRoleCreep("TRANSPORTER")
                if (transporter)
                {
                    transporters.push(transporter as Transporter);
                }
            }
        }
        else if ((spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 900)
        {
            let role = common.spawnRoleCreep("RANGED_ATTACKER");
            if (role)
            {
                roleCreeps.push(role);
            }
        }

        return;
    }

    if (transporters.length < 1 && (spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 500)
    {
        let transporter = common.spawnRoleCreep("TRANSPORTER")
        if (transporter)
        {
            transporters.push(transporter as Transporter);
        }
    }
    else if ((spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 900)
    {
        let role = common.spawnRoleCreep("RANGED_ATTACKER");
        if (role)
        {
            roleCreeps.push(role);
        }
    }
}
