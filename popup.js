const browser = window.browser || window.chrome;

document.getElementById('openSettings').addEventListener('click', function() {
    browser.runtime.openOptionsPage();
});