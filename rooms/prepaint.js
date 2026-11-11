(function () {
  try {
    var p = new URLSearchParams(location.search).get('theme') || localStorage.getItem('dev-mode');
    if (p !== 'light') document.documentElement.dataset.mode = 'dark';
    else delete document.documentElement.dataset.mode;
  } catch (e) {}
})();
