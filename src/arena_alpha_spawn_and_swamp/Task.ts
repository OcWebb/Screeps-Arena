import { Creep } from "game/prototypes";
import { RoleName } from "utils/types";
import { RoleCreep } from "./roles/roleCreep";


export class Task
{
    roleCreepsAssigned: RoleCreep[];

    priority: number;
    completed: boolean = false;
    id: number;
    static idsInUse: number[] = [];
    static allTasks: Task[] = [];

    constructor()
    {
        this.roleCreepsAssigned = [];
        this.priority = 999;

        let id = Math.floor(Math.random()*100);
        while (id in Task.idsInUse)
        {
            id = Math.floor(Math.random()*100);
        }
        this.id = id;

    }

    execute()
    {
        // remove any creeps reassigned
        for (let idx = 0; idx < this.roleCreepsAssigned.length; idx++)
        {
            let roleCreep = this.roleCreepsAssigned[idx];

            if (roleCreep.taskId !== this.id)
            {
                this.roleCreepsAssigned.splice(idx, 1);
            }
        }
    }

    assignCreep(roleCreep: RoleCreep)
    {
        this.roleCreepsAssigned.push(roleCreep);
        roleCreep.taskId = this.id;
    }

    onFinish()
    {
        this.roleCreepsAssigned.forEach(roleCreep => roleCreep.taskId = 0);
    }

    getRolesNeeded(): RoleName[]
    {
        return [];
    }
}
