import { HEAL, HEAL_POWER } from "game/constants";
import { Creep } from "game/prototypes";
import { common } from "utils/common";
import { RoleName } from "utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { Task } from "./Task";


export class EliminateTask extends Task
{
    enemies: Creep[];
    enemyTotalDps: number = 0;
    enemyEffectiveDps: number = 0
    enemyHps: number = 0

    groupDps: number = 0
    groupHps: number = 0
    groupEffectiveDps: number = 0

    constructor(priority: number, enemies: Creep[])
    {
        super();
        this.priority = priority;
        this.enemies = enemies;
        this.calculateStats();
    }

    execute()
    {
        // push creep state to eliminate?
    }

    assignCreep(roleCreep: RoleCreep)
    {
        super.assignCreep(roleCreep);
        this.calculateStats();
    }

    calculateStats()
    {
        let groupHps = 0;
        let myCreeps: Creep[] = [];
        this.roleCreepsAssigned.forEach(roleCreep =>
            {
                myCreeps.push(roleCreep.creep);
                let healParts = roleCreep.creep.body.filter(bodyPart => bodyPart.type == HEAL)
                groupHps += healParts.length * HEAL_POWER
            });

        this.groupHps = groupHps;
        this.groupDps = common.damageOutput(myCreeps);


        this.enemyTotalDps = common.damageOutput(this.enemies);

        let enemyHps = 0;
        this.enemies.forEach(creep =>
            {
                let healParts = creep.body.filter(bodyPart => bodyPart.type == HEAL)
                enemyHps += healParts.length * HEAL_POWER
            });

        this.enemyHps = enemyHps;
        this.enemyEffectiveDps = this.enemyTotalDps - groupHps;
        this.groupEffectiveDps = this.groupDps - enemyHps;
    }

    getRolesNeeded(): RoleName[]
    {
        if (this.enemyEffectiveDps > this.groupEffectiveDps)
        {
            return ["RANGED_ATTACKER"];
        }

        return [];
    }
}
