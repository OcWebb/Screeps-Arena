import { Healer } from "arena_alpha_spawn_and_swamp/roles/healer";
import { MeleeAttacker } from "arena_alpha_spawn_and_swamp/roles/meleeAttacker";
import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/rangedAttacker";
import { Transporter } from "arena_alpha_spawn_and_swamp/roles/transporter";
import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { GameState, Role, RoleName } from "utils/types";
import { getObjectsByPrototype, findInRange, getRange, findClosestByPath, getTerrainAt } from "game";
import { ATTACK, ATTACK_POWER, BodyPartConstant, BODYPART_COST, BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, CARRY, DirectionConstant, HEAL, HEAL_POWER, LEFT, MOVE, RANGED_ATTACK, RANGED_ATTACK_DISTANCE_RATE, RANGED_ATTACK_POWER, RESOURCE_ENERGY, RIGHT, TERRAIN_WALL, TOP, TOP_LEFT, TOP_RIGHT, TOUGH, WORK } from "game/constants";
import { CostMatrix } from "game/path-finder";
import { Creep, RoomPosition, StructureSpawn } from "game/prototypes";
import { Visual } from "game/visual";
import { SharedCostMatrix } from "arena_alpha_spawn_and_swamp/SharedCostMatrix";
import { RoleCreep } from "arena_alpha_spawn_and_swamp/roles/roleCreep";
import { CreepMoveState } from "arena_alpha_spawn_and_swamp/StateMachine/Creep/CreepMoveState";

export const ROLE_PARTS: { [key in RoleName]: BodyPartConstant[] } =
{
    "TRANSPORTER": [WORK, CARRY, CARRY, MOVE, MOVE],
    "MELEE_ATTACKER": [ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
    "RANGED_ATTACKER": [ MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, RANGED_ATTACK],
    "HEALER": [MOVE, MOVE, MOVE, MOVE, MOVE, HEAL],
}

export var common =
{


    getPositionFromDirection(position: RoomPosition, direction: DirectionConstant)
    {
        let newPosition = { x: position.x, y: position.y }
        switch (direction)
        {
            case TOP_LEFT:
                newPosition = { x: position.x - 1, y: position.y - 1 }
                break;

            case TOP:
                newPosition = { x: position.x, y: position.y - 1 }
                break;

            case TOP_RIGHT:
                newPosition = { x: position.x + 1, y: position.y - 1 }
                break;

            case RIGHT:
                newPosition = { x: position.x + 1, y: position.y }
                break;

            case BOTTOM_RIGHT:
                newPosition = { x: position.x + 1, y: position.y + 1 }
                break;

            case BOTTOM:
                newPosition = { x: position.x, y: position.y + 1 }
                break;

            case BOTTOM_LEFT:
                newPosition = { x: position.x - 1, y: position.y + 1 }
                break;

            case LEFT:
                newPosition = { x: position.x - 1, y: position.y }
                break;
        }

        return newPosition;
    },

    visualizeCostMatrix(costMatrix: CostMatrix, position: RoomPosition, size: number = 4)
    {
        let visual = new Visual();
        for (let xoff = -size; xoff <= size; xoff++)
        {
            for (let yoff = -size; yoff <= size; yoff++)
            {
                let currentX = position.x + xoff;
                let currentY = position.y + yoff;

                if (currentX > 100 || currentX < 0 || currentY > 100 || currentY < 0) { continue; }

                let cost = costMatrix.get(currentX, currentY) ?? 0;
                let color = cost <= 10 ? "#ffffff" : cost < 255 ? "#e0a400" : "#ff0000";

                // new Visual().text(currentX + ", " + currentY, { x: currentX - 0.2, y: currentY - 0.2 }, { font: 0.25, align: 'left', color: color });
                visual.text("CM:" + cost.toString(), { x: currentX, y: currentY }, { font: 0.25, align: 'center', color: color });
            }
        }
    },

    visualizeDamageNearPosition(position: RoomPosition, size: number = 6)
    {
        let visual = new Visual();
        for (let xoff = -size; xoff <= size; xoff++)
        {
            for (let yoff = -size; yoff <= size; yoff++)
            {
                let currentX = position.x + xoff;
                let currentY = position.y + yoff;

                if (currentX > 100 || currentX < 0 || currentY > 100 || currentY < 0) { continue; }

                let damage = SharedCostMatrix.getDamageAtPosition(currentX, currentY);
                let color = damage <= 20 ? "#ffffff" : damage <= 40 ? "#ede21c" : damage <= 60 ? "#e5a21b" : damage <= 80 ? "#e0a400" : "#ff0000";

                // new Visual().text(currentX + ", " + currentY, { x: currentX - 0.2, y: currentY - 0.2 }, { font: 0.25, align: 'left', color: color });
                visual.text("D:" + damage.toString(), { x: currentX, y: currentY-0.3 }, { font: 0.25, align: 'center', color: color });
            }
        }
    },

    samePosition(positionOne: RoomPosition, positionTwo: RoomPosition)
    {
        return  positionOne.x == positionTwo.x &&
                positionOne.y == positionTwo.y
    },

    getCreepParts(maxEnergy: number, parts: BodyPartConstant[])
    {
        let body: BodyPartConstant[] = [];
        let ratioCost = 0;

        for(let bodyPart of parts)
        {
            ratioCost += BODYPART_COST[bodyPart];
        }

        let partsMultiple = Math.floor(maxEnergy / ratioCost)
        for(let i = 0; i < parts.length; i++)
        {
            for(let j = 0; j < partsMultiple; j++)
            {
                body.push(parts[i]);
            }
        }

        return body;
    },

    spawnRoleCreep (role: RoleName, squad?: Squad): Role | undefined
    {
        let spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
        let creepParts = common.getCreepParts(spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0, ROLE_PARTS[role]);
        let spawnedCreep = spawn.spawnCreep(creepParts);
        let creep = spawnedCreep.object;

        if (!spawnedCreep.error && creep)
        {
            switch (role)
            {
                case "TRANSPORTER":
                    let transporter = new Transporter(creep);
                    if (squad) { squad.addCreep(transporter) }
                    return transporter;

                case "MELEE_ATTACKER":
                    let meleeAttacker = new MeleeAttacker(creep);
                    if (squad) { squad.addCreep(meleeAttacker) }
                    return meleeAttacker;

                case "RANGED_ATTACKER":
                    let rangedAttacker = new RangedAttacker(creep);
                    if (squad) { squad.addCreep(rangedAttacker) }

                    let xPosition = spawn.x > 50 ? spawn.x - 7 : spawn.x + 7;
                    // TODO: add position param to method so main.js logic can better dictate where to send them on spawning
                    let clearSpawnAreaState = new CreepMoveState(rangedAttacker,
                        {
                            position: { x: xPosition, y: spawn.y },
                            range: 2
                        });
                    rangedAttacker.stateMachine.pushState(clearSpawnAreaState);

                    return rangedAttacker;

                case "HEALER":
                    let healer = new Healer(creep);
                    if (squad) { squad.addCreep(healer) }
                    return healer;
            }
        }

        return undefined;
    },

    // COMBAT

    hasAttackParts (creep: Creep)
    {
        return creep.body.some( (part) => part.hits > 0 && (part.type == RANGED_ATTACK || part.type == ATTACK) );
    },

    enemiesInRangeOfPosition(position: RoomPosition)
    {
        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let ranged = enemyCreeps.filter(creep => creep.body.some(bodyPart => bodyPart.type = RANGED_ATTACK));
        let melee = enemyCreeps.filter(creep => creep.body.some(bodyPart => bodyPart.type = ATTACK));
        let rangedEnemyCreepsInRange = findInRange(position, ranged, 4);
        let meleeEnemyCreepsInRange = findInRange(position, melee, 2);

        return rangedEnemyCreepsInRange.concat(meleeEnemyCreepsInRange);
    },

    potentialDamageInRange(position: RoomPosition, my:boolean = false): number
    {
        let enemies = getObjectsByPrototype(Creep).filter(creep => creep.my == my)
        let netDamage = 0;

        for (let enemyCreep of enemies)
        {
            let rangeToPosition = getRange(position, enemyCreep);

            let rangedAttackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === RANGED_ATTACK && bodyPart.hits > 0);
            if (rangeToPosition <= 4 && rangedAttackParts.length)
            {
                if (rangeToPosition == 4) { rangeToPosition = 3; }

                netDamage += RANGED_ATTACK_POWER * rangedAttackParts.length;
            }

            let attackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === ATTACK && bodyPart.hits > 0);
            // console.log("parts " + attackParts.length)
            if (rangeToPosition <= 2 && attackParts.length)
            {
                netDamage += ATTACK_POWER * attackParts.length;
            }
        }

        return netDamage;
    },

    addEnemyDamageToCostMatrix(roleCreep: RoleCreep, costMatrix: CostMatrix): CostMatrix
    {
        let healthRemaining = roleCreep.creep.hits
        let size = 4;

        for (let xoff = -size; xoff <= size; xoff++)
        {
            for (let yoff = -size; yoff <= size; yoff++)
            {
                let currentX = roleCreep.creep.x + xoff;
                let currentY = roleCreep.creep.y + yoff;

                if (currentX > 100 || currentX < 0 || currentY > 100 || currentY < 0) { continue; }

                let damage = SharedCostMatrix.getDamageAtPosition(currentX, currentY);
                if (damage - roleCreep.hps <= 0)
                {
                    continue;
                }

                // let ticksToLive = Math.ceil(healthRemaining / damage);
                // ticksToLive = Math.min(ticksToLive, 15);

                // if (ticksToLive < 15)
                // {
                //     let weight = 15 - ticksToLive;
                //     costMatrix.set(currentX, currentY, weight);
                //     continue;
                // }

                if (damage > roleCreep.dps)
                {
                    let cost = Math.min(damage, 200)/10;

                    costMatrix.set(currentX, currentY, cost);
                }
            }
        }

        // common.visualizeCostMatrix(costMatrix, roleCreep.creep, 5);
        return costMatrix;
    },

    damageOutput(creeps: Creep[]): number
    {
        let netDamage = 0;

        for (let enemyCreep of creeps)
        {
            if(enemyCreep.body == undefined || !enemyCreep.exists) continue;

            let rangedAttackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === RANGED_ATTACK && bodyPart.hits > 0);
            netDamage += RANGED_ATTACK_POWER * rangedAttackParts.length;

            let attackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === ATTACK && bodyPart.hits > 0);
            netDamage += ATTACK_POWER * attackParts.length;
        }

        return netDamage;
    },

    netDamageOutput(friendlyCreeps: Creep[], hostileCreeps: Creep[]): number
    {
        let enemyHealing = this.healOutput(hostileCreeps);
        let netFriendlyDamageOutput = this.damageOutput(friendlyCreeps) - enemyHealing;
        netFriendlyDamageOutput = netFriendlyDamageOutput < 0 ? 0 : netFriendlyDamageOutput;

        let friendlyHealing = this.healOutput(friendlyCreeps);
        let netHostileDamageOutput = this.damageOutput(hostileCreeps) - friendlyHealing;

        netHostileDamageOutput = netHostileDamageOutput < 0 ? 0 : netHostileDamageOutput;

        return netFriendlyDamageOutput - netHostileDamageOutput;

    },

    healOutput(creeps: Creep[])
    {
        let netHealing = 0;
        if (creeps.length)
        {
            for (let enemyCreep of creeps)
            {
                if (enemyCreep.exists && enemyCreep.body.length)
                {
                    let healParts = enemyCreep.body.filter(bodyPart => bodyPart.type === HEAL && bodyPart.hits > 0);
                    netHealing += HEAL_POWER * healParts.length;

                }
            }
        }


        return netHealing;
    },

    getGameState(): GameState
    {
        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let mySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my)[0];
        let enemySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => !spawn.my)[0];

        let enemiesOnTopHalf = enemyCreeps.filter(creep => creep.y < 20);
        let enemiesOnBottomHalf = enemyCreeps.filter(creep => creep.y > 80);
        let enemiesPastMiddle = enemyCreeps.filter(creep => creep.x >= 50)

        // console.log(`enemies - Top: ${enemiesOnTopHalf.length}, Bottom: ${enemiesOnBottomHalf.length}, Middle: ${enemiesPastMiddle.length},`);

        let info =
        {
            enemyCreeps,
            enemiesOnTopHalf,
            enemiesOnBottomHalf,
            enemiesPastMiddle,
            enemySpawn
        }

        return info;
    },

    shouldRetreat(creep: Creep): boolean
    {
        let healthPercentage = creep.hits/creep.hitsMax;
        let allEnemies = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let closestEnemy = findClosestByPath(creep, allEnemies);

        if (closestEnemy == null)
        {
            return false;
        }

        if (getRange(creep, closestEnemy) < 3)
        {
            return true;
        }

        let damageInRange = SharedCostMatrix.getDamageAtPosition(creep.x, creep.y); //this.potentialDamageInRange(creep)
        let myDpsInRange = this.potentialDamageInRange(closestEnemy, true);
        let hps = 0;
        creep.body.filter(bodyPart => bodyPart.type == HEAL).forEach(bodyPart => hps += HEAL_POWER)
        let potentialNetHealthChange = hps - damageInRange;

        // account for my creeps in area
        let weOverpower = myDpsInRange >= damageInRange;

        if (healthPercentage < .40 && potentialNetHealthChange < 0)
        {
            return true;
        }

        if (!weOverpower)
        {
            return true;
        }

        return false;
    }

}

