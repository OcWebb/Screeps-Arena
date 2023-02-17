import { RoleCreep } from "arena_alpha_spawn_and_swamp/roles/roleCreep";
import { SharedCostMatrix } from "arena_alpha_spawn_and_swamp/SharedCostMatrix";
import { CostMatrix, searchPath } from "game/path-finder";
import { RoomPosition } from "game/prototypes";
import { getRange } from "game/utils";
import { Visual } from "game/visual";
import { common } from "utils/common";
import { IState } from "../IState";
import { CreepStateMachine } from "./CreepStateMachine";

type moveContext = { position: RoomPosition, range: number}

export class CreepMoveState implements IState
{
    name: string = "MOVE";
    roleCreep: RoleCreep;
    stateMachine: CreepStateMachine;
    context: moveContext;

    constructor(roleCreep: RoleCreep, moveContext: moveContext)
    {
        this.roleCreep = roleCreep;
        this.stateMachine = roleCreep.stateMachine;
        this.context = moveContext;
    }

    run(): void
    {
        if (getRange(this.context.position, this.roleCreep.creep) > this.context.range )
        {
            let costMatrix = SharedCostMatrix.getCostMatrix();
            // todo: swamp cost based on body parts
            let ret = searchPath(this.roleCreep.creep, this.context.position, { costMatrix:  costMatrix } );
            if (ret.path.length)
            {
                new Visual(10, false).poly(ret.path, {stroke: "#43c103"});
                // let potentialDamageOnPath = common.potentialDamageInRange(ret.path[0]);
                // let potentialDamageOnPath = common.potentialDamageInRange(ret.path[0]);
                this.roleCreep.roleMoveTo(ret.path[0]);
            }
        }
        else
        {
            this.stateMachine.popState();
        }
    }

    seralize(): string
    {
        return `(${this.name}) [dest: ${this.context.position.x}-${this.context.position.y}, range: ${this.context.range}]`
    }
}
