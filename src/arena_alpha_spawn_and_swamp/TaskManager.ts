import { common } from "../utils/common";
import { RoleName } from "../utils/types";
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
        // this.manageCreepMemory();
        var gameState = common.getGameState();
        this.removeDeadCreeps();

        for (let task of this.activeTasks)
        {
            // re-prioritize and update context
            task.updateContext(gameState);
            task.execute();
            if (task.isFinished())
            {
                task.roleCreepsAssigned.forEach(c => c.taskId = 0);
                this.activeTasks.splice(this.activeTasks.indexOf(task), 1);
            }
        }

        this.activeTasks.sort((taskA, taskB) => taskA.priority - taskB.priority);

        for (let task of this.activeTasks)
        {
            this.tryAssignUnits(task);
        }

        this.reassignCreepsToTasks();

        for (let roleCreep of this.roleCreeps)
        {
            roleCreep.run();
            // roleCreep.stateMachine.logState();
        }
    }

    addTask(task: Task)
    {
        this.activeTasks.push(task);
    }

    tryAssignUnits(task: Task)
    {
        let rolesNeeded = task.getRolesNeeded();

        if (rolesNeeded == undefined || rolesNeeded.length == 0) { return; }

        let unassignedCreeps = this.roleCreeps.filter(roleCreep => roleCreep.creep.exists && roleCreep.taskId == 0)
        if (unassignedCreeps.length)
        {
            let unassignedCreepsOfNeededRole = unassignedCreeps.filter(roleCreep => rolesNeeded.includes(roleCreep.role));

            while (unassignedCreepsOfNeededRole.length)
            {
                let findBestCreep = task.findBestCandidate(unassignedCreepsOfNeededRole);
                console.log("Assigning creep " + findBestCreep.creep.id +  " to task (" + task.id+")" + task.name);
                console.log(JSON.stringify(findBestCreep.creep))

                task.assignCreep(findBestCreep);

                rolesNeeded = task.getRolesNeeded()
                unassignedCreeps = this.roleCreeps.filter(roleCreep => roleCreep.creep.exists && roleCreep.taskId == 0)
                if (rolesNeeded == undefined || rolesNeeded.length == 0)
                {
                    break;
                }

                unassignedCreepsOfNeededRole = unassignedCreeps.filter(x => rolesNeeded.includes(x.role))
            }
        }
    }

    reassignCreepsToTasks()
    {
        this.activeTasks.sort((taskA, taskB) => taskA.priority - taskB.priority);

        if (this.activeTasks)
        {
            for (let i = 0; i < this.activeTasks.length; i++)
            {
                let task = this.activeTasks[i];
                let neededRoles = task.getRolesNeeded();
                if (neededRoles == undefined || !neededRoles.length)
                {
                    continue;
                }

                let applicableCreeps: RoleCreep[] = [];
                for (let j=i+1; j < this.activeTasks.length; j++)
                {
                    let taskToMoveFrom = this.activeTasks[j];
                    let creepsWithNeededRole = taskToMoveFrom.roleCreepsAssigned.filter(x => neededRoles.includes(x.role) && x.creep.exists);
                    if (creepsWithNeededRole.length)
                    {
                        creepsWithNeededRole.forEach(x => applicableCreeps.push(x));
                    }
                }

                if (applicableCreeps.length)
                {
                    while (applicableCreeps.length)
                    {
                        let findBestCreep = task.findBestCandidate(applicableCreeps);

                        for (let task of this.activeTasks)
                        {
                            var matchingCreeps = task.roleCreepsAssigned.filter(x => x.creep.id === findBestCreep.creep.id);
                            if(matchingCreeps.length)
                            {
                                task.roleCreepsAssigned.splice(task.roleCreepsAssigned.indexOf(matchingCreeps[0]), 1);

                                break;
                            }
                        }

                        task.assignCreep(findBestCreep);
                        console.log("Reassigning creep " + findBestCreep.creep.id +  " to task " + task.name + "(" + task.id+")");

                        applicableCreeps.splice(applicableCreeps.indexOf(findBestCreep), 1);
                        let neededRoles = task.getRolesNeeded();
                        if (neededRoles == undefined || !neededRoles.length)
                        {
                            break;
                        }
                    }
                }
            }
        }
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

    removeDeadCreeps()
    {
        for (let roleCreep of this.roleCreeps)
        {
            if (!roleCreep.creep.exists)
            {
                let taskAssigned = roleCreep.taskId;
                if (taskAssigned > 0)
                {
                    let task = this.activeTasks.find(t => t.id == taskAssigned);
                    if (task)
                    {
                        task.roleCreepsAssigned = task.roleCreepsAssigned.filter(r => r.creep.id != roleCreep.creep.id);
                    }
                }
                this.roleCreeps = this.roleCreeps.filter(r => r.creep.id != roleCreep.creep.id);
            }
        }
    }

    logTasks()
    {
        console.log("\n\t   Task List");
        for (let task of this.activeTasks)
        {
            let isFull = task.getRolesNeeded().length == 0;
            console.log("\t|" + task.priority + "| " + "(id: " + task.id + ") " + task.name + (isFull ? " FULL" : ""));
            var creepIdString = "";
            task.roleCreepsAssigned.forEach(x => { if (x != undefined) creepIdString += x.creep.id + ", " });
            console.log("\t| |\t" + task.roleCreepsAssigned.length + " Creep(s): " + creepIdString);
        }
        console.log("\n");
    }
}
