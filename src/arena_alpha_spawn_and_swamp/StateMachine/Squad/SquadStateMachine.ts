import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { Creep } from "game/prototypes";
import { StateMachine } from "../StateMachine";

export interface SquadContext {
    squad: Squad;
    enemies?: Creep[];
    enemiesTopSide?: Creep[];
    enemiesBottomSide?: Creep[];
  }

export class SquadStateMachine extends StateMachine
{
    context: SquadContext;

    constructor(context: SquadContext)
    {
        super();
        this.context = context;
    }

    setContext(context: SquadContext)
    {
        this.context = context;
    }

    logState(): void
    {
        if (this.currentState)
        {
            console.log(`${this.context.squad.id}'s State`)
            super.logState();
        }
    }
}
