import { IState } from "./IState";


export class StateMachine
{
    stateQueue: IState[];
    currentState: IState | undefined;
    context: any = {};

    constructor()
    {
        this.stateQueue = [];
    }

    runState()
    {
        if (this.currentState)
        {
            this.currentState.run();
        }
    }

    logState()
    {
        if (this.stateQueue.length)
        {
            let str = "";
            for (var state of this.stateQueue)
            {
                str += `<-- State (${state.name}) `
            }
            console.log(str);
        }
    }

    pushState(state: IState)
    {
        this.stateQueue.unshift(state);
        this.currentState = state;
    }

    popState()
    {
        this.stateQueue.shift();

        if (this.stateQueue.length)
        {
            this.currentState = this.stateQueue[0];
        }
    }

    setContext(context: object)
    {
        this.context = context;
    }



}
