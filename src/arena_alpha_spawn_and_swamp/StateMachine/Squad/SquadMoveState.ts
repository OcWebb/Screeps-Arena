// import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
// import { TightSquad } from "arena_alpha_spawn_and_swamp/squads/tightSquad";
// import { RoomPosition } from "game/prototypes";
// import { getRange } from "game/utils";
// import { IState } from "../IState";
// import { SquadStateMachine } from "./SquadStateMachine";

// type moveContext = { position: RoomPosition, range: number}

// export class SquadMoveState implements IState
// {
//     name: string = "MOVE";
//     squad: Squad;
//     stateMachine: SquadStateMachine;
//     context: moveContext;

//     constructor(squad: Squad, moveContext: moveContext)
//     {
//         this.squad = squad;
//         this.stateMachine = squad.stateMachine;
//         this.context = moveContext;
//     }

//     run(): void
//     {
//         if (this.squad.type === 'TightSquad')
//         {
//             let tightSquad = this.squad as TightSquad;
//             let outOfPos = tightSquad.getInFormation();
//             if (outOfPos)
//             {
//                 console.log(`squad ${tightSquad.id} out of position`);
//                 return;
//             }
//         }

//         if (getRange(this.context.position, this.squad.getPosition()) > this.context.range )
//         {
//             this.squad.squadMove(this.context.position);
//         }
//         else
//         {
//             this.stateMachine.popState();
//         }
//     }

//     seralize(): string
//     {
//         return `(${this.name}) [dest: ${this.context.position.x}-${this.context.position.y}, range: ${this.context.range}]`
//     }
// }
