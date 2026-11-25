// A worker has no `window`, but React reports render errors through `window.dispatchEvent`; without
// this alias the report itself throws and hides the real error. Imported before anything else.
if (typeof window === 'undefined') Object.assign(globalThis, { window: globalThis })

export {}
