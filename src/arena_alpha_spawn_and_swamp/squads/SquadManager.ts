import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { MoveState } from "arena_alpha_spawn_and_swamp/StateMachine/MoveState";
import { SquadContext } from "arena_alpha_spawn_and_swamp/StateMachine/SquadStateMachine";
import { Creep, StructureSpawn } from "game/prototypes";
import { findClosestByPath, findInRange, getObjectsByPrototype, getRange } from "game/utils";
import { common } from "utils/common";
import { RoleName } from "../../utils/types"
import { Squad } from "./squad";
import { TightSquad } from "./tightSquad";

type states = "TOP" | "BOTTOM" | "DEFEND_SPAWN" | "ATTACK_SPAWN" |  "DEFAULT";

export class SquadManager
{
    private squads: Squad[];
    composition: RoleName[] = ["RANGED_ATTACKER", "RANGED_ATTACKER", "HEALER"];
    gameState:
    {
        enemyCreeps: Creep[],
        enemiesOnTopHalf: Creep[],
        enemiesOnBottomHalf: Creep[],
        enemiesPastMiddle: Creep[]
    }

    squadState: { [key: number]: states }

    constructor()
    {
        this.squads = [];
        this.squadState = {};
        this.gameState = common.getGameState();
    }

    run()
    {
        this.gameState = common.getGameState();
        let allSquadsFull = true;

        for (let squad of this.squads)
        {
            if (!squad.isFull()) { allSquadsFull = false; }

            squad.refresh();

            let context: SquadContext = {
                squad: squad,
                enemies: this.gameState.enemyCreeps,
                enemiesTopSide: this.gameState.enemiesOnTopHalf,
                enemiesBottomSide: this.gameState.enemiesOnBottomHalf
            }

            squad.stateMachine.setContext(context);
            squad.run();

            console.log(`${squad.id}'s State`)
            squad.stateMachine.logState();

            squad.visualize();
        }

        if (allSquadsFull)
        {
            console.log('Adding Squad!');
            this.addSquad(new TightSquad(this.composition));
        }
    }

    addSquad(squad: Squad)
    {
        this.squads.push(squad);
    }

    setSquadStates()
    {
        for (let squad of this.squads)
        {
            let currentState = this.squadState[squad.id];

            console.log(currentState);

            switch (currentState)
            {
                case "DEFAULT":
                    if (this.gameState.enemiesOnTopHalf.length && !Object.values(this.squadState).some(s => s == "TOP"))
                    {
                        this.squadState[squad.id] = "TOP";
                        break;
                    }

                    if (this.gameState.enemiesOnBottomHalf.length && !Object.values(this.squadState).some(s => s == "BOTTOM"))
                    {
                        this.squadState[squad.id] = "BOTTOM";
                        break;
                    }

                    if (this.gameState.enemiesOnTopHalf.length)
                    {
                        this.squadState[squad.id] = "TOP";
                        break;
                    }

                    if (this.gameState.enemiesOnBottomHalf.length)
                    {
                        this.squadState[squad.id] = "TOP";
                        break;
                    }


                    this.squadState[squad.id] = "ATTACK_SPAWN"
                    break;


                case "TOP":
                    if (this.gameState.enemiesOnTopHalf.length == 0)
                    {
                        if (this.gameState.enemiesOnBottomHalf.length)
                        {
                            this.squadState[squad.id] = "BOTTOM"
                        }
                        else
                        {
                            this.squadState[squad.id] = "DEFAULT"
                        }
                    }

                    break;

                case "BOTTOM":
                    if (this.gameState.enemiesOnBottomHalf.length == 0)
                    {
                        if (this.gameState.enemiesOnTopHalf)
                        {
                            this.squadState[squad.id] = "TOP";
                        }
                        else
                        {
                            this.squadState[squad.id] = "DEFAULT"
                        }
                    }

                    break;

                case "ATTACK_SPAWN":
                    if (this.gameState.enemiesOnBottomHalf.length || this.gameState.enemiesOnTopHalf.length)
                    {
                        this.squadState[squad.id] = "DEFAULT";
                    }
                    break;


            }
        }
    }

    shouldRetreat(squad: Squad, enemies: Creep[]): boolean
    {
        for (let roleCreep of squad.roleCreeps)
        {
            let creep = roleCreep.creep;
            let healthPercentage = creep.hits/creep.hitsMax;
            let closestEnemy = findClosestByPath(creep, enemies);
            let damageInRange = common.potentialDamageInRange(creep)
            let potentialNetHealthChange = squad.hps - damageInRange;
            let weOverpower = squad.dps > damageInRange;

            // console.log(`${creep.id} potentialNetHealthChange: ${potentialNetHealthChange}, healthPercentage: ${healthPercentage}, enemiesInRange: ${common.enemiesInRangeOfPosition(creep).length}, weOverpower: ${weOverpower}, this.dps: ${squad.dps}, damageInRange: ${damageInRange}`);

            if (healthPercentage < .45 && potentialNetHealthChange < 0 ||
                (closestEnemy && getRange(creep, closestEnemy) <= 2) ||
                !weOverpower)
            {
                return true;
            }
        }

        return false;
    }

    runState(squad: Squad)
    {
        let currentState = this.squadState[squad.id];
        switch (currentState)
        {
            case "TOP":
                let closestTop = findClosestByPath(squad.roleCreeps[0].creep, this.gameState.enemiesOnTopHalf);
                squad.squadMove(closestTop);
                break;

            case "BOTTOM":
                let closestBottom = findClosestByPath(squad.roleCreeps[0].creep, this.gameState.enemiesOnBottomHalf);
                squad.squadMove(closestBottom);
                break;

            case "DEFEND_SPAWN":
                let mySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my)[0];
                squad.squadMove(mySpawn);
                break;

            case "ATTACK_SPAWN":
                let enemySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => !spawn.my)[0];
                squad.squadMove(enemySpawn);
                break;

        }
    }

    manageSpawning()
    {
        for (let squad of this.squads)
        {
            if (!squad.isFull())
            {
                let rolesNeedeed = squad.getNeededCreeps();
                common.spawnRoleCreep(rolesNeedeed[0], squad);
                return;
            }
        }

        let squad = new TightSquad(["RANGED_ATTACKER", "RANGED_ATTACKER", "HEALER"]);
        this.addSquad(squad);
        console.log(`Creating Squad ${squad.id}, composition ${squad.composition}`);


        let rolesNeedeed = squad.getNeededCreeps();
        common.spawnRoleCreep(rolesNeedeed[0], squad);
    }

}
