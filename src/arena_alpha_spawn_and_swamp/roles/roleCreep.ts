import { IRoleCreep, RoleName } from "../../utils/types";
import { OK, DirectionConstant } from "game/constants";
import { Creep, RoomPosition } from "game/prototypes";
import { common } from "../../utils/common";
import { CreepStateMachine } from "../StateMachine/Creep/CreepStateMachine";
import { SharedCostMatrix } from "../SharedCostMatrix";

export class RoleCreep implements IRoleCreep
{
    role: RoleName;
    squadId: number;
    taskId: number;
    creep: Creep;
    nextPosition: RoomPosition;
    stateMachine: CreepStateMachine;
    dps: number = 0;
    hps: number = 0;

    constructor(creep: Creep, role: RoleName, taskId: number = 0 , squadId: number = -1)
    {
        this.creep = creep;
        this.role = role;
        this.squadId = squadId;
        this.taskId = taskId;
        this.nextPosition = { x: 0, y: 0 };
        this.stateMachine = new CreepStateMachine(this);
    }

    run()
    {
        this.dps = common.damageOutput([this.creep]);
        this.hps = common.healOutput([this.creep]);

        this.stateMachine.runState();
        SharedCostMatrix.set(this.creep.x, this.creep.y, 255);
    }

    roleMoveTo(position: RoomPosition)
    {
        let ret = this.creep.moveTo(position);

        if (ret == OK)
        {
            this.nextPosition = position;
            SharedCostMatrix.set(this.nextPosition.x, this.nextPosition.y, 255);
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
            SharedCostMatrix.set(this.nextPosition.x, this.nextPosition.y, 255);
        } else {
            SharedCostMatrix.set(this.creep.x, this.creep.y, 255);
        }

        return ret;
    }
}
