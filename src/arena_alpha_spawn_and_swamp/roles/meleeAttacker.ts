import { Creep, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath } from "game/utils"
import { BodyPartConstant, ERR_NOT_IN_RANGE } from "game/constants"
import { RoleName, ICreepRole } from "../types";

export class MeleeAttacker extends Creep implements ICreepRole
{
    creep: Creep;
    role: RoleName;
    squadId: number;
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;

    constructor(creep: Creep, squadId: number = -1)
    {
        super();
        this.creep = creep;
        this.role = "MELEE_ATTACKER";
        this.squadId = squadId;

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
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
