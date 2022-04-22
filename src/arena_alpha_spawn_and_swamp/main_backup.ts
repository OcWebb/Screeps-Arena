// import { ATTACK, HEAL, RANGED_ATTACK, MOVE, CARRY, ERR_NOT_IN_RANGE, BODYPART_COST, RESOURCE_ENERGY } from "game/constants";
// import { Creep, GameObject, StructureContainer, StructureSpawn } from "game/prototypes";
// import { getObjectsByPrototype, findInRange, findClosestByPath, getRange, getTicks, findClosestByRange } from "game/utils"
// import { RoleName } from "./types";
// import { Squad } from "./squad.js";

// const SQUAD_SIZE = 4;

// // const ROLE_PARTS: { [key in RoleName]: BodyPart[] } =
// // {
// //     "TRANSPORTER": [CARRY, MOVE, MOVE],
// //     "MELEE_ATTACKER": [ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
// //     "RANGED_ATTACKER": [RANGED_ATTACK, MOVE, MOVE, MOVE],
// //     "HEALER": [HEAL, MOVE, MOVE, MOVE],
// // }

// const SQUAD_COMPOSITION =
// {
//     "RANGED_ATTACKER": 2,
//     "MELEE_ATTACKER": 1,
//     "HEALER": 1,
// }

// var containers: StructureContainer[];
// var spawn: StructureSpawn
// var enemySpawn: StructureSpawn;
// var population: { [key in RoleName]: Creep[] } =
// {
//     "TRANSPORTER": [],
//     "MELEE_ATTACKER": [],
//     "RANGED_ATTACKER": [],
//     "HEALER": [],
// }
// var squads: Squad[] = [];

// export function loop()
// {
//     initMemory ();
//     squads.forEach((squad, index, object) =>
//         {
//             squad.run();
//             if (!squad.creeps.length)
//             {
//                 object.splice(index, 1);
//             }
//         });

//     let creeps = getObjectsByPrototype(Creep).filter(creep => creep.my)
//     let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my)

//     population =
//     {
//         "TRANSPORTER": [],
//         "MELEE_ATTACKER": [],
//         "RANGED_ATTACKER": [],
//         "HEALER": [],
//     };

//     for(let creep of creeps)
//     {
//         // text(
//         //     creep.id + " s: " + creep.squadId,
//         //     { x: creep.x, y: creep.y - 0.5 }, // above the creep
//         //     {
//         //         font: '0.5',
//         //         opacity: 0.7,
//         //         backgroundColor: '#808080',
//         //         backgroundPadding: '0.03'
//         //     });

//         if (roles[creep.role])
//         {
//             roles[creep.role].run(creep);
//         }

//         if (!population[creep.role])
//         {
//             population[creep.role] = []
//         }

//         population[creep.role].push(creep);
//     };

//     manageSpawning ();

//     let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);

//     for (let squad of squads)
//     {
//         if (squad.filled)
//         {
//             let enemiesNearSpawn = findInRange(spawn, enemyCreeps, 35);
//             console.log(enemiesNearSpawn.length)
//             if (getTicks() < 1000)
//             {
//                 if (enemiesNearSpawn.length)
//                 {
//                     let closestEnemy = findClosestByPath(spawn, enemies);
//                     console.log(closestEnemy);
//                     if (closestEnemy)
//                     {
//                         squad.squadAttack(closestEnemy);
//                         squad.squadMove(closestEnemy);
//                     }

//                 } else {
//                     squad.squadMove(spawn);
//                 }
//                 continue;
//             }

//             if (enemies.length)
//             {
//                 let closestEnemy = findClosestByPath(squad.creeps[0], enemies);
//                 if (getRange(squad.creeps[0], closestEnemy) <= 3)
//                 {
//                     squad.squadAttack(closestEnemy);
//                 } else {
//                     squad.squadMove(closestEnemy);
//                 }
//             }
//             else
//             {
//                 if (getRange(squad.creeps[0], enemySpawn) <= 3)
//                 {
//                     squad.squadAttack(enemySpawn);
//                 }
//                 else
//                 {
//                     squad.squadMove(enemySpawn)
//                 }
//             }
//         }
//         else
//         {
//             let enemiesNearSpawn = findInRange(spawn, enemyCreeps, 10);
//             if (enemiesNearSpawn.length)
//             {
//                 let target = findClosestByRange(spawn, enemyCreeps);
//                 for (let creep of squad.creeps)
//                 {
//                     if (creep.attack(target) == ERR_NOT_IN_RANGE)
//                     {
//                         creep.moveTo(target);
//                     }
//                 }
//             }
//         }
//     }
// }

// function initMemory()
// {
//     if (!spawn)
//     {
//         spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
//     }

//     if (!enemySpawn)
//     {
//         enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
//     }

//     if (!containers)
//     {
//         containers = getObjectsByPrototype(StructureContainer);
//     }
// }

// function getCreepParts(maxEnergy: number, parts: BodyPart[])
// {
//     let body = [];
//     let ratioCost = 0;

//     for(let bodyPart of parts)
//     {
//         ratioCost += BODYPART_COST[bodyPart];
//     }

//     let partsMultiple = Math.floor(maxEnergy / ratioCost)
//     for(let i = 0; i < parts.length; i++)
//     {
//         for(let j = 0; j < partsMultiple; j++)
//         {
//             body.push(parts[i]);
//         }
//     }

//     return body;
// }

// function manageSpawning()
// {
//     if (population["TRANSPORTER"].length < 2 && spawn.store.getFreeCapacity(RESOURCE_ENERGY) <= 500)
//     {
//         let creepParts = getCreepParts(spawn.store.getUsedCapacity(RESOURCE_ENERGY), ROLE_PARTS["TRANSPORTER"]);
//         let spawnedCreep = spawn.spawnCreep(creepParts);

//         if (!spawnedCreep.error)
//         {
//             let creep = spawnedCreep.object;
//             creep.role = "TRANSPORTER";
//         }

//         return;
//     }
//     else if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) <= 900)
//     {
//         let openSquads = squads.filter(squad => !squad.filled);
//         let squad = openSquads[0];
//         if (!openSquads.length)
//         {
//             squad = new Squad(SQUAD_SIZE, SQUAD_COMPOSITION);
//             squads.push(squad);
//         }

//         if (!squad.filled)
//         {
//             let nextRoleToSpawn = squad.getNextToSpawn();
//             if (nextRoleToSpawn)
//             {
//                 let creepParts = getCreepParts(spawn.store.getUsedCapacity(RESOURCE_ENERGY), ROLE_PARTS[nextRoleToSpawn]);
//                 let spawnedCreep = spawn.spawnCreep(creepParts);
//                 if (!spawnedCreep.error)
//                 {
//                     let creep = spawnedCreep.object;
//                     creep.role = nextRoleToSpawn;
//                     creep.squadId = squad.id;
//                 }
//                 return;
//             }
//         }

//     }
// }

// function assignToSquad(creep)
// {
//     for (let squad of squads)
//     {
//         if (!squad.filled)
//         {
//             squad.addCreep(creep);
//             return;
//         }
//     }

//     let newSquad = new Squad(creep, SQUAD_SIZE, SQUAD_COMPOSITION);
//     squads.push(newSquad);
// }

