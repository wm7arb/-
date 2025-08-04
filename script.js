window.addEventListener('DOMContentLoaded', () => {
  const tokens = window.api.readTokens();
  document.getElementById('tokensBox').value = tokens.join('\n');
});

function saveTokens() {
  const content = document.getElementById('tokensBox').value;
  window.api.saveTokens(content);
  alert('✅ تم حفظ التوكنات!');
}
