// import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
// import { Creep, RoomPosition } from "game/prototypes";
// import { findInRange, getObjectsByPrototype } from "game/utils";
// import { IState } from "../IState";
// import { SquadStateMachine } from "./SquadStateMachine";

// type retreatContext = { squad: Squad, enemies: Creep[], range: number, popCondition: (squad: Squad) => boolean}

// export class SquadRetreatState implements IState
// {
//     name: string = "RETREAT";
//     stateMachine: SquadStateMachine;
//     context: retreatContext;
//     enemiesToClose: RoomPosition[];

//     constructor(retreatContext: retreatContext)
//     {
//         this.stateMachine = retreatContext.squad.stateMachine;
//         this.context = retreatContext;
//         this.enemiesToClose = retreatContext.enemies;
//     }

//     run(): void
//     {
//         let allEnemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);
//         this.enemiesToClose = findInRange(this.context.squad.getPosition(), allEnemies, this.context.range); //this.context.enemies.filter(position => this.context.squad.getRange(position) < this.context.range);

//         if (this.enemiesToClose.length)
//         {
//             this.context.squad.squadRetreat(this.enemiesToClose);
//         }
//         else
//         {
//             console.log("retreatPopCon: " + this.context.popCondition(this.context.squad));
//             if (this.context.popCondition(this.context.squad))
//             {
//                 this.stateMachine.popState();1
//             }
//         }
//     }

//     seralize(): string
//     {
//         let outputString = `(${this.name}) { `;

//         if (this.enemiesToClose)
//         {
//             outputString += "positions: [";
//             this.enemiesToClose.forEach(position => outputString += `(${position.x}-${position.y}), `);
//             outputString += "]";
//         }

//         outputString += "}";

//         return outputString;
//     }
// }
