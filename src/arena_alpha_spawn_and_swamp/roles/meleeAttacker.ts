import { Creep, RoomPosition, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath } from "game/utils"
import { ERR_NOT_IN_RANGE } from "game/constants"
import { RoleCreep } from "./roleCreep";

export class MeleeAttacker extends RoleCreep
{
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    nextPosition: RoomPosition;

    constructor(creep: Creep, squadId: number = -1)
    {
        super(creep, "MELEE_ATTACKER", squadId);

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


    refreshMemory ()
    {

    }
}
