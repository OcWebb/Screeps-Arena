import { Squad } from "arena_alpha_spawn_and_swamp/squads/squad";
import { StateMachine } from "./StateMachine";


export interface IState
{
    name: string;
    stateMachine: StateMachine;

    run(): void;
    seralize(): void;
}
