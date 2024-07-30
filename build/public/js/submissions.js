document.addEventListener("DOMContentLoaded", async () => {
  await window.loadImages('/api/users/submissions', 'submissions');
});
