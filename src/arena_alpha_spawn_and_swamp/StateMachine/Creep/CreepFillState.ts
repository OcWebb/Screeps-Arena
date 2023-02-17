import { RoleCreep } from "arena_alpha_spawn_and_swamp/roles/roleCreep";
import { SharedCostMatrix } from "arena_alpha_spawn_and_swamp/SharedCostMatrix";
import { CostMatrix, searchPath } from "game/path-finder";
import { RoomPosition, StructureContainer } from "game/prototypes";
import { getRange } from "game/utils";
import { Visual } from "game/visual";
import { common } from "utils/common";
import { IState } from "../IState";
import { CreepStateMachine } from "./CreepStateMachine";
import { CreepMoveState } from "./CreepMoveState";
import { ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from "game/constants";
import { findClosestByPath, findClosestByRange, getObjectsByPrototype } from "game";

type fillContext = { energySource: RoomPosition}

export class CreepFillState implements IState
{
    name: string = "FILL";
    roleCreep: RoleCreep;
    stateMachine: CreepStateMachine;
    context: fillContext;

    constructor(roleCreep: RoleCreep, fillContext: fillContext)
    {
        this.roleCreep = roleCreep;
        this.stateMachine = roleCreep.stateMachine;
        this.context = fillContext;
    }

    run(): void
    {
        let container = findClosestByRange(this.context.energySource, getObjectsByPrototype(StructureContainer));
        console.log(this.roleCreep.creep.store[RESOURCE_ENERGY] == this.roleCreep.creep.store.getCapacity())
        console.log("energyStore " + this.roleCreep.creep.store[RESOURCE_ENERGY]);
        if (this.roleCreep.creep.store[RESOURCE_ENERGY] == this.roleCreep.creep.store.getCapacity())
        {
            this.roleCreep.stateMachine.popState();
        } else {
            console.log("Withdraw " + this.roleCreep.creep.withdraw(container, RESOURCE_ENERGY));
            if (this.roleCreep.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                let moveState = new CreepMoveState(this.roleCreep, { position: container, range: 1 });
                this.roleCreep.stateMachine.pushState(moveState);
            }
        }
    }

    seralize(): string
    {
        return `(${this.name}) [source: ${this.context.energySource.x}-${this.context.energySource.y}]`
    }
}
