export function createClientId() {
  const key = "coderoom.editorClientId";
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const clientId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(key, clientId);
  return clientId;
}

export function createPatchFromChange(previousText, nextText, baseVersion, clientId) {
  if (previousText === nextText) {
    return null;
  }

  let prefixLength = 0;
  const shortestLength = Math.min(previousText.length, nextText.length);

  while (
    prefixLength < shortestLength &&
    previousText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1;
  }

  let previousSuffixIndex = previousText.length - 1;
  let nextSuffixIndex = nextText.length - 1;

  while (
    previousSuffixIndex >= prefixLength &&
    nextSuffixIndex >= prefixLength &&
    previousText[previousSuffixIndex] === nextText[nextSuffixIndex]
  ) {
    previousSuffixIndex -= 1;
    nextSuffixIndex -= 1;
  }

  return {
    clientId,
    baseVersion,
    position: prefixLength,
    deleteCount: previousSuffixIndex - prefixLength + 1,
    insertText: nextText.slice(prefixLength, nextSuffixIndex + 1),
  };
}

export function applyPatchToText(content, patch) {
  const position = Math.min(patch.position, content.length);
  const deleteEnd = Math.min(position + patch.deleteCount, content.length);

  return content.slice(0, position) + patch.insertText + content.slice(deleteEnd);
}
