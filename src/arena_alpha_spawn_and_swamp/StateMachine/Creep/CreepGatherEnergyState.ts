import { RoleCreep } from "../../roles/roleCreep";
import { SharedCostMatrix } from "../../SharedCostMatrix";
import { CostMatrix, searchPath } from "game/path-finder";
import { Resource, RoomPosition, StructureContainer } from "game/prototypes";
import { getRange } from "game/utils";
import { Visual } from "game/visual";
import { IState } from "../IState";
import { CreepStateMachine } from "./CreepStateMachine";
import { CreepMoveState } from "./CreepMoveState";
import { ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from "game/constants";
import { findClosestByPath, findClosestByRange, getObjectsByPrototype } from "game/utils";
import { CreepEmptyContainerState } from "./CreepEmptyContainerState copy";

type fillContext = { }

export class CreepGatherEnergyState implements IState
{
    name: string = "GATHER ENERGY";
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


        if (this.roleCreep.creep.store.getUsedCapacity(RESOURCE_ENERGY) == this.roleCreep.creep.store.getCapacity())
        {
            this.roleCreep.stateMachine.popState();
        } else {
            let droppedResources = getObjectsByPrototype(Resource);
            let closestDroppedResource = this.roleCreep.creep.findClosestByRange(droppedResources);
            let container = findClosestByRange(this.roleCreep.creep, getObjectsByPrototype(StructureContainer).filter((c => c.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0)));
            let rangeToContainer = getRange(this.roleCreep.creep, container) ?? 9999;
            if (closestDroppedResource && getRange(this.roleCreep.creep, closestDroppedResource) < rangeToContainer)
            {
                if (this.roleCreep.creep.pickup(closestDroppedResource) == ERR_NOT_IN_RANGE) {
                    let state = new CreepMoveState(this.roleCreep, { position: closestDroppedResource, range: 1 });
                    this.roleCreep.stateMachine.pushState(state);
                }
            }
            else
            {
                if (container)
                {
                    let state = new CreepEmptyContainerState(this.roleCreep, { container: container });
                    this.roleCreep.stateMachine.pushState(state);
                }
            }
        }
    }

    seralize(): string
    {
        return `(${this.name})`
    }
}
