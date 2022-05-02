import { BodyPartConstant, BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, DirectionConstant, LEFT, OK, RIGHT, TOP, TOP_LEFT, TOP_RIGHT } from "game/constants";
import { Creep, StructureContainer, StructureSpawn, Id, RoomPosition } from "game/prototypes";
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
    nextPosition: RoomPosition;

    constructor(creep: Creep, squadId: number = -1)
    {
        super();
        this.creep = creep;
        // this.bodyPartRatio = bodyPartRatio;
        this.squadId = squadId;

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.containers = getObjectsByPrototype(StructureContainer);
        this.nextPosition = { x: creep.x, y: creep.y };
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

    roleMoveTo(position: RoomPosition)
    {
        let ret = this.creep.moveTo(position);

        if (ret == OK)
        {
            this.nextPosition = position;
        }

        return ret;
    }

    roleMove(direction: DirectionConstant)
    {
        let ret = this.creep.move(direction);

        if (ret == OK)
        {
            switch (direction)
            {
                case TOP_LEFT:
                    this.nextPosition = { x: this.creep.x - 1, y: this.creep.y + 1 }
                case TOP:
                    this.nextPosition = { x: this.creep.x, y: this.creep.y + 1 }
                case TOP_RIGHT:
                    this.nextPosition = { x: this.creep.x + 1, y: this.creep.y + 1 }
                case RIGHT:
                    this.nextPosition = { x: this.creep.x + 1, y: this.creep.y }
                case BOTTOM_RIGHT:
                    this.nextPosition = { x: this.creep.x + 1, y: this.creep.y - 1 }
                case BOTTOM:
                    this.nextPosition = { x: this.creep.x, y: this.creep.y - 1 }
                case BOTTOM_LEFT:
                    this.nextPosition = { x: this.creep.x - 1, y: this.creep.y - 1 }
                case LEFT:
                    this.nextPosition = { x: this.creep.x, y: this.creep.y - 1 }
            }
        }

        return ret;
    }

    refreshMemory ()
    {
        this.containers = getObjectsByPrototype(StructureContainer);
    }
}
