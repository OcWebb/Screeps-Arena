import { DirectionConstant } from "game/constants";
import { Transporter } from "../arena_alpha_spawn_and_swamp/roles/transporter";
import { MeleeAttacker } from "../arena_alpha_spawn_and_swamp/roles/meleeAttacker";
import { RangedAttacker } from "../arena_alpha_spawn_and_swamp/roles/rangedAttacker";
import { Creep, RoomPosition, StructureSpawn } from "game/prototypes";

enum RoleEnum
{
    "TRANSPORTER",
    "MELEE_ATTACKER",
    "RANGED_ATTACKER",
    "HEALER"
};

export type RoleName = keyof typeof RoleEnum;

export interface IRoleCreep
{
    role: RoleName;
    // bodyPartRatio: BodyPartConstant[];
    squadId: number;
    creep: Creep;
    nextPosition: RoomPosition;
    run(): void;

    roleMoveTo(position: RoomPosition): void;
    roleMove(direction: DirectionConstant): void;
}

export type Role = Transporter | MeleeAttacker | RangedAttacker;

export type GameState =
{
    enemyCreeps: Creep[],
    enemiesOnTopHalf: Creep[],
    enemiesOnBottomHalf: Creep[],
    enemiesPastMiddle: Creep[],
    enemySpawn: StructureSpawn
}
