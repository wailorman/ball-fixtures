declare module Chai
{
    export interface AssertStatic
    {
      isRejected(promise: PromiseLike<any>, message?: string): PromiseLike<void>;
      isRejected(promise: PromiseLike<any>, expected: any, message?: string): PromiseLike<void>;
      isRejected(promise: PromiseLike<any>, match: RegExp, message?: string): PromiseLike<void>;
    }
}
