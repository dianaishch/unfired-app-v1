/* CARD-FILL · receipt: what was just written to the card, said by UNFIRED
   in a chat bubble ("Saved to card · Clay · Red earthenware"). There's no
   UNDO button -- you undo by saying so in the chat (isUndo). */
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export const savedText = (data, field, value) =>
  value === null ? fill(data.skipped, { field }) : fill(data.saved, { field, value });

export const undoneText = (data, field, value) =>
  value == null ? fill(data.undoneEmpty, { field }) : fill(data.undone, { field, value });

export const isUndo = (data, text) => new RegExp(`\\b(${data.undoWords})\\b`, 'i').test(text);
