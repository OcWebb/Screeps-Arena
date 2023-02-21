import { HEAL, HEAL_POWER } from "game/constants";
import { Creep, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getObjectsByPrototype } from "game/utils";
import { common } from "../utils/common";
import { GameState, RoleName } from "../utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { Task } from "./Task";


export class DefendBottomLaneTask extends Task
{
    enemies: Creep[] = [];
    netDps: number = 0;

    constructor(priority: number)
    {
        super();
        this.priority = priority;
        this.name = "Defend Bottom Lane";
        this.updateContext();
    }

    execute()
    {
        for (let roleCreep of this.roleCreepsAssigned)
        {
            let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
            let closestToSpawn = findClosestByPath(spawn, this.enemies);

            roleCreep.stateMachine.clearStates();
            if (!roleCreep.stateMachine.stateQueue.length)
            {

                if (closestToSpawn)
                {
                    let moveToEnemyState = new CreepMoveState(roleCreep, { position: closestToSpawn, range: 3 });
                    roleCreep.stateMachine.pushState(moveToEnemyState);
                }
            }
        }
    }

    findBestCandidate(roleCreeps: RoleCreep[]): RoleCreep
    {
        if (roleCreeps.length)
        {
            let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
            let closestToSpawn = findClosestByPath(spawn, this.enemies);
            let closestFriendly = closestToSpawn.findClosestByPath(roleCreeps.map(x => x.creep));
            let roleCreep = roleCreeps.filter(x => x.creep.exists && x.creep.id === closestFriendly!.id)[0];

            return roleCreep;
        }

        return roleCreeps[0];
    }

    isFinished(): Boolean
    {
        return this.getEnemiesBottomSide().length === 0;
    }

    updateContext(gameState: GameState = common.getGameState()): void
    {
        this.enemies = this.getEnemiesBottomSide();
        if (this.enemies != undefined && this.enemies.length && this.roleCreepsAssigned.filter(x => x.creep.exists).map(x => x.creep) != undefined)
        {
            this.netDps = common.netDamageOutput(this.roleCreepsAssigned.filter(x => x.creep.exists).map(x => x.creep), this.enemies);
        }
    }

    assignCreep(roleCreep: RoleCreep)
    {
        super.assignCreep(roleCreep);

        roleCreep.stateMachine.clearStates();

        this.updateContext();
    }

    getRolesNeeded(): RoleName[]
    {
        if (this.netDps < 0)
        {
            return ["RANGED_ATTACKER"];
        }

        return [];
    }

    getEnemiesBottomSide(): Creep[]
    {
        let enemyAttackers = getObjectsByPrototype(Creep).filter(creep => !creep.my && creep.exists && common.hasAttackParts(creep));

        return enemyAttackers?.filter(creep => creep.y > 75) ?? [];
    }
}
