import { common } from "utils/common";
import { RoleName } from "utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { Task } from "./Task";


export class TaskManager
{
    roleCreeps: RoleCreep[];
    roleCreepsSpawning: RoleCreep[];
    activeTasks: Task[];

    constructor()
    {
        this.roleCreeps = [];
        this.roleCreepsSpawning = [];
        this.activeTasks = [];
    }

    run()
    {
        this.manageCreepMemory();

        // if (!this.activeTasks.length)
        // {
        //     let attackSpawnTask =
        //     this.activeTasks.push();
        // }

        // for (let task of this.activeTasks)
        // {
        //     // re-prioritize and update context
        // }

        // this.activeTasks.sort((taskA, taskB) => taskA.priority - taskB.priority);

        // for (let task of this.activeTasks)
        // {
        //     this.tryAssignUnits(task);
        // }

        for (let roleCreep of this.roleCreeps)
        {
            roleCreep.run();
        }


    }

    tryAssignUnits(task: Task)
    {
        let rolesNeeded = task.getRolesNeeded();
        let unassignedCreeps = this.roleCreeps.filter(roleCreep => roleCreep.taskId == 0)

        for(let i = 0; i < unassignedCreeps.length-1; i++)
        {
            let roleCreep = unassignedCreeps[i];

            if (rolesNeeded.includes(roleCreep.role))
            {
                task.assignCreep(roleCreep);
                rolesNeeded.slice(rolesNeeded.indexOf(roleCreep.role), 1);
            }
        }

        // if (task.priority == 1)
        // {
        //     let roleCreepsOnLowerPriorityTasks: RoleCreep[] = [];
        //     this.activeTasks.filter(task => task.priority > 1).forEach(task => roleCreepsOnLowerPriorityTasks.push(...task.roleCreepsAssigned));

        //     // assign
        // }

    }

    manageCreepMemory()
    {
        for (let idx = 0; idx < this.roleCreepsSpawning.length; idx++)
        {
            let roleCreep = this.roleCreepsSpawning[idx];

            if (roleCreep.creep.exists)
            {
                this.roleCreepsSpawning.splice(idx, 1)
                this.roleCreeps.push(roleCreep);
            }
        }

        for (let idx = 0; idx < this.roleCreeps.length; idx++)
        {
            let roleCreep = this.roleCreeps[idx];

            if (!roleCreep.creep.exists)
            {
                this.roleCreeps.splice(idx, 1)
            }
        }
    }

    spawnRoleCreep(roleName: RoleName)
    {
        let roleCreep = common.spawnRoleCreep(roleName)
        if (roleCreep)
        {
            this.roleCreepsSpawning.push(roleCreep);
        }
    }
}
