/*
  The escape hatch for progressive disclosure. Someone with nothing to say to
  a prompt must still be able to reach the rest of the step.
*/
export default function ShowAll({ allShown, onShow, label = "Show all questions" }) {
  if (allShown) return null;
  return (
    <p class="show-all">
      <button type="button" class="linklike" onClick={onShow}>{label}</button>
    </p>
  );
}
