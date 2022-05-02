import { BOTTOM, BOTTOM_LEFT, BOTTOM_RIGHT, DirectionConstant, LEFT, RIGHT, TOP, TOP_LEFT, TOP_RIGHT } from "game/constants";
import { RoomPosition } from "game/prototypes";

export var utils =
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
    }
}
