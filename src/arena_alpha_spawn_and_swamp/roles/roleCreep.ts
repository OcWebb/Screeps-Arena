import { IRoleCreep, RoleName } from "../../utils/types";
import { OK, DirectionConstant } from "game/constants";
import { Creep, RoomPosition } from "game/prototypes";
import { common } from "utils/common";

export class RoleCreep implements IRoleCreep
{
    role: RoleName;
    squadId: number;
    creep: Creep;
    nextPosition: RoomPosition;

    constructor(creep: Creep, role: RoleName, squadId: number = -1)
    {
        this.creep = creep;
        this.role = role;
        this.squadId = squadId;
        this.nextPosition = { x: 0, y: 0 };
    }

    run()
    {

    }

    roleMoveTo(position: RoomPosition)
    {
        let ret = this.creep.moveTo(position);

        if (ret == OK)
        {
            this.nextPosition = position;
        }

        return ret;
    }

    roleMove(direction: DirectionConstant)
    {
        if (!this.creep.exists) { return; }

        let ret = this.creep.move(direction);

        if (ret == OK)
        {
            this.nextPosition = common.getPositionFromDirection(this.creep, direction);
        }

        return ret;
    }
}
