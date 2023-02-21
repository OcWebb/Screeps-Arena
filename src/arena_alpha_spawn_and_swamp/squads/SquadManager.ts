// import { SquadAttackState } from "arena_alpha_spawn_and_swamp/StateMachine/Squad/SquadAttackState";
// import { SquadRetreatState } from "arena_alpha_spawn_and_swamp/StateMachine/Squad/SquadRetreatState";
// import { SquadContext } from "arena_alpha_spawn_and_swamp/StateMachine/Squad/SquadStateMachine";
// import { Creep, StructureSpawn } from "game/prototypes";
// import { findClosestByPath, findInRange, getObjectsByPrototype, getRange } from "game/utils";
// import { common } from "utils/common";
// import { RoleName } from "../../utils/types"
// import { Squad } from "./squad";
// import { TightSquad } from "./tightSquad";

// type states = "TOP" | "BOTTOM" | "DEFEND_SPAWN" | "ATTACK_SPAWN" |  "DEFAULT";

// export class SquadManager
// {
//     private squads: Squad[];
//     composition: RoleName[] = ["RANGED_ATTACKER", "RANGED_ATTACKER", "HEALER"];
//     gameState:
//     {
//         enemyCreeps: Creep[],
//         enemiesOnTopHalf: Creep[],
//         enemiesOnBottomHalf: Creep[],
//         enemiesPastMiddle: Creep[],
//         enemySpawn: StructureSpawn
//     }

//     squadState: { [key: number]: states }

//     constructor()
//     {
//         this.squads = [];
//         this.squadState = {};
//         this.gameState = common.getGameState();
//     }

//     run()
//     {
//         this.gameState = common.getGameState();
//         let allSquadsFull = true;

//         for (let squad of this.squads)
//         {
//             if (!squad.isFull()) { allSquadsFull = false; }

//             squad.refresh();

//             this.topLevelTransitions(squad);

//             let context: SquadContext = {
//                 squad: squad,
//                 enemies: this.gameState.enemyCreeps,
//                 enemiesTopSide: this.gameState.enemiesOnTopHalf,
//                 enemiesBottomSide: this.gameState.enemiesOnBottomHalf
//             }
//             squad.stateMachine.setContext(context);
//             squad.run();
//             squad.stateMachine.logState();
//             console.log("\n");

//             squad.visualize();
//         }

//         if (allSquadsFull)
//         {
//             console.log('Adding Squad!');
//             this.addSquad(new TightSquad(this.composition));
//         }
//     }

//     topLevelTransitions(squad: Squad)
//     {
//         if (!squad.stateMachine.stateQueue.length)
//         {
//             let attackState = new SquadAttackState(
//                 {
//                     squad: squad,
//                     structures: [this.gameState.enemySpawn],
//                 });

//             squad.stateMachine.pushState(attackState);
//             return;
//         }

//         if (this.shouldRetreat(squad) && !(squad.stateMachine.currentState instanceof SquadRetreatState))
//         {
//             let enemiesInRange = findInRange(squad.getPosition(), this.gameState.enemyCreeps, 4);
//             let retreatState = new SquadRetreatState(
//                 {
//                     squad: squad,
//                     enemies: enemiesInRange,
//                     range: 4,
//                     popCondition: this.retreatPopCondition
//                 });
//             squad.stateMachine.pushState(retreatState);
//             return;
//         }
//     }

//     addSquad(squad: Squad)
//     {
//         this.squads.push(squad);
//     }

//     shouldRetreat(squad: Squad): boolean
//     {
//         let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);

//         for (let roleCreep of squad.roleCreeps)
//         {
//             let creep = roleCreep.creep;
//             let healthPercentage = creep.hits/creep.hitsMax;
//             let closestEnemy = findClosestByPath(creep, enemies);
//             let damageInRange = common.potentialDamageInRange(creep)
//             let potentialNetHealthChange = squad.hps - damageInRange;
//             let weOverpower = squad.dps > damageInRange;

//             // console.log(`${creep.id} potentialNetHealthChange: ${potentialNetHealthChange}, healthPercentage: ${healthPercentage}, enemiesInRange: ${common.enemiesInRangeOfPosition(creep).length}, weOverpower: ${weOverpower}, this.dps: ${squad.dps}, damageInRange: ${damageInRange}`);

//             if (healthPercentage < .45 && potentialNetHealthChange < 0 ||
//                 (closestEnemy && getRange(creep, closestEnemy) <= 2) ||
//                 !weOverpower)
//             {
//                 return true;
//             }
//         }

//         return false;
//     }

//     retreatPopCondition(squad: Squad): boolean
//     {
//         let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);

//         for (let roleCreep of squad.roleCreeps)
//         {
//             let creep = roleCreep.creep;
//             let healthPercentage = creep.hits/creep.hitsMax;
//             let closestEnemy = findClosestByPath(creep, enemies);
//             let damageInRange = common.potentialDamageInRange(creep)
//             let potentialNetHealthChange = squad.hps - damageInRange;
//             let weOverpower = squad.dps > damageInRange;

//             // console.log(`${creep.id} potentialNetHealthChange: ${potentialNetHealthChange}, healthPercentage: ${healthPercentage}, enemiesInRange: ${common.enemiesInRangeOfPosition(creep).length}, weOverpower: ${weOverpower}, this.dps: ${squad.dps}, damageInRange: ${damageInRange}`);

//             if (healthPercentage < .45 && potentialNetHealthChange < 0 ||
//                 (closestEnemy && getRange(creep, closestEnemy) <= 2) ||
//                 !weOverpower)
//             {
//                 return false;
//             }
//         }

//         return true;
//     }

//     manageSpawning()
//     {
//         for (let squad of this.squads)
//         {
//             if (!squad.isFull())
//             {
//                 let rolesNeedeed = squad.getNeededCreeps();
//                 common.spawnRoleCreep(rolesNeedeed[0], squad);
//                 return;
//             }
//         }

//         let squad = new TightSquad(["RANGED_ATTACKER", "RANGED_ATTACKER", "HEALER"]);
//         this.addSquad(squad);
//         console.log(`Creating Squad ${squad.id}, composition ${squad.composition}`);


//         let rolesNeedeed = squad.getNeededCreeps();
//         common.spawnRoleCreep(rolesNeedeed[0], squad);
//     }

// }
