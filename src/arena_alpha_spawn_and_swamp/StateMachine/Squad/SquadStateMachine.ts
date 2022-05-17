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

    constructor(squad: Squad, context?: SquadContext)
    {
        super();
        this.context = context ?? { squad: squad };
    }

    setContext(context: SquadContext)
    {
        this.context = context;
    }
}
