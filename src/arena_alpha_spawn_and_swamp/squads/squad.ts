// import { ATTACK, HEAL, RANGED_ATTACK, ERR_NOT_IN_RANGE, HEAL_POWER, ATTACK_POWER } from "game/constants";
// import { Creep, GameObject, Structure, RoomPosition } from "game/prototypes";
// import { getObjectsByPrototype, findInRange, findClosestByPath, getTicks, getRange } from "game/utils"
// import { CostMatrix, searchPath } from "game/path-finder"
// import { Visual } from "game/visual"
// import { Role, RoleName } from "../../utils/types"
// import { SquadStateMachine } from "arena_alpha_spawn_and_swamp/StateMachine/Squad/SquadStateMachine";
// import { RangedAttacker } from "a../roles/RangedAttacker";

// export class Squad
// {

//     id: number;
//     name: string;
//     size: number;
//     spread: number;
//     roleCreeps: Role[];
//     composition: RoleName[];
//     filled: boolean;
//     type: string = "Squad"

//     stateMachine: SquadStateMachine;

//     color: string;
//     colors: string[] = ["#ff0000", "#00e5ff", "#fff600", "#ffa100", "#9400ff", "#0019ff", "#e05df4"]
//     names: string[] = ["A", "B", "C", "D", "E", "F"]

//     dps: number;
//     hps: number;

//     costMatrix: CostMatrix = new CostMatrix();

//     static colorsInUse: string[] = [];
//     static namesInUse: string[] = [];

//     constructor (composition: RoleName[])
//     {
//         this.id = getTicks();
//         this.size = composition.length;
//         this.spread = 1;
//         this.filled = false;
//         this.composition = composition;
//         this.roleCreeps = [];
//         this.dps = 0;
//         this.hps = 0;

//         let availableColors = this.colors.filter(n => !Squad.colorsInUse.includes(n));
//         this.color = availableColors[0];
//         Squad.colorsInUse.push(availableColors[0]);

//         let availableNames = this.names.filter(n => !Squad.namesInUse.includes(n));
//         this.name = availableNames[0];
//         Squad.namesInUse.push(availableNames[0]);

//         this.updateCostMatrix();

//         this.stateMachine = new SquadStateMachine({ squad: this });
//     }

//     run()
//     {
//         for (let idx = 0; idx < this.roleCreeps.length; idx++)
//         {
//             let roleCreep = this.roleCreeps[idx];
//             if (!roleCreep.creep.exists)
//             {
//                 this.roleCreeps.slice(idx, 1);
//                 this.size--;
//                 continue;
//             }
//             else
//             {
//                 roleCreep.run();
//             }
//         }

//         let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
//         let enemiesInRange = findInRange(this.getPosition(), enemyCreeps, 3);
//         let target = this.chooseTarget(enemiesInRange);
//         if (enemiesInRange.length && target)
//         {
//             for (let roleCreep of this.roleCreeps)
//             {
//                 if (roleCreep instanceof RangedAttacker)
//                 {
//                     roleCreep.attackEnemies(enemiesInRange);
//                 }
//             }
//         }

//         this.stateMachine.runState();
//     }

//     chooseTarget(enemies: Creep[])
//     {
//         let lowest = enemies.sort((a, b) => a.hits - b.hits);
//         return lowest[0];
//     }

//     refresh()
//     {
//         this.updateCostMatrix();
//         this.updateStats();
//     }

//     addCreep(roleCreep: Role)
//     {
//         if (this.isFull())
//         {
//             return false;
//         }

//         this.roleCreeps.push(roleCreep);
//         roleCreep.squadId = this.id;
//         this.updateStats();

//         return true;
//     }

//     getRange(position: RoomPosition[] | RoomPosition): number
//     {
//         let minRange = 999;

//         for(let roleCreep of this.roleCreeps)
//         {
//             if (Array.isArray(position))
//             {
//                 for(let pos of position)
//                 {
//                     let currentRange = getRange(roleCreep.creep, pos);
//                     if (currentRange < minRange)
//                     {
//                         minRange = currentRange;
//                     }
//                 }
//             }
//             else
//             {
//                 let currentRange = getRange(roleCreep.creep, position);
//                 if (currentRange < minRange)
//                 {
//                     minRange = currentRange;
//                 }
//             }


//         }

//         return minRange;
//     }

//     updateStats()
//     {
//         let damageOutput: number = 0;
//         let healOutput: number = 0;
//         for (let roleCreep of this.roleCreeps)
//         {
//             if (!roleCreep.creep.exists) { continue; }

//             // console.log(`${roleCreep.role}: ${JSON.stringify(roleCreep.creep.body)}`)
//             for (let bodyPart of roleCreep.creep.body)
//             {
//                 damageOutput +=
//                     bodyPart.type == RANGED_ATTACK ? 10 :
//                     bodyPart.type == ATTACK ? ATTACK_POWER : 0;

//                 healOutput += bodyPart.type == HEAL ? HEAL_POWER : 0;
//             }

//         }

//         this.dps = damageOutput;
//         this.hps = healOutput;
//     }

//     updateCostMatrix()
//     {
//         // cache this properly
//         let cm = new CostMatrix();
//         let structures = getObjectsByPrototype(Structure).filter(s => s.exists);
//         structures.forEach(structure => cm.set(structure.x, structure.y, 255));
//         this.costMatrix = cm;
//     }

//     isFull()
//     {
//         let creepsNeeded = this.getNeededCreeps();
//         this.filled = !creepsNeeded.length;
//         return this.filled;
//     }

//     getNeededCreeps()
//     {
//         let expectedComposition = this.composition.slice(0);
//         this.roleCreeps.forEach(creep =>
//         {
//             //creep.role
//             for (let idx = 0; idx < expectedComposition.length; idx++)
//             {
//                 let roleName = expectedComposition[idx];
//                 if (roleName == creep.role)
//                 {
//                     expectedComposition.splice(idx, 1);
//                     break;
//                 }
//             }
//         });

//         return expectedComposition;
//     }

//     getPosition () : RoomPosition
//     {
//         return this.roleCreeps.length ? this.roleCreeps[0].creep : { x: 0, y: 0 }
//     }

//     squadMove(target: RoomPosition)
//     {
//         let closestCreepToTarget = findClosestByPath(target, this.roleCreeps.map(c => c.creep));
//         let creepsThatNeedToCatchUp = [];
//         for (let squadMember of this.roleCreeps)
//         {
//             let squadIsInRange = findInRange(squadMember.creep, this.roleCreeps.map(c => c.creep), this.spread);
//             // console.log(squadMember.id + " in range? " + squadIsInRange.length)
//             if (squadIsInRange.length <= 1 && squadMember.creep.id != closestCreepToTarget.id)
//             {
//                 creepsThatNeedToCatchUp.push(squadMember);
//             }
//         }

//         if (creepsThatNeedToCatchUp.length)
//         {
//             for (let squadMember of creepsThatNeedToCatchUp)
//             {
//                 squadMember.creep.moveTo(closestCreepToTarget);
//             }
//         }
//         else
//         {
//             for (let squadMember of this.roleCreeps)
//             {
//                 // set costmatrix to prefer near squadmates, save every tick
//                 squadMember.creep.moveTo(target);
//             }
//         }
//     }

//     squadAttack(target: Creep | Structure)
//     {
//         // let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
//         // let rangedCreeps = this.roleCreeps.filter(creep => creep.role === "RANGED_ATTACKER") as RangedAttacker[];
//         // let meleeCreeps = this.roleCreeps.filter(creep => creep.body.some(p => p.type == ATTACK));
//         // let healerCreeps = this.roleCreeps.filter(creep => creep.body.some(p => p.type == HEAL));

//         // let enemyRangedPartCount = 0;
//         // let enemyAttackPartCount = 0;
//         // if ("body" in target)
//         // {
//         //     for (let bodyPart of target.body)
//         //     {
//         //         if (bodyPart.type == RANGED_ATTACK) enemyRangedPartCount++;
//         //         if (bodyPart.type == ATTACK) enemyAttackPartCount++;
//         //         if (bodyPart.type == ATTACK) enemyAttackPartCount++;
//         //     }
//         // }

//         // if (meleeCreeps.length)
//         // {
//         //     for (let creep of meleeCreeps)
//         //     {
//         //         if (creep.attack(target) == ERR_NOT_IN_RANGE)
//         //         {
//         //             // set costmatrix to prefer near squadmates
//         //             creep.moveTo(target);
//         //         }
//         //     }
//         // }

//         // if (rangedCreeps.length)
//         // {
//         //     for (let creep of rangedCreeps)
//         //     {
//         //         let enemiesTooClose = findInRange(creep, enemyCreeps, 2);
//         //         let enemiesInRange = findInRange(creep, enemyCreeps, 3);
//         //         // count enemies in range and use ranged
//         //         console.log("enemies to close to " + creep.id)
//         //         if (enemiesTooClose.length)
//         //         {

//         //             let goals: { pos: RoomPosition; range: number; }[] = []
//         //             enemiesTooClose.forEach(creep => goals.push({ "pos": creep, "range": 4 }));
//         //             let ret = searchPath(creep, goals, {flee: true});
//         //             if (ret.path.length)
//         //             {
//         //                 creep.rangedAttack(target);
//         //                 creep.moveTo(ret.path[1]);
//         //             }
//         //         }
//         //         else if (enemiesInRange.length >= 3)
//         //         {
//         //             creep.rangedMassAttack();
//         //         }
//         //         else if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
//         //         {
//         //             // set costmatrix to prefer near squadmates
//         //             console.log("attacking spawn")
//         //             creep.moveTo(target);
//         //         }
//         //     }
//         // }

//         // if (healerCreeps.length)
//         // {
//         //     for (let creep of healerCreeps)
//         //     {
//         //         let lowSquadCreeps = this.roleCreeps.filter(i => i.my && i.hits < i.hitsMax);
//         //         let creepToHeal = creep.findClosestByRange(lowSquadCreeps);
//         //         let enemiesTooClose = findInRange(creep, enemyCreeps, 2);
//         //         // count enemies in range and use ranged

//         //         if (creepToHeal && creep.heal(creepToHeal) == ERR_NOT_IN_RANGE)
//         //         {
//         //             // set costmatrix to prefer near squadmates
//         //             creep.rangedHeal(creepToHeal);
//         //             creep.moveTo(creepToHeal);
//         //         }

//         //         if (enemiesTooClose)
//         //         {
//         //             let ret = searchPath(creep, target, {flee: true});
//         //             if (ret.path.length)
//         //             {
//         //                 if (creepToHeal && creep.heal(creepToHeal) == ERR_NOT_IN_RANGE)
//         //                 {
//         //                     creep.rangedHeal(creepToHeal);
//         //                 }
//         //                 creep.moveTo(ret.path[0]);
//         //             }
//         //         }
//         //     }
//         // }
//     }

//     squadRetreat(targets: RoomPosition[])
//     {
//     }

//     visualize()
//     {
//         for (let roleCreep of this.roleCreeps)
//         {
//             let creep = roleCreep.creep;
//             if (!creep.exists || !roleCreep.nextPosition) { continue; }

//             let vis = new Visual(9, false);
//             // console.log(`id ${creep.id}, ${JSON.stringify(roleCreep.nextPosition)}`)
//             vis.circle(
//                 { 'x': roleCreep.nextPosition.x, 'y': roleCreep.nextPosition.y },
//                 {
//                     opacity: .9,
//                     radius: 0.3,
//                     fill: this.color
//                 }
//             );

//             vis.text(
//                 this.id.toString(),
//                 { 'x': roleCreep.nextPosition.x, 'y': roleCreep.nextPosition.y + 0.15 },
//                 {
//                     font: 0.2,
//                     opacity: 1,
//                 }
//             );
//         }
//     }

//     logState()
//     {
//         console.log(`Squad ${this.id} - DPS: ${this.dps} | HPS: ${this.hps} | Target Composition ${this.composition} | RolesNeeded: ${this.getNeededCreeps()}\n`);
//     }
// }
