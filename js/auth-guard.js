/**
 * SUTU LMS - Authentication Guard
 * 
 * Include this as the FIRST script on every protected page.
 * It immediately redirects unauthenticated users to the login page
 * before the page has a chance to render at all.
 */
(function () {
  'use strict';

  var isLoggedIn = localStorage.getItem('isLoggedIn');

  if (!isLoggedIn || isLoggedIn !== 'true') {
    // Determine whether we are inside the /pages/ subdirectory
    var inPagesDir = window.location.pathname.indexOf('/pages/') !== -1;
    var loginUrl = inPagesDir ? 'login.html' : 'pages/login.html';
    window.location.replace(loginUrl);
  }

  /**
   * Admin-only guard â€” call this helper inside any page that should
   * only be accessible by Admin or Faculty roles.
   * 
   * Usage: call requireAdmin() at the top of your page's DOMContentLoaded.
   */
  window.requireAdmin = function () {
    var role = localStorage.getItem('userRole') || '';
    if (role !== 'Admin' && role !== 'Faculty') {
      var inPagesDir = window.location.pathname.indexOf('/pages/') !== -1;
      window.location.replace(inPagesDir ? 'dashboard.html' : 'pages/dashboard.html');
    }
  };
})();

