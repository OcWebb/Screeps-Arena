import { BodyPartConstant } from "game/constants";
import { Creep, StructureContainer, StructureSpawn, Id } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath } from "game/utils"
import { RESOURCE_ENERGY, ERR_NOT_IN_RANGE } from "game/constants"
import { RoleName, ICreepRole } from "../types";

var containers: StructureContainer[];
var spawn: StructureSpawn | undefined
var enemySpawn: StructureSpawn | undefined;


export class Transporter extends Creep implements ICreepRole
{
    creep: Creep;
    role: RoleName = "TRANSPORTER";
    squadId: number;
    // bodyPartRatio: BodyPartConstant[];
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    containers: StructureContainer[];

    constructor(creep: Creep, squadId: number = -1)
    {
        super();
        this.creep = creep;
        // this.bodyPartRatio = bodyPartRatio;
        this.squadId = squadId;

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
