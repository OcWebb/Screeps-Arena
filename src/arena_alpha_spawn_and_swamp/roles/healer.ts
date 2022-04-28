import { Creep, StructureSpawn, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findInRange, findClosestByPath } from "game/utils"
import { ERR_NOT_IN_RANGE, RANGED_ATTACK, ATTACK } from "game/constants"
import { RoleName, ICreepRole } from "../types";
import { searchPath } from "game/path-finder"
import { Visual } from "game/visual"
import { squads } from "../main"

export class Healer extends Creep implements ICreepRole
{
    creep: Creep;
    role: RoleName;
    squadId: number;
    mySpawn: StructureSpawn;
    enemySpawn: StructureSpawn;
    enemyCreeps: Creep[];

    constructor(creep: Creep, squadId: number = -1)
    {
        super();
        this.creep = creep;
        this.role = "HEALER";
        this.squadId = squadId;

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    run ()
    {
        if (!this.creep.exists) { return; }

        this.refreshMemory();

        let myCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my);
        // let mySquad = squads.filter(squad => squad.id == this.squadId)[0];

        let lowSquadCreeps = myCreeps.filter(i => i.my && i.hits < i.hitsMax);
        let creepToHeal = this.creep.findClosestByRange(lowSquadCreeps);

        // console.log(`${this.creep.id} healing ${creepToHeal?.id}`);
        if (creepToHeal && this.creep.heal(creepToHeal) == ERR_NOT_IN_RANGE)
        {
            this.creep.rangedHeal(creepToHeal);
            return;
        }
    }

    refreshMemory ()
    {
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    retreat(enemies: Creep[], range=4)
    {
        console.log("retreating")
        let goals: { pos: RoomPosition; range: number; }[] = [];
        enemies.forEach(creep => goals.push({ "pos": creep, "range": range }));

        let lowFriendlies = getObjectsByPrototype(Creep).filter(creep => creep.my)
            .filter(creep => creep.body.some(bodyPart => bodyPart.hits === 0));

        let fleePath = searchPath(this.creep, goals, {flee: true});

        if (fleePath.path.length && lowFriendlies.length)
        {
            let closestLowFriendly = findClosestByPath(this.creep, lowFriendlies);
            let friendlyPath = searchPath(this.creep, closestLowFriendly);

            let enemiesInRangeHealer = this.enemiesInRangeOfPosition(friendlyPath.path[0]);
            let enemiesInRangeFlee = this.enemiesInRangeOfPosition(fleePath.path[0]);

            if (enemiesInRangeHealer <= enemiesInRangeFlee)
            {
                this.creep.moveTo(friendlyPath.path[0]);
                new Visual().poly(friendlyPath.path);
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

    enemiesInRangeOfPosition(position: RoomPosition)
    {
        let ranged = this.enemyCreeps.filter(creep => creep.body.some(bodyPart => bodyPart.type = RANGED_ATTACK));
        let melee = this.enemyCreeps.filter(creep => creep.body.some(bodyPart => bodyPart.type = ATTACK));
        let rangedEnemyCreepsInRange = findInRange(position, ranged, 3);
        let meleeEnemyCreepsInRange = findInRange(position, melee, 1);

        return rangedEnemyCreepsInRange.length + meleeEnemyCreepsInRange.length;
    }
}
