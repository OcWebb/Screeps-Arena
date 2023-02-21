import { StateMachine } from "./StateMachine";


export interface IState
{
    name: string;
    stateMachine: StateMachine;

    run(): void;
    seralize(): void;
}
