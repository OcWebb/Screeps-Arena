import { Creep, StructureSpawn, RoomPosition } from "game/prototypes";
import { getObjectsByPrototype, findClosestByPath, findInRange, getRange, findClosestByRange } from "game/utils"
import { ERR_NOT_IN_RANGE, RANGED_ATTACK, ATTACK, HEAL, HEAL_POWER, RANGED_ATTACK_POWER } from "game/constants"
import { searchPath } from "game/path-finder"
import { Visual } from "game/visual"
import { common } from "utils/common"
import { RoleCreep } from "./roleCreep";
import { CreepMoveState } from "arena_alpha_spawn_and_swamp/StateMachine/Creep/CreepMoveState";
import { CreepRetreatState } from "arena_alpha_spawn_and_swamp/StateMachine/Creep/CreepRetreatState";

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

        this.attackEnemies(this.enemyCreeps);
        this.heal();

        if (this.stateMachine.stateQueue.length == 0)
        {
            let moveToSpawnState = new CreepMoveState(this, { position: this.enemySpawn, range: 3 });
            this.stateMachine.pushState(moveToSpawnState);
        }

        if (common.shouldRetreat(this.creep) && !(this.stateMachine.currentState instanceof CreepRetreatState))
        {
            let retreatSpawnState = new CreepRetreatState(this, { });
            this.stateMachine.pushState(retreatSpawnState);
        }

        this.stateMachine.logState();

        super.run();
    }

    refreshMemory ()
    {
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    heal()
    {
        let friendlyCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my);
        let friendliesInRange = findInRange(this.creep, friendlyCreeps, 3);

        let lowestHp = 999999;
        let lowestAlly = undefined;
        for (let creep of friendliesInRange)
        {
            if (creep.hits < lowestHp)
            {
                lowestHp = creep.hits;
                lowestAlly = creep;
            }
        }

        if (lowestHp < this.creep.hits && lowestAlly)
        {
            console.log(`${this.creep.id} healing ${lowestAlly.id}`)
            if (this.creep.heal(lowestAlly) == ERR_NOT_IN_RANGE)
            {
                this.creep.rangedHeal(lowestAlly);
            }
        }
        else
        {
            this.creep.heal(this.creep);
        }

    }

    attackEnemies(enemies: Creep[])
    {
        if (getRange(this.creep, this.enemySpawn) <= 3)
        {
            this.creep.rangedAttack(this.enemySpawn);
            return;
        }

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

        let lowest = enemies.sort((a, b) => a.hits - b.hits);

        return lowest[0];
    }
}
