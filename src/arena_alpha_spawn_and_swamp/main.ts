import { ATTACK, CARRY, MOVE, RANGED_ATTACK, RESOURCE_ENERGY, TERRAIN_WALL, WORK } from "game/constants";
import { Creep, RoomPosition, StructureContainer, StructureExtension, StructureSpawn } from "game/prototypes";
import { findInRange, getCpuTime, getObjectsByPrototype, getRange, getTerrainAt, getTicks } from "game/utils"
import { Transporter } from "./roles/transporter";
import { RangedAttacker } from "./roles/rangedAttacker";
import { common } from "../utils/common";
import { TaskManager } from "./TaskManager";
import { SharedCostMatrix } from "./SharedCostMatrix";
import { DefendTopLaneTask } from "./DefendTopLaneTask";
import { DefendBottomLaneTask } from "./DefendBottomLaneTask";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { AttackSpawnTask } from "./AttackSpawnTask";
import { DefendSpawnTask } from "./DefendSpawnState";
import { Visual } from "game/visual";
import { EmptySpawnContainersTask } from "./EmptySpawnContainersTask";
import { manageFobTask } from "./manageFobTask";
import { Role } from "../utils/types";
import { TerrainCalculations } from "./TerrainCalculations";

var spawn: StructureSpawn
var enemySpawn: StructureSpawn;
var transporters: Transporter[] = [];

var taskManager: TaskManager = new TaskManager();
var roleCreeps: Role[] = [];
var spawnContainers: StructureContainer[];

var topHalfForwardBasePosition: RoomPosition;
var bottomHalfForwardBasePosition: RoomPosition;

export function loop()
{
    initMemory ();

    SharedCostMatrix.update();

    manageSpawning ();

    let visual = new Visual();
    // visual.rect(
    //     { x: topHalfForwardBasePosition.x-0.5, y: topHalfForwardBasePosition.y-0.5 },
    //     1, 1, { opacity: 0.8, fill: "#0cff00" })

    // visual.rect(
    //     { x: bottomHalfForwardBasePosition.x-0.5, y: bottomHalfForwardBasePosition.y-0.5 }
    //     , 1, 1, { opacity: 0.8, fill: "#0cff00" })

    TerrainCalculations.show();

    let enemyAttackers = getObjectsByPrototype(Creep)
        .filter(creep => !creep.my && creep.exists && common.hasAttackParts(creep));

    let enemyAttackersTopSide = enemyAttackers.filter(creep => creep.exists && creep.y < 25);
    let friendlyAttackersTopSide = roleCreeps.filter(roleCreep => roleCreep.creep.y < 25);

    let enemyAttackersBottomSide = enemyAttackers.filter(creep => creep.exists && creep.y > 75);
    let friendlyAttackersBottomSide = roleCreeps.filter(roleCreep => roleCreep.creep.y > 75);

    let netTopSideDamage = common.netDamageOutput(friendlyAttackersTopSide.map(roleCreep => roleCreep.creep), enemyAttackersTopSide);
    let netBottomSideDamage = common.netDamageOutput(friendlyAttackersBottomSide.map(roleCreep => roleCreep.creep), enemyAttackersBottomSide);

    console.log("netTopSideDamage: " + netTopSideDamage + ", netBottomSideDamage: " + netBottomSideDamage);
    let enemyAttackersNearSpawn = enemyAttackers.filter(creep => spawn.getRangeTo(creep) < 30);

    if (enemyAttackersNearSpawn && enemyAttackersNearSpawn.length)
    {
        let priority = 1;
        if (!taskManager.activeTasks.some(task => task instanceof DefendSpawnTask))
        {
            let defendSpawnTask = new DefendSpawnTask(priority);
            taskManager.addTask(defendSpawnTask);
        }
    }

    if (enemyAttackersTopSide.length)
    {
        let priority = netTopSideDamage < netBottomSideDamage ? 2 : 3;
        if (!taskManager.activeTasks.some(task => task instanceof DefendTopLaneTask))
        {
            let defendTopTask = new DefendTopLaneTask(priority);
            taskManager.addTask(defendTopTask);
        }

        var topTask = taskManager.activeTasks.find(task => task instanceof DefendTopLaneTask);
        if (topTask !== undefined)
        {
            topTask.priority = priority;
        }
    }
    if (enemyAttackersBottomSide.length)
    {
        let priority = netBottomSideDamage < netTopSideDamage ? 2 : 3;

        if (!taskManager.activeTasks.some(task => task instanceof DefendBottomLaneTask))
        {
            let defendBottomTask = new DefendBottomLaneTask(priority);
            taskManager.addTask(defendBottomTask);
        }

        var BottomTask = taskManager.activeTasks.find(task => task instanceof DefendBottomLaneTask);
        if (BottomTask !== undefined)
        {
            BottomTask.priority = priority;
        }
    }

    let totalDamageDifferance = common.netDamageOutput(roleCreeps.filter(x => x.creep.exists).map(x => x.creep), enemyAttackers);
    if (!taskManager.activeTasks.some(task => task instanceof AttackSpawnTask) && (getTicks() > 1600 || totalDamageDifferance > 50))
    {
        let attackSpawnTask = new AttackSpawnTask(4);
        taskManager.addTask(attackSpawnTask);
    }


    /*
        - 4000 possible energy every 50 ticks
        - build extension/container group at 1/4 and 3/4 locations in middle my side
        - have transporters dump energy out of spawned containers to later haul back
        - assign protectors

    */

    let filledSpawnContainers = getObjectsByPrototype(StructureContainer).filter(container =>
        container.store.getUsedCapacity(RESOURCE_ENERGY) && spawn.getRangeTo(container) < 10);

    let manageFobTasks = taskManager.activeTasks.filter(task => task instanceof manageFobTask);
    console.log(manageFobTasks.length);
    if (manageFobTasks.length < 2 && getTicks() > 250)
    {
        if (!manageFobTasks.some(task => task.name == "Manage FOB Top"))
        {
            let fobTask = new manageFobTask(2, topHalfForwardBasePosition);
            taskManager.addTask(fobTask);
        }

        if (!manageFobTasks.some(task => task.name == "Manage FOB Bottom"))
        {
            let fobTask = new manageFobTask(2, bottomHalfForwardBasePosition);
            taskManager.addTask(fobTask);
        }
    }

    taskManager.roleCreeps = roleCreeps;
    taskManager.logTasks();
    taskManager.run();

    // if (roleCreeps.length > 0)
    // {
    //     common.visualizeDamageNearPosition(roleCreeps[0].creep);
    //     common.visualizeCostMatrix(SharedCostMatrix.getCostMatrix(), roleCreeps[0].creep, 6);
    // }

    // for (var roleCreep of roleCreeps)
    // {
    //     // common.visualizeCostMatrix(SharedCostMatrix.getCostMatrix(), roleCreep.creep, 5);
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

    if (!spawnContainers)
    {
        spawnContainers = getObjectsByPrototype(StructureContainer).filter(container => getRange(container, spawn) < 10);
    }

    if (getTicks() === 1)
    {
        const spawnedLeftSide = spawn.x < 50 ? true : false;
        var topBaseX = 0;
        var bottomBaseX = 0;
        TerrainCalculations.setChokePoints();

        if (spawnedLeftSide)
        {
            let xTop = 14;
            let xBottom = 14;
            while(getTerrainAt({ x: xTop, y: 25 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xTop - 1, y: 25 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xTop - 2, y: 25 }) == TERRAIN_WALL)
            {
                xTop++;
            }

            while(getTerrainAt({ x: xBottom, y: 75 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xBottom - 1, y: 75 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xBottom - 2, y: 75 }) == TERRAIN_WALL)
            {
                xBottom++;
            }

            topBaseX = xTop;
            bottomBaseX = xBottom;
        } else {
            let xTop = 85;
            let xBottom = 85;
            while(getTerrainAt({ x: xTop, y: 25 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xTop + 1, y: 25 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xTop + 2, y: 25 }) == TERRAIN_WALL)
            {
                xTop--;
            }

            while(getTerrainAt({ x: xBottom, y: 75 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xBottom + 1, y: 75 }) == TERRAIN_WALL ||
                getTerrainAt({ x: xBottom + 2, y: 75 }) == TERRAIN_WALL)
            {
                xBottom--;
            }

            topBaseX = xTop;
            bottomBaseX = xBottom;
        }

        topHalfForwardBasePosition = { x: topBaseX, y: 25 };
        bottomHalfForwardBasePosition = { x: bottomBaseX, y: 75 };


        let fillSpawnTask = new EmptySpawnContainersTask(1);
        taskManager.addTask(fillSpawnTask);
    }

}

function manageSpawning()
{
    let energyReserves = 0;
    spawnContainers.forEach(container => energyReserves += container.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0);

    console.log(`Energy Reserves: ${energyReserves}`)
    let energyAvailable = (spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0)
    let myExtensions = getObjectsByPrototype(StructureExtension).filter(c => c.my);
    for (let extension of myExtensions)
    {
        energyAvailable += extension.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
    }
    console.log(`Energy Avail: ${energyAvailable}`)

    if (transporters.length == 0 && energyAvailable >= 500)
    {
        let transporter = common.spawnRoleCreep("TRANSPORTER", [MOVE, CARRY, MOVE, MOVE, CARRY, MOVE, WORK, CARRY, MOVE])
        if (transporter)
        {
            transporters.push(transporter as Transporter);
            roleCreeps.push(transporter);
        }
    }
    else if (transporters.length < 2)
    {
        if (energyAvailable >= 1000)
        {
            let transporter = common.spawnRoleCreep("TRANSPORTER", [MOVE, CARRY, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE, MOVE, CARRY, MOVE, MOVE, CARRY, MOVE, WORK, CARRY, MOVE, MOVE, MOVE])
            if (transporter)
            {
                transporters.push(transporter as Transporter);
                roleCreeps.push(transporter);
            }
        }
    }
    else if (energyAvailable >= 900)
    {
        let role = common.spawnRoleCreep("RANGED_ATTACKER");
        if (role)
        {
            // console.log("Role: " + role)
            roleCreeps.push(role);
            let xVal = spawn.x < 50 ? 12 : 88;
            let moveToSpawnState = new CreepMoveState(role, { position: { x: xVal, y: spawn.y }, range: 3 });
            role.stateMachine.pushState(moveToSpawnState);
        }
    }
    else if (energyAvailable >= 400 && energyReserves == 0)
    {
        let role = common.spawnRoleCreep("RANGED_ATTACKER", [MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK]);
        if (role)
        {
            // console.log("Role: " + role)
            roleCreeps.push(role);
            let xVal = spawn.x < 50 ? 12 : 88;
            let moveToSpawnState = new CreepMoveState(role, { position: { x: xVal, y: spawn.y }, range: 3 });
            role.stateMachine.pushState(moveToSpawnState);
        }
    }
}
