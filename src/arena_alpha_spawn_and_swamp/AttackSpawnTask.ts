import { HEAL, HEAL_POWER } from "game/constants";
import { Creep, StructureSpawn } from "game/prototypes";
import { findClosestByPath, getObjectsByPrototype } from "game/utils";
import { common } from "../utils/common";
import { GameState, RoleName } from "../utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { Task } from "./Task";


export class AttackSpawnTask extends Task
{
    constructor(priority: number)
    {
        super();
        this.priority = priority;
        this.name = "Attack Spawn";
        this.updateContext();
    }

    execute()
    {
        for (let roleCreep of this.roleCreepsAssigned)
        {
            if (!roleCreep.stateMachine.stateQueue.length)
            {
                let spawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
                let moveToSpawnState = new CreepMoveState(roleCreep, { position: spawn, range: 2 });
                roleCreep.stateMachine.pushState(moveToSpawnState);
            }
        }
    }

    isFinished(): Boolean
    {
        return false;
    }

    updateContext(gameState: GameState = common.getGameState()): void
    {
    }

    findBestCandidate(roleCreeps: RoleCreep[]): RoleCreep
    {
        if (roleCreeps.length)
        {
            let spawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
            let closestFriendly = spawn.findClosestByPath(roleCreeps.map(x => x.creep));
            let roleCreep = roleCreeps.filter(x => x.creep.exists && x.creep.id === closestFriendly!.id)[0];

            return roleCreep;
        }

        return roleCreeps[0];
    }

    assignCreep(roleCreep: RoleCreep)
    {
        super.assignCreep(roleCreep);

        roleCreep.stateMachine.clearStates();

        this.updateContext();
    }

    getRolesNeeded(): RoleName[]
    {
        return ["RANGED_ATTACKER"];
    }
}
