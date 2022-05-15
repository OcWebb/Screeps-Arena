import {  } from "game/constants";
import { Creep, StructureContainer, StructureSpawn, Id, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath } from "game/utils"
import { RESOURCE_ENERGY, ERR_NOT_IN_RANGE } from "game/constants"
import { RoleCreep } from "./roleCreep";


export class Transporter extends RoleCreep
{
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    containers: StructureContainer[];

    constructor(creep: Creep, squadId: number = -1)
    {
        super(creep, "TRANSPORTER", squadId);

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.containers = getObjectsByPrototype(StructureContainer);
    }

    run ()
    {
        if (!this.creep.exists) { return; }

        this.refreshMemory();

        let filledContainers = this.containers.filter(container => container.store.getUsedCapacity(RESOURCE_ENERGY));
        let container = findClosestByPath(this.creep, filledContainers);

        if(this.creep.store.getFreeCapacity(RESOURCE_ENERGY))
        {
            if (container && this.creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                this.creep.moveTo(container);
            }
        }
        else
        {
            if(this.creep.transfer(this.mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                this.creep.moveTo(this.mySpawn);
            }
        }
    }

    refreshMemory ()
    {
        this.containers = getObjectsByPrototype(StructureContainer);
    }
}
