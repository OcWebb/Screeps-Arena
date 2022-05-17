import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { RoomPosition } from "game/prototypes";
import { IState } from "../IState";
import { SquadStateMachine } from "./SquadStateMachine";

type retreatContext = { squad: Squad, enemies: RoomPosition[], range: number}

export class SquadRetreatState implements IState
{
    name: string = "RETREAT";
    stateMachine: SquadStateMachine;
    context: retreatContext;

    constructor(retreatContext: retreatContext)
    {
        this.stateMachine = retreatContext.squad.stateMachine;
        this.context = retreatContext;
    }

    run(): void
    {
        let enemiesToClose = this.context.enemies.filter(position => this.context.squad.getRange(position) > this.context.range);

        if (enemiesToClose.length)
        {
            this.context.squad.squadRetreat(enemiesToClose);
        }
        else
        {
            this.stateMachine.popState();
        }
    }

    seralize(): string
    {
        let outputString = `(${this.name}) { `;

        if (this.context.enemies)
        {
            outputString += "positions: [";
            this.context.enemies.forEach(position => outputString += `(${position.x}-${position.y}), `);
            outputString += "]";
        }

        outputString += "}";

        return outputString;
    }
}
