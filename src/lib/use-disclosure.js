import { useState } from "preact/hooks";

/*
  Progressive disclosure for a step's prompts.

  Pass one "has something in it" flag per prompt, in the order they appear.
  A prompt is visible once every prompt before it has content — the first is
  always visible, and "content" is deliberately loose, so one answer is enough
  to move on rather than a complete set.

  Every step that uses this must also render <ShowAll>, so nobody is held at a
  prompt they have nothing to say to.
*/
export function useDisclosure(filled = []) {
  const [forceAll, setForceAll] = useState(false);

  const visible = [];
  let unlocked = true;
  for (const hasContent of filled) {
    visible.push(forceAll || unlocked);
    unlocked = unlocked && Boolean(hasContent);
  }

  return {
    visible,
    allShown: visible.every(Boolean),
    showAll: () => setForceAll(true),
  };
}
