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

    constructor(creep: Creep, taskId: number = 0)
    {
        super(creep, "RANGED_ATTACKER", taskId);

        this.mySpawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        this.enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    run ()
    {
        if (!this.creep.exists) { return; }

        this.refreshMemory();
        this.creep.heal(this.creep);
        this.heal();
        this.attackEnemies(this.enemyCreeps);

        // if (this.stateMachine.stateQueue.length == 0)
        // {
        //     // let yVal = Math.random() < 0.5 ? 90 : 10;
        //     // let moveToSpawnState = new CreepMoveState(this, { position: { x: this.creep.x, y: yVal }, range: 3 });
        //     // this.stateMachine.pushState(moveToSpawnState);
        //     let moveToSpawnState = new CreepMoveState(this, { position: this.enemySpawn, range: 3 });
        //     this.stateMachine.pushState(moveToSpawnState);
        // }
        if (this.mySpawn.getRangeTo(this.creep) < 8 && this.stateMachine.currentState instanceof CreepRetreatState)
        {
            this.stateMachine.popState();
        }

        let friendlys = getObjectsByPrototype(Creep).filter(creep => creep.my && this.creep.getRangeTo(creep) <= 4);
        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my && this.creep.getRangeTo(creep) <= 4);
        let netDamageInArea = common.netDamageOutput(friendlys, enemies);

        if (netDamageInArea < 0 &&
            common.shouldRetreat(this.creep) &&
            !(this.stateMachine.currentState instanceof CreepRetreatState))
        {
            if (this.mySpawn.getRangeTo(this.creep) > 8)
            {
                let retreatSpawnState = new CreepRetreatState(this, { toSpawn: true });
                this.stateMachine.pushState(retreatSpawnState);

            } else {
                let retreatSpawnState = new CreepRetreatState(this, { toSpawn: false});
                this.stateMachine.pushState(retreatSpawnState);
            }
        }

        if (this.enemySpawn.getRangeTo(this.creep) <= 3)
        {
            this.creep.rangedAttack(this.enemySpawn);
        }

        // this.stateMachine.logState();
        // console.log
        super.run();
    }

    refreshMemory ()
    {
        this.enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
    }

    heal()
    {
        let friendlyCreeps = getObjectsByPrototype(Creep).filter(creep => creep.my);
        let friendliesInRange = findInRange(this.creep, friendlyCreeps, 1);

        let lowestHp = 999999;
        let lowestAlly = undefined;
        for (let creep of friendliesInRange)
        {
            if (creep.hits < lowestHp && creep.hits != creep.hitsMax)
            {
                lowestHp = creep.hits;
                lowestAlly = creep;
            }
        }

        if (lowestHp < this.creep.hits && lowestAlly)
        {
            // console.log(`${this.creep.id} healing ${lowestAlly.id}`)
            if (this.creep.heal(lowestAlly) == ERR_NOT_IN_RANGE)
            {
                // this.creep.rangedHeal(lowestAlly);
            }
        }
        else
        {
            this.creep.heal(this.creep);
        }

    }

    attackEnemies(enemies: Creep[])
    {
        let visual = new Visual();
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
                visual.circle({ x: target.x, y: target.y-0.5 }, { opacity: 0.2, fill: "#ba0000" })
                this.creep.rangedAttack(target);
            }
        }
    }

    chooseTarget(enemies: Creep[])
    {
        let denseRankThreshold = 100;

        let healers = enemies.filter(creep => creep.body.some(bodyPart => bodyPart.type = HEAL));
        let ranged = enemies.filter(creep => creep.body.some(bodyPart => bodyPart.type = RANGED_ATTACK));
        let melees = enemies.filter(creep => creep.body.some(bodyPart => bodyPart.type = ATTACK));

        let lowest = enemies.sort((a, b) => a.hits - b.hits)[0];
        let lowesetHealer = healers.sort((a, b) => a.hits - b.hits)[0];

        if (lowesetHealer.hits - lowest.hits <= denseRankThreshold)
        {
            return lowesetHealer;
        }

        return lowest;
    }
}
