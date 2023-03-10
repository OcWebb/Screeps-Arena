import { ERR_NOT_IN_RANGE, HEAL, HEAL_POWER, RESOURCE_ENERGY, STRUCTURE_PROTOTYPES } from "game/constants";
import { ConstructionSite, Creep, RoomPosition, StructureContainer, StructureExtension, StructureSpawn, StructureTower } from "game/prototypes";
import { findClosestByPath, findClosestByRange, findInRange, getObjectsByPrototype, createConstructionSite } from "game/utils";
import { common } from "../utils/common";
import { GameState, RoleName } from "../utils/types";
import { RoleCreep } from "./roles/roleCreep";
import { CreepMoveState } from "./StateMachine/Creep/CreepMoveState";
import { Task } from "./Task";
import { CreepGatherEnergyState } from "./StateMachine/Creep/CreepGatherEnergyState";


export class manageFobTask extends Task
{
    fobPosition: RoomPosition;
    sideText: String;

    constructor(priority: number, fobPosition: RoomPosition)
    {
        super();
        this.priority = priority;
        this.fobPosition = fobPosition;
        this.sideText = fobPosition.y < 50 ? "Bottom" : "Top";
        this.name = "Manage FOB " + this.sideText;
        this.updateContext();
    }

    execute()
    {
        let transporters = this.roleCreepsAssigned.filter(roleCreep => roleCreep.role == "TRANSPORTER");
        let rangedAttackers = this.roleCreepsAssigned.filter(roleCreep => roleCreep.role == "RANGED_ATTACKER");
        let extensions = findInRange(this.fobPosition, getObjectsByPrototype(StructureExtension).filter(e => e.my), 3);
        let constructionSites = findInRange(this.fobPosition, getObjectsByPrototype(ConstructionSite), 3);

        
        if (extensions.length + constructionSites.length < 5)
        {
            let createdSites = 0;
            for (let x = -1; x <= 1; x++)
            {
                for (let y = -1; y <= 1; y++)
                {
                    let xCurr = this.fobPosition.x + x;
                    let yCurr = this.fobPosition.y + y;
                    if (!extensions.some(e => e.x == xCurr && e.y == yCurr) && !(x==0 && y==0))
                    {
                        if (extensions.length + constructionSites.length + createdSites >= 5) { break; }

                        let res = createConstructionSite({ x: xCurr, y: yCurr }, StructureExtension);
                        if (res.error)
                        {
                            console.log("FOB " + this.sideText + " build c-site (" + xCurr + ", " + yCurr + "): Error " + res.error);
                        } else {
                            createdSites++;
                        }
                        constructionSites = findInRange(this.fobPosition, getObjectsByPrototype(ConstructionSite), 3);
                    }
                }
            }
        }

        let filledContainers = getObjectsByPrototype(StructureContainer).filter(container => container.store.getUsedCapacity(RESOURCE_ENERGY) != 0);
        for (let roleCreep of transporters)
        {
            // roleCreep.stateMachine.clearStates();
            if (roleCreep.stateMachine.stateQueue.length == 0)
            {
                let container = findClosestByPath(roleCreep.creep, filledContainers);
                console.log(roleCreep.creep.store.getUsedCapacity(RESOURCE_ENERGY));
                if(roleCreep.creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0)
                {
                    let moveState = new CreepGatherEnergyState(roleCreep, { energySource: container });
                    roleCreep.stateMachine.pushState(moveState);
                }
                else
                {
                    let notFullExtensions = extensions.filter(e => e != null && (e!?.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0);

                    if (extensions.length && notFullExtensions.length)
                    {
                        let notFullExtensions = extensions.filter(e => e != null && (e!?.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0) > 0);
                        if (notFullExtensions.length > 0){
                            let closestExtension = findClosestByPath(roleCreep.creep, notFullExtensions);
                            if(closestExtension != null && roleCreep.creep.transfer(closestExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            {
                                let moveState = new CreepMoveState(roleCreep, { position: closestExtension, range: 1 });
                                roleCreep.stateMachine.pushState(moveState);
                            }

                        }
                    }
                    else if (constructionSites.length)
                    {
                        let highestProgress = -1;
                        let highestBuildConstructionSite = constructionSites[0];
                        for (let constructionSite of constructionSites)
                        {
                            if (constructionSite.progress ?? 0 > highestProgress)
                            {
                                highestProgress = constructionSite.progress ?? 0;
                                highestBuildConstructionSite = constructionSite;
                            }
                        }

                        if(roleCreep.creep.build(highestBuildConstructionSite) == ERR_NOT_IN_RANGE)
                        {
                            let moveState = new CreepMoveState(roleCreep, { position: highestBuildConstructionSite, range: 1 });
                            roleCreep.stateMachine.pushState(moveState);
                        }
                    }
                }

            }

            roleCreep.stateMachine.logState();
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
        // if (roleCreeps.length)
        // {
        //     let closestFriendly = this.fobPosition.findClosestByPath(roleCreeps.map(x => x.creep));
        //     let roleCreep = roleCreeps.filter(x => x.creep.exists && x.creep.id === closestFriendly!.id)[0];

        //     return roleCreep;
        // }

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
        let rolesNeeded: RoleName[] = [];
        if (this.roleCreepsAssigned.filter(roleCreep => roleCreep.role == "TRANSPORTER").length < 2)
        {
            rolesNeeded.push("TRANSPORTER");
        }

        if (this.roleCreepsAssigned.filter(roleCreep => roleCreep.role == "RANGED_ATTACKER").length < 1)
        {
            rolesNeeded.push("RANGED_ATTACKER");
        }

        return rolesNeeded;
    }
}
