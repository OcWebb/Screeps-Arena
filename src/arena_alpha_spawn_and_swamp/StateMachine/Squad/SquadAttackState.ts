import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { TightSquad } from "arena_alpha_spawn_and_swamp/squads/tightSquad";
import { HEAL, RANGED_ATTACK, ATTACK } from "game/constants";
import { Creep, RoomPosition, Structure } from "game/prototypes";
import { findClosestByRange, findInRange, getRange } from "game/utils";
import { IState } from "../IState";
import { SquadMoveState } from "./SquadMoveState";
import { SquadStateMachine } from "./SquadStateMachine";

export type attackContext = { squad: Squad, enemies?: Creep[], structures?: Structure[]}

export class SquadAttackState implements IState
{
    name: string = "ATTACK";
    stateMachine: SquadStateMachine;
    context: attackContext;

    constructor(attackContext: attackContext)
    {
        this.stateMachine = attackContext.squad.stateMachine;
        this.context = attackContext;
    }

    run(): void
    {
        if (this.context.enemies && this.context.enemies.length)
        {
            let enemiesInRange = findInRange(this.context.squad.getPosition(), this.context.enemies, 3);
            let target = this.chooseTarget(enemiesInRange);
            if (enemiesInRange.length && target)
            {
                let moveState = new SquadMoveState(this.context.squad,
                    {
                        position: target,
                        range: 3
                    });

                    this.context.squad.stateMachine.pushState(moveState);
                    this.stateMachine.runState();
                return;
            }
            else
            {
                this.stateMachine.popState();
                this.stateMachine.runState();
            }


            for (let roleCreep of this.context.squad.roleCreeps)
            {
                if (roleCreep.role === "RANGED_ATTACKER")
                {
                    let rangedAttacker = roleCreep as RangedAttacker;
                    rangedAttacker.attackEnemies(this.context.enemies);
                }
            }
        }
        else if (this.context.structures && this.context.structures.length)
        {
            let targetStructure = this.context.structures[0];
            if (this.context.squad.getRange(targetStructure) > 3)
            {
                let moveState = new SquadMoveState(this.context.squad,
                    {
                        position: targetStructure,
                        range: 3
                    });

                    this.context.squad.stateMachine.pushState(moveState);
                    this.stateMachine.runState();
                return;
            }


            for (let roleCreep of this.context.squad.roleCreeps)
            {
                if (roleCreep.role === "RANGED_ATTACKER")
                {
                    let rangedAttacker = roleCreep as RangedAttacker;
                    rangedAttacker.creep.rangedAttack(targetStructure);
                }
            }
        }
        else
        {
            this.stateMachine.popState();
            this.stateMachine.runState();
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

    seralize(): string
    {
        let outputString = `(${this.name}) { `;

        if (this.context.enemies)
        {
            outputString += "enemies: [";
            this.context.enemies.forEach(creep => outputString += creep.id + ", ");
            outputString += "]";
        }

        if (this.context.structures)
        {
            outputString += "structures: [";
            this.context.structures.forEach(struct => outputString += `${struct.x}-${struct.y}, `);
            outputString += "]";
        }

        outputString += "}";

        return outputString;
    }
}
