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
            for (var state of this.stateQueue)
            {
                // console.log(state.name)
                console.log(`  ${state.seralize()}`);
            }
            console.log("\n");
        }
        // console.log("empty")
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

    clearStates(): void
    {
        this.stateQueue = [];
    }

    setContext(context: object)
    {
        this.context = context;
    }
}
