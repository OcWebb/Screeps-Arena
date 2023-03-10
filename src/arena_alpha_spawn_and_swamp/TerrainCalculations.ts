import { getObjectsByPrototype, getRange, getTerrainAt } from "game/utils";
import { ATTACK, ATTACK_POWER, RANGED_ATTACK, RANGED_ATTACK_POWER, TERRAIN_PLAIN, TERRAIN_SWAMP, TERRAIN_WALL } from "game/constants";
import { CostMatrix } from "game/path-finder";
import { ConstructionSite, Creep, RoomPosition, Structure } from "game/prototypes";
import { Visual } from "game/visual";

export class TerrainCalculations
{
    private static _chokePointsTop: { [x: number]: number[] };
    private static _chokePointsBottom: { x: number, y: RoomPosition[] };
    constructor()
    {
        if (!TerrainCalculations._chokePointsTop || !TerrainCalculations._chokePointsBottom)
        {
            TerrainCalculations.setChokePoints();
        }
    }

    static setChokePoints(): void
    {
        // top
        // path from spawn to spawn. Go up and down off path to mark points
        this._chokePointsTop = {};
        let curX = 13;
        while (curX++ < 86)
        {
            let validYSpots: number[] = [];
            let curY = 0;
            let foundEnd = false;
            while (curY++ < 18 && getTerrainAt({ x: curX, y: curY }) === TERRAIN_WALL){ }
            validYSpots.push(curY);
            while (curY++ < 18 && getTerrainAt({ x: curX, y: curY }) !== TERRAIN_WALL)
            {
                validYSpots.push(curY);
            }

            if (getTerrainAt({ x: curX, y: curY }) === TERRAIN_WALL)
            {
                TerrainCalculations._chokePointsTop[curX] = validYSpots;
            }
        }

    }

    // static set(x: number, y: number, weight: number)
    // {
    //     SharedCostMatrix._costMatrix.set(x, y, weight);
    // }

    // static getChokePointsTop(): [{ [x: number]: RoomPosition[] }]
    // {
    //     return TerrainCalculations._chokePointsTop;
    // }

    static show(): void
    {
        let visual = new Visual();

        for (let i in this._chokePointsTop)
        {
            let x = parseInt(i);
            let ys = this._chokePointsTop[i];
            let color = x % 2 == 0 ? "#0cff00" : "#0dc904";
            for(let y of ys)
            {
                visual.rect({ x: x-0.5, y: y-0.5 }, 1, 1, { opacity: 0.6, fill: color });
            }
        }
    }
}
