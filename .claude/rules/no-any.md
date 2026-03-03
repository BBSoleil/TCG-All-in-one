Never use `any` type. Use `unknown` with type guards, or proper generics.
The only exception: third-party library types that require it, marked with:
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [reason]
