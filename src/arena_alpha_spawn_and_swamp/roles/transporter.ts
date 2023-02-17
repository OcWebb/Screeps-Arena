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

    constructor(creep: Creep, taskId: number = 0)
    {
        super(creep, "TRANSPORTER", taskId);

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.containers = getObjectsByPrototype(StructureContainer);
    }

    run ()
    {
        super.run();
    }

    refreshMemory ()
    {
        this.containers = getObjectsByPrototype(StructureContainer);
    }
}
