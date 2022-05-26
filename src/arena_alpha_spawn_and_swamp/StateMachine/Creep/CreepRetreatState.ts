import { RoleCreep } from "arena_alpha_spawn_and_swamp/roles/roleCreep";
import { SharedCostMatrix } from "arena_alpha_spawn_and_swamp/SharedCostMatrix";
import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { TightSquad } from "arena_alpha_spawn_and_swamp/squads/tightSquad";
import { ATTACK, HEAL, HEAL_POWER, RANGED_ATTACK, RANGED_ATTACK_POWER } from "game/constants";
import { CostMatrix, searchPath } from "game/path-finder";
import { Creep, RoomPosition } from "game/prototypes";
import { findClosestByPath, findInRange, getObjectsByPrototype, getRange } from "game/utils";
import { Visual } from "game/visual";
import { common } from "utils/common";
import { IState } from "../IState";
import { SquadStateMachine } from "../Squad/SquadStateMachine";
import { CreepStateMachine } from "./CreepStateMachine";

type retreatContext = { }

export class CreepRetreatState implements IState
{
    name: string = "RETREAT";
    roleCreep: RoleCreep;
    stateMachine: CreepStateMachine;
    context: retreatContext;

    constructor(roleCreep: RoleCreep, moveContext: retreatContext)
    {
        this.roleCreep = roleCreep;
        this.stateMachine = roleCreep.stateMachine;
        this.context = moveContext;
    }

    run(): void
    {
        let myRoleCreep = this.stateMachine.roleCreep;
        let allEnemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let rangedAttackers = allEnemies.filter(creep => creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK));
        let meleeAttackers = allEnemies.filter(creep => creep.body.some(bodyPart => bodyPart.type == ATTACK));
        let enemiesToFleeFrom: { pos: RoomPosition; range: number; }[] = [];

        for (let meleeAttacker of meleeAttackers)
        {
            if (getRange(myRoleCreep.creep, meleeAttacker) <= 2)
            {
                enemiesToFleeFrom.push({ pos: meleeAttacker, range: 3 });
            }
        }

        for (let rangedAttacker of rangedAttackers)
        {
            if (getRange(myRoleCreep.creep, rangedAttacker) <= 4)
            {
                enemiesToFleeFrom.push({ pos: rangedAttacker, range: 8 });
            }
        }

        if (enemiesToFleeFrom.length)
        {
            let costMatrix = SharedCostMatrix.getCostMatrix();
            common.addEnemyDamageToCostMatrix(this.roleCreep, costMatrix);

            let fleePath = searchPath(myRoleCreep.creep, enemiesToFleeFrom, { flee: true, costMatrix: costMatrix, swampCost: 2, range: 8 });

            if (fleePath.path.length)
            {
                // move by direction
                new Visual(10, false).poly(fleePath.path, {stroke: "#db2020"});
                myRoleCreep.roleMoveTo(fleePath.path[0]);
            } else {
                console.log(`Creep (${myRoleCreep.creep.id}) cannot find valid retreat path`);
            }
        }
        else
        {
            if (!common.shouldRetreat(this.roleCreep.creep))
            {
                this.stateMachine.popState();
            }
        }
    }

    seralize(): string
    {
        return `(${this.name})`
    }
}
