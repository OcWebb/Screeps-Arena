import { RoleCreep } from "../../roles/roleCreep";
import { SharedCostMatrix } from "../../SharedCostMatrix";
import { CostMatrix, searchPath } from "game/path-finder";
import { RoomPosition, StructureContainer } from "game/prototypes";
import { getRange } from "game/utils";
import { Visual } from "game/visual";
import { IState } from "../IState";
import { CreepStateMachine } from "./CreepStateMachine";
import { CreepMoveState } from "./CreepMoveState";
import { ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from "game/constants";
import { findClosestByPath, findClosestByRange, getObjectsByPrototype } from "game/utils";

type emptyContainerContext = { container: StructureContainer}

export class CreepEmptyContainerState implements IState
{
    name: string = "EMPTY CONTAINER";
    roleCreep: RoleCreep;
    stateMachine: CreepStateMachine;
    context: emptyContainerContext;


    constructor(roleCreep: RoleCreep, emptyContainerContext: emptyContainerContext)
    {
        this.roleCreep = roleCreep;
        this.stateMachine = roleCreep.stateMachine;
        this.context = emptyContainerContext;
    }

    run(): void
    {
        console.log("container: " + JSON.stringify(this.context));
        if (this.context.container == undefined ||
            this.context.container.x == undefined || this.context.container.y == undefined ||
            (this.context.container?.store?.getUsedCapacity(RESOURCE_ENERGY) ?? 0) <= 0)
        {
            this.roleCreep.stateMachine.popState()
        }

        if (this.context.container && this.roleCreep.creep.withdraw(this.context.container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
        {
            let state = new CreepMoveState(this.roleCreep, { position: this.context.container, range: 1 });
            this.roleCreep.stateMachine.pushState(state);
        }

        this.roleCreep.creep.drop(RESOURCE_ENERGY);
    }

    seralize(): string
    {
        return `(${this.name}) [container: ${this.context.container.x}-${this.context.container.y}]`
    }
}
