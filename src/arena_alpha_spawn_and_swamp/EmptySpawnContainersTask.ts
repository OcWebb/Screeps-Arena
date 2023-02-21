import { ERR_NOT_IN_RANGE, HEAL, HEAL_POWER, RESOURCE_ENERGY } from "game/constants";
import { Creep, RoomPosition, StructureContainer, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getObjectsByPrototype } from "game/utils";
import { common } from "../utils/common";
import { GameState, RoleName } from "../utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { Task } from "./Task";


export class EmptySpawnContainersTask extends Task
{
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    containers: StructureContainer[];

    constructor(priority: number)
    {
        super();
        this.priority = priority;
        this.name = "Empty Spawn Containers";
        this.updateContext();
        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.containers = getObjectsByPrototype(StructureContainer);
    }

    execute()
    {
        for (let roleCreep of this.roleCreepsAssigned)
        {
            if (!roleCreep.stateMachine.stateQueue.length)
            {
                let filledContainers = this.containers.filter(container => container.store.getUsedCapacity(RESOURCE_ENERGY));
                let container = findClosestByPath(roleCreep.creep, filledContainers);

                if(roleCreep.creep.store.getFreeCapacity(RESOURCE_ENERGY))
                {
                    if (container && roleCreep.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    {
                        roleCreep.creep.moveTo(container);
                    }
                }
                else
                {
                    if(roleCreep.creep.transfer(this.mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    {
                        roleCreep.creep.moveTo(this.mySpawn);
                    }
                }
            }
        }
    }

    isFinished(): Boolean
    {
        var filledSpawnContainers = this.containers.filter(container =>
            container.store.getUsedCapacity(RESOURCE_ENERGY) && this.mySpawn.getRangeTo(container) < 10);
        if (!filledSpawnContainers.length)
        {
            return true;
        }

        return false;
    }

    updateContext(gameState: GameState = common.getGameState()): void
    {
    }

    findBestCandidate(roleCreeps: RoleCreep[]): RoleCreep
    {
        // if (roleCreeps.length)
        // {
        //     let closestFriendly = this.fobPosition.findClosestByPath(roleCreeps.map(x => x.creep));
        //     let roleCreep = roleCreeps.filter(x => x.creep.exists && x.creep.id === closestFriendly!.id)[0];

        //     return roleCreep;
        // }

        return roleCreeps[0];
    }

    assignCreep(roleCreep: RoleCreep)
    {
        super.assignCreep(roleCreep);

        roleCreep.stateMachine.clearStates();

        this.updateContext();
    }

    getRolesNeeded(): RoleName[]
    {
        let rolesNeeded: RoleName[] = [];
        if (this.roleCreepsAssigned.filter(roleCreep => roleCreep.role == "TRANSPORTER").length < 2)
        {
            rolesNeeded.push("TRANSPORTER");
        }

        return rolesNeeded;
    }
}
