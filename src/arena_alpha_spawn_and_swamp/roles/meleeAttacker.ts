import { Creep, RoomPosition, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath } from "game/utils"
import { BodyPartConstant, ERR_NOT_IN_RANGE, BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, DirectionConstant, LEFT, OK, RIGHT, TOP, TOP_LEFT, TOP_RIGHT } from "game/constants"
import { RoleName, ICreepRole } from "../types";

export class MeleeAttacker extends Creep implements ICreepRole
{
    creep: Creep;
    role: RoleName;
    squadId: number;
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    nextPosition: RoomPosition;

    constructor(creep: Creep, squadId: number = -1)
    {
        super();
        this.creep = creep;
        this.role = "MELEE_ATTACKER";
        this.squadId = squadId;

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.nextPosition = { x: creep.x, y: creep.y };
    }

    run ()
    {
        if (!this.creep.my) { return; }

        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);

        let target = null;
        if (enemies.length)
        {
            target = findClosestByPath(this.creep, enemies);
        }
        else if (this.enemySpawn)
        {
            target = this.enemySpawn;
        }

        console.log(`${this.creep.id} attacking ${target?.id}`)

        if (target)
        {
            if (this.creep.attack(target) == ERR_NOT_IN_RANGE)
            {
                this.creep.moveTo(target);
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

    }
}
