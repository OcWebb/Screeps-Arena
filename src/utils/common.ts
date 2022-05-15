import { Healer } from "arena_alpha_spawn_and_swamp/roles/Healer";
import { MeleeAttacker } from "arena_alpha_spawn_and_swamp/roles/MeleeAttacker";
import { RangedAttacker } from "arena_alpha_spawn_and_swamp/roles/RangedAttacker";
import { Transporter } from "arena_alpha_spawn_and_swamp/roles/transporter";
import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { Role, RoleName } from "utils/types";
import { getObjectsByPrototype, findInRange, getRange } from "game";
import { ATTACK, ATTACK_POWER, BodyPartConstant, BODYPART_COST, BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, CARRY, DirectionConstant, HEAL, LEFT, MOVE, RANGED_ATTACK, RANGED_ATTACK_DISTANCE_RATE, RANGED_ATTACK_POWER, RESOURCE_ENERGY, RIGHT, TOP, TOP_LEFT, TOP_RIGHT } from "game/constants";
import { CostMatrix } from "game/path-finder";
import { Creep, RoomPosition, StructureSpawn } from "game/prototypes";
import { Visual } from "game/visual";

export const ROLE_PARTS: { [key in RoleName]: BodyPartConstant[] } =
{
    "TRANSPORTER": [CARRY, MOVE, MOVE],
    "MELEE_ATTACKER": [ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
    "RANGED_ATTACKER": [MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK],
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
                let cost = costMatrix.get(currentX, currentY) ?? 0;
                let color = cost <= 10 ? "#ffffff" : cost < 255 ? "#e0a400" : "#ff0000";

                // new Visual().text(currentX + ", " + currentY, { x: currentX - 0.2, y: currentY - 0.2 }, { font: 0.25, align: 'left', color: color });
                visual.text(cost.toString(), { x: currentX, y: currentY }, { font: 0.25, align: 'center', color: color });
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

    potentialDamageInRange(position: RoomPosition): number
    {
        let enemies = getObjectsByPrototype(Creep).filter(creep => !creep.my)
        let netDamage = 0;

        for (let enemyCreep of enemies)
        {
            let rangeToPosition = getRange(position, enemyCreep);

            let rangedAttackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === RANGED_ATTACK && bodyPart.hits > 0);
            if (rangeToPosition <= 4 && rangedAttackParts.length)
            {
                if (rangeToPosition == 4) { rangeToPosition = 3; }

                netDamage += (RANGED_ATTACK_POWER * RANGED_ATTACK_DISTANCE_RATE[rangeToPosition]) * rangedAttackParts.length;
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

    enemyDamageOutput(enemies: Creep[])
    {
        let netDamage = 0;

        for (let enemyCreep of enemies)
        {
            let rangedAttackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === RANGED_ATTACK && bodyPart.hits > 0);
            netDamage += RANGED_ATTACK_POWER * rangedAttackParts.length;

            let attackParts = enemyCreep.body.filter(bodyPart => bodyPart.type === ATTACK && bodyPart.hits > 0);
            netDamage += ATTACK_POWER * attackParts.length;
        }

        return netDamage;
    },

    getGameState()
    {
        let enemyCreeps = getObjectsByPrototype(Creep).filter(creep => !creep.my);
        let mySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my);
        let enemySpawn = getObjectsByPrototype(StructureSpawn).filter(spawn => !spawn.my);

        let enemiesOnTopHalf = enemyCreeps.filter(creep => creep.y < 20);
        let enemiesOnBottomHalf = enemyCreeps.filter(creep => creep.y > 80);
        let enemiesPastMiddle = enemyCreeps.filter(creep => creep.x >= 50)

        console.log(`enemies - Top: ${enemiesOnTopHalf.length}, Bottom: ${enemiesOnBottomHalf.length}, Middle: ${enemiesPastMiddle.length},`);

        let info =
        {
            enemyCreeps,
            enemiesOnTopHalf,
            enemiesOnBottomHalf,
            enemiesPastMiddle
        }

        return info;
    }

}

