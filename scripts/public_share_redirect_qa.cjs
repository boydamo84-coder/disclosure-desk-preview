// QA adapter for the real metadata handler; it does not emulate a second
// set of production routes. Imported after the reviewed catalogue is built.
module.exports={load:()=>import('../netlify/functions/share-preview.mjs')};
