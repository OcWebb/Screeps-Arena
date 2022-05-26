import { RoleCreep } from "arena_alpha_spawn_and_swamp/roles/roleCreep";
import { StateMachine } from "../StateMachine";

export class CreepStateMachine extends StateMachine
{
    roleCreep: RoleCreep;

    constructor(roleCreep: RoleCreep)
    {
        super();
        this.roleCreep = roleCreep;
    }

    logState(): void
    {
        console.log(`${this.roleCreep.creep.id}'s State`)
        super.logState();
    }
}
