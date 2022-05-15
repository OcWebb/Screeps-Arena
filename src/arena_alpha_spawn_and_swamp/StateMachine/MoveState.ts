import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { RoomPosition } from "game/prototypes";
import { getRange } from "game/utils";
import { IStateModel } from "./IStateModel";

type moveContext = { squad: Squad, position: RoomPosition, range: number}

export class MoveState implements IStateModel
{
    name: string = "MOVE";
    context: moveContext;

    constructor(context: moveContext)
    {
        this.context = context;
    }

    run(): boolean
    {
        if (getRange(this.context.position, this.context.squad.getPosition()) > this.context.range )
        {
            this.context.squad.squadMove(this.context.position)
            return false;
        }

        return true;
    }
}
