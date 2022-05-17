import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { TightSquad } from "arena_alpha_spawn_and_swamp/squads/tightSquad";
import { HEAL, RANGED_ATTACK, ATTACK } from "game/constants";
import { Creep, RoomPosition, Structure } from "game/prototypes";
import { findClosestByRange, getRange } from "game/utils";
import { IState } from "../IState";
import { SquadMoveState } from "./SquadMoveState";
import { SquadStateMachine } from "./SquadStateMachine";

export type attackContext = { squad: Squad, enemies?: Creep[], structures?: Structure}

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
            let target = this.chooseTarget(this.context.enemies);
            if (this.context.squad.getRange(this.context.enemies) > 3)
            {
                let moveState = new SquadMoveState(this.context.squad,
                    {
                        position: target,
                        range: 3
                    });

                    this.context.squad.stateMachine.pushState(moveState);
                return;
            }


            for (let roleCreep of this.context.squad.roleCreeps)
            {
                if (roleCreep.role === "RANGED_ATTACKER")
                {
                    let rangedAttacker = roleCreep as RangedAttacker;
                    rangedAttacker.attackEnemies(this.context.enemies);
                }
            }
        } else {
            this.stateMachine.popState();
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

        outputString += "}";

        return outputString;
    }
}
