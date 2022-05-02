import { BodyPartConstant, HEAL, RANGED_ATTACK, MOVE, CARRY, DirectionConstant } from "game/constants";
import { Transporter } from "./roles/transporter";
import { MeleeAttacker } from "./roles/MeleeAttacker";
import { RangedAttacker } from "./roles/RangedAttacker";
import { Creep, RoomPosition } from "game/prototypes";

enum RoleEnum
{
    "TRANSPORTER",
    "MELEE_ATTACKER",
    "RANGED_ATTACKER",
    "HEALER"
};

export type RoleName = keyof typeof RoleEnum;

export interface ICreepRole
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
