import { Creep, StructureSpawn, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath, findInRange, getRange, findClosestByRange } from "game/utils"
import { ERR_NOT_IN_RANGE, RANGED_ATTACK, ATTACK, HEAL } from "game/constants"
import { searchPath } from "game/path-finder"
import { Visual } from "game/visual"
import { common } from "utils/common"
import { RoleCreep } from "./roleCreep";

export class RangedAttacker extends RoleCreep
{
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    enemyCreeps: Creep[];

    constructor(creep: Creep, squadId: number = -1)
    {
        super(creep, "RANGED_ATTACKER", squadId);

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    run ()
    {
        if (!this.creep.exists) { return; }

        this.refreshMemory();

        let enemiesInRange = findInRange(this.creep, this.enemyCreeps, 3);

        if (enemiesInRange.length)
        {
            this.attackEnemies(this.enemyCreeps);
        }

        if (!enemiesInRange.length && getRange(this.creep, this.enemySpawn) <= 3)
        {
            this.creep.rangedAttack(this.enemySpawn);
        }
    }

    refreshMemory ()
    {
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    engageEnemies()
    {
        let enemiesInRange = findInRange(this.creep, this.enemyCreeps, 3);

        if (!enemiesInRange.length) { return; }

        // run from those with attack parts who are too close
        let armedEnemiesTooClose = findInRange(this.creep, this.enemyCreeps, 2).filter(creep => common.hasAttackParts(creep));
        if (armedEnemiesTooClose.length)
        {
            this.retreat(armedEnemiesTooClose);
        }

        this.attackEnemies(enemiesInRange);
    }

    retreat(enemies: Creep[], range=4)
    {
        console.log("retreating")
        let goals: { pos: RoomPosition; range: number; }[] = [];
        enemies.forEach(creep => goals.push({ "pos": creep, "range": range }));
        let healers = getObjectsByPrototype(Creep).filter(creep => creep.my)
            .filter(creep => creep.body.some(bodyPart => bodyPart.type = HEAL));
        let closestHealer = findClosestByPath(this.creep, healers);

        let fleePath = searchPath(this.creep, goals, {flee: true});
        let healerPath = searchPath(this.creep, closestHealer);

        if (fleePath.path.length && healerPath.path.length)
        {
            let enemiesInRangeHealer = common.enemiesInRangeOfPosition(healerPath.path[0]);
            let enemiesInRangeFlee = common.enemiesInRangeOfPosition(fleePath.path[0]);

            if (enemiesInRangeHealer <= enemiesInRangeFlee)
            {
                this.creep.moveTo(healerPath.path[0]);
                new Visual().poly(healerPath.path, {fill: "16cc1f"});
            }
            else
            {
                this.creep.moveTo(fleePath.path[0]);
                new Visual().poly(fleePath.path);
            }
        }
        else if (fleePath.path.length)
        {
            this.creep.moveTo(fleePath.path[0]);
            new Visual().poly(fleePath.path);
        }
    }

    attackEnemies(enemies: Creep[])
    {
        let enemiesInRange = findInRange(this.creep, enemies, 3);
        let enemiesTooClose = findInRange(this.creep, enemies, 2);

        if (!enemiesInRange.length) { return; }

        if (enemiesTooClose.length >= 3)
        {
            this.creep.rangedMassAttack();
        }
        else
        {
            let target = this.chooseTarget(enemiesInRange);

            if(target)
            {
                this.creep.rangedAttack(target);
            }
        }
    }

    chooseTarget(enemies: Creep[])
    {
        let healer = enemies.find(creep => creep.body.some(bodyPart => bodyPart.type = HEAL));
        let ranged = enemies.find(creep => creep.body.some(bodyPart => bodyPart.type = RANGED_ATTACK));
        let melee = enemies.find(creep => creep.body.some(bodyPart => bodyPart.type = ATTACK));

        // if (healer)
        // {
        //     return healer;
        // }
        // else if (ranged)
        // {
        //     return ranged;
        // }
        // else if (melee)
        // {
        //     return melee;
        // }

        let lowest = enemies.sort((a, b) => a.hits - b.hits);

        return lowest[0];
    }
}
