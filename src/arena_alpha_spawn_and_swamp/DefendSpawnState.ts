import { HEAL, HEAL_POWER } from "game/constants";
import { Creep, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getObjectsByPrototype } from "game/utils";
import { common } from "../utils/common";
import { GameState, RoleName } from "../utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { Task } from "./Task";
import { SharedCostMatrix } from "./SharedCostMatrix";


export class DefendSpawnTask extends Task
{
    enemyAttackers: Creep[] = [];

    constructor(priority: number)
    {
        super();
        this.priority = priority;
        this.name = "Defend Spawn";
        this.updateContext();
    }

    execute()
    {
        // if (this.enemyAttackers.length > 0)
        // {
        //     common.visualizeDamageNearPosition(this.enemyAttackers[0]);
        // }

        for (let roleCreep of this.roleCreepsAssigned)
        {
            roleCreep.stateMachine.clearStates();
            if (!roleCreep.stateMachine.stateQueue.length)
            {
                let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
                if (this.enemyAttackers && this.enemyAttackers.length) {
                    let closestEnemy = spawn.findClosestByPath(this.enemyAttackers);

                    if (closestEnemy != null)
                    {
                        let moveToClosestEnemyState = new CreepMoveState(roleCreep, { position: closestEnemy, range: 3 });

                        roleCreep.stateMachine.pushState(moveToClosestEnemyState);
                    }
                }
            }
            roleCreep.stateMachine.logState();
        }
    }

    isFinished(): Boolean
    {
        return this.getEnemiesClose().length <= 0;
    }

    findBestCandidate(roleCreeps: RoleCreep[]): RoleCreep
    {
        if (roleCreeps.length)
        {
            if (roleCreeps.length == 1)
            {
                return roleCreeps[0];
            }

            let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
            let closestFriendly = spawn.findClosestByPath(roleCreeps.map(x => x.creep));
            let roleCreep = roleCreeps.filter(x => x.creep.exists && x.creep.id === closestFriendly!.id)[0];

            return roleCreep;
        }

        return roleCreeps[0];
    }

    updateContext(gameState: GameState = common.getGameState()): void
    {
        this.enemyAttackers = this.getEnemiesClose();
    }

    assignCreep(roleCreep: RoleCreep)
    {
        super.assignCreep(roleCreep);

        roleCreep.stateMachine.clearStates();

        this.updateContext();
    }

    getRolesNeeded(): RoleName[]
    {
        let myCreeps = this.roleCreepsAssigned.map(x => x.creep);
        var enemyCreeps = this.getEnemiesClose();

        if (enemyCreeps.length)
        {
            let netDamage = common.netDamageOutput(myCreeps, enemyCreeps);
            if (netDamage < 0)
            {
                return ["RANGED_ATTACKER"];
            }
        }

        return [];
    }

    getEnemiesClose(): Creep[]
    {
        let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        let enemyAttackers = getObjectsByPrototype(Creep).filter(creep => !creep.my && creep.exists && common.hasAttackParts(creep) && spawn.getRangeTo(creep) < 30);

        return enemyAttackers ?? [];
    }
}
