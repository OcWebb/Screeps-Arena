import { RESOURCE_ENERGY, BodyPartConstant } from "game/constants";
import { Creep, GameObject, StructureContainer, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype } from "game/utils"
import { Transporter } from "./roles/transporter";
import { SquadManager } from "./squads/SquadManager";
import { common } from "utils/common";

var squadManager: SquadManager = new SquadManager();

var containers: StructureContainer[];
var spawn: StructureSpawn
var enemySpawn: StructureSpawn;
var transporters: Transporter[] = [];

var startingEnergy = 8000;


export function loop()
{
    initMemory ();
    manageSpawning ();

    for (let creep of transporters)
    {
        creep.run();
    }

    squadManager.run();
}

function initMemory()
{
    if (!spawn)
    {
        spawn = getObjectsByPrototype(StructureSpawn).filter(s => s.my)[0];
    }

    if (!enemySpawn)
    {
        enemySpawn = getObjectsByPrototype(StructureSpawn).filter(s => !s.my)[0];
    }

    if (!containers)
    {
        containers = getObjectsByPrototype(StructureContainer);
    }
}

function manageSpawning()
{
    if (transporters.length < 1 && (spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 500)
    {
        let transporter = common.spawnRoleCreep("TRANSPORTER")
        if (transporter)
        {
            transporters.push(transporter as Transporter);
        }
    }
    else if ((spawn.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) >= 1000)
    {
        squadManager.manageSpawning();
    }
}
