

export interface IStateModel
{
    name: string;
    context: {};

    // returns true if the state is finished and must be popped
    run(): boolean;
}
